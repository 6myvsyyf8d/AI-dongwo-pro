/**
 * welcome.js — 欢迎页
 * 新用户首次登录后看到，选择"创建档案"或"加入家庭"
 * 挂载：window.WelcomePage
 */
(function () {
  'use strict';

  var DataStore = window.DataStore;
  var showToast = window.showToast;

  /**
   * 渲染欢迎页
   */
  function renderWelcome() {
    var contentArea = document.getElementById('welcome-content');
    if (!contentArea) return;

    var user = DataStore.getCurrentUser() || window.AppState.currentUser;
    if (!user) { window.location.hash = 'login'; return; }

    var html = '';
    html += '<div style="padding:48px 24px 24px;text-align:center;">';

    // 头部
    html += '<div style="font-size:3rem;margin-bottom:16px;">' + (user.avatar || '👤') + '</div>';
    html += '<h1 style="font-size:1.5rem;color:#333;margin-bottom:8px;">欢迎，' + (user.name || '用户') + '！</h1>';
    html += '<p style="font-size:0.9rem;color:#888;margin-bottom:40px;line-height:1.6;">';
    html += '这是您第一次使用AI懂我。<br>请选择下面的操作开始：';
    html += '</p>';

    // 两个大按钮
    html += '<div style="display:flex;flex-direction:column;gap:16px;max-width:320px;margin:0 auto 32px;">';

    // 按钮1：创建心青年档案
    html += '<button id="btn-create-youth" style="width:100%;padding:20px;border-radius:16px;border:2px solid #4A90D9;background:linear-gradient(135deg,#4A90D9,#5B9BD5);color:#fff;font-size:1.1rem;cursor:pointer;box-shadow:0 4px 16px rgba(74,144,217,0.3);transition:transform 0.2s;">';
    html += '<div style="font-size:2rem;margin-bottom:8px;">🌻</div>';
    html += '<div style="font-weight:700;">创建心青年档案</div>';
    html += '<div style="font-size:0.82rem;opacity:0.9;margin-top:4px;">为新用户建立支持档案</div>';
    html += '</button>';

    // 按钮2：加入已有家庭
    html += '<button id="btn-join-family" style="width:100%;padding:20px;border-radius:16px;border:2px solid #ddd;background:#fff;color:#333;font-size:1.1rem;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,0.06);transition:transform 0.2s;">';
    html += '<div style="font-size:2rem;margin-bottom:8px;">👨\u200d👩\u200d👧</div>';
    html += '<div style="font-weight:700;">加入已有家庭</div>';
    html += '<div style="font-size:0.82rem;color:#888;margin-top:4px;">家长会给你邀请码</div>';
    html += '</button>';

    html += '</div>';

    // 如果是家长，直接跳到创建档案
    html += '<p style="font-size:0.8rem;color:#aaa;">';
    if (user.role === 'parent') {
      html += '您注册的身份是<span style="color:#4A90D9;">家长</span>，建议创建档案。';
    } else {
      html += '您注册的身份是<span style="color:#4A90D9;">' + (window.Constants.ROLES[user.role] ? window.Constants.ROLES[user.role].label : user.role) + '</span>。';
    }
    html += '</p>';

    html += '</div>';

    contentArea.innerHTML = html;

    // 绑定事件
    var btnCreate = document.getElementById('btn-create-youth');
    var btnJoin = document.getElementById('btn-join-family');

    if (btnCreate) {
      btnCreate.addEventListener('mouseenter', function () {
        this.style.transform = 'translateY(-2px)';
        this.style.boxShadow = '0 6px 20px rgba(74,144,217,0.4)';
      });
      btnCreate.addEventListener('mouseleave', function () {
        this.style.transform = 'translateY(0)';
        this.style.boxShadow = '0 4px 16px rgba(74,144,217,0.3)';
      });
      btnCreate.addEventListener('click', function () {
        if (user.role === 'parent') {
          // 家长：创建心青年档案
          createYouthProfile(user);
        } else {
          showToast('只有家长才能创建心青年档案，请使用邀请码加入');
        }
      });
    }

    if (btnJoin) {
      btnJoin.addEventListener('mouseenter', function () {
        this.style.transform = 'translateY(-2px)';
        this.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)';
      });
      btnJoin.addEventListener('mouseleave', function () {
        this.style.transform = 'translateY(0)';
        this.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
      });
      btnJoin.addEventListener('click', function () {
        window.location.hash = 'join';
      });
    }
  }

  /**
   * 家长创建心青年档案（简易版弹窗）
   */
  function createYouthProfile(parentUser) {
    var overlay = document.createElement('div');
    overlay.className = 'modal-overlay active';
    overlay.id = 'create-youth-modal';
    overlay.innerHTML =
      '<div class="modal-content" style="max-width:400px;">' +
      '  <div class="modal-header">' +
      '    <span class="modal-title">创建心青年档案</span>' +
      '    <button class="modal-close" id="btn-close-create-youth">&times;</button>' +
      '  </div>' +
      '  <div class="modal-body">' +
      '    <div style="margin-bottom:12px;">' +
      '      <label class="form-label">心青年姓名</label>' +
      '      <input class="form-input" id="youth-name" placeholder="请输入姓名" style="width:100%;padding:10px 14px;border:1.5px solid #ddd;border-radius:8px;">' +
      '    </div>' +
      '    <div style="margin-bottom:12px;">' +
      '      <label class="form-label">PIN码</label>' +
      '      <input class="form-input" id="youth-pin" placeholder="设置4-6位数字PIN码" maxlength="6" inputmode="numeric" style="width:100%;padding:10px 14px;border:1.5px solid #ddd;border-radius:8px;">' +
      '    </div>' +
      '    <button class="btn btn-primary" id="btn-confirm-create-youth" style="width:100%;padding:12px;border-radius:10px;">确认创建</button>' +
      '  </div>' +
      '</div>';
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';
    document.getElementById('youth-name').focus();

    document.getElementById('btn-close-create-youth').addEventListener('click', function () {
      overlay.remove();
      document.body.style.overflow = '';
    });
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) { overlay.remove(); document.body.style.overflow = ''; }
    });

    document.getElementById('btn-confirm-create-youth').addEventListener('click', function () {
      var name = document.getElementById('youth-name').value.trim();
      var pin = document.getElementById('youth-pin').value;
      if (!name) { showToast('请输入姓名'); return; }
      if (!pin || pin.length < 4) { showToast('PIN码需要4-6位数字'); return; }
      if (!/^\d+$/.test(pin)) { showToast('PIN码只能包含数字'); return; }

      // 注册心青年账号
      var result = DataStore.registerUser(name, 'youth', pin);
      if (!result.success) { showToast(result.message); return; }

      var youthUser = result.user;

      // 绑定家长为该 youth 的主监护人
      DataStore.setPrimaryYouth(parentUser.id, youthUser.id);
      DataStore.addFamilyMember(youthUser.id, parentUser.id, 'mother');

      // 自动授权家长
      DataStore.addGrant({
        youthId: youthUser.id,
        userId: parentUser.id,
        role: 'parent',
        relation: 'mother',
        status: 'active'
      });

      overlay.remove();
      document.body.style.overflow = '';
      showToast('档案创建成功！正在跳转到首页...');
      setTimeout(function () { window.location.hash = 'home'; }, 800);
    });
  }

  // 导出
  window.WelcomePage = {
    renderWelcome: renderWelcome
  };

})();
