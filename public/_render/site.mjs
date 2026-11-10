import { readFile } from 'node:fs/promises';
import { company, address, phone, official, nav, services, extraServices, recruitmentRoles, contactInterests, industries, commonQuestions, platform, stats } from './content.mjs';

const icons = JSON.parse(await readFile(new URL('./outline-icons.json', import.meta.url), 'utf8'));
export const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);
const href = route => esc(route);
const num = n => String(n).padStart(2, '0');
const asset = name => '/assets/' + name;
const serviceRoute = s => '/services/' + (typeof s === 'string' ? s : s.id);
const serviceTitle = s => s.name.endsWith('服务') ? s.name : s.name + '服务';
const interestQuery = name => name ? '?interest=' + encodeURIComponent(name) : '';
const [opc, afterSales] = extraServices;
const industryRoute = i => '/industries/' + i.id;
const photography = [
  ['machinery', '精密加工设备'], ['building', '建筑材料样品'],
  ['hardware', '五金工具与零件'], ['furniture', '木工车间与家具'],
  ['ceramics', '陶瓷器物与窑炉'], ['logistics', '物流装卸与包装']
];
const photoAsset = index => asset('industry-' + photography[index][0] + '.webp');

function icon(name) {
  const shape = icons[name];
  if (!shape) throw new Error('Unknown icon: ' + name);
  return `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${shape}</svg>`;
}

function photo(index, className = '', eager = false) {
  return `<div class="photo ${className}">
    <img src="${photoAsset(index)}" alt="${photography[index][1]}" width="512" height="512" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">
  </div>`;
}

function officePhoto({ eager = false, map = '' } = {}) {
  return `<figure class="office-photo">
    <img src="${asset('nanchang-office-800.webp')}"
      srcset="${asset('nanchang-office-480.webp')} 480w, ${asset('nanchang-office-800.webp')} 800w, ${asset('nanchang-office-1280.webp')} 1280w"
      sizes="(max-width: 720px) calc(100vw - 40px), (max-width: 1350px) 44vw, 590px"
      width="800" height="432" loading="${eager ? 'eager' : 'lazy'}" decoding="async"
      alt="南昌金品汇办公室前台实景，墙面展示跨境电商（南昌）服务中心及公司名称">
    <figcaption>
      <div><strong>南昌办公室实景</strong><span>青山湖区 · 江南云港数字经济产业园</span></div>
      ${map ? officialLink(map, '在百度地图查看') : ''}
    </figcaption>
  </figure>`;
}

function iconBox(name) { return `<span class="icon-box">${icon(name)}</span>`; }
function eyebrow(value) { return `<span class="eyebrow">${esc(value)}</span>`; }
function sectionHead(label, title, description = '') {
  return `<div class="heading">${eyebrow(label)}<h2>${esc(title)}</h2>${description ? `<p>${esc(description)}</p>` : ''}</div>`;
}
function button(route, label, style = 'primary', symbol = 'arrow-up-right', suffix = '') {
  return `<a class="btn btn-${style}" href="${href(route)}${esc(suffix)}">${esc(label)}${icon(symbol)}</a>`;
}
function link(route, label, symbol = 'arrow-right') {
  return `<a class="text-link" href="${href(route)}">${esc(label)}${icon(symbol)}</a>`;
}
function consult(s, label = s?.cta || '预约出海诊断') {
  return button('/contact', label, 'primary', 'arrow-up-right', interestQuery(s?.name));
}
function officialLink(url, label) {
  return `<a class="text-link" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(label)}${icon('external-link')}</a>`;
}
function brand() {
  return `<a class="brand" href="${href('/')}" aria-label="金品汇官网首页">
    <span class="brand-icon"><img src="${asset('jinpinhui-logo.webp')}" alt=""></span>
    <span><strong>金品汇</strong><small>JINPINHUI</small></span>
  </a>`;
}
function navActive(route, target) {
  return target === '/' ? route === '/' : route === target || route.startsWith(target + '/');
}
function header(route) {
  return `<a class="skip" href="#content">跳至正文</a>
  <div class="utility"><div class="wrap">
    <span><i class="dot"></i>阿里巴巴国际站江西本地服务商</span>
    <a href="tel:+86${phone}">${icon('phone')}服务咨询 ${phone}</a>
  </div></div>
  <header class="site-header"><div class="wrap header-row">
    ${brand()}
    <nav id="site-navigation" class="main-nav" aria-label="主导航">
      ${nav.map(([target, label]) => `<a href="${href(target)}" ${navActive(route, target) ? 'aria-current="page"' : ''}>${esc(label)}</a>`).join('')}
    </nav>
    <div class="header-actions">${button('/contact', '预约出海诊断')}
      <button class="menu-toggle" type="button" aria-label="打开导航" aria-expanded="false" aria-controls="site-navigation">${icon('menu-2')}</button>
    </div>
  </div></header>`;
}
function footer() {
  const group = (title, entries) => `<div><h3>${title}</h3><div class="footer-links">${entries.map(([route, name]) => `<a href="${href(route)}">${esc(name)}</a>`).join('')}</div></div>`;
  return `<footer class="footer"><div class="wrap">
    <div class="footer-grid">
      <div>${brand()}<p>阿里巴巴国际站江西本地服务商</p>
        <a class="footer-phone num" href="tel:+86${phone}">${icon('phone')}${phone}</a>
        <p class="footer-address">${address}</p>
      </div>
      ${group('服务方案', [...services, ...extraServices].map(s => [serviceRoute(s), s.name]))}
      ${group('行业与资讯', [['/industries', '行业方案'], ['/cases', '服务实践'], ['/news', '新闻中心'], ['/blog', '出海博客']])}
      ${group('关于与帮助', [['/about', '关于金品汇'], ['/platform-guide', '平台指南'], ['/faq', '常见问题'], ['/contact', '联系我们']])}
    </div>
    ${socialFooter()}
    <div class="footer-bottom">
      <span>© ${new Date().getFullYear()} ${company}</span>
      <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer">浙ICP备2026019255号-3</a>
      <a href="${href('/privacy')}">隐私说明</a>
    </div>
  </div></footer>`;
}

export function socialFooter() {
  const accounts = [
    { platform: '微信', file: 'wechat', size: 728, action: '添加好友', hint: '使用微信扫一扫，添加好友。' },
    { platform: '小红书', file: 'xiaohongshu', size: 260, action: '关注账号', hint: '打开小红书，使用扫一扫识别二维码。' },
    { platform: '抖音', file: 'douyin', size: 760, action: '关注账号', hint: '打开抖音，使用扫一扫识别抖音码。' }
  ];
  return `<section class="social-footer" aria-labelledby="social-footer-title">
    <div class="social-footer-heading"><h2 id="social-footer-title">关注与联系</h2>
      <p class="social-account-name">跨境AI在江西</p><p>点击二维码放大，使用对应平台扫一扫。</p></div>
    <div class="social-qr-cards">${accounts.map(account => `<a class="social-qr-card"
      href="${asset('social-' + account.file + '-qr.png')}" data-qr-platform="${account.platform}"
      data-qr-hint="${account.hint}" aria-label="放大${account.platform}二维码" aria-haspopup="dialog" aria-controls="social-qr-dialog">
      <img src="${asset('social-' + account.file + '-qr.png')}" width="${account.size}" height="${account.size}"
        alt="${account.platform}账号二维码" loading="lazy" decoding="async">
      <strong>${account.platform}</strong><span>${account.action}</span>
    </a>`).join('')}</div>
  </section>
  <dialog class="social-qr-dialog" id="social-qr-dialog" aria-labelledby="social-qr-title" aria-describedby="social-qr-hint">
    <div class="social-qr-dialog-content"><div class="social-qr-dialog-header">
      <h2 id="social-qr-title">账号二维码</h2><button type="button" data-qr-close autofocus>关闭</button>
    </div>
    <img class="social-qr-full" alt="" width="320" height="320">
    <p id="social-qr-hint"></p><a class="social-qr-save" download>保存二维码</a></div>
  </dialog>`;
}
function crumbs(parts) {
  return `<nav class="crumbs" aria-label="当前位置"><a href="${href('/')}">首页</a>
    ${parts.map(([label, route]) => `${icon('chevron-right')}${route ? `<a href="${href(route)}">${esc(label)}</a>` : `<span aria-current="page">${esc(label)}</span>`}`).join('')}
  </nav>`;
}
function hero({ label, title, description = '', tagline = '', parts, art = '', actions = '', className = '' }) {
  return `<section class="page-hero ${className}"><div class="wrap">
    ${crumbs(parts)}
    <div class="hero-body ${art ? 'split' : ''}">
      <div class="hero-text">
        ${eyebrow(label)}<h1>${esc(title)}</h1>
        ${tagline ? `<p class="tagline">${esc(tagline)}</p>` : ''}
        ${description ? `<p>${esc(description)}</p>` : ''}
        ${actions ? `<div class="actions">${actions}</div>` : ''}
      </div>
      ${art ? `<div class="hero-art">${art}</div>` : ''}
    </div>
  </div></section>`;
}
function cta(title = '和南昌本地顾问聊聊您的出海计划', description = '告诉我们您的产品、团队和当前阶段，一起梳理接下来的工作。', service) {
  return `<section class="cta-band"><div class="wrap"><div><h2>${esc(title)}</h2><p>${esc(description)}</p></div><div class="actions">${consult(service)}</div></div></section>`;
}
function statsBar() {
  return `<section class="stats-bar" aria-label="金品汇服务团队"><div class="wrap stats-grid">
    <div class="stat-intro">服务江浙赣制造企业<small>从南昌出发，扎根江西产业带</small></div>
    ${stats.map(([amount, unit, label]) => `<div class="stat"><strong class="num">${amount}<span>${unit}</span></strong><small>${label}</small></div>`).join('')}
  </div></section>`;
}
function steps(items) {
  return `<div class="steps">${items.map(([name, text], i) => `<div class="step"><b class="num">${num(i + 1)}</b><h3>${esc(name)}</h3><p>${esc(text)}</p></div>`).join('')}</div>`;
}
function checklist(items) {
  return `<ul class="check-list">${items.map(item => `<li>${icon('circle-check')}<span>${esc(item)}</span></li>`).join('')}</ul>`;
}
function accordion(items, first = false) {
  return `<div class="accordion">${items.map(([q,a], i) => `<details ${first && !i ? 'open' : ''}><summary>${esc(q)}${icon('chevron-down')}</summary><p>${esc(a)}</p></details>`).join('')}</div>`;
}
function serviceTiles(items = services) {
  return `<div class="service-grid${items.length === 3 ? ' three-services' : ''}">${items.map(s => `<a class="service-tile" href="${href(serviceRoute(s))}">
    <div class="tile-top">${iconBox(s.icon)}<small>${num(services.indexOf(s) + 1)} / ${s.phase}</small></div>
    <h3>${s.name}</h3><p>${s.brief}</p><span class="tile-link">查看服务详情 ${icon('arrow-right')}</span>
  </a>`).join('')}</div>`;
}
function extraServiceLinks() {
  return `<div class="extra-service-grid">
    ${extraServices.map(s => `<a class="extra-service ${s.id}" href="${href(serviceRoute(s))}">
      ${iconBox(s.icon)}
      <div><small>${s.phase}</small><h3>${s.name}</h3><p>${s.brief}</p></div>
      ${icon('arrow-up-right')}
    </a>`).join('')}
  </div>`;
}
function industryTiles(items = industries) {
  return `<div class="industry-grid">${items.map(item => `<a class="industry-tile" href="${href(industryRoute(item))}">
    ${photo(item.photo)}
    <div class="industry-tile-info">${icon(item.icon)}<div><h3>${item.name}</h3><p>${item.phrase}</p></div>${icon('arrow-up-right')}</div>
  </a>`).join('')}</div>`;
}
function articleList(items) {
  return `<div class="simple-list">${items.map(a => `<a href="${href(a.route)}"><time datetime="${esc(a.date)}">${esc(a.date)}</time><span>${esc(a.title)}</span>${icon('arrow-up-right')}</a>`).join('')}</div>`;
}
const method = [
  ['了解现状', '梳理产品、团队和现有渠道。'], ['制定路径', '明确重点市场和阶段目标。'],
  ['共同执行', '由顾问、运营和企业团队协同推进。'], ['复盘优化', '根据数据和询盘反馈调整下一步。']
];

function home({ news, blogs }) {
  const lead = news[0];
  return `<section class="home-hero">
    <img class="hero-image" src="${asset('jinpinhui-workshop-1536.webp')}"
      srcset="${asset('jinpinhui-workshop-800.webp')} 800w, ${asset('jinpinhui-workshop-1536.webp')} 1536w"
      sizes="100vw" width="1536" height="1024" alt="制造车间与出口包装" fetchpriority="high" decoding="async">
    <div class="wrap">
      <div class="home-copy">
        ${eyebrow('阿里巴巴国际站江西本地服务商')}
        <h1>让江西制造<br><span>走向全球市场</span></h1>
        <p>为江西制造企业提供国际站入驻、运营与售后支持，也陪伴 OPC 个人创业者起步做外贸。</p>
        <div class="actions">${consult()}${button(serviceRoute(opc), '了解 OPC 个人创业', 'ghost', 'arrow-right')}</div>
      </div>
      <div class="hero-location">${icon('map-pin')}<span>江西 · 南昌</span></div>
    </div>
  </section>
  ${statsBar()}
  <section class="section"><div class="wrap">
    <div class="heading-row">${sectionHead('服务方案', '从开店到履约，每一步都有支持', '按企业当前阶段选择服务。顾问先了解产品、人员和目标，再共同安排下一步。')}${link('/services','查看全部服务')}</div>
    ${serviceTiles()}
    ${extraServiceLinks()}
  </div></section>
  <section class="section dark"><div class="wrap">${sectionHead('服务流程', '从诊断开始，把工作落到实处')}${steps(method)}</div></section>
  <section class="section pale"><div class="wrap">
    <div class="heading-row">${sectionHead('行业方案', '按采购场景，组织出海内容', '从设备参数、材质工艺到定制与交付，先回答海外采购商最关心的问题。')}${link('/industries','查看行业方案')}</div>
    ${industryTiles()}
  </div></section>
  <section class="section"><div class="wrap">
    ${sectionHead('新闻与博客', '了解金品汇与外贸实务')}
    <div class="editorial-home">
      ${lead ? `<a class="lead-news" href="${href(lead.route)}">
        <span class="eyebrow">公司新闻</span><h3>${esc(lead.title)}</h3><p>${esc(lead.summary)}</p><span class="text-link">阅读新闻 ${icon('arrow-right')}</span>
      </a>` : `<a class="lead-news" href="/news">
        <span class="eyebrow">公司新闻</span><h3>金品汇服务动态</h3><p>了解江西本地服务和跨境电商动态。</p><span class="text-link">查看新闻中心 ${icon('arrow-right')}</span>
      </a>`}
      <div><div class="list-header"><h3>出海博客</h3>${link('/blog','查看全部')}</div>${articleList(blogs.slice(0, 3))}</div>
    </div>
  </div></section>
  <section class="compact steel"><div class="wrap split"><div>${sectionHead('平台与本地支持', '了解国际站，确定服务重点')}</div>
    <div><p>查看数字店铺、推广、交易保障等平台能力，以及金品汇可提供的本地支持。</p><div class="actions">${link('/platform-guide','查看平台指南')}${link('/faq','阅读常见问题')}</div></div>
  </div></section>
  ${cta()}`;
}

function overviewArt() {
  return `<div class="overview-art">
    <div class="art-top"><span>跨境经营四个阶段</span>${icon('route')}</div>
    <div class="overview-flow">${services.map(s => `<span>${icon(s.icon)}<strong>${s.phase}</strong><small>${s.name}</small></span>`).join('')}</div>
    <p>产品、运营、人员与交付协同推进</p>
  </div>`;
}
function servicesPage() {
  return `${hero({
    label: '金品汇本地服务', title: '跨境电商服务方案', tagline: '企业经营、个人创业与客户售后',
    description: '从建店、运营到团队与交付，为江西制造企业安排经营服务，也为 OPC 个人创业提供起步支持，并为已合作客户提供产品培训及招聘支持。',
    parts: [['服务方案']], art: overviewArt(), actions: consult() + `<a class="btn btn-light" href="#service-selection">按阶段选服务${icon('arrow-down')}</a>`
  })}
  <section class="compact steel"><div class="wrap">
    ${sectionHead('服务入口', '个人创业与客户售后')}
    ${extraServiceLinks()}
  </div></section>
  <section class="section" id="service-selection"><div class="wrap">
    ${sectionHead('选择服务', '您现在处在哪个阶段？', '查看各阶段的主要工作和适用企业。')}
    <div class="phase-switch" role="tablist" aria-label="服务阶段">
      ${services.map((s, i) => `<button type="button" role="tab" id="tab-${s.id}" aria-selected="${!i}" aria-controls="phase-${s.id}" tabindex="${i ? -1 : 0}">${icon(s.icon)}${s.name}</button>`).join('')}
    </div>
    ${services.map((s, i) => `<div class="phase-panel" role="tabpanel" id="phase-${s.id}" aria-labelledby="tab-${s.id}" ${i ? 'hidden' : ''}>
      <div><h3>${s.audience[0]}</h3><p>${s.intro}</p></div>
      <div class="actions">${button(serviceRoute(s), '查看' + s.name + '详情', 'light', 'arrow-right')}</div>
    </div>`).join('')}
  </div></section>
  <section class="section pale"><div class="wrap">${sectionHead('四项服务', '围绕企业实际经营安排工作')}${serviceTiles()}</div></section>
  <section class="section"><div class="wrap">${sectionHead('合作方式', '从第一次沟通到阶段复盘')}${steps(method)}</div></section>
  ${cta()}`;
}
function serviceArt(s) {
  const names = { platform: '店铺启动路径', growth: '运营工作的三项重点', talent: '岗位协作关系', supply: '交易交付对接', opc: '一个人的外贸起步路径', 'after-sales': '培训与招聘支持' };
  const detail = { platform: '产品资料与店铺上线', growth: '用询盘反馈安排下一轮调整', talent: '明确交接事项与责任人', supply: '从报价沟通到交付准备', opc: '安排产品展示、询盘跟进和交付', 'after-sales': '产品学习与岗位交接' };
  let diagram = s.diagram.map(([symbol, label], i) => `${i ? icon('arrow-right') : ''}<div class="diagram-node">${icon(symbol)}<span>${label}</span></div>`).join('');
  if (s.id === 'growth') {
    const actions = ['整理经营基础', '检查曝光与反馈', '建立客户记录'];
    diagram = s.diagram.map(([symbol, label], i) => `<div class="report-row"><b class="num">${num(i + 1)}</b>${icon(symbol)}<strong>${label}</strong><small>${actions[i]}</small></div>`).join('');
  }
  if (s.id === 'talent' || s.id === 'after-sales') {
    diagram = s.diagram.map(([symbol, label]) => `<div class="diagram-node">${icon(symbol)}<span>${label}</span></div>`).join('');
  }
  if (s.id === 'opc') {
    diagram = s.diagram.map(([symbol, label], i) => `<div class="opc-step"><b class="num">${num(i + 1)}</b>${icon(symbol)}<strong>${label}</strong></div>`).join('');
  }
  return `<div class="service-art ${s.id}" aria-label="${names[s.id]}">
    ${s.id === 'supply' ? photo(5, '', true) : ''}
    <div class="art-label"><span>${names[s.id]}</span>${icon(s.icon)}</div>
    <div class="diagram">${diagram}</div>
    <div class="art-bottom"><i class="dot"></i>${detail[s.id]}</div>
  </div>`;
}
function recruitmentSection() {
  return `<section class="section steel" id="recruitment"><div class="wrap">
    ${sectionHead('招聘支持', '外贸业务员和运营，分别按岗位匹配', '先明确团队缺的是客户跟进能力还是店铺运营能力，再梳理职责、能力要求和面试安排。')}
    <div class="recruitment-grid">
      ${recruitmentRoles.map(role => `<article class="recruitment-card">
        ${iconBox(role.icon)}<h3>${role.name}</h3><p>${role.responsibility}</p><p class="fine">${role.focus}</p>
        ${button('/contact', '咨询' + role.interest, 'light', 'arrow-up-right', interestQuery(role.interest))}
      </article>`).join('')}
    </div>
  </div></section>`;
}
function servicePage(s) {
  const index = services.indexOf(s);
  const isAfterSales = s === afterSales;
  return `${hero({
    label: index >= 0 ? `服务方案 / ${num(index + 1)}` : s.phase, title: serviceTitle(s),
    tagline: s.headline.join(''), description: s.intro,
    parts: [['服务方案', '/services'], [s.name]],
    className: s === opc ? 'opc-hero' : '',
    art: serviceArt(s), actions: consult(s) + `<a class="btn btn-light" href="#deliverables">看交付清单${icon('arrow-down')}</a>`
  })}
  <nav class="subnav" aria-label="服务内容导航"><div class="wrap">
    <a href="#scope" aria-current="location">${isAfterSales ? '服务内容' : '适用对象与服务内容'}</a>${isAfterSales ? '<a href="#recruitment">招聘岗位</a>' : ''}<a href="#workflow">合作流程</a><a href="#deliverables">交付清单</a><a href="#service-questions">常见问题</a>
  </div></nav>
  <section class="section" id="scope"><div class="wrap service-work">
    <aside class="audience-box">${eyebrow('适用对象')}<h2>${s === opc ? '哪些创业者适合这项服务？' : '哪些企业适合这项服务？'}</h2>${checklist(s.audience)}</aside>
    <div>${sectionHead('服务内容', '我们具体做什么')}
      <div class="jobs">${s.jobs.map(([symbol, label, copy]) => `<div class="job">${iconBox(symbol)}<div><h3>${label}</h3><p>${copy}</p></div></div>`).join('')}</div>
    </div>
  </div></section>
  ${isAfterSales ? recruitmentSection() : ''}
  ${s.id === 'talent' ? `<section class="compact steel"><div class="wrap">
    <div class="heading-row">${sectionHead('售后服务', '合作后仍可获得培训和招聘支持', '除了常态化产品培训，金品汇也可协助招聘外贸业务员和运营人员。')}${link(serviceRoute(afterSales), '查看售后服务')}</div>
  </div></section>` : ''}
  <section class="section dark" id="workflow"><div class="wrap">${sectionHead('合作流程', '四步明确工作顺序')}${steps(s.steps)}</div></section>
  <section class="section pale" id="deliverables"><div class="wrap split">
    <div class="deliverable-box">${eyebrow('阶段交付')}<h2>服务交付清单</h2>${checklist(s.deliver)}<p class="fine">具体交付范围按实际需求和双方服务约定确定。</p></div>
    <div class="prep-box"><h3>第一次沟通可以准备什么？</h3><p>${s.prep}</p>${consult(s, s.cta || '咨询' + s.name)}</div>
  </div></section>
  <section class="section" id="service-questions"><div class="wrap">${sectionHead('服务答疑', s.name + '常见问题')}${accordion(s.questions, true)}</div></section>
  <section class="compact pale"><div class="wrap">
    <div class="heading-row">${sectionHead('相关服务', '根据经营阶段继续查看')}${link('/services','全部服务')}</div>
    ${serviceTiles(services.filter(x => x !== s))}
  </div></section>
  ${cta('聊聊您的' + s.name + '需求', '由南昌顾问了解现状，和您一起确定优先事项。', s)}`;
}

function industriesPage() {
  return `${hero({ label: '江西产业带', title: '行业解决方案', tagline: '从采购视角组织产品信息',
    description: '机械、建材、五金、家具和陶瓷的采购关注点不同。按品类整理规格、用途与交付条件，再决定店铺和运营的重点。',
    parts: [['行业方案']], art: photo(0, 'intro-art', true), actions: consult()
  })}
  <section class="section"><div class="wrap">${sectionHead('五类行业', '找到与您的产品相符的出海方案')}${industryTiles()}</div></section>
  <section class="section dark"><div class="wrap">${sectionHead('行业服务方法', '将产品优势落实到采购商关心的信息')}${steps([
    ['产品分类', '按用途、规格和市场需求整理产品。'], ['内容准备', '梳理参数、图片、工艺和交付信息。'],
    ['询盘响应', '明确买家常见问题、报价与跟进分工。'], ['阶段复盘', '根据询盘和交付反馈调整工作。']
  ])}</div></section>${cta()}`;
}
function industryPage(i) {
  return `${hero({
    label: `行业方案 / ${num(industries.indexOf(i) + 1)}`, title: i.name + '出海方案',
    tagline: i.phrase, description: i.intro, parts: [['行业方案', '/industries'], [i.name]],
    art: photo(i.photo, 'intro-art', true), actions: consult() + `<a class="btn btn-light" href="#materials">查看资料清单${icon('arrow-down')}</a>`
  })}
  <section class="section"><div class="wrap">
    ${sectionHead('采购重点', i.name + '采购商通常会先确认什么？')}
    <div class="grid-three">${i.points.map(([label, copy], idx) => `<div class="point"><b class="num">${num(idx + 1)}</b><h3>${label}</h3><p>${copy}</p></div>`).join('')}</div>
  </div></section>
  <section class="section pale" id="materials"><div class="wrap split"><div>${sectionHead('资料准备', '从现有产品资料着手', '先把采购商需要比较和确认的信息整理清楚，再用于店铺展示、询盘和报价。')}${link('/services/platform','查看入驻和店铺准备')}</div>
    <div class="deliverable-box">${iconBox(i.icon)}<h2>${i.name}资料清单</h2>${checklist(i.checklist)}</div>
  </div></section>
  <section class="section"><div class="wrap">${sectionHead('可配合的服务', '从展示到运营和交付')}${serviceTiles()}</div></section>${cta()}`;
}

function casesPage() {
  const practices = [
    [0, '首次开展跨境业务', '让首批产品具备上线条件', '先梳理主推产品、规格与目标市场，再安排店铺栏目、产品资料和询盘响应人员。', services[0]],
    [2, '已有店铺，需要改善运营', '找到影响询盘质量的环节', '结合产品内容、关键词和推广节奏定位问题，逐步完善报价、客户跟进和复盘记录。', services[1]],
    [5, '准备推进交易与交付', '在报价阶段理清交付事项', '梳理货物、包装、交期、目的地与所需资料，明确各环节的服务对接和责任人。', services[3]],
    [4, 'OPC 个人创业', '一个人也能执行的起步计划', '从熟悉的产品和已有供应资源出发，把展示、报价、跟进和交付安排到每周工作里。', opc],
    [3, '已合作企业', '培训新人，补齐关键岗位', '按团队需要安排产品培训，协助招聘外贸业务员或运营人员，并列清入岗要交接的事项。', afterSales]
  ];
  return `${hero({
    label: '本地协同', title: '服务实践', tagline: '从企业现状出发，把工作落到实处',
    description: '以产品、店铺、询盘和交付为线索，明确不同阶段的服务重点。',
    parts: [['服务实践']], art: photo(5, 'intro-art', true), actions: consult()
  })}
  <section class="section"><div class="wrap">
    ${sectionHead('经营场景', '不同阶段，服务侧重点不同')}
    <div class="case-grid">${practices.map(([index, label, title, copy, service]) => `<article class="case">
      ${photo(index)}<div class="case-content">${eyebrow(label)}<h3>${title}</h3><p>${copy}</p>${link(serviceRoute(service), '查看' + service.name)}</div>
    </article>`).join('')}</div>
  </div></section>
  <section class="compact steel"><div class="wrap">${sectionHead('行业方案', '结合您的产品，细化服务动作')}${industryTiles()}</div></section>${cta()}`;
}

function platformGuide() {
  const sources = [
    [official, '国际站中文官网', '查看平台产品与数字外贸服务', 'world'],
    ['https://peixun.alibaba.com/', '外贸云课堂', '学习平台经营与外贸课程', 'book-2'],
    ['https://supplier.alibaba.com/us/wenti_1.htm', '官方常见问题', '查询外贸基础知识与说明', 'message-circle'],
    ['https://rulechannel.alibaba.com/', '平台规则', '查询经营与合规要求', 'shield-check']
  ];
  return `${hero({
    label: '国际站与本地服务', title: '阿里巴巴国际站平台指南',
    description: '了解从数字店铺、推广到交易履约的平台能力，并找到与之配合的江西本地服务。',
    parts: [['平台指南']], art: overviewArt(), actions: officialLink(official, '查看国际站官网')
  })}
  <section class="section"><div class="wrap">
    ${sectionHead('平台能力与服务分工', '了解国际站工具，再定本地行动')}
    <div class="platform-table">
      <div class="platform-row"><strong>平台能力</strong><strong>国际站提供</strong><strong>金品汇本地支持</strong></div>
      ${platform.map(([symbol, title, what, local, service]) => `<div class="platform-row">
        <h3>${icon(symbol)}${title}</h3><p>${what}</p><div><p>${local}</p>${link(serviceRoute(service), '查看对应服务')}</div>
      </div>`).join('')}
    </div>
    <p class="fine">平台功能、开通条件及费用以国际站官方规则为准。</p>
  </div></section>
  <section class="section pale"><div class="wrap">${sectionHead('官方资源', '查规则、学课程，从官方入口开始')}
    <div class="resource-grid">${sources.map(([url, title, copy, symbol]) => `<a href="${url}" target="_blank" rel="noopener noreferrer">${icon(symbol)}<strong>${title} ↗</strong><span>${copy}</span></a>`).join('')}</div>
  </div></section>${cta()}`;
}

function faqPage() {
  const groups = [...new Set(commonQuestions.map(x => x[0]))];
  return `${hero({ label: '帮助与咨询', title: '常见问题', description: '有关开店、运营、交易配套、OPC 个人创业和售后支持的常见问题。', parts: [['常见问题']], className: 'short' })}
  <section class="section"><div class="wrap faq-layout">
    <aside class="faq-side">${iconBox('message-circle')}<h3>按问题类型查看</h3>
      ${groups.map((label, idx) => `<a class="text-link" href="#faq-${idx}">${label} ${icon('arrow-right')}</a>`).join('')}
      <p>涉及平台准入、费用和交易规则，请查看国际站官方说明。</p>${link('/platform-guide','查看平台指南')}
    </aside>
    <div>${groups.map((label, idx) => `<section class="faq-group" id="faq-${idx}"><h2>${label}</h2>${accordion(commonQuestions.filter(x => x[0] === label).map(x => x.slice(1)), idx === 0)}</section>`).join('')}</div>
  </div></section>${cta('还有与您企业相关的问题？')}`;
}

function articlePhoto(article, eager = false) {
  if (!article.cover) return photo(article.photo, '', eager);
  return `<div class="photo"><img src="${esc(article.cover)}" alt="${esc(article.title)}"
    ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async" referrerpolicy="no-referrer"></div>`;
}
function articleCover(article, eager = false) {
  return `<div class="cover-wrap">${articlePhoto(article, eager)}
    <span class="chip">${icon(article.icon)}${esc(article.topic)}</span>
  </div>`;
}
function articleTile(a) {
  return `<a class="article-tile" href="${href(a.route)}">
    ${articleCover(a)}
    <div class="article-tile-copy">
      <time class="fine" datetime="${esc(a.date)}">${esc(a.date)}</time>
      <h3>${esc(a.title)}</h3><p>${esc(a.summary)}</p>
      <span class="text-link">阅读全文 ${icon('arrow-right')}</span>
    </div>
  </a>`;
}
function articleSearch(route, text, topic = '') {
  return `<form class="article-search-form" method="get" action="${href(route)}" role="search">
    ${topic ? `<input type="hidden" name="topic" value="${esc(topic)}">` : ''}
    <label class="search-field">${icon('search')}<span class="sr-only">搜索文章</span>
      <input type="search" name="q" value="${esc(text)}" maxlength="140" placeholder="搜索文章关键词">
    </label>
    <button class="btn btn-light" type="submit">搜索</button>
  </form>`;
}
function matchArticles(items, text) {
  const query = text.toLowerCase();
  return query ? items.filter(item => `${item.title} ${item.summary}`.toLowerCase().includes(query)) : items;
}
function emptyArticles() {
  return '<p class="article-empty">未找到相关文章，请尝试其他关键词。</p>';
}
function newsPage({ news, query }) {
  const text = (query.get('q') || '').trim().slice(0, 140);
  const [featured, ...rest] = matchArticles(news, text);
  return `${hero({
    label: '金品汇资讯', title: '新闻中心', description: '金品汇的服务进展、公司动态与江西跨境电商观察。',
    parts: [['新闻中心']], className: 'short'
  })}
  <section class="section"><div class="wrap">
    ${sectionHead('公司动态', '关注金品汇的本地服务进展')}
    <div class="blog-toolbar">${articleSearch('/news', text)}</div>
    ${featured ? `<article class="news-lead">${articlePhoto(featured, true)}
      <div class="news-lead-copy">
        <span class="chip">${icon('news')}公司新闻</span><time class="fine" datetime="${esc(featured.date)}">${esc(featured.date)}</time>
        <h2>${esc(featured.title)}</h2><p>${esc(featured.summary)}</p>
        ${link(featured.route, '阅读新闻')}
      </div>
    </article>` : emptyArticles()}
  </div></section>
  ${rest.length ? `<section class="compact pale"><div class="wrap">${sectionHead('新闻列表','更多公司新闻')}${articleList(rest)}</div></section>` : ''}
  ${cta()}`;
}
function blogPage({ blogs, query }) {
  const topics = [...new Set(blogs.map(a => a.topic))];
  const text = (query.get('q') || '').trim().slice(0, 140);
  const selected = topics.includes(query.get('topic')) ? query.get('topic') : '';
  const visible = matchArticles(selected ? blogs.filter(a => a.topic === selected) : blogs, text);
  return `${hero({
    label: '跨境经营知识', title: '出海博客', description: '围绕市场调研、国际站运营、询盘与交易，以及外贸团队建设，整理企业实务文章。',
    parts: [['出海博客']], className: 'short'
  })}
  <section class="section"><div class="wrap">
    ${sectionHead('实务文章', '按经营问题找文章')}
    <div class="blog-toolbar">
      <nav class="filter-group" aria-label="文章主题">
        ${['', ...topics].map(topic => {
          const params = new URLSearchParams();
          if (topic) params.set('topic', topic);
          if (text) params.set('q', text);
          const target = params.size ? '/blog?' + params : '/blog';
          return `<a href="${href(target)}"${topic === selected ? ' aria-current="true"' : ''}>${esc(topic || '全部')}</a>`;
        }).join('')}
      </nav>
      ${articleSearch('/blog', text, selected)}
    </div>
    ${visible.length ? `<div class="article-grid">${visible.map(articleTile).join('')}</div>` : emptyArticles()}
  </div></section>${cta()}`;
}

function contents(headings, label) {
  const entries = headings.length ? headings : [{ id: 'body-copy', text: '文章正文' }];
  return `<aside class="toc" aria-label="页内目录"><strong>${esc(label)}</strong>
    <nav class="toc-nav" aria-label="正文目录">${entries.map(x => `<a href="#${esc(x.id)}">${esc(x.text)}</a>`).join('')}</nav>
  </aside>`;
}
function articleBody(post, sanitize) {
  const body = String(post.body ?? '');
  if (post.format !== 'html') {
    return { html: body.split(/\n+/).filter(Boolean).map(p => `<p>${esc(p)}</p>`).join(''), headings: [] };
  }
  const headings = [];
  const entity = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&nbsp;': ' ' };
  const html = sanitize(body)
    .replace(/<(h[2-5])>([\s\S]*?)<\/\1>/g, (original, tag, inner) => {
      const text = inner.replace(/<[^>]*>/g, '').replace(/&(?:amp|lt|gt|quot|#39|nbsp);/g, code => entity[code]).trim();
      if (!text) return original;
      const id = 'article-section-' + (headings.length + 1);
      headings.push({ id, text });
      return `<${tag} id="${id}">${inner}</${tag}>`;
    })
    .replaceAll('<table>', '<div class="table-wrap"><table>')
    .replaceAll('</table>', '</table></div>');
  return { html, headings };
}
function articlePage(a, peers, sanitize) {
  const category = a.type === 'news' ? ['新闻中心', '/news'] : ['出海博客', '/blog'];
  const body = articleBody(a, sanitize);
  const related = [...peers.filter(x => x.topic === a.topic), ...peers.filter(x => x.topic !== a.topic)].filter(x => x !== a).slice(0, 3);
  return `<article>
    <section class="page-hero article-head"><div class="wrap">
      ${crumbs([[category[0], category[1]], ['文章详情']])}
      <div class="hero-body split">
        <div class="hero-text article-heading">
          ${eyebrow(a.topic)}<h1>${esc(a.title)}</h1>
          <p>${esc(a.summary)}</p>
          <div class="art-meta"><time datetime="${esc(a.date)}">${esc(a.date)}</time><span>${esc(a.author)}</span></div>
        </div>
        ${articleCover(a, true)}
      </div>
    </div></section>
    <section class="section"><div class="wrap read-layout">
      <div class="prose" id="body-copy">${body.html}<div class="article-footer">${link(category[1], '返回' + category[0], 'chevron-left')}</div></div>
      ${contents(body.headings, '本文目录')}
    </div></section>
  </article>
  ${related.length ? `<section class="compact pale"><div class="wrap">
    <div class="heading-row">${sectionHead('相关内容','继续阅读')}${link(category[1], '查看' + category[0])}</div>${articleList(related)}
  </div></section>` : ''}
  ${cta('和顾问聊聊您的实际需求')}`;
}
function aboutPage() {
  return `${hero({
    label: '关于金品汇', title: '扎根赣鄱大地，服务江西制造',
    description: company + '是阿里巴巴国际站江西本地服务商，办公室位于南昌市青山湖区。',
    parts: [['关于金品汇']], actions: button('/contact', '联系南昌团队', 'primary'),
    art: officePhoto({ eager: true })
  })}
  ${statsBar()}
  <section class="section"><div class="wrap split">
    ${photo(0, 'intro-art')}
    <div>${sectionHead('本地团队', '从平台经验出发，贴近企业现场', '核心创始团队来自阿里巴巴国际站一线体系，围绕入驻、运营、人才和交易配套，为制造企业提供本地服务。')}
      ${link('/services','查看四项核心服务')}
    </div>
  </div></section>
  <section class="section pale"><div class="wrap">
    ${sectionHead('发展方向', '持续完善制造企业出海服务')}
    <div class="grid-three">
      <div class="point">${iconBox('world')}<h3>平台多元化</h3><p>在国际站服务基础上，逐步探索独立站和新兴渠道。</p></div>
      <div class="point">${iconBox('chart-line')}<h3>数字化升级</h3><p>通过经营数据分析、运营流程优化和客户管理，提高选品、推广与跟进效率。</p></div>
      <div class="point">${iconBox('briefcase')}<h3>全球化服务</h3><p>持续积累海外市场经验，帮助企业建立品牌形象。</p></div>
    </div>
  </div></section>
  <section class="section"><div class="wrap values">${eyebrow('公司愿景')}<h2>成为中国制造出海的首选服务商</h2><p>公司使命 · 让更多中小企业轻松做全球生意</p></div></section>${cta()}`;
}
function contactPage({ query }) {
  const map = 'https://map.baidu.com/search/' + encodeURIComponent(address);
  const interest = query.get('interest');
  const sent = query.get('sent');
  return `${hero({
    label: '南昌本地顾问', title: '联系我们', description: '无论是企业出海、个人创业，还是售后培训和招聘，欢迎告诉我们您当前的需求。',
    parts: [['联系我们']], className: 'short'
  })}
  <section class="section"><div class="wrap contact-grid">
    <div>
      ${sectionHead('办公与咨询', '在南昌，面对面谈出海')}
      <div class="contact-facts">
        <div class="contact-fact">${iconBox('phone')}<div><small>联系电话</small><strong><a class="num" href="tel:+86${phone}">${phone}</a></strong></div></div>
        <div class="contact-fact">${iconBox('map-pin')}<div><small>办公室地址</small><strong>${address}</strong>
          <button class="copy-address" type="button" data-copy="${esc(address)}" aria-live="polite">复制地址</button>
        </div></div>
        <div class="contact-fact">${iconBox('building-factory-2')}<div><small>服务区域</small><strong>以江西市场为重点，服务江浙赣制造企业</strong></div></div>
      </div>
      ${officePhoto({ map })}
    </div>
    <div class="contact-form">
      ${eyebrow('预约出海诊断')}<h2>说说您的需求</h2><p class="fine">带 * 的项目为必填。信息仅用于本次沟通。</p>
      ${sent === 'success' ? '<p class="form-status success" role="status">已收到您的咨询。请留意后续联系。</p>' : ''}
      ${sent === 'error' ? '<p class="form-status" role="alert">请检查必填信息后重试。</p>' : ''}
      <form method="post" action="/contact">
        <label class="field">您的称呼 *<input name="name" autocomplete="name" maxlength="60" required placeholder="怎么称呼您"></label>
        <label class="field">联系电话 *<input name="phone" type="tel" autocomplete="tel" maxlength="40" required placeholder="方便联系的手机号或电话"></label>
        <label class="field">企业名称<input name="company" autocomplete="organization" maxlength="100" placeholder="您的企业名称"></label>
        <label class="field">您目前最关注的问题<select name="interest"><option value="">请选择</option>${contactInterests.map(item => `<option value="${esc(item)}"${item === interest ? ' selected' : ''}>${esc(item)}</option>`).join('')}</select></label>
        <label class="field form-wide">需求简述<textarea name="message" rows="4" maxlength="1000" placeholder="例如：所在行业、目前是否已开店、希望解决的问题"></textarea></label>
        <label class="honeypot" aria-hidden="true">网站<input name="website" tabindex="-1" autocomplete="off"></label>
        <label class="consent form-wide"><input type="checkbox" name="consent" value="yes" required><span>我已阅读并同意<a href="${href('/privacy')}">隐私说明</a>，同意金品汇为本次咨询联系我。</span></label>
        <button class="btn btn-primary form-wide" type="submit">提交咨询${icon('arrow-up-right')}</button>
      </form>
    </div>
  </div></section>`;
}
function privacyPage() {
  const sections = [
    { id: 'collection', text: '信息收集', body: '提交咨询表单时，我们会收集您填写的称呼、联系电话、企业名称、关注的问题和需求描述。报名活动时，我们会收集参会人姓名、联系电话及您自愿填写的公司名称。' },
    { id: 'use', text: '使用目的', body: '咨询信息用于回应咨询、了解企业需求和安排后续沟通。报名信息仅用于对应活动的报名登记与会务联系。请勿在表单中填写身份证号、银行卡号等敏感信息。' },
    { id: 'retention', text: '保存与管理', body: '咨询及报名信息保存在网站服务器中，由获授权的管理人员查看。您可通过网站联系页面提出查询或删除请求。' },
    { id: 'third-party', text: '第三方链接', body: '网站可能提供地图等第三方链接，访问时请查看对应服务的隐私规则。' }
  ];
  return `${hero({ label: '金品汇官网', title: '隐私说明', description: '我们只收集咨询联系和活动报名所需的信息。', parts: [['隐私说明']], className: 'short' })}
  <section class="section"><div class="wrap read-layout">
    <div class="prose" id="body-copy">${sections.map(section => `<h2 id="${section.id}">${section.text}</h2><p>${section.body}</p>`).join('')}
      <div class="article-footer">${link('/contact','联系金品汇')}</div></div>
    ${contents(sections, '隐私说明目录')}
  </div></section>`;
}
function notFoundPage() {
  return `<section class="not-found pale"><div class="wrap"><strong class="num">404</strong>
    <h1>页面未找到</h1><p>您可以返回首页，或继续查看我们的服务方案。</p>
    <div class="actions">${button('/', '返回首页')}${button('/services','查看服务方案','light','arrow-right')}</div>
  </div></section>`;
}

const officeImage = asset('nanchang-office-800.webp');
const workshopImage = asset('jinpinhui-workshop-1536.webp');
const staticPages = new Map([
  ['/', {
    title: '江西制造企业的跨境出海伙伴',
    description: company + '是阿里巴巴国际站江西本地服务商，为制造企业提供国际站入驻、运营、人才及供应链支持，也服务 OPC 个人创业者。',
    render: home, schema: 'organization'
  }],
  ['/services', {
    title: '服务方案', description: '了解金品汇的企业跨境电商服务、OPC 个人创业指导，以及售后产品培训和招聘支持。',
    render: servicesPage
  }],
  ...[...services, ...extraServices].map(service => [serviceRoute(service), {
    title: serviceTitle(service), description: service.intro, render: () => servicePage(service)
  }]),
  ['/platform-guide', {
    title: '阿里巴巴国际站平台能力与江西本地服务指南',
    description: '了解国际站数字店铺、推广、交易保障、支付、物流等平台能力，以及金品汇在江西提供的本地服务。',
    render: platformGuide
  }],
  ['/industries', {
    title: '行业解决方案', description: '金品汇为机械、建材、五金、家具、陶瓷等江西制造行业提供本地跨境电商服务。',
    render: industriesPage
  }],
  ...industries.map(industry => [industryRoute(industry), {
    title: industry.name + '出海方案', description: industry.intro, render: () => industryPage(industry), image: photoAsset(industry.photo)
  }]),
  ['/cases', {
    title: '服务实践', description: '从平台启动、店铺运营到团队建设，了解金品汇在不同经营阶段提供的服务。',
    render: casesPage
  }],
  ['/news', {
    title: '新闻中心', description: '金品汇的公司动态、江西本地服务进展和跨境电商观察。',
    render: newsPage
  }],
  ['/blog', {
    title: '出海博客', description: '金品汇出海博客，分享江西制造企业的外贸实务、国际站运营和团队建设。',
    render: blogPage
  }],
  ['/about', {
    title: '关于金品汇', description: company + '扎根江西南昌，为制造企业和个人创业者提供本地跨境电商服务。',
    render: aboutPage, schema: 'organization', image: officeImage
  }],
  ['/contact', {
    title: '联系我们', description: '联系南昌金品汇，咨询企业出海、OPC 创业、售后培训或招聘服务。办公室地址：' + address + '。',
    render: contactPage, image: officeImage
  }],
  ['/faq', {
    title: '江西企业入驻阿里巴巴国际站常见问题',
    description: '解答江西制造企业关于国际站开店准备、外贸团队、推广运营、创业和售后支持的问题。',
    render: faqPage, schema: 'faq'
  }],
  ['/privacy', {
    title: '隐私说明', description: '了解金品汇咨询表单的信息收集与使用方式。',
    render: privacyPage
  }]
]);
export const indexablePaths = [...staticPages.keys()].filter(route => route !== '/privacy');

function articlePresentation(item, articleUrl, safeImage) {
  let topic = '平台与团队', symbol = 'building-store', index = 2;
  if (item.type === 'news') {
    topic = '公司新闻'; symbol = 'news'; index = 0;
  } else if (/询盘|报价|订单|成本|申报|清关/.test(item.title)) {
    topic = '交易与跟进'; symbol = 'message-circle'; index = 5;
  } else if (/市场|调研|推广|策略|出海/.test(item.title) && !/团队/.test(item.title)) {
    topic = '市场与运营'; symbol = 'target'; index = 0;
  }
  return {
    ...item, route: articleUrl(item), author: item.authorName || '金品汇编辑部',
    cover: safeImage(item.imageUrl), topic, icon: symbol, photo: index
  };
}

function organizationSchema(url) {
  return {
    '@context': 'https://schema.org', '@type': 'Organization', name: company, url: url('/'),
    telephone: '+86-' + phone, logo: url(asset('jinpinhui-logo.webp')),
    address: { '@type': 'PostalAddress', streetAddress: '湖坊镇江南云港数字经济产业园18幢1512', addressLocality: '南昌市', addressRegion: '江西省', addressCountry: 'CN' }
  };
}

function faqSchema() {
  return {
    '@context': 'https://schema.org', '@type': 'FAQPage',
    mainEntity: commonQuestions.map(([, question, answer]) => ({
      '@type': 'Question', name: question, acceptedAnswer: { '@type': 'Answer', text: answer }
    }))
  };
}

function documentFor({ route, title, description, body, url, schema, image = workshopImage, article = false, missing = false, verification, revision }) {
  const canonical = url(route);
  const socialImage = image.startsWith('/') ? url(image) : image;
  const structured = schema ? `<script type="application/ld+json">${JSON.stringify(schema).replaceAll('<', '\\u003c')}</script>` : '';
  const soMeta = /^[a-zA-Z0-9_-]{8,256}$/.test(verification) ? `<meta name="360-site-verification" content="${esc(verification)}">` : '';
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="theme-color" content="#102236">
  <meta name="description" content="${esc(description)}">
  <meta name="baidu-site-verification" content="codeva-FtStjRLa1g">
  <meta name="sogou_site_verification" content="o0vPkQMrLs">
  ${soMeta}
  ${missing ? '<meta name="robots" content="noindex,follow">' : `<link rel="canonical" href="${esc(canonical)}">`}
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:type" content="${article ? 'article' : 'website'}">
  <meta property="og:url" content="${esc(canonical)}">
  <meta property="og:image" content="${esc(socialImage)}">
  <title>${esc(title)}｜金品汇</title>
  <link rel="icon" href="/assets/jinpin-logo.png">
  <link rel="stylesheet" href="/assets/jph-site.css?v=${esc(revision)}">
  <link rel="stylesheet" href="/assets/social-qr.css?v=${esc(revision)}">
  <script src="/assets/jph-site.js?v=${esc(revision)}" defer></script>
  <script src="/assets/social-qr.js?v=${esc(revision)}" defer></script>
  ${structured}
</head>
<body>
  ${header(route)}
  <main id="content">${body}</main>
  ${footer()}
</body>
</html>`;
}

export function createPublicSite({ url, getPosts, articleUrl, sanitizeArticle, safeImage, getVerification, revision }) {
  return function renderPublicPage(pathname, query = new URLSearchParams()) {
    const page = staticPages.get(pathname);
    const match = pathname.match(/^\/(news|blog)\/([^/]+)$/);
    const frame = { url, verification: getVerification(), revision };
    if (page || match) {
      let news = [], blogs = [];
      if (match || ['/', '/news', '/blog'].includes(pathname)) {
        const data = getPosts();
        const items = (Array.isArray(data) ? data : [])
          .filter(item => item && ['news','blog'].includes(item.type))
          .sort((a, b) => String(b.date).localeCompare(String(a.date)))
          .map(item => articlePresentation(item, articleUrl, safeImage));
        news = items.filter(item => item.type === 'news');
        blogs = items.filter(item => item.type === 'blog');
      }
      if (page) {
        const schema = page.schema === 'organization' ? organizationSchema(url) : page.schema === 'faq' ? faqSchema() : undefined;
        const body = page.render({ news, blogs, query });
        return { status: 200, html: documentFor({ ...frame, ...page, route: pathname, body, schema }) };
      }
      const peers = match[1] === 'news' ? news : blogs;
      const post = peers.find(item => item.slug === match[2]);
      if (post) {
        const image = post.cover || photoAsset(post.photo);
        const schema = {
          '@context': 'https://schema.org', '@type': 'Article', headline: post.title,
          description: post.summary, datePublished: post.date, dateModified: post.updatedAt || post.date,
          image: image.startsWith('/') ? url(image) : image, mainEntityOfPage: url(post.route),
          author: { '@type': 'Organization', name: post.author }, publisher: { '@type': 'Organization', name: company }
        };
        return {
          status: 200,
          html: documentFor({
            ...frame, route: post.route, title: post.title, description: post.summary, body: articlePage(post, peers, sanitizeArticle), image, schema, article: true
          })
        };
      }
    }
    return {
      status: 404,
      html: documentFor({ ...frame, route: '/404', title: '页面未找到', description: '您访问的页面不存在。', body: notFoundPage(), missing: true })
    };
  };
}

