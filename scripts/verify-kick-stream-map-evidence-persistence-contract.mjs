import assert from 'node:assert/strict'
import fs from 'node:fs'

const contractPath = 'docs/product/kick-stream-map-evidence-persistence-contract-v0.1.md'
const fixturePath = 'docs/audits/kick-stream-map-evidence-join-fixture-v0.1.json'

const contract = fs.readFileSync(contractPath, 'utf8')
const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8'))

assert.equal(fixture.schemaVersion, 'viewloom-kick-stream-map-evidence-join-fixture-v0.1')
assert.equal(fixture.sourceRunId, 32824733495)
assert.equal(fixture.livestream.channel.slug, fixture.channel.slug)
assert.equal(typeof fixture.channel.broadcaster_user_id, 'number')
assert.equal(fixture.expected.joinMatched, true)
assert.equal(fixture.expected.stableKickUserId, fixture.channel.broadcaster_user_id)
assert.equal(fixture.expected.slugIsStableId, false)
assert.equal(fixture.expected.customTagsAvailable, false)
assert.equal(fixture.expected.legacyFallbackAllowed, false)
assert.equal(fixture.expected.automaticGeographyAcceptanceAllowed, false)
assert.equal(fixture.expected.preciseLocationFieldsAllowed, false)

for (const required of [
  'channel.slug',
  'Channels `slug`',
  'Channels `broadcaster_user_id`',
  'must not be represented as a stable Kick user ID',
  'account_profile',
  'live_title',
  'custom_tags',
  'must not be backfilled from the deprecated public `kick.com/api/v2/channels/{slug}` endpoint',
  'No automatic geography acceptance',
  'No precise address, GPS trace, latitude, or longitude publication',
  'production collector change',
  'D1 write',
  'D1 schema change',
  'collector cadence change',
  'public Kick Stream Map activation',
]) {
  assert.ok(contract.includes(required), `contract missing: ${required}`)
}

console.log(JSON.stringify({
  ok: true,
  sourceRunId: fixture.sourceRunId,
  joinKey: 'livestream.channel.slug -> channels.slug',
  stableIdentity: 'channels.broadcaster_user_id',
  slugIsStableId: false,
  customTagsAvailableInMeasuredRun: false,
  legacyFallbackAllowed: false,
  automaticGeographyAcceptanceAllowed: false,
  preciseLocationFieldsAllowed: false,
  productionMutationAuthorized: false,
}, null, 2))
