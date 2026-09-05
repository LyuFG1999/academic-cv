import { readFileSync } from 'node:fs'
import { parse } from 'yaml'

// Field definitions are shared with the long-form editor, without publishing user data.
export function GET() {
  const config = parse(readFileSync(new URL('../../../public/admin/config.yml', import.meta.url), 'utf8'))
  return new Response(JSON.stringify({
    settings: config.collections.find((c: { name: string }) => c.name === 'settings').files[0].fields,
    cv: config.collections.find((c: { name: string }) => c.name === 'cv').files[0].fields,
    courses: config.collections.find((c: { name: string }) => c.name === 'courses').files[0].fields,
  }), { headers: { 'Content-Type': 'application/json' } })
}
