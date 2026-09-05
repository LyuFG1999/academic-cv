# Bilingual Academic CV

This repository contains a bilingual academic website for `LyuFG1999/academic-cv`.

## Included features

- Chinese and English routes: `/zh/` and `/en/`
- A language switch that keeps the current section
- Light and dark themes
- An optional full-screen profile entrance that dismisses permanently for the current browser session
- Seven independently controlled profile links: email, GitHub, ORCID, CNKI, school, X, and LinkedIn
- Premium responsive UI, configurable light/dark palettes, and reduced-motion support
- A one-switch bilingual maintenance page for temporarily hiding public content
- Bilingual blog pages with file downloads
- A direct settings/blog dashboard at `/admin/`, with local drafts and one atomic release
- Automatic path handling for both GitHub Pages and Netlify

## Edit content in the browser

The settings dashboard lets you update the following content without editing code:

- Chinese and English profile text paired vertically under each setting
- Research areas and projects
- Sidebar portrait and individually switchable profile links
- Light/dark color palettes and the opening animation switch
- Independent visibility switches for all three publication categories
- A temporary maintenance-mode switch
- Chinese and English CV entries
- Navigation visibility and bilingual labels
- Paper category visibility and bilingual courses
- Bilingual blog posts, images, and downloadable files

Production hosting is **GitHub Pages**. The dashboard uses **GitHub App OAuth**, not Netlify Identity or Git Gateway. The small authentication service is supplied in `auth-worker/` and needs one-time owner configuration; see [migration and setup instructions](docs/github-pages-migration.md).

Open https://lyufg1999.github.io/academic-cv/admin/ . Edit settings, blog posts and attachments together. **Save local draft** stores only in this browser and does not deploy. **Publish all** creates one atomic commit and starts GitHub Actions. Wait for deployment confirmation before expecting public changes. Local drafts do not sync between devices. Credentials are never saved in drafts.

## Edit content directly

If you prefer to edit files, the same CMS-managed content is stored in:

- `src/data/site-settings.json` (shared avatar, bilingual profile, navigation, social links, palettes, and maintenance mode)
- `src/data/cv.zh.json` and `src/data/cv.en.json`
- `src/data/courses.zh.json` and `src/data/courses.en.json`
- `src/content/BlogPosts/`
- `public/uploads/`

Disabled or empty contact fields are omitted from the public site.

Opening `/admin/` displays expanded bilingual settings and collapsible Markdown blog editors. All sections share one publish action. Same-file conflicts block publication rather than overwriting concurrent changes. Maintenance takes effect after deployment; it is not immediate access control. The old `/admin/editor/` redirects to the consolidated dashboard. The YAML configuration remains as the settings schema, not an independently publishing Decap interface.

## Local development

```bash
npm ci
npm run dev
```

The local and GitHub Pages base path is `/academic-cv`, so open `http://localhost:4321/academic-cv/`.

## GitHub Pages deployment

The included `.github/workflows/deploy.yml` builds and deploys every push to `main`. In GitHub, set **Settings → Pages → Build and deployment → Source** to **GitHub Actions**.

The old Netlify site is retained but automatic builds are ignored by `netlify.toml`. Dashboard commits also contain `[skip netlify]`. Do not continue editing with the old Netlify dashboard. No paid plan changes or domain changes are made by this migration.
