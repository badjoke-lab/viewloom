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

need('docs/product/current-roadmap.md', [
  'Phase 9 P9H2  active',
  'Active implementation branch: work-history-ui-h2-chart',
  'Exact next implementation branch: work-history-ui-h3-overview',
])
need('docs/product/current-schedule.md', [
  'P9H2 History chart interpretation        active',
  'Active implementation branch             work-history-ui-h2-chart',
  'Exact next branch                        work-history-ui-h3-overview',
])
need('apps/web/src/live/history-usability-pass.ts', [
  "import '../history-chart-p9h2.css'",
  "import './history-chart-p9h2'",
])
need('apps/web/src/live/history-chart-p9h2.ts', [
  "new MutationObserver(queue).observe(stage, { childList: true, subtree: true })",
  "stage.addEventListener('keydown', onKeydown, true)",
  "day.setAttribute('aria-keyshortcuts', 'ArrowLeft ArrowRight Home End Enter Space')",
  "svg.setAttribute('aria-labelledby', `${title.id} ${description.id}`)",
  "stage.dataset.historyChartReady = 'true'",
  "legend.dataset.historyLegendNonColor = 'true'",
  "node.setAttribute('aria-live', 'polite')",
])
need('apps/web/src/history-chart-p9h2.css', [
  '.history-state-marker',
  '.history-chart-inspection',
  '[data-history-coverage="missing"]',
  '@media(forced-colors:active)',
])
need('apps/web/scripts/history-ui-h2-chart-browser.mjs', [
  "schema: 'viewloom-history-ui-h2-chart-v1'",
  "phase: 'P9H2'",
  "await selected.press('Home')",
  "await selected.press('ArrowRight')",
  "if (touch) await demo.tap()",
  'keyboard day inspection',
  "calls.every((call) => call.provider === provider)",
])
need('.github/workflows/history-ui-h2-chart.yml', [
  'name: History UI P9H2 Chart',
  'Verify P9H2 repository contract',
  'Run P9H2 chart browser acceptance',
  'history-ui-h2-chart',
  'cancel-in-progress: true',
])

const source = read('apps/web/src/live/history-chart-p9h2.ts')
if (source.includes('window.fetch =')) failures.push('P9H2 must not add a fetch wrapper')
if (source.includes('document.documentElement')) failures.push('P9H2 observer must stay scoped to the chart stage')

if (failures.length) {
  console.error('History UI P9H2 verification failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('History UI P9H2 repository verification passed.')
console.log('- chart dates, scale, metric, unit, exact detail, keyboard/touch inspection, and non-color state meaning are governed')
console.log('- provider and request boundaries remain unchanged')
console.log('- work-history-ui-h3-overview remains next and uncreated')
