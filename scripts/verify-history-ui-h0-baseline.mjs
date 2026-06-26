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
  'README.md',
  'docs/README.md',
  'docs/product/current-roadmap.md',
  'docs/product/current-schedule.md',
  'docs/product/post-watchlist-program-plan.md',
  'docs/product/history-ui-repair-plan.md',
  'docs/work-in-progress/history-ui-repair-working-note.md',
  'docs/audits/history-ui-h0-baseline.md',
  'docs/audits/history-ui-h0-source-map.md',
  'docs/audits/history-ui-h0-owner-map.json',
  'docs/audits/history-ui-h0-findings.md',
  'docs/audits/public-browser-defects.json',
  'apps/web/scripts/history-ui-h0-browser.mjs',
  'apps/web/src/live/history-current-shell-entry.ts',
  'apps/web/src/live/history-usability-pass.ts',
  'apps/web/src/live/history-view-shell.ts',
  'apps/web/src/live/history-overview.ts',
  'apps/web/src/live/history-report-text.ts',
  'apps/web/src/live/history-report-text-state.ts',
  '.github/workflows/history-ui-h0-baseline.yml',
]) needFile(path)

need('README.md', [
  'P9H0 complete PR #430',
  'work-p9h0-closeout',
  'work-history-ui-h1-metric',
])
need('docs/README.md', [
  'P9H0 completed through PR #430.',
  'C9H0     work-p9h0-closeout',
  'P9H1     work-history-ui-h1-metric',
])
need('docs/product/current-roadmap.md', [
  'Phase 9 P9H0  complete PR #430',
  'P9H0 closeout active on work-p9h0-closeout',
  'work-history-ui-h1-metric',
])
need('docs/product/current-schedule.md', [
  'History P9H0 deterministic baseline      complete PR #430',
  'Current branch: work-p9h0-closeout',
  'work-history-ui-h1-metric',
])
need('docs/product/post-watchlist-program-plan.md', [
  'Completed predecessor: P9H0 through PR #430',
  'Current branch: `work-p9h0-closeout`',
  'Exact next implementation branch: `work-history-ui-h1-metric`',
])
need('docs/product/history-ui-repair-plan.md', [
  'Completed window: P9H0 through PR #430',
  'Current branch: `work-p9h0-closeout`',
  'work-history-ui-h1-metric',
])
need('docs/work-in-progress/history-ui-repair-working-note.md', [
  'Completed predecessor: P9H0 through PR #430',
  'Current branch: `work-p9h0-closeout`',
  'work-history-ui-h1-metric',
])

need('docs/audits/history-ui-h0-baseline.md', [
  'work-p9h0-baseline',
  'work-history-ui-h0-baseline',
])
need('docs/audits/history-ui-h0-source-map.md', [
  'history-current-shell-entry.ts',
  'history-usability-pass.ts',
  'history-view-shell.ts',
  'history-overview.ts',
  'history-report-text-state.ts',
])
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
if (ownerMap.schema !== 'viewloom-history-ui-h0-owner-map-v1') failures.push('P9H0 owner-map schema changed')
if (!['complete_candidate', 'complete'].includes(ownerMap.status)) failures.push('P9H0 owner-map status invalid')
if (ownerMap.owners?.state_request_and_base_rendering !== 'apps/web/src/live/history-current-shell-entry.ts') failures.push('P9H0 primary owner changed')
if (ownerMap.next_branch !== 'work-history-ui-h1-metric') failures.push('P9H0 next branch changed')
for (const id of [
  'history-metric-ranking-context-stale',
  'history-metric-summary-stale',
  'history-mobile-task-flow-too-long',
  'history-selected-day-context-stale',
]) if (!ownerMap.deterministic_failures?.includes(id)) failures.push(`P9H0 owner map missing ${id}`)

need('apps/web/scripts/history-ui-h0-browser.mjs', [
  "schema: 'viewloom-history-ui-h0-baseline-v1'",
  'history-metric-summary-stale',
  'history-selected-day-context-stale',
  'history-metric-ranking-context-stale',
  'history-first-keyboard-entry-missing',
  'history-mobile-task-flow-too-long',
  'Unexpected P9H0 acceptance set',
])
need('apps/web/src/live/history-current-shell-entry.ts', [
  "params.set('metric', pageState.metric)",
  'renderSummary(payload, daily, top)',
  '<span>viewer-minutes</span>',
  '<small>Viewer-minutes</small>',
  '<small>Peak viewers</small>',
])
need('apps/web/src/live/history-usability-pass.ts', [
  "import './history-view-shell'",
  "import './history-overview'",
  "import './history-archives'",
])
need('apps/web/src/live/history-view-shell.ts', [
  'installReplaceStateBridge',
  'MutationObserver',
  "move('overview'",
  "move('report'",
])
need('apps/web/src/live/history-overview.ts', [
  'installPayloadCapture()',
  'window.fetch =',
  'ensureInsights(panel)',
])
need('apps/web/src/live/history-report-text.ts', [
  'renderHistoryReport(payload)',
  'renderHistoryShareCard(payload)',
  'renderHistoryExport(payload)',
])
need('apps/web/src/live/history-report-text-state.ts', [
  'installHistoryReportPayloadCapture',
  'Metric: ${metricLabel(metric)}',
])
need('.github/workflows/history-ui-h0-baseline.yml', [
  'name: History UI P9H0 Baseline',
  'Verify P9H0 repository contract',
  'Run P9H0 browser baseline',
  'history-ui-h0-baseline',
])

const ledger = JSON.parse(read('docs/audits/public-browser-defects.json'))
if (ledger.status !== 'complete') failures.push('P8B ledger is not complete')
if (ledger.counts?.p1 !== 3) failures.push('P8B must retain three P1 findings')
for (const id of [
  'P8B-P1-HISTORY-METRIC-SYNCHRONIZATION',
  'P8B-P1-HISTORY-KEYBOARD-ENTRY',
  'P8B-P1-HISTORY-TASK-HIERARCHY',
]) if (!ledger.defects?.some((item) => item.id === id)) failures.push(`P8B ledger missing ${id}`)

if (failures.length) {
  console.error('History UI P9H0 repository verification failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('History UI P9H0 repository verification passed.')
console.log('- P9H0 remains completed through PR #430')
console.log('- exact deterministic failures and source owners remain recorded')
console.log('- the keyboard production/local discrepancy remains explicit')
console.log('- work-history-ui-h1-metric remains next after closeout')