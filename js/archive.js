/**
 * archive.js — 档案模块：主题档案入口 + 档案状态
 * 挂载：window.ArchivePage
 * 依赖：window.Utils, window.Constants, window.DataStore, window.AppState
 */
(function () {
  'use strict';

  var DataStore = window.DataStore;
  var C = window.Constants;
  var basicInfo = C.basicInfo;

  /** 六大主题档案配置 */
  var ARCHIVE_THEMES = [
    { hash: 'life',          icon: '❤️', title: '我喜欢的生活',  desc: '兴趣、优势、愿望，以及希望别人怎样支持我', color: '#4A90D9' },
    { hash: 'communication', icon: '💬', title: '沟通说明书',    desc: '有效话术、沟通节奏、需要避免的用语',     color: '#722ED1' },
    { hash: 'emotion',       icon: '🌊', title: '情绪与行为支持',desc: '压力信号、触发因素、有效的安抚策略',     color: '#F5222D' },
    { hash: 'care',          icon: '💊', title: '照护与医疗提醒',desc: '过敏、用药、作息、体检与特别注意事项',   color: '#52C41A' },
    { hash: 'work',          icon: '💼', title: '工作支持',      desc: '擅长的事、需要协助的地方、避免的安排',   color: '#FAAD14' },
    { hash: 'relations',     icon: '👥', title: '关系与社交',    desc: '核心支持圈、日常接触、需要避免的场景',   color: '#13C2C2' }
  ];

  /**
   * 渲染「主题档案」页面 — #archive-topics
   * 六个主题入口卡片，点击进入各主题详情
   */
  function renderArchiveTopics() {
    var contentArea = document.getElementById('archive-topics-content');
    if (!contentArea) return;

    var html = '';

    // 简介
    html += '<div style="padding:4px 0 16px;">';
    html += '  <p style="font-size:0.88rem;color:var(--text-secondary);line-height:1.6;margin:0;">';
    html += '    六大主题档案，帮你全面了解' + (basicInfo ? basicInfo.name : '心青年') + '的支持需求。点击任一主题查看详细信息。';
    html += '  </p>';
    html += '</div>';

    // 主题卡片网格
    html += '<div style="display:flex;flex-direction:column;gap:12px;">';
    ARCHIVE_THEMES.forEach(function (theme) {
      // 获取该主题记录数
      var records = DataStore.getRecordsByModule(theme.hash);
      var count = records ? records.length : 0;

      html += '<div class="archive-topic-card" data-navigate="' + theme.hash + '" style="background:#fff;border-radius:16px;padding:18px 16px;box-shadow:0 1px 6px rgba(0,0,0,0.04);border-left:4px solid ' + theme.color + ';cursor:pointer;transition:all 0.2s;">';
      html += '  <div style="display:flex;align-items:center;gap:12px;">';
      // 图标
      html += '    <div style="width:44px;height:44px;border-radius:14px;background:' + theme.color + '18;display:flex;align-items:center;justify-content:center;flex-shrink:0;">';
      html += '      <span style="font-size:1.4rem;">' + theme.icon + '</span>';
      html += '    </div>';
      // 文字
      html += '    <div style="flex:1;min-width:0;">';
      html += '      <div style="font-weight:600;font-size:0.95rem;color:var(--text-primary);">' + theme.title + '</div>';
      html += '      <div style="font-size:0.8rem;color:var(--text-muted);margin-top:2px;">' + theme.desc + '</div>';
      html += '    </div>';
      // 记录数与箭头
      html += '    <div style="text-align:right;flex-shrink:0;">';
      html += '      <div style="font-size:0.78rem;color:var(--text-muted);">' + count + ' 条记录</div>';
      html += '      <div style="font-size:1.2rem;color:var(--text-muted);">›</div>';
      html += '    </div>';
      html += '  </div>';
      html += '</div>';
    });
    html += '</div>';

    contentArea.innerHTML = html;

    // 绑定点击事件
    contentArea.querySelectorAll('.archive-topic-card[data-navigate]').forEach(function (card) {
      card.addEventListener('click', function () {
        window.location.hash = this.getAttribute('data-navigate');
      });
    });
  }

  /**
   * 渲染「档案状态」页面 — #archive-status
   * 只展示资料相关问题（缺口、未更新、冲突、AI待确认），不打分
   */
  function renderArchiveStatus() {
    var contentArea = document.getElementById('archive-status-content');
    if (!contentArea) return;

    var html = '';

    // 说明
    html += '<div style="padding:4px 0 16px;">';
    html += '  <p style="font-size:0.88rem;color:var(--text-secondary);line-height:1.6;margin:0;">';
    html += '    档案状态帮助你了解哪些支持信息还不足，哪里需要补充或核实。这评价的是资料完整度，不是心青年本人。</p>';
    html += '</div>';

    // ===== 1. 资料缺口 =====
    html += '<div style="margin-bottom:20px;">';
    html += '<h3 style="font-size:0.95rem;font-weight:600;color:var(--text-primary);margin:0 0 10px 0;">📋 资料缺口</h3>';

    // 检查六大主题记录数
    var gapItems = [];
    ARCHIVE_THEMES.forEach(function (theme) {
      var count = DataStore.getRecordsByModule(theme.hash).length;
      if (count === 0) {
        gapItems.push({ theme: theme, reason: '暂无记录' });
      } else if (count < 3) {
        gapItems.push({ theme: theme, reason: '记录较少（' + count + '条）' });
      }
    });

    // 检查是否缺少心青年本人参与的信息
    var allRecords = DataStore.getRecords();

    if (gapItems.length > 0) {
      gapItems.forEach(function (gap) {
        html += '<div style="display:flex;align-items:center;gap:10px;background:#FFF7E6;border-radius:10px;padding:12px 14px;margin-bottom:8px;">';
        html += '  <span style="font-size:1.2rem;">⚠️</span>';
        html += '  <div style="flex:1;font-size:0.85rem;color:#555;">';
        html += '    <strong>' + gap.theme.title + '</strong>：' + gap.reason;
        html += '  </div>';
        html += '  <a href="#' + gap.theme.hash + '" style="font-size:0.8rem;color:#4A90D9;text-decoration:none;white-space:nowrap;">补充 →</a>';
        html += '</div>';
      });
    } else {
      html += '<div style="background:#F6FFED;border-radius:10px;padding:12px 14px;font-size:0.85rem;color:#52C41A;">✅ 各主题均有记录</div>';
    }

    // 缺少心青年本人参与
    var youthRecords = allRecords.filter(function (r) { return r.authorRole === 'youth'; });
    if (youthRecords.length === 0) {
      html += '<div style="display:flex;align-items:center;gap:10px;background:#FFF7E6;border-radius:10px;padding:12px 14px;margin-top:8px;">';
      html += '  <span style="font-size:1.2rem;">💬</span>';
      html += '  <div style="flex:1;font-size:0.85rem;color:#555;">还没有心青年本人的记录。鼓励他用 AI 聊聊 记录自己的感受和想法。</div>';
      html += '</div>';
    }

    html += '</div>'; // end 资料缺口

    // ===== 2. 长期未更新 =====
    html += '<div style="margin-bottom:20px;">';
    html += '<h3 style="font-size:0.95rem;font-weight:600;color:var(--text-primary);margin:0 0 10px 0;">⏰ 长期未更新</h3>';

    var today = new Date();
    var twoWeeksAgo = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000);
    var twoWeeksStr = twoWeeksAgo.getFullYear() + '-' + String(twoWeeksAgo.getMonth() + 1).padStart(2, '0') + '-' + String(twoWeeksAgo.getDate()).padStart(2, '0');

    var staleTopics = [];
    ARCHIVE_THEMES.forEach(function (theme) {
      var records = DataStore.getRecordsByModule(theme.hash);
      var recentCount = records.filter(function (r) { return r.date >= twoWeeksStr; }).length;
      if (recentCount === 0 && records.length > 0) {
        staleTopics.push({ theme: theme, lastUpdate: records[0].date });
      }
    });

    if (staleTopics.length > 0) {
      staleTopics.forEach(function (stale) {
        html += '<div style="display:flex;align-items:center;gap:10px;background:#FFF2F0;border-radius:10px;padding:12px 14px;margin-bottom:8px;">';
        html += '  <span style="font-size:1.2rem;">🔔</span>';
        html += '  <div style="flex:1;font-size:0.85rem;color:#555;">';
        html += '    <strong>' + stale.theme.title + '</strong>：超过2周未更新（最新：' + stale.lastUpdate + '）';
        html += '  </div>';
        html += '</div>';
      });
    } else {
      html += '<div style="background:#F6FFED;border-radius:10px;padding:12px 14px;font-size:0.85rem;color:#52C41A;">✅ 近两周所有主题均有更新</div>';
    }

    html += '</div>'; // end 长期未更新

    // ===== 3. 信息冲突 =====
    html += '<div style="margin-bottom:20px;">';
    html += '<h3 style="font-size:0.95rem;font-weight:600;color:var(--text-primary);margin:0 0 10px 0;">⚡ 信息冲突</h3>';

    var medConflict = DataStore.validateMedicalConsistency ? DataStore.validateMedicalConsistency() : null;
    if (medConflict) {
      html += '<div style="display:flex;align-items:center;gap:10px;background:#FFF2F0;border-radius:10px;padding:12px 14px;margin-bottom:8px;">';
      html += '  <span style="font-size:1.2rem;">⚠️</span>';
      html += '  <div style="flex:1;font-size:0.85rem;color:#555;">医疗信息冲突：用药数据不一致</div>';
      html += '  <a href="#care" style="font-size:0.8rem;color:#F5222D;text-decoration:none;white-space:nowrap;">去处理 →</a>';
      html += '</div>';
    } else {
      html += '<div style="background:#F6FFED;border-radius:10px;padding:12px 14px;font-size:0.85rem;color:#52C41A;">✅ 未检测到信息冲突</div>';
    }

    html += '</div>'; // end 信息冲突

    // ===== 4. AI 待确认草稿 =====
    html += '<div style="margin-bottom:20px;">';
    html += '<h3 style="font-size:0.95rem;font-weight:600;color:var(--text-primary);margin:0 0 10px 0;">🤖 AI 待确认草稿</h3>';

    // 检查是否有待确认的AI草稿（从 chatbot 数据读取）
    var pendingDrafts = [];
    try {
      var raw = localStorage.getItem('ai_dongwo_chat_sessions');
      if (raw) {
        var sessions = JSON.parse(raw);
        sessions.forEach(function (s) {
          if (s.reviewItems && s.reviewItems.length > 0) {
            s.reviewItems.forEach(function (item) {
              if (!item.confirmed) {
                pendingDrafts.push({ title: item.title || '未命名草稿', date: s.updatedAt || s.createdAt });
              }
            });
          }
        });
      }
    } catch (e) { /* ignore */ }

    if (pendingDrafts.length > 0) {
      pendingDrafts.forEach(function (draft) {
        html += '<div style="display:flex;align-items:center;gap:10px;background:#F6F0FF;border-radius:10px;padding:12px 14px;margin-bottom:8px;">';
        html += '  <span style="font-size:1.2rem;">📝</span>';
        html += '  <div style="flex:1;font-size:0.85rem;color:#555;">' + draft.title + '</div>';
        html += '  <a href="#chat-review" style="font-size:0.8rem;color:#722ED1;text-decoration:none;white-space:nowrap;">去确认 →</a>';
        html += '</div>';
      });
    } else {
      html += '<div style="background:#F6FFED;border-radius:10px;padding:12px 14px;font-size:0.85rem;color:#52C41A;">✅ 没有待确认的 AI 草稿</div>';
    }

    html += '</div>'; // end AI待确认

    // 底部提示 —— 不打分
    html += '<div style="text-align:center;padding:16px 0 32px;font-size:0.82rem;color:var(--text-muted);">';
    html += '以上检查的是资料的完整度和时效性，不代表对心青年本人的任何评价。';
    html += '</div>';

    contentArea.innerHTML = html;
  }

  window.ArchivePage = {
    renderArchiveTopics: renderArchiveTopics,
    renderArchiveStatus: renderArchiveStatus
  };

})();
