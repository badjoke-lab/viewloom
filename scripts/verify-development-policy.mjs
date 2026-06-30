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
  'docs/work-in-progress/u10e-responsive.md',
  'docs/audits/cross-site-quality-u10a-baseline.json',
  'docs/audits/cross-site-quality-u10a-owner-map.json',
  'docs/audits/cross-site-quality-u10b-shared-shell.json',
  'docs/audits/cross-site-quality-u10c-visualization.json',
  'docs/audits/cross-site-quality-u10d-analysis-coherence.json',
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
  'scripts/u10d_patch_runtime.py',
  'scripts/u10d_patch_tests.py',
  'scripts/u10d_patch_docs.py',
  '.github/workflows/u10d-bootstrap.yml',
]) assert.equal(existsSync(join(root, path)), false, `temporary file remains: ${path}`)

const stateChecks = [
  ['README.md', ['Phase 10 U10E responsive repair       active', 'Active implementation branch          work-quality-u10e-responsive', 'Exact next branch after U10E          work-quality-u10f-readiness']],
  ['docs/README.md', ['Phase 10 U10E responsive and accessibility       active', 'Active implementation branch                    work-quality-u10e-responsive', 'Exact next implementation branch                work-quality-u10f-readiness']],
  ['AGENTS.md', ['U10E responsive and accessibility active', 'Active implementation branch: work-quality-u10e-responsive', 'Exact next branch: work-quality-u10f-readiness']],
  ['CONTRIBUTING.md', ['Phase 10 U10E responsive and accessibility active', 'Active implementation branch: work-quality-u10e-responsive', 'Exact next implementation branch: work-quality-u10f-readiness']],
  ['docs/product/current-roadmap.md', ['Phase 10 U10E responsive and accessibility active', 'Active implementation branch: work-quality-u10e-responsive', 'Exact next branch: work-quality-u10f-readiness']],
  ['docs/product/current-schedule.md', ['U10E responsive and accessibility active', 'Active branch: work-quality-u10e-responsive', 'Next branch: work-quality-u10f-readiness', 'U10E total browser scenarios: 36']],
  ['docs/product/post-watchlist-program-plan.md', ['Current phase: Phase 10 — U10E responsive and accessibility', 'Current implementation branch: `work-quality-u10e-responsive`', 'Exact next implementation branch: `work-quality-u10f-readiness`']],
  ['docs/product/cross-site-quality-remediation-plan.md', ['Current branch: `work-quality-u10e-responsive`', 'Active phase: U10E responsive and accessibility', 'Exact next branch: `work-quality-u10f-readiness`']],
]
for (const [path, fragments] of stateChecks) {
  const source = read(path)
  for (const fragment of fragments) assert.ok(source.includes(fragment), `${path}: missing ${fragment}`)
}

const note = read('docs/work-in-progress/u10e-responsive.md')
for (const fragment of [
  'Status: active',
  'work-quality-u10e-responsive',
  'work-quality-u10f-readiness',
  'mobile interactive targets are at least 44px',
  'important management or publishing actions are at least 48px',
  'APIs, D1 schemas, bindings, collectors, cron, retention, output schemas, localization runtime, and provider separation remain unchanged.',
]) assert.ok(note.includes(fragment), `U10E working note missing ${fragment}`)

const u10a = JSON.parse(read('docs/audits/cross-site-quality-u10a-baseline.json'))
assert.equal(u10a.status, 'complete')
assert.equal(u10a.implementation_pr, 454)
assert.equal(u10a.implementation_head, '51c8883ebdc31334828cc345f6a938f17c20a29b')
assert.equal(u10a.boundary.provider_separation_required, true)

const u10b = JSON.parse(read('docs/audits/cross-site-quality-u10b-shared-shell.json'))
assert.equal(u10b.status, 'complete')
assert.equal(u10b.implementation_pr, 456)
assert.equal(u10b.canonical_closeout_pr, 457)
assert.equal(u10b.boundary.provider_separation_required, true)

const u10c = JSON.parse(read('docs/audits/cross-site-quality-u10c-visualization.json'))
assert.equal(u10c.status, 'complete')
assert.equal(u10c.implementation_pr, 458)
assert.equal(u10c.canonical_closeout_pr, 459)
assert.equal(u10c.scope.total_browser_checks, 64)
assert.equal(u10c.boundary.provider_separation_required, true)
assert.equal(u10c.boundary.api_change_authorized, false)
assert.equal(u10c.boundary.storage_change_authorized, false)
assert.equal(u10c.boundary.collector_change_authorized, false)
assert.equal(u10c.boundary.provider_combination_authorized, false)

const u10d = JSON.parse(read('docs/audits/cross-site-quality-u10d-analysis-coherence.json'))
assert.equal(u10d.status, 'complete')
assert.equal(u10d.implementation_pr, 462)
assert.equal(u10d.canonical_closeout_pr, 464)
assert.equal(u10d.scope.total_browser_scenarios, 20)
assert.equal(u10d.ownership.day_flow_default_layout, 'wide')
assert.equal(u10d.ownership.battle_lines_recommendation, 'recommendedBattle')
assert.equal(u10d.boundary.provider_separation_required, true)
assert.equal(u10d.boundary.api_change_authorized, false)
assert.equal(u10d.boundary.storage_change_authorized, false)
assert.equal(u10d.boundary.collector_change_authorized, false)
assert.equal(u10d.boundary.provider_combination_authorized, false)

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
console.log('- U10A, U10B, U10C, and U10D remain permanent evidence')
console.log('- U10E is active and U10F is exact next')
console.log('- Twitch and Kick remain separate')
