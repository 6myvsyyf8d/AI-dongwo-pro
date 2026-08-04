/**
 * ============================================================
 * AI懂我 - 心智障碍者动态可视化支持档案
 * 小雨虚拟案例原型 v2.0 - 多角色协同记录系统
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
 *   12. chatbot.js    - 对话采集
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
  var emotionSupport = C.emotionSupport;
  var careInfo = C.careInfo;
  var workInfo = C.workInfo;
  var dailyRoutine = C.dailyRoutine;
  var relationsInfo = C.relationsInfo;
  var quickCardVersions = C.quickCardVersions;
  var privacyLevels = C.privacyLevels;
  var chatScript = C.chatScript;
  var routeMap = C.routeMap;
  var SIDEBAR_MENU = C.SIDEBAR_MENU;
  var STRATEGY_KB = C.STRATEGY_KB;
  var EMOTION_TO_STRATEGY = C.EMOTION_TO_STRATEGY;
  var DataStore = window.DataStore;
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
    navigateTo(hash);
  }

  /**
   * 处理路由变化
   */
  function handleRouteChange() {
    var hash = window.location.hash.replace('#', '') || 'home';
    var user = DataStore.getCurrentUser() || appState.currentUser;
    if (!user && hash !== 'login') {
      window.location.hash = 'login';
      return;
    }
    navigateTo(hash);
  }

  /**
   * 渲染侧边栏菜单
   */
  function renderSidebar() {
    var menuContainer = Utils.dom.get('sidebar-menu');
    if (!menuContainer) return;

    var html = '';
    SIDEBAR_MENU.forEach(function (group) {
      html += '<div class="sidebar-menu-group">';
      html += '  <div class="sidebar-menu-label">' + group.group + '</div>';
      group.items.forEach(function (item) {
        html += '  <div class="sidebar-menu-item" data-route="' + item.hash + '">';
        html += '    <span class="menu-icon">' + item.icon + '</span>';
        html += '    <span>' + item.label + '</span>';
        html += '  </div>';
      });
      html += '</div>';
    });

    Utils.dom.html(menuContainer, html);

    // 绑定菜单点击事件
    var menuItems = menuContainer.querySelectorAll('.sidebar-menu-item');
    menuItems.forEach(function (item) {
      Utils.dom.on(item, 'click', function () {
        var route = this.getAttribute('data-route');
        if (route) {
          window.location.hash = route;
          // 移动端关闭侧边栏
          document.body.classList.remove('sidebar-open');
        }
      });
    });
  }

  /**
   * 高亮当前侧边栏菜单项
   */
  function highlightSidebarItem(route) {
    var menuItems = document.querySelectorAll('.sidebar-menu-item');
    menuItems.forEach(function (item) {
      item.classList.remove('active');
      if (item.getAttribute('data-route') === route) {
        item.classList.add('active');
      }
    });
  }

  /**
   * 导航到指定页面
   * @param {string} pageName - 页面名称（如 'home', 'life' 等）
   */
  function navigateTo(pageName) {
    // 如果页面不存在则回到首页
    if (!routeMap[pageName]) {
      pageName = 'home';
    }

    // 切换 body 模式
    if (pageName === 'login') {
      document.body.classList.add('mode-login');
      document.body.classList.remove('mode-app');
    } else {
      document.body.classList.add('mode-app');
      document.body.classList.remove('mode-login');
    }

    // 隐藏所有页面section
    var sections = document.querySelectorAll('.page-section');
    sections.forEach(function (section) {
      section.classList.remove('active');
    });

    // 显示目标页面
    var targetSection = document.getElementById(pageName);
    if (targetSection) {
      targetSection.classList.add('active');
    }

    currentPage = pageName;
    appState.currentPage = pageName;

    // 高亮侧边栏菜单
    highlightSidebarItem(pageName);

    // 滚动到页面顶部
    window.scrollTo(0, 0);

    // 根据页面类型调用对应渲染函数
    renderPage(pageName);

    // 应用当前角色的隐私设置
    window.Permissions.applyPrivacy(currentRole);
  }

  /**
   * 根据页面名称调用对应的渲染函数
   * @param {string} pageName - 页面名称
   */
  function renderPage(pageName) {
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
      case 'collect':
        window.ChatBot.renderCollectPage();
        break;
      case 'login':
        window.Auth.renderRoleSelect();
        break;
      case 'profile':
        window.ProfilePage.renderProfile();
        break;
      case 'charts': window.ChartsPage.renderCharts(); break;
      case 'tasks': renderTasks(); break;
      case 'calendar': renderCalendar(); break;
      case 'archive': renderArchive(); break;
      case 'analytics': renderAnalytics(); break;
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

    // 渲染Hero区域的基本信息
    var heroNameEl = document.getElementById('hero-name');
    var heroAgeEl = document.getElementById('hero-age');
    var heroIntroEl = document.getElementById('hero-intro');
    var heroTagsEl = document.getElementById('hero-tags');
    var alertBannerEl = document.getElementById('alert-banner');
    var cardGridEl = document.getElementById('card-grid');

    if (heroNameEl) heroNameEl.textContent = basicInfo.name;
    if (heroAgeEl) heroAgeEl.textContent = basicInfo.age + '岁 · ' + basicInfo.gender;
    if (heroIntroEl) heroIntroEl.textContent = basicInfo.intro;

    // 渲染标签
    if (heroTagsEl) {
      var tagsHTML = '';
      var tagTexts = ['烘焙达人', '公交活地图', '安静男孩', '弹琴中', '爱心满满'];
      tagTexts.forEach(function (t) {
        tagsHTML += '<span class="tag">' + t + '</span>';
      });
      heroTagsEl.innerHTML = tagsHTML;
    }

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
            window.QuickCard.createQuickCardModal();
          } else if (action === 'add-mood') {
            window.RecordsPage.createAddRecordModal(user, role, 'mood');
          } else if (target === 'collect') {
            navigateTo('collect');
          } else {
            window.location.hash = target;
          }
        });
      });
    }

    // 渲染欢迎语（根据当前角色）
    renderWelcomeBanner(user);

    // 渲染最新动态区域
    renderLatestActivity(user);

    // 渲染添加记录浮动按钮
    renderFAB();
  }

  /**
   * 获取角色定制的导航卡片配置
   */
  function getRoleCards(role) {
    var roleCards = {
      parent: [
        { hash: 'archive', icon: '📋', title: '完整档案', desc: '六大主题档案分类查看' },
        { hash: 'timeline', icon: '📅', title: '动态时间轴', desc: '所有记录按时间排列' },
        { hash: 'tasks', icon: '✅', title: '每日任务', desc: '打卡清单、完成进度' },
        { hash: 'analytics', icon: '📈', title: '数据价值', desc: '统计分析、数据导出' },
        { hash: 'charts', icon: '📊', title: '数据可视化', desc: '心情趋势、统计图表' }
      ],
      teacher: [
        { hash: 'communication', icon: '💬', title: '沟通说明书', desc: '有效话术、禁忌用语' },
        { hash: 'tasks', icon: '✅', title: '每日任务', desc: '今日活动、打卡进度' },
        { hash: 'calendar', icon: '📆', title: '日程日历', desc: '课程安排、重要事项' },
        { hash: 'quick-card', icon: '📋', title: '速读卡', desc: '快速了解小雨', action: 'quick-card' }
      ],
      caregiver: [
        { hash: 'care', icon: '🏥', title: '照护要点', desc: '过敏、用药、作息提醒' },
        { hash: 'emotion', icon: '😰', title: '情绪支持', desc: '触发因素、安抚策略' },
        { hash: 'calendar', icon: '📆', title: '日程日历', desc: '今日安排、照护提醒' },
        { hash: 'quick-card', icon: '📋', title: '速读卡', desc: '快速参考卡片', action: 'quick-card' }
      ],
      volunteer: [
        { hash: 'quick-card', icon: '📋', title: '速读卡', desc: '3分钟了解小雨', action: 'quick-card' },
        { hash: 'communication', icon: '💬', title: '沟通方式', desc: '怎么和小雨说话' },
        { hash: 'calendar', icon: '📆', title: '今日活动', desc: '今天的活动安排' },
        { hash: 'life', icon: '⚠️', title: '注意事项', desc: '喜欢和不喜欢的事物' }
      ],
      self: [
        { hash: 'mood', icon: '💭', title: '记录心情', desc: '今天心情怎么样？', action: 'add-mood' },
        { hash: 'tasks', icon: '✅', title: '今日任务', desc: '今天要完成的事' },
        { hash: 'calendar', icon: '📆', title: '日程日历', desc: '今天的安排' },
        { hash: 'archive', icon: '📋', title: '我的档案', desc: '查看我的信息' }
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
      volunteer: '<div class="alert-item danger">🚫 不要给他吃海鲜（过敏）</div>' +
                 '<div class="alert-item warning">🚫 不要不打招呼碰他</div>' +
                 '<div class="alert-item info">💡 说话慢一点，一次说一件事</div>',
      self: '<div class="alert-item info">🌟 今天也要加油哦！</div>' +
            '<div class="alert-item warning">✅ 今天有烘焙练习</div>' +
            '<div class="alert-item info">💬 记得记录今天的心情</div>'
    };
    return roleAlerts[role] || roleAlerts.parent;
  }

  /**
   * 渲染欢迎语横幅
   */
  function renderWelcomeBanner(user) {
    var existingBanner = document.getElementById('welcome-banner');
    if (existingBanner) existingBanner.remove();

    var heroSection = document.querySelector('.hero-section') || document.getElementById('hero');
    if (!heroSection) return;

    var roleName = user ? (ROLES[user.role] ? ROLES[user.role].label : '访客') : '访客';
    var avatar = user ? (user.avatar || '👤') : '👤';
    var welcomeText = user ? ('欢迎回来，' + (user.name || '用户') + '！') : '欢迎使用AI懂我';

    // 根据角色定制引导信息
    var roleSubTexts = {
      parent: '您可以查看完整档案、添加记录、管理所有信息。',
      teacher: '您可以查看沟通指南、记录教学活动和观察。',
      caregiver: '您可以查看照护要点、记录日常护理和情绪状态。',
      volunteer: '您可以查看速读卡和沟通方式，记录陪伴观察。',
      self: '您可以记录今天的心情和感受，查看今日任务。'
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
      volunteer: ['accompany', 'activity'],
      self: ['mood', 'note']
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
   * 渲染"我喜欢的生活"页面 - 双列卡片（喜欢 & 不喜欢）
   */
  function renderLife() {
    var contentArea = document.getElementById('life-content');
    if (!contentArea) return;

    var html = '';

    // 喜欢的事物
    html += '<h2 class="section-title">💚 喜欢的事物</h2>';
    html += '<div class="two-col" style="margin-bottom:32px;">';
    likesList.forEach(function (item) {
      html += '<div class="content-card green">';
      html += '  <div style="font-size:2rem;margin-bottom:8px;">' + item.icon + '</div>';
      html += '  <div style="font-weight:600;font-size:1rem;margin-bottom:4px;">' + item.title + '</div>';
      html += '  <div style="font-size:0.88rem;color:#666;">' + item.desc + '</div>';
      html += '</div>';
    });
    html += '</div>';

    // 不喜欢的事物
    html += '<h2 class="section-title">🙅 不喜欢的事物</h2>';
    html += '<div class="two-col">';
    dislikesList.forEach(function (item) {
      html += '<div class="content-card red">';
      html += '  <div style="font-size:2rem;margin-bottom:8px;">' + item.icon + '</div>';
      html += '  <div style="font-weight:600;font-size:1rem;margin-bottom:4px;">' + item.title + '</div>';
      html += '  <div style="font-size:0.88rem;color:#666;">' + item.desc + '</div>';
      html += '</div>';
    });
    html += '</div>';

    contentArea.innerHTML = html;
  }

  /* ==========================================================
   * 四、沟通说明书页面渲染
   * ========================================================== */

  /**
   * 渲染沟通说明书页面 - 三段式卡片
   */
  function renderCommunication() {
    var contentArea = document.getElementById('communication-content');
    if (!contentArea) return;

    var html = '';

    // 推荐做法（绿色）
    html += '<h2 class="section-title">✅ 这样和他沟通最有效</h2>';
    html += '<div class="content-card green">';
    html += '  <div class="card-section-title">✅ 推荐做法</div>';
    html += '  <ul class="card-list">';
    communicationGuide.best.forEach(function (item) {
      html += '<li>' + item + '</li>';
    });
    html += '  </ul>';
    html += '</div>';

    // 注意事项（黄色）
    html += '<h2 class="section-title">⚠️ 需要注意</h2>';
    html += '<div class="content-card yellow">';
    html += '  <div class="card-section-title">⚠️ 注意事项</div>';
    html += '  <ul class="card-list">';
    communicationGuide.caution.forEach(function (item) {
      html += '<li>' + item + '</li>';
    });
    html += '  </ul>';
    html += '</div>';

    // 避免做法（红色）
    html += '<h2 class="section-title">🚫 一定不要这样做</h2>';
    html += '<div class="content-card red">';
    html += '  <div class="card-section-title">🚫 避免做法</div>';
    html += '  <ul class="card-list">';
    communicationGuide.avoid.forEach(function (item) {
      html += '<li>' + item + '</li>';
    });
    html += '  </ul>';
    html += '</div>';

    contentArea.innerHTML = html;
  }

  /* ==========================================================
   * 五、情绪与行为支持页面渲染
   * ========================================================== */

  /**
   * 渲染情绪与行为支持页面 - 流程图 + 彩色卡片
   */
  function renderEmotion() {
    var contentArea = document.getElementById('emotion-content');
    if (!contentArea) return;

    var html = '';

    // === AI情绪预警分析 ===
    var records = DataStore.getRecords();
    var emotionAlert = analyzeEmotionTrend(records);
    html += renderEmotionAlert(emotionAlert);

    // === AI策略推荐 ===
    html += '<h2 class="section-title">🧩 智能策略推荐</h2>';
    html += '<div style="background:#fff;border-radius:12px;padding:16px;margin-bottom:20px;box-shadow:0 1px 6px rgba(0,0,0,0.06);">';
    html += '  <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;">';
    html += '    <select id="strategy-emotion-select" style="padding:8px 12px;border:1px solid #ddd;border-radius:8px;font-size:0.85rem;background:#fff;">';
    html += '      <option value="">选择情绪状态...</option>';
    EMOTION_OPTIONS.forEach(function (e) {
      if (e.value !== 'happy' && e.value !== 'calm') {
        html += '      <option value="' + e.value + '">' + e.emoji + ' ' + e.value + '</option>';
      }
    });
    html += '    </select>';
    html += '    <select id="strategy-severity-select" style="padding:8px 12px;border:1px solid #ddd;border-radius:8px;font-size:0.85rem;background:#fff;">';
    html += '      <option value="mild">轻度</option>';
    html += '      <option value="moderate">中度</option>';
    html += '      <option value="severe">重度</option>';
    html += '    </select>';
    html += '    <button id="btn-get-strategy" style="padding:8px 20px;background:#4A90D9;color:#fff;border:none;border-radius:8px;font-size:0.85rem;cursor:pointer;">获取策略</button>';
    html += '  </div>';
    html += '  <div id="strategy-recommendation-area" style="min-height:60px;">';
    html += '    <div style="padding:16px;text-align:center;color:#999;font-size:0.9rem;">选择情绪状态和严重程度，获取个性化策略推荐</div>';
    html += '  </div>';
    html += '</div>';

    // 流程图：触发 → 预警 → 安抚 → 危机
    html += '<h2 class="section-title">情绪支持流程</h2>';
    html += '<div class="flow-indicator">';
    html += '  <div class="flow-step red" data-flow="triggers">😰 触发因素</div>';
    html += '  <span class="flow-arrow">→</span>';
    html += '  <div class="flow-step yellow" data-flow="warnings">⚠️ 预警信号</div>';
    html += '  <span class="flow-arrow">→</span>';
    html += '  <div class="flow-step green" data-flow="soothing">💚 安抚策略</div>';
    html += '  <span class="flow-arrow">→</span>';
    html += '  <div class="flow-step red" data-flow="crisis">🆘 危机处理</div>';
    html += '</div>';

    // 触发因素
    html += '<div id="flow-triggers" class="flow-detail">';
    html += '  <div class="content-card red">';
    html += '    <div class="card-section-title">😰 触发因素</div>';
    html += '    <p style="font-size:0.88rem;color:#666;margin-bottom:8px;">以下情况可能引起小雨情绪波动：</p>';
    html += '    <ul class="card-list">';
    emotionSupport.triggers.forEach(function (item) {
      html += '<li>' + item + '</li>';
    });
    html += '    </ul>';
    html += '  </div>';
    html += '</div>';

    // 预警信号
    html += '<div id="flow-warnings" class="flow-detail" style="display:none;">';
    html += '  <div class="content-card yellow">';
    html += '    <div class="card-section-title">⚠️ 预警信号</div>';
    html += '    <p style="font-size:0.88rem;color:#666;margin-bottom:8px;">当出现以下表现时，说明小雨可能正在变得焦虑：</p>';
    html += '    <ul class="card-list">';
    emotionSupport.warnings.forEach(function (item) {
      html += '<li>' + item + '</li>';
    });
    html += '    </ul>';
    html += '  </div>';
    html += '</div>';

    // 安抚策略
    html += '<div id="flow-soothing" class="flow-detail" style="display:none;">';
    html += '  <div class="content-card green">';
    html += '    <div class="card-section-title">💚 安抚策略</div>';
    html += '    <p style="font-size:0.88rem;color:#666;margin-bottom:8px;">发现焦虑迹象时，请尝试以下方法：</p>';
    html += '    <ul class="card-list">';
    emotionSupport.soothing.forEach(function (item) {
      html += '<li>' + item + '</li>';
    });
    html += '    </ul>';
    html += '  </div>';
    html += '</div>';

    // 危机处理
    html += '<div id="flow-crisis" class="flow-detail" style="display:none;">';
    html += '  <div class="content-card red">';
    html += '    <div class="card-section-title">🆘 危机处理</div>';
    html += '    <p style="font-size:0.88rem;color:#666;margin-bottom:8px;">紧急情况处理步骤：</p>';
    html += '    <ul class="card-list">';
    emotionSupport.crisis.forEach(function (item) {
      html += '<li>' + item + '</li>';
    });
    html += '    </ul>';
    html += '  </div>';
    html += '</div>';

    contentArea.innerHTML = html;

    // 绑定流程步骤点击事件
    contentArea.querySelectorAll('.flow-step').forEach(function (step) {
      step.addEventListener('click', function () {
        // 移除所有active
        contentArea.querySelectorAll('.flow-step').forEach(function (s) {
          s.classList.remove('active');
        });
        this.classList.add('active');

        // 显示对应的详情面板
        var flowTarget = this.getAttribute('data-flow');
        contentArea.querySelectorAll('.flow-detail').forEach(function (d) {
          d.style.display = 'none';
        });
        var detailEl = document.getElementById('flow-' + flowTarget);
        if (detailEl) {
          detailEl.style.display = 'block';
        }
      });
    });

    // 默认选中第一个流程步骤
    var firstStep = contentArea.querySelector('.flow-step');
    if (firstStep) {
      firstStep.classList.add('active');
    }

    // 绑定策略推荐按钮
    var strategyBtn = document.getElementById('btn-get-strategy');
    if (strategyBtn) {
      strategyBtn.addEventListener('click', function () {
        var emotionSelect = document.getElementById('strategy-emotion-select');
        var severitySelect = document.getElementById('strategy-severity-select');
        var emotionValue = emotionSelect ? emotionSelect.value : '';
        var severity = severitySelect ? severitySelect.value : 'mild';

        if (!emotionValue) {
          showToast('请先选择情绪状态');
          return;
        }

        var recentStrategies = getRecentStrategyRecords();
        var recommendation = recommendStrategies(emotionValue, severity, recentStrategies);
        var area = document.getElementById('strategy-recommendation-area');
        if (area) {
          area.innerHTML = renderStrategyRecommendation(recommendation);
        }

        // 绑定"记录使用此策略"按钮
        contentArea.querySelectorAll('.btn-use-strategy').forEach(function (btn) {
          btn.addEventListener('click', function () {
            var strategyName = this.getAttribute('data-strategy');
            var emotionLabel = this.getAttribute('data-emotion');
            var user = DataStore.getCurrentUser() || appState.currentUser;
            if (!user) {
              showToast('请先登录');
              return;
            }
            // 预填策略记录弹窗
            addRecordState.selectedType = 'strategy';
            var overlay = document.getElementById('add-record-modal');
            if (!overlay) overlay = window.RecordsPage.createAddRecordModal();
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
            window.RecordsPage.renderAddRecordStep2(user, ROLES[user.role], 'strategy');
            // 预填标题
            setTimeout(function () {
              var titleInput = document.querySelector('#add-record-form input[name="title"]');
              if (titleInput) titleInput.value = strategyName;
            }, 50);
          });
        });
      });
    }
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

    var html = '';

    // 过敏警告（置顶醒目）—— A级公开，所有角色可见
    html += '<div class="allergy-warning" data-privacy="A">';
    html += '  <div class="allergy-icon">🚨</div>';
    html += '  <div class="allergy-text">严重过敏警告</div>';
    html += '  <div class="allergy-detail">' + careInfo.allergy.items + ' — ' + careInfo.allergy.level + '</div>';
    html += '</div>';

    // 照护信息卡片
    html += '<div class="privacy-grid">';

    // 过敏详情 —— A级公开
    html += '<div class="privacy-item" data-privacy="A">';
    html += '  <div class="privacy-label">过敏食物</div>';
    html += '  <div class="privacy-value" style="color:#F5222D;font-weight:700;">' + careInfo.allergy.items + '</div>';
    html += '</div>';

    // 过敏等级 —— A级公开
    html += '<div class="privacy-item" data-privacy="A">';
    html += '  <div class="privacy-label">过敏等级</div>';
    html += '  <div class="privacy-value" style="color:#F5222D;font-weight:700;">' + careInfo.allergy.level + '</div>';
    html += '</div>';

    // 用药 —— D级私密，仅家长可见
    html += '<div class="privacy-item" data-privacy="D">';
    html += '  <div class="privacy-label">日常用药</div>';
    html += '  <div class="privacy-value">' + careInfo.medicine + '</div>';
    html += '</div>';

    // 体检 —— D级私密，仅家长可见
    html += '<div class="privacy-item" data-privacy="D">';
    html += '  <div class="privacy-label">体检安排</div>';
    html += '  <div class="privacy-value">' + careInfo.checkup + '</div>';
    html += '</div>';

    // 特殊事项 —— B级照护
    html += '<div class="privacy-item" data-privacy="B">';
    html += '  <div class="privacy-label">特别注意事项</div>';
    html += '  <div class="privacy-value">' + careInfo.special + '</div>';
    html += '</div>';

    // 睡眠 —— B级照护
    html += '<div class="privacy-item" data-privacy="B">';
    html += '  <div class="privacy-label">作息要求</div>';
    html += '  <div class="privacy-value">' + careInfo.sleep + '</div>';
    html += '</div>';

    html += '</div>';

    contentArea.innerHTML = html;
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

    var html = '';

    html += '<div class="three-col">';

    // 能做的
    html += '<div>';
    html += '  <div class="content-card green">';
    html += '    <div class="card-section-title">✅ 能做的</div>';
    html += '    <ul class="card-list">';
    workInfo.canDo.forEach(function (item) {
      html += '<li>' + item + '</li>';
    });
    html += '    </ul>';
    html += '  </div>';
    html += '</div>';

    // 需要支持的
    html += '<div>';
    html += '  <div class="content-card yellow">';
    html += '    <div class="card-section-title">⚠️ 需要支持的</div>';
    html += '    <ul class="card-list">';
    workInfo.needSupport.forEach(function (item) {
      html += '<li>' + item + '</li>';
    });
    html += '    </ul>';
    html += '  </div>';
    html += '</div>';

    // 避免的
    html += '<div>';
    html += '  <div class="content-card red">';
    html += '    <div class="card-section-title">🚫 避免安排</div>';
    html += '    <ul class="card-list">';
    workInfo.avoid.forEach(function (item) {
      html += '<li>' + item + '</li>';
    });
    html += '    </ul>';
    html += '  </div>';
    html += '</div>';

    html += '</div>';

    contentArea.innerHTML = html;
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

    var html = '';

    // 关系地图可视化（CSS圆圈定位）
    html += '<h2 class="section-title">关系地图</h2>';
    html += '<div class="relation-map">';

    // 最外层 - 避免圈
    html += '<div class="relation-circle avoid"></div>';
    // 中间层 - 日常圈
    html += '<div class="relation-circle daily"></div>';
    // 内层 - 核心圈
    html += '<div class="relation-circle core"></div>';

    // 中心 - 小雨
    html += '<div class="relation-center">小雨</div>';

    // 核心圈人物 - 按圆环位置分布
    var coreAngles = [90, 210, 330]; // 三个核心人物的角度
    var coreRadius = 25; // 核心圈半径百分比
    relationsInfo.core.forEach(function (person, idx) {
      var angle = coreAngles[idx] || 90;
      var x = 50 + coreRadius * Math.cos(angle * Math.PI / 180);
      var y = 50 + coreRadius * Math.sin(angle * Math.PI / 180);
      html += '<div class="relation-person core-person" style="left:' + x + '%;top:' + y + '%;" title="' + person.name + ' - ' + person.role + '">';
      html += '  <div class="person-avatar">' + person.emoji + '</div>';
      html += '  <div class="person-name">' + person.name + '</div>';
      html += '</div>';
    });

    // 日常圈人物
    var dailyAngles = [45, 315];
    var dailyRadius = 37;
    relationsInfo.daily.forEach(function (person, idx) {
      var angle = dailyAngles[idx] || 45;
      var x = 50 + dailyRadius * Math.cos(angle * Math.PI / 180);
      var y = 50 + dailyRadius * Math.sin(angle * Math.PI / 180);
      html += '<div class="relation-person daily-person" style="left:' + x + '%;top:' + y + '%;" title="' + person.name + ' - ' + person.role + '">';
      html += '  <div class="person-avatar">' + person.emoji + '</div>';
      html += '  <div class="person-name">' + person.name + '</div>';
      html += '</div>';
    });

    html += '</div>';

    // 关系图例
    html += '<div style="display:flex;justify-content:center;gap:24px;margin-bottom:24px;flex-wrap:wrap;">';
    html += '<div style="display:flex;align-items:center;gap:6px;font-size:0.85rem;"><span style="width:12px;height:12px;border-radius:50%;background:#4A90D9;display:inline-block;"></span> 核心圈</div>';
    html += '<div style="display:flex;align-items:center;gap:6px;font-size:0.85rem;"><span style="width:12px;height:12px;border-radius:50%;background:#52C41A;display:inline-block;"></span> 日常圈</div>';
    html += '<div style="display:flex;align-items:center;gap:6px;font-size:0.85rem;"><span style="width:12px;height:12px;border-radius:50%;background:#999;display:inline-block;"></span> 避免接触</div>';
    html += '</div>';

    // 详细列表
    html += '<div class="container" style="padding:0 24px;">';

    // 核心圈列表 —— B级照护
    html += '<h2 class="section-title" data-privacy="B">核心支持圈</h2>';
    html += '<div class="content-card blue" style="margin-bottom:24px;" data-privacy="B">';
    html += '<ul class="card-list">';
    relationsInfo.core.forEach(function (person) {
      html += '<li>' + person.emoji + ' <strong>' + person.name + '</strong> — ' + person.role + '</li>';
    });
    html += '</ul>';
    html += '</div>';

    // 日常圈列表 —— B级照护
    html += '<h2 class="section-title" data-privacy="B">日常接触圈</h2>';
    html += '<div class="content-card green" style="margin-bottom:24px;" data-privacy="B">';
    html += '<ul class="card-list">';
    relationsInfo.daily.forEach(function (person) {
      html += '<li>' + person.emoji + ' <strong>' + person.name + '</strong> — ' + person.role + '</li>';
    });
    html += '</ul>';
    html += '</div>';

    // 避免场景 —— A级公开，所有角色应知
    html += '<h2 class="section-title">避免的场景与接触</h2>';
    html += '<div class="content-card red">';
    html += '<ul class="card-list">';
    relationsInfo.avoid.forEach(function (item) {
      html += '<li>' + item + '</li>';
    });
    html += '</ul>';
    html += '</div>';

    html += '</div>';

    contentArea.innerHTML = html;
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
        window.QuickCard.createQuickCardModal();
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
        window.QuickCard.closeQuickCard();
        window.RecordsPage.closeAddRecordModal();
      }
    });

    // 为所有 back-btn 绑定返回首页事件（使用事件委托，支持点击文字返回）
    document.addEventListener('click', function (e) {
      var backBtn = e.target.closest('.back-btn');
      if (backBtn) {
        window.location.hash = 'home';
      }
    });

    // 事件委托：速读卡和对话采集按钮、弹窗关闭按钮
    document.addEventListener('click', function (e) {
      if (e.target.id === 'btn-quick-card' || e.target.closest('#btn-quick-card')) {
        window.QuickCard.openQuickCard();
      }
      if (e.target.id === 'btn-collect' || e.target.closest('#btn-collect')) {
        window.ChatBot.navigateToCollect();
      }
      // 速读卡弹窗关闭按钮
      if (e.target.id === 'modal-close-btn' || e.target.id === 'btn-close-modal' || e.target.closest('#modal-close-btn') || e.target.closest('#btn-close-modal')) {
        window.QuickCard.closeQuickCard();
      }
      // 点击弹窗遮罩层关闭
      if (e.target.id === 'quick-card-modal') {
        window.QuickCard.closeQuickCard();
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

    // 渲染侧边栏菜单
    renderSidebar();

    // 更新导航栏（侧边栏用户信息）
    window.Auth.updateNavBar();

    // 绑定全局事件
    bindGlobalEvents();

    // 绑定移动端侧边栏开关
    var toggleBtn = Utils.dom.get('sidebar-toggle-mobile');
    if (toggleBtn) {
      Utils.dom.on(toggleBtn, 'click', function () {
        document.body.classList.toggle('sidebar-open');
      });
    }
    var overlay = Utils.dom.get('sidebar-overlay');
    if (overlay) {
      Utils.dom.on(overlay, 'click', function () {
        document.body.classList.remove('sidebar-open');
      });
    }

    // 初始化路由系统
    initRouter();

    // 应用当前角色的隐私设置
    window.Permissions.applyPrivacy(currentRole);

    console.log('AI懂我 - PIN码账号系统已初始化');
  }

  /* ==========================================================
   * 十三、每日任务页面
   * ========================================================== */
  function renderTasks() {
    var contentArea = document.getElementById('tasks-content');
    if (!contentArea) return;

    var tasks = DataStore.getTasks();
    var today = getTodayString();
    var activeTasks = tasks.filter(function(t) { return t.isActive; });
    activeTasks.sort(function(a,b) { return (a.time||'99:99').localeCompare(b.time||'99:99'); });

    // 统计今日完成情况
    var completedCount = 0;
    var totalCount = activeTasks.length;
    activeTasks.forEach(function(t) {
      var todayCheck = t.checkins.find(function(c) { return c.date === today && c.status === 'done'; });
      if (todayCheck) completedCount++;
    });
    var percentage = totalCount > 0 ? Math.round(completedCount / totalCount * 100) : 0;

    var html = '';
    // 进度卡片
    html += '<div class="task-progress-card">';
    html += '  <div class="task-progress-circle" style="--progress: ' + percentage + '%;">';
    html += '    <div class="task-progress-text">' + percentage + '%</div>';
    html += '  </div>';
    html += '  <div class="task-progress-info">';
    html += '    <div style="font-size:1.1rem;font-weight:700;">今日进度</div>';
    html += '    <div style="font-size:0.9rem;color:#666;">已完成 ' + completedCount + ' / ' + totalCount + ' 项</div>';
    html += '    <div style="font-size:0.8rem;color:#999;">' + today + '</div>';
    html += '  </div>';
    html += '</div>';

    // 任务列表
    html += '<div class="task-list">';
    activeTasks.forEach(function(task) {
      var todayCheck = task.checkins.find(function(c) { return c.date === today; });
      var status = todayCheck ? todayCheck.status : 'pending';
      var statusClass = status === 'done' ? 'task-done' : (status === 'skip' ? 'task-skipped' : 'task-pending');

      html += '<div class="task-item ' + statusClass + '" data-task-id="' + task.id + '">';
      html += '  <div class="task-check" data-task-id="' + task.id + '" data-action="toggle">';
      if (status === 'done') {
        html += '<span style="color:#52C41A;font-size:1.3rem;">✅</span>';
      } else if (status === 'skip') {
        html += '<span style="color:#999;font-size:1.3rem;">⏭️</span>';
      } else {
        html += '<span class="task-check-circle"></span>';
      }
      html += '  </div>';
      html += '  <div class="task-info">';
      html += '    <div class="task-title">' + task.icon + ' ' + task.title + '</div>';
      if (task.time) html += '<div class="task-time">⏰ ' + task.time + '</div>';
      html += '    <div class="task-tip">💡 ' + task.supportTip + '</div>';
      html += '  </div>';
      html += '  <div class="task-actions">';
      if (status === 'pending') {
        html += '<button class="task-skip-btn" data-task-id="' + task.id + '" data-action="skip">跳过</button>';
      }
      if (status === 'done') {
        html += '<button class="task-undo-btn" data-task-id="' + task.id + '" data-action="undo">撤销</button>';
      }
      html += '</div></div>';
    });
    html += '</div>';

    // 添加新任务按钮
    html += '<div style="text-align:center;margin-top:20px;">';
    html += '<button id="btn-add-task" class="btn btn-outline" style="padding:10px 24px;">+ 添加新任务</button>';
    html += '</div>';

    // 本周打卡记录
    html += '<div class="task-week-section">';
    html += '<h3 style="font-size:1rem;margin-bottom:12px;">📅 本周打卡</h3>';
    html += '<div class="task-week-grid">';
    for (var i = 6; i >= 0; i--) {
      var dt = new Date();
      dt.setDate(dt.getDate() - i);
      var ds = dt.getFullYear() + '-' + String(dt.getMonth()+1).padStart(2,'0') + '-' + String(dt.getDate()).padStart(2,'0');
      var dayLabel = ['日','一','二','三','四','五','六'][dt.getDay()];
      var dayCompleted = 0;
      var dayTotal = activeTasks.length;
      activeTasks.forEach(function(t) {
        var c = t.checkins.find(function(ch) { return ch.date === ds && ch.status === 'done'; });
        if (c) dayCompleted++;
      });
      var ratio = dayTotal > 0 ? dayCompleted / dayTotal : 0;
      var isToday = ds === today;
      html += '<div class="task-week-day ' + (isToday ? 'today' : '') + '">';
      html += '<div class="task-week-label">周' + dayLabel + '</div>';
      html += '<div class="task-week-bar" style="background:conic-gradient(#4A90D9 ' + (ratio*360) + 'deg, #eee 0);">';
      html += '<div class="task-week-bar-inner"></div></div>';
      html += '<div class="task-week-count">' + dayCompleted + '/' + dayTotal + '</div>';
      html += '</div>';
    }
    html += '</div></div>';

    contentArea.innerHTML = html;
    bindTaskEvents(today);
  }

  function bindTaskEvents(today) {
    // 打卡/撤销事件委托
    document.getElementById('tasks-content').addEventListener('click', function(e) {
      var checkEl = e.target.closest('[data-action="toggle"]');
      var skipEl = e.target.closest('[data-action="skip"]');
      var undoEl = e.target.closest('[data-action="undo"]');

      if (checkEl) {
        var taskId = checkEl.dataset.taskId;
        DataStore.updateTaskCheckin(taskId, today, 'done', '');
        renderTasks();
      }
      if (skipEl) {
        var taskId = skipEl.dataset.taskId;
        DataStore.updateTaskCheckin(taskId, today, 'skip', '');
        renderTasks();
      }
      if (undoEl) {
        var taskId = undoEl.dataset.taskId;
        var tasks = DataStore.getTasks();
        var task = tasks.find(function(t) { return t.id === taskId; });
        if (task) {
          task.checkins = task.checkins.filter(function(c) { return c.date !== today; });
          var data = JSON.parse(localStorage.getItem('ai_dongwo_data'));
          var idx = data.tasks.findIndex(function(t) { return t.id === taskId; });
          if (idx >= 0) { data.tasks[idx] = task; localStorage.setItem('ai_dongwo_data', JSON.stringify(data)); }
          renderTasks();
        }
      }

      // 添加新任务
      if (e.target.closest('#btn-add-task')) {
        showAddTaskModal();
      }
    });
  }

  function showAddTaskModal() {
    var overlay = document.createElement('div');
    overlay.className = 'modal-overlay active';
    overlay.id = 'add-task-modal';
    overlay.innerHTML = '<div class="modal-content" style="max-width:440px;">' +
      '<div class="modal-header"><span class="modal-title">添加新任务</span><button class="modal-close" onclick="document.getElementById(\'add-task-modal\').remove();">&times;</button></div>' +
      '<div class="modal-body">' +
      '<div style="margin-bottom:12px;"><label class="form-label">任务名称</label><input class="form-input" id="new-task-title" placeholder="例如：做早操" style="width:100%;padding:10px 14px;border:1.5px solid #ddd;border-radius:8px;"></div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">' +
      '<div><label class="form-label">图标</label><input class="form-input" id="new-task-icon" placeholder="🏃" maxlength="2" style="width:100%;padding:10px 14px;border:1.5px solid #ddd;border-radius:8px;"></div>' +
      '<div><label class="form-label">计划时间</label><input class="form-input" id="new-task-time" type="time" style="width:100%;padding:10px 14px;border:1.5px solid #ddd;border-radius:8px;"></div></div>' +
      '<div style="margin-bottom:12px;"><label class="form-label">支持提示</label><input class="form-input" id="new-task-tip" placeholder="给照顾者的提示" style="width:100%;padding:10px 14px;border:1.5px solid #ddd;border-radius:8px;"></div>' +
      '<button class="btn btn-primary" style="width:100%;padding:12px;border-radius:10px;" onclick="submitNewTask()">添加任务</button>' +
      '</div></div>';
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';
    document.getElementById('new-task-title').focus();
  }

  window.submitNewTask = function() {
    var title = document.getElementById('new-task-title').value.trim();
    if (!title) { showToast('请输入任务名称'); return; }
    var icon = document.getElementById('new-task-icon').value.trim() || '📋';
    var time = document.getElementById('new-task-time').value || '';
    var tip = document.getElementById('new-task-tip').value.trim() || '';
    DataStore.addTask({ title: title, icon: icon, category: 'custom', time: time, difficulty: 'easy', supportTip: tip, isActive: true });
    document.getElementById('add-task-modal').remove();
    document.body.style.overflow = '';
    showToast('任务添加成功');
    renderTasks();
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
  window.openQuickCard = window.QuickCard.openQuickCard;
  window.closeQuickCard = window.QuickCard.closeQuickCard;
  window.switchVersion = window.QuickCard.switchVersion;
  window.printQuickCard = window.QuickCard.printQuickCard;
  window.switchRole = window.Permissions.switchRole;
  window.openAddRecordModal = window.RecordsPage.openAddRecordModal;
  window.closeAddRecordModal = window.RecordsPage.closeAddRecordModal;
  window.doLogin = window.Auth.doLogin;
  window.doRegister = window.Auth.doRegister;
  window.logout = window.Auth.logout;
  window.ExportModule = ExportModule;
  window.renderTimeline = window.TimelinePage.renderTimeline;
  window.renderCharts = window.ChartsPage.renderCharts;
  window.renderCollectPage = window.ChatBot.renderCollectPage;
  window.navigateToCollect = window.ChatBot.navigateToCollect;
  window.renderProfile = window.ProfilePage.renderProfile;
  window.renderLatestActivity = renderLatestActivity;
  window.renderRecordCard = renderRecordCard;

})();