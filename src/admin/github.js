// Credentials stay in this module's memory, never in drafts, URLs or browser storage.
export const repository = 'LyuFG1999/academic-cv';
let credential = '';
export function setCredential(value) { credential = value.trim(); }
export async function api(path, body, method = body ? 'POST' : 'GET') {
  if (!credential) throw new Error('请先登录后台。');
  const response = await fetch(`https://api.github.com/repos/${repository}${path ? '/' + path : ''}`, {
    method, cache: 'no-store', headers: {
      Authorization: `Bearer ${credential}`, Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28', 'Content-Type': 'application/json',
    }, ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!response.ok) {
    const error = new Error(response.status === 401 ? '登录失效，请重新授权。'
      : response.status === 403 ? 'GitHub 拒绝操作：请检查本仓库 Contents 读写权限、分支保护或 API 用量。'
      : response.status === 404 ? '无法读取仓库或文件，请检查仓库授权。'
      : [409, 422].includes(response.status) ? '仓库发生了并发修改或分支规则拒绝发布。输入已保留，请重新读取后合并。'
      : `GitHub 请求失败（${response.status}），请稍后重试。`);
    error.status = response.status;
    throw error;
  }
  return response.status === 204 ? null : response.json();
}
export const editablePath = path => /^src\/data\/(site-settings|cv\.(zh|en)|courses\.(zh|en))\.json$/.test(path)
  || /^src\/content\/BlogPosts\/[a-zA-Z0-9_/-]+\.md$/.test(path) && !path.includes('..')
  || /^public\/uploads\/(?:blog\/[a-zA-Z0-9_-]+\/)?[a-zA-Z0-9_-]+\.[a-zA-Z0-9]+$/.test(path);

// Verify every modified path against the original snapshot; unrelated edits survive.
// One non-force ref update publishes the complete batch, including file deletions.
export async function publishBatch(changes, request = api) {
  if (!changes.length) return null;
  if (changes.some(item => !editablePath(item.path))) throw new Error('禁止修改后台内容目录以外的文件。');
  const { object: { sha: head } } = await request('git/ref/heads/main');
  const current = await request(`git/trees/${head}?recursive=1`);
  if (current.truncated) throw new Error('仓库文件过多，无法安全检查并发修改。');
  const shas = new Map(current.tree.map(entry => [entry.path, entry.sha]));
  for (const item of changes) {
    if ((shas.get(item.path) ?? null) !== item.originalSha) throw new Error(`文件已被其他操作修改：${item.path}。请保留草稿并合并最新内容。`);
  }
  const entries = await Promise.all(changes.map(async item => ({
    path: item.path, mode: '100644', type: 'blob',
    sha: item.content === null ? null : (await request('git/blobs', { content: item.content, encoding: item.encoding ?? 'utf-8' })).sha,
  })));
  const tree = await request('git/trees', { base_tree: current.sha, tree: entries });
  const commit = await request('git/commits', { message: '统一发布网站设置、博客与附件', tree: tree.sha, parents: [head] });
  await request('git/refs/heads/main', { sha: commit.sha, force: false }, 'PATCH');
  return { commit: commit.sha, entries };
}
