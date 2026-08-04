/**
 * chatbot-classifier.js — 自动归类
 * 挂载：window.ChatbotClassifier
 * classifyMessage(text) 根据 MODULE_KEYWORDS 做关键词匹配，返回最匹配的模块和置信度
 */
(function () {
  'use strict';

  /**
   * 辅助函数：计算数组中去重后的元素个数
   * @param {Array} arr
   * @returns {number}
   */
  function uniqueCount(arr) {
    if (!arr || !arr.length) return 0;
    var seen = {};
    var count = 0;
    for (var i = 0; i < arr.length; i++) {
      if (!seen[arr[i]]) {
        seen[arr[i]] = true;
        count++;
      }
    }
    return count;
  }

  var ChatbotClassifier = {

    /**
     * 对用户消息进行模块分类
     * @param {string} text - 用户消息文本
     * @returns {{ module: string|null, confidence: number, matchedKeywords: string[] }}
     */
    classifyMessage: function (text) {
      if (!text || typeof text !== 'string') {
        return { module: null, confidence: 0, matchedKeywords: [] };
      }

      var lower = text.toLowerCase();
      var bestModule = null;
      var bestScore = 0;
      var bestMatches = [];

      var modules = window.Modules;
      var modulesArr = [modules.communication, modules.emotion, modules.care, modules.work];

      modulesArr.forEach(function (mod) {
        var score = 0;
        var matches = [];

        mod.keywords.forEach(function (keyword) {
          if (lower.indexOf(keyword.toLowerCase()) !== -1) {
            score += 1;
            matches.push(keyword);
          }
        });

        // 加权：如果有 MODULE_TAGS 中的标签命中，加权重
        var C = window.Constants;
        var tags = C.MODULE_TAGS[mod.key];
        if (tags) {
          tags.forEach(function (tag) {
            if (lower.indexOf(tag.toLowerCase()) !== -1) {
              score += 0.5;
              matches.push(tag);
            }
          });
        }

        // 得分更高 → 胜出
        // 得分相同 → 匹配关键词（去重后）更多者胜出
        // 得分相同且去重数相同 → 非 emotion 模块优先（避免"开心"抢走工作/沟通类内容）
        if (score > bestScore ||
            (score === bestScore && score > 0 && (
              uniqueCount(matches) > uniqueCount(bestMatches) ||
              (uniqueCount(matches) === uniqueCount(bestMatches) && bestModule === 'emotion' && mod.key !== 'emotion')
            ))) {
          bestScore = score;
          bestModule = mod.key;
          bestMatches = matches;
        }
      });

      // 计算置信度：命中数越多置信度越高，上限 1.0
      var confidence = Math.min(bestScore / 3, 1.0);

      return {
        module: bestModule,
        confidence: parseFloat(confidence.toFixed(2)),
        matchedKeywords: bestMatches
      };
    },

    /**
     * 批量对多条消息分类，返回模块计数器
     * @param {Array} messages - 消息数组 [{role, text}]
     * @returns {Object} { communication: count, emotion: count, care: count, work: count }
     */
    classifyBatch: function (messages) {
      var counts = { communication: 0, emotion: 0, care: 0, work: 0 };

      messages.forEach(function (msg) {
        if (msg.role === 'user') {
          var result = ChatbotClassifier.classifyMessage(msg.text);
          if (result.module) {
            counts[result.module] = (counts[result.module] || 0) + 1;
          }
        }
      });

      return counts;
    }

  };

  window.ChatbotClassifier = ChatbotClassifier;

})();
