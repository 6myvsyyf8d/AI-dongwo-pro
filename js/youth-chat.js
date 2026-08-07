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

  // ======== 状态 ========
  var _session = null;
  var _tts = null;
  var _msgCounter = 0;

  // ======== 情绪 emoji 按钮配置 ========
  var EMOJI_BUTTONS = [
    { id: 'happy',   emoji: '😊', label: '开心', color: '#FFB84D' },
    { id: 'sad',     emoji: '😢', label: '难过', color: '#87CEEB' },
    { id: 'angry',   emoji: '😠', label: '生气', color: '#E87DA0' },
    { id: 'worried', emoji: '😰', label: '担心', color: '#C4A2E6' },
    { id: 'calm',    emoji: '😌', label: '放松', color: '#7EC8A0' }
  ];

  // ======== 快捷回复配置 ========
  var QUICK_REPLIES = [
    { id: 'did',     text: '我今天做了...',   icon: '📝' },
    { id: 'want',    text: '我想...',         icon: '💭' },
    { id: 'dislike', text: '我不喜欢...',     icon: '😣' },
    { id: 'like',    text: '我喜欢...',       icon: '❤️' },
    { id: 'feel',    text: '我感觉...',       icon: '💬' },
    { id: 'help',    text: '我需要帮助',      icon: '🤲' }
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
      btn.textContent = '🔊';
    } else {
      btn.className = 'youth-tts-toggle off';
      btn.textContent = '🔇';
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

    // 调用 chatbot 引擎
    try {
      var result = _session.sendMessage(text);
      var reply = result && result.reply ? result.reply : '';

      // 短暂延迟让打字动画可见，然后显示回复
      setTimeout(function () {
        hideTyping();

        if (reply) {
          var aiMsgId = msgId();
          renderBubble('ai', reply, aiMsgId);

          // TTS 朗读
          if (_tts && _tts.enabled) {
            _tts.speak(reply, aiMsgId);
          }
        } else {
          // fallback
          var fallbackId = msgId();
          var fallbackText = '好的，我知道了~ 还有什么想和我说的吗？';
          renderBubble('ai', fallbackText, fallbackId);
          if (_tts && _tts.enabled) {
            _tts.speak(fallbackText, fallbackId);
          }
        }

        // 恢复输入
        if (input) {
          input.disabled = false;
          input.focus();
        }
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

  // ======== 构建 UI ========
  function buildUI(section) {
    var user = DataStore.getCurrentUser();
    var youthName = (user && user.name) || '心青年';

    section.innerHTML = '';

    // 顶部栏
    var topbarHTML = '<div class="youth-topbar">';
    topbarHTML += '<button class="youth-back-btn" id="youth-back-btn" title="返回首页">←</button>';
    topbarHTML += '<div class="youth-topbar-title">';
    topbarHTML += '<div class="youth-avatar">🤖</div>';
    topbarHTML += '<span>AI聊聊</span>';
    topbarHTML += '</div>';
    topbarHTML += '<div class="youth-topbar-actions" style="margin-left:auto;">';
    topbarHTML += '<button class="youth-tts-toggle on" id="youth-tts-toggle">🔊</button>';
    topbarHTML += '</div>';
    topbarHTML += '</div>';

    // 消息区域
    var messagesHTML = '<div class="youth-messages" id="youth-messages">';
    messagesHTML += '<div class="youth-welcome">';
    messagesHTML += '<div class="youth-welcome-emoji">👋</div>';
    messagesHTML += '<div class="youth-welcome-title">你好呀，' + escapeHtml(youthName) + '！</div>';
    messagesHTML += '<div class="youth-welcome-sub">想说什么就告诉我吧<br>可以点下面的表情告诉我你的心情 😊</div>';
    messagesHTML += '</div>';
    messagesHTML += '</div>';

    // 心情 emoji 按钮
    var emojiHTML = '<div class="youth-emoji-bar" id="youth-emoji-bar">';
    EMOJI_BUTTONS.forEach(function (btn) {
      emojiHTML += '<button class="youth-emoji-btn ' + btn.id + '" data-mood="' + btn.id + '" data-text="我现在' + btn.label + '">';
      emojiHTML += '<span class="emoji-icon">' + btn.emoji + '</span>';
      emojiHTML += '<span class="emoji-label">' + btn.label + '</span>';
      emojiHTML += '</button>';
    });
    emojiHTML += '</div>';

    // 快捷回复按钮
    var quickHTML = '<div class="youth-quick-replies" id="youth-quick-replies">';
    QUICK_REPLIES.forEach(function (qr) {
      quickHTML += '<button class="youth-quick-btn" data-text="' + escapeHtml(qr.text) + '">';
      quickHTML += '<span>' + qr.icon + '</span>';
      quickHTML += '<span>' + escapeHtml(qr.text) + '</span>';
      quickHTML += '</button>';
    });
    quickHTML += '</div>';

    // 底部输入区
    var inputHTML = '<div class="youth-input-area">';
    inputHTML += '<textarea class="youth-text-input" id="youth-text-input"';
    inputHTML += ' placeholder="在这里打字或点上面的按钮..."';
    inputHTML += ' rows="1"';
    inputHTML += ' inputmode="text"';
    inputHTML += ' autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"';
    inputHTML += '></textarea>';
    inputHTML += '<button class="youth-send-btn" id="youth-send-btn" disabled>➤</button>';
    inputHTML += '</div>';

    section.innerHTML = topbarHTML + messagesHTML + emojiHTML + quickHTML + inputHTML;
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

    // Emoji 心情按钮
    var emojiBar = document.getElementById('youth-emoji-bar');
    if (emojiBar) {
      emojiBar.addEventListener('click', function (e) {
        var btn = e.target.closest('.youth-emoji-btn');
        if (!btn) return;
        var text = btn.getAttribute('data-text');
        if (text) {
          // 震动反馈（如果支持）
          if (navigator.vibrate) {
            navigator.vibrate(15);
          }
          sendMessage(text);
        }
      });
    }

    // 快捷回复按钮
    var quickReplies = document.getElementById('youth-quick-replies');
    if (quickReplies) {
      quickReplies.addEventListener('click', function (e) {
        var btn = e.target.closest('.youth-quick-btn');
        if (!btn) return;
        var text = btn.getAttribute('data-text');
        if (text) {
          if (navigator.vibrate) {
            navigator.vibrate(15);
          }
          // 聚焦到输入框预填文本
          var input = document.getElementById('youth-text-input');
          if (input) {
            input.value = text;
            input.focus();
            // 将光标移到末尾
            input.setSelectionRange(text.length, text.length);
            updateSendButton();
          }
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

    var welcomeText = timeGreeting + '，' + name + '！今天感觉怎么样？你可以告诉我你的心情，也可以和我说说今天做了什么~';

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
    }
  };

  // ======== 挂载全局 ========
  window.YouthChat = YouthChat;

})();
