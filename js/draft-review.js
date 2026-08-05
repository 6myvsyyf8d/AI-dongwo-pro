/**
 * ============================================================
 * AI懂我 - 待确认记录审核页
 * ============================================================
 * 路由：#draft-review
 * 家长/老师查看、修改、确认或放弃临时支持者提交的草稿。
 * 确认后写入 L4 原始记录，按规则检查是否生成 L1/L3 候选事件。
 * ============================================================
 */
(function () {
  'use strict';

  var DRAFTS_KEY = 'ai_dongwo_pending_drafts';
  var CANDIDATES_KEY = 'ai_dongwo_l1l3_candidates';

  function getDrafts() {
    try { return JSON.parse(localStorage.getItem(DRAFTS_KEY) || '[]'); } catch (e) { return []; }
  }
  function saveDrafts(d) { localStorage.setItem(DRAFTS_KEY, JSON.stringify(d)); }

  function getCandidates() {
    try { return JSON.parse(localStorage.getItem(CANDIDATES_KEY) || '[]'); } catch (e) { return []; }
  }
  function saveCandidates(c) { localStorage.setItem(CANDIDATES_KEY, JSON.stringify(c)); }

  function moduleLabel(m) { return { emotion: '情绪与行为', work: '工作支持', care: '照护与医疗' }[m] || m; }

  function renderDraftReview() {
    var container = document.getElementById('draft-review-content');
    if (!container) return;
    var drafts = getDrafts();
    var pending = drafts.filter(function (d) { return d.status === 'pending'; });
    container.innerHTML = buildPage(pending);
    bindEvents(container, drafts);
  }

  function buildPage(pending) {
    var html = '<div class="dr-page">';
    html += '<div class="dr-header"><div class="dr-title">待确认记录</div>';
    html += '<div class="dr-count">共 ' + pending.length + ' 条待确认</div></div>';

    if (pending.length === 0) {
      html += '<div class="dr-empty"><div class="dr-empty-icon">📋</div><p>暂无待确认记录</p></div>';
    } else {
      html += '<div class="dr-list">';
      pending.forEach(function (d) {
        html += buildDraftCard(d);
      });
      html += '</div>';
    }
    html += '</div>';
    return html;
  }

  function buildDraftCard(d) {
    return '<div class="dr-card" data-draft-id="' + d.id + '">'
      + '<div class="dr-card-header">'
      + '<span class="dr-card-author">👤 ' + (d.author || '临时支持者') + '</span>'
      + '<span class="dr-card-module">📂 ' + moduleLabel(d.suggestedModule) + '</span>'
      + '<span class="dr-card-status pending">⏳ 待确认</span>'
      + '</div>'

      + '<div class="dr-section"><div class="dr-section-label">📝 原始记录</div>'
      + '<div class="dr-section-text">' + escapeHtml(d.originalText) + '</div></div>'

      + '<div class="dr-section"><div class="dr-section-label">🤖 演示整理摘要</div>'
      + '<textarea class="dr-summary-edit" data-draft-id="' + d.id + '">' + escapeHtml(d.aiSummary) + '</textarea></div>'

      + '<div class="dr-section"><div class="dr-section-label">📂 归属主题</div>'
      + '<select class="dr-module-select" data-draft-id="' + d.id + '">'
      + ['emotion', 'work', 'care'].map(function (m) {
          return '<option value="' + m + '"' + (d.suggestedModule === m ? ' selected' : '') + '>' + moduleLabel(m) + '</option>';
        }).join('')
      + '</select></div>'

      + '<div class="dr-actions">'
      + '<button class="dr-btn-confirm" data-draft-id="' + d.id + '">确认入档</button>'
      + '<button class="dr-btn-discard" data-draft-id="' + d.id + '">放弃</button>'
      + '</div>'
      + '<div class="dr-source">可追溯来源：临时支持者记录</div>'
      + '</div>';
  }

  function bindEvents(container, drafts) {
    container.querySelectorAll('.dr-btn-confirm').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var draftId = this.getAttribute('data-draft-id');
        var draft = drafts.find(function (d) { return d.id === draftId; });
        if (!draft) return;

        // Read edited summary and module
        var summaryEl = container.querySelector('.dr-summary-edit[data-draft-id="' + draftId + '"]');
        var moduleEl = container.querySelector('.dr-module-select[data-draft-id="' + draftId + '"]');
        var finalSummary = summaryEl ? summaryEl.value.trim() : draft.aiSummary;
        var finalModule = moduleEl ? moduleEl.value : draft.suggestedModule;

        // Write to DataStore as record
        var recType = finalModule === 'emotion' ? 'emotion' : (finalModule === 'work' ? 'activity' : 'care');
        var now = new Date();
        var dateStr = now.toISOString().split('T')[0];
        var timeStr = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
        window.DataStore.addRecord(recType, {
          title: '临时支持者记录',
          content: '[原始记录] ' + draft.originalText + ' [摘要] ' + finalSummary,
          author: draft.author,
          authorRole: 'temp_supporter',
          date: dateStr,
          time: timeStr,
          module: finalModule,
          tags: draft.tags || [],
          _source: 'quick-record',
          _draftId: draftId
        });

        // Mark draft as confirmed
        draft.status = 'confirmed';
        draft.confirmedAt = now.toISOString();
        draft.confirmedModule = finalModule;
        draft.confirmedSummary = finalSummary;
        saveDrafts(drafts);

        // Generate L1/L3 candidate event if applicable
        generateCandidate(draft, finalModule);

        // Show confirmed state in card
        var card = container.querySelector('.dr-card[data-draft-id="' + draftId + '"]');
        if (card) {
          card.querySelector('.dr-card-status').className = 'dr-card-status confirmed';
          card.querySelector('.dr-card-status').textContent = '✅ 已入档';
          card.querySelector('.dr-actions').innerHTML = '<span style="color:#52C41A;font-size:0.85rem;">✓ 已写入 ' + moduleLabel(finalModule) + ' 时间轴</span>';
        }

        window.showToast && window.showToast('已写入档案');
      });
    });

    container.querySelectorAll('.dr-btn-discard').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var draftId = this.getAttribute('data-draft-id');
        var draft = drafts.find(function (d) { return d.id === draftId; });
        if (!draft) return;
        draft.status = 'discarded';
        saveDrafts(drafts);
        var card = container.querySelector('.dr-card[data-draft-id="' + draftId + '"]');
        if (card) {
          card.querySelector('.dr-card-status').className = 'dr-card-status discarded';
          card.querySelector('.dr-card-status').textContent = '🗑 已放弃';
          card.querySelector('.dr-actions').innerHTML = '';
        }
      });
    });
  }

  /** 检查是否触发 L1/L3 候选事件，存入候选列表等待二次确认 */
  function generateCandidate(draft, moduleKey) {
    var candidates = getCandidates();
    var evt = {
      draftId: draft.id,
      moduleKey: moduleKey,
      type: 'new_record',
      text: '来自临时支持者确认记录：' + (draft.aiSummary || draft.originalText).substring(0, 60),
      createdAt: new Date().toISOString(),
      status: 'candidate' // candidate → confirmed if reviewed
    };
    candidates.push(evt);
    saveCandidates(candidates);
  }

  function escapeHtml(s) { return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  window.DraftReviewPage = {
    render: renderDraftReview,
    getDrafts: getDrafts,
    DRAFTS_KEY: DRAFTS_KEY
  };
})();
