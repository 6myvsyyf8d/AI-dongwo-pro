/**
 * ============================================================
 * AI懂我 - 临时支持者一分钟速读卡
 * ============================================================
 * 最小必要信息视图。六区块：认识我 / 沟通方式 / 今日安排 / 注意事项 / 安全照护 / 结束后
 * ============================================================
 */
(function () {
  'use strict';

  function renderSupporterCard() {
    var container = document.getElementById('supporter-card-content');
    if (!container) return;
    container.innerHTML = buildAccessDeniedBanner() + buildCard();
    bindEvents(container);
    // 清除拒绝标记
    try { sessionStorage.removeItem('ts_access_denied_to'); } catch (e) {}
    if (window.renderBottomNav) window.renderBottomNav();
  }

  /** 权限拒绝身份提示条 */
  function buildAccessDeniedBanner() {
    var deniedTo = '';
    try { deniedTo = sessionStorage.getItem('ts_access_denied_to') || ''; } catch (e) {}
    if (!deniedTo) return '';
    return '<div class="sc-denied-banner">'
      + '<div class="sc-denied-icon">🔒</div>'
      + '<div class="sc-denied-body">'
      + '<div class="sc-denied-title">当前身份仅限查看服务所需信息</div>'
      + '<div class="sc-denied-info">当前身份：临时支持者 · 当前心青年：小雨（演示）</div>'
      + '</div>'
      + '</div>';
  }

  function buildCard() {
    return '<div class="sc-page">'
      + buildHeader()
      + '<div class="sc-blocks">'
      + buildKnowMe()
      + buildCommunication()
      + buildToday()
      + buildAttention()
      + buildSafety()
      + buildAfter()
      + '</div>'
      + '</div>';
  }

  function buildHeader() {
    return '<div class="sc-header">'
      + '<div class="sc-header-top">'
      + '<span class="sc-title">小雨的一分钟速读卡</span>'
      + '<span class="sc-badge">临时支持者视图</span>'
      + '</div>'
      + '<div class="sc-subtitle">仅展示本次服务所需信息</div>'
      + '<div class="sc-auth-bar">'
      + '<span>👤 当前查看：小雨</span>'
      + '<span>🤲 当前身份：临时支持者</span>'
      + '<span>⏱ 演示授权：仅限本次服务</span>'
      + '</div>'
      + '</div>';
  }

  function buildKnowMe() {
    return '<div class="sc-block">'
      + '<div class="sc-block-title">1. 先认识我</div>'
      + '<div class="sc-block-body">'
      + '<p>我叫小雨，24岁。</p>'
      + '<p>我喜欢烘焙 🧁 和公交路线 🚌，也喜欢弹电子琴 🎹。</p>'
      + '<p>和我交流时请给我一些反应时间——我可能需要 8—10 秒来理解和回答。</p>'
      + '</div></div>';
  }

  function buildCommunication() {
    return '<div class="sc-block">'
      + '<div class="sc-block-title">2. 怎样和我沟通</div>'
      + '<div class="sc-block-body">'
      + '<ul class="sc-list">'
      + '<li>一次说一个步骤，不要一次说很多</li>'
      + '<li>使用简短、明确的表达</li>'
      + '<li>提问后等待 8—10 秒，给我时间</li>'
      + '<li>临时变化时，请提前说明</li>'
      + '</ul>'
      + '</div></div>';
  }

  function buildToday() {
    return '<div class="sc-block">'
      + '<div class="sc-block-title">3. 今天的安排</div>'
      + '<div class="sc-block-body">'
      + '<div class="sc-schedule">'
      + '<div class="sc-sched-item"><span class="sc-time">09:00</span><span>早餐（注意过敏：不能有海鲜）</span></div>'
      + '<div class="sc-sched-item"><span class="sc-time">10:00</span><span>机构活动 — 手工课</span></div>'
      + '<div class="sc-sched-item"><span class="sc-time">11:30</span><span>午餐</span></div>'
      + '<div class="sc-sched-item"><span class="sc-time">12:30</span><span>午休 — 保持环境安静</span></div>'
      + '<div class="sc-sched-item"><span class="sc-time">13:30</span><span>下午活动 — 烘焙练习</span></div>'
      + '</div>'
      + '</div></div>';
  }

  function buildAttention() {
    return '<div class="sc-block sc-block-warn">'
      + '<div class="sc-block-title">4. 今天需要注意</div>'
      + '<div class="sc-block-body">'
      + '<ul class="sc-list">'
      + '<li>对临时变化较敏感——如有调整请提前说明</li>'
      + '<li>嘈杂环境可能带来压力——可选安静角落</li>'
      + '<li>发生变化时，先展示流程或日程</li>'
      + '<li>外出时避开嘈杂场所</li>'
      + '</ul>'
      + '</div></div>';
  }

  function buildSafety() {
    return '<div class="sc-block sc-block-danger">'
      + '<div class="sc-block-title">5. 安全与照护 <span style="font-size:0.75rem;font-weight:400;color:#8A8F98;">仅本次服务必要信息</span></div>'
      + '<div class="sc-block-body">'
      + '<div class="sc-safety-item"><span class="sc-safety-icon">🚨</span><div><strong>严重过敏</strong><br>虾、蟹、贝类 — 严禁接触</div></div>'
      + '<div class="sc-safety-item"><span class="sc-safety-icon">💊</span><div><strong>紧急提醒</strong><br>当前无常规用药。如出现过敏反应，立即就医并联系家属。</div></div>'
      + '<div class="sc-safety-item"><span class="sc-safety-icon">⚠️</span><div><strong>安全风险</strong><br>避免嘈杂环境·避免突然更换计划·避免强行肢体接触</div></div>'
      + '<div class="sc-safety-item"><span class="sc-safety-icon">📞</span><div><strong>紧急联系人</strong><br>妈妈 · 李老师（机构主管）</div></div>'
      + '</div></div>';
  }

  function buildAfter() {
    return '<div class="sc-block">'
      + '<div class="sc-block-title">6. 本次服务结束后</div>'
      + '<div class="sc-block-body">'
      + '<p style="margin-bottom:12px;">记录一次观察或关怀，帮助家长和老师了解今天的情况。</p>'
      + '<button class="sc-btn-action" id="sc-quick-record-btn">记录一次观察 / 关怀</button>'
      + '</div></div>';
  }

  function bindEvents(container) {
    var btn = document.getElementById('sc-quick-record-btn');
    if (btn) {
      btn.addEventListener('click', function () {
        window.location.hash = 'quick-record';
      });
    }
  }

  window.SupporterCardPage = {
    render: renderSupporterCard
  };
})();
