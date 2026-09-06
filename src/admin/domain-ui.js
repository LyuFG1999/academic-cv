export function renderDomainPanel({ panel, el, base }) {
  const guide = el('section', undefined, 'domain-guide');
  guide.append(el('h3', '域名与访问'), el('p', `当前访问地址：${location.origin}${base}/`, 'hint'));
  guide.append(el('p', '域名绑定在托管平台设置，后台只显示当前地址。本文统一使用 example.com 举例，不保存目标域名。', 'hint'));
  const steps = el('ol');
  for (const text of [
    '在 GitHub 账户 Settings → Pages 验证域名所有权，再在仓库 Settings → Pages → Custom domain 设置 example.com。',
    '在域名服务商设置所需 DNS 记录，保留已有邮件记录；DNS 检查和证书签发完成后开启 Enforce HTTPS。',
    '重新运行网站发布，构建会自动读取实际域名与根路径。',
    '同步更新登录 Worker 的 ADMIN_ORIGIN 和 GitHub App 的 Homepage URL；原 Worker 的 /callback 回调保持不变。',
  ]) steps.append(el('li', text));
  const link = el('a', '查看官方域名配置说明 ↗');
  link.href = 'https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site';
  link.target = '_blank'; link.rel = 'noopener noreferrer'; guide.append(steps, link); panel.append(guide);
}
