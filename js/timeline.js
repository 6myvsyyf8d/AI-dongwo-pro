/* ==========================================================
 * timeline.js - 时间轴页面模块
 * 依赖: window.Utils, window.Constants, window.AppState, window.DataStore, window.Modules
 * ========================================================== */

(function () {
  'use strict';

  // 本地别名
  var ROLES = window.Constants.ROLES;
  var RECORD_TYPES = window.Constants.RECORD_TYPES;
  var dailyRoutine = window.Constants.dailyRoutine;
  var likesList = window.Constants.likesList;
  var dislikesList = window.Constants.dislikesList;
  var communicationGuide = window.Constants.communicationGuide;
  var emotionSupport = window.Constants.emotionSupport;
  var relationsInfo = window.Constants.relationsInfo;
  var DataStore = window.DataStore;
  var appState = window.AppState;

  /**
   * 构建照护档案HTML（整合所有关键照护信息）
   */
  function buildCareProfile() {
    var html = '';

    // 标题
    html += '<h2 style="font-size:1.1rem;color:#333;margin-bottom:12px;display:flex;align-items:center;gap:8px;">';
    html += '  <span>🧡</span>照护档案';
    html += '  <span style="font-size:0.78rem;color:#999;font-weight:400;margin-left:auto;">快速了解小雨</span>';
    html += '</h2>';

    // === 安全提醒卡片（红色警告，最醒目）===
    html += '<div style="background:linear-gradient(135deg,#FFF1F0 0%,#FFE8E6 100%);border:1.5px solid #F5222D;border-radius:12px;padding:16px;margin-bottom:16px;">';
    html += '  <div style="font-size:0.95rem;font-weight:700;color:#F5222D;margin-bottom:8px;">🚫 安全红线</div>';
    html += '  <div style="display:flex;gap:8px;flex-wrap:wrap;">';
    html += '    <span style="background:#fff;color:#F5222D;padding:4px 12px;border-radius:6px;font-size:0.82rem;font-weight:500;">🦐 严禁海鲜（虾、蟹、贝类）</span>';
    html += '    <span style="background:#fff;color:#F5222D;padding:4px 12px;border-radius:6px;font-size:0.82rem;font-weight:500;">🤚 不要不打招呼碰他</span>';
    html += '    <span style="background:#fff;color:#F5222D;padding:4px 12px;border-radius:6px;font-size:0.82rem;font-weight:500;">⏰ 不要催他"快点"</span>';
    html += '    <span style="background:#fff;color:#F5222D;padding:4px 12px;border-radius:6px;font-size:0.82rem;font-weight:500;">📋 不要一次说很多件事</span>';
    html += '  </div>';
    html += '</div>';

    // === 基本信息卡片 ===
    html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">';
    // 喜好
    html += '<div style="background:#fff;border-radius:12px;padding:16px;box-shadow:0 1px 4px rgba(0,0,0,0.04);">';
    html += '  <div style="font-size:0.9rem;font-weight:600;color:#52C41A;margin-bottom:8px;">💚 喜欢的事物</div>';
    likesList.forEach(function (item) {
      html += '<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;font-size:0.82rem;color:#555;">';
      html += '<span style="font-size:1rem;">' + item.icon + '</span>';
      html += '<span><strong>' + item.title + '</strong> · ' + item.desc + '</span>';
      html += '</div>';
    });
    html += '</div>';
    // 不喜欢
    html += '<div style="background:#fff;border-radius:12px;padding:16px;box-shadow:0 1px 4px rgba(0,0,0,0.04);">';
    html += '  <div style="font-size:0.9rem;font-weight:600;color:#F5222D;margin-bottom:8px;">⚠️ 需要注意</div>';
    dislikesList.forEach(function (item) {
      html += '<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;font-size:0.82rem;color:#555;">';
      html += '<span style="font-size:1rem;">' + item.icon + '</span>';
      html += '<span><strong>' + item.title + '</strong> · ' + item.desc + '</span>';
      html += '</div>';
    });
    html += '</div>';
    html += '</div>';

    // === 沟通指南 ===
    html += '<div style="background:#fff;border-radius:12px;padding:16px;margin-bottom:16px;box-shadow:0 1px 4px rgba(0,0,0,0.04);">';
    html += '  <div style="font-size:0.9rem;font-weight:600;color:#4A90D9;margin-bottom:10px;">💬 沟通指南</div>';
    html += '  <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">';
    // 推荐方式
    html += '    <div>';
    html += '      <div style="font-size:0.8rem;color:#52C41A;font-weight:600;margin-bottom:4px;">✅ 推荐这样做</div>';
    communicationGuide.best.forEach(function (t) {
      html += '<div style="font-size:0.8rem;color:#555;margin-bottom:3px;padding-left:12px;position:relative;">';
      html += '<span style="position:absolute;left:0;color:#52C41A;">·</span>' + t + '</div>';
    });
    html += '    </div>';
    // 避免方式
    html += '    <div>';
    html += '      <div style="font-size:0.8rem;color:#F5222D;font-weight:600;margin-bottom:4px;">❌ 避免这样做</div>';
    communicationGuide.avoid.forEach(function (t) {
      html += '<div style="font-size:0.8rem;color:#555;margin-bottom:3px;padding-left:12px;position:relative;">';
      html += '<span style="position:absolute;left:0;color:#F5222D;">·</span>' + t + '</div>';
    });
    html += '    </div>';
    html += '  </div>';
    html += '</div>';

    // === 情绪支持 ===
    html += '<div style="background:#fff;border-radius:12px;padding:16px;margin-bottom:16px;box-shadow:0 1px 4px rgba(0,0,0,0.04);">';
    html += '  <div style="font-size:0.9rem;font-weight:600;color:#FAAD14;margin-bottom:10px;">🌈 情绪与行为支持</div>';
    html += '  <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">';
    // 触发因素
    html += '    <div style="background:#FFF7E6;border-radius:8px;padding:10px;">';
    html += '      <div style="font-size:0.78rem;color:#FAAD14;font-weight:600;margin-bottom:4px;">⚡ 触发因素</div>';
    emotionSupport.triggers.forEach(function (t) {
      html += '<div style="font-size:0.78rem;color:#666;margin-bottom:2px;">· ' + t + '</div>';
    });
    html += '    </div>';
    // 预警信号
    html += '    <div style="background:#FFF1F0;border-radius:8px;padding:10px;">';
    html += '      <div style="font-size:0.78rem;color:#F5222D;font-weight:600;margin-bottom:4px;">👀 预警信号</div>';
    emotionSupport.warnings.forEach(function (t) {
      html += '<div style="font-size:0.78rem;color:#666;margin-bottom:2px;">· ' + t + '</div>';
    });
    html += '    </div>';
    html += '  </div>';
    // 安抚策略
    html += '  <div style="background:#F0F9FF;border-radius:8px;padding:10px;margin-top:8px;">';
    html += '    <div style="font-size:0.78rem;color:#4A90D9;font-weight:600;margin-bottom:4px;">💚 安抚策略</div>';
    emotionSupport.soothing.forEach(function (t) {
      html += '<div style="font-size:0.78rem;color:#555;margin-bottom:2px;">· ' + t + '</div>';
    });
    html += '  </div>';
    html += '</div>';

    // === 医疗与照护信息 ===
    html += '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:16px;">';
    html += '  <div style="background:#fff;border-radius:8px;padding:10px;text-align:center;box-shadow:0 1px 3px rgba(0,0,0,0.04);">';
    html += '    <div style="font-size:0.7rem;color:#999;">过敏</div>';
    html += '    <div style="font-size:0.82rem;font-weight:600;color:#F5222D;margin-top:2px;">虾蟹贝类</div>';
    html += '  </div>';
    html += '  <div style="background:#fff;border-radius:8px;padding:10px;text-align:center;box-shadow:0 1px 3px rgba(0,0,0,0.04);">';
    html += '    <div style="font-size:0.7rem;color:#999;">用药</div>';
    html += '    <div style="font-size:0.82rem;font-weight:600;color:#722ED1;margin-top:2px;">每日睡前</div>';
    html += '  </div>';
    html += '  <div style="background:#fff;border-radius:8px;padding:10px;text-align:center;box-shadow:0 1px 3px rgba(0,0,0,0.04);">';
    html += '    <div style="font-size:0.7rem;color:#999;">睡眠</div>';
    html += '    <div style="font-size:0.82rem;font-weight:600;color:#4A90D9;margin-top:2px;">22:00前</div>';
    html += '  </div>';
    html += '  <div style="background:#fff;border-radius:8px;padding:10px;text-align:center;box-shadow:0 1px 3px rgba(0,0,0,0.04);">';
    html += '    <div style="font-size:0.7rem;color:#999;">体检</div>';
    html += '    <div style="font-size:0.82rem;font-weight:600;color:#52C41A;margin-top:2px;">年度一次</div>';
    html += '  </div>';
    html += '</div>';

    // === 紧急联系人 ===
    html += '<div style="background:linear-gradient(135deg,#E8F4FD 0%,#F0F9FF 100%);border-radius:12px;padding:16px;margin-bottom:20px;">';
    html += '  <div style="font-size:0.9rem;font-weight:600;color:#4A90D9;margin-bottom:8px;">📞 紧急联系人</div>';
    html += '  <div style="display:flex;gap:12px;flex-wrap:wrap;">';
    relationsInfo.core.forEach(function (p) {
      html += '<div style="background:#fff;border-radius:8px;padding:8px 14px;display:flex;align-items:center;gap:6px;">';
      html += '<span style="font-size:1.1rem;">' + p.emoji + '</span>';
      html += '<div>';
      html += '<div style="font-size:0.82rem;font-weight:600;color:#333;">' + p.name + '</div>';
      html += '<div style="font-size:0.72rem;color:#999;">' + p.role + '</div>';
      html += '</div></div>';
    });
    html += '  </div>';
    html += '</div>';

    return html;
  }

  function renderTimeline() {
    var contentArea = document.getElementById('timeline-content');
    if (!contentArea) return;

    var html = '';

    // 页面标题和筛选器
    html += '<div class="page-header">';
    html += '  <button class="back-btn">←</button>';
    html += '  <span class="page-title">动态档案 · 时间轴</span>';
    html += '</div>';
    html += '<div class="container" style="padding:24px;">';

    // === 照护档案区域（置顶）===
    html += buildCareProfile();

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
      volunteer: ['accompany', 'activity', 'emotion', 'note'],
      self: ['mood', 'note']
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

    // 静态作息参考卡片
    html += '<h2 style="font-size:1.1rem;color:#333;margin-bottom:12px;display:flex;align-items:center;gap:8px;">';
    html += '  <span>📅</span>参考日程';
    html += '</h2>';

    html += '<div style="background:#fff;border-radius:12px;padding:16px;margin-bottom:24px;box-shadow:0 1px 4px rgba(0,0,0,0.04);">';
    html += '  <div style="display:flex;gap:16px;margin-bottom:16px;flex-wrap:wrap;">';
    html += '    <span class="risk-badge green">安全</span>';
    html += '    <span class="risk-badge yellow">注意</span>';
    html += '    <span class="risk-badge red">重点关注</span>';
    html += '  </div>';

    html += '  <div class="timeline">';
    dailyRoutine.forEach(function (item, idx) {
      var riskLabel = item.risk === 'green' ? '安全' : (item.risk === 'yellow' ? '注意' : '重点');
      html += '    <div class="timeline-item">';
      html += '      <div class="timeline-dot ' + item.risk + '"></div>';
      html += '      <div class="timeline-card" data-timeline-idx="' + idx + '">';
      html += '        <div class="tl-header">';
      html += '          <span class="tl-time">' + item.time + '</span>';
      html += '          <span class="risk-badge ' + item.risk + '">' + riskLabel + '</span>';
      html += '        </div>';
      html += '        <div class="tl-title">' + item.title + '</div>';
      html += '        <div class="tl-body">' + item.activity + '</div>';
      html += '        <div class="tl-detail">';
      html += '          <p><strong>支持方式：</strong>' + item.support + '</p>';
      if (item.reminder) {
        html += '          <p style="color:#F5222D;margin-top:4px;"><strong>提醒：</strong>' + item.reminder + '</p>';
      }
      html += '        </div>';
      html += '      </div>';
      html += '    </div>';
    });
    html += '  </div>';
    html += '</div>';

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
    renderTimeline: renderTimeline,
    buildCareProfile: buildCareProfile
  };

  // 向后兼容：直接暴露到 window
  window.renderTimeline = renderTimeline;

})();