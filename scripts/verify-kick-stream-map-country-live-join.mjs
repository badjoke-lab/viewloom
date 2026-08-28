import assert from 'node:assert/strict'
import fs from 'node:fs'
import { deriveKickCountryLiveStates } from './kick-stream-map-country-live-join-core.mjs'

const fixturePath = 'docs/audits/kick-stream-map-country-live-join-fixture-v0.1.json'
const contractPath = 'docs/product/kick-stream-map-country-live-join-contract-v0.1.md'
const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8'))
const contract = fs.readFileSync(contractPath, 'utf8')

assert.equal(fixture.schemaVersion, 'viewloom-kick-stream-map-country-live-join-fixture-v0.1')
assert.ok(Array.isArray(fixture.cases) && fixture.cases.length >= 7)

const requiredStates = new Set(['mapped', 'unmapped', 'excluded', 'conflict'])
const seenStates = new Set()
for (const testCase of fixture.cases) {
  const rows = deriveKickCountryLiveStates(testCase.input)
  assert.equal(rows.length, 1, `${testCase.id}: one Kick live row expected`)
  const row = rows[0]
  assert.ok(requiredStates.has(row.state), `${testCase.id}: terminal state`)
  seenStates.add(row.state)
  assert.equal(row.state, testCase.expected.state, `${testCase.id}: state`)
  assert.equal(row.reason, testCase.expected.reason, `${testCase.id}: reason`)
  assert.equal(row.stableKickUserId, testCase.expected.stableKickUserId, `${testCase.id}: stable id`)
  assert.equal(row.placement?.countryCode ?? null, testCase.expected.countryCode, `${testCase.id}: country`)
}
for (const state of requiredStates) assert.ok(seenStates.has(state), `missing fixture state ${state}`)

const mixedProviders = deriveKickCountryLiveStates({
  liveRows: [
    { provider: 'kick', channel: { slug: 'kick-one' } },
    { provider: 'twitch', channel: { slug: 'twitch-one' } },
  ],
  channelRows: [{ provider: 'kick', slug: 'kick-one', broadcaster_user_id: 2001 }],
  reviewedEvidence: [{ provider: 'kick', stableKickUserId: 2001, outcome: 'accepted', placement: { state: 'mapped', countryCode: 'AU' } }],
})
assert.equal(mixedProviders.length, 1)
assert.equal(mixedProviders[0].provider, 'kick')
assert.equal(mixedProviders[0].placement.countryCode, 'AU')

for (const required of [
  'Kick-only live population',
  'broadcaster_user_id',
  'slug is not a stable identity',
  'Twitch evidence is never copied',
  'mapped / unmapped / excluded / conflict',
  'No production deploy',
  'No D1 write',
  'No schema change',
  'No collector cadence change',
]) {
  assert.ok(contract.includes(required), `contract missing: ${required}`)
}

console.log(JSON.stringify({
  ok: true,
  fixtureCases: fixture.cases.length,
  terminalStates: [...seenStates].sort(),
  liveProvider: 'kick-only',
  stableIdentity: 'channels.broadcaster_user_id',
  slugRole: 'channels lookup only',
  twitchEvidenceReuseAllowed: false,
  providerAggregationAllowed: false,
  productionMutationAuthorized: false
}, null, 2))
