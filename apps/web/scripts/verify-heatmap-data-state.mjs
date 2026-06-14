import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import {
  createHeatmapErrorTruth,
  createHeatmapLoadingTruth,
  normalizeHeatmapDataTruth,
} from '../src/features/heatmap-page/data-state-core.mjs'

const now = Date.parse('2026-06-14T13:40:00.000Z')

const fresh = normalizeHeatmapDataTruth({
  ok: true,
  latest: {
    collected_at: '2026-06-14T13:38:00.000Z',
    stream_count: 2,
    covered_pages: 3,
    has_more: 0,
    source_mode: 'real',
    payload_json: JSON.stringify({
      items: [
        { channelLogin: 'alpha', viewers: 1000, activity: 0.12 },
        { channelLogin: 'beta', viewers: 500, activity: 0 },
      ],
    }),
  },
  status: { status: 'idle' },
}, 'twitch', now)
assert.equal(fresh.state, 'fresh')
assert.equal(fresh.sourceMode, 'real')
assert.equal(fresh.observedRecords, 2)
assert.equal(fresh.activity.state, 'available')
assert.equal(fresh.activityByLogin.beta.state, 'zero')
assert.equal(fresh.collectionMethod, 'Authenticated API')

const limited = normalizeHeatmapDataTruth({
  latest: {
    collected_at: '2026-06-14T13:38:00.000Z',
    stream_count: 100,
    covered_pages: 5,
    has_more: 1,
    source_mode: 'real',
    payload_json: JSON.stringify({ items: [{ channelLogin: 'kick-one', viewers: 100, activity: 0.02 }] }),
  },
}, 'kick', now)
assert.equal(limited.state, 'partial')
assert.equal(limited.coverageState, 'partial')
assert.equal(limited.configuredLimit, 100)
assert.equal(limited.collectionMethod, 'Public listing')

const unavailableActivity = normalizeHeatmapDataTruth({
  state: 'fresh',
  sourceMode: 'real',
  updatedAt: '2026-06-14T13:38:00.000Z',
  items: [{ channelLogin: 'missing-chat', viewers: 100 }],
}, 'twitch', now)
assert.equal(unavailableActivity.state, 'partial')
assert.equal(unavailableActivity.activity.state, 'unavailable')
assert.equal(unavailableActivity.activityByLogin['missing-chat'].state, 'unavailable')

const notSampled = normalizeHeatmapDataTruth({
  sourceMode: 'real',
  updatedAt: '2026-06-14T13:38:00.000Z',
  items: [{ channelLogin: 'not-sampled', viewers: 100, activitySampled: false }],
}, 'twitch', now)
assert.equal(notSampled.activity.state, 'not_sampled')
assert.equal(notSampled.state, 'partial')

const stale = normalizeHeatmapDataTruth({
  sourceMode: 'real',
  updatedAt: '2026-06-14T13:15:00.000Z',
  items: [{ channelLogin: 'old', viewers: 100, activity: 0.1 }],
}, 'twitch', now)
assert.equal(stale.state, 'stale')
assert.equal(stale.isStrongStale, false)
assert.ok(stale.snapshotAgeMinutes >= 25)

const strongStale = normalizeHeatmapDataTruth({
  sourceMode: 'real',
  updatedAt: '2026-06-14T13:00:00.000Z',
  items: [{ channelLogin: 'very-old', viewers: 100, activity: 0.1 }],
}, 'twitch', now)
assert.equal(strongStale.state, 'stale')
assert.equal(strongStale.isStrongStale, true)

const empty = normalizeHeatmapDataTruth({
  ok: true,
  latest: {
    collected_at: '2026-06-14T13:38:00.000Z',
    stream_count: 0,
    covered_pages: 1,
    has_more: 0,
    source_mode: 'real',
    payload_json: JSON.stringify({ items: [] }),
  },
}, 'twitch', now)
assert.equal(empty.state, 'empty')
assert.equal(empty.sourceMode, 'real')

const demo = normalizeHeatmapDataTruth({
  sourceMode: 'demo',
  updatedAt: '2026-06-14T13:38:00.000Z',
  items: [{ channelLogin: 'demo', viewers: 100, activity: 0.1 }],
}, 'kick', now)
assert.equal(demo.state, 'demo')
assert.equal(demo.sourceLabel, 'Demo')

const uncertain = normalizeHeatmapDataTruth({
  updatedAt: '2026-06-14T13:38:00.000Z',
  items: [{ channelLogin: 'unknown-source', viewers: 100, activity: 0.1 }],
}, 'twitch', now)
assert.equal(uncertain.state, 'partial')
assert.equal(uncertain.sourceMode, 'unknown')

const error = normalizeHeatmapDataTruth({ ok: false, state: 'error', latest: null }, 'twitch', now)
assert.equal(error.state, 'error')
assert.equal(createHeatmapLoadingTruth('twitch').state, 'loading')
assert.equal(createHeatmapErrorTruth('kick', 'network').state, 'error')

const adapterSource = readFileSync(fileURLToPath(new URL('../src/features/heatmap-page/data-truth-adapter.ts', import.meta.url)), 'utf8')
assert.match(adapterSource, /installHeatmapResponseObserver/)
assert.match(adapterSource, /renderHeatmapDataTruth/)

const sourceObserver = readFileSync(fileURLToPath(new URL('../src/features/heatmap-page/data-state-source.ts', import.meta.url)), 'utf8')
assert.match(sourceObserver, /response\.clone\(\)/)
assert.match(sourceObserver, /normalizeHeatmapDataTruth/)
assert.match(sourceObserver, /window\.fetch = observedFetch/)

const domSource = readFileSync(fileURLToPath(new URL('../src/features/heatmap-page/data-state-dom.ts', import.meta.url)), 'utf8')
for (const fragment of [
  "data-heatmap-state='fresh'",
  "data-heatmap-state='partial'",
  "data-heatmap-state='stale'",
  "data-heatmap-state='error'",
  'Sampled zero',
  'Unavailable',
  'Not sampled',
  'Collection method',
]) assert.ok(domSource.includes(fragment), `missing DOM truth fragment: ${fragment}`)

const runtimeSource = readFileSync(fileURLToPath(new URL('../src/features/heatmap-page/runtime.ts', import.meta.url)), 'utf8')
assert.match(runtimeSource, /destroyRequested/)
assert.doesNotMatch(runtimeSource, /state !== 'destroyed'/)

console.log('Heatmap data-state truth verification passed.')
