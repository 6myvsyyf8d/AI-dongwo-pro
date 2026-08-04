/**
 * profile.js — 档案页渲染（2B 心智障碍者动态支持档案）
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

  /**
   * 渲染2B档案页
   * 从上到下：身份卡片 → 关于我 → 动态支持档案 → 志愿者小知识
   */
  function renderProfile() {
    var contentArea = document.getElementById('archive-content') || document.getElementById('profile-content');
    if (!contentArea) return;

    var html = '';

    // === 外层滚动容器 ===
    html += '<div class="profile-scroll">';

    // ==========================================
    // 1. 身份卡片
    // ==========================================
    html += '<div class="profile-id-card">';
    html += '  <div class="id-avatar-wrap">🌻</div>';
    html += '  <div class="id-info">';
    html += '    <div class="id-name">' + basicInfo.name + '</div>';
    html += '    <div class="id-meta">' + basicInfo.age + '岁 · ' + basicInfo.gender + ' · ' + basicInfo.communication + '</div>';
    html += '    <div class="id-intro">' + basicInfo.intro + '</div>';
    html += '  </div>';
    html += '</div>';

    // ==========================================
    // 2. 关于我
    // ==========================================
    html += '<div class="about-section">';
    html += '  <div class="about-section-header">';
    html += '    <span class="about-title">🌻 关于我</span>';
    html += '    <span class="about-subtitle">先认识我，再支持我</span>';
    html += '  </div>';

    html += '  <div class="about-card">';
    html += '    <div class="about-icon-inset">🌻</div>';
    html += '    <div class="about-grid">';

    // —— 我喜欢和擅长（左半宽）——
    html += '      <div class="about-mini-card">';
    html += '        <div class="mini-card-title">💚 我喜欢和擅长</div>';
    likesList.forEach(function (item) {
      html += '        <div class="mini-item">';
      html += '          <span class="mini-item-icon">' + item.icon + '</span>';
      html += '          <div class="mini-item-text"><strong>' + item.title + '</strong><span>' + item.desc + '</span></div>';
      html += '        </div>';
    });
    html += '      </div>';

    // —— 我容易不安（右半宽）——
    html += '      <div class="about-mini-card">';
    html += '        <div class="mini-card-title">⚠️ 我容易不安</div>';
    dislikesList.forEach(function (item) {
      html += '        <div class="mini-item">';
      html += '          <span class="mini-item-icon">' + item.icon + '</span>';
      html += '          <div class="mini-item-text"><strong>' + item.title + '</strong><span>' + item.desc + '</span></div>';
      html += '        </div>';
    });
    html += '      </div>';

    // —— 请这样支持我（全宽）——
    html += '      <div class="about-mini-card full-width">';
    html += '        <div class="mini-card-title">🤝 请这样支持我</div>';
    html += '        <ul class="mini-list">';
    communicationGuide.best.forEach(function (tip) {
      html += '          <li>' + tip + '</li>';
    });
    html += '        </ul>';
    html += '      </div>';

    // —— 我的愿望（全宽）——
    html += '      <div class="about-mini-card full-width">';
    html += '        <div class="mini-card-title">⭐ 我的愿望</div>';
    html += '        <ul class="mini-list">';
    workInfo.canDo.forEach(function (wish) {
      html += '          <li>' + wish + '</li>';
    });
    html += '        </ul>';
    html += '      </div>';

    html += '    </div>'; // .about-grid
    html += '  </div>';   // .about-card
    html += '</div>';     // .about-section

    // ==========================================
    // 3. 动态支持档案
    // ==========================================
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

    html += '  </div>'; // .support-module-grid
    html += '</div>';   // .support-archive-section

    // ==========================================
    // 4. 志愿者小知识
    // ==========================================
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

    // 绑定模块卡片点击 → 跳转到对应记录
    contentArea.querySelectorAll('.support-module-card').forEach(function (card) {
      card.addEventListener('click', function () {
        var modKey = this.getAttribute('data-module');
        window.location.hash = 'records?module=' + modKey;
      });
    });
  }

  window.ProfilePage = {
    renderProfile: renderProfile
  };

})();
