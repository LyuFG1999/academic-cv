# Academic CV · Astro Academia bilingual edition

This repository is a customized build of [Astro Academia](https://github.com/maiobarbero/astro_academia) for `LyuFG1999/academic-cv`.

## Included changes

- Chinese and English static routes: `/zh/` and `/en/`
- A language switch that keeps the current section
- Light and dark themes only
- A text-only Home hero (no portrait or contact links in the Home content)
- Sidebar contacts limited to Email, GitHub, X, ORCID, and CNKI
- An original book-and-search icon for CNKI
- Scroll reveal effects with `prefers-reduced-motion` support
- GitHub Pages configuration for `https://lyufg1999.github.io/academic-cv/`

## Add your information

Edit [`src/settings.ts`](src/settings.ts):

- Fill both `profile.zh` and `profile.en`.
- Replace `你的姓名 / Your Name`, title, institute, introduction, and research areas.
- Fill `social.email`, `social.github`, `social.x`, `social.orcid`, and `social.cnki`.
- Empty contact fields stay visible in the sidebar as “待填写 / Add link”, so unfinished links are never misleading.

Edit [`src/data/cv.ts`](src/data/cv.ts):

- Add corresponding Chinese and English entries under `cv.zh` and `cv.en`.
- Supported sections are education, experience, skills, and publications.

Replace [`src/assets/profile_pictures.jpg`](src/assets/profile_pictures.jpg) with the portrait used in the sidebar. The Home page deliberately does not display it.

## Local development

```bash
npm ci
npm run dev
```

The configured base path is `/academic-cv`, so open `http://localhost:4321/academic-cv/`.

## Deploy

The included `.github/workflows/deploy.yml` builds and deploys every push to `main`. In GitHub, set **Settings → Pages → Build and deployment → Source** to **GitHub Actions**.

If the repository is renamed or moved to a custom-domain root, update `websiteUrl` and `base` in `src/settings.ts`.
