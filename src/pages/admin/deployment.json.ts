import { maintenance } from '@/settings'
export function GET() {
  return new Response(JSON.stringify({ commit: process.env.GITHUB_SHA ?? process.env.COMMIT_REF ?? 'local', maintenance: maintenance.enabled }), { headers: { 'Content-Type': 'application/json' } })
}
