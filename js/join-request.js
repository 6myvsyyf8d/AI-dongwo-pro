/**
 * join-request.js — 加入申请页
 * 非家长用户通过邀请码加入已有家庭
 * 挂载：window.JoinRequestPage
 */
(function () {
  'use strict';

  var DataStore = window.DataStore;
  var C = window.Constants;
  var showToast = window.showToast;

  function renderJoin() {
    var contentArea = document.getElementById('join-content');
    if (!contentArea) return;

    var user = DataStore.getCurrentUser() || window.AppState.currentUser;
    if (!user) { window.location.hash = 'login'; return; }

    // 如果用户已经被授权了某个 youth，提示已加入
    var existingGrants = DataStore.getGrantsByUser(user.id);
    if (existingGrants.length > 0) {
      var youthId = existingGrants[0].youthId;
      var youthUser = DataStore.findUserById(youthId);
      var youthName = youthUser ? youthUser.name : '心青年';
      contentArea.innerHTML =
        '<div style="padding:48px 24px;text-align:center;">' +
        '<div style="font-size:3rem;margin-bottom:16px;">✅</div>' +
        '<p style="color:#333;font-size:1rem;margin-bottom:8px;">您已经加入了「' + youthName + '」的家庭</p>' +
        '<p style="color:#888;font-size:0.85rem;margin-bottom:24px;">如需加入另一个家庭，请先联系当前家庭的家长移除授权</p>' +
        '<button onclick="location.hash=\'home\'" style="padding:12px 24px;background:#4A90D9;color:#fff;border:none;border-radius:10px;cursor:pointer;font-size:0.95rem;">返回首页</button>' +
        '</div>';
      return;
    }

    // 家长提示去管理授权
    if (user.role === 'parent') {
      contentArea.innerHTML =
        '<div style="padding:48px 24px;text-align:center;">' +
        '<div style="font-size:3rem;margin-bottom:16px;">👨\u200d👩\u200d👧</div>' +
        '<p style="color:#333;font-size:1rem;margin-bottom:8px;">您是家长角色</p>' +
        '<p style="color:#888;font-size:0.85rem;margin-bottom:24px;">家长不需要加入家庭，可以在「授权管理」中邀请其他用户</p>' +
        '<button onclick="location.hash=\'grants\'" style="padding:12px 24px;background:#4A90D9;color:#fff;border:none;border-radius:10px;cursor:pointer;font-size:0.95rem;">前往授权管理</button>' +
        '</div>';
      return;
    }

    var html = '';
    html += '<div style="padding:40px 24px 24px;text-align:center;">';
    html += '<div style="font-size:3rem;margin-bottom:16px;">👨\u200d👩\u200d👧</div>';
    html += '<h2 style="font-size:1.2rem;color:#333;margin-bottom:8px;">加入已有家庭</h2>';
    html += '<p style="color:#888;font-size:0.85rem;margin-bottom:32px;line-height:1.6;">输入家长分享给您的邀请码，<br>即可加入对应家庭</p>';

    // 邀请码输入
    html += '<div style="max-width:300px;margin:0 auto;">';
    html += '<div style="margin-bottom:16px;">';
    html += '<input id="invite-code-input" type="text" placeholder="请输入6位邀请码" maxlength="6" ' +
            'style="width:100%;padding:14px;border:2px solid #ddd;border-radius:12px;font-size:1.2rem;text-align:center;letter-spacing:4px;text-transform:uppercase;font-family:monospace;">';
    html += '</div>';

    // 关系选择（邀请码验证成功后显示）
    html += '<div id="relation-select-area" style="display:none;margin-bottom:16px;">';
    html += '<label class="form-label">选择您与心青年的关系</label>';
    html += '<select id="join-relation" style="width:100%;padding:10px 14px;border:1.5px solid #ddd;border-radius:8px;font-size:0.9rem;">';
    C.FAMILY_RELATIONS.forEach(function (r) {
      html += '<option value="' + r.value + '">' + r.label + '</option>';
    });
    html += '</select>';
    html += '</div>';

    html += '<button id="btn-submit-join" disabled style="width:100%;padding:14px;border-radius:12px;border:none;background:#ddd;color:#999;font-size:1rem;cursor:not-allowed;">提交加入申请</button>';

    // 验证状态提示
    html += '<div id="invite-status" style="margin-top:12px;font-size:0.85rem;"></div>';

    html += '</div></div>';

    contentArea.innerHTML = html;

    bindJoinEvents(user);
  }

  function bindJoinEvents(user) {
    var codeInput = document.getElementById('invite-code-input');
    var statusEl = document.getElementById('invite-status');
    var relationArea = document.getElementById('relation-select-area');
    var submitBtn = document.getElementById('btn-submit-join');
    var validatedInvitation = null;

    if (!codeInput) return;

    // 输入邀请码时自动转大写
    codeInput.addEventListener('input', function () {
      this.value = this.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
      statusEl.innerHTML = '';
      relationArea.style.display = 'none';
      submitBtn.disabled = true;
      submitBtn.style.background = '#ddd';
      submitBtn.style.color = '#999';
      submitBtn.style.cursor = 'not-allowed';
      validatedInvitation = null;
    });

    // 验证邀请码
    codeInput.addEventListener('blur', function () {
      var code = this.value.toUpperCase().trim();
      if (code.length !== 6) return;

      var invitation = DataStore.findInvitation(code);
      if (!invitation) {
        statusEl.innerHTML = '<span style="color:#F5222D;">邀请码无效或已过期</span>';
        return;
      }

      // 验证用户角色是否匹配邀请码允许的角色
      if (user.role !== invitation.role) {
        var expectedLabel = C.ROLES[invitation.role] ? C.ROLES[invitation.role].label : invitation.role;
        statusEl.innerHTML = '<span style="color:#FAAD14;">此邀请码是为「' + expectedLabel + '」准备的，您当前的账号角色不匹配</span>';
        return;
      }

      validatedInvitation = invitation;
      statusEl.innerHTML = '<span style="color:#52C41A;">邀请码验证通过！角色：' + (C.ROLES[invitation.role] ? C.ROLES[invitation.role].label : '') + '</span>';
      relationArea.style.display = 'block';
      submitBtn.disabled = false;
      submitBtn.style.background = '#4A90D9';
      submitBtn.style.color = '#fff';
      submitBtn.style.cursor = 'pointer';
    });

    // 也支持回车触发验证
    codeInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { this.blur(); }
    });

    // 提交申请
    submitBtn.addEventListener('click', function () {
      if (!validatedInvitation) {
        showToast('请先输入有效的邀请码');
        return;
      }

      var relation = document.getElementById('join-relation').value;

      DataStore.addJoinRequest({
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        invitationCode: validatedInvitation.code,
        relation: relation,
        youthId: validatedInvitation.youthId
      });

      showToast('申请已提交，等待家长审批');
      setTimeout(function () { window.location.hash = 'home'; }, 1200);
    });
  }

  // 导出
  window.JoinRequestPage = {
    renderJoin: renderJoin
  };

})();
