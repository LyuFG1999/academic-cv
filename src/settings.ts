import type { Language } from './i18n'
import siteZh from './data/site.zh.json'
import siteEn from './data/site.en.json'
import socialData from './data/social.json'
import appearanceData from './data/appearance.json'

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

const normalizeProfile = (value: Partial<Profile>): Profile => ({
	fullName: value.fullName ?? '',
	title: value.title ?? '',
	institute: value.institute ?? '',
	authorName: value.authorName ?? '',
	intro: value.intro ?? '',
	researchStatement: value.researchStatement ?? '',
	researchImpact: value.researchImpact ?? '',
	avatar: value.avatar ?? '/uploads/profile.jpg',
	seoTitle: value.seoTitle ?? value.fullName ?? '',
	seoDescription: value.seoDescription ?? value.intro ?? '',
	researchAreas: value.researchAreas ?? [],
	projects: value.projects ?? [],
})

export const profile: Record<Language, Profile> = {
	zh: normalizeProfile(siteZh as Partial<Profile>),
	en: normalizeProfile(siteEn as Partial<Profile>),
}

export type SocialKey = 'email' | 'github' | 'orcid' | 'cnki' | 'school' | 'x' | 'linkedin'
export type SocialLink = { enabled: boolean; url: string }
export type SocialSettings = Record<SocialKey, SocialLink>

const legacySocial = socialData as Partial<Record<SocialKey, SocialLink | string>>
const socialKeys: SocialKey[] = ['email', 'github', 'orcid', 'cnki', 'school', 'x', 'linkedin']
export const social = Object.fromEntries(socialKeys.map((key) => {
	const item = legacySocial[key]
	return [key, typeof item === 'string'
		? { enabled: Boolean(item), url: item }
		: { enabled: item?.enabled ?? false, url: item?.url ?? '' }]
})) as SocialSettings

export type Appearance = typeof appearanceData
export const appearance: Appearance = appearanceData

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
