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
   * 专门回答：哪些档案信息缺失、过期、冲突或尚未确认？下一步应该处理什么？
   * 权限：temp_supporter 和 government 禁止访问
   */
  function renderArchiveStatus() {
    var contentArea = document.getElementById('archive-status-content');
    if (!contentArea) return;

    // === 权限拦截 ===
    var user = DataStore.getCurrentUser();
    var role = user ? user.role : 'parent';
    if (role === 'temp_supporter' || role === 'government') {
      contentArea.innerHTML = '<div style="padding:32px;text-align:center;color:#999;">' +
        '<div style="font-size:2.5rem;margin-bottom:12px;">🔒</div>' +
        '<p style="font-size:1rem;color:#666;">当前角色无法访问档案状态</p>' +
        '<a href="#home" style="color:#4A90D9;font-size:0.9rem;">← 返回首页</a></div>';
      return;
    }

    var HTML = C.escapeHtml || (function(s) { return String(s).replace(/[&<>"]/g, function(m) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]; }); });
    var statusItems = [];

    // ========== 关键字段定义 ==========
    var KEY_FIELDS = [
      { module: 'communication', label: '沟通说明书', hash: 'communication',
        checks: [
          { name: '有效沟通方式', src: function() { var g = C.communicationGuide; return g && g.best && g.best.length > 0; } },
          { name: '需要避免的表达', src: function() { var g = C.communicationGuide; return g && g.avoid && g.avoid.length > 0; } }
        ], severity: 1 },
      { module: 'emotion', label: '情绪与行为支持', hash: 'emotion',
        checks: [
          { name: '压力信号', src: function() { var e = C.emotionSupport; return e && e.warnings && e.warnings.length > 0; } },
          { name: '触发因素', src: function() { var e = C.emotionSupport; return e && e.triggers && e.triggers.length > 0; } },
          { name: '有效安抚方式', src: function() { var e = C.emotionSupport; return e && e.soothing && e.soothing.length > 0; } }
        ], severity: 1 },
      { module: 'care', label: '照护与医疗', hash: 'care',
        checks: [
          { name: '过敏信息', src: function() { var c = C.careInfo; return c && c.allergy && c.allergy.items && c.allergy.items.length > 0 && c.allergy.items !== '无'; } },
          { name: '用药状态', src: function() { var c = C.careInfo; return c && c.medicine && c.medicine !== '无'; } },
          { name: '紧急处理方式', src: function() { var c = C.careInfo; return c && c.special && c.special.length > 0; } }
        ], severity: 0 },
      { module: 'work', label: '工作支持', hash: 'work',
        checks: [
          { name: '可独立完成事项', src: function() { var w = C.workInfo; return w && w.canDo && w.canDo.length > 0; } },
          { name: '需要协助事项', src: function() { var w = C.workInfo; return w && w.needSupport && w.needSupport.length > 0; } }
        ], severity: 2 },
      { module: 'relations', label: '关系与社交', hash: 'relations',
        checks: [
          { name: '紧急联系人', src: function() { var r = C.relationsInfo; return r && r.core && r.core.length > 0; } },
          { name: '核心支持者', src: function() { var r = C.relationsInfo; return r && r.core && r.core.length > 0; } }
        ], severity: 0 },
      { module: 'life', label: '我喜欢的生活', hash: 'life',
        checks: [
          { name: '主要偏好', src: function() { var l = C.likesList; return l && l.length > 0; } },
          { name: '作息或重要生活习惯', src: function() { var d = C.dailyRoutine; return d && d.length > 0; } }
        ], severity: 2 }
    ];

    // ========== 1. 关键字段缺失 ==========
    KEY_FIELDS.forEach(function(mod) {
      var recs = DataStore.getRecordsByModule(mod.module);
      var hasRecords = recs && recs.length > 0;
      var lastDate = hasRecords ? recs[0].date : null;
      var lastAuthor = hasRecords ? (recs[0].author || '系统') : '系统';

      mod.checks.forEach(function(chk) {
        if (!chk.src()) {
          statusItems.push({
            type: 'missing', severity: mod.severity,
            typeLabel: '关键资料缺失', icon: '📋',
            text: mod.label + '：尚未填写「' + chk.name + '」',
            detail: hasRecords ? '已有 ' + recs.length + ' 条记录，但关键字段为空' : '尚无记录',
            hash: mod.hash, actionLabel: '去补充',
            updatedAt: lastDate ? '最后更新：' + lastDate + ' · ' + lastAuthor : '暂无更新'
          });
        }
      });
    });

    // ========== 2. 信息冲突（安全级 severity=0）==========
    var medConflict = DataStore.validateMedicalConsistency ? DataStore.validateMedicalConsistency() : null;
    if (medConflict) {
      statusItems.push({
        type: 'conflict', severity: 0,
        typeLabel: '安全/医疗冲突', icon: '⚠️',
        text: '用药数据不一致：存在冲突记录',
        detail: medConflict.detail || '',
        hash: 'care', actionLabel: '去处理',
        updatedAt: '来源：系统检测'
      });
    }

    // 检查过敏信息不一致
    var allergyRecs = (DataStore.getRecordsByModule('care') || []).filter(function(r) {
      return (r.title || '').indexOf('过敏') >= 0 || (r.content || '').indexOf('过敏') >= 0;
    });
    if (allergyRecs.length >= 2 && C.careInfo && C.careInfo.allergy) {
      statusItems.push({
        type: 'conflict', severity: 0,
        typeLabel: '安全/医疗冲突', icon: '⚠️',
        text: '过敏信息有多条记录，请核实一致性',
        detail: '共 ' + allergyRecs.length + ' 条过敏相关记录',
        hash: 'care', actionLabel: '去核实',
        updatedAt: '来源：系统检测'
      });
    }

    // ========== 3. AI 待确认草稿 ==========
    try {
      var raw = localStorage.getItem('ai_dongwo_chat_sessions');
      if (raw) {
        var sessions = JSON.parse(raw);
        var draftCount = 0;
        sessions.forEach(function (s) {
          if (s.reviewItems && s.reviewItems.length > 0) {
            s.reviewItems.forEach(function (item) {
              if (!item.confirmed) draftCount++;
            });
          }
        });
        if (draftCount > 0) {
          statusItems.push({
            type: 'draft', severity: 1,
            typeLabel: 'AI 待确认草稿', icon: '🤖',
            text: draftCount + ' 份 AI 整理草稿等待确认',
            detail: '聊天产生的草稿需要人工审核后入档',
            hash: 'chat-review', actionLabel: '去审核',
            updatedAt: ''
          });
        }
      }
    } catch (e) { /* ignore */ }

    // ========== 4. 长期未复核 ==========
    var today = new Date();
    var cutoff14 = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000);
    var cutoff14Str = cutoff14.getFullYear() + '-' + String(cutoff14.getMonth()+1).padStart(2,'0') + '-' + String(cutoff14.getDate()).padStart(2,'0');
    var cutoff60 = new Date(today.getTime() - 60 * 24 * 60 * 60 * 1000);
    var cutoff60Str = cutoff60.getFullYear() + '-' + String(cutoff60.getMonth()+1).padStart(2,'0') + '-' + String(cutoff60.getDate()).padStart(2,'0');

    KEY_FIELDS.forEach(function(mod) {
      var recs = DataStore.getRecordsByModule(mod.module);
      if (!recs || recs.length === 0) return;
      var hasRecent = recs.some(function(r) { return r.date >= cutoff14Str; });
      if (!hasRecent) {
        var latest = recs[0];
        var daysAgo = Math.round((today - new Date(latest.date + 'T00:00:00')) / 86400000);
        statusItems.push({
          type: 'stale', severity: 2,
          typeLabel: '长期未复核', icon: '⏰',
          text: mod.label + '：超过 ' + daysAgo + ' 天未更新',
          detail: '最新：' + latest.date + ' · ' + (latest.author || '系统'),
          hash: mod.hash, actionLabel: '去更新',
          updatedAt: '超过 ' + (daysAgo >= 60 ? '60' : '14') + ' 天未变动'
        });
      }
    });

    // ========== 排序 ==========
    statusItems.sort(function(a, b) { return a.severity - b.severity; });

    // ========== 渲染 ==========
    var html = '';
    html += '<p class="at-intro">档案状态帮助你了解哪些支持信息还不足，哪里需要补充或核实。<span style="color:#999;">这评价的是资料完整度，不代表对心青年本人的任何评价。</span></p>';

    if (statusItems.length === 0) {
      html += '<div class="as-section" style="text-align:center;padding:32px 16px;">';
      html += '<div style="font-size:3rem;margin-bottom:12px;">✅</div>';
      html += '<div style="font-size:1rem;color:#333;margin-bottom:8px;">当前没有需要处理的档案问题</div>';
      html += '<a href="#archive" style="font-size:0.9rem;color:#4A90D9;">← 返回档案总览</a>';
      html += '</div>';
    } else {
      // 按 severity 分组
      var groups = [
        { key: 0, title: '⚠️ 安全与冲突', cls: 'danger' },
        { key: 1, title: '📋 关键资料缺失 / 待审核', cls: 'warning' },
        { key: 2, title: '🔍 建议完善', cls: 'info' }
      ];

      groups.forEach(function(g) {
        var items = statusItems.filter(function(i) { return i.severity === g.key; });
        if (items.length === 0) return;

        html += '<div class="as-section">';
        html += '<h3 class="as-heading as-heading-' + g.cls + '">' + g.title + '</h3>';

        items.forEach(function(item) {
          var colorMap = { danger: '#F5222D', warning: '#FAAD14', info: '#4A90D9' };
          var color = colorMap[g.cls] || '#999';

          html += '<div class="as-item as-' + g.cls + '" style="padding:12px 14px;margin-bottom:8px;background:#fff;border-radius:10px;border-left:3px solid ' + color + ';box-shadow:0 1px 3px rgba(0,0,0,0.04);">';
          html += '<div style="display:flex;align-items:flex-start;gap:8px;">';
          html += '<span style="font-size:1.1rem;flex-shrink:0;">' + item.icon + '</span>';
          html += '<div style="flex:1;min-width:0;">';
          html += '<div style="font-size:0.88rem;font-weight:600;color:#333;margin-bottom:2px;">' + item.text + '</div>';
          html += '<div style="font-size:0.75rem;color:#999;margin-bottom:6px;">' + item.detail + '</div>';
          if (item.updatedAt) {
            html += '<div style="font-size:0.7rem;color:#bbb;">' + item.updatedAt + '</div>';
          }
          html += '</div>';
          html += '<a href="#' + item.hash + '" style="flex-shrink:0;display:inline-block;padding:5px 12px;background:' + color + ';color:#fff;border-radius:6px;font-size:0.75rem;text-decoration:none;margin-top:2px;">' + item.actionLabel + ' →</a>';
          html += '</div>';
          html += '</div>';
        });
        html += '</div>';
      });
    }

    html += '<div class="as-footer">最后检查时间：' + (new Date().toLocaleString('zh-CN')) + '</div>';

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
