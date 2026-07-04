import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const read = (path) => readFileSync(join(root, path), 'utf8')
const required = [
  'docs/work-in-progress/u10h-acceptance.md',
  'docs/operations/u10h-production-acceptance-2026-07-04.md',
  'docs/audits/cross-site-quality-u10f-readiness.json',
  'docs/work-in-progress/u10g-architecture.md',
  '.github/workflows/production-smoke.yml',
]
for (const path of required) assert.equal(existsSync(join(root, path)), true, `missing file: ${path}`)

const check = (path, fragments) => {
  const source = read(path)
  for (const fragment of fragments) assert.ok(source.includes(fragment), `${path}: missing ${fragment}`)
}

check('docs/work-in-progress/u10h-acceptance.md', [
  'Status: complete',
  'Implementation PR: #471',
  'Implementation merge commit: `9f2b9abd5a3d23b50fc01075a5c4f041899babf5`',
  'Production Smoke routes: 20',
  'Hosted production acceptance: pass',
  'Production acceptance claimed: yes',
])

check('docs/operations/u10h-production-acceptance-2026-07-04.md', [
  'Status: complete',
  'Workflow run: 28701464391',
  'Artifact id: 8080315127',
  'Result: pass',
  'Expected main SHA: 9f2b9abd5a3d23b50fc01075a5c4f041899babf5',
  'Deployed SHA: 9f2b9abd5a3d23b50fc01075a5c4f041899babf5',
])

const u10f = JSON.parse(read('docs/audits/cross-site-quality-u10f-readiness.json'))
assert.equal(u10f.status, 'complete')
assert.equal(u10f.scope.production_smoke_routes, 20)
assert.equal(u10f.readiness_contract.production_acceptance_owner, 'U10H')
assert.equal(u10f.boundary.provider_separation_required, true)
assert.equal(u10f.boundary.provider_combination_authorized, false)

check('docs/work-in-progress/u10g-architecture.md', [
  'Status: complete',
  'Merged PR: #470',
  'Quality U10G Architecture: pass',
])

const smoke = read('.github/workflows/production-smoke.yml')
for (const fragment of [
  'name: Production Smoke',
  'test "${#routes[@]}" = \'20\'',
  '.storage.binding == "DB_TWITCH_HOT"',
  '.sourceMode == "real"',
  '.collector.state == "ok"',
  '.storage.binding == "DB_KICK_HOT"',
  '.sourceMode == "authenticated"',
  '.collector.state == "snapshot_available"',
  '.freshness.isFresh == true',
  '.freshness.isStale == false',
]) assert.ok(smoke.includes(fragment), `Production Smoke contract missing ${fragment}`)

const routeCount = (smoke.match(/^\s+'\/[^'\r\n]*'\s*$/gm) ?? []).length
assert.equal(routeCount, 20, 'Production Smoke route list must remain exactly 20 routes')

console.log('U10H production acceptance verification passed.')
console.log('- hosted production evidence is complete')
console.log('- provider-specific status and separation contracts remain required')
console.log('- U10H gate is independent of the active roadmap phase')
