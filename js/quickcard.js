/* ==========================================================
 * quickcard.js - 速读卡模块 v2.0（单页紧凑版）
 * 依赖: window.Utils, window.Constants, window.DataStore
 * 页面导航: #quickcard
 * ========================================================== */

(function () {
  'use strict';

  var C = window.Constants;
  var DataStore = window.DataStore;
  var basicInfo = C.basicInfo;
  var likesList = C.likesList;
  var dislikesList = C.dislikesList;
  var communicationGuide = C.communicationGuide;
  var relationsInfo = C.relationsInfo;
  var emotionSupport = C.emotionSupport;

  /* ==========================================================
   * 内容数据
   * ========================================================== */

  /** 你可能会看到 — 行为特征卡片 */
  var behaviorCards = [
    {
      title: '我喜欢的事情',
      items: [
        '对公交车路线了如指掌',
        '喜欢烘焙，能独立做曲奇',
        '对猫和动物特别感兴趣',
        '弹电子琴，会简单旋律'
      ]
    },
    {
      title: '我的沟通方式',
      items: [
        '用短句交流，话不多',
        '需要多几秒反应时间',
        '熟悉的例子最能懂我',
        '安静环境里我更放松'
      ]
    }
  ];

  /** 请这样支持我 — 三步编号 */
  var supportSteps = [
    '短句、慢一点，一次只说一件事，给我反应时间',
    '提前告诉我接下来要做什么，不要突然改变计划',
    '用我熟悉的事物举例（公交车、烘焙），我能更好理解'
  ];

  /** 可以这样说 — 话术模板 */
  var phraseTemplates = [
    '"小雨，不着急，慢慢来，我在这儿等你。"',
    '"我们接下来要……先……然后……你觉得可以吗？"',
    '"你想选A还是B？你来决定。"',
    '"今天你做得很好！你做的曲奇真香。"',
    '"如果你觉得不舒服，可以告诉我，我们去安静的地方。"'
  ];

  /** 孤独症小知识 */
  var autismTips = [
    '孤独症是一种神经发育差异，不是疾病，不需要"治疗"或"矫正"',
    '每个人都是独特的——有些人对声音敏感，有些人喜欢规律和重复',
    '他们可能不善于眼神交流或社交寒暄，但这不意味着冷漠',
    '环境和沟通方式的调整往往比试图"改变"本人更有效'
  ];

  /* ==========================================================
   * 渲染速读卡页面
   * ========================================================== */

  /**
   * 渲染速读卡页面内容到 #quickcard-body
   */
  function renderPage() {
    var bodyEl = document.getElementById('quickcard-body');
    if (!bodyEl) return;

    var name = basicInfo.name;
    var avatar = '🌻';
    var user = DataStore.getCurrentUser();

    var html = '';

    // ========== 1. 心青年身份卡 ==========
    html += '<div class="qc-identity">';
    html += '  <div class="qc-identity-avatar">' + avatar + '</div>';
    html += '  <div class="qc-identity-info">';
    html += '    <div class="qc-identity-name">' + name + '</div>';
    html += '    <div class="qc-identity-meta">' + basicInfo.age + '岁 · ' + basicInfo.gender + '</div>';
    html += '    <div class="qc-identity-intro">' + basicInfo.intro + '</div>';
    html += '  </div>';
    html += '</div>';

    // ========== 2. 提示横幅 ==========
    html += '<div class="qc-banner">';
    html += '  <span class="qc-banner-icon">⏱️</span>';
    html += '  <span>1分钟认识我</span>';
    html += '</div>';

    // ========== 3. "你可能会看到" 行为卡片 ==========
    html += '<div class="qc-section">';
    html += '  <div class="qc-section-title"><span class="qc-section-emoji">👀</span> 你可能会看到</div>';
    html += '  <div class="qc-two-col">';
    behaviorCards.forEach(function (card) {
      html += '    <div class="qc-behavior-card">';
      html += '      <div class="qc-behavior-title">' + card.title + '</div>';
      html += '      <ul class="qc-behavior-list">';
      card.items.forEach(function (item) {
        html += '        <li>' + item + '</li>';
      });
      html += '      </ul>';
      html += '    </div>';
    });
    html += '  </div>';
    html += '</div>';

    // ========== 4. "请这样支持我" 三步 ==========
    html += '<div class="qc-section">';
    html += '  <div class="qc-section-title"><span class="qc-section-emoji">🤝</span> 请这样支持我</div>';
    html += '  <div class="qc-steps">';
    supportSteps.forEach(function (step, idx) {
      html += '    <div class="qc-step-item">';
      html += '      <div class="qc-step-num">' + (idx + 1) + '</div>';
      html += '      <div class="qc-step-text">' + step + '</div>';
      html += '    </div>';
    });
    html += '  </div>';
    html += '</div>';

    // ========== 5. "可以这样说" 话术 ==========
    html += '<div class="qc-section">';
    html += '  <div class="qc-section-title"><span class="qc-section-emoji">💬</span> 可以这样说</div>';
    html += '  <div class="qc-phrases">';
    phraseTemplates.forEach(function (phrase) {
      html += '    <div class="qc-phrase-item">' + phrase + '</div>';
    });
    html += '  </div>';
    html += '</div>';

    // ========== 6. "请避免" 警告卡 ==========
    html += '<div class="qc-section">';
    html += '  <div class="qc-section-title"><span class="qc-section-emoji">⚠️</span> 请避免</div>';
    html += '  <div class="qc-avoid-card">';
    html += '    <ul class="qc-avoid-list">';
    communicationGuide.avoid.forEach(function (item) {
      html += '      <li>' + item + '</li>';
    });
    html += '    </ul>';
    html += '  </div>';
    html += '</div>';

    // ========== 7. 孤独症小知识 ==========
    html += '<div class="qc-section">';
    html += '  <div class="qc-section-title"><span class="qc-section-emoji">💡</span> 孤独症小知识</div>';
    html += '  <div class="qc-tips-card">';
    html += '    <ul class="qc-tips-list">';
    autismTips.forEach(function (tip) {
      html += '      <li>' + tip + '</li>';
    });
    html += '    </ul>';
    html += '  </div>';
    html += '</div>';

    // ========== 8. 紧急联系人 ==========
    html += '<div class="qc-contacts">';
    html += '  <div class="qc-contacts-title">📞 紧急联系人</div>';
    html += '  <div class="qc-contact-list">';
    relationsInfo.core.forEach(function (contact) {
      html += '    <div class="qc-contact-item">';
      html += '      <div class="qc-contact-avatar">' + contact.emoji + '</div>';
      html += '      <div class="qc-contact-info">';
      html += '        <div class="qc-contact-name">' + contact.name + '</div>';
      html += '        <div class="qc-contact-role">' + contact.role + '</div>';
      html += '      </div>';
      html += '    </div>';
    });
    html += '  </div>';
    html += '</div>';

    // ========== 操作按钮 ==========
    html += '<div class="qc-actions">';
    html += '  <button class="qc-btn qc-btn-print" id="qc-btn-print">🖨️ 打印</button>';
    html += '  <button class="qc-btn qc-btn-pdf" id="qc-btn-pdf">📄 导出 PDF</button>';
    html += '</div>';

    html += '<div class="qc-footer-note">AI懂我 · ' + name + '的速读卡 · ' + new Date().toLocaleDateString('zh-CN') + '</div>';

    bodyEl.innerHTML = html;

    // 绑定按钮事件
    bindButtons();
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

    // 检查 html2pdf 是否可用
    if (typeof html2pdf === 'undefined') {
      alert('PDF 导出库未加载，请检查网络连接后重试。');
      return;
    }

    var opt = {
      margin: [8, 8, 8, 8],
      filename: '小雨速读卡_' + new Date().toLocaleDateString('zh-CN').replace(/\//g, '-') + '.pdf',
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
    exportPDF: exportPDF
  };

})();
