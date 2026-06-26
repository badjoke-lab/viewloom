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
  'docs/audits/history-ui-h0-baseline.md',
  'docs/audits/history-ui-h0-source-map.md',
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
  'Phase 8  public inventory and browser defect audit        complete PR #428',
  'Phase 9  P0/P1 repair; History is the central track       P9H0 active',
  'Execution branch: `work-p9h0-baseline`',
  'Exact next branch after P9H0: `work-history-ui-h1-metric`',
])
need('docs/audits/history-ui-h0-baseline.md', [
  'Status: active',
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
  'params.set(\'metric\', pageState.metric)',
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
if (ledger.counts?.p1 !== 3) failures.push('P8B ledger must retain three History P1 findings')
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
console.log('- P8B three-P1 baseline remains exact')
console.log('- source owners and compatibility layers are recorded')
console.log('- browser acceptance assertions are executable before runtime repair')
console.log('- work-history-ui-h1-metric remains next')
