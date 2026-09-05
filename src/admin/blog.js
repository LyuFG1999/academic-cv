import { stringify } from 'yaml';
export const serializePost = post => !post.edited && post.original ? post.original : `---\n${stringify(post.data)}---\n\n${post.body}\n`;
export function renderBlog({ posts, uploads, section, fieldNode, el, changed, message, bytesToBase64, uploading }) {
  const panel = section('blog', '博客', [], {}, '写作、整理文章与添加下载附件。');
  const list = el('div'); panel.append(list);
  function renderList() {
    list.replaceChildren();
    if (![...posts.values()].some(post => !post.deleted)) list.append(el('p', '还没有文章。创建第一篇博客，开始记录你的研究与思考。', 'empty'));
    for (const [path, post] of posts) {
      if (post.deleted) continue;
      const item = el('details', undefined, 'blog-entry');
      const summary = el('summary', post.data.title || '新文章'); item.append(summary);
      const edit = el('div', undefined, 'blog-fields'); item.append(edit);
      const mark = () => { post.edited = true; changed(); summary.textContent = post.data.title || '新文章'; };
      for (const field of [
        { name: 'title', label: '标题', widget: 'string' },
        { name: 'language', label: '语言', widget: 'select', options: [{ label: '中文', value: 'zh' }, { label: 'English', value: 'en' }] },
        { name: 'date', label: '日期', widget: 'datetime' },
        { name: 'excerpt', label: '摘要', widget: 'text' },
        { name: 'featuredImage', label: '题图路径（可先在下方上传图片）', widget: 'string', required: false },
        { name: 'draft', label: '隐藏此文章（草稿）', widget: 'boolean' },
      ]) edit.append(fieldNode(field, post.data, 'blog-' + path.replace(/\W/g, '-')));
      const tags = el('label', undefined, 'field'); tags.append(el('span', '标签（用逗号分隔）'));
      const tagsInput = el('input'); tagsInput.value = (post.data.tags || []).join(', ');
      tagsInput.addEventListener('input', () => { post.data.tags = tagsInput.value.split(/[,，]/).map(v => v.trim()).filter(Boolean); });
      tags.append(tagsInput); edit.append(tags);
      const bodyLabel = el('label', undefined, 'field'); bodyLabel.append(el('span', '正文 · Markdown'));
      const body = el('textarea'); body.className = 'markdown-body'; body.value = post.body;
      body.addEventListener('input', () => { post.body = body.value; }); bodyLabel.append(body); edit.append(bodyLabel);
      const uploadLabel = el('label', undefined, 'field'); uploadLabel.append(el('span', '上传附件 / 图片并插入正文（单个不超过 20 MB）'));
      const upload = el('input'); upload.type = 'file';
      upload.accept = '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.csv,.txt,.zip,.png,.jpg,.jpeg,.webp,.gif';
      upload.addEventListener('change', async () => {
        const file = upload.files[0]; if (!file) return;
        const extension = file.name.split('.').pop().toLowerCase();
        if (!/^(pdf|docx?|xlsx?|pptx?|csv|txt|zip|png|jpe?g|webp|gif)$/.test(extension) || file.size > 20 * 1024 * 1024) {
          message('请选择不超过 20 MB 的常用文档、压缩包或图片；不接受 HTML、脚本或 SVG。', true); return;
        }
        uploading(1);
        try {
          const uploadPath = `public/uploads/file-${crypto.randomUUID()}.${extension}`;
          uploads.set(uploadPath, bytesToBase64(new Uint8Array(await file.arrayBuffer())));
          const url = '/' + uploadPath.slice('public/'.length);
          const label = file.name.replace(/[\[\]\\\r\n]/g, '_');
          const text = /^(png|jpe?g|webp|gif)$/.test(extension) ? `![${label}](${url})` : `[下载：${label}](${url})`;
          body.setRangeText(text, body.selectionStart, body.selectionEnd, 'end'); post.body = body.value; mark(); body.focus();
        } catch { message('附件读取失败，请重新选择文件。', true); }
        finally { uploading(-1); }
      });
      uploadLabel.append(upload); edit.append(uploadLabel);
      const attachments = fieldNode({ name: 'attachments', label: '文末附件下载区', widget: 'list', fields: [
        { name: 'label', label: '下载名称', widget: 'string' }, { name: 'file', label: '路径 / URL', widget: 'string' },
      ] }, post.data, 'attachments-' + path.replace(/\W/g, '-'));
      attachments.addEventListener('click', event => { if (event.target.closest('button')) mark(); });
      edit.append(attachments); edit.addEventListener('input', mark);
      const remove = el('button', '删除文章'); remove.type = 'button';
      remove.addEventListener('click', () => { if (confirm('将此文章加入待删除列表？统一发布后才从网站移除。')) { post.deleted = true; changed(); renderList(); } });
      edit.append(remove); list.append(item);
    }
  }
  renderList();
  const add = el('button', '＋ 新建博客'); add.type = 'button';
  add.addEventListener('click', () => {
    const date = new Date().toISOString().slice(0, 10);
    posts.set(`src/content/BlogPosts/${date}-${crypto.randomUUID().slice(0, 8)}.md`, {
      sha: null, original: null, edited: true, deleted: false, body: '',
      data: { title: '', language: 'zh', date, excerpt: '', tags: [], attachments: [], draft: true },
    });
    changed(); renderList(); list.lastElementChild.open = true; list.lastElementChild.scrollIntoView({ block: 'start' });
  }); panel.append(add);
}
