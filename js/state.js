/**
 * state.js — 全局应用状态管理
 * 挂载：window.AppState
 */
(function () {
  'use strict';

  /** 全局应用状态 */
  var appState = {
    currentUser: null,
    currentPage: 'home',
    currentRole: 'parent',
    currentQuickCardVersion: 'standard',
    chatState: {
      currentStep: 0,
      messages: [],
      categories: [],
      profileName: '小雨'
    }
  };

  /** 当前路由页面（兼容旧代码） */
  var currentPage = 'home';

  /** 当前角色（兼容旧代码） */
  var currentRole = 'parent';

  /** 当前速读卡版本 */
  var currentQuickCardVersion = 'standard';

  /** 对话状态 */
  var chatState = {
    currentStep: 0,
    messages: [],
    categories: [],
    profileName: '小雨'
  };

  /** 添加记录弹窗状态 */
  var addRecordState = {
    selectedType: null
  };

  /** 时间轴筛选状态 */
  var timelineFilters = {
    role: 'all',
    type: 'all',
    timeRange: 'all'
  };

  /** 注册暂存角色 */
  var regRole = null;

  /** 日历状态 */
  var calendarState = { currentYear: 0, currentMonth: 0, selectedDate: null };

  /** 记录页筛选状态 — 两级选择器 */
  var recordsPageState = {
    selectedModule: null,
    selectedType: null,
    tagFilter: null
  };

  function getState() {
    return appState;
  }

  function setState(updates) {
    for (var key in updates) {
      if (updates.hasOwnProperty(key)) {
        appState[key] = updates[key];
      }
    }
  }

  window.AppState = {
    appState: appState,
    currentPage: currentPage,
    currentRole: currentRole,
    currentQuickCardVersion: currentQuickCardVersion,
    chatState: chatState,
    addRecordState: addRecordState,
    timelineFilters: timelineFilters,
    regRole: regRole,
    calendarState: calendarState,
    recordsPageState: recordsPageState,
    getState: getState,
    setState: setState
  };

})();