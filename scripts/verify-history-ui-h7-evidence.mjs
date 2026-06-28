import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const [path, environment, branch, sha] = process.argv.slice(2)
assert.ok(path, 'Evidence path is required.')
assert.ok(environment, 'Expected environment is required.')
assert.ok(branch, 'Expected branch is required.')
assert.ok(sha, 'Expected SHA is required.')

const evidence = JSON.parse(readFileSync(path, 'utf8'))
assert.equal(evidence.schema, 'viewloom-history-ui-h7-hosted-acceptance-v1')
assert.equal(evidence.phase, 'P9H7')
assert.equal(evidence.result, 'pass')
assert.equal(evidence.origin.startsWith('https://'), true)
assert.equal(evidence.expectedEnvironment, environment)
assert.equal(evidence.expectedBranch, branch)
assert.equal(evidence.expectedSha, sha)
assert.equal(evidence.deployment.schema, 'viewloom-deployment-v1')
assert.equal(evidence.deployment.environment, environment)
assert.equal(evidence.deployment.branch, branch)
assert.equal(evidence.deployment.commit_sha, sha)
assert.equal(evidence.providers.twitch.binding, 'DB_TWITCH_HOT')
assert.equal(evidence.providers.twitch.database, 'vl_twitch_hot')
assert.equal(evidence.providers.twitch.collectorState, 'ok')
assert.equal(evidence.providers.kick.binding, 'DB_KICK_HOT')
assert.equal(evidence.providers.kick.database, 'vl_kick_hot')
assert.equal(evidence.providers.kick.collectorState, 'snapshot_available')
for (const provider of ['twitch', 'kick']) {
  for (const metric of ['viewerMinutes', 'peakViewers']) {
    const state = evidence.providers[provider][metric]
    assert.equal(state.source, 'real')
    assert.ok(state.observedDays > 0)
    assert.ok(state.topStreamers > 0)
  }
}
assert.equal(evidence.scenarios.length, 5)
assert.ok(evidence.scenarios.every((scenario) => scenario.result === 'pass'))
assert.deepEqual(evidence.scenarios.map((scenario) => scenario.id), [
  'twitch-desktop-1440-hosted',
  'kick-tablet-820-hosted',
  'kick-mobile-390-hosted',
  'twitch-mobile-360-hosted',
  'twitch-forced-colors-390-hosted',
])
assert.ok(evidence.scenarios.every((scenario) => scenario.state.bodyOverflow <= 2))
assert.ok(evidence.scenarios.every((scenario) => scenario.state.taskCount === 3))
assert.ok(evidence.scenarios.every((scenario) => scenario.state.archiveCount === 3))
assert.ok(evidence.scenarios.every((scenario) => scenario.state.minTaskHeight >= 44))
assert.ok(evidence.scenarios.every((scenario) => scenario.state.minArchiveHeight >= 48))
assert.ok(evidence.scenarios.every((scenario) => scenario.state.minPublishHeight >= 48))

console.log(JSON.stringify({
  result: evidence.result,
  deployment: evidence.deployment,
  providers: evidence.providers,
  scenarios: evidence.scenarios.map((scenario) => scenario.id),
}, null, 2))
