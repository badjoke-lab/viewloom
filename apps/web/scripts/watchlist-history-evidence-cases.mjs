import assert from 'node:assert/strict'
import {
  entry,
  twitchHistoryPayload,
} from './watchlist-history-fixtures.mjs'

export function verifyRetainedEvidence(model, historyModel, adapter) {
  const entries = [entry('alpha'), entry('daily_only'), entry('missing')]
  const ready = historyModel.retainedEvidenceForEntries(
    adapter.normalizeTwitchHistoryResponse('7d', twitchHistoryPayload()),
    entries,
  )
  assert.deepEqual(ready.map((item) => item.state), [
    'present_retained',
    'present_retained',
    'absent_usable',
  ])
  assert.equal(ready[0].item.dailyAppearanceCount, 2)
  assert.equal(ready[1].item.topSummaryPresent, false)
  assert.equal(ready[2].item, null)

  const partialPayload = twitchHistoryPayload()
  partialPayload.state = 'partial'
  partialPayload.coverage.state = 'partial'
  const partial = historyModel.retainedEvidenceForEntries(
    adapter.normalizeTwitchHistoryResponse('7d', partialPayload),
    entries,
  )
  assert.deepEqual(partial.map((item) => item.state), [
    'history_partial',
    'history_partial',
    'history_partial',
  ])
  assert.equal(partial[0].item.viewerMinutes, 100000)
  assert.equal(partial[2].item, null)

  const emptyPayload = twitchHistoryPayload()
  emptyPayload.state = 'empty'
  emptyPayload.topStreamers = []
  emptyPayload.daily = []
  emptyPayload.coverage.state = 'missing'
  const unavailable = historyModel.retainedEvidenceForEntries(
    adapter.normalizeTwitchHistoryResponse('7d', emptyPayload),
    entries,
  )
  assert.deepEqual(unavailable.map((item) => item.state), [
    'history_unavailable',
    'history_unavailable',
    'history_unavailable',
  ])
  assert.equal(unavailable.every((item) => item.item === null), true)

  assert.deepEqual(historyModel.unavailableRetainedEvidence(entries), [
    { channelId: 'alpha', state: 'history_unavailable', item: null },
    { channelId: 'daily_only', state: 'history_unavailable', item: null },
    { channelId: 'missing', state: 'history_unavailable', item: null },
  ])
  assert.equal(
    historyModel.watchlistHistoryEndpoint('twitch', '30d'),
    '/api/history?period=30d&metric=viewer_minutes',
  )
  assert.equal(
    historyModel.watchlistHistoryEndpoint('kick', '7d'),
    '/api/kick-history?period=7d&metric=viewer_minutes',
  )
  assert.deepEqual(historyModel.validHistoryEntryIds([
    entry('Alpha'),
    entry('alpha'),
    entry('bad id!'),
    entry('beta'),
  ]), ['alpha', 'beta'])
  assert.equal(model.normalizeStoredChannelId('DAILY_ONLY'), 'daily_only')
}
