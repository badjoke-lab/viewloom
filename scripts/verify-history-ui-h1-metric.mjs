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

check('docs/product/current-roadmap.md', ['Phase 9 P9H1  complete PR #434', 'Phase 9 P9H2  active', 'work-history-ui-h2-chart'])
check('docs/product/current-schedule.md', ['P9H1 complete PR #434', 'P9H2 active', 'work-history-ui-h3-overview'])
check('apps/web/src/live/history-current-shell-entry.ts', ["params.set('metric', pageState.metric)", 'renderChart(payload, daily, metric)'])
check('apps/web/src/live/history-overview.ts', ['renderMetricSummary(currentPayload, metric)', 'renderMetricSelectedDay(currentPayload, metric)', 'renderMetricRanking(panel, currentPayload, metric)'])
check('apps/web/src/live/history-report-text-state.ts', ['export function reportMetric', "normalize(day.coverageState) !== 'missing'"])
check('apps/web/src/live/history-share-card.ts', ['canvas.dataset.shareMetric = metric', 'canvas.dataset.sharePrimaryValue = model.primaryValue'])
check('apps/web/src/live/history-export-model.ts', ["schema: 'viewloom-history-export-v1'", 'viewer_minutes:', 'peak_viewers:'])
check('apps/web/scripts/history-ui-h1-browser.mjs', ["schema: 'viewloom-history-ui-h1-metric-v1'", "phase: 'P9H1'", 'Summary stayed stale', 'Selected day stayed stale', 'Ranking context stayed stale'])
check('.github/workflows/history-ui-h1-metric.yml', ['name: History UI P9H1 Metric', 'Run P9H1 metric browser acceptance'])

const overview = readFileSync(join(root, 'apps/web/src/live/history-overview.ts'), 'utf8')
if ((overview.match(/window\.fetch\s*=/g) ?? []).length !== 1) issues.push('P9H1 fetch wrapper count changed')
if ((overview.match(/new MutationObserver/g) ?? []).length !== 1) issues.push('P9H1 observer count changed')

if (issues.length) {
  console.error('P9H1 preservation verification failed')
  issues.forEach((issue) => console.error(`- ${issue}`))
  process.exit(1)
}
console.log('P9H1 preservation verification passed under active P9H2.')
