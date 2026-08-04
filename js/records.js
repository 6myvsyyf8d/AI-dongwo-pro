/**
 * records.js — 添加记录弹窗模块
 * 挂载：window.RecordsPage, window.openAddRecordModal, window.closeAddRecordModal
 * 依赖：window.Utils, window.Constants, window.AppState, window.DataStore
 */
(function () {
  'use strict';

  var ROLES = window.Constants.ROLES;
  var RECORD_TYPES = window.Constants.RECORD_TYPES;
  var RECORD_MATRIX = window.Constants.RECORD_MATRIX;
  var MOOD_OPTIONS = window.Constants.MOOD_OPTIONS;
  var EMOTION_OPTIONS = window.Constants.EMOTION_OPTIONS;
  var TYPE_TO_MODULE = window.Constants.TYPE_TO_MODULE;
  var MODULE_TAGS = window.Constants.MODULE_TAGS;
  var privacyLevels = window.Constants.privacyLevels;
  var Modules = window.Modules;
  var DataStore = window.DataStore;
  var appState = window.AppState.appState;
  var currentPage = window.AppState.currentPage;
  var addRecordState = window.AppState.addRecordState;
  var recordsPageState = window.AppState.recordsPageState;

  // 初始化 prefillContent（如果不存在）
  if (addRecordState && addRecordState.prefillContent === undefined) {
    addRecordState.prefillContent = null;
  }

  /**
   * 打开添加记录弹窗
   */
  function openAddRecordModal() {
    var user = DataStore.getCurrentUser() || appState.currentUser;
    if (!user) {
      alert('请先选择角色登录');
      window.location.hash = 'login';
      return;
    }

    var role = ROLES[user.role];
    if (!role || !role.canAdd || role.canAdd.length === 0) {
      alert('当前角色暂无添加记录的权限');
      return;
    }

    var overlay = document.getElementById('add-record-modal');
    if (!overlay) {
      overlay = createAddRecordModal();
    }
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';

    // 重置状态并渲染第一步
    addRecordState.selectedType = null;
    renderAddRecordStep1(user, role);
  }

  /**
   * 关闭添加记录弹窗
   */
  function closeAddRecordModal() {
    var overlay = document.getElementById('add-record-modal');
    if (overlay) {
      overlay.classList.remove('active');
    }
    document.body.style.overflow = '';
    addRecordState.selectedType = null;
  }

  /**
   * 创建添加记录弹窗DOM结构
   */
  function createAddRecordModal() {
    var overlay = document.createElement('div');
    overlay.id = 'add-record-modal';
    overlay.className = 'modal-overlay';
    // 不设置内联 display，让 CSS class 控制显示/隐藏

    overlay.innerHTML =
      '<div class="modal-content" style="background:#fff;border-radius:16px;max-width:560px;width:90%;max-height:90vh;overflow:hidden;display:flex;flex-direction:column;">' +
      '  <div class="modal-header" style="padding:16px 20px;border-bottom:1px solid #eee;display:flex;align-items:center;justify-content:space-between;">' +
      '    <span class="modal-title" style="font-size:1.1rem;font-weight:600;color:#333;">添加记录</span>' +
      '    <button class="modal-close" id="add-record-close-btn" style="background:none;border:none;font-size:1.5rem;color:#999;cursor:pointer;">&times;</button>' +
      '  </div>' +
      '  <div id="add-record-body" class="modal-body" style="padding:20px;overflow-y:auto;flex:1;"></div>' +
      '  <div class="modal-footer" style="padding:12px 20px;border-top:1px solid #eee;display:flex;justify-content:flex-end;gap:8px;">' +
      '    <button class="btn btn-ghost" id="btn-cancel-record" style="padding:8px 16px;border:1px solid #ddd;background:#fff;color:#666;border-radius:8px;cursor:pointer;">取消</button>' +
      '  </div>' +
      '</div>';

    document.body.appendChild(overlay);

    // 绑定关闭按钮
    document.getElementById('add-record-close-btn').addEventListener('click', closeAddRecordModal);
    document.getElementById('btn-cancel-record').addEventListener('click', closeAddRecordModal);

    // 点击遮罩层关闭
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeAddRecordModal();
    });

    return overlay;
  }

  /**
   * 渲染添加记录第一步 - 选择记录类型
   */
  function renderAddRecordStep1(user, role) {
    var bodyEl = document.getElementById('add-record-body');
    if (!bodyEl) return;

    var html = '';
    // 显示当前角色信息
    html += '<div style="background:#f5f7fa;border-radius:10px;padding:12px 16px;margin-bottom:16px;display:flex;align-items:center;gap:10px;">';
    html += '  <span style="font-size:1.5rem;">' + user.avatar + '</span>';
    html += '  <div>';
    html += '    <div style="font-size:0.9rem;color:#333;">我是谁：<strong>' + user.name + '</strong>（' + role.label + '）</div>';
    html += '    <div style="font-size:0.8rem;color:#888;">请选择要添加的记录类型</div>';
    html += '  </div>';
    html += '</div>';

    html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:12px;">';
    role.canAdd.forEach(function (typeKey) {
      var type = RECORD_TYPES[typeKey];
      if (!type) return;
      html += '<div class="record-type-card" data-type="' + typeKey + '" style="background:#fff;border:2px solid #eee;border-radius:12px;padding:16px;text-align:center;cursor:pointer;transition:all 0.2s;">';
      html += '  <div style="font-size:2rem;margin-bottom:6px;">' + type.icon + '</div>';
      html += '  <div style="font-weight:600;color:#333;font-size:0.9rem;margin-bottom:2px;">' + type.label + '</div>';
      html += '  <div style="font-size:0.75rem;color:#888;">' + type.description + '</div>';
      html += '</div>';
    });
    html += '</div>';

    bodyEl.innerHTML = html;

    // 绑定类型选择事件
    bodyEl.querySelectorAll('.record-type-card').forEach(function (card) {
      card.addEventListener('click', function () {
        var type = this.getAttribute('data-type');
        addRecordState.selectedType = type;
        renderAddRecordStep2(user, role, type);
      });
      card.addEventListener('mouseenter', function () {
        var t = RECORD_TYPES[this.getAttribute('data-type')];
        this.style.borderColor = t.color;
        this.style.transform = 'translateY(-2px)';
      });
      card.addEventListener('mouseleave', function () {
        this.style.borderColor = '#eee';
        this.style.transform = 'translateY(0)';
      });
    });
  }

  /**
   * 渲染添加记录第二步 - 填写表单
   */
  function renderAddRecordStep2(user, role, typeKey) {
    var bodyEl = document.getElementById('add-record-body');
    if (!bodyEl) return;

    var type = RECORD_TYPES[typeKey];
    if (!type) return;

    var html = '';
    // 当前角色信息 + 返回按钮
    html += '<div style="background:#f5f7fa;border-radius:10px;padding:12px 16px;margin-bottom:16px;display:flex;align-items:center;gap:10px;">';
    html += '  <span style="font-size:1.5rem;">' + user.avatar + '</span>';
    html += '  <div style="flex:1;">';
    html += '    <div style="font-size:0.9rem;color:#333;">我是谁：<strong>' + user.name + '</strong>（' + role.label + '）</div>';
    html += '    <div style="font-size:0.8rem;color:#888;">正在添加：' + type.icon + ' ' + type.label + '</div>';
    html += '  </div>';
    html += '  <button id="btn-back-to-types" style="background:none;border:none;color:#4A90D9;cursor:pointer;font-size:0.85rem;">← 返回</button>';
    html += '</div>';

    html += '<form id="add-record-form">';

    // 根据字段配置渲染表单
    type.fields.forEach(function (field) {
      switch (field) {
        case 'title':
          html += '<div style="margin-bottom:14px;">';
          html += '  <label style="display:block;font-size:0.85rem;color:#555;margin-bottom:4px;font-weight:500;">标题</label>';
          html += '  <input type="text" name="title" placeholder="请输入标题" style="width:100%;padding:10px 12px;border:1px solid #ddd;border-radius:8px;font-size:0.9rem;box-sizing:border-box;" required>';
          html += '</div>';
          break;

        case 'content':
          html += '<div style="margin-bottom:14px;">';
          html += '  <label style="display:block;font-size:0.85rem;color:#555;margin-bottom:4px;font-weight:500;">内容</label>';
          html += '  <textarea name="content" placeholder="请详细描述..." rows="4" style="width:100%;padding:10px 12px;border:1px solid #ddd;border-radius:8px;font-size:0.9rem;box-sizing:border-box;resize:vertical;" required></textarea>';
          html += '</div>';
          break;

        case 'mood':
          html += '<div style="margin-bottom:14px;">';
          html += '  <label style="display:block;font-size:0.85rem;color:#555;margin-bottom:8px;font-weight:500;">今天的心情</label>';
          html += '  <div style="display:flex;gap:8px;flex-wrap:wrap;">';
          MOOD_OPTIONS.forEach(function (mood) {
            html += '    <label class="mood-option" style="cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:4px;padding:10px 14px;border:2px solid #eee;border-radius:10px;transition:all 0.2s;background:#fff;">';
            html += '      <input type="radio" name="mood" value="' + mood.value + '" style="display:none;">';
            html += '      <span style="font-size:1.5rem;">' + mood.emoji + '</span>';
            html += '      <span style="font-size:0.75rem;color:#555;">' + mood.label + '</span>';
            html += '    </label>';
          });
          html += '  </div>';
          html += '</div>';
          break;

        case 'emotion_type':
          html += '<div style="margin-bottom:14px;">';
          html += '  <label style="display:block;font-size:0.85rem;color:#555;margin-bottom:8px;font-weight:500;">情绪类型</label>';
          html += '  <div style="display:flex;gap:8px;flex-wrap:wrap;">';
          EMOTION_OPTIONS.forEach(function (emotion) {
            html += '    <label class="emotion-option" style="cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:4px;padding:10px 14px;border:2px solid #eee;border-radius:10px;transition:all 0.2s;background:#fff;">';
            html += '      <input type="radio" name="emotion_type" value="' + emotion.value + '" style="display:none;">';
            html += '      <span style="font-size:1.5rem;">' + emotion.emoji + '</span>';
            html += '      <span style="font-size:0.75rem;color:#555;">' + emotion.value + '</span>';
            html += '    </label>';
          });
          html += '  </div>';
          html += '</div>';

          // 情绪事件额外字段：触发原因和应对方式
          html += '<div style="margin-bottom:14px;">';
          html += '  <label style="display:block;font-size:0.85rem;color:#555;margin-bottom:4px;font-weight:500;">触发原因 / 具体情况</label>';
          html += '  <textarea name="content" placeholder="描述情绪事件的触发原因、经过和应对方式..." rows="4" style="width:100%;padding:10px 12px;border:1px solid #ddd;border-radius:8px;font-size:0.9rem;box-sizing:border-box;resize:vertical;" required></textarea>';
          html += '</div>';
          break;

        case 'effectiveness':
          html += '<div style="margin-bottom:14px;">';
          html += '  <label style="display:block;font-size:0.85rem;color:#555;margin-bottom:8px;font-weight:500;">策略效果评价</label>';
          html += '  <div class="effectiveness-bar">';
          var effLevels = C.EFFECTIVENESS_LEVELS || [
            { value: 'effective', label: '有效', icon: '✅', color: '#52C41A' },
            { value: 'partial', label: '部分有效', icon: '🔶', color: '#FAAD14' },
            { value: 'none', label: '无明显效果', icon: '⚪', color: '#999' },
            { value: 'worse', label: '可能加重压力', icon: '⚠️', color: '#F5222D' }
          ];
          effLevels.forEach(function (eff) {
            html += '    <label class="effectiveness-option eff-' + eff.value + '" style="cursor:pointer;">';
            html += '      <input type="radio" name="effectiveness" value="' + eff.value + '" style="display:none;">';
            html += '      <span>' + eff.icon + ' ' + eff.label + '</span>';
            html += '    </label>';
          });
          html += '  </div>';
          html += '  <div style="margin-top:8px;">';
          html += '    <label style="display:block;font-size:0.82rem;color:#555;margin-bottom:4px;font-weight:500;">适用场景（可多选）</label>';
          html += '    <div style="display:flex;gap:6px;flex-wrap:wrap;">';
          ['学校', '就业', '社区活动', '医疗', '家庭', '临时照护'].forEach(function(sc) {
            html += '      <label style="cursor:pointer;display:flex;align-items:center;gap:4px;font-size:0.78rem;padding:4px 10px;border:1px solid #ddd;border-radius:14px;background:#fff;">';
            html += '        <input type="checkbox" name="scenarios" value="' + sc + '" style="margin:0;">' + sc;
            html += '      </label>';
          });
          html += '    </div>';
          html += '  </div>';
          html += '  <div style="margin-top:8px;">';
          html += '    <label style="display:block;font-size:0.82rem;color:#555;margin-bottom:4px;font-weight:500;">补充说明</label>';
          html += '    <textarea name="effectiveness_note" placeholder="什么情况下有效？什么情况下无效？有没有需要特别注意的地方？" rows="2" style="width:100%;padding:10px 12px;border:1px solid #ddd;border-radius:8px;font-size:0.85rem;box-sizing:border-box;resize:vertical;"></textarea>';
          html += '  </div>';
          html += '</div>';
          break;
      }
    });

    html += '</form>';

    bodyEl.innerHTML = html;

    // 更新底部按钮
    var footer = document.querySelector('#add-record-modal .modal-footer');
    if (footer) {
      footer.innerHTML =
        '<button class="btn btn-ghost" id="btn-cancel-record" style="padding:8px 16px;border:1px solid #ddd;background:#fff;color:#666;border-radius:8px;cursor:pointer;">取消</button>' +
        '<button class="btn btn-primary" id="btn-save-record" style="padding:8px 20px;border:none;background:' + type.color + ';color:#fff;border-radius:8px;cursor:pointer;font-weight:500;">保存记录</button>';

      document.getElementById('btn-cancel-record').addEventListener('click', closeAddRecordModal);
      document.getElementById('btn-save-record').addEventListener('click', saveRecord);
    }

    // 绑定返回按钮
    var backBtn = document.getElementById('btn-back-to-types');
    if (backBtn) {
      backBtn.addEventListener('click', function () {
        renderAddRecordStep1(user, role);
        // 恢复底部按钮
        var ft = document.querySelector('#add-record-modal .modal-footer');
        if (ft) {
          ft.innerHTML = '<button class="btn btn-ghost" id="btn-cancel-record" style="padding:8px 16px;border:1px solid #ddd;background:#fff;color:#666;border-radius:8px;cursor:pointer;">取消</button>';
          document.getElementById('btn-cancel-record').addEventListener('click', closeAddRecordModal);
        }
      });
    }

    // 绑定心情/情绪/效果选项点击样式
    bodyEl.querySelectorAll('.mood-option, .emotion-option, .effectiveness-option').forEach(function (opt) {
      opt.addEventListener('click', function () {
        var name = this.querySelector('input').name;
        bodyEl.querySelectorAll('input[name="' + name + '"]').forEach(function (input) {
          input.parentElement.style.borderColor = '#eee';
          input.parentElement.style.background = '#fff';
        });
        this.style.borderColor = '#4A90D9';
        this.style.background = '#f0f7ff';
        this.querySelector('input').checked = true;
      });
    });

    // 预填内容（来自快捷标签点击）
    if (addRecordState.prefillContent) {
      var contentField = bodyEl.querySelector('textarea[name="content"]');
      if (contentField) {
        contentField.value = addRecordState.prefillContent;
        contentField.focus();
      }
      addRecordState.prefillContent = null;
    }
  }

  /**
   * 保存记录
   */
  function saveRecord() {
    var form = document.getElementById('add-record-form');
    if (!form) return;

    var user = DataStore.getCurrentUser() || appState.currentUser;
    var type = addRecordState.selectedType;
    if (!user || !type) return;

    var formData = new FormData(form);
    var record = {
      type: type,
      content: formData.get('content') || ''
    };

    // 自动映射档案模块
    var moduleKey = TYPE_TO_MODULE[type] || null;
    if (moduleKey) record.module = moduleKey;
    record.privacy = 'B';
    record.tags = [];

    if (formData.get('title')) record.title = formData.get('title');
    if (formData.get('mood')) record.mood = formData.get('mood');
    if (formData.get('emotion_type')) record.emotion_type = formData.get('emotion_type');
    if (formData.get('effectiveness')) record.effectiveness = formData.get('effectiveness');
    // 适用场景（多选）
    var scenarios = formData.getAll('scenarios');
    if (scenarios.length > 0) record.applicableScenarios = scenarios;
    // 效果补充说明
    if (formData.get('effectiveness_note')) record.effectivenessNote = formData.get('effectiveness_note');

    // 验证必填
    var typeInfo = RECORD_TYPES[type];
    if (typeInfo.fields.indexOf('content') !== -1 && !record.content.trim()) {
      alert('请填写内容');
      return;
    }
    if (typeInfo.fields.indexOf('title') !== -1 && !record.title) {
      alert('请填写标题');
      return;
    }
    if (type === 'mood' && !record.mood) {
      alert('请选择心情');
      return;
    }

    // 添加作者信息
    record.author = user.name;
    record.authorRole = user.role;
    record.authorAvatar = (user.avatar || (ROLES[user.role] ? ROLES[user.role].avatar : '👤'));
    record.authorId = user.id;

    // 保存
    DataStore.addRecord(record);

    // 关闭弹窗
    closeAddRecordModal();

    // 刷新首页最新动态
    if (currentPage === 'home' && window.renderLatestActivity) {
      window.renderLatestActivity(user);
    }

    // 如果时间轴页面是活跃的，也刷新它
    if (currentPage === 'timeline' && window.renderTimeline) {
      window.renderTimeline();
    }

    // 显示成功提示
    window.showToast('✅ 记录添加成功！');
  }

  /**
   * 解析 hash 中的查询参数，如 #records?module=communication
   * @returns {Object} { page: 'records', params: { module: 'communication' } }
   */
  function parseHashParams() {
    var raw = window.location.hash.replace('#', '') || 'home';
    var qIndex = raw.indexOf('?');
    var page = qIndex === -1 ? raw : raw.substring(0, qIndex);
    var params = {};
    if (qIndex !== -1) {
      var qs = raw.substring(qIndex + 1);
      qs.split('&').forEach(function (pair) {
        var parts = pair.split('=');
        if (parts.length === 2) {
          params[decodeURIComponent(parts[0])] = decodeURIComponent(parts[1]);
        }
      });
    }
    return { page: page, params: params };
  }

  /**
   * 渲染单条记录卡片（记录列表用）
   */
  function renderOneRecordCard(record) {
    var typeInfo = RECORD_TYPES[record.type] || { label: '记录', icon: '📝', color: '#999' };
    var roleInfo = ROLES[record.authorRole] || { color: '#999', avatar: '👤' };
    var moduleKey = record.module || '';
    var moduleInfo = Modules[moduleKey] || null;
    var moduleColor = moduleInfo ? moduleInfo.color : '#ccc';

    // 日期显示
    var dateDisplay = '';
    if (record.date) {
      var parts = record.date.split('-');
      if (parts.length === 3) {
        dateDisplay = parseInt(parts[1], 10) + '/' + parseInt(parts[2], 10);
      } else {
        dateDisplay = record.date;
      }
    }

    // 内容摘要（截断50字）
    var contentPreview = record.content || '';
    if (contentPreview.length > 50) {
      contentPreview = contentPreview.substring(0, 50) + '...';
    }

    var html = '';
    html += '<div style="background:#fff;border-radius:10px;padding:0;box-shadow:0 1px 4px rgba(0,0,0,0.04);display:flex;overflow:hidden;">';
    // 左色条
    html += '  <div style="width:4px;background:' + moduleColor + ';flex-shrink:0;"></div>';
    // 内容
    html += '  <div style="flex:1;padding:12px 14px;min-width:0;">';
    // 顶行：类型图标 + 作者 + 角色 + 时间
    html += '    <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;flex-wrap:wrap;">';
    html += '      <span style="font-size:0.8rem;padding:1px 8px;border-radius:10px;background:' + typeInfo.color + '15;color:' + typeInfo.color + ';white-space:nowrap;">' + typeInfo.icon + ' ' + typeInfo.label + '</span>';
    html += '      <span style="font-size:0.8rem;color:#333;font-weight:500;">' + (record.author || '未知') + '</span>';
    html += '      <span style="font-size:0.7rem;color:#fff;background:' + roleInfo.color + ';padding:1px 6px;border-radius:8px;white-space:nowrap;">' + (roleInfo.label || record.authorRole) + '</span>';
    html += '      <span style="font-size:0.72rem;color:#aaa;margin-left:auto;white-space:nowrap;">' + dateDisplay + ' ' + (record.time || '') + '</span>';
    html += '    </div>';
    // 内容摘要
    html += '    <div style="font-size:0.85rem;color:#555;line-height:1.4;">';
    if (record.title) {
      html += '<span style="font-weight:500;color:#333;">' + record.title + '</span> · ';
    }
    html += contentPreview + '</div>';
    // 模块标签（如果有）
    if (moduleInfo && !recordsPageState.selectedModule) {
      html += '    <div style="margin-top:4px;">';
      html += '      <span style="font-size:0.7rem;padding:1px 8px;border-radius:10px;background:' + moduleColor + '12;color:' + moduleColor + ';">' + moduleInfo.icon + ' ' + moduleInfo.label + '</span>';
      html += '    </div>';
    }
    html += '  </div>';
    html += '</div>';
    return html;
  }

  /**
   * 渲染记录列表页面 — 含两级选择器、快捷标签、权限过滤
   * @param {string} filterModule - 可选，按模块 key 过滤
   */
  function renderRecordsPage(filterModule) {
    var recordsSection = document.getElementById('records');
    if (!recordsSection) {
      recordsSection = document.createElement('section');
      recordsSection.id = 'records';
      recordsSection.className = 'page-section';
      var mainContent = document.querySelector('.main-content');
      if (mainContent) mainContent.appendChild(recordsSection);
    }

    // 初始化模块选择（从 URL 参数）
    if (filterModule && !recordsPageState.selectedModule) {
      recordsPageState.selectedModule = filterModule;
    }

    var currentUser = DataStore.getCurrentUser() || appState.currentUser;
    var currentRole = currentUser ? currentUser.role : 'parent';
    var allowedPrivacies = (privacyLevels || {})[currentRole] || ['A', 'B', 'C', 'D'];

    var records = DataStore.getRecords();

    // 按模块过滤
    if (recordsPageState.selectedModule) {
      records = records.filter(function (r) { return r.module === recordsPageState.selectedModule; });
    }

    // 按记录类型过滤
    if (recordsPageState.selectedType) {
      records = records.filter(function (r) { return r.type === recordsPageState.selectedType; });
    }

    // 按日期降序排列
    records.sort(function (a, b) {
      return (b.date + b.time).localeCompare(a.date + a.time);
    });

    var moduleInfo = recordsPageState.selectedModule ? Modules[recordsPageState.selectedModule] : null;

    var html = '';
    html += '<div class="page-header">';
    html += '  <button class="back-btn">←</button>';
    html += '  <span class="page-title">' + (moduleInfo ? moduleInfo.icon + ' ' + moduleInfo.label + ' · 记录列表' : '全部记录') + '</span>';
    html += '</div>';
    html += '<div class="container" style="padding:24px;">';

    // ====== 两级选择器 ======
    html += '<div style="background:#fff;border-radius:12px;padding:16px;margin-bottom:16px;box-shadow:0 1px 4px rgba(0,0,0,0.04);">';

    // 第一级：模块选择
    html += '  <div style="font-size:0.82rem;color:#999;margin-bottom:8px;font-weight:500;">第一步：选择模块</div>';
    html += '  <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px;">';
    var moduleKeys = ['communication', 'emotion', 'care', 'work'];
    moduleKeys.forEach(function (mKey) {
      var mod = Modules[mKey];
      if (!mod) return;
      var isSelected = recordsPageState.selectedModule === mKey;
      html += '    <button class="module-chip' + (isSelected ? ' active' : '') + '" data-module="' + mKey + '" style="';
      html += 'padding:8px 16px;border-radius:20px;border:1.5px solid ' + (isSelected ? mod.color : '#ddd') + ';';
      html += 'background:' + (isSelected ? mod.color + '15' : '#fff') + ';';
      html += 'color:' + (isSelected ? mod.color : '#666') + ';';
      html += 'font-size:0.85rem;cursor:pointer;transition:all 0.2s;font-weight:' + (isSelected ? '600' : '400') + ';">';
      html += mod.icon + ' ' + mod.label + '</button>';
    });
    html += '    <button class="module-chip' + (!recordsPageState.selectedModule ? ' active' : '') + '" data-module="" style="';
    html += 'padding:8px 16px;border-radius:20px;border:1.5px solid ' + (!recordsPageState.selectedModule ? '#888' : '#ddd') + ';';
    html += 'background:' + (!recordsPageState.selectedModule ? '#f5f5f5' : '#fff') + ';';
    html += 'color:' + (!recordsPageState.selectedModule ? '#333' : '#666') + ';';
    html += 'font-size:0.85rem;cursor:pointer;transition:all 0.2s;font-weight:' + (!recordsPageState.selectedModule ? '600' : '400') + ';">全部模块</button>';
    html += '  </div>';

    // 第二级：记录类型选择（仅当已选模块时显示）
    if (recordsPageState.selectedModule) {
      var supportedTypes = RECORD_MATRIX[recordsPageState.selectedModule] || [];
      html += '  <div style="font-size:0.82rem;color:#999;margin-bottom:8px;font-weight:500;">第二步：选择记录类型</div>';
      html += '  <div style="display:flex;gap:8px;flex-wrap:wrap;">';

      Object.keys(RECORD_TYPES).forEach(function (tKey) {
        var t = RECORD_TYPES[tKey];
        var isValid = supportedTypes.indexOf(tKey) !== -1;
        var isTypeSelected = recordsPageState.selectedType === tKey;

        html += '    <button class="type-chip' + (isTypeSelected ? ' active' : '') + (!isValid ? ' disabled' : '') + '" ';
        if (isValid) html += 'data-type="' + tKey + '" ';
        html += 'style="';
        html += 'padding:6px 14px;border-radius:16px;border:1.5px solid ' + (isTypeSelected && isValid ? t.color : '#e0e0e0') + ';';
        html += 'background:' + (isTypeSelected && isValid ? t.color + '12' : '#fafafa') + ';';
        html += 'color:' + (isTypeSelected && isValid ? t.color : (isValid ? '#555' : '#ccc')) + ';';
        html += 'font-size:0.82rem;cursor:' + (isValid ? 'pointer' : 'default') + ';transition:all 0.2s;';
        if (!isValid) html += 'opacity:0.4;';
        html += 'font-weight:' + (isTypeSelected && isValid ? '600' : '400') + ';">';
        html += t.icon + ' ' + t.label;
        if (!isValid) html += ' <span style="font-size:0.65rem;">—</span>';
        html += '</button>';
      });

      html += '  </div>';
    }

    html += '</div>';

    // ====== 快捷标签（仅当已选模块时显示）======
    if (recordsPageState.selectedModule && moduleInfo && MODULE_TAGS[recordsPageState.selectedModule]) {
      html += '<div style="background:#fff;border-radius:12px;padding:16px;margin-bottom:16px;box-shadow:0 1px 4px rgba(0,0,0,0.04);">';
      html += '  <div style="font-size:0.82rem;color:#999;margin-bottom:8px;font-weight:500;">🏷️ 快捷标签 · 点击填入内容</div>';
      html += '  <div style="display:flex;gap:8px;flex-wrap:wrap;">';
      MODULE_TAGS[recordsPageState.selectedModule].forEach(function (tag) {
        html += '    <button class="quick-tag-btn" data-tag="' + tag + '" style="';
        html += 'background:' + moduleInfo.color + '10;';
        html += 'color:' + moduleInfo.color + ';';
        html += 'border:1px solid ' + moduleInfo.color + '30;';
        html += 'padding:5px 14px;border-radius:20px;font-size:0.8rem;';
        html += 'cursor:pointer;transition:all 0.2s;">' + tag + '</button>';
      });
      html += '  </div>';
      html += '</div>';
    }

    // ====== 记录统计信息头 ======
    if (moduleInfo) {
      html += '<div style="background:linear-gradient(135deg,' + moduleInfo.color + '18,' + moduleInfo.color + '06);';
      html += 'border-left:4px solid ' + moduleInfo.color + ';border-radius:0 10px 10px 0;';
      html += 'padding:12px 16px;margin-bottom:16px;display:flex;align-items:center;justify-content:space-between;">';
      html += '  <div style="font-size:0.85rem;color:#666;">';
      html += '    共 <strong style="color:' + moduleInfo.color + ';">' + records.length + '</strong> 条记录';
      if (recordsPageState.selectedType) {
        html += ' · ' + (RECORD_TYPES[recordsPageState.selectedType] || {}).icon + ' ' + (RECORD_TYPES[recordsPageState.selectedType] || {}).label;
      }
      html += '  </div>';
      if (recordsPageState.selectedType || recordsPageState.selectedModule) {
        html += '  <button id="btn-clear-records-filter" style="background:none;border:1px solid #ddd;color:#888;padding:4px 12px;border-radius:14px;font-size:0.78rem;cursor:pointer;">清除筛选</button>';
      }
      html += '</div>';
    }

    // ====== 记录列表 ======
    if (records.length === 0) {
      html += '<div style="background:#fff;border-radius:12px;padding:32px;text-align:center;color:#999;font-size:0.9rem;box-shadow:0 1px 4px rgba(0,0,0,0.04);">';
      html += '  <div style="font-size:2rem;margin-bottom:8px;">📭</div>';
      html += '  暂无相关记录，点击右下角 + 添加第一条记录吧！';
      html += '</div>';
    } else {
      html += '<div style="display:flex;flex-direction:column;gap:10px;">';
      records.forEach(function (record) {
        var recordPrivacy = record.privacy || 'B';
        var canView = allowedPrivacies.indexOf(recordPrivacy) !== -1;

        if (canView) {
          html += renderOneRecordCard(record);
        } else {
          html += '<div style="background:#fafafa;border:1px dashed #e0e0e0;border-radius:10px;padding:14px 16px;display:flex;align-items:center;gap:10px;">';
          html += '  <span style="font-size:1.3rem;">🔒</span>';
          html += '  <div style="flex:1;">';
          html += '    <span style="color:#bbb;font-size:0.82rem;font-weight:500;">无权限查看</span>';
          html += '    <span style="color:#ccc;font-size:0.72rem;margin-left:8px;">隐私级别：' + recordPrivacy + '</span>';
          html += '  </div>';
          html += '  <span style="font-size:0.72rem;color:#ccc;white-space:nowrap;">' + (record.date || '') + '</span>';
          html += '</div>';
        }
      });
      html += '</div>';
    }

    html += '</div>'; // close container

    recordsSection.innerHTML = html;

    // 绑定事件
    bindRecordsPageEvents(recordsSection);
  }

  /**
   * 绑定记录页交互事件
   */
  function bindRecordsPageEvents(section) {
    // 模块选择按钮
    section.querySelectorAll('.module-chip').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var modKey = this.getAttribute('data-module');
        recordsPageState.selectedModule = modKey || null;
        recordsPageState.selectedType = null;
        recordsPageState.tagFilter = null;
        renderRecordsPage();
      });
    });

    // 记录类型选择按钮（排除 disabled）
    section.querySelectorAll('.type-chip:not(.disabled)').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var tKey = this.getAttribute('data-type');
        if (recordsPageState.selectedType === tKey) {
          recordsPageState.selectedType = null;
        } else {
          recordsPageState.selectedType = tKey;
        }
        renderRecordsPage();
      });
    });

    // 快捷标签按钮 — 打开添加记录弹窗并预填内容
    section.querySelectorAll('.quick-tag-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var tag = this.getAttribute('data-tag');
        addRecordState.prefillContent = tag;
        openAddRecordModal();
      });
    });

    // 清除筛选按钮
    var clearBtn = section.querySelector('#btn-clear-records-filter');
    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        recordsPageState.selectedModule = null;
        recordsPageState.selectedType = null;
        recordsPageState.tagFilter = null;
        renderRecordsPage();
      });
    }
  }

  // 暴露到全局
  window.RecordsPage = {
    openAddRecordModal: openAddRecordModal,
    closeAddRecordModal: closeAddRecordModal,
    createAddRecordModal: createAddRecordModal,
    renderAddRecordStep1: renderAddRecordStep1,
    renderAddRecordStep2: renderAddRecordStep2,
    saveRecord: saveRecord,
    renderRecordsPage: renderRecordsPage,
    renderOneRecordCard: renderOneRecordCard,
    parseHashParams: parseHashParams
  };

  // 向后兼容：HTML onclick 处理器直接引用
  window.openAddRecordModal = openAddRecordModal;
  window.closeAddRecordModal = closeAddRecordModal;

})();