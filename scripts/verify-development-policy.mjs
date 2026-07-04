import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const read = (path) => readFileSync(join(root, path), 'utf8')
const required = [
  'README.md', 'AGENTS.md', 'CONTRIBUTING.md', 'docs/README.md',
  'docs/operations/development-and-deployment-policy.md',
  'docs/operations/documentation-governance.md',
  'docs/operations/u10h-production-acceptance-2026-07-04.md',
  'docs/product/current-roadmap.md', 'docs/product/current-schedule.md',
  'docs/product/post-watchlist-program-plan.md',
  'docs/product/cross-site-quality-remediation-spec.md',
  'docs/product/cross-site-quality-remediation-plan.md',
  'docs/work-in-progress/u10g-architecture.md',
  'docs/work-in-progress/u10h-acceptance.md',
  'docs/audits/cross-site-quality-u10a-baseline.json',
  'docs/audits/cross-site-quality-u10a-owner-map.json',
  'docs/audits/cross-site-quality-u10b-shared-shell.json',
  'docs/audits/cross-site-quality-u10c-visualization.json',
  'docs/audits/cross-site-quality-u10d-analysis-coherence.json',
  'docs/audits/cross-site-quality-u10e-responsive.json',
  'docs/audits/cross-site-quality-u10f-readiness.json',
  'docs/audits/public-surface-inventory.json',
  'apps/web/src/live/day-flow-current-shell-entry.ts',
  'apps/web/src/live/day-flow-layout-summary.ts',
  'apps/web/src/live/battle-lines-current-shell-entry.ts',
  'apps/web/src/live/battle-lines-layout.ts',
  'apps/web/src/navigation/battle-lines-deep-link-bridge.ts',
  'apps/web/scripts/quality-u10g-architecture-browser.mjs',
  'scripts/verify-quality-u10g-architecture.mjs',
  'scripts/verify-quality-u10g-browser-evidence.mjs',
  'scripts/verify-quality-u10h-acceptance.mjs',
  '.github/workflows/public-readiness-audit.yml',
  '.github/workflows/production-smoke.yml',
  '.github/workflows/quality-u10f-readiness.yml',
  '.github/workflows/quality-u10g-architecture.yml',
  '.github/workflows/quality-u10h-acceptance.yml',
  '.github/workflows/quality-u10h-production-acceptance.yml',
]
for (const path of required) assert.equal(existsSync(join(root, path)), true, `missing file: ${path}`)

for (const path of [
  'docs/work-in-progress/u10a-quality-baseline.md',
  'docs/work-in-progress/u10b-shared-shell.md',
  'docs/work-in-progress/u10c-visualization.md',
  'docs/work-in-progress/u10d-analysis-coherence.md',
  'docs/work-in-progress/u10e-responsive.md',
  'docs/work-in-progress/u10f-readiness.md',
  'apps/web/src/live/battle-lines-loading-guard.ts',
  'scripts/u10d_patch_runtime.py',
  'scripts/u10d_patch_tests.py',
  'scripts/u10d_patch_docs.py',
  'scripts/u10g_patch_architecture.mjs',
  '.github/workflows/u10d-bootstrap.yml',
  '.github/workflows/u10g-bootstrap.yml',
  '.github/workflows/u10g-test-patch.yml',
]) assert.equal(existsSync(join(root, path)), false, `temporary or retired file remains: ${path}`)

const stateChecks = [
  ['README.md', ['Phase 10 U10H production acceptance   complete PR #471', 'U10H canonical closeout               PR #472', 'Active implementation branch          none', 'Exact next branch                     work-quality-phase11-acceptance-operations', 'Phase 11 branch created               no']],
  ['docs/README.md', ['Phase 10 U10H production acceptance              complete PR #471', 'U10H canonical closeout                          PR #472', 'Active implementation branch                    none', 'Exact next implementation branch                work-quality-phase11-acceptance-operations', 'Phase 11 branch created                         no']],
  ['AGENTS.md', ['U10H production acceptance complete PR #471', 'U10H canonical closeout PR #472', 'Active implementation branch: none', 'Exact next branch: work-quality-phase11-acceptance-operations', 'Phase 11 branch created: no']],
  ['CONTRIBUTING.md', ['Phase 10 U10H production acceptance complete through PR #471', 'U10H canonical closeout PR #472', 'Active implementation branch: none', 'Exact next implementation branch: work-quality-phase11-acceptance-operations', 'Phase 11 branch created: no']],
  ['docs/product/current-roadmap.md', ['Phase 10 U10H production acceptance complete PR #471', 'U10H canonical closeout PR #472', 'Active implementation branch: none', 'Exact next branch: work-quality-phase11-acceptance-operations', 'Phase 11 branch created: no']],
  ['docs/product/current-schedule.md', ['U10H production acceptance complete PR #471', 'U10H canonical closeout PR #472', 'Active branch: none', 'Next branch: work-quality-phase11-acceptance-operations', 'Phase 11 created: no']],
  ['docs/product/post-watchlist-program-plan.md', ['Current phase: Phase 10 — U10H production acceptance complete', 'Current implementation branch: none', 'Exact next implementation branch: `work-quality-phase11-acceptance-operations`', 'Phase 11 branch created: no']],
  ['docs/product/cross-site-quality-remediation-plan.md', ['Current branch: none', 'Completed phase: U10H production acceptance through PR #471', 'Exact next branch: `work-quality-phase11-acceptance-operations`', 'Phase 11 branch created: no']],
]
for (const [path, fragments] of stateChecks) {
  const source = read(path)
  for (const fragment of fragments) assert.ok(source.includes(fragment), `${path}: missing ${fragment}`)
}

const u10gNote = read('docs/work-in-progress/u10g-architecture.md')
for (const fragment of [
  'Status: complete',
  'Merged PR: #470',
  'Merge commit: `62dab7b6076c15b85c3d893589df22388753c1bc`',
  'Day Flow has one request/state/controller owner per provider route.',
  'Battle Lines has one request/state/controller owner per provider route.',
]) assert.ok(u10gNote.includes(fragment), `U10G working note missing ${fragment}`)

const u10hNote = read('docs/work-in-progress/u10h-acceptance.md')
for (const fragment of [
  'Status: complete',
  'Implementation PR: #471',
  'Implementation merge commit: `9f2b9abd5a3d23b50fc01075a5c4f041899babf5`',
  'Hosted production acceptance: pass',
  'Production acceptance claimed: yes',
  'Phase 11 branch created: no',
]) assert.ok(u10hNote.includes(fragment), `U10H working note missing ${fragment}`)

const acceptance = read('docs/operations/u10h-production-acceptance-2026-07-04.md')
for (const fragment of [
  'Status: complete',
  'Workflow run: 28701464391',
  'Artifact id: 8080315127',
  'Result: pass',
  'Deployed SHA: 9f2b9abd5a3d23b50fc01075a5c4f041899babf5',
  'U10H production acceptance is claimed complete by this record.',
]) assert.ok(acceptance.includes(fragment), `U10H acceptance record missing ${fragment}`)

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
const u10f = records.at(-1)
assert.equal(u10f.implementation_pr, 468)
assert.equal(u10f.canonical_closeout_pr, 469)
assert.equal(u10f.scope.public_readiness_routes, 20)
assert.equal(u10f.scope.production_smoke_routes, 20)
assert.equal(u10f.scope.total_browser_scenarios, 8)
assert.equal(u10f.readiness_contract.production_acceptance_claimed, false)
assert.equal(u10f.readiness_contract.production_acceptance_owner, 'U10H')
assert.equal(u10f.browser_evidence.result, 'pass')

const inventory = JSON.parse(read('docs/audits/public-surface-inventory.json'))
assert.equal(inventory.counts.public_readiness_configured_pages, 20)
assert.equal(inventory.counts.production_smoke_page_routes, 20)
assert.equal(inventory.provider_invariants.combined_totals_allowed, false)
assert.equal(inventory.provider_invariants.combined_rankings_allowed, false)

for (const path of [
  '.github/workflows/development-policy.yml',
  '.github/workflows/public-browser-audit.yml',
  '.github/workflows/public-readiness-audit.yml',
  '.github/workflows/production-smoke.yml',
  '.github/workflows/quality-u10a-baseline.yml',
  '.github/workflows/quality-u10b-shell.yml',
  '.github/workflows/quality-u10c-visualization.yml',
  '.github/workflows/quality-u10d-analysis-coherence.yml',
  '.github/workflows/quality-u10e-responsive.yml',
  '.github/workflows/quality-u10f-readiness.yml',
  '.github/workflows/quality-u10g-architecture.yml',
  '.github/workflows/quality-u10h-acceptance.yml',
  '.github/workflows/quality-u10h-production-acceptance.yml',
]) {
  const source = read(path)
  assert.ok(source.includes('concurrency:'), `${path}: concurrency missing`)
  assert.ok(source.includes('cancel-in-progress: true'), `${path}: cancellation missing`)
}

for (const path of [
  'apps/web/src/live/day-flow-current-shell-entry.ts',
  'apps/web/src/live/day-flow-layout-summary.ts',
  'apps/web/src/live/battle-lines-current-shell-entry.ts',
  'apps/web/src/live/battle-lines-layout.ts',
  'apps/web/src/navigation/battle-lines-deep-link-bridge.ts',
]) {
  const source = read(path)
  for (const forbidden of ['window.fetch =', 'window.history.replaceState =', 'URLSearchParams.prototype.get =', 'new MutationObserver']) {
    assert.equal(source.includes(forbidden), false, `${path}: forbidden architecture remains: ${forbidden}`)
  }
}

const battleLayout = read('apps/web/src/live/battle-lines-layout.ts')
for (const fragment of [
  'function splitViewportAvailable()',
  "document.body.dataset.battleLayoutRequested === 'split'",
  "requestedLayout === 'split' && splitAvailable ? 'split' : 'wide'",
  'shell.dataset.battleLayoutCurrent = effectiveLayout',
  'shell.dataset.battleLayoutRequested = requestedLayout',
]) assert.ok(battleLayout.includes(fragment), `Battle Lines requested/effective layout ownership missing: ${fragment}`)

console.log('ViewLoom development and documentation verification passed.')
console.log('- U10A through U10F remain permanent evidence')
console.log('- U10G architecture and U10H production acceptance are complete')
console.log('- Phase 11 acceptance and operations is exact next and not yet created')
console.log('- requested and effective Battle Lines layouts remain separate')
console.log('- Twitch and Kick remain separate')
