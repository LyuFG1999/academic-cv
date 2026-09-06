import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeSanitize from 'rehype-sanitize';
import rehypeStringify from 'rehype-stringify';
import remarkBase from './remark-base.mjs';

export function renderMarkdown(source, { base = '', headingOffset = 0 } = {}) {
  return String(unified().use(remarkParse).use(remarkGfm)
    .use(remarkBase, { base })
    .use(() => tree => {
      const walk = node => {
        if (node.type === 'heading') node.depth = Math.min(6, node.depth + headingOffset);
        node.children?.forEach(walk);
      };
      walk(tree);
    })
    .use(remarkRehype).use(rehypeSanitize).use(rehypeStringify).processSync(source || ''));
}
