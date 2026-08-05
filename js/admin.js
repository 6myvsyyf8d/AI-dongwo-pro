/**
 * admin.js — 管理页 v2.0
 * 按"人和权限"组织，不按技术模块堆菜单
 * 挂载：window.AdminPage
 * 依赖：DataStore, Constants, showToast
 */
(function () {
  'use strict';

  var DataStore = window.DataStore;
  var C = window.Constants;
  var ROLES = C.ROLES;
  var showToast = window.showToast;

  /* ==========================================================
   * 主入口
   * ========================================================== */
  function render() {
    var contentArea = document.getElementById('profile-content');
    if (!contentArea) return;

    var user = DataStore.getCurrentUser() || window.AppState.currentUser;
    if (!user) { window.location.hash = 'login'; return; }

    var role = user.role;

    if (role === 'parent') {
      renderParentDashboard(contentArea, user);
    } else if (role === 'admin') {
      renderAdminDashboard(contentArea, user);
    } else if (role === 'government') {
      renderGovernmentView(contentArea, user);
    } else {
      renderMemberView(contentArea, user);
    }

    // 所有角色均显示"重新查看使用引导"
    var existingFooter = contentArea.querySelector('.admin-footer');
    if (!existingFooter) {
      var footer = document.createElement('div');
      footer.className = 'admin-footer';
      footer.style.cssText = 'text-align:center;padding:16px 0 32px;';
      footer.innerHTML = '<a href="#" id="btn-reonboard-admin" style="color:var(--color-primary);font-size:0.85rem;text-decoration:none;">重新查看使用引导</a>';
      contentArea.appendChild(footer);
      document.getElementById('btn-reonboard-admin').addEventListener('click', function(e) {
        e.preventDefault();
        if (window.Onboarding) window.Onboarding.resetOnboarding();
        window.location.hash = 'quick-start';
      });
    }
  }

  /* ==========================================================
   * 家长管理仪表盘
   * ========================================================== */
  function renderParentDashboard(ct, user) {
    var youthId = DataStore.getPrimaryYouth(user.id);
    if (!youthId) {
      ct.innerHTML = '<div style="padding:48px 24px;text-align:center;"><div style="font-size:3rem;">📋</div><p style="color:#888;">还没有创建心青年档案</p></div>';
      return;
    }

    var youthUser = DataStore.findUserById(youthId);
    var allGrants = DataStore.getGrants().filter(function (g) { return g.youthId === youthId; });
    var activeGrants = allGrants.filter(function (g) { return g.status === 'active'; });
    var revokedGrants = allGrants.filter(function (g) { return g.status === 'revoked'; });
    var pendingRequests = DataStore.getPendingRequestsByYouth(youthId);
    var expiringGrants = DataStore.getExpiringGrants(youthId);
    var auditLog = DataStore.getAuditLog().slice(0, 30);

    var html = '';
    html += '<div class="profile-scroll">';

    // ====== 身份卡 ======
    html += '<div class="admin-id-card">';
    html += '  <div class="admin-id-avatar">' + (user.avatar || '👨‍👩‍👧') + '</div>';
    html += '  <div class="admin-id-info">';
    html += '    <div class="admin-id-name">' + (user.name || '家长') + '</div>';
    html += '    <div class="admin-id-role">管理 ' + (youthUser ? youthUser.name : '心青年') + ' 的支持网络</div>';
    html += '  </div>';
    html += '</div>';

    // ====== 状态概览 ======
    html += '<div class="admin-stats-row">';
    html += buildStatCard('👥', activeGrants.length, '已授权', '#52C41A');
    html += buildStatCard('📋', pendingRequests.length, '待审批', pendingRequests.length > 0 ? '#FAAD14' : '#999');
    html += buildStatCard('⏰', expiringGrants.length, '即将到期', expiringGrants.length > 0 ? '#F5222D' : '#999');
    html += buildStatCard('📝', auditLog.length, '操作记录', '#4A90D9');
    html += '</div>';

    // ====== 风险提示 ======
    if (expiringGrants.length > 0) {
      html += '<div class="admin-alert-section">';
      html += '<div class="admin-alert-title">⚠️ 需要关注</div>';
      expiringGrants.forEach(function (g) {
        var gu = DataStore.findUserById(g.userId);
        var name = gu ? gu.name : '未知用户';
        html += '<div class="admin-alert-item">';
        html += '  <span class="alert-dot"></span>';
        html += '  <span>' + name + ' 的授权即将到期</span>';
        html += '</div>';
      });
      html += '</div>';
    }

    if (pendingRequests.length > 0) {
      html += '<div class="admin-alert-section" style="border-left-color:#FAAD14;">';
      html += '<div class="admin-alert-title" style="color:#FAAD14;">📋 待处理</div>';
      pendingRequests.forEach(function (r) {
        html += '<div class="admin-alert-item">';
        html += '  <span class="alert-dot" style="background:#FAAD14;"></span>';
        html += '  <span>' + r.userName + ' 申请加入</span>';
        html += '</div>';
      });
      html += '</div>';
    }

    // ====== 授权网络 — 状态筛选标签 ======
    html += '<div class="admin-section">';
    html += '<div class="admin-section-header">';
    html += '  <span class="admin-section-title">👥 授权网络</span>';
    html += '  <span class="admin-section-badge" id="admin-grant-count">' + activeGrants.length + '人</span>';
    html += '</div>';

    html += '<div class="admin-filter-tabs" id="admin-filter-tabs">';
    html += '  <button class="admin-filter-tab active" data-filter="all">全部</button>';
    html += '  <button class="admin-filter-tab" data-filter="active">已授权</button>';
    html += '  <button class="admin-filter-tab" data-filter="pending">待审批</button>';
    html += '  <button class="admin-filter-tab" data-filter="expiring">即将到期</button>';
    html += '  <button class="admin-filter-tab" data-filter="revoked">已撤销</button>';
    html += '</div>';

    html += '<div class="admin-grant-list" id="admin-grant-list">';

    // ====== 授权网络 — 人员卡片 ======
    // 默认展开（all = active + pending）
    var displayGrants = buildGrantCards(activeGrants, pendingRequests, expiringGrants, revokedGrants, 'all', user, youthId);
    html += displayGrants;
    html += '</div>';
    html += '</div>';

    // ====== 快捷操作 ======
    html += '<div class="admin-section">';
    html += '<div class="admin-section-header">';
    html += '  <span class="admin-section-title">⚡ 快捷操作</span>';
    html += '</div>';
    html += '<div class="admin-quick-actions">';
    html += '  <button class="admin-action-btn" id="admin-btn-invite">';
    html += '    <span class="admin-action-icon">👨‍👩‍👧</span>';
    html += '    <span class="admin-action-label">邀请成员</span>';
    html += '  </button>';
    html += '  <button class="admin-action-btn" id="admin-btn-backup">';
    html += '    <span class="admin-action-icon">💾</span>';
    html += '    <span class="admin-action-label">导出备份</span>';
    html += '  </button>';
    html += '  <button class="admin-action-btn" id="admin-btn-import">';
    html += '    <span class="admin-action-icon">📥</span>';
    html += '    <span class="admin-action-label">导入恢复</span>';
    html += '  </button>';
    html += '  <button class="admin-action-btn" id="admin-btn-settings">';
    html += '    <span class="admin-action-icon">⚙️</span>';
    html += '    <span class="admin-action-label">系统设置</span>';
    html += '  </button>';
    html += '</div>';
    html += '</div>';

    // ====== 操作日志 ======
    if (auditLog.length > 0) {
      html += '<div class="admin-section">';
      html += '<div class="admin-section-header">';
      html += '  <span class="admin-section-title">📜 最近操作</span>';
      html += '</div>';
      html += '<div class="admin-log-list">';
      auditLog.slice(0, 8).forEach(function (log) {
        html += buildLogItem(log);
      });
      html += '</div>';
      html += '</div>';
    }

    html += '</div>'; // .profile-scroll

    ct.innerHTML = html;
    bindParentEvents(user, youthId);
  }

  /* ==========================================================
   * 管理员仪表盘（系统管理，不开 youth 数据）
   * ========================================================== */
  function renderAdminDashboard(ct, user) {
    var allUsers = DataStore.getAllUsers();
    var allGrants = DataStore.getGrants();
    var auditLog = DataStore.getAuditLog().slice(0, 30);
    var joinRequests = DataStore.getJoinRequests();

    var roleCounts = {};
    allUsers.forEach(function (u) {
      roleCounts[u.role] = (roleCounts[u.role] || 0) + 1;
    });

    var html = '';
    html += '<div class="profile-scroll">';

    // ====== 身份卡 ======
    html += '<div class="admin-id-card" style="border-left-color:#13C2C2;">';
    html += '  <div class="admin-id-avatar">🛡️</div>';
    html += '  <div class="admin-id-info">';
    html += '    <div class="admin-id-name">系统管理员</div>';
    html += '    <div class="admin-id-role" style="color:#13C2C2;">系统配置与用户管理</div>';
    html += '  </div>';
    html += '</div>';

    // ====== 声明 ======
    html += '<div class="admin-limitation-note">';
    html += '⚠️ <strong>注意：</strong>系统管理权限仅限用户管理和系统配置，<em>不包含</em>查看心青年档案内容的权限。';
    html += '</div>';

    // ====== 系统概览 ======
    html += '<div class="admin-stats-row">';
    html += buildStatCard('👤', allUsers.length, '总用户', '#4A90D9');
    html += buildStatCard('🔗', allGrants.filter(function (g) { return g.status === 'active'; }).length, '活跃授权', '#52C41A');
    html += buildStatCard('📋', joinRequests.filter(function (r) { return r.status === 'pending'; }).length, '待审批', '#FAAD14');
    html += buildStatCard('📝', auditLog.length, '操作日志', '#999');
    html += '</div>';

    // ====== 用户管理 ======
    html += '<div class="admin-section">';
    html += '<div class="admin-section-header">';
    html += '  <span class="admin-section-title">👥 用户列表</span>';
    html += '  <span class="admin-section-badge">' + allUsers.length + '人</span>';
    html += '</div>';

    html += '<div class="admin-user-list">';
    allUsers.forEach(function (u) {
      var roleInfo = ROLES[u.role] || { label: u.role, color: '#999' };
      html += '<div class="admin-user-card">';
      html += '  <div class="admin-user-avatar">' + (u.avatar || '👤') + '</div>';
      html += '  <div class="admin-user-info">';
      html += '    <div class="admin-user-name">' + u.name + '</div>';
      html += '    <div class="admin-user-meta">';
      html += '      <span class="admin-role-tag" style="background:' + roleInfo.color + ';">' + roleInfo.label + '</span>';
      html += '      <span>注册：' + (u.createdAt || '-') + '</span>';
      html += '    </div>';
      html += '  </div>';
      html += '</div>';
    });
    html += '</div>';
    html += '</div>';

    // ====== 角色分布 ======
    html += '<div class="admin-section">';
    html += '<div class="admin-section-header">';
    html += '  <span class="admin-section-title">📊 角色分布</span>';
    html += '</div>';
    var roleOrder = ['youth', 'parent', 'teacher', 'caregiver', 'government', 'admin'];
    var maxCount = Math.max.apply(null, Object.values(roleCounts).concat([1]));
    roleOrder.forEach(function (rKey) {
      var count = roleCounts[rKey] || 0;
      var roleInfo = ROLES[rKey] || { label: rKey, color: '#999' };
      var pct = Math.round(count / maxCount * 100);
      html += '<div style="margin-bottom:10px;display:flex;align-items:center;gap:10px;">';
      html += '<span style="font-size:0.85rem;width:70px;text-align:right;">' + roleInfo.label + '</span>';
      html += '<div style="flex:1;background:#f0f0f0;border-radius:4px;height:20px;overflow:hidden;">';
      html += '<div style="height:100%;width:' + pct + '%;background:' + roleInfo.color + ';border-radius:4px;"></div>';
      html += '</div>';
      html += '<span style="font-size:0.8rem;color:#888;width:30px;">' + count + '</span>';
      html += '</div>';
    });
    html += '</div>';

    // ====== 系统工具 ======
    html += '<div class="admin-section">';
    html += '<div class="admin-section-header">';
    html += '  <span class="admin-section-title">⚡ 系统工具</span>';
    html += '</div>';
    html += '<div class="admin-quick-actions">';
    html += '  <button class="admin-action-btn" id="admin-btn-backup">';
    html += '    <span class="admin-action-icon">💾</span>';
    html += '    <span class="admin-action-label">导出备份</span>';
    html += '  </button>';
    html += '  <button class="admin-action-btn" id="admin-btn-import">';
    html += '    <span class="admin-action-icon">📥</span>';
    html += '    <span class="admin-action-label">导入恢复</span>';
    html += '  </button>';
    html += '  <button class="admin-action-btn" id="admin-btn-settings">';
    html += '    <span class="admin-action-icon">⚙️</span>';
    html += '    <span class="admin-action-label">系统设置</span>';
    html += '  </button>';
    html += '  <button class="admin-action-btn" id="admin-btn-reset">';
    html += '    <span class="admin-action-icon">🔄</span>';
    html += '    <span class="admin-action-label">重置数据</span>';
    html += '  </button>';
    html += '</div>';
    html += '</div>';

    // ====== 操作日志 ======
    if (auditLog.length > 0) {
      html += '<div class="admin-section">';
      html += '<div class="admin-section-header">';
      html += '  <span class="admin-section-title">📜 最近操作</span>';
      html += '</div>';
      html += '<div class="admin-log-list">';
      auditLog.slice(0, 10).forEach(function (log) {
        html += buildLogItem(log);
      });
      html += '</div>';
      html += '</div>';
    }

    html += '</div>'; // .profile-scroll

    ct.innerHTML = html;
    bindAdminEvents(user);
  }

  /* ==========================================================
   * 政府角色视图
   * ========================================================== */
  function renderGovernmentView(ct, user) {
    ct.innerHTML = '<div style="padding:48px 24px;text-align:center;">' +
      '<div style="font-size:3rem;">🏛️</div>' +
      '<p style="color:#888;margin-top:12px;">政府角色可查看宏观数据看板</p>' +
      '<button onclick="location.hash=\'home\'" style="margin-top:16px;padding:10px 24px;background:#4A90D9;color:#fff;border:none;border-radius:10px;font-size:0.9rem;cursor:pointer;">前往政府看板</button>' +
      '</div>';
  }

  /* ==========================================================
   * 普通成员视图（teacher/caregiver）
   * ========================================================== */
  function renderMemberView(ct, user) {
    var grants = DataStore.getGrantsByUser(user.id);
    var roleInfo = ROLES[user.role] || { label: '成员', avatar: '👤', color: '#999' };

    var html = '';
    html += '<div class="profile-scroll">';

    // 身份卡
    html += '<div class="admin-id-card" style="border-left-color:' + roleInfo.color + ';">';
    html += '  <div class="admin-id-avatar">' + (user.avatar || roleInfo.avatar) + '</div>';
    html += '  <div class="admin-id-info">';
    html += '    <div class="admin-id-name">' + (user.name || '成员') + '</div>';
    html += '    <div class="admin-id-role">当前身份：' + roleInfo.label + '</div>';
    html += '  </div>';
    html += '</div>';

    // 授权状态
    html += '<div class="admin-section">';
    html += '<div class="admin-section-header">';
    html += '  <span class="admin-section-title">🔗 我的授权</span>';
    html += '</div>';

    if (grants.length === 0) {
      html += '<div style="text-align:center;padding:32px 16px;color:#bbb;">';
      html += '<div style="font-size:2rem;">📭</div>';
      html += '<p>尚未加入任何家庭支持网络</p>';
      html += '<button onclick="location.hash=\'join\'" style="margin-top:12px;padding:10px 24px;background:#4A90D9;color:#fff;border:none;border-radius:10px;font-size:0.9rem;cursor:pointer;">加入家庭</button>';
      html += '</div>';
    } else {
      grants.forEach(function (g) {
        var yu = DataStore.findUserById(g.youthId);
        html += '<div class="admin-user-card">';
        html += '  <div class="admin-user-avatar">🌻</div>';
        html += '  <div class="admin-user-info">';
        html += '    <div class="admin-user-name">' + (yu ? yu.name : '心青年') + '</div>';
        html += '    <div class="admin-user-meta">';
        html += '      <span class="admin-role-tag" style="background:' + roleInfo.color + ';">' + roleInfo.label + '</span>';
        html += '      <span>授权：' + g.createdAt + '</span>';
        html += '    </div>';
        html += '  </div>';
        html += '</div>';
      });
    }
    html += '</div>';

    html += '</div>'; // .profile-scroll

    ct.innerHTML = html;
  }

  /* ==========================================================
   * 构建统计卡片
   * ========================================================== */
  function buildStatCard(icon, count, label, color) {
    return '<div class="admin-stat-card">' +
      '<div class="admin-stat-icon">' + icon + '</div>' +
      '<div class="admin-stat-num" style="color:' + color + ';">' + count + '</div>' +
      '<div class="admin-stat-label">' + label + '</div>' +
      '</div>';
  }

  /* ==========================================================
   * 构建人员卡片（授权网络）
   * ========================================================== */
  function buildGrantCards(activeGrants, pendingRequests, expiringGrants, revokedGrants, filter, currentUser, youthId) {
    var html = '';
    var expiringIds = expiringGrants.map(function (g) { return g.id; });

    // 已授权卡片
    if (filter === 'all' || filter === 'active' || filter === 'expiring') {
      activeGrants.forEach(function (g) {
        var gu = DataStore.findUserById(g.userId);
        var name = gu ? gu.name : '未知用户';
        var avatar = gu ? gu.avatar : '👤';
        var roleInfo = ROLES[g.role] || { label: g.role, color: '#999' };
        var isExpiring = expiringIds.indexOf(g.id) !== -1;
        var isParentRole = g.role === 'parent';

        html += '<div class="admin-person-card" data-grant-id="' + g.id + '" data-status="' + (isExpiring ? 'expiring' : 'active') + '">';
        html += '  <div class="admin-person-avatar">' + avatar + '</div>';
        html += '  <div class="admin-person-body">';
        html += '    <div class="admin-person-name">' + name;
        if (isExpiring) html += '  <span class="admin-person-expiring">即将到期</span>';
        html += '    </div>';
        html += '    <div class="admin-person-meta">';
        html += '      <span class="admin-role-tag" style="background:' + roleInfo.color + ';">' + roleInfo.label + '</span>';
        if (g.relation) html += '      <span>' + (getRelationLabel(g.relation)) + '</span>';
        html += '      <span>加入：' + g.createdAt + '</span>';
        html += '    </div>';
        html += '  </div>';
        // 操作按钮 — 不下放到卡片内，通过兜底展开
        if (!isParentRole) {
          html += '  <button class="admin-person-more" data-grant-id="' + g.id + '" data-grant-role="' + g.role + '" data-grant-user="' + name + '">⋯</button>';
        }
        html += '</div>';
      });
    }

    // 待审批卡片
    if (filter === 'all' || filter === 'pending') {
      pendingRequests.forEach(function (r) {
        var roleInfo = ROLES[r.userRole] || { label: r.userRole, color: '#999' };
        html += '<div class="admin-person-card pending" data-req-id="' + r.id + '" data-status="pending">';
        html += '  <div class="admin-person-avatar">👤</div>';
        html += '  <div class="admin-person-body">';
        html += '    <div class="admin-person-name">' + r.userName + '</div>';
        html += '    <div class="admin-person-meta">';
        html += '      <span class="admin-role-tag" style="background:' + roleInfo.color + ';">' + roleInfo.label + '</span>';
        if (r.relation) html += '      <span>' + (getRelationLabel(r.relation)) + '</span>';
        html += '      <span>申请：' + r.createdAt + '</span>';
        html += '    </div>';
        html += '  </div>';
        html += '  <button class="admin-person-approve" data-req-id="' + r.id + '">审批</button>';
        html += '</div>';
      });
    }

    // 已撤销卡片
    if (filter === 'all' || filter === 'revoked') {
      revokedGrants.forEach(function (g) {
        var gu = DataStore.findUserById(g.userId);
        var name = gu ? gu.name : '未知用户';
        var roleInfo = ROLES[g.role] || { label: g.role, color: '#999' };
        html += '<div class="admin-person-card revoked" data-grant-id="' + g.id + '" data-status="revoked">';
        html += '  <div class="admin-person-avatar" style="opacity:0.5;">' + (gu ? gu.avatar : '👤') + '</div>';
        html += '  <div class="admin-person-body">';
        html += '    <div class="admin-person-name" style="color:#999;">' + name + ' <span class="admin-person-expiring" style="background:#f0f0f0;color:#999;">已撤销</span></div>';
        html += '    <div class="admin-person-meta">';
        html += '      <span class="admin-role-tag" style="background:#ccc;">' + roleInfo.label + '</span>';
        html += '      <span>撤销：' + (g.revokedAt || '-') + '</span>';
        html += '    </div>';
        html += '  </div>';
        html += '  <button class="admin-person-restore" data-grant-id="' + g.id + '" data-grant-user="' + name + '">恢复</button>';
        html += '</div>';
      });
    }

    if (html === '') {
      html += '<div style="text-align:center;padding:32px;color:#bbb;">暂无匹配的授权记录</div>';
    }

    return html;
  }

  /* ==========================================================
   * 构建操作日志条目
   * ========================================================== */
  function buildLogItem(log) {
    var actionLabels = {
      'role_change': '角色变更',
      'revoke': '撤销授权',
      'grant_restore': '恢复授权',
      'role_restore': '恢复角色',
      'invite': '邀请成员',
      'approve': '审批通过',
      'reject': '审批拒绝',
      'backup': '数据备份',
      'import': '数据导入'
    };
    var actionLabel = actionLabels[log.action] || log.action;
    var revertedClass = log.reverted ? ' admin-log-reverted' : '';
    var revertedMark = log.reverted ? ' <span style="font-size:0.7rem;color:#F5222D;">(已撤销)</span>' : '';

    return '<div class="admin-log-item' + revertedClass + '">' +
      '<div class="admin-log-icon">' + getLogIcon(log.action) + '</div>' +
      '<div class="admin-log-body">' +
      '  <div class="admin-log-text"><strong>' + log.actorName + '</strong> ' + log.detail + revertedMark + '</div>' +
      '  <div class="admin-log-time">' + (log.createdAt || '') + '</div>' +
      '</div>' +
      (!log.reverted && log.undoData ? '<button class="admin-log-undo" data-log-id="' + log.id + '" title="撤销此操作">↩</button>' : '') +
      '</div>';
  }

  function getLogIcon(action) {
    var map = {
      'role_change': '🔄',
      'revoke': '🚫',
      'grant_restore': '↩️',
      'role_restore': '↩️',
      'invite': '📨',
      'approve': '✅',
      'reject': '❌',
      'backup': '💾',
      'import': '📥'
    };
    return map[action] || '📝';
  }

  function getRelationLabel(relValue) {
    var rel = C.FAMILY_RELATIONS.find(function (r) { return r.value === relValue; });
    return rel ? rel.label : relValue;
  }

  /* ==========================================================
   * 家长事件绑定
   * ========================================================== */
  function bindParentEvents(user, youthId) {
    var ct = document.getElementById('profile-content');
    if (!ct) return;

    // 状态筛选标签切换
    ct.addEventListener('click', function (e) {
      var tab = e.target.closest('.admin-filter-tab');
      if (tab) {
        // 高亮当前标签
        ct.querySelectorAll('.admin-filter-tab').forEach(function (t) { t.classList.remove('active'); });
        tab.classList.add('active');

        var filter = tab.getAttribute('data-filter');
        var allGrants = DataStore.getGrants().filter(function (g) { return g.youthId === youthId; });
        var activeGrants = allGrants.filter(function (g) { return g.status === 'active'; });
        var revokedGrants = allGrants.filter(function (g) { return g.status === 'revoked'; });
        var pendingRequests = DataStore.getPendingRequestsByYouth(youthId);
        var expiringGrants = DataStore.getExpiringGrants(youthId);

        var listEl = document.getElementById('admin-grant-list');
        if (listEl) {
          listEl.innerHTML = buildGrantCards(activeGrants, pendingRequests, expiringGrants, revokedGrants, filter, user, youthId);
        }
        return;
      }

      // 邀请按钮
      if (e.target.closest('#admin-btn-invite')) {
        showInviteModal(youthId, user);
        return;
      }

      // 备份按钮
      if (e.target.closest('#admin-btn-backup')) {
        handleBackup();
        return;
      }

      // 导入按钮
      if (e.target.closest('#admin-btn-import')) {
        handleImport();
        return;
      }

      // 设置按钮
      if (e.target.closest('#admin-btn-settings')) {
        showSettingsModal(user);
        return;
      }

      // 人员卡片更多操作（撤权/角色调整）
      var moreBtn = e.target.closest('.admin-person-more');
      if (moreBtn) {
        var grantId = moreBtn.getAttribute('data-grant-id');
        var grantRole = moreBtn.getAttribute('data-grant-role');
        var grantUser = moreBtn.getAttribute('data-grant-user');
        showPersonActionsModal(grantId, grantRole, grantUser, user, youthId);
        return;
      }

      // 审批按钮
      var approveBtn = e.target.closest('.admin-person-approve');
      if (approveBtn) {
        var reqId = approveBtn.getAttribute('data-req-id');
        showApproveModal(reqId, youthId, user);
        return;
      }

      // 恢复授权按钮
      var restoreBtn = e.target.closest('.admin-person-restore');
      if (restoreBtn) {
        var gId = restoreBtn.getAttribute('data-grant-id');
        var gUser = restoreBtn.getAttribute('data-grant-user');
        if (confirm('确定恢复「' + gUser + '」的授权吗？')) {
          DataStore.restoreGrant(gId);
          DataStore.addAuditEntry({
            action: 'grant_restore',
            actorId: user.id, actorName: user.name,
            targetId: gId, targetName: gUser,
            detail: '恢复了「' + gUser + '」的授权'
          });
          showToast('已恢复授权');
          render();
        }
        return;
      }

      // 日志撤销按钮
      var undoBtn = e.target.closest('.admin-log-undo');
      if (undoBtn) {
        var logId = undoBtn.getAttribute('data-log-id');
        handleUndo(logId, user);
        return;
      }
    });
  }

  /* ==========================================================
   * 管理员事件绑定
   * ========================================================== */
  function bindAdminEvents(user) {
    var ct = document.getElementById('profile-content');
    if (!ct) return;

    ct.addEventListener('click', function (e) {
      if (e.target.closest('#admin-btn-backup')) {
        handleBackup();
      } else if (e.target.closest('#admin-btn-import')) {
        handleImport();
      } else if (e.target.closest('#admin-btn-settings')) {
        showSettingsModal(user);
      } else if (e.target.closest('#admin-btn-reset')) {
        if (confirm('⚠️ 高风险操作：确定要重置所有数据吗？\n\n这将清除所有用户、记录、授权关系。\n此操作不可恢复，建议先导出备份。')) {
          if (confirm('再次确认：真的要重置所有数据吗？')) {
            localStorage.clear();
            showToast('数据已重置，请刷新页面');
            setTimeout(function () { location.reload(); }, 1500);
          }
        }
      }
    });
  }

  /* ==========================================================
   * 弹窗：邀请成员
   * ========================================================== */
  function showInviteModal(youthId, user) {
    var overlay = createOverlay('邀请成员加入支持网络');

    var roleOpts = C.INVITABLE_ROLES.map(function (r) {
      return '<option value="' + r.value + '">' + r.label + '</option>';
    }).join('');
    var relOpts = C.FAMILY_RELATIONS.map(function (r) {
      return '<option value="' + r.value + '">' + r.label + '</option>';
    }).join('');

    overlay.querySelector('.modal-body').innerHTML =
      '<p style="color:#888;margin-bottom:16px;font-size:0.85rem;">生成邀请码，分享给需要加入的老师或影子老师</p>' +
      '<div style="margin-bottom:12px;"><label class="form-label">选择角色</label>' +
      '<select id="invite-role" style="width:100%;padding:10px 14px;border:1.5px solid #ddd;border-radius:8px;font-size:0.9rem;">' + roleOpts + '</select></div>' +
      '<div style="margin-bottom:16px;"><label class="form-label">选择关系</label>' +
      '<select id="invite-relation" style="width:100%;padding:10px 14px;border:1.5px solid #ddd;border-radius:8px;font-size:0.9rem;">' + relOpts + '</select></div>' +
      '<button class="btn btn-primary" id="btn-do-invite" style="width:100%;padding:12px;border-radius:10px;">生成邀请码</button>' +
      '<div id="invite-result-area" style="margin-top:16px;display:none;"></div>';

    document.getElementById('btn-do-invite').addEventListener('click', function () {
      var role = document.getElementById('invite-role').value;
      var relation = document.getElementById('invite-relation').value;
      var invitation = DataStore.createInvitation({ youthId: youthId, createdBy: user.id, role: role, relation: relation });
      var roleLabel = ROLES[role] ? ROLES[role].label : role;
      var relLabel = getRelationLabel(relation);

      DataStore.addAuditEntry({
        action: 'invite',
        actorId: user.id, actorName: user.name,
        targetId: youthId, targetName: '邀请码',
        detail: '生成了「' + roleLabel + '」邀请码（关系：' + relLabel + '）'
      });

      var resultArea = document.getElementById('invite-result-area');
      resultArea.style.display = 'block';
      resultArea.innerHTML =
        '<div style="background:#f0f7ff;border-radius:12px;padding:20px;text-align:center;">' +
        '  <div style="font-size:0.85rem;color:#888;margin-bottom:8px;">邀请码已生成</div>' +
        '  <div style="font-size:2rem;font-weight:700;color:#4A90D9;letter-spacing:4px;margin-bottom:8px;user-select:all;">' + invitation.code + '</div>' +
        '  <div style="font-size:0.78rem;color:#aaa;">有效期至 ' + invitation.expiresAt + '</div>' +
        '  <button id="btn-copy-invite" style="margin-top:12px;padding:8px 20px;background:#4A90D9;color:#fff;border:none;border-radius:8px;cursor:pointer;">📋 复制邀请码</button>' +
        '</div>';
      document.getElementById('btn-copy-invite').addEventListener('click', function () {
        navigator.clipboard.writeText(invitation.code).then(function () {
          showToast('邀请码已复制');
        }).catch(function () {
          showToast('复制失败，请手动复制');
        });
      });
    });
  }

  /* ==========================================================
   * 弹窗：人员操作（撤权/角色调整）
   * ========================================================== */
  function showPersonActionsModal(grantId, grantRole, grantUser, currentUser, youthId) {
    var overlay = createOverlay(grantUser + ' · 操作');

    var roleOpts = Object.keys(ROLES).filter(function (r) {
      return r !== 'youth' && r !== 'government' && r !== 'admin';
    }).map(function (r) {
      var info = ROLES[r];
      var sel = r === grantRole ? ' selected' : '';
      return '<option value="' + r + '"' + sel + '>' + info.label + '</option>';
    }).join('');

    overlay.querySelector('.modal-body').innerHTML =
      '<div style="margin-bottom:16px;">' +
      '  <label class="form-label">调整角色</label>' +
      '  <select id="action-new-role" style="width:100%;padding:10px 14px;border:1.5px solid #ddd;border-radius:8px;font-size:0.9rem;">' + roleOpts + '</select>' +
      '  <p style="font-size:0.75rem;color:#999;margin-top:6px;">角色调整后，该成员可查看和操作的范围将随之变化</p>' +
      '</div>' +
      '<button class="btn btn-primary" id="btn-do-role-change" style="width:100%;padding:12px;border-radius:10px;margin-bottom:8px;">确认调整角色</button>' +
      '<div style="border-top:1px solid #f0f0f0;margin:16px 0;padding-top:16px;">' +
      '  <p style="font-size:0.82rem;color:#999;margin-bottom:10px;">高风险操作区域</p>' +
      '  <button class="btn btn-danger" id="btn-do-revoke" style="width:100%;padding:12px;border-radius:10px;background:#fff;color:#F5222D;border:1px solid #F5222D;">撤销「' + grantUser + '」的授权</button>' +
      '  <p style="font-size:0.75rem;color:#999;margin-top:6px;">⚠️ 撤销后，该成员将无法查看任何档案信息。此操作可恢复。</p>' +
      '</div>';

    document.getElementById('btn-do-role-change').addEventListener('click', function () {
      var newRole = document.getElementById('action-new-role').value;
      if (newRole === grantRole) { showToast('角色未变更'); return; }
      var newLabel = ROLES[newRole] ? ROLES[newRole].label : newRole;
      if (!confirm('确定将「' + grantUser + '」的角色调整为「' + newLabel + '」吗？\n\n调整后该成员的权限范围将立即变化。')) return;
      DataStore.updateGrantRole(grantId, newRole, currentUser);
      showToast('角色已调整');
      overlay.remove(); document.body.style.overflow = '';
      render();
    });

    document.getElementById('btn-do-revoke').addEventListener('click', function () {
      if (!confirm('⚠️ 高风险操作：确定撤销「' + grantUser + '」的授权吗？\n\n撤销后该成员将立即失去所有访问权限。\n此操作可恢复，但需管理员手动操作。')) return;
      DataStore.revokeGrant(grantId, currentUser);
      showToast('已撤销授权');
      overlay.remove(); document.body.style.overflow = '';
      render();
    });
  }

  /* ==========================================================
   * 弹窗：审批
   * ========================================================== */
  function showApproveModal(reqId, youthId, user) {
    var requests = DataStore.getJoinRequests();
    var req = requests.find(function (r) { return r.id === reqId; });
    if (!req) { showToast('申请不存在'); return; }

    var roleLabel = ROLES[req.userRole] ? ROLES[req.userRole].label : req.userRole;
    var relLabel = getRelationLabel(req.relation);

    var overlay = createOverlay('审批加入申请');

    overlay.querySelector('.modal-body').innerHTML =
      '<div style="text-align:center;margin-bottom:20px;">' +
      '  <div style="font-size:3rem;">👤</div>' +
      '  <div style="font-weight:600;font-size:1.1rem;margin-top:8px;">' + req.userName + '</div>' +
      '  <div style="color:#888;margin-top:4px;">' + roleLabel + ' · ' + relLabel + '</div>' +
      '  <div style="color:#aaa;font-size:0.82rem;margin-top:4px;">申请时间：' + req.createdAt + '</div>' +
      '</div>' +
      '<p style="font-size:0.82rem;color:#888;margin-bottom:16px;">批准后，该成员将获得对应角色的档案访问权限。</p>' +
      '<div style="display:flex;gap:10px;">' +
      '  <button id="btn-do-reject" style="flex:1;padding:12px;border:1px solid #ddd;border-radius:10px;background:#fff;color:#F5222D;font-size:0.9rem;cursor:pointer;">拒绝</button>' +
      '  <button id="btn-do-approve" style="flex:1;padding:12px;border:none;border-radius:10px;background:#52C41A;color:#fff;font-size:0.9rem;cursor:pointer;">批准</button>' +
      '</div>';

    document.getElementById('btn-do-approve').addEventListener('click', function () {
      DataStore.addGrant({
        youthId: youthId, userId: req.userId, role: req.userRole, relation: req.relation, status: 'active'
      });
      DataStore.addFamilyMember(youthId, req.userId, req.relation);
      DataStore.markInvitationUsed(req.invitationCode);
      DataStore.updateJoinRequestStatus(reqId, 'approved');
      DataStore.addAuditEntry({
        action: 'approve', actorId: user.id, actorName: user.name,
        targetId: req.userId, targetName: req.userName,
        detail: '批准了「' + req.userName + '」的加入申请',
        undoData: { type: 'approve_undo', reqId: reqId, grantInfo: { youthId: youthId, userId: req.userId } }
      });
      showToast('已批准「' + req.userName + '」');
      overlay.remove(); document.body.style.overflow = '';
      render();
    });

    document.getElementById('btn-do-reject').addEventListener('click', function () {
      if (!confirm('确定拒绝「' + req.userName + '」的申请吗？')) return;
      DataStore.updateJoinRequestStatus(reqId, 'rejected');
      DataStore.addAuditEntry({
        action: 'reject', actorId: user.id, actorName: user.name,
        targetId: req.userId, targetName: req.userName,
        detail: '拒绝了「' + req.userName + '」的加入申请'
      });
      showToast('已拒绝申请');
      overlay.remove(); document.body.style.overflow = '';
      render();
    });
  }

  /* ==========================================================
   * 弹窗：系统设置
   * ========================================================== */
  function showSettingsModal(user) {
    var overlay = createOverlay('系统设置');
    overlay.querySelector('.modal-body').innerHTML =
      '<p style="color:#888;margin-bottom:20px;font-size:0.88rem;">系统管理权与查看心青年业务内容的权限是分开的。管理员只能管理系统配置，不能查看档案内容。</p>' +
      '<div style="background:#f9fafb;border-radius:12px;padding:16px;margin-bottom:16px;">' +
      '  <div style="font-weight:600;margin-bottom:8px;">📋 当前信息</div>' +
      '  <div style="font-size:0.85rem;color:#666;line-height:1.6;">' +
      '    <div>用户总数：' + DataStore.getAllUsers().length + ' 人</div>' +
      '    <div>记录总数：' + DataStore.getRecords().length + ' 条</div>' +
      '    <div>授权总数：' + DataStore.getGrants().filter(function (g) { return g.status === 'active'; }).length + ' 条</div>' +
      '    <div>操作日志：' + DataStore.getAuditLog().length + ' 条</div>' +
      '  </div>' +
      '</div>' +
      '<div style="font-size:0.78rem;color:#aaa;text-align:center;">AI懂我 · 心智障碍者动态支持档案</div>';

    document.getElementById('btn-modal-close').addEventListener('click', function () {
      overlay.remove(); document.body.style.overflow = '';
    });
  }

  /* ==========================================================
   * 工具：备份
   * ========================================================== */
  function handleBackup() {
    var backup = DataStore.exportBackup();
    var json = JSON.stringify(backup, null, 2);
    var blob = new Blob([json], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'ai-dongwo-backup-' + window.getTodayString() + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('备份已导出');
  }

  /* ==========================================================
   * 工具：导入恢复
   * ========================================================== */
  function handleImport() {
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.addEventListener('change', function () {
      var file = input.files[0];
      if (!file) return;
      if (!confirm('⚠️ 导入备份将覆盖当前所有数据。\n\n建议先导出当前备份。确定继续吗？')) return;
      var reader = new FileReader();
      reader.onload = function (e) {
        try {
          var backup = JSON.parse(e.target.result);
          if (DataStore.importBackup(backup)) {
            showToast('数据已恢复，请刷新页面');
            setTimeout(function () { location.reload(); }, 1500);
          } else {
            showToast('导入失败：数据格式不正确');
          }
        } catch (err) {
          showToast('导入失败：无法解析文件');
        }
      };
      reader.readAsText(file);
    });
    input.click();
  }

  /* ==========================================================
   * 工具：撤销操作
   * ========================================================== */
  function handleUndo(logId, user) {
    var undoData = DataStore.revertAuditEntry(logId);
    if (!undoData) { showToast('无法撤销此操作'); return; }

    if (undoData.type === 'grant_restore') {
      if (!confirm('确定恢复「' + (undoData.grant.targetName || '该成员') + '」的授权吗？')) return;
      DataStore.restoreGrant(undoData.grantId);
      DataStore.addAuditEntry({
        action: 'grant_restore',
        actorId: user.id, actorName: user.name,
        targetId: undoData.grantId, targetName: undoData.grant.targetName || '',
        detail: '通过操作日志恢复了授权'
      });
      showToast('授权已恢复');
      render();
    } else if (undoData.type === 'role_restore') {
      if (!confirm('确定恢复角色的变更吗？')) return;
      DataStore.undoRoleChange(undoData);
      DataStore.addAuditEntry({
        action: 'role_restore',
        actorId: user.id, actorName: user.name,
        targetId: undoData.grantId, targetName: '',
        detail: '通过操作日志恢复了角色变更'
      });
      showToast('角色已恢复');
      render();
    } else {
      showToast('暂不支持撤销此类型的操作');
    }
  }

  /* ==========================================================
   * 工具：创建半屏弹窗
   * ========================================================== */
  function createOverlay(title) {
    var overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.style.display = 'flex';
    overlay.innerHTML =
      '<div class="modal-content" style="max-width:400px;margin:auto;">' +
      '  <div class="modal-header">' +
      '    <span class="modal-title">' + title + '</span>' +
      '    <button class="modal-close" id="btn-modal-close">&times;</button>' +
      '  </div>' +
      '  <div class="modal-body"></div>' +
      '</div>';
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';

    // 关闭事件
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) { overlay.remove(); document.body.style.overflow = ''; }
    });
    var closeBtn = overlay.querySelector('#btn-modal-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', function () { overlay.remove(); document.body.style.overflow = ''; });
    }

    return overlay;
  }

  /* ==========================================================
   * 导出
   * ========================================================== */
  window.AdminPage = {
    render: render
  };

})();
