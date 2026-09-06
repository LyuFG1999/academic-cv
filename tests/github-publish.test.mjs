import test from 'node:test';
import assert from 'node:assert/strict';
import { publishBatch } from '../src/admin/github.js';
import worker from '../auth-worker/worker.js';
import { serializePost } from '../src/admin/blog.js';
import remarkBase from '../src/lib/remark-base.mjs';

test('Markdown downloads and images get exactly one Pages prefix', () => {
  const tree = { children: [{ type: 'link', url: '/uploads/paper.pdf' }, { type:'image', url:'/academic-cv/uploads/a.png' }, {type:'link',url:'https://example.com/a'}] };
  remarkBase({base:'/academic-cv'})(tree);
  assert.deepEqual(tree.children.map(v=>v.url), ['/academic-cv/uploads/paper.pdf','/academic-cv/uploads/a.png','https://example.com/a']);
});

test('settings, article, deletion and attachment publish in one non-force update', async () => {
  const calls = [];
  const request = async (path, body, method) => {
    calls.push({ path, body, method });
    if (path === 'git/ref/heads/main') return { object: { sha: 'head' } };
    if (path.startsWith('git/trees/')) return { sha: 'base-tree', tree: [{ path: 'src/data/site-settings.json', sha: 'old' }, { path: 'src/content/BlogPosts/removed.md', sha: 'removed' }] };
    if (path === 'git/blobs') return { sha: 'blob' + calls.length };
    if (path === 'git/trees') return { sha: 'new-tree' };
    if (path === 'git/commits') return { sha: 'new-commit' };
    return {};
  };
  const result = await publishBatch([
    { path: 'src/data/site-settings.json', originalSha: 'old', content: '{}' },
    { path: 'src/content/BlogPosts/new.md', originalSha: null, content: 'new' },
    { path: 'src/content/BlogPosts/removed.md', originalSha: 'removed', content: null },
    { path: 'public/uploads/test.pdf', originalSha: null, content: 'YWJj', encoding: 'base64' },
  ], request);
  assert.equal(result.commit, 'new-commit');
  assert.equal(calls.filter(c => c.path === 'git/commits').length, 1);
  assert.deepEqual(calls.at(-1), { path: 'git/refs/heads/main', body: { sha: 'new-commit', force: false }, method: 'PATCH' });
  assert.equal(calls.find(c => c.path === 'git/trees').body.base_tree, 'base-tree');
  assert.equal(result.entries.find(e => e.path.endsWith('removed.md')).sha, null);
});
test('conflict blocks writes and unchanged batch is a no-op', async () => {
  let writes = 0;
  const request = async (path, body) => {
    if (body) writes++;
    return path.includes('/ref/') ? { object: { sha: 'head' } } : { tree: [{ path: 'src/data/site-settings.json', sha: 'different' }] };
  };
  assert.equal(await publishBatch([], request), null);
  await assert.rejects(publishBatch([{ path: 'src/data/site-settings.json', originalSha: 'old', content: '{}' }], request), /其他操作修改/);
  assert.equal(writes, 0);
  await assert.rejects(publishBatch([{ path: '.github/workflows/deploy.yml', content: 'unsafe' }], request), /禁止修改/);
});
test('unchanged Markdown remains byte identical', () => {
  assert.equal(serializePost({ original: '---\ntitle: old\n---\ntext', edited: false }), '---\ntitle: old\n---\ntext');
});
const env = { GITHUB_CLIENT_ID: 'test-id', GITHUB_CLIENT_SECRET: 'test-secret', ADMIN_ORIGIN: 'https://fengguanglyu.com', ALLOWED_USER: 'LyuFG1999', REPOSITORY: 'LyuFG1999/academic-cv' };
test('OAuth uses secure cookie, state and PKCE; rejects forged callbacks', async () => {
  const response = await worker.fetch(new Request('https://auth.example/auth?nonce=12345678-1234-1234-1234-123456789abc'), env);
  assert.equal(response.status, 302);
  const location = new URL(response.headers.get('location'));
  assert.equal(location.origin, 'https://github.com');
  assert.equal(location.searchParams.get('code_challenge_method'), 'S256');
  assert.equal(location.searchParams.get('code_challenge').length, 43);
  assert.match(response.headers.get('set-cookie'), /HttpOnly; Secure; SameSite=Lax/);
  const forged = await worker.fetch(new Request('https://auth.example/callback?code=x&state=forged', { headers: { Cookie: response.headers.get('set-cookie') } }), env);
  assert.equal(forged.status, 400);
  assert.equal((await worker.fetch(new Request('https://auth.example/auth?nonce=bad'), env)).status, 400);
});
test('successful OAuth restricts user and returns token only to configured origin', async () => {
  const originalFetch = globalThis.fetch;
  const start = await worker.fetch(new Request('https://auth.example/auth?nonce=12345678-1234-1234-1234-123456789abc'), env);
  const state = new URL(start.headers.get('location')).searchParams.get('state');
  try {
    globalThis.fetch = async url => Response.json(String(url).includes('access_token') ? { access_token: 'TEST-NOT-A-REAL-TOKEN' }
      : String(url).endsWith('/user') ? { login: 'LyuFG1999' } : { permissions: { push: true } });
    const result = await worker.fetch(new Request(`https://auth.example/callback?code=x&state=${state}`, { headers: { Cookie: start.headers.get('set-cookie') } }), env);
    assert.equal(result.status, 200);
    const html = await result.text();
    assert.match(html, /postMessage/); assert.match(html, /https:\/\/fengguanglyu.com/);
    assert.equal(result.headers.get('location'), null);
    assert.match(result.headers.get('cache-control'), /no-store/);
    assert.match(result.headers.get('content-security-policy'), /frame-ancestors 'none'/);
    assert.match(result.headers.get('set-cookie'), /Max-Age=0/);
  } finally { globalThis.fetch = originalFetch; }
});
