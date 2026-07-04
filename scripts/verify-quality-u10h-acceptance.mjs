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
  'docs/product/current-roadmap.md',
  'docs/product/current-schedule.md',
  '.github/workflows/production-smoke.yml',
  '.github/workflows/quality-u10h-acceptance.yml',
  '.github/workflows/quality-u10h-production-acceptance.yml',
]
for (const path of required) assert.equal(existsSync(join(root, path)), true, `missing file: ${path}`)

const checkFragments = (path, fragments) => {
  const source = read(path)
  for (const fragment of fragments) assert.ok(source.includes(fragment), `${path}: missing ${fragment}`)
}

checkFragments('docs/work-in-progress/u10h-acceptance.md', [
  'Status: complete',
  'Implementation PR: #471',
  'Implementation merge commit: `9f2b9abd5a3d23b50fc01075a5c4f041899babf5`',
  'Production Smoke routes: 20',
  'Hosted production acceptance: pass',
  'Production acceptance claimed: yes',
  'Phase 11 branch created: no',
])

checkFragments('docs/operations/u10h-production-acceptance-2026-07-04.md', [
  'Status: complete',
  'Workflow run: 28701464391',
  'Artifact id: 8080315127',
  'Result: pass',
  'Expected main SHA: 9f2b9abd5a3d23b50fc01075a5c4f041899babf5',
  'Deployed SHA: 9f2b9abd5a3d23b50fc01075a5c4f041899babf5',
  'Checked at: 2026-07-04T09:08:03Z',
])

const u10f = JSON.parse(read('docs/audits/cross-site-quality-u10f-readiness.json'))
assert.equal(u10f.status, 'complete')
assert.equal(u10f.scope.production_smoke_routes, 20)
assert.equal(u10f.readiness_contract.production_acceptance_claimed, false)
assert.equal(u10f.readiness_contract.production_acceptance_owner, 'U10H')
assert.equal(u10f.boundary.provider_separation_required, true)
assert.equal(u10f.boundary.provider_combination_authorized, false)

checkFragments('docs/work-in-progress/u10g-architecture.md', [
  'Status: complete',
  'Merged PR: #470',
  'Quality U10G Architecture: pass',
])

checkFragments('docs/product/current-roadmap.md', [
  'Phase 10 U10H production acceptance complete PR #471',
  'U10H canonical closeout PR #472',
  'Active implementation branch: none',
  'Exact next branch: work-quality-phase11-acceptance-operations',
  'Phase 11 branch created: no',
])

checkFragments('docs/product/current-schedule.md', [
  'U10H Production Smoke routes: 20',
  'U10H status APIs: 2',
  'U10H provider separation failures: 0',
  'U10H public runtime failures: 0',
  'U10H explicit 404 failures: 0',
  'U10H production acceptance result: pass',
  'U10H accepted production SHA: 9f2b9abd5a3d23b50fc01075a5c4f041899babf5',
  'U10H workflow run: 28701464391',
  'U10H artifact id: 8080315127',
])

const smoke = read('.github/workflows/production-smoke.yml')
for (const fragment of [
  'name: Production Smoke',
  'Wait for the matching production deployment',
  'test "${#routes[@]}" = \'20\'',
  '<title>History & Trends for Twitch live streams | ViewLoom</title>',
  '<title>History & Trends for Kick live streams | ViewLoom</title>',
  '.storage.binding == "DB_TWITCH_HOT"',
  '.sourceMode == "real"',
  '.collector.state == "ok"',
  '.storage.binding == "DB_KICK_HOT"',
  '.sourceMode == "authenticated"',
  '.collector.state == "snapshot_available"',
  '.freshness.isFresh == true',
  '.freshness.isStale == false',
  'data-viewloom-not-found="v1"',
  'cloudflare-preview-probe.json',
]) assert.ok(smoke.includes(fragment), `Production Smoke contract missing ${fragment}`)

const routeCount = (smoke.match(/^\s+'\/[^'\r\n]*'\s*$/gm) ?? []).length
assert.equal(routeCount, 20, 'Production Smoke route list must remain exactly 20 routes')

console.log('U10H production acceptance verification passed.')
console.log('- hosted production evidence is complete')
console.log('- provider-specific status and separation contracts remain required')
console.log('- Phase 11 acceptance and operations is exact next and not yet created')
