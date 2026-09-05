# Bilingual Academic CV

This repository contains a bilingual academic website for `LyuFG1999/academic-cv`.

## Included features

- Chinese and English routes: `/zh/` and `/en/`
- A language switch that keeps the current section
- Light and dark themes
- A text-only Home hero; the portrait and contacts stay in the sidebar
- Email and GitHub contact links
- Scroll reveal effects with reduced-motion support
- Bilingual blog pages with file downloads
- A Decap CMS editor at `/admin/`
- Automatic path handling for both GitHub Pages and Netlify

## Edit content in the browser

The Decap CMS editor lets you update the following content without editing code:

- Chinese and English profile text
- Research areas and projects
- Sidebar portrait, email, and GitHub link
- Chinese and English CV entries
- Navigation visibility and bilingual labels
- Paper category visibility and bilingual courses
- Bilingual blog posts, images, and downloadable files

The recommended deployment is Netlify because Netlify Identity and Git Gateway provide login and GitHub write access for the editor.

1. Import this GitHub repository into Netlify.
2. The included `netlify.toml` supplies the build command (`npm run build`) and publish directory (`dist`).
3. In the Netlify site dashboard, enable **Identity** and set registration to **Invite only**.
4. Under **Identity → Services**, enable **Git Gateway**.
5. Invite your own email address from the Identity page.
6. Accept the invitation, then open `https://YOUR-SITE.netlify.app/admin/`.

Each save in the editor creates a commit in the GitHub repository. Netlify then rebuilds and publishes the site automatically.

## Edit content directly

If you prefer to edit files, the same CMS-managed content is stored in:

- `src/data/site.zh.json` and `src/data/site.en.json`
- `src/data/social.json`
- `src/data/cv.zh.json` and `src/data/cv.en.json`
- `src/data/navigation.json`
- `src/data/courses.zh.json` and `src/data/courses.en.json`
- `src/content/BlogPosts/`
- `public/uploads/`

Empty contact fields appear as “待填写 / Add link” instead of linking to a placeholder account.

## Local development

```bash
npm ci
npm run dev
```

The local and GitHub Pages base path is `/academic-cv`, so open `http://localhost:4321/academic-cv/`.

## GitHub Pages deployment

The included `.github/workflows/deploy.yml` builds and deploys every push to `main`. In GitHub, set **Settings → Pages → Build and deployment → Source** to **GitHub Actions**.

GitHub Pages remains available, but Decap CMS login is configured for Netlify Identity and Git Gateway. Use the Netlify site URL for `/admin/`.
