import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import {
  buildHeatmapOverview,
  formatActivity,
  formatMomentum,
  momentumLabel,
} from '../src/features/heatmap-page/summary-legend-core.mjs'

const now = Date.parse('2026-06-15T06:00:00Z')
const raw = {
  ok: true,
  latest: {
    collected_at: '2026-06-15T05:58:00Z',
    covered_pages: 3,
    has_more: 1,
    stream_count: 3,
    total_viewers: 200,
    source_mode: 'real',
    payload_json: JSON.stringify({
      activityAvailable: true,
      activitySampled: true,
      items: [
        { channelLogin: 'alpha', displayName: 'Alpha', viewers: 100, momentum: -0.04, activity: 0.1, activityAvailable: true, activitySampled: true },
        { channelLogin: 'beta', displayName: 'Beta', viewers: 70, momentum: 0.08, activity: 0.2, activityAvailable: true, activitySampled: true },
        { channelLogin: 'gamma', displayName: 'Gamma', viewers: 30, momentum: 0.01, activity: 0.5, activityAvailable: true, activitySampled: true },
      ],
    }),
  },
  status: { status: 'idle', covered_pages: 3, has_more: 1 },
  freshness: { staleAfterMinutes: 10, strongStaleAfterMinutes: 30 },
  collectionMethod: 'Authenticated API',
  topLimit: 300,
}

const overview = buildHeatmapOverview(raw, 'twitch', now)
assert.equal(overview.activeRecords, 3)
assert.equal(overview.totalViewers, 200)
assert.equal(overview.strongestMomentum?.channelLogin, 'beta')
assert.equal(overview.highestActivity?.channelLogin, 'gamma')
assert.equal(overview.activityState, 'available')
assert.ok(overview.coverageLines.some((line) => line.includes('Configured collection limit: 300')))
assert.ok(overview.coverageLines.some((line) => line.includes('More platform records')))
assert.ok(overview.coverageLines.some((line) => line.includes('Snapshot age: 2 minutes')))
assert.equal(momentumLabel(0.08), 'Rising')
assert.equal(momentumLabel(-0.08), 'Falling')
assert.equal(momentumLabel(0.01), 'Stable')
assert.equal(formatMomentum(0.08), '+8.0%')
assert.equal(formatActivity(0.5), '50.0%')

const unavailable = buildHeatmapOverview({
  ...raw,
  activityAvailable: false,
  activitySampled: false,
  latest: {
    ...raw.latest,
    has_more: 0,
    payload_json: JSON.stringify({
      activityAvailable: false,
      activitySampled: false,
      items: [
        { channelLogin: 'alpha', displayName: 'Alpha', viewers: 100, momentum: 0, activity: 0, activityAvailable: false, activitySampled: false },
      ],
    }),
  },
}, 'twitch', now)
assert.equal(unavailable.highestActivity, null)
assert.equal(unavailable.activityState, 'unavailable')
assert.ok(unavailable.legend.activity.includes('unavailable'))

const read = (relativePath) => readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), 'utf8')
const overviewSource = read('../src/features/heatmap-page/overview.ts')
const adapterSource = read('../src/features/heatmap-page/data-truth-adapter.ts')
const sourceObserver = read('../src/features/heatmap-page/data-state-source.ts')
const twitchHtml = read('../twitch/heatmap/index.html')
const kickHtml = read('../kick/heatmap/index.html')

for (const fragment of [
  'Active observed records',
  'Total observed viewers',
  'Strongest momentum',
  'Highest available activity',
  'heatmap-final-legend',
  'heatmap-final-coverage',
  'Auto refresh: On',
  'Next stored-snapshot check in',
  'manual Refresh',
]) assert.ok(overviewSource.includes(fragment), `missing overview fragment: ${fragment}`)

assert.ok(!overviewSource.includes('heatmap-auto-refresh-toggle'))
assert.ok(adapterSource.includes('installHeatmapOverview(provider)'))
assert.ok(adapterSource.includes("'summary'"))
assert.ok(sourceObserver.includes('viewloom:heatmap-response-error'))
assert.ok(twitchHtml.includes('/src/live/heatmap-current-shell-entry.ts'))
assert.ok(kickHtml.includes('/src/live/heatmap-current-shell-entry.ts'))

console.log('Heatmap summary, legend, coverage, and refresh-state verification passed.')
