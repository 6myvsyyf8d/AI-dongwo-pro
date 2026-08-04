/**
 * grants.js — 授权管理页
 * 家长查看已授权用户列表，生成邀请码
 * 挂载：window.GrantsPage
 */
(function () {
  'use strict';

  var DataStore = window.DataStore;
  var C = window.Constants;
  var showToast = window.showToast;

  function renderGrants() {
    var contentArea = document.getElementById('grants-content');
    if (!contentArea) return;

    var user = DataStore.getCurrentUser() || window.AppState.currentUser;
    if (!user) { window.location.hash = 'login'; return; }

    // 只有家长可以管理授权
    if (user.role !== 'parent') {
      contentArea.innerHTML = '<div style="padding:48px 24px;text-align:center;color:#999;">只有家长可以管理授权</div>';
      return;
    }

    // 获取当前用户关联的心青年
    var youthId = DataStore.getPrimaryYouth(user.id);
    if (!youthId) {
      contentArea.innerHTML =
        '<div style="padding:48px 24px;text-align:center;">' +
        '<div style="font-size:3rem;margin-bottom:16px;">📋</div>' +
        '<p style="color:#888;margin-bottom:16px;">还没有创建心青年档案</p>' +
        '<button id="btn-goto-welcome" style="padding:12px 24px;background:#4A90D9;color:#fff;border:none;border-radius:10px;cursor:pointer;font-size:0.95rem;">去创建档案</button>' +
        '</div>';
      setTimeout(function () {
        var btn = document.getElementById('btn-goto-welcome');
        if (btn) btn.addEventListener('click', function () { window.location.hash = 'welcome'; });
      }, 50);
      return;
    }

    // 获取该 youth 的已授权用户
    var grants = DataStore.getGrantsByYouth(youthId);
    // 获取家庭成员关系
    var familyRelations = DataStore.getFamilyRelations();
    var familyMembers = familyRelations[youthId] || [];

    var html = '';

    // 顶部操作区
    html += '<div style="padding:20px 24px;">';
    html += '<h2 style="font-size:1.1rem;color:#333;margin-bottom:16px;display:flex;align-items:center;gap:8px;">';
    html += '<span>👥</span>协作网络 · 授权管理';
    html += '</h2>';

    // 邀请按钮
    html += '<button id="btn-invite" style="width:100%;padding:14px;border-radius:12px;border:2px dashed #4A90D9;background:#f0f7ff;color:#4A90D9;font-size:0.95rem;cursor:pointer;margin-bottom:20px;display:flex;align-items:center;justify-content:center;gap:8px;">';
    html += '<span style="font-size:1.2rem;">👨\u200d👩\u200d👧</span> 邀请家人';
    html += '</button>';

    // 已授权用户列表
    html += '<h3 style="font-size:0.95rem;color:#666;margin-bottom:12px;">已授权用户（' + grants.length + '人）</h3>';

    if (grants.length === 0) {
      html += '<div style="text-align:center;padding:32px 16px;color:#bbb;">';
      html += '<div style="font-size:2rem;margin-bottom:8px;">📭</div>';
      html += '<p>还没有授权其他用户</p>';
      html += '<p style="font-size:0.82rem;">点击上方按钮邀请老师或影子老师加入</p>';
      html += '</div>';
    } else {
      html += '<div style="display:flex;flex-direction:column;gap:10px;">';
      grants.forEach(function (grant) {
        var grantUser = DataStore.findUserById(grant.userId);
        var userName = grantUser ? grantUser.name : '未知用户';
        var userAvatar = grantUser ? grantUser.avatar : '👤';
        var roleLabel = C.ROLES[grant.role] ? C.ROLES[grant.role].label : grant.role;
        var roleColor = C.ROLES[grant.role] ? C.ROLES[grant.role].color : '#999';

        html += '<div style="display:flex;align-items:center;gap:12px;background:#fff;border-radius:12px;padding:14px 16px;box-shadow:0 1px 4px rgba(0,0,0,0.04);">';
        html += '<div style="font-size:1.8rem;">' + userAvatar + '</div>';
        html += '<div style="flex:1;min-width:0;">';
        html += '<div style="font-weight:600;color:#333;font-size:0.9rem;">' + userName + '</div>';
        html += '<div style="display:flex;gap:6px;margin-top:4px;flex-wrap:wrap;">';
        html += '<span style="font-size:0.75rem;color:#fff;background:' + roleColor + ';padding:1px 8px;border-radius:10px;">' + roleLabel + '</span>';
        if (grant.relation) {
          html += '<span style="font-size:0.75rem;color:#888;padding:1px 8px;">关系：' + grant.relation + '</span>';
        }
        html += '</div>';
        html += '<div style="font-size:0.75rem;color:#aaa;margin-top:2px;">' + grant.createdAt + ' 加入</div>';
        html += '</div>';
        // 非家长的授权可以移除
        if (grant.role !== 'parent') {
          html += '<button class="btn-remove-grant" data-grant-id="' + grant.id + '" style="background:none;border:none;color:#F5222D;cursor:pointer;font-size:0.8rem;padding:6px;">移除</button>';
        }
        html += '</div>';
      });
      html += '</div>';
    }

    contentArea.innerHTML = html;

    // 绑定事件
    bindGrantsEvents(youthId, user);
  }

  function bindGrantsEvents(youthId, user) {
    // 邀请按钮
    var btnInvite = document.getElementById('btn-invite');
    if (btnInvite) {
      btnInvite.addEventListener('click', function () {
        showInviteModal(youthId, user);
      });
    }

    // 移除授权按钮
    document.querySelectorAll('.btn-remove-grant').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var grantId = this.getAttribute('data-grant-id');
        if (confirm('确定要移除该用户的授权吗？')) {
          DataStore.removeGrant(grantId);
          showToast('已移除授权');
          renderGrants();
        }
      });
    });
  }

  function showInviteModal(youthId, user) {
    var overlay = document.createElement('div');
    overlay.className = 'modal-overlay active';
    overlay.id = 'invite-modal';

    // 生成邀请码的角色选项
    var roleOptions = C.INVITABLE_ROLES.map(function (r) {
      return '<option value="' + r.value + '">' + r.label + '</option>';
    }).join('');

    // 家庭关系选项
    var relationOptions = C.FAMILY_RELATIONS.map(function (r) {
      return '<option value="' + r.value + '">' + r.label + '</option>';
    }).join('');

    overlay.innerHTML =
      '<div class="modal-content" style="max-width:400px;">' +
      '  <div class="modal-header">' +
      '    <span class="modal-title">邀请家人</span>' +
      '    <button class="modal-close" id="btn-close-invite">&times;</button>' +
      '  </div>' +
      '  <div class="modal-body">' +
      '    <p style="font-size:0.85rem;color:#888;margin-bottom:16px;">生成邀请码，分享给需要加入的老师或影子老师</p>' +
      '    <div style="margin-bottom:12px;">' +
      '      <label class="form-label">选择角色</label>' +
      '      <select id="invite-role" style="width:100%;padding:10px 14px;border:1.5px solid #ddd;border-radius:8px;font-size:0.9rem;">' + roleOptions + '</select>' +
      '    </div>' +
      '    <div style="margin-bottom:16px;">' +
      '      <label class="form-label">选择关系</label>' +
      '      <select id="invite-relation" style="width:100%;padding:10px 14px;border:1.5px solid #ddd;border-radius:8px;font-size:0.9rem;">' + relationOptions + '</select>' +
      '    </div>' +
      '    <button class="btn btn-primary" id="btn-generate-invite" style="width:100%;padding:12px;border-radius:10px;">生成邀请码</button>' +
      '    <div id="invite-result-area" style="margin-top:16px;display:none;"></div>' +
      '  </div>' +
      '</div>';
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';

    document.getElementById('btn-close-invite').addEventListener('click', function () {
      overlay.remove(); document.body.style.overflow = '';
    });
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) { overlay.remove(); document.body.style.overflow = ''; }
    });

    document.getElementById('btn-generate-invite').addEventListener('click', function () {
      var role = document.getElementById('invite-role').value;
      var relation = document.getElementById('invite-relation').value;

      var invitation = DataStore.createInvitation({
        youthId: youthId,
        createdBy: user.id,
        role: role,
        relation: relation
      });

      var resultArea = document.getElementById('invite-result-area');
      var roleLabel = C.ROLES[role] ? C.ROLES[role].label : role;
      var relationLabel = C.FAMILY_RELATIONS.find(function (r) { return r.value === relation; });
      relationLabel = relationLabel ? relationLabel.label : relation;

      resultArea.style.display = 'block';
      resultArea.innerHTML =
        '<div style="background:#f0f7ff;border-radius:12px;padding:20px;text-align:center;">' +
        '  <div style="font-size:0.85rem;color:#888;margin-bottom:8px;">邀请码已生成（角色：' + roleLabel + '，关系：' + relationLabel + '）</div>' +
        '  <div style="font-size:2rem;font-weight:700;color:#4A90D9;letter-spacing:4px;margin-bottom:8px;user-select:all;">' + invitation.code + '</div>' +
        '  <div style="font-size:0.78rem;color:#aaa;">有效期至 ' + invitation.expiresAt + '</div>' +
        '  <button id="btn-copy-invite" style="margin-top:12px;padding:8px 20px;background:#4A90D9;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:0.85rem;">📋 复制邀请码</button>' +
        '</div>';

      document.getElementById('btn-copy-invite').addEventListener('click', function () {
        navigator.clipboard.writeText(invitation.code).then(function () {
          showToast('邀请码已复制到剪贴板');
        }).catch(function () {
          showToast('复制失败，请手动复制');
        });
      });
    });
  }

  // 导出
  window.GrantsPage = {
    renderGrants: renderGrants
  };

})();
