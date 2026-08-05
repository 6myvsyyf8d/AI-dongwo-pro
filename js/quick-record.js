/**
 * ============================================================
 * AI懂我 - 临时支持者一句话快速记录
 * ============================================================
 * 路由：#quick-record
 * 临时支持者提交一条观察记录 → 生成待确认草稿 → 家长/老师审核
 * 
 * A1: 固定草稿数据结构（18字段）
 * ============================================================
 */
(function () {
  'use strict';

  var DRAFTS_KEY = 'ai_dongwo_pending_drafts';
  var QUICK_TAGS = [
    { value: 'emotion', label: '情绪变化', icon: '😰' },
    { value: 'activity', label: '活动表现', icon: '🎯' },
    { value: 'support', label: '支持方法', icon: '🤲' }
  ];

  /** 草稿固定字段默认值 */
  var DRAFT_DEFAULTS = {
    id: '',
    youthId: 'demo_xiaoyu',
    youthName: '小雨',
    originalText: '',
    organizedSummary: '',
    suggestedTheme: 'care',
    selectedTheme: 'care',
    tags: [],
    authorId: '',
    authorName: '临时支持者',
    authorRole: 'temp_supporter',
    createdAt: '',
    status: 'pending',
    reviewerId: '',
    reviewerName: '',
    reviewedAt: '',
    reviewNote: '',
    sourceType: 'temp_supporter_quick_record',
    isDemoOrganized: true,
    archivedRecordId: ''
  };

  function getDrafts() {
    try { return JSON.parse(localStorage.getItem(DRAFTS_KEY) || '[]'); } catch (e) { return []; }
  }
  function saveDrafts(drafts) { localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts)); }

  /** 规则模板生成"演示整理"摘要 */
  function generateDraftSummary(text, tags) {
    var summary = '';
    var suggested = '';
    if (tags.indexOf('emotion') >= 0) {
      summary = '记录到情绪变化。' + (text.length > 40 ? text.substring(0, 40) + '…' : text);
      suggested = 'emotion';
    } else if (tags.indexOf('activity') >= 0) {
      summary = '记录到活动表现。' + (text.length > 40 ? text.substring(0, 40) + '…' : text);
      suggested = 'work';
    } else if (tags.indexOf('support') >= 0) {
      summary = '记录支持方法使用情况。' + (text.length > 40 ? text.substring(0, 40) + '…' : text);
      suggested = 'care';
    } else {
      summary = '临时支持者观察记录：' + (text.length > 40 ? text.substring(0, 40) + '…' : text);
      suggested = 'care';
    }
    return { summary: summary, suggestedModule: suggested };
  }

  function getCurrentUser() {
    var ds = window.DataStore;
    var appState = window.AppState;
    return ds ? (ds.getCurrentUser() || (appState && appState.currentUser) || null) : null;
  }

  /** 创建标准化草稿（18字段） */
  function createDraft(text, tags, user) {
    var gen = generateDraftSummary(text, tags);
    var now = new Date().toISOString();
    var draft = {};
    Object.keys(DRAFT_DEFAULTS).forEach(function (k) {
      draft[k] = DRAFT_DEFAULTS[k];
    });
    draft.id = 'draft_' + Date.now();
    draft.originalText = text;
    draft.organizedSummary = gen.summary;
    draft.suggestedTheme = gen.suggestedModule;
    draft.selectedTheme = gen.suggestedModule;
    draft.tags = tags.slice();
    draft.authorId = user ? (user.id || '') : '';
    draft.authorName = user ? (user.name || '临时支持者') : '临时支持者';
    draft.createdAt = now;
    return draft;
  }

  function renderQuickRecord() {
    var container = document.getElementById('quick-record-content');
    if (!container) return;
    var user = getCurrentUser();
    var selectedTags = [];
    var render = function () {
      container.innerHTML = buildPage(user, selectedTags);
      bindEvents(container, selectedTags, render, user);
    };
    render();
    if (window.renderBottomNav) window.renderBottomNav();
  }

  function buildPage(user, selectedTags) {
    return '<div class="qr-page">'
      + '<div class="qr-header">'
      + '<div class="qr-title">快速记录</div>'
      + '<div class="qr-subtitle">记录一次观察或关怀</div>'
      + '</div>'
      + '<div class="qr-body">'
      + '<div class="qr-youth-badge">👤 小雨 · 临时支持者记录</div>'
      + '<p class="qr-textarea-hint">请具体记录发生的场景、你观察到的情况、使用的支持方式和后续状态。系统只负责整理，需由家长或老师确认后才能入档。</p>'
      + '<textarea class="qr-textarea" id="qr-text" placeholder="小雨第一次到新场地时反复询问时间。我提前向他说明活动流程并展示日程卡，之后他逐渐开始参与活动。"></textarea>'
      + '<div class="qr-tags-row">'
      + QUICK_TAGS.map(function (t) {
          var active = selectedTags.indexOf(t.value) >= 0;
          return '<button class="qr-tag' + (active ? ' active' : '') + '" data-tag="' + t.value + '">' + t.icon + ' ' + t.label + '</button>';
        }).join('')
      + '</div>'
      + '<button class="qr-btn-submit" id="qr-submit" disabled>记录一次观察或关怀</button>'
      + '<p class="qr-hint">提交后将生成待确认草稿，由家长或老师审核后入档。</p>'
      + '</div>'
      + '</div>';
  }

  function bindEvents(container, selectedTags, rerender, user) {
    var textEl = document.getElementById('qr-text');
    var submitBtn = document.getElementById('qr-submit');
    function updateSubmit() {
      if (submitBtn) submitBtn.disabled = !(textEl && textEl.value.trim().length > 0);
    }
    if (textEl) textEl.addEventListener('input', updateSubmit);

    container.querySelectorAll('.qr-tag').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var tag = this.getAttribute('data-tag');
        var idx = selectedTags.indexOf(tag);
        if (idx >= 0) selectedTags.splice(idx, 1);
        else if (selectedTags.length < 2) selectedTags.push(tag);
        rerender();
      });
    });

    if (submitBtn) {
      submitBtn.addEventListener('click', function () {
        var text = textEl ? textEl.value.trim() : '';
        if (!text) return;

        // A3: 防重复提交 —— 立即禁用按钮
        submitBtn.disabled = true;
        submitBtn.textContent = '提交中...';

        var draft = createDraft(text, selectedTags.slice(), user);
        var drafts = getDrafts();
        drafts.unshift(draft);
        saveDrafts(drafts);

        // Show success
        container.innerHTML = buildSuccess(draft);
        bindSuccessEvents(container);
        updateSubmit = function () {};
      });
    }
  }

  function buildSuccess(draft) {
    return '<div class="qr-page">'
      + '<div class="qr-header">'
      + '<div class="qr-title">记录已提交</div>'
      + '<div class="qr-subtitle">等待家长或老师确认</div>'
      + '</div>'
      + '<div class="qr-body">'
      + '<div class="qr-success-icon">✅</div>'
      + '<div class="qr-draft-card">'
      + '<div class="qr-draft-label">📝 原始记录</div>'
      + '<div class="qr-draft-text">' + escapeHtml(draft.originalText) + '</div>'
      + '<div class="qr-draft-divider"></div>'
      + '<div class="qr-draft-label">🤖 演示整理摘要</div>'
      + '<div class="qr-draft-text qr-draft-summary">' + escapeHtml(draft.organizedSummary) + '</div>'
      + '<div class="qr-ai-badge">演示整理 · 不代表专业判断</div>'
      + '<div class="qr-draft-divider"></div>'
      + '<div class="qr-draft-meta">'
      + '<span>📂 建议归属：' + moduleLabel(draft.suggestedTheme) + '</span>'
      + '<span class="qr-draft-status">⏳ 待家长/老师确认</span>'
      + '</div>'
      + '</div>'
      + '<p class="qr-hint">可追溯来源：临时支持者记录 · ' + formatTime(draft.createdAt) + '</p>'
      + '<button class="qr-btn-back" id="qr-back-card">返回速读卡</button>'
      + '</div>'
      + '</div>';
  }

  function bindSuccessEvents(container) {
    var btn = document.getElementById('qr-back-card');
    if (btn) btn.addEventListener('click', function () { window.location.hash = 'supporter-card'; });
  }

  function escapeHtml(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function moduleLabel(m) { return { emotion: '情绪与行为', work: '工作支持', care: '照护与医疗' }[m] || m; }
  function formatTime(iso) {
    try { return new Date(iso).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }); } catch (e) { return ''; }
  }

  window.QuickRecordPage = {
    render: renderQuickRecord,
    getDrafts: getDrafts,
    saveDrafts: saveDrafts,
    DRAFTS_KEY: DRAFTS_KEY,
    DRAFT_DEFAULTS: DRAFT_DEFAULTS
  };
})();
