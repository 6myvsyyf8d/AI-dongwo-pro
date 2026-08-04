/**
 * chat-ui.js — 对话 UI 控制器 v2
 * 挂载：window.ChatUI
 *
 * 管理三个屏幕：对话首页 / 对话界面 / 整理确认页
 * 依赖：window.ChatBot, window.ChatMarkdown
 *
 * 路由： #chat → 对话首页, #chat-conversation → 对话界面, #chat-review → 整理确认
 */
(function () {
  'use strict';

  var ChatBot = window.ChatBot;
  var _activeSession = null;
  var _quickRepliesVisible = true;
  var _savingTimeout = null;

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
        + (pendingCount > 0
          ? '  <div class="chat-home-pending-card" id="card-pending-review">'
          + '    <div class="chat-home-pending-info">'
          + '      <div class="chat-home-pending-icon">📋</div>'
          + '      <div class="chat-home-pending-text">' + pendingCount + '条记录待确认</div>'
          + '    </div>'
          + '    <div class="chat-home-pending-arrow">›</div>'
          + '  </div>'
          : '')
        + '  <a class="chat-home-records-link" id="link-all-records">查看全部聊天记录</a>'
        + '  <div class="chat-home-footer">AI懂我 · 心智障碍者动态支持档案</div>'
        + '</div>';

      // 绑定事件
      var startBtn = document.getElementById('btn-start-chat');
      if (startBtn) {
        startBtn.addEventListener('click', function () {
          _startNewConversation();
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
    },

    /**
     * 开始新对话
     */
    _startNewConversation: function () {
      var youthId = _getYouthId();
      _activeSession = ChatBot.createSession(youthId);

      // 导航到对话界面
      if (typeof window.location !== 'undefined') {
        window.location.hash = 'chat-conversation';
      }
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
        var youthId = _getYouthId();
        _activeSession = ChatBot.createSession(youthId);
      }

      var draftCount = _getActiveDraftCount();

      container.innerHTML = ''
        + '<div class="chat-page-container chat-conv-ready">'
        // 顶部栏
        + '  <div class="chat-conv-topbar">'
        + '    <button class="chat-conv-btn-back" id="btn-chat-back">‹</button>'
        + '    <div class="chat-conv-title">小宇的 AI聊聊</div>'
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
        + '    <button class="chat-conv-btn-voice" id="btn-chat-voice">🎤</button>'
        + '    <button class="chat-conv-btn-send" id="btn-chat-send" disabled>➤</button>'
        + '  </div>'
        + '</div>';

      // 绑定输入区事件
      _bindInputEvents();
      // 绑定快捷回复
      _bindQuickReplies();
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
      // 用 demo drafts 如果没有活跃会话
      if (!session || _drafts.length === 0) {
        _drafts = _getDemoDrafts();
      }

      var totalCount = _drafts.length;
      var pendingCount = _drafts.filter(function (d) { return d.status === 'pending'; }).length;
      var confirmedCount = _drafts.filter(function (d) { return d.status === 'confirmed'; }).length;

      var html = ''
        + '<div class="chat-page-container chat-review-ready">'
        // 顶部栏
        + '  <div class="chat-review-topbar">'
        + '    <button class="chat-review-btn-back" id="btn-review-back">‹</button>'
        + '    <div class="chat-review-title">本次整理</div>'
        + '  </div>'
        // 说明条
        + '  <div class="chat-review-info-bar">'
        + '    <span class="chat-review-info-count">共' + totalCount + '条记录</span>'
        + '    <span class="chat-review-info-legend">'
        + '      <span><span class="chat-review-legend-dot orange"></span>待确认 ' + pendingCount + '</span>'
        + '      <span><span class="chat-review-legend-dot green"></span>已确认 ' + confirmedCount + '</span>'
        + '    </span>'
        + '  </div>'
        // 草稿卡片列表
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
          // 可展开字段
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
        // 底部固定栏
        + '  <div class="chat-review-bottom-bar">'
        + '    <button class="chat-review-btn-confirm-all" id="btn-confirm-all" ' + (pendingCount === 0 ? 'disabled' : '') + '>确认全部待确认记录</button>'
        + '    <button class="chat-review-btn-later" id="btn-later">稍后处理</button>'
        + '  </div>'
        + '</div>';

      container.innerHTML = html;

      // 绑定卡片事件
      _bindReviewEvents();
    },

    /**
     * 加载已有会话继续对话
     * @param {string} sessionId
     */
    loadSession: function (sessionId) {
      var session = ChatBot.loadSession(sessionId);
      if (!session) {
        _showToast('会话不存在');
        return;
      }
      _activeSession = session;

      // 导航到对话界面
      if (typeof window.location !== 'undefined') {
        window.location.hash = 'chat-conversation';
      }
    },

    /**
     * 获取所有草稿（跨会话）
     */
    getAllPendingDrafts: function () {
      var sessions = ChatBot.listSessions();
      var allDrafts = [];
      sessions.forEach(function (s) {
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
   * 渲染欢迎消息
   */
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
        session._save();
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
    var weekDays = ['日', '一', '二', '三', '四', '五', '六'];
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

  /**
   * 绑定对话输入区事件
   */
  function _bindInputEvents() {
    var editor = document.getElementById('chat-editor');
    var sendBtn = document.getElementById('btn-chat-send');
    var plusBtn = document.getElementById('btn-chat-plus');
    var voiceBtn = document.getElementById('btn-chat-voice');
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

    // 语音按钮
    if (voiceBtn) {
      voiceBtn.addEventListener('click', function () {
        _showToast('语音输入即将上线');
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

  /**
   * 绑定快捷回复
   */
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

  /**
   * 发送消息
   */
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

    // 显示打字指示器
    _showTypingIndicator();

    // 更新保存状态
    _updateSavingStatus('保存中');
    if (_savingTimeout) clearTimeout(_savingTimeout);

    // 模拟延迟 → 调用引擎
    setTimeout(function () {
      // 移除打字指示器
      _removeTypingIndicator();

      var result = session.sendMessage(text);

      // 添加 AI 回复气泡
      _addMessageBubble('ai', result.reply);

      // 添加草稿卡片
      if (result.draftsGenerated && result.draftsGenerated.length > 0) {
        result.draftsGenerated.forEach(function (draft) {
          _addDraftCard(draft);
        });
        _addSystemMsg('AI已自动生成' + result.draftsGenerated.length + '条草稿记录');
      }

      // 更新状态栏草稿数
      _updateDraftCount();
      _updateSavingStatus('草稿已保存');

      // 恢复输入
      if (editor) {
        editor.contentEditable = 'true';
        editor.focus();
      }
      if (sendBtn) sendBtn.disabled = (editor ? editor.innerText.trim().length === 0 : true);

      _scrollToBottom();
    }, 800);
  }

  /**
   * 添加消息气泡到消息列表
   */
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

  /**
   * 添加草稿卡片
   */
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

  /**
   * 添加系统消息
   */
  function _addSystemMsg(text) {
    var msgList = document.getElementById('chat-message-list');
    if (!msgList) return;

    var sys = document.createElement('div');
    sys.className = 'chat-system-msg';
    sys.innerHTML = '<span>' + _escapeHtml(text) + '</span>';
    msgList.appendChild(sys);
  }

  /**
   * 显示打字指示器
   */
  function _showTypingIndicator() {
    var msgList = document.getElementById('chat-message-list');
    if (!msgList) return;

    var indicator = document.createElement('div');
    indicator.className = 'chat-bubble-ai chat-typing-indicator';
    indicator.id = 'chat-typing';
    indicator.innerHTML = '<span class="chat-typing-dot"></span><span class="chat-typing-dot"></span><span class="chat-typing-dot"></span>';
    msgList.appendChild(indicator);
    _scrollToBottom();
  }

  function _removeTypingIndicator() {
    var indicator = document.getElementById('chat-typing');
    if (indicator) indicator.remove();
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

    // 绑定卡片操作按钮
    var cards = document.querySelectorAll('#review-list .chat-review-draft-card');
    cards.forEach(function (card) {
      // 点击标题区域 → 展开/折叠
      var body = card.querySelector('.chat-review-draft-body');
      if (body) {
        body.addEventListener('click', function (e) {
          if (e.target.tagName === 'BUTTON') return;
          card.classList.toggle('expanded');
        });
      }

      // 菜单按钮
      var menuBtn = card.querySelector('[data-action="menu"]');
      if (menuBtn) {
        menuBtn.addEventListener('click', function (e) {
          e.stopPropagation();
          _showDraftMenu(e, card);
        });
      }

      // 修改按钮
      var modifyBtn = card.querySelector('[data-action="modify"]');
      if (modifyBtn) {
        modifyBtn.addEventListener('click', function (e) {
          e.stopPropagation();
          card.classList.add('expanded');
        });
      }

      // 确认保存按钮
      var confirmBtn = card.querySelector('[data-action="confirm"]');
      if (confirmBtn) {
        confirmBtn.addEventListener('click', function (e) {
          e.stopPropagation();
          _handleDraftConfirm(card);
        });
      }

      // 查看详情按钮
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

    // 读取编辑过的字段
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

    // 刷新 UI
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

    // 显示成功弹窗
    _showSuccessDialog(pendingDrafts.length);
  }

  function _showDraftMenu(e, card) {
    var draftId = card.getAttribute('data-draft-id');

    // 移除旧弹窗
    var oldPopup = document.querySelector('.chat-draft-menu-popup');
    if (oldPopup) oldPopup.remove();

    var menuBtn = e.target;
    var popup = document.createElement('div');
    popup.className = 'chat-draft-menu-popup';
    popup.innerHTML = ''
      + '<button class="chat-draft-menu-item" data-action="edit">编辑内容</button>'
      + '<button class="chat-draft-menu-item danger" data-action="discard">放弃记录</button>';

    // 定位弹窗
    var rect = menuBtn.getBoundingClientRect();
    var reviewList = document.getElementById('review-list');
    if (reviewList) {
      var listRect = reviewList.getBoundingClientRect();
      popup.style.position = 'fixed';
      popup.style.top = rect.bottom + 4 + 'px';
      popup.style.right = (window.innerWidth - rect.right) + 'px';
      popup.style.zIndex = '200';
    }

    document.body.appendChild(popup);

    // 绑定菜单项
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

    // 点击外部关闭
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
    // 移除旧弹窗
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

  /**
   * 生成 demo 草稿（当没有活跃会话时用于预览）
   */
  function _getDemoDrafts() {
    return [
      { id: 'demo-1', module: 'communication', title: '沟通观察', status: 'pending', content: '小雨最近喜欢用短句表达需求，能主动说出"要喝水"和"出去玩"' },
      { id: 'demo-2', module: 'work', title: '活动记录', status: 'confirmed', content: '小宇独立完成烘焙，专注度提升' },
      { id: 'demo-3', module: 'emotion', title: '情绪事件', status: 'pending', content: '小雨今天情绪稳定，在烘焙课上表现积极' }
    ];
  }

  window.ChatUI = ChatUI;

})();
