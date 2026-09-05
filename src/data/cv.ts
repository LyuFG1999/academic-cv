import type { Education, Experience, Publication, Skill } from '@/types/cv'
import type { Language } from '@/i18n'
import cvZh from './cv.zh.json'
import cvEn from './cv.en.json'

export type LocalizedCv = {
	experiences: Experience[]
	education: Education[]
	skills: Skill[]
	publications: Publication[]
}

export const cv: Record<Language, LocalizedCv> = {
	zh: cvZh as LocalizedCv,
	en: cvEn as LocalizedCv,
}
