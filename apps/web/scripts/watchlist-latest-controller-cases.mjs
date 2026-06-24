import assert from 'node:assert/strict'
import { entry, kickPayload, twitchPayload } from './watchlist-latest-adapter-cases.mjs'

export async function verifyController(model, controllerModule) {
  const oneEntry = [entry('alpha')]

  const emptyRequest = requestRecorder(twitchPayload())
  const emptyController = controllerModule.createWatchlistLatestController({
    provider: 'twitch', request: emptyRequest.request,
  })
  const empty = await emptyController.load([])
  assert.equal(empty.source, 'skipped_empty')
  assert.equal(empty.requested, false)
  assert.equal(empty.snapshot, null)
  assert.deepEqual(empty.evidence, [])
  assert.equal(emptyRequest.calls.length, 0)

  const cachedRequest = requestRecorder(twitchPayload())
  const cachedController = controllerModule.createWatchlistLatestController({
    provider: 'twitch', request: cachedRequest.request,
  })
  const first = await cachedController.load(oneEntry)
  assert.equal(first.source, 'network')
  assert.equal(first.requested, true)
  assert.equal(first.evidence[0].state, 'present_fresh')
  assert.equal(cachedRequest.calls.length, 1)
  assert.equal(cachedRequest.calls[0].endpoint, '/api/twitch-heatmap')
  assert.deepEqual(cachedRequest.calls[0].init, {
    headers: { accept: 'application/json' }, cache: 'no-store',
  })

  const reordered = await cachedController.load([entry('missing'), entry('alpha')])
  assert.equal(reordered.source, 'cache')
  assert.equal(reordered.requested, false)
  assert.equal(cachedRequest.calls.length, 1)
  assert.deepEqual(reordered.evidence.map((item) => item.state), ['absent_usable', 'present_fresh'])

  const addedAfterLoad = await cachedController.load([entry('beta'), entry('alpha')])
  assert.equal(addedAfterLoad.source, 'cache')
  assert.equal(cachedRequest.calls.length, 1)
  assert.deepEqual(addedAfterLoad.evidence.map((item) => item.state), ['present_fresh', 'present_fresh'])
  assert.deepEqual(cachedController.evidence([entry('missing')]), [
    { channelId: 'missing', state: 'absent_usable', item: null },
  ])
  assert.equal(cachedController.getSnapshot().provider, 'twitch')

  const fiftyRequest = requestRecorder(twitchPayload())
  const fiftyController = controllerModule.createWatchlistLatestController({
    provider: 'twitch', request: fiftyRequest.request,
  })
  await fiftyController.load(Array.from({ length: 50 }, (_, index) => entry(`channel_${index}`)))
  assert.equal(fiftyRequest.calls.length, 1)

  const kickRequest = requestRecorder(kickPayload('live'))
  const kickController = controllerModule.createWatchlistLatestController({
    provider: 'kick', request: kickRequest.request,
  })
  await kickController.load([entry('gamma')])
  assert.deepEqual(kickRequest.calls.map((item) => item.endpoint), ['/api/kick-heatmap'])
  assert.equal(kickRequest.calls.some((item) => item.endpoint.includes('twitch')), false)
  assert.equal(cachedRequest.calls.some((item) => item.endpoint.includes('kick')), false)

  const deferred = deferredRequest(twitchPayload())
  const concurrentController = controllerModule.createWatchlistLatestController({
    provider: 'twitch', request: deferred.request,
  })
  const pendingOne = concurrentController.refresh(oneEntry)
  const pendingTwo = concurrentController.refresh([entry('beta')])
  assert.equal(deferred.calls.length, 1)
  deferred.resolve()
  const [resolvedOne, resolvedTwo] = await Promise.all([pendingOne, pendingTwo])
  assert.deepEqual(new Set([resolvedOne.source, resolvedTwo.source]), new Set(['network', 'in_flight']))
  assert.equal(deferred.calls.length, 1)

  const refreshRequest = requestRecorder(twitchPayload())
  const refreshController = controllerModule.createWatchlistLatestController({
    provider: 'twitch', request: refreshRequest.request,
  })
  await refreshController.load(oneEntry)
  await refreshController.refresh(oneEntry)
  assert.equal(refreshRequest.calls.length, 2)

  const originalEntries = [entry('alpha')]
  const originalCopy = JSON.parse(JSON.stringify(originalEntries))
  let failures = 0
  const failureController = controllerModule.createWatchlistLatestController({
    provider: 'twitch',
    request: async () => {
      failures += 1
      throw new Error('request failed')
    },
  })
  const failed = await failureController.load(originalEntries)
  assert.equal(failed.snapshot.state, 'error')
  assert.equal(failed.snapshot.errorCode, 'request-failed')
  assert.equal(failed.evidence[0].state, 'latest_unavailable')
  assert.deepEqual(originalEntries, originalCopy)
  await failureController.load(originalEntries)
  assert.equal(failures, 1)
  await failureController.refresh(originalEntries)
  assert.equal(failures, 2)

  let httpJsonCalls = 0
  const httpController = controllerModule.createWatchlistLatestController({
    provider: 'kick',
    request: async () => ({
      ok: false,
      status: 503,
      async json() {
        httpJsonCalls += 1
        return {}
      },
    }),
  })
  const httpFailure = await httpController.load([entry('gamma')])
  assert.equal(httpFailure.snapshot.errorCode, 'http-error')
  assert.equal(httpFailure.snapshot.httpStatus, 503)
  assert.equal(httpJsonCalls, 0)

  const jsonController = controllerModule.createWatchlistLatestController({
    provider: 'kick',
    request: async () => ({
      ok: true,
      status: 200,
      async json() { throw new Error('bad json') },
    }),
  })
  const jsonFailure = await jsonController.load([entry('gamma')])
  assert.equal(jsonFailure.snapshot.errorCode, 'json-error')
  assert.equal(jsonFailure.snapshot.httpStatus, 200)

  const mismatchController = controllerModule.createWatchlistLatestController({
    provider: 'twitch', request: requestRecorder(kickPayload('live')).request,
  })
  const mismatch = await mismatchController.load([entry('gamma')])
  assert.equal(mismatch.snapshot.errorCode, 'provider-mismatch')
  assert.equal(mismatch.evidence[0].state, 'latest_unavailable')
  assert.equal(model.normalizeStoredChannelId('channel_49'), 'channel_49')
}

function requestRecorder(payload) {
  const calls = []
  return {
    calls,
    request: async (endpoint, init) => {
      calls.push({ endpoint, init })
      return {
        ok: true,
        status: 200,
        async json() { return JSON.parse(JSON.stringify(payload)) },
      }
    },
  }
}

function deferredRequest(payload) {
  const calls = []
  let release = () => {}
  const gate = new Promise((resolve) => { release = resolve })
  return {
    calls,
    resolve() { release() },
    request: async (endpoint, init) => {
      calls.push({ endpoint, init })
      await gate
      return {
        ok: true,
        status: 200,
        async json() { return JSON.parse(JSON.stringify(payload)) },
      }
    },
  }
}
