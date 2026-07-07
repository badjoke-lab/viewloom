import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const path = process.argv[2] || 'artifacts/phase11-public-acceptance-ownership/ownership.json'
const evidence = JSON.parse(readFileSync(path, 'utf8'))

assert.equal(evidence.schema, 'viewloom-phase11-public-acceptance-ownership-v1')
assert.equal(evidence.phase, 'Phase 11')
assert.equal(evidence.workstream, 'P11F')
assert.equal(evidence.counts.routes, 20)
assert.equal(evidence.counts.portal, 4)
assert.equal(evidence.counts.twitch, 8)
assert.equal(evidence.counts.kick, 8)
assert.equal(evidence.routes.length, 20)
assert.equal(new Set(evidence.routes.map((entry) => entry.route)).size, 20)

const requiredOwnerKeys = ['readiness', 'browser', 'production', 'featureContract']
for (const entry of evidence.routes) {
  for (const key of requiredOwnerKeys) {
    assert.equal(typeof entry.owners[key], 'string', `${entry.route}: missing ${key} owner`)
    assert.ok(entry.owners[key].length > 0, `${entry.route}: empty ${key} owner`)
  }
  assert.equal(Array.isArray(entry.apis), true, `${entry.route}: APIs missing`)

  for (const api of entry.apis) {
    if (entry.provider === 'twitch') assert.ok(api.binding === 'DB_TWITCH_HOT' || api.binding === 'static', `${entry.route}: Twitch binding crossed to ${api.binding}`)
    if (entry.provider === 'kick') assert.ok(api.binding === 'DB_KICK_HOT' || api.binding === 'static', `${entry.route}: Kick binding crossed to ${api.binding}`)
  }
}

assert.equal(evidence.commonOwners.readiness, '.github/workflows/public-readiness-audit.yml')
assert.equal(evidence.commonOwners.browser, '.github/workflows/public-browser-audit.yml')
assert.equal(evidence.commonOwners.production, '.github/workflows/production-smoke.yml')

console.log('Phase 11 public acceptance ownership verification passed.')
console.log('- routes: 20')
console.log('- portal: 4')
console.log('- Twitch: 8')
console.log('- Kick: 8')
console.log('- every route has readiness, browser, production, and feature-contract ownership')
