export type Language = 'zh' | 'en'

export const languages: Language[] = ['zh', 'en']

export const copy = {
	zh: {
		home: '首页',
		research: '研究',
		papers: '成果',
		cv: '履历',
		language: 'English',
		theme: '切换明暗主题',
		openMenu: '打开菜单',
		closeMenu: '关闭菜单',
		introPrefix: '你好，我是',
		researchAreas: '研究领域',
		recentPublications: '近期成果',
		researchStatement: '研究简介',
		currentProjects: '当前项目',
		researchImpact: '研究贡献',
		publications: '学术成果',
		authors: '作者',
		readPaper: '查看成果',
		education: '教育经历',
		experiences: '工作经历',
		lastPublications: '代表性成果',
		skills: '研究技能',
		emptyProfile: '双语网站结构已经就绪。请在 src/settings.ts 和 src/data/cv.ts 中填写你的真实资料。',
		emptyResearch: '请在 src/settings.ts 中添加研究领域，并在本页替换研究陈述。',
		emptyPapers: '请在 src/data/cv.ts 中添加论文、著作或其他成果。',
		emptyCv: '请在 src/data/cv.ts 中添加教育、工作、技能与成果信息。',
		contact: '联系方式',
		email: '邮箱',
		github: 'GitHub',
		x: 'X',
		orcid: 'ORCID',
		cnki: '知网主页',
		pending: '待填写',
		copyright: '保留所有权利',
		builtWith: '基于 Astro Academia 构建',
	},
	en: {
		home: 'Home',
		research: 'Research',
		papers: 'Papers',
		cv: 'CV',
		language: '中文',
		theme: 'Toggle light and dark theme',
		openMenu: 'Open menu',
		closeMenu: 'Close menu',
		introPrefix: "Hello, I'm",
		researchAreas: 'Research Areas',
		recentPublications: 'Recent Publications',
		researchStatement: 'Research Statement',
		currentProjects: 'Current Projects',
		researchImpact: 'Research Impact',
		publications: 'Publications',
		authors: 'Authors',
		readPaper: 'Read Paper',
		education: 'Education',
		experiences: 'Experience',
		lastPublications: 'Selected Publications',
		skills: 'Skills',
		emptyProfile: 'The bilingual structure is ready. Add your real details in src/settings.ts and src/data/cv.ts.',
		emptyResearch: 'Add research areas in src/settings.ts and replace the research statement on this page.',
		emptyPapers: 'Add papers, books, or other outputs in src/data/cv.ts.',
		emptyCv: 'Add education, experience, skills, and publications in src/data/cv.ts.',
		contact: 'Contact',
		email: 'Email',
		github: 'GitHub',
		x: 'X',
		orcid: 'ORCID',
		cnki: 'CNKI Profile',
		pending: 'Add link',
		copyright: 'All rights reserved',
		builtWith: 'Built with Astro Academia',
	},
} as const

export function isLanguage(value: string | undefined): value is Language {
	return value === 'zh' || value === 'en'
}

export function localizedPath(lang: Language, path = '') {
	const normalized = path === '/' ? '' : path.replace(/^\//, '')
	return `/${lang}/${normalized}`.replace(/\/$/, '') || `/${lang}`
}
