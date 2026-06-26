import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const failures = []
const read = (path) => readFileSync(join(root, path), 'utf8')
const needFile = (path) => { if (!existsSync(join(root, path))) failures.push(`missing file: ${path}`) }
const need = (path, fragments) => {
  needFile(path)
  if (!existsSync(join(root, path))) return
  const source = read(path)
  for (const fragment of fragments) if (!source.includes(fragment)) failures.push(`${path}: missing ${fragment}`)
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
]) needFile(path)

const manifest = JSON.parse(read('docs/audits/public-surface-inventory.json'))
const gaps = JSON.parse(read('docs/audits/public-surface-gaps.json'))
const ledger = JSON.parse(read('docs/audits/public-browser-defects.json'))

if (manifest.schema !== 'viewloom-public-surface-inventory-v1') failures.push('P8A schema changed')
if (manifest.counts?.inventory_entries !== 21) failures.push('P8A must retain 21 owned entries')
if (manifest.provider_invariants?.twitch_binding !== 'DB_TWITCH_HOT') failures.push('Twitch binding changed')
if (manifest.provider_invariants?.kick_binding !== 'DB_KICK_HOT') failures.push('Kick binding changed')
if (manifest.provider_invariants?.combined_totals_allowed !== false) failures.push('combined totals must remain forbidden')
if (manifest.provider_invariants?.combined_rankings_allowed !== false) failures.push('combined rankings must remain forbidden')
if ((gaps.missing_surfaces ?? []).length !== 5) failures.push('five policy/disclosure gaps must remain explicit in the P8B baseline')

if (ledger.schema !== 'viewloom-public-browser-defect-ledger-v1') failures.push('P8B ledger schema changed')
if (!['completion_candidate', 'complete'].includes(ledger.status)) failures.push('P8B ledger status is invalid')
if (ledger.phase !== 'P8B') failures.push('P8B phase changed')
if (ledger.evidence?.matrix?.owned_routes !== 21) failures.push('P8B must retain 21 routes')
if (ledger.evidence?.matrix?.production_scenarios !== 84) failures.push('P8B must retain 84 production scenarios')
if (ledger.evidence?.matrix?.missing_surface_probes !== 5) failures.push('P8B must retain five missing-surface probes')
if (ledger.evidence?.matrix?.history_scenarios !== 10) failures.push('P8B must retain ten History scenarios')
if (ledger.counts?.p0 !== 0 || ledger.counts?.p1 !== 3 || ledger.counts?.p2 !== 5 || ledger.counts?.total !== 8) failures.push('P8B classification counts changed')
if ((ledger.defects ?? []).length !== 8) failures.push('P8B must retain eight findings')
if ((ledger.ordered_phase_9_queue ?? []).length !== 8) failures.push('P8B must retain P9H0-P9H7 queue')

for (const id of [
  'P8B-P1-HISTORY-METRIC-SYNCHRONIZATION',
  'P8B-P1-HISTORY-KEYBOARD-ENTRY',
  'P8B-P1-HISTORY-TASK-HIERARCHY',
  'P8B-P2-SMALL-INTERACTIVE-TARGETS',
  'P8B-P2-WATCHLIST-PUBLIC-READINESS-OMISSION',
  'P8B-P2-PRODUCTION-SMOKE-OMISSIONS',
  'P8B-P2-RELEASE-POLICY-SURFACES-MISSING',
  'P8B-P2-UNLABELED-CONTROLS',
]) if (!(ledger.defects ?? []).some((item) => item.id === id)) failures.push(`missing P8B finding: ${id}`)

need('docs/audits/P8B_SCOPE.md', [
  'Status: complete through PR #428',
  'Merge commit: `b2dd44dff6efd9da78a3ddd28f2ed26661bf9eb8`',
  '84 production route scenarios',
  '10 deterministic History state/interaction scenarios',
  'P8B was audit-only.',
])
need('docs/audits/public-browser-audit.md', [
  '21 owned routes',
  '84 production route scenarios',
  'P8B-P1-HISTORY-METRIC-SYNCHRONIZATION',
  'P8B-P1-HISTORY-KEYBOARD-ENTRY',
  'P8B-P1-HISTORY-TASK-HIERARCHY',
])
need('apps/web/scripts/public-browser-audit.mjs', [
  "schema: 'viewloom-public-browser-audit-v1'",
  "phase: 'P8B'",
  'productionMatrix',
  'missingSurfaceProbes',
  'historyScenarios',
])
need('.github/workflows/public-browser-audit.yml', [
  'name: Public Browser Audit',
  'cancel-in-progress: true',
  'Run P8B public browser audit',
  'public-browser-audit-p8b',
])
need('docs/product/current-roadmap.md', [
  'Phase 8 P8B   complete PR #428',
  'Phase 9 P9H0  complete PR #430',
  'P9H0 closeout complete PR #432',
  'Active implementation branch: none',
  'work-history-ui-h1-metric',
])
need('docs/product/current-schedule.md', [
  'Phase 8 public inventory/browser audit  complete PR #428',
  'P9H0 documentation closeout             complete PR #432',
  'Active implementation branch            none',
  'work-history-ui-h1-metric',
])
need('docs/product/post-watchlist-program-plan.md', [
  '| 8 | P8B | complete PR #428',
  '| 9 | P9H0 | complete PR #430',
  '| 9 | closeout | complete PR #432',
  'Current implementation branch: none',
])
need('docs/product/history-ui-repair-plan.md', [
  'Completed window: P9H0 through PR #430',
  'Completed closeout: PR #432',
  'Current implementation branch: none',
  'work-history-ui-h1-metric',
])
need('docs/work-in-progress/history-ui-repair-working-note.md', [
  'Completed predecessor: P9H0 through PR #430',
  'Completed closeout: PR #432',
  'Current implementation branch: none',
  'work-history-ui-h1-metric',
])
need('docs/README.md', [
  'P9H0 completed through PR #430.',
  'closeout completed through PR #432',
  'Active implementation branch',
  'work-history-ui-h1-metric',
])

if (failures.length) {
  console.error('ViewLoom P8B repository verification failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('ViewLoom P8B repository verification passed.')
console.log('- P8B remains completed historical evidence through PR #428')
console.log('- 21 routes, four widths, five missing surfaces, ten History scenarios, and eight findings remain exact')
console.log('- provider separation and the audit-only boundary remain locked')
console.log('- P9H0 closeout is complete and P9H1 remains the uncreated next branch')