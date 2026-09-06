import test from 'node:test';
import assert from 'node:assert/strict';
import { parseCitations, pairedPublication } from '../src/admin/citations.js';
const bib = '@article{key,title={Digital {Society}},author={Doe, Jane and Zhang, San},journal={Social Science},year={2025},doi={10.1234/ABC},volume={12},pages={1--9}}';
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
