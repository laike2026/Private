import { company, phone } from './content.mjs';
import { esc, socialFooter } from './site.mjs';

export const event = {
  path: '/r/ai1110',
  title: 'AI 赋能服装出海',
  session: 'AI 培训第一期 · 服装行业专场',
  date: '2026 年 11 月 10 日（周二）',
  time: '14:00–16:00',
  startsAt: '2026-11-10T14:00:00+08:00',
  closesAt: Date.parse('2026-11-10T16:00:00+08:00'),
  venue: '江西省南昌市青山湖区 · 江南云港 18 栋 1511 室',
  styles: '/assets/event-registration.css',
  qr: '/assets/event-ai1110-qr.png',
  poster: '/assets/event-ai1110-poster.jpg'
};

export function registrationPage({ state = 'open', error = '', invalid = '', values = {} } = {}) {
  const field = (key, label, hint, maxLength, attributes) => `<label class="event-field">
    <span>${label}<small class="${key === 'company' ? '' : 'event-required'}">${key === 'company' ? '选填' : '必填'}</small></span>
    <input name="${key}" maxlength="${maxLength}" value="${esc(values[key])}" placeholder="${hint}" ${attributes}${invalid === key ? ' aria-invalid="true" aria-describedby="signup-error"' : ''}>
  </label>`;

  const form = `<h2 id="signup-title">填写报名信息</h2>
    ${error ? `<p class="event-error" id="signup-error" role="alert">${esc(error)}</p>` : ''}
    <form method="post" action="${event.path}">
      ${field('company', '公司名称', '请输入公司名称', 100, 'autocomplete="organization"')}
      ${field('name', '参会人姓名', '请输入参会人姓名', 40, 'autocomplete="name" required')}
      ${field('phone', '联系电话', '请输入可联系的电话号码', 32, 'type="tel" inputmode="tel" autocomplete="tel" required')}
      <div hidden><label>请留空<input name="website" tabindex="-1" autocomplete="off"></label></div>
      <button class="event-button" type="submit">提交报名<span aria-hidden="true">↗</span></button>
      <p class="event-notice">提交即同意金品汇将您填写的信息用于本次活动的报名登记和会务联系。<a href="/privacy">隐私说明</a></p>
    </form>`;
  let signup = form;
  if (state === 'registered') signup = `<div class="event-status" role="status"><span class="event-status-icon" aria-hidden="true">✓</span>
    <h2 id="signup-title">报名已提交</h2><p>请留意会务联系，活动时间和地点见本页。</p><a href="/">访问金品汇官网</a></div>`;
  if (state === 'closed') signup = `<div class="event-status"><h2 id="signup-title">本场报名已结束</h2>
    <p>如需了解后续场次，可联系金品汇。</p><a href="tel:+86${phone}">${phone}</a></div>`;

  return `<!doctype html>
<html lang="zh-CN"><head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, follow"><meta name="theme-color" content="#fff7ef">
  <title>${event.title}活动报名｜金品汇</title>
  <link rel="stylesheet" href="${event.styles}?v=20261110-social">
  <link rel="stylesheet" href="/assets/social-qr.css?v=20261110">
  <script src="/assets/social-qr.js?v=20261110" defer></script>
</head><body class="event-body">
  <header class="event-header"><div class="event-shell event-header-inner">
    <a class="event-brand" href="/" aria-label="金品汇官网"><span class="event-brand-icon"><img src="/assets/jinpinhui-logo.webp" alt=""></span><strong>金品汇</strong></a>
    <span>活动报名</span>
  </div></header>
  <main class="event-shell event-grid">
    <section class="event-intro" aria-labelledby="event-title">
      <p class="event-session">${event.session}</p>
      <h1 id="event-title"><span>AI 赋能</span>服装出海</h1>
      <p class="event-subtitle">Accio Work 实操课</p>
      <dl class="event-facts">
        <div><dt>时间</dt><dd><time datetime="${event.startsAt}">${event.date}<br><strong>${event.time}</strong></time></dd></div>
        <div><dt>地点</dt><dd>${event.venue}</dd></div>
      </dl>
    </section>
    <section class="event-signup" aria-labelledby="signup-title">${signup}</section>
    <section class="event-agenda" aria-labelledby="agenda-title">
      <h2 id="agenda-title">两大实操主题</h2>
      <ol><li>用 AI 打造外贸提效工具</li><li>电商店铺快速发品与批量发布</li></ol>
      <p>特邀讲师 <strong>沙高峰</strong><span>FDE 工程师</span></p>
    </section>
  </main>
  <footer class="event-footer"><div class="event-shell">${socialFooter()}
    <div class="event-footer-bottom"><p>主办单位 · ${company}</p><a href="tel:+86${phone}">活动咨询 ${phone}</a></div>
  </div></footer>
</body></html>`;
}
