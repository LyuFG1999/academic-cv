import type { Language } from './i18n'

type ResearchArea = {
	title: string
	description: string
	field: string
}
type Profile = {
	fullName: string
	title: string
	institute: string
	authorName: string
	intro: string
	researchAreas: ResearchArea[]
}

export const profile: Record<Language, Profile> = {
	zh: {
		fullName: '你的姓名',
		title: '社会学研究者',
		institute: '你的院校或研究机构',
		authorName: '',
		intro: '在这里用两三句话介绍你的研究主题、学术关切与代表性贡献。',
		researchAreas: [],
	},
	en: {
		fullName: 'Your Name',
		title: 'Sociology Researcher',
		institute: 'Your University or Research Institute',
		authorName: '',
		intro: 'Introduce your research agenda, academic interests, and key contributions in two or three sentences.',
		researchAreas: [],
	},
}

// Leave a value empty until the real address is ready. The sidebar will mark it as pending.
export const social = {
	email: '',
	github: 'https://github.com/LyuFG1999',
	x: '',
	orcid: '',
	cnki: '',
}

export const template = {
	websiteUrl: 'https://lyufg1999.github.io',
	menuLeft: false,
	transitions: true,
	lightTheme: 'light',
	darkTheme: 'dark',
	excerptLength: 200,
	postPerPage: 5,
	base: '/academic-cv',
}

export const seo = {
	zh: {
		defaultTitle: '学术简历',
		defaultDescription: '个人学术主页、研究成果与履历。',
	},
	en: {
		defaultTitle: 'Academic CV',
		defaultDescription: 'Personal academic profile, research outputs, and curriculum vitae.',
	},
	defaultImage: '/images/astro-academia.png',
}
