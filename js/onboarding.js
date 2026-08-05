/**
 * ============================================================
 * AI懂我 - 首次引导状态管理
 * ============================================================
 * 管理用户是否已完成角色化冷启动引导。
 * 存储键：ai_dongwo_onboarding
 * ============================================================
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'ai_dongwo_onboarding';
  /** 示例用户 ID 列表 —— 这些用户不强制引导，但显示"示例体验模式" */
  var SAMPLE_USER_IDS = ['u_sample_parent', 'u_sample_teacher', 'u_sample_caregiver',
    'u_sample_youth', 'u_sample_admin', 'u_sample_government'];

  function isSampleUser(user) {
    return user && SAMPLE_USER_IDS.indexOf(user.id) >= 0;
  }

  function getState() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function saveState(s) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  }

  /** 检查当前用户是否需要进入引导 */
  function needsOnboarding(user) {
    if (!user) return false;
    // 示例用户不强制引导
    if (isSampleUser(user)) return false;
    // 2026-08-05 之前注册的老用户自动跳过引导
    if (user.createdAt && user.createdAt < '2026-08-05') return false;
    var s = getState();
    return !s.onboardingCompleted || s.onboardingCompleted !== true;
  }

  /** 检查是否已完成引导 */
  function isOnboardingComplete(user) {
    if (!user) return true;
    if (isSampleUser(user)) return true;
    var s = getState();
    return s.onboardingCompleted === true;
  }

  /** 完成引导，写入状态 */
  function completeOnboarding(data) {
    var s = getState();
    s.onboardingCompleted = true;
    s.selectedRole = data.role || s.selectedRole;
    s.selectedYouthId = data.youthId || s.selectedYouthId;
    s.firstAction = data.action || s.firstAction;
    s.onboardingCompletedAt = new Date().toISOString();
    saveState(s);
  }

  /** 重置引导状态（"重新查看使用引导"） */
  function resetOnboarding() {
    localStorage.removeItem(STORAGE_KEY);
  }

  /** 获取已存储的引导选择 */
  function getOnboardingData() {
    return getState();
  }

  /** 判断当前用户是否为示例账号 */
  function checkSampleMode(user) {
    return isSampleUser(user);
  }

  window.Onboarding = {
    needsOnboarding: needsOnboarding,
    isOnboardingComplete: isOnboardingComplete,
    completeOnboarding: completeOnboarding,
    resetOnboarding: resetOnboarding,
    getOnboardingData: getOnboardingData,
    isSampleUser: checkSampleMode
  };
})();
