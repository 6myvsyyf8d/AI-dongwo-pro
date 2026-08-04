/**
 * chatbot-providers.js — AI 适配层
 * 挂载：window.ChatbotProviders
 * TemplateProvider：用模板匹配模拟 AI 回复，不接外部 API
 */
(function () {
  'use strict';

  var T = window.ChatbotTemplates;
  var Classifier = window.ChatbotClassifier;

  /* ==========================================================
   * TemplateProvider — 模板匹配 AI
   * ========================================================== */

  var TemplateProvider = {

    /**
     * 生成 AI 回复
     * @param {Array} messages - 当前会话消息数组 [{role:'ai'|'user', text, module?}]
     * @param {Object} youthProfile - 心青年档案 {name, age, gender, intro}
     * @returns {string} AI 回复文本
     */
    generateReply: function (messages, youthProfile) {
      var name = (youthProfile && youthProfile.name) || '小雨';
      var sessionCtx = this._buildContext(messages, name);
      var userMsgs = messages.filter(function (m) { return m.role === 'user'; });
      var aiMsgs = messages.filter(function (m) { return m.role === 'ai'; });

      // 如果是第一条消息（没有用户发言），返回欢迎语
      if (userMsgs.length === 0) {
        return T.WELCOME.map(function (line) {
          return line.replace(/\{name\}/g, name);
        }).join('\n\n');
      }

      // 如果已经问够了，返回结束语
      if (sessionCtx.totalQuestions >= T.MAX_TOTAL_QUESTIONS) {
        return T.CLOSING.map(function (line) {
          return line.replace(/\{name\}/g, name);
        }).join('\n\n');
      }

      // 分析上一条用户消息
      var lastUserMsg = userMsgs[userMsgs.length - 1];
      var lastUserText = lastUserMsg ? lastUserMsg.text : '';
      var classification = Classifier.classifyMessage(lastUserText);

      // 决定下一个要询问的模块
      var nextModule = this._pickNextModule(sessionCtx, classification.module);
      var reply = '';

      // 如果上一个模块覆盖够了，需要换模块 → 加过渡语
      if (classification.module &&
          sessionCtx.moduleCounts[classification.module] >= T.MIN_QUESTIONS_PER_MODULE &&
          nextModule !== classification.module &&
          sessionCtx.lastModule !== null &&
          sessionCtx.lastModule !== nextModule) {
        reply += this._pickTransition() + '\n\n';
      }

      // 如果是短回复 → 追问
      if (lastUserText.length < T.SHORT_REPLY_THRESHOLD && sessionCtx.lastModule) {
        var followUp = this._pickFollowUp(lastUserText, name);
        if (followUp) {
          reply += followUp;
          return reply;
        }
      }

      // 正常提问
      var question = this._pickQuestion(nextModule, name, sessionCtx);
      reply += question;

      return reply;
    },

    /**
     * 根据收集的消息生成草稿记录
     * @param {Array} messages - 该模块相关的消息
     * @param {string} moduleKey - 模块名
     * @param {string} name - 心青年名称
     * @returns {Object} 草稿对象 {module, type, title, content, tags, privacy}
     */
    generateDraft: function (messages, moduleKey, name) {
      name = name || '小雨';
      var draftCfg = T.DRAFT_TYPES[moduleKey] || { type: 'note', titleTemplate: '对话采集' };
      var moduleInfo = window.Modules[moduleKey];

      // 聚合用户回复内容
      var userTexts = messages
        .filter(function (m) { return m.role === 'user'; })
        .map(function (m) { return m.text; });

      var content = userTexts.join('；');

      if (!content) {
        content = '（AI 采集：信息待补充）';
      }

      // 提取标签
      var tags = [];
      var allText = userTexts.join(' ');
      var pool = (window.Constants.MODULE_TAGS[moduleKey] || []);
      pool.forEach(function (tag) {
        if (allText.indexOf(tag) !== -1 && tags.length < 3) {
          tags.push(tag);
        }
      });

      return {
        module: moduleKey,
        type: draftCfg.type,
        title: draftCfg.titleTemplate,
        content: content,
        tags: tags,
        privacy: 'B',
        source: 'ai_chat'
      };
    },

    // ==========================================================
    // 内部方法
    // ==========================================================

    /**
     * 构建会话上下文
     */
    _buildContext: function (messages, name) {
      var ctx = {
        name: name,
        totalQuestions: 0,
        lastModule: null,
        moduleCounts: { communication: 0, emotion: 0, care: 0, work: 0 },
        askedQuestions: { communication: [], emotion: [], care: [], work: [] }
      };

      messages.forEach(function (msg) {
        if (msg.role === 'ai') {
          ctx.totalQuestions++;
          if (msg.module) {
            ctx.lastModule = msg.module;
            ctx.moduleCounts[msg.module] = (ctx.moduleCounts[msg.module] || 0) + 1;
          }
        }
      });

      // 从 ai 消息中提取已经问过的问题索引
      var aiMsgs = messages.filter(function (m) { return m.role === 'ai' && m.module; });
      aiMsgs.forEach(function (m) {
        if (m.questionIndex !== undefined) {
          if (!ctx.askedQuestions[m.module]) ctx.askedQuestions[m.module] = [];
          ctx.askedQuestions[m.module].push(m.questionIndex);
        }
      });

      return ctx;
    },

    /**
     * 选择下一个要询问的模块
     */
    _pickNextModule: function (ctx, currentModule) {
      var order = ['communication', 'emotion', 'care', 'work'];

      // 如果当前模块还没问够，继续
      if (currentModule && ctx.moduleCounts[currentModule] < T.MIN_QUESTIONS_PER_MODULE) {
        return currentModule;
      }

      // 找第一个没问够的模块
      for (var i = 0; i < order.length; i++) {
        if (ctx.moduleCounts[order[i]] < T.MIN_QUESTIONS_PER_MODULE) {
          return order[i];
        }
      }

      // 都问够了，轮询
      var minMod = order[0];
      var minCount = ctx.moduleCounts[order[0]];
      for (var j = 1; j < order.length; j++) {
        if (ctx.moduleCounts[order[j]] < minCount) {
          minCount = ctx.moduleCounts[order[j]];
          minMod = order[j];
        }
      }
      return minMod;
    },

    /**
     * 从模块问题池中选取一条未问过的问题
     */
    _pickQuestion: function (moduleKey, name, ctx) {
      var pool = T.QUESTIONS[moduleKey];
      if (!pool || pool.length === 0) {
        return '最近' + name + '还有什么想补充的吗？';
      }

      var asked = ctx.askedQuestions[moduleKey] || [];

      // 优先选没问过的
      for (var i = 0; i < pool.length; i++) {
        if (asked.indexOf(i) === -1) {
          return pool[i].replace(/\{name\}/g, name);
        }
      }

      // 都问过了，随机选一条
      var idx = Math.floor(Math.random() * pool.length);
      return pool[idx].replace(/\{name\}/g, name);
    },

    /**
     * 选取追问
     */
    _pickFollowUp: function (text, name) {
      var lower = text;

      // 包含情绪关键词 → 情绪追问
      var emotionWords = ['情绪', '焦虑', '生气', '难过', '开心', '兴奋', '不安', '紧张', '害怕'];
      for (var i = 0; i < emotionWords.length; i++) {
        if (lower.indexOf(emotionWords[i]) !== -1) {
          return this._randomPick(T.FOLLOW_UPS.emotion_mentioned).replace(/\{name\}/g, name);
        }
      }

      // 包含时间/地点关键词 → 事件追问
      var eventWords = ['今天', '昨天', '早上', '下午', '晚上', '在', '去', '发生'];
      for (var j = 0; j < eventWords.length; j++) {
        if (lower.indexOf(eventWords[j]) !== -1) {
          return this._randomPick(T.FOLLOW_UPS.event_mentioned).replace(/\{name\}/g, name);
        }
      }

      return this._randomPick(T.FOLLOW_UPS.short_reply).replace(/\{name\}/g, name);
    },

    /**
     * 选取过渡语
     */
    _pickTransition: function () {
      return this._randomPick(T.TRANSITIONS);
    },

    /**
     * 随机选取数组元素
     */
    _randomPick: function (arr) {
      if (!arr || arr.length === 0) return '';
      return arr[Math.floor(Math.random() * arr.length)];
    }

  };

  window.ChatbotProviders = {
    TemplateProvider: TemplateProvider
  };

})();
