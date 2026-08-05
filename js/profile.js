/**
 * profile.js — 档案页 + 管理页渲染 v2.0
 * 挂载：window.ProfilePage
 * 依赖：window.Utils, window.Constants, window.AppState, window.DataStore, window.Modules
 */
(function () {
  'use strict';

  var C = window.Constants;
  var ROLES = C.ROLES;
  var basicInfo = C.basicInfo;
  var likesList = C.likesList;
  var dislikesList = C.dislikesList;
  var communicationGuide = C.communicationGuide;
  var emotionSupport = C.emotionSupport;
  var Modules = window.Modules;
  var DataStore = window.DataStore;
  var showToast = window.showToast;
  var careInfo = DataStore.getCareInfo();
  var workInfo = C.workInfo;
  var aboutMe = C.aboutMe;
  var SOURCE_TYPES = C.SOURCE_TYPES;
  var stressSignals = C.stressSignals;
  var verifiedStrategies = C.verifiedStrategies;

  /**
   * 渲染「关于我」子页面 — #life
   * 以人为本的自我介绍，突出优势视角
   */
  function renderAboutMe() {
    var contentArea = document.getElementById('life-content');
    if (!contentArea) return;

    var am = aboutMe;
    if (!am) return;

    var html = '';
    html += '<div class="profile-scroll">';

    // 第一人称自述
    html += '<div class="know-me-first-person" style="margin:0 0 16px;border-radius:12px;">' + am.firstPerson + '</div>';

    // 我擅长和知道
    html += '<div class="know-me-grid" style="padding:0;margin-bottom:12px;">';
    html += '  <div class="know-me-mini">';
    html += '    <div class="know-me-mini-title">💪 我擅长</div>';
    am.strengths.forEach(function (s) {
      html += '    <div style="display:flex;align-items:flex-start;gap:8px;margin-bottom:10px;font-size:0.85rem;">';
      html += '      <span style="font-size:1.4rem;flex-shrink:0;">' + s.icon + '</span>';
      html += '      <div><strong>' + s.title + '</strong><br><span style="color:var(--text-secondary);">' + s.desc + '</span></div>';
      html += '    </div>';
    });
    html += '  </div>';
    html += '  <div class="know-me-mini">';
    html += '    <div class="know-me-mini-title">💚 我喜欢的</div>';
    am.interests.forEach(function (i) {
      html += '    <div style="display:flex;align-items:flex-start;gap:8px;margin-bottom:10px;font-size:0.85rem;">';
      html += '      <span style="font-size:1.4rem;flex-shrink:0;">' + i.icon + '</span>';
      html += '      <div><strong>' + i.title + '</strong><br><span style="color:var(--text-secondary);">' + i.desc + '</span></div>';
      html += '    </div>';
    });
    html += '  </div>';
    html += '</div>';

    // 让我安心的事
    html += '<div class="know-me-mini full" style="margin-bottom:12px;">';
    html += '  <div class="know-me-mini-title">🏠 什么让我安心和快乐</div>';
    am.calming.forEach(function (c) {
      html += '  <div style="display:flex;align-items:flex-start;gap:8px;margin-bottom:8px;font-size:0.85rem;">';
      html += '    <span style="font-size:1.2rem;">' + c.icon + '</span>';
      html += '    <div><strong>' + c.title + '</strong><br><span style="color:var(--text-secondary);">' + c.desc + '</span></div>';
      html += '  </div>';
    });
    html += '</div>';

    // 沟通偏好
    html += '<div class="know-me-mini full" style="margin-bottom:12px;">';
    html += '  <div class="know-me-mini-title">🗣️ 我希望别人这样称呼和与我交流</div>';
    html += '  <div style="font-size:0.85rem;line-height:1.6;color:var(--text-secondary);">';
    html += '    <p style="margin-bottom:6px;"><strong>称呼</strong>：' + am.communicationPreference.callMe + '</p>';
    html += '    <p style="margin-bottom:6px;"><strong>沟通方式</strong>：' + am.communicationPreference.howToTalk + '</p>';
    html += '    <p style="margin-bottom:6px;"><strong>解释新事物</strong>：' + am.communicationPreference.howToExplain + '</p>';
    html += '    <p><strong>请避免</strong>：' + am.communicationPreference.avoid + '</p>';
    html += '  </div>';
    html += '</div>';

    // 独立能力
    html += '<div class="know-me-independence" style="padding:0;margin-bottom:12px;">';
    am.independence.forEach(function (ind) {
      html += '  <div class="know-me-ind-col">';
      html += '    <div class="ind-label">' + ind.level + '</div>';
      html += '    <ul class="ind-list">';
      ind.items.forEach(function (item) {
        html += '      <li>' + item + '</li>';
      });
      html += '    </ul>';
      html += '  </div>';
    });
    html += '</div>';

    // 愿望
    html += '<div class="know-me-aspiration" style="margin:0 0 12px;">';
    html += '  <span class="asp-label">⭐ 我想过怎样的生活</span>';
    html += '  ' + am.aspiration;
    html += '</div>';

    // 信息来源图例
    html += '<div class="source-legend" style="margin-bottom:12px;">';
    html += '  <span>📋 信息来源说明：</span>';
    html += '  <span class="source-badge self">💬 心青年自己说的</span>';
    html += '  <span class="source-badge observer">👁️ 支持者观察到的</span>';
    html += '  <span class="source-badge confirmed">✅ 共同确认的</span>';
    html += '</div>';

    html += '</div>';

    contentArea.innerHTML = html;
  }

  /**
   * 渲染「情绪与行为支持」子页面 — #emotion
   * 替代旧版"行为红线"，采用压力信号与支持方法完整链
   */
  function renderEmotionSupport() {
    var contentArea = document.getElementById('emotion-content');
    if (!contentArea) return;

    var html = '';
    html += '<div class="profile-scroll">';

    // 引入说明
    html += '<div style="padding:12px 0;font-size:0.85rem;color:var(--text-secondary);line-height:1.6;">';
    html += '以下不是"行为红线"，而是让新照护者知道在什么情况下需要特别留意，以及如何正确提供支持。';
    html += '</div>';

    // 压力信号与支持方法卡片
    if (stressSignals) {
      stressSignals.forEach(function (ss) {
        var catClass = 'attention';
        var catIcon = '⚠️';
        if (ss.category.indexOf('安全') >= 0) { catClass = 'safety'; catIcon = '🚨'; }
        else if (ss.category.indexOf('信号') >= 0 || ss.category.indexOf('压力') >= 0) { catClass = 'signal'; catIcon = '📶'; }

        html += '<div class="stress-card">';
        html += '  <div class="stress-category ' + catClass + '">' + catIcon + ' ' + ss.category + '</div>';
        html += '  <div class="stress-body">';

        // 完整支持链
        html += '    <div class="stress-chain">';
        html += '      <div class="stress-chain-item"><span class="chain-label">触发因素</span><span class="chain-text">' + ss.triggerFactors + '</span></div>';
        html += '      <div class="stress-chain-item"><span class="chain-label">早期信号</span><span class="chain-text">' + ss.earlySignals + '</span></div>';
        html += '      <div class="stress-chain-item"><span class="chain-label">行为表现</span><span class="chain-text">' + ss.behavior + '</span></div>';
        html += '    </div>';

        // 有效支持 vs 不建议
        html += '    <div class="stress-do-dont">';
        html += '      <div class="stress-do">';
        html += '        <div class="do-dont-label">✅ 有效支持</div>';
        html += '        <ul>';
        ss.effectiveSupport.forEach(function (s) { html += '          <li>' + s + '</li>'; });
        html += '        </ul>';
        html += '      </div>';
        html += '      <div class="stress-dont">';
        html += '        <div class="do-dont-label">❌ 不建议</div>';
        html += '        <ul>';
        ss.avoidMethods.forEach(function (s) { html += '          <li>' + s + '</li>'; });
        html += '        </ul>';
        html += '      </div>';
        html += '    </div>';

        // 恢复后安排
        html += '    <div class="stress-chain" style="margin-top:6px;">';
        html += '      <div class="stress-chain-item"><span class="chain-label">恢复安排</span><span class="chain-text">' + ss.recoveryArrangement + '</span></div>';
        html += '    </div>';

        // 信息来源
        html += '    <div style="margin-top:6px;">';
        html += '      <span class="source-badge confirmed">✅ 共同确认的</span>';
        html += '    </div>';

        html += '  </div>';
        html += '</div>';
      });
    }

    // 已验证的有效支持经验
    if (verifiedStrategies && verifiedStrategies.length > 0) {
      html += '<div style="padding-top:8px;">';
      html += '<h3 style="font-size:1rem;font-weight:700;color:var(--text-primary);margin-bottom:12px;">🧩 经过验证的支持方法</h3>';
      verifiedStrategies.forEach(function (vs) {
        html += '<div class="verified-strategy-card">';
        html += '  <div class="vs-name">✅ ' + vs.name + ' <span class="source-badge confirmed">已验证</span></div>';
        html += '  <div class="stress-chain" style="margin-bottom:8px;">';
        html += '    <div class="stress-chain-item"><span class="chain-label">触发模式</span><span class="chain-text">' + vs.triggerPattern + '</span></div>';
        html += '    <div class="stress-chain-item"><span class="chain-label">早期信号</span><span class="chain-text">' + vs.earlySignals + '</span></div>';
        html += '  </div>';
        html += '  <div class="vs-steps">';
        vs.steps.forEach(function (step) {
          html += '    <div class="vs-step">' + step + '</div>';
        });
        html += '  </div>';
        if (vs.avoidMethods && vs.avoidMethods.length > 0) {
          html += '  <div style="margin-top:8px;font-size:0.78rem;color:#D4654A;">';
          html += '    <strong>不建议：</strong>';
          vs.avoidMethods.forEach(function (a) { html += '<span style="margin-right:8px;">· ' + a + '</span>'; });
          html += '  </div>';
        }
        html += '  <div class="vs-footer">';
        html += '    <span>适用：' + (vs.applicableScenarios || []).join('、') + '</span>';
        html += '    <span>最近验证：' + (vs.verifiedAt || '近期') + '</span>';
        html += '  </div>';
        html += '</div>';
      });
      html += '</div>';
    }

    // 策略有效性评价入口
    html += '<div style="text-align:center;padding:20px 0;">';
    html += '<div style="font-size:0.85rem;color:var(--text-muted);margin-bottom:8px;">有新的支持经验？记录并验证后加入知识库</div>';
    html += '<button class="btn btn-outline" style="padding:10px 24px;border-radius:20px;" onclick="window.location.hash=\'chat\'">💬 打开 AI聊聊</button>';
    html += '</div>';

    html += '</div>';

    contentArea.innerHTML = html;
  }

  /**
   * 渲染完整档案页 —— #archive
   *
   * 设计逻辑：
   *   1. 先展示优势和偏好，不以诊断开场
   *   2. 模块是进入记录的入口，不是装饰
   *   3. 摘要可浏览，敏感详情按权限展开
   *   4. 不同角色看到同一人物的不同切片
   *   5. 速读卡入口放在身份卡右上角
   */
  function renderProfile() {
    var contentArea = document.getElementById('archive-content');
    if (!contentArea) return;

    var user = DataStore.getCurrentUser() || window.AppState.currentUser;
    var role = user ? user.role : 'parent';

    var html = '';
    html += '<div class="profile-scroll">';

    // ============================================
    // 1. 人物身份卡 —— 快速认识这个人
    // ============================================
    html += '<div class="archive-id-card">';
    // 速读卡入口 —— 右上角
    html += '  <button class="archive-quickcard-btn" id="archive-quickcard-btn" title="速读卡">';
    html += '    <span class="qc-btn-icon">📋</span>';
    html += '    <span class="qc-btn-text">速读卡</span>';
    html += '  </button>';
    // 头像区域
    html += '  <div class="archive-avatar">';
    html += '    <div class="archive-avatar-inner">🌻</div>';
    html += '  </div>';
    // 信息区
    html += '  <div class="archive-id-body">';
    html += '    <div class="archive-id-name">' + basicInfo.name + '</div>';
    html += '    <div class="archive-id-stage">';
    html += '      <span class="stage-badge">' + basicInfo.age + '岁</span>';
    html += '      <span class="stage-badge">' + basicInfo.gender + '</span>';
    html += '      <span class="stage-badge">' + basicInfo.communication + '</span>';
    html += '    </div>';
    html += '    <div class="archive-id-intro">' + (aboutMe ? aboutMe.firstPerson : basicInfo.intro) + '</div>';
    html += '  </div>';
    html += '</div>';

    // ============================================
    // 2. 关于我 —— 优势在先，支持在后
    // ============================================
    html += '<div class="archive-about-section">';
    html += '  <div class="archive-section-header">';
    html += '    <span class="archive-section-title">🌻 关于我</span>';
    html += '    <span class="archive-section-sub">先认识我，再支持我</span>';
    html += '  </div>';

    // 四个维度卡片：喜欢、不安、支持方式、愿望
    html += '  <div class="archive-about-grid">';

    // 我喜欢和擅长 —— 优势视角优先
    html += '    <div class="archive-about-card about-card-likes">';
    html += '      <div class="about-card-header">';
    html += '        <span class="about-card-emoji">💚</span>';
    html += '        <span class="about-card-label">我喜欢的</span>';
    html += '      </div>';
    html += '      <div class="about-card-items">';
     likesList.forEach(function (item) {
       html += '        <div class="about-item show-preview" data-privacy="B">';
      html += '          <span class="about-item-emoji">' + item.icon + '</span>';
      html += '          <span class="about-item-text"><strong>' + item.title + '</strong><small>' + item.desc + '</small></span>';
      html += '        </div>';
    });
    html += '      </div>';
    html += '    </div>';

    // 我容易不安 —— 同理心视角
    html += '    <div class="archive-about-card about-card-dislikes">';
    html += '      <div class="about-card-header">';
    html += '        <span class="about-card-emoji">⚠️</span>';
    html += '        <span class="about-card-label">我容易不安</span>';
    html += '      </div>';
    html += '      <div class="about-card-items">';
    dislikesList.forEach(function (item, i) {
      var cls = i < 2 ? ' show-preview' : '';
      var privacy = item.icon === '🦐' ? 'C' : 'B';
      html += '        <div class="about-item' + cls + '" data-privacy="' + privacy + '">';
      html += '          <span class="about-item-emoji">' + item.icon + '</span>';
      html += '          <span class="about-item-text"><strong>' + item.title + '</strong><small>' + item.desc + '</small></span>';
      html += '        </div>';
    });
    html += '      </div>';
    // 展开更多按钮
    if (dislikesList.length > 2) {
      html += '      <button class="about-expand-btn" data-target="dislikes">查看全部 ' + dislikesList.length + ' 条</button>';
    }
    html += '    </div>';

    // 请这样支持我
    html += '    <div class="archive-about-card about-card-support about-card-wide">';
    html += '      <div class="about-card-header">';
    html += '        <span class="about-card-emoji">🤝</span>';
    html += '        <span class="about-card-label">请这样支持我</span>';
    html += '      </div>';
    html += '      <div class="about-card-items">';
    communicationGuide.best.forEach(function (tip) {
      html += '        <div class="about-item">';
      html += '          <span class="about-item-check">•</span>';
      html += '          <span class="about-item-text">' + tip + '</span>';
      html += '        </div>';
    });
    html += '      </div>';
    html += '    </div>';

    // 我的愿望
    html += '    <div class="archive-about-card about-card-wish about-card-wide">';
    html += '      <div class="about-card-header">';
    html += '        <span class="about-card-emoji">⭐</span>';
    html += '        <span class="about-card-label">我的愿望</span>';
    html += '      </div>';
    html += '      <div class="about-card-items">';
    workInfo.canDo.forEach(function (wish) {
      html += '        <div class="about-item">';
    html += '          <span class="about-item-check">•</span>';
    html += '          <span class="about-item-text">' + wish + '</span>';
    html += '        </div>';
    });
    html += '      </div>';
    if (aboutMe && aboutMe.aspiration) {
      html += '      <div class="about-aspiration">' + aboutMe.aspiration + '</div>';
    }
    html += '    </div>';

    html += '  </div>'; // .archive-about-grid
    html += '</div>';   // .archive-about-section

    // ============================================
    // 3. 四类支持模块 —— 进入记录详情入口
    // ============================================
    html += '<div class="archive-modules-section">';
    html += '  <div class="archive-section-header">';
    html += '    <span class="archive-section-title">📋 支持模块</span>';
    html += '    <span class="archive-section-sub">点击查看详情记录</span>';
    html += '  </div>';
    html += '  <div class="archive-module-grid">';

    var moduleOrder = ['communication', 'emotion', 'care', 'work'];
    var moduleMetas = {
      communication: { summary: '短句沟通 · 视觉提示 · 耐心等待', highlight: '' },
      emotion: { summary: '压力信号 · 支持方法 · 经验验证', highlight: '' },
      care: { summary: '过敏管理 · 作息照护', highlight: careInfo && careInfo.allergy ? '海鲜过敏' : '' },
      work: { summary: '工作能力 · 支持需求 · 就业方向', highlight: '' }
    };

    moduleOrder.forEach(function (key) {
      var mod = Modules[key];
      if (!mod) return;
      var records = DataStore.getRecordsByModule(key);
      var recordCount = records.length;
      var meta = moduleMetas[key] || { summary: '', highlight: '' };
      var recentRecord = records.length > 0 ? records[0] : null;

      html += '<div class="archive-module-card" data-navigate="' + key + '">';
      // 模块头部
      html += '  <div class="module-card-header">';
      html += '    <div class="module-card-icon" style="background:' + mod.color + '1a;color:' + mod.color + ';">' + mod.icon + '</div>';
      html += '    <div class="module-card-head-text">';
      html += '      <div class="module-card-name">' + mod.label + '</div>';
      html += '      <div class="module-card-count">' + recordCount + ' 条记录</div>';
      html += '    </div>';
      html += '    <div class="module-card-arrow">›</div>';
      html += '  </div>';
      // 模块摘要
      html += '  <div class="module-card-summary">' + meta.summary + '</div>';
      // 最近一条记录摘要
      if (recentRecord) {
        var recText = recentRecord.title || recentRecord.content || '';
        var recDate = window.formatDateDisplay ? window.formatDateDisplay(recentRecord.date) : recentRecord.date;
        html += '  <div class="module-card-recent">';
        html += '    <span class="recent-rec-label">最近</span>';
        html += '    <span class="recent-rec-text">' + recText.substring(0, 28) + (recText.length > 28 ? '…' : '') + '</span>';
        html += '    <span class="recent-rec-date">' + recDate + '</span>';
        html += '  </div>';
      }
      // 高亮标签
      if (meta.highlight) {
        html += '  <div class="module-card-highlight">⚠️ ' + meta.highlight + '</div>';
      }
      html += '</div>';
    });

    html += '  </div>'; // .archive-module-grid
    html += '</div>';   // .archive-modules-section

    // ============================================
    // 4. 最近变化 + 档案完整度
    // ============================================
    html += '<div class="archive-recent-section">';
    html += '  <div class="archive-section-header">';
    html += '    <span class="archive-section-title">🕐 最近变化</span>';
    html += '  </div>';

    var allRecords = DataStore.getRecords();
    var recentRecords = allRecords.slice(0, 3);

    var moduleColors = {
      communication: '#9B85B8', emotion: '#D4877B', care: '#A8C9A0', work: '#D4A85A'
    };
    var modLabels = {
      communication: '沟通', emotion: '情绪', care: '照护', work: '工作'
    };

    if (recentRecords.length > 0) {
      recentRecords.forEach(function (r) {
        var modKey = r.module || 'communication';
        var color = moduleColors[modKey] || '#999';
        var label = modLabels[modKey] || modKey;
        var text = r.title || r.content || '';
        var dateDisplay = window.formatDateDisplay ? window.formatDateDisplay(r.date) : r.date;
        var author = r.author || '';

        html += '<div class="archive-recent-item" data-navigate="records?module=' + modKey + '">';
        html += '  <div class="recent-item-dot" style="background:' + color + ';"></div>';
        html += '  <div class="recent-item-body">';
        html += '    <div class="recent-item-meta">';
        html += '      <span class="recent-item-tag ' + modKey + '">' + label + '</span>';
        html += '      <span class="recent-item-date">' + dateDisplay + '</span>';
        html += '    </div>';
        html += '    <div class="recent-item-text">' + text + '</div>';
        if (author) {
          html += '    <div class="recent-item-author">记录人：' + author + '</div>';
        }
        html += '  </div>';
        html += '</div>';
      });
    } else {
      html += '<div class="archive-recent-empty">📝 还没有动态记录，开始记录吧</div>';
    }
    html += '</div>';

    // ============================================
    // 5. 档案完整度
    // ============================================
    var completenessItems = [
      { key: 'basicInfo', label: '基本信息', filled: !!basicInfo },
      { key: 'likes',     label: '喜欢与擅长', filled: likesList && likesList.length > 0 },
      { key: 'anxiety',   label: '不安与触发', filled: dislikesList && dislikesList.length > 0 },
      { key: 'comm',      label: '沟通指南', filled: communicationGuide && communicationGuide.best && communicationGuide.best.length > 0 },
      { key: 'emotion',   label: '情绪支持', filled: emotionSupport && emotionSupport.soothing && emotionSupport.soothing.length > 0 },
      { key: 'care',      label: '照护信息', filled: careInfo && careInfo.allergy },
      { key: 'records',   label: '动态记录', filled: allRecords.length > 0 }
    ];
    var filledCount = completenessItems.filter(function (c) { return c.filled; }).length;
    var totalCount = completenessItems.length;
    var pct = Math.round(filledCount / totalCount * 100);

    html += '<div class="archive-completeness">';
    html += '  <div class="completeness-head">';
    html += '    <span class="completeness-label">📊 档案完整度</span>';
    html += '    <span class="completeness-pct">' + pct + '%</span>';
    html += '  </div>';
    html += '  <div class="completeness-track">';
    html += '    <div class="completeness-fill" style="width:' + pct + '%;"></div>';
    html += '  </div>';
    html += '  <div class="completeness-items">';
    completenessItems.forEach(function (c) {
      html += '    <span class="completeness-chip ' + (c.filled ? 'chip-filled' : 'chip-missing') + '">' + (c.filled ? '✓' : '○') + ' ' + c.label + '</span>';
    });
    html += '  </div>';
    html += '</div>';

    // ============================================
    // 6. 信息来源图例
    // ============================================
    html += '<div class="archive-source-legend">';
    html += '  <span class="legend-label">📋 信息来源说明：</span>';
    html += '  <span class="source-badge self">💬 心青年自己说的</span>';
    html += '  <span class="source-badge observer">👁️ 支持者观察到的</span>';
    html += '  <span class="source-badge confirmed">✅ 共同确认的</span>';
    html += '</div>';

    html += '</div>'; // .profile-scroll

    contentArea.innerHTML = html;

    // --- 绑定事件 ---

    // 速读卡按钮
    var qcBtn = contentArea.querySelector('#archive-quickcard-btn');
    if (qcBtn) {
      qcBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        window.location.hash = 'quickcard';
      });
    }

    // 关于我 —— 展开更多
    contentArea.querySelectorAll('.about-expand-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var target = this.getAttribute('data-target');
        var card = this.closest('.archive-about-card');
        if (card) {
          card.querySelectorAll('.about-item').forEach(function (item) {
            item.classList.add('show-preview');
          });
          this.style.display = 'none';
        }
      });
    });

    // 模块卡片点击 → 跳转到模块页面
    contentArea.querySelectorAll('.archive-module-card[data-navigate]').forEach(function (card) {
      card.addEventListener('click', function () {
        var modKey = this.getAttribute('data-navigate');
        window.location.hash = modKey;
      });
    });

    // 最近更新项点击 → 跳转到记录列表
    contentArea.querySelectorAll('.archive-recent-item[data-navigate]').forEach(function (item) {
      item.addEventListener('click', function () {
        window.location.hash = this.getAttribute('data-navigate');
      });
    });

    // 权限过滤：根据当前角色隐藏隐私元素
    var currentRole = user ? user.role : 'parent';
    if (window.Permissions && window.Permissions.applyPrivacy) {
      window.Permissions.applyPrivacy(currentRole);
    }
  }

  /**
   * 渲染管理仪表盘 —— 用于 #profile（管理）页
   */
  function renderManagement() {
    var contentArea = document.getElementById('profile-content');
    if (!contentArea) return;

    var user = DataStore.getCurrentUser() || window.AppState.currentUser;
    if (!user) { window.location.hash = 'login'; return; }
    var role = user.role || 'parent';
    var roleInfo = ROLES[role] || { label: role, avatar: '👤', color: '#999' };

    var html = '';
    html += '<div class="profile-scroll">';

    // 1. 我的账号
    html += '<div class="profile-id-card">';
    html += '  <div class="id-avatar-wrap">' + (user.avatar || roleInfo.avatar) + '</div>';
    html += '  <div class="id-info">';
    html += '    <div class="id-name">' + (user.name || '用户') + '</div>';
    html += '    <div class="id-meta" style="color:' + roleInfo.color + ';">当前身份：' + roleInfo.label + '</div>';
    var youthId = DataStore.getPrimaryYouth(user.id);
    if (youthId) {
      var youthUser = DataStore.findUserById(youthId);
      html += '    <div class="id-intro">绑定心青年：' + (youthUser ? youthUser.name : '未知') + '</div>';
    }
    html += '  </div>';
    html += '</div>';

    // 2. 协作网络
    html += '<div class="support-archive-section">';
    html += '  <div class="support-archive-header">';
    html += '    <span class="support-archive-title">👥 协作网络</span>';
    html += '  </div>';

    if (role === 'parent') {
      html += '  <div class="support-module-grid" style="grid-template-columns:repeat(3,1fr);">';
      html += '<div class="support-module-card" onclick="location.hash=\'grants\'" style="cursor:pointer;">';
      html += '  <div class="module-icon-box" style="background:linear-gradient(135deg,#4A90D9,#5B9BD5);">👥</div>';
      html += '  <div class="module-name">授权管理</div>';
      html += '  <div class="module-desc">邀请老师/影子老师</div>';
      html += '</div>';
      html += '<div class="support-module-card" onclick="location.hash=\'approvals\'" style="cursor:pointer;">';
      html += '  <div class="module-icon-box" style="background:linear-gradient(135deg,#52C41A,#73D13D);">📋</div>';
      html += '  <div class="module-name">加入审批</div>';
      html += '  <div class="module-desc">审核加入申请</div>';
      html += '</div>';
      html += '<div class="support-module-card" onclick="location.hash=\'archive-code\'" style="cursor:pointer;">';
      html += '  <div class="module-icon-box" style="background:linear-gradient(135deg,#FAAD14,#FFC53D);">📱</div>';
      html += '  <div class="module-name">档案码</div>';
      html += '  <div class="module-desc">生成分享二维码</div>';
      html += '</div>';
      html += '  </div>';
    } else if (role === 'teacher' || role === 'caregiver') {
      html += '  <div class="support-module-grid" style="grid-template-columns:repeat(2,1fr);">';
      html += '<div class="support-module-card" onclick="location.hash=\'join\'" style="cursor:pointer;">';
      html += '  <div class="module-icon-box" style="background:linear-gradient(135deg,#4A90D9,#5B9BD5);">👨\u200d👩\u200d👧</div>';
      html += '  <div class="module-name">加入家庭</div>';
      html += '  <div class="module-desc">输入邀请码加入</div>';
      html += '</div>';
      var grants = DataStore.getGrantsByUser(user.id);
      if (grants.length > 0) {
        var gyId = grants[0].youthId;
        var gyUser = DataStore.findUserById(gyId);
        html += '<div class="support-module-card" onclick="location.hash=\'archive\'" style="cursor:pointer;">';
        html += '  <div class="module-icon-box" style="background:linear-gradient(135deg,#722ED1,#9C6ADE);">📋</div>';
        html += '  <div class="module-name">查看档案</div>';
        html += '  <div class="module-desc">' + (gyUser ? gyUser.name : '心青年') + '的支持档案</div>';
        html += '</div>';
      }
      html += '  </div>';
    }
    html += '</div>';

    // 3. 退出登录
    html += '<div style="padding:0 0 32px;text-align:center;">';
    html += '<button id="btn-logout-inline" style="padding:12px 48px;border:1px solid #F5222D;background:#fff;color:#F5222D;border-radius:24px;font-size:0.9rem;cursor:pointer;">退出登录</button>';
    html += '</div>';

    html += '</div>'; // .profile-scroll

    contentArea.innerHTML = html;

    var logoutBtn = document.getElementById('btn-logout-inline');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', function () {
        window.Auth.logout();
      });
    }
  }

  window.ProfilePage = {
    renderProfile: renderProfile,
    renderManagement: renderManagement,
    renderAboutMe: renderAboutMe,
    renderEmotionSupport: renderEmotionSupport
  };

})();
