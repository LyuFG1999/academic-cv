import test from 'node:test';
import assert from 'node:assert/strict';
import { parseCitations, pairedPublication } from '../src/admin/citations.js';
const bib = '@article{key,title={Digital {Society}},author={Doe, Jane and Zhang, San},journal={Social Science},year={2025},doi={10.1234/ABC},volume={12},pages={1--9}}';
test('BibTeX extension abstracts, nested braces, Unicode and multiline text survive', () => {
  const source = '@article{a,title={Study},abstract={中文摘要\nwith {nested} terms and \\emph{emphasis}},year={2026}}';
  const item = parseCitations(source).items[0];
  assert.match(item.abstract, /中文摘要/); assert.match(item.abstract, /nested/); assert.match(item.abstract, /emphasis/);
  assert.equal(pairedPublication(item).abstract.zh, item.abstract);
});
test('Re-import can fill missing abstracts without duplicating or replacing existing text', () => {
  const source = '@article{a,title={Study},doi={10.1234/test},abstract={Recovered abstract}}';
  const partial = parseCitations(source, [{ doi: '10.1234/test', abstract: { zh: '自定义摘要', en: '' } }]);
  assert.equal(partial.items.length, 0); assert.equal(partial.updates.length, 1); assert.equal(partial.updates[0].existingIndex, 0);
  assert.equal(parseCitations(source, [{ doi: '10.1234/test', abstract: { zh: '摘要', en: 'Abstract' } }]).updates.length, 0);
});
test('RIS abstract survives and a URL in the DOI field is not turned into a fake DOI', () => {
  const item = parseCitations('TY  - JOUR\nTI  - Study\nAB  - A real abstract\nER  -\n').items[0];
  assert.equal(item.abstract, 'A real abstract');
  const bad = parseCitations('@article{b,title={Study},doi={https://example.com/paper}}').items[0];
  assert.equal(bad.doi, ''); assert.equal(bad.link, 'https://example.com/paper');
});
test('BibTeX parses author, title, DOI and publication fields',()=>{
  const parsed=parseCitations(bib);assert.equal(parsed.items.length,1);const item=parsed.items[0];
  assert.equal(item.title,'Digital Society');assert.match(item.authors,/Jane Doe/);assert.equal(item.time,'2025');assert.equal(item.link,'https://doi.org/10.1234/abc');
  const paired=pairedPublication(item);assert.equal(paired.title.zh,paired.title.en);assert.equal(paired.doi,'10.1234/abc');
});
test('RIS supports Chinese names, book types and repeats',()=>{
  const ris='TY  - BOOK\nTI  - 社会学研究\nAU  - 张三\nPY  - 2024\nPB  - 大学出版社\nER  -\n';
  const result=parseCitations(ris+ris);assert.equal(result.items.length,1);assert.equal(result.duplicates,1);assert.equal(result.items[0].category,'book');assert.equal(result.items[0].title,'社会学研究');
});
test('Existing paired publications deduplicate DOI; invalid input is rejected',()=>{
  assert.equal(parseCitations(bib,[{doi:'10.1234/abc'}]).items.length,0);
  assert.throws(()=>parseCitations('TY  - JOUR\nTI  - Broken'));assert.throws(()=>parseCitations('some formatted citation'));
  assert.throws(()=>parseCitations('@article{bad,title='));
});
