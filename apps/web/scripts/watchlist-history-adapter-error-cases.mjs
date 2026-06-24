import assert from 'node:assert/strict'
import {
  kickHistoryPayload,
  twitchHistoryPayload,
} from './watchlist-history-fixtures.mjs'

export function verifyHistoryAdapterErrors(adapter) {
  const empty = adapter.normalizeKickHistoryResponse('7d', {
    source: 'real',
    state: 'empty',
    platform: 'kick',
    period: {
      from: '2026-06-18',
      to: '2026-06-24',
      label: 'Last 7 days',
      days: 7,
    },
    metric: 'viewer_minutes',
    topStreamers: [],
    daily: [],
    coverage: {
      state: 'missing',
      observedDays: 0,
      missingDays: 7,
    },
  })
  assert.equal(empty.state, 'empty')
  assert.equal(empty.usableForAbsence, false)
  assert.equal(empty.itemCount, 0)

  assert.equal(
    adapter.normalizeTwitchHistoryResponse('7d', null).errorCode,
    'unreadable-payload',
  )
  assert.equal(adapter.normalizeTwitchHistoryResponse('7d', {
    ...twitchHistoryPayload(),
    platform: 'kick',
  }).errorCode, 'provider-mismatch')
  assert.equal(adapter.normalizeTwitchHistoryResponse('7d', {
    ...twitchHistoryPayload(),
    metric: 'peak_viewers',
  }).errorCode, 'metric-mismatch')
  assert.equal(adapter.normalizeTwitchHistoryResponse('7d', {
    ...twitchHistoryPayload(),
    period: { ...twitchHistoryPayload().period, days: 30 },
  }).errorCode, 'period-mismatch')
  assert.equal(adapter.normalizeTwitchHistoryResponse('7d', {
    ...twitchHistoryPayload(),
    topStreamers: null,
  }).errorCode, 'unreadable-payload')
  assert.equal(adapter.normalizeTwitchHistoryResponse('7d', {
    ...twitchHistoryPayload(),
    daily: null,
  }).errorCode, 'unreadable-payload')
  assert.equal(adapter.normalizeTwitchHistoryResponse('7d', {
    ...twitchHistoryPayload(),
    topStreamers: [{ streamerId: 'bad id!' }],
    daily: [],
  }).errorCode, 'unreadable-payload')

  const unknownButObserved = twitchHistoryPayload()
  delete unknownButObserved.state
  unknownButObserved.coverage.state = 'good'
  assert.equal(
    adapter.normalizeTwitchHistoryResponse('7d', unknownButObserved).state,
    'ready',
  )

  const missingCoverage = twitchHistoryPayload()
  missingCoverage.state = 'fresh'
  missingCoverage.coverage.state = 'missing'
  missingCoverage.topStreamers = []
  missingCoverage.daily = [{
    day: '2026-06-24',
    coverageState: 'missing',
    topStreamers: [],
  }]
  assert.equal(
    adapter.normalizeTwitchHistoryResponse('7d', missingCoverage).state,
    'empty',
  )

  const kickMismatch = adapter.normalizeKickHistoryResponse('30d', {
    ...kickHistoryPayload('30d'),
    platform: 'twitch',
  })
  assert.equal(kickMismatch.errorCode, 'provider-mismatch')
}
