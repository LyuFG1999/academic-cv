import { readFileSync } from 'node:fs'
import { parse } from 'yaml'

export function GET() {
  const config = parse(readFileSync(new URL('../../../public/admin/config.yml', import.meta.url), 'utf8'))
  const fields = (name: string) => {
    const value = config.collections?.find((c: { name: string }) => c.name === name)?.files?.[0]?.fields
    if (!Array.isArray(value)) throw new Error(`Missing admin field definitions: ${name}`)
    return structuredClone(value)
  }

  const settings = fields('settings')
  const profile = settings.find((field: { name?: string }) => field.name === 'profile')
  if (profile && Array.isArray(profile.fields)) {
    if (!profile.fields.some((field: { name?: string }) => field.name === 'siteIcon')) {
      const authorIndex = profile.fields.findIndex((field: { name?: string }) => field.name === 'authorName')
      profile.fields.splice(authorIndex + 1, 0, { name: 'siteIcon', label: '网站图标 / Site icon', widget: 'image', required: false, hint: '用于浏览器标签页与收藏夹图标。建议上传正方形 PNG、JPG 或 WebP，推荐 512×512。留空时使用默认 🎓 图标。' })
    }
    const projects = profile.fields.find((field: { name?: string }) => field.name === 'projects')
    if (projects && Array.isArray(projects.fields)) {
      const bilingual = (name: string, label: string, text = false) => {
        if (!projects.fields.some((field: { name?: string }) => field.name === name)) projects.fields.push({ name, label, widget: 'object', fields: [{ name: 'zh', label: '中文', widget: text ? 'text' : 'string', required: false }, { name: 'en', label: 'English', widget: text ? 'text' : 'string', required: false }] })
      }
      bilingual('source', '项目来源 / Source')
      bilingual('code', '项目代号 / Project code')
      bilingual('status', '项目状态 / Status')
      bilingual('role', '参与角色 / Role')
      bilingual('amount', '项目金额 / Funding')
      projects.hint = '每个项目可独立展开编辑。前台使用全宽卡片：项目名称为主标题，来源、代号、角色与状态直接作为信息展示，不显示字段名称；项目金额保留“项目金额 / Funding”标签。'
    }
  }

  const navigation = settings.find((field: { name?: string }) => field.name === 'navigation')
  const visibility = navigation?.fields?.find((field: { name?: string }) => field.name === 'paperVisibility')
  if (visibility && Array.isArray(visibility.fields) && !visibility.fields.some((field: { name?: string }) => field.name === 'policyReport')) {
    visibility.fields.push({ name: 'policyReport', label: '显示资政报告', widget: 'boolean', default: true, required: false })
    visibility.hint = '已发表论文、工作论文、书籍、资政报告可分别开关。'
  }

  const cv = fields('cv')
  const publications = cv.find((field: { name?: string }) => field.name === 'publications')
  if (publications && Array.isArray(publications.fields)) {
    publications.hint = '“首页代表性成果 / Featured on homepage”和“本人为通讯作者 / Corresponding author”均提供中文与 English 两个开关。论文与书籍可填写多个标签，使用中文分号“；”或英文分号“;”分隔。资政报告使用独立模块，不参与 BibTeX/RIS 导入导出。'
    const categoryIndex = publications.fields.findIndex((field: { name?: string }) => field.name === 'category')
    if (!publications.fields.some((field: { name?: string }) => field.name === 'featured')) publications.fields.splice(categoryIndex + 1, 0, { name: 'featured', label: '首页代表性成果 / Featured on homepage', widget: 'boolean', default: false, required: false })
    if (!publications.fields.some((field: { name?: string }) => field.name === 'correspondingAuthor')) {
      const featuredIndex = publications.fields.findIndex((field: { name?: string }) => field.name === 'featured')
      publications.fields.splice(featuredIndex + 1, 0, { name: 'correspondingAuthor', label: '本人为通讯作者 / Corresponding author', widget: 'boolean', default: false, required: false })
    }
    if (!publications.fields.some((field: { name?: string }) => field.name === 'tags')) {
      const abstractIndex = publications.fields.findIndex((field: { name?: string }) => field.name === 'abstract')
      const tagsField = { name: 'tags', label: '标签 / Tags', widget: 'string', required: false, hint: '可填写多个标签，使用中文分号“；”或英文分号“;”分隔，例如：人工智能；劳动力市场；社会分层。' }
      if (abstractIndex >= 0) publications.fields.splice(abstractIndex + 1, 0, tagsField)
      else publications.fields.push(tagsField)
    }
  }
  if (!cv.some((field: { name?: string }) => field.name === 'policyReports')) {
    cv.push({
      name: 'policyReports', label: '资政报告', widget: 'list', required: false, collapsed: true, hint: '资政报告为独立成果模块，不参与 BibTeX/RIS 导入与导出。',
      fields: [
        { name: 'title', label: '名称 / Title', widget: 'string' },
        { name: 'authors', label: '作者 / Authors', widget: 'string', hint: '多位作者可用分号分隔。' },
        { name: 'time', label: '时间 / Date', widget: 'string' },
        { name: 'sortDate', label: '排序日期 / Sort date', widget: 'datetime', required: false },
        { name: 'adoptedBy', label: '被采纳机构 / Adopted by', widget: 'string' },
      ],
    })
  }

  return new Response(JSON.stringify({ settings, cv: [...cv, { name: 'content', label: '履历正文 · Markdown', widget: 'text', required: false, hint: '放在教育和工作经历之后。# 一级标题与经历标题同级；支持列表、表格、链接与图片。' }], courses: fields('courses') }), { headers: { 'Content-Type': 'application/json' } })
}
