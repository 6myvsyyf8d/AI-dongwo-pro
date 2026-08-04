/**
 * charts.js — 数据可视化页面模块
 * 挂载：window.ChartsPage
 * 依赖：window.Utils, window.Constants, window.AppState, window.DataStore
 */
(function () {
  'use strict';

  // 外部依赖别名
  var RECORD_TYPES = window.Constants.RECORD_TYPES;
  var DataStore = window.DataStore;
  var getTodayString = window.getTodayString;
  var ExportModule = window.ExportModule;

  /* ==========================================================
   * 数据可视化页面
   * ========================================================== */
  var chartInstances = { moodTrend: null, typeDist: null, emotionBar: null };

  function renderCharts() {
    var contentArea = document.getElementById('charts-content');
    if (!contentArea) return;
    Object.keys(chartInstances).forEach(function(key) {
      if (chartInstances[key]) { chartInstances[key].destroy(); chartInstances[key] = null; }
    });
    var records = DataStore.getRecords();
    var html = '';
    html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:10px;">';
    html += '<h2 style="margin:0;font-size:1.2rem;">📊 数据统计</h2>';
    html += '<div style="display:flex;gap:8px;">';
    html += '<button class="btn btn-outline" style="padding:8px 16px;font-size:0.85rem;" onclick="ExportModule.exportToPDF(\'charts-content\',\'AI懂我-数据报告-' + getTodayString() + '\')">📄 导出为PDF</button>';
    html += '</div></div>';

    // 统计概览卡片（可点击）
    var totalRecords = records.length;
    var moodRecords = records.filter(function(r) { return r.type === 'mood'; }).length;
    var emotionRecords = records.filter(function(r) { return r.type === 'emotion'; }).length;
    var activityRecords = records.filter(function(r) { return r.type === 'activity'; }).length;
    html += '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:24px;">';
    html += buildStatCard('📝', '总记录', totalRecords, '#4A90D9', 'all');
    html += buildStatCard('😊', '心情记录', moodRecords, '#52C41A', 'mood');
    html += buildStatCard('⚡', '情绪事件', emotionRecords, '#F5222D', 'emotion');
    html += buildStatCard('🎨', '活动记录', activityRecords, '#FAAD14', 'activity');
    html += '</div>';

    // 图表区域
    html += '<div id="charts-main-area">';
    html += '<div class="chart-card"><canvas id="chart-mood-trend"></canvas></div>';
    html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">';
    html += '<div class="chart-card"><canvas id="chart-type-dist"></canvas></div>';
    html += '<div class="chart-card"><canvas id="chart-emotion-bar"></canvas></div>';
    html += '</div></div>';

    // 详情列表区域（默认隐藏）
    html += '<div id="charts-detail-area" style="display:none;"></div>';

    contentArea.innerHTML = html;
    renderMoodTrendChart(records);
    renderTypeDistChart(records);
    renderEmotionBarChart(records);

    // 绑定统计卡片点击事件
    contentArea.querySelectorAll('.stat-card').forEach(function(card) {
      card.addEventListener('click', function() {
        var filterType = this.dataset.filter;
        renderChartDetail(filterType);
      });
    });
  }

  function buildStatCard(icon, label, value, color, filterType) {
    return '<div class="stat-card" data-filter="' + filterType + '" style="background:#fff;border-radius:12px;padding:16px;box-shadow:0 2px 8px rgba(0,0,0,0.06);text-align:center;cursor:pointer;transition:all 0.2s;border:2px solid transparent;">' +
      '<div style="font-size:1.5rem;margin-bottom:4px;">' + icon + '</div>' +
      '<div style="font-size:1.5rem;font-weight:700;color:' + color + ';">' + value + '</div>' +
      '<div style="font-size:0.78rem;color:#999;">' + label + '</div></div>';
  }

  /** 渲染图表详情列表 */
  function renderChartDetail(filterType) {
    var records = DataStore.getRecords();
    var filtered = filterType === 'all' ? records : records.filter(function(r) { return r.type === filterType; });
    var typeLabels = { mood: '心情记录', emotion: '情绪事件', activity: '活动记录', all: '全部记录' };
    var typeLabel = typeLabels[filterType] || '记录';

    var detailArea = document.getElementById('charts-detail-area');
    var mainArea = document.getElementById('charts-main-area');
    if (!detailArea || !mainArea) return;

    mainArea.style.display = 'none';
    detailArea.style.display = 'block';

    var html = '';
    html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">';
    html += '<h3 style="margin:0;font-size:1.1rem;">📋 ' + typeLabel + '（' + filtered.length + '条）</h3>';
    html += '<button class="btn btn-ghost" style="padding:6px 14px;font-size:0.85rem;" onclick="backToCharts()">← 返回图表</button>';
    html += '</div>';

    if (filtered.length === 0) {
      html += '<div class="empty-state"><div class="empty-icon">📭</div><div class="empty-text">暂无' + typeLabel + '</div></div>';
    } else {
      filtered.sort(function(a, b) { return (b.date + b.time).localeCompare(a.date + a.time); });
      filtered.forEach(function(r) {
        var rt = RECORD_TYPES[r.type] || { label: r.type, color: '#4A90D9', icon: '📝' };
        html += '<div class="timeline-item" style="margin-bottom:10px;padding:14px 16px;background:#fff;border-radius:10px;box-shadow:0 1px 4px rgba(0,0,0,0.04);">';
        html += '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px;">';
        html += '<div style="display:flex;align-items:center;gap:8px;">';
        html += '<span style="font-size:1.1rem;">' + rt.icon + '</span>';
        html += '<span style="font-weight:600;font-size:0.92rem;">' + (r.title || rt.label) + '</span>';
        html += '</div>';
        html += '<span style="font-size:0.78rem;color:#999;white-space:nowrap;">' + r.date + ' ' + (r.time || '') + '</span>';
        html += '</div>';
        html += '<div style="font-size:0.88rem;color:#555;line-height:1.5;margin-bottom:6px;">' + r.content + '</div>';
        if (r.mood) html += '<div style="font-size:0.82rem;color:#52C41A;">😊 心情：' + r.mood + '</div>';
        if (r.emotion_type) html += '<div style="font-size:0.82rem;color:#F5222D;">⚡ 情绪：' + r.emotion_type + '</div>';
        html += '<div style="font-size:0.78rem;color:#bbb;margin-top:6px;">👤 ' + (r.author || '') + ' · ' + (RECORD_TYPES[r.type] ? RECORD_TYPES[r.type].label : r.type) + '</div>';
        html += '</div>';
      });
    }

    detailArea.innerHTML = html;
  }

  window.backToCharts = function() {
    var detailArea = document.getElementById('charts-detail-area');
    var mainArea = document.getElementById('charts-main-area');
    if (detailArea) detailArea.style.display = 'none';
    if (mainArea) mainArea.style.display = 'block';
  };

  function renderMoodTrendChart(records) {
    var ctx = document.getElementById('chart-mood-trend');
    if (!ctx || typeof Chart === 'undefined') return;
    var moodRecords = records.filter(function(r) { return r.type === 'mood'; });
    if (moodRecords.length < 2) {
      ctx.parentElement.innerHTML = '<div class="empty-state"><div class="empty-icon">📊</div><div class="empty-text">需要至少2条心情记录才能展示趋势</div></div>';
      return;
    }
    var moodMap = { 'happy': 5, 'excited': 5, 'calm': 4, 'anxious': 2, 'sad': 1, 'angry': 1 };
    var labelMap = { 1: '难过', 2: '焦虑', 3: '一般', 4: '平静', 5: '开心' };
    var grouped = {};
    moodRecords.forEach(function(r) {
      if (!grouped[r.date]) grouped[r.date] = [];
      grouped[r.date].push(moodMap[r.mood] || 3);
    });
    var dates = Object.keys(grouped).sort();
    var data = dates.map(function(d) {
      var vals = grouped[d];
      return Math.round(vals.reduce(function(a,b){return a+b;},0)/vals.length);
    });
    chartInstances.moodTrend = new Chart(ctx, {
      type: 'line',
      data: {
        labels: dates.map(function(d) { return d.slice(5); }),
        datasets: [{
          label: '心情指数',
          data: data,
          borderColor: '#4A90D9',
          backgroundColor: 'rgba(74,144,217,0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 5,
          pointBackgroundColor: '#4A90D9'
        }]
      },
      options: {
        responsive: true,
        plugins: { title: { display: true, text: '心情趋势', font: { size: 14 } } },
        scales: {
          y: { min: 1, max: 5, ticks: { callback: function(v) { return labelMap[v] || ''; }, stepSize: 1 } }
        }
      }
    });
  }

  function renderTypeDistChart(records) {
    var ctx = document.getElementById('chart-type-dist');
    if (!ctx || typeof Chart === 'undefined') return;
    var typeLabels = { mood: '心情', care: '照护', activity: '活动', communication: '沟通观察', emotion: '情绪事件', accompany: '陪伴', note: '备注' };
    var typeColors = { mood: '#52C41A', care: '#4A90D9', activity: '#FAAD14', communication: '#13C2C2', emotion: '#F5222D', accompany: '#722ED1', note: '#999' };
    var counts = {};
    records.forEach(function(r) { counts[r.type] = (counts[r.type] || 0) + 1; });
    var labels = [], data = [], colors = [];
    Object.keys(typeLabels).forEach(function(k) {
      if (counts[k]) { labels.push(typeLabels[k]); data.push(counts[k]); colors.push(typeColors[k]); }
    });
    if (data.length === 0) { ctx.parentElement.innerHTML = '<div class="empty-state"><div class="empty-text">暂无记录数据</div></div>'; return; }
    chartInstances.typeDist = new Chart(ctx, {
      type: 'doughnut',
      data: { labels: labels, datasets: [{ data: data, backgroundColor: colors, borderWidth: 2, borderColor: '#fff' }] },
      options: { responsive: true, plugins: { title: { display: true, text: '记录类型分布', font: { size: 14 } } } }
    });
  }

  function renderEmotionBarChart(records) {
    var ctx = document.getElementById('chart-emotion-bar');
    if (!ctx || typeof Chart === 'undefined') return;
    var emotionRecords = records.filter(function(r) { return r.type === 'emotion'; });
    if (emotionRecords.length === 0) { ctx.parentElement.innerHTML = '<div class="empty-state"><div class="empty-text">暂无情绪事件记录</div></div>'; return; }
    var counts = {};
    emotionRecords.forEach(function(r) { var t = r.emotion_type || '未知'; counts[t] = (counts[t] || 0) + 1; });
    var sorted = Object.entries(counts).sort(function(a,b) { return b[1] - a[1]; });
    chartInstances.emotionBar = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: sorted.map(function(s) { return s[0]; }),
        datasets: [{ label: '次数', data: sorted.map(function(s) { return s[1]; }), backgroundColor: 'rgba(245,34,45,0.7)', borderRadius: 6 }]
      },
      options: { responsive: true, plugins: { title: { display: true, text: '情绪事件统计', font: { size: 14 } } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }
    });
  }

  /* ==========================================================
   * 暴露到全局作用域
   * ========================================================== */
  window.ChartsPage = {
    renderCharts: renderCharts,
    buildStatCard: buildStatCard,
    renderChartDetail: renderChartDetail,
    renderMoodTrendChart: renderMoodTrendChart,
    renderTypeDistChart: renderTypeDistChart,
    renderEmotionBarChart: renderEmotionBarChart
  };

  // 直接暴露到 window
  window.renderCharts = renderCharts;

})();