#!/usr/bin/env node

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { buildTwitchStreamMapLiveModel } from '../functions/api/twitch-stream-map-core.mjs'
import {
  normalizeTwitchStreamMapPopulationQuery,
  selectTwitchStreamMapPopulation,
  twitchStreamMapPopulationNeedsCategoryDictionary,
} from '../functions/api/twitch-stream-map-population-core.mjs'

const payload = JSON.stringify({
  provider: 'twitch',
  bucketMinute: '2026-08-22T15:00:00.000Z',
  bucketMinutes: 5,
  categoryContractVersion: 'category-source-v1',
  categoryIds: ['g1', 'g2'],
  categoryRefs: [0, 1, 0, 0, 1, null],
  items: [
    { channelLogin: 'alpha', displayName: 'Alpha', viewers: 100 },
    { channelLogin: 'bravo', displayName: 'Bravo', viewers: 90 },
    { channelLogin: 'charlie', displayName: 'Charlie', viewers: 80 },
    { channelLogin: 'delta', displayName: 'Delta', viewers: 70 },
    { channelLogin: 'echo', displayName: 'Echo', viewers: 60 },
    { channelLogin: 'foxtrot', displayName: 'Foxtrot', viewers: 50 },
  ],
})
const names = new Map([['g1', 'Game One'], ['g2', 'Game Two']])

assert.deepEqual(normalizeTwitchStreamMapPopulationQuery({}), {
  selectedTop: 300,
  minViewers: 0,
  selectedCategory: 'all',
})
assert.equal(normalizeTwitchStreamMapPopulationQuery({ top: '100' }).selectedTop, 100)
assert.equal(normalizeTwitchStreamMapPopulationQuery({ top: '7' }).selectedTop, 300)
assert.equal(normalizeTwitchStreamMapPopulationQuery({ minViewers: '-20' }).minViewers, 0)
assert.equal(normalizeTwitchStreamMapPopulationQuery({ category: 'ALL' }).selectedCategory, 'all')
assert.equal(twitchStreamMapPopulationNeedsCategoryDictionary(payload), true)

const topThreeGameOne = selectTwitchStreamMapPopulation({
  payloadJson: payload,
  top: 20,
  minViewers: 0,
  category: 'g1',
  categoryNames: names,
})
assert.equal(topThreeGameOne.metadata.categoryState, 'selected')
assert.equal(topThreeGameOne.metadata.selectedCategoryName, 'Game One')

const boundaryPayload = JSON.stringify({
  provider: 'twitch',
  categoryContractVersion: 'category-source-v1',
  categoryIds: ['g1', 'g2'],
  categoryRefs: Array.from({ length: 25 }, (_, index) => index % 2 === 0 ? 0 : 1),
  items: Array.from({ length: 25 }, (_, index) => ({
    channelLogin: `stream_${String(index + 1).padStart(2, '0')}`,
    displayName: `Stream ${index + 1}`,
    viewers: 1000 - index * 10,
  })),
})

const top20GameOne = selectTwitchStreamMapPopulation({
  payloadJson: boundaryPayload,
  top: 20,
  category: 'g1',
  categoryNames: names,
})
const selectedTop20 = JSON.parse(top20GameOne.payloadJson).items
assert.equal(top20GameOne.metadata.topScopedStreams, 20)
assert.equal(top20GameOne.metadata.preCategoryStreams, 20)
assert.equal(top20GameOne.metadata.selectedPopulationStreams, 10)
assert.equal(selectedTop20.some((row) => row.channelLogin === 'stream_21'), false, 'category must not refill below overall Top 20')
assert.deepEqual(selectedTop20.map((row) => row.channelLogin), [
  'stream_01', 'stream_03', 'stream_05', 'stream_07', 'stream_09',
  'stream_11', 'stream_13', 'stream_15', 'stream_17', 'stream_19',
])

const minViewerScoped = selectTwitchStreamMapPopulation({
  payloadJson: boundaryPayload,
  top: 20,
  minViewers: 850,
  category: 'all',
  categoryNames: names,
})
const minItems = JSON.parse(minViewerScoped.payloadJson).items
assert.equal(minViewerScoped.metadata.topScopedStreams, 20)
assert.equal(minViewerScoped.metadata.preCategoryStreams, 16)
assert.equal(minItems.length, 16)
assert.equal(minItems.some((row) => row.channelLogin === 'stream_21'), false, 'min viewer filtering must not refill below Top-N boundary')

const all = selectTwitchStreamMapPopulation({ payloadJson: payload, top: 300, category: 'all', categoryNames: names })
assert.equal(all.metadata.selectedPopulationStreams, 6)
assert.equal(all.metadata.unknownCategoryStreams, 1)
assert.equal(all.metadata.categoryCoverageState, 'partial')
assert.deepEqual(all.metadata.availableCategories.map((option) => [option.id, option.streamCount]), [['g1', 3], ['g2', 2]])
assert.equal(JSON.parse(all.payloadJson).items.some((row) => row.channelLogin === 'foxtrot'), true, 'category=all must retain missing-category rows')

const selected = selectTwitchStreamMapPopulation({ payloadJson: payload, top: 300, category: 'g2', categoryNames: names })
assert.equal(selected.metadata.selectedPopulationStreams, 2)
assert.equal(JSON.parse(selected.payloadJson).items.some((row) => row.channelLogin === 'foxtrot'), false)
assert.deepEqual(selected.metadata.availableCategories.map((option) => option.id), ['g1', 'g2'], 'category options are computed before selected-category filtering')

const unknown = selectTwitchStreamMapPopulation({ payloadJson: payload, category: 'missing', categoryNames: names })
assert.equal(unknown.metadata.categoryState, 'unknown_category')
assert.equal(unknown.metadata.selectedPopulationStreams, 0)
assert.equal(unknown.streamCount, 0)
assert.equal(unknown.totalViewers, 0)

const unavailablePayload = JSON.stringify({
  provider: 'twitch',
  items: [{ channelLogin: 'alpha', displayName: 'Alpha', viewers: 100 }],
})
assert.equal(twitchStreamMapPopulationNeedsCategoryDictionary(unavailablePayload), false)
const unavailableAll = selectTwitchStreamMapPopulation({ payloadJson: unavailablePayload, category: 'all' })
assert.equal(unavailableAll.metadata.categoryState, 'category_unavailable')
assert.equal(unavailableAll.metadata.selectedPopulationStreams, 1)
const unavailableSelected = selectTwitchStreamMapPopulation({ payloadJson: unavailablePayload, category: 'g1' })
assert.equal(unavailableSelected.metadata.categoryState, 'category_unavailable')
assert.equal(unavailableSelected.metadata.selectedPopulationStreams, 0)

const evidence = [{
  streamerLogin: 'stream_01',
  entityKind: 'person',
  classificationReferences: [],
  evidences: [{
    source: 'manual_review', sourceUrl: null, observedAt: '2026-08-22T00:00:00Z',
    countryCode: 'US', countryName: 'United States', region: null, city: null,
    claimKind: 'declared_location', confidence: 'reviewed', status: 'accepted',
  }],
}]
const live = buildTwitchStreamMapLiveModel({
  snapshot: {
    bucketMinute: '2026-08-22T15:00:00Z',
    collectedAt: '2026-08-22T15:00:30Z',
    streamCount: top20GameOne.streamCount,
    totalViewers: top20GameOne.totalViewers,
    payloadJson: top20GameOne.payloadJson,
    sourceMode: 'real', coveredPages: 3, hasMore: true,
  },
  evidenceRecords: evidence,
  topLimit: top20GameOne.metadata.selectedTop,
})
assert.equal(live.coverage.observedStreams, top20GameOne.metadata.selectedPopulationStreams)
assert.equal(live.coverage.mappedStreams + live.coverage.unmappedStreams, live.coverage.observedStreams)
assert.equal(sum(live.coverage.unmappedReasons), live.coverage.unmappedStreams)

const endpoint = readFileSync('functions/api/twitch-stream-map.ts', 'utf8')
const entry = readFileSync('src/features/twitch-stream-map/stream-map-entry.ts', 'utf8')
const page = readFileSync('twitch/map/index.html', 'utf8')
assert.ok(endpoint.includes("url.searchParams.get('top')"))
assert.ok(endpoint.includes("url.searchParams.get('min_viewers')"))
assert.ok(endpoint.includes("url.searchParams.get('category')"))
assert.ok(endpoint.includes('selectTwitchStreamMapPopulation'))
assert.ok(endpoint.includes('populationFilter: population.metadata'))
assert.ok(endpoint.includes("import { projectTwitchStreamMapCountryOnly } from './twitch-stream-map-public-core.mjs'"))
assert.ok(endpoint.includes('const publicModel = projectTwitchStreamMapCountryOnly(model)'))
assert.ok(endpoint.includes('semantics: { ...publicModel.semantics, ...mapSemantics() }'))
assert.ok(endpoint.includes('populationFilterBeforeEvidenceFilter: true'))
assert.ok(endpoint.includes('languageUsedForPopulationFiltering: false'))
assert.ok(endpoint.includes("FROM provider_category_dictionary"))
assert.equal(endpoint.includes("url.searchParams.get('language')"), false)
assert.ok(page.includes('data-population-top'))
assert.ok(page.includes('data-population-min-viewers'))
assert.ok(page.includes('data-population-category'))
assert.ok(page.includes('overall Top N'))
assert.ok(entry.includes("searchParams.set('top'"))
assert.ok(entry.includes("searchParams.set('min_viewers'"))
assert.ok(entry.includes("searchParams.set('category'"))
assert.equal(entry.includes("searchParams.set('language'"), false)

function sum(values) {
  return Object.values(values).reduce((total, value) => total + Number(value || 0), 0)
}

console.log(JSON.stringify({
  ok: true,
  topBeforeCategory: true,
  noCategoryRefillBelowTopN: true,
  minViewerNoRefill: true,
  categoryOptionsPreSelection: true,
  missingCategoryAllRetained: true,
  unknownCategoryExplicitZero: true,
  categoryUnavailableExplicit: true,
  liveModelReconcilesSelectedPopulation: true,
  readyResponsePopulationSemantics: true,
  countryOnlyPublicProjectionWired: true,
  languageDeferred: true,
}, null, 2))
