import { readFileSync } from 'node:fs'
import { parse } from 'yaml'

// Field definitions are shared with the long-form editor, without publishing user data.
export function GET() {
  const config = parse(readFileSync(new URL('../../../public/admin/config.yml', import.meta.url), 'utf8'))
  const fields = (name: string) => {
    const value = config.collections?.find((c: { name: string }) => c.name === name)?.files?.[0]?.fields
    if (!Array.isArray(value)) throw new Error(`Missing admin field definitions: ${name}`)
    return structuredClone(value)
  }

  const settings = fields('settings')
  const profile = settings.find((field: { name?: string }) => field.name === 'profile')
  if (profile && Array.isArray(profile.fields) && !profile.fields.some((field: { name?: string }) => field.name === 'siteIcon')) {
    const authorIndex = profile.fields.findIndex((field: { name?: string }) => field.name === 'authorName')
    profile.fields.splice(authorIndex + 1, 0, {
      name: 'siteIcon',
      label: '网站图标 / Site icon',
      widget: 'image',
      required: false,
      hint: '用于浏览器标签页与收藏夹图标。建议上传正方形 PNG、JPG 或 WebP，推荐 512×512。留空时使用默认 🎓 图标。',
    })
  }

  const cv = fields('cv')
  const publications = cv.find((field: { name?: string }) => field.name === 'publications')
  if (publications && Array.isArray(publications.fields)) {
    publications.hint = '“首页代表性成果 / Featured on homepage”和“本人为通讯作者 / Corresponding author”均提供中文与 English 两个开关，分别控制当前语言版本。通讯作者开启后，仅在本人姓名后显示上标 *。'
    const categoryIndex = publications.fields.findIndex((field: { name?: string }) => field.name === 'category')
    if (!publications.fields.some((field: { name?: string }) => field.name === 'featured')) {
      publications.fields.splice(categoryIndex + 1, 0, {
        name: 'featured',
        label: '首页代表性成果 / Featured on homepage',
        widget: 'boolean',
        default: false,
        required: false,
      })
    }
    if (!publications.fields.some((field: { name?: string }) => field.name === 'correspondingAuthor')) {
      const featuredIndex = publications.fields.findIndex((field: { name?: string }) => field.name === 'featured')
      publications.fields.splice(featuredIndex + 1, 0, {
        name: 'correspondingAuthor',
        label: '本人为通讯作者 / Corresponding author',
        widget: 'boolean',
        default: false,
        required: false,
      })
    }
  }

  return new Response(JSON.stringify({
    settings,
    cv: [...cv, { name: 'content', label: '履历正文 · Markdown', widget: 'text', required: false, hint: '放在教育和工作经历之后。# 一级标题与经历标题同级；支持列表、表格、链接与图片。' }],
    courses: fields('courses'),
  }), { headers: { 'Content-Type': 'application/json' } })
}
