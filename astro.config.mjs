// @ts-check
import { defineConfig } from "astro/config";

import tailwind from "@astrojs/tailwind";

import { maintenance, template } from "./src/settings";
import { rm } from 'node:fs/promises';

import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
    integrations: [tailwind(), sitemap({ filter: (page) => !maintenance.enabled || /\/(zh|en)\/?$/.test(page) }), {
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
