/**
 * government.js — 政府数据看板 v2.0
 * 挂载：window.GovernmentDashboard
 * 为 government 角色提供宏观数据大屏：服务规模、趋势、分布、小样本保护
 * 依赖：window.DataStore, window.Utils, window.Constants
 * 设计：Linear/Modern 深色主题
 */
(function () {
  'use strict';

  var DS = window.DataStore;
  var U = window.Utils;
  var C = window.Constants;

  var chartInstances = {};
  // 小样本保护阈值：低于此值的分组将被隐藏或合并
  var SMALL_SAMPLE_THRESHOLD = 5;

  /* ==========================================================
   * 模拟数据生成 — 为演示生成有意义的聚合数据
   * 实际部署时替换为真实数据源
   * ========================================================== */

  /** 模拟地区分布 */
  var MOCK_REGIONS = [
    { name: '朝阳区', weight: 0.25 },
    { name: '海淀区', weight: 0.20 },
    { name: '丰台区', weight: 0.15 },
    { name: '通州区', weight: 0.12 },
    { name: '大兴区', weight: 0.10 },
    { name: '昌平区', weight: 0.08 },
    { name: '顺义区', weight: 0.06 },
    { name: '房山区', weight: 0.04 }
  ];

  /** 模拟年龄段分布 */
  var MOCK_AGE_GROUPS = [
    { label: '6-12岁', weight: 0.12 },
    { label: '13-17岁', weight: 0.22 },
    { label: '18-25岁', weight: 0.35 },
    { label: '26-35岁', weight: 0.20 },
    { label: '36岁以上', weight: 0.11 }
  ];

  /** 模拟机构 */
  var MOCK_INSTITUTIONS = [
    { name: '阳光家园康复中心', weight: 0.30, region: '朝阳区' },
    { name: '彩虹桥特教机构', weight: 0.25, region: '海淀区' },
    { name: '启明星工坊', weight: 0.18, region: '丰台区' },
    { name: '爱心驿站', weight: 0.12, region: '通州区' },
    { name: '星光就业中心', weight: 0.10, region: '大兴区' },
    { name: '暖阳社区服务站', weight: 0.05, region: '昌平区' }
  ];

  /** 模拟月度趋势数据（12个月） */
  function generateMonthlyTrends() {
    var months = [];
    var now = new Date();
    var baseNew = 8;
    var baseActive = 42;
    var baseRecords = 65;
    for (var i = 11; i >= 0; i--) {
      var d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      var label = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
      var growth = 1 + (11 - i) * 0.06 + Math.random() * 0.08;
      months.push({
        label: label,
        newUsers: Math.round(baseNew * growth),
        activeProfiles: Math.round(baseActive * growth),
        totalRecords: Math.round(baseRecords * growth),
        positiveMoodRatio: Math.round((0.62 + Math.random() * 0.18) * 100)
      });
    }
    return months;
  }

  /* ==========================================================
   * 小样本保护核心逻辑
   * ========================================================== */

  /**
   * 应用小样本保护：对分组数据进行最小阈值检查
   * @returns {Array} 过滤/合并后的分簇数据，含 protection 标记
   */
  function applySmallSampleProtection(items, labelKey, valueKey) {
    var protectedItems = [];
    var mergedCount = 0;
    var mergedLabel = '其他（小样本合并）';

    items.forEach(function (item) {
      var count = item[valueKey];
      if (count < SMALL_SAMPLE_THRESHOLD) {
        mergedCount += count;
      } else {
        protectedItems.push(Object.assign({}, item, { protected: false }));
      }
    });

    if (mergedCount > 0) {
      var merged = {};
      merged[labelKey] = mergedLabel;
      merged[valueKey] = mergedCount;
      merged.protected = true;
      merged.isMerged = true;
      protectedItems.push(merged);
    }

    return protectedItems;
  }

  /** 检查某个值是否需要小样本保护（用于显示判断） */
  function isProtected(count) {
    return count > 0 && count < SMALL_SAMPLE_THRESHOLD;
  }

  /* ==========================================================
   * 主渲染入口
   * ========================================================== */

  function renderDashboard() {
    var homeEl = document.getElementById('home-content');
    if (!homeEl) return;

    destroyAllCharts();

    var users = DS.getAllUsers ? DS.getAllUsers() : [];
    var records = DS.getRecords ? DS.getRecords() : [];
    var grants = DS.getGrants ? DS.getGrants() : [];
    var monthlyTrends = generateMonthlyTrends();

    var stats = computeStats(users, records, grants);

    var html = buildDashboardHTML(stats, records, grants, monthlyTrends);
    homeEl.innerHTML = html;

    // 延迟渲染图表
    setTimeout(function () {
      renderMonthlyTrendChart(monthlyTrends);
      renderAgeDistributionChart(stats);
      renderRegionDistChart(stats);
      renderInstitutionCompareChart(stats);
    }, 150);
  }

  function destroyAllCharts() {
    Object.keys(chartInstances).forEach(function (k) {
      if (chartInstances[k]) { chartInstances[k].destroy(); chartInstances[k] = null; }
    });
    chartInstances = {};
  }

  /* ==========================================================
   * 统计计算
   * ========================================================== */

  function computeStats(users, records, grants) {
    var now = new Date();
    var thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    var thirtyDayStr = U.date.format(thirtyDaysAgo);
    var activeGrants = grants.filter(function (g) { return g.status === 'active'; });

    // 唯一心青年数（通过授权推断）
    var youthIds = {};
    activeGrants.forEach(function (g) { if (g.youthId) youthIds[g.youthId] = true; });
    var totalYouths = Object.keys(youthIds).length || 1;

    var recentRecords = records.filter(function (r) { return r.date >= thirtyDayStr; });
    var activeArchives = uniqueCount(recentRecords, 'authorId');

    // 近30天情绪趋势
    var moodRecords = recentRecords.filter(function (r) { return r.type === 'mood'; });
    var positiveMoods = moodRecords.filter(function (r) {
      return r.mood === 'happy' || r.mood === 'excited' || r.mood === 'calm';
    }).length;
    var moodRatio = moodRecords.length > 0 ? Math.round((positiveMoods / moodRecords.length) * 100) : null;

    // 模块分布
    var moduleCounts = {};
    records.forEach(function (r) {
      var key = r.module || 'other';
      moduleCounts[key] = (moduleCounts[key] || 0) + 1;
    });

    // 模拟年龄段分布（基于 totalYouths 按权重分配）
    var ageDistribution = MOCK_AGE_GROUPS.map(function (g) {
      return { label: g.label, count: Math.max(1, Math.round(totalYouths * g.weight * (0.85 + Math.random() * 0.3))) };
    });

    // 模拟地区分布
    var regionDist = MOCK_REGIONS.map(function (r) {
      return { name: r.name, count: Math.max(0, Math.round(totalYouths * r.weight * (0.7 + Math.random() * 0.6))) };
    });

    // 模拟机构汇总
    var institutionData = MOCK_INSTITUTIONS.map(function (inst) {
      return {
        name: inst.name,
        region: inst.region,
        youthCount: Math.max(1, Math.round(totalYouths * inst.weight * (0.8 + Math.random() * 0.4))),
        activeCount: Math.max(0, Math.round(totalYouths * inst.weight * (0.5 + Math.random() * 0.3))),
        recordsLastMonth: Math.max(1, Math.round(totalYouths * inst.weight * 8 * (0.5 + Math.random())))
      };
    });

    return {
      totalUsers: users.length,
      totalRecords: records.length,
      totalYouths: totalYouths,
      activeGrants: activeGrants.length,
      recentRecords: recentRecords.length,
      activeArchives: activeArchives,
      moodRatio: moodRatio,
      moduleCounts: moduleCounts,
      ageDistribution: ageDistribution,
      regionDist: regionDist,
      institutionData: institutionData,
      dataUpdateTime: new Date().toLocaleString('zh-CN', { hour12: false })
    };
  }

  function uniqueCount(arr, key) {
    var set = {};
    arr.forEach(function (item) { if (item[key]) set[item[key]] = true; });
    return Object.keys(set).length;
  }

  /* ==========================================================
   * HTML 构建
   * ========================================================== */

  function buildDashboardHTML(stats, records, grants, monthlyTrends) {
    var h = '';

    h += '<div class="gov-dashboard">';

    // ---- 页面标题区 ----
    h += '<div class="gov-header">';
    h += '  <div class="gov-header-left">';
    h += '    <div class="gov-header-icon">🏛️</div>';
    h += '    <div>';
    h += '      <h1 class="gov-header-title">区域服务数据看板</h1>';
    h += '      <p class="gov-header-sub">聚合统计数据 · 小样本已保护 · 数据更新时间：' + stats.dataUpdateTime + '</p>';
    h += '    </div>';
    h += '  </div>';
    h += '  <div class="gov-header-badge">';
    h += '    <span class="gov-badge-dot"></span>仅汇总数据 · 不支持下钻到个人';
    h += '  </div>';
    h += '</div>';

    // ---- KPI 指标卡片 ----
    h += '<div class="gov-kpi-grid">';
    h += kpiCard('👥', '服务人数', stats.totalYouths, '人', '已建立支持档案的心青年', '#5E6AD2');
    h += kpiCard('📋', '活跃档案', stats.activeArchives, '人', '近30天有记录更新的档案', '#52C41A');
    h += kpiCard('📝', '近30天记录', stats.recentRecords, '条', '来自各角色的日常记录', '#FAAD14');
    h += kpiCard('🤝', '活跃授权', stats.activeGrants, '个', '当前有效的支持关系', '#722ED1');
    if (stats.moodRatio !== null) {
      h += kpiCard(
        stats.moodRatio >= 70 ? '😊' : stats.moodRatio >= 50 ? '😐' : '😟',
        '正面情绪占比', stats.moodRatio, '%', '近30天心情记录统计',
        stats.moodRatio >= 70 ? '#52C41A' : stats.moodRatio >= 50 ? '#FAAD14' : '#F5222D'
      );
    }
    h += '</div>';

    // ---- 趋势 + 分布 双图表行 ----
    h += '<div class="gov-chart-row">';
    h += '  <div class="gov-chart-panel gov-chart-wide">';
    h += '    <div class="gov-chart-panel-header">';
    h += '      <span>📈 月度趋势对比</span>';
    h += '      <span class="gov-chart-subtitle">近12个月 · 颜色克制，突出变化</span>';
    h += '    </div>';
    h += '    <div class="gov-chart-body"><canvas id="gov-monthly-trend"></canvas></div>';
    h += '  </div>';
    h += '  <div class="gov-chart-panel">';
    h += '    <div class="gov-chart-panel-header">';
    h += '      <span>👤 年龄段分布</span>';
    h += '      <span class="gov-chart-subtitle">小样本已保护</span>';
    h += '    </div>';
    h += '    <div class="gov-chart-body"><canvas id="gov-age-dist"></canvas></div>';
    h += '  </div>';
    h += '</div>';

    // ---- 地区分布 + 机构对比 ----
    h += '<div class="gov-chart-row">';
    h += '  <div class="gov-chart-panel">';
    h += '    <div class="gov-chart-panel-header">';
    h += '      <span>📍 地区分布</span>';
    h += '      <span class="gov-chart-subtitle">注意：地区+年龄组合可能识别个人</span>';
    h += '    </div>';
    h += '    <div class="gov-chart-body"><canvas id="gov-region-dist"></canvas></div>';
    h += '  </div>';
    h += '  <div class="gov-chart-panel gov-chart-wide">';
    h += '    <div class="gov-chart-panel-header">';
    h += '      <span>🏢 机构间汇总比较</span>';
    h += '      <span class="gov-chart-subtitle">仅展示汇总数据，不含个人明细</span>';
    h += '    </div>';
    h += '    <div class="gov-chart-body"><canvas id="gov-inst-compare"></canvas></div>';
    h += '  </div>';
    h += '</div>';

    // ---- 统计口径说明 + 数据导出 ----
    h += '<div class="gov-bottom-row">';
    h += '  <div class="gov-methodology">';
    h += '    <div class="gov-methodology-title">📐 统计口径说明</div>';
    h += '    <div class="gov-methodology-list">';
    h += '      <div class="gov-methodology-item">';
    h += '        <span class="gov-meth-icon">👥</span>';
    h += '        <div><strong>服务人数</strong>：系统中已建立支持档案的心青年总数。通过授权关系推断，不包含未建立档案的人员。</div>';
    h += '      </div>';
    h += '      <div class="gov-methodology-item">';
    h += '        <span class="gov-meth-icon">📋</span>';
    h += '        <div><strong>活跃档案</strong>：近30天内有任意角色提交过记录的档案数。同一档案多人记录计为1。</div>';
    h += '      </div>';
    h += '      <div class="gov-methodology-item">';
    h += '        <span class="gov-meth-icon">🔒</span>';
    h += '        <div><strong>小样本保护</strong>：任何分组中人数 &lt; ' + SMALL_SAMPLE_THRESHOLD + ' 的项将被合并为「其他」或隐藏，防止通过地区、年龄等组合反向识别个人。</div>';
    h += '      </div>';
    h += '      <div class="gov-methodology-item">';
    h += '        <span class="gov-meth-icon">⚠️</span>';
    h += '        <div><strong>去标识化提醒</strong>：「去掉姓名」不等于脱敏。地区、年龄、机构等属性组合仍可能唯一识别个人。本看板所有数据均为汇总数据。</div>';
    h += '      </div>';
    h += '    </div>';
    h += '  </div>';

    h += '  <div class="gov-export-section">';
    h += '    <div class="gov-export-title">📤 数据导出</div>';
    h += '    <div class="gov-export-desc">导出仅包含汇总统计数据，不含任何个人信息。</div>';
    h += '    <div class="gov-export-buttons">';
    h += '      <button class="gov-btn-export" onclick="window.GovernmentDashboard.exportCSV()" disabled title="演示版本暂不可用">';
    h += '        <span>📊</span> 导出 CSV';
    h += '      </button>';
    h += '      <button class="gov-btn-export" onclick="window.GovernmentDashboard.exportReport()" disabled title="演示版本暂不可用">';
    h += '        <span>📄</span> 导出报告';
    h += '      </button>';
    h += '    </div>';
    h += '    <div class="gov-export-note">🔒 导出需上级审批，操作记录将留存审计日志</div>';
    h += '  </div>';
    h += '</div>';

    // ---- 底部版权 ----
    h += '<div class="gov-footer">';
    h += '  <div class="gov-footer-text">AI懂我 · 心智障碍者动态支持档案 — 政府数据看板 v2.0</div>';
    h += '  <div class="gov-footer-text">数据仅供决策参考 · 严禁用于个体识别 · 所有操作留痕</div>';
    h += '</div>';

    h += '</div>'; // .gov-dashboard
    return h;
  }

  function kpiCard(icon, label, value, unit, desc, color) {
    var protectedClass = isProtected(value) ? ' gov-kpi-protected' : '';
    var displayValue = isProtected(value) ? '&lt;' + SMALL_SAMPLE_THRESHOLD : String(value);
    return '' +
      '<div class="gov-kpi-card' + protectedClass + '">' +
      '  <div class="gov-kpi-icon" style="background:' + hexToRgba(color, 0.12) + ';color:' + color + ';">' + icon + '</div>' +
      '  <div class="gov-kpi-body">' +
      '    <div class="gov-kpi-value" style="color:' + color + ';">' + displayValue + '<span class="gov-kpi-unit"> ' + unit + '</span></div>' +
      '    <div class="gov-kpi-label">' + label + '</div>' +
      '    <div class="gov-kpi-desc">' + desc + '</div>' +
      '  </div>' +
      '</div>';
  }

  function hexToRgba(hex, alpha) {
    var r = parseInt(hex.slice(1, 3), 16);
    var g = parseInt(hex.slice(3, 5), 16);
    var b = parseInt(hex.slice(5, 7), 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
  }

  /* ==========================================================
   * 图表渲染
   * ========================================================== */

  /** 月度趋势图 — 双线：新用户 + 活跃档案 */
  function renderMonthlyTrendChart(monthlyTrends) {
    var canvas = document.getElementById('gov-monthly-trend');
    if (!canvas || typeof Chart === 'undefined') return;

    var ctx = canvas.getContext('2d');
    var labels = monthlyTrends.map(function (m) { return m.label; });

    if (chartInstances.monthlyTrend) chartInstances.monthlyTrend.destroy();
    chartInstances.monthlyTrend = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: '服务人数',
            data: monthlyTrends.map(function (m) { return m.activeProfiles; }),
            borderColor: '#5E6AD2',
            backgroundColor: 'rgba(94,106,210,0.06)',
            fill: true,
            tension: 0.4,
            pointRadius: 0,
            pointHoverRadius: 4,
            pointHoverBackgroundColor: '#5E6AD2',
            borderWidth: 2
          },
          {
            label: '月度记录数',
            data: monthlyTrends.map(function (m) { return m.totalRecords; }),
            borderColor: 'rgba(255,255,255,0.35)',
            backgroundColor: 'rgba(255,255,255,0.02)',
            fill: true,
            tension: 0.4,
            pointRadius: 0,
            pointHoverRadius: 4,
            pointHoverBackgroundColor: '#8A8F98',
            borderWidth: 1.5,
            borderDash: [4, 4]
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: '#8A8F98', font: { size: 11 }, padding: 16, usePointStyle: true, pointStyleWidth: 8 }
          },
          tooltip: {
            backgroundColor: 'rgba(10,10,12,0.95)',
            titleColor: '#EDEDEF',
            bodyColor: '#8A8F98',
            borderColor: 'rgba(255,255,255,0.06)',
            borderWidth: 1,
            padding: 12,
            cornerRadius: 8
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(255,255,255,0.04)' },
            ticks: { color: 'rgba(255,255,255,0.4)', font: { size: 10 }, maxTicksLimit: 6 }
          },
          y: {
            beginAtZero: false,
            grid: { color: 'rgba(255,255,255,0.04)' },
            ticks: { color: 'rgba(255,255,255,0.4)', font: { size: 10 } }
          }
        }
      }
    });
  }

  /** 年龄段分布 — 水平条 */
  function renderAgeDistributionChart(stats) {
    var canvas = document.getElementById('gov-age-dist');
    if (!canvas || typeof Chart === 'undefined') return;

    var ctx = canvas.getContext('2d');
    var ageData = applySmallSampleProtection(stats.ageDistribution, 'label', 'count');

    var labels = ageData.map(function (d) { return d.label; });
    var data = ageData.map(function (d) { return d.count; });
    var bgColors = ageData.map(function (d) {
      return d.isMerged ? 'rgba(255,255,255,0.08)' : 'rgba(94,106,210,0.4)';
    });

    if (chartInstances.ageDist) chartInstances.ageDist.destroy();
    chartInstances.ageDist = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: bgColors,
          borderRadius: 4,
          borderWidth: 1,
          borderColor: 'rgba(94,106,210,0.15)',
          barThickness: 18
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(10,10,12,0.95)',
            titleColor: '#EDEDEF',
            bodyColor: '#8A8F98',
            borderColor: 'rgba(255,255,255,0.06)',
            borderWidth: 1,
            padding: 10,
            cornerRadius: 8,
            callbacks: {
              label: function (ctx) {
                var val = ctx.raw;
                if (val < SMALL_SAMPLE_THRESHOLD) return '已隐藏（小样本保护）';
                return val + ' 人';
              }
            }
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(255,255,255,0.04)' },
            ticks: { color: 'rgba(255,255,255,0.4)', font: { size: 10 } }
          },
          y: {
            grid: { display: false },
            ticks: { color: 'rgba(255,255,255,0.6)', font: { size: 11 } }
          }
        }
      }
    });
  }

  /** 地区分布 — 水平条 */
  function renderRegionDistChart(stats) {
    var canvas = document.getElementById('gov-region-dist');
    if (!canvas || typeof Chart === 'undefined') return;

    var ctx = canvas.getContext('2d');
    var regionData = applySmallSampleProtection(stats.regionDist, 'name', 'count');
    // 按降序排列
    regionData.sort(function (a, b) { return b.count - a.count; });

    var labels = regionData.map(function (d) { return d.name; });
    var data = regionData.map(function (d) { return d.count; });
    var bgColors = regionData.map(function (d) {
      return d.isMerged ? 'rgba(255,255,255,0.08)' : 'rgba(114,46,209,0.35)';
    });

    if (chartInstances.regionDist) chartInstances.regionDist.destroy();
    chartInstances.regionDist = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: bgColors,
          borderRadius: 4,
          borderWidth: 1,
          borderColor: 'rgba(114,46,209,0.15)',
          barThickness: 16
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(10,10,12,0.95)',
            bodyColor: '#8A8F98',
            borderColor: 'rgba(255,255,255,0.06)',
            borderWidth: 1,
            padding: 10,
            cornerRadius: 8,
            callbacks: {
              label: function (ctx) {
                var val = ctx.raw;
                if (val < SMALL_SAMPLE_THRESHOLD) return '已隐藏（小样本保护）';
                return val + ' 人';
              }
            }
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(255,255,255,0.04)' },
            ticks: { color: 'rgba(255,255,255,0.4)', font: { size: 10 } }
          },
          y: {
            grid: { display: false },
            ticks: { color: 'rgba(255,255,255,0.6)', font: { size: 10 } }
          }
        }
      }
    });
  }

  /** 机构间汇总比较 — 分组柱状图 */
  function renderInstitutionCompareChart(stats) {
    var canvas = document.getElementById('gov-inst-compare');
    if (!canvas || typeof Chart === 'undefined') return;

    var ctx = canvas.getContext('2d');
    var instData = applySmallSampleProtection(stats.institutionData, 'name', 'youthCount');

    var labels = instData.map(function (d) { return d.name.length > 6 ? d.name.slice(0, 6) + '…' : d.name; });
    var youthData = instData.map(function (d) { return d.youthCount; });
    var activeData = instData.map(function (d) { return d.activeCount; });

    if (chartInstances.instCompare) chartInstances.instCompare.destroy();
    chartInstances.instCompare = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: '在册人数',
            data: youthData,
            backgroundColor: 'rgba(94,106,210,0.45)',
            borderRadius: 4,
            borderWidth: 0,
            barPercentage: 0.7,
            categoryPercentage: 0.7
          },
          {
            label: '月活人数',
            data: activeData,
            backgroundColor: 'rgba(82,196,26,0.35)',
            borderRadius: 4,
            borderWidth: 0,
            barPercentage: 0.7,
            categoryPercentage: 0.7
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: '#8A8F98', font: { size: 10 }, padding: 12, usePointStyle: true, pointStyleWidth: 8 }
          },
          tooltip: {
            backgroundColor: 'rgba(10,10,12,0.95)',
            titleColor: '#EDEDEF',
            bodyColor: '#8A8F98',
            borderColor: 'rgba(255,255,255,0.06)',
            borderWidth: 1,
            padding: 10,
            cornerRadius: 8
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: 'rgba(255,255,255,0.5)', font: { size: 10 }, maxRotation: 30 }
          },
          y: {
            grid: { color: 'rgba(255,255,255,0.04)' },
            ticks: { color: 'rgba(255,255,255,0.4)', font: { size: 10 } }
          }
        }
      }
    });
  }

  /* ==========================================================
   * 导出功能（演示版本暂不可用）
   * ========================================================== */

  function exportCSV() {
    // 演示版本，暂不实现
    window.showToast('演示版本暂不支持导出，实际部署时将提供汇总数据 CSV 导出。', 'info');
  }

  function exportReport() {
    window.showToast('演示版本暂不支持导出，实际部署时需上级审批后方可导出报告。', 'info');
  }

  /* ==========================================================
   * 公开 API
   * ========================================================== */

  window.GovernmentDashboard = {
    render: renderDashboard,
    destroy: destroyAllCharts,
    exportCSV: exportCSV,
    exportReport: exportReport
  };

})();
