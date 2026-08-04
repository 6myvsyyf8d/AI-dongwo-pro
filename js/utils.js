/**
 * utils.js — 工具函数模块
 * 挂载：window.Utils
 */
(function () {
  'use strict';

  var Utils = {
    id: {
      generateUUID: function () {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
      },
      generateUserId: function () {
        return 'u_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 6);
      }
    },
    date: {
      today: function () {
        var d = new Date();
        return this.format(d);
      },
      now: function () {
        var d = new Date();
        var hours = String(d.getHours()).padStart(2, '0');
        var minutes = String(d.getMinutes()).padStart(2, '0');
        return hours + ':' + minutes;
      },
      format: function (date) {
        var d = date instanceof Date ? date : new Date(date);
        var year = d.getFullYear();
        var month = String(d.getMonth() + 1).padStart(2, '0');
        var day = String(d.getDate()).padStart(2, '0');
        return year + '-' + month + '-' + day;
      },
      display: function (dateStr) {
        var today = this.today();
        var yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        var yestStr = this.format(yesterday);
        if (dateStr === today) return '今天';
        if (dateStr === yestStr) return '昨天';
        return dateStr;
      },
      parse: function (dateStr, timeStr) {
        return new Date(dateStr + 'T' + (timeStr || '00:00'));
      },
      isRecent: function (dateStr, days) {
        var recordDate = this.parse(dateStr);
        var threshold = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        return recordDate >= threshold;
      }
    },
    dom: {
      get: function (id) {
        return document.getElementById(id);
      },
      on: function (element, event, handler) {
        element.addEventListener(event, handler);
      },
      off: function (element, event, handler) {
        element.removeEventListener(event, handler);
      },
      html: function (element, html) {
        if (element) element.innerHTML = html;
      },
      show: function (element) {
        if (element) element.style.display = '';
      },
      hide: function (element) {
        if (element) element.style.display = 'none';
      },
      toggle: function (element) {
        if (element) {
          element.style.display = element.style.display === 'none' ? '' : 'none';
        }
      },
      attr: function (element, name, value) {
        if (!element) return;
        if (value !== undefined) {
          element.setAttribute(name, value);
        } else {
          return element.getAttribute(name);
        }
      },
      css: function (element, styles) {
        if (!element || !styles) return;
        for (var key in styles) {
          element.style[key] = styles[key];
        }
      },
      create: function (tag, className) {
        var el = document.createElement(tag);
        if (className) el.className = className;
        return el;
      },
      append: function (parent, child) {
        if (parent && child) parent.appendChild(child);
      },
      delegate: function (container, selector, event, handler) {
        container.addEventListener(event, function (e) {
          var target = e.target.closest(selector);
          if (target) handler.call(target, e);
        });
      }
    },
    array: {
      groupBy: function (arr, key) {
        return arr.reduce(function (result, item) {
          var groupKey = item[key];
          (result[groupKey] = result[groupKey] || []).push(item);
          return result;
        }, {});
      },
      sumBy: function (arr, key) {
        return arr.reduce(function (sum, item) {
          return sum + (item[key] || 0);
        }, 0);
      },
      countBy: function (arr, key) {
        return arr.reduce(function (result, item) {
          var groupKey = item[key];
          result[groupKey] = (result[groupKey] || 0) + 1;
          return result;
        }, {});
      }
    },
    string: {
      truncate: function (str, maxLen) {
        return str.length > maxLen ? str.substr(0, maxLen) + '...' : str;
      },
      escapeHtml: function (str) {
        var div = document.createElement('div');
        div.appendChild(document.createTextNode(str));
        return div.innerHTML;
      }
    },
    download: function (content, filename, mimeType) {
      var blob = new Blob([content], { type: mimeType });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  // 便捷函数
  function generateUUID() { return Utils.id.generateUUID(); }
  function generateUserId() { return Utils.id.generateUserId(); }
  function getTodayString() { return Utils.date.today(); }
  function getNowTimeString() { return Utils.date.now(); }
  function formatDateDisplay(dateStr) { return Utils.date.display(dateStr); }

  /**
   * 显示轻量提示
   */
  function showToast(message) {
    var toast = document.getElementById('app-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'app-toast';
      toast.className = 'app-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toast._hideTimer);
    toast._hideTimer = setTimeout(function () {
      toast.classList.remove('show');
    }, 2500);
  }

  /**
   * 根据风险等级获取中文标签
   */
  function getRiskLabel(risk) {
    var map = { green: '安全', yellow: '注意', red: '重点' };
    return map[risk] || risk;
  }

  // 暴露到全局
  window.Utils = Utils;
  window.generateUUID = generateUUID;
  window.generateUserId = generateUserId;
  window.getTodayString = getTodayString;
  window.getNowTimeString = getNowTimeString;
  window.formatDateDisplay = formatDateDisplay;
  window.showToast = showToast;
  window.getRiskLabel = getRiskLabel;

})();