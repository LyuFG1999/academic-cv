import test from 'node:test';
import assert from 'node:assert/strict';
import { compareByAcademicDate, assetUrl } from '../src/lib/utils.ts';
test('year-only and full sort dates use one chronological scale',()=>{
 const list=[{time:'2020',sortDate:'2020-06-01'},{time:'2025'},{time:'至今'}].sort(compareByAcademicDate);
 assert.deepEqual(list.map(item=>item.time),['至今','2025','2020']);
});
test('uploaded assets stay portable on custom domains',()=>{
 assert.equal(assetUrl('/academic-cv/uploads/a.png',''),'/uploads/a.png');
 assert.equal(assetUrl('/uploads/a.png','/academic-cv'),'/academic-cv/uploads/a.png');
 assert.equal(assetUrl('javascript:alert(1)',''),'');
});
