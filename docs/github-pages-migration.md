# GitHub Pages + 集中发布后台

网站：https://lyufg1999.github.io/academic-cv/zh/

后台：https://lyufg1999.github.io/academic-cv/admin/

## 日常操作

1. GitHub 一键授权登录。所有设置、博客、上传文件都在同一个页面编辑。
2. 可点「保存本地草稿」：仅存此设备浏览器的 IndexedDB，不创建 Git 提交，也不部署。草稿包含附件，不包含凭据。请勿在共用设备保存私人内容。
3. 全部改完点「统一发布」：所有变更组成一个 Git 提交，随后 GitHub Actions 构建 Pages。
4. 等待「已发布」再刷新网站。「已提交」不是「已上线」，失败时看后台「发布记录」。

刷新需要重新登录。已手动保存的本地草稿可恢复，不支持跨设备同步。退出不会删除手动保存的草稿；「放弃草稿」会清除它。并发修改同一文件会阻止发布，防止覆盖；需要手工合并。附件单文件上限 20 MB（头像 10 MB），整站仍受 Pages 容量限制。博客正文用 Markdown；上传文档自动插入下载链接，图片插入图片引用。

## 首次启用 GitHub 一键授权（需网站所有者操作）

使用 GitHub App，不使用要求所有公开仓库写权限的传统 OAuth App。只给此 App 安装的 academic-cv 仓库 Contents 读写权限。认证服务在 Cloudflare Worker 上运行，不参与网站构建，也不使用 Netlify 积分。Worker 有自己的用量限制，不是无限免费。

### 1. 创建认证 Worker

在 https://dash.cloudflare.com/ 的 Workers & Pages 创建 Worker，命名 `academic-cv-auth`。可以先部署默认代码以取得 `https://academic-cv-auth.<你的子域>.workers.dev` 地址，再在代码编辑器用 `auth-worker/worker.js` 替换默认代码并部署。

也可以本地安装 Wrangler 后，在 `auth-worker` 目录用 `npx wrangler deploy` 部署；本仓库不自动部署 Worker，也不包含 Cloudflare 凭据。

### 2. 创建并安装 GitHub App

打开 https://github.com/settings/apps/new ：

- GitHub App name：唯一名称，例如 `LyuFG1999 Academic CV Admin`。
- Homepage URL：`https://lyufg1999.github.io/academic-cv/admin/`。
- Callback URL：`https://academic-cv-auth.<你的子域>.workers.dev/callback`，替换为真实 Worker 地址。
- 保留用户访问令牌过期功能（默认 8 小时）；不需要 Device Flow。
- 取消 Webhook 的 Active。此服务不接收 Webhook。
- Repository permissions → Contents：Read and write；Metadata：Read-only。Account permissions 不需要授权。
- 安装范围选择 Only on this account。

创建后记下 **Client ID**（不是 App ID），生成 **Client secret**。不要发送到聊天、不要写进 GitHub 文件。

然后左侧 Install App → 自己的账号 → Only select repositories → **academic-cv** → Install。

### 3. 设置 Worker 变量与加密密钥

Worker 的 Settings → Variables and Secrets：

| 名称 | 类型 | 值 |
|---|---|---|
| `GITHUB_CLIENT_ID` | 普通变量 | App 的 Client ID |
| `GITHUB_CLIENT_SECRET` | Secret（加密） | 刚生成的 Client secret |
| `ADMIN_ORIGIN` | 普通变量 | `https://lyufg1999.github.io`（不要加路径） |
| `ALLOWED_USER` | 普通变量 | `LyuFG1999` |
| `REPOSITORY` | 普通变量 | `LyuFG1999/academic-cv` |

保存并部署 Worker，访问 `/health` 应返回 `{"configured":true}`。这只确认变量存在，不代表 OAuth 端到端已通过。

### 4. 连接后台

修改 `public/admin/auth-config.json` 中 `authOrigin` 为真实 Worker 源地址，例如 `https://academic-cv-auth.<你的子域>.workers.dev`，不要加 `/auth`。此地址不是秘密，可以交给维护者帮助填写。

提交后等待 Pages 部署，打开后台点击「使用 GitHub 一键授权」。首次在 GitHub 确认授权。浏览器需允许弹窗。

### 5. 验证并完成切换

先验证中英文主页、图片、附件、登录与一次实际内容发布。现有 Netlify 网站不会删除，但会停留旧版：`netlify.toml` 已配置忽略后续自动构建；后台发布提交带 `[skip netlify]`，不影响 GitHub Actions。也建议在 Netlify 控制台停止自动构建/断开 Git 集成，以免旧后台再次提交。

不要继续使用旧 Netlify 后台编辑。没有自定义域名时，请更新对外分享网址；之后绑定域名还要同步 Astro site/base、后台资源链接及 Worker `ADMIN_ORIGIN`。

## 安全边界

- App secret 只在 Worker 的加密 Secret 中；访问令牌只在后台页面内存中。
- OAuth 使用随机 state、PKCE、HttpOnly/Secure/SameSite Cookie；回传校验精确 origin、弹窗 source 和客户端 nonce。不在 URL 回传令牌，不保留刷新令牌。
- 后台不加载第三方脚本；CSP 限制脚本到同源，API 请求到 GitHub。
- Worker 只允许指定 GitHub 用户，并检查仓库权限。GitHub App 只安装到单个仓库。
- 备用细粒度令牌方式藏在折叠区，仅在所有者需要时使用；不需要向维护者发送令牌。
- 维修模式是静态发布功能，不是即时访问控制，不能清除 Git 历史、已缓存页面或已经下载的内容。

## 官方参考

- https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-a-user-access-token-for-a-github-app
- https://developers.cloudflare.com/workers/configuration/secrets/
- https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits
