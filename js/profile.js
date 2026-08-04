/**
 * profile.js — 个人中心 / 档案页面渲染
 * 挂载：window.ProfilePage
 * 依赖：window.Utils, window.Constants, window.AppState, window.DataStore, window.Modules
 */
(function () {
  'use strict';

  var ROLES = window.Constants.ROLES;
  var RECORD_TYPES = window.Constants.RECORD_TYPES;
  var DataStore = window.DataStore;
  var Modules = window.Modules;
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
    var profile = DataStore.getYouthProfile();

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

      // === 心青年基本信息卡片 ===
      if (profile && profile.basicInfo) {
        var bi = profile.basicInfo;
        html += '<h2 class="section-title">🌟 心青年档案</h2>';
        html += '<div style="background:#fff;border-radius:16px;padding:20px;margin-bottom:24px;box-shadow:0 2px 8px rgba(0,0,0,0.06);">';
        html += '  <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">';
        html += '    <div style="font-size:3rem;">🌻</div>';
        html += '    <div>';
        html += '      <div style="font-size:1.1rem;font-weight:700;color:#333;">' + bi.name + '</div>';
        html += '      <div style="font-size:0.85rem;color:#888;">' + bi.age + '岁 · ' + bi.gender + ' · ' + bi.communication + '</div>';
        html += '    </div>';
        html += '  </div>';
        html += '  <p style="color:#555;font-size:0.9rem;line-height:1.5;">' + bi.intro + '</p>';
        html += '</div>';
      }

      // === 四大模块卡片 ===
      var moduleKeys = ['communicationGuide', 'emotionSupport', 'careInfo', 'workInfo'];
      var moduleConfigs = {
        communicationGuide: { icon: '💬', label: '沟通与表达', color: '#9B85B8', key: 'communicationGuide' },
        emotionSupport: { icon: '🌊', label: '情绪与行为', color: '#D4877B', key: 'emotionSupport' },
        careInfo: { icon: '💊', label: '照护与医疗', color: '#A8C9A0', key: 'careInfo' },
        workInfo: { icon: '💼', label: '工作与生活', color: '#D4A85A', key: 'workInfo' }
      };

      html += '<h2 class="section-title">📋 支持档案模块</h2>';
      html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;margin-bottom:24px;">';

      moduleKeys.forEach(function (mk) {
        var cfg = moduleConfigs[mk];
        var moduleRecords = DataStore.getRecordsByModule(mk);
        var recordCount = moduleRecords.length;
        html += '<div class="profile-module-card" data-module="' + mk + '" style="background:#fff;border-radius:12px;padding:16px;text-align:center;border-left:4px solid ' + cfg.color + ';box-shadow:0 1px 4px rgba(0,0,0,0.04);cursor:pointer;transition:all 0.2s;">';
        html += '  <div style="font-size:1.8rem;margin-bottom:6px;">' + cfg.icon + '</div>';
        html += '  <div style="font-weight:600;font-size:0.9rem;color:#333;margin-bottom:2px;">' + cfg.label + '</div>';
        html += '  <div style="font-size:0.78rem;color:#999;">' + recordCount + ' 条记录</div>';
        html += '</div>';
      });

      html += '</div>';

      // === 喜欢 & 不喜欢快捷视图 ===
      html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:24px;">';
      // 喜欢
      html += '<div style="background:#fff;border-radius:12px;padding:16px;box-shadow:0 1px 4px rgba(0,0,0,0.04);">';
      html += '  <div style="font-weight:600;color:#52C41A;margin-bottom:10px;font-size:0.9rem;">💚 喜欢的事物</div>';
      if (profile && profile.likesList) {
        profile.likesList.forEach(function (item) {
          html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;font-size:0.85rem;color:#555;">';
          html += '  <span>' + item.icon + '</span><span>' + item.title + '</span>';
          html += '</div>';
        });
      }
      html += '</div>';
      // 不喜欢
      html += '<div style="background:#fff;border-radius:12px;padding:16px;box-shadow:0 1px 4px rgba(0,0,0,0.04);">';
      html += '  <div style="font-weight:600;color:#F5222D;margin-bottom:10px;font-size:0.9rem;">🚫 不喜欢的事物</div>';
      if (profile && profile.dislikesList) {
        profile.dislikesList.forEach(function (item) {
          html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;font-size:0.85rem;color:#555;">';
          html += '  <span>' + item.icon + '</span><span>' + item.title + '</span>';
          html += '</div>';
        });
      }
      html += '</div>';
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

    // 绑定模块卡片点击事件 → 跳转 #records?module=xxx
    profileSection.querySelectorAll('.profile-module-card').forEach(function (card) {
      card.addEventListener('click', function () {
        var moduleKey = this.getAttribute('data-module');
        if (moduleKey) {
          window.location.hash = 'records?module=' + moduleKey;
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