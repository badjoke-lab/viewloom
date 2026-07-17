import assert from 'node:assert/strict'
import {
  assertReadOnlySql,
  canonicalJson,
  evaluateLatestSnapshot,
  evidenceDigest,
  inspectRequest,
} from './run-12a4-twitch-category-capture-canary-storage-preflight.mjs'
import {
  canaryBindingsAbsent,
  canaryBindingsFromSettings,
  projectTwitchStorage,
} from './run-12a4-twitch-category-capture-canary-execution.mjs'

const MB = 1024 * 1024
const contract = {
  acceptedInputs: {
    twitchPackagePr: 590,
    twitchPackageMergeSha: 'package-merge',
    twitchExecutionPr: 591,
    twitchExecutionMergeSha: 'execution-merge',
    executionAcceptancePr: 592,
    executionAcceptanceMergeSha: 'acceptance-merge',
  },
}
const request = {
  schemaVersion: 'viewloom-12a4-twitch-category-capture-canary-storage-preflight-request-v1',
  status: 'requested',
  provider: 'twitch',
  oneTime: true,
  confirmation: 'RUN_READ_ONLY_TWITCH_STORAGE_PREFLIGHT',
  trackingIssue: 519,
  acceptedPackagePr: 590,
  acceptedPackageMergeSha: 'package-merge',
  acceptedExecutionPr: 591,
  acceptedExecutionMergeSha: 'execution-merge',
  acceptedExecutionAcceptancePr: 592,
  acceptedExecutionAcceptanceMergeSha: 'acceptance-merge',
  readOnly: true,
  workerDeploymentAuthorized: false,
  d1MutationAuthorized: false,
  triggerCreationAuthorized: false,
  runtimeCaptureAuthorized: false,
}

assert.equal(inspectRequest(request, contract).ok, true)
assert.equal(inspectRequest(null, contract).ok, false)
assert.equal(inspectRequest({ ...request, provider: 'kick' }, contract).ok, false)
assert.equal(inspectRequest({ ...request, d1MutationAuthorized: true }, contract).ok, false)
assert.equal(inspectRequest({ ...request, acceptedExecutionMergeSha: 'wrong' }, contract).ok, false)

const acceptedStorage = projectTwitchStorage(390.38 * MB, 3716.59 * MB)
assert.equal(acceptedStorage.projectedNinetyDaySizeMb, 438.7)
assert.equal(acceptedStorage.projectedProviderHeadroomMb, 11.3)
assert.equal(acceptedStorage.projectedAccountWideSizeMb, 3764.91)
assert.equal(acceptedStorage.projectedAccountWideHeadroomMb, 843.09)
assert.equal(acceptedStorage.providerPass, true)
assert.equal(acceptedStorage.accountPass, true)
assert.equal(acceptedStorage.pass, true)

const providerFailure = projectTwitchStorage(395 * MB, 3716.59 * MB)
assert.equal(providerFailure.providerPass, false)
assert.equal(providerFailure.pass, false)

const accountFailure = projectTwitchStorage(390.38 * MB, 4100 * MB)
assert.equal(accountFailure.providerPass, true)
assert.equal(accountFailure.accountPass, false)
assert.equal(accountFailure.pass, false)

const normalBindings = canaryBindingsFromSettings({ result: { bindings: [] } })
assert.equal(canaryBindingsAbsent(normalBindings), true)

const temporaryCanaryBindings = canaryBindingsFromSettings({
  result: {
    bindings: [
      { type: 'plain_text', name: 'CATEGORY_CAPTURE_CANARY_ENABLED', text: 'true' },
      { type: 'plain_text', name: 'CATEGORY_CAPTURE_CANARY_PROVIDER', text: 'twitch' },
    ],
  },
})
assert.equal(canaryBindingsAbsent(temporaryCanaryBindings), false)

const permanentFlag = canaryBindingsFromSettings({
  result: {
    bindings: [
      { type: 'plain_text', name: 'CATEGORY_CAPTURE_ENABLED', text: 'true' },
    ],
  },
})
assert.equal(permanentFlag.categoryCaptureDirectFlagPresent, true)
assert.equal(canaryBindingsAbsent(permanentFlag), false)

assert.equal(assertReadOnlySql('SELECT 1; SELECT 2;'), 2)
assert.throws(() => assertReadOnlySql("UPDATE minute_snapshots SET source_mode = 'x';"), /readonly_sql_violation/)
assert.throws(() => assertReadOnlySql('DELETE FROM minute_snapshots;'), /readonly_sql_violation/)
assert.throws(() => assertReadOnlySql(''), /readonly_sql_empty/)

const ordered = { b: 2, a: { d: 4, c: 3 } }
const reordered = { a: { c: 3, d: 4 }, b: 2 }
assert.equal(canonicalJson(ordered), canonicalJson(reordered))
assert.equal(evidenceDigest(ordered), evidenceDigest(reordered))
assert.match(evidenceDigest(ordered), /^sha256:[a-f0-9]{64}$/)

const observedAt = new Date('2026-07-18T00:00:00.000Z')
const freshAuthenticated = evaluateLatestSnapshot({
  bucket_minute: '2026-07-17T23:55:00.000Z',
  collected_at: '2026-07-17T23:55:30.000Z',
  stream_count: 300,
  total_viewers: 123456,
  source_mode: 'authenticated',
}, observedAt)
assert.equal(freshAuthenticated.freshnessMinutes, 4.5)
assert.equal(freshAuthenticated.authenticated, true)
assert.equal(freshAuthenticated.nonempty, true)
assert.equal(freshAuthenticated.pass, true)

const freshReal = evaluateLatestSnapshot({
  bucket_minute: '2026-07-17T23:55:00.000Z',
  collected_at: '2026-07-17T23:55:00.000Z',
  stream_count: 300,
  total_viewers: 123456,
  source_mode: 'real',
}, observedAt)
assert.equal(freshReal.pass, true)

const stale = evaluateLatestSnapshot({
  bucket_minute: '2026-07-17T23:00:00.000Z',
  collected_at: '2026-07-17T23:00:00.000Z',
  stream_count: 300,
  total_viewers: 123456,
  source_mode: 'authenticated',
}, observedAt)
assert.equal(stale.pass, false)

const demo = evaluateLatestSnapshot({
  bucket_minute: '2026-07-17T23:55:00.000Z',
  collected_at: '2026-07-17T23:55:00.000Z',
  stream_count: 300,
  total_viewers: 123456,
  source_mode: 'demo',
}, observedAt)
assert.equal(demo.authenticated, false)
assert.equal(demo.pass, false)

const empty = evaluateLatestSnapshot({
  bucket_minute: '2026-07-17T23:55:00.000Z',
  collected_at: '2026-07-17T23:55:00.000Z',
  stream_count: 0,
  total_viewers: 0,
  source_mode: 'authenticated',
}, observedAt)
assert.equal(empty.nonempty, false)
assert.equal(empty.pass, false)

console.log(JSON.stringify({
  ok: true,
  exactRequestVerified: true,
  providerStorageGateVerified: true,
  accountStorageGateVerified: true,
  bindingsAbsenceVerified: true,
  permanentFlagRejected: true,
  readOnlySqlGuardVerified: true,
  evidenceDigestDeterministic: true,
  freshAuthenticatedSnapshotAccepted: true,
  staleDemoAndEmptySnapshotsRejected: true,
}, null, 2))
