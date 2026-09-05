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

export const navigation = navigationData as NavigationSettings

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
