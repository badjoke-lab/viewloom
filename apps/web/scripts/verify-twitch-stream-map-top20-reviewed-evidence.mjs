import assert from 'node:assert/strict'
import { buildTwitchStreamMapLiveModel } from '../functions/api/twitch-stream-map-core.mjs'
import { projectTwitchStreamMapCountryOnly } from '../functions/api/twitch-stream-map-public-core.mjs'
import {
  TWITCH_REVIEWED_LOCATION_RECORDS,
  TWITCH_REVIEWED_LOCATION_RECORDS_PRE_R3,
} from '../functions/api/twitch-stream-map-reviewed-evidence.mjs'

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
  evidenceRecords: TWITCH_REVIEWED_LOCATION_RECORDS_PRE_R3,
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

const replicationSample = [
  ['dota2ti', 'dota2ti', 72710],
  ['nix', 'Nix', 60587],
  ['theburntpeanut', 'TheBurntPeanut', 59200],
  ['dota2ti_ru', 'dota2ti_ru', 37755],
  ['ow_esports', 'ow_esports', 32574],
  ['adinross', 'AdinRoss', 24169],
  ['stableronaldo', 'stableronaldo', 23860],
  ['xqc', 'xQc', 18818],
  ['kato_junichi0817', '加藤純一うん〇ちゃん', 18571],
  ['lacy', 'Lacy', 17524],
  ['ramzes', 'ramzes', 13270],
  ['jasontheween', 'jasontheween', 12827],
  ['shroud', 'shroud', 12461],
  ['cinna', 'Cinna', 12188],
  ['moonmoon', 'MOONMOON', 12143],
  ['dota2ti_es', 'dota2ti_es', 11021],
  ['ddg', 'DDG', 10854],
  ['maximum', 'Maximum', 10082],
  ['jerma985', 'Jerma985', 9830],
  ['loltyler1', 'loltyler1', 9735],
]

const replicationViewers = replicationSample.reduce((sum, [, , viewers]) => sum + viewers, 0)
assert.equal(replicationViewers, 480179)

const replicationModel = buildTwitchStreamMapLiveModel({
  snapshot: {
    bucketMinute: '2026-08-23T02:28:00.000Z',
    collectedAt: '2026-08-23T02:28:43.300Z',
    streamCount: replicationSample.length,
    totalViewers: replicationViewers,
    payloadJson: JSON.stringify({
      provider: 'twitch',
      items: replicationSample.map(([channelLogin, displayName, viewers]) => ({ channelLogin, displayName, viewers })),
    }),
    sourceMode: 'real',
    coveredPages: 1,
    hasMore: true,
  },
  evidenceRecords: TWITCH_REVIEWED_LOCATION_RECORDS_PRE_R3,
  topLimit: 20,
})

assert.equal(replicationModel.coverage.observedStreams, 20)
assert.equal(replicationModel.coverage.observedViewers, 480179)
assert.equal(replicationModel.coverage.mappedStreams, 5)
assert.equal(replicationModel.coverage.unmappedStreams, 15)
assert.equal(replicationModel.coverage.excludedNonPersonStreams, 4)
assert.equal(replicationModel.coverage.eligibleUnmappedStreams, 11)
assert.equal(replicationModel.coverage.mappedViewers, 83553)
assert.equal(replicationModel.coverage.excludedNonPersonViewers, 154060)
assert.equal(replicationModel.coverage.mappedCountryCount, 1)
assert.equal(replicationModel.coverage.currentLocationStreams, 0)
assert.equal(replicationModel.coverage.mappedBySource.official_external, 2)
assert.equal(replicationModel.coverage.mappedBySource.manual_review, 3)
assert.equal(replicationModel.coverage.unmappedReasons.excluded_nonperson, 4)
assert.equal(replicationModel.coverage.unmappedReasons.no_reviewed_evidence, 11)
assert.equal(sumReasonCounts(replicationModel.coverage.unmappedReasons), replicationModel.coverage.unmappedStreams)
assert.equal(replicationModel.coverage.mappedPercent, 0.25)
assert.equal(replicationModel.coverage.mappedViewerPercent, 0.174004)
assert.equal(replicationModel.coverage.mappedStreams + replicationModel.coverage.unmappedStreams, replicationModel.coverage.observedStreams)

assert.deepEqual(
  replicationModel.mappedStreams.map((row) => [row.login, row.location.countryCode, row.sources]),
  [
    ['adinross', 'US', ['official_external']],
    ['xqc', 'US', ['manual_review']],
    ['lacy', 'US', ['manual_review']],
    ['cinna', 'US', ['manual_review']],
    ['ddg', 'US', ['official_external']],
  ],
)

assert.deepEqual(
  replicationModel.excludedNonPersonStreams.map((row) => [row.login, row.entityKind]),
  [
    ['dota2ti', 'event_broadcast'],
    ['dota2ti_ru', 'event_broadcast'],
    ['ow_esports', 'event_broadcast'],
    ['dota2ti_es', 'event_broadcast'],
  ],
)

for (const login of ['nix', 'theburntpeanut', 'stableronaldo', 'kato_junichi0817', 'ramzes', 'jasontheween', 'shroud', 'moonmoon', 'maximum', 'jerma985', 'loltyler1']) {
  assert.equal(replicationModel.mappedStreams.some((row) => row.login === login), false, `${login} must remain unmapped in the pre-R3 evidence snapshot`)
}

for (const login of ['adinross', 'xqc', 'lacy', 'cinna', 'ddg']) {
  const record = TWITCH_REVIEWED_LOCATION_RECORDS.find((entry) => entry.streamerLogin === login)
  assert.equal(record?.evidences[0]?.status, 'accepted')
  assert.equal(record?.evidences[0]?.confidence, 'explicit')
  assert.equal(record?.evidences[0]?.countryCode, 'US')
}

const replicationPublic = projectTwitchStreamMapCountryOnly(replicationModel)
assert.ok(replicationPublic.mappedStreams.every((row) => row.location.regions.length === 0))
assert.ok(replicationPublic.mappedStreams.every((row) => row.location.cities.length === 0))
assert.ok(replicationPublic.mappedStreams.every((row) => row.evidence.every((evidence) => evidence.region === null && evidence.city === null)))
assert.deepEqual(replicationPublic.mappedStreams.map((row) => row.location.countryCode), ['US', 'US', 'US', 'US', 'US'])

const r3Sample = [
  ['nix', 'Nix', 166751],
  ['dota2ti', 'dota2ti', 158533],
  ['dota2ti_ru', 'dota2ti_ru', 154480],
  ['caedrel', 'Caedrel', 83248],
  ['ow_esports', 'ow_esports', 51761],
  ['kato_junichi0817', '加藤純一うん〇ちゃん', 45447],
  ['theburntpeanut', 'TheBurntPeanut', 35260],
  ['lck', 'LCK', 23307],
  ['ramzes', 'ramzes', 21555],
  ['hoangluanblv', 'HoangLuanBLV', 18077],
  ['jasontheween', 'jasontheween', 17290],
  ['lck_carry', 'LCK_Carry', 14742],
  ['just_ns', 'just_ns', 13776],
  ['indegnasen0706', '布団ちゃんと申します', 13345],
  ['fps_shaka', 'fps_shaka', 12846],
  ['solo', 'Solo', 11904],
  ['lazvell', 'Lazvell', 11829],
  ['otplol_', 'otplol_', 11603],
  ['echo_esports', 'Echo_Esports', 10279],
  ['eslcs', 'ESLCS', 10263],
]

const r3Viewers = r3Sample.reduce((sum, [, , viewers]) => sum + viewers, 0)
assert.equal(r3Viewers, 886296)

const r3Model = buildTwitchStreamMapLiveModel({
  snapshot: {
    bucketMinute: '2026-08-23T09:22:00.000Z',
    collectedAt: '2026-08-23T09:22:22.534Z',
    streamCount: r3Sample.length,
    totalViewers: r3Viewers,
    payloadJson: JSON.stringify({
      provider: 'twitch',
      items: r3Sample.map(([channelLogin, displayName, viewers]) => ({ channelLogin, displayName, viewers })),
    }),
    sourceMode: 'real',
    coveredPages: 1,
    hasMore: true,
  },
  evidenceRecords: TWITCH_REVIEWED_LOCATION_RECORDS,
  topLimit: 20,
})

assert.equal(r3Model.coverage.observedStreams, 20)
assert.equal(r3Model.coverage.observedViewers, 886296)
assert.equal(r3Model.coverage.mappedStreams, 3)
assert.equal(r3Model.coverage.unmappedStreams, 17)
assert.equal(r3Model.coverage.excludedNonPersonStreams, 8)
assert.equal(r3Model.coverage.eligibleUnmappedStreams, 9)
assert.equal(r3Model.coverage.mappedViewers, 51691)
assert.equal(r3Model.coverage.excludedNonPersonViewers, 434968)
assert.equal(r3Model.coverage.mappedCountryCount, 3)
assert.equal(r3Model.coverage.currentLocationStreams, 0)
assert.equal(r3Model.coverage.mappedBySource.official_external, 3)
assert.equal(Number(r3Model.coverage.mappedBySource.manual_review || 0), 0)
assert.equal(r3Model.coverage.unmappedReasons.excluded_nonperson, 8)
assert.equal(r3Model.coverage.unmappedReasons.no_reviewed_evidence, 9)
assert.equal(sumReasonCounts(r3Model.coverage.unmappedReasons), r3Model.coverage.unmappedStreams)
assert.equal(r3Model.coverage.mappedPercent, 0.15)
assert.equal(r3Model.coverage.mappedViewerPercent, 0.058323)
assert.equal(r3Model.coverage.mappedStreams + r3Model.coverage.unmappedStreams, r3Model.coverage.observedStreams)

assert.deepEqual(
  r3Model.mappedStreams.map((row) => [row.login, row.location.countryCode, row.sources]),
  [
    ['ramzes', 'RU', ['official_external']],
    ['jasontheween', 'US', ['official_external']],
    ['fps_shaka', 'JP', ['official_external']],
  ],
)

assert.deepEqual(
  r3Model.excludedNonPersonStreams.map((row) => [row.login, row.entityKind]),
  [
    ['dota2ti', 'event_broadcast'],
    ['dota2ti_ru', 'event_broadcast'],
    ['ow_esports', 'event_broadcast'],
    ['lck', 'event_broadcast'],
    ['lck_carry', 'organization'],
    ['otplol_', 'organization'],
    ['echo_esports', 'organization'],
    ['eslcs', 'event_broadcast'],
  ],
)

for (const login of ['nix', 'caedrel', 'kato_junichi0817', 'theburntpeanut', 'hoangluanblv', 'just_ns', 'indegnasen0706', 'solo', 'lazvell']) {
  assert.equal(r3Model.mappedStreams.some((row) => row.login === login), false, `${login} must remain unmapped without accepted R3 evidence`)
}

const ramzes = TWITCH_REVIEWED_LOCATION_RECORDS.find((record) => record.streamerLogin === 'ramzes')
assert.equal(ramzes?.evidences[0]?.countryCode, 'RU')
assert.equal(ramzes?.evidences[0]?.city, 'Moscow')
assert.equal(ramzes?.evidences[0]?.claimKind, 'declared_location')

const jasontheween = TWITCH_REVIEWED_LOCATION_RECORDS.find((record) => record.streamerLogin === 'jasontheween')
assert.equal(jasontheween?.evidences[0]?.countryCode, 'US')
assert.equal(jasontheween?.evidences[0]?.city, 'Los Angeles')
assert.equal(jasontheween?.evidences[0]?.claimKind, 'home_base')

const shaka = TWITCH_REVIEWED_LOCATION_RECORDS.find((record) => record.streamerLogin === 'fps_shaka')
assert.equal(shaka?.evidences[0]?.claimKind, 'birthplace')
assert.equal(shaka?.evidences[0]?.status, 'context_only')
assert.equal(shaka?.evidences[1]?.countryCode, 'JP')
assert.equal(shaka?.evidences[1]?.city, 'Tokyo')
assert.equal(shaka?.evidences[1]?.claimKind, 'declared_location')
assert.equal(shaka?.evidences[1]?.status, 'accepted')

const r3Public = projectTwitchStreamMapCountryOnly(r3Model)
assert.ok(r3Public.mappedStreams.every((row) => row.location.regions.length === 0))
assert.ok(r3Public.mappedStreams.every((row) => row.location.cities.length === 0))
assert.ok(r3Public.mappedStreams.every((row) => row.evidence.every((evidence) => evidence.region === null && evidence.city === null)))
assert.deepEqual(r3Public.mappedStreams.map((row) => row.location.countryCode), ['RU', 'US', 'JP'])

for (const currentModel of [model, replicationModel, r3Model]) {
  assert.equal(currentModel.semantics.languageUsedForPlacement, false)
  assert.equal(currentModel.semantics.candidateOnlyPlacementAllowed, false)
  assert.equal(currentModel.semantics.nonPersonPlacementAllowed, false)
  assert.equal(currentModel.semantics.conflictingAcceptedCountriesAreMapped, false)
}

function sumReasonCounts(reasons) {
  return Object.values(reasons).reduce((sum, value) => sum + Number(value || 0), 0)
}

console.log('twitch stream map fixed Top 20 reviewed evidence verification passed')