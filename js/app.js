/**
 * ============================================================
 * AI懂我 - 心智障碍者动态可视化支持档案
 * v1.0-20260804-final - 多角色协同记录系统
 * 主应用脚本 app.js（入口文件）
 * ============================================================
 * 依赖模块（按加载顺序）：
 *   1. utils.js       - 工具函数
 *   2. constants.js   - 数据常量
 *   3. modules.js     - 模块注册
 *   4. state.js       - 全局状态
 *   5. storage.js     - 数据持久化
 *   6. auth.js        - 认证系统
 *   7. permissions.js - 隐私权限
 *   8. profile.js     - 个人中心
 *   9. records.js     - 记录管理
 *   10. quickcard.js  - 速读卡
 *   11. timeline.js   - 时间轴
 *   12. chatbot.js    - AI聊聊引擎
 *   13. charts.js     - 数据可视化
 *   —— app.js（本文件）最后加载 ——
 * ============================================================
 */

(function () {
  'use strict';

  /* ==========================================================
   * 零、本地别名 —— 引用外部模块
   * ========================================================== */
  var Utils = window.Utils;
  var C = window.Constants;
  var ROLES = C.ROLES;
  var RECORD_TYPES = C.RECORD_TYPES;
  var MOOD_OPTIONS = C.MOOD_OPTIONS;
  var EMOTION_OPTIONS = C.EMOTION_OPTIONS;
  var basicInfo = C.basicInfo;
  var likesList = C.likesList;
  var dislikesList = C.dislikesList;
  var communicationGuide = C.communicationGuide;
  var DataStore = window.DataStore;
  var emotionSupport = C.emotionSupport;
  var careInfo = DataStore.getCareInfo();
  var workInfo = C.workInfo;
  var dailyRoutine = C.dailyRoutine;
  var relationsInfo = C.relationsInfo;
  var quickCardVersions = C.quickCardVersions;
  var privacyLevels = C.privacyLevels;
  var routeMap = C.routeMap;
  var PAGE_PARENT = C.PAGE_PARENT;
  var PAGE_BACK_PARENT = C.PAGE_BACK_PARENT || {};
  var ROLE_NAV_TABS = C.ROLE_NAV_TABS;
  var ROLE_DEFAULT_PAGES = C.ROLE_DEFAULT_PAGES;
  var STRATEGY_KB = C.STRATEGY_KB;
  var EMOTION_TO_STRATEGY = C.EMOTION_TO_STRATEGY;
  var appState = window.AppState.appState;
  var currentPage = window.AppState.currentPage;
  var currentRole = window.AppState.currentRole;
  var currentQuickCardVersion = window.AppState.currentQuickCardVersion;
  var addRecordState = window.AppState.addRecordState;
  var timelineFilters = window.AppState.timelineFilters;
  var chatState = window.AppState.chatState;
  var calendarState = window.AppState.calendarState;
  var showToast = window.showToast;
  var getTodayString = window.getTodayString;
  var getNowTimeString = window.getNowTimeString;
  var formatDateDisplay = window.formatDateDisplay;
  var generateUUID = window.generateUUID;
  var getRiskLabel = window.getRiskLabel;

  /* ==========================================================
   * 一、路由系统（Hash路由）
   * ========================================================== */

  /**
   * 渲染待确认记录入口横幅（仅家长/老师/影子老师可见）
   */
  function renderPendingDraftBanner(role) {
    if (['parent', 'teacher', 'caregiver'].indexOf(role) === -1) return;
    var existingBanner = document.getElementById('draft-pending-banner');
    if (existingBanner) existingBanner.remove();

    var drafts = [];
    try { drafts = JSON.parse(localStorage.getItem('ai_dongwo_pending_drafts') || '[]'); } catch (e) { drafts = []; }
    var pending = drafts.filter(function (d) { return d.status === 'pending'; });
    if (pending.length === 0) return;

    var cardGridEl = document.getElementById('card-grid');
    if (!cardGridEl) return;

    var banner = document.createElement('div');
    banner.id = 'draft-pending-banner';
    banner.style.cssText = 'margin:0 24px 12px;padding:12px 16px;background:linear-gradient(135deg,#FFF7E6,#FFF3D6);border-radius:12px;display:flex;align-items:center;justify-content:space-between;cursor:pointer;border:1px solid rgba(232,165,71,0.3);';
    banner.innerHTML = '<div style="display:flex;align-items:center;gap:8px;">' +
      '<span style="font-size:1.5rem;">📋</span>' +
      '<div><span style="font-weight:600;color:#8B6914;">待确认记录</span>' +
      '<span style="font-size:0.85rem;color:#A68A29;"> · ' + pending.length + ' 条待确认</span></div>' +
      '</div>' +
      '<span style="color:#E8A547;font-size:1.2rem;">→</span>';
    banner.addEventListener('click', function () {
      window.location.hash = 'draft-review';
    });
    cardGridEl.parentNode.insertBefore(banner, cardGridEl);
  }

  /**
   * 初始化路由系统
   * 监听 hashchange 事件，实现SPA页面切换
   */
  function initRouter() {
    window.addEventListener('hashchange', handleRouteChange);

    // 首次加载时根据当前hash渲染页面
    var hash = window.location.hash.replace('#', '') || 'home';
    // 如果没有登录且不是登录页面，重定向到登录
    var user = DataStore.getCurrentUser() || appState.currentUser;
    if (!user && hash !== 'login') {
      hash = 'login';
      window.location.hash = 'login';
      return;
    }
    // 已登录且 hash 为空时，使用角色默认落地页
    if (user && !window.location.hash.replace('#', '')) {
      var defaultPage = ROLE_DEFAULT_PAGES[user.role] || 'home';
      hash = defaultPage;
      window.location.hash = defaultPage;
      return;
    }
    // 已登录且非引导页，检查是否需要引导
    if (user && hash !== 'quick-start' && window.Onboarding && window.Onboarding.needsOnboarding(user)) {
      hash = 'quick-start';
      window.location.hash = 'quick-start';
      return;
    }
    navigateTo(hash);
  }

  /**
   * 处理路由变化
   */
  function handleRouteChange() {
    var hash = window.location.hash.replace('#', '');
    var user = DataStore.getCurrentUser() || appState.currentUser;
    if (!user && hash !== 'login') {
      window.location.hash = 'login';
      return;
    }
    // 已登录且 hash 为空时，使用角色默认落地页
    if (user && !hash) {
      hash = ROLE_DEFAULT_PAGES[user.role] || 'home';
      window.location.hash = hash;
      return;
    }
    // 登录后检查是否需要进入首次使用引导
    if (user && hash !== 'quick-start' && hash !== 'login' && window.Onboarding && window.Onboarding.needsOnboarding(user)) {
      window.location.hash = 'quick-start';
      return;
    }
    navigateTo(hash);
  }

  /**
   * 一级 Tab 配置（图标 + 标签）
   */
  var TAB_CONFIG = {
    'chat': { route: 'chat', icon: '💬', label: 'AI聊聊' },
    'home': { route: 'home', icon: '✅', label: '任务' },
    'archive': { route: 'archive', icon: '👤', label: '档案' },
    'charts': { route: 'charts', icon: '📊', label: '分析' },
    'profile': { route: 'profile', icon: '⚙️', label: '管理' },
    'youth-chat': { route: 'youth-chat', icon: '💬', label: 'AI聊聊' }
  };

  /**
   * 渲染底部导航 TabBar（按角色差异化）
   */
  function renderBottomNav() {
    var navContainer = Utils.dom.get('bottom-nav');
    if (!navContainer) return;

    var user = DataStore.getCurrentUser() || appState.currentUser;
    var role = user ? user.role : 'parent';
    var visibleTabs = (ROLE_NAV_TABS[role] || ROLE_NAV_TABS.parent)
      .map(function (route) { return TAB_CONFIG[route]; })
      .filter(Boolean);

    var html = '';
    visibleTabs.forEach(function (tab) {
      html += '<button class="nav-tab" data-route="' + tab.route + '">';
      html += '<span class="nav-tab-icon">' + tab.icon + '</span>';
      html += tab.label;
      html += '</button>';
    });

    Utils.dom.html(navContainer, html);
    navContainer.style.gridTemplateColumns = 'repeat(' + visibleTabs.length + ', 1fr)';

    // 绑定点击事件
    var tabs = navContainer.querySelectorAll('.nav-tab');
    tabs.forEach(function (tab) {
      Utils.dom.on(tab, 'click', function () {
        var route = this.getAttribute('data-route');
        if (route) {
          window.location.hash = route;
        }
      });
    });
  }

  /**
   * 模块二级标签栏配置
   */
  var MODULE_SUB_NAV = {
    'archive': [
      { hash: 'archive', label: '总览' },
      { hash: 'archive-topics', label: '主题档案' },
      { hash: 'timeline', label: '时间轴' },
      { hash: 'quickcard', label: '速读卡' },
      { hash: 'archive-status', label: '档案状态' }
    ]
  };

  /**
   * 渲染模块二级标签栏（如档案的 总览/主题档案/时间轴/速读卡）
   */
  function renderModuleSubNav(pageName) {
    var subNav = document.getElementById('module-sub-nav');
    if (!subNav) return;

    var parent = PAGE_PARENT[pageName];
    var items = parent ? MODULE_SUB_NAV[parent] : null;

    if (!items) {
      subNav.style.display = 'none';
      return;
    }

    subNav.style.display = 'flex';
    // 主题子页面也高亮"主题档案"
    var themePages = ['life', 'communication', 'emotion', 'care', 'work', 'relations', 'records'];
    var html = '';
    items.forEach(function (item) {
      var isActive = (item.hash === pageName) ||
        (item.hash === 'archive-topics' && themePages.indexOf(pageName) !== -1);
      html += '<button class="sub-nav-tab' + (isActive ? ' active' : '') + '" data-hash="' + item.hash + '">';
      html += item.label;
      html += '</button>';
    });
    subNav.innerHTML = html;

    // 绑定点击事件
    subNav.querySelectorAll('.sub-nav-tab').forEach(function (tab) {
      tab.addEventListener('click', function () {
        var hash = this.getAttribute('data-hash');
        if (hash) {
          window.location.hash = hash;
        }
      });
    });
  }

  /**
   * 高亮当前底部导航项（通过 PAGE_PARENT 映射，子页面继承父级高亮）
   */
  function highlightBottomNav(route) {
    var parent = PAGE_PARENT[route] || route;
    var tabs = document.querySelectorAll('.nav-tab');
    tabs.forEach(function (tab) {
      tab.classList.remove('active');
      if (tab.getAttribute('data-route') === parent) {
        tab.classList.add('active');
      }
    });
  }

  /**
   * 更新顶栏标题和返回按钮
   */
  function updateTopbar(pageName) {
    var titleEl = Utils.dom.get('topbar-title');
    var backEl = Utils.dom.get('topbar-back');
    var quickEl = Utils.dom.get('topbar-quick');

    var pageTitles = {
      chat: 'AI聊聊',
      'chat-conversation': 'AI聊聊',
      'chat-review': '整理确认',
      home: '今日',
      archive: '档案 · 总览',
      'archive-topics': '档案 · 主题',
      'archive-status': '档案状态',
      life: '我喜欢的生活',
      communication: '沟通说明书',
      emotion: '情绪与行为支持',
      care: '照护与医疗',
      work: '工作支持',
      relations: '关系地图',
      timeline: '档案 · 时间轴',
      records: '记录列表',
      profile: '我的账号',
      charts: '趋势分析',
      tasks: '任务清单',
      calendar: '日程日历',
      analytics: '分析总览',
      quickcard: '档案 · 速览',
      grants: '授权管理',
      join: '家庭与成员',
      approvals: '加入申请审批',
      'archive-code': '档案码',
      welcome: '欢迎',
      'youth-chat': 'AI聊聊',
      'batch-import': '批量导入',
      'admin-users': '用户管理',
      'admin-data': '系统数据',
      'quick-record': '快速记录',
      'draft-review': '待确认记录'
    };

    if (titleEl) {
      titleEl.textContent = pageTitles[pageName] || 'AI懂我';
      // 有 sub-nav 的页面，tab 就是标题，隐藏 topbar 标题避免重复
      var hasSubNav = (pageName === 'archive' || pageName === 'archive-topics' || pageName === 'timeline' || pageName === 'quickcard');
      titleEl.style.display = hasSubNav ? 'none' : '';
    }
    // 对话页面自带顶栏，隐藏全局顶栏
    var isChatPage = (pageName === 'chat' || pageName === 'chat-conversation' || pageName === 'chat-review');
    if (backEl) {
      // 返回按钮使用 PAGE_BACK_PARENT（直接父级），隐藏逻辑仍参考 PAGE_PARENT
      var parent = PAGE_PARENT[pageName];
      var backParent = PAGE_BACK_PARENT[pageName] || parent;
      var isTopLevel = (!parent || parent === pageName);
      backEl.style.display = (pageName === 'home' || isTopLevel || isChatPage) ? 'none' : 'block';
      // 返回按钮简洁文案，避免溢出
      if (backParent && backParent !== pageName && !isChatPage) {
        backEl.textContent = '← 返回';
      }
    }
    if (quickEl) {
      quickEl.style.display = (pageName === 'home') ? 'block' : 'none';
    }
    var topbar = document.getElementById('app-topbar');
    if (topbar) {
      topbar.style.display = isChatPage ? 'none' : '';
    }
  }

  /**
   * 绑定顶栏返回按钮和快捷入口事件
   */
  function bindTopbarEvents() {
    var backEl = Utils.dom.get('topbar-back');
    var quickEl = Utils.dom.get('topbar-quick');
    if (backEl) {
      Utils.dom.on(backEl, 'click', function () {
        var backParent = PAGE_BACK_PARENT[currentPage] || PAGE_PARENT[currentPage];
        // 如果当前页有直接父级（无论是否一级页面），回父级；否则回首页
        if (backParent && backParent !== currentPage) {
          window.location.hash = backParent;
        } else {
          window.location.hash = 'home';
        }
      });
    }
    if (quickEl) {
      Utils.dom.on(quickEl, 'click', function () {
        // 触发打开速读卡
        var btn = Utils.dom.get('btn-quick-card');
        if (btn) btn.click();
      });
    }
  }

  /**
   * 导航到指定页面
   * @param {string} pageName - 页面名称（如 'home', 'life' 等）
   */
  function navigateTo(pageName) {
    // 解析 hash 中的查询参数，如 #records?module=communication
    var raw = pageName;
    var qIndex = raw.indexOf('?');
    var basePage = qIndex === -1 ? raw : raw.substring(0, qIndex);
    var queryParams = {};
    if (qIndex !== -1) {
      var qs = raw.substring(qIndex + 1);
      qs.split('&').forEach(function (pair) {
        var parts = pair.split('=');
        if (parts.length === 2) {
          queryParams[decodeURIComponent(parts[0])] = decodeURIComponent(parts[1]);
        }
      });
    }

    // 如果页面不存在则回到首页
    if (!routeMap[basePage]) {
      basePage = 'home';
    }

    // 权限拦截：临时支持者只能访问 supporter-card 和 quick-start
    var user = DataStore.getCurrentUser() || appState.currentUser;
    var role = user ? user.role : '';
    if (role === 'temp_supporter') {
      var allowedPages = ['supporter-card', 'quick-start', 'login', 'quick-record'];
      if (allowedPages.indexOf(basePage) === -1) {
        // 标记权限拒绝，速读卡页显示身份提示
        try { sessionStorage.setItem('ts_access_denied_to', basePage); } catch (e) {}
        basePage = 'supporter-card';
        window.location.hash = '#supporter-card';
        return;
      }
    }

    // 离开 youth-chat 时恢复 viewport + 清理 TTS
    if (currentPage === 'youth-chat' && basePage !== 'youth-chat') {
      if (window.YouthChat && window.YouthChat.destroy) {
        window.YouthChat.destroy();
      }
    }

    // 离开对话页面时恢复全局顶栏
    var isLeavingChat = (currentPage === 'chat' || currentPage === 'chat-conversation' || currentPage === 'chat-review');
    var isEnteringChat = (basePage === 'chat' || basePage === 'chat-conversation' || basePage === 'chat-review');
    if (isLeavingChat && !isEnteringChat) {
      var topbar = document.getElementById('app-topbar');
      if (topbar) topbar.style.display = '';
    }

    // 切换 body 模式
    if (basePage === 'login') {
      document.body.classList.add('mode-login');
      document.body.classList.remove('mode-app');
    } else {
      document.body.classList.add('mode-app');
      document.body.classList.remove('mode-login');
    }

    // 导航时清除残留 toast，避免遮挡新页面
    var toast = document.getElementById('app-toast');
    if (toast) { toast.classList.remove('show'); }

    // 隐藏页面内重复标题（topbar 已提供页面名称）
    // 保留登录页和对话页的标题（这些页面没有 topbar）
    var isChat = (basePage === 'chat' || basePage === 'chat-conversation' || basePage === 'chat-review');
    var hidePageHeader = !(isChat || basePage === 'login');
    document.querySelectorAll('.page-header').forEach(function (h) {
      h.style.display = hidePageHeader ? 'none' : '';
    });

    // 隐藏所有页面section
    var sections = document.querySelectorAll('.page-section');
    sections.forEach(function (section) {
      section.classList.remove('active');
    });

    // 显示目标页面
    var targetSection = document.getElementById(basePage);
    if (targetSection) {
      targetSection.classList.add('active');
    }

    currentPage = basePage;
    appState.currentPage = basePage;

    // 高亮底部导航
    highlightBottomNav(basePage);

    // 更新顶栏标题
    updateTopbar(basePage);

    // 渲染模块二级标签栏
    renderModuleSubNav(basePage);

    // 滚动到页面顶部
    window.scrollTo(0, 0);

    // 根据页面类型调用对应渲染函数（传入查询参数）
    renderPage(basePage, queryParams);

    // 应用当前角色的隐私设置
    window.Permissions.applyPrivacy(currentRole);
  }

  /**
   * 根据页面名称调用对应的渲染函数
   * @param {string} pageName - 页面名称
   */
  function renderPage(pageName, queryParams) {
    queryParams = queryParams || {};
    switch (pageName) {
      case 'home':
        renderHome();
        break;
      case 'life':
        renderLife();
        break;
      case 'communication':
        renderCommunication();
        break;
      case 'emotion':
        renderEmotion();
        break;
      case 'care':
        renderCare();
        break;
      case 'work':
        renderWork();
        break;
      case 'relations':
        renderRelations();
        break;
      case 'timeline':
        window.TimelinePage.renderTimeline();
        break;
      case 'login':
        window.Auth.renderRoleSelect();
        break;
      case 'profile':
        window.AdminPage.render();
        break;
      case 'records':
        window.RecordsPage.renderRecordsPage(queryParams.module || null);
        break;
      case 'charts': window.ChartsPage.renderCharts(); break;
      case 'tasks': renderTasks(); break;
      case 'calendar': renderCalendar(); break;
      case 'archive': window.ProfilePage.renderProfile(); break;
      case 'archive-topics':
        if (window.ArchivePage && window.ArchivePage.renderArchiveTopics) {
          window.ArchivePage.renderArchiveTopics();
        }
        break;
      case 'archive-status':
        if (window.ArchivePage && window.ArchivePage.renderArchiveStatus) {
          window.ArchivePage.renderArchiveStatus();
        }
        break;
      case 'analytics': renderAnalytics(); break;
      case 'quickcard': window.QuickCard.renderPage(); break;
      case 'welcome': window.WelcomePage.renderWelcome(); break;
      case 'grants': window.GrantsPage.renderGrants(); break;
      case 'join': window.JoinRequestPage.renderJoin(); break;
      case 'approvals': window.ApprovalsPage.renderApprovals(); break;
      case 'archive-code': window.ArchiveCodePage.renderArchiveCode(); break;
      case 'chat':
        if (window.ChatUI) window.ChatUI.renderHome();
        break;
      case 'chat-conversation':
        if (window.ChatUI) window.ChatUI.renderConversation();
        break;
      case 'chat-review':
        if (window.ChatUI) window.ChatUI.renderReview();
        break;
      case 'youth-chat':
        if (window.YouthChat) window.YouthChat.render();
        break;
      case 'batch-import':
        if (window.BatchImport) window.BatchImport.render('batch-import-content');
        break;
      case 'admin-users':
        // 管理员用户管理页 — 第二期填充内容
        break;
      case 'admin-data':
        // 管理员系统数据页 — 第二期填充内容
        break;
      case 'quick-start':
        if (window.QuickStartPage) window.QuickStartPage.render();
        break;
      case 'supporter-card':
        if (window.SupporterCardPage) window.SupporterCardPage.render();
        break;
      case 'quick-record':
        if (window.QuickRecordPage) window.QuickRecordPage.render();
        break;
      case 'draft-review':
        if (window.DraftReviewPage) window.DraftReviewPage.render();
        break;
    }
  }

  /* ==========================================================
   * 二、首页渲染
   * ========================================================== */

  /**
   * 渲染首页
   * 在现有静态结构基础上，添加最新动态区域和FAB按钮
   */
  function renderHome() {
    var user = DataStore.getCurrentUser() || appState.currentUser;
    var role = user ? user.role : 'parent';

    // 政府角色无任务模块，重定向到分析总览
    if (role === 'government') {
      window.location.hash = 'analytics';
      return;
    }

    // 渲染Hero区域的基本信息
    var heroNameEl = document.getElementById('hero-name');
    var heroMetaEl = document.getElementById('hero-meta');
    var heroIntroEl = document.getElementById('hero-intro');
    var alertBannerEl = document.getElementById('alert-banner');
    var cardGridEl = document.getElementById('card-grid');

    if (heroNameEl) heroNameEl.textContent = basicInfo.name;
    if (heroMetaEl) heroMetaEl.textContent = basicInfo.age + '岁 · ' + basicInfo.gender + ' · 档案持续更新中';
    if (heroIntroEl) heroIntroEl.textContent = basicInfo.intro;

    // 渲染今日重点提醒 —— 根据角色定制
    if (alertBannerEl) {
      var alertHTML = getRoleAlerts(role);
      // 家长和护理员首页追加实时情绪预警
      if (role === 'parent' || role === 'caregiver') {
        var records = DataStore.getRecords();
        var emotionAlert = analyzeEmotionTrend(records);
        if (emotionAlert.level !== 'normal') {
          alertHTML += '<div class="alert-item ' + (emotionAlert.level === 'warning' ? 'danger' : 'warning') + '">' + emotionAlert.message + '</div>';
        }
      }
      alertBannerEl.innerHTML = alertHTML;

      // 医疗信息冲突检测 — 在提醒区追加红色冲突条
      var medConflict = DataStore.validateMedicalConsistency();
      if (medConflict && (role === 'parent' || role === 'admin')) {
        alertBannerEl.innerHTML += '<div class="alert-item danger" style="display:flex;align-items:center;gap:8px;cursor:pointer;" onclick="window.location.hash=\'care\';">' +
          '<span>⚠️</span><span>医疗信息冲突：用药数据不一致，点击查看</span></div>';
      }
    }

    // 渲染导航卡片 —— 根据角色定制
    if (cardGridEl) {
      var cards = getRoleCards(role);
      var gridHTML = '';
      cards.forEach(function (card) {
        gridHTML += '<div class="nav-card" data-navigate="' + card.hash + '" data-action="' + (card.action || '') + '">';
        gridHTML += '  <span class="card-icon">' + card.icon + '</span>';
        gridHTML += '  <div class="card-title">' + card.title + '</div>';
        gridHTML += '  <div class="card-desc">' + card.desc + '</div>';
        gridHTML += '</div>';
      });
      cardGridEl.innerHTML = gridHTML;

      // 绑定卡片点击事件
      cardGridEl.querySelectorAll('.nav-card').forEach(function (card) {
        card.addEventListener('click', function () {
          var target = this.getAttribute('data-navigate');
          var action = this.getAttribute('data-action');
          if (action === 'quick-card') {
            window.location.hash = 'quickcard';
          } else if (action === 'add-mood') {
            window.RecordsPage.createAddRecordModal(user, role, 'mood');
          } else {
            window.location.hash = target;
          }
        });
      });
    }

    // 渲染待确认记录入口（仅家长/老师/影子老师可见）
    renderPendingDraftBanner(role);

    // 渲染欢迎语（根据当前角色）
    renderWelcomeBanner(user);

    // 渲染最新动态区域
    renderLatestActivity(user);

    // 渲染添加记录浮动按钮
    renderFAB();

    // v2.0：渲染「认识我」卡片（首页核心新增）
    renderKnowMeCard();

    // v2.0：渲染演示工作链（AI发现有效支持经验）
    renderDemoWorkflow();
  }

  /**
   * 获取角色定制的导航卡片配置
   */
  function getRoleCards(role) {
    // 卡片归属标注：module 字段标明该卡片跳转后属于哪个一级 Tab
    var roleCards = {
      parent: [
        // 任务
        { hash: 'tasks', icon: '✅', title: '任务清单', desc: '今日打卡清单与完成进度', module: 'home' },
        { hash: 'calendar', icon: '📆', title: '日程日历', desc: '课程安排、照护提醒', module: 'home' },
        // 档案
        { hash: 'archive', icon: '📋', title: '档案总览', desc: '六大主题档案分类查看', module: 'archive' },
        { hash: 'timeline', icon: '📅', title: '动态时间轴', desc: '所有记录按时间排列', module: 'archive' },
        { hash: 'quickcard', icon: '⚡', title: '速读卡', desc: '快速了解小雨的关键信息', module: 'archive' },
        // 分析
        { hash: 'analytics', icon: '📈', title: '分析总览', desc: '阶段总结、统计导出', module: 'charts' },
        { hash: 'charts', icon: '📊', title: '趋势分析', desc: '心情趋势、统计图表', module: 'charts' },
        // 管理
        { hash: 'grants', icon: '👥', title: '授权管理', desc: '邀请家人、管理权限', module: 'profile' },
        { hash: 'approvals', icon: '📋', title: '加入审批', desc: '审核家庭加入申请', module: 'profile' },
        { hash: 'archive-code', icon: '📱', title: '档案码', desc: '生成分享二维码', module: 'profile' }
      ],
      teacher: [
        // 任务
        { hash: 'tasks', icon: '✅', title: '任务清单', desc: '今日活动、打卡进度', module: 'home' },
        { hash: 'calendar', icon: '📆', title: '日程日历', desc: '课程安排、重要事项', module: 'home' },
        // 档案
        { hash: 'communication', icon: '💬', title: '沟通说明书', desc: '有效话术、禁忌用语', module: 'archive' },
        { hash: 'quickcard', icon: '⚡', title: '速读卡', desc: '快速了解小雨', module: 'archive' },
        // 管理
        { hash: 'join', icon: '👨\u200d👩\u200d👧', title: '加入家庭', desc: '输入邀请码加入', module: 'profile' }
      ],
      caregiver: [
        // 档案（默认落地页）
        { hash: 'quickcard', icon: '⚡', title: '今日速读卡', desc: '照护要点一览', module: 'archive' },
        { hash: 'care', icon: '💊', title: '照护要点', desc: '过敏、用药、作息提醒', module: 'archive' },
        { hash: 'emotion', icon: '🌊', title: '情绪支持', desc: '触发因素、安抚策略', module: 'archive' },
        // 任务
        { hash: 'calendar', icon: '📆', title: '日程日历', desc: '今日安排、照护提醒', module: 'home' },
        // 管理
        { hash: 'join', icon: '👨\u200d👩\u200d👧', title: '加入家庭', desc: '输入邀请码加入', module: 'profile' }
      ],
      youth: [
        { hash: 'mood', icon: '💭', title: '记录心情', desc: '今天心情怎么样？', action: 'add-mood', module: 'home' },
        { hash: 'tasks', icon: '✅', title: '今日任务', desc: '今天要完成的事', module: 'home' },
        { hash: 'calendar', icon: '📆', title: '日程日历', desc: '今天的安排', module: 'home' },
        { hash: 'archive', icon: '📋', title: '我的档案', desc: '查看我的信息', module: 'archive' }
      ],
      government: [
        { hash: 'analytics', icon: '📈', title: '分析总览', desc: '区域数据统计分析', module: 'charts' },
        { hash: 'charts', icon: '📊', title: '宏观数据', desc: '数据趋势与汇总', module: 'charts' }
      ],
      admin: [
        { hash: 'admin-users', icon: '👥', title: '用户管理', desc: '管理系统用户账号', module: 'profile' },
        { hash: 'batch-import', icon: '📥', title: '批量导入', desc: 'CSV批量导入记录数据', module: 'profile' },
        { hash: 'admin-data', icon: '📈', title: '系统数据', desc: '系统运行数据看板', module: 'charts' },
        { hash: 'charts', icon: '📊', title: '数据可视化', desc: '统计图表概览', module: 'charts' }
      ]
    };
    return roleCards[role] || roleCards.parent;
  }

  /**
   * 获取角色定制的今日重点提醒
   */
  function getRoleAlerts(role) {
    var roleAlerts = {
      parent: '<div class="alert-item danger">🚫 严禁海鲜（虾、蟹、贝类）</div>' +
               '<div class="alert-item warning">⏰ 下午15:00 支持性就业练习</div>' +
               '<div class="alert-item info">📋 今日活动已提前告知</div>',
      teacher: '<div class="alert-item danger">🚫 过敏提醒：严禁海鲜</div>' +
               '<div class="alert-item info">💡 用"先...然后..."说明流程</div>' +
               '<div class="alert-item warning">⚠️ 新任务需要步骤卡片辅助</div>',
      caregiver: '<div class="alert-item danger">🚫 严禁海鲜（虾、蟹、贝类）</div>' +
                 '<div class="alert-item warning">⏰ 下午15:00 支持性就业练习</div>' +
                 '<div class="alert-item info">🌙 晚上10点前入睡，注意夜间情绪</div>',
      youth: '<div class="alert-item info">🌟 今天也要加油哦！</div>' +
            '<div class="alert-item warning">✅ 今天有烘焙练习</div>' +
            '<div class="alert-item info">💬 记得记录今天的心情</div>',
      government: '<div class="alert-item info">📊 欢迎查看区域宏观数据</div>' +
                  '<div class="alert-item info">🔒 数据已脱敏处理</div>',
      admin: '<div class="alert-item info">🛡️ 系统管理面板</div>' +
             '<div class="alert-item info">📋 可管理用户和数据</div>'
    };
    return roleAlerts[role] || roleAlerts.parent;
  }

  /**
   * 渲染欢迎语横幅
   */
  function renderWelcomeBanner(user) {
    var existingBanner = document.getElementById('welcome-banner');
    if (existingBanner) existingBanner.remove();

    var heroSection = document.querySelector('.hero-identity-card') || document.getElementById('hero');
    if (!heroSection) return;

    var roleName = user ? (ROLES[user.role] ? ROLES[user.role].label : '访客') : '访客';
    var avatar = user ? (user.avatar || '👤') : '👤';
    var welcomeText = user ? ('欢迎回来，' + (user.name || '用户') + '！') : '欢迎使用AI懂我';

    // 根据角色定制引导信息
    var roleSubTexts = {
      parent: '您可以查看完整档案、添加记录、管理所有信息。',
      teacher: '您可以查看沟通指南、记录教学活动和观察。',
      caregiver: '您可以查看照护要点、记录日常照护和情绪状态。',
      youth: '您可以记录今天的心情和感受，查看今日任务。',
      government: '您可以查看宏观数据统计，数据已脱敏处理。',
      admin: '您可以管理用户账号和系统配置。'
    };
    var subText = user ? (roleSubTexts[user.role] || '您当前以「' + roleName + '」身份登录。') : '请登录后开始记录。';

    var banner = document.createElement('div');
    banner.id = 'welcome-banner';
    banner.style.cssText = 'background:rgba(255,255,255,0.9);border-radius:8px;padding:8px 16px;margin:0 24px 8px;display:flex;align-items:center;gap:8px;box-shadow:0 1px 3px rgba(0,0,0,0.04);font-size:0.82rem;';
    banner.innerHTML =
      '<div style="font-size:1.2rem;">' + avatar + '</div>' +
      '<div style="flex:1;color:#666;">' +
      '  <span style="font-weight:600;color:#333;">' + welcomeText + '</span> ' + subText +
      '</div>' +
      '<a href="#profile" style="color:#4A90D9;text-decoration:none;white-space:nowrap;font-size:0.8rem;">个人中心 →</a>';

    heroSection.parentNode.insertBefore(banner, heroSection.nextSibling);
  }

  /**
   * 渲染最新动态区域
   */
  function renderLatestActivity(user) {
    var existingActivity = document.getElementById('latest-activity');
    if (existingActivity) existingActivity.remove();

    var mainContent = document.querySelector('.main-content');
    var cardGridEl = document.getElementById('card-grid');
    if (!cardGridEl || !mainContent) return;

    var records = DataStore.getRecords();

    // 根据角色过滤可见的记录类型
    var role = user ? user.role : 'parent';
    var roleRecordFilters = {
      parent: null, // 家长看所有记录
      teacher: ['activity', 'communication', 'emotion', 'note'],
      caregiver: ['care', 'emotion', 'note'],
      youth: ['mood', 'note'],
      government: null,
      admin: null
    };
    var allowedTypes = roleRecordFilters[role];
    if (allowedTypes) {
      records = records.filter(function (r) {
        return allowedTypes.indexOf(r.type) !== -1;
      });
    }
    var latestRecords = records.slice(0, 5);

    var activitySection = document.createElement('div');
    activitySection.id = 'latest-activity';
    activitySection.style.cssText = 'padding:0 24px;margin-bottom:24px;';

    var html = '';
    html += '<h2 style="font-size:1rem;color:#333;margin:12px 0 10px;display:flex;align-items:center;gap:8px;">';
    html += '  <span>📰</span>最新动态';
    html += '  <a href="#timeline" style="margin-left:auto;font-size:0.82rem;color:#4A90D9;text-decoration:none;">查看全部 →</a>';
    html += '</h2>';

    if (latestRecords.length === 0) {
      html += '<div style="background:#fff;border-radius:12px;padding:24px;text-align:center;color:#999;font-size:0.9rem;box-shadow:0 1px 4px rgba(0,0,0,0.04);">';
      html += '  <div style="font-size:2rem;margin-bottom:8px;">📝</div>';
      html += '  还没有记录，点击右下角的 + 按钮添加第一条记录吧！';
      html += '</div>';
    } else {
      html += '<div style="display:flex;flex-direction:column;gap:10px;">';
      latestRecords.forEach(function (record) {
        html += renderRecordCard(record, true);
      });
      html += '</div>';
    }

    activitySection.innerHTML = html;
    cardGridEl.parentNode.insertBefore(activitySection, cardGridEl.nextSibling);
  }

  /**
   * 渲染单条记录卡片
   * @param {Object} record - 记录对象
   * @param {boolean} isCompact - 是否紧凑模式
   */
  function renderRecordCard(record, isCompact) {
    var typeInfo = RECORD_TYPES[record.type] || { label: '记录', icon: '📝', color: '#999' };
    var roleInfo = ROLES[record.authorRole] || { color: '#999', avatar: '👤' };
    var dateDisplay = formatDateDisplay(record.date);
    var moodEmoji = '';

    if (record.type === 'mood' && record.mood) {
      var moodOpt = MOOD_OPTIONS.find(function (m) { return m.value === record.mood; });
      if (moodOpt) moodEmoji = moodOpt.emoji + ' ';
    }

    var html = '';
    if (isCompact) {
      html += '<div style="background:#fff;border-radius:12px;padding:14px 16px;box-shadow:0 1px 4px rgba(0,0,0,0.04);border-left:3px solid ' + roleInfo.color + ';display:flex;align-items:flex-start;gap:10px;">';
      html += '  <div style="font-size:1.6rem;flex-shrink:0;">' + (record.authorAvatar || roleInfo.avatar) + '</div>';
      html += '  <div style="flex:1;min-width:0;">';
      html += '    <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;flex-wrap:wrap;">';
      html += '      <span style="font-weight:600;color:#333;font-size:0.9rem;">' + record.author + '</span>';
      html += '      <span style="font-size:0.75rem;color:#fff;background:' + roleInfo.color + ';padding:1px 6px;border-radius:10px;">' + (ROLES[record.authorRole] ? ROLES[record.authorRole].label : record.authorRole) + '</span>';
      html += '      <span style="font-size:0.75rem;color:#aaa;margin-left:auto;white-space:nowrap;">' + dateDisplay + ' ' + record.time + '</span>';
      html += '    </div>';
      html += '    <div style="font-size:0.8rem;color:#888;margin-bottom:2px;">' + typeInfo.icon + ' ' + typeInfo.label + '</div>';
      html += '    <div style="font-size:0.88rem;color:#555;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + moodEmoji + (record.title ? record.title + ' · ' : '') + record.content + '</div>';
      html += '  </div>';
      html += '</div>';
    } else {
      // 完整模式（时间轴用）
      html += '<div class="dynamic-record-card" style="background:#fff;border-radius:12px;padding:16px;margin-bottom:12px;box-shadow:0 1px 6px rgba(0,0,0,0.06);border-left:4px solid ' + roleInfo.color + ';">';
      html += '  <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">';
      html += '    <span style="font-size:1.5rem;">' + (record.authorAvatar || roleInfo.avatar) + '</span>';
      html += '    <span style="font-weight:600;color:#333;">' + record.author + '</span>';
      html += '    <span style="font-size:0.75rem;color:#fff;background:' + roleInfo.color + ';padding:2px 8px;border-radius:10px;">' + (ROLES[record.authorRole] ? ROLES[record.authorRole].label : record.authorRole) + '</span>';
      html += '    <span style="font-size:0.8rem;color:#aaa;margin-left:auto;">' + dateDisplay + ' ' + record.time + '</span>';
      html += '  </div>';
      html += '  <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">';
      html += '    <span style="font-size:0.8rem;padding:2px 8px;border-radius:6px;background:' + typeInfo.color + '15;color:' + typeInfo.color + ';">' + typeInfo.icon + ' ' + typeInfo.label + '</span>';
      if (record.mood) {
        var mOpt = MOOD_OPTIONS.find(function (m) { return m.value === record.mood; });
        if (mOpt) {
          html += '    <span style="font-size:0.8rem;padding:2px 8px;border-radius:6px;background:#f0f0f0;color:#666;">' + mOpt.emoji + ' ' + mOpt.label + '</span>';
        }
      }
      if (record.effectiveness) {
        var effLabels = ['', '无效', '较弱', '一般', '有效', '很有效'];
        var effEmojis = ['', '😞', '🙁', '😐', '🙂', '😄'];
        var effIdx = record.effectiveness;
        if (effIdx >= 1 && effIdx <= 5) {
          html += '    <span style="font-size:0.8rem;padding:2px 8px;border-radius:6px;background:#fff0f6;color:#EB2F96;">' + effEmojis[effIdx] + ' 效果:' + effLabels[effIdx] + '</span>';
        }
      }
      html += '  </div>';
      if (record.title) {
        html += '  <div style="font-weight:600;color:#333;margin-bottom:4px;font-size:0.95rem;">' + record.title + '</div>';
      }
      html += '  <div style="color:#555;font-size:0.9rem;line-height:1.5;">' + record.content + '</div>';
      html += '</div>';
    }

    return html;
  }

  /**
   * 渲染浮动添加按钮（FAB）—— 角色感知，支持快捷操作
   */
  function renderFAB() {
    var existingFab = document.getElementById('fab-add-record');
    if (existingFab) existingFab.remove();
    var existingMenu = document.getElementById('fab-quick-menu');
    if (existingMenu) existingMenu.remove();

    var user = DataStore.getCurrentUser() || appState.currentUser;
    if (!user) return;

    var role = ROLES[user.role];
    if (!role || !role.canAdd || role.canAdd.length === 0) return;

    // 创建FAB容器
    var fabContainer = document.createElement('div');
    fabContainer.id = 'fab-container';
    fabContainer.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:100;';

    // 快捷菜单（展开时显示）
    var quickMenu = document.createElement('div');
    quickMenu.id = 'fab-quick-menu';
    quickMenu.style.cssText = 'position:absolute;bottom:70px;right:0;display:none;flex-direction:column;gap:8px;align-items:flex-end;';

    // 如果只有一种记录类型，直接打开弹窗；多种类型时显示快捷菜单
    if (role.canAdd.length === 1) {
      // 单一类型，FAB直接添加
      var fab1 = document.createElement('button');
      fab1.id = 'fab-add-record';
      var type1 = RECORD_TYPES[role.canAdd[0]];
      fab1.innerHTML = type1.icon + ' +';
      fab1.style.cssText = 'width:56px;height:56px;border-radius:50%;background:' + type1.color + ';color:#fff;font-size:22px;border:none;box-shadow:0 4px 12px ' + type1.color + '66;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.3s;';
      fab1.addEventListener('click', function () {
        addRecordState.selectedType = role.canAdd[0];
        var overlay = document.getElementById('add-record-modal');
        if (!overlay) overlay = window.RecordsPage.createAddRecordModal();
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        window.RecordsPage.renderAddRecordStep2(user, role, role.canAdd[0]);
      });
      fabContainer.appendChild(fab1);
    } else {
      // 多类型，FAB点击展开快捷菜单
      var fab = document.createElement('button');
      fab.id = 'fab-add-record';
      fab.textContent = '+';
      fab.style.cssText = 'width:56px;height:56px;border-radius:50%;background:#4A90D9;color:#fff;font-size:28px;border:none;box-shadow:0 4px 12px rgba(74,144,217,0.4);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.3s;';

      // 构建快捷菜单项
      role.canAdd.forEach(function (typeKey) {
        var type = RECORD_TYPES[typeKey];
        if (!type) return;
        var item = document.createElement('div');
        item.style.cssText = 'display:flex;align-items:center;gap:8px;cursor:pointer;padding:8px 14px;background:#fff;border-radius:24px;box-shadow:0 2px 8px rgba(0,0,0,0.12);transition:all 0.2s;';
        item.innerHTML = '<span style="font-size:1.2rem;">' + type.icon + '</span><span style="font-size:0.85rem;color:#333;">' + type.label + '</span>';
        item.addEventListener('mouseenter', function () {
          this.style.background = type.color + '15';
        });
        item.addEventListener('mouseleave', function () {
          this.style.background = '#fff';
        });
        item.addEventListener('click', function () {
          quickMenu.style.display = 'none';
          fab.textContent = '+';
          fab.style.transform = 'rotate(0deg)';
          addRecordState.selectedType = typeKey;
          var overlay = document.getElementById('add-record-modal');
          if (!overlay) overlay = window.RecordsPage.createAddRecordModal();
          overlay.classList.add('active');
          document.body.style.overflow = 'hidden';
          window.RecordsPage.renderAddRecordStep2(user, role, typeKey);
        });
        quickMenu.appendChild(item);
      });

      // "更多"选项
      var moreItem = document.createElement('div');
      moreItem.style.cssText = 'display:flex;align-items:center;gap:8px;cursor:pointer;padding:8px 14px;background:#fff;border-radius:24px;box-shadow:0 2px 8px rgba(0,0,0,0.12);transition:all 0.2s;';
      moreItem.innerHTML = '<span style="font-size:1.2rem;">📋</span><span style="font-size:0.85rem;color:#333;">全部类型</span>';
      moreItem.addEventListener('click', function () {
        quickMenu.style.display = 'none';
        fab.textContent = '+';
        fab.style.transform = 'rotate(0deg)';
        window.RecordsPage.openAddRecordModal();
      });
      quickMenu.appendChild(moreItem);

      fab.addEventListener('click', function () {
        var isVisible = quickMenu.style.display === 'flex';
        if (isVisible) {
          quickMenu.style.display = 'none';
          fab.style.transform = 'rotate(0deg)';
        } else {
          quickMenu.style.display = 'flex';
          fab.style.transform = 'rotate(45deg)';
        }
      });

      fabContainer.appendChild(quickMenu);
      fabContainer.appendChild(fab);
    }

    document.body.appendChild(fabContainer);
  }

  /* ==========================================================
   * 三、"我喜欢的生活"页面渲染
   * ========================================================== */

  /**
   * 渲染"我喜欢的生活"页面 — 四层模型
   * L1: 当前兴趣与偏好 | L2: 最近变化 | L3: 关键事件 | L4: 全部记录
   */
  function renderLife() {
    var contentArea = document.getElementById('life-content');
    if (!contentArea) return;
    renderTopicFourLayer(contentArea, 'life', {
      l1Title: '📌 当前摘要',
      l1Sub: '当前已确认的兴趣偏好、日常安排与周末假期活动',
      emptyText: '暂无生活记录'
    });
  }

  /* ==========================================================
   * 四、沟通说明书页面渲染
   * ========================================================== */

  /**
   * 渲染沟通说明书页面 — 四层模型（L1-L4）
   */
  function renderCommunication() {
    var contentArea = document.getElementById('communication-content');
    if (!contentArea) return;

    var records = getCommRecords();
    var now = new Date();

    var html = '';
    html += '<div class="comm-four-layer">';

    // ====== L1: 当前摘要 ======
    var l1 = buildL1Summary(records);
    html += '<div class="comm-layer comm-layer-l1">';
    html += '  <div class="comm-layer-title">📌 当前摘要</div>';
    html += '  <div class="comm-layer-sub">当前怎样和他沟通最有效</div>';
    if (l1.length > 0) {
      l1.forEach(function (item) {
        html += '  <div class="comm-l1-item" data-rid="' + item.rid + '">';
        html += '    <div class="comm-l1-text">' + item.text + '</div>';
        html += '    <div class="comm-l1-meta">';
        html += '      <span class="comm-source-badge ' + item.statusClass + '">' + item.statusLabel + '</span>';
        html += '      <span class="comm-source-info">来源：' + item.author + ' · ' + item.dateDisplay + '</span>';
        html += '      <a class="comm-view-evidence" data-rid="' + item.rid + '">查看依据 →</a>';
        html += '    </div>';
        html += '  </div>';
      });
    } else {
      html += '  <div class="comm-empty">暂无摘要数据</div>';
    }
    html += '</div>';

    // ====== L2: 最近变化 ======
    html += '<div class="comm-layer comm-layer-l2">';
    html += '  <div class="comm-layer-title">🕐 最近变化</div>';
    html += '  <div class="comm-time-tabs" id="comm-time-tabs">';
    ['7天', '30天', '3个月', '半年'].forEach(function (label, i) {
      var activeClass = (i === 0) ? ' active' : '';
      html += '    <button class="comm-time-tab' + activeClass + '" data-range="' + i + '">' + label + '</button>';
    });
    html += '  </div>';
    html += '  <div id="comm-l2-content"></div>';
    html += '</div>';

    // ====== L3: 关键事件 ======
    var l3 = buildL3Events(records);
    html += '<div class="comm-layer comm-layer-l3">';
    html += '  <div class="comm-layer-title">⚡ 关键事件</div>';
    html += '  <div class="comm-layer-sub">值得关注的变化节点</div>';
    if (l3.length > 0) {
      l3.forEach(function (evt) {
        html += '  <div class="comm-l3-item">';
        html += '    <div class="comm-l3-header">';
        html += '      <span class="comm-l3-icon">' + evt.icon + '</span>';
        html += '      <span class="comm-l3-type">' + evt.typeLabel + '</span>';
        html += '      <span class="comm-l3-date">' + evt.dateDisplay + '</span>';
        html += '    </div>';
        html += '    <div class="comm-l3-text">' + evt.text + '</div>';
        html += '    <div class="comm-l3-source">来源：' + evt.author + '（' + evt.roleLabel + '）';
        if (evt.rid) {
          html += ' <a class="comm-view-evidence" data-rid="' + evt.rid + '">查看依据 →</a>';
        }
        html += '    </div>';
        html += '  </div>';
      });
    } else {
      html += '  <div class="comm-empty">暂未检测到关键事件</div>';
    }
    html += '</div>';

    // ====== L4: 全部记录 ======
    html += '<div class="comm-layer comm-layer-l4">';
    html += '  <div class="comm-layer-title">📋 全部记录</div>';
    html += '  <div id="comm-l4-content"></div>';
    html += '</div>';

    html += '</div>';
    contentArea.innerHTML = html;

    // 首次渲染 L2 和 L4
    renderL2Content(0, records);
    renderL4Content(records);

    // 绑定 L2 时间范围切换
    var timeTabs = document.getElementById('comm-time-tabs');
    if (timeTabs) {
      timeTabs.addEventListener('click', function (e) {
        var tab = e.target.closest('.comm-time-tab');
        if (!tab) return;
        timeTabs.querySelectorAll('.comm-time-tab').forEach(function (t) { t.classList.remove('active'); });
        tab.classList.add('active');
        renderL2Content(parseInt(tab.getAttribute('data-range')), records);
      });
    }

    // 绑定"查看依据"事件
    contentArea.addEventListener('click', function (e) {
      var evidence = e.target.closest('.comm-view-evidence');
      if (!evidence) return;
      var rid = evidence.getAttribute('data-rid');
      if (rid) showRecordDetail(rid);
    });
  }

  /* ==========================================================
   * 沟通模块数据层 — 四层模型分析函数
   * ========================================================== */

  /** 获取沟通模块全部记录，按日期倒序 */
  function getCommRecords() {
    var all = DataStore.getRecords();
    return all.filter(function (r) { return r.module === 'communication'; })
              .sort(function (a, b) { return (b.date + b.time).localeCompare(a.date + a.time); });
  }

  var STATUS_CONFIG = {
    youth:    { label: '💬 自述',     cls: 'source-self' },
    parent:   { label: '✅ 已确认',   cls: 'source-confirmed' },
    teacher:  { label: '✅ 已确认',   cls: 'source-confirmed' },
    caregiver:{ label: '✅ 已确认',   cls: 'source-confirmed' }
  };

  var ROLE_LABELS = { youth: '心青年', parent: '家长', teacher: '老师', caregiver: '影子老师' };

  /**
   * L1 当前摘要 — 从记录中提取 3-7 条当前有效沟通结论
   * 规则驱动：取最近有效策略 + 稳定偏好 + 注意事项
   */
  function buildL1Summary(records) {
    var items = [];

    // 1. 取效果最好的策略（effectiveness >= 4）
    var goodStrategies = records.filter(function (r) {
      return r.type === 'strategy' && r.effectiveness >= 4;
    }).slice(0, 3);
    goodStrategies.forEach(function (r) {
      var sc = STATUS_CONFIG[r.authorRole] || { label: '📝 待确认', cls: 'source-observer' };
      items.push({
        text: '「' + (r.title || r.content.substring(0, 20)) + '」效果较好',
        author: r.author, dateDisplay: formatDateDisplay(r.date),
        statusLabel: sc.label, statusClass: sc.cls, rid: r.id
      });
    });

    // 2. 取最近沟通指南类观察
    var guideRecords = records.filter(function (r) {
      return r.type === 'communication' && r.title === '有效策略';
    }).slice(0, 2);
    guideRecords.forEach(function (r) {
      items.push({
        text: r.content.substring(0, 60) + (r.content.length > 60 ? '...' : ''),
        author: r.author, dateDisplay: formatDateDisplay(r.date),
        statusLabel: '✅ 已确认', statusClass: 'source-confirmed', rid: r.id
      });
    });

    // 3. 取心青年本人的重要自述
    var youthRecords = records.filter(function (r) { return r.authorRole === 'youth'; });
    if (youthRecords.length > 0) {
      var yr = youthRecords[0];
      items.push({
        text: yr.content.substring(0, 60) + (yr.content.length > 60 ? '...' : ''),
        author: yr.author, dateDisplay: formatDateDisplay(yr.date),
        statusLabel: '💬 自述', statusClass: 'source-self', rid: yr.id
      });
    }

    // 限制 3-7 条
    return items.slice(0, 7);
  }

  /**
   * L2 最近变化 — 按时间范围对比，给出人话总结
   */
  function renderL2Content(rangeIdx, records) {
    var container = document.getElementById('comm-l2-content');
    if (!container) return;

    var ranges = [
      { days: 7,   label: '近7天' },
      { days: 30,  label: '近30天' },
      { days: 90,  label: '近3个月' },
      { days: 180, label: '近半年' }
    ];
    var range = ranges[rangeIdx] || ranges[0];
    var cutoff = dateDaysAgo(range.days);
    var recent = records.filter(function (r) { return r.date >= cutoff; });

    var html = '';

    // 策略统计
    var strategies = recent.filter(function (r) { return r.type === 'strategy'; });
    var obsCount = recent.filter(function (r) { return r.type === 'communication'; }).length;
    var avgEff = strategies.length > 0
      ? (strategies.reduce(function (s, r) { return s + (r.effectiveness || 0); }, 0) / strategies.length).toFixed(1)
      : 0;

    html += '<div class="comm-l2-summary">';
    if (recent.length === 0) {
      html += '<p>' + range.label + '暂无沟通记录。</p>';
    } else {
      html += '<p>' + range.label + '共 ' + recent.length + ' 条记录（观察 ' + obsCount + ' 条';
      if (strategies.length > 0) {
        html += '，策略评估 ' + strategies.length + ' 次，平均效果 ' + avgEff + '/5';
      }
      html += '）。</p>';
    }
    html += '</div>';

    // 简易趋势：列出该时间段内的记录摘要
    if (recent.length > 0) {
      html += '<div class="comm-l2-items">';
      recent.slice(0, 5).forEach(function (r) {
        var icon = r.type === 'strategy' ? '🧩' : '📝';
        var text = (r.title || r.content || '').substring(0, 50);
        html += '<div class="comm-l2-item">';
        html += '  <span>' + icon + '</span>';
        html += '  <span class="comm-l2-item-text">' + text + '</span>';
        html += '  <span class="comm-l2-item-date">' + formatDateDisplay(r.date) + '</span>';
        if (r.effectiveness) {
          html += '  <span class="comm-l2-eff">效果 ' + r.effectiveness + '/5</span>';
        }
        html += '</div>';
      });
      html += '</div>';
    }

    container.innerHTML = html;
  }

  /**
   * L3 关键事件 — 6 条规则驱动识别
   */
  function buildL3Events(records) {
    var events = [];
    var today = new Date();

    // 规则1: 首次记录
    if (records.length > 0) {
      var first = records[records.length - 1];
      events.push({
        icon: '🆕', typeLabel: '首次记录',
        text: '第一次记录沟通观察：' + (first.content || '').substring(0, 40) + '...',
        dateDisplay: formatDateDisplay(first.date),
        author: first.author, roleLabel: ROLE_LABELS[first.authorRole] || first.authorRole,
        rid: first.id
      });
    }

    // 规则2: 策略有效（最近30天内 effectiveness >= 4）
    var cutoff30 = dateDaysAgo(30);
    var effectiveStrategies = records.filter(function (r) {
      return r.type === 'strategy' && r.effectiveness >= 4 && r.date >= cutoff30;
    });
    if (effectiveStrategies.length > 0) {
      var es = effectiveStrategies[0];
      events.push({
        icon: '✅', typeLabel: '策略有效',
        text: '「' + (es.title || '') + '」被记录为有效（效果 ' + es.effectiveness + '/5）',
        dateDisplay: formatDateDisplay(es.date),
        author: es.author, roleLabel: ROLE_LABELS[es.authorRole] || es.authorRole,
        rid: es.id
      });
    }

    // 规则3: 心青年首次主动表达
    var youthRecs = records.filter(function (r) { return r.authorRole === 'youth'; });
    if (youthRecs.length > 0) {
      var yr = youthRecs[0];
      events.push({
        icon: '💬', typeLabel: '本人参与',
        text: '心青年本人第一次记录沟通偏好：' + (yr.content || '').substring(0, 40) + '...',
        dateDisplay: formatDateDisplay(yr.date),
        author: yr.author, roleLabel: '心青年',
        rid: yr.id
      });
    }

    // 规则4: 连续7天内有3条以上策略记录，说明近期在密集尝试
    var cutoff7 = dateDaysAgo(7);
    var recentStrategies = records.filter(function (r) {
      return r.type === 'strategy' && r.date >= cutoff7;
    });
    if (recentStrategies.length >= 3) {
      events.push({
        icon: '📊', typeLabel: '密集尝试',
        text: '近7天记录了 ' + recentStrategies.length + ' 次沟通策略尝试，正在密集测试最佳方式',
        dateDisplay: '近7天',
        author: '多来源',
        roleLabel: '',
        rid: null
      });
    }

    // 规则5: 与早期相比有明显变化（策略有效性提升）
    var cutoff90 = dateDaysAgo(90);
    var earlyStrategies = records.filter(function (r) {
      return r.type === 'strategy' && r.date < cutoff90;
    });
    var recentGoodStrategies = records.filter(function (r) {
      return r.type === 'strategy' && r.effectiveness >= 4 && r.date >= cutoff90;
    });
    if (earlyStrategies.length === 0 && recentGoodStrategies.length >= 3) {
      events.push({
        icon: '📈', typeLabel: '明显变化',
        text: '近期开始系统记录策略效果（' + recentGoodStrategies.length + '次），此前无策略记录',
        dateDisplay: '近3个月',
        author: '系统',
        roleLabel: '',
        rid: null
      });
    }

    // 规则6: 信息冲突检测
    var conflictDates = {};
    records.forEach(function(r) {
      if (!conflictDates[r.date]) conflictDates[r.date] = new Set();
      conflictDates[r.date].add(r.author);
    });
    var conflictCount = 0;
    Object.keys(conflictDates).forEach(function(d) {
      if (conflictDates[d].size > 1) conflictCount++;
    });
    if (conflictCount > 0) {
      events.push({
        icon: '⚠️', typeLabel: '信息冲突待核实',
        text: '有 ' + conflictCount + ' 天存在多角色同日记录，建议核实不同视角的观察是否一致',
        dateDisplay: '全时段', author: '系统', roleLabel: '', rid: null
      });
    } else {
      events.push({
        icon: '🔒', typeLabel: '信息一致',
        text: '未检测到同日内多角色记录冲突',
        dateDisplay: '全时段', author: '系统', roleLabel: '', rid: null
      });
    }

    return events;
  }

  /**
   * L4 全部记录 — 按今天/本周/本月/更早分组，可展开
   */
  function renderL4Content(records) {
    var container = document.getElementById('comm-l4-content');
    if (!container) return;

    var now = new Date();
    var today = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
    var weekCutoff = dateDaysAgo(7);
    var monthCutoff = dateDaysAgo(30);

    var groups = [
      { label: '今天', filter: function (r) { return r.date === today; }, icon: '📍' },
      { label: '本周', filter: function (r) { return r.date >= weekCutoff && r.date !== today; }, icon: '📅' },
      { label: '本月', filter: function (r) { return r.date >= monthCutoff && r.date < weekCutoff; }, icon: '📆' },
      { label: '更早', filter: function (r) { return r.date < monthCutoff; }, icon: '📁' }
    ];

    var html = '';

    groups.forEach(function (group) {
      var groupRecords = records.filter(group.filter);
      if (groupRecords.length === 0) return;

      html += '<div class="comm-l4-group" data-group="' + group.label + '">';
      html += '  <div class="comm-l4-group-header">';
      html += '    <span class="comm-l4-group-icon">' + group.icon + '</span>';
      html += '    <span class="comm-l4-group-label">' + group.label + '</span>';
      html += '    <span class="comm-l4-group-count">' + groupRecords.length + '条</span>';
      html += '    <span class="comm-l4-toggle">▾</span>';
      html += '  </div>';
      html += '  <div class="comm-l4-group-body">';

      // 同日聚合
      var dateGroups = {};
      groupRecords.forEach(function (r) {
        if (!dateGroups[r.date]) dateGroups[r.date] = [];
        dateGroups[r.date].push(r);
      });

      Object.keys(dateGroups).sort().reverse().forEach(function (date) {
        var dayRecords = dateGroups[date];
        html += '    <div class="comm-l4-day">';
        html += '      <div class="comm-l4-day-header">' + formatDateDisplay(date) + ' · ' + dayRecords.length + '条</div>';
        dayRecords.forEach(function (r) {
          var typeIcon = r.type === 'strategy' ? '🧩' : '📝';
          var authorInfo = (r.author || '') + '（' + (ROLE_LABELS[r.authorRole] || r.authorRole) + '）';
          html += '      <div class="comm-l4-record">';
          html += '        <span class="comm-l4-type">' + typeIcon + '</span>';
          html += '        <div class="comm-l4-record-body">';
          if (r.title) {
            html += '          <div class="comm-l4-record-title">' + r.title + '</div>';
          }
          html += '          <div class="comm-l4-record-text">' + (r.content || '') + '</div>';
          html += '          <div class="comm-l4-record-meta">' + authorInfo + ' · ' + (r.time || '') + '</div>';
          html += '        </div>';
          html += '      </div>';
        });
        html += '    </div>';
      });

      html += '  </div>';
      html += '</div>';
    });

    if (!html) {
      html = '<div class="comm-empty">暂无记录</div>';
    }

    container.innerHTML = html;

    // 绑定展开/折叠
    container.addEventListener('click', function (e) {
      var header = e.target.closest('.comm-l4-group-header');
      if (!header) return;
      var group = header.closest('.comm-l4-group');
      var body = group.querySelector('.comm-l4-group-body');
      var toggle = group.querySelector('.comm-l4-toggle');
      if (body.style.display === 'none') {
        body.style.display = '';
        toggle.textContent = '▾';
      } else {
        body.style.display = 'none';
        toggle.textContent = '▸';
      }
    });
  }

  /**
   * 显示单条记录详情（弹层）
   */
  function showRecordDetail(recordId) {
    var all = DataStore.getRecords();
    var record = all.find(function (r) { return r.id === recordId; });
    if (!record) return;

    var typeName = C.RECORD_TYPES[record.type] ? C.RECORD_TYPES[record.type].label : record.type;
    var roleLabel = ROLE_LABELS[record.authorRole] || record.authorRole;

    var overlay = document.createElement('div');
    overlay.className = 'comm-record-overlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.4);z-index:200;display:flex;align-items:flex-end;justify-content:center;';
    overlay.addEventListener('click', function (ev) {
      if (ev.target === overlay) overlay.remove();
    });

    overlay.innerHTML =
      '<div class="comm-record-drawer" style="background:#fff;border-radius:20px 20px 0 0;max-width:500px;width:100%;max-height:80vh;overflow-y:auto;padding:24px 20px 32px;box-shadow:0 -4px 24px rgba(0,0,0,0.15);">' +
      '  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">' +
      '    <span style="font-weight:600;font-size:1rem;">📋 原始记录</span>' +
      '    <button style="background:none;border:none;font-size:1.5rem;cursor:pointer;padding:0 8px;" onclick="this.closest(\'.comm-record-overlay\').remove()">×</button>' +
      '  </div>' +
      '  <div style="margin-bottom:12px;">' +
      '    <span class="comm-source-badge source-confirmed" style="margin-right:8px;">' + typeName + '</span>' +
      '    <span style="font-size:0.85rem;color:var(--text-muted);">' + record.date + ' ' + (record.time || '') + '</span>' +
      '  </div>' +
      (record.title ? '  <div style="font-weight:600;font-size:1rem;margin-bottom:8px;">' + record.title + '</div>' : '') +
      '  <div style="font-size:0.9rem;line-height:1.7;color:var(--text-primary);margin-bottom:16px;">' + (record.content || '') + '</div>' +
      (record.effectiveness ? '  <div style="margin-bottom:12px;"><span style="font-size:0.85rem;color:var(--text-muted);">策略效果：</span><span style="font-weight:600;">' + record.effectiveness + '/5</span></div>' : '') +
      '  <div style="font-size:0.82rem;color:var(--text-muted);border-top:1px solid #eee;padding-top:12px;">' +
      '    <span>记录人：' + (record.author || '') + '（' + roleLabel + '）</span>' +
      '  </div>' +
      '</div>';

    document.body.appendChild(overlay);
  }

  /** 返回 N 天前的日期字符串 */
  function dateDaysAgo(days) {
    var d = new Date();
    d.setDate(d.getDate() - days);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  /* ==========================================================
   * 通用四层模型渲染引擎（#life / #emotion / #care / #work / #relations 复用）
   * ========================================================== */

  /** 主题配置：摘要标题 + L3 规则集 */
  var TOPIC_CONFIG = {
    life: {
      l1Rules: function(records) { return buildLifeL1(records); },
      l3Rules: function(records) { return buildLifeL3(records); }
    },
    emotion: {
      l1Rules: function(records) { return buildEmotionL1(records); },
      l3Rules: function(records) { return buildEmotionL3(records); }
    },
    care: {
      l1Rules: function(records) { return buildCareL1(records); },
      l3Rules: function(records) { return buildCareL3(records); }
    },
    work: {
      l1Rules: function(records) { return buildWorkL1(records); },
      l3Rules: function(records) { return buildWorkL3(records); }
    },
    relations: {
      l1Rules: function(records) { return buildRelationsL1(records); },
      l3Rules: function(records) { return buildRelationsL3(records); }
    }
  };

  function getTopicRecords(moduleKey) {
    var all = DataStore.getRecords();
    return all.filter(function(r) { return r.module === moduleKey; })
              .sort(function(a, b) { return (b.date + b.time).localeCompare(a.date + a.time); });
  }

  function renderTopicFourLayer(contentArea, moduleKey, opts) {
    var records = getTopicRecords(moduleKey);
    var config = TOPIC_CONFIG[moduleKey] || {};
    var html = '';
    html += '<div class="comm-four-layer">';

    // L1
    var l1 = config.l1Rules ? config.l1Rules(records) : [];
    html += '<div class="comm-layer comm-layer-l1">';
    html += '  <div class="comm-layer-title">' + (opts.l1Title || '📌 当前摘要') + '</div>';
    html += '  <div class="comm-layer-sub">' + (opts.l1Sub || '') + '</div>';
    if (l1.length > 0) {
      l1.forEach(function(item) {
        html += '<div class="comm-l1-item">';
        html += '  <div class="comm-l1-text">' + item.text + '</div>';
        html += '  <div class="comm-l1-meta">';
        html += '    <span class="comm-source-badge ' + (item.statusClass || 'source-confirmed') + '">' + (item.statusLabel || '已确认') + '</span>';
        html += '    <span class="comm-source-info">' + (item.source || '') + '</span>';
        html += '  </div>';
        html += '</div>';
      });
    } else {
      html += '<div class="comm-empty">' + (opts.emptyText || '暂无数据') + '</div>';
    }
    html += '</div>';

    // L2
    html += '<div class="comm-layer comm-layer-l2">';
    html += '  <div class="comm-layer-title">🕐 最近变化</div>';
    html += '  <div class="comm-time-tabs" id="topic-time-tabs">';
    ['7天', '30天', '3个月', '半年'].forEach(function(label, i) {
      html += '    <button class="comm-time-tab' + (i === 0 ? ' active' : '') + '" data-range="' + i + '">' + label + '</button>';
    });
    html += '  </div>';
    html += '  <div id="topic-l2-content"></div>';
    html += '</div>';

    // L3
    var l3 = config.l3Rules ? config.l3Rules(records) : [];
    html += '<div class="comm-layer comm-layer-l3">';
    html += '  <div class="comm-layer-title">⚡ 关键事件</div>';
    html += '  <div class="comm-layer-sub">值得关注的变化节点</div>';
    if (l3.length > 0) {
      l3.forEach(function(evt) {
        html += '<div class="comm-l3-item">';
        html += '  <div class="comm-l3-header">';
        html += '    <span class="comm-l3-icon">' + (evt.icon || '📌') + '</span>';
        html += '    <span class="comm-l3-type">' + (evt.typeLabel || '') + '</span>';
        html += '    <span class="comm-l3-date">' + (evt.dateDisplay || '') + '</span>';
        html += '  </div>';
        html += '  <div class="comm-l3-text">' + (evt.text || '') + '</div>';
        html += '  <div class="comm-l3-source">' + (evt.source || '') + '</div>';
        html += '</div>';
      });
    } else {
      html += '<div class="comm-empty">暂未检测到关键事件</div>';
    }
    html += '</div>';

    // L4
    html += '<div class="comm-layer comm-layer-l4">';
    html += '  <div class="comm-layer-title">📋 全部记录</div>';
    html += '  <div id="topic-l4-content"></div>';
    html += '</div>';

    html += '</div>';
    contentArea.innerHTML = html;

    // 渲染 L2 和 L4（传入 contentArea 做作用域查询，避免多页面 ID 冲突）
    renderGenericL2Content(contentArea, 'topic-l2-content', records);
    renderGenericL4Content(contentArea, 'topic-l4-content', records);

    // L2 时间切换
    var tabs = contentArea.querySelector('#topic-time-tabs');
    if (tabs) {
      tabs.addEventListener('click', function(e) {
        var tab = e.target.closest('.comm-time-tab');
        if (!tab) return;
        tabs.querySelectorAll('.comm-time-tab').forEach(function(t) { t.classList.remove('active'); });
        tab.classList.add('active');
        renderGenericL2Content(contentArea, 'topic-l2-content', records, parseInt(tab.getAttribute('data-range')));
      });
    }
  }

  function renderGenericL2Content(contentArea, containerId, records, rangeIdx) {
    rangeIdx = rangeIdx || 0;
    var container = contentArea.querySelector('#' + containerId);
    if (!container) return;
    var ranges = [{ days: 7, label: '近7天' }, { days: 30, label: '近30天' }, { days: 90, label: '近3个月' }, { days: 180, label: '近半年' }];
    var range = ranges[rangeIdx] || ranges[0];
    var cutoff = dateDaysAgo(range.days);
    var recent = records.filter(function(r) { return r.date >= cutoff; });
    var html = '<div class="comm-l2-summary"><p>' + range.label + '共 ' + recent.length + ' 条记录。</p></div>';
    if (recent.length > 0) {
      html += '<div class="comm-l2-items">';
      recent.slice(0, 6).forEach(function(r) {
        var text = (r.title || r.content || '').substring(0, 50);
        html += '<div class="comm-l2-item"><span>📝</span><span class="comm-l2-item-text">' + text + '</span><span class="comm-l2-item-date">' + formatDateDisplay(r.date) + '</span></div>';
      });
      html += '</div>';
    }
    container.innerHTML = html;
  }

  function renderGenericL4Content(contentArea, containerId, records) {
    var container = contentArea.querySelector('#' + containerId);
    if (!container) return;
    var today = dateDaysAgo(0), weekCutoff = dateDaysAgo(7), monthCutoff = dateDaysAgo(30);
    var groups = [
      { label: '今天', filter: function(r) { return r.date === today; }, icon: '📍' },
      { label: '本周', filter: function(r) { return r.date >= weekCutoff && r.date !== today; }, icon: '📅' },
      { label: '本月', filter: function(r) { return r.date >= monthCutoff && r.date < weekCutoff; }, icon: '📆' },
      { label: '更早', filter: function(r) { return r.date < monthCutoff; }, icon: '📁' }
    ];
    var html = '';
    groups.forEach(function(group) {
      var gr = records.filter(group.filter);
      if (gr.length === 0) return;
      html += '<div class="comm-l4-group">';
      html += '<div class="comm-l4-group-header"><span class="comm-l4-group-icon">' + group.icon + '</span><span class="comm-l4-group-label">' + group.label + '</span><span class="comm-l4-group-count">' + gr.length + '条</span><span class="comm-l4-toggle">▾</span></div>';
      html += '<div class="comm-l4-group-body">';
      var dg = {};
      gr.forEach(function(r) { if (!dg[r.date]) dg[r.date] = []; dg[r.date].push(r); });
      Object.keys(dg).sort().reverse().forEach(function(date) {
        html += '<div class="comm-l4-day"><div class="comm-l4-day-header">' + formatDateDisplay(date) + ' · ' + dg[date].length + '条</div>';
        dg[date].forEach(function(r) {
          html += '<div class="comm-l4-record"><span class="comm-l4-type">📝</span><div class="comm-l4-record-body">';
          if (r.title) html += '<div class="comm-l4-record-title">' + r.title + '</div>';
          html += '<div class="comm-l4-record-text">' + (r.content || '') + '</div>';
          html += '<div class="comm-l4-record-meta">' + (r.author || '') + ' · ' + (r.time || '') + '</div>';
          html += '</div></div>';
        });
        html += '</div>';
      });
      html += '</div></div>';
    });
    if (!html) html = '<div class="comm-empty">暂无记录</div>';
    container.innerHTML = html;
    container.addEventListener('click', function(e) {
      var hdr = e.target.closest('.comm-l4-group-header');
      if (!hdr) return;
      var body = hdr.nextElementSibling, toggle = hdr.querySelector('.comm-l4-toggle');
      if (body.style.display === 'none') { body.style.display = ''; toggle.textContent = '▾'; }
      else { body.style.display = 'none'; toggle.textContent = '▸'; }
    });
  }

  /* ==========================================================
   * 各主题 L1/L3 规则（按阶段三最终修订）
   * ========================================================== */

  function buildLifeL1(records) {
    var items = [];
    // 兴趣与活动
    var interestRecs = records.filter(function(r) { return r.title === '烘焙兴趣' || r.title === '电子琴练习' || r.title === '新爱好'; });
    interestRecs.slice(0, 2).forEach(function(r) {
      items.push({ text: r.content.substring(0, 80), source: '来源：' + r.author + ' · ' + formatDateDisplay(r.date), statusLabel: '已确认', statusClass: 'source-confirmed' });
    });
    // 日常安排
    var routineRecs = records.filter(function(r) { return r.title === '周末安排' || r.title === '假期安排'; });
    routineRecs.slice(0, 2).forEach(function(r) {
      items.push({ text: r.content.substring(0, 80), source: '来源：' + r.author + ' · ' + formatDateDisplay(r.date), statusLabel: '已确认', statusClass: 'source-confirmed' });
    });
    // 稳定偏好（多次出现）
    var stable = records.filter(function(r) { return r.content.indexOf('公交车') >= 0; });
    if (stable.length >= 2) {
      items.push({ text: '较稳定兴趣线索：对公交车、火车等交通工具持续感兴趣（' + stable.length + '次记录）', source: '多来源观察 · 待本人确认', statusLabel: '待确认', statusClass: 'source-observer' });
    }
    return items.slice(0, 6);
  }

  function buildLifeL3(records) {
    var events = [];
    var cutoff60 = dateDaysAgo(60);
    if (records.length > 0) {
      var first = records[records.length - 1];
      events.push({ icon: '🆕', typeLabel: '首次记录', text: '第一次记录生活偏好：' + (first.content || '').substring(0, 40), dateDisplay: formatDateDisplay(first.date), source: '来源：' + first.author });
    }
    // 明显变化
    var cutoff90 = dateDaysAgo(90);
    var recent = records.filter(function(r) { return r.date >= cutoff90; });
    var old = records.filter(function(r) { return r.date < cutoff90; });
    if (recent.length >= 3 && old.length > 0) {
      events.push({ icon: '📈', typeLabel: '明显变化', text: '近3个月新增 ' + recent.length + ' 条生活记录，包括新爱好（拍照）和新周末活动', dateDisplay: '近3个月', source: '来源：系统' });
    }
    // 信息冲突
    var conflictFound = false;
    for (var i = 0; i < records.length && !conflictFound; i++) {
      for (var j = i + 1; j < records.length && !conflictFound; j++) {
        if (records[i].author !== records[j].author && records[i].date === records[j].date) { conflictFound = true; }
      }
    }
    if (!conflictFound) {
      events.push({ icon: '🔒', typeLabel: '信息一致', text: '近30天内生活偏好记录无明显冲突', dateDisplay: '近30天', source: '来源：系统' });
    }
    // 长期未复核
    var oldRecs = records.filter(function(r) { return r.date < cutoff60; });
    if (oldRecs.length > 0) {
      var oldest = oldRecs.reduce(function(a, b) { return a.date < b.date ? a : b; });
      events.push({ icon: '⏰', typeLabel: '超过复核周期', text: '有 ' + oldRecs.length + ' 条生活记录超过60天未复核，建议确认内容是否仍然准确', dateDisplay: formatDateDisplay(oldest.date) + ' ~ ' + formatDateDisplay(cutoff60), source: '来源：系统提醒' });
    }
    // 同类兴趣多次被记录
    var busRecords = records.filter(function(r) { return r.content.indexOf('公交车') >= 0 || r.content.indexOf('火车') >= 0; });
    if (busRecords.length >= 3) {
      events.push({ icon: '🔁', typeLabel: '同类兴趣多次被记录', text: '关于交通工具的兴趣在 ' + busRecords.length + ' 次记录中被提及（不同时间、不同场景），为较稳定兴趣线索，待确认后可进入 L1', dateDisplay: busRecords[busRecords.length - 1].date + ' ~ ' + busRecords[0].date, source: '来源：多角色观察' });
    }
    return events;
  }

  // ============ #emotion L1 当前摘要 ============
  function buildEmotionL1(records) {
    var items = [];
    var cutoff7 = dateDaysAgo(7);
    var emotionRecs = records.filter(function(r) { return r.type === 'emotion'; });

    // 1. 当前情绪状态 —— 近7天心情概览
    var moodRecs = records.filter(function(r) { return r.type === 'mood'; });
    var recentMood = moodRecs.filter(function(r) { return r.date >= cutoff7; }).sort(function(a, b) { return b.date.localeCompare(a.date); });
    if (recentMood.length > 0) {
      var moodLabels = { happy: '开心', calm: '平静', anxious: '焦虑', sad: '难过', excited: '兴奋' };
      var moodCount = {};
      recentMood.forEach(function(r) { var m = r.mood || ''; moodCount[m] = (moodCount[m] || 0) + 1; });
      var topMoods = Object.keys(moodCount).sort(function(a, b) { return moodCount[b] - moodCount[a]; }).slice(0, 2);
      var topText = topMoods.map(function(m) { return moodLabels[m] || m; }).join('、');
      items.push({
        text: '近7天心情以「' + topText + '」为主（共' + recentMood.length + '天记录）',
        source: '近7天心情记录', statusLabel: '已确认', statusClass: 'source-confirmed'
      });
    }

    // 2. 已识别的触发因素 —— 从情绪事件中提取
    var triggers = [];
    var envChange = emotionRecs.filter(function(r) { return (r.content || '').indexOf('换') >= 0 || (r.content || '').indexOf('新') >= 0 || (r.content || '').indexOf('临时') >= 0; });
    if (envChange.length >= 2) triggers.push('环境/计划变化（如换教室、新老师、菜单更换）');
    var noise = emotionRecs.filter(function(r) { return (r.content || '').indexOf('嘈杂') >= 0 || (r.content || '').indexOf('人多') >= 0 || (r.content || '').indexOf('打雷') >= 0; });
    if (noise.length >= 2) triggers.push('噪音或人多环境（打雷、机构嘈杂）');
    var weather = emotionRecs.filter(function(r) { return (r.content || '').indexOf('下雨') >= 0 && ((r.content || '').indexOf('躁') >= 0 || (r.content || '').indexOf('走') >= 0); });
    if (weather.length >= 1) triggers.push('雨天无法户外活动时易烦躁');
    var excited = emotionRecs.filter(function(r) { return r.emotion_type === '兴奋'; });
    if (excited.length >= 2) triggers.push('期待外出/比赛时情绪高涨，可能影响作息');
    if (triggers.length > 0) {
      items.push({
        text: '已识别触发因素：' + triggers.slice(0, 3).join('；'),
        source: '来源：多角色观察 · 近6个月', statusLabel: '已确认', statusClass: 'source-confirmed'
      });
    }

    // 3. 被记录为有帮助的安抚方式
    var calmingMethods = [];
    var quiet = emotionRecs.filter(function(r) { return (r.content || '').indexOf('安静') >= 0; });
    if (quiet.length >= 2) calmingMethods.push('去安静环境待一会儿');
    var music = emotionRecs.filter(function(r) { return (r.content || '').indexOf('音乐') >= 0 || (r.content || '').indexOf('电子琴') >= 0; });
    if (music.length >= 2) calmingMethods.push('转移注意到音乐/电子琴');
    var momComfort = emotionRecs.filter(function(r) { return (r.content || '').indexOf('妈妈') >= 0 && ((r.content || '').indexOf('安抚') >= 0 || (r.content || '').indexOf('好转') >= 0); });
    if (momComfort.length >= 1) calmingMethods.push('联系妈妈（电话/看照片）');
    var preview = emotionRecs.filter(function(r) { return (r.content || '').indexOf('提前') >= 0 && (r.content || '').indexOf('熟悉') >= 0; });
    if (preview.length >= 1) calmingMethods.push('提前熟悉新环境/新安排');
    if (calmingMethods.length > 0) {
      var calmerAuthor = quiet.length > 0 ? quiet[0].author : (music.length > 0 ? music[0].author : '');
      items.push({
        text: '被记录为有帮助的安抚方式：' + calmingMethods.slice(0, 4).join('、'),
        source: '来源：' + (calmerAuthor || '多角色') + ' · 观察记录', statusLabel: '已确认', statusClass: 'source-confirmed'
      });
    }

    return items.slice(0, 6);
  }

  // ============ #emotion L3 关键事件 ============
  function buildEmotionL3(records) {
    var events = [];
    var cutoff30 = dateDaysAgo(30);
    var cutoff60 = dateDaysAgo(60);
    var cutoff90 = dateDaysAgo(90);
    var moodRecs = records.filter(function(r) { return r.type === 'mood'; }).sort(function(a, b) { return a.date.localeCompare(b.date); });
    var emotionRecs = records.filter(function(r) { return r.type === 'emotion'; });

    // 1. 首次记录
    if (records.length > 0) {
      var first = records[records.length - 1];
      events.push({
        icon: '🆕', typeLabel: '首次记录',
        text: '第一条情绪记录：' + ((first.content || '').substring(0, 40)),
        dateDisplay: formatDateDisplay(first.date),
        source: '来源：' + (first.author || '系统')
      });
    }

    // 2. 连续情绪记录 → "值得关注、待人工确认"（仅标记需关注的类型）
    var attentionMoods = { anxious: '焦虑', sad: '难过' };
    var streakMoods = {};
    moodRecs.forEach(function(r) {
      var m = r.mood;
      if (!streakMoods[m]) streakMoods[m] = { count: 0, start: r.date, end: r.date };
      streakMoods[m].count++;
      streakMoods[m].end = r.date;
    });
    Object.keys(streakMoods).forEach(function(m) {
      var s = streakMoods[m];
      if (s.count >= 3 && attentionMoods[m]) {
        events.push({
          icon: '👁️', typeLabel: '值得关注',
          text: '近30天「' + attentionMoods[m] + '」出现 ' + s.count + ' 天，待人工确认是否存在规律',
          dateDisplay: s.start + ' ~ ' + s.end,
          source: '来源：系统统计 · 仅作提示，非诊断性结论'
        });
      }
    });

    // 3. 明显变化 —— 情绪波动相关记录增加
    var recentEmotion = emotionRecs.filter(function(r) { return r.date >= cutoff30; });
    var olderEmotion = emotionRecs.filter(function(r) { return r.date < cutoff30; });
    if (recentEmotion.length > olderEmotion.length && olderEmotion.length > 0) {
      events.push({
        icon: '📈', typeLabel: '明显变化',
        text: '近30天情绪事件记录 ' + recentEmotion.length + ' 条，较前段（' + olderEmotion.length + ' 条）有所增加，近阶段情绪波动相关记录增加',
        dateDisplay: '近30天 vs 更早',
        source: '来源：系统'
      });
    }

    // 4. 信息冲突待核实
    var moodHappy = moodRecs.filter(function(r) { return r.mood === 'happy' && r.date >= cutoff30; });
    var moodSad = moodRecs.filter(function(r) { return r.mood === 'sad' && r.date >= cutoff30; });
    if (moodHappy.length > 0 && moodSad.length > 0) {
      events.push({
        icon: '⚠️', typeLabel: '信息冲突待核实',
        text: '近30天心情记录中「开心」和「难过」并存，不同场景下的情绪反应差异较大，建议综合观察',
        dateDisplay: '近30天', source: '来源：系统'
      });
    }

    // 5. 新触发因素识别（查全部记录，不限类型）
    var catTriggers = records.filter(function(r) { return r.date >= cutoff90 && ((r.content || '').indexOf('猫') >= 0 || (r.content || '').indexOf('动物') >= 0); });
    if (catTriggers.length >= 2) {
      events.push({
        icon: '💡', typeLabel: '新触发因素',
        text: '近3个月 ' + catTriggers.length + ' 次记录显示：接触小动物（猫）时情绪积极，可能是新的正向触发因素',
        dateDisplay: formatDateDisplay(catTriggers[catTriggers.length - 1].date) + ' ~ ' + formatDateDisplay(catTriggers[0].date),
        source: '来源：照护者观察'
      });
    }

    // 6. 长期未复核
    var oldEmotion = emotionRecs.filter(function(r) { return r.date < cutoff60; });
    if (oldEmotion.length > 0) {
      var oldest = oldEmotion.reduce(function(a, b) { return a.date < b.date ? a : b; });
      events.push({
        icon: '⏰', typeLabel: '超过复核周期',
        text: '有 ' + oldEmotion.length + ' 条情绪事件记录超过60天未复核，建议确认内容是否仍然准确',
        dateDisplay: formatDateDisplay(oldest.date) + ' ~ ' + formatDateDisplay(cutoff60),
        source: '来源：系统提醒'
      });
    }

    // 7. 安抚方式被多次记录为有帮助
    var calmMusic = records.filter(function(r) { return ((r.content || '').indexOf('音乐') >= 0 || (r.content || '').indexOf('电子琴') >= 0 || (r.content || '').indexOf(' 琴') >= 0) && ((r.content || '').indexOf('平静') >= 0 || (r.content || '').indexOf('好转') >= 0 || (r.content || '').indexOf('放松') >= 0 || (r.content || '').indexOf('恢复') >= 0); });
    if (calmMusic.length >= 2) {
      events.push({
        icon: '✅', typeLabel: '多次记录为有帮助',
        text: '「播放音乐/转移注意到电子琴」在 ' + calmMusic.length + ' 次不同情境下被记录为有助于情绪平稳',
        dateDisplay: formatDateDisplay(calmMusic[calmMusic.length - 1].date) + ' ~ ' + formatDateDisplay(calmMusic[0].date),
        source: '来源：多角色记录'
      });
    }

    return events;
  }

  // ============ #care L1 当前摘要 ============
  function buildCareL1(records) {
    var items = [];
    var careInfo = DataStore.getCareInfo();
    var sorted = records.slice().sort(function(a, b) { return b.date.localeCompare(a.date); });

    // 1. 当前照护安排 + 最近确认信息
    var latest = sorted[0];
    if (latest) {
      items.push({
        text: '最近照护记录：' + (latest.title || '') + ' — ' + (latest.content || '').substring(0, 60),
        source: '来源：' + (latest.author || '') + ' · ' + formatDateDisplay(latest.date) + '（最近确认）',
        statusLabel: '已确认', statusClass: 'source-confirmed'
      });
    }

    // 2. 过敏信息（权威数据）
    items.push({
      text: '过敏食物：' + careInfo.allergy.items + '（' + careInfo.allergy.level + '）',
      source: '来源：档案权威数据 · 所有照护者须知', statusLabel: '已确认', statusClass: 'source-confirmed'
    });

    // 3. 近期医疗事件
    var medicalRecs = records.filter(function(r) { return (r.title || '').indexOf('体检') >= 0 || (r.title || '').indexOf('用药') >= 0 || (r.title || '').indexOf('复查') >= 0; });
    medicalRecs.slice(0, 2).forEach(function(r) {
      items.push({
        text: (r.title || '') + '：' + (r.content || '').substring(0, 60),
        source: '来源：' + r.author + ' · ' + formatDateDisplay(r.date), statusLabel: '已确认', statusClass: 'source-confirmed'
      });
    });

    // 4. 用药情况
    items.push({
      text: '当前用药：' + (careInfo.medicine || '无常规用药'),
      source: '来源：档案 · 最后确认：' + formatDateDisplay(sorted[0] ? sorted[0].date : ''),
      statusLabel: '已确认', statusClass: 'source-confirmed'
    });

    return items.slice(0, 6);
  }

  // ============ #care L3 关键事件 ============
  function buildCareL3(records) {
    var events = [];
    var cutoff30 = dateDaysAgo(30);
    var cutoff60 = dateDaysAgo(60);

    // 1. 首次记录
    if (records.length > 0) {
      var first = records[records.length - 1];
      events.push({
        icon: '🆕', typeLabel: '首次记录',
        text: '第一条照护记录：' + ((first.title || '') + ' — ' + (first.content || '')).substring(0, 50),
        dateDisplay: formatDateDisplay(first.date),
        source: '来源：' + (first.author || '系统')
      });
    }

    // 2. 信息冲突检查
    var allergyConfirm = records.filter(function(r) { return (r.title || '').indexOf('过敏') >= 0; });
    if (allergyConfirm.length >= 2) {
      var latestAllergy = allergyConfirm.reduce(function(a, b) { return a.date > b.date ? a : b; });
      events.push({
        icon: '📋', typeLabel: '过敏信息更新',
        text: '过敏信息有 ' + allergyConfirm.length + ' 次记录更新，最近一次：' + latestAllergy.title,
        dateDisplay: formatDateDisplay(latestAllergy.date),
        source: '来源：' + latestAllergy.author
      });
    }

    // 3. 新就医记录
    var medicalRecs = records.filter(function(r) { return (r.title || '').indexOf('体检') >= 0 || (r.title || '').indexOf('用药') >= 0; });
    medicalRecs.forEach(function(r) {
      events.push({
        icon: '🏥', typeLabel: '医疗记录',
        text: r.title + '：' + (r.content || '').substring(0, 50),
        dateDisplay: formatDateDisplay(r.date),
        source: '来源：' + r.author
      });
    });

    // 4. 紧急联系人变更
    var contactRecs = records.filter(function(r) { return (r.title || '').indexOf('紧急联系') >= 0 || (r.title || '').indexOf('联系') >= 0 && (r.content || '').indexOf('139') >= 0; });
    contactRecs.forEach(function(r) {
      events.push({
        icon: '📞', typeLabel: '联系人变更',
        text: (r.content || '').substring(0, 60),
        dateDisplay: formatDateDisplay(r.date),
        source: '来源：' + r.author
      });
    });

    // 5. 到期提醒（仅复查类）
    var reviewRecs = records.filter(function(r) { return (r.title || '').indexOf('复查') >= 0; });
    reviewRecs.forEach(function(r) {
      events.push({
        icon: '📅', typeLabel: '到期提醒',
        text: (r.title || '') + '：' + (r.content || '').substring(0, 60),
        dateDisplay: formatDateDisplay(r.date),
        source: '来源：' + r.author
      });
    });

    // 6. 长期未复核
    var oldRecs = records.filter(function(r) { return r.date < cutoff60; });
    if (oldRecs.length > 0) {
      var oldest = oldRecs.reduce(function(a, b) { return a.date < b.date ? a : b; });
      events.push({
        icon: '⏰', typeLabel: '超过复核周期',
        text: '有 ' + oldRecs.length + ' 条照护记录超过60天未复核，建议确认内容是否仍然准确',
        dateDisplay: formatDateDisplay(oldest.date) + ' ~ ' + formatDateDisplay(cutoff60),
        source: '来源：系统提醒'
      });
    }

    return events;
  }

  // ============ #work L1 当前摘要 ============
  function buildWorkL1(records) {
    var items = [];
    var actRecs = records.filter(function(r) { return r.type === 'activity'; }).sort(function(a, b) { return b.date.localeCompare(a.date); });
    var noteRecs = records.filter(function(r) { return r.type === 'note'; });

    // 1. 当前工作/活动能力
    var workInfo = window.Constants.workInfo;
    items.push({
      text: '能独立完成：' + (workInfo.canDo || []).join('、'),
      source: '来源：档案基础信息', statusLabel: '已确认', statusClass: 'source-confirmed'
    });
    items.push({
      text: '需要支持的：' + (workInfo.needSupport || []).join('、'),
      source: '来源：档案基础信息', statusLabel: '已确认', statusClass: 'source-confirmed'
    });

    // 2. 最近活动表现
    if (actRecs.length > 0) {
      var latestAct = actRecs[0];
      items.push({
        text: '最近活动：' + (latestAct.title || '') + ' — ' + (latestAct.content || '').substring(0, 60),
        source: '来源：' + latestAct.author + ' · ' + formatDateDisplay(latestAct.date),
        statusLabel: '已确认', statusClass: 'source-confirmed'
      });
    }

    // 3. 被记录为有帮助的支持方式
    var supportRecs = noteRecs.filter(function(r) { return (r.title || '').indexOf('支持方式') >= 0 || (r.title || '').indexOf('支持需求') >= 0; });
    supportRecs.slice(0, 2).forEach(function(r) {
      items.push({
        text: (r.title || '') + '：' + (r.content || '').substring(0, 60),
        source: '来源：' + r.author + ' · ' + formatDateDisplay(r.date),
        statusLabel: '已确认', statusClass: 'source-confirmed'
      });
    });

    return items.slice(0, 6);
  }

  // ============ #work L3 关键事件 ============
  function buildWorkL3(records) {
    var events = [];
    var cutoff30 = dateDaysAgo(30);
    var cutoff60 = dateDaysAgo(60);
    var noteRecs = records.filter(function(r) { return r.type === 'note'; });

    // 1. 首次记录
    if (records.length > 0) {
      var first = records[records.length - 1];
      events.push({
        icon: '🆕', typeLabel: '首次记录',
        text: '第一条工作记录：' + ((first.title || '') + ' — ' + (first.content || '')).substring(0, 50),
        dateDisplay: formatDateDisplay(first.date),
        source: '来源：' + (first.author || '系统')
      });
    }

    // 2. 明显变化（全部记录，不限于 activity 类型）
    var recentItems = records.filter(function(r) { return r.date >= cutoff30; });
    var olderItems = records.filter(function(r) { return r.date < cutoff30; });
    if (recentItems.length > olderItems.length && olderItems.length > 0) {
      events.push({
        icon: '📈', typeLabel: '明显变化',
        text: '近30天有 ' + recentItems.length + ' 条工作记录，较前段（' + olderItems.length + ' 条）有所增加',
        dateDisplay: '近30天 vs 更早', source: '来源：系统'
      });
    }

    // 3. 新任务/角色变化
    var newTaskRecs = records.filter(function(r) { return (r.title || '').indexOf('新任务') >= 0 || (r.title || '').indexOf('新') >= 0 && r.type === 'note'; });
    newTaskRecs.forEach(function(r) {
      events.push({
        icon: '🆕', typeLabel: '新任务/角色变化',
        text: (r.title || '') + '：' + (r.content || '').substring(0, 60),
        dateDisplay: formatDateDisplay(r.date), source: '来源：' + r.author
      });
    });

    // 4. 支持方式被记录为有帮助
    var helpfulRecs = noteRecs.filter(function(r) { return (r.title || '').indexOf('支持方式') >= 0 || ((r.content || '').indexOf('独立完成') >= 0 && (r.content || '').indexOf('步骤') >= 0); });
    helpfulRecs.forEach(function(r) {
      events.push({
        icon: '✅', typeLabel: '支持方式被记录为有帮助',
        text: (r.title || '') + '：' + (r.content || '').substring(0, 60),
        dateDisplay: formatDateDisplay(r.date), source: '来源：' + r.author
      });
    });

    // 5. 同一困难多次出现 → "待人工评估"
    var difficultyRecs = noteRecs.filter(function(r) { return (r.title || '').indexOf('困难') >= 0 || ((r.content || '').indexOf('临时调整') >= 0 || (r.content || '').indexOf('不安') >= 0); });
    if (difficultyRecs.length >= 2) {
      events.push({
        icon: '👁️', typeLabel: '待人工评估',
        text: '应对变化相关支持记录出现 ' + difficultyRecs.length + ' 次，建议人工评估是否需要调整支持策略',
        dateDisplay: difficultyRecs[difficultyRecs.length - 1].date + ' ~ ' + difficultyRecs[0].date,
        source: '来源：系统提示 · 非诊断性结论'
      });
    }

    // 6. 长期未复核
    var oldRecs = records.filter(function(r) { return r.date < cutoff60; });
    if (oldRecs.length > 0) {
      var oldest = oldRecs.reduce(function(a, b) { return a.date < b.date ? a : b; });
      events.push({
        icon: '⏰', typeLabel: '超过复核周期',
        text: '有 ' + oldRecs.length + ' 条工作记录超过60天未复核，建议确认内容是否仍然准确',
        dateDisplay: formatDateDisplay(oldest.date) + ' ~ ' + formatDateDisplay(cutoff60),
        source: '来源：系统提醒'
      });
    }

    return events;
  }

  // ============ #relations L1 当前摘要 ============
  function buildRelationsL1(records) {
    var items = [];
    var relInfo = window.Constants.relationsInfo;

    // 1. 核心支持圈
    if (relInfo.core && relInfo.core.length > 0) {
      var coreNames = relInfo.core.map(function(p) { return p.name + '（' + p.role + '）'; });
      items.push({
        text: '核心支持圈：' + coreNames.join('、'),
        source: '来源：档案基础信息', statusLabel: '已确认', statusClass: 'source-confirmed'
      });
    }

    // 2. 日常交往圈
    if (relInfo.daily && relInfo.daily.length > 0) {
      var dailyNames = relInfo.daily.map(function(p) { return p.name + '（' + p.role + '）'; });
      items.push({
        text: '日常交往圈：' + dailyNames.join('、'),
        source: '来源：档案基础信息', statusLabel: '已确认', statusClass: 'source-confirmed'
      });
    }

    // 3. 社交偏好（来自最近记录）
    var socialPrefRecs = records.filter(function(r) { return (r.title || '').indexOf('社交偏好') >= 0 || (r.title || '').indexOf('边界需求') >= 0; });
    socialPrefRecs.slice(0, 2).forEach(function(r) {
      items.push({
        text: (r.title || '') + '：' + (r.content || '').substring(0, 60),
        source: '来源：' + r.author + ' · ' + formatDateDisplay(r.date),
        statusLabel: '已确认', statusClass: 'source-confirmed'
      });
    });

    // 4. 近期重要互动
    var recentSocial = records.filter(function(r) { return r.type === 'social'; }).sort(function(a, b) { return b.date.localeCompare(a.date); });
    if (recentSocial.length > 0) {
      var latest = recentSocial[0];
      items.push({
        text: '最近社交记录：' + (latest.title || '') + ' — ' + (latest.content || '').substring(0, 60),
        source: '来源：' + latest.author + ' · ' + formatDateDisplay(latest.date),
        statusLabel: '已确认', statusClass: 'source-confirmed'
      });
    }

    return items.slice(0, 6);
  }

  // ============ #relations L3 关键事件 ============
  function buildRelationsL3(records) {
    var events = [];
    var cutoff30 = dateDaysAgo(30);
    var cutoff60 = dateDaysAgo(60);

    // 1. 首次记录
    if (records.length > 0) {
      var first = records[records.length - 1];
      events.push({
        icon: '🆕', typeLabel: '首次记录',
        text: '第一条关系记录：' + ((first.title || '') + ' — ' + (first.content || '')).substring(0, 50),
        dateDisplay: formatDateDisplay(first.date),
        source: '来源：' + (first.author || '系统')
      });
    }

    // 2. 明显变化
    var recentItems = records.filter(function(r) { return r.date >= cutoff30; });
    var olderItems = records.filter(function(r) { return r.date < cutoff30; });
    if (recentItems.length > olderItems.length && olderItems.length > 0) {
      events.push({
        icon: '📈', typeLabel: '明显变化',
        text: '近30天有 ' + recentItems.length + ' 条关系记录，较前段（' + olderItems.length + ' 条）有所增加',
        dateDisplay: '近30天 vs 更早', source: '来源：系统'
      });
    }

    // 3. 信息冲突
    var conflictRecords = {};
    records.forEach(function(r) {
      if (!conflictRecords[r.date]) conflictRecords[r.date] = [];
      conflictRecords[r.date].push(r);
    });
    var conflictDates = 0;
    Object.keys(conflictRecords).forEach(function(d) {
      var authors = {};
      conflictRecords[d].forEach(function(r) { authors[r.author] = true; });
      if (Object.keys(authors).length > 1) conflictDates++;
    });
    if (conflictDates === 0 && records.length > 0) {
      events.push({
        icon: '🔒', typeLabel: '信息一致',
        text: '无同一日期多角色记录冲突',
        dateDisplay: '全时段', source: '来源：系统'
      });
    }

    // 4. 新关系或关系变化
    var changeRecs = records.filter(function(r) { return (r.title || '').indexOf('关系圈更新') >= 0; });
    changeRecs.forEach(function(r) {
      events.push({
        icon: '🔄', typeLabel: '新关系或关系变化',
        text: (r.title || '') + '：' + (r.content || '').substring(0, 60),
        dateDisplay: formatDateDisplay(r.date), source: '来源：' + r.author
      });
    });

    // 5. 互动偏好多次被描述
    var prefRecs = records.filter(function(r) { return (r.title || '').indexOf('互动') >= 0 || (r.title || '').indexOf('社交偏好') >= 0 || (r.title || '').indexOf('边界需求') >= 0; });
    if (prefRecs.length >= 2) {
      events.push({
        icon: '💬', typeLabel: '互动偏好多次被描述',
        text: '关于社交互动偏好/边界在 ' + prefRecs.length + ' 次记录中被提及',
        dateDisplay: prefRecs[prefRecs.length - 1].date + ' ~ ' + prefRecs[0].date,
        source: '来源：多角色观察'
      });
    }

    // 6. 长期未复核
    var oldRecs = records.filter(function(r) { return r.date < cutoff60; });
    if (oldRecs.length > 0) {
      var oldest = oldRecs.reduce(function(a, b) { return a.date < b.date ? a : b; });
      events.push({
        icon: '⏰', typeLabel: '超过复核周期',
        text: '有 ' + oldRecs.length + ' 条关系记录超过60天未复核，建议确认内容是否仍然准确',
        dateDisplay: formatDateDisplay(oldest.date) + ' ~ ' + formatDateDisplay(cutoff60),
        source: '来源：系统提醒'
      });
    }

    return events;
  }

  /* ==========================================================
   * 五、情绪与行为支持页面渲染
   * ========================================================== */

  /**
   * 渲染情绪与行为支持页面 — 四层模型
   */
  function renderEmotion() {
    var contentArea = document.getElementById('emotion-content');
    if (!contentArea) return;
    renderTopicFourLayer(contentArea, 'emotion', {
      l1Title: '📌 当前摘要',
      l1Sub: '当前已确认的情绪状态、已识别的触发因素与被记录为有帮助的安抚方式',
      emptyText: '暂无情绪记录'
    });
  }

  /* ==========================================================
   * 六、照护与医疗提醒页面渲染
   * ========================================================== */

  /**
   * 渲染照护与医疗提醒页面
   */
  function renderCare() {
    var contentArea = document.getElementById('care-content');
    if (!contentArea) return;

    careInfo = DataStore.getCareInfo();

    var html = '';

    // 过敏警告（置顶醒目，保留原样式）
    html += '<div class="allergy-warning" data-privacy="A">';
    html += '  <div class="allergy-icon">🚨</div>';
    html += '  <div class="allergy-text">严重过敏警告</div>';
    html += '  <div class="allergy-detail">' + careInfo.allergy.items + ' — ' + careInfo.allergy.level + '</div>';
    html += '</div>';

    // 四层模型（过敏警告通过 prependHtml 前置）
    renderTopicFourLayer(contentArea, 'care', {
      l1Title: '📌 当前摘要',
      l1Sub: '当前照护安排、近期医疗事件与用药情况',
      emptyText: '暂无照护记录',
      prependHtml: html
    });
  }

  /* ==========================================================
   * 七、工作支持页面渲染
   * ========================================================== */

  /**
   * 渲染工作支持页面 - 三栏布局
   */
  function renderWork() {
    var contentArea = document.getElementById('work-content');
    if (!contentArea) return;
    renderTopicFourLayer(contentArea, 'work', {
      l1Title: '📌 当前摘要',
      l1Sub: '当前工作与活动能力、支持需求与被记录为有帮助的支持方式',
      emptyText: '暂无工作记录'
    });
  }

  /* ==========================================================
   * 八、关系地图页面渲染
   * ========================================================== */

  /**
   * 渲染关系地图页面
   */
  function renderRelations() {
    var contentArea = document.getElementById('relations-content');
    if (!contentArea) return;
    renderTopicFourLayer(contentArea, 'relations', {
      l1Title: '📌 当前摘要',
      l1Sub: '重要关系、社交偏好与被记录的支持需求',
      emptyText: '暂无关系记录'
    });
  }

  /* ==========================================================
   * 九、完整档案页面渲染
   * ========================================================== */

  /**
   * 渲染完整档案页面 —— 六大主题分类入口
   */
  function renderArchive() {
    var contentArea = document.getElementById('archive-content');
    if (!contentArea) return;

    var user = DataStore.getCurrentUser() || appState.currentUser;
    var role = user ? user.role : 'parent';

    var html = '';

    // 档案概览说明
    html += '<div style="background:linear-gradient(135deg,#4A90D9,#5B9BD5);border-radius:16px;padding:20px;margin-bottom:20px;color:#fff;">';
    html += '  <div style="font-size:1.2rem;font-weight:600;margin-bottom:6px;">📋 小雨的完整档案</div>';
    html += '  <div style="font-size:0.88rem;opacity:0.9;">六大主题分类，全面了解小雨的 support profile</div>';
    html += '</div>';

    // 六大主题档案卡片
    var archiveThemes = [
      { hash: 'life', icon: '❤️', title: '喜好档案', desc: '喜欢和不喜欢的事物、活动偏好', color: '#4A90D9', privacy: 'A' },
      { hash: 'communication', icon: '💬', title: '沟通档案', desc: '沟通指南、有效话术、禁忌用语', color: '#722ED1', privacy: 'B' },
      { hash: 'emotion', icon: '😰', title: '情绪档案', desc: '情绪触发因素、安抚策略、预警信号', color: '#F5222D', privacy: 'C' },
      { hash: 'care', icon: '🏥', title: '照护档案', desc: '过敏、用药、作息、医疗提醒', color: '#52C41A', privacy: 'B' },
      { hash: 'work', icon: '💼', title: '支持档案', desc: '工作能力、社交关系、支持网络', color: '#FAAD14', privacy: 'B' },
      { hash: 'relations', icon: '👥', title: '关系档案', desc: '核心支持圈、日常接触、避免场景', color: '#13C2C2', privacy: 'B' }
    ];

    html += '<div class="card-grid">';
    archiveThemes.forEach(function (theme) {
      html += '<div class="nav-card archive-card" data-navigate="' + theme.hash + '" data-privacy="' + theme.privacy + '">';
      html += '  <span class="card-icon" style="background:' + theme.color + '15;color:' + theme.color + ';">' + theme.icon + '</span>';
      html += '  <div class="card-title">' + theme.title + '</div>';
      html += '  <div class="card-desc">' + theme.desc + '</div>';
      html += '</div>';
    });
    html += '</div>';

    // 快捷操作区
    html += '<div style="margin-top:24px;">';
    html += '  <h2 style="font-size:1rem;color:#333;margin-bottom:12px;">🔗 快捷操作</h2>';
    html += '  <div style="display:flex;gap:12px;flex-wrap:wrap;">';
    html += '    <button class="btn btn-outline" onclick="location.hash=\'timeline\'">📅 查看动态时间轴</button>';
    html += '    <button class="btn btn-outline" onclick="location.hash=\'charts\'">📊 数据可视化</button>';
    html += '    <button class="btn btn-outline" id="btn-archive-quickcard">📋 打开速读卡</button>';
    html += '  </div>';
    html += '</div>';

    contentArea.innerHTML = html;

    // 绑定档案卡片点击事件
    contentArea.querySelectorAll('.archive-card').forEach(function (card) {
      card.addEventListener('click', function () {
        var target = this.getAttribute('data-navigate');
        if (target) window.location.hash = target;
      });
    });

    // 绑定速读卡按钮
    var quickCardBtn = document.getElementById('btn-archive-quickcard');
    if (quickCardBtn) {
      quickCardBtn.addEventListener('click', function () {
        window.location.hash = 'quickcard';
      });
    }
  }

  /* ==========================================================
   * 十、数据价值层 - 统计分析与数据导出
   * ========================================================== */

  /**
   * 数据统计分析工具函数
   */
  function getAnalyticsData() {
    var records = DataStore.getRecords();
    var now = new Date();
    var thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // 近30天记录
    var recentRecords = records.filter(function (r) {
      return Utils.date.isRecent(r.date, 30);
    });

    // 按类型统计
    var typeStats = Utils.array.countBy(recentRecords, 'type');

    // 按角色统计
    var roleStats = Utils.array.countBy(recentRecords, 'authorRole');

    // 情绪统计（兼容中英文值）
    var emotionStats = { happy: 0, calm: 0, anxious: 0, angry: 0, sad: 0, excited: 0 };
    var emotionMapping = {
      'happy': 'happy', '开心': 'happy',
      'calm': 'calm', '平静': 'calm',
      'anxious': 'anxious', '焦虑': 'anxious',
      'angry': 'angry', '生气': 'angry',
      'sad': 'sad', '难过': 'sad',
      'excited': 'excited', '兴奋': 'excited'
    };
    recentRecords.forEach(function (r) {
      var mood = r.mood || r.emotion_type;
      var normalized = emotionMapping[mood];
      if (normalized && emotionStats[normalized] !== undefined) {
        emotionStats[normalized]++;
      }
    });

    // 策略效果统计
    var strategyRecords = records.filter(function (r) {
      return r.type === 'strategy' && r.effectiveness;
    });
    var avgEffectiveness = 0;
    if (strategyRecords.length > 0) {
      avgEffectiveness = Utils.array.sumBy(strategyRecords, 'effectiveness') / strategyRecords.length;
    }

    return {
      totalRecords: records.length,
      recentRecords: recentRecords.length,
      typeStats: typeStats,
      roleStats: roleStats,
      emotionStats: emotionStats,
      strategyRecords: strategyRecords.length,
      avgEffectiveness: avgEffectiveness.toFixed(1),
      dataDate: new Date().toLocaleDateString('zh-CN')
    };
  }

  /**
   * 数据脱敏处理 —— 移除所有身份信息
   */
  function anonymizeData(data) {
    var result = JSON.parse(JSON.stringify(data));

    // 移除身份信息
    if (result.users) {
      result.users.forEach(function (u) {
        u.name = '用户' + Math.floor(Math.random() * 1000);
        u.avatar = '👤';
        delete u.id;
        delete u.pin;
      });
    }

    // 移除记录中的身份信息
    if (result.records) {
      result.records.forEach(function (r) {
        r.author = '记录者';
        delete r.authorId;
        delete r.authorAvatar;
        // 保留角色类型用于统计，但不暴露具体人员
      });
    }

    // 移除基本信息中的姓名
    if (result.profile) {
      result.profile.name = '匿名用户';
    }

    return result;
  }

  /**
   * 导出CSV
   */
  function exportCSV(data, filename) {
    var records = data.records || [];
    var headers = ['日期', '时间', '类型', '标题', '内容', '作者角色', '心情', '策略效果'];
    var rows = [headers.join(',')];

    records.forEach(function (r) {
      var row = [
        r.date || '',
        r.time || '',
        RECORD_TYPES[r.type] ? RECORD_TYPES[r.type].label : r.type,
        r.title || '',
        r.content ? r.content.replace(/,/g, '，') : '',
        ROLES[r.authorRole] ? ROLES[r.authorRole].label : r.authorRole,
        r.mood || r.emotion_type || '',
        r.effectiveness || ''
      ];
      rows.push(row.join(','));
    });

    Utils.download(rows.join('\n'), filename + '.csv', 'text/csv');
  }

  /**
   * 导出JSON
   */
  function exportJSON(data, filename, anonymize) {
    var exportData = anonymize ? anonymizeData(data) : data;
    Utils.download(JSON.stringify(exportData, null, 2), filename + '.json', 'application/json');
  }

  /**
   * 渲染数据价值页面
   */
  function renderAnalytics() {
    var contentArea = Utils.dom.get('analytics-content');
    if (!contentArea) return;

    var stats = getAnalyticsData();
    var html = '';

    html += '<div class="analytics-hero">';
    html += '  <div class="analytics-hero-title">📊 数据价值中心</div>';
    html += '  <div class="analytics-hero-desc">基于记录数据生成统计分析，支持导出用于科研和政策参考</div>';
    html += '</div>';

    html += '<div class="stats-grid">';
    html += '  <div class="stat-card"><div class="stat-icon">📝</div><div class="stat-value">' + stats.totalRecords + '</div><div class="stat-label">总记录数</div></div>';
    html += '  <div class="stat-card"><div class="stat-icon">📅</div><div class="stat-value" style="color:#52C41A;">' + stats.recentRecords + '</div><div class="stat-label">近30天记录</div></div>';
    html += '  <div class="stat-card"><div class="stat-icon">🧩</div><div class="stat-value" style="color:#EB2F96;">' + stats.strategyRecords + '</div><div class="stat-label">策略记录数</div></div>';
    html += '  <div class="stat-card"><div class="stat-icon">⭐</div><div class="stat-value" style="color:#FAAD14;">' + stats.avgEffectiveness + '/5</div><div class="stat-label">平均策略效果</div></div>';
    html += '</div>';

    html += '<h2 class="section-title">😰 情绪分布（近30天）</h2>';
    html += '<div class="card">';
    var emotionOptions = [
      { key: 'happy', label: '开心', emoji: '😄', color: '#52C41A' },
      { key: 'calm', label: '平静', emoji: '😌', color: '#1890FF' },
      { key: 'anxious', label: '焦虑', emoji: '😰', color: '#FAAD14' },
      { key: 'angry', label: '生气', emoji: '😠', color: '#F5222D' },
      { key: 'sad', label: '难过', emoji: '😢', color: '#722ED1' },
      { key: 'excited', label: '兴奋', emoji: '🤩', color: '#EB2F96' }
    ];
    var totalEmotions = emotionOptions.reduce(function (sum, e) {
      return sum + (stats.emotionStats[e.key] || 0);
    }, 0);
    emotionOptions.forEach(function (e) {
      var count = stats.emotionStats[e.key] || 0;
      var percent = totalEmotions > 0 ? Math.round((count / totalEmotions) * 100) : 0;
      html += '<div style="margin-bottom:12px;">';
      html += '  <div class="flex justify-between" style="margin-bottom:4px;">';
      html += '    <span style="display:flex;align-items:center;gap:6px;">';
      html += '      <span>' + e.emoji + '</span><span style="font-size:0.88rem;color:#555;">' + e.label + '</span>';
      html += '    </span>';
      html += '    <span style="font-size:0.88rem;color:#888;">' + count + '次 (' + percent + '%)</span>';
      html += '  </div>';
      html += '  <div class="progress-bar-container"><div class="progress-bar" style="width:' + percent + '%;background:' + e.color + ';"></div></div>';
      html += '</div>';
    });
    html += '</div>';

    html += '<h2 class="section-title">📋 记录类型分布（近30天）</h2>';
    html += '<div class="card">';
    var typeKeys = Object.keys(stats.typeStats);
    var totalTypes = typeKeys.reduce(function (sum, k) {
      return sum + stats.typeStats[k];
    }, 0);
    typeKeys.forEach(function (typeKey) {
      var typeInfo = RECORD_TYPES[typeKey] || { label: typeKey, color: '#999' };
      var count = stats.typeStats[typeKey];
      var percent = totalTypes > 0 ? Math.round((count / totalTypes) * 100) : 0;
      html += '<div style="margin-bottom:10px;">';
      html += '  <div class="flex justify-between" style="margin-bottom:3px;">';
      html += '    <span style="display:flex;align-items:center;gap:6px;">';
      html += '      <span>' + typeInfo.icon + '</span><span style="font-size:0.88rem;color:#555;">' + typeInfo.label + '</span>';
      html += '    </span>';
      html += '    <span style="font-size:0.88rem;color:#888;">' + count + '次 (' + percent + '%)</span>';
      html += '  </div>';
      html += '  <div class="progress-bar-container" style="height:6px;"><div class="progress-bar progress-bar-sm" style="width:' + percent + '%;background:' + typeInfo.color + ';"></div></div>';
      html += '</div>';
    });
    if (typeKeys.length === 0) {
      html += '<div style="text-align:center;color:#999;padding:16px;">暂无记录数据</div>';
    }
    html += '</div>';

    html += '<h2 class="section-title">👥 角色贡献分布（近30天）</h2>';
    html += '<div class="card">';
    var roleKeys = Object.keys(stats.roleStats);
    var totalRoles = roleKeys.reduce(function (sum, k) {
      return sum + stats.roleStats[k];
    }, 0);
    roleKeys.forEach(function (roleKey) {
      var roleInfo = ROLES[roleKey] || { label: roleKey, color: '#999' };
      var count = stats.roleStats[roleKey];
      var percent = totalRoles > 0 ? Math.round((count / totalRoles) * 100) : 0;
      html += '<div style="margin-bottom:10px;">';
      html += '  <div class="flex justify-between" style="margin-bottom:3px;">';
      html += '    <span style="display:flex;align-items:center;gap:6px;">';
      html += '      <span>' + roleInfo.avatar + '</span><span style="font-size:0.88rem;color:#555;">' + roleInfo.label + '</span>';
      html += '    </span>';
      html += '    <span style="font-size:0.88rem;color:#888;">' + count + '次 (' + percent + '%)</span>';
      html += '  </div>';
      html += '  <div class="progress-bar-container" style="height:6px;"><div class="progress-bar progress-bar-sm" style="width:' + percent + '%;background:' + roleInfo.color + ';"></div></div>';
      html += '</div>';
    });
    if (roleKeys.length === 0) {
      html += '<div style="text-align:center;color:#999;padding:16px;">暂无记录数据</div>';
    }
    html += '</div>';

    html += '<h2 class="section-title">📥 数据导出</h2>';
    html += '<div class="card">';
    html += '  <div style="font-size:0.88rem;color:#888;margin-bottom:16px;">';
    html += '    支持导出原始数据（含身份信息）或脱敏数据（适合科研共享）。脱敏数据将自动移除所有个人身份信息，仅保留统计分析所需的结构化数据。';
    html += '  </div>';
    html += '  <div class="export-buttons">';
    html += '    <button id="btn-export-csv" class="export-btn export-btn-primary"><span>📄</span>导出CSV（原始）</button>';
    html += '    <button id="btn-export-json" class="export-btn export-btn-success"><span>📊</span>导出JSON（原始）</button>';
    html += '    <button id="btn-export-anon-csv" class="export-btn export-btn-warning"><span>🔒</span>导出CSV（脱敏）</button>';
    html += '    <button id="btn-export-anon-json" class="export-btn export-btn-danger"><span>🔑</span>导出JSON（脱敏）</button>';
    html += '  </div>';
    html += '</div>';

    html += '<div class="info-box">';
    html += '  <div class="info-box-title">💡 数据价值说明</div>';
    html += '  <ul>';
    html += '    <li><strong>个体层面：</strong>通过统计分析了解心青年的情绪模式和照护效果，优化照护策略</li>';
    html += '    <li><strong>机构层面：</strong>汇总多个心青年的数据，分析群体特征和干预效果</li>';
    html += '    <li><strong>政策层面：</strong>脱敏数据可用于科研和政策制定，为孤独症群体争取更多支持</li>';
    html += '    <li><strong>隐私保护：</strong>脱敏导出功能确保个人身份信息不被泄露</li>';
    html += '  </ul>';
    html += '</div>';

    Utils.dom.html(contentArea, html);

    var baseData = DataStore.getAllData();

    Utils.dom.on(Utils.dom.get('btn-export-csv'), 'click', function () {
      exportCSV(baseData, 'ai-dongwo-data');
      showToast('✅ CSV导出成功！');
    });

    Utils.dom.on(Utils.dom.get('btn-export-json'), 'click', function () {
      exportJSON(baseData, 'ai-dongwo-data', false);
      showToast('✅ JSON导出成功！');
    });

    Utils.dom.on(Utils.dom.get('btn-export-anon-csv'), 'click', function () {
      var anonData = anonymizeData(baseData);
      exportCSV(anonData, 'ai-dongwo-data-anon');
      showToast('✅ 脱敏CSV导出成功！');
    });

    Utils.dom.on(Utils.dom.get('btn-export-anon-json'), 'click', function () {
      exportJSON(baseData, 'ai-dongwo-data-anon', true);
      showToast('✅ 脱敏JSON导出成功！');
    });
  }

  /* ==========================================================
   * 十一、策略知识库与规则引擎（AI情绪行为支持）
   * ========================================================== */

  /**
   * 规则引擎 —— 根据情绪记录匹配策略
   * @param {string} emotionValue - 情绪值（对应EMOTION_OPTIONS）
   * @param {string} severity - 严重程度 mild/moderate/severe
   * @param {Array} recentStrategyRecords - 近期策略记录（用于效果优化）
   * @returns {Object} 推荐结果
   */
  function recommendStrategies(emotionValue, severity, recentStrategyRecords) {
    var strategyKey = EMOTION_TO_STRATEGY[emotionValue];
    if (!strategyKey || !STRATEGY_KB[strategyKey]) {
      return { strategies: [], message: '当前情绪状态暂不需要策略干预' };
    }

    var category = STRATEGY_KB[strategyKey];
    var level = severity || 'mild';
    var strategies = category.levels[level] || category.levels.mild;

    // 如果有历史策略记录，按效果排序
    var rankedStrategies = strategies.map(function (s) {
      var effectivenessScore = 0;
      var usageCount = 0;
      if (recentStrategyRecords && recentStrategyRecords.length > 0) {
        recentStrategyRecords.forEach(function (r) {
          if (r.title && r.title.indexOf(s.name) !== -1) {
            usageCount++;
            effectivenessScore += (r.effectiveness || 3);
          }
        });
      }
      return {
        strategy: s,
        avgEffectiveness: usageCount > 0 ? (effectivenessScore / usageCount) : 0,
        usageCount: usageCount
      };
    });

    // 按平均效果排序（有历史数据的有效策略排前面）
    rankedStrategies.sort(function (a, b) {
      return b.avgEffectiveness - a.avgEffectiveness;
    });

    return {
      emotionLabel: category.label,
      emotionEmoji: category.emoji,
      severity: level,
      strategies: rankedStrategies,
      message: rankedStrategies[0].usageCount > 0
        ? '基于历史效果推荐，"' + rankedStrategies[0].strategy.name + '"之前效果最好'
        : '根据当前情绪状态推荐以下策略'
    };
  }

  /**
   * 情绪预警分析 —— 基于近期情绪记录检测趋势
   * @param {Array} records - 所有记录
   * @returns {Object} 预警结果
   */
  function analyzeEmotionTrend(records) {
    var now = new Date();
    var sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // 筛选近7天的情绪记录
    var recentEmotions = records.filter(function (r) {
      if (r.type !== 'emotion' && r.type !== 'mood') return false;
      var recordDate = new Date(r.date + 'T' + (r.time || '00:00'));
      return recordDate >= sevenDaysAgo;
    });

    if (recentEmotions.length === 0) {
      return { level: 'normal', message: '近期无情绪记录', data: [] };
    }

    // 负面情绪判断（兼容mood英文值和emotion中文值）
    var negativeValues = ['anxious', 'angry', 'sad', '焦虑', '生气', '难过'];

    // 统计负面情绪比例
    var negativeEmotions = recentEmotions.filter(function (r) {
      var mood = r.mood || r.emotion_type;
      return negativeValues.indexOf(mood) !== -1;
    });

    var negativeRatio = negativeEmotions.length / recentEmotions.length;

    // 检测近3天是否恶化
    var threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    var last3Days = recentEmotions.filter(function (r) {
      var recordDate = new Date(r.date + 'T' + (r.time || '00:00'));
      return recordDate >= threeDaysAgo;
    });
    var last3DaysNegative = last3Days.filter(function (r) {
      var mood = r.mood || r.emotion_type;
      return negativeValues.indexOf(mood) !== -1;
    });
    var recent3DayRatio = last3Days.length > 0 ? last3DaysNegative.length / last3Days.length : 0;

    // 之前4天的负面比例
    var before3Days = recentEmotions.filter(function (r) {
      var recordDate = new Date(r.date + 'T' + (r.time || '00:00'));
      return recordDate < threeDaysAgo;
    });
    var beforeNegative = before3Days.filter(function (r) {
      var mood = r.mood || r.emotion_type;
      return negativeValues.indexOf(mood) !== -1;
    });
    var beforeRatio = before3Days.length > 0 ? beforeNegative.length / before3Days.length : 0;

    // 预警等级判定
    var level, message;
    if (negativeRatio > 0.6 && recent3DayRatio > beforeRatio) {
      level = 'warning';
      message = '⚠️ 近7天负面情绪占比' + Math.round(negativeRatio * 100) + '%，且近3天呈上升趋势，建议密切关注';
    } else if (negativeRatio > 0.4) {
      level = 'attention';
      message = '🔔 近7天负面情绪占比' + Math.round(negativeRatio * 100) + '%，建议关注情绪状态';
    } else {
      level = 'normal';
      message = '✅ 近7天情绪状态总体平稳';
    }

    return {
      level: level,
      message: message,
      totalRecords: recentEmotions.length,
      negativeCount: negativeEmotions.length,
      negativeRatio: Math.round(negativeRatio * 100),
      recent3DayRatio: Math.round(recent3DayRatio * 100),
      trendUp: recent3DayRatio > beforeRatio
    };
  }

  /**
   * 获取近期策略记录
   */
  function getRecentStrategyRecords() {
    var records = DataStore.getRecords();
    return records.filter(function (r) {
      return r.type === 'strategy';
    }).slice(0, 20);
  }

  /**
   * 渲染策略推荐卡片
   * @param {Object} recommendation - recommendStrategies的返回值
   * @returns {string} HTML
   */
  function renderStrategyRecommendation(recommendation) {
    if (!recommendation || recommendation.strategies.length === 0) {
      return '<div style="padding:16px;text-align:center;color:#999;font-size:0.9rem;">' +
             recommendation.message + '</div>';
    }

    var html = '';
    html += '<div style="margin-bottom:12px;padding:10px 14px;background:#f0f7ff;border-radius:8px;font-size:0.85rem;color:#4A90D9;">';
    html += '  💡 ' + recommendation.message;
    html += '</div>';

    recommendation.strategies.forEach(function (item, idx) {
      var s = item.strategy;
      var badge = idx === 0 ? '<span style="background:#52C41A;color:#fff;font-size:0.7rem;padding:1px 6px;border-radius:8px;margin-left:6px;">推荐</span>' : '';
      var effectBadge = '';
      if (item.usageCount > 0) {
        effectBadge = '<span style="background:#fff0f6;color:#EB2F96;font-size:0.7rem;padding:1px 6px;border-radius:8px;margin-left:4px;">' +
                       '历史效果 ' + item.avgEffectiveness.toFixed(1) + '/5 (' + item.usageCount + '次)</span>';
      }

      html += '<div class="strategy-card" style="background:#fff;border-radius:12px;padding:16px;margin-bottom:12px;box-shadow:0 1px 6px rgba(0,0,0,0.06);border-left:4px solid ' + (idx === 0 ? '#52C41A' : '#ddd') + ';">';
      html += '  <div style="font-weight:600;color:#333;font-size:0.95rem;margin-bottom:8px;">' + s.name + badge + effectBadge + '</div>';
      html += '  <div style="margin-bottom:8px;">';
      html += '    <div style="font-size:0.8rem;color:#888;margin-bottom:4px;">实施步骤：</div>';
      html += '    <ol style="margin:0;padding-left:20px;font-size:0.85rem;color:#555;line-height:1.6;">';
      s.steps.forEach(function (step) {
        html += '      <li>' + step + '</li>';
      });
      html += '    </ol>';
      html += '  </div>';
      html += '  <div style="display:flex;gap:12px;flex-wrap:wrap;font-size:0.8rem;">';
      html += '    <span style="color:#FAAD14;">⚠️ ' + s.caution + '</span>';
      html += '    <span style="color:#52C41A;">✅ ' + s.expected + '</span>';
      html += '  </div>';
      html += '  <button class="btn-use-strategy" data-strategy="' + s.name + '" data-emotion="' + recommendation.emotionLabel + '" style="margin-top:10px;padding:6px 16px;background:#4A90D9;color:#fff;border:none;border-radius:6px;font-size:0.8rem;cursor:pointer;">记录使用此策略</button>';
      html += '</div>';
    });

    return html;
  }

  /**
   * 渲染情绪预警卡片
   * @param {Object} alert - analyzeEmotionTrend的返回值
   * @returns {string} HTML
   */
  function renderEmotionAlert(alert) {
    var colors = {
      normal: { bg: '#f6ffed', border: '#52C41A', icon: '✅' },
      attention: { bg: '#fffbe6', border: '#FAAD14', icon: '🔔' },
      warning: { bg: '#fff2f0', border: '#F5222D', icon: '⚠️' }
    };
    var c = colors[alert.level] || colors.normal;

    var html = '';
    html += '<div style="background:' + c.bg + ';border:1px solid ' + c.border + ';border-radius:12px;padding:16px;margin-bottom:16px;">';
    html += '  <div style="font-size:0.95rem;color:' + c.border + ';font-weight:600;margin-bottom:6px;">' + c.icon + ' 情绪预警分析</div>';
    html += '  <div style="font-size:0.88rem;color:#555;margin-bottom:8px;">' + alert.message + '</div>';
    if (alert.totalRecords) {
      html += '  <div style="display:flex;gap:16px;font-size:0.8rem;color:#888;">';
      html += '    <span>近7天记录：' + alert.totalRecords + '条</span>';
      html += '    <span>负面情绪：' + alert.negativeCount + '条 (' + alert.negativeRatio + '%)</span>';
      if (alert.trendUp && alert.level !== 'normal') {
        html += '    <span style="color:#F5222D;">📈 近3天上升趋势</span>';
      }
      html += '  </div>';
    }
    html += '</div>';
    return html;
  }

  /* ==========================================================
   * 十二、事件绑定与初始化
   * ========================================================== */

  // ====== v2.0 新增：渲染「认识我」卡片 ======
  function renderKnowMeCard() {
    var container = document.getElementById('know-me-card-container');
    if (!container) return;

    var am = C.aboutMe;
    if (!am) return;

    var html = '';
    html += '<div class="know-me-card">';

    // 头部
    html += '  <div class="know-me-header">';
    html += '    <div class="know-me-avatar">🌻</div>';
    html += '    <div class="know-me-header-info">';
    html += '      <div class="know-me-header-title">🌟 认识我</div>';
    html += '      <div class="know-me-header-sub">先了解我是谁，再学习如何支持我</div>';
    html += '    </div>';
    html += '  </div>';

    // 第一人称自述
    html += '  <div class="know-me-first-person">' + am.firstPerson + '</div>';

    // 我擅长 + 我喜欢
    html += '  <div class="know-me-grid">';
    html += '    <div class="know-me-mini">';
    html += '      <div class="know-me-mini-title">💪 我擅长和知道</div>';
    am.strengths.forEach(function(s) {
      html += '      <div class="know-me-tag highlight" style="margin-bottom:4px;">' + s.icon + ' ' + s.title + '：' + s.desc + '</div>';
    });
    html += '    </div>';
    html += '    <div class="know-me-mini">';
    html += '      <div class="know-me-mini-title">💚 让我安心和快乐</div>';
    am.calming.forEach(function(c) {
      html += '      <div class="know-me-tag" style="margin-bottom:4px;">' + c.icon + ' ' + c.desc + '</div>';
    });
    html += '    </div>';

    // 沟通偏好
    html += '    <div class="know-me-mini full">';
    html += '      <div class="know-me-mini-title">🗣️ 我希望别人这样与我交流</div>';
    html += '      <div class="know-me-tag-row">';
    html += '        <span class="know-me-tag highlight">' + am.communicationPreference.callMe + '</span>';
    html += '        <span class="know-me-tag">' + am.communicationPreference.howToTalk + '</span>';
    html += '      </div>';
    html += '    </div>';
    html += '  </div>';

    // 我能自己做 / 需要协助
    html += '  <div class="know-me-independence">';
    am.independence.forEach(function(ind) {
      html += '    <div class="know-me-ind-col">';
      html += '      <div class="ind-label">' + ind.level + '</div>';
      html += '      <ul class="ind-list">';
      ind.items.forEach(function(item) {
        html += '        <li>' + item + '</li>';
      });
      html += '      </ul>';
      html += '    </div>';
    });
    html += '  </div>';

    // 愿望
    html += '  <div class="know-me-aspiration">';
    html += '    <span class="asp-label">⭐ 我想过怎样的生活</span>';
    html += '    ' + am.aspiration;
    html += '  </div>';

    // 信息来源图例
    html += '  <div class="source-legend">';
    html += '    <span>📋 信息来源：</span>';
    html += '    <span class="source-badge self">💬 心青年自己说的</span>';
    html += '    <span class="source-badge observer">👁️ 支持者观察到的</span>';
    html += '    <span class="source-badge confirmed">✅ 共同确认的</span>';
    html += '  </div>';

    html += '</div>';

    container.innerHTML = html;
  }

  // ====== v2.0 新增：渲染演示工作链 ======
  function renderDemoWorkflow() {
    var container = document.getElementById('demo-workflow-container');
    if (!container) return;

    var dw = C.demoWorkflow;
    if (!dw) return;

    var html = '';
    html += '<div class="demo-workflow">';
    html += '  <div class="demo-workflow-header">';
    html += '    <div class="dw-title">🤖 ' + dw.title + '</div>';
    html += '    <div class="dw-desc">' + dw.description + '</div>';
    html += '  </div>';

    dw.steps.forEach(function(s) {
      html += '  <div class="demo-step">';
      html += '    <div class="demo-step-num" style="background:' + s.color + ';">' + s.step + '</div>';
      html += '    <div class="demo-step-content">';
      html += '      <div class="demo-step-actor">' + s.icon + ' ' + s.actor + '</div>';
      html += '      <div class="demo-step-action">' + s.action + '</div>';
      html += '    </div>';
      html += '  </div>';
    });

    html += '</div>';

    container.innerHTML = html;
  }

  /**
   * 绑定全局事件监听器
   */
  function bindGlobalEvents() {
    // 登录按钮
    var loginBtn = document.getElementById('btn-login');
    if (loginBtn) {
      loginBtn.addEventListener('click', function (e) {
        e.preventDefault();
        window.Auth.doLogin();
      });
    }

    // 登录PIN码输入框回车触发登录
    var loginPin = document.getElementById('login-pin');
    if (loginPin) {
      loginPin.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          window.Auth.doLogin();
        }
      });
    }

    // 去注册按钮
    var showRegBtn = document.getElementById('btn-show-register');
    if (showRegBtn) {
      showRegBtn.addEventListener('click', function (e) {
        e.preventDefault();
        window.Auth.showRegisterStep1();
      });
    }

    // 切换姓名输入方式（下拉/手动）
    var toggleNameBtn = document.getElementById('btn-toggle-name-input');
    if (toggleNameBtn) {
      toggleNameBtn.addEventListener('click', function (e) {
        e.preventDefault();
        window.Auth.toggleNameInputMode();
      });
    }

    // 去登录按钮
    var showLoginBtn = document.getElementById('btn-show-login');
    if (showLoginBtn) {
      showLoginBtn.addEventListener('click', function (e) {
        e.preventDefault();
        window.Auth.showLoginView();
      });
    }

    // 注册按钮
    var regBtn = document.getElementById('btn-register');
    if (regBtn) {
      regBtn.addEventListener('click', function (e) {
        e.preventDefault();
        window.Auth.doRegister();
      });
    }

    // 注册PIN码确认框回车触发注册
    var regPinConfirm = document.getElementById('register-pin-confirm');
    if (regPinConfirm) {
      regPinConfirm.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          window.Auth.doRegister();
        }
      });
    }

    // 返回选择角色按钮
    var backToRoleBtn = document.getElementById('btn-back-to-role');
    if (backToRoleBtn) {
      backToRoleBtn.addEventListener('click', function (e) {
        e.preventDefault();
        document.getElementById('login-view').style.display = 'none';
        document.getElementById('register-step2').style.display = 'none';
        document.getElementById('register-step1').style.display = 'block';
      });
    }

    // 退出登录按钮
    var navLogoutBtn = document.getElementById('btn-nav-logout');
    if (navLogoutBtn) {
      navLogoutBtn.addEventListener('click', function () {
        window.Auth.logout();
      });
    }

    // Esc键关闭弹窗
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        window.RecordsPage.closeAddRecordModal();
      }
    });

    // 为所有 back-btn 绑定返回事件（使用事件委托，回到父级模块）
    document.addEventListener('click', function (e) {
      var backBtn = e.target.closest('.back-btn');
      if (backBtn) {
        var backParent = PAGE_BACK_PARENT[currentPage] || PAGE_PARENT[currentPage];
        if (backParent && backParent !== currentPage) {
          window.location.hash = backParent;
        } else {
          window.location.hash = 'home';
        }
      }
    });

    // 事件委托：速读卡和AI聊聊按钮
    document.addEventListener('click', function (e) {
      if (e.target.id === 'btn-quick-card' || e.target.closest('#btn-quick-card')) {
        window.location.hash = 'quickcard';
      }
      // 弹窗关闭按钮
      if (e.target.id === 'modal-close-btn' || e.target.id === 'btn-close-modal' || e.target.closest('#modal-close-btn') || e.target.closest('#btn-close-modal')) {
        // 由各弹窗模块自行处理关闭
      }
      // 点击弹窗遮罩层关闭
      if (e.target.id === 'quick-card-modal' || e.target.id === 'add-record-modal') {
        // 由各弹窗模块自行处理关闭
      }
    });
  }

  /**
   * 应用初始化 - DOMContentLoaded 时执行
   */
  function initApp() {
    // 初始化数据存储
    DataStore.init();

    // 加载当前用户
    var user = DataStore.getCurrentUser();
    if (user) {
      appState.currentUser = user;
      appState.currentRole = user.role;
      currentRole = user.role;
    }

    // 渲染底部导航
    renderBottomNav();

    // 绑定全局事件
    bindGlobalEvents();

    // 绑定顶栏事件
    bindTopbarEvents();

    // 初始化路由系统
    initRouter();

    // 应用当前角色的隐私设置
    window.Permissions.applyPrivacy(currentRole);
  }

  /* ==========================================================
   * 十三、每日任务页面 — Outlook 风格
   * ========================================================== */
  var TASK_CATEGORY_CONFIG = {
    medication: { label: '医疗', color: '#F5222D', bg: 'rgba(245,34,45,0.08)' },
    meal:       { label: '饮食', color: '#FA8C16', bg: 'rgba(250,140,22,0.08)' },
    hygiene:    { label: '卫生', color: '#1890FF', bg: 'rgba(24,144,255,0.08)' },
    activity:   { label: '活动', color: '#52C41A', bg: 'rgba(82,196,26,0.08)' },
    learning:   { label: '学习', color: '#722ED1', bg: 'rgba(114,46,209,0.08)' },
    other:      { label: '其他', color: '#8C8C8C', bg: 'rgba(140,140,140,0.08)' }
  };

  var TASK_TIME_GROUPS = [
    { label: '上午', range: ['00:00', '12:00'], icon: '🌅' },
    { label: '下午', range: ['12:00', '18:00'], icon: '☀️' },
    { label: '晚上', range: ['18:00', '24:00'], icon: '🌙' }
  ];

  function renderTasks() {
    var contentArea = document.getElementById('tasks-content');
    if (!contentArea) return;

    var today = getTodayString();

    // 确保今日实例已生成
    DataStore.generateDailyInstances(today);

    // 获取今日实例 + 所有任务（用于匹配详情）
    var instances = DataStore.getTaskInstances(today);
    var tasks = DataStore.getTasks(true);
    var taskMap = {};
    tasks.forEach(function(t) { taskMap[t.id] = t; });

    // 分离 routine 实例（关联到任务详情）和 adhoc 任务
    var routineItems = [];
    var adhocItems = [];

    instances.forEach(function(inst) {
      var task = taskMap[inst.taskId];
      if (task && task.type === 'routine') {
        routineItems.push({ instance: inst, task: task });
      }
    });

    // 找出活跃的 adhoc 任务
    tasks.forEach(function(t) {
      if (t.type === 'adhoc' && t.isActive !== false) {
        adhocItems.push({ task: t });
      }
    });

    // 按时间排序 routine
    routineItems.sort(function(a, b) {
      return (a.task.time || '99:99').localeCompare(b.task.time || '99:99');
    });

    // 按截止日期排序 adhoc
    adhocItems.sort(function(a, b) {
      var da = a.task.dueDate || '9999-99-99';
      var db = b.task.dueDate || '9999-99-99';
      return da.localeCompare(db);
    });

    // 统计
    var completedCount = routineItems.filter(function(item) { return item.instance.status === 'done'; }).length;
    var totalCount = routineItems.length;
    var percentage = totalCount > 0 ? Math.round(completedCount / totalCount * 100) : 0;

    // 格式化日期
    var weekLabels = ['日','一','二','三','四','五','六'];
    var d = new Date(today + 'T00:00:00');
    var dateDisplay = (d.getMonth() + 1) + '月' + d.getDate() + '日 周' + weekLabels[d.getDay()];

    var html = '';

    // ===== 顶部进度环 =====
    html += '<div class="ot-progress-section">';
    html += '  <div class="ot-progress-ring-wrapper">';
    html += '    <svg class="ot-progress-ring" viewBox="0 0 100 100">';
    html += '      <circle class="ot-progress-bg" cx="50" cy="50" r="42" />';
    html += '      <circle class="ot-progress-fill" cx="50" cy="50" r="42" ' +
            'stroke-dasharray="' + (percentage * 2.64).toFixed(1) + ' 264" />';
    html += '    </svg>';
    html += '    <div class="ot-progress-center">';
    html += '      <div class="ot-progress-pct">' + (totalCount > 0 ? percentage + '%' : '--') + '</div>';
    html += '    </div>';
    html += '  </div>';
    html += '  <div class="ot-progress-meta">';
    html += '    <div class="ot-progress-date">' + dateDisplay + '</div>';
    html += '    <div class="ot-progress-stat">已完成 <strong>' + completedCount + '</strong> / ' + totalCount + ' 项</div>';
    html += '  </div>';
    html += '</div>';

    // ===== 规律任务 — 按时间段分组 =====
    TASK_TIME_GROUPS.forEach(function(group) {
      var groupItems = routineItems.filter(function(item) {
        var t = item.task.time || '00:00';
        return t >= group.range[0] && t < group.range[1];
      });
      if (groupItems.length === 0) return;

      html += '<div class="ot-group">';
      html += '  <div class="ot-group-header">';
      html += '    <span class="ot-group-icon">' + group.icon + '</span>';
      html += '    <span class="ot-group-label">' + group.label + '</span>';
      html += '    <span class="ot-group-count">' + groupItems.length + '项</span>';
      html += '  </div>';

      groupItems.forEach(function(item) {
        var inst = item.instance;
        var task = item.task;
        var cat = TASK_CATEGORY_CONFIG[task.category] || TASK_CATEGORY_CONFIG.other;
        var isDone = inst.status === 'done';
        var isInProgress = inst.status === 'in_progress';

        html += '<div class="ot-task-row ' + (isDone ? 'ot-done' : '') + '" data-instance-id="' + inst.id + '">';
        // 分类色条
        html += '  <div class="ot-task-bar" style="background:' + cat.color + '"></div>';
        // 复选框
        html += '  <div class="ot-task-check" data-action="toggle" data-instance-id="' + inst.id + '">';
        if (isDone) {
          html += '    <svg viewBox="0 0 24 24" width="20" height="20"><circle cx="12" cy="12" r="10" fill="' + cat.color + '"/><path d="M7 12l3 3 7-7" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>';
        } else if (isInProgress) {
          html += '    <svg viewBox="0 0 24 24" width="20" height="20"><circle cx="12" cy="12" r="10" fill="none" stroke="' + cat.color + '" stroke-width="2" stroke-dasharray="31.4 31.4"/><circle cx="12" cy="12" r="10" fill="none" stroke="' + cat.color + '" stroke-width="2" stroke-dasharray="15.7 47.1" stroke-linecap="round"/></svg>';
        } else {
          html += '    <svg viewBox="0 0 24 24" width="20" height="20"><circle cx="12" cy="12" r="10" fill="none" stroke="#D1D5DB" stroke-width="2"/></svg>';
        }
        html += '  </div>';
        // 内容
        html += '  <div class="ot-task-body">';
        html += '    <div class="ot-task-title">' + task.icon + ' ' + task.title + '</div>';
        html += '    <div class="ot-task-meta">';
        html += '      <span class="ot-task-cat" style="color:' + cat.color + '">' + cat.label + '</span>';
        html += '      <span class="ot-task-time">' + (task.time || '') + '</span>';
        html += '    </div>';
        html += '  </div>';
        // 操作
        html += '  <div class="ot-task-actions">';
        if (!isDone) {
          html += '    <button class="ot-btn-progress" data-action="progress" data-instance-id="' + inst.id + '" title="标记进行中">▶</button>';
        }
        if (isDone || isInProgress) {
          html += '    <button class="ot-btn-undo" data-action="undo" data-instance-id="' + inst.id + '" title="撤销">↩</button>';
        }
        html += '  </div>';
        html += '</div>';
      });

      html += '</div>';
    });

    // ===== 临时任务 =====
    if (adhocItems.length > 0) {
      html += '<div class="ot-group">';
      html += '  <div class="ot-group-header">';
      html += '    <span class="ot-group-icon">📌</span>';
      html += '    <span class="ot-group-label">待办事项</span>';
      html += '    <span class="ot-group-count">' + adhocItems.length + '项</span>';
      html += '  </div>';

      adhocItems.forEach(function(item) {
        var task = item.task;
        var cat = TASK_CATEGORY_CONFIG[task.category] || TASK_CATEGORY_CONFIG.other;
        var isOverdue = task.dueDate && task.dueDate < today;

        html += '<div class="ot-task-row ot-adhoc" data-task-id="' + task.id + '">';
        html += '  <div class="ot-task-bar" style="background:' + cat.color + '"></div>';
        html += '  <div class="ot-task-check ot-check-adhoc">';
        html += '    <svg viewBox="0 0 24 24" width="20" height="20"><rect x="4" y="4" width="16" height="16" rx="3" fill="none" stroke="#D1D5DB" stroke-width="2"/></svg>';
        html += '  </div>';
        html += '  <div class="ot-task-body">';
        html += '    <div class="ot-task-title">' + task.icon + ' ' + task.title + '</div>';
        html += '    <div class="ot-task-meta">';
        html += '      <span class="ot-task-cat" style="color:' + cat.color + '">' + cat.label + '</span>';
        if (task.dueDate) {
          html += '    <span class="ot-task-due ' + (isOverdue ? 'ot-overdue' : '') + '">📅 ' + task.dueDate + (task.dueTime ? ' ' + task.dueTime : '') + '</span>';
        }
        html += '    </div>';
        html += '  </div>';
        html += '</div>';
      });

      html += '</div>';
    }

    // ===== 本周打卡 =====
    html += '<div class="ot-week-section">';
    html += '  <div class="ot-group-header" style="margin-bottom:12px;">';
    html += '    <span class="ot-group-icon">📅</span>';
    html += '    <span class="ot-group-label">本周打卡</span>';
    html += '  </div>';
    html += '  <div class="ot-week-grid">';

    // 获取本周每天数据
    for (var i = 6; i >= 0; i--) {
      var dt = new Date();
      dt.setDate(dt.getDate() - i);
      var ds = dt.getFullYear() + '-' + String(dt.getMonth()+1).padStart(2,'0') + '-' + String(dt.getDate()).padStart(2,'0');
      var dayLabel = weekLabels[dt.getDay()];

      // 获取该日实例统计
      DataStore.generateDailyInstances(ds);
      var dayInstances = DataStore.getTaskInstances(ds);
      var dayDone = dayInstances.filter(function(inst) { return inst.status === 'done'; }).length;
      var dayTotal = dayInstances.length;
      var ratio = dayTotal > 0 ? dayDone / dayTotal : 0;
      var isToday = ds === today;

      html += '<div class="ot-week-day ' + (isToday ? 'ot-week-today' : '') + '">';
      html += '  <div class="ot-week-label">周' + dayLabel + '</div>';
      html += '  <div class="ot-week-ring" style="--ratio:' + ratio + '">';
      html += '    <svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="16" fill="none" stroke="#E5E7EB" stroke-width="3"/>';
      html += '    <circle cx="20" cy="20" r="16" fill="none" stroke="' + (ratio > 0.5 ? '#52C41A' : '#1890FF') + '" stroke-width="3" ' +
              'stroke-dasharray="' + (ratio * 100.5).toFixed(1) + ' 100.5" stroke-linecap="round" transform="rotate(-90 20 20)"/>';
      html += '    </svg>';
      html += '    <span class="ot-week-num">' + (ratio > 0 ? dayDone : '') + '</span>';
      html += '  </div>';
      html += '  <div class="ot-week-date">' + (dt.getMonth()+1) + '/' + dt.getDate() + '</div>';
      html += '</div>';
    }
    html += '  </div>';
    html += '</div>';

    // ===== 添加按钮 =====
    html += '<div style="text-align:center;margin:24px 0 32px;">';
    html += '  <button id="btn-add-task" class="ot-add-btn">+ 新建任务</button>';
    html += '</div>';

    contentArea.innerHTML = html;
    bindTaskEvents(today);
  }

  function bindTaskEvents(today) {
    var container = document.getElementById('tasks-content');
    if (!container) return;

    container.addEventListener('click', function(e) {
      var toggleEl = e.target.closest('[data-action="toggle"]');
      var progressEl = e.target.closest('[data-action="progress"]');
      var undoEl = e.target.closest('[data-action="undo"]');

      if (toggleEl) {
        var instanceId = toggleEl.dataset.instanceId;
        var inst = DataStore.updateTaskInstance(instanceId, today, { status: 'done' });
        if (inst) renderTasks();
      }

      if (progressEl) {
        var instanceId = progressEl.dataset.instanceId;
        var inst = DataStore.updateTaskInstance(instanceId, today, { status: 'in_progress' });
        if (inst) renderTasks();
      }

      if (undoEl) {
        var instanceId = undoEl.dataset.instanceId;
        DataStore.updateTaskInstance(instanceId, today, { status: 'todo' });
        renderTasks();
      }

      if (e.target.closest('#btn-add-task')) {
        showAddTaskModal();
      }
    });
  }

  function showAddTaskModal() {
    var overlay = document.createElement('div');
    overlay.className = 'modal-overlay active';
    overlay.id = 'add-task-modal';

    var catOptions = '';
    Object.keys(TASK_CATEGORY_CONFIG).forEach(function(k) {
      var c = TASK_CATEGORY_CONFIG[k];
      catOptions += '<option value="' + k + '">' + c.label + '</option>';
    });

    overlay.innerHTML =
      '<div class="modal-content" style="max-width:440px;">' +
      '<div class="modal-header"><span class="modal-title">新建任务</span><button class="modal-close" onclick="document.getElementById(\'add-task-modal\').remove();document.body.style.overflow=\'\';">&times;</button></div>' +
      '<div class="modal-body">' +
      // 类型切换
      '<div class="ot-modal-type-tabs">' +
      '  <button class="ot-type-tab active" data-type="routine" onclick="switchTaskType(\'routine\')">📋 规律任务</button>' +
      '  <button class="ot-type-tab" data-type="adhoc" onclick="switchTaskType(\'adhoc\')">📌 临时任务</button>' +
      '</div>' +
      // 基础字段
      '<div style="margin-bottom:12px;"><label class="form-label">任务名称</label><input class="form-input" id="new-task-title" placeholder="例：做早操" style="width:100%;padding:10px 14px;border:1.5px solid #ddd;border-radius:8px;"></div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">' +
      '<div><label class="form-label">图标</label><input class="form-input" id="new-task-icon" placeholder="🏃" maxlength="2" style="width:100%;padding:10px 14px;border:1.5px solid #ddd;border-radius:8px;"></div>' +
      '<div><label class="form-label">分类</label><select class="form-input" id="new-task-category" style="width:100%;padding:10px 14px;border:1.5px solid #ddd;border-radius:8px;">' + catOptions + '</select></div></div>' +
      // routine 专属字段
      '<div id="routine-fields">' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">' +
      '<div><label class="form-label">重复规律</label><select class="form-input" id="new-task-pattern" style="width:100%;padding:10px 14px;border:1.5px solid #ddd;border-radius:8px;"><option value="daily">每天</option><option value="weekly">每周</option></select></div>' +
      '<div><label class="form-label">时间</label><input class="form-input" id="new-task-time" type="time" value="09:00" style="width:100%;padding:10px 14px;border:1.5px solid #ddd;border-radius:8px;"></div></div>' +
      '<div id="weekday-picker" style="display:none;margin-bottom:12px;">' +
      '<label class="form-label" style="margin-bottom:6px;display:block;">重复日</label>' +
      '<div class="ot-weekday-grid">' +
      '  <button class="ot-weekday-btn" data-day="1">一</button>' +
      '  <button class="ot-weekday-btn" data-day="2">二</button>' +
      '  <button class="ot-weekday-btn" data-day="3">三</button>' +
      '  <button class="ot-weekday-btn" data-day="4">四</button>' +
      '  <button class="ot-weekday-btn" data-day="5">五</button>' +
      '  <button class="ot-weekday-btn" data-day="6">六</button>' +
      '  <button class="ot-weekday-btn" data-day="7">日</button>' +
      '</div></div>' +
      '<div style="margin-bottom:12px;"><label class="form-label">负责人</label><select class="form-input" id="new-task-assignee" style="width:100%;padding:10px 14px;border:1.5px solid #ddd;border-radius:8px;"><option value="youth">心青年</option><option value="parent">家长</option><option value="teacher">老师</option><option value="caregiver">影子老师</option></select></div>' +
      '</div>' +
      // adhoc 专属字段
      '<div id="adhoc-fields" style="display:none;">' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">' +
      '<div><label class="form-label">截止日期</label><input class="form-input" id="new-task-dueDate" type="date" style="width:100%;padding:10px 14px;border:1.5px solid #ddd;border-radius:8px;"></div>' +
      '<div><label class="form-label">截止时间</label><input class="form-input" id="new-task-dueTime" type="time" style="width:100%;padding:10px 14px;border:1.5px solid #ddd;border-radius:8px;"></div></div>' +
      '</div>' +
      '<button class="btn btn-primary" style="width:100%;padding:12px;border-radius:10px;margin-top:8px;" onclick="submitNewTask()">添加任务</button>' +
      '</div></div>';

    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';
    document.getElementById('new-task-title').focus();

    // 绑定类型切换事件
    document.querySelectorAll('.ot-type-tab').forEach(function(btn) {
      btn.addEventListener('click', function() {
        document.querySelectorAll('.ot-type-tab').forEach(function(b) { b.classList.remove('active'); });
        btn.classList.add('active');
        var isRoutine = btn.dataset.type === 'routine';
        document.getElementById('routine-fields').style.display = isRoutine ? '' : 'none';
        document.getElementById('adhoc-fields').style.display = isRoutine ? 'none' : '';
      });
    });

    // 绑定 weekday 选择
    document.querySelectorAll('.ot-weekday-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        btn.classList.toggle('selected');
      });
    });

    // 绑定 pattern 变化
    document.getElementById('new-task-pattern').addEventListener('change', function() {
      document.getElementById('weekday-picker').style.display = this.value === 'weekly' ? '' : 'none';
    });
  }

  window.switchTaskType = function(type) {
    // handled by event listeners above
  };

  window.submitNewTask = function() {
    var title = document.getElementById('new-task-title').value.trim();
    if (!title) { showToast('请输入任务名称'); return; }

    var typeTab = document.querySelector('.ot-type-tab.active');
    var taskType = typeTab ? typeTab.dataset.type : 'routine';
    var icon = document.getElementById('new-task-icon').value.trim() || '📋';
    var category = document.getElementById('new-task-category').value || 'other';

    if (taskType === 'routine') {
      var pattern = document.getElementById('new-task-pattern').value;
      var time = document.getElementById('new-task-time').value || '09:00';
      var assignee = document.getElementById('new-task-assignee').value;
      var weekdays = [];
      if (pattern === 'weekly') {
        document.querySelectorAll('.ot-weekday-btn.selected').forEach(function(b) {
          weekdays.push(parseInt(b.dataset.day));
        });
        if (weekdays.length === 0) {
          showToast('请至少选择一个重复日'); return;
        }
      }
      DataStore.addTask({
        title: title, icon: icon, category: category,
        type: 'routine', pattern: pattern,
        weekdays: weekdays, time: time, assignee: assignee,
        createdBy: (DataStore.getCurrentUser() || {}).role || 'parent'
      });
    } else {
      var dueDate = document.getElementById('new-task-dueDate').value || null;
      var dueTime = document.getElementById('new-task-dueTime').value || null;
      DataStore.addTask({
        title: title, icon: icon, category: category,
        type: 'adhoc', dueDate: dueDate, dueTime: dueTime,
        assignee: 'parent',
        createdBy: (DataStore.getCurrentUser() || {}).role || 'parent'
      });
    }

    document.getElementById('add-task-modal').remove();
    document.body.style.overflow = '';
    showToast('任务已添加');
    renderTasks();
  };

  /* ==========================================================
   * 医疗信息冲突修复
   * ========================================================== */
  window.fixMedicalConflict = function () {
    var ci = DataStore.getCareInfo();
    if (!ci) return;
    // 从系统数据中推断正确的用药信息
    var tasks = DataStore.getTasks().filter(function (t) {
      return t.category === 'medication' && t.isActive !== false;
    });
    var events = DataStore.getEvents().filter(function (e) {
      return e.title && (e.title.indexOf('服药') !== -1 || e.title.indexOf('用药') !== -1);
    });

    var newMedicine = '无';
    var details = [];
    if (tasks.length > 0) {
      newMedicine = tasks.map(function (t) { return t.title; }).join('、');
      details.push(tasks.length + '项用药任务');
    }
    if (events.length > 0) {
      newMedicine = events.map(function (e) { return e.title + (e.time ? ' ' + e.time : ''); }).join('、');
      details.push(events.length + '项用药提醒');
    }
    if (details.length === 0) {
      showToast('未检测到用药相关数据，无需更新');
      return;
    }

    if (confirm('检测到系统中存在用药数据（' + details.join('、') + '），是否将档案的用药信息更新为：\n\n' + newMedicine + '\n\n这将以系统数据为准覆盖当前"无用药"标注。')) {
      DataStore.forceUpdateCareInfo({ medicine: newMedicine });
      careInfo = DataStore.getCareInfo();
      showToast('医疗信息已更新');
      // 刷新当前页面显示
      handleRouteChange();
    }
  };

  /* ==========================================================
   * 十四、日程日历页面
   * ========================================================== */

  function renderCalendar() {
    var contentArea = document.getElementById('calendar-content');
    if (!contentArea) return;
    var now = new Date();
    if (calendarState.currentYear === 0) {
      calendarState.currentYear = now.getFullYear();
      calendarState.currentMonth = now.getMonth();
    }
    if (!calendarState.selectedDate) calendarState.selectedDate = getTodayString();

    var events = DataStore.getEvents();
    var html = '';

    // 月份导航
    html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;">';
    html += '<button id="cal-prev" class="btn btn-ghost" style="padding:8px 16px;">◀ 上月</button>';
    html += '<h2 style="margin:0;font-size:1.2rem;">' + calendarState.currentYear + '年' + (calendarState.currentMonth + 1) + '月</h2>';
    html += '<button id="cal-next" class="btn btn-ghost" style="padding:8px 16px;">下月 ▶</button>';
    html += '</div>';

    // 即将到来的事件提醒
    var upcoming = events.filter(function(e) { return e.date >= getTodayString(); }).sort(function(a,b) { return a.date.localeCompare(b.date); }).slice(0, 3);
    if (upcoming.length > 0) {
      html += '<div style="margin-bottom:20px;">';
      html += '<h3 style="font-size:0.95rem;margin-bottom:8px;">🔔 即将到来</h3>';
      upcoming.forEach(function(e) {
        html += '<div class="cal-upcoming-item" style="border-left:4px solid ' + (e.color||'#4A90D9') + ';background:#fff;border-radius:0 8px 8px 0;padding:10px 14px;margin-bottom:8px;box-shadow:0 1px 4px rgba(0,0,0,0.04);">';
        html += '<div style="display:flex;justify-content:space-between;align-items:center;">';
        html += '<span style="font-weight:600;">' + e.icon + ' ' + e.title + '</span>';
        html += '<span style="font-size:0.8rem;color:#999;">' + e.date + (e.time ? ' ' + e.time : '') + '</span>';
        html += '</div>';
        if (e.description) html += '<div style="font-size:0.82rem;color:#666;margin-top:4px;">' + e.description + '</div>';
        html += '</div>';
      });
      html += '</div>';
    }

    // 日历网格
    html += '<div class="calendar-grid">';
    var weekdays = ['日','一','二','三','四','五','六'];
    weekdays.forEach(function(d) {
      html += '<div class="cal-weekday">' + d + '</div>';
    });

    var firstDay = new Date(calendarState.currentYear, calendarState.currentMonth, 1).getDay();
    var daysInMonth = new Date(calendarState.currentYear, calendarState.currentMonth + 1, 0).getDate();
    var today = getTodayString();
    var eventDateMap = {};
    events.forEach(function(e) {
      if (!eventDateMap[e.date]) eventDateMap[e.date] = [];
      eventDateMap[e.date].push(e);
    });

    for (var i = 0; i < firstDay; i++) {
      html += '<div class="cal-day empty"></div>';
    }
    for (var d = 1; d <= daysInMonth; d++) {
      var dateStr = calendarState.currentYear + '-' + String(calendarState.currentMonth + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
      var isToday = dateStr === today;
      var isSelected = dateStr === calendarState.selectedDate;
      var dayEvents = eventDateMap[dateStr] || [];
      var cls = 'cal-day';
      if (isToday) cls += ' cal-today';
      if (isSelected) cls += ' cal-selected';
      html += '<div class="' + cls + '" data-date="' + dateStr + '">';
      html += '<div class="cal-day-num">' + d + '</div>';
      if (dayEvents.length > 0) {
        html += '<div class="cal-dots">';
        dayEvents.slice(0, 3).forEach(function(e) {
          html += '<span class="cal-dot" style="background:' + (e.color || '#4A90D9') + ';"></span>';
        });
        if (dayEvents.length > 3) html += '<span style="font-size:0.6rem;color:#999;">+' + (dayEvents.length-3) + '</span>';
        html += '</div>';
      }
      html += '</div>';
    }
    html += '</div>';

    // 选中日期事件详情
    html += '<div class="cal-event-panel">';
    html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">';
    html += '<h3 style="margin:0;font-size:1rem;">' + calendarState.selectedDate + ' 的日程</h3>';
    html += '<button id="btn-add-event" class="btn btn-primary" style="padding:6px 16px;font-size:0.85rem;border-radius:8px;">+ 添加日程</button>';
    html += '</div>';
    var selEvents = DataStore.getEventsByDate(calendarState.selectedDate);
    if (selEvents.length === 0) {
      html += '<div class="empty-state" style="padding:24px;"><div class="empty-icon">📅</div><div class="empty-text">当天没有日程安排</div></div>';
    } else {
      selEvents.sort(function(a,b) { return (a.time||'').localeCompare(b.time||''); });
      selEvents.forEach(function(evt) {
        html += '<div class="cal-event-item" style="border-left:4px solid ' + (evt.color||'#4A90D9') + ';background:#fff;border-radius:0 8px 8px 0;padding:12px 16px;margin-bottom:8px;box-shadow:0 1px 4px rgba(0,0,0,0.04);">';
        html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">';
        html += '<span style="font-weight:600;">' + evt.icon + ' ' + evt.title + '</span>';
        if (evt.time) html += '<span style="font-size:0.82rem;color:#999;">' + evt.time + (evt.endTime ? ' - ' + evt.endTime : '') + '</span>';
        html += '</div>';
        if (evt.description) html += '<div style="font-size:0.85rem;color:#666;">' + evt.description + '</div>';
        html += '<div style="text-align:right;margin-top:6px;"><button class="cal-event-del" data-id="' + evt.id + '" style="font-size:0.78rem;color:#F5222D;background:none;border:none;cursor:pointer;">删除</button></div>';
        html += '</div>';
      });
    }
    html += '</div>';

    contentArea.innerHTML = html;
    bindCalendarEvents();
  }

  function bindCalendarEvents() {
    var content = document.getElementById('calendar-content');
    content.addEventListener('click', function(e) {
      if (e.target.closest('#cal-prev')) {
        calendarState.currentMonth--;
        if (calendarState.currentMonth < 0) { calendarState.currentMonth = 11; calendarState.currentYear--; }
        renderCalendar();
      }
      if (e.target.closest('#cal-next')) {
        calendarState.currentMonth++;
        if (calendarState.currentMonth > 11) { calendarState.currentMonth = 0; calendarState.currentYear++; }
        renderCalendar();
      }
      var dayEl = e.target.closest('.cal-day[data-date]');
      if (dayEl) {
        calendarState.selectedDate = dayEl.dataset.date;
        renderCalendar();
      }
      if (e.target.closest('.cal-event-del')) {
        var id = e.target.closest('.cal-event-del').dataset.id;
        DataStore.deleteEvent(id);
        showToast('日程已删除');
        renderCalendar();
      }
      if (e.target.closest('#btn-add-event')) {
        showAddEventModal();
      }
    });
  }

  function showAddEventModal() {
    var overlay = document.createElement('div');
    overlay.className = 'modal-overlay active';
    overlay.id = 'add-event-modal';
    overlay.innerHTML = '<div class="modal-content" style="max-width:440px;">' +
      '<div class="modal-header"><span class="modal-title">添加日程</span><button class="modal-close" onclick="document.getElementById(\'add-event-modal\').remove();document.body.style.overflow=\'\';">&times;</button></div>' +
      '<div class="modal-body">' +
      '<div style="margin-bottom:12px;"><label class="form-label">标题</label><input class="form-input" id="new-event-title" placeholder="例如：看医生" style="width:100%;padding:10px 14px;border:1.5px solid #ddd;border-radius:8px;"></div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">' +
      '<div><label class="form-label">日期</label><input class="form-input" id="new-event-date" type="date" value="' + (calendarState.selectedDate || getTodayString()) + '" style="width:100%;padding:10px 14px;border:1.5px solid #ddd;border-radius:8px;"></div>' +
      '<div><label class="form-label">时间</label><input class="form-input" id="new-event-time" type="time" style="width:100%;padding:10px 14px;border:1.5px solid #ddd;border-radius:8px;"></div></div>' +
      '<div style="margin-bottom:12px;"><label class="form-label">描述</label><textarea class="form-input" id="new-event-desc" placeholder="补充说明" rows="2" style="width:100%;padding:10px 14px;border:1.5px solid #ddd;border-radius:8px;resize:vertical;"></textarea></div>' +
      '<div style="margin-bottom:12px;"><label class="form-label">类型</label><select id="new-event-type" style="width:100%;padding:10px 14px;border:1.5px solid #ddd;border-radius:8px;">' +
      '<option value="medical">🏥 医疗</option><option value="activity">🎨 活动</option><option value="meeting">📋 会议</option><option value="reminder">💊 提醒</option><option value="custom">📌 其他</option></select></div>' +
      '<button class="btn btn-primary" style="width:100%;padding:12px;border-radius:10px;" onclick="submitNewEvent()">添加日程</button>' +
      '</div></div>';
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';
    document.getElementById('new-event-title').focus();
  }

  window.submitNewEvent = function() {
    var title = document.getElementById('new-event-title').value.trim();
    if (!title) { showToast('请输入日程标题'); return; }
    var date = document.getElementById('new-event-date').value;
    if (!date) { showToast('请选择日期'); return; }
    var time = document.getElementById('new-event-time').value || '';
    var desc = document.getElementById('new-event-desc').value.trim();
    var type = document.getElementById('new-event-type').value;
    var icons = { medical: '🏥', activity: '🎨', meeting: '📋', reminder: '💊', custom: '📌' };
    var colors = { medical: '#F5222D', activity: '#FAAD14', meeting: '#4A90D9', reminder: '#722ED1', custom: '#13C2C2' };
    var user = appState.currentUser;
    DataStore.addEvent({
      title: title, type: type, icon: icons[type] || '📌',
      date: date, time: time, description: desc,
      recurring: 'none', priority: 'medium', color: colors[type] || '#4A90D9',
      author: user ? user.name : '未知', authorRole: user ? user.role : 'parent'
    });
    document.getElementById('add-event-modal').remove();
    document.body.style.overflow = '';
    showToast('日程已添加');
    renderCalendar();
  };

  /* ==========================================================
   * 十五、DOMContentLoaded 启动
   * ========================================================== */
  document.addEventListener('DOMContentLoaded', initApp);

  /* ==========================================================
   * 十六、导出与打印模块
   * ========================================================== */
  var ExportModule = {
    exportToPDF: function(elementId, filename) {
      var element = document.getElementById(elementId);
      if (!element) { showToast('找不到导出内容'); return; }
      showToast('正在生成PDF，请稍候...');
      var opt = {
        margin: [10, 10, 10, 10],
        filename: (filename || 'AI懂我导出') + '.pdf',
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      html2pdf().set(opt).from(element).save();
    },
    exportRecords: function() {
      var records = DataStore.getRecords();
      if (records.length === 0) { showToast('暂无记录可导出'); return; }
      var container = document.createElement('div');
      container.id = 'export-temp';
      container.style.cssText = 'position:absolute;left:-9999px;top:0;width:800px;background:#fff;padding:32px;font-family:"Microsoft YaHei",sans-serif;color:#333;';
      var html = '';
      html += '<div style="text-align:center;margin-bottom:24px;">';
      html += '<h1 style="font-size:1.5rem;color:#4A90D9;margin:0;">AI懂我 - 心智障碍者动态支持档案</h1>';
      html += '<p style="color:#999;font-size:0.85rem;">记录导出 · ' + getTodayString() + '</p>';
      html += '</div>';
      records.sort(function(a,b) { return (b.date+b.time).localeCompare(a.date+a.time); });
      var lastDate = '';
      records.forEach(function(r) {
        if (r.date !== lastDate) {
          html += '<h2 style="font-size:1rem;color:#4A90D9;border-bottom:1px solid #eee;padding-bottom:4px;margin:16px 0 8px;">' + r.date + '</h2>';
          lastDate = r.date;
        }
        var typeLabel = RECORD_TYPES[r.type] ? RECORD_TYPES[r.type].label : r.type;
        html += '<div style="background:#f9fafb;border-radius:8px;padding:12px 16px;margin-bottom:8px;border-left:3px solid #4A90D9;">';
        html += '<div style="display:flex;justify-content:space-between;font-size:0.8rem;color:#999;margin-bottom:4px;">';
        html += '<span>' + (r.author||'') + ' · ' + typeLabel + '</span>';
        html += '<span>' + (r.time||'') + '</span>';
        html += '</div>';
        if (r.title) html += '<div style="font-weight:600;margin-bottom:4px;">' + r.title + '</div>';
        html += '<div style="font-size:0.9rem;line-height:1.6;">' + r.content + '</div>';
        if (r.mood) html += '<div style="margin-top:4px;font-size:0.85rem;">心情：' + r.mood + '</div>';
        if (r.emotion_type) html += '<div style="margin-top:4px;font-size:0.85rem;">情绪：' + r.emotion_type + '</div>';
        html += '</div>';
      });
      html += '<div style="text-align:center;margin-top:24px;color:#ccc;font-size:0.75rem;">由「AI懂我」系统生成</div>';
      container.innerHTML = html;
      document.body.appendChild(container);
      this.exportToPDF('export-temp', 'AI懂我-记录导出-' + getTodayString());
      setTimeout(function() { container.remove(); }, 5000);
    }
  };

  /* ==========================================================
   * 十七、暴露到全局作用域（供HTML onclick调用）
   * ========================================================== */
  window.openQuickCard = function () { window.location.hash = 'quickcard'; };
  window.closeQuickCard = function () { window.location.hash = 'home'; };
  window.switchVersion = function () { window.location.hash = 'quickcard'; };
  window.printQuickCard = function () { window.print(); };
  window.switchRole = window.Permissions.switchRole;
  window.openAddRecordModal = window.RecordsPage.openAddRecordModal;
  window.closeAddRecordModal = window.RecordsPage.closeAddRecordModal;
  window.doLogin = window.Auth.doLogin;
  window.doRegister = window.Auth.doRegister;
  window.logout = window.Auth.logout;
  window.ExportModule = ExportModule;
  window.renderTimeline = window.TimelinePage.renderTimeline;
  window.renderCharts = window.ChartsPage.renderCharts;
  window.renderProfile = window.ProfilePage.renderProfile;
  window.renderLatestActivity = renderLatestActivity;
  window.renderRecordCard = renderRecordCard;
  window.renderBottomNav = renderBottomNav;

})();