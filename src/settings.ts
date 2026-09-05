import type { Language } from './i18n'
import settingsData from './data/site-settings.json'

export type ResearchArea = {
	title: string
	description: string
	field: string
}

export type Project = {
	title: string
	description: string
	link?: string
}

export type Profile = {
	fullName: string
	title: string
	institute: string
	authorName: string
	intro: string
	researchStatement: string
	researchImpact: string
	avatar: string
	seoTitle: string
	seoDescription: string
	researchAreas: ResearchArea[]
	projects: Project[]
}

const localized = <T>(value: Partial<Record<Language, T>> | undefined, lang: Language, fallback: T): T => value?.[lang] ?? fallback
type BilingualText = Partial<Record<Language, string>>
const data = settingsData as Omit<typeof settingsData, 'profile'> & {
	profile: Omit<typeof settingsData.profile, 'researchAreas' | 'projects'> & {
		researchAreas: { title: BilingualText; description: BilingualText; field: string }[]
		projects: { title: BilingualText; description: BilingualText; link?: BilingualText }[]
	}
}

const buildProfile = (lang: Language): Profile => ({
	fullName: localized(data.profile.fullName, lang, ''),
	title: localized(data.profile.title, lang, ''),
	institute: localized(data.profile.institute, lang, ''),
	authorName: localized(data.profile.authorName, lang, ''),
	intro: localized(data.profile.intro, lang, ''),
	researchStatement: localized(data.profile.researchStatement, lang, ''),
	researchImpact: localized(data.profile.researchImpact, lang, ''),
	avatar: data.avatar || '/uploads/avatar.svg',
	seoTitle: localized(data.profile.seoTitle, lang, localized(data.profile.fullName, lang, '')),
	seoDescription: localized(data.profile.seoDescription, lang, localized(data.profile.intro, lang, '')),
	researchAreas: (data.profile.researchAreas ?? [])
		.map((item) => ({ title: localized(item.title, lang, ''), description: localized(item.description, lang, ''), field: item.field }))
		.filter((item) => item.title || item.description),
	projects: (data.profile.projects ?? [])
		.map((item) => ({ title: localized(item.title, lang, ''), description: localized(item.description, lang, ''), link: localized(item.link, lang, '') }))
		.filter((item) => item.title || item.description),
})

export const profile: Record<Language, Profile> = { zh: buildProfile('zh'), en: buildProfile('en') }

export type SocialKey = 'email' | 'github' | 'orcid' | 'cnki' | 'school' | 'x' | 'linkedin'
export type SocialLink = { enabled: boolean; url: string }
export type SocialSettings = Record<SocialKey, SocialLink>

const legacySocial = data.social as Partial<Record<SocialKey, SocialLink | string>>
const socialKeys: SocialKey[] = ['email', 'github', 'orcid', 'cnki', 'school', 'x', 'linkedin']
export const social = Object.fromEntries(socialKeys.map((key) => {
	const item = legacySocial[key]
	return [key, typeof item === 'string'
		? { enabled: Boolean(item), url: item }
		: { enabled: item?.enabled ?? false, url: item?.url ?? '' }]
})) as SocialSettings

export type Appearance = typeof data.appearance
export const appearance: Appearance = data.appearance

export const maintenance = {
	enabled: data.maintenance?.enabled ?? false,
	title: {
		zh: data.maintenance?.title?.zh ?? '网站维护中',
		en: data.maintenance?.title?.en ?? 'Site under maintenance',
	},
	message: {
		zh: data.maintenance?.message?.zh ?? '网站正在更新，很快回来。',
		en: data.maintenance?.message?.en ?? 'The site is being updated and will be back shortly.',
	},
}

const isNetlify = process.env.NETLIFY === 'true'

export const template = {
	websiteUrl: isNetlify ? (process.env.URL ?? 'https://example.netlify.app') : 'https://lyufg1999.github.io',
	transitions: true,
	lightTheme: 'academic-light',
	darkTheme: 'academic-dark',
	base: isNetlify ? '' : '/academic-cv',
}

export const seo = {
	zh: {
		defaultTitle: profile.zh.seoTitle,
		defaultDescription: profile.zh.seoDescription,
	},
	en: {
		defaultTitle: profile.en.seoTitle,
		defaultDescription: profile.en.seoDescription,
	},
}
