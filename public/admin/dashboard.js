const form = document.querySelector('#settings-form');
const statusMessage = document.querySelector('#status');
const saveButton = document.querySelector('#save');
const nav = document.querySelector('#section-nav');
const paths = ['src/data/site-settings.json', 'src/data/cv.zh.json', 'src/data/cv.en.json', 'src/data/courses.zh.json', 'src/data/courses.en.json'];
const files = new Map();
const uploads = new Map();
let schema, settings, cv, courses, dirty = false, busy = false, loaded = false, user, pollTimer;

function el(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}
function message(text, error = false) { statusMessage.textContent = text; statusMessage.dataset.error = String(error); }
function changed() { dirty = true; saveButton.disabled = busy; message('有未发布的修改'); }
function bytesToBase64(bytes) {
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += 8192) binary += String.fromCharCode(...bytes.subarray(offset, offset + 8192));
  return btoa(binary);
}
function decode(content) { return new TextDecoder().decode(Uint8Array.from(atob(content.replace(/\s/g, '')), c => c.charCodeAt(0))); }
async function api(path, body, method = body ? 'POST' : 'GET') {
  if (!user) throw new Error('请先登录后台。');
  const token = await user.jwt();
  const response = await fetch('/.netlify/git/github/' + path, {
    method, cache: 'no-store', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!response.ok) {
    const text = response.status === 401 ? '登录已过期，请重新登录。' : response.status === 403 ? '当前账号没有编辑权限，请检查 Git Gateway 设置。' : response.status === 409 || response.status === 422 ? '有其他修改已保存。请复制尚未保存的内容，刷新后再编辑。' : `连接失败（${response.status}），请稍后重试。`;
    throw new Error(text);
  }
  return response.json();
}
const sharedFields = new Set(['category', 'sortDate', 'field']);
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
  const label = el('label', undefined, field.widget === 'boolean' ? 'toggle' : 'field'); label.htmlFor = id;
  label.append(el('span', field.label));
  let input;
  if (field.widget === 'text') input = el('textarea');
  else if (field.widget === 'select') {
    input = el('select');
    (field.options || []).forEach(option => { const node = el('option', typeof option === 'string' ? option : option.label); node.value = typeof option === 'string' ? option : option.value; input.append(node); });
  } else { input = el('input'); input.type = field.widget === 'boolean' ? 'checkbox' : field.widget === 'datetime' ? 'date' : 'text'; }
  input.id = id; input.name = id;
  if (field.widget === 'boolean') input.checked = Boolean(owner[key]);
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
    const preview = el('img', undefined, 'avatar-preview'); preview.alt = '共用头像预览'; preview.src = owner[key] || '/uploads/profile.jpg';
    const upload = el('input'); upload.type = 'file'; upload.accept = 'image/png,image/jpeg,image/webp,image/gif'; upload.setAttribute('aria-label', '上传共用头像');
    upload.addEventListener('change', async () => {
      const file = upload.files[0]; if (!file) return;
      if (!['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(file.type) || file.size > 10 * 1024 * 1024) { message('请选择不超过 10 MB 的 PNG、JPG、WebP 或 GIF 图片。', true); return; }
      const path = `public/uploads/avatar-${crypto.randomUUID()}.${file.type.split('/')[1]}`;
      uploads.set(path, bytesToBase64(new Uint8Array(await file.arrayBuffer())));
      owner[key] = '/' + path.slice('public/'.length); input.value = owner[key];
      preview.src = URL.createObjectURL(file); changed();
    });
    label.append(preview, upload);
  }
  if (field.hint) label.append(el('small', field.hint, 'hint'));
  return label;
}
function section(id, title, fields, owner, hint) {
  const panel = el('section', undefined, 'settings-section'); panel.id = `section-${id}`;
  const header = el('div', undefined, 'section-header'); header.append(el('h2', title)); if (hint) header.append(el('p', hint, 'hint')); panel.append(header);
  const content = el('div', undefined, 'fields'); fields.forEach(field => content.append(fieldNode(field, owner, id))); panel.append(content); form.append(panel);
  const link = el('a', title); link.href = '#' + panel.id; nav.append(link);
  return panel;
}
function render() {
  nav.replaceChildren(); form.replaceChildren();
  const get = name => schema.settings.find(field => field.name === name);
  section('profile', '个人资料', [get('avatar'), ...get('profile').fields.filter(f => !['projects', 'researchAreas'].includes(f.name))], new Proxy(settings.profile, {
    get(target, key) { return key === 'avatar' ? settings.avatar : target[key]; },
    set(target, key, value) { if (key === 'avatar') settings.avatar = value; else target[key] = value; return true; },
  }), '同一个选项，中文在上，English 在下。头像由两种语言共用。');
  section('research', '研究与项目', get('profile').fields.filter(f => ['projects', 'researchAreas'].includes(f.name)), settings.profile);
  section('navigation', '导航与论文分类', get('navigation').fields, settings.navigation, '开关控制导航是否显示。三类成果可以独立开关、任意组合。');
  section('social', '联系方式', get('social').fields, settings.social, '已开启且填写有效链接的联系方式会出现在开场页和侧栏。');
  section('cv', '履历与成果', pairSchema(schema.cv), cv, '每条经历或成果只添加一次，在同一处填写中英文。');
  section('courses', '课程', pairSchema(schema.courses), courses);
  section('appearance', '外观与配色', get('appearance').fields, settings.appearance);
  const maintenance = section('maintenance', '网站维护', get('maintenance').fields, settings.maintenance, '保存并发布后生效；后台保持可用。关闭此开关并再次发布即可恢复网站。');
  const note = el('p', '关闭平台徽标：在 Netlify 项目设置中关闭 Powered by Netlify badge。', 'hint');
  const badge = el('a', '打开平台徽标设置 ↗', 'external-setting'); badge.href = 'https://app.netlify.com/projects/delicate-biscochitos-9061ae/configuration/general'; badge.target = '_blank'; badge.rel = 'noopener'; maintenance.append(note, badge);
}
async function load() {
  if (loaded || busy) return;
  busy = true; message('正在读取最新设置…');
  try {
    schema = await fetch('./schema.json', { cache: 'no-store' }).then(r => { if (!r.ok) throw new Error('设置表单加载失败，请刷新重试。'); return r.json(); });
    await Promise.all(paths.map(async path => {
      const file = await api(`contents/${path}?ref=main`); files.set(path, { sha: file.sha, data: JSON.parse(decode(file.content)) });
    }));
    settings = structuredClone(files.get(paths[0]).data);
    cv = pairData(schema.cv, files.get(paths[1]).data, files.get(paths[2]).data);
    courses = pairData(schema.courses, files.get(paths[3]).data, files.get(paths[4]).data);
    render(); loaded = true; form.hidden = false; document.querySelector('#login-panel').hidden = true;
    message('设置已加载。修改后点击“保存并发布”。');
  } catch (error) { message(error.message, true); loaded = false; }
  finally { busy = false; }
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
    else if (!dirty) message('设置已保存，但尚未确认上线。请在 Netlify Deploys 查看部署结果。', true);
  };
  pollTimer = setTimeout(check, 5000);
}
form.addEventListener('submit', async event => {
  event.preventDefault(); if (busy || !dirty) return;
  if (!form.reportValidity()) return;
  busy = true; saveButton.disabled = true; form.querySelectorAll('input,textarea,select,button').forEach(node => node.disabled = true);
  message('正在保存…');
  try {
    const values = [settings, unpairData(schema.cv, cv, 'zh'), unpairData(schema.cv, cv, 'en'), unpairData(schema.courses, courses, 'zh'), unpairData(schema.courses, courses, 'en')];
    const changedFiles = paths.map((path, i) => ({ path, data: values[i] })).filter(file => JSON.stringify(file.data) !== JSON.stringify(files.get(file.path).data));
    if (!changedFiles.length && !uploads.size) { dirty = false; message('没有需要发布的修改。'); return; }
    const head = await api('git/ref/heads/main');
    const base = head.object.sha;
    await Promise.all(changedFiles.map(async file => {
      const latest = await api(`contents/${file.path}?ref=${base}`);
      if (latest.sha !== files.get(file.path).sha) throw new Error('其他页面已修改了同一份设置。请保留输入内容并刷新，避免覆盖。');
    }));
    const blobs = await Promise.all(changedFiles.map(async file => ({ path: file.path, mode: '100644', type: 'blob', sha: (await api('git/blobs', { content: JSON.stringify(file.data, null, 2) + '\n', encoding: 'utf-8' })).sha })));
    const tree = await api('git/trees', {
      base_tree: base,
      tree: [
        ...blobs,
        ...await Promise.all([...uploads].map(async ([path, content]) => ({ path, mode: '100644', type: 'blob', sha: (await api('git/blobs', { content, encoding: 'base64' })).sha }))),
      ],
    });
    const commit = await api('git/commits', { message: '更新网站设置与双语内容', tree: tree.sha, parents: [base] });
    await api('git/refs/heads/main', { sha: commit.sha, force: false }, 'PATCH');
    const treeEntries = new Map(blobs.map(item => [item.path, item.sha]));
    changedFiles.forEach(file => files.set(file.path, { sha: treeEntries.get(file.path), data: structuredClone(file.data) }));
    uploads.clear(); dirty = false; message('设置已保存，正在自动发布…'); watchDeployment(commit.sha);
  } catch (error) { message(error.message, true); }
  finally { busy = false; form.querySelectorAll('input,textarea,select,button').forEach(node => node.disabled = false); saveButton.disabled = !dirty; }
});
window.addEventListener('beforeunload', event => { if (dirty) event.preventDefault(); });

function initializeIdentity() {
  const identity = window.netlifyIdentity;
  if (!identity) { message('登录组件未加载，请刷新页面重试。', true); return; }
  const signedIn = nextUser => {
    user = nextUser;
    document.querySelector('#account').textContent = user ? '退出登录' : '登录后台';
    document.querySelector('#login-panel').hidden = Boolean(user);
    if (user) { identity.close(); load(); } else { form.hidden = true; message('请登录后编辑网站。'); }
  };
  identity.on('init', signedIn);
  identity.on('login', signedIn);
  identity.on('logout', () => { loaded = false; dirty = false; uploads.clear(); files.clear(); saveButton.disabled = true; signedIn(null); });
  document.querySelector('#login').addEventListener('click', () => identity.open('login'));
  document.querySelector('#account').addEventListener('click', () => {
    if (user && dirty && !confirm('还有未发布的修改，确定退出吗？')) return;
    if (user) identity.logout(); else identity.open('login');
  });
  identity.init();
}
if (document.readyState === 'complete') initializeIdentity(); else window.addEventListener('load', initializeIdentity, { once: true });
export {};
