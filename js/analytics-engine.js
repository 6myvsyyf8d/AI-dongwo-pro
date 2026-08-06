/**
 * analytics-engine.js — 数据分析引擎
 * 挂载：window.AnalyticsEngine
 * 从 DataStore.records 读数据，按时间过滤，做聚合/统计/摘要
 */
(function () {
  'use strict';

  var U = window.Utils;
  var DS = window.DataStore;
  var C = window.Constants;

  /* ==========================================================
   * 内部辅助
   * ========================================================== */

  /**
   * 获取指定日期范围的任务完成统计
   */
  function getTaskStats(startDate, endDate) {
    var tasks = DS.getTasks ? DS.getTasks(true) : [];
    if (tasks.length === 0) return { total: 0, done: 0, rate: 0, empty: true };

    // 收集日期范围内每天的任务实例
    var totalDone = 0;
    var totalTasks = 0;
    var dates = getDateRange(startDate, new Date(endDate).getTime() - new Date(startDate).getTime() > 0
      ? Math.round((new Date(endDate) - new Date(startDate)) / 86400000) + 1 : 1);

    dates.forEach(function (ds) {
      var instances = DS.getTaskInstances ? DS.getTaskInstances(ds) : [];
      if (instances.length > 0) {
        totalTasks += instances.length;
        totalDone += instances.filter(function (i) { return i.status === 'done'; }).length;
      }
    });

    // 如果当天没有实例，用 active tasks 数量估算
    if (totalTasks === 0) totalTasks = tasks.length;

    return {
      total: totalTasks,
      done: totalDone,
      rate: totalTasks > 0 ? Math.round(totalDone / totalTasks * 100) : 0,
      empty: totalTasks === 0 && totalDone === 0
    };
  }

  /** 获取所有记录 */
  function getRecords() {
    return DS.getRecords();
  }

  /** 按日期范围过滤 */
  function filterByDateRange(startDate, endDate) {
    var records = getRecords();
    if (!startDate && !endDate) return records;
    return records.filter(function (r) {
      if (startDate && r.date < startDate) return false;
      if (endDate && r.date > endDate) return false;
      return true;
    });
  }

  /** 按日期获取记录 */
  function getRecordsByDate(dateStr) {
    return filterByDateRange(dateStr, dateStr);
  }

  /** 按 module 过滤 */
  function filterByModule(records, moduleKey) {
    if (!moduleKey) return records;
    return records.filter(function (r) { return r.module === moduleKey; });
  }

  /** 判断记录是否属于正面 */
  function isPositive(record) {
    if (record.mood && (record.mood === 'happy' || record.mood === 'excited' || record.mood === 'calm')) return true;
    if (record.emotion_type && (record.emotion_type === '开心' || record.emotion_type === '兴奋')) return true;
    return false;
  }

  /** 判断记录是否需要关注（负面/预警） */
  function needsAttention(record) {
    if (record.mood && (record.mood === 'anxious' || record.mood === 'sad')) return true;
    if (record.emotion_type && (
      record.emotion_type === '焦虑' || record.emotion_type === '难过' ||
      record.emotion_type === '生气' || record.emotion_type === '恐惧' ||
      record.emotion_type === '烦躁'
    )) return true;
    return false;
  }

  /** 判断是否为用药相关记录 */
  function isMedicationRecord(record) {
    if (record.type === 'care') {
      var content = (record.content || '') + (record.title || '');
      if (content.indexOf('药') !== -1 || content.indexOf('服药') !== -1 || content.indexOf('用药') !== -1) return true;
      if (record.tags && record.tags.indexOf('用药') !== -1) return true;
      if (record.tags && record.tags.indexOf('用药提醒') !== -1) return true;
    }
    return false;
  }

  /** 获取指定日期前后N天的日期字符串数组 */
  function getDateRange(startDate, days) {
    var parts = startDate.split('-');
    var start = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    var result = [];
    for (var i = 0; i < days; i++) {
      var d = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
      result.push(U.date.format(d));
    }
    return result;
  }

  /** 情绪评分：给情绪赋值用于计算趋势（开心=5, 兴奋=4, 平静=3, 焦虑=2, 难过=1, 生气=1） */
  function moodToScore(mood) {
    var map = { happy: 5, excited: 4, calm: 3, anxious: 2, sad: 1 };
    return map[mood] || 3;
  }

  function emotionTypeToScore(emotionType) {
    var map = { '开心': 5, '兴奋': 4, '平静': 3, '焦虑': 2, '难过': 1, '生气': 1, '恐惧': 1, '烦躁': 2 };
    return map[emotionType] || 3;
  }

  /* ==========================================================
   * 辅助方法（公开）
   * ========================================================== */

  /**
   * getMedicationAdherence(dateStr)
   * 返回指定日期的用药依从性统计
   */
  function getMedicationAdherence(dateStr) {
    dateStr = dateStr || U.date.today();
    var records = getRecordsByDate(dateStr);
    var medRecords = records.filter(isMedicationRecord);
    return {
      date: dateStr,
      totalMedicationRecords: medRecords.length,
      hasMedicationRecord: medRecords.length > 0,
      records: medRecords
    };
  }

  /**
   * getEmotionTrend(days)
   * 返回最近 N 天的情绪趋势数据点 [{date, score, moodLabel, count}]
   */
  function getEmotionTrend(days) {
    days = days || 7;
    var todayStr = U.date.today();
    var dates = getDateRange(dateStrOffset(-(days - 1)), days);
    var allRecords = getRecords();

    return dates.map(function (dateStr) {
      var dayRecords = allRecords.filter(function (r) { return r.date === dateStr; });
      var moodRecords = dayRecords.filter(function (r) { return r.type === 'mood' && r.mood; });
      var emoRecords = dayRecords.filter(function (r) { return r.type === 'emotion' && r.emotion_type; });

      var scores = [];
      var labels = [];

      moodRecords.forEach(function (r) {
        scores.push(moodToScore(r.mood));
        labels.push(r.mood);
      });
      emoRecords.forEach(function (r) {
        scores.push(emotionTypeToScore(r.emotion_type));
        labels.push(r.emotion_type);
      });

      var avgScore = scores.length > 0 ? Math.round((scores.reduce(function (a, b) { return a + b; }, 0) / scores.length) * 10) / 10 : null;

      return {
        date: dateStr,
        score: avgScore,
        dominantMood: labels.length > 0 ? mostFrequent(labels) : null,
        count: moodRecords.length + emoRecords.length
      };
    });
  }

  /** 获取字符串数组中出现最多的 */
  function mostFrequent(arr) {
    var counts = {};
    arr.forEach(function (v) { counts[v] = (counts[v] || 0) + 1; });
    var max = 0, maxK = null;
    for (var k in counts) { if (counts[k] > max) { max = counts[k]; maxK = k; } }
    return maxK;
  }

  /**
   * getTopTags(module, limit)
   * 返回指定模块的高频标签 [{tag, count}]
   */
  function getTopTags(moduleKey, limit) {
    limit = limit || 10;
    var records = filterByModule(getRecords(), moduleKey);
    var tagCounts = {};
    records.forEach(function (r) {
      if (r.tags && r.tags.length) {
        r.tags.forEach(function (t) {
          tagCounts[t] = (tagCounts[t] || 0) + 1;
        });
      }
    });
    var sorted = Object.keys(tagCounts)
      .map(function (k) { return { tag: k, count: tagCounts[k] }; })
      .sort(function (a, b) { return b.count - a.count; });
    return sorted.slice(0, limit);
  }

  /**
   * getActiveContributors(days)
   * 返回最近 N 天内活跃贡献者统计 [{name, role, avatar, count}]
   */
  function getActiveContributors(days) {
    days = days || 30;
    var threshold = dateStrOffset(-(days - 1));
    var records = filterByDateRange(threshold, U.date.today());
    var authorCounts = {};
    records.forEach(function (r) {
      var key = (r.author || '未知') + '|' + (r.authorRole || 'unknown');
      if (!authorCounts[key]) {
        authorCounts[key] = {
          name: r.author || '未知',
          role: r.authorRole || 'unknown',
          avatar: r.authorAvatar || '👤',
          count: 0
        };
      }
      authorCounts[key].count++;
    });
    var sorted = Object.values(authorCounts).sort(function (a, b) { return b.count - a.count; });
    return sorted;
  }

  /** 日期偏移工具 */
  function dateStrOffset(offset) {
    var d = new Date();
    d.setDate(d.getDate() + offset);
    return U.date.format(d);
  }

  /* ==========================================================
   * 日报 — getDailyReport(dateStr)
   * ========================================================== */

  function getDailyReport(dateStr) {
    dateStr = dateStr || U.date.today();
    var records = getRecordsByDate(dateStr);
    var displayDate = U.date.display(dateStr);

    // 记录时间轴（按时间排序）
    var timeline = records.slice().sort(function (a, b) {
      return (a.time || '00:00').localeCompare(b.time || '00:00');
    });

    // 计数统计
    var totalRecords = records.length;
    var positiveCount = records.filter(isPositive).length;
    var needsAttentionCount = records.filter(needsAttention).length;

    // 主动表达次数 = 沟通模块记录
    var expressionRecords = records.filter(function (r) { return r.type === 'communication'; });
    var expressionCount = expressionRecords.length;

    // 用药情况
    var medInfo = getMedicationAdherence(dateStr);

    // 模块分布
    var moduleDistribution = {};
    records.forEach(function (r) {
      if (r.module) {
        moduleDistribution[r.module] = (moduleDistribution[r.module] || 0) + 1;
      }
    });

    // 按类型分布
    var typeDistribution = {};
    records.forEach(function (r) {
      typeDistribution[r.type] = (typeDistribution[r.type] || 0) + 1;
    });

    // 标签频次
    var allTags = {};
    records.forEach(function (r) {
      if (r.tags && r.tags.length) {
        r.tags.forEach(function (t) {
          allTags[t] = (allTags[t] || 0) + 1;
        });
      }
    });

    // 任务完成情况
    var taskStats = getTaskStats(dateStr, dateStr);

    // 生成 AI 小结
    var summary = generateDailySummary(dateStr, records, totalRecords, positiveCount, needsAttentionCount, expressionCount, medInfo, moduleDistribution, allTags, taskStats);

    return {
      date: dateStr,
      displayDate: displayDate,
      // 时间轴
      timeline: timeline,
      // 统计
      statistics: {
        totalRecords: totalRecords,
        positiveCount: positiveCount,
        needsAttentionCount: needsAttentionCount,
        expressionCount: expressionCount,
        neutralCount: totalRecords - positiveCount - needsAttentionCount
      },
      // 用药
      medication: medInfo,
      // 分布
      moduleDistribution: moduleDistribution,
      typeDistribution: typeDistribution,
      // 高频标签
      topTags: Object.keys(allTags)
        .map(function (k) { return { tag: k, count: allTags[k] }; })
        .sort(function (a, b) { return b.count - a.count; })
        .slice(0, 5),
      // AI 小结文本
      summary: summary,
      // 记录列表
      records: records,
      // 任务统计
      taskStats: taskStats
    };
  }

  function generateDailySummary(dateStr, records, total, positive, negative, expression, medInfo, moduleDist, allTags, taskStats) {
    var lines = [];
    var dateLabel = U.date.display(dateStr);

    lines.push('📋 ' + dateLabel + '，共记录了 ' + total + ' 条信息。');

    // 情绪状态描述 — 使用谨慎表达
    if (positive > 0 && negative > 0) {
      lines.push('记录显示今日情绪有起伏：有 ' + positive + ' 次积极记录，' + negative + ' 次需要关注的记录。');
    } else if (positive > 0) {
      lines.push('记录中正面表现较多，有 ' + positive + ' 次积极记录。');
    } else if (negative > 0) {
      lines.push('记录显示有 ' + negative + ' 条内容需要关注，建议详细了解具体情况。');
    } else if (total > 0) {
      lines.push('今日记录以日常信息为主，记录中未见明显情绪波动。');
    }

    // 沟通表达
    if (expression > 0) {
      lines.push('记录到主动表达 ' + expression + ' 次，沟通方面表现较为积极。');
    }

    // 用药 — 仅陈述事实
    if (medInfo.hasMedicationRecord) {
      lines.push('有用药相关记录，已记录在案。');
    }

    // 模块参与
    var modules = Object.keys(moduleDist);
    if (modules.length > 0) {
      var modLabels = modules.map(function (m) {
        var labels = { emotion: '情绪', communication: '沟通', care: '照护', work: '工作' };
        return (labels[m] || m) + '(' + moduleDist[m] + '条)';
      });
      lines.push('涉及模块：' + modLabels.join('、') + '。');
    }

    // 活动亮点
    var activityRecords = records.filter(function (r) { return r.type === 'activity' && r.title; });
    if (activityRecords.length > 0) {
      var activities = activityRecords.map(function (r) { return r.title; }).join('、');
      lines.push('今日活动：' + activities + '。');
    }

    // 任务完成情况
    if (taskStats && !taskStats.empty && taskStats.total > 0) {
      lines.push('今日任务：共 ' + taskStats.total + ' 项，已完成 ' + taskStats.done + ' 项（' + taskStats.rate + '%）。');
    }

    // 高频标签提示
    var sortedTags = Object.keys(allTags)
      .map(function (k) { return { tag: k, count: allTags[k] }; })
      .sort(function (a, b) { return b.count - a.count; })
      .slice(0, 3);
    if (sortedTags.length > 0) {
      var attentionTags = sortedTags.filter(function(t) {
        return t.tag.indexOf('焦虑') > -1 || t.tag.indexOf('触发') > -1 || t.tag.indexOf('预警') > -1;
      });
      if (attentionTags.length > 0) {
        lines.push('🔍 记录中较常出现标签：' + attentionTags.map(function(t) { return t.tag; }).join('、') + '，可能值得关注。[系统推测]');
      }
    }

    // 没有记录
    if (total === 0) {
      lines = ['📋 ' + dateLabel + '暂无记录。建议各角色及时记录日常情况，保持档案的连续性。'];
    }

    return lines.join('\n');
  }

  /* ==========================================================
   * 周报 — getWeeklyReport(mondayDateStr)
   * ========================================================== */

  function getWeeklyReport(mondayDateStr) {
    if (!mondayDateStr) {
      // 默认取本周一
      var d = new Date();
      var day = d.getDay();
      var diff = day === 0 ? -6 : 1 - day; // 周日往前推6天
      d.setDate(d.getDate() + diff);
      mondayDateStr = U.date.format(d);
    }

    var dates = getDateRange(mondayDateStr, 7);
    var endDate = dates[6];
    var allRecords = filterByDateRange(mondayDateStr, endDate);

    // 7天记录数数组
    var dailyCounts = dates.map(function (dateStr) {
      return allRecords.filter(function (r) { return r.date === dateStr; }).length;
    });

    // 基本统计
    var totalRecords = allRecords.length;
    var positiveCount = allRecords.filter(isPositive).length;
    var needsAttentionCount = allRecords.filter(needsAttention).length;
    var expressionRecords = allRecords.filter(function (r) { return r.type === 'communication'; });
    var expressionCount = expressionRecords.length;

    // 类型分布
    var typeDistribution = {};
    allRecords.forEach(function (r) {
      typeDistribution[r.type] = (typeDistribution[r.type] || 0) + 1;
    });

    // 模块分布
    var moduleDistribution = {};
    allRecords.forEach(function (r) {
      if (r.module) {
        moduleDistribution[r.module] = (moduleDistribution[r.module] || 0) + 1;
      }
    });

    // 情绪趋势 7 个数据点
    var emotionTrend = dates.map(function (dateStr) {
      var dayRecords = allRecords.filter(function (r) { return r.date === dateStr; });
      var moodRecs = dayRecords.filter(function (r) { return r.type === 'mood' && r.mood; });
      var emoRecs = dayRecords.filter(function (r) { return r.type === 'emotion' && r.emotion_type; });
      var scores = [];
      var labels = [];
      moodRecs.forEach(function (r) { scores.push(moodToScore(r.mood)); labels.push(r.mood); });
      emoRecs.forEach(function (r) { scores.push(emotionTypeToScore(r.emotion_type)); labels.push(r.emotion_type); });
      var avgScore = scores.length > 0 ? Math.round((scores.reduce(function (a, b) { return a + b; }, 0) / scores.length) * 10) / 10 : null;
      return {
        date: dateStr,
        displayDate: U.date.display(dateStr),
        score: avgScore,
        dominantMood: labels.length > 0 ? mostFrequent(labels) : null,
        recordCount: dayRecords.length
      };
    });

    // 模式发现
    var patternDetection = detectPatterns(allRecords, mondayDateStr, dates);

    // 用药 Adherence 汇总
    var medicationSummary = dates.map(function (dateStr) {
      var medRecords = allRecords.filter(function (r) { return r.date === dateStr && isMedicationRecord(r); });
      return { date: dateStr, hasMedication: medRecords.length > 0, count: medRecords.length };
    });

    // 周小结
    var summary = generateWeeklySummary(mondayDateStr, dates, totalRecords, positiveCount, needsAttentionCount, expressionCount, dailyCounts, emotionTrend, patternDetection, moduleDistribution);

    return {
      weekStart: mondayDateStr,
      weekEnd: endDate,
      dates: dates,
      // 7天记录数数组（柱状图用）
      dailyCounts: dailyCounts,
      // 统计
      statistics: {
        totalRecords: totalRecords,
        positiveCount: positiveCount,
        needsAttentionCount: needsAttentionCount,
        expressionCount: expressionCount,
        avgDailyRecords: totalRecords > 0 ? Math.round(totalRecords / 7 * 10) / 10 : 0
      },
      // 类型分布
      typeDistribution: typeDistribution,
      // 模块分布
      moduleDistribution: moduleDistribution,
      // 情绪趋势 7 个数据点
      emotionTrend: emotionTrend,
      // 用药汇总
      medicationSummary: medicationSummary,
      // 模式发现
      patternDetection: patternDetection,
      // 活跃贡献者
      topContributors: getActiveContributors(7),
      // 周小结
      summary: summary
    };
  }

  /**
   * patternDetection - 自动发现模式
   * - 常见压力情境（情绪模块高频标签）
   * - 有效支持方法（照护模块 + 策略成功案例）
   * - 新出现的能力（工作模块首次出现的标签）
   */
  function detectPatterns(allRecords, mondayDateStr, dates) {
    // 情绪模块记录
    var emotionRecords = filterByModule(allRecords, 'emotion');
    // 照护模块记录
    var careRecords = filterByModule(allRecords, 'care');
    // 工作模块记录
    var workRecords = filterByModule(allRecords, 'work');

    // --- 常见压力情境：情绪模块高频标签 ---
    var emotionTagCounts = {};
    emotionRecords.forEach(function (r) {
      if (r.tags && r.tags.length) {
        r.tags.forEach(function (t) {
          emotionTagCounts[t] = (emotionTagCounts[t] || 0) + 1;
        });
      }
    });
    var stressPatterns = Object.keys(emotionTagCounts)
      .map(function (k) { return { tag: k, count: emotionTagCounts[k] }; })
      .sort(function (a, b) { return b.count - a.count; })
      .slice(0, 5);

    // --- 有效支持方法：策略记录 + 照护记录 ---
    var strategyRecords = allRecords.filter(function (r) { return r.type === 'strategy'; });
    var effectiveStrategies = [];
    // strategy 记录中的有效方法
    strategyRecords.forEach(function (r) {
      effectiveStrategies.push({
        title: r.title || r.content || '',
        type: 'strategy',
        tags: r.tags || [],
        author: r.author || '',
        date: r.date
      });
    });
    // 照护模块中的成功案例（内容中有关键词的）
    careRecords.forEach(function (r) {
      var content = (r.content || '') + (r.title || '');
      if (content.indexOf('成功') !== -1 || content.indexOf('改善') !== -1 || content.indexOf('好转') !== -1 ||
          content.indexOf('正常') !== -1 || content.indexOf('稳定') !== -1 || content.indexOf('顺利') !== -1) {
        effectiveStrategies.push({
          title: r.title || content.substring(0, 30),
          type: 'care',
          tags: r.tags || [],
          author: r.author || '',
          date: r.date
        });
      }
    });

    // --- 新出现的能力：工作模块标签，对比本周 vs 过去 ---
    var prevEndDate = dateStrOffset(-1, mondayDateStr); // 上周日
    var prevStartDate = dateStrOffset(-30, mondayDateStr); // 本日前30天
    // 调整获取历史记录
    var prevWorkRecords = filterByDateRange(prevStartDate, prevEndDate).filter(function (r) { return r.module === 'work'; });
    var prevTags = {};
    prevWorkRecords.forEach(function (r) {
      if (r.tags && r.tags.length) {
        r.tags.forEach(function (t) { prevTags[t] = (prevTags[t] || 0) + 1; });
      }
    });

    var currentTags = {};
    workRecords.forEach(function (r) {
      if (r.tags && r.tags.length) {
        r.tags.forEach(function (t) { currentTags[t] = (currentTags[t] || 0) + 1; });
      }
    });

    var newAbilities = [];
    Object.keys(currentTags).forEach(function (t) {
      if (!prevTags[t]) {
        newAbilities.push({ tag: t, count: currentTags[t] });
      }
    });
    newAbilities.sort(function (a, b) { return b.count - a.count; });

    return {
      stressPatterns: stressPatterns,
      effectiveStrategies: effectiveStrategies.slice(0, 5),
      newAbilities: newAbilities.slice(0, 5),
      // 附加情绪事件汇总
      emotionEvents: emotionRecords.filter(function (r) { return r.emotion_type && needsAttention(r); })
    };
  }

  function dateStrOffset(offset, baseDate) {
    var parts = (baseDate || U.date.today()).split('-');
    var d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    d.setDate(d.getDate() + offset);
    return U.date.format(d);
  }

  function generateWeeklySummary(startDate, dates, total, positive, negative, expression, dailyCounts, emotionTrend, patterns, moduleDist) {
    var lines = [];
    lines.push('📋 本周（' + startDate + ' 至 ' + dates[6] + '）共记录了 ' + total + ' 条信息。');

    // 记录趋势
    var avgDaily = total > 0 ? Math.round(total / 7 * 10) / 10 : 0;
    var maxDay = -1, maxDayIdx = 0;
    dailyCounts.forEach(function (c, i) { if (c > maxDay) { maxDay = c; maxDayIdx = i; } });
    lines.push('日均记录 ' + avgDaily + ' 条，' + U.date.display(dates[maxDayIdx]) + '记录最多（' + maxDay + '条）。');

    // 情绪 — 谨慎表达
    if (positive > 0 || negative > 0) {
      lines.push('记录中积极表现 ' + positive + ' 次，需要关注 ' + negative + ' 次。');
    }

    // 沟通表达
    if (expression > 0) {
      lines.push('记录到主动表达 ' + expression + ' 次。');
    }

    // 情绪趋势 — 标注为系统推测
    var trendScores = emotionTrend.map(function (e) { return e.score; }).filter(function (s) { return s !== null; });
    if (trendScores.length >= 3) {
      var firstHalf = trendScores.slice(0, Math.floor(trendScores.length / 2));
      var secondHalf = trendScores.slice(Math.floor(trendScores.length / 2));
      var firstAvg = firstHalf.reduce(function (a, b) { return a + b; }, 0) / firstHalf.length;
      var secondAvg = secondHalf.reduce(function (a, b) { return a + b; }, 0) / secondHalf.length;
      if (secondAvg > firstAvg + 0.5) {
        lines.push('🔍 基于记录的情绪评分呈上升趋势，可能反映状态向好。[系统推测]');
      } else if (secondAvg < firstAvg - 0.5) {
        lines.push('🔍 基于记录的情绪评分略有下降，可能值得关注压力来源。[系统推测]');
      } else {
        lines.push('🔍 基于记录的情绪评分整体稳定。[系统推测]');
      }
    }

    // 模式发现 — 标记为系统推测
    if (patterns.stressPatterns.length > 0) {
      var stressNames = patterns.stressPatterns.map(function (p) { return p.tag; }).join('、');
      lines.push('🔍 记录中较常出现的标签：' + stressNames + '，可能值得关注。[系统推测]');
    }
    if (patterns.newAbilities.length > 0) {
      var abilityNames = patterns.newAbilities.map(function (a) { return a.tag; }).join('、');
      lines.push('🔍 本周新出现的能力标签：' + abilityNames + '，可能是积极变化信号。[系统推测]');
    }

    if (total === 0) {
      lines = ['本周暂无记录。请各角色及时记录，保持档案连续性。'];
    }

    return lines.join('\n');
  }

  /* ==========================================================
   * 月报 — getMonthlyReport(yearMonthStr)
   * ========================================================== */

  function getMonthlyReport(yearMonthStr) {
    if (!yearMonthStr) {
      var d = new Date();
      yearMonthStr = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
    }

    var parts = yearMonthStr.split('-');
    var year = parseInt(parts[0]);
    var month = parseInt(parts[1]);

    // 当月日期范围
    var daysInMonth = new Date(year, month, 0).getDate(); // month 是 JS 的 0-based 不对，我们传的是 1-based
    var firstDay = yearMonthStr + '-01';
    var lastDay = yearMonthStr + '-' + String(daysInMonth).padStart(2, '0');

    var allRecords = filterByDateRange(firstDay, lastDay);

    // 上月日期范围
    var prevMonth = month === 1 ? 12 : month - 1;
    var prevYear = month === 1 ? year - 1 : year;
    var prevDaysInMonth = new Date(prevYear, prevMonth, 0).getDate();
    var prevFirstDay = prevYear + '-' + String(prevMonth).padStart(2, '0') + '-01';
    var prevLastDay = prevYear + '-' + String(prevMonth).padStart(2, '0') + '-' + String(prevDaysInMonth).padStart(2, '0');
    var prevRecords = filterByDateRange(prevFirstDay, prevLastDay);

    // === 本月统计 ===
    var totalRecords = allRecords.length;
    var positiveCount = allRecords.filter(isPositive).length;
    var needsAttentionCount = allRecords.filter(needsAttention).length;
    var expressionCount = allRecords.filter(function (r) { return r.type === 'communication'; }).length;
    var moodRecords = allRecords.filter(function (r) { return r.type === 'mood'; });
    var avgMoodScore = moodRecords.length > 0
      ? Math.round(moodRecords.reduce(function (s, r) { return s + moodToScore(r.mood); }, 0) / moodRecords.length * 10) / 10
      : null;

    // 模块分布
    var moduleDistribution = {};
    allRecords.forEach(function (r) {
      if (r.module) {
        moduleDistribution[r.module] = (moduleDistribution[r.module] || 0) + 1;
      }
    });

    // 类型分布
    var typeDistribution = {};
    allRecords.forEach(function (r) {
      typeDistribution[r.type] = (typeDistribution[r.type] || 0) + 1;
    });

    // 标签排行
    var allTags = {};
    allRecords.forEach(function (r) {
      if (r.tags && r.tags.length) {
        r.tags.forEach(function (t) { allTags[t] = (allTags[t] || 0) + 1; });
      }
    });
    var sortedTags = Object.keys(allTags)
      .map(function (k) { return { tag: k, count: allTags[k] }; })
      .sort(function (a, b) { return b.count - a.count; });

    // === 上月统计（用于对比） ===
    var prevTotal = prevRecords.length;
    var prevPositive = prevRecords.filter(isPositive).length;
    var prevNegative = prevRecords.filter(needsAttention).length;
    var prevExpression = prevRecords.filter(function (r) { return r.type === 'communication'; }).length;

    // === 月度对比 ===
    function compareDirection(curr, prev, label) {
      if (prev === 0 && curr > 0) return 'up_new';
      if (curr > prev) return 'up';
      if (curr < prev) return 'down';
      return 'stable';
    }

    function compareDiff(curr, prev) {
      var diff = curr - prev;
      if (diff > 0) return '+' + diff;
      return String(diff);
    }

    var monthComparison = {
      totalRecords: { current: totalRecords, previous: prevTotal, direction: compareDirection(totalRecords, prevTotal), diff: compareDiff(totalRecords, prevTotal) },
      positiveCount: { current: positiveCount, previous: prevPositive, direction: compareDirection(positiveCount, prevPositive), diff: compareDiff(positiveCount, prevPositive) },
      needsAttentionCount: { current: needsAttentionCount, previous: prevNegative, direction: compareDirection(needsAttentionCount, prevNegative), diff: compareDiff(needsAttentionCount, prevNegative) },
      expressionCount: { current: expressionCount, previous: prevExpression, direction: compareDirection(expressionCount, prevExpression), diff: compareDiff(expressionCount, prevExpression) },
      avgDailyRecords: {
        current: totalRecords > 0 ? Math.round(totalRecords / daysInMonth * 10) / 10 : 0,
        previous: prevTotal > 0 ? Math.round(prevTotal / prevDaysInMonth * 10) / 10 : 0
      }
    };

    // === 目标进展追踪 ===
    // 基于 activity 和 strategy 记录
    var activityRecords = allRecords.filter(function (r) { return r.type === 'activity'; });
    var strategyRecords = allRecords.filter(function (r) { return r.type === 'strategy'; });
    var goalProgress = {
      activityCount: activityRecords.length,
      strategyCount: strategyRecords.length,
      activities: activityRecords.map(function (r) { return { title: r.title, date: r.date, author: r.author }; }),
      strategies: strategyRecords.map(function (r) { return { title: r.title, date: r.date, content: r.content, tags: r.tags }; })
    };

    // === 下月建议 ===
    var suggestions = generateMonthlySuggestions(yearMonthStr, allRecords, monthComparison, sortedTags, moduleDistribution);

    // === 月度小结 ===
    var summary = generateMonthlySummary(yearMonthStr, totalRecords, positiveCount, needsAttentionCount, expressionCount, avgMoodScore, moduleDistribution, monthComparison, sortedTags);

    return {
      yearMonth: yearMonthStr,
      daysInMonth: daysInMonth,
      dateRange: { from: firstDay, to: lastDay },
      // 统计
      statistics: {
        totalRecords: totalRecords,
        positiveCount: positiveCount,
        needsAttentionCount: needsAttentionCount,
        expressionCount: expressionCount,
        avgMoodScore: avgMoodScore,
        avgDailyRecords: totalRecords > 0 ? Math.round(totalRecords / daysInMonth * 10) / 10 : 0
      },
      // 分布
      moduleDistribution: moduleDistribution,
      typeDistribution: typeDistribution,
      // 标签排行
      topTags: sortedTags.slice(0, 10),
      // 月度对比
      monthComparison: monthComparison,
      // 目标进展
      goalProgress: goalProgress,
      // 下月建议
      suggestions: suggestions,
      // 活跃贡献者
      topContributors: getActiveContributors(30),
      // 月度小结
      summary: summary
    };
  }

  function generateMonthlySuggestions(yearMonthStr, records, comparison, topTags, moduleDist) {
    var suggestions = [];

    // 基于对比的建议 — 用谨慎表达
    if (comparison.needsAttentionCount.direction === 'up') {
      suggestions.push('记录中需要关注的内容较上月增加，可能与环境或计划变化有关，建议与支持团队讨论排查。');
    }
    if (comparison.needsAttentionCount.direction === 'down') {
      suggestions.push('需要关注的记录较上月减少，当前的支持方式可能有帮助，建议继续保持观察。');
    }
    if (comparison.expressionCount.direction === 'up') {
      suggestions.push('本月主动表达次数较上月增加，可考虑适当鼓励更多自主表达机会。');
    }
    if (comparison.expressionCount.direction === 'down') {
      suggestions.push('本月主动表达次数较上月减少，可尝试更多视觉辅助工具（如图片卡、社交故事）促进沟通。');
    }
    if (comparison.positiveCount.direction === 'up') {
      suggestions.push('积极表现记录较上月增加，可考虑在现有支持基础上逐步增加适度挑战性活动。');
    }

    // 基于模块分布
    if (!moduleDist['emotion'] || moduleDist['emotion'] < 5) {
      suggestions.push('情绪模块记录偏少，提醒各角色及时记录情绪观察，尤其在过渡时段（如活动变更前后）。');
    }
    if (!moduleDist['communication'] || moduleDist['communication'] < 3) {
      suggestions.push('沟通模块记录偏少，鼓励老师和影子老师记录日常沟通中的发现。');
    }

    // 基于高频标签 — 使用"记录中较常出现"
    var stressTags = topTags.filter(function (t) {
      return ['焦虑', '触发', '预警', '感官'].indexOf(t.tag) !== -1;
    });
    if (stressTags.length > 0) {
      var tagNames = stressTags.map(function (t) { return t.tag; }).join('、');
      suggestions.push('记录中较常出现压力相关标签（' + tagNames + '），建议与支持团队讨论是否需要制定针对性的应对预案。');
    }

    // 常规建议
    suggestions.push('保持每日记录的连续性，确保各角色（家长、老师、影子老师）按时完成各自模块的记录。');

    return suggestions;
  }

  function generateMonthlySummary(yearMonthStr, total, positive, negative, expression, avgMood, moduleDist, comparison, topTags) {
    var lines = [];
    lines.push('📋 ' + yearMonthStr + ' 月度总结：共记录 ' + total + ' 条信息。');

    if (avgMood !== null) {
      var moodDesc = avgMood >= 4 ? '偏积极' : avgMood >= 3 ? '平稳' : avgMood >= 2 ? '略有波动' : '偏低需关注';
      lines.push('基于记录的情绪平均评分 ' + avgMood + '（' + moodDesc + '）。[系统推测]');
    }

    // 对比
    var tc = comparison.totalRecords;
    if (tc.previous > 0) {
      lines.push('与上月对比：记录数变化 ' + tc.diff + '，积极表现变化 ' + comparison.positiveCount.diff + '，需关注记录变化 ' + comparison.needsAttentionCount.diff + '。');
    }

    // 模块
    var mods = Object.keys(moduleDist);
    if (mods.length > 0) {
      var modStrs = mods.map(function (m) {
        var labels = { emotion: '情绪', communication: '沟通', care: '照护', work: '工作' };
        return (labels[m] || m) + '' + moduleDist[m] + '条';
      });
      lines.push('模块分布：' + modStrs.join('，') + '。');
    }

    // 高频标签
    if (topTags.length > 0) {
      var top3 = topTags.slice(0, 3).map(function (t) { return t.tag + '(' + t.count + ')'; }).join('、');
      lines.push('记录中较常出现的标签：' + top3 + '。');
    }

    if (total === 0) {
      lines = ['📋 ' + yearMonthStr + ' 暂无记录。请督促各角色按时完成日常记录。'];
    }

    return lines.join('\n');
  }

  /* ==========================================================
   * 暴露到全局
   * ========================================================== */

  window.AnalyticsEngine = {
    // 日报
    getDailyReport: getDailyReport,
    // 周报
    getWeeklyReport: getWeeklyReport,
    // 月报
    getMonthlyReport: getMonthlyReport,
    // 辅助
    getMedicationAdherence: getMedicationAdherence,
    getEmotionTrend: getEmotionTrend,
    getTopTags: getTopTags,
    getActiveContributors: getActiveContributors
  };

})();
