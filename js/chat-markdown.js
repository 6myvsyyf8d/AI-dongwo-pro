/**
 * chat-markdown.js — Markdown 渲染
 * 挂载：window.ChatMarkdown
 * 依赖：marked.js 库（CDN） + DOMPurify（CDN）做 XSS 防护
 */
(function () {
  'use strict';

  var ChatMarkdown = {

    /**
     * 渲染 markdown 文本为安全的 HTML
     * @param {string} text - markdown 文本
     * @returns {string} 安全的 HTML 字符串
     */
    render: function (text) {
      if (!text || typeof text !== 'string') return '';

      // 如果 marked 不可用，回退到简单文本展示
      if (typeof marked === 'undefined') {
        return this._fallbackRender(text);
      }

      try {
        // 配置 marked
        if (!ChatMarkdown._configured) {
          marked.setOptions({
            breaks: true,         // 换行转 <br>
            gfm: true,            // GitHub Flavored Markdown
            headerIds: false,
            mangle: false
          });
          ChatMarkdown._configured = true;
        }

        var rawHtml = marked.parse(text);

        // DOMPurify 净化
        if (typeof DOMPurify !== 'undefined') {
          return DOMPurify.sanitize(rawHtml, {
            ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'code', 'pre', 'h1', 'h2', 'h3', 'h4', 'blockquote', 'a', 'span'],
            ALLOWED_ATTR: ['href', 'target', 'class']
          });
        }

        return rawHtml;
      } catch (e) {
        console.error('Markdown渲染失败:', e);
        return this._fallbackRender(text);
      }
    },

    /**
     * 渲染为纯文本（去掉 markdown 标记）
     * @param {string} text - markdown 文本
     * @returns {string} 纯文本
     */
    stripMarkdown: function (text) {
      if (!text) return '';
      return text
        .replace(/#{1,6}\s/g, '')
        .replace(/\*\*(.+?)\*\*/g, '$1')
        .replace(/\*(.+?)\*/g, '$1')
        .replace(/`(.+?)`/g, '$1')
        .replace(/\[(.+?)\]\(.+?\)/g, '$1')
        .replace(/!\[(.+?)\]\(.+?\)/g, '$1')
        .replace(/^[-*+]\s/gm, '')
        .replace(/^\d+\.\s/gm, '')
        .replace(/>\s/g, '')
        .trim();
    },

    /**
     * 回退渲染：简单地保留换行并转义 HTML
     */
    _fallbackRender: function (text) {
      var escaped = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      return '<p>' + escaped.replace(/\n/g, '<br>') + '</p>';
    },

    _configured: false
  };

  window.ChatMarkdown = ChatMarkdown;

})();
