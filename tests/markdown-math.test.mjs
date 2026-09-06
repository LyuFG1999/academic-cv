import test from 'node:test';
import assert from 'node:assert/strict';
import { renderMarkdown } from '../src/lib/markdown.js';

test('renders inline and display math with KaTeX', () => {
  const html = renderMarkdown('Inline $x_i^2$ and:\n\n$$\n\\sum_{i=1}^{n} x_i\n$$');
  assert.match(html, /class="katex"/);
  assert.match(html, /class="katex-display"/);
  assert.doesNotMatch(html, /\$\$\s*\\sum/);
});

test('keeps Markdown XSS filtering while rendering math', () => {
  const html = renderMarkdown('<script>alert(1)</script>\n\n$\\alpha + \\beta$');
  assert.doesNotMatch(html, /<script/i);
  assert.match(html, /class="katex"/);
});
