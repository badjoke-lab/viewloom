import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const issues = []
const read = (path) => readFileSync(join(root, path), 'utf8')
const needFile = (path) => {
  if (!existsSync(join(root, path))) issues.push(`missing file: ${path}`)
}
const need = (path, fragments) => {
  needFile(path)
  if (!existsSync(join(root, path))) return
  const source = read(path)
  for (const fragment of fragments) if (!source.includes(fragment)) issues.push(`${path}: missing ${fragment}`)
}
const forbid = (path, fragments) => {
  if (!existsSync(join(root, path))) return
  const source = read(path)
  for (const fragment of fragments) if (source.includes(fragment)) issues.push(`${path}: unexpected ${fragment}`)
}

for (const path of [
  'docs/product/history-ui-repair-spec.md',
  'docs/product/history-ui-repair-plan.md',
  'docs/operations/history-production-acceptance-2026-06-28.md',
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

need('docs/product/history-ui-repair-spec.md', [
  'Status: accepted and complete',
  'Phase 9 — History P1 repair complete',
])
need('docs/product/history-ui-repair-plan.md', [
  'Status: complete',
  'Completed P9H1: PR #434',
  'Completed P9H7 production acceptance: PR #451',
])
need('docs/operations/history-production-acceptance-2026-06-28.md', [
  'History Phase 9 is accepted in production.',
  'Viewer-minutes: real data',
  'Peak viewers: real data',
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
  "normalize(day.coverageState) !== 'missing'",
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
if ((overview.match(/window\.fetch\s*=/g) ?? []).length !== 1) issues.push('history-overview fetch wrapper count changed')
if ((overview.match(/new MutationObserver/g) ?? []).length !== 1) issues.push('history-overview observer count changed')
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
if (ownerMap.status !== 'complete') issues.push('P9H0 owner-map state changed')
if (ownerMap.next_branch !== 'work-history-ui-h1-metric') issues.push('P9H0 handoff changed')

if (issues.length) {
  console.error('History UI P9H1 repository verification did not pass:')
  for (const issue of issues) console.error(`- ${issue}`)
  process.exit(1)
}

console.log('History UI P9H1 repository verification passed.')
console.log('- P9H1 metric synchronization remains protected')
console.log('- provider, request, and output boundaries remain protected')
console.log('- permanent History acceptance, not current roadmap wording, owns phase completion')
