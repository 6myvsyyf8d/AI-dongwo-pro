/**
 * AI懂我 - 认证模块
 * 登录/注册/用户管理
 * 依赖: window.Utils, window.Constants, window.AppState, window.DataStore
 */
(function () {
  'use strict';

  /** 暂存注册选择的角色 */
  var regRole = null;

  function renderRoleSelect() {
    var users = window.DataStore.getAllUsers();
    var showLogin = users.length > 0;

    // 显示/隐藏对应视图
    var loginView = document.getElementById('login-view');
    var regStep1 = document.getElementById('register-step1');
    var regStep2 = document.getElementById('register-step2');

    if (loginView) loginView.style.display = showLogin ? 'block' : 'none';
    if (regStep1) regStep1.style.display = showLogin ? 'none' : 'block';
    if (regStep2) regStep2.style.display = 'none';

    // 填充登录下拉菜单
    populateLoginSelect();

    // 绑定角色选择卡片点击事件（注册步骤1）
    var gridEl = document.getElementById('role-select-grid');
    if (gridEl) {
      gridEl.querySelectorAll('.role-select-card').forEach(function (card) {
        if (card.dataset.bound === 'true') return;
        card.dataset.bound = 'true';

        card.addEventListener('click', function () {
          var selectedRole = this.getAttribute('data-role');
          startRegisterStep2(selectedRole);
        });

        // 悬停效果
        card.addEventListener('mouseenter', function () {
          var r = window.Constants.ROLES[this.getAttribute('data-role')];
          if (r) {
            this.style.borderColor = r.color;
            this.style.transform = 'translateY(-4px)';
            this.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)';
          }
        });
        card.addEventListener('mouseleave', function () {
          this.style.borderColor = 'transparent';
          this.style.transform = 'translateY(0)';
          this.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
        });
      });
    }
  }

  /**
   * 填充登录下拉菜单
   */
  function populateLoginSelect() {
    var select = document.getElementById('login-name-select');
    if (!select) return;

    var users = window.DataStore.getAllUsers();
    // 清空现有选项（保留第一个 placeholder）
    select.innerHTML = '<option value="">-- 选择已有账号 --</option>';

    users.forEach(function (u) {
      var roleLabel = window.Constants.ROLES[u.role] ? window.Constants.ROLES[u.role].label : u.role;
      var opt = document.createElement('option');
      opt.value = u.name;
      opt.setAttribute('data-pin', u.pin);
      opt.textContent = u.name + '（' + roleLabel + '）';
      select.appendChild(opt);
    });

    // 绑定选择事件（避免重复绑定）
    if (!select.dataset.bound) {
      select.dataset.bound = 'true';
      select.addEventListener('change', function () {
        var selected = this.options[this.selectedIndex];
        var pin = selected.getAttribute('data-pin');
        var name = this.value;

        if (name && pin) {
          document.getElementById('login-pin').value = pin;
          var hint = document.getElementById('login-pin-hint');
          if (hint) hint.style.display = 'block';
        } else {
          document.getElementById('login-pin').value = '';
          var hint = document.getElementById('login-pin-hint');
          if (hint) hint.style.display = 'none';
        }
      });
    }
  }

  /**
   * 切换登录姓名输入方式（下拉/手动输入）
   */
  function toggleNameInputMode() {
    var select = document.getElementById('login-name-select');
    var input = document.getElementById('login-name');
    var link = document.getElementById('btn-toggle-name-input');
    var hint = document.getElementById('login-pin-hint');

    if (select.style.display === 'none') {
      // 切换回下拉模式
      select.style.display = '';
      input.style.display = 'none';
      link.textContent = '手动输入姓名';
      // 清空手动输入的值
      input.value = '';
    } else {
      // 切换到手动输入模式
      select.style.display = 'none';
      input.style.display = '';
      link.textContent = '从下拉菜单选择';
      // 清空PIN码和提示
      document.getElementById('login-pin').value = '';
      if (hint) hint.style.display = 'none';
    }
  }

  /**
   * 进入注册步骤2：设置姓名和PIN码
   * @param {string} roleKey - 选择的角色键名
   */
  function startRegisterStep2(roleKey) {
    var role = window.Constants.ROLES[roleKey];
    if (!role) return;

    // government 和 admin 不能自助注册，只能用预设账号登录
    if (roleKey === 'government' || roleKey === 'admin') {
      window.showToast('该角色不支持自助注册，请使用预设账号登录');
      return;
    }

    regRole = roleKey; // 暂存选择的角色

    // 更新显示
    document.getElementById('login-view').style.display = 'none';
    document.getElementById('register-step1').style.display = 'none';
    document.getElementById('register-step2').style.display = 'block';

    document.getElementById('register-role-avatar').textContent = role.avatar;
    document.getElementById('register-role-label').textContent = role.label;

    // 清空输入框
    document.getElementById('register-name').value = '';
    document.getElementById('register-pin').value = '';
    document.getElementById('register-pin-confirm').value = '';
    document.getElementById('register-name').focus();
  }

  /**
   * 执行注册
   */
  function doRegister() {
    if (!regRole) {
      window.showToast('请先选择角色');
      return;
    }

    var name = document.getElementById('register-name').value.trim();
    var pin = document.getElementById('register-pin').value;
    var pinConfirm = document.getElementById('register-pin-confirm').value;

    if (!name) {
      window.showToast('请输入您的姓名');
      return;
    }
    if (!pin || pin.length < 4 || pin.length > 6) {
      window.showToast('PIN码需要4-6位数字');
      return;
    }
    if (!/^\d+$/.test(pin)) {
      window.showToast('PIN码只能包含数字');
      return;
    }
    if (pin !== pinConfirm) {
      window.showToast('两次PIN码输入不一致');
      return;
    }

    var result = window.DataStore.registerUser(name, regRole, pin);
    if (!result.success) {
      window.showToast(result.message);
      return;
    }

    // 注册或登录成功
    var user = result.user;
    window.DataStore.setCurrentUser(user);
    window.AppState.currentUser = user;
    window.AppState.currentRole = user.role;

    if (result.isNew) {
      window.showToast('注册成功！欢迎 ' + name);
    } else {
      window.showToast('登录成功！欢迎 ' + name);
    }
    updateNavBar();
    // 重新渲染侧边栏以匹配新角色
    if (window.renderSidebar) window.renderSidebar();
    var defaultPage = window.Constants.ROLE_DEFAULT_PAGES[user.role] || 'home';
    window.location.hash = defaultPage;
  }

  /**
   * 执行登录
   */
  function doLogin() {
    // 优先从下拉菜单获取姓名，其次从手动输入框获取
    var select = document.getElementById('login-name-select');
    var input = document.getElementById('login-name');
    var name = '';
    if (select && select.style.display !== 'none' && select.value) {
      name = select.value;
    } else if (input) {
      name = input.value.trim();
    }
    var pin = document.getElementById('login-pin').value;

    if (!name) {
      window.showToast('请选择或输入您的姓名');
      return;
    }
    if (!pin) {
      window.showToast('请输入PIN码');
      return;
    }

    var user = window.DataStore.findUserByNameAndPin(name, pin);
    if (!user) {
      window.showToast('姓名或PIN码错误，请重试');
      return;
    }

    window.DataStore.setCurrentUser(user);
    window.AppState.currentUser = user;
    window.AppState.currentRole = user.role;

    window.showToast('登录成功！欢迎 ' + name);
    updateNavBar();
    // 重新渲染侧边栏以匹配新角色
    if (window.renderSidebar) window.renderSidebar();
    var defaultPage = window.Constants.ROLE_DEFAULT_PAGES[user.role] || 'home';
    window.location.hash = defaultPage;
  }

  /**
   * 显示登录视图
   */
  function showLoginView() {
    document.getElementById('login-view').style.display = 'block';
    document.getElementById('register-step1').style.display = 'none';
    document.getElementById('register-step2').style.display = 'none';
    // 重置为下拉模式
    var select = document.getElementById('login-name-select');
    var input = document.getElementById('login-name');
    if (select) { select.style.display = ''; select.selectedIndex = 0; }
    if (input) { input.style.display = 'none'; input.value = ''; }
    var toggleLink = document.getElementById('btn-toggle-name-input');
    if (toggleLink) toggleLink.textContent = '手动输入姓名';
    // 清空PIN码
    document.getElementById('login-pin').value = '';
    var hint = document.getElementById('login-pin-hint');
    if (hint) hint.style.display = 'none';
    // 刷新下拉菜单（可能有新注册的用户）
    populateLoginSelect();
  }

  /**
   * 显示注册步骤1
   */
  function showRegisterStep1() {
    document.getElementById('login-view').style.display = 'none';
    document.getElementById('register-step1').style.display = 'block';
    document.getElementById('register-step2').style.display = 'none';
  }

  /**
   * 更新导航栏显示用户信息（底部导航无需用户信息展示，保留接口兼容）
   */
  function updateNavBar() {
    // 重新渲染底部导航以匹配当前角色
    if (window.renderBottomNav) window.renderBottomNav();
  }

  /**
   * 退出登录
   */
  function logout() {
    if (!confirm('确定要退出登录吗？')) return;
    window.DataStore.setCurrentUser(null);
    window.AppState.currentUser = null;
    window.AppState.currentRole = 'parent';
    updateNavBar();
    window.location.hash = 'login';
  }

  // 导出到全局
  window.Auth = {
    renderRoleSelect: renderRoleSelect,
    populateLoginSelect: populateLoginSelect,
    toggleNameInputMode: toggleNameInputMode,
    startRegisterStep2: startRegisterStep2,
    doRegister: doRegister,
    doLogin: doLogin,
    showLoginView: showLoginView,
    showRegisterStep1: showRegisterStep1,
    updateNavBar: updateNavBar,
    logout: logout
  };

  // 向后兼容：renderRoleSelect 在 initApp 中被直接调用
  window.renderRoleSelect = renderRoleSelect;

})();