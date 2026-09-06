// @ts-check
import { defineConfig } from "astro/config";
import { fileURLToPath } from 'node:url';

import tailwind from "@astrojs/tailwind";

import { maintenance, template } from "./src/settings";
import { rm } from 'node:fs/promises';

import sitemap from "@astrojs/sitemap";
import remarkBase from './src/lib/remark-base.mjs';

// https://astro.build/config
export default defineConfig({
    vite: { resolve: { alias: [{ find: /^(node-fetch|sync-fetch)$/, replacement: fileURLToPath(new URL('./src/admin/citation-offline-fetch.js', import.meta.url)) }] } },
    markdown: { remarkPlugins: [[remarkBase, { base: template.base }]] },
    integrations: [tailwind({ applyBaseStyles: false }), sitemap({ filter: (page) => !page.includes('/admin/') && (!maintenance.enabled || /\/(zh|en)\/?$/.test(page)) }), {
        name: 'maintenance-media',
        hooks: {
            'astro:build:done': async ({ dir }) => {
                // Only generated output is removed; original uploads stay in public/ for recovery.
                if (maintenance.enabled) await rm(new URL('uploads/', dir), { recursive: true, force: true });
            },
        },
    }],
    site: template.websiteUrl,
    base: template.base,
});
