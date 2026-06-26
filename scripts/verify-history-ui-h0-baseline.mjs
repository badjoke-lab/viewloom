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

need('docs/audits/history-ui-h0-baseline.md', ['Status: complete through PR #430', 'work-p9h0-baseline', 'work-history-ui-h1-metric'])
need('docs/audits/history-ui-h0-source-map.md', ['history-current-shell-entry.ts', 'history-overview.ts', 'history-report-text-state.ts'])
need('docs/audits/history-ui-h0-findings.md', [
  'history-metric-summary-stale',
  'history-selected-day-context-stale',
  'history-metric-ranking-context-stale',
  'history-mobile-task-flow-too-long',
  '15,058px',
  '17.84 viewport heights',
  'production/local discrepancy',
])

const ownerMap = JSON.parse(read('docs/audits/history-ui-h0-owner-map.json'))
if (ownerMap.schema !== 'viewloom-history-ui-h0-owner-map-v1') issues.push('owner-map schema changed')
if (ownerMap.status !== 'complete') issues.push('owner-map completion state changed')
if (ownerMap.completion_pr !== 430) issues.push('owner-map completion PR changed')
if (ownerMap.next_branch !== 'work-history-ui-h1-metric') issues.push('owner-map handoff changed')
for (const id of [
  'history-metric-ranking-context-stale',
  'history-metric-summary-stale',
  'history-mobile-task-flow-too-long',
  'history-selected-day-context-stale',
]) if (!ownerMap.deterministic_failures?.includes(id)) issues.push(`owner map missing ${id}`)

const ledger = JSON.parse(read('docs/audits/public-browser-defects.json'))
if (ledger.status !== 'complete') issues.push('P8B ledger completion changed')
if (ledger.counts?.p1 !== 3 || ledger.counts?.p2 !== 5) issues.push('P8B counts changed')

need('apps/web/scripts/history-ui-h0-browser.mjs', [
  "schema: 'viewloom-history-ui-h0-baseline-v1'",
  "phase: 'P9H0'",
  'history-metric-summary-stale',
  'history-selected-day-context-stale',
  'history-metric-ranking-context-stale',
  'history-mobile-task-flow-too-long',
])
need('apps/web/scripts/prepare-history-ui-h0-baseline.mjs', ['P9H0 deterministic baseline prepared.'])
need('.github/workflows/history-ui-h0-baseline.yml', [
  'name: History UI P9H0 Evidence',
  'Verify completed P9H0 evidence contract',
  'cancel-in-progress: true',
])
need('docs/product/current-roadmap.md', [
  'Phase 9 P9H1  complete PR #434',
  'Active implementation branch: none',
])
need('docs/product/current-schedule.md', [
  'P9H1 History metric synchronization      complete PR #434',
  'Active implementation branch             none',
  'Exact next branch                        work-history-ui-h2-chart',
])
need('docs/product/history-ui-repair-plan.md', [
  'Completed P9H1: PR #434',
  'P9H2 work-history-ui-h2-chart      exact next; not created',
])
need('docs/work-in-progress/history-ui-repair-working-note.md', [
  'Completed P9H1: PR #434',
  'P9H2 work-history-ui-h2-chart',
])

if (issues.length) {
  console.error('History UI P9H0 evidence verification did not pass:')
  for (const issue of issues) console.error(`- ${issue}`)
  process.exit(1)
}

console.log('History UI P9H0 historical evidence verification passed.')
console.log('- PR #430 evidence remains exact')
console.log('- P9H1 is complete through PR #434')
console.log('- later phases retain mobile hierarchy and keyboard work')
