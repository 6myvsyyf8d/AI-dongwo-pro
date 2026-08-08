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
    this.rate = 0.85;          // 语速稍慢，更自然
    this.pitch = 1.05;         // 语调微升，更温暖
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

    // 优先级 1：高质量中文女声（Tingting/Xiaoxiao/Neural/Premium）
    var neuralPatterns = ['Tingting', 'Xiaoxiao', 'Yunyang', 'Xiaoyi', 'Neural', 'Premium'];
    for (var i = 0; i < voices.length; i++) {
      var v = voices[i];
      if (v.lang.indexOf('zh') === 0) {
        for (var p = 0; p < neuralPatterns.length; p++) {
          if (v.name.indexOf(neuralPatterns[p]) !== -1) {
            preferred = v;
            break;
          }
        }
        if (preferred) break;
      }
    }

    // 优先级 2：zh-CN 女性
    if (!preferred) {
      for (var j = 0; j < voices.length; j++) {
        var v2 = voices[j];
        if (v2.lang === 'zh-CN' && (v2.name.indexOf('Female') !== -1 || v2.name.indexOf('女') !== -1)) {
          preferred = v2;
          break;
        }
      }
    }

    // 优先级 3：任意 zh-CN
    if (!preferred) {
      for (var k = 0; k < voices.length; k++) {
        if (voices[k].lang.indexOf('zh-CN') === 0) {
          preferred = voices[k];
          break;
        }
      }
    }

    // 优先级 4：任意中文
    if (!preferred) {
      for (var m = 0; m < voices.length; m++) {
        if (voices[m].lang.indexOf('zh') === 0) {
          preferred = voices[m];
          break;
        }
      }
    }

    // 兜底：第一个可用语音
    if (!preferred && voices.length > 0) {
      preferred = voices[0];
    }
    this.voice = preferred;
  };

  /**
   * 朗读指定文本
   * @param {string} text  - 要朗读的文本
   * @param {string} msgId - 关联的消息ID（用于指示器动画）
   */
  YouthTTS.prototype.speak = function (text, msgId) {
    if (!this.enabled || !text) return;

    // 如果正在朗读，加入队列
    if (this.speaking) {
      this.pendingQueue.push({ text: text, msgId: msgId });
      return;
    }

    this._doSpeak(text, msgId);
  };

  /**
   * 执行朗读
   */
  YouthTTS.prototype._doSpeak = function (text, msgId) {
    var self = this;
    synth.cancel(); // 先取消之前的

    var utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = this.voice;
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

  // ======== 挂载全局 ========
  window.YouthTTS = YouthTTS;

})();
