import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const read = (path) => readFileSync(join(root, path), 'utf8')

for (const path of [
  'docs/work-in-progress/u10h-acceptance.md',
  'docs/audits/cross-site-quality-u10f-readiness.json',
  'docs/work-in-progress/u10g-architecture.md',
  'docs/product/current-roadmap.md',
  'docs/product/current-schedule.md',
  '.github/workflows/production-smoke.yml',
  '.github/workflows/quality-u10h-acceptance.yml',
]) assert.equal(existsSync(join(root, path)), true, `missing file: ${path}`)

const note = read('docs/work-in-progress/u10h-acceptance.md')
for (const fragment of [
  'Status: active',
  'Branch: `work-quality-u10h-acceptance`',
  'Production Smoke routes: 20',
  'Provider separation failures accepted: 0',
  'Public runtime failures accepted: 0',
  'Hosted evidence required: yes',
  'Matching production main SHA required: yes',
  'Production acceptance claimed: no',
]) assert.ok(note.includes(fragment), `U10H note missing ${fragment}`)

const u10f = JSON.parse(read('docs/audits/cross-site-quality-u10f-readiness.json'))
assert.equal(u10f.status, 'complete')
assert.equal(u10f.scope.production_smoke_routes, 20)
assert.equal(u10f.readiness_contract.production_acceptance_claimed, false)
assert.equal(u10f.readiness_contract.production_acceptance_owner, 'U10H')
assert.equal(u10f.readiness_contract.provider_status_checks_retained, true)
assert.equal(u10f.readiness_contract.separate_d1_binding_checks_retained, true)
assert.equal(u10f.readiness_contract.collector_freshness_checks_retained, true)
assert.equal(u10f.readiness_contract.explicit_404_checks_retained, true)
assert.equal(u10f.boundary.provider_separation_required, true)
assert.equal(u10f.boundary.provider_combination_authorized, false)

const u10g = read('docs/work-in-progress/u10g-architecture.md')
for (const fragment of ['Status: complete', 'Merged PR: #470', 'Quality U10G Architecture: pass']) assert.ok(u10g.includes(fragment), `U10G retained evidence missing ${fragment}`)

const roadmap = read('docs/product/current-roadmap.md')
for (const fragment of [
  'Phase 10 U10G architecture complete PR #470',
  'Phase 10 U10H production acceptance active',
  'Active implementation branch: work-quality-u10h-acceptance',
  'Exact next branch: work-quality-phase11-acceptance-operations',
]) assert.ok(roadmap.includes(fragment), `roadmap missing ${fragment}`)

const schedule = read('docs/product/current-schedule.md')
for (const fragment of [
  'U10H Production Smoke routes: 20',
  'U10H provider separation failures accepted: 0',
  'U10H public runtime failures accepted: 0',
  'U10H production acceptance source: hosted production and recorded evidence',
]) assert.ok(schedule.includes(fragment), `schedule missing ${fragment}`)

const smoke = read('.github/workflows/production-smoke.yml')
for (const fragment of [
  'name: Production Smoke',
  "- 'docs/work-in-progress/u10h-acceptance.md'",
  'Wait for the matching production deployment',
  'deployed="$(jq -r',
  '[ "$deployed" = "$expected" ]',
  'Verify all repository-owned production pages',
  'test "${#routes[@]}" = \'20\'',
  'Verify Twitch production status',
  '.storage.binding == "DB_TWITCH_HOT"',
  'Verify Kick production status',
  '.storage.binding == "DB_KICK_HOT"',
  '.collector.state == "ok"',
  '.freshness.isStale == false',
  'Verify explicit not-found behavior',
  'data-viewloom-not-found="v1"',
  'cloudflare-preview-probe.json',
]) assert.ok(smoke.includes(fragment), `Production Smoke contract missing ${fragment}`)

const routeCount = (smoke.match(/^\s+'\/[^'\r\n]*'\s*$/gm) ?? []).length
assert.equal(routeCount, 20, 'Production Smoke route list must remain exactly 20 routes')

console.log('U10H production acceptance contract verification passed.')
console.log('- U10F readiness hands production acceptance to U10H')
console.log('- U10G architecture remains retained evidence')
console.log('- Production Smoke owns exact-main-SHA hosted acceptance for 20 routes')
console.log('- Twitch and Kick status, D1 binding, freshness, and 404 checks remain required')
