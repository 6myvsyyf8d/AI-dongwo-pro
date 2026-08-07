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
      html += '    <div style="display:flex;align-items:flex-start;gap:8px;margin-bottom:8px;font-size:0.85rem;">';
      html += '      <span style="font-size:1.4rem;flex-shrink:0;">' + s.icon + '</span>';
      html += '      <div><strong>' + s.title + '</strong><br><span style="color:var(--text-secondary);">' + s.desc + '</span></div>';
      html += '    </div>';
    });
    html += '  </div>';
    html += '  <div class="know-me-mini">';
    html += '    <div class="know-me-mini-title">💚 我喜欢的</div>';
    am.interests.forEach(function (i) {
      html += '    <div style="display:flex;align-items:flex-start;gap:8px;margin-bottom:8px;font-size:0.85rem;">';
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
   * 设计逻辑（规则第七节）：
   *   1. 当前档案对象 — 名字/头像/当前支持场景
   *   2. 先认识我 — 兴趣、优势、愿望、希望别人怎样支持我
   *   3. 当前摘要 — 3-7条当前最重要的信息
   *   4. 最近变化 — 近阶段最重要的2-4条，标明时间范围
   *   5. 待确认和资料提醒 — 只有确有内容时显示
   *   6. 入口 — 主题档案、时间轴、速读卡、档案状态
   *   7. 信息来源图例
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
    html += '<div class="archive-id-card" style="margin-bottom:6px;">';
    html += '  <div class="archive-avatar">';
    html += '    <div class="archive-avatar-inner">🌻</div>';
    html += '  </div>';
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
    // 2. 先认识我 —— 优势在先，支持在后
    // ============================================
    html += '<div class="archive-about-section" style="margin-bottom:6px;">';
    html += '  <div class="archive-section-header">';
    html += '    <span class="archive-section-title">🌻 先认识我</span>';
    html += '    <span class="archive-section-sub">优势、兴趣、沟通偏好</span>';
    html += '  </div>';
    html += '  <div class="archive-about-grid">';
    // 我喜欢
    html += '    <div class="archive-about-card about-card-likes">';
    html += '      <div class="about-card-header"><span class="about-card-emoji">💚</span><span class="about-card-label">我喜欢的</span></div>';
    html += '      <div class="about-card-items">';
    likesList.forEach(function (item) {
      html += '        <div class="about-item show-preview" data-privacy="B">';
      html += '          <span class="about-item-emoji">' + item.icon + '</span>';
      html += '          <span class="about-item-text"><strong>' + item.title + '</strong><small>' + item.desc + '</small></span>';
      html += '        </div>';
    });
    html += '      </div>';
    html += '    </div>';
    // 我容易不安
    html += '    <div class="archive-about-card about-card-dislikes">';
    html += '      <div class="about-card-header"><span class="about-card-emoji">⚠️</span><span class="about-card-label">我容易不安</span></div>';
    html += '      <div class="about-card-items">';
    dislikesList.forEach(function (item, i) {
      var cls = i < 2 ? ' show-preview' : '';
      html += '        <div class="about-item' + cls + '" data-privacy="B">';
      html += '          <span class="about-item-emoji">' + item.icon + '</span>';
      html += '          <span class="about-item-text"><strong>' + item.title + '</strong><small>' + item.desc + '</small></span>';
      html += '        </div>';
    });
    html += '      </div>';
    if (dislikesList.length > 2) {
      html += '      <button class="about-expand-btn" data-target="dislikes">查看全部 ' + dislikesList.length + ' 条</button>';
    }
    html += '    </div>';
    // 请这样支持我（沟通指南一句话概览）
    html += '    <div class="archive-about-card about-card-support about-card-wide">';
    html += '      <div class="about-card-header"><span class="about-card-emoji">🤝</span><span class="about-card-label">请这样支持我</span></div>';
    html += '      <div class="about-card-items">';
    communicationGuide.best.slice(0, 3).forEach(function (tip) {
      html += '        <div class="about-item"><span class="about-item-check">•</span><span class="about-item-text">' + tip + '</span></div>';
    });
    if (communicationGuide.best.length > 3) {
      html += '        <a href="#communication" style="font-size:0.82rem;color:#4A90D9;text-decoration:none;">查看完整沟通说明书 →</a>';
    }
    html += '      </div>';
    html += '    </div>';
    // 愿望
    html += '    <div class="archive-about-card about-card-wish about-card-wide">';
    html += '      <div class="about-card-header"><span class="about-card-emoji">⭐</span><span class="about-card-label">我的愿望</span></div>';
    if (aboutMe && aboutMe.aspiration) {
      html += '      <div class="about-card-items"><div class="about-item"><span class="about-item-text">' + aboutMe.aspiration + '</span></div></div>';
    }
    html += '    </div>';
    html += '  </div>';
    html += '</div>';

    // ============================================
    // 3. 当前摘要 —— 3-7条当前最重要的信息
    // ============================================
    var allRecords = DataStore.getRecords();
    var summaryItems = buildCurrentSummary(allRecords, role);
    if (summaryItems.length > 0) {
      html += '<div class="archive-recent-section" style="margin-bottom:8px;">'
      + '  <div class="archive-section-header">'
      + '    <span class="archive-section-title">📌 当前摘要</span>';
      html += '  </div>';
      summaryItems.forEach(function (item) {
        html += '<div class="archive-recent-item" data-navigate="' + item.link + '" style="margin-bottom:10px;">';
        html += '  <div class="recent-item-dot" style="background:' + item.color + ';"></div>';
        html += '  <div class="recent-item-body">';
        html += '    <div class="recent-item-meta">';
        html += '      <span class="recent-item-tag" style="border-color:' + item.color + ';color:' + item.color + ';">' + item.label + '</span>';
        html += '      <span class="recent-item-date">' + item.source + '</span>';
        html += '    </div>';
        html += '    <div class="recent-item-text">' + item.text + '</div>';
        html += '  </div>';
        html += '</div>';
      });
      html += '</div>';
    }

    // ============================================
    // 4. 最近变化 —— 2-4条，标明时间范围
    // ============================================
    var recentChanges = buildRecentChanges(allRecords);
    html += '<div class="archive-recent-section" style="margin-bottom:8px;">';
    html += '  <div class="archive-section-header">';
    html += '    <span class="archive-section-title">🕐 最近变化</span>';
    html += '    <span class="archive-section-sub">近7天</span>';
    html += '  </div>';
    if (recentChanges.length > 0) {
      recentChanges.forEach(function (change) {
        html += '<div class="archive-recent-item" data-navigate="' + change.link + '">';
        html += '  <div class="recent-item-dot" style="background:' + change.color + ';"></div>';
        html += '  <div class="recent-item-body">';
        html += '    <div class="recent-item-meta">';
        html += '      <span class="recent-item-tag">' + change.label + '</span>';
        html += '      <span class="recent-item-date">' + change.dateDisplay + '</span>';
        html += '    </div>';
        html += '    <div class="recent-item-text">' + change.text + '</div>';
        html += '  </div>';
        html += '</div>';
      });
    } else {
      html += '<div class="archive-recent-empty">📝 近7天暂无新的记录</div>';
    }
    html += '</div>';

    // ============================================
    // 5. 待确认和资料提醒 —— 确有内容时才显示
    // ============================================
    var pendingItems = buildPendingAlerts(allRecords);
    if (pendingItems.length > 0) {
      html += '<div class="archive-recent-section" style="margin-bottom:8px;">';
      html += '  <div class="archive-section-header">';
      html += '    <span class="archive-section-title">🔔 待确认与提醒</span>';
      html += '  </div>';
      pendingItems.forEach(function (alert) {
        html += '<div style="display:flex;align-items:center;gap:8px;background:' + alert.bg + ';border-radius:10px;padding:10px 14px;margin-bottom:8px;font-size:0.85rem;color:#555;">';
        html += '  <span>' + alert.icon + '</span>';
        html += '  <span style="flex:1;">' + alert.text + '</span>';
        if (alert.link) {
          html += '  <a href="#' + alert.link + '" style="font-size:0.8rem;color:#4A90D9;text-decoration:none;white-space:nowrap;">查看 →</a>';
        }
        html += '</div>';
      });
      html += '</div>';
    }



    // ============================================
    // 7. 信息来源图例
    // ============================================
    html += '<div class="archive-source-legend" style="margin-bottom:16px;">';
    html += '  <span class="legend-label">📋 信息来源说明：</span>';
    html += '  <span class="source-badge self">💬 心青年自己说的</span>';
    html += '  <span class="source-badge observer">👁️ 支持者观察到的</span>';
    html += '  <span class="source-badge confirmed">✅ 共同确认的</span>';
    html += '</div>';

    html += '</div>'; // .profile-scroll

    contentArea.innerHTML = html;

    // --- 绑定事件 ---

    // About 卡片展开
    contentArea.querySelectorAll('.about-expand-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var card = this.closest('.archive-about-card');
        if (card) {
          card.querySelectorAll('.about-item').forEach(function (item) {
            item.classList.add('show-preview');
          });
          this.style.display = 'none';
        }
      });
    });

    // 入口卡片
    contentArea.querySelectorAll('.archive-entry-card[data-navigate]').forEach(function (card) {
      card.addEventListener('click', function () {
        window.location.hash = this.getAttribute('data-navigate');
      });
    });

    // 摘要/变化项点击下钻
    contentArea.querySelectorAll('.archive-recent-item[data-navigate]').forEach(function (item) {
      item.addEventListener('click', function () {
        window.location.hash = this.getAttribute('data-navigate');
      });
    });

    // 权限过滤
    if (window.Permissions && window.Permissions.applyPrivacy) {
      window.Permissions.applyPrivacy(role);
    }
  }

  /**
   * 构建当前摘要 — L1，3-7条当前最重要的信息（规则驱动）
   */
  function buildCurrentSummary(allRecords, role) {
    var items = [];
    var careInfoLocal = DataStore.getCareInfo();

    // 1. 过敏信息
    if (careInfoLocal && careInfoLocal.allergy && careInfoLocal.allergy.items) {
      items.push({
        label: '照护', color: '#F5222D', source: '权威信息',
        text: '过敏：' + careInfoLocal.allergy.items + '（' + careInfoLocal.allergy.level + '）',
        link: 'care'
      });
    }

    // 2. 沟通偏好
    var commRecords = DataStore.getRecordsByModule('communication');
    if (commRecords && commRecords.length > 0) {
      var latestComm = commRecords[0];
      items.push({
        label: '沟通', color: '#722ED1', source: '最近记录',
        text: (latestComm.title || '') + (latestComm.title ? ' · ' : '') + (latestComm.content || '').substring(0, 40),
        link: 'communication'
      });
    }

    // 3. 情绪状态
    var emotionRecords = allRecords.filter(function (r) { return r.type === 'emotion' || r.type === 'mood'; });
    if (emotionRecords.length > 0) {
      var latestEmotion = emotionRecords[0];
      var moodText = latestEmotion.mood || latestEmotion.emotion_type || '';
      items.push({
        label: '情绪', color: '#F5222D', source: '最近心情',
        text: '最近记录：' + (moodText || latestEmotion.content || '查看详情'),
        link: 'emotion'
      });
    }

    // 4. 近期策略效果
    var strategyRecords = allRecords.filter(function (r) { return r.type === 'strategy' && r.effectiveness >= 4; });
    if (strategyRecords.length > 0) {
      var bestStrategy = strategyRecords[0];
      items.push({
        label: '策略', color: '#52C41A', source: '效果验证',
        text: '"' + (bestStrategy.title || bestStrategy.content || '').substring(0, 30) + '"效果较好',
        link: 'emotion'
      });
    }

    // 5. 照护提醒
    if (careInfoLocal && careInfoLocal.sleep) {
      items.push({
        label: '照护', color: '#1890FF', source: '常规提醒',
        text: '作息：' + careInfoLocal.sleep,
        link: 'care'
      });
    }

    // 限制3-7条
    return items.slice(0, 7);
  }

  /**
   * 构建最近变化 — L2，2-4条，近7天（规则驱动）
   */
  function buildRecentChanges(allRecords) {
    var today = new Date();
    var sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    var sevenDStr = sevenDaysAgo.getFullYear() + '-' + String(sevenDaysAgo.getMonth() + 1).padStart(2, '0') + '-' + String(sevenDaysAgo.getDate()).padStart(2, '0');

    var recent = allRecords.filter(function (r) { return r.date >= sevenDStr; });
    if (recent.length === 0) return [];

    var modules = ['communication', 'emotion', 'care', 'work'];
    var modColors = { communication: '#722ED1', emotion: '#F5222D', care: '#52C41A', work: '#FAAD14' };
    var modLabels = { communication: '沟通', emotion: '情绪', care: '照护', work: '工作' };

    var changes = [];
    // 每个模块取最近1条
    modules.forEach(function (modKey) {
      var modRecords = recent.filter(function (r) { return r.module === modKey; });
      if (modRecords.length > 0) {
        var r = modRecords[0];
        changes.push({
          label: modLabels[modKey] || modKey,
          color: modColors[modKey] || '#999',
          text: (r.title || '') + (r.title ? ' · ' : '') + (r.content || '').substring(0, 50),
          dateDisplay: window.formatDateDisplay ? window.formatDateDisplay(r.date) : r.date,
          link: 'records?module=' + modKey
        });
      }
    });

    return changes.slice(0, 4);
  }

  /**
   * 构建待确认与资料提醒 — 确有内容时才显示
   */
  function buildPendingAlerts(allRecords) {
    var alerts = [];
    var medConflict = DataStore.validateMedicalConsistency ? DataStore.validateMedicalConsistency() : null;
    if (medConflict) {
      alerts.push({ icon: '⚠️', text: '医疗信息存在冲突需要核实', bg: '#FFF2F0', link: 'care' });
    }

    // 检查AI草稿
    try {
      var raw = localStorage.getItem('ai_dongwo_chat_sessions');
      if (raw) {
        var sessions = JSON.parse(raw);
        var pendingCount = 0;
        sessions.forEach(function (s) {
          if (s.reviewItems) {
            s.reviewItems.forEach(function (item) {
              if (!item.confirmed) pendingCount++;
            });
          }
        });
        if (pendingCount > 0) {
          alerts.push({ icon: '📝', text: pendingCount + ' 条AI草稿等待确认', bg: '#F6F0FF', link: 'chat-review' });
        }
      }
    } catch (e) { /* ignore */ }

    // 长期无更新的模块（超过2周无记录但有历史记录的模块）
    var today = new Date();
    var twoWeeksAgo = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000);
    var twoWeeksStr = twoWeeksAgo.getFullYear() + '-' + String(twoWeeksAgo.getMonth() + 1).padStart(2, '0') + '-' + String(twoWeeksAgo.getDate()).padStart(2, '0');

    ['communication', 'emotion', 'care', 'work'].forEach(function (modKey) {
      var records = DataStore.getRecordsByModule(modKey);
      var recentCount = records.filter(function (r) { return r.date >= twoWeeksStr; }).length;
      if (recentCount === 0 && records.length > 0) {
        var labels = { communication: '沟通', emotion: '情绪', care: '照护', work: '工作' };
        alerts.push({ icon: '⏰', text: labels[modKey] + '信息超过2周未更新', bg: '#FFF7E6', link: modKey });
      }
    });

    return alerts;
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

    // 3. 重新查看使用引导
    html += '<div style="padding:8px 0;text-align:center;">';
    html += '<a href="#" id="btn-reonboard" style="color:var(--color-primary);font-size:0.85rem;text-decoration:none;">重新查看使用引导</a>';
    html += '</div>';

    // 4. 退出登录
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
    var reonboardBtn = document.getElementById('btn-reonboard');
    if (reonboardBtn) {
      reonboardBtn.addEventListener('click', function (e) {
        e.preventDefault();
        if (window.Onboarding) window.Onboarding.resetOnboarding();
        window.location.hash = 'quick-start';
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
