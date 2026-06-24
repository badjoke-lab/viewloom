import assert from 'node:assert/strict'
import {
  entry,
  kickHistoryPayload,
  twitchHistoryPayload,
} from './watchlist-history-fixtures.mjs'

export async function verifyHistoryControllerErrors(controllerModule) {
  const entries = [entry('alpha')]
  const original = JSON.parse(JSON.stringify(entries))
  let failures = 0

  const failureController = controllerModule.createWatchlistHistoryController({
    provider: 'twitch',
    request: async () => {
      failures += 1
      throw new Error('history unavailable')
    },
  })
  const failed = await failureController.load(entries, '7d')
  assert.equal(failed.snapshot.state, 'error')
  assert.equal(failed.snapshot.errorCode, 'request-failed')
  assert.equal(failed.evidence[0].state, 'history_unavailable')
  assert.deepEqual(entries, original)
  await failureController.load(entries, '7d')
  assert.equal(failures, 1)
  await failureController.refresh(entries, '7d')
  assert.equal(failures, 2)

  let httpJsonCalls = 0
  const httpController = controllerModule.createWatchlistHistoryController({
    provider: 'kick',
    request: async () => ({
      ok: false,
      status: 503,
      async json() {
        httpJsonCalls += 1
        return kickHistoryPayload()
      },
    }),
  })
  const httpFailure = await httpController.load([entry('gamma')], '7d')
  assert.equal(httpFailure.snapshot.errorCode, 'http-error')
  assert.equal(httpFailure.snapshot.httpStatus, 503)
  assert.equal(httpJsonCalls, 0)

  const jsonController = controllerModule.createWatchlistHistoryController({
    provider: 'kick',
    request: async () => ({
      ok: true,
      status: 200,
      async json() {
        throw new Error('bad json')
      },
    }),
  })
  const jsonFailure = await jsonController.load([entry('gamma')], '7d')
  assert.equal(jsonFailure.snapshot.errorCode, 'json-error')
  assert.equal(jsonFailure.snapshot.httpStatus, 200)

  const providerMismatch = controllerModule.createWatchlistHistoryController({
    provider: 'twitch',
    request: async () => ({
      ok: true,
      status: 200,
      async json() {
        return kickHistoryPayload()
      },
    }),
  })
  const mismatch = await providerMismatch.load(entries, '7d')
  assert.equal(mismatch.snapshot.errorCode, 'provider-mismatch')
  assert.equal(mismatch.evidence[0].state, 'history_unavailable')

  const periodMismatch = controllerModule.createWatchlistHistoryController({
    provider: 'twitch',
    request: async () => ({
      ok: true,
      status: 200,
      async json() {
        return twitchHistoryPayload('30d')
      },
    }),
  })
  const wrongPeriod = await periodMismatch.load(entries, '7d')
  assert.equal(wrongPeriod.snapshot.errorCode, 'period-mismatch')
  assert.equal(wrongPeriod.evidence[0].state, 'history_unavailable')
}
