import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const read = (path) => readFileSync(join(root, path), 'utf8')
const required = [
  'README.md', 'AGENTS.md', 'CONTRIBUTING.md', 'docs/README.md',
  'docs/operations/development-and-deployment-policy.md',
  'docs/operations/documentation-governance.md',
  'docs/product/current-roadmap.md', 'docs/product/current-schedule.md',
  'docs/product/post-watchlist-program-plan.md',
  'docs/product/cross-site-quality-remediation-spec.md',
  'docs/product/cross-site-quality-remediation-plan.md',
  'docs/work-in-progress/u10f-readiness.md',
  'docs/audits/cross-site-quality-u10a-baseline.json',
  'docs/audits/cross-site-quality-u10a-owner-map.json',
  'docs/audits/cross-site-quality-u10b-shared-shell.json',
  'docs/audits/cross-site-quality-u10c-visualization.json',
  'docs/audits/cross-site-quality-u10d-analysis-coherence.json',
  'docs/audits/cross-site-quality-u10e-responsive.json',
  'docs/audits/public-surface-inventory.json',
  'apps/web/scripts/public-readiness-audit.mjs',
  'apps/web/scripts/quality-u10f-readiness-browser.mjs',
  'apps/web/src/live/channel-profile.ts',
  'apps/web/src/channel-profile.css',
  'scripts/verify-quality-u10d-analysis-coherence.mjs',
  'scripts/verify-quality-u10e-responsive.mjs',
  'scripts/verify-quality-u10f-readiness.mjs',
  'scripts/verify-quality-u10f-browser-evidence.mjs',
  '.github/workflows/public-readiness-audit.yml',
  '.github/workflows/production-smoke.yml',
  '.github/workflows/quality-u10f-readiness.yml',
]
for (const path of required) assert.equal(existsSync(join(root, path)), true, `missing file: ${path}`)

for (const path of [
  'docs/work-in-progress/u10a-quality-baseline.md',
  'docs/work-in-progress/u10b-shared-shell.md',
  'docs/work-in-progress/u10c-visualization.md',
  'docs/work-in-progress/u10d-analysis-coherence.md',
  'docs/work-in-progress/u10e-responsive.md',
  'scripts/u10d_patch_runtime.py',
  'scripts/u10d_patch_tests.py',
  'scripts/u10d_patch_docs.py',
  '.github/workflows/u10d-bootstrap.yml',
]) assert.equal(existsSync(join(root, path)), false, `temporary file remains: ${path}`)

const stateChecks = [
  ['README.md', ['Phase 10 U10F readiness               active', 'Active implementation branch          work-quality-u10f-readiness', 'Exact next branch after U10F          work-quality-u10g-architecture']],
  ['docs/README.md', ['Phase 10 U10F readiness                          active', 'Active implementation branch                    work-quality-u10f-readiness', 'Exact next implementation branch                work-quality-u10g-architecture']],
  ['AGENTS.md', ['U10F readiness active', 'Active implementation branch: work-quality-u10f-readiness', 'Exact next branch: work-quality-u10g-architecture']],
  ['CONTRIBUTING.md', ['Phase 10 U10F readiness active', 'Active implementation branch: work-quality-u10f-readiness', 'Exact next implementation branch: work-quality-u10g-architecture']],
  ['docs/product/current-roadmap.md', ['Phase 10 U10F readiness active', 'Active implementation branch: work-quality-u10f-readiness', 'Exact next branch: work-quality-u10g-architecture']],
  ['docs/product/current-schedule.md', ['U10F readiness active', 'Active branch: work-quality-u10f-readiness', 'Next branch: work-quality-u10g-architecture']],
  ['docs/product/post-watchlist-program-plan.md', ['Current phase: Phase 10 — U10F readiness', 'Current implementation branch: `work-quality-u10f-readiness`', 'Exact next implementation branch: `work-quality-u10g-architecture`']],
  ['docs/product/cross-site-quality-remediation-plan.md', ['Current branch: `work-quality-u10f-readiness`', 'Active phase: U10F public readiness and Channel entry', 'Exact next branch: `work-quality-u10g-architecture`']],
]
for (const [path, fragments] of stateChecks) {
  const source = read(path)
  for (const fragment of fragments) assert.ok(source.includes(fragment), `${path}: missing ${fragment}`)
}

const note = read('docs/work-in-progress/u10f-readiness.md')
for (const fragment of [
  'Status: active',
  'work-quality-u10f-readiness',
  'work-quality-u10g-architecture',
  'Public Readiness audits all 20 repository-owned HTML routes',
  'Production Smoke owns 20 repository-owned HTML routes',
  'Missing-id entry makes zero Twitch or Kick History requests.',
]) assert.ok(note.includes(fragment), `U10F working note missing ${fragment}`)

const records = [
  JSON.parse(read('docs/audits/cross-site-quality-u10a-baseline.json')),
  JSON.parse(read('docs/audits/cross-site-quality-u10b-shared-shell.json')),
  JSON.parse(read('docs/audits/cross-site-quality-u10c-visualization.json')),
  JSON.parse(read('docs/audits/cross-site-quality-u10d-analysis-coherence.json')),
  JSON.parse(read('docs/audits/cross-site-quality-u10e-responsive.json')),
]
for (const record of records) {
  assert.equal(record.status, 'complete')
  assert.equal(record.boundary.provider_separation_required, true)
}
const u10e = records.at(-1)
assert.equal(u10e.implementation_pr, 465)
assert.equal(u10e.canonical_closeout_pr, 466)
assert.equal(u10e.scope.total_browser_scenarios, 36)
assert.equal(u10e.responsive_contract.mobile_target_floor_px, 44)
assert.equal(u10e.responsive_contract.important_action_floor_px, 48)
assert.equal(u10e.responsive_contract.page_horizontal_overflow_px, 0)
assert.equal(u10e.exact_next_branch, 'work-quality-u10f-readiness')

const inventory = JSON.parse(read('docs/audits/public-surface-inventory.json'))
assert.equal(inventory.counts.public_readiness_configured_pages, 20)
assert.equal(inventory.counts.production_smoke_page_routes, 20)
assert.equal(inventory.provider_invariants.combined_totals_allowed, false)
assert.equal(inventory.provider_invariants.combined_rankings_allowed, false)

for (const path of [
  '.github/workflows/development-policy.yml',
  '.github/workflows/public-browser-audit.yml',
  '.github/workflows/public-readiness-audit.yml',
  '.github/workflows/quality-u10a-baseline.yml',
  '.github/workflows/quality-u10b-shell.yml',
  '.github/workflows/quality-u10c-visualization.yml',
  '.github/workflows/quality-u10d-analysis-coherence.yml',
  '.github/workflows/quality-u10e-responsive.yml',
  '.github/workflows/quality-u10f-readiness.yml',
]) {
  const source = read(path)
  assert.ok(source.includes('concurrency:'), `${path}: concurrency missing`)
  assert.ok(source.includes('cancel-in-progress: true'), `${path}: cancellation missing`)
}

const battle = read('apps/web/src/live/battle-lines-current-shell-entry.ts')
assert.equal(battle.includes('window.fetch ='), false)
assert.equal(battle.includes('new MutationObserver'), false)

console.log('ViewLoom development and documentation verification passed.')
console.log('- U10A through U10E remain permanent evidence')
console.log('- U10F readiness is active and U10G architecture is exact next')
console.log('- Twitch and Kick remain separate')
