import assert from 'node:assert/strict'
import {
  entry,
  twitchHistoryPayload,
  twitchLatestPayload,
} from './watchlist-history-fixtures.mjs'

export async function verifyCombinedControllerErrors(controllerModule) {
  const latestFailure = controllerModule.createWatchlistCombinedController({
    provider: 'twitch',
    latestRequest: async () => { throw new Error('latest failed') },
    historyRequest: async () => response(twitchHistoryPayload()),
  })
  const latestFailed = await latestFailure.initialLoad([entry('alpha')], '7d')
  assert.equal(latestFailed.evidence.entries[0].latest.state, 'latest_unavailable')
  assert.equal(latestFailed.evidence.entries[0].retained.state, 'present_retained')
  assert.equal(latestFailed.evidence.entries[0].retained.item.viewerMinutes, 100000)

  const historyFailure = controllerModule.createWatchlistCombinedController({
    provider: 'twitch',
    latestRequest: async () => response(twitchLatestPayload()),
    historyRequest: async () => { throw new Error('history failed') },
  })
  const historyFailed = await historyFailure.initialLoad([entry('alpha')], '7d')
  assert.equal(historyFailed.evidence.entries[0].latest.state, 'present_fresh')
  assert.equal(historyFailed.evidence.entries[0].latest.item.viewers, 1200)
  assert.equal(historyFailed.evidence.entries[0].retained.state, 'history_unavailable')

  const latestDeferred = deferredResponse(twitchLatestPayload())
  const historyDeferred = deferredResponse(twitchHistoryPayload())
  const concurrent = controllerModule.createWatchlistCombinedController({
    provider: 'twitch',
    latestRequest: latestDeferred.request,
    historyRequest: historyDeferred.request,
  })
  const first = concurrent.refresh([entry('alpha')], '7d')
  const second = concurrent.refresh([entry('daily_only')], '7d')
  assert.equal(latestDeferred.calls.length, 1)
  assert.equal(historyDeferred.calls.length, 1)
  latestDeferred.resolve()
  historyDeferred.resolve()
  const [firstResult, secondResult] = await Promise.all([first, second])
  assert.deepEqual(
    new Set([firstResult.latestSource, secondResult.latestSource]),
    new Set(['network', 'in_flight']),
  )
  assert.deepEqual(
    new Set([firstResult.historySource, secondResult.historySource]),
    new Set(['network', 'in_flight']),
  )
  assert.equal(latestDeferred.calls.length, 1)
  assert.equal(historyDeferred.calls.length, 1)

  const noInitialLatest = async () => response(twitchLatestPayload())
  const periodOnlyCalls = []
  const periodOnly = controllerModule.createWatchlistCombinedController({
    provider: 'twitch',
    latestRequest: noInitialLatest,
    historyRequest: async (endpoint, init) => {
      periodOnlyCalls.push({ endpoint, init })
      return response(twitchHistoryPayload('30d'))
    },
  })
  const periodChangedFirst = await periodOnly.changePeriod([entry('alpha')], '30d')
  assert.equal(periodChangedFirst.latestRequested, false)
  assert.equal(periodChangedFirst.latestSource, 'memory_only')
  assert.equal(periodChangedFirst.historyRequested, true)
  assert.equal(periodChangedFirst.evidence.entries[0].latest.state, 'latest_unavailable')
  assert.equal(periodChangedFirst.evidence.entries[0].retained.state, 'present_retained')
  assert.equal(periodOnlyCalls.length, 1)
}

function deferredResponse(payload) {
  const calls = []
  let release = () => {}
  const gate = new Promise((resolve) => { release = resolve })
  return {
    calls,
    resolve() { release() },
    request: async (endpoint, init) => {
      calls.push({ endpoint, init })
      await gate
      return response(payload)
    },
  }
}

function response(payload) {
  return {
    ok: true,
    status: 200,
    async json() {
      return JSON.parse(JSON.stringify(payload))
    },
  }
}
