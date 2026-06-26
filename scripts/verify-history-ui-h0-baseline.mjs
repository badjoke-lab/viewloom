import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const issues = []
const check = (path, parts) => {
  const file = join(root, path)
  if (!existsSync(file)) {
    issues.push(`missing ${path}`)
    return
  }
  const text = readFileSync(file, 'utf8')
  for (const part of parts) if (!text.includes(part)) issues.push(`${path}: missing ${part}`)
}

check('docs/audits/history-ui-h0-baseline.md', ['Status: complete through PR #430', 'work-history-ui-h1-metric'])
check('docs/audits/history-ui-h0-source-map.md', ['history-current-shell-entry.ts', 'history-overview.ts'])
check('docs/audits/history-ui-h0-findings.md', ['history-metric-summary-stale', 'history-selected-day-context-stale', 'history-metric-ranking-context-stale', 'history-mobile-task-flow-too-long', '15,058px'])
check('apps/web/scripts/history-ui-h0-browser.mjs', ["schema: 'viewloom-history-ui-h0-baseline-v1'", "phase: 'P9H0'"])
check('.github/workflows/history-ui-h0-baseline.yml', ['name: History UI P9H0 Evidence', 'cancel-in-progress: true'])
check('docs/product/current-roadmap.md', ['Phase 9 P9H1  complete PR #434', 'Phase 9 P9H2  active'])
check('docs/product/current-schedule.md', ['P9H1 complete PR #434', 'P9H2 active'])
check('docs/product/history-ui-repair-plan.md', ['Completed P9H1: PR #434', 'P9H2 work-history-ui-h2-chart      active'])
check('docs/work-in-progress/history-ui-repair-working-note.md', ['Completed P9H1: PR #434', 'P9H2 work-history-ui-h2-chart      active'])

const owner = JSON.parse(readFileSync(join(root, 'docs/audits/history-ui-h0-owner-map.json'), 'utf8'))
if (owner.status !== 'complete' || owner.completion_pr !== 430) issues.push('P9H0 owner map changed')
if (owner.next_branch !== 'work-history-ui-h1-metric') issues.push('P9H0 handoff changed')

if (issues.length) {
  console.error('P9H0 historical verification failed')
  issues.forEach((issue) => console.error(`- ${issue}`))
  process.exit(1)
}
console.log('P9H0 historical verification passed under active P9H2.')
