import rss from '@astrojs/rss'
import { getCollection } from 'astro:content'
import { languages } from '@/i18n'
import { maintenance, seo, template } from '@/settings'

export function getStaticPaths() {
  return languages.map((lang) => ({ params: { lang }, props: { lang } }))
}

export async function GET(context) {
  const { lang } = context.props
  const blog = (await getCollection('blog'))
    .filter((post) => !post.data.draft && post.data.language === lang)
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf())

  return rss({
    title: maintenance.enabled ? maintenance.title[lang] : seo[lang].defaultTitle,
    description: maintenance.enabled ? maintenance.message[lang] : seo[lang].defaultDescription,
    site: new URL(`${template.base}/${lang}/`, context.site),
    items: (maintenance.enabled ? [] : blog).map((post) => ({
      title: post.data.title,
      pubDate: post.data.date,
      description: post.data.excerpt,
      link: `${template.base}/${lang}/blog/${post.id}/`,
    })),
    customData: `<language>${lang === 'zh' ? 'zh-CN' : 'en-US'}</language>`,
  })
}
