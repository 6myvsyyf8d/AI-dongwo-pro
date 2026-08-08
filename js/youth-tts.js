/**
 * youth-tts.js — 心青年 TTS 语音朗读引擎
 * 挂载：window.YouthTTS
 *
 * 基于智谱 GLM-TTS API，AI 回复自动朗读，支持开关切换。
 * 朗读时消息气泡旁显示 🔊 动画指示。
 */
(function () {
  'use strict';

  var TTS_ENDPOINT = 'https://open.bigmodel.cn/api/paas/v4/audio/speech';

  /**
   * YouthTTS 构造
   */
  function YouthTTS() {
    this.enabled = true;       // 默认开启
    this.speaking = false;     // 当前是否正在朗读
    this.pendingQueue = [];    // 待朗读消息队列
    this.currentMsgId = null;  // 当前正在朗读的消息ID
    this.voice = 'female';     // 智谱音色：彤彤（默认女声）
    this.rate = 1.0;           // 语速 0.5~2.0
    this.volume = 1.0;         // 音量 0.1~3.0
    this._currentAudio = null; // 当前播放的 Audio 实例
  }

  /**
   * 获取 API Key（与对话使用同一配置）
   */
  YouthTTS.prototype._getApiKey = function () {
    try {
      var key = localStorage.getItem('ai_dongwo_api_key');
      if (key && key.length > 10) return key;
    } catch (e) {}
    return null;
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
   * 调用智谱 TTS API 并播放音频
   */
  YouthTTS.prototype._doSpeak = function (text, msgId) {
    var self = this;
    var apiKey = this._getApiKey();

    if (!apiKey) {
      console.warn('[YouthTTS] 未配置智谱 API Key，语音朗读不可用');
      // 跳过当前，尝试播放下一条
      self._handleSpeakEnd(msgId);
      return;
    }

    // 先取消当前播放
    if (this._currentAudio) {
      this._currentAudio.pause();
      this._currentAudio = null;
    }

    this.speaking = true;
    this.currentMsgId = msgId;
    this._showIndicator(msgId, true);

    var payload = JSON.stringify({
      model: 'glm-tts',
      input: text,
      voice: this.voice,
      speed: this.rate,
      volume: this.volume,
      response_format: 'wav'
    });

    fetch(TTS_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type': 'application/json'
      },
      body: payload
    })
    .then(function (response) {
      if (!response.ok) {
        return response.json().then(function (err) {
          throw new Error(err.error ? err.error.message || JSON.stringify(err.error) : 'HTTP ' + response.status);
        });
      }
      return response.blob();
    })
    .then(function (audioBlob) {
      if (!self.speaking || self.currentMsgId !== msgId) return; // 已被 stop/toggle 取消

      var audioUrl = URL.createObjectURL(audioBlob);
      var audio = new Audio(audioUrl);
      audio.volume = self.volume;
      self._currentAudio = audio;

      audio.addEventListener('ended', function () {
        URL.revokeObjectURL(audioUrl);
        self._currentAudio = null;
        self._handleSpeakEnd(msgId);
      });

      audio.addEventListener('error', function (e) {
        console.warn('[YouthTTS] 音频播放失败:', e);
        URL.revokeObjectURL(audioUrl);
        self._currentAudio = null;
        self._handleSpeakEnd(msgId);
      });

      audio.play().catch(function (e) {
        // 浏览器可能阻止自动播放
        console.warn('[YouthTTS] 自动播放被阻止:', e.message);
        URL.revokeObjectURL(audioUrl);
        self._currentAudio = null;
        self._handleSpeakEnd(msgId);
      });
    })
    .catch(function (err) {
      console.warn('[YouthTTS] TTS API 调用失败:', err.message || err);
      self._handleSpeakEnd(msgId);
    });
  };

  /**
   * 朗读结束后的清理和队列处理
   */
  YouthTTS.prototype._handleSpeakEnd = function (msgId) {
    this.speaking = false;
    this._showIndicator(msgId, false);
    this.currentMsgId = null;

    // 处理队列中的下一条
    if (this.pendingQueue.length > 0) {
      var next = this.pendingQueue.shift();
      this._doSpeak(next.text, next.msgId);
    }
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
      this.stop();
    }
    return this.enabled;
  };

  /**
   * 停止当前朗读并清空队列
   */
  YouthTTS.prototype.stop = function () {
    if (this._currentAudio) {
      this._currentAudio.pause();
      this._currentAudio = null;
    }
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
   * 设置音色
   * @param {string} voice - 智谱音色标识
   *   可选: female(彤彤), xiaochen(小陈), chuichui(锤锤), jam, kazi, douji, luodo
   */
  YouthTTS.prototype.setVoice = function (voice) {
    var validVoices = ['female', 'xiaochen', 'chuichui', 'jam', 'kazi', 'douji', 'luodo'];
    if (validVoices.indexOf(voice) !== -1) {
      this.voice = voice;
    }
  };

  /**
   * 销毁实例
   */
  YouthTTS.prototype.destroy = function () {
    this.stop();
  };

  // ======== 工具函数 ========

  /**
   * 过滤 emoji 和装饰符号，保留可朗读的纯文本
   */
  function _stripEmoji(text) {
    if (!text) return '';
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
