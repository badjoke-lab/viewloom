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
if (ownerMap.schema !== 'viewloom-history-ui-h0-owner-map-v1') errors.push('owner-map schema changed')
if (ownerMap.status !== 'complete') errors.push('owner-map completion state changed')
if (ownerMap.completion_pr !== 430) errors.push('owner-map completion PR changed')
if (ownerMap.next_branch !== 'work-history-ui-h1-metric') errors.push('owner-map handoff changed')
for (const id of [
  'history-metric-ranking-context-stale',
  'history-metric-summary-stale',
  'history-mobile-task-flow-too-long',
  'history-selected-day-context-stale',
]) if (!ownerMap.deterministic_failures?.includes(id)) errors.push(`owner map missing ${id}`)

const ledger = JSON.parse(read('docs/audits/public-browser-defects.json'))
if (ledger.status !== 'complete') errors.push('P8B ledger completion changed')
if (ledger.counts?.p1 !== 3 || ledger.counts?.p2 !== 5) errors.push('P8B counts changed')

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
need('docs/product/current-roadmap.md', ['Phase 9 P9H1  active', 'Active implementation branch: work-history-ui-h1-metric'])
need('docs/product/current-schedule.md', ['Active implementation branch            work-history-ui-h1-metric', 'Exact next branch                       work-history-ui-h2-chart'])
need('docs/product/history-ui-repair-plan.md', ['P9H1 work-history-ui-h1-metric           active', 'P9H2 work-history-ui-h2-chart'])
need('docs/work-in-progress/history-ui-repair-working-note.md', ['P9H1 work-history-ui-h1-metric           active', 'The three metric-context expected failures must become passing assertions.'])

if (errors.length) {
  console.error('History UI P9H0 evidence verification did not pass:')
  for (const error of errors) console.error(`- ${error}`)
  process.exit(1)
}

console.log('History UI P9H0 historical evidence verification passed.')
console.log('- PR #430 findings and owners remain exact')
console.log('- P9H1 owns current metric synchronization acceptance')
console.log('- later phases retain mobile hierarchy and keyboard discrepancy work')
