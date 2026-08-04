/**
 * records.js — 记录管理模块（添加记录弹窗 + 记录列表页）
 * 挂载：window.RecordsPage, window.openAddRecordModal, window.closeAddRecordModal
 * 依赖：window.Utils, window.Constants, window.AppState, window.DataStore
 */
(function () {
  'use strict';

  var ROLES = window.Constants.ROLES;
  var RECORD_TYPES = window.Constants.RECORD_TYPES;
  var MOOD_OPTIONS = window.Constants.MOOD_OPTIONS;
  var EMOTION_OPTIONS = window.Constants.EMOTION_OPTIONS;
  var MODULE_TAGS = window.Constants.MODULE_TAGS;
  var PRIVACY_LABELS = window.Constants.PRIVACY_LABELS;
  var DataStore = window.DataStore;
  var appState = window.AppState.appState;
  var currentPage = window.AppState.currentPage;
  var addRecordState = window.AppState.addRecordState;

  /** 模块配置映射 */
  var MODULE_CONFIG = {
    communicationGuide: { icon: '💬', label: '沟通与表达', color: '#9B85B8' },
    emotionSupport: { icon: '🌊', label: '情绪与行为', color: '#D4877B' },
    careInfo: { icon: '💊', label: '照护与医疗', color: '#A8C9A0' },
    workInfo: { icon: '💼', label: '工作与生活', color: '#D4A85A' }
  };

  /**
   * 从 URL hash 中解析查询参数
   * 例如 #records?module=communicationGuide → { module: 'communicationGuide' }
   */
  function parseHashParams() {
    var hash = window.location.hash.replace('#', '');
    var params = {};
    var qIndex = hash.indexOf('?');
    if (qIndex === -1) return params;
    var queryStr = hash.substring(qIndex + 1);
    queryStr.split('&').forEach(function (pair) {
      var parts = pair.split('=');
      if (parts.length === 2) {
        params[decodeURIComponent(parts[0])] = decodeURIComponent(parts[1]);
      }
    });
    return params;
  }

  /**
   * 渲染记录列表页（按模块筛选）
   */
  function renderRecordsList() {
    var recordsSection = document.getElementById('records');
    if (!recordsSection) {
      recordsSection = document.createElement('section');
      recordsSection.id = 'records';
      recordsSection.className = 'page-section';
      document.querySelector('.main-content').appendChild(recordsSection);
    }

    var params = parseHashParams();
    var moduleKey = params.module || null;
    var moduleCfg = moduleKey ? MODULE_CONFIG[moduleKey] : null;

    var records = moduleKey ? DataStore.getRecordsByModule(moduleKey) : DataStore.getRecords();

    var html = '';
    html += '<div class="page-header">';
    html += '  <button class="back-btn">←</button>';
    html += '  <span class="page-title">' + (moduleCfg ? moduleCfg.icon + ' ' + moduleCfg.label + ' 记录' : '全部记录') + '</span>';
    html += '</div>';
    html += '<div class="container" style="padding:24px;">';

    // 模块信息卡片
    if (moduleCfg) {
      html += '<div style="background:#fff;border-radius:12px;padding:16px;margin-bottom:20px;border-left:4px solid ' + moduleCfg.color + ';box-shadow:0 1px 4px rgba(0,0,0,0.04);">';
      html += '  <div style="font-size:1.1rem;font-weight:600;color:#333;margin-bottom:4px;">' + moduleCfg.icon + ' ' + moduleCfg.label + '</div>';
      html += '  <div style="font-size:0.85rem;color:#888;">共 ' + records.length + ' 条记录</div>';
      // 模块标签池展示
      if (MODULE_TAGS[moduleKey]) {
        html += '  <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px;">';
        MODULE_TAGS[moduleKey].forEach(function (tag) {
          html += '    <span style="background:#f0f0f0;color:#666;font-size:0.75rem;padding:2px 8px;border-radius:10px;">' + tag + '</span>';
        });
        html += '  </div>';
      }
      html += '</div>';
    }

    // 记录列表
    if (records.length === 0) {
      html += '<div style="background:#fff;border-radius:12px;padding:32px;text-align:center;color:#999;box-shadow:0 1px 4px rgba(0,0,0,0.04);">';
      html += '  <div style="font-size:2.5rem;margin-bottom:12px;">📝</div>';
      html += '  <div style="font-size:0.95rem;">暂无记录</div>';
      html += '  <div style="font-size:0.8rem;margin-top:4px;">点击右下角 + 按钮添加第一条记录</div>';
      html += '</div>';
    } else {
      html += '<div style="display:flex;flex-direction:column;gap:10px;">';
      records.forEach(function (record) {
        html += renderRecordListItem(record);
      });
      html += '</div>';
    }

    html += '</div>';

    recordsSection.innerHTML = html;
  }

  /**
   * 渲染单条记录列表项
   */
  function renderRecordListItem(record) {
    var typeInfo = RECORD_TYPES[record.type] || { label: '记录', icon: '📝', color: '#999' };
    var roleInfo = ROLES[record.authorRole] || { color: '#999', avatar: '👤' };
    var privacyInfo = PRIVACY_LABELS[record.privacy] || { label: record.privacy, color: '#999' };
    var formatDateDisplay = window.formatDateDisplay;

    var html = '';
    html += '<div style="background:#fff;border-radius:12px;padding:14px 16px;box-shadow:0 1px 4px rgba(0,0,0,0.04);border-left:3px solid ' + roleInfo.color + ';display:flex;align-items:flex-start;gap:10px;">';
    html += '  <div style="font-size:1.6rem;flex-shrink:0;">' + (record.authorAvatar || roleInfo.avatar) + '</div>';
    html += '  <div style="flex:1;min-width:0;">';
    html += '    <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;flex-wrap:wrap;">';
    html += '      <span style="font-weight:600;color:#333;font-size:0.9rem;">' + record.author + '</span>';
    html += '      <span style="font-size:0.7rem;color:#fff;background:' + roleInfo.color + ';padding:1px 6px;border-radius:10px;">' + (ROLES[record.authorRole] ? ROLES[record.authorRole].label : record.authorRole) + '</span>';
    html += '      <span style="font-size:0.7rem;color:#fff;background:' + privacyInfo.color + ';padding:1px 6px;border-radius:10px;" title="' + privacyInfo.desc + '">' + privacyInfo.label + '</span>';
    html += '      <span style="font-size:0.75rem;color:#aaa;margin-left:auto;white-space:nowrap;">' + formatDateDisplay(record.date) + ' ' + record.time + '</span>';
    html += '    </div>';
    html += '    <div style="font-size:0.8rem;color:#888;margin-bottom:2px;">' + typeInfo.icon + ' ' + typeInfo.label + '</div>';
    html += '    <div style="font-size:0.88rem;color:#555;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + (record.title ? record.title + ' · ' : '') + record.content + '</div>';
    // 标签展示
    if (record.tags && record.tags.length > 0) {
      html += '    <div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:6px;">';
      record.tags.forEach(function (tag) {
        html += '      <span style="background:#f0f7ff;color:#4A90D9;font-size:0.7rem;padding:1px 6px;border-radius:8px;">' + tag + '</span>';
      });
      html += '    </div>';
    }
    html += '  </div>';
    html += '</div>';

    return html;
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
          html += '  <label style="display:block;font-size:0.85rem;color:#555;margin-bottom:8px;font-weight:500;">策略效果评分</label>';
          html += '  <div style="display:flex;gap:8px;flex-wrap:wrap;">';
          var effLevels = [
            { value: 1, label: '无效', emoji: '😞' },
            { value: 2, label: '较弱', emoji: '🙁' },
            { value: 3, label: '一般', emoji: '😐' },
            { value: 4, label: '有效', emoji: '🙂' },
            { value: 5, label: '很有效', emoji: '😄' }
          ];
          effLevels.forEach(function (eff) {
            html += '    <label class="effectiveness-option" style="cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:4px;padding:10px 14px;border:2px solid #eee;border-radius:10px;transition:all 0.2s;background:#fff;">';
            html += '      <input type="radio" name="effectiveness" value="' + eff.value + '" style="display:none;">';
            html += '      <span style="font-size:1.5rem;">' + eff.emoji + '</span>';
            html += '      <span style="font-size:0.75rem;color:#555;">' + eff.label + '</span>';
            html += '    </label>';
          });
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

    if (formData.get('title')) record.title = formData.get('title');
    if (formData.get('mood')) record.mood = formData.get('mood');
    if (formData.get('emotion_type')) record.emotion_type = formData.get('emotion_type');
    if (formData.get('effectiveness')) record.effectiveness = parseInt(formData.get('effectiveness'), 10);

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

  // 暴露到全局
  window.RecordsPage = {
    openAddRecordModal: openAddRecordModal,
    closeAddRecordModal: closeAddRecordModal,
    createAddRecordModal: createAddRecordModal,
    renderAddRecordStep1: renderAddRecordStep1,
    renderAddRecordStep2: renderAddRecordStep2,
    saveRecord: saveRecord,
    renderRecordsList: renderRecordsList,
    renderRecordListItem: renderRecordListItem,
    parseHashParams: parseHashParams
  };

  // 向后兼容：HTML onclick 处理器直接引用
  window.openAddRecordModal = openAddRecordModal;
  window.closeAddRecordModal = closeAddRecordModal;

})();