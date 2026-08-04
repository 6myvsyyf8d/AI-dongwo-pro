/**
 * approvals.js — 审批页
 * 家长查看并处理加入申请
 * 挂载：window.ApprovalsPage
 */
(function () {
  'use strict';

  var DataStore = window.DataStore;
  var C = window.Constants;
  var showToast = window.showToast;

  function renderApprovals() {
    var contentArea = document.getElementById('approvals-content');
    if (!contentArea) return;

    var user = DataStore.getCurrentUser() || window.AppState.currentUser;
    if (!user) { window.location.hash = 'login'; return; }

    // 只有家长可以审批
    if (user.role !== 'parent') {
      contentArea.innerHTML = '<div style="padding:48px 24px;text-align:center;color:#999;">只有家长可以审批加入申请</div>';
      return;
    }

    var youthId = DataStore.getPrimaryYouth(user.id);
    if (!youthId) {
      contentArea.innerHTML =
        '<div style="padding:48px 24px;text-align:center;color:#999;">还没有创建心青年档案</div>';
      return;
    }

    var pendingRequests = DataStore.getPendingRequestsByYouth(youthId);

    var html = '';
    html += '<div style="padding:20px 24px;">';
    html += '<h2 style="font-size:1.1rem;color:#333;margin-bottom:16px;display:flex;align-items:center;gap:8px;">';
    html += '<span>📋</span>加入申请审批';
    html += pendingRequests.length > 0
      ? '<span style="font-size:0.8rem;background:#F5222D;color:#fff;padding:2px 8px;border-radius:10px;margin-left:auto;">' + pendingRequests.length + ' 条待处理</span>'
      : '';
    html += '</h2>';

    if (pendingRequests.length === 0) {
      html += '<div style="text-align:center;padding:48px 16px;color:#bbb;">';
      html += '<div style="font-size:3rem;margin-bottom:12px;">📭</div>';
      html += '<p>暂无待审批的加入申请</p>';
      html += '</div>';
    } else {
      html += '<div style="display:flex;flex-direction:column;gap:12px;">';
      pendingRequests.forEach(function (req) {
        var roleLabel = C.ROLES[req.userRole] ? C.ROLES[req.userRole].label : req.userRole;
        var roleColor = C.ROLES[req.userRole] ? C.ROLES[req.userRole].color : '#999';
        var relationLabel = '';
        var rel = C.FAMILY_RELATIONS.find(function (r) { return r.value === req.relation; });
        if (rel) relationLabel = rel.label;

        html += '<div style="background:#fff;border-radius:14px;padding:16px;box-shadow:0 1px 6px rgba(0,0,0,0.06);">';
        html += '<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">';
        html += '<div style="font-size:1.5rem;">👤</div>';
        html += '<div style="flex:1;">';
        html += '<div style="font-weight:600;color:#333;font-size:0.95rem;">' + req.userName + '</div>';
        html += '<div style="display:flex;gap:6px;margin-top:3px;flex-wrap:wrap;">';
        html += '<span style="font-size:0.75rem;color:#fff;background:' + roleColor + ';padding:1px 8px;border-radius:10px;">' + roleLabel + '</span>';
        if (relationLabel) {
          html += '<span style="font-size:0.75rem;color:#888;padding:1px 8px;">关系：' + relationLabel + '</span>';
        }
        html += '</div>';
        html += '</div>';
        html += '<span style="font-size:0.75rem;color:#aaa;">' + req.createdAt + '</span>';
        html += '</div>';
        html += '<div style="font-size:0.82rem;color:#888;margin-bottom:12px;">邀请码：<code style="background:#f5f5f5;padding:2px 6px;border-radius:4px;">' + req.invitationCode + '</code></div>';
        html += '<div style="display:flex;gap:10px;">';
        html += '<button class="btn-approve" data-req-id="' + req.id + '" style="flex:1;padding:10px;border:none;border-radius:8px;background:#52C41A;color:#fff;font-size:0.9rem;cursor:pointer;">批准</button>';
        html += '<button class="btn-reject" data-req-id="' + req.id + '" style="flex:1;padding:10px;border:1px solid #ddd;border-radius:8px;background:#fff;color:#F5222D;font-size:0.9rem;cursor:pointer;">拒绝</button>';
        html += '</div>';
        html += '</div>';
      });
      html += '</div>';
    }

    contentArea.innerHTML = html;
    bindApprovalEvents(youthId, user);
  }

  function bindApprovalEvents(youthId, parentUser) {
    // 批准按钮
    document.querySelectorAll('.btn-approve').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var reqId = this.getAttribute('data-req-id');
        approveRequest(reqId, youthId, parentUser);
      });
    });

    // 拒绝按钮
    document.querySelectorAll('.btn-reject').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var reqId = this.getAttribute('data-req-id');
        rejectRequest(reqId);
      });
    });
  }

  /**
   * 批准申请：写入 grants + family_relations + 标记邀请码已用
   */
  function approveRequest(reqId, youthId) {
    var requests = DataStore.getJoinRequests();
    var req = requests.find(function (r) { return r.id === reqId; });
    if (!req) { showToast('申请不存在'); return; }

    // 1. 写授权
    DataStore.addGrant({
      youthId: youthId,
      userId: req.userId,
      role: req.userRole,
      relation: req.relation,
      status: 'active'
    });

    // 2. 写家庭关系
    DataStore.addFamilyMember(youthId, req.userId, req.relation);

    // 3. 标记邀请码已使用
    DataStore.markInvitationUsed(req.invitationCode);

    // 4. 更新申请状态
    DataStore.updateJoinRequestStatus(reqId, 'approved');

    showToast('已批准「' + req.userName + '」的加入申请');
    renderApprovals();
  }

  /**
   * 拒绝申请
   */
  function rejectRequest(reqId) {
    var requests = DataStore.getJoinRequests();
    var req = requests.find(function (r) { return r.id === reqId; });
    if (!req) { showToast('申请不存在'); return; }

    if (!confirm('确定拒绝「' + req.userName + '」的加入申请吗？')) return;

    DataStore.updateJoinRequestStatus(reqId, 'rejected');
    showToast('已拒绝申请');
    renderApprovals();
  }

  // 导出
  window.ApprovalsPage = {
    renderApprovals: renderApprovals
  };

})();
