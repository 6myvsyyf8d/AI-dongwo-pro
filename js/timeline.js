/* ==========================================================
 * timeline.js - 时间轴页面模块
 * 依赖: window.Utils, window.Constants, window.AppState, window.DataStore, window.Modules
 * ========================================================== */

(function () {
  'use strict';

  // 本地别名
  var ROLES = window.Constants.ROLES;
  var RECORD_TYPES = window.Constants.RECORD_TYPES;
  var DataStore = window.DataStore;
  var appState = window.AppState;

  function renderTimeline() {
    var contentArea = document.getElementById('timeline-content');
    if (!contentArea) return;

    var html = '';

    html += '<div class="container" style="padding:24px;">';

    // 获取当前用户角色
    var currentUser = DataStore.getCurrentUser() || appState.currentUser;
    var currentRole = currentUser ? currentUser.role : 'parent';
    var isYouth = (currentRole === 'youth');

    // 角色可见记录类型
    var roleRecordFilters = {
      parent: null,
      teacher: ['activity', 'communication', 'emotion', 'strategy', 'note'],
      caregiver: ['care', 'communication', 'emotion', 'strategy', 'note'],
      youth: ['mood', 'note'],
      government: null,
      admin: null
    };

    // ========== 筛选区域 ==========
    html += '<div style="background:#fff;border-radius:12px;padding:14px 16px;margin-bottom:20px;box-shadow:0 1px 4px rgba(0,0,0,0.04);">';
    html += '  <div style="font-size:0.85rem;color:#666;margin-bottom:4px;font-weight:500;">🔍 筛选记录</div>';

    if (isYouth) {
      // ========== 心青年：类型 + 时间段 ==========
      html += '  <div style="font-size:0.75rem;color:#999;margin-bottom:2px;">类型</div>';
      html += '  <div class="filter-chip-row" id="filter-row-type">';
      html += '    <span class="filter-chip' + (window.AppState.timelineFilters.type === 'all' ? ' active' : '') + '" data-value="all">全部</span>';
      (roleRecordFilters.youth || []).forEach(function (tKey) {
        var t = RECORD_TYPES[tKey];
        if (t) {
          html += '    <span class="filter-chip' + (window.AppState.timelineFilters.type === tKey ? ' active' : '') + '" data-value="' + tKey + '">' + t.icon + ' ' + t.label + '</span>';
        }
      });
      html += '  </div>';

      html += '  <div style="font-size:0.75rem;color:#999;margin-top:8px;margin-bottom:2px;">时间</div>';
      html += '  <div class="filter-chip-row" id="filter-row-timerange">';
      var timeOptions = [
        { value: 'all', label: '全部' },
        { value: 'today', label: '今天' },
        { value: 'week', label: '本周' },
        { value: 'month', label: '本月' }
      ];
      timeOptions.forEach(function (opt) {
        html += '    <span class="filter-chip' + (window.AppState.timelineFilters.timeRange === opt.value ? ' active' : '') + '" data-value="' + opt.value + '">' + opt.label + '</span>';
      });
      html += '  </div>';
    } else {
      // ========== 其他角色：角色 + 类型 ==========
      html += '  <div style="font-size:0.75rem;color:#999;margin-bottom:2px;">角色</div>';
      html += '  <div class="filter-chip-row" id="filter-row-role">';
      html += '    <span class="filter-chip' + (window.AppState.timelineFilters.role === 'all' ? ' active' : '') + '" data-value="all">全部</span>';
      Object.keys(ROLES).forEach(function (rKey) {
        // 排除不写入记录的角色：政府、管理员
        if (rKey === 'government' || rKey === 'admin') return;
        var r = ROLES[rKey];
        html += '    <span class="filter-chip' + (window.AppState.timelineFilters.role === rKey ? ' active' : '') + '" data-value="' + rKey + '">' + r.label + '</span>';
      });
      html += '  </div>';

      html += '  <div style="font-size:0.75rem;color:#999;margin-top:8px;margin-bottom:2px;">类型</div>';
      html += '  <div class="filter-chip-row" id="filter-row-type">';
      html += '    <span class="filter-chip' + (window.AppState.timelineFilters.type === 'all' ? ' active' : '') + '" data-value="all">全部</span>';
      Object.keys(RECORD_TYPES).forEach(function (tKey) {
        var t = RECORD_TYPES[tKey];
        html += '    <span class="filter-chip' + (window.AppState.timelineFilters.type === tKey ? ' active' : '') + '" data-value="' + tKey + '">' + t.icon + ' ' + t.label + '</span>';
      });
      html += '  </div>';
    }

    html += '  </div>';
    html += '</div>';

    // ========== 标题 ==========
    html += '<h2 style="font-size:1.1rem;color:#333;margin-bottom:12px;display:flex;align-items:center;gap:8px;">';
    html += '  <span>📋</span>';
    html += isYouth ? '我的记录' : '协同记录';
    html += '</h2>';

    // ========== 记录获取与过滤 ==========
    var records = DataStore.getRecords();

    // 根据当前角色过滤可见的记录类型
    var allowedTypes = roleRecordFilters[currentRole];
    if (allowedTypes) {
      records = records.filter(function (r) {
        return allowedTypes.indexOf(r.type) !== -1;
      });
    }

    // 应用筛选
    var filteredRecords = records.filter(function (r) {
      if (isYouth) {
        // 心青年：类型 + 时间段筛选
        if (window.AppState.timelineFilters.type !== 'all' && r.type !== window.AppState.timelineFilters.type) return false;
        if (window.AppState.timelineFilters.timeRange !== 'all') {
          var now = new Date();
          var recordDate = new Date(r.timestamp);
          if (window.AppState.timelineFilters.timeRange === 'today') {
            if (recordDate.toDateString() !== now.toDateString()) return false;
          } else if (window.AppState.timelineFilters.timeRange === 'week') {
            var weekStart = new Date(now);
            weekStart.setDate(now.getDate() - now.getDay());
            weekStart.setHours(0, 0, 0, 0);
            if (recordDate < weekStart) return false;
          } else if (window.AppState.timelineFilters.timeRange === 'month') {
            if (recordDate.getMonth() !== now.getMonth() || recordDate.getFullYear() !== now.getFullYear()) return false;
          }
        }
      } else {
        // 其他角色：角色 + 类型筛选
        if (window.AppState.timelineFilters.role !== 'all' && r.authorRole !== window.AppState.timelineFilters.role) return false;
        if (window.AppState.timelineFilters.type !== 'all' && r.type !== window.AppState.timelineFilters.type) return false;
      }
      return true;
    });

    if (filteredRecords.length === 0) {
      html += '<div style="background:#fff;border-radius:12px;padding:32px;text-align:center;color:#999;font-size:0.9rem;margin-bottom:24px;box-shadow:0 1px 4px rgba(0,0,0,0.04);">';
      html += '  <div style="font-size:2rem;margin-bottom:8px;">📭</div>';
      html += '  暂无符合条件的记录';
      html += '</div>';
    } else {
      html += '<div style="margin-bottom:24px;">';
      filteredRecords.forEach(function (record) {
        html += (window.renderRecordCard ? window.renderRecordCard(record, false) : '');
      });
      html += '</div>';
    }

    html += '</div>';

    contentArea.innerHTML = html;

    // 绑定筛选标签点击事件
    var filterRows = contentArea.querySelectorAll('.filter-chip-row');
    filterRows.forEach(function (row) {
      row.addEventListener('click', function (e) {
        var chip = e.target.closest('.filter-chip');
        if (!chip) return;
        var value = chip.getAttribute('data-value');
        var rowId = row.id;
        if (rowId === 'filter-row-role') {
          window.AppState.timelineFilters.role = value;
        } else if (rowId === 'filter-row-type') {
          window.AppState.timelineFilters.type = value;
        } else if (rowId === 'filter-row-timerange') {
          window.AppState.timelineFilters.timeRange = value;
        }
        renderTimeline();
      });
    });

    // 绑定时间轴卡片点击展开/收起
    contentArea.querySelectorAll('.timeline-card').forEach(function (card) {
      card.addEventListener('click', function () {
        this.classList.toggle('expanded');
      });
    });
  }

  // ==========================================================
  // 导出到 window
  // ==========================================================
  window.TimelinePage = {
    renderTimeline: renderTimeline
  };

  // 向后兼容：直接暴露到 window
  window.renderTimeline = renderTimeline;

})();