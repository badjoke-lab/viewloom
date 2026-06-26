import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const failures = []
const read = (path) => readFileSync(join(root, path), 'utf8')
const needFile = (path) => {
  if (!existsSync(join(root, path))) failures.push(`missing file: ${path}`)
}
const need = (path, fragments) => {
  needFile(path)
  if (!existsSync(join(root, path))) return
  const source = read(path)
  for (const fragment of fragments) if (!source.includes(fragment)) failures.push(`${path}: missing ${fragment}`)
}
const forbid = (path, fragments) => {
  if (!existsSync(join(root, path))) return
  const source = read(path)
  for (const fragment of fragments) if (source.includes(fragment)) failures.push(`${path}: forbidden ${fragment}`)
}

for (const path of [
  'docs/product/current-roadmap.md',
  'docs/product/current-schedule.md',
  'docs/product/post-watchlist-program-plan.md',
  'docs/product/history-ui-repair-spec.md',
  'docs/product/history-ui-repair-plan.md',
  'docs/work-in-progress/history-ui-repair-working-note.md',
  'docs/audits/history-ui-h0-owner-map.json',
  'apps/web/src/live/history-current-shell-entry.ts',
  'apps/web/src/live/history-overview.ts',
  'apps/web/src/live/history-report-text-state.ts',
  'apps/web/src/live/history-report-social.ts',
  'apps/web/src/live/history-share-card.ts',
  'apps/web/src/live/history-export.ts',
  'apps/web/src/live/history-export-model.ts',
  'apps/web/scripts/history-ui-h1-browser.mjs',
  'scripts/verify-history-ui-h1-metric.mjs',
  '.github/workflows/history-ui-h1-metric.yml',
]) needFile(path)

need('docs/product/current-roadmap.md', [
  'Final-state correction complete PR #433',
  'Phase 9 P9H1  active',
  'Active implementation branch: work-history-ui-h1-metric',
  'P9H2 has not been created.',
])
need('docs/product/current-schedule.md', [
  'Active implementation branch            work-history-ui-h1-metric',
  'Exact next branch                       work-history-ui-h2-chart',
  'P9H2 branch created                     no',
  'P9H1 owns the three metric-context failures.',
])
need('docs/product/post-watchlist-program-plan.md', [
  'Version: 2.2',
  'Current implementation branch: `work-history-ui-h1-metric`',
  '| 9 | P9H1 | active',
  'P9H2 work-history-ui-h2-chart      exact next after P9H1 merge and explicit continuation',
])
need('docs/product/history-ui-repair-plan.md', [
  'Version: 1.6',
  'Current implementation branch: `work-history-ui-h1-metric`',
  'The three metric-context expected failures must become passing assertions',
  'work-history-ui-h2-chart',
])
need('docs/work-in-progress/history-ui-repair-working-note.md', [
  'Current implementation branch: `work-history-ui-h1-metric`',
  'The three metric-context expected failures must become passing assertions.',
  'work-history-ui-h2-chart',
])

need('apps/web/src/live/history-current-shell-entry.ts', [
  "params.set('metric', pageState.metric)",
  'renderChart(payload, daily, metric)',
  'renderSummary(payload, daily, top)',
  'renderSelectedDay(daily)',
  'renderRanking(top)',
  'renderDailyArchive(daily)',
])
need('apps/web/src/live/history-overview.ts', [
  'renderMetricSummary(currentPayload, metric)',
  'renderMetricSelectedDay(currentPayload, metric)',
  'renderMetricRanking(panel, currentPayload, metric)',
  'renderMetricDailyArchive(currentPayload, metric)',
  'renderMetricStrip(currentPayload, metric)',
  'renderInsights(insights, currentPayload, metric)',
  'data-history-summary-primary',
  'data-history-selected-primary',
  'data-history-ranking-context',
  'Ranked by ${metricLabel(metric)}',
  'Top streamers by ${metricLabel(metric)}',
  'Highest peak',
  'Total observed',
])
need('apps/web/src/live/history-report-text-state.ts', [
  'export function reportMetric',
  'export function metricTopStreamer',
  'export function topMetricDay',
  'Top streamer by ${metricLabel(metric)}',
  'Highest peak:',
])
need('apps/web/src/live/history-report-social.ts', [
  'reportMetric(payload)',
  'Top by ${metricLabel(metric)}',
  'Highest peak:',
])
need('apps/web/src/live/history-share-card.ts', [
  'canvas.dataset.shareMetric = metric',
  'canvas.dataset.sharePrimaryValue = model.primaryValue',
  'Metric: ${metricLabel(model.metric)}',
  'TOP BY ${metricLabel(metric).toUpperCase()}',
])
need('apps/web/src/live/history-export.ts', [
  'mount.dataset.exportMetric = model.metric',
  '${metricLabel(model.metric)}',
])
need('apps/web/src/live/history-export-model.ts', [
  "schema: 'viewloom-history-export-v1'",
  "metric: payload.metric === 'peak_viewers' ? 'peak_viewers' : 'viewer_minutes'",
  'viewer_minutes:',
  'peak_viewers:',
])

const overview = read('apps/web/src/live/history-overview.ts')
if ((overview.match(/window\.fetch\s*=/g) ?? []).length !== 1) failures.push('history-overview must retain exactly one existing fetch wrapper')
if ((overview.match(/new MutationObserver/g) ?? []).length !== 1) failures.push('history-overview must retain exactly one existing MutationObserver')
forbid('apps/web/src/live/history-current-shell-entry.ts', ['window.fetch =', 'new MutationObserver'])

need('apps/web/scripts/history-ui-h1-browser.mjs', [
  "schema: 'viewloom-history-ui-h1-metric-v1'",
  "phase: 'P9H1'",
  'Summary stayed stale',
  'Selected day stayed stale',
  'Ranking context stayed stale',
  'Daily archive stayed stale',
  'Report stayed stale',
  'Share-card primary value stayed stale',
  'viewer-minute request count changed',
  'peak-viewer request count changed',
  'crossed provider endpoint',
])
need('.github/workflows/history-ui-h1-metric.yml', [
  'name: History UI P9H1 Metric',
  'Verify P9H1 repository contract',
  'Run P9H1 metric browser acceptance',
  'history-ui-h1-metric',
  'cancel-in-progress: true',
])

const ownerMap = JSON.parse(read('docs/audits/history-ui-h0-owner-map.json'))
if (ownerMap.status !== 'complete') failures.push('P9H0 owner map must remain complete')
if (ownerMap.next_branch !== 'work-history-ui-h1-metric') failures.push('P9H0 owner map handoff changed')
for (const id of [
  'history-metric-ranking-context-stale',
  'history-metric-summary-stale',
  'history-mobile-task-flow-too-long',
  'history-selected-day-context-stale',
]) if (!ownerMap.deterministic_failures?.includes(id)) failures.push(`P9H0 owner map missing ${id}`)

if (failures.length) {
  console.error('History UI P9H1 repository verification failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('History UI P9H1 repository verification passed.')
console.log('- P9H1 is active on work-history-ui-h1-metric')
console.log('- Summary, Selected day, Ranking, Daily archive, Report, Share, and Export metric seams are present')
console.log('- provider/request/output boundaries remain protected')
console.log('- no additional History fetch wrapper or document-wide observer was introduced')
console.log('- work-history-ui-h2-chart remains the uncreated next branch')
