/**
 * archive.js — 档案模块：主题档案入口 + 档案状态
 * 挂载：window.ArchivePage
 * 依赖：window.Utils, window.Constants, window.DataStore, window.AppState
 */
(function () {
  'use strict';

  var DataStore = window.DataStore;
  var C = window.Constants;
  var basicInfo = C.basicInfo;

  /** 六大主题档案配置 */
  var ARCHIVE_THEMES = [
    { hash: 'life',          icon: '❤️', title: '我喜欢的生活',  desc: '兴趣、优势、愿望，以及希望别人怎样支持我', color: '#4A90D9' },
    { hash: 'communication', icon: '💬', title: '沟通说明书',    desc: '有效话术、沟通节奏、需要避免的用语',     color: '#722ED1' },
    { hash: 'emotion',       icon: '🌊', title: '情绪与行为支持',desc: '压力信号、触发因素、有效的安抚策略',     color: '#F5222D' },
    { hash: 'care',          icon: '💊', title: '照护与医疗',    desc: '过敏、用药、作息、体检与特别注意事项',   color: '#52C41A' },
    { hash: 'work',          icon: '💼', title: '工作支持',      desc: '擅长的事、需要协助的地方、避免的安排',   color: '#FAAD14' },
    { hash: 'relations',     icon: '👥', title: '关系与社交',    desc: '重要关系、相处偏好、社交支持与边界',     color: '#13C2C2' }
  ];

  function _colorAlpha(color, alpha) {
    if (color.startsWith('#')) {
      var r = parseInt(color.slice(1, 3), 16);
      var g = parseInt(color.slice(3, 5), 16);
      var b = parseInt(color.slice(5, 7), 16);
      return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
    }
    return color;
  }

  /**
   * 渲染「主题档案」页面 — #archive-topics
   */
  function renderArchiveTopics() {
    var contentArea = document.getElementById('archive-topics-content');
    if (!contentArea) return;

    var html = '';

    html += '<p class="at-intro">六大主题档案，帮你全面了解' + (basicInfo ? basicInfo.name : '心青年') + '的支持需求。点击任一主题查看详细信息。</p>';

    html += '<div class="at-cards">';
    ARCHIVE_THEMES.forEach(function (theme) {
      var records = DataStore.getRecordsByModule(theme.hash);
      var count = records ? records.length : 0;

      html += '<div class="at-card" data-navigate="' + theme.hash + '" style="border-left-color:' + theme.color + ';">';
      html += '  <div class="at-card-row">';
      html += '    <div class="at-card-icon" style="background:' + _colorAlpha(theme.color, 0.1) + ';">';
      html += '      <span>' + theme.icon + '</span>';
      html += '    </div>';
      html += '    <div class="at-card-body">';
      html += '      <div class="at-card-title">' + theme.title + '</div>';
      html += '      <div class="at-card-desc">' + theme.desc + '</div>';
      html += '    </div>';
      html += '    <div class="at-card-end">';
      html += '      <div class="at-card-count">' + count + ' 条记录</div>';
      html += '      <div class="at-card-arrow">›</div>';
      html += '    </div>';
      html += '  </div>';
      html += '</div>';
    });
    html += '</div>';

    contentArea.innerHTML = html;

    contentArea.querySelectorAll('.at-card[data-navigate]').forEach(function (card) {
      card.addEventListener('click', function () {
        window.location.hash = this.getAttribute('data-navigate');
      });
    });
  }

  /**
   * 渲染「档案状态」页面 — #archive-status
   */
  function renderArchiveStatus() {
    var contentArea = document.getElementById('archive-status-content');
    if (!contentArea) return;

    var html = '';
    html += '<p class="at-intro">档案状态帮助你了解哪些支持信息还不足，哪里需要补充或核实。这评价的是资料完整度，不是心青年本人。</p>';

    // ===== 1. 资料缺口 =====
    html += '<div class="as-section">';
    html += '<h3 class="as-heading">📋 资料缺口</h3>';

    var gapItems = [];
    ARCHIVE_THEMES.forEach(function (theme) {
      var count = DataStore.getRecordsByModule(theme.hash).length;
      if (count === 0) { gapItems.push({ theme: theme, reason: '暂无记录' }); }
      else if (count < 3) { gapItems.push({ theme: theme, reason: '记录较少（' + count + '条）' }); }
    });

    if (gapItems.length > 0) {
      gapItems.forEach(function (gap) {
        html += _statusRow('⚠️', 'warning', '<strong>' + gap.theme.title + '</strong>：' + gap.reason, gap.theme.hash, '补充');
      });
    } else {
      html += '<div class="as-ok">✅ 各主题均有记录</div>';
    }

    var allRecords = DataStore.getRecords();
    var youthRecords = allRecords.filter(function (r) { return r.authorRole === 'youth'; });
    if (youthRecords.length === 0) {
      html += '<div class="as-item as-warning">';
      html += '<span class="as-item-icon">💬</span>';
      html += '<span class="as-item-text">还没有心青年本人的记录。鼓励他用 AI 聊聊 记录自己的感受和想法。</span>';
      html += '</div>';
    }
    html += '</div>';

    // ===== 2. 长期未更新 =====
    html += '<div class="as-section">';
    html += '<h3 class="as-heading">⏰ 长期未更新</h3>';

    var today = new Date();
    var twoWeeksAgo = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000);
    var twoWeeksStr = twoWeeksAgo.getFullYear() + '-' + String(twoWeeksAgo.getMonth() + 1).padStart(2, '0') + '-' + String(twoWeeksAgo.getDate()).padStart(2, '0');

    var staleTopics = [];
    ARCHIVE_THEMES.forEach(function (theme) {
      var records = DataStore.getRecordsByModule(theme.hash);
      if (records.filter(function (r) { return r.date >= twoWeeksStr; }).length === 0 && records.length > 0) {
        staleTopics.push({ theme: theme, lastUpdate: records[0].date });
      }
    });

    if (staleTopics.length > 0) {
      staleTopics.forEach(function (stale) {
        html += _statusRow('🔔', 'danger', '<strong>' + stale.theme.title + '</strong>：超过2周未更新（最新：' + stale.lastUpdate + '）');
      });
    } else {
      html += '<div class="as-ok">✅ 近两周所有主题均有更新</div>';
    }
    html += '</div>';

    // ===== 3. 信息冲突 =====
    html += '<div class="as-section">';
    html += '<h3 class="as-heading">⚡ 信息冲突</h3>';

    var medConflict = DataStore.validateMedicalConsistency ? DataStore.validateMedicalConsistency() : null;
    if (medConflict) {
      html += _statusRow('⚠️', 'danger', '医疗信息冲突：用药数据不一致', 'care', '去处理');
    } else {
      html += '<div class="as-ok">✅ 未检测到信息冲突</div>';
    }
    html += '</div>';

    // ===== 4. AI 待确认草稿 =====
    html += '<div class="as-section">';
    html += '<h3 class="as-heading">🤖 AI 待确认草稿</h3>';

    var pendingDrafts = [];
    try {
      var raw = localStorage.getItem('ai_dongwo_chat_sessions');
      if (raw) {
        var sessions = JSON.parse(raw);
        sessions.forEach(function (s) {
          if (s.reviewItems && s.reviewItems.length > 0) {
            s.reviewItems.forEach(function (item) {
              if (!item.confirmed) {
                pendingDrafts.push(item.title || '未命名草稿');
              }
            });
          }
        });
      }
    } catch (e) { /* ignore */ }

    if (pendingDrafts.length > 0) {
      pendingDrafts.forEach(function (draft) {
        html += _statusRow('📝', 'purple', draft, 'chat-review', '去确认');
      });
    } else {
      html += '<div class="as-ok">✅ 没有待确认的 AI 草稿</div>';
    }
    html += '</div>';

    html += '<div class="as-footer">以上检查的是资料的完整度和时效性，不代表对心青年本人的任何评价。</div>';

    contentArea.innerHTML = html;
  }

  /**
   * 渲染单行状态条目（复用模板）
   */
  function _statusRow(icon, type, text, linkHash, linkLabel) {
    var cls = 'as-item as-' + type;
    var html = '<div class="' + cls + '">';
    html += '<span class="as-item-icon">' + icon + '</span>';
    html += '<span class="as-item-text">' + text + '</span>';
    if (linkHash && linkLabel) {
      html += '<a href="#' + linkHash + '" class="as-item-link">' + linkLabel + ' →</a>';
    }
    html += '</div>';
    return html;
  }

  window.ArchivePage = {
    renderArchiveTopics: renderArchiveTopics,
    renderArchiveStatus: renderArchiveStatus
  };

})();
