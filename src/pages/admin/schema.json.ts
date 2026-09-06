import { readFileSync } from 'node:fs'
import { parse } from 'yaml'

// Field definitions are shared with the long-form editor, without publishing user data.
export function GET() {
  const config = parse(readFileSync(new URL('../../../public/admin/config.yml', import.meta.url), 'utf8'))
  const fields = (name: string) => {
    const value = config.collections?.find((c: { name: string }) => c.name === name)?.files?.[0]?.fields
    if (!Array.isArray(value)) throw new Error(`Missing admin field definitions: ${name}`)
    return value
  }
  return new Response(JSON.stringify({
    settings: fields('settings'),
    cv: [...fields('cv'), { name: 'content', label: '履历正文 · Markdown', widget: 'text', required: false, hint: '放在教育和工作经历之后。# 一级标题与经历标题同级；支持列表、表格、链接与图片。' }],
    courses: fields('courses'),
  }), { headers: { 'Content-Type': 'application/json' } })
}
