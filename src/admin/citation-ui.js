export function renderCitationImport({ panel, cv, el, changed, message, uploading, rerender }) {
  const box = el('section', undefined, 'citation-import'); box.append(el('h3', '导入研究成果'));
  box.append(el('p', '支持 BibTeX / BibLaTeX 与 RIS。先预览、勾选，再加入成果列表；中英文保留同一份原始题名，不自动翻译。批量导入后，单条成果仍可独立展开编辑。', 'hint'));
  const fileLabel = el('label', undefined, 'field'); fileLabel.append(el('span', '选择引文文件（最多 2 MB、500 条）'));
  const file = el('input'); file.type = 'file'; file.accept = '.bib,.bibtex,.ris'; fileLabel.append(file); box.append(fileLabel);
  const label = el('label', undefined, 'field'); label.append(el('span', '或粘贴引文内容'));
  const input = el('textarea'); input.rows = 5; label.append(input); box.append(label);
  const categoryLabel = el('label', undefined, 'field'); categoryLabel.append(el('span', '导入类别'));
  const category = el('select'); [['auto','按记录类型识别'],['published','已发表论文'],['working','工作论文'],['book','书籍']].forEach(([value,title]) => { const option = el('option',title); option.value=value; category.append(option); }); categoryLabel.append(category); box.append(categoryLabel);
  const parseButton = el('button','识别并预览'); parseButton.type='button';
  const apply = el('button','加入成果列表'); apply.type='button'; apply.disabled=true;
  const actions=el('div',undefined,'file-actions'); actions.append(parseButton,apply); box.append(actions);
  const report=el('p',undefined,'hint'); report.setAttribute('aria-live','polite'); box.append(report);
  const preview=el('div',undefined,'citation-preview'); box.append(preview);
  let parsed=[], checked=new Set(), parser, pending=false;
  const clear=()=>{parsed=[];checked.clear();preview.replaceChildren();apply.disabled=true;report.textContent='';};
  input.addEventListener('input',clear);
  file.addEventListener('change',async()=>{
    const selected=file.files[0]; if(!selected) return;
    if(selected.size>2*1024*1024){message('引文文件不能超过 2 MB。',true);return;}
    uploading(1); parseButton.disabled=true; pending=true;
    try {input.value=await selected.text();clear();} catch {message('无法读取引文文件，请重试。',true);} finally {uploading(-1);parseButton.disabled=false;pending=false;file.value='';}
  });
  parseButton.addEventListener('click',async()=>{
    if(pending)return; pending=true; uploading(1);parseButton.disabled=true;clear();
    try {
      parser=await import('./citations.js'); const result=parser.parseCitations(input.value,cv.publications); parsed=[...result.items, ...result.updates];
      report.textContent=`识别 ${result.total} 条 ${result.format}，新增 ${result.items.length} 条，可补全 ${result.updates.length} 条已有成果摘要。不会覆盖已填写的摘要。`;
      parsed.forEach((item,index)=>{
        checked.add(index);const row=el('label',undefined,'citation-row'); const select=el('input');select.type='checkbox';select.checked=true;select.setAttribute('aria-label',`导入 ${item.title}`);
        select.addEventListener('change',()=>{select.checked?checked.add(index):checked.delete(index);apply.disabled=!checked.size;});
        const details=el('span');details.append(el('strong',item.title),el('small',[item.authors,item.journal,item.time].filter(Boolean).join(' · ')));
        if (item.existingIndex !== undefined) details.append(el('small', '补全已有成果的空摘要，不重复添加论文', 'citation-warning'));
        details.append(el('small', item.abstract ? `摘要：${item.abstract}` : '此记录未提供摘要', 'citation-abstract'));
        if(!item.authors||!item.time)details.append(el('small','待补全：'+[!item.authors?'作者':'',!item.time?'年份':''].filter(Boolean).join('、'),'citation-warning'));
        row.append(select,details);preview.append(row);
      });apply.disabled=!checked.size;
    }catch(error){message(error.message,true);}finally{pending=false;uploading(-1);parseButton.disabled=false;}
  });
  apply.addEventListener('click',()=>{
    if(pending||!checked.size||!parser)return;
    const selectedItems = parsed.filter((_, index) => checked.has(index));
    let filled = 0;
    for (const item of selectedItems.filter(item => item.existingIndex !== undefined)) {
      const target = cv.publications[item.existingIndex];
      if (!target || !parser.citationKeys(target).some(key => parser.citationKeys(item).includes(key))) continue;
      target.abstract ||= { zh: '', en: '' };
      if (!target.abstract.zh) target.abstract.zh = item.abstract;
      if (!target.abstract.en) target.abstract.en = item.abstract;
      filled++;
    }
    const selected=parser.dedupeCitations(selectedItems.filter(item => item.existingIndex === undefined),cv.publications).items;
    cv.publications.push(...selected.map(item=>parser.pairedPublication(item,category.value)));changed();rerender();message(`已加入 ${selected.length} 条成果，补全 ${filled} 条摘要，请核对后统一发布。`);
  });
  panel.querySelector('.fields').before(box);

  const exportBox = el('section', undefined, 'citation-export'); exportBox.append(el('h3', '批量导出研究成果'));
  exportBox.append(el('p', '从当前后台成果数据直接导出多条 BibTeX 或 RIS；网站专用字段（代表性成果、通讯作者开关等）不会写入引文文件。', 'hint'));
  const grid = el('div', undefined, 'citation-export-grid');
  const langLabel = el('label', undefined, 'field'); langLabel.append(el('span', '导出语言'));
  const lang = el('select'); [['zh','中文字段'],['en','English fields']].forEach(([value,title]) => { const option=el('option',title); option.value=value; lang.append(option); }); langLabel.append(lang);
  const rangeLabel = el('label', undefined, 'field'); rangeLabel.append(el('span', '导出范围'));
  const range = el('select'); [['all','全部成果'],['published','已发表论文'],['working','工作论文'],['book','书籍']].forEach(([value,title]) => { const option=el('option',title); option.value=value; range.append(option); }); rangeLabel.append(range);
  const formatLabel = el('label', undefined, 'field'); formatLabel.append(el('span', '格式'));
  const format = el('select'); [['bibtex','BibTeX (.bib)'],['ris','RIS (.ris)']].forEach(([value,title]) => { const option=el('option',title); option.value=value; format.append(option); }); formatLabel.append(format);
  grid.append(langLabel, rangeLabel, formatLabel); exportBox.append(grid);
  const exportActions=el('div',undefined,'file-actions');
  const download=el('button','导出当前范围'); download.type='button';
  download.addEventListener('click', async()=>{
    try {
      const module = parser || await import('./citations.js');
      const selected = (cv.publications || []).filter(item => range.value === 'all' || (item.category || 'published') === range.value);
      const content = module.exportCitations(selected, format.value, lang.value);
      const blob = new Blob([content], { type: format.value === 'ris' ? 'application/x-research-info-systems;charset=utf-8' : 'application/x-bibtex;charset=utf-8' });
      const url = URL.createObjectURL(blob); const link = document.createElement('a');
      link.href = url; link.download = `academic-publications-${range.value}-${lang.value}.${format.value === 'ris' ? 'ris' : 'bib'}`;
      document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 0);
      message(`已导出 ${selected.length} 条成果。`);
    } catch (error) { message(error.message || '导出失败，请重试。', true); }
  });
  exportActions.append(download); exportBox.append(exportActions);
  panel.querySelector('.fields').before(exportBox);
}
