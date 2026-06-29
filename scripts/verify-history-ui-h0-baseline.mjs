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
if (ownerMap.status !== 'complete' || ownerMap.completion_pr !== 430) issues.push('owner-map completion changed')
if (ownerMap.next_branch !== 'work-history-ui-h1-metric') issues.push('P9H0 handoff changed')

const ledger = JSON.parse(read('docs/audits/public-browser-defects.json'))
if (ledger.status !== 'complete' || ledger.counts?.p1 !== 3 || ledger.counts?.p2 !== 5) issues.push('P8B baseline changed')

need('apps/web/scripts/history-ui-h0-browser.mjs', [
  "schema: 'viewloom-history-ui-h0-baseline-v1'",
  "phase: 'P9H0'",
  'history-metric-summary-stale',
  'history-selected-day-context-stale',
  'history-metric-ranking-context-stale',
  'history-mobile-task-flow-too-long',
])
need('.github/workflows/history-ui-h0-baseline.yml', [
  'name: History UI P9H0 Evidence',
  'Verify completed P9H0 evidence contract',
  'cancel-in-progress: true',
])
need('docs/product/history-ui-repair-plan.md', [
  'Status: complete',
  'Completed P9H1: PR #434',
  'Completed P9H7 production acceptance: PR #451',
])
need('docs/operations/history-production-acceptance-2026-06-28.md', [
  'Status: permanent acceptance record',
  'Accepted production commit: `233a35ebe219c6be42723eb749e2bcc84ae7fc09`',
  'History Phase 9 is accepted in production.',
])

if (issues.length) {
  console.error('History UI P9H0 evidence verification did not pass:')
  for (const issue of issues) console.error(`- ${issue}`)
  process.exit(1)
}

console.log('History UI P9H0 historical evidence verification passed.')
console.log('- PR #430 evidence remains exact')
console.log('- later roadmap handoffs do not rewrite P9H0 evidence')
