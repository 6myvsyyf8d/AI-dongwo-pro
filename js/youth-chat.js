/**
 * youth-chat.js — 心青年无障碍聊天界面
 * 挂载：window.YouthChat
 *
 * 依赖：window.ChatBot, window.YouthTTS, window.DataStore, window.Utils
 *
 * 特性：
 * - 大号 emoji 情绪按钮代替打字
 * - 预设快捷回复「我今天做了...」「我想...」「我不喜欢...」
 * - 消息气泡放大到 16px+ 字号
 * - AI 回复自动 TTS 朗读（基于 YouthTTS）
 * - 移动端防缩放
 * - 仅 youth 角色可访问
 */
(function () {
  'use strict';

  var ChatBot = window.ChatBot;
  var DataStore = window.DataStore;
  var YouthTTS = window.YouthTTS;
  var ApiProvider = window.ChatbotProviders ? window.ChatbotProviders.ApiProvider : null;

  // ======== 状态 ========
  var _session = null;
  var _tts = null;
  var _msgCounter = 0;
  var _origGenerateReply = null; // 保存原始 Provider.generateReply，离开时恢复

  // ======== 心青年本人使用的友好问题池 ========
  // 与 supporter 模板不同：直接问本人，不提第三者名字，不使用照护者话术
  var YOUTH_SELF_QUESTIONS = [
    '今天过得怎么样呀？',
    '有没有什么开心的事想和我分享？',
    '今天吃了什么好吃的呀？',
    '最近有没有学到什么新东西？',
    '有什么事情让你觉得有点难吗？',
    '今天和别人聊天还顺利吗？',
    '最近做了什么让你觉得特别棒的事？',
    '你最喜欢做什么事情呀？',
    '今天心情怎么样？用一个表情告诉我也可以~',
    '有没有想去的地方或者想做的事？',
    '你能告诉我更多吗？我很想听~',
    '原来是这样呀，然后呢？'
  ];

  // ======== 快捷表达按钮（3 个核心表达） ========
  var QUICK_PHRASES = [
    { text: '我有点紧张',   emoji: '💛' },
    { text: '今天很开心',   emoji: '😊' },
    { text: '我需要帮助',   emoji: '🤲' }
  ];

  // ======== 移动端防缩放 ========
  function applyViewportNoZoom() {
    var meta = document.querySelector('meta[name="viewport"]');
    if (meta) {
      meta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
    }
  }

  function restoreViewport() {
    var meta = document.querySelector('meta[name="viewport"]');
    if (meta) {
      meta.setAttribute('content', 'width=device-width, initial-scale=1.0');
    }
  }

  /**
   * 禁止输入框聚焦时页面放大
   * iOS 的 trick：input font-size >= 16px 就不会自动缩放
   * 已在 CSS 中设置 font-size: 16px，这里做兜底处理
   */
  function bindInputFocusPrevention() {
    var input = document.getElementById('youth-text-input');
    if (!input) return;

    input.addEventListener('focus', function () {
      // 确保 font-size 不小于 16px（iOS Safari 不会缩放 >=16px 的输入框）
      if (parseInt(window.getComputedStyle(input).fontSize) < 16) {
        input.style.fontSize = '16px';
      }
    });
  }

  // ======== 滚动到底部 ========
  function scrollToBottom() {
    var container = document.getElementById('youth-messages');
    if (container) {
      requestAnimationFrame(function () {
        container.scrollTop = container.scrollHeight;
      });
    }
  }

  // ======== 生成唯一消息 ID ========
  function msgId() {
    _msgCounter++;
    return 'ymsg_' + Date.now() + '_' + _msgCounter;
  }

  // ======== 转义 HTML ========
  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // ======== 获取心青年档案 ========
  function _getYouthProfile() {
    var currentUser = DataStore.getCurrentUser();
    if (!currentUser) return { name: '心青年' };
    return {
      name: currentUser.name || '心青年',
      age: currentUser.age || '',
      intro: currentUser.intro || '',
      communication: currentUser.communication || ''
    };
  }

  // ======== 创建流式气泡（API 实时回复用） ========
  function renderStreamBubble(id) {
    var container = document.getElementById('youth-messages');
    if (!container) return null;
    var row = document.createElement('div');
    row.className = 'youth-msg ai';
    row.setAttribute('data-msg-id', id);
    var bubble = document.createElement('div');
    bubble.className = 'youth-bubble youth-streaming';
    bubble.textContent = '...';
    row.appendChild(bubble);
    container.appendChild(row);
    requestAnimationFrame(function () { scrollToBottom(); });
    return bubble;
  }

  // ======== 渲染消息气泡 ========
  function renderBubble(role, text, id) {
    var container = document.getElementById('youth-messages');
    if (!container) return;

    var rowClass = role === 'ai' ? 'youth-msg ai' : 'youth-msg user';
    var safeText = escapeHtml(text);
    // 简单的 Markdown 粗体/换行支持
    safeText = safeText
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');

    var html = '<div class="' + rowClass + '" data-msg-id="' + id + '">';
    html += '<div class="youth-bubble">' + safeText;

    // AI 气泡附带 TTS 指示器
    if (role === 'ai') {
      html += '<span class="youth-tts-indicator" style="display:none;">';
      html += '<span class="tts-dot"></span>';
      html += '<span class="tts-dot"></span>';
      html += '<span class="tts-dot"></span>';
      html += '</span>';
    }

    html += '</div></div>';

    container.insertAdjacentHTML('beforeend', html);
    scrollToBottom();
  }

  // ======== 显示打字中指示器 ========
  function showTyping() {
    var container = document.getElementById('youth-messages');
    if (!container) return;

    var html = '<div class="youth-msg ai" id="youth-typing">';
    html += '<div class="youth-bubble">';
    html += '<div class="youth-typing">';
    html += '<span class="typing-dot"></span>';
    html += '<span class="typing-dot"></span>';
    html += '<span class="typing-dot"></span>';
    html += '</div>';
    html += '</div></div>';

    container.insertAdjacentHTML('beforeend', html);
    scrollToBottom();
  }

  function hideTyping() {
    var el = document.getElementById('youth-typing');
    if (el) el.remove();
  }

  // ======== 更新 TTS 开关按钮状态 ========
  function updateTTSToggle() {
    var btn = document.getElementById('youth-tts-toggle');
    if (!btn) return;
    if (_tts.enabled) {
      btn.className = 'youth-tts-toggle on';
      btn.textContent = '声音开 🔊';
    } else {
      btn.className = 'youth-tts-toggle off';
      btn.textContent = '声音关';
    }
  }

  // ======== 发送消息 ========
  function sendMessage(text) {
    if (!_session || !text || !text.trim()) return;

    text = text.trim();

    // 禁用输入
    var input = document.getElementById('youth-text-input');
    var sendBtn = document.getElementById('youth-send-btn');
    if (input) input.disabled = true;
    if (sendBtn) sendBtn.disabled = true;

    // 渲染用户气泡
    var userMsgId = msgId();
    renderBubble('user', text, userMsgId);

    // 显示打字动画
    showTyping();

    // 清空输入
    if (input) input.value = '';

    // 调用 AI
    var useApi = ApiProvider && typeof ApiProvider.generateReplyStream === 'function' && ApiProvider.isConfigured();

    if (useApi) {
      // === 真实 AI：流式回复 ===
      var aiMsgId = msgId();
      var streamBubble = renderStreamBubble(aiMsgId);

      // 添加用户消息到 session
      _session.messages.push({ role: 'user', text: text, timestamp: new Date().toISOString() });
      var youthProfile = _getYouthProfile();

      ApiProvider.generateReplyStream(
        _session.messages, youthProfile,
        // onChunk
        function (chunk, fullText) {
          hideTyping();
          if (streamBubble) {
            streamBubble.textContent = fullText || chunk;
          }
          requestAnimationFrame(function () { scrollToBottom(); });
        },
        // onDone
        function (finalText) {
          hideTyping();
          var reply = finalText || '';
          if (streamBubble) {
            streamBubble.textContent = reply;
          }
          _session.messages.push({ role: 'ai', text: reply, timestamp: new Date().toISOString() });
          // TTS 朗读
          if (_tts && _tts.enabled && reply) {
            _tts.speak(reply, aiMsgId);
          }
          // 恢复输入
          if (input) { input.disabled = false; input.focus(); }
          if (sendBtn) sendBtn.disabled = false;
        },
        // onError
        function () {
          hideTyping();
          if (streamBubble) {
            streamBubble.textContent = '嗯…刚才有点走神，你能再说一次吗？';
          }
          if (input) { input.disabled = false; input.focus(); }
          if (sendBtn) sendBtn.disabled = false;
        }
      );
    } else {
      // === 模板降级 ===
      try {
        var result = _session.sendMessage(text);
        var reply = result && result.reply ? result.reply : '';

        setTimeout(function () {
          hideTyping();

          if (reply) {
            var templateMsgId = msgId();
            renderBubble('ai', reply, templateMsgId);
            if (_tts && _tts.enabled) {
              _tts.speak(reply, templateMsgId);
            }
          } else {
            var fbId = msgId();
            var fbText = '好的，我知道了~ 还有什么想和我说的吗？';
            renderBubble('ai', fbText, fbId);
            if (_tts && _tts.enabled) {
              _tts.speak(fbText, fbId);
            }
          }

          if (input) { input.disabled = false; input.focus(); }
          if (sendBtn) sendBtn.disabled = false;
        }, 600);
      } catch (err) {
        hideTyping();
        console.error('[YouthChat] 发送失败:', err);
        var errId = msgId();
        renderBubble('ai', '哎呀，刚刚没听清，你再和我说一次好吗？', errId);
        if (input) input.disabled = false;
        if (sendBtn) sendBtn.disabled = false;
      }
    }
  }

  // ======== 构建 UI ========
  function buildUI(section) {
    var user = DataStore.getCurrentUser();
    var youthName = (user && user.name) || '心青年';

    section.innerHTML = '';

    // 顶部栏 — 返回按钮（文字+44px）+ 标题 + 声音开关
    var topbarHTML = '<div class="youth-topbar">';
    topbarHTML += '<button class="youth-back-btn" id="youth-back-btn">← 返回</button>';
    topbarHTML += '<div class="youth-topbar-title">';
    topbarHTML += '<span class="youth-avatar">❤️</span>';
    topbarHTML += '<span>和小懂说说话</span>';
    topbarHTML += '</div>';
    topbarHTML += '<div class="youth-topbar-actions">';
    topbarHTML += '<button class="youth-tts-toggle on" id="youth-tts-toggle">声音开 🔊</button>';
    topbarHTML += '</div>';
    topbarHTML += '</div>';

    // 消息区域 — 简洁欢迎语
    var messagesHTML = '<div class="youth-messages" id="youth-messages">';
    messagesHTML += '<div class="youth-welcome">';
    messagesHTML += '<div class="youth-welcome-icon">💛</div>';
    messagesHTML += '<div class="youth-welcome-title">' + escapeHtml(youthName) + '，今天好吗？</div>';
    messagesHTML += '<div class="youth-welcome-sub">告诉我你的感受，<br>也可以打字说说今天的事</div>';
    messagesHTML += '</div>';
    messagesHTML += '</div>';

    // 快捷表达按钮 + 输入区 — 固定底部
    var bottomHTML = '<div class="youth-bottom-area">';

    // 快捷表达按钮（3 个核心表达，点击直接发送）
    bottomHTML += '<div class="youth-quick-bar" id="youth-quick-bar">';
    QUICK_PHRASES.forEach(function (qp) {
      bottomHTML += '<button class="youth-quick-btn" data-text="' + escapeHtml(qp.text) + '">';
      bottomHTML += '<span class="quick-emoji">' + qp.emoji + '</span>';
      bottomHTML += '<span class="quick-text">' + escapeHtml(qp.text) + '</span>';
      bottomHTML += '</button>';
    });
    bottomHTML += '</div>';

    // 底部输入区 — 文字输入 + 语音按钮 + 发送按钮
    bottomHTML += '<div class="youth-input-area">';
    bottomHTML += '<div class="youth-toast" id="youth-toast" style="display:none;"></div>';
    bottomHTML += '<textarea class="youth-text-input" id="youth-text-input"';
    bottomHTML += ' placeholder="想说点什么..."';
    bottomHTML += ' rows="1"';
    bottomHTML += ' inputmode="text"';
    bottomHTML += ' autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"';
    bottomHTML += '></textarea>';
    bottomHTML += '<button class="youth-voice-btn" id="youth-voice-btn">🎤 按住说话</button>';
    bottomHTML += '<button class="youth-send-btn" id="youth-send-btn" disabled>发送</button>';
    bottomHTML += '</div>';

    bottomHTML += '</div>';

    section.innerHTML = topbarHTML + messagesHTML + bottomHTML;
  }

  // ======== 绑定事件 ========
  function bindEvents() {
    // 返回首页按钮
    var backBtn = document.getElementById('youth-back-btn');
    if (backBtn) {
      backBtn.addEventListener('click', function () {
        window.location.hash = 'home';
      });
    }

    // TTS 开关
    var ttsToggle = document.getElementById('youth-tts-toggle');
    if (ttsToggle) {
      ttsToggle.addEventListener('click', function () {
        var enabled = _tts.toggle();
        updateTTSToggle();
      });
    }

    // 快捷表达按钮 — 点击直接发送
    var quickBar = document.getElementById('youth-quick-bar');
    if (quickBar) {
      quickBar.addEventListener('click', function (e) {
        var btn = e.target.closest('.youth-quick-btn');
        if (!btn) return;
        var text = btn.getAttribute('data-text');
        if (text) {
          if (navigator.vibrate) {
            navigator.vibrate(15);
          }
          sendMessage(text);
        }
      });
    }

    // 输入框
    var input = document.getElementById('youth-text-input');
    if (input) {
      // 自动调整高度
      input.addEventListener('input', function () {
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 96) + 'px';
        updateSendButton();
      });

      // 回车发送
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          var text = input.value.trim();
          if (text) sendMessage(text);
        }
      });

      // 防缩放
      bindInputFocusPrevention();
    }

    // 发送按钮
    var sendBtn = document.getElementById('youth-send-btn');
    if (sendBtn) {
      sendBtn.addEventListener('click', function () {
        var text = (input && input.value) ? input.value.trim() : '';
        if (text) sendMessage(text);
      });
    }

    // 语音输入
    _bindVoiceInput();
  }

  // ======== Toast 提示 ========
  function _showToast(msg, duration) {
    var toast = document.getElementById('youth-toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.style.display = 'block';
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(function () {
      toast.style.display = 'none';
    }, duration || 3000);
  }

  // ======== 语音输入（Web Speech API） ========
  function _bindVoiceInput() {
    var voiceBtn = document.getElementById('youth-voice-btn');
    if (!voiceBtn) return;

    var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    // 浏览器不支持：按钮保留，点击提示
    if (!SpeechRecognition) {
      voiceBtn.addEventListener('click', function () {
        _showToast('当前浏览器暂不支持语音输入，请使用文字输入或更换浏览器', 4000);
      });
      return;
    }

    var recognition = new SpeechRecognition();
    recognition.lang = 'zh-CN';
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    var isRecording = false;
    var finalTranscript = '';

    recognition.onresult = function (event) {
      // 只取最终结果
      for (var i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript = event.results[i][0].transcript.trim();
        }
      }
    };

    recognition.onend = function () {
      isRecording = false;
      voiceBtn.classList.remove('recording');
      voiceBtn.textContent = '🎤 按住说话';

      // 有最终识别结果时发送
      if (finalTranscript) {
        var text = finalTranscript;
        finalTranscript = '';
        sendMessage(text);
      }
    };

    recognition.onerror = function (event) {
      console.warn('[YouthChat] 语音识别错误:', event.error);
      isRecording = false;
      voiceBtn.classList.remove('recording');
      voiceBtn.textContent = '🎤 按住说话';
      finalTranscript = '';

      if (event.error === 'not-allowed') {
        _showToast('需要允许使用麦克风，才能听到你说话', 4000);
      } else if (event.error === 'aborted' || event.error === 'no-speech') {
        _showToast('没有听清，可以再说一次，也可以打字', 3000);
      } else {
        _showToast('没有听清，可以再说一次，也可以打字', 3000);
      }
    };

    function startRecord(e) {
      e.preventDefault();
      e.stopPropagation();
      if (isRecording) return;
      try {
        recognition.start();
        isRecording = true;
        finalTranscript = '';
        voiceBtn.classList.add('recording');
        voiceBtn.textContent = '正在听…';
      } catch (err) {
        console.warn('[YouthChat] 启动语音识别失败:', err);
      }
    }

    function stopRecord(e) {
      e.preventDefault();
      e.stopPropagation();
      if (!isRecording) return;
      try { recognition.stop(); } catch (err) {}
    }

    // 同时绑定 mouse 和 touch 事件，靠 isRecording 守卫防止双重触发
    // startRecord 中的 e.preventDefault() 会阻止移动端 touch→mouse 模拟事件
    voiceBtn.addEventListener('mousedown', startRecord);
    voiceBtn.addEventListener('mouseup', stopRecord);
    voiceBtn.addEventListener('mouseleave', stopRecord);
    voiceBtn.addEventListener('touchstart', startRecord, { passive: false });
    voiceBtn.addEventListener('touchend', stopRecord, { passive: false });
    voiceBtn.addEventListener('touchcancel', stopRecord, { passive: false });
  }

  function updateSendButton() {
    var input = document.getElementById('youth-text-input');
    var sendBtn = document.getElementById('youth-send-btn');
    if (input && sendBtn) {
      sendBtn.disabled = !input.value.trim();
    }
  }

  // ======== 初始化聊天会话 ========
  function initSession() {
    var user = DataStore.getCurrentUser();
    var youthId = user ? user.id : 'u_sample_youth';

    // 创建新会话
    _session = ChatBot.createSession(youthId);

    // Monkey-patch Provider.generateReply：心青年本人使用时，替换为直接问本人的友好回复，
    // 避免出现 supporter 模板的 "最近和小雨沟通的时候，你觉得什么方式最有效？" 等照护者话术
    if (!_origGenerateReply) {
      var Provider = window.ChatbotProviders && window.ChatbotProviders.TemplateProvider;
      if (Provider) {
        _origGenerateReply = Provider.generateReply;
        Provider.generateReply = function (messages, youthProfile) {
          var name = (youthProfile && youthProfile.name) || '小雨';
          var userMsgs = messages.filter(function (m) { return m.role === 'user'; });

          // 欢迎消息
          if (userMsgs.length === 0) {
            var now = new Date();
            var hour = now.getHours();
            var greeting = '早上好';
            if (hour >= 12 && hour < 18) greeting = '下午好';
            if (hour >= 18) greeting = '晚上好';
            return greeting + '，' + name + '~';
          }

          // 对话太长时温柔结束
          var aiMsgs = messages.filter(function (m) { return m.role === 'ai'; });
          if (aiMsgs.length >= 5) {
            return '和你聊天真开心！我先帮你记下来，我们下次再聊哦~';
          }

          // 轮转心青年友好问题
          var q = YOUTH_SELF_QUESTIONS[aiMsgs.length % YOUTH_SELF_QUESTIONS.length];
          return q;
        };
      }
    }

    // 初始化 TTS
    if (_tts) {
      _tts.destroy();
    }
    _tts = new YouthTTS();
    _tts.enabled = true;
  }

  // ======== 发送欢迎消息 ========
  function sendWelcomeMessage() {
    var user = DataStore.getCurrentUser();
    var name = (user && user.name) || '心青年';

    // 获取今日时间语境
    var now = new Date();
    var hour = now.getHours();
    var timeGreeting = '早上好';
    if (hour >= 12 && hour < 18) timeGreeting = '下午好';
    if (hour >= 18) timeGreeting = '晚上好';

    var welcomeText = timeGreeting + '，' + name + '~';

    var aiMsgId = msgId();
    renderBubble('ai', welcomeText, aiMsgId);

    // TTS 朗读欢迎语
    if (_tts && _tts.enabled) {
      _tts.speak(welcomeText, aiMsgId);
    }
  }

  // ======== 公开 API ========

  var YouthChat = {
    /**
     * 渲染心青年聊天界面
     */
    render: function () {
      // 仅 youth 角色可访问
      var user = DataStore.getCurrentUser();
      if (!user || user.role !== 'youth') {
        var section = document.getElementById('youth-chat');
        if (section) {
          section.innerHTML = '<div style="padding:40px 20px;text-align:center;color:var(--text-muted);">此功能仅对心青年开放</div>';
          section.classList.add('active');
        }
        return;
      }

      // 隐藏全局 UI 元素
      var topbar = document.getElementById('app-topbar');
      var bottomNav = document.getElementById('bottom-nav');
      var fab = document.getElementById('fab-container');
      if (topbar) topbar.style.display = 'none';
      if (bottomNav) bottomNav.style.display = 'none';
      if (fab) fab.style.display = 'none';

      // 防缩放
      applyViewportNoZoom();

      var section = document.getElementById('youth-chat');
      if (!section) return;

      // 构建 UI
      buildUI(section);

      // 初始化会话和 TTS
      initSession();

      // 绑定事件
      bindEvents();

      // 更新 TTS 按钮状态
      updateTTSToggle();

      // 发送欢迎消息
      sendWelcomeMessage();
    },

    /**
     * 清理（离开页面时调用）
     */
    destroy: function () {
      restoreViewport();

      // 恢复原始 Provider.generateReply
      if (_origGenerateReply) {
        var Provider = window.ChatbotProviders && window.ChatbotProviders.TemplateProvider;
        if (Provider) {
          Provider.generateReply = _origGenerateReply;
        }
        _origGenerateReply = null;
      }

      // 恢复全局 UI 元素
      var topbar = document.getElementById('app-topbar');
      var bottomNav = document.getElementById('bottom-nav');
      var fab = document.getElementById('fab-container');
      if (topbar) topbar.style.display = '';
      if (bottomNav) bottomNav.style.display = '';
      if (fab) fab.style.display = '';

      if (_tts) {
        _tts.destroy();
        _tts = null;
      }
      _session = null;
      _msgCounter = 0;
    }
  };

  // ======== 挂载全局 ========
  window.YouthChat = YouthChat;

})();
