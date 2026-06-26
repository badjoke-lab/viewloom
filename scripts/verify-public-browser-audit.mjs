import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const errors = []
const read = (path) => readFileSync(join(root, path), 'utf8')
const need = (path, fragments) => {
  if (!existsSync(join(root, path))) {
    errors.push(`missing file: ${path}`)
    return
  }
  const source = read(path)
  for (const fragment of fragments) if (!source.includes(fragment)) errors.push(`${path}: missing ${fragment}`)
}

for (const path of [
  'docs/audits/P8B_SCOPE.md', 'docs/audits/public-browser-defects.json',
  'docs/audits/public-browser-audit.md', 'docs/audits/public-surface-inventory.json',
  'docs/audits/public-surface-gaps.json', 'apps/web/scripts/public-browser-audit.mjs',
  '.github/workflows/public-browser-audit.yml', 'docs/product/current-roadmap.md',
  'docs/product/current-schedule.md', 'docs/product/post-watchlist-program-plan.md',
  'docs/product/history-ui-repair-plan.md', 'docs/work-in-progress/history-ui-repair-working-note.md',
  'docs/README.md',
]) if (!existsSync(join(root, path))) errors.push(`missing file: ${path}`)

const manifest = JSON.parse(read('docs/audits/public-surface-inventory.json'))
const gaps = JSON.parse(read('docs/audits/public-surface-gaps.json'))
const ledger = JSON.parse(read('docs/audits/public-browser-defects.json'))

if (manifest.schema !== 'viewloom-public-surface-inventory-v1') errors.push('P8A schema changed')
if (manifest.counts?.inventory_entries !== 21) errors.push('P8A route count changed')
if (manifest.provider_invariants?.twitch_binding !== 'DB_TWITCH_HOT') errors.push('Twitch binding changed')
if (manifest.provider_invariants?.kick_binding !== 'DB_KICK_HOT') errors.push('Kick binding changed')
if (manifest.provider_invariants?.combined_totals_allowed !== false) errors.push('combined totals boundary changed')
if (manifest.provider_invariants?.combined_rankings_allowed !== false) errors.push('combined rankings boundary changed')
if ((gaps.missing_surfaces ?? []).length !== 5) errors.push('P8B missing-surface baseline changed')

if (ledger.schema !== 'viewloom-public-browser-defect-ledger-v1') errors.push('P8B schema changed')
if (ledger.status !== 'complete') errors.push('P8B completion state changed')
if (ledger.phase !== 'P8B') errors.push('P8B phase changed')
if (ledger.evidence?.matrix?.owned_routes !== 21) errors.push('P8B route count changed')
if (ledger.evidence?.matrix?.production_scenarios !== 84) errors.push('P8B production scenario count changed')
if (ledger.evidence?.matrix?.missing_surface_probes !== 5) errors.push('P8B probe count changed')
if (ledger.evidence?.matrix?.history_scenarios !== 10) errors.push('P8B History scenario count changed')
if (ledger.counts?.p0 !== 0 || ledger.counts?.p1 !== 3 || ledger.counts?.p2 !== 5 || ledger.counts?.total !== 8) errors.push('P8B severity counts changed')
if ((ledger.defects ?? []).length !== 8) errors.push('P8B finding count changed')
if ((ledger.ordered_phase_9_queue ?? []).length !== 8) errors.push('Phase 9 queue changed')

for (const id of [
  'P8B-P1-HISTORY-METRIC-SYNCHRONIZATION', 'P8B-P1-HISTORY-KEYBOARD-ENTRY',
  'P8B-P1-HISTORY-TASK-HIERARCHY', 'P8B-P2-SMALL-INTERACTIVE-TARGETS',
  'P8B-P2-WATCHLIST-PUBLIC-READINESS-OMISSION', 'P8B-P2-PRODUCTION-SMOKE-OMISSIONS',
  'P8B-P2-RELEASE-POLICY-SURFACES-MISSING', 'P8B-P2-UNLABELED-CONTROLS',
]) if (!(ledger.defects ?? []).some((item) => item.id === id)) errors.push(`missing P8B finding: ${id}`)

need('docs/audits/P8B_SCOPE.md', [
  'Status: complete through PR #428',
  'Merge commit: `b2dd44dff6efd9da78a3ddd28f2ed26661bf9eb8`',
  '84 production route scenarios', '10 deterministic History state/interaction scenarios',
  'P8B was audit-only.',
])
need('docs/audits/public-browser-audit.md', [
  '21 owned routes', '84 production route scenarios',
  'P8B-P1-HISTORY-METRIC-SYNCHRONIZATION',
  'P8B-P1-HISTORY-KEYBOARD-ENTRY', 'P8B-P1-HISTORY-TASK-HIERARCHY',
])
need('apps/web/scripts/public-browser-audit.mjs', [
  "schema: 'viewloom-public-browser-audit-v1'", "phase: 'P8B'",
  'productionMatrix', 'missingSurfaceProbes', 'historyScenarios',
])
need('.github/workflows/public-browser-audit.yml', [
  'name: Public Browser Audit', 'cancel-in-progress: true',
  'Run P8B public browser audit', 'public-browser-audit-p8b',
])
need('docs/product/current-roadmap.md', [
  'Phase 8 P8B   complete PR #428', 'Phase 9 P9H0  complete PR #430',
  'Phase 9 P9H1  active', 'Active implementation branch: work-history-ui-h1-metric',
])
need('docs/product/current-schedule.md', [
  'Phase 8 public inventory/browser audit  complete PR #428',
  'Active implementation branch            work-history-ui-h1-metric',
  'Exact next branch                       work-history-ui-h2-chart',
])
need('docs/product/post-watchlist-program-plan.md', [
  '| 8 | P8B | complete PR #428', '| 9 | P9H0 | complete PR #430',
  '| 9 | P9H1 | active', 'Current implementation branch: `work-history-ui-h1-metric`',
])
need('docs/product/history-ui-repair-plan.md', [
  'Completed window: P9H0 through PR #430', 'Current implementation branch: `work-history-ui-h1-metric`',
  'P9H1 work-history-ui-h1-metric           active',
])
need('docs/work-in-progress/history-ui-repair-working-note.md', [
  'Completed predecessor: P9H0 through PR #430', 'Current implementation branch: `work-history-ui-h1-metric`',
  'P9H1 work-history-ui-h1-metric           active',
])
need('docs/README.md', [
  'P9H0 completed through PR #430.', 'Active implementation branch                              work-history-ui-h1-metric',
])

if (errors.length) {
  console.error('ViewLoom P8B repository verification did not pass:')
  for (const error of errors) console.error(`- ${error}`)
  process.exit(1)
}

console.log('ViewLoom P8B historical repository verification passed.')
console.log('- 21 routes, four widths, five missing surfaces, ten History scenarios, and eight findings remain exact')
console.log('- provider separation and the audit-only boundary remain locked')
console.log('- P9H1 is active and P9H2 remains next')
