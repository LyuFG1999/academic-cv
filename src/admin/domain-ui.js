export function renderDomainPanel({ settings, section, el, base }) {
  settings.domain ||= { hostname: 'fengguanglyu.com' };
  const panel = section('domain', '域名与访问', [{name:'hostname',label:'目标域名（仅保存计划，不会自动绑定）',widget:'string',required:false,pattern:['(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\\.)+[a-zA-Z]{2,63}','填写域名，不包含 https:// 或路径']}], settings.domain, '网站路径会跟随 GitHub Pages 的实际绑定自动调整。DNS 和授权服务需在对应平台设置。');
  const current=el('p',`当前访问地址：${location.origin}${base}/`,'hint');panel.append(current);
  const guide=el('div',undefined,'domain-guide');
  guide.append(el('h3','连接 fengguanglyu.com'));
  const steps=el('ol');
  for(const text of [
    '建议先在 GitHub 账户 Settings → Pages 验证域名所有权（按提示在腾讯云添加 TXT）。',
    '在仓库 Settings → Pages → Custom domain 填写 fengguanglyu.com 并保存，再设置腾讯云 DNS。',
    '在腾讯云 DNSPod 为 @ 添加下表四条 A 记录。可选：www 添加 CNAME，指向 lyufg1999.github.io；不要填仓库路径。已有同名解析需要先确认用途，不要删除 MX 邮件记录。',
    '重新运行一次网站发布：构建会读取 GitHub Pages 的实际域名，把 /academic-cv 路径自动切换成域名根路径。',
    'DNS 检查通过、证书就绪后，在 GitHub Pages 开启 Enforce HTTPS。',
    'Cloudflare 登录 Worker 的 ADMIN_ORIGIN 改为 https://fengguanglyu.com；GitHub App 的 Homepage URL 改为 https://fengguanglyu.com/admin/。OAuth 回调仍使用原来的 Worker /callback 地址。',
  ])steps.append(el('li',text));guide.append(steps);
  const table=el('table');const header=el('tr');['主机','类型','记录值'].forEach(value=>header.append(el('th',value)));table.append(header);
  for(const address of ['185.199.108.153','185.199.109.153','185.199.110.153','185.199.111.153']){const row=el('tr');['@','A',address].forEach(value=>row.append(el('td',value)));table.append(row);}guide.append(table);
  for(const [label,url] of [['GitHub Pages 设置','https://github.com/LyuFG1999/academic-cv/settings/pages'],['腾讯云 DNSPod 控制台','https://console.cloud.tencent.com/cns'],['GitHub 域名说明','https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site']]){const link=el('a',label);link.href=url;link.target='_blank';link.rel='noopener noreferrer';guide.append(link);}
  guide.append(el('p','填写此处域名不会修改 DNS、GitHub 设置或登录权限。请勿在上述步骤完成前停用当前地址。','hint'));panel.append(guide);
}
