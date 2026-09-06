export type AuthorToken = { text: string; highlighted: boolean }

export function tokenizeAuthors(authors: string, authorNames: string): AuthorToken[] {
	const aliases = authorNames
		.split('|')
		.map((name) => name.trim())
		.filter(Boolean)
		.sort((a, b) => b.length - a.length)
	if (!aliases.length) return [{ text: authors, highlighted: false }]

	const escapedAliases = aliases.map((name) => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
	const matcher = new RegExp(`(${escapedAliases.join('|')})`, 'giu')
	const normalizedAliases = aliases.map((name) => name.toLocaleLowerCase())
	return authors
		.split(matcher)
		.filter((text) => text.length > 0)
		.map((text) => ({
			text,
			highlighted: normalizedAliases.includes(text.toLocaleLowerCase()),
		}))
}

export function safeHttpUrl(value?: string): string | undefined {
	if (!value) return undefined
	try {
		const url = new URL(value)
		return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : undefined
	} catch {
		return undefined
	}
}

export function assetUrl(value: string, base: string): string {
	if (/^https?:\/\//i.test(value)) return value
	const portable = value.replace(/^\/academic-cv(?=\/uploads\/)/, '')
	return portable.startsWith('/uploads/') ? base + portable : ''
}

type DatedItem = { time: string; sortDate?: string }

function dateScore(item: DatedItem): number {
	if (item.sortDate) {
		const parsed = Date.parse(item.sortDate)
		if (Number.isFinite(parsed)) return parsed
	}
	if (/(present|current|now|today|至今|现在)/i.test(item.time)) return Number.MAX_SAFE_INTEGER
	const years = item.time.match(/(?:19|20)\d{2}/g)
	return years?.length ? Date.UTC(Number(years.at(-1)), 0, 1) : 0
}

export function compareByAcademicDate(a: DatedItem, b: DatedItem): number {
	return dateScore(b) - dateScore(a)
}
