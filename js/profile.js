/**
 * profile.js — 个人中心页面渲染
 * 挂载：window.ProfilePage
 * 依赖：window.Utils, window.Constants, window.AppState, window.DataStore
 */
(function () {
  'use strict';

  var ROLES = window.Constants.ROLES;
  var RECORD_TYPES = window.Constants.RECORD_TYPES;
  var DataStore = window.DataStore;
  var appState = window.AppState.appState;

  /**
   * 渲染个人中心页面
   */
  function renderProfile() {
    var profileSection = document.getElementById('profile');
    if (!profileSection) {
      profileSection = document.createElement('section');
      profileSection.id = 'profile';
      profileSection.className = 'page-section';
      document.querySelector('.main-content').appendChild(profileSection);
    }

    var user = DataStore.getCurrentUser() || appState.currentUser;
    var role = user ? ROLES[user.role] : null;

    var html = '';
    html += '<div class="page-header">';
    html += '  <button class="back-btn">←</button>';
    html += '  <span class="page-title">个人中心</span>';
    html += '</div>';
    html += '<div class="container" style="padding:24px;">';

    if (user && role) {
      // 当前角色信息卡片
      html += '<div style="background:#fff;border-radius:16px;padding:24px;text-align:center;margin-bottom:24px;box-shadow:0 2px 8px rgba(0,0,0,0.06);">';
      html += '  <div style="font-size:3.5rem;margin-bottom:12px;">' + (user.avatar || role.avatar) + '</div>';
      html += '  <div style="font-size:1.25rem;font-weight:600;color:#333;margin-bottom:4px;">' + user.name + '</div>';
      html += '  <div style="display:inline-block;padding:4px 12px;border-radius:20px;font-size:0.85rem;color:#fff;background:' + role.color + ';margin-bottom:8px;">' + role.label + '</div>';
      html += '  <p style="color:#666;font-size:0.9rem;">' + role.description + '</p>';
      html += '  <p style="color:#aaa;font-size:0.78rem;margin-top:8px;">账号ID: ' + user.id + ' | 注册于 ' + (user.createdAt || '今天') + '</p>';
      html += '</div>';

      // 可记录类型
      html += '<h2 class="section-title">您可以记录的内容</h2>';
      html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:12px;margin-bottom:24px;">';
      role.canAdd.forEach(function (typeKey) {
        var type = RECORD_TYPES[typeKey];
        if (type) {
          html += '<div style="background:#fff;border-radius:12px;padding:16px;text-align:center;border-left:4px solid ' + type.color + ';box-shadow:0 1px 4px rgba(0,0,0,0.04);">';
          html += '  <div style="font-size:1.5rem;margin-bottom:4px;">' + type.icon + '</div>';
          html += '  <div style="font-size:0.85rem;color:#555;">' + type.label + '</div>';
          html += '</div>';
        }
      });
      html += '</div>';

      // 数据统计
      var records = DataStore.getRecords();
      var myRecords = records.filter(function (r) { return r.authorId === user.id; });
      html += '<h2 class="section-title">我的记录统计</h2>';
      html += '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:24px;">';
      html += '  <div style="background:#fff;border-radius:12px;padding:16px;text-align:center;box-shadow:0 1px 4px rgba(0,0,0,0.04);">';
      html += '    <div style="font-size:1.5rem;font-weight:700;color:#4A90D9;">' + myRecords.length + '</div>';
      html += '    <div style="font-size:0.8rem;color:#888;">我的记录</div>';
      html += '  </div>';
      html += '  <div style="background:#fff;border-radius:12px;padding:16px;text-align:center;box-shadow:0 1px 4px rgba(0,0,0,0.04);">';
      html += '    <div style="font-size:1.5rem;font-weight:700;color:#52C41A;">' + records.length + '</div>';
      html += '    <div style="font-size:0.8rem;color:#888;">全部记录</div>';
      html += '  </div>';
      html += '  <div style="background:#fff;border-radius:12px;padding:16px;text-align:center;box-shadow:0 1px 4px rgba(0,0,0,0.04);">';
      html += '    <div style="font-size:1.5rem;font-weight:700;color:#FAAD14;">' + Object.keys(ROLES).length + '</div>';
      html += '    <div style="font-size:0.8rem;color:#888;">参与角色</div>';
      html += '  </div>';
      html += '</div>';

      // 更多功能入口
      html += '<h2 class="section-title">更多功能</h2>';
      var moreCards = [
        { hash: 'life', icon: '💚', title: '我喜欢的生活', desc: '喜好、日常、作息' },
        { hash: 'communication', icon: '💬', title: '沟通说明书', desc: '怎么说、注意什么' },
        { hash: 'emotion', icon: '🌈', title: '情绪与行为', desc: '触发、预警、安抚' },
        { hash: 'care', icon: '🩺', title: '照护与医疗', desc: '过敏、用药、体检' },
        { hash: 'work', icon: '💼', title: '工作支持', desc: '能做什么、需要什么' },
        { hash: 'relations', icon: '👥', title: '关系地图', desc: '核心圈、日常圈' },
        { hash: 'collect', icon: '🤖', title: '对话采集', desc: 'AI帮您建立档案' }
      ];
      html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;margin-bottom:24px;">';
      moreCards.forEach(function (card) {
        html += '<div class="profile-more-card" data-navigate="' + card.hash + '" style="background:#fff;border-radius:12px;padding:16px;text-align:center;box-shadow:0 1px 4px rgba(0,0,0,0.04);cursor:pointer;transition:all 0.2s;">';
        html += '  <div style="font-size:1.5rem;margin-bottom:6px;">' + card.icon + '</div>';
        html += '  <div style="font-weight:600;font-size:0.9rem;color:#333;margin-bottom:2px;">' + card.title + '</div>';
        html += '  <div style="font-size:0.78rem;color:#999;">' + card.desc + '</div>';
        html += '</div>';
      });
      html += '</div>';
    }

    // 操作按钮
    html += '<div style="display:flex;flex-direction:column;gap:12px;">';
    html += '  <button id="btn-logout" style="padding:14px 24px;border-radius:12px;border:1px solid #ddd;background:#fff;color:#666;font-size:1rem;cursor:pointer;transition:all 0.2s;">🚪 退出登录</button>';
    html += '</div>';

    html += '</div>';

    profileSection.innerHTML = html;

    // 绑定退出按钮事件
    var logoutBtn = document.getElementById('btn-logout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', function () {
        window.Auth.logout();
      });
    }

    // 绑定"更多功能"卡片点击事件
    profileSection.querySelectorAll('.profile-more-card').forEach(function(card) {
      card.addEventListener('click', function () {
        var target = this.getAttribute('data-navigate');
        if (target === 'collect') {
          window.location.hash = 'collect';
        } else {
          window.location.hash = target;
        }
      });
      // hover 效果
      card.addEventListener('mouseenter', function () {
        this.style.transform = 'translateY(-3px)';
        this.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
      });
      card.addEventListener('mouseleave', function () {
        this.style.transform = 'translateY(0)';
        this.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)';
      });
    });
  }

  window.ProfilePage = {
    renderProfile: renderProfile
  };

})();