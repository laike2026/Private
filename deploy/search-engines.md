# 搜索引擎接入与主动提交

网站主域名：`https://tiltrotator.com.cn`。所有站长平台都应添加这一 HTTPS 主域名，避免提交 www 或 HTTP 跳转地址。

## 网站端已实现

- `/robots.txt` 声明全站地图，禁止抓取后台及 API。
- `/sitemap.xml`：全站公开页面；`/news-sitemap.xml`、`/blog-sitemap.xml`：对应文章地图；文章包含已知的最后修改日期。
- `/sitemap.txt`：每行一个实际页面 URL，可复制到支持链接提交的站长平台。文件地址本身不能填入搜狗的 URL 收录输入框。
- 所有地图随文章发布、编辑、删除实时更新，只包含当前公开的规范链接。
- `/admin/seo`：需登录的配置页面，支持百度凭证、360 验证标签、待提交数量及百度提交记录。
- 百度凭证仅保存在服务器 `data/search-settings.json`（权限 0600，Git 忽略），页面不回显。可用服务端 `BAIDU_PUSH_TOKEN` 环境变量覆盖 token；仍需在后台启用推送。
- `data/search-state.json` 记录成功提交的内容指纹及最多 50 条反馈记录；Git 忽略，自动部署保留。
- 百度启用后每分钟检查变更，每批最多 20 个 URL。发布文章触发一次检查；失败退避、当天额度耗尽延至次日北京时间重试；服务重启后继续处理。
- 成功记录按页面 URL 和内容指纹去重。删除文章后不再提交其链接。接口提交失败不影响文章正常发布。
- 请求仅发送至固定的 HTTPS 百度官方接口，不接受任意远程接口地址，不输出 token。

## 百度：需要站点专属 token 才能真实推送

1. 登录 https://ziyuan.baidu.com/linksubmit/index ，选择 `https://tiltrotator.com.cn`。
2. 在“普通收录 → API 提交”复制完整接口地址，通常为 `https://data.zz.baidu.com/urls?site=…&token=…`。
3. 登录官网 `/admin/seo`，粘贴接口地址，选择“启用”，保存。
4. 在提交记录中确认实际接收数量、剩余额度或错误提示。

接口所属站点必须与网站主域名一致。HTML 验证标签不等于 API token。未取得 token 前页面明确显示“待配置”，不会伪造推送成功。

## 搜狗：资源平台提交页面链接

已有搜狗验证标签和验证文件；是否通过验证以搜狗后台为准。

https://zhanzhang.sogou.com/index.php/sitelink/index 支持页面链接提交，明确不接受 sitemap 文件地址。可从官网后台或 `/sitemap.txt` 复制实际页面 URL。搜狗帮助中心另有 sitemap 说明，若账户显示独立 sitemap 提交入口，可提交 `/sitemap.xml`。不使用来源不明的“搜狗主动推送 API”。

## 360：验证后提交站点地图

在 https://zhanzhang.so.com/ 添加并验证网站，将平台提供的 `360-site-verification` meta 标签粘贴到官网 `/admin/seo`，保存后回 360 完成验证，再在 https://zhanzhang.so.com/?m=Sitemap 提交全站地图地址。

360 官方公告说明旧版自动收录 JS 于 2021-05-10 下线，不能再将其作为有效主动推送集成。

## 边界与官方资料

提交成功代表搜索引擎接收了链接，并不等于已抓取、已收录或承诺排名。

- 百度普通收录：https://ziyuan.baidu.com/linksubmit/index
- 搜狗资源收录：https://zhanzhang.sogou.com/index.php/sitelink/index
- 搜狗 sitemap 说明：https://help.sogou.com/sitemap.html
- 360 自动收录下线公告：https://bbs.360.cn/thread-15979727-1-1.html

密钥不放入公开仓库、浏览器脚本、公开配置文件或日志。更换百度 token 后在官网后台保存即可；不要使用网站文章发布密钥代替百度 token。
