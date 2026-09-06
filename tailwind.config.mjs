import fs from 'node:fs'
import typography from '@tailwindcss/typography'
import daisyui from 'daisyui'
import { contrastInk } from './src/lib/colors.mjs'

const siteSettings = JSON.parse(fs.readFileSync(new URL('./src/data/site-settings.json', import.meta.url), 'utf8'))
const appearance = siteSettings.appearance

/** @type {import('tailwindcss').Config} */
export default {
	content: ["./src/**/*.{astro,html,js,md,mdx,ts}"],
    theme: {
        extend: {},
    },
    plugins: [typography, daisyui],
    daisyui: {
        themes: [
            {
                "academic-light": {
                    "color-scheme": "light",
                    primary: appearance.light.primary,
                    "primary-content": contrastInk(appearance.light.primary),
                    secondary: appearance.light.secondary,
                    "secondary-content": contrastInk(appearance.light.secondary),
                    accent: appearance.light.accent,
                    "accent-content": contrastInk(appearance.light.accent),
                    neutral: "#1E293B",
                    "neutral-content": "#F8FAFC",
                    "base-100": appearance.light.background,
                    "base-200": appearance.light.surface,
                    "base-300": "#DCE3EE",
                    "base-content": "#182033",
                    info: "#0284C7",
                    success: "#15803D",
                    warning: "#B45309",
                    error: "#B91C1C"
                }
            },
            {
                "academic-dark": {
                    "color-scheme": "dark",
                    primary: appearance.dark.primary,
                    "primary-content": contrastInk(appearance.dark.primary),
                    secondary: appearance.dark.secondary,
                    "secondary-content": contrastInk(appearance.dark.secondary),
                    accent: appearance.dark.accent,
                    "accent-content": contrastInk(appearance.dark.accent),
                    neutral: "#D8E0EE",
                    "neutral-content": "#101625",
                    "base-100": appearance.dark.background,
                    "base-200": appearance.dark.surface,
                    "base-300": "#26314A",
                    "base-content": "#E8EDF7",
                    info: "#38BDF8",
                    success: "#4ADE80",
                    warning: "#FBBF24",
                    error: "#F87171"
                }
            }
        ],
    },
};
