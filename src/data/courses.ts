import type { Language } from '@/i18n'
import coursesZh from './courses.zh.json'
import coursesEn from './courses.en.json'

export type Course = {
	title: string
	code?: string
	term: string
	role?: string
	description?: string
	link?: string
}

export type CourseData = {
	intro: string
	courses: Course[]
}

const normalizeCourses = (value: Partial<CourseData>): CourseData => ({
	intro: value.intro ?? '',
	courses: value.courses ?? [],
})

export const courses: Record<Language, CourseData> = {
	zh: normalizeCourses(coursesZh as Partial<CourseData>),
	en: normalizeCourses(coursesEn as Partial<CourseData>),
}
