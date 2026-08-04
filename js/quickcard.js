/* ==========================================================
 * quickcard.js - 速读卡模块
 * 依赖: window.Utils, window.Constants, window.AppState
 * ========================================================== */

(function () {
  'use strict';

  // 本地别名
  var quickCardVersions = window.Constants.quickCardVersions;
  var basicInfo = window.Constants.basicInfo;
  var appState = window.AppState;

  // currentQuickCardVersion 通过 window.AppState.currentQuickCardVersion 访问

  /**
   * 打开速读卡弹窗
   */
  function openQuickCard() {
    var overlay = document.getElementById('quick-card-modal');
    if (!overlay) {
      overlay = createQuickCardModal();
    }
    overlay.classList.add('active');

    // 渲染当前版本的速读卡内容
    renderQuickCardContent(window.AppState.currentQuickCardVersion);

    // 阻止body滚动
    document.body.style.overflow = 'hidden';
  }

  /**
   * 关闭速读卡弹窗
   */
  function closeQuickCard() {
    var overlay = document.getElementById('quick-card-modal');
    if (overlay) {
      overlay.classList.remove('active');
    }
    document.body.style.overflow = '';
  }

  /**
   * 创建速读卡弹窗DOM结构
   */
  function createQuickCardModal() {
    var overlay = document.createElement('div');
    overlay.id = 'quick-card-modal';
    overlay.className = 'modal-overlay';

    overlay.innerHTML =
      '<div class="modal-content">' +
      '  <div class="modal-header">' +
      '    <span class="modal-title">📋 速读卡</span>' +
      '    <button class="modal-close" id="modal-close-btn">&times;</button>' +
      '  </div>' +
      '  <div class="modal-body">' +
      '    <div class="version-tabs" id="version-tabs"></div>' +
      '    <div id="quick-card-body"></div>' +
      '  </div>' +
      '  <div class="modal-footer">' +
      '    <button class="btn btn-outline" id="btn-print-card">🖨️ 打印</button>' +
      '    <button class="btn btn-ghost" id="btn-close-modal">关闭</button>' +
      '  </div>' +
      '</div>';

    document.body.appendChild(overlay);

    // 绑定关闭按钮
    document.getElementById('modal-close-btn').addEventListener('click', closeQuickCard);
    document.getElementById('btn-close-modal').addEventListener('click', closeQuickCard);

    // 点击遮罩层关闭
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeQuickCard();
    });

    // 绑定打印按钮
    document.getElementById('btn-print-card').addEventListener('click', printQuickCard);

    // 渲染版本切换标签
    renderVersionTabs();

    return overlay;
  }

  /**
   * 渲染版本切换标签
   */
  function renderVersionTabs() {
    var tabsContainer = document.getElementById('version-tabs');
    if (!tabsContainer) return;

    var html = '';
    var keys = Object.keys(quickCardVersions);
    keys.forEach(function (key) {
      var version = quickCardVersions[key];
      var activeClass = (key === window.AppState.currentQuickCardVersion) ? ' active' : '';
      html += '<button class="version-tab' + activeClass + '" data-version="' + key + '">' + version.label + '</button>';
    });
    tabsContainer.innerHTML = html;

    // 绑定版本切换事件
    tabsContainer.querySelectorAll('.version-tab').forEach(function (tab) {
      tab.addEventListener('click', function () {
        var versionName = this.getAttribute('data-version');
        switchVersion(versionName);
      });
    });
  }

  /**
   * 切换速读卡版本
   * @param {string} versionName - 版本名称（standard/teacher/volunteer/institution）
   */
  function switchVersion(versionName) {
    window.AppState.currentQuickCardVersion = versionName;
    appState.currentQuickCardVersion = versionName;

    // 更新标签激活状态
    var tabs = document.querySelectorAll('.version-tab');
    tabs.forEach(function (tab) {
      tab.classList.remove('active');
      if (tab.getAttribute('data-version') === versionName) {
        tab.classList.add('active');
      }
    });

    // 重新渲染内容
    renderQuickCardContent(versionName);
  }

  /**
   * 渲染速读卡内容
   * @param {string} versionName - 版本名称
   */
  function renderQuickCardContent(versionName) {
    var bodyEl = document.getElementById('quick-card-body');
    if (!bodyEl) return;

    var version = quickCardVersions[versionName];
    if (!version) return;

    var html = '';
    html += '<div class="quick-card">';
    html += '  <div class="quick-card-header">' + basicInfo.name + '的速读卡 · ' + version.label + '</div>';

    version.sections.forEach(function (section) {
      html += '<div class="quick-card-section">';
      html += '  <div class="section-label ' + section.type + '">● ' + section.title + '</div>';
      html += '  <ul>';
      section.items.forEach(function (item) {
        html += '<li>' + item + '</li>';
      });
      html += '  </ul>';
      html += '</div>';
    });

    html += '<div class="quick-card-section" style="text-align:center;font-size:0.8rem;color:#999;padding:12px;">';
    html += '适用对象：' + version.target + ' | 生成时间：' + new Date().toLocaleDateString('zh-CN');
    html += '</div>';

    html += '</div>';

    bodyEl.innerHTML = html;
  }

  /**
   * 打印速读卡
   */
  function printQuickCard() {
    window.print();
  }

  // ==========================================================
  // 导出到 window
  // ==========================================================
  window.QuickCard = {
    openQuickCard: openQuickCard,
    closeQuickCard: closeQuickCard,
    createQuickCardModal: createQuickCardModal,
    renderVersionTabs: renderVersionTabs,
    switchVersion: switchVersion,
    renderQuickCardContent: renderQuickCardContent,
    printQuickCard: printQuickCard
  };

  // 向后兼容：直接暴露到 window（供 HTML onclick 使用）
  window.openQuickCard = openQuickCard;
  window.closeQuickCard = closeQuickCard;
  window.switchVersion = switchVersion;
  window.printQuickCard = printQuickCard;

})();