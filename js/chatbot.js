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

  // ==========================================================
  // 当前活跃会话（UI 绑定的那个）
  // ==========================================================
  var _activeSession = null;

  // ==========================================================
  // UI 方法 — 对话采集页面
  // ==========================================================

  /**
   * 渲染对话采集页面（路由 #collect 触发）
   */
  ChatBot.renderCollectPage = function () {
    var container = document.getElementById('collect-content');
    if (!container) return;

    // 已有聊天内容就不重建
    if (container.querySelector('.chat-ui-ready')) return;

    // 保留原始 HTML 中的 chat-layout 结构，仅在内部注入动态内容
    var layout = container.querySelector('.chat-layout');
    if (!layout) return;

    layout.classList.add('chat-ui-ready');

    var messagesEl = document.getElementById('chat-messages');
    var optionsArea = document.getElementById('chat-options-area');

    // 构建消息列表 + 输入区
    if (messagesEl) {
      messagesEl.innerHTML = '';
      messagesEl.id = 'chat-messages';
    }

    if (optionsArea) {
      optionsArea.innerHTML = '';
      optionsArea.id = 'chat-options-area';
    }

    // 创建新会话并开始欢迎语
    var youthId = _getYouthId();
    _activeSession = ChatBot.createSession(youthId);

    // 渲染欢迎消息
    _renderWelcome();

    // 构建输入区域
    _buildInputArea(optionsArea);

    // 渲染右侧归类面板
    _renderCategorizePanel();
  };

  /**
   * 导航到对话采集页面（按钮点击触发）
   */
  ChatBot.navigateToCollect = function () {
    window.location.hash = 'collect';
  };

  // ==========================================================
  // UI 内部渲染函数
  // ==========================================================

  /**
   * 渲染欢迎消息
   */
  function _renderWelcome() {
    var session = _activeSession;
    if (!session) return;

    var youthProfile = session._getYouthProfile();
    var name = youthProfile.name || '小雨';
    var reply = Provider.generateReply([], youthProfile);

    // 添加欢迎消息到会话
    session.messages.push({
      role: 'ai',
      text: reply,
      module: null,
      timestamp: new Date().toISOString(),
      questionIndex: null
    });
    session._save();

    // 渲染到界面
    _addBubble('ai', reply, null);
  }

  /**
   * 构建输入区域
   */
  function _buildInputArea(container) {
    if (!container) return;

    container.innerHTML = '';
    container.style.display = 'flex';
    container.style.padding = '12px';
    container.style.borderTop = '1px solid rgba(255,255,255,0.06)';
    container.style.gap = '8px';

    var input = document.createElement('input');
    input.type = 'text';
    input.id = 'chat-text-input';
    input.placeholder = '输入你想记录的内容...';
    input.style.cssText = 'flex:1;padding:10px 14px;border-radius:12px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.05);color:#EDEDEF;font-size:0.9rem;outline:none;';
    container.appendChild(input);

    var sendBtn = document.createElement('button');
    sendBtn.textContent = '发送';
    sendBtn.style.cssText = 'padding:10px 20px;border-radius:12px;border:none;background:#5E6AD2;color:#fff;font-size:0.9rem;font-weight:600;cursor:pointer;';
    container.appendChild(sendBtn);

    // 回车发送
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && input.value.trim()) {
        e.preventDefault();
        _handleSend(input.value.trim());
        input.value = '';
      }
    });

    sendBtn.addEventListener('click', function () {
      if (input.value.trim()) {
        _handleSend(input.value.trim());
        input.value = '';
      }
    });
  }

  // 归类记录（UI侧），每次会话重建
  var _classifications = [];

  /**
   * 处理发送消息
   */
  function _handleSend(text) {
    var session = _activeSession;
    if (!session) return;

    var input = document.getElementById('chat-text-input');
    var sendBtn = input ? input.nextElementSibling : null;

    // 禁用输入
    if (input) input.disabled = true;
    if (sendBtn) sendBtn.disabled = true;
    if (sendBtn) sendBtn.textContent = '...';

    // 添加用户气泡
    var classification = Classifier.classifyMessage(text);
    _addBubble('user', text, classification.module);

    // 实时归纳：立即展示归类结果
    _classifications.push({
      text: text,
      module: classification.module,
      confidence: classification.confidence,
      keywords: classification.matchedKeywords
    });
    _renderCategorizePanel();

    // 调用引擎
    var result = session.sendMessage(text);

    // 短暂延迟模拟 AI 思考
    setTimeout(function () {
      // 添加 AI 回复气泡
      var lastAiMsg = session.messages[session.messages.length - 1];
      _addBubble('ai', result.reply, lastAiMsg ? lastAiMsg.module : null);

      // 更新草稿面板（含分类 + 草稿）
      _renderCategorizePanel();

      // 恢复输入
      if (input) input.disabled = false;
      if (sendBtn) { sendBtn.disabled = false; sendBtn.textContent = '发送'; }
      input.focus();

      // 判断是否对话结束
      _checkConversationEnd(result.reply);
    }, 600);
  }

  /**
   * 添加消息气泡
   */
  function _addBubble(role, text, moduleKey) {
    var messagesEl = document.getElementById('chat-messages');
    if (!messagesEl) return;

    var bubble = document.createElement('div');
    bubble.className = 'chat-bubble ' + role;

    // 模块标签
    if (moduleKey && Modules[moduleKey]) {
      var badge = document.createElement('span');
      badge.style.cssText = 'display:inline-block;font-size:0.7rem;padding:1px 8px;border-radius:10px;margin-right:6px;color:#fff;background:' + Modules[moduleKey].color + ';opacity:0.8;';
      badge.textContent = Modules[moduleKey].label;
      bubble.appendChild(badge);
    }

    // 渲染 markdown
    var isMarkdown = text.indexOf('**') !== -1 || text.indexOf('\n') !== -1;
    if (isMarkdown && typeof window.ChatMarkdown !== 'undefined') {
      bubble.innerHTML += role === 'ai'
        ? '🤖 ' + window.ChatMarkdown.render(text)
        : '👤 ' + window.Utils.string.escapeHtml(text);
    } else {
      var prefix = role === 'ai' ? '🤖 ' : '👤 ';
      bubble.innerHTML += prefix + window.Utils.string.escapeHtml(text).replace(/\n/g, '<br>');
    }

    messagesEl.appendChild(bubble);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  /**
   * 渲染右侧面板：实时归类 + 草稿列表
   */
  function _renderCategorizePanel() {
    var panel = document.getElementById('categorize-list');
    if (!panel) return;

    var session = _activeSession;
    if (!session) return;

    panel.innerHTML = '';

    // ---- 第一部分：实时归类 ----
    var classSection = document.createElement('div');
    classSection.style.cssText = 'margin-bottom:16px;padding-bottom:12px;border-bottom:1px solid rgba(255,255,255,0.06);';

    var classTitle = document.createElement('div');
    classTitle.style.cssText = 'font-size:0.75rem;color:#8A8F98;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px;';
    classTitle.textContent = '实时归类';
    classSection.appendChild(classTitle);

    if (_classifications.length === 0) {
      var emptyHint = document.createElement('div');
      emptyHint.style.cssText = 'font-size:0.78rem;color:rgba(255,255,255,0.4);text-align:center;padding:8px 0;';
      emptyHint.textContent = '发送第一条消息后开始归纳';
      classSection.appendChild(emptyHint);
    } else {
      _classifications.forEach(function (item, idx) {
        var entry = document.createElement('div');
        entry.style.cssText = 'display:flex;align-items:flex-start;gap:8px;padding:6px 0;font-size:0.78rem;';

        // 序号
        var numSpan = document.createElement('span');
        numSpan.style.cssText = 'color:rgba(255,255,255,0.3);min-width:16px;text-align:center;flex-shrink:0;';
        numSpan.textContent = (idx + 1);
        entry.appendChild(numSpan);

        // 模块标签
        if (item.module && Modules[item.module]) {
          var tag = document.createElement('span');
          tag.style.cssText = 'display:inline-block;font-size:0.65rem;padding:1px 6px;border-radius:6px;color:#fff;flex-shrink:0;';
          tag.style.background = Modules[item.module].color;
          tag.textContent = Modules[item.module].icon + ' ' + Modules[item.module].label;
          entry.appendChild(tag);
        } else {
          var noTag = document.createElement('span');
          noTag.style.cssText = 'display:inline-block;font-size:0.65rem;padding:1px 6px;border-radius:6px;background:rgba(255,255,255,0.08);color:rgba(255,255,255,0.4);flex-shrink:0;';
          noTag.textContent = '未归类';
          entry.appendChild(noTag);
        }

        // 文本预览
        var textSpan = document.createElement('span');
        textSpan.style.cssText = 'color:rgba(255,255,255,0.55);line-height:1.3;flex:1;word-break:break-all;';
        textSpan.textContent = item.text.length > 30 ? item.text.substr(0, 30) + '…' : item.text;
        entry.appendChild(textSpan);

        classSection.appendChild(entry);
      });
    }
    panel.appendChild(classSection);

    // ---- 第二部分：归纳统计 ----
    var statsSection = document.createElement('div');
    statsSection.style.cssText = 'margin-bottom:16px;padding-bottom:12px;border-bottom:1px solid rgba(255,255,255,0.06);';

    var statsTitle = document.createElement('div');
    statsTitle.style.cssText = 'font-size:0.75rem;color:#8A8F98;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px;';
    statsTitle.textContent = '模块覆盖';
    statsSection.appendChild(statsTitle);

    var keys = ['communication', 'emotion', 'care', 'work'];
    var statsRow = document.createElement('div');
    statsRow.style.cssText = 'display:flex;gap:6px;flex-wrap:wrap;';

    keys.forEach(function (key) {
      var count = _classifications.filter(function (c) { return c.module === key; }).length;
      var mod = Modules[key];
      var badge = document.createElement('span');
      badge.style.cssText = 'display:inline-flex;align-items:center;gap:3px;font-size:0.7rem;padding:3px 8px;border-radius:8px;';
      if (count > 0) {
        badge.style.background = mod.color;
        badge.style.color = '#fff';
        badge.style.opacity = '0.8';
      } else {
        badge.style.background = 'rgba(255,255,255,0.05)';
        badge.style.color = 'rgba(255,255,255,0.3)';
      }
      badge.textContent = mod.icon + ' ' + mod.label + ' ×' + count;
      statsRow.appendChild(badge);
    });
    statsSection.appendChild(statsRow);
    panel.appendChild(statsSection);

    // ---- 第三部分：草稿记录 ----
    var drafts = session.drafts.filter(function (d) { return d.status !== 'discarded'; });

    var draftSection = document.createElement('div');

    var draftTitle = document.createElement('div');
    draftTitle.style.cssText = 'font-size:0.75rem;color:#8A8F98;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px;';
    draftTitle.textContent = '草稿记录 (' + drafts.length + ')';
    draftSection.appendChild(draftTitle);

    if (drafts.length === 0) {
      var noDraft = document.createElement('div');
      noDraft.style.cssText = 'font-size:0.78rem;color:rgba(255,255,255,0.4);text-align:center;padding:8px 0;';
      noDraft.textContent = '积累信息后将自动生成草稿';
      draftSection.appendChild(noDraft);
    } else {
      drafts.forEach(function (draft) {
        var card = _buildDraftCard(draft);
        draftSection.appendChild(card);
      });

      // 提交按钮
      var confirmedCount = drafts.filter(function (d) { return d.status === 'confirmed'; }).length;
      if (confirmedCount > 0) {
        var commitBtn = document.createElement('button');
        commitBtn.textContent = '提交 ' + confirmedCount + ' 条记录到档案';
        commitBtn.style.cssText = 'width:100%;padding:12px;margin-top:12px;border-radius:12px;border:none;background:#52C41A;color:#fff;font-size:0.9rem;font-weight:600;cursor:pointer;';
        commitBtn.addEventListener('click', function () {
          session.commitDrafts();
          _renderCategorizePanel();
          window.showToast('已提交到支持档案！');
        });
        draftSection.appendChild(commitBtn);
      }
    }
    panel.appendChild(draftSection);
  }

  /**
   * 构建单条草稿卡片
   */
  function _buildDraftCard(draft) {
    var mod = Modules[draft.module];
    var color = mod ? mod.color : '#999';
    var icon = mod ? mod.icon : '📝';

    var card = document.createElement('div');
    card.style.cssText = 'background:rgba(255,255,255,0.05);border-radius:12px;padding:12px;margin-bottom:10px;border:1px solid rgba(255,255,255,0.06);';
    card.id = 'draft-' + draft.id;

    // 标题行
    var header = document.createElement('div');
    header.style.cssText = 'display:flex;align-items:center;gap:6px;margin-bottom:6px;';

    var iconSpan = document.createElement('span');
    iconSpan.textContent = icon;
    header.appendChild(iconSpan);

    var titleSpan = document.createElement('span');
    titleSpan.style.cssText = 'font-weight:600;font-size:0.85rem;color:#EDEDEF;';
    titleSpan.textContent = draft.title;
    if (draft.status === 'confirmed') {
      titleSpan.textContent += ' ✓';
      titleSpan.style.color = '#52C41A';
    }
    header.appendChild(titleSpan);

    var badgeSpan = document.createElement('span');
    badgeSpan.style.cssText = 'font-size:0.65rem;padding:1px 6px;border-radius:8px;color:#fff;background:' + color + ';margin-left:auto;';
    badgeSpan.textContent = draft.status === 'confirmed' ? '已确认' : draft.status === 'committed' ? '已提交' : '待确认';
    header.appendChild(badgeSpan);

    card.appendChild(header);

    // 内容预览
    var contentDiv = document.createElement('div');
    contentDiv.style.cssText = 'font-size:0.78rem;color:#8A8F98;margin-bottom:8px;line-height:1.4;';
    contentDiv.textContent = draft.content.length > 80 ? draft.content.substr(0, 80) + '...' : draft.content;
    card.appendChild(contentDiv);

    // 操作按钮
    var actions = document.createElement('div');
    actions.style.cssText = 'display:flex;gap:6px;';

    if (draft.status === 'pending') {
      var confirmBtn = _makeSmallBtn('✓ 确认', '#52C41A', function () {
        _activeSession.confirmDraft(draft.id);
        _renderCategorizePanel();
      });
      actions.appendChild(confirmBtn);

      var editBtn = _makeSmallBtn('编辑', '#FAAD14', function () {
        _showDraftEditDialog(draft);
      });
      actions.appendChild(editBtn);

      var discardBtn = _makeSmallBtn('丢弃', '#F5222D', function () {
        _activeSession.discardDraft(draft.id);
        _renderCategorizePanel();
      });
      actions.appendChild(discardBtn);
    }

    if (draft.status === 'committed') {
      actions.innerHTML = '<span style="font-size:0.75rem;color:#52C41A;">已提交到档案</span>';
    }

    card.appendChild(actions);
    return card;
  }

  function _makeSmallBtn(text, color, handler) {
    var btn = document.createElement('button');
    btn.textContent = text;
    btn.style.cssText = 'padding:4px 10px;border-radius:8px;border:1px solid ' + color + ';background:transparent;color:' + color + ';font-size:0.72rem;cursor:pointer;';
    btn.addEventListener('click', handler);
    return btn;
  }

  /**
   * 弹出草稿编辑对话框
   */
  function _showDraftEditDialog(draft) {
    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.6);z-index:9999;display:flex;align-items:center;justify-content:center;';
    overlay.id = 'draft-edit-overlay';

    var dialog = document.createElement('div');
    dialog.style.cssText = 'background:#0a0a0c;border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:20px;max-width:400px;width:90%;max-height:80vh;overflow-y:auto;';

    dialog.innerHTML = '<div style="font-weight:600;font-size:1rem;color:#EDEDEF;margin-bottom:12px;">编辑草稿</div>'
      + '<label style="font-size:0.78rem;color:#8A8F98;">标题</label>'
      + '<input id="draft-edit-title" value="' + window.Utils.string.escapeHtml(draft.title) + '" style="width:100%;padding:8px;margin:6px 0 12px;border-radius:8px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.05);color:#EDEDEF;font-size:0.85rem;">'
      + '<label style="font-size:0.78rem;color:#8A8F98;">内容</label>'
      + '<textarea id="draft-edit-content" rows="4" style="width:100%;padding:8px;margin:6px 0 12px;border-radius:8px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.05);color:#EDEDEF;font-size:0.85rem;resize:vertical;">' + window.Utils.string.escapeHtml(draft.content) + '</textarea>'
      + '<div style="display:flex;gap:8px;justify-content:flex-end;">'
      + '<button id="draft-edit-cancel" style="padding:8px 16px;border-radius:8px;border:1px solid rgba(255,255,255,0.1);background:transparent;color:#8A8F98;cursor:pointer;">取消</button>'
      + '<button id="draft-edit-save" style="padding:8px 16px;border-radius:8px;border:none;background:#5E6AD2;color:#fff;cursor:pointer;">保存</button>'
      + '</div>';

    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    document.getElementById('draft-edit-cancel').addEventListener('click', function () {
      document.body.removeChild(overlay);
    });

    document.getElementById('draft-edit-save').addEventListener('click', function () {
      var newTitle = document.getElementById('draft-edit-title').value.trim();
      var newContent = document.getElementById('draft-edit-content').value.trim();
      _activeSession.editDraft(draft.id, { title: newTitle, content: newContent });
      _renderCategorizePanel();
      document.body.removeChild(overlay);
    });

    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) document.body.removeChild(overlay);
    });
  }

  /**
   * 检查对话是否结束
   */
  function _checkConversationEnd(reply) {
    if (!_activeSession) return;
    // 当总问题数超过上限时，自动关闭对话
    if (_activeSession.moduleQuestionCounts) {
      var total = 0;
      var counts = _activeSession.moduleQuestionCounts;
      for (var k in counts) { total += counts[k]; }
      // 问题数 >= MAX_TOTAL_QUESTIONS 时提示
      if (total >= T.MAX_TOTAL_QUESTIONS) {
        var input = document.getElementById('chat-text-input');
        var sendBtn = input ? input.nextElementSibling : null;
        if (input) input.disabled = true;
        if (sendBtn) sendBtn.disabled = true;

        var notice = document.createElement('div');
        notice.style.cssText = 'text-align:center;padding:12px;color:#8A8F98;font-size:0.85rem;margin-top:8px;';
        notice.innerHTML = '对话已完成。请在右侧确认草稿后提交到档案 📋';
        var optionsArea = document.getElementById('chat-options-area');
        if (optionsArea) {
          var inputArea = optionsArea.querySelector('input');
          if (inputArea) {
            inputArea.style.display = 'none';
            inputArea.nextElementSibling.style.display = 'none';
          }
          optionsArea.appendChild(notice);
        }
      }
    }
  }

  /**
   * 获取心青年用户 ID
   */
  function _getYouthId() {
    var users = DataStore.getAllUsers ? DataStore.getAllUsers() : [];
    var youth = users.find(function (u) { return u.role === 'youth'; });
    return youth ? youth.id : 'u_sample_youth';
  }

  window.ChatBot = ChatBot;

})();
