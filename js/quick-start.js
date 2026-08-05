/**
 * ============================================================
 * AI懂我 - 角色化冷启动三步引导
 * ============================================================
 * Step 1: 选择身份 → Step 2: 选择服务对象 → Step 3: 开始使用
 * ============================================================
 */
(function () {
  'use strict';

  var currentStep = 1;
  var selectedRole = null;
  var selectedYouth = null;
  // 演示档案码使用的虚拟 youth
  var DEMO_YOUTH = { id: 'demo_xiaoyu', name: '小雨', label: '演示档案：小雨' };

  var ROLE_CARDS = [
    { value: 'youth', label: '心青年本人', icon: '🌻',
      desc: '表达经历、偏好和需要的支持' },
    { value: 'parent', label: '家长', icon: '👨\u200d👩\u200d👧',
      desc: '建立和维护长期支持档案' },
    { value: 'teacher', label: '老师', icon: '📚',
      desc: '记录学习、活动和支持情况' },
    { value: 'caregiver', label: '照护者', icon: '🤝',
      desc: '查看今日提醒并完成照护交接' },
    { value: 'temp_supporter', label: '临时支持者/志愿者', icon: '🤲',
      desc: '快速了解今天如何支持一位心青年' },
    { value: 'admin', label: '管理员', icon: '🛡️',
      desc: '管理成员、授权和待处理事项' }
  ];

  function getCurrentUser() {
    var ds = window.DataStore;
    var appState = window.AppState;
    return ds ? (ds.getCurrentUser() || (appState && appState.currentUser) || null) : null;
  }

  function renderQuickStart() {
    var container = document.getElementById('quick-start-content');
    if (!container) return;
    var user = getCurrentUser();
    // 预选：如果账号已有角色，默认选中
    if (user && !selectedRole) {
      selectedRole = user.role || null;
    }

    renderStep(container);
    // 更新底栏导航
    if (window.renderBottomNav) window.renderBottomNav();
  }

  function renderStep(container) {
    var html = buildHeader();
    if (currentStep === 1) html += buildStep1();
    else if (currentStep === 2) html += buildStep2();
    else if (currentStep === 3) html += buildStep3();
    container.innerHTML = html;
    bindStepEvents(container);
  }

  function buildHeader() {
    var user = getCurrentUser();
    var demoBadge = (user && window.Onboarding && window.Onboarding.isSampleUser(user))
      ? '<span style="background:#FAAD14;color:#000;font-size:0.7rem;padding:2px 8px;border-radius:99px;margin-left:8px;">示例体验模式</span>'
      : '';
    return '<div class="qs-header">'
      + '<div class="qs-progress">'
      + '  <span class="qs-step-dot' + (currentStep >= 1 ? ' active' : '') + '">1</span>'
      + '  <span class="qs-step-line' + (currentStep >= 2 ? ' active' : '') + '"></span>'
      + '  <span class="qs-step-dot' + (currentStep >= 2 ? ' active' : '') + '">2</span>'
      + '  <span class="qs-step-line' + (currentStep >= 3 ? ' active' : '') + '"></span>'
      + '  <span class="qs-step-dot' + (currentStep >= 3 ? ' active' : '') + '">3</span>'
      + '</div>'
      + '<div class="qs-step-labels"><span>选择身份</span><span>选择服务对象</span><span>开始使用</span></div>'
      + '<div class="qs-user-info">'
      + (user ? '<span>' + (user.name || '') + demoBadge + '</span>' : '')
      + (selectedYouth ? '<span class="qs-youth-tag">👤 ' + selectedYouth.name + '</span>' : '')
      + '</div></div>';
  }

  function buildStep1() {
    var user = getCurrentUser();
    var html = '<div class="qs-step-body">';
    html += '<div class="qs-title">欢迎使用 AI懂我</div>';
    html += '<div class="qs-subtitle">请选择你在支持网络中的身份</div>';
    html += '<div class="qs-role-grid">';
    ROLE_CARDS.forEach(function (card) {
      var isActive = selectedRole === card.value;
      html += '<button class="qs-role-card' + (isActive ? ' active' : '') + '" data-role="' + card.value + '">';
      html += '<span class="qs-role-icon">' + card.icon + '</span>';
      html += '<span class="qs-role-label">' + card.label + '</span>';
      html += '<span class="qs-role-desc">' + card.desc + '</span>';
      html += '</button>';
    });
    html += '</div>';
    html += '<div class="qs-actions"><button class="qs-btn-primary" id="qs-step1-next"'
      + (selectedRole ? '' : ' disabled') + '>继续</button></div>';
    html += '</div>';
    return html;
  }

  function buildStep2() {
    var html = '<div class="qs-step-body">';
    html += '<div class="qs-title">你要支持谁</div>';
    html += '<div class="qs-back-row"><button class="qs-btn-back" id="qs-back-step2">← 上一步</button></div>';

    if (selectedRole === 'parent') {
      html += '<div class="qs-action-stack">';
      html += '<button class="qs-btn-primary qs-btn-lg" id="qs-create-youth">创建心青年档案</button>';
      html += '<p class="qs-hint">创建一份新的支持档案</p>';
      html += '<button class="qs-btn-secondary qs-btn-lg" id="qs-input-code">我已经有档案，输入档案码</button>';
      html += '<p class="qs-hint">加入已有家庭或机构</p>';
      html += '</div>';
    } else if (selectedRole === 'teacher' || selectedRole === 'caregiver') {
      html += '<div class="qs-action-stack">';
      html += '<button class="qs-btn-primary qs-btn-lg" id="qs-input-invite">输入邀请码加入</button>';
      html += '<p class="qs-hint">使用邀请码加入已有家庭</p>';
      html += '<button class="qs-btn-secondary qs-btn-lg" id="qs-select-demo">选择演示心青年：小雨</button>';
      html += '<p class="qs-hint">使用演示数据体验功能</p>';
      html += '</div>';
    } else if (selectedRole === 'temp_supporter') {
      html += '<div class="qs-action-stack">';
      html += '<button class="qs-btn-primary qs-btn-lg" id="qs-use-demo-code">使用演示档案码体验 "小雨"</button>';
      html += '<p class="qs-hint">你将查看：小雨<br>当前身份：临时支持者<br>当前权限：仅限本次服务所需信息</p>';
      html += '<button class="qs-btn-secondary qs-btn-lg" id="qs-scan-code">扫描或输入档案码</button>';
      html += '</div>';
    } else if (selectedRole === 'youth') {
      html += '<div class="qs-action-stack">';
      html += '<button class="qs-btn-primary qs-btn-lg" id="qs-youth-enter">进入我的档案</button>';
      html += '<p class="qs-hint">如没有绑定档案，请由家长或工作人员协助创建/绑定</p>';
      html += '</div>';
    } else if (selectedRole === 'admin') {
      html += '<div class="qs-action-stack">';
      html += '<button class="qs-btn-primary qs-btn-lg" id="qs-admin-enter">进入管理工作台</button>';
      html += '</div>';
    }
    html += '</div>';
    return html;
  }

  function buildStep3() {
    var html = '<div class="qs-step-body">';
    html += '<div class="qs-title">你现在要做什么</div>';
    html += '<div class="qs-back-row"><button class="qs-btn-back" id="qs-back-step3">← 上一步</button></div>';

    if (selectedYouth) {
      html += '<div class="qs-youth-confirm">';
      html += '<span class="qs-confirm-label">你将查看：</span>';
      html += '<strong>' + selectedYouth.name + '</strong>';
      if (selectedRole === 'temp_supporter') {
        html += '<div class="qs-auth-scope">当前身份：临时支持者 · 演示授权：仅限本次服务</div>';
      }
      html += '</div>';
    }

    html += '<div class="qs-action-stack">';
    if (selectedRole === 'parent') {
      html += '<button class="qs-btn-primary qs-btn-lg" id="qs-parent-action">完善第一份支持信息</button>';
      html += '<p class="qs-hint">先确认沟通方式、生活偏好、过敏、用药和紧急联系人。</p>';
    } else if (selectedRole === 'teacher') {
      html += '<button class="qs-btn-primary qs-btn-lg" id="qs-teacher-action">查看今日服务对象</button>';
    } else if (selectedRole === 'caregiver') {
      html += '<button class="qs-btn-primary qs-btn-lg" id="qs-caregiver-action">开始今日交接</button>';
    } else if (selectedRole === 'temp_supporter') {
      html += '<button class="qs-btn-primary qs-btn-lg" id="qs-supporter-action">查看一分钟速读卡</button>';
      html += '<p class="qs-hint">只展示本次服务需要知道的信息。</p>';
    } else if (selectedRole === 'youth') {
      html += '<button class="qs-btn-primary qs-btn-lg" id="qs-youth-action">和 AI 聊聊今天发生的事</button>';
    } else if (selectedRole === 'admin') {
      html += '<button class="qs-btn-primary qs-btn-lg" id="qs-admin-action">查看待处理事项</button>';
    }
    html += '</div>';
    html += '</div>';
    return html;
  }

  function bindStepEvents(container) {
    // Step 1: role selection
    container.querySelectorAll('.qs-role-card').forEach(function (btn) {
      btn.addEventListener('click', function () {
        selectedRole = this.getAttribute('data-role');
        container.querySelectorAll('.qs-role-card').forEach(function (b) { b.classList.remove('active'); });
        this.classList.add('active');
        var nextBtn = document.getElementById('qs-step1-next');
        if (nextBtn) nextBtn.disabled = false;
      });
    });
    var next1 = document.getElementById('qs-step1-next');
    if (next1) {
      next1.addEventListener('click', function () {
        if (!selectedRole) return;
        currentStep = 2;
        renderStep(container);
      });
    }

    // Step 2: back
    var back2 = document.getElementById('qs-back-step2');
    if (back2) back2.addEventListener('click', function () { currentStep = 1; renderStep(container); });

    // Step 2: actions
    ['create-youth', 'input-code', 'input-invite', 'select-demo', 'use-demo-code', 'scan-code', 'youth-enter', 'admin-enter'].forEach(function (id) {
      var btn = document.getElementById('qs-' + id);
      if (!btn) return;
      btn.addEventListener('click', function () {
        if (id === 'select-demo' || id === 'use-demo-code') {
          selectedYouth = DEMO_YOUTH;
        }
        currentStep = 3;
        renderStep(container);
      });
    });

    // Step 3: back
    var back3 = document.getElementById('qs-back-step3');
    if (back3) back3.addEventListener('click', function () { currentStep = 2; renderStep(container); });

    // Step 3: actions
    var actions = {
      'parent-action': { route: 'archive', role: 'parent' },
      'teacher-action': { route: 'home', role: 'teacher' },
      'caregiver-action': { route: 'home', role: 'caregiver' },
      'supporter-action': { route: 'supporter-card', role: 'temp_supporter' },
      'youth-action': { route: 'youth-chat', role: 'youth' },
      'admin-action': { route: 'profile', role: 'admin' }
    };
    Object.keys(actions).forEach(function (id) {
      var btn = document.getElementById('qs-' + id);
      if (!btn) return;
      btn.addEventListener('click', function () {
        window.Onboarding.completeOnboarding({
          role: actions[id].role,
          youthId: selectedYouth ? selectedYouth.id : null,
          action: id
        });
        // 如果角色改变了，更新 currentUser
        var user = getCurrentUser();
        if (user && actions[id].role !== user.role) {
          user._onboardedRole = actions[id].role;
        }
        window.location.hash = '#' + actions[id].route;
      });
    });
  }

  window.QuickStartPage = {
    render: renderQuickStart
  };
})();
