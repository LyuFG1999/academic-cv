import test from 'node:test';
import assert from 'node:assert/strict';
import { zipSync, strToU8 } from 'fflate';
import { importBlogFile, insertLink, managedFiles } from '../src/admin/blog-files.js';
import { serializePost } from '../src/admin/blog.js';
import { editablePath } from '../src/admin/github.js';
import { parse } from 'yaml';
const file = (name, bytes) => ({ name, arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) });
const zip = entries => file('article.zip', zipSync(Object.fromEntries(Object.entries(entries).map(([k,v])=>[k,strToU8(v)]))));
test('plain Markdown parses body and metadata; serializes quoted dates', async () => {
  const result = await importBlogFile(file('article.md', strToU8('---\ntitle: 中文标题\ndate: 2026-09-06\n---\n# 内容\n\nhello')), 'test');
  assert.equal(result.data.title, '中文标题'); assert(!result.body.includes('date:'));
  const post = serializePost({ edited:true, data:result.data, body:result.body });
  assert.match(post, /"date": "2026-09-06"/);
  assert.equal(typeof parse(post.split('---')[1]).date, 'string');
});
test('ZIP rewrites inline/reference resources, ignores extra images and code examples', async () => {
  const result = await importBlogFile(zip({ 'post.md': '# 论文\n\n![中文](./assets/a%20b.png)\n\n[下载][pdf]\n\n[pdf]: assets/doc.pdf\n\n```md\n![demo](assets/unused.png)\n```', 'assets/a b.png':'png', 'assets/doc.pdf':'pdf', 'assets/unused.png':'unused' }), 'post-1');
  assert.equal(result.uploads.length, 2); assert.equal(result.files.length,2);
  assert.match(result.body,/\/uploads\/blog\/post-1\//);
  assert.match(result.body,/assets\/unused.png/);
  assert(!result.body.includes('assets/doc.pdf')); assert(!result.body.includes('assets/a%20b.png'));
  result.uploads.forEach(item => assert(editablePath(item.path)));
});
test('ZIP rejects invalid structure, traversal, missing files, active content and large entries', async () => {
  for (const entries of [ {'a.md':'a','b.md':'b'}, {'a.md':'a','secret.txt':'s'}, {'a.md':'a','assets/../bad.png':'s'}, {'a.md':'![missing](assets/no.png)'}, {'a.md':'<script>alert(1)</script>'}, {'a.md':'a','assets/large.png':'a'.repeat(21*1024*1024)} ]) await assert.rejects(importBlogFile(zip(entries),'test'));
});
test('MD with local images asks for a ZIP, remote images remain usable', async () => {
  await assert.rejects(importBlogFile(file('a.md',strToU8('![a](assets/a.png)')),'a'), /ZIP/);
  const result = await importBlogFile(file('a.md',strToU8('![a](https://example.com/a.png)')),'a');
  assert.equal(result.uploads.length,0);
});
test('file manager recovers legacy references and uses exactly one base prefix', () => {
  const files = managedFiles({ data:{attachments:[{label:'报告',file:'/uploads/a.pdf'}]}, body:'![图](/academic-cv/uploads/a.png)' });
  assert.equal(files.length,2); assert.match(insertLink(files[0]),/!\[图\]\(<\/academic-cv\/uploads\/a.png>\)/);
  assert(!editablePath('public/uploads/blog/../x.png'));
});
