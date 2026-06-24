import assert from 'node:assert/strict'
import {
  kickHistoryPayload,
  ranked,
  twitchHistoryPayload,
} from './watchlist-history-fixtures.mjs'

export function verifyHistoryAdapterCore(adapter) {
  const ready = adapter.normalizeTwitchHistoryResponse('7d', twitchHistoryPayload())
  assert.equal(ready.schema, 'viewloom-watchlist-history-v1')
  assert.equal(ready.provider, 'twitch')
  assert.equal(ready.period, '7d')
  assert.equal(ready.endpoint, '/api/history?period=7d&metric=viewer_minutes')
  assert.equal(ready.state, 'ready')
  assert.equal(ready.usableForAbsence, true)
  assert.equal(ready.source, 'real')
  assert.equal(ready.metric, 'viewer_minutes')
  assert.equal(ready.requestedFrom, '2026-06-18')
  assert.equal(ready.requestedTo, '2026-06-24')
  assert.equal(ready.periodLabel, 'Last 7 days')
  assert.equal(ready.coverageState, 'good')
  assert.equal(ready.coverageNote, 'Seven observed days.')
  assert.equal(ready.observedDays, 7)
  assert.equal(ready.missingDays, 0)
  assert.equal(ready.partialDays, 0)
  assert.equal(ready.inProgressDays, 0)
  assert.deepEqual([...ready.retainedById.keys()], ['alpha', 'top_only', 'daily_only'])

  assert.deepEqual(ready.retainedById.get('alpha'), {
    channelId: 'alpha',
    displayName: 'Alpha',
    viewerMinutes: 100000,
    peakViewers: 1500,
    averageViewers: 714,
    observedMinutes: 140,
    rankByViewerMinutes: 1,
    rankByPeak: 1,
    dailyAppearanceCount: 2,
    mostRecentAppearance: '2026-06-24',
    topSummaryPresent: true,
    dailyAppearancePresent: true,
  })

  const dailyOnly = ready.retainedById.get('daily_only')
  assert.equal(dailyOnly.topSummaryPresent, false)
  assert.equal(dailyOnly.dailyAppearancePresent, true)
  assert.equal(dailyOnly.dailyAppearanceCount, 1)
  assert.equal(dailyOnly.mostRecentAppearance, '2026-06-23')
  assert.equal(dailyOnly.viewerMinutes, 4500)
  assert.equal(dailyOnly.rankByViewerMinutes, 5)

  const topOnly = ready.retainedById.get('top_only')
  assert.equal(topOnly.topSummaryPresent, true)
  assert.equal(topOnly.dailyAppearancePresent, false)
  assert.equal(topOnly.dailyAppearanceCount, 0)
  assert.equal(topOnly.mostRecentAppearance, null)

  const alphaAppearances = ready.dailyAppearancesById.get('alpha')
  assert.deepEqual(alphaAppearances.map((item) => item.day), ['2026-06-24', '2026-06-23'])
  assert.equal(alphaAppearances[0].viewerMinutes, 18000)

  const partialPayload = twitchHistoryPayload()
  partialPayload.state = 'partial'
  partialPayload.coverage.state = 'partial'
  partialPayload.coverage.partialDays = 1
  partialPayload.coverage.notes = ['One partial day.']
  const partial = adapter.normalizeTwitchHistoryResponse('7d', partialPayload)
  assert.equal(partial.state, 'partial')
  assert.equal(partial.usableForAbsence, false)
  assert.equal(partial.retainedById.get('alpha').viewerMinutes, 100000)

  const demoPayload = kickHistoryPayload()
  demoPayload.state = 'demo'
  demoPayload.source = 'demo'
  demoPayload.coverage.state = 'demo'
  demoPayload.coverage.notes = ['Demo coverage only.']
  const demo = adapter.normalizeKickHistoryResponse('7d', demoPayload)
  assert.equal(demo.state, 'partial')
  assert.equal(demo.source, 'demo')
  assert.equal(demo.usableForAbsence, false)

  const kick = adapter.normalizeKickHistoryResponse('30d', kickHistoryPayload('30d'))
  assert.equal(kick.provider, 'kick')
  assert.equal(kick.endpoint, '/api/kick-history?period=30d&metric=viewer_minutes')
  assert.equal(kick.state, 'ready')
  assert.equal(kick.retainedById.get('gamma').displayName, 'Gamma')

  const missingValues = adapter.normalizeTwitchHistoryResponse('7d', {
    ...twitchHistoryPayload(),
    topStreamers: [{ streamerId: 'missing_values', displayName: 'Missing Values' }],
    daily: [],
  })
  const missing = missingValues.retainedById.get('missing_values')
  assert.equal(missing.viewerMinutes, null)
  assert.equal(missing.peakViewers, null)
  assert.equal(missing.averageViewers, null)
  assert.equal(missing.observedMinutes, null)
  assert.equal(missing.rankByViewerMinutes, null)
  assert.equal(missing.rankByPeak, null)

  const duplicates = adapter.normalizeTwitchHistoryResponse('7d', {
    ...twitchHistoryPayload(),
    topStreamers: [
      ranked('same_id', 'First', 10, 1),
      ranked('same_id', 'Second', 999, 2),
    ],
    daily: [{
      day: '2026-06-24',
      coverageState: 'good',
      topStreamers: [
        ranked('same_id', 'Daily First', 5, 1),
        ranked('same_id', 'Daily Second', 500, 2),
      ],
    }],
  })
  assert.equal(duplicates.retainedById.get('same_id').displayName, 'First')
  assert.equal(duplicates.retainedById.get('same_id').viewerMinutes, 10)
  assert.equal(duplicates.dailyAppearancesById.get('same_id').length, 1)
  assert.equal(duplicates.dailyAppearancesById.get('same_id')[0].viewerMinutes, 5)
}
