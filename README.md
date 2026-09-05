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
- A direct settings dashboard at `/admin/` and a Decap blog editor at `/admin/editor/`
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

- `src/data/site-settings.json` (shared avatar, bilingual profile, navigation, social links, palettes, and maintenance mode)
- `src/data/cv.zh.json` and `src/data/cv.en.json`
- `src/data/courses.zh.json` and `src/data/courses.en.json`
- `src/content/BlogPosts/`
- `public/uploads/`

Disabled or empty contact fields are omitted from the public site.

Opening `/admin/` displays a single settings dashboard with expanded fields and section links. Profile, CV, publications and courses all pair Chinese and English fields within each item. Only blog writing opens the dedicated Decap editor. Saves use Netlify Identity and Git Gateway, create one atomic Git commit, and report deployment progress. Maintenance takes effect after deployment; the admin remains available to turn it off. Netlify's platform-injected “Powered by Netlify” badge is controlled under **Project configuration → General → Powered by Netlify badge**; the dashboard links to that setting.

## Local development

```bash
npm ci
npm run dev
```

The local and GitHub Pages base path is `/academic-cv`, so open `http://localhost:4321/academic-cv/`.

## GitHub Pages deployment

The included `.github/workflows/deploy.yml` builds and deploys every push to `main`. In GitHub, set **Settings → Pages → Build and deployment → Source** to **GitHub Actions**.

GitHub Pages remains available, but Decap CMS login is configured for Netlify Identity and Git Gateway. Use the Netlify site URL for `/admin/`.
