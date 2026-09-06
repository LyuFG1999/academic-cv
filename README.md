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

- Chinese and English profile text paired under each setting, side by side on desktop and stacked on mobile
- Research areas and projects
- Shared portrait and individually switchable contact icons on the homepage and opening screen
- Light/dark color palettes and the opening animation switch
- Independent visibility switches for all three publication categories
- A temporary maintenance-mode switch
- Chinese and English CV entries
- Navigation visibility and bilingual labels
- Paper category visibility and bilingual courses
- Bilingual blog posts, images, and downloadable files

The blog editor includes an article file library, URL/Markdown copy actions, shared end-of-post downloads, and local Markdown/ZIP import. See [the file and import guide](docs/blog-files.md) for supported layouts and limits.

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

Opening `/admin/` displays one settings panel at a time, selected through the highlighted sidebar. Switching panels preserves edits. Blog entries use collapsible Markdown editors. All sections share one publish action. Validation brings hidden invalid fields into view before publishing. Same-file conflicts block publication rather than overwriting concurrent changes. Maintenance takes effect after deployment; it is not immediate access control. The old `/admin/editor/` redirects to the consolidated dashboard. The YAML configuration remains as the settings schema, not an independently publishing Decap interface.

The current content has been reset to an anonymous profile with an SVG avatar and empty research, CV, course and blog lists. Contact icons are hidden until a link is filled in and its switch enabled. The authentication service and repository configuration are not reset. See [the UI and functional audit](docs/redesign-audit.md) for verification details.

## Local development

```bash
npm ci
npm run dev
```

The local and GitHub Pages base path is `/academic-cv`, so open `http://localhost:4321/academic-cv/`.

## GitHub Pages deployment

The included `.github/workflows/deploy.yml` builds and deploys every push to `main`. In GitHub, set **Settings → Pages → Build and deployment → Source** to **GitHub Actions**.

The old Netlify site is retained but automatic builds are ignored by `netlify.toml`. Dashboard commits also contain `[skip netlify]`. Do not continue editing with the old Netlify dashboard. No paid plan changes or domain changes are made by this migration.
