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

  return new Response(JSON.stringify({
    settings,
    cv: [...fields('cv'), { name: 'content', label: '履历正文 · Markdown', widget: 'text', required: false, hint: '放在教育和工作经历之后。# 一级标题与经历标题同级；支持列表、表格、链接与图片。' }],
    courses: fields('courses'),
  }), { headers: { 'Content-Type': 'application/json' } })
}
