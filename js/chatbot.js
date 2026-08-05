/**
 * chatbot.js — 对话引擎主逻辑
 * 挂载：window.ChatBot（覆盖旧版）
 *
 * 依赖：window.Utils, window.Constants, window.Modules, window.DataStore,
 *       window.ChatbotTemplates, window.ChatbotClassifier,
 *       window.ChatbotProviders, window.ChatMarkdown
 *
 * ChatSession 对象：
 *   id, youthId, startTime, endTime, messages[], drafts[],
 *   moduleQuestionCounts{}, currentModule, completeness{}
 *
 * 会话持久化到 localStorage key: ai_dongwo_chat_sessions
 */
(function () {
  'use strict';

  var SESSIONS_KEY = 'ai_dongwo_chat_sessions';
  var T = window.ChatbotTemplates;
  var Classifier = window.ChatbotClassifier;
  var Provider = window.ChatbotProviders.TemplateProvider;
  var DataStore = window.DataStore;
  var Modules = window.Modules;

  /* ==========================================================
   * ChatSession 原型
   * ========================================================== */

  var ChatSessionProto = {

    /**
     * 发送用户消息，返回 AI 回复
     * @param {string} text - 用户输入文本
     * @returns {Object} { reply: string, draftsGenerated: Array }
     */
    sendMessage: function (text) {
      var self = this;

      // 1. 分类用户消息
      var classification = Classifier.classifyMessage(text);

      // 2. 添加用户消息
      self.messages.push({
        role: 'user',
        text: text,
        module: classification.module,
        timestamp: new Date().toISOString(),
        confidence: classification.confidence
      });

      // 3. 判断是否需要生成草稿
      var draftsGenerated = [];
      if (classification.module && classification.confidence >= 0.3) {
        // 统计该模块的用户消息数量
        var moduleUserMsgs = self.messages.filter(function (m) {
          return m.role === 'user' && m.module === classification.module;
        });

        // 该模块有用户消息且尚无草稿 → 生成草稿
        var existingDrafts = self.drafts.filter(function (d) {
          return d.module === classification.module && d.status !== 'discarded';
        });
        if (moduleUserMsgs.length >= 1 && existingDrafts.length === 0) {
          var newDraft = self.generateDraft(classification.module);
          if (newDraft) {
            draftsGenerated.push(newDraft);
          }
        }
      }

      // 4. 更新模块计数
      if (classification.module) {
        self.currentModule = classification.module;
      }
      self._incModuleCount(self.currentModule);

      // 5. 调用 provider 生成 AI 回复
      var youthProfile = self._getYouthProfile();
      var reply = Provider.generateReply(self.messages, youthProfile);

      // 6. 确定 AI 消息归属的模块（当前要问的模块）
      var aiModule = self._detectAIModule(reply, classification.module);

      // 计算问题索引（在该模块问题池中的位置）
      var qIndex = self._getQuestionIndex(aiModule);

      // 7. 添加 AI 消息
      self.messages.push({
        role: 'ai',
        text: reply,
        module: aiModule,
        timestamp: new Date().toISOString(),
        questionIndex: qIndex
      });

      self._incModuleCount(aiModule);

      // 8. 更新完整度
      self.getCompleteness();

      // 9. 持久化
      self._save();

      return {
        reply: reply,
        draftsGenerated: draftsGenerated
      };
    },

    /**
     * 生成一条草稿
     * @param {string} moduleKey - 模块名
     * @returns {Object|null} 草稿对象
     */
    generateDraft: function (moduleKey) {
      var self = this;

      var moduleUserMsgs = self.messages.filter(function (m) {
        return m.role === 'user' && m.module === moduleKey;
      });

      if (moduleUserMsgs.length === 0) return null;

      var name = (self._getYouthProfile().name) || '小雨';
      var draftData = Provider.generateDraft(moduleUserMsgs, moduleKey, name);

      var draft = {
        id: 'draft_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4),
        module: moduleKey,
        type: draftData.type,
        title: draftData.title,
        content: draftData.content,
        tags: draftData.tags || [],
        privacy: draftData.privacy || 'B',
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      self.drafts.push(draft);
      self._save();
      return draft;
    },

    /**
     * 确认草稿
     * @param {string} draftId - 草稿 ID
     */
    confirmDraft: function (draftId) {
      var draft = this._findDraft(draftId);
      if (!draft) return false;
      draft.status = 'confirmed';
      this._save();
      return true;
    },

    /**
     * 编辑草稿内容
     * @param {string} draftId - 草稿 ID
     * @param {Object} updates - 要更新的字段 {title, content, tags}
     */
    editDraft: function (draftId, updates) {
      var draft = this._findDraft(draftId);
      if (!draft) return false;
      if (updates.title !== undefined) draft.title = updates.title;
      if (updates.content !== undefined) draft.content = updates.content;
      if (updates.tags !== undefined) draft.tags = updates.tags;
      draft.updatedAt = new Date().toISOString();
      this._save();
      return true;
    },

    /**
     * 丢弃草稿
     * @param {string} draftId - 草稿 ID
     */
    discardDraft: function (draftId) {
      var draft = this._findDraft(draftId);
      if (!draft) return false;
      draft.status = 'discarded';
      this._save();
      return true;
    },

    /**
     * 将所有已确认的草稿写入 DataStore.records
     * @returns {Array} 已写入的记录数组
     */
    commitDrafts: function () {
      var self = this;
      var currentUser = DataStore.getCurrentUser();
      var committed = [];

      self.drafts.forEach(function (draft) {
        if (draft.status !== 'confirmed') return;

        var record = {
          type: draft.type,
          module: draft.module,
          author: currentUser ? currentUser.name : '未知用户',
          authorRole: currentUser ? currentUser.role : 'unknown',
          authorId: currentUser ? currentUser.id : '',
          authorAvatar: currentUser ? currentUser.avatar : '',
          date: window.getTodayString(),
          time: window.getNowTimeString(),
          content: draft.content,
          title: draft.title,
          tags: draft.tags || [],
          privacy: draft.privacy || 'B',
          source: 'ai_chat',
          sessionId: self.id
        };

        var saved = DataStore.addRecord(record);
        committed.push(saved);

        // 标记草稿为已提交
        draft.status = 'committed';
        draft.committedAt = new Date().toISOString();
      });

      if (committed.length > 0) {
        self.endTime = new Date().toISOString();
        self._save();
      }

      return committed;
    },

    /**
     * 计算四个模块的完整度百分比
     * @returns {Object} { communication: 0-100, emotion: 0-100, care: 0-100, work: 0-100 }
     */
    getCompleteness: function () {
      var self = this;
      var keys = ['communication', 'emotion', 'care', 'work'];
      var result = {};

      keys.forEach(function (key) {
        // 每个模块有无草稿 + 每条已确认草稿权重
        var drafts = self.drafts.filter(function (d) {
          return d.module === key && d.status !== 'discarded';
        });

        // 用户发言数量
        var userMsgs = self.messages.filter(function (m) {
          return m.role === 'user' && m.module === key;
        });

        // 基础完整度：有用户消息就给基础分，有草稿加分
        var base = 0;
        if (drafts.length > 0) {
          base = Math.min(40 + drafts.length * 20, 80);
        }
        var msgBonus = Math.min(userMsgs.length * 10, 20);
        result[key] = Math.min(base + msgBonus, 100);
      });

      self.completeness = result;
      return result;
    },

    /**
     * 结束会话
     */
    endSession: function () {
      this.endTime = new Date().toISOString();
      this._save();
    },

    // ==========================================================
    // 内部辅助方法
    // ==========================================================

    _findDraft: function (draftId) {
      return this.drafts.find(function (d) { return d.id === draftId; }) || null;
    },

    _incModuleCount: function (moduleKey) {
      if (!moduleKey) return;
      if (!this.moduleQuestionCounts) {
        this.moduleQuestionCounts = { communication: 0, emotion: 0, care: 0, work: 0 };
      }
      this.moduleQuestionCounts[moduleKey] = (this.moduleQuestionCounts[moduleKey] || 0) + 1;
    },

    _getYouthProfile: function () {
      // 从 DataStore 或默认值获取心青年信息
      var users = DataStore.getAllUsers ? DataStore.getAllUsers() : [];
      var youth = users.find(function (u) { return u.role === 'youth'; });
      if (!youth) {
        // 回退：从 Constants 获取
        var basicInfo = window.Constants.basicInfo;
        return { name: basicInfo.name, age: basicInfo.age, gender: basicInfo.gender, intro: basicInfo.intro };
      }
      return youth;
    },

    _detectAIModule: function (reply, fallbackModule) {
      // 从 AI 回复中提取模块信息（通过问题内容判断）
      var keys = ['communication', 'emotion', 'care', 'work'];
      for (var i = 0; i < keys.length; i++) {
        var pool = T.QUESTIONS[keys[i]] || [];
        for (var j = 0; j < pool.length; j++) {
          var q = pool[j].replace(/\{name\}/g, '');
          // 去掉占位符后比较前10个字
          if (q.length > 10 && reply.indexOf(q.substr(0, 10)) !== -1) {
            return keys[i];
          }
        }
      }
      return fallbackModule;
    },

    _getQuestionIndex: function (moduleKey) {
      if (!moduleKey) return null;
      var pool = T.QUESTIONS[moduleKey] || [];
      var asked = [];
      this.messages.forEach(function (m) {
        if (m.role === 'ai' && m.module === moduleKey && m.questionIndex !== undefined && m.questionIndex !== null) {
          asked.push(m.questionIndex);
        }
      });

      // 找第一个没问过的
      for (var i = 0; i < pool.length; i++) {
        if (asked.indexOf(i) === -1) return i;
      }
      return Math.floor(Math.random() * pool.length);
    },

    /**
     * 保存会话到 localStorage
     */
    _save: function () {
      var sessions = ChatBot._loadAllSessions();
      var idx = sessions.findIndex(function (s) { return s.id === this.id; }.bind(this));
      if (idx !== -1) {
        sessions[idx] = this._serialize();
      } else {
        sessions.push(this._serialize());
      }
      this._persistSessions(sessions);
    },

    /**
     * 序列化为可存储对象
     */
    _serialize: function () {
      return {
        id: this.id,
        youthId: this.youthId,
        startTime: this.startTime,
        endTime: this.endTime || null,
        messages: this.messages,
        drafts: this.drafts,
        moduleQuestionCounts: this.moduleQuestionCounts,
        currentModule: this.currentModule,
        completeness: this.completeness
      };
    },

    _persistSessions: function (sessions) {
      try {
        localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
      } catch (e) {
        console.error('保存会话失败:', e);
      }
    }
  };

  /* ==========================================================
   * ChatBot 管理 API
   * ========================================================== */

  var ChatBot = {

    /**
     * 创建新会话
     * @param {string} youthId - 心青年用户 ID
     * @returns {Object} ChatSession 对象
     */
    createSession: function (youthId) {
      var session = Object.create(ChatSessionProto);

      session.id = 'chat_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 6);
      session.youthId = youthId || '';
      session.startTime = new Date().toISOString();
      session.endTime = null;
      session.messages = [];
      session.drafts = [];
      session.moduleQuestionCounts = { communication: 0, emotion: 0, care: 0, work: 0 };
      session.currentModule = null;
      session.completeness = { communication: 0, emotion: 0, care: 0, work: 0 };

      session._save();
      return session;
    },

    /**
     * 加载指定会话
     * @param {string} sessionId - 会话 ID
     * @returns {Object|null} ChatSession 对象
     */
    loadSession: function (sessionId) {
      var sessions = ChatBot._loadAllSessions();
      var data = sessions.find(function (s) { return s.id === sessionId; });

      if (!data) return null;

      var session = Object.create(ChatSessionProto);

      session.id = data.id;
      session.youthId = data.youthId || '';
      session.startTime = data.startTime;
      session.endTime = data.endTime || null;
      session.messages = data.messages || [];
      session.drafts = data.drafts || [];
      session.moduleQuestionCounts = data.moduleQuestionCounts || { communication: 0, emotion: 0, care: 0, work: 0 };
      session.currentModule = data.currentModule || null;
      session.completeness = data.completeness || { communication: 0, emotion: 0, care: 0, work: 0 };

      return session;
    },

    /**
     * 列出所有会话
     * @returns {Array} 会话摘要数组
     */
    listSessions: function () {
      var sessions = ChatBot._loadAllSessions();
      return sessions.map(function (s) {
        return {
          id: s.id,
          youthId: s.youthId,
          startTime: s.startTime,
          endTime: s.endTime,
          messageCount: (s.messages || []).length,
          draftCount: (s.drafts || []).length,
          completeness: s.completeness || {}
        };
      });
    },

    /**
     * 删除会话
     * @param {string} sessionId - 会话 ID
     */
    deleteSession: function (sessionId) {
      var sessions = ChatBot._loadAllSessions();
      sessions = sessions.filter(function (s) { return s.id !== sessionId; });
      try {
        localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
      } catch (e) {
        console.error('删除会话失败:', e);
      }
    },

    /**
     * 获取持久化的模块完整度（跨会话）
     * @param {string} youthId - 心青年 ID
     * @returns {Object} { communication: 0-100, emotion: 0-100, care: 0-100, work: 0-100 }
     */
    getProfileCompleteness: function (youthId) {
      var sessions = ChatBot._loadAllSessions();
      var youthSessions = sessions.filter(function (s) { return s.youthId === youthId; });

      var keys = ['communication', 'emotion', 'care', 'work'];
      var result = { communication: 0, emotion: 0, care: 0, work: 0 };

      youthSessions.forEach(function (s) {
        keys.forEach(function (key) {
          var drafts = (s.drafts || []).filter(function (d) {
            return d.module === key && (d.status === 'confirmed' || d.status === 'committed');
          });
          result[key] = Math.min(result[key] + drafts.length * 25, 100);
        });
      });

      return result;
    },

    /**
     * 清空所有会话数据（调试用）
     */
    clearAll: function () {
      localStorage.removeItem(SESSIONS_KEY);
    },

    // ==========================================================
    // 内部方法
    // ==========================================================

    _loadAllSessions: function () {
      try {
        var raw = localStorage.getItem(SESSIONS_KEY);
        if (!raw) return [];
        return JSON.parse(raw);
      } catch (e) {
        console.error('加载会话列表失败:', e);
        return [];
      }
    }

  };

  window.ChatBot = ChatBot;

})();
