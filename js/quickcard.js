/* ==========================================================
 * quickcard.js - 速读卡模块 v2.0
 * 「5分钟认识我，并知道怎样支持我」多场景交接卡
 * 依赖: window.Utils, window.Constants, window.DataStore
 * ========================================================== */

(function () {
  'use strict';

  var C = window.Constants;
  var DataStore = window.DataStore;
  var basicInfo = C.basicInfo;
  var aboutMe = C.aboutMe;
  var scenarioCards = C.scenarioCards;
  var verifiedStrategies = C.verifiedStrategies;
  var stressSignals = C.stressSignals;

  /** 当前选中的场景 */
  var currentScenario = 'standard';

  /**
   * 渲染速读卡页面
   */
  function renderPage() {
    var bodyEl = document.getElementById('quickcard-body');
    if (!bodyEl) return;

    var html = '';

    // ========== 场景切换标签 ==========
    html += '<div class="scenario-tabs" id="scenario-tabs">';
    var tabs = [
      { id: 'standard', label: '📋 标准速读卡' },
      { id: 'work', label: '💼 工作支持卡' },
      { id: 'community', label: '🎯 社区活动卡' },
      { id: 'medical', label: '🏥 就医沟通卡' },
      { id: 'respite', label: '🏠 临时照护卡' },
      { id: 'emergency', label: '🚨 紧急情况卡' }
    ];
    tabs.forEach(function (t) {
      html += '<button class="scenario-tab' + (t.id === currentScenario ? ' active' : '') + '" data-scenario="' + t.id + '">' + t.label + '</button>';
    });
    html += '</div>';

    // ========== 场景卡片内容区域 ==========
    html += '<div id="scenario-card-content">';
    html += renderScenarioCard(currentScenario);
    html += '</div>';

    // ========== 操作按钮 ==========
    html += '<div class="qc-actions" style="padding:12px 16px;">';
    html += '  <button class="qc-btn qc-btn-print" id="qc-btn-print">🖨️ 打印</button>';
    html += '  <button class="qc-btn qc-btn-pdf" id="qc-btn-pdf">📄 导出 PDF</button>';
    html += '</div>';

    html += '<div class="qc-footer-note">AI懂我 · ' + basicInfo.name + '的速读卡 · ' + new Date().toLocaleDateString('zh-CN') + '</div>';

    bodyEl.innerHTML = html;

    // 绑定场景切换事件
    bindScenarioTabs();

    // 绑定打印/导出事件
    bindButtons();
  }

  /**
   * 渲染指定场景的卡片
   */
  function renderScenarioCard(scenarioId) {
    if (scenarioId === 'standard') {
      return renderStandardCard();
    }

    var sc = scenarioCards[scenarioId];
    if (!sc) return '<div class="empty-state"><div class="empty-icon">📋</div><div class="empty-text">暂无此场景卡片</div></div>';

    var html = '';
    html += '<div class="qc-container">';

    // 身份头
    html += '<div class="qc-identity">';
    html += '  <div class="qc-identity-avatar">🌻</div>';
    html += '  <div class="qc-identity-info">';
    html += '    <div class="qc-identity-name">' + basicInfo.name + '</div>';
    html += '    <div class="qc-identity-meta">' + basicInfo.age + '岁 · ' + basicInfo.gender + '</div>';
    html += '    <div class="qc-identity-intro">' + sc.target + '用</div>';
    html += '  </div>';
    html += '</div>';

    // 卡片标题
    html += '<div class="qc-banner">';
    html += '  <span class="qc-banner-icon">⏱️</span>';
    html += '  <span>' + sc.label + ' — 5分钟快速了解</span>';
    html += '</div>';

    // 各节内容
    sc.sections.forEach(function (sec) {
      var typeClass = 'qc-section-label-' + sec.type;
      html += '<div class="quick-card-section">';
      html += '  <div class="section-label ' + sec.type + '">' + sec.title + '</div>';
      html += '  <ul>';
      sec.items.forEach(function (item) {
        html += '    <li>' + item + '</li>';
      });
      html += '  </ul>';
      html += '</div>';
    });

    html += '</div>';
    return html;
  }

  /**
   * 渲染标准版速读卡 — "5分钟认识我"
   */
  function renderStandardCard() {
    var am = aboutMe;
    var html = '';
    html += '<div class="qc-container">';

    // ===== 1. Hero 身份 =====
    html += '<div class="new-qc-hero">';
    html += '  <span class="qc-hero-emoji">🌻</span>';
    html += '  <div class="qc-hero-name">' + basicInfo.name + '</div>';
    html += '  <div class="qc-hero-tagline">' + basicInfo.age + '岁 · ' + basicInfo.gender + ' · ' + (am ? am.firstPerson : basicInfo.intro) + '</div>';
    html += '</div>';

    // ===== 2. 提示横幅 =====
    html += '<div class="qc-banner">';
    html += '  <span class="qc-banner-icon">⏱️</span>';
    html += '  <span>5分钟认识我，并知道怎样支持我</span>';
    html += '</div>';

    // ===== 3. 我如何表达 =====
    html += '<div class="new-qc-section">';
    html += '  <div class="nqc-title">💬 我如何表达</div>';
    html += '  <div class="nqc-icon-row">';
    html += '    <div class="nqc-icon-item"><span class="nqc-emoji">👍</span> "是/好" — 点头或者说"好"</div>';
    html += '    <div class="nqc-icon-item"><span class="nqc-emoji">👎</span> "不是/不要" — 摇头或者说"不要"</div>';
    html += '    <div class="nqc-icon-item"><span class="nqc-emoji">😣</span> "不舒服" — 捂耳朵、来回走、找借口离开</div>';
    html += '    <div class="nqc-icon-item"><span class="nqc-emoji">🆘</span> "需要帮助" — 站在原地不动、重复说"不会"</div>';
    html += '  </div>';
    html += '</div>';

    // ===== 4. 如何与我交流 =====
    html += '<div class="new-qc-section">';
    html += '  <div class="nqc-title">🗣️ 怎样与我交流</div>';
    html += '  <ul class="nqc-list">';
    html += '    <li>用短句、慢一点，一次只说一件事</li>';
    html += '    <li>给我 ' + (am ? '几秒钟' : '5-10秒') + ' 反应时间，不要催促</li>';
    html += '    <li>用"先...然后..."解释新任务</li>';
    html += '    <li>用我熟悉的事物举例（公交车、烘焙）</li>';
    html += '    <li>第一次见我时，先用我喜欢的话题开场，不要一上来就问很多问题</li>';
    html += '  </ul>';
    html += '</div>';

    // ===== 5. 我可以独立完成的事情 =====
    html += '<div class="new-qc-section">';
    html += '  <div class="nqc-title">✅ 我可以独立完成</div>';
    html += '  <div class="nqc-icon-row">';
    if (am && am.independence[0]) {
      am.independence[0].items.forEach(function (item) {
        html += '    <div class="nqc-icon-item">' + item + '</div>';
      });
    }
    html += '  </div>';
    html += '</div>';

    // ===== 6. 什么能让我平静 =====
    html += '<div class="new-qc-section">';
    html += '  <div class="nqc-title">🧘 什么让我平静</div>';
    html += '  <ul class="nqc-list">';
    html += '    <li>带到安静的地方，给5分钟独处</li>';
    html += '    <li>用简单的选择帮我恢复控制感（"你想喝水还是坐着？"）</li>';
    html += '    <li>提前告知活动安排变化</li>';
    html += '    <li>不要追问"你怎么了"，不要围住我</li>';
    html += '  </ul>';
    html += '</div>';

    // ===== 7. 我不喜欢的 =====
    html += '<div class="new-qc-avoid">';
    html += '  <div class="nqc-avoid-title">⚠️ 请避免</div>';
    html += '  <ul class="nqc-list">';
    html += '    <li>不打招呼触碰我的身体</li>';
    html += '    <li>催促我"快点"</li>';
    html += '    <li>一次说很多件事</li>';
    html += '    <li>反问句、讽刺或开玩笑</li>';
    html += '    <li>嘈杂环境、突然改变计划</li>';
    html += '    <li>给我吃海鲜（虾、蟹、贝类）</li>';
    html += '  </ul>';
    html += '</div>';

    // ===== 8. 如果我拒绝 =====
    html += '<div class="new-qc-section">';
    html += '  <div class="nqc-title">🤔 如果我拒绝</div>';
    html += '  <ul class="nqc-list">';
    html += '    <li>先暂停，不要强迫</li>';
    html += '    <li>用另一种方式提出（"我们先做第一步好吗？"）</li>';
    html += '    <li>检查是不是环境或身体不舒服</li>';
    html += '    <li>给我一点时间和空间，过一会再试试</li>';
    html += '  </ul>';
    html += '</div>';

    // ===== 9. 已验证的有效支持经验 =====
    if (verifiedStrategies && verifiedStrategies.length > 0) {
      html += '<div class="new-qc-section">';
      html += '  <div class="nqc-title">🧩 经过验证的支持方法</div>';
      verifiedStrategies.forEach(function (vs) {
        html += '  <div class="verified-strategy-card">';
        html += '    <div class="vs-name">✅ ' + vs.name + '</div>';
        html += '    <div class="vs-steps">';
        vs.steps.forEach(function (step) {
          html += '      <div class="vs-step">' + step + '</div>';
        });
        html += '    </div>';
        html += '    <div class="vs-footer">';
        html += '      <span>适用：' + (vs.applicableScenarios || []).join('、') + '</span>';
        html += '      <span>验证时间：' + (vs.verifiedAt || '近期') + '</span>';
        html += '    </div>';
        html += '  </div>';
      });
      html += '</div>';
    }

    // ===== 10. 紧急联系人 =====
    html += '<div class="qc-contacts">';
    html += '  <div class="qc-contacts-title">📞 紧急联系人</div>';
    html += '  <div class="qc-contact-list">';
    if (C.relationsInfo && C.relationsInfo.core) {
      C.relationsInfo.core.forEach(function (contact) {
        html += '    <div class="qc-contact-item">';
        html += '      <div class="qc-contact-avatar">' + contact.emoji + '</div>';
        html += '      <div class="qc-contact-info">';
        html += '        <div class="qc-contact-name">' + contact.name + '</div>';
        html += '        <div class="qc-contact-role">' + contact.role + '</div>';
        html += '      </div>';
        html += '    </div>';
      });
    }
    html += '  </div>';
    html += '</div>';

    html += '</div>'; // .qc-container
    return html;
  }

  /**
   * 绑定场景切换标签点击事件
   */
  function bindScenarioTabs() {
    var tabsContainer = document.getElementById('scenario-tabs');
    if (!tabsContainer) return;

    tabsContainer.querySelectorAll('.scenario-tab').forEach(function (tab) {
      tab.addEventListener('click', function () {
        var scenario = this.getAttribute('data-scenario');
        if (scenario === currentScenario) return;

        currentScenario = scenario;

        // 更新标签激活状态
        tabsContainer.querySelectorAll('.scenario-tab').forEach(function (t) {
          t.classList.remove('active');
        });
        this.classList.add('active');

        // 更新卡片内容
        var contentEl = document.getElementById('scenario-card-content');
        if (contentEl) {
          contentEl.innerHTML = renderScenarioCard(scenario);
        }
      });
    });
  }

  /**
   * 绑定打印和导出按钮事件
   */
  function bindButtons() {
    var printBtn = document.getElementById('qc-btn-print');
    var pdfBtn = document.getElementById('qc-btn-pdf');

    if (printBtn) {
      printBtn.addEventListener('click', function () {
        window.print();
      });
    }

    if (pdfBtn) {
      pdfBtn.addEventListener('click', function () {
        exportPDF();
      });
    }
  }

  /**
   * 导出 PDF
   */
  function exportPDF() {
    var card = document.getElementById('quickcard-body');
    if (!card) return;

    if (typeof html2pdf === 'undefined') {
      alert('PDF 导出库未加载，请检查网络连接后重试。');
      return;
    }

    var scenarioLabels = {
      standard: '标准速读卡', work: '工作支持卡', community: '社区活动卡',
      medical: '就医沟通卡', respite: '临时照护卡', emergency: '紧急情况卡'
    };

    var opt = {
      margin: [8, 8, 8, 8],
      filename: basicInfo.name + '_' + (scenarioLabels[currentScenario] || '速读卡') + '_' + new Date().toLocaleDateString('zh-CN').replace(/\//g, '-') + '.pdf',
      image: { type: 'jpeg', quality: 0.95 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        logging: false
      },
      jsPDF: {
        unit: 'mm',
        format: 'a4',
        orientation: 'portrait'
      }
    };

    html2pdf().set(opt).from(card).save();
  }

  // ==========================================================
  // 导出到 window
  // ==========================================================
  window.QuickCard = {
    renderPage: renderPage,
    exportPDF: exportPDF,
    renderScenarioCard: renderScenarioCard
  };

})();
