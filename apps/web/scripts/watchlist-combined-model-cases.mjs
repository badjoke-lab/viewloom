import assert from 'node:assert/strict'
import {
  entry,
  twitchHistoryPayload,
  twitchLatestPayload,
} from './watchlist-history-fixtures.mjs'

export function verifyCombinedModel(combinedModel, latestAdapter, latestModel, historyAdapter, historyModel) {
  const entries = [
    entry('alpha'),
    entry('latest_only'),
    entry('daily_only'),
    entry('missing'),
  ]
  const latestSnapshot = latestAdapter.normalizeTwitchHeatmapResponse(twitchLatestPayload())
  const historySnapshot = historyAdapter.normalizeTwitchHistoryResponse('7d', twitchHistoryPayload())
  const combined = combinedModel.combineWatchlistEvidence({
    provider: 'twitch',
    period: '7d',
    entries,
    latestEvidence: latestModel.latestEvidenceForEntries(latestSnapshot, entries),
    retainedEvidence: historyModel.retainedEvidenceForEntries(historySnapshot, entries),
    latestSnapshot,
    historySnapshot,
  })

  assert.equal(combined.provider, 'twitch')
  assert.equal(combined.period, '7d')
  assert.equal(combined.latestSnapshot.state, 'live')
  assert.equal(combined.historySnapshot.state, 'ready')
  assert.deepEqual(combined.entries.map((item) => item.stored.channelId), [
    'alpha',
    'latest_only',
    'daily_only',
    'missing',
  ])
  assert.deepEqual(combined.entries.map((item) => item.latest.state), [
    'present_fresh',
    'present_fresh',
    'absent_usable',
    'absent_usable',
  ])
  assert.deepEqual(combined.entries.map((item) => item.retained.state), [
    'present_retained',
    'absent_usable',
    'present_retained',
    'absent_usable',
  ])
  assert.equal(combined.entries[0].latest.item.viewers, 1200)
  assert.equal(combined.entries[0].retained.item.viewerMinutes, 100000)
  assert.equal(combined.entries[1].retained.item, null)
  assert.equal(combined.entries[2].latest.item, null)

  const partialPayload = twitchHistoryPayload()
  partialPayload.state = 'partial'
  partialPayload.coverage.state = 'partial'
  const partialSnapshot = historyAdapter.normalizeTwitchHistoryResponse('7d', partialPayload)
  const partialCombined = combinedModel.combineWatchlistEvidence({
    provider: 'twitch',
    period: '7d',
    entries: [entry('alpha'), entry('missing')],
    latestEvidence: latestModel.latestEvidenceForEntries(latestSnapshot, [entry('alpha'), entry('missing')]),
    retainedEvidence: historyModel.retainedEvidenceForEntries(partialSnapshot, [entry('alpha'), entry('missing')]),
    latestSnapshot,
    historySnapshot: partialSnapshot,
  })
  assert.equal(partialCombined.entries[0].latest.state, 'present_fresh')
  assert.equal(partialCombined.entries[0].retained.state, 'history_partial')
  assert.equal(partialCombined.entries[0].retained.item.viewerMinutes, 100000)
  assert.equal(partialCombined.entries[1].retained.state, 'history_partial')
  assert.equal(partialCombined.entries[1].retained.item, null)

  const fallback = combinedModel.combineWatchlistEvidence({
    provider: 'twitch',
    period: '30d',
    entries: [entry('ALPHA'), entry('alpha'), entry('bad id!')],
    latestEvidence: [],
    retainedEvidence: [],
    latestSnapshot: null,
    historySnapshot: null,
  })
  assert.equal(fallback.entries.length, 1)
  assert.equal(fallback.entries[0].stored.channelId, 'alpha')
  assert.equal(fallback.entries[0].latest.state, 'latest_unavailable')
  assert.equal(fallback.entries[0].retained.state, 'history_unavailable')
}
