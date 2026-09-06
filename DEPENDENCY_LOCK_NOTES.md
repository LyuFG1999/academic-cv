# Dependency lock maintenance

This maintenance update regenerates `package-lock.json` after adding KaTeX-based Markdown math support and restores GitHub Pages CI to `npm ci`.

Locked math dependencies include:

- `katex`
- `rehype-katex`
- `remark-math`

The production deploy workflow now installs exactly the versions recorded in `package-lock.json`, then runs regression tests and the Astro production build before deployment.
