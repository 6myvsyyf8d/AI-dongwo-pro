/**
 * youth-tts.js — 心青年 TTS 语音朗读引擎
 * 挂载：window.YouthTTS
 *
 * 基于 SpeechSynthesis API，AI 回复自动朗读，支持开关切换。
 * 朗读时消息气泡旁显示 🔊 动画指示。
 */
(function () {
  'use strict';

  var synth = window.speechSynthesis;

  /**
   * YouthTTS 构造
   */
  function YouthTTS() {
    this.enabled = true;       // 默认开启
    this.speaking = false;     // 当前是否正在朗读
    this.pendingQueue = [];    // 待朗读消息队列
    this.currentMsgId = null;  // 当前正在朗读的消息ID
    this.voice = null;         // 选中的中文语音
    this.rate = 0.8;           // 语速更慢，更自然温和
    this.pitch = 1.02;         // 微提语调，不机械
    this.volume = 1.0;
    this._initVoice();
  }

  /**
   * 初始化中文语音
   */
  YouthTTS.prototype._initVoice = function () {
    var voices = synth.getVoices();
    if (voices.length === 0) {
      // voices 可能异步加载，监听 onvoiceschanged
      var self = this;
      synth.addEventListener('voiceschanged', function () {
        self._pickChineseVoice();
      });
    } else {
      this._pickChineseVoice();
    }
  };

  /**
   * 选择最佳中文语音
   */
  YouthTTS.prototype._pickChineseVoice = function () {
    var voices = synth.getVoices();
    var preferred = null;

    // 优先级 0：Apple 高品质内置语音（macOS/iOS）
    // Tingting / Ting-Ting 都是普通话女声，Li-mu 是台湾女声
    var applePatterns = ['Tingting', 'Ting-Ting', 'Ting-ting', 'Mei-Jia', 'Sin-ji', 'Li-mu'];
    for (var i = 0; i < voices.length; i++) {
      var v = voices[i];
      for (var ap = 0; ap < applePatterns.length; ap++) {
        if (v.name.indexOf(applePatterns[ap]) !== -1) {
          preferred = v;
          break;
        }
      }
      if (preferred) break;
    }

    // 优先级 1：Google 神经语音
    if (!preferred) {
      var neuralPatterns = ['Xiaoxiao', 'Yunyang', 'Xiaoyi', 'Neural', 'Premium'];
      for (var j = 0; j < voices.length; j++) {
        var v2 = voices[j];
        if (v2.lang.indexOf('zh') === 0) {
          for (var p = 0; p < neuralPatterns.length; p++) {
            if (v2.name.indexOf(neuralPatterns[p]) !== -1) {
              preferred = v2;
              break;
            }
          }
          if (preferred) break;
        }
      }
    }

    // 优先级 2：zh-CN 女性
    if (!preferred) {
      for (var k = 0; k < voices.length; k++) {
        var v3 = voices[k];
        if (v3.lang === 'zh-CN' && (v3.name.indexOf('Female') !== -1 || v3.name.indexOf('女') !== -1)) {
          preferred = v3;
          break;
        }
      }
    }

    // 优先级 3：任意 zh-CN
    if (!preferred) {
      for (var m = 0; m < voices.length; m++) {
        if (voices[m].lang.indexOf('zh-CN') === 0) {
          preferred = voices[m];
          break;
        }
      }
    }

    // 优先级 4：任意中文
    if (!preferred) {
      for (var n = 0; n < voices.length; n++) {
        if (voices[n].lang.indexOf('zh') === 0) {
          preferred = voices[n];
          break;
        }
      }
    }

    // 兜底：第一个可用语音
    if (!preferred && voices.length > 0) {
      preferred = voices[0];
    }

    this.voice = preferred;

    // 诊断日志：列出所有中文语音和最终选择
    var zhVoices = [];
    for (var di = 0; di < voices.length; di++) {
      if (voices[di].lang.indexOf('zh') === 0) {
        zhVoices.push(voices[di].name + ' (' + voices[di].lang + (voices[di].localService ? ',本地' : ',网络') + ')');
      }
    }
    console.log('[YouthTTS] 可用中文语音 (' + zhVoices.length + '):', zhVoices.join(', '));
    if (preferred) {
      console.log('[YouthTTS] 选用:', preferred.name, preferred.lang, preferred.localService ? '(本地)' : '(网络)');
    } else {
      console.warn('[YouthTTS] 未找到中文语音，将使用系统默认');
    }
  };

  /**
   * 朗读指定文本
   * @param {string} text  - 要朗读的文本
   * @param {string} msgId - 关联的消息ID（用于指示器动画）
   */
  YouthTTS.prototype.speak = function (text, msgId) {
    if (!this.enabled || !text) return;

    // 过滤 emoji 和特殊符号，只保留可朗读内容
    var cleanText = _stripEmoji(text);
    if (!cleanText) return;

    // 如果正在朗读，加入队列
    if (this.speaking) {
      this.pendingQueue.push({ text: cleanText, msgId: msgId });
      return;
    }

    this._doSpeak(cleanText, msgId);
  };

  /**
   * 执行朗读
   */
  YouthTTS.prototype._doSpeak = function (text, msgId) {
    var self = this;
    synth.cancel(); // 先取消之前的

    var utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = this.voice;
    utterance.lang = 'zh-CN';
    utterance.rate = this.rate;
    utterance.pitch = this.pitch;
    utterance.volume = this.volume;

    // 标注事件
    utterance.addEventListener('start', function () {
      self.speaking = true;
      self.currentMsgId = msgId;
      self._showIndicator(msgId, true);
    });

    utterance.addEventListener('end', function () {
      self.speaking = false;
      self._showIndicator(msgId, false);
      self.currentMsgId = null;
      // 处理队列中的下一条
      if (self.pendingQueue.length > 0) {
        var next = self.pendingQueue.shift();
        self._doSpeak(next.text, next.msgId);
      }
    });

    utterance.addEventListener('error', function (e) {
      // 忽略用户主动取消的错误
      if (e.error !== 'canceled' && e.error !== 'interrupted') {
        console.warn('[YouthTTS] 朗读错误:', e.error);
      }
      self.speaking = false;
      self._showIndicator(msgId, false);
      self.currentMsgId = null;
      if (self.pendingQueue.length > 0) {
        var next = self.pendingQueue.shift();
        self._doSpeak(next.text, next.msgId);
      }
    });

    synth.speak(utterance);
  };

  /**
   * 显示/隐藏朗读指示器
   * @param {string} msgId - 消息ID
   * @param {boolean} show - 是否显示
   */
  YouthTTS.prototype._showIndicator = function (msgId, show) {
    if (!msgId) return;
    var bubble = document.querySelector('[data-msg-id="' + msgId + '"]');
    if (!bubble) return;
    var indicator = bubble.querySelector('.youth-tts-indicator');
    if (indicator) {
      indicator.style.display = show ? 'inline-flex' : 'none';
    }
  };

  /**
   * 切换朗读开关
   * @returns {boolean} 切换后的状态
   */
  YouthTTS.prototype.toggle = function () {
    this.enabled = !this.enabled;
    if (!this.enabled) {
      synth.cancel();
      this.speaking = false;
      this.pendingQueue = [];
      this._showIndicator(this.currentMsgId, false);
      this.currentMsgId = null;
    }
    return this.enabled;
  };

  /**
   * 停止当前朗读
   */
  YouthTTS.prototype.stop = function () {
    synth.cancel();
    this.speaking = false;
    this.pendingQueue = [];
    this._showIndicator(this.currentMsgId, false);
    this.currentMsgId = null;
  };

  /**
   * 设置语速
   * @param {number} rate - 0.5~2.0
   */
  YouthTTS.prototype.setRate = function (rate) {
    this.rate = Math.max(0.5, Math.min(2.0, rate));
  };

  /**
   * 销毁实例
   */
  YouthTTS.prototype.destroy = function () {
    synth.cancel();
    this.speaking = false;
    this.pendingQueue = [];
    this.currentMsgId = null;
  };

  // ======== 工具函数 ========

  /**
   * 过滤 emoji 和装饰符号，保留可朗读的纯文本
   */
  function _stripEmoji(text) {
    if (!text) return '';
    // 移除 emoji 字符（Unicode 范围 + 变体选择符）
    var cleaned = text
      .replace(/[\u{1F600}-\u{1F64F}]/gu, '')  // 表情符号
      .replace(/[\u{1F300}-\u{1F5FF}]/gu, '')  // 杂项符号和图形
      .replace(/[\u{1F680}-\u{1F6FF}]/gu, '')  // 交通和地图
      .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, '')  // 旗帜
      .replace(/[\u{2600}-\u{26FF}]/gu, '')    // 杂项符号
      .replace(/[\u{2700}-\u{27BF}]/gu, '')    // 装饰符号
      .replace(/[\u{FE00}-\u{FE0F}]/gu, '')    // 变体选择符
      .replace(/[\u{1F900}-\u{1F9FF}]/gu, '')  // 补充符号
      .replace(/[\u{200D}]/gu, '')             // 零宽连接符
      .replace(/[\u{20E3}]/gu, '')             // 组合键帽
      .replace(/\s+/g, ' ')                    // 合并多余空格
      .trim();
    return cleaned;
  }

  // ======== 挂载全局 ========
  window.YouthTTS = YouthTTS;

})();
