import { renderMarkdown } from '../lib/markdown.js';

// No scripts, same-origin privileges, forms, popups or navigation in this frame.
export function renderPreview(frame, post, uploads, base) {
  const doc = new DOMParser().parseFromString('<!doctype html><html><head></head><body><article></article></body></html>', 'text/html');
  doc.documentElement.lang = post.data.language || 'zh';
  const csp = doc.createElement('meta'); csp.httpEquiv = 'Content-Security-Policy';
  csp.content = "default-src 'none'; img-src https: http: data: blob:; style-src https: http:; base-uri 'none'; form-action 'none'";
  const css = doc.createElement('link'); css.rel = 'stylesheet'; css.href = new URL(base + '/admin/preview.css', location.origin).href;
  doc.head.append(csp, css);
  const article = doc.querySelector('article');
  const title = doc.createElement('h1'); title.textContent = post.data.title || '未命名文章'; article.append(title);
  const meta = doc.createElement('p'); meta.className = 'meta'; meta.textContent = `${post.data.date || ''} · ${post.data.draft ? '草稿预览 · 不会公开' : '公开文章 · 发布完成后生效'}`; article.append(meta);
  const content = doc.createElement('div'); content.innerHTML = renderMarkdown(post.body, { base }); article.append(content);
  if (post.data.attachments?.length) {
    const heading = doc.createElement('h2'); heading.textContent = post.data.language === 'en' ? 'Downloads' : '附件下载'; article.append(heading);
    for (const item of post.data.attachments) {
      const p = doc.createElement('p'), link = doc.createElement('a'); link.textContent = item.label;
      const url = new URL(item.file, location.origin);
      if (['http:', 'https:'].includes(url.protocol)) { link.href = url.href; p.append(link); article.append(p); }
    }
  }
  for (const img of doc.querySelectorAll('img')) {
    const url = new URL(img.getAttribute('src'), location.origin);
    const portable = url.origin === location.origin ? url.pathname.slice(base.length) : '';
    const staged = uploads.get('public' + portable);
    const ext = portable.split('.').pop().toLowerCase();
    const mime = { png: 'png', jpg: 'jpeg', jpeg: 'jpeg', webp: 'webp', gif: 'gif', avif: 'avif' }[ext];
    img.src = staged && mime ? `data:image/${mime};base64,${staged}` : url.href;
  }
  for (const link of doc.querySelectorAll('a')) {
    link.title = link.getAttribute('href') || ''; link.removeAttribute('href');
  }
  frame.srcdoc = '<!doctype html>' + doc.documentElement.outerHTML;
}
