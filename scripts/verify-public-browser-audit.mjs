import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const failures = []
const read = (path) => readFileSync(join(root, path), 'utf8')
const need = (path, fragments) => {
  if (!existsSync(join(root, path))) {
    failures.push(`missing file: ${path}`)
    return
  }
  const source = read(path)
  for (const fragment of fragments) if (!source.includes(fragment)) failures.push(`${path}: missing ${fragment}`)
}

const ledger = JSON.parse(read('docs/audits/public-browser-defects.json'))
const manifest = JSON.parse(read('docs/audits/public-surface-inventory.json'))
const gaps = JSON.parse(read('docs/audits/public-surface-gaps.json'))

if (ledger.schema !== 'viewloom-public-browser-defect-ledger-v1') failures.push('P8B ledger schema changed')
if (ledger.status !== 'complete') failures.push('P8B ledger must remain complete')
if (ledger.phase !== 'P8B') failures.push('P8B phase changed')
if (ledger.evidence?.matrix?.owned_routes !== 21) failures.push('P8B owned route count changed')
if (ledger.evidence?.matrix?.production_scenarios !== 84) failures.push('P8B production scenario count changed')
if (ledger.evidence?.matrix?.missing_surface_probes !== 5) failures.push('P8B missing-surface count changed')
if (ledger.evidence?.matrix?.history_scenarios !== 10) failures.push('P8B History scenario count changed')
if (ledger.counts?.p0 !== 0 || ledger.counts?.p1 !== 3 || ledger.counts?.p2 !== 5 || ledger.counts?.total !== 8) failures.push('P8B classification changed')
if (manifest.counts?.inventory_entries !== 21) failures.push('P8A inventory count changed')
if (manifest.provider_invariants?.combined_totals_allowed !== false) failures.push('combined totals must remain forbidden')
if (manifest.provider_invariants?.combined_rankings_allowed !== false) failures.push('combined rankings must remain forbidden')
if ((gaps.missing_surfaces ?? []).length !== 5) failures.push('P8B baseline must retain five missing surfaces')

for (const id of [
  'P8B-P1-HISTORY-METRIC-SYNCHRONIZATION',
  'P8B-P1-HISTORY-KEYBOARD-ENTRY',
  'P8B-P1-HISTORY-TASK-HIERARCHY',
]) if (!ledger.defects?.some((item) => item.id === id)) failures.push(`missing P8B finding: ${id}`)

need('docs/audits/P8B_SCOPE.md', [
  'Status: complete through PR #428',
  'P8B was audit-only.',
])
need('docs/audits/public-browser-audit.md', [
  '21 owned routes',
  '84 production route scenarios',
])
need('apps/web/scripts/public-browser-audit.mjs', [
  "schema: 'viewloom-public-browser-audit-v1'",
  "phase: 'P8B'",
  'productionMatrix',
  'historyScenarios',
])
need('.github/workflows/public-browser-audit.yml', [
  'name: Public Browser Audit',
  'Run P8B public browser audit',
  'public-browser-audit-p8b',
])
need('docs/product/current-roadmap.md', [
  'P9H0 closeout complete PR #432',
  'Active implementation branch: none',
  'work-history-ui-h1-metric',
])
need('docs/product/current-schedule.md', [
  'P9H0 documentation closeout              complete PR #432',
  'Active implementation branch             none',
  'work-history-ui-h1-metric',
])
need('docs/product/post-watchlist-program-plan.md', [
  'Completed closeout: PR #432',
  'Current implementation branch: none',
])

if (failures.length) {
  console.error('ViewLoom P8B repository verification failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('ViewLoom P8B repository verification passed.')
console.log('- P8B remains completed historical evidence through PR #428')
console.log('- provider separation, route counts, scenarios, and findings remain exact')
console.log('- P9H0 closeout is complete and P9H1 remains the uncreated next branch')