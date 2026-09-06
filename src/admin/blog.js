import { stringify } from 'yaml';
import { MAX_FILE, validFile, isImage, fileURL, insertLink, managedFiles, importBlogFile } from './blog-files.js';
export const serializePost = post => !post.edited && post.original ? post.original : `---\n${stringify(post.data, { defaultStringType: 'QUOTE_DOUBLE', lineWidth: 0 })}---\n\n${post.body}\n`;
export function renderBlog({ posts, uploads, section, fieldNode, el, changed, message, bytesToBase64, uploading, base }) {
  const panel = section('blog', '博客', [], {}, '写作、管理文件与整理下载附件。所有改动统一发布。');
  const list = el('div'); panel.append(list);
  const button = (label, handler) => { const node = el('button', label); node.type = 'button'; node.addEventListener('click', handler); return node; };
  const copy = async text => { try { await navigator.clipboard.writeText(text); message('已复制。新上传文件需发布成功后才能访问。'); } catch { message('浏览器未允许复制，请选中 URL 手动复制。', true); } };
  function renderList(openPath) {
    list.replaceChildren();
    if (![...posts.values()].some(post => !post.deleted)) list.append(el('p', '还没有文章。创建第一篇博客，开始记录你的研究与思考。', 'empty'));
    for (const [path, post] of posts) {
      if (post.deleted) continue;
      const slug = path.split('/').pop().replace(/\.md$/, '');
      const item = el('details', undefined, 'blog-entry'); item.open = path === openPath;
      const statusLabel = () => `${post.data.title || '新文章'} · ${post.data.draft ? '草稿（不公开）' : '公开'} · ${post.data.language === 'en' ? 'EN' : '中文'}`;
      const summary = el('summary', statusLabel()); item.append(summary);
      const edit = el('fieldset', undefined, 'blog-fields'); item.append(edit);
      const mark = () => { post.edited = true; changed(); summary.textContent = statusLabel(); };
      const busy = async task => {
        uploading(1); edit.disabled = true;
        try { await task(); } catch (error) { message(error.message || '文件处理失败，请重试。', true); }
        finally { uploading(-1); edit.disabled = false; }
      };
      const importer = el('label', undefined, 'field import-field'); importer.append(el('span', '从本地导入 Markdown / ZIP'));
      const importInput = el('input'); importInput.type = 'file'; importInput.accept = '.md,.zip';
      importer.append(importInput, el('small', 'ZIP：根目录一个 .md 文件及 assets 文件夹；只上传正文引用的资源。导入会替换正文，可读取标题、日期、摘要、语言和标签。', 'hint'));
      importInput.addEventListener('change', async () => {
        const file = importInput.files[0]; if (!file) return;
        if (post.body.trim() && !confirm('导入将替换当前正文。原文件列表仍会保留，是否继续？')) { importInput.value = ''; return; }
        await busy(async () => {
          const result = await importBlogFile(file, slug);
          const existing = managedFiles(post);
          result.uploads.forEach(file => uploads.set(file.path, bytesToBase64(file.bytes)));
          post.body = result.body; Object.assign(post.data, result.data);
          post.data.files = [...existing, ...result.files]; mark();
          renderList(path); message(`已导入正文和 ${result.files.length} 个引用文件，尚未发布。`);
        });
        importInput.value = '';
      }); edit.append(importer);
      for (const field of [
        { name: 'title', label: '标题', widget: 'string' },
        { name: 'language', label: '语言', widget: 'select', options: [{ label: '中文', value: 'zh' }, { label: 'English', value: 'en' }] },
        { name: 'date', label: '日期', widget: 'datetime' },
        { name: 'excerpt', label: '摘要', widget: 'text' },
      ]) edit.append(fieldNode(field, post.data, 'blog-' + slug));
      const visibility = el('label', undefined, 'field publication-status'); visibility.append(el('span', '文章状态'));
      const visibilityInput = el('select'); visibilityInput.setAttribute('aria-label', '文章状态');
      for (const [value, label] of [['draft', '草稿 · 仅后台可见'], ['public', '公开 · 网站发布成功后可见']]) { const option = el('option', label); option.value = value; visibilityInput.append(option); }
      visibilityInput.value = post.data.draft ? 'draft' : 'public';
      visibilityInput.addEventListener('change', () => { post.data.draft = visibilityInput.value === 'draft'; mark(); });
      visibility.append(visibilityInput, el('small', '“发布修改”会保存全部设置，但不会自动公开草稿。中文文章仅在中文博客列表展示，英文同理。', 'hint')); edit.append(visibility);
      const tags = el('label', undefined, 'field'); tags.append(el('span', '标签（用逗号分隔）'));
      const tagsInput = el('input'); tagsInput.value = (post.data.tags || []).join(', ');
      tagsInput.addEventListener('input', () => { post.data.tags = tagsInput.value.split(/[,，]/).map(v => v.trim()).filter(Boolean); });
      tags.append(tagsInput); edit.append(tags);
      const bodyLabel = el('label', undefined, 'field'); bodyLabel.append(el('span', '正文 · Markdown'));
      const body = el('textarea'); body.className = 'markdown-body'; body.value = post.body;
      body.addEventListener('input', () => { post.body = body.value; }); bodyLabel.append(body); edit.append(bodyLabel);
      const preview = el('iframe', undefined, 'blog-preview'); preview.title = '博客文章预览'; preview.setAttribute('sandbox', ''); preview.hidden = true;
      const previewActions = el('div', undefined, 'file-actions');
      previewActions.append(button('预览 / 刷新预览', async () => {
        await busy(async () => { const { renderPreview } = await import('./markdown-preview.js'); renderPreview(preview, post, uploads, base); preview.hidden = false; });
      }), button('收起预览', () => { preview.hidden = true; preview.removeAttribute('srcdoc'); }));
      edit.append(previewActions, el('p', '预览包含未发布的正文、图片和文末附件；链接仅展示，不会打开。修改后点击刷新预览。', 'hint'), preview);

      const manager = el('section', undefined, 'file-manager'); manager.append(el('h3', '文章文件'));
      manager.append(el('p', '上传图片、文档，或登记外部下载链接。复制 Markdown 后可粘贴到正文；也可将同一文件加入文末下载区。', 'hint'));
      manager.append(el('p', '隐私提醒：发布后文件会进入 Git 历史，草稿引用的文件也可能被直接访问。请勿上传敏感文件；移出列表不等于撤回文件。', 'hint'));
      const uploadLabel = el('label', undefined, 'field'); uploadLabel.append(el('span', '上传文件（单个 ≤ 20 MB，每次最多 20 个）'));
      const upload = el('input'); upload.type = 'file'; upload.multiple = true;
      upload.accept = '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.csv,.txt,.zip,.png,.jpg,.jpeg,.webp,.gif,.avif';
      uploadLabel.append(upload); manager.append(uploadLabel);
      const external = el('div', undefined, 'external-file');
      const externalName = el('input'); externalName.placeholder = '文件名称'; externalName.setAttribute('aria-label', '外部文件名称');
      const externalURL = el('input'); externalURL.placeholder = 'https://…'; externalURL.setAttribute('aria-label', '外部文件 URL');
      external.append(externalName, externalURL, button('添加外部链接', () => {
        let normalized;
        try { const url = new URL(externalURL.value.trim()); if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) throw Error(); normalized = url.href; }
        catch { message('请输入有效的 HTTP(S) 文件链接。', true); return; }
        if (!externalName.value.trim()) { message('请填写文件名称。', true); return; }
        const files = managedFiles(post), url = normalized;
        if (!files.some(file => file.url === url)) files.push({ name: externalName.value.trim(), url });
        post.data.files = files; externalName.value = externalURL.value = ''; mark(); renderFiles();
      })); manager.append(external);
      const fileList = el('div', undefined, 'file-list'); manager.append(fileList); edit.append(manager);
      const attachmentArea = el('section', undefined, 'attachment-manager'); attachmentArea.append(el('h3', '文末附件下载区'));
      const attachmentList = el('div'); attachmentArea.append(attachmentList); edit.append(attachmentArea);
      function renderAttachments() {
        attachmentList.replaceChildren();
        if (!post.data.attachments?.length) attachmentList.append(el('p', '从上方文件卡片点击“加入文末下载区”。', 'empty'));
        (post.data.attachments || []).forEach((file, index) => {
          const row = el('div', undefined, 'attachment-row');
          const label = el('input'); label.value = file.label; label.required = true; label.setAttribute('aria-label', '文末下载名称');
          label.addEventListener('input', () => { file.label = label.value; });
          const link = el('code', fileURL(file.file, base));
          row.append(label, link, button('移出下载区', () => { post.data.attachments.splice(index, 1); mark(); renderAttachments(); renderFiles(); })); attachmentList.append(row);
        });
      }
      function renderFiles() {
        fileList.replaceChildren();
        const files = managedFiles(post);
        if (!files.length) fileList.append(el('p', '暂无文件。上传后可查看地址并复制插入语法。', 'empty'));
        files.forEach(file => {
          const row = el('article', undefined, 'file-card'); row.append(el('strong', file.name));
          row.append(el('small', uploads.has('public' + file.url) ? '待发布' : isImage(file.url) ? '图片' : '文件 / 链接', 'hint'));
          const url = el('input'); url.readOnly = true; url.value = new URL(fileURL(file.url, base), location.origin).href; url.setAttribute('aria-label', `${file.name} URL`); row.append(url);
          const actions = el('div', undefined, 'file-actions');
          actions.append(button('复制 URL', () => copy(url.value)), button('复制插入链接', () => copy(insertLink(file, base))), button('插入正文', () => {
            body.setRangeText(insertLink(file, base), body.selectionStart, body.selectionEnd, 'end'); post.body = body.value; mark(); body.focus();
          }));
          const attached = post.data.attachments?.some(item => item.file === file.url);
          actions.append(button(attached ? '已加入文末下载区' : '加入文末下载区', () => {
            if (post.data.attachments?.some(item => item.file === file.url)) return;
            (post.data.attachments ||= []).push({ label: file.name, file: file.url }); post.data.files = files; mark(); renderAttachments(); renderFiles();
          }));
          actions.append(button('移出文件列表', () => {
            const referenced = managedFiles({ data: { attachments: post.data.attachments }, body: post.body }).some(item => item.url === file.url);
            if (referenced) { message('正文或文末下载区仍在引用此文件，请先移除引用。', true); return; }
            post.data.files = files.filter(item => item.url !== file.url); uploads.delete('public' + file.url); mark(); renderFiles();
            message('已移出文件列表。已发布的文件不会从仓库物理删除。');
          })); row.append(actions); fileList.append(row);
        });
      }
      upload.addEventListener('change', async () => {
        const selected = [...upload.files]; if (!selected.length) return;
        if (selected.length > 20 || selected.reduce((total, file) => total + file.size, 0) > 100 * 1024 * 1024 || selected.some(file => !validFile(file.name) || file.size > MAX_FILE)) { message('每次最多 20 个文件、合计 100 MB，单个不超过 20 MB；不接受 HTML、脚本或 SVG。', true); upload.value = ''; return; }
        await busy(async () => {
          const staged = await Promise.all(selected.map(async file => ({ name: file.name, url: `/uploads/blog/${slug}/${crypto.randomUUID()}.${file.name.split('.').pop().toLowerCase()}`, content: bytesToBase64(new Uint8Array(await file.arrayBuffer())) })));
          post.data.files = [...managedFiles(post), ...staged.map(({ name, url }) => ({ name, url }))];
          staged.forEach(file => uploads.set('public' + file.url, file.content)); mark(); renderFiles(); message('文件已加入列表，发布成功后 URL 生效。');
        }); upload.value = '';
      });
      renderFiles(); renderAttachments(); edit.addEventListener('input', mark);
      edit.append(button('删除文章', () => { if (confirm('将此文章加入待删除列表？统一发布后才从网站移除。')) { post.deleted = true; changed(); renderList(); } }));
      list.append(item);
    }
  }
  renderList();
  panel.append(button('＋ 新建博客', () => {
    const date = new Date().toISOString().slice(0, 10), path = `src/content/BlogPosts/${date}-${crypto.randomUUID().slice(0, 8)}.md`;
    posts.set(path, { sha: null, original: null, edited: true, deleted: false, body: '', data: { title: '', language: 'zh', date, excerpt: '', tags: [], files: [], attachments: [], draft: true } });
    changed(); renderList(path); list.lastElementChild.scrollIntoView({ block: 'start', behavior: 'instant' });
  }));
}
