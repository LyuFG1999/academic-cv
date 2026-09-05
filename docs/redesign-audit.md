# UI and functional audit — 2026-09-06

## Changes

- Moved contact icons from the fixed sidebar to the homepage, below the role and institution. Opening-screen icons remain available.
- Integrated compact language/theme controls with the content header instead of reserving an empty top row.
- Isolated frontend Tailwind/DaisyUI styles from the administration page. The previous shared `toggle` class caused switch labels and controls to overlap.
- Rebuilt the admin layout with a highlighted section menu, one visible panel, paired bilingual fields, responsive spacing and accessible labelled switches.
- Kept one publication action for settings, articles and attachments. Local drafts do not commit or deploy.
- Added hidden-panel validation, upload/publish interlocks, draft snapshots and filtering of unused queued uploads.
- Preserved authentication configuration. Removed platform migration slogans from the interface.
- Reset profile, contacts, research, courses and example blog content; replaced old photos with a shared anonymous vector avatar. Removed data remains recoverable in Git history.
- Fixed stale blog collection cache after removal of the last article, external blog image paths and storage-denied entrance handling. Excluded admin pages from sitemap/indexing hints.

## Verification

- `npm run build`: Astro check passes; production build succeeds.
- `node --test tests/github-publish.test.mjs`: six tests cover atomic publication, conflicts, no-op changes, allowed paths, Markdown URL handling and OAuth protections.
- Fresh-browser checks at 1440×900, 1024×768, 390×844, 320×568 and 667×375: no horizontal overflow; theme persists through language and page navigation; entrance dismisses; desktop sidebar remains fixed.
- Admin browser tests: nine section panels, one visible/active panel, preserved edits across panels, draft restoration, hidden invalid field recovery and properly separated 44×26 pixel switches.
- Mocked GitHub integration: local draft saves perform no writes; settings, one article and one attachment publish with one commit and one branch update; completion status follows deployment metadata.
- Desktop and mobile screenshots visually reviewed; no browser page errors in the tested flows.

## Scope and limitations

- GitHub write operations in browser tests are mocked; no test article or fixture profile is published. Owner OAuth credentials are not read, changed or exercised by automated tests.
- A successful build is not proof of deployment. The live deployment commit must be checked separately after publication.
- Reset contacts are intentionally hidden until configured. Empty content collections can produce informational Astro build messages.
- Static maintenance mode hides the newly built public pages after deployment; it cannot revoke previously downloaded copies or protect files through authentication.
