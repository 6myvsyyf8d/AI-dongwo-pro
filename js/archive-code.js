/**
 * archive-code.js — 档案码页
 * 家长生成 youthId+token 的档案码，扫码分流
 * 挂载：window.ArchiveCodePage
 */
(function () {
  'use strict';

  var DataStore = window.DataStore;
  var C = window.Constants;
  var showToast = window.showToast;

  /**
   * 简单的 hash token 生成（模拟 HMAC）
   */
  function generateToken(youthId) {
    var seed = youthId + '_dongwo_' + new Date().getTime();
    var hash = 0;
    for (var i = 0; i < seed.length; i++) {
      var char = seed.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36).substring(0, 8);
  }

  function renderArchiveCode() {
    var contentArea = document.getElementById('archive-code-content');
    if (!contentArea) return;

    var user = DataStore.getCurrentUser() || window.AppState.currentUser;
    if (!user) { window.location.hash = 'login'; return; }

    // 只有家长可以生成档案码
    if (user.role !== 'parent') {
      contentArea.innerHTML = '<div style="padding:48px 24px;text-align:center;color:#999;">只有家长可以生成档案码</div>';
      return;
    }

    var youthId = DataStore.getPrimaryYouth(user.id);
    if (!youthId) {
      contentArea.innerHTML =
        '<div style="padding:48px 24px;text-align:center;color:#999;">还没有创建心青年档案</div>';
      return;
    }

    var youthUser = DataStore.findUserById(youthId);
    var youthName = youthUser ? youthUser.name : '心青年';
    var token = generateToken(youthId);

    // 构建档案码 URL（模拟二维码内容）
    var origin = window.location.origin;
    var pathname = window.location.pathname;
    var archiveUrl = origin + pathname + '#archive?yid=' + youthId + '&token=' + token;

    var html = '';
    html += '<div style="padding:24px;text-align:center;">';
    html += '<h2 style="font-size:1.1rem;color:#333;margin-bottom:8px;">📱 档案码</h2>';
    html += '<p style="color:#888;font-size:0.85rem;margin-bottom:24px;">扫描此二维码可快速访问「' + youthName + '」的档案</p>';

    // 二维码区域（使用 canvas 绘制简易二维码）
    html += '<div style="display:flex;justify-content:center;margin-bottom:24px;">';
    html += '<div id="qrcode-wrapper" style="padding:20px;background:#fff;border-radius:16px;box-shadow:0 2px 12px rgba(0,0,0,0.08);display:inline-block;">';
    html += '<canvas id="qrcode-canvas" width="200" height="200"></canvas>';
    html += '</div>';
    html += '</div>';

    // 档案码信息
    html += '<div style="background:#f9fafb;border-radius:12px;padding:16px;margin-bottom:16px;text-align:left;">';
    html += '<div style="font-size:0.85rem;color:#888;margin-bottom:6px;">档案码内容（可复制分享）：</div>';
    html += '<input id="archive-url" type="text" readonly value="' + archiveUrl + '" ' +
            'style="width:100%;padding:10px;border:1px solid #eee;border-radius:8px;font-size:0.78rem;color:#666;background:#fff;">';
    html += '<button id="btn-copy-url" style="margin-top:8px;padding:6px 16px;background:#4A90D9;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:0.85rem;">📋 复制链接</button>';
    html += '</div>';

    // 扫码分流说明
    html += '<div style="background:linear-gradient(135deg,#fff7e6,#fffbe6);border-radius:12px;padding:16px;text-align:left;">';
    html += '<div style="font-weight:600;color:#333;font-size:0.9rem;margin-bottom:8px;">🔍 扫码后按角色分流：</div>';
    html += '<div style="font-size:0.82rem;color:#666;line-height:1.8;">';
    var roleColors = { youth: '#4A90D9', parent: '#52C41A', teacher: '#FAAD14', caregiver: '#722ED1', government: '#EB2F96', admin: '#13C2C2' };
    Object.keys(C.ROLES).forEach(function (roleKey) {
      var r = C.ROLES[roleKey];
      var color = roleColors[roleKey] || '#999';
      html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">';
      html += '<span style="font-size:1rem;">' + r.avatar + '</span>';
      html += '<span style="color:' + color + ';font-weight:500;">' + r.label + '</span>';
      html += '<span style="color:#999;">→</span>';
      html += '<span style="color:#666;">' + (r.description || '查看档案') + '</span>';
      html += '</div>';
    });
    html += '</div>';
    html += '</div>';

    // 分享预览按钮
    html += '<div style="margin-top:16px;text-align:center;">';
    html += '<button id="btn-preview-share" style="padding:10px 24px;background:#fff;color:#4A90D9;border:1.5px solid #4A90D9;border-radius:10px;font-size:0.9rem;cursor:pointer;">👁️ 预览扫码效果</button>';
    html += '</div>';

    html += '</div>';

    contentArea.innerHTML = html;

    // 绘制简易二维码
    setTimeout(function () {
      drawQRCode(archiveUrl);
    }, 100);

    // 绑定复制按钮
    var btnCopy = document.getElementById('btn-copy-url');
    if (btnCopy) {
      btnCopy.addEventListener('click', function () {
        var urlInput = document.getElementById('archive-url');
        urlInput.select();
        navigator.clipboard.writeText(urlInput.value).then(function () {
          showToast('链接已复制到剪贴板');
        }).catch(function () {
          showToast('复制失败，请手动复制');
        });
      });
    }

    // 绑定预览按钮
    var btnPreview = document.getElementById('btn-preview-share');
    if (btnPreview) {
      btnPreview.addEventListener('click', function () {
        showSharePreview(youthId, youthName, user);
      });
    }
  }

  /**
   * 分享预览弹窗 — 让家长预览不同角色扫码后看到的界面
   */
  function showSharePreview(youthId, youthName, currentUser) {
    var overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.style.display = 'flex';

    // 角色列表（排除 temp_supporter）
    var previewRoles = ['parent', 'teacher', 'caregiver', 'government'];
    var roleTabs = previewRoles.map(function (r, i) {
      var info = C.ROLES[r] || {};
      return '<button class="a-subtab' + (i === 0 ? ' active' : '') + '" data-role="' + r + '">' + (info.avatar || '') + ' ' + info.label + '</button>';
    }).join('');

    overlay.innerHTML =
      '<div class="modal-content" style="max-width:400px;margin:auto;max-height:90vh;overflow-y:auto;">' +
      '  <div class="modal-header">' +
      '    <span class="modal-title">👁️ 扫码预览 · ' + youthName + '</span>' +
      '    <button class="modal-close" id="preview-modal-close">&times;</button>' +
      '  </div>' +
      '  <div class="modal-body" style="padding:16px;">' +
      '    <div class="a-subtabs" id="preview-role-tabs">' + roleTabs + '</div>' +
      '    <div id="preview-content-area"></div>' +
      '  </div></div>';
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';

    var close = function () { overlay.remove(); document.body.style.overflow = ''; };
    overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
    overlay.querySelector('#preview-modal-close').addEventListener('click', close);

    function renderRolePreview(role) {
      var area = document.getElementById('preview-content-area');
      if (!area) return;
      var info = C.ROLES[role] || {};
      var html = '';

      html += '<div style="text-align:center;margin-bottom:16px;">';
      html += '<div style="font-size:2.5rem;">' + (info.avatar || '👤') + '</div>';
      html += '<div style="font-weight:600;font-size:1rem;margin-top:4px;">' + info.label + '视角</div>';
      html += '<div style="font-size:0.8rem;color:#888;margin-top:2px;">' + (info.description || '') + '</div>';
      html += '</div>';

      // 可见页面列表
      var tabs = C.ROLE_NAV_TABS[role] || [];
      var tabLabels = { chat: 'AI聊聊', home: '任务', archive: '档案', charts: '分析', profile: '管理', 'youth-chat': 'AI聊聊' };

      html += '<div style="background:#f9fafb;border-radius:10px;padding:14px;margin-bottom:12px;">';
      html += '<div style="font-weight:600;font-size:0.85rem;margin-bottom:8px;">📱 可见功能模块</div>';
      html += '<div style="display:flex;flex-wrap:wrap;gap:6px;">';
      tabs.forEach(function (t) {
        html += '<span style="padding:4px 10px;background:#fff;border-radius:8px;font-size:0.8rem;border:1px solid #eee;">' + (tabLabels[t] || t) + '</span>';
      });
      html += '</div></div>';

      // 可查看的档案主题
      var topics = [];
      if (role === 'parent') topics = ['全部主题', '沟通说明书', '情绪支持', '照护医疗', '工作支持', '关系地图', '我喜欢的生活'];
      else if (role === 'teacher') topics = ['沟通说明书', '情绪支持', '工作支持'];
      else if (role === 'caregiver') topics = ['照护医疗', '情绪支持', '我喜欢的生活'];
      else if (role === 'government') topics = ['匿名统计数据', '宏观趋势（不含个人信息）'];

      html += '<div style="background:#f9fafb;border-radius:10px;padding:14px;margin-bottom:12px;">';
      html += '<div style="font-weight:600;font-size:0.85rem;margin-bottom:8px;">👤 可查看的档案内容</div>';
      html += '<div style="display:flex;flex-wrap:wrap;gap:6px;">';
      topics.forEach(function (t) {
        html += '<span style="padding:4px 10px;background:#fff;border-radius:8px;font-size:0.8rem;border:1px solid #eee;">' + t + '</span>';
      });
      html += '</div></div>';

      // 权限提示
      if (role === 'government') {
        html += '<div style="background:#fff7e6;border-radius:10px;padding:12px;font-size:0.8rem;color:#ad6800;">🔒 政府角色仅查看匿名统计数据，不包含个人身份信息和具体档案内容。</div>';
      } else if (role === 'caregiver') {
        html += '<div style="background:#f9f0ff;border-radius:10px;padding:12px;font-size:0.8rem;color:#722ED1;">💡 影子老师侧重日常照护和情绪支持，可记录观察但不能管理授权。</div>';
      } else if (role === 'teacher') {
        html += '<div style="background:#fff7e6;border-radius:10px;padding:12px;font-size:0.8rem;color:#ad6800;">💡 老师侧重沟通、情绪和工作支持，可记录课堂观察但不能管理授权。</div>';
      } else if (role === 'parent') {
        html += '<div style="background:#f6ffed;border-radius:10px;padding:12px;font-size:0.8rem;color:#389e0d;">✅ 家长拥有完整管理权限：查看全部档案、管理授权、审批成员、生成档案码。</div>';
      }

      area.innerHTML = html;
    }

    // 初始渲染
    renderRolePreview('parent');

    // Tab 切换
    overlay.querySelector('#preview-role-tabs').addEventListener('click', function (e) {
      var tab = e.target.closest('.a-subtab');
      if (!tab) return;
      overlay.querySelectorAll('#preview-role-tabs .a-subtab').forEach(function (t) { t.classList.remove('active'); });
      tab.classList.add('active');
      renderRolePreview(tab.dataset.role);
    });
  }

  /**
   * 在 canvas 上绘制简易二维码
   * 使用 25x25 模块的 QR-like 图案
   */
  function drawQRCode(text) {
    var canvas = document.getElementById('qrcode-canvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var size = 200;
    var modules = 21; // QR version 1
    var moduleSize = size / (modules + 8); // 留白边

    // 白色背景
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);

    // 生成伪随机QR矩阵
    var matrix = generateQRMatrix(text, modules);

    // 添加三个定位图案
    addFinderPattern(matrix, 0, 0);
    addFinderPattern(matrix, modules - 7, 0);
    addFinderPattern(matrix, 0, modules - 7);
    // 添加对齐图案（简化版）
    addAlignmentPattern(matrix, modules - 7, modules - 7);

    // 绘制
    ctx.fillStyle = '#1a1a1a';
    for (var r = 0; r < modules; r++) {
      for (var c = 0; c < modules; c++) {
        if (matrix[r][c]) {
          ctx.fillRect(
            (c + 4) * moduleSize,
            (r + 4) * moduleSize,
            moduleSize,
            moduleSize
          );
        }
      }
    }
  }

  function generateQRMatrix(seed, size) {
    var matrix = [];
    var hash = 0;
    for (var i = 0; i < seed.length; i++) {
      hash = ((hash << 5) - hash) + seed.charCodeAt(i);
      hash = hash & hash;
    }
    // 简单的确定性伪随机
    var rand = Math.abs(hash);
    for (var r = 0; r < size; r++) {
      matrix[r] = [];
      for (var c = 0; c < size; c++) {
        rand = (rand * 1103515245 + 12345) & 0x7fffffff;
        matrix[r][c] = (rand % 3 === 0);
      }
    }
    return matrix;
  }

  function addFinderPattern(matrix, row, col) {
    for (var r = 0; r < 7; r++) {
      for (var c = 0; c < 7; c++) {
        var border = (r === 0 || r === 6 || c === 0 || c === 6);
        var inner = (r >= 2 && r <= 4 && c >= 2 && c <= 4);
        matrix[row + r][col + c] = border || inner;
      }
    }
    // 分隔符
    if (row + 7 < matrix.length && col + 7 < matrix[0].length) {
      for (var i = 0; i < 8; i++) {
        if (row + 7 < matrix.length) matrix[row + 7][col + i] = false;
        if (col + 7 < matrix[0].length) matrix[row + i][col + 7] = false;
      }
    }
  }

  function addAlignmentPattern(matrix, row, col) {
    for (var r = 0; r < 5; r++) {
      for (var c = 0; c < 5; c++) {
        var border = (r === 0 || r === 4 || c === 0 || c === 4);
        var center = (r === 2 && c === 2);
        if (row - 2 + r >= 0 && col - 2 + c >= 0 && row - 2 + r < matrix.length && col - 2 + c < matrix[0].length) {
          matrix[row - 2 + r][col - 2 + c] = border || center;
        }
      }
    }
  }

  // 导出
  window.ArchiveCodePage = {
    renderArchiveCode: renderArchiveCode
  };

})();
