# 金品汇企业官网

完整多页面企业官网，含新闻、博客、行业方案、服务方案、咨询表单和内容管理后台。采用 Node.js 服务端渲染 HTML，不依赖外部包。

## 本地运行

需要 Node.js 20 或更高版本。在本目录运行：

```powershell
node server.mjs
```

打开 `http://127.0.0.1:4173`。首次访问 `http://127.0.0.1:4173/admin`，设置管理员密码。新闻、博客及咨询信息保存在 `data/` 目录。

## 腾讯云服务器部署

源码保存在 GitHub 仓库，网站实际运行在腾讯云中国内地服务器上。服务器使用 Node.js 20 或更高版本运行 `server.mjs`，并由 Nginx 反向代理。无需宝塔，也无需安装 npm 依赖。具体配置见 [deploy/tencent-cloud.md](deploy/tencent-cloud.md)。

服务器环境确认后，可使用 [deploy/install-local.sh](deploy/install-local.sh) 将网站安装为独立服务。脚本只监听 `127.0.0.1:4173`，保留现有 `data/` 内容，不修改 Nginx、域名、HTTPS 或防火墙设置；正式对外开放仍需单独配置。

正式对外开放前，应完成对应域名的 ICP 备案，并核对授权身份、统计数字、联系方式和案例资料。备案号取得后替换页脚占位文字。

## 当前内容

- 新闻中心含 2 篇公司介绍性质的文章；博客含 3 篇方法文章。
- 客户案例页保留真实案例发布位置，未编造客户或业绩。
- 咨询表单只保存在本机／服务器的 `data/leads.json`，不会发送短信或邮件。
- 页眉与「关于金品汇」页均使用用户提供的原始 Logo 图片。

## 素材

`public/assets/jinpin-logo.png`：用户提供的公司 Logo。`public/assets/hero-factory.png`：为本网站生成的制造场景视觉素材，属于示意画面，并非金品汇或客户的真实照片。
