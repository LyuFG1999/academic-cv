export async function initializeOAuth(login, message) {
  const button = document.querySelector('#oauth-login');
  const help = document.querySelector('#auth-help');
  try {
    const config = await fetch('./auth-config.json', { cache: 'no-store' }).then(r => r.json());
    if (!config.authOrigin) {
      button.disabled = true;
      help.textContent = '登录服务尚未配置，请联系网站管理员。';
      return;
    }
    const origin = new URL(config.authOrigin).origin;
    if (!origin.startsWith('https://')) throw new Error('认证服务必须使用 HTTPS。');
    help.textContent = '仅限已授权的网站管理员。';
    button.addEventListener('click', () => {
      const nonce = crypto.randomUUID();
      const popup = window.open(`${origin}/auth?nonce=${nonce}`, 'academic-github-login', 'width=620,height=740');
      if (!popup) { message('请允许此网站打开 GitHub 授权弹窗。', true); return; }
      button.disabled = true;
      let interval, timeout;
      const cleanup = () => { window.removeEventListener('message', receive); clearInterval(interval); clearTimeout(timeout); button.disabled = false; };
      const receive = event => {
        if (event.origin !== origin || event.source !== popup || event.data?.type !== 'academic-github-auth' || event.data.nonce !== nonce) return;
        cleanup(); popup.close();
        if (typeof event.data.token === 'string' && event.data.token) login(event.data.token);
        else message('GitHub 授权未完成。请确认 App 已安装到 academic-cv 仓库后重试。', true);
      };
      window.addEventListener('message', receive);
      interval = setInterval(() => { if (popup.closed) { cleanup(); message('授权窗口已关闭。如未登录，请重试。'); } }, 1000);
      timeout = setTimeout(() => { cleanup(); popup.close(); message('授权超时，请重新登录。', true); }, 600000);
    });
  } catch (error) { button.disabled = true; help.textContent = error.message || '认证配置读取失败，请刷新。'; }
}
