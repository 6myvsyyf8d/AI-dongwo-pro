/**
 * ============================================================
 * AI懂我 - 待确认记录审核页
 * ============================================================
 * 路由：#draft-review
 * 家长/老师查看、修改、确认或放弃临时支持者提交的草稿。
 * 确认后写入 L4 原始记录，按规则检查是否生成 L1/L3 候选事件。
 * 
 * A1: 固定18字段草稿 + 旧草稿兼容迁移
 * A3: 防重复确认和防重复入档
 * A2: 原话与整理结果同时保留
 * ============================================================
 */
(function () {
  'use strict';

  var DRAFTS_KEY = 'ai_dongwo_pending_drafts';
  var CANDIDATES_KEY = 'ai_dongwo_l1l3_candidates';

  /** 18字段默认值（与 quick-record.js 保持一致） */
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
  function saveDrafts(d) { localStorage.setItem(DRAFTS_KEY, JSON.stringify(d)); }

  function getCandidates() {
    try { return JSON.parse(localStorage.getItem(CANDIDATES_KEY) || '[]'); } catch (e) { return []; }
  }
  function saveCandidates(c) { localStorage.setItem(CANDIDATES_KEY, JSON.stringify(c)); }

  function moduleLabel(m) {
    return { emotion: '情绪与行为', work: '工作支持', care: '照护与医疗' }[m] || m;
  }

  function themeOptions() {
    return [
      { value: 'emotion', label: '情绪与行为' },
      { value: 'work', label: '工作支持' },
      { value: 'care', label: '照护与医疗' }
    ];
  }

  /** 旧草稿迁移：补全缺失字段 */
  function migrateDraft(d) {
    var migrated = {};
    Object.keys(DRAFT_DEFAULTS).forEach(function (k) {
      if (d.hasOwnProperty(k)) {
        migrated[k] = d[k];
      } else if (k === 'organizedSummary' && d.aiSummary) {
        migrated[k] = d.aiSummary;
      } else if (k === 'organizedSummary' && d.summary) {
        migrated[k] = d.summary;
      } else if (k === 'suggestedTheme' && d.suggestedModule) {
        migrated[k] = d.suggestedModule;
      } else if (k === 'selectedTheme' && d.suggestedModule) {
        migrated[k] = d.suggestedModule;
      } else if (k === 'originalText' && d.rawText) {
        migrated[k] = d.rawText;
      } else if (k === 'authorName' && d.author) {
        migrated[k] = d.author;
      } else {
        migrated[k] = DRAFT_DEFAULTS[k];
      }
    });
    // 确保状态是合法值
    var validStatus = ['pending', 'needs_info', 'confirmed', 'discarded'];
    if (validStatus.indexOf(migrated.status) === -1) {
      migrated.status = 'pending';
    }
    // 如果没有任何摘要，生成演示整理补齐
    if (!migrated.organizedSummary && migrated.originalText) {
      migrated.organizedSummary = '演示整理 · 临时支持者观察记录：' + migrated.originalText.substring(0, 60);
      migrated.isDemoOrganized = true;
    }
    return migrated;
  }

  function renderDraftReview() {
    var container = document.getElementById('draft-review-content');
    if (!container) return;
    var raw = getDrafts();
    // 迁移旧草稿
    var needsSave = false;
    var drafts = raw.map(function (d) {
      if (!d.hasOwnProperty('sourceType')) { needsSave = true; return migrateDraft(d); }
      return d;
    });
    if (needsSave) saveDrafts(drafts);

    var pending = drafts.filter(function (d) { return d.status === 'pending'; });
    var needsInfo = drafts.filter(function (d) { return d.status === 'needs_info'; });
    var done = drafts.filter(function (d) { return d.status === 'confirmed' || d.status === 'discarded'; });

    container.innerHTML = buildPage(pending, needsInfo, done);
    bindEvents(container, drafts);
  }

  function buildPage(pending, needsInfo, done) {
    var html = '<div class="dr-page">';
    html += '<div class="dr-header"><div class="dr-title">待确认记录</div>';
    html += '<div class="dr-count">共 ' + pending.length + ' 条待确认</div></div>';

    if (pending.length === 0 && needsInfo.length === 0) {
      html += '<div class="dr-empty"><div class="dr-empty-icon">📋</div><p>暂无待确认记录</p></div>';
    } else {
      html += buildTabRow(pending.length, needsInfo.length, done.length);

      // 待确认
      if (pending.length > 0) {
        html += '<div class="dr-list" id="dr-pending-list">';
        pending.forEach(function (d) { html += buildDraftCard(d, 'pending'); });
        html += '</div>';
      }

      // 需补充
      if (needsInfo.length > 0) {
        html += '<div class="dr-list" id="dr-needs-info-list" style="display:none;">';
        needsInfo.forEach(function (d) { html += buildDraftCard(d, 'needs_info'); });
        html += '</div>';
      }
    }

    // 已处理
    if (done.length > 0) {
      html += '<div class="dr-list" id="dr-done-list" style="display:none;">';
      done.forEach(function (d) { html += buildDoneCard(d); });
      html += '</div>';
    }

    html += '</div>';
    return html;
  }

  function buildTabRow(pendingCount, needsInfoCount, doneCount) {
    return '<div class="dr-tabs">'
      + '<button class="dr-tab active" data-tab="pending">待确认 (' + pendingCount + ')</button>'
      + (needsInfoCount > 0 ? '<button class="dr-tab" data-tab="needs-info">需补充 (' + needsInfoCount + ')</button>' : '')
      + (doneCount > 0 ? '<button class="dr-tab" data-tab="done">已处理 (' + doneCount + ')</button>' : '')
      + '</div>';
  }

  function buildDraftCard(d, type) {
    var isReadOnly = (d.status === 'confirmed' || d.status === 'discarded');
    return '<div class="dr-card" data-draft-id="' + d.id + '" data-status="' + d.status + '">'
      + '<div class="dr-card-header">'
      + '<span class="dr-card-author">👤 ' + escapeHtml(d.authorName || '临时支持者') + '</span>'
      + '<span class="dr-card-module">📂 ' + moduleLabel(d.suggestedTheme || d.selectedTheme) + '</span>'
      + '<span class="dr-card-status ' + d.status + '">' + statusLabel(d.status) + '</span>'
      + '</div>'

      // A2: 原始记录 — 只读
      + '<div class="dr-section"><div class="dr-section-label">📝 原始记录（只读）</div>'
      + '<div class="dr-section-text">' + escapeHtml(d.originalText || '') + '</div></div>'

      // A2: 整理摘要 — 可编辑
      + '<div class="dr-section"><div class="dr-section-label">🤖 演示整理摘要 · 不代表专业判断</div>'
      + (isReadOnly
          ? '<div class="dr-section-text">' + escapeHtml(d.organizedSummary || '') + '</div>'
          : '<textarea class="dr-summary-edit" data-draft-id="' + d.id + '">' + escapeHtml(d.organizedSummary || '') + '</textarea>')
      + '</div>'

      // 归属主题
      + '<div class="dr-section"><div class="dr-section-label">📂 归属主题</div>'
      + (isReadOnly
          ? '<div class="dr-section-text">' + moduleLabel(d.selectedTheme || d.suggestedTheme) + '</div>'
          : '<select class="dr-module-select" data-draft-id="' + d.id + '">'
            + themeOptions().map(function (m) {
                return '<option value="' + m.value + '"' + ((d.selectedTheme || d.suggestedTheme) === m.value ? ' selected' : '') + '>' + m.label + '</option>';
              }).join('')
            + '</select>')
      + '</div>'

      // 审核提示
      + (isReadOnly ? '' : '<div class="dr-review-hint">请对照原始记录核实整理内容，并确认归属主题。确认后仅写入L4原始记录，不自动形成L1摘要或L3关键事件。</div>')

      // 操作按钮
      + (!isReadOnly
          ? '<div class="dr-actions">'
            + '<button class="dr-btn-confirm" data-draft-id="' + d.id + '">确认并写入L4</button>'
            + '<button class="dr-btn-needs-info" data-draft-id="' + d.id + '">标记为需补充</button>'
            + '<button class="dr-btn-discard" data-draft-id="' + d.id + '">放弃这条草稿</button>'
            + '</div>'
          : '<div class="dr-actions"></div>')
      + '<div class="dr-source">可追溯来源：临时支持者记录</div>'
      + '</div>';
  }

  function buildDoneCard(d) {
    return '<div class="dr-card" data-draft-id="' + d.id + '" data-status="' + d.status + '">'
      + '<div class="dr-card-header">'
      + '<span class="dr-card-author">👤 ' + escapeHtml(d.authorName || '') + '</span>'
      + '<span class="dr-card-module">📂 ' + moduleLabel(d.selectedTheme || d.suggestedTheme) + '</span>'
      + '<span class="dr-card-status ' + d.status + '">' + statusLabel(d.status) + '</span>'
      + '</div>'
      + '<div class="dr-section"><div class="dr-section-label">📝 原始记录</div>'
      + '<div class="dr-section-text">' + escapeHtml(d.originalText || '') + '</div></div>'
      + '<div class="dr-section"><div class="dr-section-label">🤖 整理摘要</div>'
      + '<div class="dr-section-text">' + escapeHtml(d.organizedSummary || '') + '</div></div>'
      + '<div class="dr-source">审核者：' + escapeHtml(d.reviewerName || '') + ' · ' + (d.reviewedAt ? formatTime(d.reviewedAt) : '') + '</div>'
      + '</div>';
  }

  function statusLabel(s) {
    return { pending: '⏳ 待确认', needs_info: '📝 需补充', confirmed: '✅ 已入档', discarded: '🗑 已放弃' }[s] || s;
  }

  function bindEvents(container, drafts) {
    // 标签切换
    container.querySelectorAll('.dr-tab').forEach(function (tab) {
      tab.addEventListener('click', function () {
        container.querySelectorAll('.dr-tab').forEach(function (t) { t.classList.remove('active'); });
        this.classList.add('active');
        var tabName = this.getAttribute('data-tab');
        ['pending', 'needs-info', 'done'].forEach(function (name) {
          var el = container.querySelector('#dr-' + name + '-list');
          if (el) el.style.display = (name === tabName || (tabName === 'needs-info' && name === 'needs-info') || (tabName === 'pending' && name === 'pending')) ? '' : 'none';
        });
        // 映射 tab 名到 list id
        var listIds = { pending: 'dr-pending-list', 'needs-info': 'dr-needs-info-list', done: 'dr-done-list' };
        Object.keys(listIds).forEach(function (k) {
          var el = container.querySelector('#' + listIds[k]);
          if (el) el.style.display = (k === tabName) ? '' : 'none';
        });
      });
    });

    // A3: 确认入档（防重复）
    container.querySelectorAll('.dr-btn-confirm').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var draftId = this.getAttribute('data-draft-id');
        var draft = drafts.find(function (d) { return d.id === draftId; });
        if (!draft) return;

        // 幂等检查
        if (draft.status !== 'pending') return;

        // 立即禁用按钮防重复点击
        this.disabled = true;
        this.textContent = '处理中...';
        container.querySelectorAll('.dr-btn-needs-info[data-draft-id="' + draftId + '"]').forEach(function (b) { b.disabled = true; });
        container.querySelectorAll('.dr-btn-discard[data-draft-id="' + draftId + '"]').forEach(function (b) { b.disabled = true; });

        // 读取编辑内容
        var summaryEl = container.querySelector('.dr-summary-edit[data-draft-id="' + draftId + '"]');
        var moduleEl = container.querySelector('.dr-module-select[data-draft-id="' + draftId + '"]');
        var finalSummary = summaryEl ? summaryEl.value.trim() : (draft.organizedSummary || '');
        var finalTheme = moduleEl ? moduleEl.value : (draft.selectedTheme || draft.suggestedTheme);

        // 获取审核人
        var reviewer = getCurrentUser();
        var now = new Date();
        var nowISO = now.toISOString();

        // A3: 幂等检查 —— localStorage
        if (draft.archivedRecordId) return;

        // 写入 L4 原始记录
        var recType = finalTheme === 'emotion' ? 'emotion' : (finalTheme === 'work' ? 'activity' : 'care');
        var dateStr = nowISO.split('T')[0];
        var timeStr = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');

        // A2: L4 同时保留原始记录 + 最终确认摘要 + 记录者 + 审核者
        var l4Content = '【原始记录】\n' + (draft.originalText || '')
          + '\n\n【审核确认摘要】\n' + finalSummary
          + '\n\n【记录信息】\n记录者：' + (draft.authorName || '临时支持者')
          + ' · 审核者：' + (reviewer ? reviewer.name : '')
          + ' · 提交时间：' + formatTime(draft.createdAt)
          + ' · 审核时间：' + now.toLocaleString('zh-CN')
          + ' · 来源：临时支持者快速记录';

        var recordId = window.DataStore.addRecord(recType, {
          title: '临时支持者记录',
          content: l4Content,
          author: draft.authorName || '临时支持者',
          authorRole: 'temp_supporter',
          date: dateStr,
          time: timeStr,
          module: finalTheme,
          tags: draft.tags || [],
          _source: 'quick-record',
          _draftId: draftId,
          _reviewer: reviewer ? reviewer.name : ''
        });

        // 更新草稿状态
        draft.status = 'confirmed';
        draft.selectedTheme = finalTheme;
        draft.organizedSummary = finalSummary;
        draft.reviewerId = reviewer ? (reviewer.id || '') : '';
        draft.reviewerName = reviewer ? (reviewer.name || '') : '';
        draft.reviewedAt = nowISO;
        draft.archivedRecordId = recordId;
        saveDrafts(drafts);

        // 生成 L1/L3 候选
        generateCandidate(draft, finalTheme);

        // 更新卡片UI
        var card = container.querySelector('.dr-card[data-draft-id="' + draftId + '"]');
        if (card) {
          card.setAttribute('data-status', 'confirmed');
          card.querySelector('.dr-card-status').className = 'dr-card-status confirmed';
          card.querySelector('.dr-card-status').textContent = '✅ 已入档';
          card.querySelector('.dr-actions').innerHTML = '<button class="dr-btn-view-record" data-draft-id="' + draftId + '">查看已入档记录</button>';
        }

        window.showToast && window.showToast('已写入档案');
      });
    });

    // 查看已入档记录
    container.addEventListener('click', function (e) {
      var viewBtn = e.target.closest('.dr-btn-view-record');
      if (viewBtn) {
        var draftId = viewBtn.getAttribute('data-draft-id');
        var draft = drafts.find(function (d) { return d.id === draftId; });
        if (draft && draft.selectedTheme) {
          window.location.hash = draft.selectedTheme;
        }
      }
    });

    // 需补充
    container.querySelectorAll('.dr-btn-needs-info').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var draftId = this.getAttribute('data-draft-id');
        var draft = drafts.find(function (d) { return d.id === draftId; });
        if (!draft || draft.status !== 'pending') return;
        draft.status = 'needs_info';
        saveDrafts(drafts);
        var card = container.querySelector('.dr-card[data-draft-id="' + draftId + '"]');
        if (card) {
          card.setAttribute('data-status', 'needs_info');
          card.querySelector('.dr-card-status').className = 'dr-card-status needs_info';
          card.querySelector('.dr-card-status').textContent = '📝 需补充';
          card.querySelector('.dr-actions').innerHTML = '';
        }
      });
    });

    // 放弃
    container.querySelectorAll('.dr-btn-discard').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var draftId = this.getAttribute('data-draft-id');
        var draft = drafts.find(function (d) { return d.id === draftId; });
        if (!draft || draft.status !== 'pending') return;
        draft.status = 'discarded';
        saveDrafts(drafts);
        var card = container.querySelector('.dr-card[data-draft-id="' + draftId + '"]');
        if (card) {
          card.setAttribute('data-status', 'discarded');
          card.querySelector('.dr-card-status').className = 'dr-card-status discarded';
          card.querySelector('.dr-card-status').textContent = '🗑 已放弃';
          card.querySelector('.dr-actions').innerHTML = '';
        }
      });
    });
  }

  function getCurrentUser() {
    var ds = window.DataStore;
    var appState = window.AppState;
    return ds ? (ds.getCurrentUser() || (appState && appState.currentUser) || null) : null;
  }

  /** 检查是否触发 L1/L3 候选事件 */
  function generateCandidate(draft, moduleKey) {
    var candidates = getCandidates();
    var evt = {
      draftId: draft.id,
      moduleKey: moduleKey,
      type: 'new_record',
      text: '来自临时支持者确认记录：' + (draft.organizedSummary || draft.originalText || '').substring(0, 60),
      createdAt: new Date().toISOString(),
      status: 'candidate'
    };
    candidates.push(evt);
    saveCandidates(candidates);
  }

  function escapeHtml(s) { return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  function formatTime(iso) {
    try { return new Date(iso).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }); } catch (e) { return ''; }
  }

  window.DraftReviewPage = {
    render: renderDraftReview,
    getDrafts: getDrafts,
    DRAFTS_KEY: DRAFTS_KEY
  };
})();
