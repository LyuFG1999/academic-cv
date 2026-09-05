// GitHub App OAuth callback for Cloudflare Workers. No database or build hooks.
const random = () => Array.from(crypto.getRandomValues(new Uint8Array(32)), b => b.toString(16).padStart(2, '0')).join('');
const cookieName = '__Host-academic-oauth';
const cookie = (value, age = 600) => `${cookieName}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${age}`;
const safeJSON = value => JSON.stringify(value).replace(/</g, '\\u003c');
function reply(text, status = 200, extra = {}) {
  return new Response(text, { status, headers: { 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer', 'X-Content-Type-Options': 'nosniff', ...extra } });
}
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method !== 'GET') return reply('Method not allowed', 405);
    if (url.pathname === '/health') return reply(JSON.stringify({ configured: Boolean(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET) }), 200, { 'Content-Type': 'application/json' });
    if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET || !env.ADMIN_ORIGIN || !env.ALLOWED_USER || !env.REPOSITORY) return reply('Authentication service needs configuration.', 503);
    let admin;
    try { admin = new URL(env.ADMIN_ORIGIN); } catch { return reply('Invalid configuration', 503); }
    if (admin.protocol !== 'https:' || admin.origin !== env.ADMIN_ORIGIN) return reply('Invalid admin origin', 503);
    const callback = url.origin + '/callback';
    if (url.pathname === '/auth') {
      const nonce = url.searchParams.get('nonce');
      if (!/^[a-f0-9-]{36}$/.test(nonce || '')) return reply('Invalid login nonce', 400);
      const state = random(), verifier = random();
      const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)));
      const challenge = btoa(String.fromCharCode(...digest)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      const authorize = new URL('https://github.com/login/oauth/authorize');
      authorize.search = new URLSearchParams({ client_id: env.GITHUB_CLIENT_ID, redirect_uri: callback, state,
        code_challenge: challenge, code_challenge_method: 'S256', allow_signup: 'false' }).toString();
      return reply('', 302, { Location: authorize.href, 'Set-Cookie': cookie(`${state}.${nonce}.${verifier}`) });
    }
    if (url.pathname !== '/callback') return reply('Not found', 404);
    const stored = (request.headers.get('Cookie') || '').split(';').map(v => v.trim()).find(v => v.startsWith(cookieName + '='))?.slice(cookieName.length + 1);
    const [state, nonce, verifier] = (stored || '').split('.');
    if (!state || !verifier || !/^[a-f0-9-]{36}$/.test(nonce || '') || url.searchParams.get('state') !== state || !url.searchParams.get('code')) {
      return reply('Invalid or expired login. Close this window and try again.', 400, { 'Set-Cookie': cookie('', 0) });
    }
    try {
      const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: env.GITHUB_CLIENT_ID, client_secret: env.GITHUB_CLIENT_SECRET,
          code: url.searchParams.get('code'), redirect_uri: callback, code_verifier: verifier }),
      });
      const token = await tokenResponse.json();
      if (!tokenResponse.ok || !token.access_token) throw new Error('exchange');
      const headers = { Authorization: `Bearer ${token.access_token}`, Accept: 'application/vnd.github+json', 'User-Agent': 'academic-cv-auth' };
      const profileResponse = await fetch('https://api.github.com/user', { headers });
      const profile = await profileResponse.json();
      if (!profileResponse.ok || profile.login?.toLowerCase() !== env.ALLOWED_USER.toLowerCase()) throw new Error('user');
      const repoResponse = await fetch(`https://api.github.com/repos/${env.REPOSITORY}`, { headers });
      const repo = await repoResponse.json();
      if (!repoResponse.ok || !repo.permissions?.push) throw new Error('repository');
      const scriptNonce = random();
      const payload = { type: 'academic-github-auth', nonce, token: token.access_token };
      // Never put tokens in redirects, logs or persistent storage. Do not retain refresh tokens.
      return reply(`<!doctype html><meta charset="utf-8"><title>GitHub 授权完成</title><p>授权完成，可关闭此窗口。</p><script nonce="${scriptNonce}">if(window.opener){window.opener.postMessage(${safeJSON(payload)},${safeJSON(admin.origin)});window.close();}</script>`, 200, {
        'Content-Type': 'text/html; charset=utf-8', 'Set-Cookie': cookie('', 0),
        'Content-Security-Policy': `default-src 'none'; script-src 'nonce-${scriptNonce}'; base-uri 'none'; frame-ancestors 'none'`,
      });
    } catch {
      return reply('GitHub authorization failed. Confirm that this GitHub App is installed on academic-cv and has Contents read/write permission, then close this window and retry.', 403, { 'Set-Cookie': cookie('', 0) });
    }
  },
};
