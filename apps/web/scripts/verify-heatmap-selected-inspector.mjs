import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import {
  activityPresentation,
  buildInspectorLinks,
  formatObservationDuration,
  momentumDirection,
  selectedRank,
} from '../src/features/twitch-heatmap/selected-inspector-core.mjs'

const items = [
  { channelLogin: 'alpha', viewers: 100 },
  { channelLogin: 'beta', viewers: 80 },
  { channelLogin: 'gamma', viewers: 20 },
]
assert.equal(selectedRank(items, 'alpha'), 1)
assert.equal(selectedRank(items, 'beta'), 2)
assert.equal(selectedRank(items, 'missing'), null)
assert.equal(momentumDirection(0.03), 'Rising')
assert.equal(momentumDirection(-0.03), 'Falling')
assert.equal(momentumDirection(0.01), 'Flat')
assert.equal(activityPresentation({ activityAvailable: false, activitySampled: false, activityUnavailableReason: 'chat_sampling_not_connected' }).value, 'Unavailable')
assert.equal(activityPresentation({ activityAvailable: true, activitySampled: false }).value, 'Not sampled')
assert.equal(activityPresentation({ activityAvailable: true, activitySampled: true, activity: 0.42 }).value, '42.0%')
assert.equal(formatObservationDuration(0, false, 5), 'Less than 5m')
assert.equal(formatObservationDuration(75, false, 5), '1h 15m')
assert.equal(formatObservationDuration(120, true, 5), 'At least 2h')
assert.deepEqual(buildInspectorLinks('twitch', 'some_name'), {
  battleLines: '/twitch/battle-lines/?range=today&metric=viewers&stream=some_name',
  history: '/twitch/history/?period=7d&metric=viewer_minutes&sort=viewer_minutes&stream=some_name',
})

const read = (relativePath) => readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), 'utf8')
const boundary = read('../src/features/twitch-heatmap/selected-inspector.ts')
const inspector = read('../src/features/twitch-heatmap/selected-inspector-impl.ts')
const controller = read('../src/features/heatmap-page/selected-inspector-controller.ts')
const adapter = read('../src/features/heatmap-page/data-truth-adapter.ts')
const source = read('../src/features/heatmap-page/data-state-source.ts')
const endpoint = read('../functions/api/heatmap-stream-context.ts')

assert.ok(boundary.includes("export * from './selected-inspector-impl'"))
for (const fragment of [
  'Observed rank',
  'Observed share',
  'Momentum',
  'Activity',
  'Observed since',
  'Observed duration',
  'Latest observed peak',
  'Peak time',
  'Open in Battle Lines',
  'Review 7-day history',
  '/api/heatmap-stream-context',
  'Intl.DateTimeFormat().resolvedOptions().timeZone',
  'activityPresentation',
  'momentumDirection',
  'data-heatmap-legacy-selection-bridge',
  'heatmap-inspector-link',
  'heatmap-detail-link',
]) assert.ok(inspector.includes(fragment), `missing inspector fragment: ${fragment}`)

for (const fragment of [
  'installHeatmapSelectedInspector',
  'viewloom:heatmap-request-start',
  'viewloom:heatmap-response',
  'MutationObserver',
  'selectedLoginFromDom',
  'activityUnavailableReason',
]) assert.ok(controller.includes(fragment), `missing inspector controller fragment: ${fragment}`)

assert.ok(adapter.includes('installHeatmapSelectedInspector'))
assert.ok(source.includes("new CustomEvent('viewloom:heatmap-request-start'"))
assert.ok(source.includes("new CustomEvent('viewloom:heatmap-response'"))

for (const fragment of [
  'SNAPSHOT_LIMIT = 288',
  'contiguous-current-run',
  'observedSince',
  'observedDurationMinutes',
  'peakViewers',
  'peakAt',
  "provider = url.searchParams.get('provider')",
  'stream: requestedStream',
]) assert.ok(endpoint.includes(fragment), `missing stream-context fragment: ${fragment}`)

console.log('Heatmap selected-inspector verification passed.')
