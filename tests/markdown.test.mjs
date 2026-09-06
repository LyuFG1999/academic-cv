import test from 'node:test';
import assert from 'node:assert/strict';
import { renderMarkdown } from '../src/lib/markdown.js';
import { contrastInk } from '../src/lib/colors.mjs';
test('Custom button palettes choose a legible foreground', () => {
  assert.equal(contrastInk('#ffffff'), '#000000'); assert.equal(contrastInk('#000000'), '#ffffff');
  assert.equal(contrastInk('#ffffaa'), '#000000');
});
test('CV Markdown headings match section hierarchy and support GFM tables', () => {
  const html = renderMarkdown('# Awards\n\n## Details\n\n| A | B |\n| - | - |\n| 1 | 2 |', { headingOffset: 1 });
  assert.match(html, /<h2>Awards<\/h2>/); assert.match(html, /<h3>Details<\/h3>/); assert.match(html, /<table>/); assert.doesNotMatch(html, /<h1/);
});
test('Markdown blocks scripts, event handlers and unsafe links', () => {
  const html = renderMarkdown('<script>alert(1)</script>\n\n<img src=x onerror=alert(1)>\n\n[bad](javascript:alert%281%29)\n\n![bad](javascript:x)');
  assert.doesNotMatch(html, /<script|onerror|javascript:/i);
});
test('Markdown images are portable in project and custom-domain builds', () => {
  assert.match(renderMarkdown('![alt](/uploads/a.png)', { base: '/academic-cv' }), /src="\/academic-cv\/uploads\/a.png"/);
  assert.match(renderMarkdown('![alt](/academic-cv/uploads/a.png)'), /src="\/uploads\/a.png"/);
});
