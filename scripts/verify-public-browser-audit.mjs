import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const issues = []
const read = (path) => readFileSync(join(root, path), 'utf8')
const need = (path, fragments) => {
  if (!existsSync(join(root, path))) {
    issues.push(`missing file: ${path}`)
    return
  }
  const source = read(path)
  for (const fragment of fragments) if (!source.includes(fragment)) issues.push(`${path}: missing ${fragment}`)
}

for (const path of [
  'docs/audits/P8B_SCOPE.md', 'docs/audits/public-browser-defects.json',
  'docs/audits/public-browser-audit.md', 'docs/audits/public-surface-inventory.json',
  'docs/audits/public-surface-gaps.json', 'apps/web/scripts/public-browser-audit.mjs',
  '.github/workflows/public-browser-audit.yml', 'docs/product/current-roadmap.md',
  'docs/product/current-schedule.md', 'docs/product/post-watchlist-program-plan.md',
  'docs/product/history-ui-repair-plan.md', 'docs/work-in-progress/history-ui-repair-working-note.md',
  'docs/README.md',
]) if (!existsSync(join(root, path))) issues.push(`missing file: ${path}`)

const manifest = JSON.parse(read('docs/audits/public-surface-inventory.json'))
const gaps = JSON.parse(read('docs/audits/public-surface-gaps.json'))
const ledger = JSON.parse(read('docs/audits/public-browser-defects.json'))

if (manifest.schema !== 'viewloom-public-surface-inventory-v1') issues.push('P8A schema changed')
if (manifest.counts?.inventory_entries !== 21) issues.push('P8A route count changed')
if (manifest.provider_invariants?.twitch_binding !== 'DB_TWITCH_HOT') issues.push('Twitch binding changed')
if (manifest.provider_invariants?.kick_binding !== 'DB_KICK_HOT') issues.push('Kick binding changed')
if (manifest.provider_invariants?.combined_totals_allowed !== false) issues.push('combined totals boundary changed')
if (manifest.provider_invariants?.combined_rankings_allowed !== false) issues.push('combined rankings boundary changed')
if ((gaps.missing_surfaces ?? []).length !== 5) issues.push('P8B surface baseline changed')

if (ledger.schema !== 'viewloom-public-browser-defect-ledger-v1') issues.push('P8B schema changed')
if (ledger.status !== 'complete') issues.push('P8B completion state changed')
if (ledger.phase !== 'P8B') issues.push('P8B phase changed')
if (ledger.evidence?.matrix?.owned_routes !== 21) issues.push('P8B route count changed')
if (ledger.evidence?.matrix?.production_scenarios !== 84) issues.push('P8B production scenario count changed')
if (ledger.evidence?.matrix?.missing_surface_probes !== 5) issues.push('P8B probe count changed')
if (ledger.evidence?.matrix?.history_scenarios !== 10) issues.push('P8B History scenario count changed')
if (ledger.counts?.p0 !== 0 || ledger.counts?.p1 !== 3 || ledger.counts?.p2 !== 5 || ledger.counts?.total !== 8) issues.push('P8B severity counts changed')
if ((ledger.defects ?? []).length !== 8) issues.push('P8B record count changed')

for (const id of [
  'P8B-P1-HISTORY-METRIC-SYNCHRONIZATION', 'P8B-P1-HISTORY-KEYBOARD-ENTRY',
  'P8B-P1-HISTORY-TASK-HIERARCHY', 'P8B-P2-SMALL-INTERACTIVE-TARGETS',
  'P8B-P2-WATCHLIST-PUBLIC-READINESS-OMISSION', 'P8B-P2-PRODUCTION-SMOKE-OMISSIONS',
  'P8B-P2-RELEASE-POLICY-SURFACES-MISSING', 'P8B-P2-UNLABELED-CONTROLS',
]) if (!(ledger.defects ?? []).some((item) => item.id === id)) issues.push(`missing P8B record: ${id}`)

need('docs/audits/P8B_SCOPE.md', [
  'Status: complete through PR #428',
  'Merge commit: `b2dd44dff6efd9da78a3ddd28f2ed26661bf9eb8`',
  '84 production route scenarios', '10 deterministic History state/interaction scenarios',
  'P8B was audit-only.',
])
need('apps/web/scripts/public-browser-audit.mjs', [
  "schema: 'viewloom-public-browser-audit-v1'", "phase: 'P8B'",
  'productionMatrix', 'missingSurfaceProbes', 'historyScenarios',
])
need('.github/workflows/public-browser-audit.yml', [
  'name: Public Browser Audit', 'cancel-in-progress: true',
  'Run P8B public browser audit',
  "!evidence.findings.some((finding) => finding.id === 'P8B-P1-HISTORY-METRIC-SYNCHRONIZATION')",
])
need('docs/product/current-roadmap.md', [
  'Phase 8 P8B   complete PR #428',
  'Phase 9 P9H1  complete PR #434',
  'Active implementation branch: none',
])
need('docs/product/current-schedule.md', [
  'Phase 8 inventory/browser audit          complete PR #428',
  'P9H1 History metric synchronization      complete PR #434',
  'Active implementation branch             none',
  'Exact next branch                        work-history-ui-h2-chart',
])
need('docs/product/post-watchlist-program-plan.md', [
  '| 8 | P8B | complete PR #428',
  '| 9 | P9H1 | complete PR #434',
  'Current implementation branch: none',
])
need('docs/product/history-ui-repair-plan.md', [
  'Completed P9H1: PR #434',
  'P9H2 work-history-ui-h2-chart      exact next; not created',
])
need('docs/work-in-progress/history-ui-repair-working-note.md', [
  'Completed P9H1: PR #434',
  'Current implementation branch: none',
])
need('docs/README.md', [
  'P9H1 completed through PR #434',
  'Active implementation branch                              none',
])

if (issues.length) {
  console.error('ViewLoom P8B repository verification did not pass:')
  for (const issue of issues) console.error(`- ${issue}`)
  process.exit(1)
}

console.log('ViewLoom P8B historical repository verification passed.')
console.log('- the 21-route historical audit record remains exact')
console.log('- provider separation and the audit-only boundary remain locked')
console.log('- P9H1 is complete and P9H2 remains next')
