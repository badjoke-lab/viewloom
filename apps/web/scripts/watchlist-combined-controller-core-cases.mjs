import assert from 'node:assert/strict'
import {
  entry,
  twitchHistoryPayload,
  twitchLatestPayload,
} from './watchlist-history-fixtures.mjs'

export async function verifyCombinedControllerCore(controllerModule) {
  const latest = latestRecorder()
  const history = historyRecorder()
  const controller = controllerModule.createWatchlistCombinedController({
    provider: 'twitch',
    latestRequest: latest.request,
    historyRequest: history.request,
  })

  const empty = await controller.initialLoad([], '7d')
  assert.equal(empty.latestRequested, false)
  assert.equal(empty.historyRequested, false)
  assert.equal(latest.calls.length, 0)
  assert.equal(history.calls.length, 0)
  assert.deepEqual(empty.evidence.entries, [])

  const entries = [entry('alpha'), entry('latest_only'), entry('daily_only'), entry('missing')]
  const initial = await controller.initialLoad(entries, '7d')
  assert.equal(initial.action, 'initial_load')
  assert.equal(initial.latestRequested, true)
  assert.equal(initial.historyRequested, true)
  assert.equal(latest.calls.length, 1)
  assert.equal(history.calls.length, 1)
  assert.deepEqual(initial.evidence.entries.map((item) => item.latest.state), [
    'present_fresh', 'present_fresh', 'absent_usable', 'absent_usable',
  ])
  assert.deepEqual(initial.evidence.entries.map((item) => item.retained.state), [
    'present_retained', 'absent_usable', 'present_retained', 'absent_usable',
  ])

  const changed = await controller.changePeriod(entries, '30d')
  assert.equal(changed.action, 'period_change')
  assert.equal(changed.latestRequested, false)
  assert.equal(changed.historyRequested, true)
  assert.equal(latest.calls.length, 1)
  assert.equal(history.calls.length, 2)
  assert.equal(changed.evidence.period, '30d')

  const restored = await controller.changePeriod(entries, '7d')
  assert.equal(restored.latestRequested, false)
  assert.equal(restored.historyRequested, false)
  assert.equal(restored.historySource, 'cache')
  assert.equal(latest.calls.length, 1)
  assert.equal(history.calls.length, 2)

  const taskLocal = controller.taskLocal([
    entry('daily_only'),
    entry('alpha'),
    entry('latest_only'),
  ], '7d')
  assert.equal(taskLocal.action, 'task_local')
  assert.equal(taskLocal.latestRequested, false)
  assert.equal(taskLocal.historyRequested, false)
  assert.equal(latest.calls.length, 1)
  assert.equal(history.calls.length, 2)
  assert.deepEqual(taskLocal.evidence.entries.map((item) => item.stored.channelId), [
    'daily_only', 'alpha', 'latest_only',
  ])
  assert.equal(taskLocal.evidence.entries[0].retained.state, 'present_retained')
  assert.equal(taskLocal.evidence.entries[0].latest.state, 'absent_usable')
  assert.equal(taskLocal.evidence.entries[2].latest.state, 'present_fresh')

  const refreshed = await controller.refresh(entries, '7d')
  assert.equal(refreshed.action, 'refresh')
  assert.equal(refreshed.latestRequested, true)
  assert.equal(refreshed.historyRequested, true)
  assert.equal(latest.calls.length, 2)
  assert.equal(history.calls.length, 3)

  const oneLatest = latestRecorder()
  const oneHistory = historyRecorder()
  const oneController = controllerModule.createWatchlistCombinedController({
    provider: 'twitch',
    latestRequest: oneLatest.request,
    historyRequest: oneHistory.request,
  })
  await oneController.initialLoad([entry('alpha')], '7d')
  assert.equal(oneLatest.calls.length, 1)
  assert.equal(oneHistory.calls.length, 1)

  const fiftyLatest = latestRecorder()
  const fiftyHistory = historyRecorder()
  const fiftyController = controllerModule.createWatchlistCombinedController({
    provider: 'twitch',
    latestRequest: fiftyLatest.request,
    historyRequest: fiftyHistory.request,
  })
  await fiftyController.initialLoad(
    Array.from({ length: 50 }, (_, index) => entry(`channel_${index}`)),
    '7d',
  )
  assert.equal(fiftyLatest.calls.length, 1)
  assert.equal(fiftyHistory.calls.length, 1)
}

export function latestRecorder() {
  const calls = []
  return {
    calls,
    request: async (endpoint, init) => {
      calls.push({ endpoint, init })
      return response(twitchLatestPayload())
    },
  }
}

export function historyRecorder() {
  const calls = []
  return {
    calls,
    request: async (endpoint, init) => {
      calls.push({ endpoint, init })
      return response(endpoint.includes('period=30d')
        ? twitchHistoryPayload('30d')
        : twitchHistoryPayload('7d'))
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
