/**
 * government.js — 政府数据看板模块
 * 挂载：window.GovernmentDashboard
 * 为 government 角色提供宏观数据大屏：统计卡片、趋势图、分布图
 * 依赖：window.DataStore, window.Utils, window.Constants
 */
(function () {
  'use strict';

  var DS = window.DataStore;
  var U = window.Utils;
  var C = window.Constants;

  var chartInstances = {};

  /* ==========================================================
   * 主入口：renderDashboard()
   * ========================================================== */

  function renderDashboard() {
    var homeEl = document.getElementById('home-content');
    if (!homeEl) return;

    destroyAllCharts();

    var users = DS.getAllUsers ? DS.getAllUsers() : [];
    var records = DS.getRecords ? DS.getRecords() : [];

    var html = buildDashboardHTML(users, records);
    homeEl.innerHTML = html;

    // 延迟渲染图表（等 DOM 就绪）
    setTimeout(function () {
      renderRecordTrendChart(records);
      renderModulePieChart(records);
      renderRoleBarChart(users, records);
    }, 100);
  }

  function destroyAllCharts() {
    Object.keys(chartInstances).forEach(function (k) {
      if (chartInstances[k]) { chartInstances[k].destroy(); chartInstances[k] = null; }
    });
    chartInstances = {};
  }

  /* ==========================================================
   * HTML 结构
   * ========================================================== */

  function buildDashboardHTML(users, records) {
    var totalUsers = users.length;
    var totalRecords = records.length;
    var recentRecords = records.filter(function (r) {
      var d = new Date();
      d.setDate(d.getDate() - 30);
      return r.date >= U.date.format(d);
    });
    var activeUsers = uniqueValues(recentRecords, 'author').length || '-';
    var moduleCount = Object.keys(C.RECORD_TYPES || {}).length || 6;

    // 情绪趋势简要
    var recentMoods = recentRecords.filter(function (r) { return r.type === 'mood'; });
    var moodTrend = calcMoodTrend(recentMoods);

    var html = '';
    html += '<div style="padding:0 16px 24px;">';

    // ---- 顶部统计卡片 ----
    html += '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px;">';
    html += statCard('👥', '注册用户', totalUsers, '#4A90D9');
    html += statCard('📝', '累计记录', totalRecords, '#52C41A');
    html += statCard('📊', '活跃角色', activeUsers, '#FAAD14');
    html += statCard('📦', '记录类型', moduleCount, '#722ED1');
    html += '</div>';

    // ---- 30天活跃 + 情绪趋势简要 ----
    html += '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-bottom:20px;">';
    html += statCardLarge('📅', '近30天记录', recentRecords.length + ' 条', '#EB2F96');
    html += statCardLarge(moodTrend.icon, moodTrend.label, moodTrend.text, moodTrend.color);
    html += '</div>';

    // ---- 图表区域 ----
    html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px;">';
    html += '<div class="gov-chart-card"><div class="gov-chart-title">📈 记录趋势（近30天）</div><div style="height:220px;position:relative;"><canvas id="gov-record-trend"></canvas></div></div>';
    html += '<div class="gov-chart-card"><div class="gov-chart-title">🍩 模块分布</div><div style="height:220px;position:relative;"><canvas id="gov-module-pie"></canvas></div></div>';
    html += '</div>';

    // ---- 角色贡献柱状图 ----
    html += '<div class="gov-chart-card" style="margin-bottom:20px;">';
    html += '<div class="gov-chart-title">👥 各角色记录贡献</div>';
    html += '<div style="height:200px;position:relative;"><canvas id="gov-role-bar"></canvas></div>';
    html += '</div>';

    // ---- 最近活动列表 ----
    html += '<div class="gov-chart-card">';
    html += '<div class="gov-chart-title">🕐 最近活动（已脱敏）</div>';
    html += '<div style="max-height:240px;overflow-y:auto;">';
    html += buildRecentActivityList(records.slice(-10).reverse());
    html += '</div></div>';

    html += '</div>';
    return html;
  }

  function statCard(icon, label, value, color) {
    return '<div style="background:#fff;border-radius:12px;padding:16px;text-align:center;box-shadow:0 2px 8px rgba(0,0,0,0.06);">' +
      '<div style="font-size:1.6rem;margin-bottom:4px;">' + icon + '</div>' +
      '<div style="font-size:1.8rem;font-weight:700;color:' + color + ';">' + value + '</div>' +
      '<div style="font-size:0.78rem;color:#999;">' + label + '</div></div>';
  }

  function statCardLarge(icon, label, value, color) {
    return '<div style="background:#fff;border-radius:12px;padding:18px;display:flex;align-items:center;gap:14px;box-shadow:0 2px 8px rgba(0,0,0,0.06);">' +
      '<div style="font-size:2rem;">' + icon + '</div>' +
      '<div><div style="font-size:1.4rem;font-weight:700;color:' + color + ';">' + value + '</div>' +
      '<div style="font-size:0.78rem;color:#999;">' + label + '</div></div></div>';
  }

  function buildRecentActivityList(records) {
    if (!records.length) return '<div style="text-align:center;color:#ccc;padding:40px;">暂无数据</div>';
    var html = '<table style="width:100%;font-size:0.82rem;border-collapse:collapse;">';
    html += '<thead><tr style="border-bottom:1px solid #f0f0f0;color:#999;">';
    html += '<th style="text-align:left;padding:8px;">时间</th><th style="text-align:left;padding:8px;">类型</th><th style="text-align:left;padding:8px;">模块</th></tr></thead><tbody>';
    records.forEach(function (r) {
      var typeLabel = (C.RECORD_TYPES && C.RECORD_TYPES[r.type]) ? C.RECORD_TYPES[r.type].label : r.type;
      var moduleLabel = (C.MODULES && C.MODULES[r.module]) ? C.MODULES[r.module].label : (r.module || '-');
      html += '<tr style="border-bottom:1px solid #f8f8f8;">';
      html += '<td style="padding:8px;color:#666;">' + (r.date || '') + '</td>';
      html += '<td style="padding:8px;">' + typeLabel + '</td>';
      html += '<td style="padding:8px;">' + moduleLabel + '</td>';
      html += '</tr>';
    });
    html += '</tbody></table>';
    return html;
  }

  /* ==========================================================
   * 图表渲染
   * ========================================================== */

  function renderRecordTrendChart(records) {
    var canvas = document.getElementById('gov-record-trend');
    if (!canvas) return;

    var ctx = canvas.getContext('2d');
    var dates = getDateLabels(30);
    var counts = dates.map(function (d) {
      return records.filter(function (r) { return r.date === d; }).length;
    });

    if (chartInstances.recordTrend) chartInstances.recordTrend.destroy();
    chartInstances.recordTrend = new Chart(ctx, {
      type: 'line',
      data: {
        labels: dates.map(function (d) { return d.slice(5); }),
        datasets: [{
          label: '每日记录数',
          data: counts,
          borderColor: '#4A90D9',
          backgroundColor: 'rgba(74, 144, 217, 0.08)',
          fill: true,
          tension: 0.4,
          pointRadius: 2,
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 10 }, maxTicksLimit: 7 } },
          y: { beginAtZero: true, ticks: { font: { size: 10 }, stepSize: 1 } }
        }
      }
    });
  }

  function renderModulePieChart(records) {
    var canvas = document.getElementById('gov-module-pie');
    if (!canvas) return;

    var ctx = canvas.getContext('2d');
    var moduleCounts = {};
    var modules = C.MODULES || {};
    records.forEach(function (r) {
      var key = r.module || 'unknown';
      moduleCounts[key] = (moduleCounts[key] || 0) + 1;
    });

    var labels = [];
    var data = [];
    var colors = ['#4A90D9', '#52C41A', '#FAAD14', '#722ED1', '#EB2F96', '#13C2C2', '#F5222D'];
    var idx = 0;
    for (var k in moduleCounts) {
      labels.push((modules[k] && modules[k].label) || k);
      data.push(moduleCounts[k]);
      idx++;
    }

    if (chartInstances.modulePie) chartInstances.modulePie.destroy();
    chartInstances.modulePie = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: colors.slice(0, labels.length),
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'right', labels: { font: { size: 10 }, padding: 12, usePointStyle: true } }
        }
      }
    });
  }

  function renderRoleBarChart(users, records) {
    var canvas = document.getElementById('gov-role-bar');
    if (!canvas) return;

    var ctx = canvas.getContext('2d');
    var roleLabels = C.ROLES ? Object.values(C.ROLES) : [];
    var roleKeyMap = {};
    if (C.ROLES) {
      Object.keys(C.ROLES).forEach(function (k) { roleKeyMap[k] = C.ROLES[k].label; });
    }

    var roleCounts = {};
    records.forEach(function (r) {
      var key = r.authorRole || 'unknown';
      roleCounts[key] = (roleCounts[key] || 0) + 1;
    });

    var labels = [];
    var data = [];
    for (var k in roleCounts) {
      labels.push(roleKeyMap[k] || k);
      data.push(roleCounts[k]);
    }

    if (chartInstances.roleBar) chartInstances.roleBar.destroy();
    chartInstances.roleBar = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: '记录数',
          data: data,
          backgroundColor: ['#4A90D9', '#52C41A', '#FAAD14', '#722ED1', '#EB2F96', '#13C2C2'],
          borderRadius: 6,
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 10 } } },
          y: { beginAtZero: true, ticks: { font: { size: 10 }, stepSize: 1 } }
        }
      }
    });
  }

  /* ==========================================================
   * 辅助函数
   * ========================================================== */

  function getDateLabels(days) {
    var result = [];
    var d = new Date();
    for (var i = days - 1; i >= 0; i--) {
      var date = new Date(d.getTime() - i * 24 * 60 * 60 * 1000);
      result.push(U.date.format(date));
    }
    return result;
  }

  function uniqueValues(arr, key) {
    var set = {};
    arr.forEach(function (item) {
      if (item[key]) set[item[key]] = true;
    });
    return Object.keys(set);
  }

  function calcMoodTrend(records) {
    if (!records.length) return { icon: '😐', label: '情绪趋势', text: '暂无数据', color: '#999' };
    var positive = records.filter(function (r) { return r.mood === 'happy' || r.mood === 'excited' || r.mood === 'calm'; }).length;
    var ratio = Math.round((positive / records.length) * 100);
    if (ratio >= 70) return { icon: '😊', label: '正面情绪占比', text: ratio + '%', color: '#52C41A' };
    if (ratio >= 40) return { icon: '😐', label: '中性情绪占比', text: ratio + '%', color: '#FAAD14' };
    return { icon: '😟', label: '需关注占比', text: ratio + '%', color: '#F5222D' };
  }

  /* ==========================================================
   * 公开 API
   * ========================================================== */

  window.GovernmentDashboard = {
    render: renderDashboard,
    destroy: destroyAllCharts
  };

})();
