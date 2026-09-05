# UI and settings review — 2026-09-05

The public entrance uses normal vertical flow for controls, profile, contacts and the entry cue. It does not overlay contacts at short viewport heights. The desktop sidebar is fixed to the viewport with its own scroll area; the main content scrolls separately. Mobile navigation remains a drawer.

The settings dashboard at `/admin/` directly renders expanded fields. Chinese and English are paired under each option, including CV entries and courses. Blog writing remains in `/admin/editor/`. There is no Quick Add control in the settings dashboard. Settings save through the existing Identity/Git Gateway connection in a single commit; a deployment status check distinguishes saved content from published content.

## Verification

- Astro check: zero errors, warnings or hints; production build succeeds with 20 pages.
- Chrome automated interactions at 1440×900, 1280×600, 390×844, 375×667, 667×375 and 320×568: no intro overlap or page overflow, theme retained through language changes and sidebar navigation, controls operable by keyboard, no uncaught JavaScript errors.
- A long-content fixture verifies that the desktop sidebar stays at x=0, y=0 while the main document scrolls by more than 1000px.
- Dashboard test with simulated authenticated Git Gateway responses: paired names, independent paper toggles, maintenance switch, atomic save and deployment feedback pass. This does not establish a real authenticated save through the owner's Netlify account.
- Maintenance build: public pages replaced, personal JSON-LD/share images omitted, RSS entries empty, generated upload directory omitted. Admin and original source uploads retained. Maintenance is OFF in the published settings.

## Platform setting

Live inspection confirmed that the current badge's outer iframe (`nl-badge-frame`) can be hidden even though its contents are isolated. Render-blocking styles now hide that specific iframe on public pages, the dashboard and the blog editor. The Identity modal is unaffected. The Netlify account-level injection setting itself has not been changed; the dashboard retains a link to it.
