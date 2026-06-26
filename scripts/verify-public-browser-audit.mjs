import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const failures = []
const read = (path) => readFileSync(join(root, path), 'utf8')
const requireFile = (path) => {
  if (!existsSync(join(root, path))) failures.push(`Missing required file: ${path}`)
}
const requireFragments = (path, fragments) => {
  requireFile(path)
  if (!existsSync(join(root, path))) return
  const source = read(path)
  for (const fragment of fragments) {
    if (!source.includes(fragment)) failures.push(`${path}: missing required fragment: ${fragment}`)
  }
}

for (const path of [
  'docs/audits/P8B_SCOPE.md',
  'docs/audits/public-browser-defects.json',
  'docs/audits/public-browser-audit.md',
  'docs/audits/public-surface-inventory.json',
  'docs/audits/public-surface-gaps.json',
  'apps/web/scripts/public-browser-audit.mjs',
  '.github/workflows/public-browser-audit.yml',
  'docs/product/current-roadmap.md',
  'docs/product/current-schedule.md',
  'docs/product/post-watchlist-program-plan.md',
  'docs/product/history-ui-repair-plan.md',
  'docs/work-in-progress/history-ui-repair-working-note.md',
  'docs/README.md',
]) requireFile(path)

const manifest = JSON.parse(read('docs/audits/public-surface-inventory.json'))
const gaps = JSON.parse(read('docs/audits/public-surface-gaps.json'))
const ledger = JSON.parse(read('docs/audits/public-browser-defects.json'))

if (manifest.schema !== 'viewloom-public-surface-inventory-v1') failures.push('P8A manifest schema changed')
if (manifest.counts?.inventory_entries !== 21) failures.push('P8A inventory must retain 21 owned entries')
if (manifest.provider_invariants?.twitch_binding !== 'DB_TWITCH_HOT') failures.push('Twitch binding invariant changed')
if (manifest.provider_invariants?.kick_binding !== 'DB_KICK_HOT') failures.push('Kick binding invariant changed')
if (manifest.provider_invariants?.combined_totals_allowed !== false) failures.push('Combined totals must remain forbidden')
if (manifest.provider_invariants?.combined_rankings_allowed !== false) failures.push('Combined rankings must remain forbidden')
if ((gaps.missing_surfaces ?? []).length !== 5) failures.push('Five audited policy/disclosure gaps must remain explicit in the historical baseline')

if (ledger.schema !== 'viewloom-public-browser-defect-ledger-v1') failures.push('P8B defect ledger schema changed')
if (!['completion_candidate', 'complete'].includes(ledger.status)) failures.push('P8B defect ledger must remain a completion candidate or complete')
if (ledger.phase !== 'P8B') failures.push('P8B defect ledger phase changed')
if (ledger.evidence?.matrix?.owned_routes !== 21) failures.push('P8B ledger must retain 21 owned routes')
if (ledger.evidence?.matrix?.production_scenarios !== 84) failures.push('P8B ledger must retain 84 production scenarios')
if (ledger.evidence?.matrix?.missing_surface_probes !== 5) failures.push('P8B ledger must retain five missing-surface probes')
if (ledger.evidence?.matrix?.history_scenarios !== 10) failures.push('P8B ledger must retain ten History scenarios')
if (ledger.counts?.p0 !== 0) failures.push('P8B must retain P0 0')
if (ledger.counts?.p1 !== 3) failures.push('P8B must retain three P1 defects')
if (ledger.counts?.p2 !== 5) failures.push('P8B must retain five P2 findings')
if (ledger.counts?.total !== 8) failures.push('P8B must retain eight classified findings')
if ((ledger.defects ?? []).length !== 8) failures.push('P8B defect array must retain eight findings')
if ((ledger.ordered_phase_9_queue ?? []).length !== 8) failures.push('P8B queue must retain P9H0 through P9H7')

for (const id of [
  'P8B-P1-HISTORY-METRIC-SYNCHRONIZATION',
  'P8B-P1-HISTORY-KEYBOARD-ENTRY',
  'P8B-P1-HISTORY-TASK-HIERARCHY',
  'P8B-P2-SMALL-INTERACTIVE-TARGETS',
  'P8B-P2-WATCHLIST-PUBLIC-READINESS-OMISSION',
  'P8B-P2-PRODUCTION-SMOKE-OMISSIONS',
  'P8B-P2-RELEASE-POLICY-SURFACES-MISSING',
  'P8B-P2-UNLABELED-CONTROLS',
]) {
  if (!(ledger.defects ?? []).some((defect) => defect.id === id)) failures.push(`P8B ledger missing finding: ${id}`)
}

requireFragments('docs/audits/P8B_SCOPE.md', [
  'Status: completed through PR #428',
  'Branch: `work-public-browser-audit`',
  'Merge commit: `b2dd44dff6efd9da78a3ddd28f2ed26661bf9eb8`',
  '84 production route scenarios',
  '10 deterministic History state and interaction scenarios',
  'P0  0',
  'P1  3',
  'P2  5',
  'P8B was audit-only.',
  'work-history-ui-h0-baseline',
])

requireFragments('docs/audits/public-browser-audit.md', [
  'Status: complete on the PR #428 completion branch',
  '21 owned routes',
  '84 production route scenarios',
  'P8B-P1-HISTORY-METRIC-SYNCHRONIZATION',
  'P8B-P1-HISTORY-KEYBOARD-ENTRY',
  'P8B-P1-HISTORY-TASK-HIERARCHY',
  'work-history-ui-h0-baseline',
])

requireFragments('apps/web/scripts/public-browser-audit.mjs', [
  "schema: 'viewloom-public-browser-audit-v1'",
  "phase: 'P8B'",
  'productionOrigin',
  'localOrigin',
  'productionMatrix',
  'missingSurfaceProbes',
  'historyScenarios',
  'P8B-P1-HISTORY-METRIC-SYNCHRONIZATION',
  'P8B-P2-WATCHLIST-PUBLIC-READINESS-OMISSION',
  'P8B-P2-PRODUCTION-SMOKE-OMISSIONS',
  'P8B-P2-RELEASE-POLICY-SURFACES-MISSING',
])

requireFragments('.github/workflows/public-browser-audit.yml', [
  'name: Public Browser Audit',
  'concurrency:',
  'cancel-in-progress: true',
  'Verify development policy',
  'Verify P8A inventory',
  'Correct History Back and Forward probe semantics',
  'Run P8B public browser audit',
  'Verify P8B machine-readable evidence',
  'public-browser-audit-p8b',
])

requireFragments('docs/product/current-roadmap.md', [
  'P8B: complete through PR #428',
  'Current window: P9H0',
  'Current branch: work-history-ui-h0-baseline',
  'work-history-ui-h1-metric',
])
requireFragments('docs/product/current-schedule.md', [
  'Phase 8 P8B browser audit                complete through PR #428',
  'Current window: P9H0',
  'Current branch: work-history-ui-h0-baseline',
  'work-history-ui-h1-metric',
])
requireFragments('docs/product/post-watchlist-program-plan.md', [
  'Current window: P9H0',
  'Current branch: `work-history-ui-h0-baseline`',
  'Exact next branch after P9H0: `work-history-ui-h1-metric`',
  '| 8 | P8B | complete PR #428',
])
requireFragments('docs/product/history-ui-repair-plan.md', [
  'Current window: P9H0',
  'Current branch: `work-history-ui-h0-baseline`',
  'Exact next branch after P9H0: `work-history-ui-h1-metric`',
])
requireFragments('docs/work-in-progress/history-ui-repair-working-note.md', [
  'Current window: P9H0',
  'Current branch: `work-history-ui-h0-baseline`',
  'Exact next branch after P9H0: `work-history-ui-h1-metric`',
])
requireFragments('docs/README.md', [
  'Phase 8  public inventory and browser audit               complete through PR #428',
  'P9H0     work-history-ui-h0-baseline                       active',
  'P9H1     work-history-ui-h1-metric                         exact next after P9H0',
  'audits/P8B_SCOPE.md',
  'audits/public-browser-defects.json',
  'audits/public-browser-audit.md',
])

if (failures.length) {
  console.error('ViewLoom P8B repository verification failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('ViewLoom P8B repository verification passed.')
console.log('- P8A inventory remains the static route and ownership baseline')
console.log('- P8B remains a completed historical audit through PR #428')
console.log('- 21 owned routes, four viewports, five missing-surface probes, and ten History scenarios remain governed')
console.log('- final ledger retains P0 0, P1 3, P2 5, and the P9H0-P9H7 queue')
console.log('- provider separation and audit-only boundary remain locked')
console.log('- Phase 9 P9H0 is active and P9H1 is the exact next branch')