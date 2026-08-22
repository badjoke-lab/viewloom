import assert from 'node:assert/strict'
import { buildTwitchStreamMapLiveModel } from '../functions/api/twitch-stream-map-core.mjs'
import { TWITCH_REVIEWED_LOCATION_RECORDS } from '../functions/api/twitch-stream-map-reviewed-evidence.mjs'

const model = buildTwitchStreamMapLiveModel({
  snapshot: {
    bucketMinute: '2026-08-21T16:25:00.000Z',
    collectedAt: '2026-08-21T16:25:30.961Z',
    streamCount: 4,
    totalViewers: 280,
    payloadJson: JSON.stringify({
      provider: 'twitch',
      items: [
        { channelLogin: 'shotzzy', displayName: 'Shotzzy', viewers: 100 },
        { channelLogin: 'dota2ti', displayName: 'Dota 2 TI', viewers: 80 },
        { channelLogin: 'fps_shaka', displayName: 'SHAKA', viewers: 60 },
        { channelLogin: 'unknown_streamer', displayName: 'Unknown', viewers: 40 },
      ],
    }),
    sourceMode: 'real',
    coveredPages: 3,
    hasMore: true,
  },
  evidenceRecords: TWITCH_REVIEWED_LOCATION_RECORDS,
  topLimit: 300,
})

assert.equal(model.version, 'viewloom-stream-map-live-v1')
assert.equal(model.platform, 'twitch')
assert.equal(model.source, 'real')
assert.equal(model.coverage.observedStreams, 4)
assert.equal(model.coverage.observedViewers, 280)
assert.equal(model.coverage.mappedStreams, 1)
assert.equal(model.coverage.unmappedStreams, 3)
assert.equal(model.coverage.excludedNonPersonStreams, 1)
assert.equal(model.coverage.eligibleUnmappedStreams, 2)
assert.equal(model.coverage.mappedViewers, 100)
assert.equal(model.coverage.unmappedViewers, 180)
assert.equal(model.coverage.excludedNonPersonViewers, 80)
assert.equal(model.coverage.mappedCountryCount, 1)
assert.equal(model.coverage.currentLocationStreams, 0)
assert.equal(model.coverage.mappedBySource.official_external, 1)
assert.equal(model.coverage.unmappedReasons.excluded_nonperson, 1)
assert.equal(model.coverage.unmappedReasons.context_only_or_unaccepted_evidence, 1)
assert.equal(model.coverage.unmappedReasons.no_reviewed_evidence, 1)
assert.equal(sumReasonCounts(model.coverage.unmappedReasons), model.coverage.unmappedStreams)
assert.equal(model.mappedStreams[0]?.login, 'shotzzy')
assert.equal(model.mappedStreams[0]?.location.countryCode, 'US')
assert.deepEqual(model.mappedStreams[0]?.sources, ['official_external'])
assert.equal(model.excludedNonPersonStreams[0]?.login, 'dota2ti')
assert.equal(model.semantics.languageUsedForPlacement, false)
assert.equal(model.semantics.candidateOnlyPlacementAllowed, false)
assert.equal(model.semantics.nonPersonPlacementAllowed, false)
assert.equal(model.coverage.mappedStreams + model.coverage.unmappedStreams, model.coverage.observedStreams)

const conflict = buildTwitchStreamMapLiveModel({
  snapshot: {
    bucketMinute: '2026-08-21T16:25:00.000Z',
    collectedAt: '2026-08-21T16:25:30.961Z',
    streamCount: 1,
    totalViewers: 50,
    payloadJson: JSON.stringify({ items: [{ channelLogin: 'conflicted', displayName: 'Conflicted', viewers: 50 }] }),
    sourceMode: 'real',
    coveredPages: 1,
    hasMore: false,
  },
  evidenceRecords: [{
    streamerLogin: 'conflicted',
    entityKind: 'person',
    classificationReferences: [],
    evidences: [
      {
        source: 'manual_review', sourceUrl: null, observedAt: '2026-08-21T00:00:00Z',
        countryCode: 'US', countryName: 'United States', region: null, city: null,
        claimKind: 'home_base', confidence: 'reviewed', status: 'accepted',
      },
      {
        source: 'official_external', sourceUrl: null, observedAt: '2026-08-21T00:00:00Z',
        countryCode: 'CA', countryName: 'Canada', region: null, city: null,
        claimKind: 'declared_location', confidence: 'explicit', status: 'accepted',
      },
    ],
  }],
})

assert.equal(conflict.coverage.mappedStreams, 0)
assert.equal(conflict.coverage.unmappedStreams, 1)
assert.equal(conflict.coverage.unmappedReasons.conflicting_accepted_evidence, 1)
assert.equal(sumReasonCounts(conflict.coverage.unmappedReasons), conflict.coverage.unmappedStreams)

const candidateOnly = buildTwitchStreamMapLiveModel({
  snapshot: {
    bucketMinute: '2026-08-21T16:25:00.000Z',
    collectedAt: '2026-08-21T16:25:30.961Z',
    streamCount: 1,
    totalViewers: 30,
    payloadJson: JSON.stringify({ items: [{ channelLogin: 'candidate_only', displayName: 'Candidate', viewers: 30 }] }),
    sourceMode: 'real',
    coveredPages: 1,
    hasMore: false,
  },
  evidenceRecords: [{
    streamerLogin: 'candidate_only',
    entityKind: 'person',
    classificationReferences: [],
    evidences: [{
      source: 'stream_tag', sourceUrl: null, observedAt: '2026-08-21T00:00:00Z',
      countryCode: 'JP', countryName: 'Japan', region: null, city: null,
      claimKind: 'current_location', confidence: 'candidate_only', status: 'candidate_only',
    }],
  }],
})

assert.equal(candidateOnly.coverage.mappedStreams, 0)
assert.equal(candidateOnly.coverage.unmappedReasons.context_only_or_unaccepted_evidence, 1)
assert.equal(sumReasonCounts(candidateOnly.coverage.unmappedReasons), candidateOnly.coverage.unmappedStreams)

function sumReasonCounts(reasons) {
  return Object.values(reasons).reduce((sum, value) => sum + Number(value || 0), 0)
}

console.log('twitch stream map live join verification passed')
