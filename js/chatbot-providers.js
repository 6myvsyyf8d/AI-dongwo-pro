/**
 * chatbot-providers.js — AI 适配层
 * 挂载：window.ChatbotProviders
 * TemplateProvider：用模板匹配模拟 AI 回复，不接外部 API
 * ApiProvider：连接 OpenAI 兼容 API，流式输出 + 失败回退
 */
(function () {
  'use strict';

  var T = window.ChatbotTemplates;
  var Classifier = window.ChatbotClassifier;

  /* ==========================================================
   * ApiProvider — 真实 API 连接（OpenAI 兼容接口）
   * ========================================================== */

  var ApiProvider = {
    /** API 配置（用户自行设置） */
    config: {
      endpoint: localStorage.getItem('ai_dongwo_api_endpoint') || 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
      apiKey: localStorage.getItem('ai_dongwo_api_key') || '',
      model: localStorage.getItem('ai_dongwo_api_model') || 'glm-4-flash'
    },

    /** 系统提示词（照护者视角） */
    SYSTEM_PROMPT: '你叫「小懂」，是一个温暖、耐心的心智障碍者支持记录助手。你的服务对象是心智障碍青年（如孤独症谱系、智力障碍、唐氏综合征等），你通过对话了解 TA 们的日常生活、情绪状态、行为表现和需求。\n\n对话原则：\n1. 每次只问一个问题，用简单、温和、口语化的中文\n2. 关心对方的感受和状态，像朋友聊天，不要审问\n3. 当用户表达情绪时，先简短共情（1-2句），再自然过渡到下一个问题\n4. 当对话已经覆盖了：发生了什么→TA的表现→做了哪些支持→效果如何，在回复末尾加上「#DRAFT」标记\n\n永远用中文对话，回复控制在2-4句话以内，简洁自然。',

    /** 系统提示词（心青年本人视角） */
    YOUTH_SYSTEM_PROMPT: '你叫「小懂」，是对方的好朋友。对面是心智障碍青年本人（如孤独症谱系、智力障碍等），他们在和你说话。你的目标是让他们感到安全、被理解、愿意开口。\n\n说话方式：\n1. 用最最简单的句子，像和朋友发微信一样\n2. 每次只说 1-2 句话，不要一次说太多\n3. 多用语气词：哦～、这样啊、真好、嗯嗯\n4. 绝对不要问「为什么」，用「发生了什么呀？」代替\n5. 对方说的是此时此刻的感受，尊重它，不要分析、不要纠正\n\n重点：\n- 表达情绪时，先共情（「听起来你今天很开心！」「嗯，那确实会让人难过」）\n- 对方不想说的时候，不追问，换个轻松的话题\n- 不引导到任何结构化方向，不生成记录\n- 就像陪在身边的人，聊到哪算哪\n\n永远用中文，短句，口语化。',

    /**
     * 保存 API 配置
     */
    saveConfig: function (cfg) {
      if (cfg.endpoint !== undefined) {
        this.config.endpoint = cfg.endpoint;
        localStorage.setItem('ai_dongwo_api_endpoint', cfg.endpoint);
      }
      if (cfg.apiKey !== undefined) {
        this.config.apiKey = cfg.apiKey;
        localStorage.setItem('ai_dongwo_api_key', cfg.apiKey);
      }
      if (cfg.model !== undefined) {
        this.config.model = cfg.model;
        localStorage.setItem('ai_dongwo_api_model', cfg.model);
      }
    },

    /**
     * 检查 API 是否已配置
     * CF Pages 上走 Functions 代理（Key 在服务端），始终视为已配置
     */
    isConfigured: function () {
      var host = window.location.hostname;
      if (host !== 'localhost' && host !== '127.0.0.1') {
        if (host.indexOf('.pages.dev') !== -1) {
          return true; // CF Pages 由 /api/chat 代理处理
        }
      }
      return !!(this.config.apiKey && this.config.apiKey.length > 10);
    },

    /**
     * 流式生成 AI 回复
     * @param {Array} messages - 当前会话消息数组
     * @param {Object} youthProfile - 心青年档案
     * @param {Function} onChunk - 每收到一个 chunk 时回调 (chunkText)
     * @param {Function} onDone - 完成时回调 (fullText)
     * @param {Function} onError - 出错时回调 (error)
     */
    generateReplyStream: function (messages, youthProfile, onChunk, onDone, onError) {
      var self = this;
      var name = (youthProfile && youthProfile.name) || '小雨';
      var userMsgs = messages.filter(function (m) { return m.role === 'user'; });

      // 检测当前用户是否是心青年本人
      var currentUser = (window.DataStore && window.DataStore.getCurrentUser && window.DataStore.getCurrentUser()) || (window.AppState && window.AppState.currentUser);
      var isYouthSelf = currentUser && currentUser.role === 'youth';

      // 欢迎消息 → 直接返回，不调 API
      if (userMsgs.length === 0) {
        var welcome = T.WELCOME.map(function (line) {
          return line.replace(/\{name\}/g, name);
        }).join('\n\n');
        if (onDone) onDone(welcome);
        return;
      }

      // 未配置 API → 回退
      if (!self.isConfigured()) {
        var fallback = isYouthSelf
          ? YouthTemplateProvider.generateReply(messages, youthProfile)
          : TemplateProvider.generateReply(messages, youthProfile);
        if (onDone) onDone(fallback);
        return;
      }

      // 构建 API 请求体（心青年用专属提示词，不附加服务对象档案）
      var apiMessages = self._buildApiMessages(messages, name, isYouthSelf ? null : youthProfile, isYouthSelf);

      // 心青年：短回复 + 更高随机性；照护者：正常
      var maxTokens = isYouthSelf ? 200 : 500;
      var temperature = isYouthSelf ? 0.9 : 0.7;

      // 发起流式请求
      self._streamFetch(apiMessages, maxTokens, temperature, onChunk, onDone, function (err) {
        console.warn('API 调用失败，回退到 TemplateProvider:', err);
        var fallback = isYouthSelf
          ? YouthTemplateProvider.generateReply(messages, youthProfile)
          : TemplateProvider.generateReply(messages, youthProfile);
        if (onChunk) onChunk(fallback);
        if (onDone) onDone(fallback, true);
      });
    },

    /**
     * 同步生成（非流式，兼容旧接口）
     */
    generateReply: function (messages, youthProfile) {
      // 非流式场景直接用 TemplateProvider（API 应走 stream 路径）
      return TemplateProvider.generateReply(messages, youthProfile);
    },

    /**
     * 生成草稿（直接委托 TemplateProvider）
     */
    generateDraft: function (messages, moduleKey, name) {
      return TemplateProvider.generateDraft(messages, moduleKey, name);
    },

    // ==========================================================
    // 内部方法
    // ==========================================================

    /**
     * 构建 API 消息数组
     * @param {boolean} isYouthSelf - 是否为心青年本人对话
     */
    _buildApiMessages: function (messages, name, youthProfile, isYouthSelf) {
      var apiMessages = [];

      // 系统提示
      if (isYouthSelf) {
        // 心青年本人：用专属提示词，不附加服务对象信息
        apiMessages.push({ role: 'system', content: this.YOUTH_SYSTEM_PROMPT });
      } else {
        var sysPrompt = this.SYSTEM_PROMPT;
        if (youthProfile) {
          sysPrompt += '\n\n当前服务对象：\n'
            + '姓名：' + (youthProfile.name || name) + '\n'
            + '年龄：' + (youthProfile.age || '未知') + '\n'
            + '特点：' + (youthProfile.intro || '心智障碍青年') + '\n'
            + '沟通方式：' + (youthProfile.communication || '短句为主，需要耐心等待');
        }
        apiMessages.push({ role: 'system', content: sysPrompt });
      }

      // 添加最近最多 20 条消息
      var recent = messages.slice(-20);
      recent.forEach(function (msg) {
        if (msg.role === 'user') {
          apiMessages.push({ role: 'user', content: msg.text || '' });
        } else if (msg.role === 'ai') {
          apiMessages.push({ role: 'assistant', content: msg.text || '' });
        }
      });

      return apiMessages;
    },

    /**
     * 获取 API 端点
     * - 本地：直连智谱（用 localStorage 中的 Key）
     * - Cloudflare Pages：走 /api/chat 代理（Key 在服务端环境变量）
     * - 其他线上（GitHub Pages 等）：直连智谱（用 localStorage 中的 Key）
     */
    _getEndpoint: function () {
      var host = window.location.hostname;
      if (host === 'localhost' || host === '127.0.0.1') {
        return this.config.endpoint;
      }
      // Cloudflare Pages 部署：用 Serverless Functions 代理
      if (host.indexOf('.pages.dev') !== -1) {
        return '/api/chat';
      }
      // 其他线上环境（GitHub Pages 等）：直连
      return this.config.endpoint;
    },

    /**
     * 流式 fetch（SSE 解析）
     * @param {number} maxTokens - 最大 token 数
     * @param {number} temperature - 随机性
     */
    _streamFetch: function (apiMessages, maxTokens, temperature, onChunk, onDone, onError) {
      var self = this;
      var fullText = '';
      var controller = new AbortController();
      var timeoutId = setTimeout(function () {
        controller.abort();
        if (onError) onError(new Error('请求超时'));
      }, 30000); // 30s 超时

      // 线上走 Cloudflare Pages Functions 代理，本地直连智谱
      var endpoint = self._getEndpoint();
      var isProxied = endpoint.indexOf('/api/chat') !== -1;

      var headers = { 'Content-Type': 'application/json' };
      if (!isProxied) {
        headers['Authorization'] = 'Bearer ' + self.config.apiKey;
      }

      fetch(endpoint, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          model: self.config.model,
          messages: apiMessages,
          stream: true,
          max_tokens: maxTokens || 500,
          temperature: temperature != null ? temperature : 0.7
        }),
        signal: controller.signal
      })
      .then(function (response) {
        clearTimeout(timeoutId);

        if (!response.ok) {
          return response.text().then(function (text) {
            throw new Error('API 返回错误 ' + response.status + ': ' + text);
          });
        }

        var reader = response.body.getReader();
        var decoder = new TextDecoder();
        var buffer = '';

        function pump() {
          return reader.read().then(function (result) {
            if (result.done) {
              // 流结束
              clearTimeout(timeoutId);
              if (onDone) onDone(fullText, false);
              return;
            }

            buffer += decoder.decode(result.value, { stream: true });

            // 按行解析 SSE
            var lines = buffer.split('\n');
            // 最后一个可能不完整，保留
            buffer = lines.pop() || '';

            for (var i = 0; i < lines.length; i++) {
              var line = lines[i].trim();
              if (!line || !line.startsWith('data:')) continue;

              var jsonStr = line.substring(5).trim();
              if (jsonStr === '[DONE]') continue;

              try {
                var parsed = JSON.parse(jsonStr);
                var choices = parsed.choices;
                if (!choices || choices.length === 0) continue;

                var delta = choices[0].delta;
                if (!delta) continue;

                var content = delta.content;
                if (!content) continue;

                fullText += content;
                if (onChunk) onChunk(content, fullText);
              } catch (e) {
                // 忽略解析失败的行
              }
            }

            // 继续读取
            return pump();
          }).catch(function (err) {
            clearTimeout(timeoutId);
            if (onError) onError(err);
          });
        }

        return pump();
      })
      .catch(function (err) {
        clearTimeout(timeoutId);
        if (err.name === 'AbortError') {
          if (onError) onError(new Error('请求超时'));
        } else {
          if (onError) onError(err);
        }
      });
    }
  };

  /* ==========================================================
   * TemplateProvider — 模板匹配 AI（不变）
   * ========================================================== */

  var TemplateProvider = {

    /**
     * 生成 AI 回复
     */
    generateReply: function (messages, youthProfile) {
      var name = (youthProfile && youthProfile.name) || '小雨';
      var sessionCtx = this._buildContext(messages, name);
      var userMsgs = messages.filter(function (m) { return m.role === 'user'; });
      var aiMsgs = messages.filter(function (m) { return m.role === 'ai'; });

      if (userMsgs.length === 0) {
        return T.WELCOME.map(function (line) {
          return line.replace(/\{name\}/g, name);
        }).join('\n\n');
      }

      if (sessionCtx.totalQuestions >= T.MAX_TOTAL_QUESTIONS) {
        return T.CLOSING.map(function (line) {
          return line.replace(/\{name\}/g, name);
        }).join('\n\n');
      }

      var lastUserMsg = userMsgs[userMsgs.length - 1];
      var lastUserText = lastUserMsg ? lastUserMsg.text : '';
      var classification = Classifier.classifyMessage(lastUserText);

      var nextModule = this._pickNextModule(sessionCtx, classification.module);
      var reply = '';

      if (classification.module &&
          sessionCtx.moduleCounts[classification.module] >= T.MIN_QUESTIONS_PER_MODULE &&
          nextModule !== classification.module &&
          sessionCtx.lastModule !== null &&
          sessionCtx.lastModule !== nextModule) {
        reply += this._pickTransition() + '\n\n';
      }

      if (lastUserText.length < T.SHORT_REPLY_THRESHOLD && sessionCtx.lastModule) {
        var followUp = this._pickFollowUp(lastUserText, name);
        if (followUp) {
          reply += followUp;
          return reply;
        }
      }

      var question = this._pickQuestion(nextModule, name, sessionCtx);
      reply += question;

      return reply;
    },

    /**
     * 根据收集的消息生成草稿记录
     */
    generateDraft: function (messages, moduleKey, name) {
      name = name || '小雨';
      var draftCfg = T.DRAFT_TYPES[moduleKey] || { type: 'note', titleTemplate: '聊天记录' };
      var moduleInfo = window.Modules[moduleKey];

      var userTexts = messages
        .filter(function (m) { return m.role === 'user'; })
        .map(function (m) { return m.text; });

      var content = userTexts.join('；');

      if (!content) {
        content = '（AI 采集：信息待补充）';
      }

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

      var aiMsgs = messages.filter(function (m) { return m.role === 'ai' && m.module; });
      aiMsgs.forEach(function (m) {
        if (m.questionIndex !== undefined) {
          if (!ctx.askedQuestions[m.module]) ctx.askedQuestions[m.module] = [];
          ctx.askedQuestions[m.module].push(m.questionIndex);
        }
      });

      return ctx;
    },

    _pickNextModule: function (ctx, currentModule) {
      var order = ['communication', 'emotion', 'care', 'work'];

      if (currentModule && ctx.moduleCounts[currentModule] < T.MIN_QUESTIONS_PER_MODULE) {
        return currentModule;
      }

      for (var i = 0; i < order.length; i++) {
        if (ctx.moduleCounts[order[i]] < T.MIN_QUESTIONS_PER_MODULE) {
          return order[i];
        }
      }

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

    _pickQuestion: function (moduleKey, name, ctx) {
      var pool = T.QUESTIONS[moduleKey];
      if (!pool || pool.length === 0) {
        return '最近' + name + '还有什么想补充的吗？';
      }

      var asked = ctx.askedQuestions[moduleKey] || [];

      for (var i = 0; i < pool.length; i++) {
        if (asked.indexOf(i) === -1) {
          return pool[i].replace(/\{name\}/g, name);
        }
      }

      var idx = Math.floor(Math.random() * pool.length);
      return pool[idx].replace(/\{name\}/g, name);
    },

    _pickFollowUp: function (text, name) {
      var lower = text;

      var emotionWords = ['情绪', '焦虑', '生气', '难过', '开心', '兴奋', '不安', '紧张', '害怕'];
      for (var i = 0; i < emotionWords.length; i++) {
        if (lower.indexOf(emotionWords[i]) !== -1) {
          return this._randomPick(T.FOLLOW_UPS.emotion_mentioned).replace(/\{name\}/g, name);
        }
      }

      var eventWords = ['今天', '昨天', '早上', '下午', '晚上', '在', '去', '发生'];
      for (var j = 0; j < eventWords.length; j++) {
        if (lower.indexOf(eventWords[j]) !== -1) {
          return this._randomPick(T.FOLLOW_UPS.event_mentioned).replace(/\{name\}/g, name);
        }
      }

      return this._randomPick(T.FOLLOW_UPS.short_reply).replace(/\{name\}/g, name);
    },

    _pickTransition: function () {
      return this._randomPick(T.TRANSITIONS);
    },

    _randomPick: function (arr) {
      if (!arr || arr.length === 0) return '';
      return arr[Math.floor(Math.random() * arr.length)];
    }

  };

  /* ==========================================================
   * YouthTemplateProvider — 心青年模板降级（API 不可用时）
   * ========================================================== */

  var YouthTemplateProvider = {
    generateReply: function (messages, youthProfile) {
      var name = (youthProfile && youthProfile.name) || '小雨';
      var userMsgs = messages.filter(function (m) { return m.role === 'user'; });
      if (userMsgs.length === 0) {
        return '嗨 ' + name + '，今天过得怎么样呀？想和我聊什么都可以哦～';
      }
      // 简单的陪伴式回复，不引导模块化提问
      var replies = [
        '嗯嗯，我听懂了～',
        '这样啊，谢谢你告诉我这些',
        '听起来不错呢！还有什么想和我说的吗？',
        '我能感受到你的心情。想说更多吗？',
        '好的，我记下了。今天还有什么特别的吗？'
      ];
      return replies[Math.floor(Math.random() * replies.length)];
    }
  };

  window.ChatbotProviders = {
    TemplateProvider: TemplateProvider,
    YouthTemplateProvider: YouthTemplateProvider,
    ApiProvider: ApiProvider
  };

})();
