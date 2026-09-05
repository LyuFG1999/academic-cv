import type { Education, Experience, Publication, Skill } from '@/types/cv'
import type { Language } from '@/i18n'

export type LocalizedCv = {
	experiences: Experience[]
	education: Education[]
	skills: Skill[]
	publications: Publication[]
}

// Add the same item in both language blocks when you want it to appear bilingually.
export const cv: Record<Language, LocalizedCv> = {
	zh: {
		experiences: [],
		education: [],
		skills: [],
		publications: [],
	},
	en: {
		experiences: [],
		education: [],
		skills: [],
		publications: [],
	},
}
