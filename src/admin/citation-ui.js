export function renderCitationImport({ panel, cv, el, changed, message, uploading, rerender }) {
  const box = el('section', undefined, 'citation-import'); box.append(el('h3', '导入研究成果'));
  box.append(el('p', '支持 BibTeX / BibLaTeX 与 RIS。先预览、勾选，再加入成果列表；中英文保留同一份原始题名，不自动翻译。', 'hint'));
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
      parser=await import('./citations.js'); const result=parser.parseCitations(input.value,cv.publications); parsed=result.items;
      report.textContent=`识别 ${result.total} 条 ${result.format}，排除 ${result.duplicates} 条重复，待加入 ${parsed.length} 条。缺失信息会标注，请加入后核对。`;
      parsed.forEach((item,index)=>{
        checked.add(index);const row=el('label',undefined,'citation-row'); const select=el('input');select.type='checkbox';select.checked=true;select.setAttribute('aria-label',`导入 ${item.title}`);
        select.addEventListener('change',()=>{select.checked?checked.add(index):checked.delete(index);apply.disabled=!checked.size;});
        const details=el('span');details.append(el('strong',item.title),el('small',[item.authors,item.journal,item.time].filter(Boolean).join(' · ')));
        if(!item.authors||!item.time)details.append(el('small','待补全：'+[!item.authors?'作者':'',!item.time?'年份':''].filter(Boolean).join('、'),'citation-warning'));
        row.append(select,details);preview.append(row);
      });apply.disabled=!checked.size;
    }catch(error){message(error.message,true);}finally{pending=false;uploading(-1);parseButton.disabled=false;}
  });
  apply.addEventListener('click',()=>{
    if(pending||!checked.size||!parser)return;
    const selected=parser.dedupeCitations(parsed.filter((_,index)=>checked.has(index)),cv.publications).items;
    cv.publications.push(...selected.map(item=>parser.pairedPublication(item,category.value)));changed();rerender();message(`已加入 ${selected.length} 条成果，请核对信息后统一发布。`);
  });
  panel.querySelector('.fields').before(box);
}
