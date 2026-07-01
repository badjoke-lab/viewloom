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
  'apps/web/src/shared-shell.ts',
  'apps/web/src/quality-u10e-responsive.css',
  'apps/web/src/visualization-grammar.ts',
  'apps/web/src/live/day-flow-layout-summary.ts',
  'apps/web/src/live/battle-lines-current-shell-entry.ts',
  'apps/web/scripts/quality-u10e-responsive-browser.mjs',
  'scripts/verify-quality-u10d-analysis-coherence.mjs',
  'scripts/verify-quality-u10e-responsive.mjs',
  'scripts/verify-quality-u10e-browser-evidence.mjs',
  '.github/workflows/quality-u10e-responsive.yml',
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
  ['README.md', ['U10E canonical closeout               complete PR #466', 'Active implementation branch          none', 'Exact next implementation branch      work-quality-u10f-readiness']],
  ['docs/README.md', ['U10E canonical closeout                          complete PR #466', 'Active implementation branch                    none', 'Exact next implementation branch                work-quality-u10f-readiness']],
  ['AGENTS.md', ['U10E closeout complete PR #466', 'Active implementation branch: none', 'Exact next branch: work-quality-u10f-readiness']],
  ['CONTRIBUTING.md', ['U10E canonical closeout complete through PR #466', 'Active implementation branch: none', 'Exact next implementation branch: work-quality-u10f-readiness']],
  ['docs/product/current-roadmap.md', ['U10E canonical closeout complete PR #466', 'Active implementation branch: none', 'Exact next branch: work-quality-u10f-readiness']],
  ['docs/product/current-schedule.md', ['U10E closeout complete PR #466', 'Active branch: none', 'Next branch: work-quality-u10f-readiness']],
  ['docs/product/post-watchlist-program-plan.md', ['Current phase: Phase 10 — U10F readiness exact next', 'Current implementation branch: none', 'Completed U10E canonical closeout: PR #466']],
  ['docs/product/cross-site-quality-remediation-plan.md', ['Current branch: none', 'Completed canonical closeout: U10E through PR #466', 'Exact next branch: `work-quality-u10f-readiness`']],
]
for (const [path, fragments] of stateChecks) {
  const source = read(path)
  for (const fragment of fragments) assert.ok(source.includes(fragment), `${path}: missing ${fragment}`)
}

const u10a = JSON.parse(read('docs/audits/cross-site-quality-u10a-baseline.json'))
const u10b = JSON.parse(read('docs/audits/cross-site-quality-u10b-shared-shell.json'))
const u10c = JSON.parse(read('docs/audits/cross-site-quality-u10c-visualization.json'))
const u10d = JSON.parse(read('docs/audits/cross-site-quality-u10d-analysis-coherence.json'))
const u10e = JSON.parse(read('docs/audits/cross-site-quality-u10e-responsive.json'))
for (const record of [u10a, u10b, u10c, u10d, u10e]) assert.equal(record.status, 'complete')
assert.equal(u10a.implementation_pr, 454)
assert.equal(u10b.canonical_closeout_pr, 457)
assert.equal(u10c.canonical_closeout_pr, 459)
assert.equal(u10c.scope.total_browser_checks, 64)
assert.equal(u10d.canonical_closeout_pr, 464)
assert.equal(u10d.scope.total_browser_scenarios, 20)
assert.equal(u10d.ownership.day_flow_default_layout, 'wide')
assert.equal(u10d.ownership.battle_lines_recommendation, 'recommendedBattle')
assert.equal(u10e.implementation_pr, 465)
assert.equal(u10e.canonical_closeout_pr, 466)
assert.equal(u10e.scope.total_browser_scenarios, 36)
assert.equal(u10e.responsive_contract.mobile_target_floor_px, 44)
assert.equal(u10e.responsive_contract.important_action_floor_px, 48)
assert.equal(u10e.responsive_contract.page_horizontal_overflow_px, 0)
assert.equal(u10e.browser_evidence.result, 'pass')
assert.equal(u10e.exact_next_branch, 'work-quality-u10f-readiness')
assert.equal(u10e.next_branch_created, false)
for (const record of [u10a, u10b, u10c, u10d, u10e]) assert.equal(record.boundary.provider_separation_required, true)
for (const record of [u10c, u10d, u10e]) {
  assert.equal(record.boundary.api_change_authorized, false)
  assert.equal(record.boundary.storage_change_authorized, false)
  assert.equal(record.boundary.collector_change_authorized, false)
  assert.equal(record.boundary.provider_combination_authorized, false)
}

for (const path of [
  '.github/workflows/development-policy.yml',
  '.github/workflows/public-browser-audit.yml',
  '.github/workflows/quality-u10a-baseline.yml',
  '.github/workflows/quality-u10b-shell.yml',
  '.github/workflows/quality-u10c-visualization.yml',
  '.github/workflows/quality-u10d-analysis-coherence.yml',
  '.github/workflows/quality-u10e-responsive.yml',
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
console.log('- U10F is exact next and remains uncreated')
console.log('- Twitch and Kick remain separate')
