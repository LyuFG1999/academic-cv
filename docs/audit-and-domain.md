# 功能复查与域名接入 — 2026-09-06

## 本轮修改

- 维护页直接在当前文档中切换中英文，不请求可能缓存了旧普通页面的语言路由。禁用 JavaScript 时仍保留带版本参数的链接。
- 修复维护页背景光晕撑出隐藏横向滚动区域、点击控件后卡片偏移的问题。
- 去掉首页个人介绍区的冗余底边框，仅保留页脚分隔线；调整研究卡片、内容间距、长文字、表格和图片显示。
- 成果可从 BibTeX/BibLaTeX 或 RIS 文件/文本导入。先预览并勾选，按 DOI 或题名、作者、年份组合排重；记录自动分类，也可手选类别。缺失信息提示补全。中英文保留原始引文，不生成虚构翻译。
- 修复完整日期与纯年份排序尺度不一致；前台不再渲染无标题成果空卡片。
- 允许受控 Blob Worker，使较大 ZIP 文件在后台安全策略下正常解压。
- 后台新增“域名与访问”向导。目标域名字段只记录计划，不会自动修改 DNS、GitHub Pages 或 OAuth。
- 构建读取 GitHub Pages 的实际域名和 base path，适配自定义域名根目录。

## 验证与范围

- 16 项自动测试覆盖引文导入、重复过滤、文件导入、路径限制、日期排序、原有发布冲突保护和 OAuth。
- 浏览器检查五种前台尺寸，并验证后台 BibTeX 与 RIS 预览/导入、10 个面板、较大 ZIP Worker、草稿恢复、隐藏字段校验和一次性发布。
- 模拟 GitHub 写入：设置、中英文成果、博客和两个文件共六个条目通过一个 commit/ref 更新提交；不向真实仓库写入测试内容。
- 隔离构建验证自定义域名的 canonical、资源路径和后台根路径。维护模式测试覆盖 1440、390、320 像素宽度，连续切换语言不会请求普通页面，卡片始终位于屏幕内。
- DNS、HTTPS 签发和所有者真实 OAuth 登录需要对应服务完成配置后另行验证；本轮未改动腾讯云解析或 Worker 的密钥/环境变量。
- 静态维护模式不是访问鉴权，不能撤回已下载文件或历史缓存。

## fengguanglyu.com 接入顺序

1. 建议先在 GitHub 账户 Settings → Pages 验证域名所有权，按页面提示在腾讯云 DNSPod 添加 TXT。
2. 仓库 Settings → Pages → Custom domain 填 `fengguanglyu.com` 并保存。
3. 腾讯云 DNSPod 配置下表。若有同名 A/AAAA/CNAME，先核对现有用途，避免冲突；不更改 MX 邮箱记录。

| 主机记录 | 类型 | 记录值 |
| --- | --- | --- |
| @ | A | 185.199.108.153 |
| @ | A | 185.199.109.153 |
| @ | A | 185.199.110.153 |
| @ | A | 185.199.111.153 |
| www（可选） | CNAME | lyufg1999.github.io |

4. 在 GitHub Actions 手动运行 Deploy to GitHub Pages，构建会自动使用新域名与根路径。
5. DNS 检查通过且证书就绪后，开启 Enforce HTTPS。
6. Cloudflare Worker 的 `ADMIN_ORIGIN` 改为 `https://fengguanglyu.com`。GitHub App 的 Homepage URL 改为 `https://fengguanglyu.com/admin/`；Redirect URI 仍是 `https://academic-cv-auth.lvfg1999.workers.dev/callback`。
7. 检查主页、双语导航、图片/附件与后台登录。切换域名后，本地草稿受浏览器来源隔离，不会自动迁移；切换前先发布需保留的草稿。

本项目使用自定义 Actions 发布，因此只添加 CNAME 文件不能完成绑定。以上依据 [GitHub 官方自定义域名说明](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site)。
