import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { deriveKickCountrySnapshotStates } from './kick-stream-map-country-snapshot-adapter-core.mjs'

const fixture = JSON.parse(readFileSync('docs/audits/kick-stream-map-country-snapshot-adapter-fixture-v0.1.json', 'utf8'))
assert.equal(fixture.schemaVersion, 'viewloom-kick-stream-map-country-snapshot-adapter-fixture-v0.1')

const states = deriveKickCountrySnapshotStates(fixture)
const bySlug = new Map(states.map((row) => [row.slug, row]))

const mapped = bySlug.get('mapped')
assert.equal(mapped?.state, fixture.expected.mapped.state)
assert.equal(mapped?.reason, fixture.expected.mapped.reason)
assert.equal(mapped?.stableKickUserId, fixture.expected.mapped.stableKickUserId)
assert.equal(mapped?.placement?.countryCode, fixture.expected.mapped.countryCode)

const missing = bySlug.get('missing-id')
assert.equal(missing?.state, fixture.expected['missing-id'].state)
assert.equal(missing?.reason, fixture.expected['missing-id'].reason)
assert.equal(missing?.stableKickUserId, null)

const conflicting = states.filter((row) => row.slug === 'conflict-id')
assert.equal(conflicting.length, 2)
for (const row of conflicting) {
  assert.equal(row.state, fixture.expected['conflict-id'].state)
  assert.equal(row.reason, fixture.expected['conflict-id'].reason)
}

const twitchReuse = bySlug.get('twitch-evidence-test')
assert.equal(twitchReuse?.state, fixture.expected['twitch-evidence-test'].state)
assert.equal(twitchReuse?.reason, fixture.expected['twitch-evidence-test'].reason)
assert.equal(twitchReuse?.stableKickUserId, fixture.expected['twitch-evidence-test'].stableKickUserId)

console.log(JSON.stringify({
  ok: true,
  provider: 'kick',
  snapshotStableIdentity: 'broadcaster_user_id',
  mappedRows: states.filter((row) => row.state === 'mapped').length,
  missingStableIdentityFailsClosed: true,
  ambiguousStableIdentityFailsClosed: true,
  twitchEvidenceReuseAllowed: false,
  providerAggregationAllowed: false,
  productionActivationAuthorized: false
}, null, 2))
