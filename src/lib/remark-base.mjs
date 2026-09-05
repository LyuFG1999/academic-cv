// Keep CMS Markdown portable: store /uploads paths and prefix only when building.
export default function remarkBase({ base = '' } = {}) {
  return function transform(tree) {
    function walk(node) {
      if (['link', 'image', 'definition'].includes(node.type) && typeof node.url === 'string') {
        const portable = node.url.replace(/^\/academic-cv(?=\/uploads\/)/, '');
        if (portable.startsWith('/uploads/')) node.url = base + portable;
      }
      node.children?.forEach(walk);
    }
    walk(tree);
  };
}
