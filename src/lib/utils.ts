import { template } from '../settings'

export function highlightAuthor(authors: string, authorName: string): string{
	const author = authors.split(', ')
	if (authorName && author.includes(authorName)){
		return authors.replace(authorName, `<span class='font-medium underline'>${authorName}</span>`)
	}
	return authors
}

export function trimExcerpt(excerpt: string): string {
	const excerptLength = template.excerptLength
	return excerpt.length > excerptLength ? `${excerpt.substring(0, excerptLength)}...` : excerpt
}
