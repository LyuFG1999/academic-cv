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

const normalizeCv = (value: Partial<LocalizedCv>): LocalizedCv => ({
	experiences: value.experiences ?? [],
	education: value.education ?? [],
	skills: value.skills ?? [],
	publications: value.publications ?? [],
})

export const cv: Record<Language, LocalizedCv> = {
	zh: normalizeCv(cvZh as Partial<LocalizedCv>),
	en: normalizeCv(cvEn as Partial<LocalizedCv>),
}
