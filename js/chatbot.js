/**
 * chatbot.js — 对话式信息采集模块
 * 挂载：window.ChatBot
 * 依赖：window.Utils, window.Constants, window.AppState
 */
(function () {
  'use strict';

  // 外部依赖别名
  var chatScript = window.Constants.chatScript;
  var appState = window.AppState.appState;
  var chatState = window.AppState.chatState;
  var currentPage = window.AppState.currentPage;

  /* ==========================================================
   * 对话式采集页面渲染
   * ========================================================== */

  /**
   * 渲染对话式采集页面
   */
  function renderCollectPage() {
    var collectSection = document.getElementById('collect');
    if (!collectSection) {
      // 如果没有collect section，动态创建
      var mainContent = document.querySelector('.main-content');
      var section = document.createElement('section');
      section.id = 'collect';
      section.className = 'page-section';
      section.innerHTML = buildCollectHTML();
      mainContent.appendChild(section);
    } else if (!collectSection.querySelector('.chat-layout')) {
      collectSection.innerHTML = buildCollectHTML();
    }

    // 重置对话状态
    chatState = {
      currentStep: 0,
      messages: [],
      categories: [],
      profileName: '小雨'
    };
    appState.chatState = chatState;

    // 发送第一条AI消息
    setTimeout(function () {
      startChatConversation();
    }, 300);
  }

  /**
   * 构建对话采集页面的HTML结构
   */
  function buildCollectHTML() {
    var html = '';
    html += '<div class="page-header">';
    html += '  <button class="back-btn" onclick="window.location.hash=\'home\'">←</button>';
    html += '  <span class="page-title">对话式信息采集</span>';
    html += '</div>';
    html += '<div class="container" style="padding:24px;">';
    html += '  <div class="chat-layout">';
    // 左侧：对话面板
    html += '    <div class="chat-panel">';
    html += '      <div class="chat-panel-header">🤖 AI懂我 · 对话采集</div>';
    html += '      <div class="chat-messages" id="chat-messages"></div>';
    html += '      <div id="chat-options-area" class="chat-input-area" style="flex-direction:column;align-items:stretch;"></div>';
    html += '    </div>';
    // 右侧：AI归类面板
    html += '    <div class="categorize-panel">';
    html += '      <div class="chat-panel" style="height:100%;">';
    html += '        <div class="chat-panel-header">📋 AI 实时归类</div>';
    html += '        <div class="chat-messages" id="categorize-list" style="padding:16px;">';
    html += '          <div class="empty-state">';
    html += '            <div class="empty-icon">📋</div>';
    html += '            <div class="empty-text">对话开始后，AI将实时归类采集到的信息</div>';
    html += '          </div>';
    html += '        </div>';
    html += '      </div>';
    html += '    </div>';
    html += '  </div>';
    html += '</div>';
    return html;
  }

  /* ==========================================================
   * 对话式采集
   * ========================================================== */

  /**
   * 导航到对话采集页面
   */
  function navigateToCollect() {
    // 设置hash以支持返回按钮（hash相同时不会触发hashchange导致循环）
    if (window.location.hash !== '#collect') {
      window.location.hash = 'collect';
    }

    var collectSection = document.getElementById('collect');
    if (!collectSection) {
      // 在 main-content 中创建 collect section
      var mainContent = document.querySelector('.main-content');
      var section = document.createElement('section');
      section.id = 'collect';
      section.className = 'page-section';
      section.innerHTML = buildCollectHTML();
      mainContent.appendChild(section);
    } else if (!collectSection.querySelector('.chat-layout')) {
      collectSection.innerHTML = buildCollectHTML();
    }

    // 隐藏所有页面，显示collect
    document.querySelectorAll('.page-section').forEach(function (s) {
      s.classList.remove('active');
    });
    collectSection.classList.add('active');
    currentPage = 'collect';
    appState.currentPage = 'collect';
    window.scrollTo(0, 0);

    // 重置对话状态
    chatState = {
      currentStep: 0,
      messages: [],
      categories: [],
      profileName: '小雨'
    };
    appState.chatState = chatState;

    // 开始对话
    setTimeout(function () {
      startChatConversation();
    }, 300);
  }

  /**
   * 开始对话流程
   */
  function startChatConversation() {
    var messagesEl = document.getElementById('chat-messages');
    var optionsArea = document.getElementById('chat-options-area');
    var categorizeList = document.getElementById('categorize-list');

    if (messagesEl) messagesEl.innerHTML = '';
    if (optionsArea) optionsArea.innerHTML = '';

    // 发送第一条AI消息
    sendNextAIMessage();
  }

  /**
   * 发送下一条AI消息
   */
  function sendNextAIMessage() {
    var stepData = chatScript[chatState.currentStep];
    if (!stepData) return;

    // 替换占位符
    var messageText = stepData.aiMessage.replace(/\{name\}/g, chatState.profileName);

    // 添加AI消息气泡
    addMessage('ai', messageText);

    // 显示用户可选选项
    if (stepData.options.length > 0) {
      showOptions(stepData.options);
    }
  }

  /**
   * 添加消息气泡到对话面板
   * @param {string} role - 角色（'ai' 或 'user'）
   * @param {string} text - 消息文本
   */
  function addMessage(role, text) {
    var messagesEl = document.getElementById('chat-messages');
    if (!messagesEl) return;

    var bubble = document.createElement('div');
    bubble.className = 'chat-bubble ' + role;

    var prefix = (role === 'ai') ? '🤖 ' : '👤 ';
    bubble.textContent = prefix + text;

    messagesEl.appendChild(bubble);

    // 滚动到底部
    messagesEl.scrollTop = messagesEl.scrollHeight;

    // 保存到消息历史
    chatState.messages.push({ role: role, text: text });
    appState.chatState = chatState;
  }

  /**
   * 显示预设选项按钮
   * @param {Array} options - 选项文本数组
   */
  function showOptions(options) {
    var optionsArea = document.getElementById('chat-options-area');
    if (!optionsArea) return;

    optionsArea.innerHTML = '';

    var container = document.createElement('div');
    container.className = 'chat-options';

    options.forEach(function (optionText) {
      var btn = document.createElement('button');
      btn.className = 'chat-option-btn';
      btn.textContent = optionText;

      btn.addEventListener('click', function () {
        handleUserSelection(optionText);
        // 清空选项
        container.innerHTML = '';
        optionsArea.innerHTML = '<p style="font-size:0.82rem;color:#999;text-align:center;padding:4px;">AI正在思考...</p>';
      });

      container.appendChild(btn);
    });

    optionsArea.appendChild(container);
  }

  /**
   * 处理用户选择
   * @param {string} selectedText - 用户选择的文本
   */
  function handleUserSelection(selectedText) {
    // 添加用户消息
    addMessage('user', selectedText);

    // AI归类（根据步骤归类到对应类别）
    categorizeMessage(chatState.currentStep, selectedText);

    // 前进到下一步
    chatState.currentStep++;
    appState.chatState = chatState;

    // 如果还有下一步，继续对话
    setTimeout(function () {
      var optionsArea = document.getElementById('chat-options-area');
      if (optionsArea) optionsArea.innerHTML = '';

      if (chatState.currentStep < chatScript.length) {
        sendNextAIMessage();
      }
    }, 800);
  }

  /**
   * AI归类 - 将用户回复归类到对应类别
   * @param {number} step - 当前步骤
   * @param {string} text - 用户回复文本
   */
  function categorizeMessage(step, text) {
    var categorizeList = document.getElementById('categorize-list');
    if (!categorizeList) return;

    // 清除初始的空状态提示
    var emptyState = categorizeList.querySelector('.empty-state');
    if (emptyState) emptyState.remove();

    // 根据步骤确定归类标签
    var labelMap = {
      0: '基本信息',
      1: '基本信息',
      2: '兴趣爱好',
      3: '不喜欢的事物',
      4: '医疗安全',
      5: '沟通方式',
      6: '情绪行为',
      7: '支持网络'
    };

    var label = labelMap[step] || '其他信息';

    // 提取关键信息
    var summaryText = text.replace(/我叫|我喜欢|他喜欢|她喜欢|没有|不要/g, '').trim();

    // 添加归类卡片
    var catItem = document.createElement('div');
    catItem.className = 'categorize-item';
    catItem.innerHTML =
      '<div class="cat-label">📁 ' + label + '</div>' +
      '<div class="cat-content">' + summaryText + '</div>';

    categorizeList.appendChild(catItem);

    // 保存归类
    chatState.categories.push({ label: label, content: summaryText });
    appState.chatState = chatState;

    // 滚动到底部
    categorizeList.scrollTop = categorizeList.scrollHeight;
  }

  /* ==========================================================
   * 暴露到全局作用域
   * ========================================================== */
  window.ChatBot = {
    renderCollectPage: renderCollectPage,
    buildCollectHTML: buildCollectHTML,
    navigateToCollect: navigateToCollect,
    startChatConversation: startChatConversation,
    sendNextAIMessage: sendNextAIMessage,
    addMessage: addMessage,
    showOptions: showOptions,
    handleUserSelection: handleUserSelection,
    categorizeMessage: categorizeMessage
  };

  // 直接暴露到 window
  window.renderCollectPage = renderCollectPage;
  window.navigateToCollect = navigateToCollect;

})();