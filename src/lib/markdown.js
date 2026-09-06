import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkRehype from 'remark-rehype';
import rehypeSanitize from 'rehype-sanitize';
import rehypeKatex from 'rehype-katex';
import rehypeStringify from 'rehype-stringify';
import remarkBase from './remark-base.mjs';

export function renderMarkdown(source, { base = '', headingOffset = 0 } = {}) {
  return String(unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMath)
    .use(remarkBase, { base })
    .use(() => tree => {
      const walk = node => {
        if (node.type === 'heading') node.depth = Math.min(6, node.depth + headingOffset);
        node.children?.forEach(walk);
      };
      walk(tree);
    })
    .use(remarkRehype)
    // Sanitize user Markdown before KaTeX expands trusted math nodes into HTML/MathML.
    // This keeps the existing XSS boundary without stripping KaTeX's generated markup.
    .use(rehypeSanitize)
    .use(rehypeKatex, { throwOnError: false, strict: 'warn' })
    .use(rehypeStringify)
    .processSync(source || ''));
}
