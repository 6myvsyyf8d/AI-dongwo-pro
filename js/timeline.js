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

    // 筛选区域
    html += '<div style="background:#fff;border-radius:12px;padding:16px;margin-bottom:20px;box-shadow:0 1px 4px rgba(0,0,0,0.04);">';
    html += '  <div style="font-size:0.85rem;color:#666;margin-bottom:8px;font-weight:500;">🔍 筛选记录</div>';
    html += '  <div style="display:flex;gap:12px;flex-wrap:wrap;">';

    // 角色筛选
    html += '    <div style="display:flex;align-items:center;gap:6px;">';
    html += '      <label style="font-size:0.8rem;color:#888;white-space:nowrap;">角色：</label>';
    html += '      <select id="filter-role" style="padding:6px 10px;border:1px solid #ddd;border-radius:6px;font-size:0.85rem;background:#fff;">';
    html += '        <option value="all">全部角色</option>';
    Object.keys(ROLES).forEach(function (rKey) {
      var r = ROLES[rKey];
      html += '        <option value="' + rKey + '"' + (window.AppState.timelineFilters.role === rKey ? ' selected' : '') + '>' + r.label + '</option>';
    });
    html += '      </select>';
    html += '    </div>';

    // 类型筛选
    html += '    <div style="display:flex;align-items:center;gap:6px;">';
    html += '      <label style="font-size:0.8rem;color:#888;white-space:nowrap;">类型：</label>';
    html += '      <select id="filter-type" style="padding:6px 10px;border:1px solid #ddd;border-radius:6px;font-size:0.85rem;background:#fff;">';
    html += '        <option value="all">全部类型</option>';
    Object.keys(RECORD_TYPES).forEach(function (tKey) {
      var t = RECORD_TYPES[tKey];
      html += '        <option value="' + tKey + '"' + (window.AppState.timelineFilters.type === tKey ? ' selected' : '') + '>' + t.icon + ' ' + t.label + '</option>';
    });
    html += '      </select>';
    html += '    </div>';

    html += '  </div>';
    html += '</div>';

    // 动态记录区域
    html += '<h2 style="font-size:1.1rem;color:#333;margin-bottom:12px;display:flex;align-items:center;gap:8px;">';
    html += '  <span>📋</span>协同记录';
    html += '</h2>';

    var records = DataStore.getRecords();

    // 根据当前角色过滤可见的记录类型
    var currentUser = DataStore.getCurrentUser() || appState.currentUser;
    var currentRole = currentUser ? currentUser.role : 'parent';
    var roleRecordFilters = {
      parent: null,
      teacher: ['activity', 'communication', 'emotion', 'strategy', 'note'],
      caregiver: ['care', 'communication', 'emotion', 'strategy', 'note'],
      youth: ['mood', 'note'],
      government: null,
      admin: null
    };
    var allowedTypes = roleRecordFilters[currentRole];
    if (allowedTypes) {
      records = records.filter(function (r) {
        return allowedTypes.indexOf(r.type) !== -1;
      });
    }

    // 应用筛选
    var filteredRecords = records.filter(function (r) {
      if (window.AppState.timelineFilters.role !== 'all' && r.authorRole !== window.AppState.timelineFilters.role) return false;
      if (window.AppState.timelineFilters.type !== 'all' && r.type !== window.AppState.timelineFilters.type) return false;
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

    // 绑定筛选事件
    var roleFilter = document.getElementById('filter-role');
    var typeFilter = document.getElementById('filter-type');

    if (roleFilter) {
      roleFilter.addEventListener('change', function () {
        window.AppState.timelineFilters.role = this.value;
        renderTimeline();
      });
    }
    if (typeFilter) {
      typeFilter.addEventListener('change', function () {
        window.AppState.timelineFilters.type = this.value;
        renderTimeline();
      });
    }

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