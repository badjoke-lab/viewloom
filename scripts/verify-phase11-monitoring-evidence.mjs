import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const artifactDir = process.argv[2] || 'artifacts/production-smoke'
const evidence = JSON.parse(readFileSync(join(artifactDir, 'phase11-monitoring-evidence.json'), 'utf8'))

assert.equal(evidence.schema, 'viewloom-phase11-monitoring-evidence-v1')
assert.equal(evidence.phase, 'Phase 11')
assert.equal(evidence.workstream, 'P11C')
assert.equal(evidence.deployment.matchesExpected, true)
assert.equal(evidence.deployment.environment, 'production')
assert.equal(evidence.deployment.branch, 'main')
assert.equal(evidence.deployment.expectedMainSha, evidence.deployment.deployedSha)

const twitch = evidence.providers.twitch
assert.equal(twitch.platform, 'twitch')
assert.equal(twitch.storage.binding, 'DB_TWITCH_HOT')
assert.equal(twitch.storage.database, 'vl_twitch_hot')
assert.equal(twitch.freshness.isStale, false)
assert.equal(typeof twitch.capacity.observedCount, 'number')
assert.equal(typeof twitch.capacity.topLimit, 'number')
assert.ok(['within-window', 'near-window-limit', 'at-or-over-window'].includes(twitch.capacity.state))

const kick = evidence.providers.kick
assert.equal(kick.platform, 'kick')
assert.equal(kick.storage.binding, 'DB_KICK_HOT')
assert.equal(kick.storage.database, 'vl_kick_hot')
assert.equal(kick.freshness.isFresh, true)
assert.equal(kick.freshness.isStale, false)
assert.equal(typeof kick.capacity.observedCount, 'number')
assert.equal(typeof kick.capacity.topLimit, 'number')
assert.ok(['within-window', 'near-window-limit', 'at-or-over-window'].includes(kick.capacity.state))
assert.equal(Array.isArray(evidence.alerts), true)

const blockingAlerts = evidence.alerts.filter((alert) => alert.severity === 'critical' || alert.severity === 'high')
assert.deepEqual(blockingAlerts, [])

console.log('Phase 11 monitoring evidence verification passed.')
console.log(`- deployed SHA: ${evidence.deployment.deployedSha}`)
console.log(`- Twitch capacity: ${twitch.capacity.state} (${twitch.capacity.observedCount}/${twitch.capacity.topLimit})`)
console.log(`- Kick capacity: ${kick.capacity.state} (${kick.capacity.observedCount}/${kick.capacity.topLimit})`)
console.log(`- watch alerts: ${evidence.alerts.filter((alert) => alert.severity === 'watch').length}`)
