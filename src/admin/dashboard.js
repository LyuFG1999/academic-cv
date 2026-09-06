import { parse } from 'yaml';
import { renderBlog, serializePost } from './blog.js';
import { api, publishBatch, repository, setCredential } from './github.js';
import { draftStore } from './drafts.js';
import { initializeOAuth } from './oauth.js';
import { renderCitationImport } from './citation-ui.js';
import { renderDomainPanel } from './domain-ui.js';
const form = document.querySelector('#settings-form');
const statusMessage = document.querySelector('#status');
const saveButton = document.querySelector('#save');
const nav = document.querySelector('#section-nav');
const paths = ['src/data/site-settings.json', 'src/data/cv.zh.json', 'src/data/cv.en.json', 'src/data/courses.zh.json', 'src/data/courses.en.json'];
const files = new Map();
const uploads = new Map();
const posts = new Map();
const base = import.meta.env.BASE_URL.replace(/\/$/, '');
const draftKey = `${repository}:draft-v2`;
let schema, settings, cv, courses, dirty = false, busy = false, loaded = false, user, pollTimer;
let pendingUploads = 0;
const previewURLs = new Set();
function updateButtons() {
  saveButton.disabled = !loaded || !dirty || busy || pendingUploads > 0;
  document.querySelector('#save-draft').disabled = !loaded || busy || pendingUploads > 0;
  document.querySelector('#discard-draft').disabled = !loaded || busy || pendingUploads > 0;
}
function uploading(delta) { pendingUploads += delta; updateButtons(); }
function clearPreviews() { previewURLs.forEach(url => URL.revokeObjectURL(url)); previewURLs.clear(); }

function el(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}
function message(text, error = false) { statusMessage.textContent = text; statusMessage.dataset.error = String(error); }
function changed() { dirty = true; updateButtons(); message('有未发布的修改'); }
function bytesToBase64(bytes) {
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += 8192) binary += String.fromCharCode(...bytes.subarray(offset, offset + 8192));
  return btoa(binary);
}
function decode(content) { return new TextDecoder().decode(Uint8Array.from(atob(content.replace(/\s/g, '')), c => c.charCodeAt(0))); }
const sharedFields = new Set(['category', 'sortDate', 'field', 'doi']);
function pairSchema(fields) {
  return fields.map(field => field.widget === 'list' ? { ...field, fields: pairSchema(field.fields || []) } : sharedFields.has(field.name) ? field : {
    name: field.name, label: field.label, widget: 'object', fields: ['zh', 'en'].map(lang => ({ ...field, name: lang, label: lang === 'zh' ? '中文' : 'English' })),
  });
}
function pairData(fields, zh = {}, en = {}) {
  return Object.fromEntries(fields.map(field => [field.name, field.widget === 'list'
    ? Array.from({ length: Math.max(zh[field.name]?.length || 0, en[field.name]?.length || 0) }, (_, i) => pairData(field.fields || [], zh[field.name]?.[i], en[field.name]?.[i]))
    : sharedFields.has(field.name) ? (zh[field.name] ?? en[field.name] ?? field.default ?? '')
    : { zh: zh[field.name] ?? '', en: en[field.name] ?? '' }]));
}
function unpairData(fields, data, lang) {
  return Object.fromEntries(fields.map(field => [field.name, field.widget === 'list'
    ? (data[field.name] || []).map(item => unpairData(field.fields || [], item, lang))
    : sharedFields.has(field.name) ? data[field.name] : data[field.name]?.[lang] ?? '']));
}
function defaults(fields) {
  return Object.fromEntries(fields.map(field => [field.name, field.widget === 'object' ? defaults(field.fields) : field.widget === 'list' ? [] : field.default ?? (field.widget === 'boolean' ? false : '')]));
}
function fieldNode(field, owner, prefix) {
  const key = field.name;
  const id = `${prefix}-${key}`;
  if (field.widget === 'object' || field.widget === 'list') {
    if (owner[key] == null) owner[key] = field.widget === 'object' ? defaults(field.fields) : [];
    const group = el('fieldset', undefined, field.fields?.every(f => ['zh', 'en'].includes(f.name)) ? 'bilingual' : 'group');
    group.append(el('legend', field.label));
    if (field.hint) group.append(el('p', field.hint, 'hint'));
    if (field.widget === 'object') {
      const content = el('div', undefined, ['light', 'dark'].includes(key) ? 'palette' : '');
      field.fields.forEach(child => content.append(fieldNode(child, owner[key], id)));
      group.append(content);
    } else {
      const items = el('div');
      const renderItems = () => {
        items.replaceChildren();
        if (!owner[key].length) items.append(el('p', '尚无内容，点击下方按钮添加。', 'empty'));
        owner[key].forEach((item, i) => {
          const card = el('div', undefined, 'list-item');
          const header = el('div', undefined, 'item-header');
          const remove = el('button', '删除'); remove.type = 'button';
          remove.addEventListener('click', () => { owner[key].splice(i, 1); changed(); renderItems(); });
          header.append(el('strong', `第 ${i + 1} 项`), remove); card.append(header);
          (field.fields || []).forEach(child => card.append(fieldNode(child, item, `${id}-${i}`)));
          items.append(card);
        });
      };
      renderItems(); group.append(items);
      const add = el('button', `＋ 添加${field.label.split('（')[0]}`); add.type = 'button';
      add.addEventListener('click', () => { owner[key].push(defaults(field.fields || [])); changed(); renderItems(); items.lastElementChild?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); });
      group.append(add);
    }
    return group;
  }
  const label = el('div', undefined, field.widget === 'boolean' ? 'switch-field' : 'field');
  const caption = el('label', field.label); caption.htmlFor = id;
  label.append(caption);
  let input;
  if (field.widget === 'text') input = el('textarea');
  else if (field.widget === 'select') {
    input = el('select');
    (field.options || []).forEach(option => { const node = el('option', typeof option === 'string' ? option : option.label); node.value = typeof option === 'string' ? option : option.value; input.append(node); });
  } else { input = el('input'); input.type = field.widget === 'boolean' ? 'checkbox' : field.widget === 'datetime' ? 'date' : 'text'; }
  input.id = id; input.name = id;
  if (field.widget === 'boolean') { input.checked = Boolean(owner[key]); input.setAttribute('role', 'switch'); }
  else input.value = owner[key] ?? field.default ?? '';
  input.required = field.required !== false && !['boolean', 'color'].includes(field.widget);
  if (field.pattern && input.tagName === 'INPUT') { input.pattern = field.pattern[0]; input.title = field.pattern[1]; }
  input.addEventListener('input', () => { owner[key] = field.widget === 'boolean' ? input.checked : input.value; changed(); });
  if (field.widget === 'color') {
    const row = el('div', undefined, 'color-row');
    const picker = el('input'); picker.type = 'color'; picker.value = input.value; picker.setAttribute('aria-label', `${field.label}取色器`);
    input.pattern = '#[0-9a-fA-F]{6}'; input.required = true;
    picker.addEventListener('input', () => { input.value = picker.value; owner[key] = picker.value; changed(); });
    input.addEventListener('input', () => { if (/^#[\da-f]{6}$/i.test(input.value)) picker.value = input.value; });
    row.append(picker, input); label.append(row);
  } else label.append(input);
  if (field.widget === 'image') {
    const preview = el('img', undefined, 'avatar-preview'); preview.alt = '头像预览';
    const refreshPreview = () => {
      const value = owner[key] || '/uploads/avatar.svg';
      const staged = uploads.get('public' + value);
      preview.src = staged ? `data:image/${value.split('.').pop()};base64,${staged}` : /^https?:\/\//.test(value) ? value : base + value;
    };
    refreshPreview(); input.addEventListener('change', refreshPreview);
    const upload = el('input'); upload.type = 'file'; upload.accept = 'image/png,image/jpeg,image/webp,image/gif'; upload.setAttribute('aria-label', '上传共用头像');
    upload.addEventListener('change', async () => {
      const file = upload.files[0]; if (!file) return;
      if (!['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(file.type) || file.size > 10 * 1024 * 1024) { message('请选择不超过 10 MB 的 PNG、JPG、WebP 或 GIF 图片。', true); return; }
      uploading(1);
      try {
        const path = `public/uploads/avatar-${crypto.randomUUID()}.${file.type.split('/')[1]}`;
        const content = bytesToBase64(new Uint8Array(await file.arrayBuffer()));
        uploads.delete('public' + owner[key]);
        uploads.set(path, content);
        owner[key] = '/' + path.slice('public/'.length); input.value = owner[key];
        const objectURL = URL.createObjectURL(file); previewURLs.add(objectURL); preview.src = objectURL; changed();
      } catch { message('图片读取失败，请重新选择。', true); }
      finally { uploading(-1); }
    });
    label.append(preview, upload);
  }
  if (field.hint) label.append(el('small', field.hint, 'hint'));
  return label;
}
function section(id, title, fields, owner, hint) {
  const panel = el('section', undefined, 'settings-section'); panel.id = `section-${id}`; panel.hidden = true;
  panel.dataset.title = title;
  const header = el('div', undefined, 'section-header'); header.append(el('h2', title)); if (hint) header.append(el('p', hint, 'hint')); panel.append(header);
  const content = el('div', undefined, 'fields'); fields.forEach(field => content.append(fieldNode(field, owner, id))); panel.append(content); form.append(panel);
  const link = el('a', title); link.href = '#' + panel.id; link.setAttribute('aria-controls', panel.id); nav.append(link);
  link.addEventListener('click', event => { event.preventDefault(); selectPanel(panel.id); history.replaceState(null, '', '#' + panel.id); window.scrollTo({ top: 0 }); });
  return panel;
}
function selectPanel(id) {
  const panels = [...form.querySelectorAll('.settings-section')];
  const selected = panels.find(panel => panel.id === id) || panels[0];
  if (!selected) return;
  panels.forEach(panel => panel.hidden = panel !== selected);
  [...nav.children].forEach(link => {
    if (link.getAttribute('aria-controls') === selected.id) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  document.querySelector('#panel-title').textContent = selected.dataset.title;
}
window.addEventListener('hashchange', () => { if (loaded) selectPanel(location.hash.slice(1)); });
function render() {
  nav.replaceChildren(); form.replaceChildren();
  const get = name => schema.settings.find(field => field.name === name);
  section('profile', '个人资料', [get('avatar'), ...get('profile').fields.filter(f => !['projects', 'researchAreas'].includes(f.name))], new Proxy(settings.profile, {
    get(target, key) { return key === 'avatar' ? settings.avatar : target[key]; },
    set(target, key, value) { if (key === 'avatar') settings.avatar = value; else target[key] = value; return true; },
  }), '姓名、身份与机构。中英文共用一张头像。');
  section('research', '研究与项目', get('profile').fields.filter(f => ['projects', 'researchAreas'].includes(f.name)), settings.profile);
  section('navigation', '导航与论文分类', get('navigation').fields, settings.navigation, '开关控制导航是否显示。三类成果可以独立开关、任意组合。');
  section('social', '联系方式', get('social').fields, settings.social, '开启并填写链接后，显示在首页与开场页。');
  const cvPanel = section('cv', '履历与成果', pairSchema(schema.cv), cv, '每条经历或成果只添加一次，在同一处填写中英文。');
  renderCitationImport({panel: cvPanel, cv, el, changed, message, uploading, rerender: render});
  section('courses', '课程', pairSchema(schema.courses), courses);
  section('appearance', '外观与配色', get('appearance').fields, settings.appearance);
  section('maintenance', '网站维护', get('maintenance').fields, settings.maintenance, '发布完成后生效，管理后台仍可使用。');
  renderDomainPanel({ settings, section, el, base });
  renderBlog({ posts, uploads, section, fieldNode, el, changed, message, bytesToBase64, uploading, base });
  selectPanel(location.hash.slice(1));
}
async function load() {
  if (loaded || busy) return;
  busy = true; updateButtons(); message('正在读取内容…');
  try {
    schema = await fetch('./schema.json', { cache: 'no-store' }).then(r => { if (!r.ok) throw new Error('设置表单加载失败，请刷新重试。'); return r.json(); });
    const head = (await api('git/ref/heads/main')).object.sha;
    await Promise.all(paths.map(async path => {
      const file = await api(`contents/${path}?ref=${head}`); files.set(path, { sha: file.sha, data: JSON.parse(decode(file.content)) });
    }));
    const tree = await api(`git/trees/${head}?recursive=1`);
    if (tree.truncated) throw new Error('仓库目录不完整，无法安全加载。');
    posts.clear();
    for (const entry of tree.tree.filter(item => item.path.startsWith('src/content/BlogPosts/') && item.path.endsWith('.md'))) {
      const blob = await api(`git/blobs/${entry.sha}`);
      const original = decode(blob.content);
      const match = original.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)([\s\S]*)$/);
      if (!match) throw new Error(`文章格式错误：${entry.path}`);
      posts.set(entry.path, { sha: entry.sha, original, data: parse(match[1]), body: match[2].trimStart(), deleted: false });
    }
    settings = structuredClone(files.get(paths[0]).data);
    cv = pairData(schema.cv, files.get(paths[1]).data, files.get(paths[2]).data);
    courses = pairData(schema.courses, files.get(paths[3]).data, files.get(paths[4]).data);
    let restored = false;
    try {
      const draft = await draftStore('get', draftKey);
      if (draft && confirm('发现此浏览器保存的未发布草稿。是否恢复？发布时会检查是否与最新仓库冲突。')) {
        ({ settings, cv, courses } = draft);
        files.clear(); draft.files.forEach(([key, value]) => files.set(key, value));
        posts.clear(); draft.posts.forEach(([key, value]) => posts.set(key, value));
        uploads.clear(); draft.uploads.forEach(([key, value]) => uploads.set(key, value));
        dirty = restored = true;
      }
    } catch { message('无法读取本地草稿，正在使用 GitHub 内容。', true); }
    render(); loaded = true; form.hidden = false; document.querySelector('#login-panel').hidden = true;
    document.querySelector('#save-draft').disabled = false;
    document.querySelector('#discard-draft').disabled = false;
    saveButton.disabled = !dirty;
    message(restored ? '已恢复本地草稿，尚未发布。' : '所有修改已同步。');
  } catch (error) { message(error.message, true); loaded = false; }
  finally { busy = false; updateButtons(); }
}
async function watchDeployment(commit) {
  let attempts = 0;
  clearTimeout(pollTimer);
  const check = async () => {
    try {
      const live = await fetch('./deployment.json?t=' + Date.now(), { cache: 'no-store' }).then(r => r.json());
      if (live.commit === commit) { if (!dirty) message(live.maintenance ? '已发布：网站维护模式已生效。' : '已发布：刷新网站即可查看修改。'); return; }
    } catch {}
    if (++attempts < 60) pollTimer = setTimeout(check, 5000);
    else if (!dirty) message('内容已提交，但尚未确认上线。请点击“发布记录”检查 GitHub Actions。', true);
  };
  pollTimer = setTimeout(check, 5000);
}
form.addEventListener('submit', async event => {
  event.preventDefault(); if (busy || pendingUploads || !dirty) return;
  const invalid = form.querySelector('input:invalid,textarea:invalid,select:invalid');
  if (invalid) {
    selectPanel(invalid.closest('.settings-section')?.id);
    let ancestor = invalid.parentElement;
    while (ancestor && ancestor !== form) { if (ancestor.tagName === 'DETAILS') ancestor.open = true; ancestor = ancestor.parentElement; }
    message('请完成当前标记的字段后再发布。', true);
  }
  if (!form.reportValidity()) return;
  busy = true; updateButtons(); form.querySelectorAll('input,textarea,select,button').forEach(node => node.disabled = true);
  message('正在保存…');
  try {
    const values = [settings, unpairData(schema.cv, cv, 'zh'), unpairData(schema.cv, cv, 'en'), unpairData(schema.courses, courses, 'zh'), unpairData(schema.courses, courses, 'en')];
    const changedFiles = paths.map((path, i) => ({ path, data: values[i] })).filter(file => JSON.stringify(file.data) !== JSON.stringify(files.get(file.path).data));
    const changes = changedFiles.map(file => ({ path: file.path, originalSha: files.get(file.path).sha, content: JSON.stringify(file.data, null, 2) + '\n' }));
    for (const [path, post] of posts) {
      const content = post.deleted ? null : serializePost(post);
      if (content !== post.original && !(post.deleted && !post.sha)) changes.push({ path, originalSha: post.sha, content });
    }
    const usedContent = JSON.stringify(values) + [...posts.values()].filter(post => !post.deleted).map(post => JSON.stringify(post.data) + post.body).join('\n');
    for (const [path, content] of uploads) {
      if (usedContent.includes(path.slice('public'.length))) changes.push({ path, content, originalSha: null, encoding: 'base64' });
    }
    const result = await publishBatch(changes);
    if (!result) { dirty = false; uploads.clear(); await draftStore('delete', draftKey); message('没有需要发布的修改。'); return; }
    const treeEntries = new Map(result.entries.map(item => [item.path, item.sha]));
    changedFiles.forEach(file => files.set(file.path, { sha: treeEntries.get(file.path), data: structuredClone(file.data) }));
    for (const [path, post] of posts) {
      if (post.deleted) posts.delete(path);
      else if (treeEntries.has(path)) { post.sha = treeEntries.get(path); post.original = serializePost(post); post.edited = false; }
    }
    uploads.clear(); dirty = false;
    try { await draftStore('delete', draftKey); } catch {}
    message('修改已提交，正在发布…'); watchDeployment(result.commit);
  } catch (error) { message(error.message, true); }
  finally { busy = false; form.querySelectorAll('input,textarea,select,button').forEach(node => node.disabled = false); updateButtons(); }
});
window.addEventListener('beforeunload', event => { if (dirty || pendingUploads) event.preventDefault(); });

async function login(token) {
  setCredential(token);
  try {
    const repo = await api('');
    if (!repo.permissions?.push) throw new Error('此账号没有仓库写入权限。');
    user = true;
    document.querySelector('#account').textContent = '退出登录';
    await load();
  } catch (error) { setCredential(''); user = false; message(error.message, true); }
}
document.querySelector('#token-login').addEventListener('submit', event => {
  event.preventDefault();
  const input = document.querySelector('#github-token');
  const token = input.value; input.value = '';
  if (token) login(token);
});
document.querySelector('#account').addEventListener('click', () => {
  if (busy || pendingUploads) return;
  if (user && dirty && !confirm('退出会清除内存中的输入。需要保留时请先保存本地草稿。确定退出？')) return;
  if (!user) { document.querySelector('#login-panel').scrollIntoView(); return; }
  setCredential(''); user = false; loaded = false; dirty = false;
  settings = cv = courses = undefined; uploads.clear(); files.clear(); posts.clear(); clearPreviews();
  clearTimeout(pollTimer); form.replaceChildren(); form.hidden = true; nav.replaceChildren();
  document.querySelector('#login-panel').hidden = false;
  document.querySelector('#account').textContent = '登录后台';
  saveButton.disabled = document.querySelector('#save-draft').disabled = document.querySelector('#discard-draft').disabled = true;
  document.querySelector('#panel-title').textContent = '欢迎回来';
  message('已安全退出。');
});
document.querySelector('#save-draft').addEventListener('click', async () => {
  if (!loaded || busy || pendingUploads) return;
  busy = true; updateButtons();
  try {
    await draftStore('put', draftKey, structuredClone({ settings, cv, courses, files: [...files], posts: [...posts], uploads: [...uploads] }));
    message('草稿已保存到此浏览器，尚未发布。');
  } catch (error) { message(error.message, true); }
  finally { busy = false; updateButtons(); }
});
document.querySelector('#discard-draft').addEventListener('click', async () => {
  if (busy || pendingUploads || !confirm('放弃全部未发布修改，恢复网站当前内容？')) return;
  try {
    await draftStore('delete', draftKey); loaded = false; dirty = false; uploads.clear(); await load();
  } catch (error) { message(error.message, true); }
});
message('请登录后编辑。');
initializeOAuth(login, message);
