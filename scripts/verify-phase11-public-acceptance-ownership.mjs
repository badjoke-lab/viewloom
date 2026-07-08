import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const path = process.argv[2] || 'artifacts/phase11-public-acceptance-ownership/ownership.json'
const evidence = JSON.parse(readFileSync(path, 'utf8'))

assert.equal(evidence.schema, 'viewloom-phase11-public-acceptance-ownership-v1')
assert.equal(evidence.phase, 'Phase 11')
assert.equal(evidence.workstream, 'P11F-retained-current-ownership')
assert.equal(evidence.counts.routes, 25)
assert.equal(evidence.counts.portal, 9)
assert.equal(evidence.counts.twitch, 8)
assert.equal(evidence.counts.kick, 8)
assert.equal(evidence.routes.length, 25)
assert.equal(new Set(evidence.routes.map((entry) => entry.route)).size, 25)

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
  if (entry.provider === 'portal' && entry.profile === 'static_legal') {
    assert.deepEqual(entry.apis, [], `${entry.route}: legal route must remain provider-neutral`)
    assert.equal(entry.owners.featureContract, 'release-r12a-legal-support')
  }
}

assert.equal(evidence.routes.filter((entry) => entry.profile === 'static_legal').length, 5)
assert.equal(evidence.commonOwners.readiness, '.github/workflows/public-readiness-audit.yml')
assert.equal(evidence.commonOwners.browser, '.github/workflows/public-browser-audit.yml')
assert.equal(evidence.commonOwners.production, '.github/workflows/production-smoke.yml')

console.log('Retained public acceptance ownership verification passed.')
console.log('- routes: 25')
console.log('- portal: 9')
console.log('- Twitch: 8')
console.log('- Kick: 8')
console.log('- five R12A legal routes are provider-neutral and owned by release-r12a-legal-support')
console.log('- every route has readiness, browser, production, and feature-contract ownership')
