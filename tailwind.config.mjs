import fs from 'node:fs'
import typography from '@tailwindcss/typography'
import daisyui from 'daisyui'

const appearance = JSON.parse(fs.readFileSync(new URL('./src/data/appearance.json', import.meta.url), 'utf8'))

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
                    "primary-content": "#ffffff",
                    secondary: appearance.light.secondary,
                    "secondary-content": "#ffffff",
                    accent: appearance.light.accent,
                    "accent-content": "#ffffff",
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
                    "primary-content": "#0B1020",
                    secondary: appearance.dark.secondary,
                    "secondary-content": "#0B1020",
                    accent: appearance.dark.accent,
                    "accent-content": "#0B1020",
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
