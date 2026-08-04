/**
 * modules.js — 四个档案模块定义
 * 挂载：window.Modules
 * 沟通/情绪/照护/工作，每个的 key、label、icon、颜色，还有关键词分类
 */
(function () {
  'use strict';

  var C = window.Constants;

  var Modules = {
    communication: {
      key: 'communication',
      label: '沟通与表达',
      icon: '💬',
      color: '#9B85B8',
      keywords: ['沟通', '说话', '交流', '表达', '对话'],
      pageId: 'communication',
      data: C.communicationGuide
    },
    emotion: {
      key: 'emotion',
      label: '情绪与行为',
      icon: '🌊',
      color: '#D4877B',
      keywords: ['情绪', '焦虑', '生气', '难过', '行为', '触发'],
      pageId: 'emotion',
      data: C.emotionSupport
    },
    care: {
      key: 'care',
      label: '照护与医疗',
      icon: '💊',
      color: '#A8C9A0',
      keywords: ['过敏', '用药', '体检', '睡眠', '照护', '医疗'],
      pageId: 'care',
      data: C.careInfo
    },
    work: {
      key: 'work',
      label: '工作与生活',
      icon: '💼',
      color: '#D4A85A',
      keywords: ['工作', '就业', '任务', '支持', '生活'],
      pageId: 'work',
      data: C.workInfo
    }
  };

  window.Modules = Modules;

})();