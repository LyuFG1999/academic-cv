import { Cite } from '@citation-js/core';
import '@citation-js/plugin-bibtex';
import '@citation-js/plugin-ris';

const plain = value => String(Array.isArray(value) ? value.join('; ') : value ?? '').replace(/<[^>]*>/g, '').trim();
const doi = value => {
  const candidate = plain(value).replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, '').replace(/^doi:\s*/i, '').toLowerCase();
  return /^10\.\d{4,9}\/\S+$/.test(candidate) ? candidate : '';
};
const text = value => typeof value === 'object' && value ? value.zh || value.en || '' : value || '';
const normalized = value => text(value).normalize('NFKC').toLowerCase().replace(/[\s\p{P}\p{S}]/gu, '');
export function citationKeys(item) {
  const id = doi(text(item.doi) || (/doi\.org\//i.test(text(item.link)) ? text(item.link) : ''));
  return [id && `doi:${id}`, normalized(item.title) && `title:${normalized(item.title)}:${normalized(item.authors)}:${plain(text(item.time)).match(/\d{4}/)?.[0] || ''}`].filter(Boolean);
}
export function dedupeCitations(items, existing = []) {
  const keys = new Set(existing.flatMap(citationKeys)); let duplicates = 0;
  const unique = items.filter(item => {
    const current = citationKeys(item);
    if (current.some(key => keys.has(key))) { duplicates++; return false; }
    current.forEach(key => keys.add(key)); return true;
  });
  return { items: unique, duplicates };
}
export function parseCitations(source, existing = []) {
  const input = source.replace(/^\uFEFF/, '').trim();
  if (!input || input.length > 2 * 1024 * 1024) throw new Error('请提供不超过 2 MB 的 BibTeX 或 RIS 内容。');
  const format = /^TY\s{0,2}-\s/m.test(input) ? '@ris/file' : /^\s*@(?:\w+)\s*[{(]/m.test(input) ? '@bibtex/text' : null;
  if (!format) throw new Error('无法识别格式，请使用 BibTeX（.bib）或 RIS（.ris），暂不解析普通排版后的引文。');
  if (format === '@ris/file' && (input.match(/^TY\s{0,2}-/gm)?.length !== input.match(/^ER\s{0,2}-/gm)?.length)) throw new Error('RIS 记录缺少 ER 结束标记。');
  let records;
  // BibLaTeX accepts BibTeX syntax and retains extension fields such as abstract.
  try { records = new Cite(input, { forceType: format === '@bibtex/text' ? '@biblatex/text' : format }).data; } catch { throw new Error('引文解析失败，请检查括号、字段和记录结束标记。'); }
  if (!records.length || records.length > 500) throw new Error('每次请导入 1–500 条成果。');
  const result = records.map(record => {
    const date = record.issued?.['date-parts']?.[0] || [];
    const year = Number(date[0]);
    const authors = (record.author || []).map(author => plain(author.literal || [author.given, author.family].filter(Boolean).join(' '))).join('; ');
    const identifier = doi(record.DOI);
    const sourceURL = record.URL || record.DOI || '';
    const link = identifier ? `https://doi.org/${identifier}` : /^https?:\/\//i.test(sourceURL) ? sourceURL : '';
    const title = plain(record.title);
    if (!title) throw new Error('存在无标题的记录，请补全后再导入。');
    const month = Number(date[1]) || 1, day = Number(date[2]) || 1;
    const sortDate = year >= 1000 && year <= 9999 && month <= 12 && day <= 31 ? `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}` : '';
    return { title, authors, journal: [plain(record['container-title'] || record.publisher), plain(record.volume) + (record.issue ? `(${plain(record.issue)})` : ''), plain(record.page)].filter(Boolean).join(', '), time: year ? String(year) : '', sortDate, doi: identifier, link, abstract: plain(record.abstract), category: ['book', 'chapter'].includes(record.type) ? 'book' : ['manuscript', 'report'].includes(record.type) ? 'working' : 'published' };
  });
  const updates = [];
  const seen = new Set();
  for (const item of result) {
    if (!item.abstract) continue;
    const keys = citationKeys(item);
    const index = existing.findIndex(old => citationKeys(old).some(key => keys.includes(key)));
    if (index < 0 || seen.has(index)) continue;
    const old = existing[index].abstract;
    const missing = old && typeof old === 'object' ? !old.zh || !old.en : !old;
    if (missing) { updates.push({ ...item, existingIndex: index }); seen.add(index); }
  }
  return { ...dedupeCitations(result, existing), updates, format: format === '@ris/file' ? 'RIS' : 'BibTeX', total: records.length };
}
export function pairedPublication(item, category = 'auto') {
  return Object.fromEntries(Object.entries({ ...item, category: category === 'auto' ? item.category : category }).map(([key, value]) => [key, ['category', 'sortDate', 'doi'].includes(key) ? value : { zh: value, en: value }]));
}
