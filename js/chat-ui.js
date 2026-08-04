/**
 * chat-ui.js — 对话 UI 控制器 v3
 * 挂载：window.ChatUI
 *
 * 管理三个屏幕：对话首页 / 对话界面 / 整理确认页
 * 依赖：window.ChatBot, window.ChatMarkdown, window.ChatbotProviders
 *
 * 路由： #chat → 对话首页, #chat-conversation → 对话界面, #chat-review → 整理确认
 *
 * v3 新增：
 *  - AI API 流式渲染（逐 chunk 追加到空气泡）
 *  - 语音输入（Web Speech API，按住录音松开发送）
 *  - 对话持久化增强（自动保存、刷新恢复、历史列表）
 *  - 错误状态（红色气泡 + 重试按钮）
 */
(function () {
  'use strict';

  var ChatBot = window.ChatBot;
  var ApiProvider = window.ChatbotProviders ? window.ChatbotProviders.ApiProvider : null;
  var ChatMarkdown = window.ChatMarkdown;
  var Classifier = window.ChatbotClassifier;

  var _activeSession = null;
  var _quickRepliesVisible = true;
  var _savingTimeout = null;

  // ========== 持久化键 ==========
  var LAST_SESSION_KEY = 'ai_dongwo_last_active_session';
  var SESSIONS_KEY = 'ai_dongwo_chat_sessions';

  /* ==========================================================
   * ChatUI 主对象
   * ========================================================== */

  var ChatUI = {

    /** 当前活跃会话 */
    get activeSession() { return _activeSession; },

    /**
     * 渲染对话首页（路由 #chat）
     */
    renderHome: function () {
      var container = document.getElementById('chat');
      if (!container) return;
      if (container.querySelector('.chat-home-ready')) return;

      var youthName = _getYouthName();
      var pendingCount = _getPendingCount();
      var lastSessionId = localStorage.getItem(LAST_SESSION_KEY);
      var hasHistory = _getSessionSummaries().length > 0;

      container.innerHTML = ''
        + '<div class="chat-page-container chat-home-ready">'
        + '  <div class="chat-home-identity">'
        + '    <div class="chat-home-avatar">🌻</div>'
        + '    <div class="chat-home-identity-info">'
        + '      <div class="chat-home-identity-name">' + youthName + '的 AI聊聊</div>'
        + '      <div class="chat-home-identity-desc">记录今天发生的事</div>'
        + '    </div>'
        + '  </div>'
        + '  <div class="chat-home-hero">'
        + '    <div class="chat-home-deco-bubbles">'
        + '      <div class="chat-home-deco-bubble purple"></div>'
        + '      <div class="chat-home-deco-bubble white"></div>'
        + '    </div>'
        + '    <div class="chat-home-hero-question">今天想记录什么？</div>'
        + '    <div class="chat-home-hero-hint">AI会帮你把对话整理成档案记录，说到哪儿算哪儿，不用着急</div>'
        + '  </div>'
        + '  <button class="chat-home-btn-start" id="btn-start-chat">开始聊天</button>'
        + (lastSessionId && hasHistory
          ? '  <button class="chat-home-btn-continue" id="btn-continue-chat">继续上次对话</button>'
          : '')
        + (pendingCount > 0
          ? '  <div class="chat-home-pending-card" id="card-pending-review">'
          + '    <div class="chat-home-pending-info">'
          + '      <div class="chat-home-pending-icon">📋</div>'
          + '      <div class="chat-home-pending-text">' + pendingCount + '条记录待确认</div>'
          + '    </div>'
          + '    <div class="chat-home-pending-arrow">›</div>'
          + '  </div>'
          : '')
        + (hasHistory
          ? _renderHistoryList()
          : '')
        + '  <a class="chat-home-records-link" id="link-all-records">查看全部聊天记录</a>'
        + '  <div class="chat-home-footer">AI懂我 · 心智障碍者动态支持档案</div>'
        + '</div>';

      // 绑定事件
      var startBtn = document.getElementById('btn-start-chat');
      if (startBtn) {
        startBtn.addEventListener('click', function () {
          ChatUI._startNewConversation();
        });
      }

      var continueBtn = document.getElementById('btn-continue-chat');
      if (continueBtn) {
        continueBtn.addEventListener('click', function () {
          ChatUI._continueLastConversation();
        });
      }

      var pendingCard = document.getElementById('card-pending-review');
      if (pendingCard) {
        pendingCard.addEventListener('click', function () {
          window.location.hash = 'chat-review';
        });
      }

      var recordsLink = document.getElementById('link-all-records');
      if (recordsLink) {
        recordsLink.addEventListener('click', function (e) {
          e.preventDefault();
          _showAllRecords();
        });
      }

      _bindHistoryEvents();
    },

    /**
     * 开始新对话
     */
    _startNewConversation: function () {
      var youthId = _getYouthId();
      _activeSession = ChatBot.createSession(youthId);
      localStorage.setItem(LAST_SESSION_KEY, _activeSession.id);
      window.location.hash = 'chat-conversation';
    },

    /**
     * 继续上次对话
     */
    _continueLastConversation: function () {
      var sessionId = localStorage.getItem(LAST_SESSION_KEY);
      if (!sessionId) {
        _startNewConversation();
        return;
      }
      var session = ChatBot.loadSession(sessionId);
      if (!session) {
        _startNewConversation();
        return;
      }
      _activeSession = session;
      window.location.hash = 'chat-conversation';
    },

    /**
     * 渲染对话界面（路由 #chat-conversation）
     */
    renderConversation: function () {
      var container = document.getElementById('chat-conversation');
      if (!container) return;
      if (container.querySelector('.chat-conv-ready')) return;

      // 确保有活跃会话
      if (!_activeSession) {
        var savedId = localStorage.getItem(LAST_SESSION_KEY);
        if (savedId) {
          _activeSession = ChatBot.loadSession(savedId);
        }
        if (!_activeSession) {
          var youthId = _getYouthId();
          _activeSession = ChatBot.createSession(youthId);
          localStorage.setItem(LAST_SESSION_KEY, _activeSession.id);
        }
      }

      var draftCount = _getActiveDraftCount();
      var voiceSupported = _isVoiceSupported();
      var youthName = _getYouthName();

      container.innerHTML = ''
        + '<div class="chat-page-container chat-conv-ready">'
        // 顶部栏
        + '  <div class="chat-conv-topbar">'
        + '    <button class="chat-conv-btn-back" id="btn-chat-back">‹</button>'
        + '    <div class="chat-conv-title">' + youthName + '的 AI聊聊</div>'
        + '    <button class="chat-conv-btn-end" id="btn-chat-end">结束</button>'
        + '  </div>'
        // AI 状态栏
        + '  <div class="chat-conv-status-bar" id="status-bar-drafts">'
        + '    <div class="chat-conv-status-avatar">✨</div>'
        + '    <div class="chat-conv-status-text">AI记录助手</div>'
        + '    <div class="chat-conv-status-draft" id="status-draft-text">草稿已保存</div>'
        + (draftCount > 0 ? '    <div class="chat-conv-status-arrow">' + draftCount + '条草稿 ›</div>' : '')
        + '  </div>'
        // 消息列表
        + '  <div class="chat-conv-messages" id="chat-message-list">'
        + _renderWelcomeMessage()
        + '  </div>'
        // 快捷回复行
        + '  <div class="chat-quick-replies" id="chat-quick-replies">'
        + '    <button class="chat-quick-reply-btn" data-reply="＋另一件事">＋另一件事</button>'
        + '    <button class="chat-quick-reply-btn" data-reply="补充刚才">补充刚才</button>'
        + '    <button class="chat-quick-reply-btn" data-reply="记录进步">记录进步</button>'
        + '  </div>'
        + '  <div class="chat-quick-replies-toggle" id="chat-toggle-replies">⌃</div>'
        // 底部输入区
        + '  <div class="chat-conv-input-area">'
        + '    <button class="chat-conv-btn-plus" id="btn-chat-plus">＋</button>'
        + '    <div class="chat-conv-editor" id="chat-editor" contenteditable="true" '
        + '         data-placeholder="说说今天发生的事…"></div>'
        + (voiceSupported
          ? '    <button class="chat-conv-btn-voice" id="btn-chat-voice" title="按住录音">🎤</button>'
          : '')
        + '    <button class="chat-conv-btn-send" id="btn-chat-send" disabled>➤</button>'
        + '  </div>'
        + '</div>';

      // 绑定输入区事件
      _bindInputEvents();
      // 绑定快捷回复
      _bindQuickReplies();
      // 绑定语音输入
      if (voiceSupported) _bindVoiceInput();
      // 滚动到底部
      _scrollToBottom();
    },

    /**
     * 渲染整理确认页（路由 #chat-review）
     */
    renderReview: function () {
      var container = document.getElementById('chat-review');
      if (!container) return;
      if (container.querySelector('.chat-review-ready')) return;

      var session = _activeSession;
      var _drafts = session ? session.drafts.filter(function (d) { return d.status !== 'discarded'; }) : [];
      if (!session || _drafts.length === 0) {
        _drafts = _getDemoDrafts();
      }

      var totalCount = _drafts.length;
      var pendingCount = _drafts.filter(function (d) { return d.status === 'pending'; }).length;
      var confirmedCount = _drafts.filter(function (d) { return d.status === 'confirmed'; }).length;

      var html = ''
        + '<div class="chat-page-container chat-review-ready">'
        + '  <div class="chat-review-topbar">'
        + '    <button class="chat-review-btn-back" id="btn-review-back">‹</button>'
        + '    <div class="chat-review-title">本次整理</div>'
        + '  </div>'
        + '  <div class="chat-review-info-bar">'
        + '    <span class="chat-review-info-count">共' + totalCount + '条记录</span>'
        + '    <span class="chat-review-info-legend">'
        + '      <span><span class="chat-review-legend-dot orange"></span>待确认 ' + pendingCount + '</span>'
        + '      <span><span class="chat-review-legend-dot green"></span>已确认 ' + confirmedCount + '</span>'
        + '    </span>'
        + '  </div>'
        + '  <div class="chat-review-list" id="review-list">';

      _drafts.forEach(function (draft, idx) {
        var isConfirmed = draft.status === 'confirmed';
        var cardClass = isConfirmed ? 'confirmed' : 'pending';
        var statusText = isConfirmed ? '已确认' : '待确认';

        html += ''
          + '<div class="chat-review-draft-card ' + cardClass + '" data-draft-id="' + draft.id + '">'
          + '  <div class="chat-review-draft-header">'
          + '    <span class="chat-review-draft-status">' + statusText + '</span>'
          + '    <button class="chat-review-draft-menu" data-action="menu" data-draft-id="' + draft.id + '">···</button>'
          + '  </div>'
          + '  <div class="chat-review-draft-body">'
          + '    <div class="chat-review-draft-title">' + _escapeHtml(draft.title) + '</div>';

        if (isConfirmed) {
          html += '    <div class="chat-review-draft-confirmed-note">✓ 已确认等待统一保存</div>';
        } else {
          html += '    <div class="chat-review-draft-summary">' + _escapeHtml(draft.content || '') + '</div>';
          html += '    <div class="chat-review-draft-fields">'
            + '      <div class="chat-review-draft-field">'
            + '        <div class="chat-review-draft-field-label">具体内容</div>'
            + '        <textarea class="chat-review-draft-field-input" rows="2" data-field="content">' + _escapeHtml(draft.content || '') + '</textarea>'
            + '      </div>'
            + '    </div>';
        }

        html += '  </div>'
          + '  <div class="chat-review-draft-actions">';

        if (!isConfirmed) {
          html += '    <button class="chat-review-btn-modify" data-action="modify" data-draft-id="' + draft.id + '">修改</button>'
            + '    <button class="chat-review-btn-confirm" data-action="confirm" data-draft-id="' + draft.id + '">确认保存</button>';
        } else {
          html += '    <button class="chat-review-btn-modify" data-action="modify" data-draft-id="' + draft.id + '">修改</button>';
        }
        html += '    <button class="chat-review-btn-detail" data-action="detail" data-draft-id="' + draft.id + '">查看详情</button>';
        html += '  </div>'
          + '</div>';
      });

      html += ''
        + '  </div>'
        + '  <div class="chat-review-bottom-bar">'
        + '    <button class="chat-review-btn-confirm-all" id="btn-confirm-all" ' + (pendingCount === 0 ? 'disabled' : '') + '>确认全部待确认记录</button>'
        + '    <button class="chat-review-btn-later" id="btn-later">稍后处理</button>'
        + '  </div>'
        + '</div>';

      container.innerHTML = html;

      _bindReviewEvents();
    },

    /**
     * 加载已有会话继续对话
     */
    loadSession: function (sessionId) {
      var session = ChatBot.loadSession(sessionId);
      if (!session) {
        _showToast('会话不存在');
        return;
      }
      _activeSession = session;
      localStorage.setItem(LAST_SESSION_KEY, sessionId);
      window.location.hash = 'chat-conversation';
    },

    /**
     * 获取所有草稿（跨会话）
     */
    getAllPendingDrafts: function () {
      var allDrafts = [];
      var summaries = _getSessionSummaries();
      summaries.forEach(function (s) {
        var session = ChatBot.loadSession(s.id);
        if (session) {
          var pending = session.drafts.filter(function (d) { return d.status === 'pending'; });
          allDrafts = allDrafts.concat(pending);
        }
      });
      return allDrafts;
    }
  };

  /* ==========================================================
   * 内部辅助函数
   * ========================================================== */

  function _getYouthId() {
    var DataStore = window.DataStore;
    if (!DataStore) return 'u_sample_youth';
    var users = DataStore.getAllUsers ? DataStore.getAllUsers() : [];
    var youth = users.find(function (u) { return u.role === 'youth'; });
    return youth ? youth.id : 'u_sample_youth';
  }

  function _getYouthName() {
    var DataStore = window.DataStore;
    if (!DataStore) return '小宇';
    var users = DataStore.getAllUsers ? DataStore.getAllUsers() : [];
    var youth = users.find(function (u) { return u.role === 'youth'; });
    if (youth) return youth.name || '小宇';
    var constants = window.Constants;
    if (constants && constants.basicInfo) return constants.basicInfo.name || '小宇';
    return '小宇';
  }

  function _getYouthProfile() {
    var DataStore = window.DataStore;
    if (!DataStore) return { name: '小宇' };
    var users = DataStore.getAllUsers ? DataStore.getAllUsers() : [];
    var youth = users.find(function (u) { return u.role === 'youth'; });
    if (youth) return youth;
    var constants = window.Constants;
    if (constants && constants.basicInfo) return constants.basicInfo;
    return { name: '小宇' };
  }

  function _getPendingCount() {
    var allDrafts = ChatUI.getAllPendingDrafts();
    return allDrafts.length;
  }

  function _getActiveDraftCount() {
    if (!_activeSession) return 0;
    return _activeSession.drafts.filter(function (d) { return d.status !== 'discarded'; }).length;
  }

  function _escapeHtml(str) {
    if (!str) return '';
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /**
   * 检查语音输入是否可用
   */
  function _isVoiceSupported() {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  /* ==========================================================
   * 对话持久化 — 会话摘要列表
   * ========================================================== */

  function _getSessionSummaries() {
    try {
      var raw = localStorage.getItem(SESSIONS_KEY);
      if (!raw) return [];
      var sessions = JSON.parse(raw);

      return sessions
        .filter(function (s) { return s.messages && s.messages.length > 0; })
        .map(function (s) {
          var firstUser = (s.messages || []).find(function (m) { return m.role === 'user'; });
          var lastMsg = s.messages[s.messages.length - 1];
          return {
            id: s.id,
            startTime: s.startTime,
            endTime: s.endTime,
            messageCount: s.messages.length,
            draftCount: (s.drafts || []).length,
            firstText: firstUser ? firstUser.text : '(新对话)',
            lastPreview: lastMsg ? lastMsg.text.substring(0, 50) : ''
          };
        })
        .sort(function (a, b) {
          // 按时间倒序（最新的在前）
          return (b.startTime || '').localeCompare(a.startTime || '');
        });
    } catch (e) {
      return [];
    }
  }

  function _renderHistoryList() {
    var summaries = _getSessionSummaries();
    if (summaries.length === 0) return '';

    var html = '<div class="chat-history-section"><div class="chat-history-title">最近对话</div>';
    summaries.slice(0, 10).forEach(function (s) {
      var timeLabel = _formatSessionTime(s.startTime);
      html += ''
        + '<div class="chat-history-item" data-session-id="' + s.id + '">'
        + '  <div class="chat-history-item-info">'
        + '    <div class="chat-history-item-preview">' + _escapeHtml(s.firstText.substring(0, 30)) + '</div>'
        + '    <div class="chat-history-item-meta">' + timeLabel + ' · ' + s.messageCount + '条消息'
        + (s.draftCount > 0 ? ' · ' + s.draftCount + '条草稿' : '')
        + '    </div>'
        + '  </div>'
        + '  <div class="chat-history-item-arrow">›</div>'
        + '</div>';
    });
    html += '</div>';
    return html;
  }

  function _formatSessionTime(isoStr) {
    if (!isoStr) return '';
    var d = new Date(isoStr);
    var now = new Date();
    var diffMs = now - d;
    var diffMin = Math.floor(diffMs / 60000);

    if (diffMin < 1) return '刚刚';
    if (diffMin < 60) return diffMin + '分钟前';

    var diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return diffHr + '小时前';

    var diffDay = Math.floor(diffHr / 24);
    if (diffDay === 1) return '昨天';
    if (diffDay < 7) return diffDay + '天前';

    return (d.getMonth() + 1) + '/' + d.getDate();
  }

  function _bindHistoryEvents() {
    var items = document.querySelectorAll('.chat-history-item');
    items.forEach(function (item) {
      item.addEventListener('click', function () {
        var sid = this.getAttribute('data-session-id');
        if (sid) ChatUI.loadSession(sid);
      });
    });
  }

  /* ==========================================================
   * 渲染欢迎消息 / 历史消息
   * ========================================================== */

  function _renderWelcomeMessage() {
    var youthName = _getYouthName();
    var dateStr = _getDateStr();
    var session = _activeSession;
    var messages = session ? session.messages : [];

    if (messages.length === 0) {
      // 发送欢迎消息
      var youthProfile = _getYouthProfile();
      var welcomeText = '你好！我是 AI 懂我助手 🌻，今天想和你聊聊' + youthName + '最近的情况。';
      if (session) {
        session.messages.push({
          role: 'ai',
          text: welcomeText,
          module: null,
          timestamp: new Date().toISOString()
        });
        _saveSession();
      }

      return ''
        + '<div class="chat-date-divider"><span>' + dateStr + '</span></div>'
        + '<div class="chat-bubble-ai">' + _escapeHtml(welcomeText) + '</div>'
        + '<div class="chat-bubble-ai">最近' + youthName + '有什么让你印象特别深的事吗？</div>';
    }

    // 渲染历史消息
    var html = '';
    var lastDate = '';
    messages.forEach(function (msg) {
      var msgDate = _formatMsgDate(msg.timestamp);
      if (msgDate !== lastDate) {
        lastDate = msgDate;
        html += '<div class="chat-date-divider"><span>' + msgDate + '</span></div>';
      }

      if (msg.role === 'ai') {
        html += '<div class="chat-bubble-ai">' + _renderMessageContent(msg.text) + '</div>';
      } else if (msg.role === 'user') {
        html += '<div class="chat-bubble-user">' + _escapeHtml(msg.text) + '</div>';
      } else if (msg.role === 'system') {
        html += '<div class="chat-system-msg"><span>' + _escapeHtml(msg.text) + '</span></div>';
      }
    });

    // 渲染草稿卡片
    if (session) {
      var drafts = session.drafts.filter(function (d) { return d.status !== 'discarded'; });
      drafts.forEach(function (draft) {
        html += ''
          + '<div class="chat-draft-card">'
          + '  <div class="chat-draft-card-info">'
          + '    <div class="chat-draft-card-title">' + _escapeHtml(draft.title) + '</div>'
          + '    <div class="chat-draft-card-summary">' + _escapeHtml((draft.content || '').substring(0, 50)) + '</div>'
          + '  </div>'
          + '  <div class="chat-draft-card-arrow">›</div>'
          + '</div>';
      });
    }

    return html;
  }

  function _renderMessageContent(text) {
    if (!text) return '';
    if (typeof window.ChatMarkdown !== 'undefined') {
      return window.ChatMarkdown.render(text);
    }
    return _escapeHtml(text).replace(/\n/g, '<br>');
  }

  function _getDateStr() {
    var now = new Date();
    return '今天 ' + (now.getMonth() + 1) + '月' + now.getDate() + '日';
  }

  function _formatMsgDate(isoStr) {
    if (!isoStr) return '';
    var d = new Date(isoStr);
    var now = new Date();
    if (d.toDateString() === now.toDateString()) return '今天 ' + (d.getMonth() + 1) + '月' + d.getDate() + '日';
    var yest = new Date(now);
    yest.setDate(yest.getDate() - 1);
    if (d.toDateString() === yest.toDateString()) return '昨天';
    return (d.getMonth() + 1) + '月' + d.getDate() + '日';
  }

  /* ==========================================================
   * 事件绑定
   * ========================================================== */

  function _bindInputEvents() {
    var editor = document.getElementById('chat-editor');
    var sendBtn = document.getElementById('btn-chat-send');
    var plusBtn = document.getElementById('btn-chat-plus');
    var backBtn = document.getElementById('btn-chat-back');
    var endBtn = document.getElementById('btn-chat-end');
    var statusBar = document.getElementById('status-bar-drafts');
    var toggleBtn = document.getElementById('chat-toggle-replies');

    // 输入内容变化 → 控制发送按钮
    if (editor && sendBtn) {
      editor.addEventListener('input', function () {
        var text = editor.innerText.trim();
        sendBtn.disabled = (text.length === 0);
      });

      // Enter 发送，Shift+Enter 换行
      editor.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          var text = editor.innerText.trim();
          if (text) {
            _handleSend(text);
            editor.innerHTML = '';
            sendBtn.disabled = true;
          }
        }
      });
    }

    // 发送按钮
    if (sendBtn) {
      sendBtn.addEventListener('click', function () {
        if (!editor) return;
        var text = editor.innerText.trim();
        if (text) {
          _handleSend(text);
          editor.innerHTML = '';
          sendBtn.disabled = true;
        }
      });
    }

    // + 按钮
    if (plusBtn) {
      plusBtn.addEventListener('click', function () {
        if (editor) editor.focus();
      });
    }

    // 返回按钮
    if (backBtn) {
      backBtn.addEventListener('click', function () {
        window.location.hash = 'chat';
      });
    }

    // 结束按钮
    if (endBtn) {
      endBtn.addEventListener('click', function () {
        if (confirm('确定要结束当前对话吗？已生成的草稿可以在整理页面查看。')) {
          if (_activeSession) {
            _activeSession.endSession();
          }
          window.location.hash = 'chat-review';
        }
      });
    }

    // 状态栏点击 → 跳转整理页
    if (statusBar) {
      statusBar.addEventListener('click', function () {
        window.location.hash = 'chat-review';
      });
    }

    // 快捷回复折叠
    if (toggleBtn) {
      toggleBtn.addEventListener('click', function () {
        var replies = document.getElementById('chat-quick-replies');
        if (!replies) return;
        _quickRepliesVisible = !_quickRepliesVisible;
        if (_quickRepliesVisible) {
          replies.classList.remove('collapsed');
          toggleBtn.textContent = '⌃';
        } else {
          replies.classList.add('collapsed');
          toggleBtn.textContent = '⌄';
        }
      });
    }
  }

  function _bindQuickReplies() {
    var replies = document.querySelectorAll('#chat-quick-replies .chat-quick-reply-btn');
    replies.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var text = this.getAttribute('data-reply') || '';
        if (text === '＋另一件事') {
          text = '还有另一件事想记录';
        } else if (text === '补充刚才') {
          text = '我想补充一下刚才说的';
        } else if (text === '记录进步') {
          text = '小宇今天有一个进步';
        }
        _handleSend(text);
        var editor = document.getElementById('chat-editor');
        if (editor) editor.innerHTML = '';
        var sendBtn = document.getElementById('btn-chat-send');
        if (sendBtn) sendBtn.disabled = true;
      });
    });
  }

  /* ==========================================================
   * 语音输入（Web Speech API）
   * ========================================================== */

  function _bindVoiceInput() {
    var voiceBtn = document.getElementById('btn-chat-voice');
    if (!voiceBtn) return;

    var recognition = null;
    var isRecording = false;

    // 初始化语音识别
    var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    recognition = new SpeechRecognition();
    recognition.lang = 'zh-CN';
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = function (event) {
      var transcript = '';
      for (var i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }

      // 填入输入框
      var editor = document.getElementById('chat-editor');
      if (editor) {
        editor.textContent = transcript;
        editor.focus();

        // 触发 input 事件以更新发送按钮状态
        var event_ = new Event('input', { bubbles: true });
        editor.dispatchEvent(event_);
      }
    };

    recognition.onerror = function (event) {
      console.warn('语音识别错误:', event.error);
      isRecording = false;
      voiceBtn.classList.remove('recording');

      if (event.error === 'aborted' || event.error === 'no-speech') {
        _showToast('未识别到语音');
      }
    };

    recognition.onend = function () {
      isRecording = false;
      voiceBtn.classList.remove('recording');
    };

    // 按住录音，松开发送
    voiceBtn.addEventListener('mousedown', function (e) {
      e.preventDefault();
      if (isRecording) return;
      try {
        recognition.start();
        isRecording = true;
        voiceBtn.classList.add('recording');
      } catch (err) {
        // 已在录制中，忽略
      }
    });

    voiceBtn.addEventListener('mouseup', function (e) {
      e.preventDefault();
      if (isRecording) {
        recognition.stop();
      }
    });

    voiceBtn.addEventListener('mouseleave', function () {
      if (isRecording) {
        recognition.stop();
      }
    });

    // 触摸事件（移动端）
    voiceBtn.addEventListener('touchstart', function (e) {
      e.preventDefault();
      if (isRecording) return;
      try {
        recognition.start();
        isRecording = true;
        voiceBtn.classList.add('recording');
      } catch (err) {}
    });

    voiceBtn.addEventListener('touchend', function (e) {
      e.preventDefault();
      if (isRecording) {
        recognition.stop();
      }
    });
  }

  /* ==========================================================
   * 发送消息（流式渲染核心）
   * ========================================================== */

  function _handleSend(text) {
    var session = _activeSession;
    if (!session) return;

    var editor = document.getElementById('chat-editor');
    var sendBtn = document.getElementById('btn-chat-send');

    // 禁用输入
    if (editor) editor.contentEditable = 'false';
    if (sendBtn) sendBtn.disabled = true;

    // 添加用户气泡
    _addMessageBubble('user', text);

    // 添加用户消息到会话
    var classification = Classifier.classifyMessage(text);
    session.messages.push({
      role: 'user',
      text: text,
      module: classification.module,
      timestamp: new Date().toISOString(),
      confidence: classification.confidence
    });

    _saveSession();

    // 更新保存状态
    _updateSavingStatus('AI思考中...');

    // 创建空的 AI 气泡用于流式渲染
    var streamBubble = _createStreamBubble();
    var fullReply = '';

    // 获取青年档案
    var youthProfile = _getYouthProfile();

    // 调用流式 API
    if (ApiProvider && typeof ApiProvider.generateReplyStream === 'function') {
      ApiProvider.generateReplyStream(
        session.messages,
        youthProfile,
        // onChunk — 逐块追加
        function (chunk, fullText) {
          if (fullText !== undefined) {
            fullReply = fullText;
          } else {
            fullReply = chunk; // fallback：非流式直接给全文
          }

          // 更新气泡内文（用 markdown 渲染）
          if (streamBubble) {
            streamBubble.innerHTML = _renderMessageContent(fullReply);
            // 如果正在流式输出，添加打字光标
            if (fullText !== undefined) {
              streamBubble.classList.add('streaming');
            } else {
              streamBubble.classList.remove('streaming');
            }
          }
          _scrollToBottom();
        },
        // onDone — 完成
        function (finalText, isFallback) {
          var reply = finalText || fullReply;

          // 移除流式光标
          if (streamBubble) {
            streamBubble.classList.remove('streaming');
            streamBubble.innerHTML = _renderMessageContent(reply);
          }

          // 添加 AI 消息到会话
          session.messages.push({
            role: 'ai',
            text: reply,
            module: null,
            timestamp: new Date().toISOString()
          });

          _saveSession();

          // 触发归类 + 草稿判断
          _afterAIResponse(session, reply, classification);

          // 恢复输入
          _restoreInput(editor, sendBtn);
          _updateSavingStatus('草稿已保存');
        },
        // onError — 失败
        function (error) {
          // 失败 → 红色气泡 + 重试按钮
          if (streamBubble) {
            streamBubble.classList.add('chat-bubble-error');
            streamBubble.innerHTML = ''
              + '<div class="chat-error-text">⚠️ ' + (error.message || 'AI 回复失败') + '</div>'
              + '<button class="chat-error-retry-btn" data-retry-text="' + _escapeHtml(text) + '">重新发送</button>';
          }

          // 回退：用 TemplateProvider 自动生成
          var fallbackReply = '';
          try {
            fallbackReply = window.ChatbotProviders.TemplateProvider.generateReply(session.messages, youthProfile);
          } catch (e) {
            fallbackReply = '好的，我记下了。还有什么想补充的吗？';
          }

          // 添加回退消息到会话
          session.messages.push({
            role: 'ai',
            text: fallbackReply,
            module: null,
            timestamp: new Date().toISOString(),
            _fallback: true
          });

          _saveSession();

          // 追加一条系统提示气泡（回退说明）
          _addMessageBubble('ai', fallbackReply);

          _restoreInput(editor, sendBtn);
          _updateSavingStatus('已回退模板回复');
          _showToast('API 失败，已使用模板回复');
        }
      );
    } else {
      // 没有 ApiProvider，直接用旧逻辑
      setTimeout(function () {
        var result = session.sendMessage(text);
        if (streamBubble) {
          streamBubble.innerHTML = _renderMessageContent(result.reply);
        }

        if (result.draftsGenerated && result.draftsGenerated.length > 0) {
          result.draftsGenerated.forEach(function (draft) {
            _addDraftCard(draft);
          });
          _addSystemMsg('AI已自动生成' + result.draftsGenerated.length + '条草稿记录');
        }

        _updateDraftCount();
        _updateSavingStatus('草稿已保存');

        _restoreInput(editor, sendBtn);
        _scrollToBottom();
      }, 800);
    }
  }

  /**
   * 创建流式气泡（空壳）
   */
  function _createStreamBubble() {
    var msgList = document.getElementById('chat-message-list');
    if (!msgList) return null;

    var bubble = document.createElement('div');
    bubble.className = 'chat-bubble-ai chat-stream-bubble streaming';
    bubble.id = 'chat-stream-bubble';
    bubble.textContent = ''; // 空的

    msgList.appendChild(bubble);
    _scrollToBottom();

    // 绑定重试按钮（事件委托）
    bubble.addEventListener('click', function (e) {
      var retryBtn = e.target.closest('.chat-error-retry-btn');
      if (!retryBtn) return;

      var retryText = retryBtn.getAttribute('data-retry-text');
      if (!retryText) return;

      // 移除错误气泡
      if (bubble.parentNode) bubble.parentNode.removeChild(bubble);

      // 重新发送
      _handleSend(retryText);
    });

    return bubble;
  }

  /**
   * AI 回复完成后的处理：归类 + 草稿判断
   */
  function _afterAIResponse(session, reply, classification) {
    // 检查是否包含 #DRAFT 标记
    if (reply.indexOf('#DRAFT') !== -1) {
      // 尝试生成草稿
      var draftModules = ['communication', 'emotion', 'care', 'work'];
      draftModules.forEach(function (modKey) {
        var existingDrafts = session.drafts.filter(function (d) {
          return d.module === modKey && d.status !== 'discarded';
        });

        if (existingDrafts.length === 0) {
          var newDraft = session.generateDraft(modKey);
          if (newDraft) {
            _addDraftCard(newDraft);
          }
        }
      });

      _addSystemMsg('AI检测到记录要点，已自动生成草稿');
      _updateDraftCount();
    }

    // 在当前模块有新消息时尝试生成草稿
    if (classification && classification.module && classification.confidence >= 0.3) {
      var moduleUserMsgs = session.messages.filter(function (m) {
        return m.role === 'user' && m.module === classification.module;
      });

      var existingDrafts = session.drafts.filter(function (d) {
        return d.module === classification.module && d.status !== 'discarded';
      });

      if (moduleUserMsgs.length >= 1 && existingDrafts.length === 0 && session.messages.length >= 2) {
        var newDraft = session.generateDraft(classification.module);
        if (newDraft) {
          _addDraftCard(newDraft);
          _updateDraftCount();
        }
      }
    }
  }

  /**
   * 恢复输入状态
   */
  function _restoreInput(editor, sendBtn) {
    if (editor) {
      editor.contentEditable = 'true';
      editor.focus();
    }
    if (sendBtn) {
      sendBtn.disabled = (editor ? editor.innerText.trim().length === 0 : true);
    }
  }

  /**
   * 保存当前会话
   */
  function _saveSession() {
    if (!_activeSession) return;
    _activeSession._save();
    localStorage.setItem(LAST_SESSION_KEY, _activeSession.id);
  }

  /* ==========================================================
   * 消息气泡操作
   * ========================================================== */

  function _addMessageBubble(role, text) {
    var msgList = document.getElementById('chat-message-list');
    if (!msgList) return;

    var bubble = document.createElement('div');
    bubble.className = role === 'ai' ? 'chat-bubble-ai' : 'chat-bubble-user';
    if (role === 'ai') {
      bubble.innerHTML = _renderMessageContent(text);
    } else {
      bubble.textContent = text;
    }
    msgList.appendChild(bubble);
    _scrollToBottom();
  }

  function _addDraftCard(draft) {
    var msgList = document.getElementById('chat-message-list');
    if (!msgList) return;

    var card = document.createElement('div');
    card.className = 'chat-draft-card';
    card.innerHTML = ''
      + '<div class="chat-draft-card-info">'
      + '  <div class="chat-draft-card-title">' + _escapeHtml(draft.title) + '</div>'
      + '  <div class="chat-draft-card-summary">' + _escapeHtml((draft.content || '').substring(0, 50)) + '</div>'
      + '</div>'
      + '<div class="chat-draft-card-arrow">›</div>';
    msgList.appendChild(card);
  }

  function _addSystemMsg(text) {
    var msgList = document.getElementById('chat-message-list');
    if (!msgList) return;

    var sys = document.createElement('div');
    sys.className = 'chat-system-msg';
    sys.innerHTML = '<span>' + _escapeHtml(text) + '</span>';
    msgList.appendChild(sys);
  }

  function _scrollToBottom() {
    setTimeout(function () {
      var msgList = document.getElementById('chat-message-list');
      if (msgList) msgList.scrollTop = msgList.scrollHeight;
    }, 50);
  }

  function _updateSavingStatus(text) {
    var el = document.getElementById('status-draft-text');
    if (el) el.textContent = text;
  }

  function _updateDraftCount() {
    var count = _getActiveDraftCount();
    var statusBar = document.getElementById('status-bar-drafts');
    if (!statusBar) return;

    var arrow = statusBar.querySelector('.chat-conv-status-arrow');
    if (count > 0) {
      if (!arrow) {
        arrow = document.createElement('div');
        arrow.className = 'chat-conv-status-arrow';
        statusBar.appendChild(arrow);
      }
      arrow.textContent = count + '条草稿 ›';
    } else {
      if (arrow) arrow.remove();
    }
  }

  function _showAllRecords() {
    _showToast('聊天记录功能即将上线');
  }

  /* ==========================================================
   * 整理确认页事件
   * ========================================================== */

  function _bindReviewEvents() {
    var backBtn = document.getElementById('btn-review-back');
    var confirmAllBtn = document.getElementById('btn-confirm-all');
    var laterBtn = document.getElementById('btn-later');

    if (backBtn) {
      backBtn.addEventListener('click', function () {
        window.location.hash = 'chat';
      });
    }

    if (laterBtn) {
      laterBtn.addEventListener('click', function () {
        window.location.hash = 'chat';
      });
    }

    if (confirmAllBtn) {
      confirmAllBtn.addEventListener('click', function () {
        _handleConfirmAll();
      });
    }

    var cards = document.querySelectorAll('#review-list .chat-review-draft-card');
    cards.forEach(function (card) {
      var body = card.querySelector('.chat-review-draft-body');
      if (body) {
        body.addEventListener('click', function (e) {
          if (e.target.tagName === 'BUTTON') return;
          card.classList.toggle('expanded');
        });
      }

      var menuBtn = card.querySelector('[data-action="menu"]');
      if (menuBtn) {
        menuBtn.addEventListener('click', function (e) {
          e.stopPropagation();
          _showDraftMenu(e, card);
        });
      }

      var modifyBtn = card.querySelector('[data-action="modify"]');
      if (modifyBtn) {
        modifyBtn.addEventListener('click', function (e) {
          e.stopPropagation();
          card.classList.add('expanded');
        });
      }

      var confirmBtn = card.querySelector('[data-action="confirm"]');
      if (confirmBtn) {
        confirmBtn.addEventListener('click', function (e) {
          e.stopPropagation();
          _handleDraftConfirm(card);
        });
      }

      var detailBtn = card.querySelector('[data-action="detail"]');
      if (detailBtn) {
        detailBtn.addEventListener('click', function (e) {
          e.stopPropagation();
          _showToast('详情查看即将上线');
        });
      }
    });
  }

  function _handleDraftConfirm(card) {
    var draftId = card.getAttribute('data-draft-id');
    if (!_activeSession || !draftId) return;

    var textareas = card.querySelectorAll('.chat-review-draft-field-input');
    var updates = {};
    textareas.forEach(function (ta) {
      var field = ta.getAttribute('data-field');
      if (field === 'content') {
        updates.content = ta.value.trim();
      }
    });

    if (Object.keys(updates).length > 0) {
      _activeSession.editDraft(draftId, updates);
    }
    _activeSession.confirmDraft(draftId);

    _refreshReviewUI();
    _showToast('已确认保存');
  }

  function _handleConfirmAll() {
    if (!_activeSession) {
      _showToast('没有活跃会话');
      return;
    }

    var pendingDrafts = _activeSession.drafts.filter(function (d) { return d.status === 'pending'; });
    pendingDrafts.forEach(function (d) {
      _activeSession.confirmDraft(d.id);
    });

    _showSuccessDialog(pendingDrafts.length);
  }

  function _showDraftMenu(e, card) {
    var draftId = card.getAttribute('data-draft-id');

    var oldPopup = document.querySelector('.chat-draft-menu-popup');
    if (oldPopup) oldPopup.remove();

    var menuBtn = e.target;
    var popup = document.createElement('div');
    popup.className = 'chat-draft-menu-popup';
    popup.innerHTML = ''
      + '<button class="chat-draft-menu-item" data-action="edit">编辑内容</button>'
      + '<button class="chat-draft-menu-item danger" data-action="discard">放弃记录</button>';

    var rect = menuBtn.getBoundingClientRect();
    popup.style.position = 'fixed';
    popup.style.top = rect.bottom + 4 + 'px';
    popup.style.right = (window.innerWidth - rect.right) + 'px';
    popup.style.zIndex = '200';

    document.body.appendChild(popup);

    popup.querySelector('[data-action="edit"]').addEventListener('click', function () {
      card.classList.add('expanded');
      popup.remove();
    });

    popup.querySelector('[data-action="discard"]').addEventListener('click', function () {
      if (_activeSession && draftId) {
        _activeSession.discardDraft(draftId);
      }
      popup.remove();
      _refreshReviewUI();
      _showToast('已放弃该记录');
    });

    setTimeout(function () {
      var closeFn = function (ev) {
        if (!popup.contains(ev.target) && ev.target !== menuBtn) {
          popup.remove();
          document.removeEventListener('click', closeFn);
        }
      };
      document.addEventListener('click', closeFn);
    }, 10);
  }

  function _refreshReviewUI() {
    var container = document.getElementById('chat-review');
    if (!container) return;
    var ready = container.querySelector('.chat-review-ready');
    if (ready) ready.remove();
    ChatUI.renderReview();
  }

  function _showSuccessDialog(count) {
    var old = document.getElementById('chat-success-overlay');
    if (old) old.remove();

    var overlay = document.createElement('div');
    overlay.className = 'chat-success-overlay';
    overlay.id = 'chat-success-overlay';
    overlay.innerHTML = ''
      + '<div class="chat-success-dialog">'
      + '  <div class="chat-success-icon">✓</div>'
      + '  <div class="chat-success-title">保存成功</div>'
      + '  <div class="chat-success-desc">' + count + '条记录已保存到小宇的支持档案中</div>'
      + '  <button class="chat-success-btn" id="btn-success-close">知道了</button>'
      + '</div>';

    document.body.appendChild(overlay);

    document.getElementById('btn-success-close').addEventListener('click', function () {
      overlay.remove();
      _refreshReviewUI();
    });

    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) {
        overlay.remove();
        _refreshReviewUI();
      }
    });
  }

  function _showToast(msg) {
    if (typeof window.showToast === 'function') {
      window.showToast(msg);
      return;
    }

    var toast = document.createElement('div');
    toast.className = 'app-toast show';
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(function () {
      toast.classList.remove('show');
      setTimeout(function () { toast.remove(); }, 300);
    }, 2000);
  }

  function _getDemoDrafts() {
    return [
      { id: 'demo-1', module: 'communication', title: '沟通观察', status: 'pending', content: '小雨最近喜欢用短句表达需求，能主动说出"要喝水"和"出去玩"' },
      { id: 'demo-2', module: 'work', title: '活动记录', status: 'confirmed', content: '小宇独立完成烘焙，专注度提升' },
      { id: 'demo-3', module: 'emotion', title: '情绪事件', status: 'pending', content: '小雨今天情绪稳定，在烘焙课上表现积极' }
    ];
  }

  window.ChatUI = ChatUI;

  // ========== 页面刷新时恢复最后活跃会话 ==========
  window.addEventListener('DOMContentLoaded', function () {
    // 如果已经在对话页面，尝试恢复会话
    var hash = window.location.hash.replace('#', '');
    if (hash === 'chat-conversation' || hash === 'chat-review') {
      var savedId = localStorage.getItem(LAST_SESSION_KEY);
      if (savedId) {
        var session = ChatBot.loadSession(savedId);
        if (session) {
          _activeSession = session;
        }
      }
    }
  });

})();
