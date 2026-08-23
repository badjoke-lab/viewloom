import assert from 'node:assert/strict'
import { buildTwitchStreamMapLiveModel } from '../functions/api/twitch-stream-map-core.mjs'
import { projectTwitchStreamMapCountryOnly } from '../functions/api/twitch-stream-map-public-core.mjs'
import { TWITCH_REVIEWED_LOCATION_RECORDS } from '../functions/api/twitch-stream-map-reviewed-evidence.mjs'

const sample = [
  ['caedrel', 'Caedrel', 42344],
  ['ibai', 'Ibai', 40509],
  ['papaplatte', 'Papaplatte', 40317],
  ['ohnepixel', 'ohnePixel', 37545],
  ['chopperinho', 'chopperinho', 28266],
  ['shadowkekw', 'shadowkekw', 27704],
  ['stableronaldo', 'StableRonaldo', 26545],
  ['jynxzi', 'Jynxzi', 24991],
  ['stylishnoob4', 'stylishnoob4', 22138],
  ['ow_esports', 'ow_esports', 20791],
  ['eslcs', 'ESLCS', 19909],
  ['dangerlyoha', 'dangerlyoha', 19189],
  ['deepins02', 'deepins02', 18764],
  ['ewc_stcarena_en', 'EWC_stcArena_EN', 17389],
  ['worldoftanks', 'WorldofTanks', 17218],
  ['hutchmf', 'HutchMF', 16420],
  ['realkatieb', 'RealKatieB', 14064],
  ['otplol_', 'otplol_', 14001],
  ['leva2k', 'leva2k', 12831],
  ['v0kky', 'v0kky', 12695],
]

const observedViewers = sample.reduce((sum, [, , viewers]) => sum + viewers, 0)
assert.equal(observedViewers, 473630)

const model = buildTwitchStreamMapLiveModel({
  snapshot: {
    bucketMinute: '2026-08-22T17:28:00.000Z',
    collectedAt: '2026-08-22T17:28:10.752Z',
    streamCount: sample.length,
    totalViewers: observedViewers,
    payloadJson: JSON.stringify({
      provider: 'twitch',
      items: sample.map(([channelLogin, displayName, viewers]) => ({ channelLogin, displayName, viewers })),
    }),
    sourceMode: 'real',
    coveredPages: 1,
    hasMore: true,
  },
  evidenceRecords: TWITCH_REVIEWED_LOCATION_RECORDS,
  topLimit: 20,
})

assert.equal(model.coverage.observedStreams, 20)
assert.equal(model.coverage.observedViewers, 473630)
assert.equal(model.coverage.mappedStreams, 4)
assert.equal(model.coverage.unmappedStreams, 16)
assert.equal(model.coverage.excludedNonPersonStreams, 5)
assert.equal(model.coverage.eligibleUnmappedStreams, 11)
assert.equal(model.coverage.mappedViewers, 134791)
assert.equal(model.coverage.excludedNonPersonViewers, 89308)
assert.equal(model.coverage.mappedCountryCount, 4)
assert.equal(model.coverage.currentLocationStreams, 0)
assert.equal(model.coverage.mappedBySource.official_external, 3)
assert.equal(model.coverage.mappedBySource.manual_review, 1)
assert.equal(model.coverage.unmappedReasons.excluded_nonperson, 5)
assert.equal(model.coverage.unmappedReasons.no_reviewed_evidence, 11)
assert.equal(sumReasonCounts(model.coverage.unmappedReasons), model.coverage.unmappedStreams)
assert.equal(model.coverage.mappedPercent, 0.2)
assert.equal(model.coverage.mappedViewerPercent, 0.284591)
assert.equal(model.coverage.mappedStreams + model.coverage.unmappedStreams, model.coverage.observedStreams)

assert.deepEqual(
  model.mappedStreams.map((row) => [row.login, row.location.countryCode, row.sources]),
  [
    ['ibai', 'ES', ['official_external']],
    ['papaplatte', 'DE', ['official_external']],
    ['ohnepixel', 'NL', ['manual_review']],
    ['hutchmf', 'US', ['official_external']],
  ],
)

assert.deepEqual(
  model.excludedNonPersonStreams.map((row) => [row.login, row.entityKind]),
  [
    ['ow_esports', 'event_broadcast'],
    ['eslcs', 'event_broadcast'],
    ['ewc_stcarena_en', 'event_broadcast'],
    ['worldoftanks', 'organization'],
    ['otplol_', 'organization'],
  ],
)

for (const login of ['stableronaldo', 'jynxzi', 'caedrel', 'stylishnoob4', 'dangerlyoha', 'deepins02', 'realkatieb', 'chopperinho', 'shadowkekw', 'leva2k', 'v0kky']) {
  assert.equal(model.mappedStreams.some((row) => row.login === login), false, `${login} must remain unmapped without accepted attributable evidence`)
}

const ibai = TWITCH_REVIEWED_LOCATION_RECORDS.find((record) => record.streamerLogin === 'ibai')
assert.equal(ibai?.evidences[0]?.city, 'Sant Cugat del Valles')
assert.equal(ibai?.evidences[0]?.claimKind, 'declared_location')

const papaplatte = TWITCH_REVIEWED_LOCATION_RECORDS.find((record) => record.streamerLogin === 'papaplatte')
assert.equal(papaplatte?.evidences[0]?.city, 'Cologne')
assert.equal(papaplatte?.evidences[0]?.claimKind, 'declared_location')

const publicModel = projectTwitchStreamMapCountryOnly(model)
assert.ok(publicModel.mappedStreams.every((row) => row.location.regions.length === 0))
assert.ok(publicModel.mappedStreams.every((row) => row.location.cities.length === 0))
assert.ok(publicModel.mappedStreams.every((row) => row.evidence.every((evidence) => evidence.region === null && evidence.city === null)))
assert.deepEqual(publicModel.mappedStreams.map((row) => row.location.countryCode), ['ES', 'DE', 'NL', 'US'])

const knirpzRetained = TWITCH_REVIEWED_LOCATION_RECORDS.find((record) => record.streamerLogin === 'knirpz')
assert.equal(knirpzRetained?.evidences[0]?.city, 'Berlin')
const knirpzProjection = projectTwitchStreamMapCountryOnly(buildTwitchStreamMapLiveModel({
  snapshot: {
    bucketMinute: '2026-08-23T02:04:00.000Z',
    collectedAt: '2026-08-23T02:04:10.000Z',
    streamCount: 1,
    totalViewers: 1,
    payloadJson: JSON.stringify({ items: [{ channelLogin: 'knirpz', displayName: 'Knirpz', viewers: 1 }] }),
    sourceMode: 'real',
    coveredPages: 1,
    hasMore: false,
  },
  evidenceRecords: TWITCH_REVIEWED_LOCATION_RECORDS,
  topLimit: 20,
}))
assert.equal(knirpzProjection.mappedStreams[0]?.location.countryCode, 'DE')
assert.deepEqual(knirpzProjection.mappedStreams[0]?.location.cities, [])
assert.equal(knirpzProjection.mappedStreams[0]?.evidence[0]?.city, null)

assert.equal(model.semantics.languageUsedForPlacement, false)
assert.equal(model.semantics.candidateOnlyPlacementAllowed, false)
assert.equal(model.semantics.nonPersonPlacementAllowed, false)
assert.equal(model.semantics.conflictingAcceptedCountriesAreMapped, false)

function sumReasonCounts(reasons) {
  return Object.values(reasons).reduce((sum, value) => sum + Number(value || 0), 0)
}

console.log('twitch stream map fixed Top 20 reviewed evidence verification passed')
