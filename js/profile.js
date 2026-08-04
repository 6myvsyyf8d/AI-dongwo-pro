/**
 * profile.js — 档案页 + 管理页渲染
 * 挂载：window.ProfilePage
 * 依赖：window.Utils, window.Constants, window.AppState, window.DataStore, window.Modules
 */
(function () {
  'use strict';

  var C = window.Constants;
  var ROLES = C.ROLES;
  var basicInfo = C.basicInfo;
  var likesList = C.likesList;
  var dislikesList = C.dislikesList;
  var communicationGuide = C.communicationGuide;
  var emotionSupport = C.emotionSupport;
  var careInfo = C.careInfo;
  var workInfo = C.workInfo;
  var Modules = window.Modules;
  var DataStore = window.DataStore;
  var showToast = window.showToast;

  /**
   * 渲染档案浏览页 —— 用于 #archive 页
   * 身份卡片 → 关于我 → 动态支持档案 → 志愿者小知识
   */
  function renderProfile() {
    var contentArea = document.getElementById('archive-content');
    if (!contentArea) return;

    var html = '';
    html += '<div class="profile-scroll">';

    // 1. 身份卡片
    html += '<div class="profile-id-card">';
    html += '  <div class="id-avatar-wrap">🌻</div>';
    html += '  <div class="id-info">';
    html += '    <div class="id-name">' + basicInfo.name + '</div>';
    html += '    <div class="id-meta">' + basicInfo.age + '岁 · ' + basicInfo.gender + ' · ' + basicInfo.communication + '</div>';
    html += '    <div class="id-intro">' + basicInfo.intro + '</div>';
    html += '  </div>';
    html += '</div>';

    // 2. 关于我
    html += '<div class="about-section">';
    html += '  <div class="about-section-header">';
    html += '    <span class="about-title">🌻 关于我</span>';
    html += '    <span class="about-subtitle">先认识我，再支持我</span>';
    html += '  </div>';
    html += '  <div class="about-card">';
    html += '    <div class="about-icon-inset">🌻</div>';
    html += '    <div class="about-grid">';
    html += '      <div class="about-mini-card">';
    html += '        <div class="mini-card-title">💚 我喜欢和擅长</div>';
    likesList.forEach(function (item) {
      html += '        <div class="mini-item">';
      html += '          <span class="mini-item-icon">' + item.icon + '</span>';
      html += '          <div class="mini-item-text"><strong>' + item.title + '</strong><span>' + item.desc + '</span></div>';
      html += '        </div>';
    });
    html += '      </div>';
    html += '      <div class="about-mini-card">';
    html += '        <div class="mini-card-title">⚠️ 我容易不安</div>';
    dislikesList.forEach(function (item) {
      html += '        <div class="mini-item">';
      html += '          <span class="mini-item-icon">' + item.icon + '</span>';
      html += '          <div class="mini-item-text"><strong>' + item.title + '</strong><span>' + item.desc + '</span></div>';
      html += '        </div>';
    });
    html += '      </div>';
    html += '      <div class="about-mini-card full-width">';
    html += '        <div class="mini-card-title">🤝 请这样支持我</div>';
    html += '        <ul class="mini-list">';
    communicationGuide.best.forEach(function (tip) { html += '          <li>' + tip + '</li>'; });
    html += '        </ul>';
    html += '      </div>';
    html += '      <div class="about-mini-card full-width">';
    html += '        <div class="mini-card-title">⭐ 我的愿望</div>';
    html += '        <ul class="mini-list">';
    workInfo.canDo.forEach(function (wish) { html += '          <li>' + wish + '</li>'; });
    html += '        </ul>';
    html += '      </div>';
    html += '    </div>';
    html += '  </div>';
    html += '</div>';

    // 3. 动态支持档案
    html += '<div class="support-archive-section">';
    html += '  <div class="support-archive-header">';
    html += '    <span class="support-archive-title">📋 动态支持档案</span>';
    html += '  </div>';
    html += '  <div class="support-module-grid">';
    var moduleOrder = ['communication', 'emotion', 'care', 'work'];
    var moduleDescs = {
      communication: '短句沟通、视觉提示、耐心等待',
      emotion: '焦虑触发、安抚策略、预警信号',
      care: '过敏管理、用药提醒、作息照护',
      work: '工作能力、支持需求、就业方向'
    };
    moduleOrder.forEach(function (key) {
      var mod = Modules[key];
      if (!mod) return;
      var recordCount = DataStore.getRecordsByModule(key).length;
      html += '<div class="support-module-card" data-module="' + key + '">';
      html += '  <div class="module-icon-box">' + mod.icon + '</div>';
      html += '  <div class="module-name">' + mod.label + '</div>';
      html += '  <div class="module-desc">' + (moduleDescs[key] || '') + ' · ' + recordCount + '条记录</div>';
      html += '</div>';
    });
    html += '  </div>';
    html += '</div>';

    // 4. 志愿者小知识
    html += '<div class="volunteer-tips-card">';
    html += '  <div class="tips-title">💡 志愿者小知识</div>';
    html += '  <ul class="tips-list">';
    html += '    <li>和' + basicInfo.name + '说话时，请用短句、慢一点，一次说一件事</li>';
    html += '    <li>给他反应时间，不要催促他说「快点」</li>';
    html += '    <li>可以用他喜欢的话题开场：公交车、烘焙、猫咪</li>';
    html += '    <li>如果想碰他或帮他，请先告诉他你要做什么</li>';
    html += '    <li>他可能对嘈杂环境敏感，请尽量提供安静的空间</li>';
    html += '    <li>' + basicInfo.name + '海鲜过敏（虾蟹贝类），请严格避免接触</li>';
    html += '  </ul>';
    html += '</div>';

    html += '</div>'; // .profile-scroll

    contentArea.innerHTML = html;

    // 绑定模块卡片点击
    contentArea.querySelectorAll('.support-module-card[data-module]').forEach(function (card) {
      card.addEventListener('click', function () {
        var modKey = this.getAttribute('data-module');
        window.location.hash = 'records?module=' + modKey;
      });
    });
  }

  /**
   * 渲染管理仪表盘 —— 用于 #profile（管理）页
   * 账号信息 → 协作网络入口 → 退出登录
   */
  function renderManagement() {
    var contentArea = document.getElementById('profile-content');
    if (!contentArea) return;

    var user = DataStore.getCurrentUser() || window.AppState.currentUser;
    if (!user) { window.location.hash = 'login'; return; }
    var role = user.role || 'parent';
    var roleInfo = ROLES[role] || { label: role, avatar: '👤', color: '#999' };

    var html = '';
    html += '<div class="profile-scroll">';

    // ==========================================
    // 1. 我的账号
    // ==========================================
    html += '<div class="profile-id-card">';
    html += '  <div class="id-avatar-wrap">' + (user.avatar || roleInfo.avatar) + '</div>';
    html += '  <div class="id-info">';
    html += '    <div class="id-name">' + (user.name || '用户') + '</div>';
    html += '    <div class="id-meta" style="color:' + roleInfo.color + ';">当前身份：' + roleInfo.label + '</div>';
    var youthId = DataStore.getPrimaryYouth(user.id);
    if (youthId) {
      var youthUser = DataStore.findUserById(youthId);
      html += '    <div class="id-intro">绑定心青年：' + (youthUser ? youthUser.name : '未知') + '</div>';
    }
    html += '  </div>';
    html += '</div>';

    // ==========================================
    // 2. 协作网络
    // ==========================================
    html += '<div class="support-archive-section">';
    html += '  <div class="support-archive-header">';
    html += '    <span class="support-archive-title">👥 协作网络</span>';
    html += '  </div>';

    if (role === 'parent') {
      html += '  <div class="support-module-grid" style="grid-template-columns:repeat(3,1fr);">';
      html += '<div class="support-module-card" onclick="location.hash=\'grants\'" style="cursor:pointer;">';
      html += '  <div class="module-icon-box" style="background:linear-gradient(135deg,#4A90D9,#5B9BD5);">👥</div>';
      html += '  <div class="module-name">授权管理</div>';
      html += '  <div class="module-desc">邀请老师/影子老师</div>';
      html += '</div>';
      html += '<div class="support-module-card" onclick="location.hash=\'approvals\'" style="cursor:pointer;">';
      html += '  <div class="module-icon-box" style="background:linear-gradient(135deg,#52C41A,#73D13D);">📋</div>';
      html += '  <div class="module-name">加入审批</div>';
      html += '  <div class="module-desc">审核加入申请</div>';
      html += '</div>';
      html += '<div class="support-module-card" onclick="location.hash=\'archive-code\'" style="cursor:pointer;">';
      html += '  <div class="module-icon-box" style="background:linear-gradient(135deg,#FAAD14,#FFC53D);">📱</div>';
      html += '  <div class="module-name">档案码</div>';
      html += '  <div class="module-desc">生成分享二维码</div>';
      html += '</div>';
      html += '  </div>';
    } else if (role === 'teacher' || role === 'caregiver') {
      html += '  <div class="support-module-grid" style="grid-template-columns:repeat(2,1fr);">';
      html += '<div class="support-module-card" onclick="location.hash=\'join\'" style="cursor:pointer;">';
      html += '  <div class="module-icon-box" style="background:linear-gradient(135deg,#4A90D9,#5B9BD5);">👨\u200d👩\u200d👧</div>';
      html += '  <div class="module-name">加入家庭</div>';
      html += '  <div class="module-desc">输入邀请码加入</div>';
      html += '</div>';
      // 查看已加入的家庭
      var grants = DataStore.getGrantsByUser(user.id);
      if (grants.length > 0) {
        var gyId = grants[0].youthId;
        var gyUser = DataStore.findUserById(gyId);
        html += '<div class="support-module-card" onclick="location.hash=\'archive\'" style="cursor:pointer;">';
        html += '  <div class="module-icon-box" style="background:linear-gradient(135deg,#722ED1,#9C6ADE);">📋</div>';
        html += '  <div class="module-name">查看档案</div>';
        html += '  <div class="module-desc">' + (gyUser ? gyUser.name : '心青年') + '的支持档案</div>';
        html += '</div>';
      }
      html += '  </div>';
    }
    html += '</div>';

    // ==========================================
    // 3. 退出登录
    // ==========================================
    html += '<div style="padding:0 0 32px;text-align:center;">';
    html += '<button id="btn-logout-inline" style="padding:12px 48px;border:1px solid #F5222D;background:#fff;color:#F5222D;border-radius:24px;font-size:0.9rem;cursor:pointer;">退出登录</button>';
    html += '</div>';

    html += '</div>'; // .profile-scroll

    contentArea.innerHTML = html;

    // 绑定退出登录
    var logoutBtn = document.getElementById('btn-logout-inline');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', function () {
        window.Auth.logout();
      });
    }
  }

  window.ProfilePage = {
    renderProfile: renderProfile,
    renderManagement: renderManagement
  };

})();
