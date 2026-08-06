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

  // ========== 有效 topicKey 白名单 ==========
  var VALID_TOPIC_KEYS = ['communication', 'emotion', 'care', 'work', 'life', 'relations'];

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
      var hasQuickActions = (lastSessionId && hasHistory) || pendingCount > 0;

      container.innerHTML = ''
        + '<div class="chat-page-container chat-home-ready">'
        // --- 问候区（紧凑居中） ---
        + '  <div class="chat-home-greeting">'
        + '    <div class="chat-home-avatar">🌻</div>'
        + '    <h2 class="chat-home-question">' + youthName + '，今天想记录什么？</h2>'
        + '    <p class="chat-home-hint">AI 会帮你把对话整理成草稿，说到哪儿算哪儿</p>'
        + '  </div>'
        // --- 主操作 ---
        + '  <button class="chat-home-btn-start" id="btn-start-chat">'
        + '    <span class="chat-home-btn-start-icon">💬</span>'
        + '    <span>开始聊天</span>'
        + '  </button>'
        // --- 快捷入口（继续对话 + 待确认） ---
        + (hasQuickActions
          ? '  <div class="chat-home-quick-row">'
          + (lastSessionId && hasHistory
            ? '    <button class="chat-home-quick-btn" id="btn-continue-chat">'
            + '      <span>📌 继续上次</span>'
            + '    </button>'
            : '')
          + (pendingCount > 0
            ? '    <button class="chat-home-quick-btn chat-home-quick-pending" id="card-pending-review">'
            + '      <span>📋 待确认</span>'
            + '      <span class="chat-home-quick-badge">' + pendingCount + '</span>'
            + '    </button>'
            : '')
          + '  </div>'
          : '')
        // --- 最近对话（精简版，最多 3 条） ---
        + (hasHistory ? _renderHistoryCompact() : '')
        // --- 底部 ---
        + '  <div class="chat-home-footer">AI懂我 · 心智障碍者动态支持档案</div>'
        + '</div>';

      var startBtn = document.getElementById('btn-start-chat');
      if (startBtn) {
        startBtn.addEventListener('click', function () { ChatUI._startNewConversation(); });
      }
      var continueBtn = document.getElementById('btn-continue-chat');
      if (continueBtn) {
        continueBtn.addEventListener('click', function () { ChatUI._continueLastConversation(); });
      }
      var pendingCard = document.getElementById('card-pending-review');
      if (pendingCard) {
        pendingCard.addEventListener('click', function () { window.location.hash = 'chat-review'; });
      }
      _bindHistoryEvents();
    },

    _startNewConversation: function () {
      var youthId = _getYouthId();
      _activeSession = ChatBot.createSession(youthId);
      localStorage.setItem(LAST_SESSION_KEY, _activeSession.id);
      window.location.hash = 'chat-conversation';
    },

    _continueLastConversation: function () {
      var sessionId = localStorage.getItem(LAST_SESSION_KEY);
      if (!sessionId) { _startNewConversation(); return; }
      var session = ChatBot.loadSession(sessionId);
      if (!session) { _startNewConversation(); return; }
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

      if (!_activeSession) {
        var savedId = localStorage.getItem(LAST_SESSION_KEY);
        if (savedId) { _activeSession = ChatBot.loadSession(savedId); }
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
        + '  <div class="chat-conv-topbar">'
        + '    <button class="chat-conv-btn-back" id="btn-chat-back">‹</button>'
        + '    <div class="chat-conv-title">' + youthName + ' · 本次记录</div>'
        + '    <button class="chat-conv-btn-end" id="btn-chat-end">结束</button>'
        + '  </div>'
        + '  <div class="chat-conv-status-bar" id="status-bar-drafts">'
        + '    <div class="chat-conv-status-avatar">✨</div>'
        + '    <div class="chat-conv-status-info">'
        + '      <span class="chat-conv-status-title">AI 记录助手</span>'
        + '      <span class="chat-conv-status-sub" id="status-draft-text">已自动保存</span>'
        + '    </div>'
        + (draftCount > 0 ? '    <div class="chat-conv-status-arrow" id="status-draft-count">' + draftCount + ' 条草稿 ›</div>' : '')
        + '  </div>'
        + '  <div class="chat-conv-messages" id="chat-message-list">' + _renderWelcomeMessage() + '  </div>'
        + '  <div class="chat-quick-replies" id="chat-quick-replies">'
        + '    <button class="chat-quick-reply-btn" data-reply="另一件事">另一件事</button>'
        + '    <button class="chat-quick-reply-btn" data-reply="补充刚才">补充刚才</button>'
        + '    <button class="chat-quick-reply-btn" data-reply="记录进步">记录一个进步</button>'
        + '  </div>'
        + '  <div class="chat-quick-replies-toggle" id="chat-toggle-replies">⌃</div>'
        + '  <div class="chat-conv-input-area">'
        + '    <button class="chat-conv-btn-plus" id="btn-chat-plus">＋</button>'
        + '    <div class="chat-conv-editor" id="chat-editor" contenteditable="true" data-placeholder="说说今天发生的事…"></div>'
        + (voiceSupported ? '    <button class="chat-conv-btn-voice" id="btn-chat-voice" title="按住录音">🎤</button>' : '')
        + '    <button class="chat-conv-btn-send" id="btn-chat-send" disabled>➤</button>'
        + '  </div>'
        + '</div>';

      _bindInputEvents();
      _bindQuickReplies();
      if (voiceSupported) _bindVoiceInput();
      _scrollToBottom();
    },

    /**
     * 渲染整理确认页（路由 #chat-review）
     * 三段式：第一步原始表达 → 第二步AI整理草稿 → 第三步归属主题/确认入档
     * AI 草稿不等于正式档案，确认后才写入 DataStore
     */
    renderReview: function () {
      var container = document.getElementById('chat-review');
      if (!container) return;
      if (container.querySelector('.chat-review-ready')) return;

      // SPA hash 导航时恢复活跃会话（始终取最新，避免旧 session 残留）
      var savedId = localStorage.getItem(LAST_SESSION_KEY);
      if (savedId && (!_activeSession || _activeSession.id !== savedId)) {
        _activeSession = ChatBot.loadSession(savedId);
      }

      var session = _activeSession;
      var _drafts = session ? session.drafts.filter(function (d) { return d.status !== 'discarded'; }) : [];
      if (!session || _drafts.length === 0) {
        _drafts = _getDemoDrafts();
      }

      var totalCount = _drafts.length;
      var pendingCount = _drafts.filter(function (d) { return d.status === 'pending'; }).length;
      var archivedCount = _drafts.filter(function (d) { return d.status === 'archived' || d.status === 'committed'; }).length;

      var html = ''
        + '<div class="chat-page-container chat-review-ready">'
        + '  <div class="chat-review-topbar">'
        + '    <button class="chat-review-btn-back" id="btn-review-back">‹</button>'
        + '    <div class="chat-review-title">本次整理</div>'
        + '  </div>'
        + '  <div class="chat-review-info-bar">'
        + '    <span class="chat-review-info-count">共 ' + totalCount + ' 条记录</span>'
        + '    <span class="chat-review-info-legend">'
        + '      <span><span class="chat-review-legend-dot orange"></span>待确认 ' + pendingCount + '</span>'
        + '      <span><span class="chat-review-legend-dot green"></span>已入档 ' + archivedCount + '</span>'
        + '    </span>'
        + '  </div>'
        + '  <div class="chat-review-hint-banner">💡 AI 只是整理，最终由你来确认</div>';

      if (totalCount === 0) {
        html += '<div class="chat-review-empty"><div class="chat-review-empty-icon">📋</div><p>暂无待整理记录</p></div>';
      }

      html += '  <div class="chat-review-list" id="review-list">';

      _drafts.forEach(function (draft) {
        var isArchived = draft.status === 'archived' || draft.status === 'committed';
        var isConfirmed = draft.status === 'confirmed' || isArchived;
        var cardClass = isConfirmed ? 'confirmed' : 'pending';
        var statusText = isArchived ? '已入档' : (isConfirmed ? '已确认' : '待确认');
        var moduleInfo = _getModuleInfo(draft.module);
        var sourceText = _getSourceText(draft.module);

        html += ''
          + '<div class="chat-review-draft-card ' + cardClass + '" data-draft-id="' + draft.id + '" data-module="' + (draft.module || '') + '">'
          + '  <div class="chat-review-draft-header">'
          + '    <span class="chat-review-draft-status ' + cardClass + '">' + statusText + '</span>'
          + (moduleInfo ? '    <span class="chat-review-draft-module">' + moduleInfo.icon + ' ' + moduleInfo.label + '</span>' : '')
          + '  </div>'

          // ── 第一步：原始表达（只读）──
          + '  <div class="dr-step-section">'
          + '    <div class="dr-step-badge">1</div>'
          + '    <div class="chat-review-step-label">📝 原始表达</div>'
          + '    <div class="chat-review-step-content read-only">'
          + (sourceText ? _escapeHtml(sourceText) : '<span class="chat-review-empty-hint">暂无对话内容</span>')
          + '    </div>'
          + '  </div>'

          // ── 第二步：AI整理草稿（待确认可编辑 / 已确认只读）──
          + '  <div class="dr-step-section">'
          + '    <div class="dr-step-badge">2</div>'
          + '    <div class="chat-review-step-label">🤖 AI整理草稿</div>'
          + '    <div class="chat-review-step-hint">AI 自动整理，不代表专业判断。请核实后修改。</div>';

        if (isConfirmed) {
          html += '    <div class="chat-review-step-content">'
            + '      <div class="chat-review-draft-field"><div class="chat-review-draft-field-label">标题</div><div class="chat-review-draft-field-value">' + _escapeHtml(draft.title || '') + '</div></div>'
            + '      <div class="chat-review-draft-field"><div class="chat-review-draft-field-label">内容</div><div class="chat-review-draft-field-value">' + _escapeHtml(draft.content || '') + '</div></div>'
            + '    </div>';
        } else {
          html += '    <div class="chat-review-step-content">'
            + '      <div class="chat-review-draft-field"><div class="chat-review-draft-field-label">标题</div><input class="chat-review-draft-field-input" value="' + _escapeHtml(draft.title || '') + '" data-field="title" data-draft-id="' + draft.id + '"></div>'
            + '      <div class="chat-review-draft-field"><div class="chat-review-draft-field-label">内容摘要</div><textarea class="chat-review-draft-field-input" rows="3" data-field="content" data-draft-id="' + draft.id + '">' + _escapeHtml(draft.content || '') + '</textarea></div>'
            + '    </div>';
        }

        html += '  </div>'

          // ── 第三步：归属主题 / 确认入档 ──
          + '  <div class="dr-step-section">'
          + '    <div class="dr-step-badge">3</div>'
          + '    <div class="chat-review-step-label">📂 归属主题 / 确认入档</div>';

        if (isConfirmed) {
          html += '    <div class="chat-review-step-content">'
            + '      <div class="chat-review-draft-field"><div class="chat-review-draft-field-label">归属主题</div><div class="chat-review-draft-field-value">' + (moduleInfo ? moduleInfo.icon + ' ' + moduleInfo.label : (draft.module || '')) + '</div></div>'
            + '    </div>';
        } else {
          html += '    <div class="chat-review-step-content">'
            + '      <div class="chat-review-draft-field"><div class="chat-review-draft-field-label">归属主题</div><select class="chat-review-module-select" data-draft-id="' + draft.id + '">'
            +         _buildModuleOptions(draft.module)
            + '      </select></div>'
            + '      <div class="chat-review-step-hint confirm-warn">⚠️ 点击确认后才会写入正式档案</div>'
            + '    </div>';
        }

        html += '  </div>'

          // ── 操作按钮 ──
          + '  <div class="chat-review-draft-actions">';
        if (!isConfirmed) {
          html += '    <button class="chat-review-btn-confirm" data-action="confirm" data-draft-id="' + draft.id + '">确认保存</button>'
            + '    <button class="chat-review-btn-discard" data-action="discard" data-draft-id="' + draft.id + '">放弃</button>';
        }
        if (isArchived) {
          html += '    <button class="chat-review-btn-view-topic" data-action="view-topic" data-topic="' + (draft.module || '') + '">📋 查看已入档记录</button>';
        }
        html += '    <button class="chat-review-btn-detail" data-action="detail" data-draft-id="' + draft.id + '">返回原对话</button>'
          + '  </div>'
          + '</div>';
      });

      html += ''
        + '  </div>'
        + '  <div class="chat-review-bottom-bar">'
        + '    <button class="chat-review-btn-confirm-all" id="btn-confirm-all" ' + (pendingCount === 0 ? 'disabled' : '') + '>确认所选记录并保存</button>'
        + '    <button class="chat-review-btn-later" id="btn-later">稍后处理</button>'
        + '  </div>'
        + '</div>';

      container.innerHTML = html;
      _bindReviewEvents();
    },

    loadSession: function (sessionId) {
      var session = ChatBot.loadSession(sessionId);
      if (!session) { _showToast('会话不存在'); return; }
      _activeSession = session;
      localStorage.setItem(LAST_SESSION_KEY, sessionId);
      window.location.hash = 'chat-conversation';
    },

    getAllPendingDrafts: function () {
      var allDrafts = [];
      var summaries = _getSessionSummaries();
      summaries.forEach(function (s) {
        var session = ChatBot.loadSession(s.id);
        if (session) {
          allDrafts = allDrafts.concat(session.drafts.filter(function (d) { return d.status === 'pending'; }));
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

  function _getModuleInfo(moduleKey) {
    if (!moduleKey) return null;
    var Modules = window.Modules;
    if (Modules && Modules[moduleKey]) {
      return { icon: Modules[moduleKey].icon, label: Modules[moduleKey].label, color: Modules[moduleKey].color };
    }
    var fallbacks = {
      communication: { icon: '💬', label: '沟通观察', color: '#9B85B8' },
      emotion: { icon: '🌊', label: '情绪事件', color: '#D4877B' },
      care: { icon: '💊', label: '照护记录', color: '#A8C9A0' },
      work: { icon: '💼', label: '活动记录', color: '#D4A85A' }
    };
    return fallbacks[moduleKey] || { icon: '📝', label: '一般记录', color: '#999' };
  }

  function _getPendingCount() {
    return ChatUI.getAllPendingDrafts().length;
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
            id: s.id, startTime: s.startTime, endTime: s.endTime,
            messageCount: s.messages.length, draftCount: (s.drafts || []).length,
            firstText: firstUser ? firstUser.text : '(新对话)',
            lastPreview: lastMsg ? lastMsg.text.substring(0, 50) : ''
          };
        })
        .sort(function (a, b) { return (b.startTime || '').localeCompare(a.startTime || ''); });
    } catch (e) { return []; }
  }

  function _renderHistoryList() {
    var summaries = _getSessionSummaries();
    if (summaries.length === 0) return '';
    var html = '<div class="chat-history-section"><div class="chat-history-title">最近对话</div>';
    summaries.slice(0, 10).forEach(function (s) {
      var timeLabel = _formatSessionTime(s.startTime);
      html += '<div class="chat-history-item" data-session-id="' + s.id + '">'
        + '  <div class="chat-history-item-info">'
        + '    <div class="chat-history-item-preview">' + _escapeHtml(s.firstText.substring(0, 30)) + '</div>'
        + '    <div class="chat-history-item-meta">' + timeLabel + ' · ' + s.messageCount + '条消息' + (s.draftCount > 0 ? ' · ' + s.draftCount + '条草稿' : '') + '</div>'
        + '  </div>'
        + '  <div class="chat-history-item-arrow">›</div>'
        + '</div>';
    });
    return html + '</div>';
  }

  function _renderHistoryCompact() {
    var summaries = _getSessionSummaries();
    if (summaries.length === 0) return '';
    var html = '<div class="chat-home-recent">'
      + '<div class="chat-home-recent-header"><span>最近</span><a class="chat-home-records-link" id="link-all-records">全部 ›</a></div>';
    summaries.slice(0, 3).forEach(function (s) {
      var timeLabel = _formatSessionTime(s.startTime);
      html += '<div class="chat-history-item" data-session-id="' + s.id + '">'
        + '  <div class="chat-history-item-icon">💬</div>'
        + '  <div class="chat-history-item-info">'
        + '    <div class="chat-history-item-preview">' + _escapeHtml(s.firstText.substring(0, 24)) + '</div>'
        + '    <div class="chat-history-item-meta">' + timeLabel + ' · ' + s.messageCount + '条消息' + (s.draftCount > 0 ? ' · ' + s.draftCount + '条草稿' : '') + '</div>'
        + '  </div>'
        + '  <div class="chat-history-item-arrow">›</div>'
        + '</div>';
    });
    return html + '</div>';
  }

  function _formatSessionTime(isoStr) {
    if (!isoStr) return '';
    var d = new Date(isoStr);
    var now = new Date();
    var diffMin = Math.floor((now - d) / 60000);
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
    document.querySelectorAll('.chat-history-item').forEach(function (item) {
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
      var welcomeText = '你好，我是' + youthName + '的记录助手 ✨。今天发生了什么想记下来的事吗？';
      if (session) {
        session.messages.push({ role: 'ai', text: welcomeText, module: null, timestamp: new Date().toISOString() });
        _saveSession();
      }
      return '<div class="chat-date-divider"><span>' + dateStr + '</span></div>'
        + '<div class="chat-bubble-ai">' + _escapeHtml(welcomeText) + '</div>';
    }

    var html = '';
    var lastDate = '';
    messages.forEach(function (msg) {
      var msgDate = _formatMsgDate(msg.timestamp);
      if (msgDate !== lastDate) { lastDate = msgDate; html += '<div class="chat-date-divider"><span>' + msgDate + '</span></div>'; }
      if (msg.role === 'ai') { html += '<div class="chat-bubble-ai">' + _renderMessageContent(msg.text) + '</div>'; }
      else if (msg.role === 'user') { html += '<div class="chat-bubble-user">' + _escapeHtml(msg.text) + '</div>'; }
      else if (msg.role === 'system') { html += '<div class="chat-system-msg"><span>' + _escapeHtml(msg.text) + '</span></div>'; }
    });

    if (session) {
      session.drafts.filter(function (d) { return d.status !== 'discarded'; }).forEach(function (draft) {
        html += '<div class="chat-draft-card">'
          + '  <div class="chat-draft-card-info">'
          + '    <div class="chat-draft-card-title">' + _escapeHtml(draft.title) + '</div>'
          + '    <div class="chat-draft-card-summary">' + _escapeHtml((draft.content || '').substring(0, 50)) + '</div>'
          + '  </div><div class="chat-draft-card-arrow">›</div>'
          + '</div>';
      });
    }
    return html;
  }

  function _renderMessageContent(text) {
    if (!text) return '';
    if (typeof window.ChatMarkdown !== 'undefined') return window.ChatMarkdown.render(text);
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
    var yest = new Date(now); yest.setDate(yest.getDate() - 1);
    if (d.toDateString() === yest.toDateString()) return '昨天';
    return (d.getMonth() + 1) + '月' + d.getDate() + '日';
  }

  /* ==========================================================
   * 三段式确认页 — 辅助函数
   * ========================================================== */

  /** 从活跃会话中提取指定模块的用户原始表达 */
  function _getSourceText(moduleKey) {
    if (!_activeSession || !moduleKey) return '';
    var userMsgs = _activeSession.messages.filter(function (m) {
      return m.role === 'user' && m.module === moduleKey;
    });
    if (userMsgs.length === 0) {
      // fallback：该模块没有消息，取所有用户消息
      userMsgs = _activeSession.messages.filter(function (m) { return m.role === 'user'; });
    }
    return userMsgs.map(function (m) { return m.text; }).join('\n\n');
  }

  /** 构建模块选项下拉 */
  function _buildModuleOptions(selectedModule) {
    var options = [
      { key: 'communication', label: '💬 沟通观察' },
      { key: 'emotion',      label: '🌊 情绪事件' },
      { key: 'care',         label: '💊 照护记录' },
      { key: 'work',         label: '💼 活动记录' }
    ];
    return options.map(function (opt) {
      return '<option value="' + opt.key + '"' + (opt.key === selectedModule ? ' selected' : '') + '>' + opt.label + '</option>';
    }).join('');
  }

  /** 跳转到对应主题 L4（带兜底） */
  function _navigateToTopicL4(topicKey) {
    try {
      if (!topicKey || VALID_TOPIC_KEYS.indexOf(topicKey) === -1) {
        // 无效 topicKey → 清理残留标记，兜底到主题档案列表
        try { sessionStorage.removeItem('dr_scroll_to_l4'); } catch (e) {}
        window.location.hash = 'archive-topics';
        return;
      }
      try { sessionStorage.setItem('dr_scroll_to_l4', topicKey); } catch (e) {}
      window.location.hash = topicKey;
    } catch (e) {
      // 极端兜底：任何异常都清理标记并降级
      try { sessionStorage.removeItem('dr_scroll_to_l4'); } catch (e2) {}
      window.location.hash = 'archive-topics';
    }
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

    if (editor && sendBtn) {
      editor.addEventListener('input', function () { sendBtn.disabled = editor.innerText.trim().length === 0; });
      editor.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          var text = editor.innerText.trim();
          if (text) { _handleSend(text); editor.innerHTML = ''; sendBtn.disabled = true; }
        }
      });
    }
    if (sendBtn) {
      sendBtn.addEventListener('click', function () {
        if (!editor) return;
        var text = editor.innerText.trim();
        if (text) { _handleSend(text); editor.innerHTML = ''; sendBtn.disabled = true; }
      });
    }
    if (plusBtn) { plusBtn.addEventListener('click', function () { if (editor) editor.focus(); }); }
    if (backBtn) { backBtn.addEventListener('click', function () { window.location.hash = 'chat'; }); }
    if (endBtn) {
      endBtn.addEventListener('click', function () {
        if (confirm('确定要结束当前对话吗？已生成的草稿可以在整理页面查看。')) {
          if (_activeSession) _activeSession.endSession();
          window.location.hash = 'chat-review';
        }
      });
    }
    if (statusBar) { statusBar.addEventListener('click', function () { window.location.hash = 'chat-review'; }); }
    if (toggleBtn) {
      toggleBtn.addEventListener('click', function () {
        var replies = document.getElementById('chat-quick-replies');
        if (!replies) return;
        _quickRepliesVisible = !_quickRepliesVisible;
        if (_quickRepliesVisible) { replies.classList.remove('collapsed'); toggleBtn.textContent = '⌃'; }
        else { replies.classList.add('collapsed'); toggleBtn.textContent = '⌄'; }
      });
    }
  }

  function _bindQuickReplies() {
    document.querySelectorAll('#chat-quick-replies .chat-quick-reply-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var text = this.getAttribute('data-reply') || '';
        if (text === '另一件事') text = '还有另一件事想记录';
        else if (text === '补充刚才') text = '我想补充一下刚才说的';
        else if (text === '记录进步' || text === '记录一个进步') text = '想记录一个进步';
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

    var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    var recognition = new SpeechRecognition();
    recognition.lang = 'zh-CN';
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;
    var isRecording = false;

    recognition.onresult = function (event) {
      var transcript = '';
      for (var i = event.resultIndex; i < event.results.length; i++) { transcript += event.results[i][0].transcript; }
      var editor = document.getElementById('chat-editor');
      if (editor) {
        editor.textContent = transcript;
        editor.focus();
        editor.dispatchEvent(new Event('input', { bubbles: true }));
      }
    };
    recognition.onerror = function (event) {
      console.warn('语音识别错误:', event.error);
      isRecording = false;
      voiceBtn.classList.remove('recording');
      if (event.error === 'aborted' || event.error === 'no-speech') _showToast('未识别到语音');
    };
    recognition.onend = function () { isRecording = false; voiceBtn.classList.remove('recording'); };

    function startRecord(e) {
      e.preventDefault();
      if (isRecording) return;
      try { recognition.start(); isRecording = true; voiceBtn.classList.add('recording'); } catch (err) {}
    }
    function stopRecord(e) {
      e.preventDefault();
      if (isRecording) recognition.stop();
    }

    voiceBtn.addEventListener('mousedown', startRecord);
    voiceBtn.addEventListener('mouseup', stopRecord);
    voiceBtn.addEventListener('mouseleave', stopRecord);
    voiceBtn.addEventListener('touchstart', startRecord);
    voiceBtn.addEventListener('touchend', stopRecord);
  }

  /* ==========================================================
   * 发送消息（流式渲染核心）
   * ========================================================== */

  function _handleSend(text) {
    var session = _activeSession;
    if (!session) return;
    var editor = document.getElementById('chat-editor');
    var sendBtn = document.getElementById('btn-chat-send');
    if (editor) editor.contentEditable = 'false';
    if (sendBtn) sendBtn.disabled = true;

    _addMessageBubble('user', text);
    var classification = Classifier.classifyMessage(text);
    session.messages.push({ role: 'user', text: text, module: classification.module, timestamp: new Date().toISOString(), confidence: classification.confidence });
    _saveSession();
    _updateSavingStatus('AI思考中...');

    var streamBubble = _createStreamBubble();
    var fullReply = '';
    var youthProfile = _getYouthProfile();

    if (ApiProvider && typeof ApiProvider.generateReplyStream === 'function') {
      ApiProvider.generateReplyStream(
        session.messages, youthProfile,
        function (chunk, fullText) {
          fullReply = fullText !== undefined ? fullText : chunk;
          if (streamBubble) {
            streamBubble.innerHTML = _renderMessageContent(fullReply);
            if (fullText !== undefined) streamBubble.classList.add('streaming');
            else streamBubble.classList.remove('streaming');
          }
          _scrollToBottom();
        },
        function (finalText, isFallback) {
          var reply = finalText || fullReply;
          if (streamBubble) { streamBubble.classList.remove('streaming'); streamBubble.innerHTML = _renderMessageContent(reply); }
          session.messages.push({ role: 'ai', text: reply, module: null, timestamp: new Date().toISOString() });
          _saveSession();
          _afterAIResponse(session, reply, classification);
          _restoreInput(editor, sendBtn);
          _updateSavingStatus('草稿已保存');
        },
        function (error) {
          if (streamBubble) {
            streamBubble.classList.add('chat-bubble-error');
            streamBubble.innerHTML = '<div class="chat-error-text">⚠️ ' + (error.message || 'AI 回复失败') + '</div>'
              + '<button class="chat-error-retry-btn" data-retry-text="' + _escapeHtml(text) + '">重新发送</button>';
          }
          var fallbackReply = '';
          try { fallbackReply = window.ChatbotProviders.TemplateProvider.generateReply(session.messages, youthProfile); }
          catch (e) { fallbackReply = '好的，我记下了。还有什么想补充的吗？'; }
          session.messages.push({ role: 'ai', text: fallbackReply, module: null, timestamp: new Date().toISOString(), _fallback: true });
          _saveSession();
          _addMessageBubble('ai', fallbackReply);
          _restoreInput(editor, sendBtn);
          _updateSavingStatus('已回退模板回复');
          _showToast('API 失败，已使用模板回复');
        }
      );
    } else {
      setTimeout(function () {
        var result = session.sendMessage(text);
        if (streamBubble) streamBubble.innerHTML = _renderMessageContent(result.reply);
        if (result.draftsGenerated && result.draftsGenerated.length > 0) {
          result.draftsGenerated.forEach(function (draft) { _addDraftCard(draft); });
          _addSystemMsg('AI已自动生成' + result.draftsGenerated.length + '条草稿记录');
        }
        _updateDraftCount();
        _updateSavingStatus('草稿已保存');
        _restoreInput(editor, sendBtn);
        _scrollToBottom();
      }, 800);
    }
  }

  function _createStreamBubble() {
    var msgList = document.getElementById('chat-message-list');
    if (!msgList) return null;
    var bubble = document.createElement('div');
    bubble.className = 'chat-bubble-ai chat-stream-bubble streaming';
    bubble.id = 'chat-stream-bubble';
    bubble.textContent = '';
    msgList.appendChild(bubble);
    _scrollToBottom();
    bubble.addEventListener('click', function (e) {
      var retryBtn = e.target.closest('.chat-error-retry-btn');
      if (!retryBtn) return;
      var retryText = retryBtn.getAttribute('data-retry-text');
      if (!retryText) return;
      if (bubble.parentNode) bubble.parentNode.removeChild(bubble);
      _handleSend(retryText);
    });
    return bubble;
  }

  function _afterAIResponse(session, reply, classification) {
    if (reply.indexOf('#DRAFT') !== -1) {
      ['communication', 'emotion', 'care', 'work'].forEach(function (modKey) {
        var existing = session.drafts.filter(function (d) { return d.module === modKey && d.status !== 'discarded'; });
        if (existing.length === 0) { var d = session.generateDraft(modKey); if (d) _addDraftCard(d); }
      });
      _addSystemMsg('AI检测到记录要点，已自动生成草稿');
      _updateDraftCount();
    }
    if (classification && classification.module && classification.confidence >= 0.3) {
      var modMsgs = session.messages.filter(function (m) { return m.role === 'user' && m.module === classification.module; });
      var existing = session.drafts.filter(function (d) { return d.module === classification.module && d.status !== 'discarded'; });
      if (modMsgs.length >= 1 && existing.length === 0 && session.messages.length >= 2) {
        var d = session.generateDraft(classification.module);
        if (d) { _addDraftCard(d); _updateDraftCount(); }
      }
    }
  }

  function _restoreInput(editor, sendBtn) {
    if (editor) { editor.contentEditable = 'true'; editor.focus(); }
    if (sendBtn) sendBtn.disabled = editor ? editor.innerText.trim().length === 0 : true;
  }

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
    if (role === 'ai') bubble.innerHTML = _renderMessageContent(text);
    else bubble.textContent = text;
    msgList.appendChild(bubble);
    _scrollToBottom();
  }

  function _addDraftCard(draft) {
    var msgList = document.getElementById('chat-message-list');
    if (!msgList) return;
    var card = document.createElement('div');
    card.className = 'chat-draft-card';
    card.innerHTML = '<div class="chat-draft-card-info">'
      + '<div class="chat-draft-card-title">' + _escapeHtml(draft.title) + '</div>'
      + '<div class="chat-draft-card-summary">' + _escapeHtml((draft.content || '').substring(0, 50)) + '</div>'
      + '</div><div class="chat-draft-card-arrow">›</div>';
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
      if (!arrow) { arrow = document.createElement('div'); arrow.className = 'chat-conv-status-arrow'; statusBar.appendChild(arrow); }
      arrow.textContent = count + ' 条草稿 ›';
    } else { if (arrow) arrow.remove(); }
  }

  function _showAllRecords() { _showToast('聊天记录功能即将上线'); }

  /* ==========================================================
   * 整理确认页事件
   * ========================================================== */

  function _bindReviewEvents() {
    var backBtn = document.getElementById('btn-review-back');
    var confirmAllBtn = document.getElementById('btn-confirm-all');
    var laterBtn = document.getElementById('btn-later');

    if (backBtn) backBtn.addEventListener('click', function () { window.location.hash = 'chat'; });
    if (laterBtn) laterBtn.addEventListener('click', function () { window.location.hash = 'chat'; });
    if (confirmAllBtn) confirmAllBtn.addEventListener('click', function () { _handleConfirmAll(); });

    // 委托事件：确认、放弃、查看已入档记录、返回原对话
    var list = document.getElementById('review-list');
    if (!list) return;

    list.addEventListener('click', function (e) {
      // 查看已入档记录
      var viewBtn = e.target.closest('[data-action="view-topic"]');
      if (viewBtn) {
        e.stopPropagation();
        _navigateToTopicL4(viewBtn.getAttribute('data-topic'));
        return;
      }
      // 确认
      var confirmBtn = e.target.closest('[data-action="confirm"]');
      if (confirmBtn) {
        e.stopPropagation();
        var card = confirmBtn.closest('.chat-review-draft-card');
        if (card) _handleDraftConfirm(card);
        return;
      }
      // 放弃
      var discardBtn = e.target.closest('[data-action="discard"]');
      if (discardBtn) {
        e.stopPropagation();
        var card2 = discardBtn.closest('.chat-review-draft-card');
        if (card2 && confirm('确定要放弃这条草稿吗？放弃后可从原对话重新生成。')) { _handleDraftDiscard(card2); }
        return;
      }
      // 返回原对话
      var detailBtn = e.target.closest('[data-action="detail"]');
      if (detailBtn) {
        e.stopPropagation();
        window.location.hash = 'chat-conversation';
        return;
      }
    });
  }

  function _handleDraftDiscard(card) {
    var draftId = card.getAttribute('data-draft-id');
    if (!_activeSession || !draftId) return;
    var draft = _activeSession.drafts.find(function (d) { return d.id === draftId; });
    if (draft) { draft.status = 'discarded'; _saveSession(); }
    _refreshReviewUI();
    _showToast('已放弃该草稿');
  }

  function _handleDraftConfirm(card) {
    var draftId = card.getAttribute('data-draft-id');
    if (!_activeSession || !draftId) return;

    var draft = _activeSession.drafts.find(function (d) { return d.id === draftId; });
    if (!draft || draft.status !== 'pending') return;

    // 读取用户编辑的内容和模块
    var titleEl = card.querySelector('[data-field="title"]');
    var contentEl = card.querySelector('[data-field="content"]');
    var moduleEl = card.querySelector('.chat-review-module-select');

    var updates = {};
    if (titleEl) updates.title = ('value' in titleEl ? titleEl.value : titleEl.textContent || '').trim();
    if (contentEl) updates.content = ('value' in contentEl ? contentEl.value : contentEl.textContent || '').trim();
    if (moduleEl) {
      var newModule = moduleEl.value;
      if (newModule && newModule !== draft.module) {
        draft.module = newModule;
      }
    }

    // 保存 AI 原始草稿内容（用户编辑前）
    if (!draft.aiDraftContent) { draft.aiDraftContent = draft.content; }
    // 保存原始表达（用户对话原文）
    draft.originalText = _getSourceText(draft.module);

    if (Object.keys(updates).length > 0) { _activeSession.editDraft(draftId, updates); }
    _activeSession.confirmDraft(draftId);
    // 精确入档
    var results = _activeSession.commitDrafts([draftId]);

    if (results.length > 0) {
      _showToast('已写入档案 · 点击「查看已入档记录」跳转');
    } else {
      _showToast('入档失败，请重试');
    }
    _refreshReviewUI();
  }

  function _handleConfirmAll() {
    if (!_activeSession) { _showToast('没有活跃会话'); return; }

    var pendingDrafts = _activeSession.drafts.filter(function (d) { return d.status === 'pending'; });
    if (pendingDrafts.length === 0) { _showToast('没有待确认的草稿'); return; }

    // 收集所有待确认草稿的模块（供成功弹窗跳转用）
    var modules = [];
    pendingDrafts.forEach(function (d) {
      // 保存 AI 原始草稿内容（用户编辑前）
      if (!d.aiDraftContent) { d.aiDraftContent = d.content; }
      // 保存原始表达（用户对话原文）
      d.originalText = _getSourceText(d.module);
      _activeSession.confirmDraft(d.id);
      if (d.module && modules.indexOf(d.module) === -1) modules.push(d.module);
    });
    var results = _activeSession.commitDrafts();

    if (results.length < pendingDrafts.length) { _showToast('部分记录入档失败，请重试'); }
    _showSuccessDialog(results.length, modules);
  }

  function _refreshReviewUI() {
    var container = document.getElementById('chat-review');
    if (!container) return;
    var ready = container.querySelector('.chat-review-ready');
    if (ready) ready.remove();
    ChatUI.renderReview();
  }

  function _showSuccessDialog(count, modules) {
    var old = document.getElementById('chat-success-overlay');
    if (old) old.remove();

    modules = modules || [];
    var youthName = _getYouthName();

    var html = '<div class="chat-success-overlay" id="chat-success-overlay">'
      + '<div class="chat-success-dialog">'
      + '  <div class="chat-success-icon">✓</div>'
      + '  <div class="chat-success-title">保存成功</div>'
      + '  <div class="chat-success-desc">' + count + '条记录已保存到' + youthName + '的支持档案中</div>';

    // 每个唯一模块一个跳转按钮
    if (modules.length > 0) {
      html += '  <div class="chat-success-jumps">';
      modules.forEach(function (modKey) {
        var info = _getModuleInfo(modKey);
        var label = info ? info.icon + ' ' + info.label : modKey;
        html += '<button class="chat-review-btn-view-topic chat-success-jump-btn" data-topic="' + modKey + '">📋 查看「' + label + '」已入档记录</button>';
      });
      html += '  </div>';
    }

    html += '  <button class="chat-success-btn" id="btn-success-close">知道了</button>'
      + '</div></div>';

    document.body.insertAdjacentHTML('beforeend', html);

    // 绑定跳转按钮
    document.querySelectorAll('.chat-success-jump-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var topicKey = this.getAttribute('data-topic');
        var overlay = document.getElementById('chat-success-overlay');
        if (overlay) overlay.remove();
        _navigateToTopicL4(topicKey);
      });
    });

    // 关闭按钮
    var closeBtn = document.getElementById('btn-success-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', function () {
        var overlay = document.getElementById('chat-success-overlay');
        if (overlay) overlay.remove();
        _refreshReviewUI();
      });
    }

    // 点击遮罩关闭
    var overlay = document.getElementById('chat-success-overlay');
    if (overlay) {
      overlay.addEventListener('click', function (e) {
        if (e.target === overlay) { overlay.remove(); _refreshReviewUI(); }
      });
    }
  }

  function _showToast(msg) {
    if (typeof window.showToast === 'function') { window.showToast(msg); return; }
    var toast = document.createElement('div');
    toast.className = 'app-toast show';
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(function () { toast.classList.remove('show'); setTimeout(function () { toast.remove(); }, 300); }, 2000);
  }

  function _getDemoDrafts() {
    return [
      { id: 'demo-1', module: 'communication', title: '沟通观察', status: 'pending', content: '小雨最近喜欢用短句表达需求，能主动说出"要喝水"和"出去玩"' },
      { id: 'demo-2', module: 'work', title: '活动记录', status: 'pending', content: '小宇独立完成烘焙，专注度提升' },
      { id: 'demo-3', module: 'emotion', title: '情绪事件', status: 'pending', content: '小雨今天情绪稳定，在烘焙课上表现积极' }
    ];
  }

  window.ChatUI = ChatUI;

  // 页面刷新时恢复最后活跃会话
  window.addEventListener('DOMContentLoaded', function () {
    var hash = window.location.hash.replace('#', '');
    if (hash === 'chat-conversation' || hash === 'chat-review') {
      var savedId = localStorage.getItem(LAST_SESSION_KEY);
      if (savedId) {
        var session = ChatBot.loadSession(savedId);
        if (session) _activeSession = session;
      }
    }
  });

})();
