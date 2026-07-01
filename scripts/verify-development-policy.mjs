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
  'docs/audits/cross-site-quality-u10a-baseline.json',
  'docs/audits/cross-site-quality-u10a-owner-map.json',
  'docs/audits/cross-site-quality-u10b-shared-shell.json',
  'docs/audits/cross-site-quality-u10c-visualization.json',
  'docs/audits/cross-site-quality-u10d-analysis-coherence.json',
  'docs/audits/cross-site-quality-u10e-responsive.json',
  'docs/audits/cross-site-quality-u10f-readiness.json',
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
  'docs/work-in-progress/u10f-readiness.md',
  'scripts/u10d_patch_runtime.py',
  'scripts/u10d_patch_tests.py',
  'scripts/u10d_patch_docs.py',
  '.github/workflows/u10d-bootstrap.yml',
]) assert.equal(existsSync(join(root, path)), false, `temporary file remains: ${path}`)

const stateChecks = [
  ['README.md', ['Phase 10 U10F readiness               complete PR #468', 'U10F canonical closeout               complete PR #469', 'Active implementation branch          none', 'Exact next implementation branch      work-quality-u10g-architecture']],
  ['docs/README.md', ['Phase 10 U10F readiness                          complete PR #468', 'U10F canonical closeout                          complete PR #469', 'Active implementation branch                    none', 'Exact next implementation branch                work-quality-u10g-architecture']],
  ['AGENTS.md', ['U10F implementation complete PR #468', 'U10F closeout complete PR #469', 'Active implementation branch: none', 'Exact next branch: work-quality-u10g-architecture']],
  ['CONTRIBUTING.md', ['Phase 10 U10F readiness complete through PR #468', 'U10F canonical closeout complete through PR #469', 'Active implementation branch: none', 'Exact next implementation branch: work-quality-u10g-architecture']],
  ['docs/product/current-roadmap.md', ['Phase 10 U10F readiness complete PR #468', 'U10F canonical closeout complete PR #469', 'Active implementation branch: none', 'Exact next branch: work-quality-u10g-architecture']],
  ['docs/product/current-schedule.md', ['U10F readiness complete PR #468', 'U10F closeout complete PR #469', 'Active branch: none', 'Next branch: work-quality-u10g-architecture']],
  ['docs/product/post-watchlist-program-plan.md', ['Current phase: Phase 10 — U10G architecture exact next', 'Current implementation branch: none', 'Exact next implementation branch: `work-quality-u10g-architecture`', 'Completed U10F canonical closeout: PR #469']],
  ['docs/product/cross-site-quality-remediation-plan.md', ['Current branch: none', 'Completed phase: U10F through PR #468', 'Completed canonical closeout: U10F through PR #469', 'Exact next branch: `work-quality-u10g-architecture`']],
]
for (const [path, fragments] of stateChecks) {
  const source = read(path)
  for (const fragment of fragments) assert.ok(source.includes(fragment), `${path}: missing ${fragment}`)
}

const records = [
  JSON.parse(read('docs/audits/cross-site-quality-u10a-baseline.json')),
  JSON.parse(read('docs/audits/cross-site-quality-u10b-shared-shell.json')),
  JSON.parse(read('docs/audits/cross-site-quality-u10c-visualization.json')),
  JSON.parse(read('docs/audits/cross-site-quality-u10d-analysis-coherence.json')),
  JSON.parse(read('docs/audits/cross-site-quality-u10e-responsive.json')),
  JSON.parse(read('docs/audits/cross-site-quality-u10f-readiness.json')),
]
for (const record of records) {
  assert.equal(record.status, 'complete')
  assert.equal(record.boundary.provider_separation_required, true)
}
const u10e = records.at(-2)
assert.equal(u10e.implementation_pr, 465)
assert.equal(u10e.canonical_closeout_pr, 466)
assert.equal(u10e.scope.total_browser_scenarios, 36)
assert.equal(u10e.responsive_contract.mobile_target_floor_px, 44)
assert.equal(u10e.responsive_contract.important_action_floor_px, 48)
assert.equal(u10e.responsive_contract.page_horizontal_overflow_px, 0)
assert.equal(u10e.exact_next_branch, 'work-quality-u10f-readiness')

const u10f = records.at(-1)
assert.equal(u10f.implementation_pr, 468)
assert.equal(u10f.canonical_closeout_pr, 469)
assert.equal(u10f.scope.public_readiness_routes, 20)
assert.equal(u10f.scope.production_smoke_routes, 20)
assert.equal(u10f.scope.total_browser_scenarios, 8)
assert.equal(u10f.readiness_contract.production_acceptance_claimed, false)
assert.equal(u10f.readiness_contract.production_acceptance_owner, 'U10H')
assert.equal(u10f.browser_evidence.result, 'pass')
assert.equal(u10f.exact_next_branch, 'work-quality-u10g-architecture')
assert.equal(u10f.next_branch_created, false)

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
console.log('- U10A through U10F remain permanent evidence')
console.log('- U10G architecture is exact next and remains uncreated')
console.log('- Twitch and Kick remain separate')
