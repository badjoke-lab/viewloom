import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const failures = []
const check = (path, parts) => {
  const file = join(root, path)
  if (!existsSync(file)) {
    failures.push(`missing ${path}`)
    return
  }
  const source = readFileSync(file, 'utf8')
  for (const part of parts) if (!source.includes(part)) failures.push(`${path}: missing ${part}`)
}

check('docs/product/current-roadmap.md', ['Phase 9 P9H2  active', 'work-history-ui-h2-chart', 'work-history-ui-h3-overview'])
check('docs/product/current-schedule.md', ['P9H2 active', 'Active branch: work-history-ui-h2-chart', 'Next branch: work-history-ui-h3-overview'])
check('docs/product/history-ui-repair-plan.md', ['Version: 1.8', 'work-history-ui-h2-chart', 'work-history-ui-h3-overview'])
check('docs/work-in-progress/history-ui-repair-working-note.md', ['history-chart-p9h2.ts', 'history-ui-h2-chart-browser.mjs'])
check('apps/web/src/live/history-usability-pass.ts', ["import '../history-chart-p9h2.css'", "import './history-chart-p9h2'"])
check('apps/web/src/live/history-chart-p9h2.ts', [
  'new MutationObserver(queue).observe(stage',
  "stage.addEventListener('keydown', onKeydown, true)",
  'ArrowLeft ArrowRight Home End Enter Space',
  "svg.setAttribute('aria-labelledby'",
  "stage.dataset.historyChartReady = 'true'",
  "legend.dataset.historyLegendNonColor = 'true'",
  "node.setAttribute('aria-live', 'polite')",
])
check('apps/web/src/history-chart-p9h2.css', ['.history-state-marker', '.history-chart-inspection', 'forced-colors:active'])
check('apps/web/scripts/history-ui-h2-chart-browser.mjs', [
  "schema: 'viewloom-history-ui-h2-chart-v1'",
  "phase: 'P9H2'",
  "press('Home')",
  "press('ArrowRight')",
  'demo.tap()',
  'calls.length, requestCount',
])
check('.github/workflows/history-ui-h2-chart.yml', ['name: History UI P9H2 Chart', 'Run P9H2 chart browser acceptance', 'cancel-in-progress: true'])

const chart = readFileSync(join(root, 'apps/web/src/live/history-chart-p9h2.ts'), 'utf8')
if (chart.includes('window.fetch =')) failures.push('chart layer adds fetch wrapper')
if (chart.includes('document.documentElement')) failures.push('chart observer is not stage-scoped')

if (failures.length) {
  console.error('P9H2 verification failed')
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}

console.log('P9H2 chart repository verification passed.')
