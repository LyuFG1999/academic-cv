import type { Language } from '@/i18n'
import navigationData from './navigation.json'

export type NavigationKey = 'home' | 'research' | 'papers' | 'courses' | 'blog' | 'cv'
export type PaperCategory = 'published' | 'working' | 'book'
export type PaperDisplay = 'all' | PaperCategory

export type NavigationItem = {
	enabled: boolean
	zh: string
	en: string
}

export type NavigationSettings = Record<NavigationKey, NavigationItem> & {
	paperDisplay: PaperDisplay
}

const defaults: NavigationSettings = {
	home: { enabled: true, zh: '首页', en: 'Home' },
	research: { enabled: true, zh: '研究', en: 'Research' },
	papers: { enabled: true, zh: '成果', en: 'Papers' },
	courses: { enabled: true, zh: '课程', en: 'Courses' },
	blog: { enabled: true, zh: '博客', en: 'Blog' },
	cv: { enabled: true, zh: '履历', en: 'CV' },
	paperDisplay: 'all',
}
const input = navigationData as Partial<NavigationSettings>
export const navigation = Object.fromEntries([
	...(['home', 'research', 'papers', 'courses', 'blog', 'cv'] as NavigationKey[]).map((key) => [key, { ...defaults[key], ...(input[key] ?? {}) }]),
	['paperDisplay', input.paperDisplay ?? defaults.paperDisplay],
]) as NavigationSettings

export const navigationOrder: Array<{ key: NavigationKey; path: string }> = [
	{ key: 'home', path: '' },
	{ key: 'research', path: 'research' },
	{ key: 'papers', path: 'papers' },
	{ key: 'courses', path: 'courses' },
	{ key: 'blog', path: 'blog' },
	{ key: 'cv', path: 'cv' },
]

export function navigationLabel(key: NavigationKey, lang: Language) {
	return navigation[key][lang]
}
