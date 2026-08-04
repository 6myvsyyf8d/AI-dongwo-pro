/**
 * AI懂我 - 权限与隐私模块
 * 角色切换 / 隐私过滤
 * 依赖: window.Constants, window.AppState, window.DataStore, window.Auth
 */
(function () {
  'use strict';

  function switchRole(roleName) {
    var user = window.DataStore.getCurrentUser() || window.AppState.currentUser;

    // 如果用户已登录，提示退出重新登录
    if (user && user.role !== roleName) {
      var roleLabel = window.Constants.ROLES[roleName] ? window.Constants.ROLES[roleName].label : roleName;
      if (confirm('要切换到「' + roleLabel + '」吗？需要先退出当前账号。')) {
        window.Auth.logout();
      }
      return;
    }

    window.AppState.currentRole = roleName;
    applyPrivacy(roleName);
  }

  /**
   * 根据角色权限应用隐私设置
   * 使用 data-privacy 属性标记的元素将被显示或隐藏
   * @param {string} roleName - 角色名称
   */
  function applyPrivacy(roleName) {
    var allowedLevels = window.Constants.privacyLevels[roleName];
    if (!allowedLevels) return;

    // 获取所有带隐私标记的元素
    var privacyElements = document.querySelectorAll('[data-privacy]');
    privacyElements.forEach(function (el) {
      var level = el.getAttribute('data-privacy');
      if (allowedLevels.indexOf(level) !== -1) {
        // 当前角色可见此级别
        el.classList.remove('hidden-info');
        el.style.display = '';
      } else {
        // 当前角色不可见此级别 —— 完全隐藏
        el.style.display = 'none';
      }
    });
  }

  // 导出到全局
  window.Permissions = {
    applyPrivacy: applyPrivacy,
    switchRole: switchRole
  };

})();