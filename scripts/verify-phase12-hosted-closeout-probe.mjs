import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const path = process.argv[2] || 'artifacts/phase12-hosted-closeout/phase12-hosted-closeout-probe.json'
const evidence = JSON.parse(readFileSync(path, 'utf8'))
const expectedSha = '32c27a9a772cb62ff38f009c5fd1bb095ac27ad8'

assert.equal(evidence.schema, 'viewloom-phase12-hosted-closeout-probe-v1')
assert.equal(evidence.phase, 'Phase 12')
assert.equal(evidence.result, 'pass')
assert.equal(evidence.targetMainSha, expectedSha)
assert.equal(evidence.deployedSha, expectedSha)

assert.ok(Number.isInteger(evidence.productionSmoke?.workflowRunId))
assert.ok(evidence.productionSmoke.workflowRunId > 0)
assert.ok(Number.isInteger(evidence.productionSmoke?.artifactId))
assert.ok(evidence.productionSmoke.artifactId > 0)
assert.match(evidence.productionSmoke?.artifactDigest ?? '', /^sha256:[a-f0-9]{64}$/)
assert.ok(evidence.productionSmoke?.checkedAt)

assert.equal(evidence.publicRoutesChecked, 25)
assert.equal(evidence.providerStatusApisChecked, 2)
assert.equal(evidence.providerCrossingFailures, 0)
assert.equal(evidence.explicit404Failures, 0)
assert.equal(evidence.providersSeparate, true)

assert.equal(evidence.twitch?.binding, 'DB_TWITCH_HOT')
assert.equal(evidence.twitch?.database, 'vl_twitch_hot')
assert.equal(evidence.twitch?.sourceMode, 'real')
assert.equal(evidence.twitch?.collectorState, 'ok')
assert.equal(evidence.twitch?.stale, false)
assert.ok(Number.isFinite(evidence.twitch?.observedCount))
assert.ok(Number.isFinite(evidence.twitch?.topLimit))
assert.ok(['within-window', 'near-window-limit', 'at-or-over-window'].includes(evidence.twitch?.capacityState))

assert.equal(evidence.kick?.binding, 'DB_KICK_HOT')
assert.equal(evidence.kick?.database, 'vl_kick_hot')
assert.equal(evidence.kick?.sourceMode, 'authenticated')
assert.equal(evidence.kick?.collectorState, 'snapshot_available')
assert.equal(evidence.kick?.fresh, true)
assert.equal(evidence.kick?.stale, false)
assert.ok(Number.isFinite(evidence.kick?.observedCount))
assert.ok(Number.isFinite(evidence.kick?.topLimit))
assert.ok(['within-window', 'near-window-limit', 'at-or-over-window'].includes(evidence.kick?.capacityState))

assert.equal(evidence.monitoring?.blockingAlerts, 0)
assert.ok(Number.isInteger(evidence.monitoring?.watchAlerts))
assert.ok(evidence.monitoring.watchAlerts >= 0)

console.log(JSON.stringify({
  result: 'pass',
  targetMainSha: evidence.targetMainSha,
  productionSmokeRunId: evidence.productionSmoke.workflowRunId,
  productionSmokeArtifactId: evidence.productionSmoke.artifactId,
  publicRoutesChecked: evidence.publicRoutesChecked,
  providersSeparate: evidence.providersSeparate,
  blockingAlerts: evidence.monitoring.blockingAlerts,
}, null, 2))
