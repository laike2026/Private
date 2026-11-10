import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createPublicSite, indexablePaths } from './public/_render/site.mjs';
import { event, registrationPage } from './public/_render/event-registration.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(root, 'public');
const dataDir = path.resolve(process.env.SITE_DATA_DIR || path.join(root, 'data'));
const contentFile = path.join(dataDir, 'content.json');
const leadsFile = path.join(dataDir, 'leads.json');
const registrationsFile = path.join(dataDir, `registrations-${path.basename(event.path)}.json`);
const authFile = path.join(dataDir, 'auth.json');
const port = Number(process.env.PORT || 4173);
const host = process.env.HOST || '127.0.0.1';
const baseUrl = process.env.SITE_URL || `http://${host}:${port}`;
const publicDeployment = Boolean(process.env.SITE_URL && !/^https?:\/\/(localhost|127\.0\.0\.1)(?::\d+)?\/?$/i.test(process.env.SITE_URL));
const setupKey = process.env.ADMIN_SETUP_KEY || '';
const contactAttempts = new Map();
const registrationAttempts = new Map();
let registrationWindow = 0;
const articleKeyDigest = process.env.ARTICLE_WEBHOOK_KEY_SHA256 || '9b0180cd14ae3340d2547f96e6df7b15bf5054af7314f2dcd28130f0f340d24f';
const articleAttempts = new Map();
const searchSettingsFile = path.join(dataDir, 'search-settings.json');
const searchStateFile = path.join(dataDir, 'search-state.json');
const revisionHash = crypto.createHash('sha256').update(fs.readFileSync(fileURLToPath(import.meta.url)));
for (const file of ['_render/site.mjs', '_render/content.mjs', '_render/outline-icons.json', 'assets/jph-site.css', 'assets/jph-site.js', 'assets/social-qr.css', 'assets/social-qr.js', 'assets/home.css']) {
  revisionHash.update(fs.readFileSync(path.join(publicDir, file)));
}
const sourceRevision = revisionHash.digest('hex');
let searchSubmitting = false;

fs.mkdirSync(dataDir, { recursive: true });
const seed = {
  posts: [
    { id: 'n-1', type: 'news', slug: 'jiangxi-local-service', title: '扎根江西，陪伴制造企业走向全球市场', summary: '南昌金品汇以平台入驻、运营增长、人才赋能和供应链配套为核心，为江西制造企业提供本地化跨境电商服务。', date: '2026-10-16', body: '在跨境电商持续发展的今天，不少传统制造企业仍面临平台规则不熟、运营团队不足、询盘转化困难等挑战。\n南昌金品汇网络技术有限公司立足江西南昌，围绕企业出海各阶段的实际需求，建立从前期诊断到执行陪跑的服务体系。\n公司以阿里巴巴国际站江西本地服务商的身份，把平台资源与江西产业带相结合，帮助企业逐步建立可持续的海外获客与外贸运营能力。' },
    { id: 'n-2', type: 'news', slug: 'service-framework', title: '金品汇服务体系：从开店到增长的全周期陪跑', summary: '针对企业“不会做、做不好、做不大”的难题，建立诊断、规划、执行与复盘相衔接的服务流程。', date: '2026-10-16', body: '企业出海需要的不只是开通一个店铺，更需要产品布局、流量获取、询盘跟进和团队能力的长期协同。\n金品汇围绕平台入驻、店铺运营、人才培养和交易配套四个方向，按照企业现状制定阶段性计划。\n在服务过程中，顾问与运营人员定期复盘关键问题，让每一步工作对应具体的业务目标。' },
    { id: 'b-1', type: 'blog', slug: 'before-opening-alibaba-store', title: '制造企业开通国际站前，先想清楚这 5 件事', summary: '从目标市场、产品组合、团队分工到预算和询盘承接，梳理开店前需要做的准备。', date: '2026-10-16', body: '第一，明确目标市场。不同市场的采购需求、认证要求和价格带并不相同，先选择重点区域，才能集中资源。\n第二，梳理产品组合。挑选有竞争力、交付稳定且适合跨境交易的产品，准备清晰的规格、图片和应用场景。\n第三，安排询盘响应。店铺运营和外贸销售需要明确分工，建立及时回复、报价与持续跟进的流程。\n第四，制定投入节奏。推广预算应与产品验证、内容建设和运营能力匹配，避免只投流量而忽略转化。\n第五，建立复盘机制。持续观察曝光、点击、询盘质量与成交进展，按数据调整经营动作。' },
    { id: 'b-2', type: 'blog', slug: 'improve-inquiry-conversion', title: '有询盘却难成交？先检查这 4 个环节', summary: '一次高质量询盘，需要及时响应、理解需求、专业报价和持续跟进。', date: '2026-10-16', body: '询盘转化并不是发送一次报价就结束。企业首先要确认客户的用途、数量、规格与交付时间，避免答非所问。\n回复速度和表达质量同样重要。简洁、完整地回答问题，并在必要时提供产品资料与可行替代方案。\n报价要说明产品配置、起订量、交期和交易条件，让客户有可比较的依据。\n最后建立跟进记录，区分不同采购阶段，在合适时间提供新的信息和支持。' },
    { id: 'b-3', type: 'blog', slug: 'build-export-team', title: '江西工厂如何搭建第一支跨境电商团队', summary: '用清晰岗位、标准流程和持续培训，降低从零组建外贸团队的难度。', date: '2026-10-16', body: '团队建设可以从最关键的岗位开始：产品负责人提供技术与交付信息，运营负责内容和流量，外贸人员负责客户沟通。\n企业需要把产品知识沉淀为资料库，把询盘处理沉淀为可执行的流程，使新人能更快上手。\n培训不应只停留在平台操作，还应覆盖海外客户需求判断、报价、谈判和风险识别。\n通过阶段目标和每周复盘，逐步形成稳定的内部能力。' }
  ]
};
if (!fs.existsSync(contentFile)) writeJson(contentFile, seed);
if (!fs.existsSync(leadsFile)) writeJson(leadsFile, []);
archiveLegacyVerificationArticle();

function readJson(file, fallback) { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; } }
function writeJson(file, value, mode) {
  const temp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(temp, JSON.stringify(value, null, 2), { encoding: 'utf8', mode });
  fs.renameSync(temp, file);
}
function archiveLegacyVerificationArticle() {
  const retiredId = 'dbbe2466-cc4f-4263-8d01-8845a2f8c33e';
  const data = JSON.parse(fs.readFileSync(contentFile,'utf8'));
  const retired = data.posts.find(item=>item.id===retiredId && item.title==='API测试标题');
  if (!retired) return;
  const archiveFile = path.join(dataDir,'content-archive-20261103.json');
  const archive = fs.existsSync(archiveFile) ? JSON.parse(fs.readFileSync(archiveFile,'utf8')) : {archivedAt:new Date().toISOString(),posts:[]};
  if (!archive.posts.some(item=>item.id===retired.id)) archive.posts.push(retired);
  writeJson(archiveFile,archive); fs.chmodSync(archiveFile,0o600);
  data.posts = data.posts.filter(item=>item.id!==retiredId);
  writeJson(contentFile,data);
}
function esc(value = '') { return String(value).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]); }
function slug(value) { return encodeURIComponent(value); }
function url(pathname) { return `${baseUrl.replace(/\/$/, '')}${pathname}`; }
function readBody(req) { return new Promise((resolve, reject) => { let data = ''; req.on('data', chunk => { data += chunk; if (data.length > 1048576) { reject(new Error('提交内容过大')); req.destroy(); } }); req.on('end', () => resolve(new URLSearchParams(data))); req.on('error', reject); }); }
function respond(res, status, body, type = 'text/html; charset=utf-8', headers = {}) { res.writeHead(status, { 'Content-Type': type, 'X-Content-Type-Options': 'nosniff', 'X-Frame-Options': 'DENY', 'Referrer-Policy': 'strict-origin-when-cross-origin', ...headers }); res.end(body); }
function redirect(res, to) { respond(res, 303, '', 'text/plain; charset=utf-8', { Location: to }); }
function safeOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return true;
  try { return new URL(origin).host === req.headers.host; } catch { return false; }
}
function contactAllowed(req) { const ip = String(req.headers['x-real-ip'] || req.socket.remoteAddress || 'unknown'); const now = Date.now(); const attempts = (contactAttempts.get(ip) || []).filter(time => now - time < 3600000); if (attempts.length >= 5) return false; attempts.push(now); contactAttempts.set(ip, attempts); return true; }
function allPosts() { return readJson(contentFile, seed).posts; }
function articleUrl(item) { return `/${item.type}/${slug(item.slug)}`; }

const privateResponse = { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' };
const registrationsAdminPath = '/admin/registrations';
const registrationDate = new Intl.DateTimeFormat('zh-CN', {
  timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
});

function readRegistrations() {
  try {
    const records = JSON.parse(fs.readFileSync(registrationsFile, 'utf8'));
    if (Array.isArray(records)) return records;
  } catch (error) {
    if (error.code === 'ENOENT') return [];
  }
  throw new Error('Could not read event registrations');
}

function registrationAllowed(req) {
  const window = Math.floor(Date.now() / (10 * 60 * 1000));
  if (window !== registrationWindow) {
    registrationWindow = window;
    registrationAttempts.clear();
  }
  const ip = req.headers['x-real-ip'] || req.socket.remoteAddress || 'unknown';
  const count = registrationAttempts.get(ip) || 0;
  if (count >= 60) return false;
  registrationAttempts.set(ip, count + 1);
  return true;
}

async function handleRegistration(req, res, query) {
  const page = (status, options) => respond(res, status, registrationPage(options), 'text/html; charset=utf-8', privateResponse);
  if (req.method === 'GET' || req.method === 'HEAD') {
    const state = Date.now() >= event.closesAt ? 'closed' : query.get('status') === 'registered' ? 'registered' : 'open';
    return page(200, { state });
  }
  if (req.method !== 'POST') return respond(res, 405, 'Method not allowed', 'text/plain', { ...privateResponse, Allow: 'GET, HEAD, POST' });
  if (Date.now() >= event.closesAt) return page(410, { state: 'closed' });
  if (!safeOrigin(req)) return respond(res, 403, 'Forbidden', 'text/plain', privateResponse);
  if (req.headers['content-type']?.split(';')[0].trim().toLowerCase() !== 'application/x-www-form-urlencoded') {
    return page(415, { error: '请打开报名页后提交表单。' });
  }
  if (!registrationAllowed(req)) return page(429, { error: '提交过于频繁，请稍后再试。' });

  const body = await readBody(req);
  if (Date.now() >= event.closesAt) return page(410, { state: 'closed' });
  const registered = () => respond(res, 303, '', 'text/plain', { ...privateResponse, Location: `${event.path}?status=registered` });
  if (body.get('website')) return registered();
  const company = (body.get('company') || '').trim();
  const name = (body.get('name') || '').trim().replace(/\s+/g, ' ');
  const phoneInput = (body.get('phone') || '').trim();
  const phone = phoneInput.normalize('NFKC').replace(/[\s()-]/g, '').replace(/^00(?=[1-9])/, '+')
    .replace(/^\+?86(1[3-9]\d{9})$/, '$1');
  const invalid = (key, error) => page(400, {
    error, invalid: key, values: { company: company.slice(0, 100), name: name.slice(0, 40), phone: phoneInput.slice(0, 32) }
  });
  if (!name || name.length > 40 || /[\p{Cc}]/u.test(name)) return invalid('name', '请填写参会人姓名，最多 40 个字符。');
  if (phoneInput.length > 32 || !/^\+?\d{7,15}$/.test(phone)) return invalid('phone', '请填写有效的联系电话。');
  if (company.length > 100 || /[\p{Cc}]/u.test(company)) return invalid('company', '公司名称最多 100 个字符，请在一行内填写。');

  const records = readRegistrations();
  if (!records.some(item => item.name === name && item.phone === phone)) {
    records.unshift({ name, phone, company, createdAt: new Date().toISOString() });
    writeJson(registrationsFile, records, 0o600);
  }
  return registered();
}

// Only canonical, public pages are eligible. The queue is derived from durable content
// and successful fingerprints, so a restart or GitHub update cannot lose new URLs.
function searchPages(type = '') {
  const items = allPosts().filter(x => ['news','blog'].includes(x.type)).sort((a,b) => b.date.localeCompare(a.date));
  const hash = value => crypto.createHash('sha256').update(value).digest('hex');
  const today = new Intl.DateTimeFormat('sv-SE', {timeZone:'Asia/Shanghai'}).format(new Date());
  const result = items.filter(x => !type || x.type === type).map(x => {
    const modified = String(x.updatedAt || x.date || '').slice(0,10);
    return {url:url(articleUrl(x)), fingerprint:hash(JSON.stringify(x)), lastmod:/^\d{4}-\d{2}-\d{2}$/.test(modified) && modified <= today ? modified : ''};
  });
  if (!type) result.push(...indexablePaths.map(p => ({url:url(p), fingerprint:hash(sourceRevision+p), lastmod:''})));
  return [...new Map(result.map(x=>[x.url,x])).values()];
}
function searchSettings() {
  const saved = readJson(searchSettingsFile, {});
  return {baiduToken:process.env.BAIDU_PUSH_TOKEN || saved.baiduToken || '', baiduEnabled:saved.baiduEnabled === true, soVerification:saved.soVerification || ''};
}
function searchState() { return {submitted:{}, logs:[], retryAfter:0, ...readJson(searchStateFile,{})}; }
function searchCsrf(req) { return crypto.createHmac('sha256',auth().secret).update('search-settings:'+(req.headers.cookie || '')).digest('hex'); }
function searchXml(type = '') {
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${searchPages(type).map(x=>`<url><loc>${esc(x.url)}</loc>${x.lastmod?`<lastmod>${x.lastmod}</lastmod>`:''}</url>`).join('')}</urlset>`;
}
function nextSearchDay() { return Math.floor((Date.now()+8*3600000)/86400000)*86400000+86400000-8*3600000+60000; }
async function flushSearchQueue() {
  if (searchSubmitting) return;
  const settings = searchSettings();
  if (!settings.baiduEnabled || !settings.baiduToken) return;
  const state = searchState();
  if (state.retryAfter > Date.now()) return;
  const batch = searchPages().filter(x=>state.submitted[x.url] !== x.fingerprint).slice(0,20);
  if (!batch.length) return;
  searchSubmitting = true;
  let log = {time:new Date().toISOString(), sent:batch.length, accepted:0, status:'failed', message:'百度接口暂时不可用，将自动重试'};
  let retryAfter = Date.now()+600000;
  const accepted = [];
  try {
    const endpoint = new URL('https://data.zz.baidu.com/urls');
    endpoint.searchParams.set('site',new URL(baseUrl).origin);
    endpoint.searchParams.set('token',settings.baiduToken);
    const response = await fetch(endpoint, {method:'POST', redirect:'error', headers:{'Content-Type':'text/plain; charset=utf-8'}, body:batch.map(x=>x.url).join('\n'), signal:AbortSignal.timeout(15000)});
    const result = await response.json();
    if (response.ok && !result.error && Number.isInteger(result.success) && result.success >= 0 && result.success <= batch.length) {
      const rejected = new Set([...(Array.isArray(result.not_valid)?result.not_valid:[]), ...(Array.isArray(result.not_same_site)?result.not_same_site:[])]);
      const valid = batch.filter(x=>!rejected.has(x.url));
      // Never infer which URLs succeeded when a response only reports a partial count.
      if (result.success === valid.length) accepted.push(...valid);
      log = {...log, accepted:result.success, status:accepted.length===batch.length?'accepted':'partial', message:accepted.length===batch.length?'百度已接收提交（不代表已收录）':'百度部分接收，未确认的链接保留待重试'};
      if (Number.isInteger(result.remain) && result.remain >= 0) log.remain = result.remain;
      retryAfter = result.remain === 0 ? nextSearchDay() : Date.now()+(accepted.length===batch.length?60000:3600000);
    } else {
      const messages = {401:'百度 token 无效，请重新核对接口凭证',403:'百度拒绝提交，请核对站点权限和当天配额',404:'百度站点未验证，请先验证当前 HTTPS 主域名',400:'百度拒绝请求，请核对站点和链接格式'};
      log.message = messages[result.error] || `百度接口返回异常（HTTP ${response.status}），稍后重试`;
      retryAfter = result.error === 403 ? nextSearchDay() : Date.now()+3600000;
    }
  } catch { /* Do not log the request URL: it contains the private token. */ }
  try {
    const current = searchSettings();
    if (current.baiduToken !== settings.baiduToken || !current.baiduEnabled) return;
    const latest = searchState();
    const pages = new Map(searchPages().map(x=>[x.url,x]));
    latest.submitted = Object.fromEntries(Object.entries(latest.submitted).filter(([u])=>pages.has(u)));
    for (const item of accepted) if (pages.get(item.url)?.fingerprint === item.fingerprint) latest.submitted[item.url] = item.fingerprint;
    latest.logs = [log,...latest.logs].slice(0,50);
    latest.retryAfter = retryAfter;
    writeJson(searchStateFile,latest);
  } finally { searchSubmitting = false; }
}
function scheduleSearchPush() { setTimeout(()=>flushSearchQueue().catch(()=>console.error('Search submission state could not be saved')),1000).unref(); }
function saveSearchSettings(body) {
  const saved = readJson(searchSettingsFile, {});
  const credential = (body.get('baiduCredential') || '').trim();
  let token = credential;
  if (/^https?:/i.test(credential)) {
    try {
      const api = new URL(credential);
      if (api.hostname !== 'data.zz.baidu.com' || api.pathname !== '/urls' || api.username || api.password || api.port) return '请使用百度普通收录提供的 data.zz.baidu.com/urls 接口地址';
      if (new URL(api.searchParams.get('site')).origin !== new URL(baseUrl).origin) return '接口所属站点必须与网站当前 HTTPS 主域名一致，请在百度切换站点后复制';
      token = api.searchParams.get('token') || '';
    } catch { return '百度接口地址格式不正确，请复制完整接口地址'; }
  }
  if (credential && !/^[a-zA-Z0-9_-]{8,256}$/.test(token)) return '百度 token 格式不正确';
  const verification = (body.get('soVerification') || '').trim();
  let soVerification = verification;
  if (verification.startsWith('<')) {
    const attributes = Object.fromEntries([...verification.matchAll(/([a-z-]+)\s*=\s*["']([^"']+)["']/gi)].map(m=>[m[1].toLowerCase(),m[2]]));
    if (attributes.name !== '360-site-verification') return '请粘贴 360 提供的 360-site-verification 标签';
    soVerification = attributes.content || '';
  }
  if (verification && !/^[a-zA-Z0-9_-]{8,256}$/.test(soVerification)) return '360 站点验证码格式不正确';
  if (credential) saved.baiduToken = token;
  if (verification) saved.soVerification = soVerification;
  saved.baiduEnabled = body.get('enabled') === 'yes';
  if (saved.baiduEnabled && !(process.env.BAIDU_PUSH_TOKEN || saved.baiduToken)) return '请先填写百度接口地址或 token，再启用主动推送';
  writeJson(searchSettingsFile,saved);
  fs.chmodSync(searchSettingsFile,0o600);
  const state = searchState(); state.retryAfter = 0; writeJson(searchStateFile,state);
  scheduleSearchPush();
  return '';
}
function adminSearch(req, notice = '') {
  const config = searchSettings(), state = searchState(), pages = searchPages();
  const pending = pages.filter(x=>state.submitted[x.url] !== x.fingerprint).length;
  const configured = Boolean(config.baiduToken);
  return adminFrame('搜索引擎接入', `<div class="admin-top"><div><a class="back-link" href="/admin">← 返回内容管理</a><h1>搜索引擎接入</h1><p>发布文章后自动更新站点地图；百度配置完成后自动提交新增及更新链接。</p></div></div>${notice?`<p class="form-alert">${esc(notice)}</p>`:''}<div class="admin-stats"><div><strong>${pages.length}</strong><span>可提交的公开页面</span></div><div><strong>${pending}</strong><span>百度待提交页面</span></div><div><strong>${config.baiduEnabled && configured?'已启用':'待配置'}</strong><span>百度主动推送</span></div></div><section class="search-panel"><h2>百度主动推送</h2><p>${configured?'已保存 token，页面不会显示密钥。':'尚未配置百度 token，目前未向百度发送 API 请求。'} 提交成功只表示百度已接收链接，收录与排名由搜索引擎决定。</p><p><a href="https://ziyuan.baidu.com/linksubmit/index?site=${encodeURIComponent(new URL(baseUrl).origin)}" target="_blank" rel="noopener noreferrer">打开百度普通收录 → API 提交 ↗</a></p><form class="admin-form" method="post" action="/admin/seo/settings"><input type="hidden" name="csrf" value="${searchCsrf(req)}"><label class="full">百度接口地址或 token（留空保留原值）<input type="password" name="baiduCredential" autocomplete="off" maxlength="2048" placeholder="从百度普通收录页面复制完整接口地址"></label><label class="full">主动推送<select name="enabled"><option value="no" ${!config.baiduEnabled?'selected':''}>暂停</option><option value="yes" ${config.baiduEnabled?'selected':''}>启用</option></select></label><label class="full">360 站点验证标签或验证码（留空保留原值）<input name="soVerification" autocomplete="off" maxlength="512" placeholder="粘贴 360 提供的 meta 验证标签"></label><button class="button button-primary">保存配置</button></form><form method="post" action="/admin/seo/submit"><input type="hidden" name="csrf" value="${searchCsrf(req)}"><button class="button button-light" ${!config.baiduEnabled||!configured?'disabled':''}>提交待处理链接</button></form></section><section class="search-panel"><h2>搜狗与 360</h2><p>搜狗：已有验证标签及文件。请在搜狗平台确认站点验证结果，使用下方链接清单提交页面链接；资源收录输入框不接受 sitemap 文件地址。</p><p>360：${config.soVerification?'已配置验证标签，需到 360 平台完成验证。':'等待站点专属验证标签。'} 旧版自动收录 JS 已下线，请通过站长平台提交站点地图。</p><p><a href="https://zhanzhang.sogou.com/index.php/sitelink/index" target="_blank" rel="noopener noreferrer">搜狗资源收录 ↗</a> · <a href="https://zhanzhang.so.com/?m=Sitemap" target="_blank" rel="noopener noreferrer">360 站点地图提交 ↗</a></p><p>全站地图：<a href="/sitemap.xml">${esc(url('/sitemap.xml'))}</a><br>纯链接清单：<a href="/sitemap.txt">${esc(url('/sitemap.txt'))}</a></p><label>复制下面的页面链接到站长平台<textarea class="search-urls" readonly rows="8">${esc(pages.map(x=>x.url).join('\n'))}</textarea></label></section><section class="search-panel"><h2>百度提交记录</h2>${state.logs.length?state.logs.map(x=>`<p><time>${esc(x.time)}</time> · 发送 ${x.sent} 条 / 接收 ${x.accepted} 条${Number.isInteger(x.remain)?` / 剩余配额 ${x.remain}`:''}<br>${esc(x.message)}</p>`).join(''):'<p>暂无 API 提交记录。</p>'}</section>`,true);
}

function httpUrl(value) {
  if (!value || /[\u0000-\u0020<>]/.test(value)) return '';
  try { const u = new URL(value); return ['http:', 'https:'].includes(u.protocol) && !u.username && !u.password ? u.href : ''; } catch { return ''; }
}
function cleanArticleHtml(value) {
  const allowed = new Set(['p','h2','h3','h4','h5','ul','ol','li','strong','em','b','i','br','blockquote','table','thead','tbody','tr','th','td','a','img','hr']);
  const raw = String(value).replace(/<!--[^]*?-->/g, '').replace(/<(script|style|iframe|object|svg|math|template)\b[^>]*>[^]*?<\/\1\s*>/gi, '');
  if (!/<\/?[a-z][^>]*>/i.test(raw)) return raw.split(/\n+/).filter(Boolean).map(s=>`<p>${esc(s)}</p>`).join('');
  return raw.split(/(<[^>]*>)/g).map(part => {
    if (!part.startsWith('<')) return esc(part.replace(/&(?:amp|lt|gt|quot|#39|nbsp);/g, x=>({'&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&#39;':"'",'&nbsp;':' '})[x]));
    const tag = part.match(/^<\s*(\/?)\s*([a-z0-9]+)\b[^>]*>$/i);
    if (!tag || !allowed.has(tag[2].toLowerCase())) return '';
    const name=tag[2].toLowerCase(); if(tag[1]) return ['img','br','hr'].includes(name)?'':`</${name}>`;
    const attrs={}; for(const m of part.matchAll(/\s([a-z][\w-]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi)) attrs[m[1].toLowerCase()]=m[2]??m[3]??m[4];
    if(name==='a') {const href=httpUrl(attrs.href);return href?`<a href="${esc(href)}" rel="nofollow noopener noreferrer">`:'<a>';}
    if(name==='img') {const src=httpUrl(attrs.src);return src?`<img src="${esc(src)}" alt="${esc((attrs.alt||'').slice(0,200))}" loading="lazy" referrerpolicy="no-referrer">`:'';}
    return `<${name}>`;
  }).join('');
}
function articleText(html) { return html.replace(/<[^>]*>/g,' ').replace(/&(?:amp|lt|gt|quot|#39|nbsp);/g,' ').replace(/\s+/g,' ').trim(); }
async function articleWebhook(req,res) {
  const reply=(code,msg)=>respond(res,200,JSON.stringify({code,msg}),'application/json; charset=utf-8',{'Cache-Control':'no-store'});
  if(req.method!=='POST') return reply(0,'请使用 POST 请求发布文章');
  const ip=String(req.headers['x-real-ip']||req.socket.remoteAddress); const now=Date.now();
  const rate=articleAttempts.get(ip); if(rate && now-rate.since<60000 && rate.count>=30) return reply(0,'请求过于频繁，请稍后重试');
  if(!rate||now-rate.since>=60000) {if(articleAttempts.size>10000) articleAttempts.clear();articleAttempts.set(ip,{since:now,count:1});} else rate.count++;
  try {
    const mime=String(req.headers['content-type']||'').split(';')[0].trim().toLowerCase();
    if(!['application/x-www-form-urlencoded','application/json'].includes(mime)) return reply(0,'请使用表单或 JSON 请求');
    const raw=await new Promise((resolve,reject)=>{let chunks=[],size=0;req.on('data',c=>{size+=c.length;if(size<=1048576)chunks.push(c);else chunks=[];});req.on('end',()=>size>1048576?reject(new Error('请求内容不能超过 1MB')):resolve(Buffer.concat(chunks).toString('utf8')));req.on('error',reject);});
    let input;try{input=mime==='application/json'?JSON.parse(raw):Object.fromEntries(new URLSearchParams(raw));}catch{return reply(0,'请求内容格式错误');}
    if(!input||typeof input!=='object'||Array.isArray(input)) return reply(0,'请求内容格式错误');
    const digest=crypto.createHash('sha256').update(typeof input.sign==='string'?input.sign:'').digest();
    if(!/^[a-f0-9]{64}$/i.test(articleKeyDigest)||!crypto.timingSafeEqual(digest,Buffer.from(articleKeyDigest,'hex'))) return reply(0,'秘钥错误');
    const classes={news:'news',blog:'blog','1':'news','2':'blog','31':'news'};
    const classId=String(input.class_id??'blog').trim();const type=Object.hasOwn(classes,classId)?classes[classId]:'';
    if(!type) return reply(0,'文章栏目无效，请使用 news 或 blog');
    const title=typeof input.title==='string'?input.title.trim():'';const content=typeof input.content==='string'?input.content.trim():'';
    if(!title||title.length>140) return reply(0,'文章标题不能为空且不能超过 140 字');
    if(!content||content.length>100000) return reply(0,'文章内容不能为空且不能超过 100000 字');
    const body=cleanArticleHtml(content);const text=articleText(body); if(!text) return reply(0,'文章缺少有效正文');
    const authorId=String(input.author_id??'admin').trim();if(authorId.length>80) return reply(0,'作者参数不能超过 80 字');
    const imageInput=String(input.image_url??'').trim();const imageUrl=httpUrl(imageInput);if(imageInput&&(!imageUrl||imageInput.length>2048)) return reply(0,'封面图地址必须是有效的 HTTP 或 HTTPS 地址');
    const fingerprint=crypto.createHash('sha256').update(JSON.stringify([type,title,body,authorId,imageUrl])).digest('hex');
    const data=JSON.parse(fs.readFileSync(contentFile,'utf8'));if(!Array.isArray(data.posts)) throw new Error('网站文章数据格式异常，请联系管理员');
    if(data.posts.some(x=>x.webhookFingerprint===fingerprint)) return reply(1,'发布成功');
    const id=crypto.randomUUID();data.posts.unshift({id,type,slug:`api-${id}`,title,summary:text.slice(0,180),date:new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Shanghai'}).format(new Date()),body,updatedAt:new Date().toISOString(),format:'html',authorId,authorName:['','admin','1'].includes(authorId)?'金品汇编辑部':authorId,imageUrl,webhookFingerprint:fingerprint,source:'webhook'});
    writeJson(contentFile,data);scheduleSearchPush();return reply(1,'发布成功');
  }catch(error){return reply(0,['请求内容不能超过 1MB','网站文章数据格式异常，请联系管理员'].includes(error.message)?error.message:'发布失败，请检查请求或联系网站管理员');}
}

const renderPublicPage = createPublicSite({
  url, getPosts: allPosts, articleUrl, sanitizeArticle: cleanArticleHtml, safeImage: httpUrl,
  getVerification: () => searchSettings().soVerification,
  revision: sourceRevision.slice(0, 12)
});

function auth() { return readJson(authFile, null); }
function isLogged(req) { const a = auth(); if (!a) return false; const cookie = (req.headers.cookie || '').split(';').map(x => x.trim()).find(x => x.startsWith('jph_session=')); if (!cookie) return false; const [exp, sig] = cookie.slice(12).split('.'); if (!exp || !sig || Number(exp) < Date.now()) return false; const expected = crypto.createHmac('sha256', a.secret).update(exp).digest('hex'); return sig.length === expected.length && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected)); }
function adminFrame(title, body, logged = false, stylesheet = '') { return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${esc(title)}｜金品汇后台</title><link rel="stylesheet" href="/styles.css?v=20261103-formal">${stylesheet ? `<link rel="stylesheet" href="${esc(stylesheet)}">` : ''}></head><body class="admin-body"><header class="admin-header"><a href="/">金品汇官网 ↗</a><strong>内容管理</strong>${logged?'<a href="/admin/seo">搜索引擎接入</a>':''}${logged ? '<form method="post" action="/admin/logout"><button>退出登录</button></form>' : ''}</header><main class="admin-main">${body}</main></body></html>`; }
function adminLogin(setup = false, error = false) { return adminFrame(setup ? '设置管理员密码' : '后台登录', `<div class="admin-auth"><span class="kicker"><i></i>CONTENT MANAGEMENT</span><h1>${setup ? '设置管理员密码' : '登录内容管理后台'}</h1><p>${setup ? '首次使用，请设置至少 12 位的管理员密码。' : '登录后可发布新闻和博客，并查看咨询信息。'}</p>${error ? '<p class="admin-error">部署密钥或密码不正确、两次输入不一致，或密码不符合要求，请重试。</p>' : ''}<form method="post" action="${setup ? '/admin/setup' : '/admin/login'}">${setup && publicDeployment ? '<label>部署密钥<input type="password" name="setupKey" required autocomplete="off"></label>' : ''}<label>管理员密码<input type="password" name="password" minlength="${setup ? 12 : 1}" required autocomplete="${setup ? 'new-password' : 'current-password'}"></label>${setup ? '<label>再次输入密码<input type="password" name="passwordConfirm" minlength="12" required autocomplete="new-password"></label>' : ''}<button class="button button-primary">${setup ? '完成设置' : '登录后台'} ↗</button></form></div>`); }
function adminDashboard() { const items = allPosts(); const leads = readJson(leadsFile, []); return adminFrame('管理首页', `<div class="admin-top"><div><span class="kicker"><i></i>DASHBOARD</span><h1>内容管理</h1><p>新闻、博客和咨询信息保存在本地 data 文件夹。</p></div><a class="button button-primary" href="/admin/posts/new">发布文章 ↗</a></div><div class="admin-stats"><div><strong>${items.filter(x => x.type === 'news').length}</strong><span>新闻</span></div><div><strong>${items.filter(x => x.type === 'blog').length}</strong><span>博客</span></div><div><strong>${leads.length}</strong><span>咨询</span></div></div>${adminTabs('/admin')}<div class="admin-table">${items.sort((a,b) => b.date.localeCompare(a.date)).map(x => `<div><span>${x.type === 'news' ? '新闻' : '博客'}</span><a href="${articleUrl(x)}" target="_blank">${esc(x.title)}</a><small>${esc(x.date)}</small><a href="/admin/posts/${esc(x.id)}/edit">编辑</a><form method="post" action="/admin/posts/${esc(x.id)}/delete" onsubmit="return confirm('确认删除这篇文章？')"><button>删除</button></form></div>`).join('')}</div>`, true); }
function adminPostForm(item = null, error = '') { return adminFrame(item ? '编辑文章' : '发布文章', `<div class="admin-top"><div><a href="/admin" class="back-link">← 返回内容管理</a><h1>${item ? '编辑文章' : '发布文章'}</h1></div></div>${error ? `<p class="admin-error">${esc(error)}</p>` : ''}<form class="admin-form" method="post" action="${item ? `/admin/posts/${esc(item.id)}/edit` : '/admin/posts/new'}"><label>栏目<select name="type"><option value="news" ${item?.type === 'news' ? 'selected' : ''}>新闻中心</option><option value="blog" ${item?.type === 'blog' ? 'selected' : ''}>出海博客</option></select></label><label>发布日期<input type="date" name="date" required value="${esc(item?.date || new Date().toISOString().slice(0,10))}"></label><label class="full">标题<input name="title" required maxlength="140" value="${esc(item?.title || '')}"></label><label class="full">摘要<textarea name="summary" rows="3" required maxlength="300">${esc(item?.summary || '')}</textarea></label><label class="full">正文（每行一个段落）<textarea name="body" rows="16" required maxlength="100000">${esc(item?.body || '')}</textarea></label><button class="button button-primary" type="submit">保存文章 ↗</button></form>`, true); }
function adminLeads() { const leads = readJson(leadsFile, []); return adminFrame('咨询信息', `<div class="admin-top"><div><span class="kicker"><i></i>INQUIRIES</span><h1>咨询信息</h1></div></div>${adminTabs('/admin/leads')}<div class="lead-list">${leads.length ? leads.map(x => `<div><small>${esc(x.createdAt)}</small><h2>${esc(x.name)} · ${esc(x.company || '未填写企业')}</h2><p><strong>联系电话：</strong>${esc(x.phone)}</p><p><strong>关注方向：</strong>${esc(x.interest || '未选择')}</p><p><strong>需求：</strong>${esc(x.message || '未填写')}</p></div>`).join('') : '<p class="empty-note">暂无咨询信息。</p>'}</div>`, true); }
function notFound() { return renderPublicPage('/404').html; }

function adminTabs(active) {
  const tabs = [['/admin', '文章管理'], ['/admin/leads', '咨询信息'], [registrationsAdminPath, '活动报名']];
  return `<nav class="admin-tabs" aria-label="后台栏目">${tabs.map(([route, label]) =>
    `<a href="${route}"${route === active ? ' class="current" aria-current="page"' : ''}>${label}</a>`).join('')}</nav>`;
}

function adminRegistrations() {
  const records = readRegistrations();
  const registrationUrl = esc(url(event.path));
  const rows = records.map(record => `<tr><td>${esc(record.name)}</td><td>${esc(record.phone)}</td>
    <td>${esc(record.company || '未填写')}</td><td>${esc(registrationDate.format(new Date(record.createdAt)))}</td></tr>`).join('');
  return adminFrame('活动报名', `<div class="registration-admin">
    <div class="admin-top"><div><h1>活动报名</h1><p>下载本场活动的报名物料，并查看已经提交的报名。</p></div></div>
    ${adminTabs(registrationsAdminPath)}
    <section class="registration-share" aria-labelledby="registration-event">
      <div><h2 id="registration-event">${event.title}</h2>
        <p>${event.date} ${event.time}<br>${event.venue}</p>
        <a class="registration-url" href="${event.path}">${registrationUrl}</a>
        <div class="registration-actions"><a href="${event.path}">打开报名页</a>
          <a href="${event.poster}" download="服装出海活动报名海报.jpg">下载报名海报</a>
          <a href="${event.qr}" download="服装出海活动报名二维码.png">下载二维码</a></div>
      </div>
      <img src="${event.qr}" alt="服装出海活动报名二维码" width="158" height="158">
    </section>
    <section class="registration-list" aria-labelledby="registration-list">
      <div class="registration-list-header"><h2 id="registration-list">报名名单</h2><span>共 ${records.length} 人</span></div>
      ${records.length ? `<div class="registration-table-wrap" tabindex="0" role="region" aria-label="报名记录"><table class="registration-table">
        <thead><tr><th scope="col">参会人姓名</th><th scope="col">联系电话</th><th scope="col">公司名称</th><th scope="col">报名时间</th></tr></thead>
        <tbody>${rows}</tbody></table></div>` : '<p class="registration-empty">暂时还没有报名。分享上方的报名页或海报后，名单会在这里显示。</p>'}
    </section>
  </div>`, true, event.styles);
}

const staticTypes = {
  '.txt': 'text/plain; charset=utf-8', '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.webp': 'image/webp'
};
function staticFile(res, pathname) {
  const filepath = path.join(publicDir, pathname);
  const allowed = pathname.startsWith('/assets/') ? path.join(publicDir, 'assets') : publicDir;
  if (!filepath.startsWith(allowed + path.sep)) return false;
  try {
    if (!fs.statSync(filepath).isFile()) return false;
    const type = staticTypes[path.extname(filepath).toLowerCase()] || 'application/octet-stream';
    const cache = pathname === '/sogousiteverification.txt' ? 'no-store' : 'public, max-age=3600';
    respond(res, 200, fs.readFileSync(filepath), type, { 'Cache-Control': cache });
    return true;
  } catch { return false; }
}

const server = http.createServer(async (req, res) => {
  try {
    const parsed = new URL((req.url || '/').replace(/^\/+/, '/'), baseUrl); const pathname = decodeURIComponent(parsed.pathname).replace(/\/{2,}/g, '/').replace(/\/$/, '') || '/';
    if (pathname === '/api/webhook/send_article' || (pathname === '/' && req.method === 'POST')) return await articleWebhook(req,res);
    if (pathname === event.path) return await handleRegistration(req, res, parsed.searchParams);
    if (pathname.startsWith('/assets/') || pathname === '/styles.css' || pathname === '/client.js' || pathname === '/baidu_verify_codeva-ahDYCZppdD.html' || pathname === '/sogousiteverification.txt') { if (staticFile(res, pathname)) return; return respond(res, 404, 'Not found', 'text/plain'); }
    if (pathname === '/robots.txt') return respond(res, 200, 'User-agent: *\nDisallow: /admin\nDisallow: /api/\nSitemap: ' + url('/sitemap.xml') + '\n', 'text/plain; charset=utf-8', {'Cache-Control':'no-cache'});
    if (['/sitemap.xml','/news-sitemap.xml','/blog-sitemap.xml'].includes(pathname)) return respond(res,200,searchXml(pathname.startsWith('/news-')?'news':pathname.startsWith('/blog-')?'blog':''),'application/xml; charset=utf-8',{'Cache-Control':'no-cache'});
    if (pathname === '/sitemap.txt') return respond(res,200,searchPages().map(x=>x.url).join('\n')+'\n','text/plain; charset=utf-8',{'Cache-Control':'no-cache'});
    if (req.method === 'POST') {
      if (!safeOrigin(req)) return respond(res, 403, 'Forbidden', 'text/plain');
      const body = await readBody(req);
      if (pathname === '/contact') { if (body.get('website')) return redirect(res, '/contact?sent=success'); const name = (body.get('name') || '').trim(), phone = (body.get('phone') || '').trim(); if (!name || !phone || body.get('consent') !== 'yes') return redirect(res, '/contact?sent=error'); if (!contactAllowed(req)) return respond(res, 429, '提交过于频繁，请稍后重试。', 'text/plain; charset=utf-8'); const leads = readJson(leadsFile, []); leads.unshift({ id: crypto.randomUUID(), createdAt: new Date().toISOString(), name: name.slice(0,60), phone: phone.slice(0,40), company: (body.get('company') || '').slice(0,100), interest: (body.get('interest') || '').slice(0,60), message: (body.get('message') || '').slice(0,1000) }); writeJson(leadsFile, leads); return redirect(res, '/contact?sent=success'); }
      if (pathname === '/admin/setup' && !auth()) { const password = body.get('password') || ''; if ((publicDeployment && (!setupKey || setupKey !== body.get('setupKey'))) || password.length < 12 || password !== body.get('passwordConfirm')) return respond(res, 400, adminLogin(true, true)); const salt = crypto.randomBytes(24).toString('hex'), hash = crypto.scryptSync(password, salt, 64).toString('hex'); writeJson(authFile, { salt, hash, secret: crypto.randomBytes(32).toString('hex') }); return redirect(res, '/admin/login'); }
      if (pathname === '/admin/login') { const a = auth(); if (!a) return redirect(res, '/admin/setup'); const hash = crypto.scryptSync(body.get('password') || '', a.salt, 64).toString('hex'); if (hash.length !== a.hash.length || !crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(a.hash))) return respond(res, 401, adminLogin(false, true)); const exp = String(Date.now() + 7 * 86400000), sig = crypto.createHmac('sha256', a.secret).update(exp).digest('hex'); return respond(res, 303, '', 'text/plain', { Location: '/admin', 'Set-Cookie': `jph_session=${exp}.${sig}; Path=/admin; HttpOnly; SameSite=Lax${process.env.SITE_URL?.startsWith('https:') ? '; Secure' : ''}` }); }
      if (!isLogged(req)) return redirect(res, '/admin/login');
      if (pathname === '/admin/seo/settings' || pathname === '/admin/seo/submit') {
        if (body.get('csrf') !== searchCsrf(req)) return respond(res,403,'页面已过期，请刷新后再试','text/plain; charset=utf-8');
        if (pathname.endsWith('/settings')) { const error = saveSearchSettings(body); if (error) return respond(res,400,adminSearch(req,error)); }
        else scheduleSearchPush();
        return redirect(res,'/admin/seo');
      }
      if (pathname === '/admin/logout') return respond(res, 303, '', 'text/plain', { Location: '/admin/login', 'Set-Cookie': 'jph_session=; Path=/admin; Max-Age=0; HttpOnly; SameSite=Lax' });
      const edit = pathname.match(/^\/admin\/posts\/([^/]+)\/edit$/), del = pathname.match(/^\/admin\/posts\/([^/]+)\/delete$/);
      if (pathname === '/admin/posts/new' || edit) { const data = readJson(contentFile, seed), existing = edit ? data.posts.find(x => x.id === edit[1]) : null; if (edit && !existing) return respond(res, 404, 'Not found', 'text/plain'); const item = { id: existing?.id || crypto.randomUUID(), slug: existing?.slug || crypto.randomBytes(5).toString('hex'), type: body.get('type') === 'blog' ? 'blog' : 'news', date: (body.get('date') || '').slice(0,10), title: (body.get('title') || '').trim().slice(0,140), summary: (body.get('summary') || '').trim().slice(0,300), updatedAt:new Date().toISOString(), body: (body.get('body') || '').trim().slice(0,100000) }; if (!item.title || !item.summary || !item.body || !/^\d{4}-\d{2}-\d{2}$/.test(item.date)) return respond(res, 400, adminPostForm(item, '请填写标题、摘要、正文和有效日期。')); if (existing) Object.assign(existing, item); else data.posts.unshift(item); writeJson(contentFile, data); scheduleSearchPush(); return redirect(res, '/admin'); }
      if (del) { const data = readJson(contentFile, seed); data.posts = data.posts.filter(x => x.id !== del[1]); writeJson(contentFile, data); return redirect(res, '/admin'); }
      return respond(res, 404, 'Not found', 'text/plain');
    }
    if (req.method !== 'GET') return respond(res, 405, 'Method not allowed', 'text/plain');
    if (pathname.startsWith('/admin')) { if (!auth()) { if (publicDeployment && !setupKey) return respond(res, 503, adminFrame('后台尚未启用', '<div class="admin-auth"><h1>后台尚未启用</h1><p>请网站管理员先在服务器上配置首次设置密钥。</p></div>')); return respond(res, 200, adminLogin(true)); } if (pathname === '/admin/login') return respond(res, 200, adminLogin()); if (!isLogged(req)) return redirect(res, '/admin/login'); if (pathname === '/admin') return respond(res, 200, adminDashboard()); if (pathname === '/admin/seo') return respond(res,200,adminSearch(req)); if (pathname === '/admin/leads') return respond(res, 200, adminLeads()); if (pathname === registrationsAdminPath) return respond(res, 200, adminRegistrations(), 'text/html; charset=utf-8', privateResponse); if (pathname === '/admin/posts/new') return respond(res, 200, adminPostForm()); const edit = pathname.match(/^\/admin\/posts\/([^/]+)\/edit$/); if (edit) { const item = allPosts().find(x => x.id === edit[1]); return respond(res, item ? 200 : 404, item ? adminPostForm(item) : notFound()); } return respond(res, 404, notFound()); }
    const view = renderPublicPage(pathname, parsed.searchParams);
    return respond(res, view.status, view.html);
  } catch (error) { console.error(error); if (!res.headersSent) respond(res, 500, '服务器暂时无法处理请求。', 'text/plain; charset=utf-8'); }
});
server.listen(port, host, () => { console.log(`Local: http://${host}:${port}`); scheduleSearchPush(); });
setInterval(()=>flushSearchQueue().catch(()=>console.error('Search submission state could not be saved')),60000).unref();
