import type { Education, Experience, Publication, Skill } from '@/types/cv'
import type { Language } from '@/i18n'
import cvZh from './cv.zh.json'
import cvEn from './cv.en.json'

export type LocalizedCv = {
	content: string
	experiences: Experience[]
	education: Education[]
	skills: Skill[]
	publications: Publication[]
}

type RawCv = Partial<Omit<LocalizedCv, 'publications'>> & {
	publications?: Array<Record<string, unknown>>
}

const asBoolean = (value: unknown) => value === true || value === 'true'

const normalizeCv = (value: unknown): LocalizedCv => {
	const source = (value && typeof value === 'object' ? value : {}) as RawCv
	const publications = Array.isArray(source.publications)
		? source.publications
			.map(item => ({
				...item,
				featured: asBoolean(item.featured),
				correspondingAuthor: asBoolean(item.correspondingAuthor),
			}) as unknown as Publication)
			.filter(item => item.title?.trim())
		: []

	return {
		content: typeof source.content === 'string' ? source.content : '',
		experiences: source.experiences ?? [],
		education: source.education ?? [],
		skills: source.skills ?? [],
		publications,
	}
}

export const cv: Record<Language, LocalizedCv> = {
	zh: normalizeCv(cvZh),
	en: normalizeCv(cvEn),
}
