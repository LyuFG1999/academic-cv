import { parse } from 'yaml';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import remarkGfm from 'remark-gfm';
import { unzip } from 'fflate';

const markdown = unified().use(remarkParse).use(remarkGfm).use(remarkStringify);
export const MAX_FILE = 20 * 1024 * 1024;
const MAX_MD = 2 * 1024 * 1024;
const extension = name => name.split('.').pop().toLowerCase();
export const isImage = name => /\.(png|jpe?g|gif|webp|avif)$/i.test(name.split(/[?#]/)[0]);
export const validFile = name => /\.(pdf|docx?|xlsx?|pptx?|csv|txt|zip|png|jpe?g|gif|webp|avif)$/i.test(name);
export const fileURL = (url, base = '/academic-cv') => url.startsWith('/uploads/') ? base + url : url;
export function insertLink(file, base = '/academic-cv') {
  const label = file.name.replace(/[\[\]\\\r\n]/g, '_');
  return `${isImage(file.url) ? '!' : ''}[${label}](<${fileURL(file.url, base)}>)`;
}
const walk = (node, fn) => { fn(node); node.children?.forEach(child => walk(child, fn)); };
export function resourceNodes(body) {
  const tree = markdown.parse(body);
  const refs = new Set();
  walk(tree, node => { if (['imageReference', 'linkReference'].includes(node.type)) refs.add(node.identifier); });
  const nodes = [];
  walk(tree, node => {
    if (['image', 'link'].includes(node.type) || node.type === 'definition' && refs.has(node.identifier)) nodes.push(node);
  });
  return { tree, nodes };
}
export function managedFiles(post) {
  const found = new Map((post.data.files || []).map(file => [file.url, file]));
  const add = (url, name) => {
    url = url?.replace(/^\/academic-cv(?=\/uploads\/)/, '');
    if (url && (/^\/uploads\//.test(url) || /^https?:\/\//.test(url)) && !found.has(url)) found.set(url, { url, name: name || url.split('/').pop() });
  };
  resourceNodes(post.body).nodes.forEach(node => { if (/^\/(academic-cv\/)?uploads\//.test(node.url)) add(node.url, node.alt); });
  post.data.attachments?.forEach(item => add(item.file, item.label));
  if (post.data.featuredImage) add(post.data.featuredImage);
  return [...found.values()];
}
export function parseImport(text, filename) {
  text = text.replace(/^\uFEFF/, '');
  let data = {}, body = text;
  if (/^---\r?\n/.test(text)) {
    const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)([\s\S]*)$/);
    if (!match) throw new Error('Markdown 顶部的 YAML 信息没有正确结束。');
    const raw = parse(match[1], { maxAliasCount: 20 });
    if (raw && (typeof raw !== 'object' || Array.isArray(raw))) throw new Error('文章信息必须是 YAML 对象。');
    for (const key of ['title', 'excerpt']) if (typeof raw?.[key] === 'string') data[key] = raw[key];
    if (['zh', 'en'].includes(raw?.language)) data.language = raw.language;
    if (raw?.date) {
      const date = new Date(raw.date);
      if (Number.isNaN(date.getTime())) throw new Error('文章日期无效。');
      data.date = date.toISOString().slice(0, 10);
    }
    if (Array.isArray(raw?.tags)) data.tags = raw.tags.filter(tag => typeof tag === 'string');
    body = match[2];
  }
  walk(markdown.parse(body), node => {
    if (node.type === 'html' && /<\s*\/?\s*(script|iframe|object|embed|style|link|meta)\b|\bon\w+\s*=|javascript\s*:/i.test(node.value)) throw new Error('导入不接受脚本或可执行 HTML，请使用普通 Markdown。');
  });
  data.title ||= body.match(/^#\s+(.+)$/m)?.[1] || filename.replace(/\.md$/i, '');
  return { data, body };
}
const extract = (bytes, filter) => new Promise((resolve, reject) => {
  unzip(bytes, { filter }, (error, files) => error ? reject(error) : resolve(files));
});
function assetPath(url) {
  if (/^(https?:|mailto:|#|\/uploads\/|\/academic-cv\/uploads\/)/i.test(url)) return null;
  let value;
  try { value = decodeURIComponent(url.split(/[?#]/)[0]); } catch { throw new Error(`资源路径无法解析：${url}`); }
  value = value.replace(/^\.\//, '');
  if (!value.startsWith('assets/') || value.split('/').some(segment => segment === '..' || segment === '.') || /[\\\x00-\x1f]/.test(value)) throw new Error(`本地资源必须放在 ./assets/：${url}`);
  return value;
}
export async function importBlogFile(file, slug) {
  if (file.size > 40 * 1024 * 1024) throw new Error('导入文件不能超过 40 MB。');
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (bytes.length > 40 * 1024 * 1024) throw new Error('导入文件不能超过 40 MB。');
  if (/\.md$/i.test(file.name)) {
    if (bytes.length > MAX_MD) throw new Error('Markdown 不能超过 2 MB。');
    const result = parseImport(new TextDecoder('utf-8', { fatal: true }).decode(bytes), file.name);
    const missing = resourceNodes(result.body).nodes.filter(node => assetPath(node.url));
    if (missing.length) throw new Error('正文含本地资源，请将 Markdown 与 assets 文件夹打包成 ZIP 后导入。');
    return { ...result, files: [], uploads: [] };
  }
  if (!/\.zip$/i.test(file.name)) throw new Error('请选择 .md 或 .zip 文件。');
  const entries = new Map(); let total = 0;
  // Inspect central-directory metadata before decompressing any entry.
  await extract(bytes, entry => {
    const { name, originalSize } = entry;
    if (entries.size >= 300 || entries.has(name) || /[\\\x00-\x1f]/.test(name) || name.startsWith('/') || name.split('/').some(part => part === '..' || part === '.')) throw new Error('ZIP 包含重复、不安全或过多的路径。');
    if (!/^[^/]+\.md$/i.test(name) && !name.startsWith('assets/')) throw new Error('ZIP 根目录只能包含一个 .md 文件和 assets 文件夹。');
    if (originalSize > MAX_FILE || (total += originalSize) > 100 * 1024 * 1024) throw new Error('解压后单文件限 20 MB，总大小限 100 MB。');
    entries.set(name, originalSize); return false;
  });
  const md = [...entries.keys()].filter(name => /^[^/]+\.md$/i.test(name));
  if (md.length !== 1 || entries.get(md[0]) > MAX_MD) throw new Error('ZIP 必须只有一个不超过 2 MB 的根目录 Markdown 文件。');
  const textFiles = await extract(bytes, entry => entry.name === md[0]);
  const result = parseImport(new TextDecoder('utf-8', { fatal: true }).decode(textFiles[md[0]]), md[0]);
  const { tree, nodes } = resourceNodes(result.body);
  if (/<(?:img|a)\b[^>]*(?:src|href)\s*=/i.test(result.body)) throw new Error('ZIP 导入请使用 Markdown 图片与链接语法，不使用 HTML img/a 标签。');
  const mapping = new Map();
  for (const node of nodes) {
    const path = assetPath(node.url); if (!path) continue;
    if (!entries.has(path)) throw new Error(`ZIP 缺少正文引用的文件：${path}`);
    if (!validFile(path)) throw new Error(`不支持的资源类型：${path}`);
    if (!mapping.has(path)) mapping.set(path, `/uploads/blog/${slug}/${crypto.randomUUID()}.${extension(path)}`);
    node.url = mapping.get(path) + (node.url.match(/[?#].*$/)?.[0] || '');
  }
  const resources = await extract(bytes, entry => mapping.has(entry.name));
  return { ...result, body: markdown.stringify(tree), files: [...mapping].map(([name, url]) => ({ name: name.split('/').pop(), url })), uploads: [...mapping].map(([name, url]) => ({ path: 'public' + url, bytes: resources[name] })) };
}
