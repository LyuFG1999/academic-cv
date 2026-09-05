import type { Language } from './i18n'
import siteZh from './data/site.zh.json'
import siteEn from './data/site.en.json'
import socialData from './data/social.json'

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

export const profile: Record<Language, Profile> = {
	zh: siteZh as Profile,
	en: siteEn as Profile,
}

export const social = socialData

const isNetlify = process.env.NETLIFY === 'true'

export const template = {
	websiteUrl: isNetlify ? (process.env.URL ?? 'https://example.netlify.app') : 'https://lyufg1999.github.io',
	menuLeft: false,
	transitions: true,
	lightTheme: 'light',
	darkTheme: 'dark',
	excerptLength: 200,
	postPerPage: 5,
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
	defaultImage: '/uploads/profile.jpg',
}
