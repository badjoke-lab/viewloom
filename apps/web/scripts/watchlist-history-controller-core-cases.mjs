import assert from 'node:assert/strict'
import {
  entry,
  kickHistoryPayload,
  twitchHistoryPayload,
} from './watchlist-history-fixtures.mjs'

export async function verifyHistoryControllerCore(controllerModule) {
  const oneEntry = [entry('alpha')]

  const emptyRequest = requestRecorder(twitchHistoryPayload())
  const emptyController = controllerModule.createWatchlistHistoryController({
    provider: 'twitch',
    request: emptyRequest.request,
  })
  const empty = await emptyController.load([], '7d')
  assert.equal(empty.source, 'skipped_empty')
  assert.equal(empty.requested, false)
  assert.equal(empty.snapshot, null)
  assert.deepEqual(empty.evidence, [])
  assert.equal(emptyRequest.calls.length, 0)

  const cachedRequest = periodRequestRecorder()
  const cachedController = controllerModule.createWatchlistHistoryController({
    provider: 'twitch',
    request: cachedRequest.request,
  })
  const first = await cachedController.load(oneEntry, '7d')
  assert.equal(first.source, 'network')
  assert.equal(first.requested, true)
  assert.equal(first.evidence[0].state, 'present_retained')
  assert.equal(cachedRequest.calls.length, 1)
  assert.equal(cachedRequest.calls[0].endpoint, '/api/history?period=7d&metric=viewer_minutes')
  assert.deepEqual(cachedRequest.calls[0].init, {
    headers: { accept: 'application/json' },
    cache: 'no-store',
  })

  const samePeriod = await cachedController.load([entry('missing'), entry('alpha')], '7d')
  assert.equal(samePeriod.source, 'cache')
  assert.equal(samePeriod.requested, false)
  assert.equal(cachedRequest.calls.length, 1)
  assert.deepEqual(samePeriod.evidence.map((item) => item.state), [
    'absent_usable',
    'present_retained',
  ])

  const changed = await cachedController.load(oneEntry, '30d')
  assert.equal(changed.source, 'network')
  assert.equal(changed.requested, true)
  assert.equal(cachedRequest.calls.length, 2)
  assert.equal(cachedRequest.calls[1].endpoint, '/api/history?period=30d&metric=viewer_minutes')
  assert.equal(cachedController.hasSnapshot('7d'), true)
  assert.equal(cachedController.hasSnapshot('30d'), true)

  const restored = await cachedController.load(oneEntry, '7d')
  assert.equal(restored.source, 'cache')
  assert.equal(restored.requested, false)
  assert.equal(cachedRequest.calls.length, 2)
  assert.equal(cachedController.getSnapshot('7d').period, '7d')
  assert.equal(cachedController.getSnapshot('30d').period, '30d')

  const localEvidence = cachedController.evidence([
    entry('daily_only'),
    entry('missing'),
  ], '7d')
  assert.deepEqual(localEvidence.map((item) => item.state), [
    'present_retained',
    'absent_usable',
  ])
  assert.equal(cachedRequest.calls.length, 2)

  const fiftyRequest = periodRequestRecorder()
  const fiftyController = controllerModule.createWatchlistHistoryController({
    provider: 'twitch',
    request: fiftyRequest.request,
  })
  await fiftyController.load(
    Array.from({ length: 50 }, (_, index) => entry(`channel_${index}`)),
    '7d',
  )
  assert.equal(fiftyRequest.calls.length, 1)

  const refreshRequest = periodRequestRecorder()
  const refreshController = controllerModule.createWatchlistHistoryController({
    provider: 'twitch',
    request: refreshRequest.request,
  })
  await refreshController.load(oneEntry, '7d')
  await refreshController.refresh(oneEntry, '7d')
  assert.equal(refreshRequest.calls.length, 2)

  const deferred = deferredRequest(twitchHistoryPayload())
  const concurrentController = controllerModule.createWatchlistHistoryController({
    provider: 'twitch',
    request: deferred.request,
  })
  const pendingOne = concurrentController.refresh(oneEntry, '7d')
  const pendingTwo = concurrentController.refresh([entry('daily_only')], '7d')
  assert.equal(deferred.calls.length, 1)
  deferred.resolve()
  const [resolvedOne, resolvedTwo] = await Promise.all([pendingOne, pendingTwo])
  assert.deepEqual(
    new Set([resolvedOne.source, resolvedTwo.source]),
    new Set(['network', 'in_flight']),
  )
  assert.equal(deferred.calls.length, 1)

  const kickRequest = requestRecorder(kickHistoryPayload('30d'))
  const kickController = controllerModule.createWatchlistHistoryController({
    provider: 'kick',
    request: kickRequest.request,
  })
  await kickController.load([entry('gamma')], '30d')
  assert.deepEqual(kickRequest.calls.map((item) => item.endpoint), [
    '/api/kick-history?period=30d&metric=viewer_minutes',
  ])
  assert.equal(kickRequest.calls.some((item) => item.endpoint === '/api/history'), false)
}

function periodRequestRecorder() {
  const calls = []
  return {
    calls,
    request: async (endpoint, init) => {
      calls.push({ endpoint, init })
      const payload = endpoint.includes('period=30d')
        ? twitchHistoryPayload('30d')
        : twitchHistoryPayload('7d')
      return response(payload)
    },
  }
}

export function requestRecorder(payload) {
  const calls = []
  return {
    calls,
    request: async (endpoint, init) => {
      calls.push({ endpoint, init })
      return response(payload)
    },
  }
}

export function deferredRequest(payload) {
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
