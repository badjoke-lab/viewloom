import fs from 'node:fs'
import assert from 'node:assert/strict'
import {
  KICK_REVIEWED_CITY_RUNTIME_DATA,
  KICK_REVIEWED_CITY_RUNTIME_DATA_VERSION,
} from '../apps/web/functions/api/kick-stream-map-reviewed-city-runtime-data.mjs'

export const CITY_REVIEW_QUEUE_SCHEMA_VERSION = 'viewloom-kick-stream-map-city-review-queue-v0.1'

function asNonEmptyString(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function asFiniteNumber(value) {
  return Number.isFinite(Number(value)) ? Number(value) : null
}

export function buildKickCityReviewQueue(input) {
  const result = input?.result ?? input
  const sourceQueue = Array.isArray(result?.queue) ? result.queue : []
  const reviewedIds = new Set(
    KICK_REVIEWED_CITY_RUNTIME_DATA
      .map((row) => asNonEmptyString(row?.stableKickUserId))
      .filter(Boolean),
  )

  let stableIdentityReadyRows = 0
  let alreadyReviewedRows = 0

  const queue = []
  for (const row of sourceQueue) {
    if (row?.identity_state !== 'ready') continue
    const stableKickUserId = asNonEmptyString(row?.broadcaster_user_id)
    if (!stableKickUserId) continue
    stableIdentityReadyRows += 1

    if (reviewedIds.has(stableKickUserId)) {
      alreadyReviewedRows += 1
      continue
    }

    queue.push({
      rank: asFiniteNumber(row?.rank),
      slug: asNonEmptyString(row?.slug),
      viewer_count: asFiniteNumber(row?.viewer_count),
      broadcaster_user_id: stableKickUserId,
      identity_state: 'ready',
      city_review_state: 'needs_review',
      observed_at: asNonEmptyString(row?.observed_at),
    })
  }

  return {
    schemaVersion: CITY_REVIEW_QUEUE_SCHEMA_VERSION,
    provider: 'kick',
    mode: 'read_only_artifact',
    source: {
      schemaVersion: asNonEmptyString(result?.schemaVersion),
      type: asNonEmptyString(result?.source?.type),
      updatedAt: asNonEmptyString(result?.source?.updatedAt),
      ordering: asNonEmptyString(result?.source?.ordering),
    },
    reviewedCityCatalog: {
      version: KICK_REVIEWED_CITY_RUNTIME_DATA_VERSION,
      identities: reviewedIds.size,
    },
    population: {
      inputRows: sourceQueue.length,
      stableIdentityReadyRows,
      alreadyReviewedRows,
      queueRows: queue.length,
    },
    semantics: {
      stableIdentity: 'broadcaster_user_id',
      slugRole: 'display_and_manual_review_only',
      automaticGeographyAcceptance: false,
      cityInferenceAllowed: false,
      currentLocationPromotionAllowed: false,
      twitchEvidenceCopied: false,
    },
    mutation: {
      productionDeployment: false,
      productionCollectorChange: false,
      d1Writes: 0,
      d1SchemaChange: false,
      collectorCadenceChange: false,
    },
    queue,
  }
}

function selfTest() {
  const reviewedId = KICK_REVIEWED_CITY_RUNTIME_DATA[0].stableKickUserId
  const sample = {
    result: {
      schemaVersion: 'viewloom-kick-stream-map-stable-id-review-queue-v0.2',
      source: {
        type: 'production_kick_stream_map_snapshot',
        updatedAt: '2026-09-11T00:00:00.000Z',
        ordering: 'viewer_count_desc',
      },
      queue: [
        { rank: 1, slug: 'reviewed', viewer_count: 300, broadcaster_user_id: reviewedId, identity_state: 'ready', observed_at: '2026-09-11T00:00:00.000Z' },
        { rank: 2, slug: 'candidate', viewer_count: 200, broadcaster_user_id: '999999999', identity_state: 'ready', observed_at: '2026-09-11T00:00:00.000Z' },
        { rank: 3, slug: 'missing', viewer_count: 100, broadcaster_user_id: null, identity_state: 'missing', observed_at: '2026-09-11T00:00:00.000Z' },
      ],
    },
  }

  const output = buildKickCityReviewQueue(sample)
  assert.equal(output.schemaVersion, CITY_REVIEW_QUEUE_SCHEMA_VERSION)
  assert.equal(output.provider, 'kick')
  assert.equal(output.mode, 'read_only_artifact')
  assert.equal(output.reviewedCityCatalog.identities, KICK_REVIEWED_CITY_RUNTIME_DATA.length)
  assert.equal(output.population.inputRows, 3)
  assert.equal(output.population.stableIdentityReadyRows, 2)
  assert.equal(output.population.alreadyReviewedRows, 1)
  assert.equal(output.population.queueRows, 1)
  assert.equal(output.queue.length, 1)
  assert.equal(output.queue[0].broadcaster_user_id, '999999999')
  assert.equal(output.queue[0].city_review_state, 'needs_review')
  assert.equal('city' in output.queue[0], false)
  assert.equal('countryCode' in output.queue[0], false)
  assert.equal('latitude' in output.queue[0], false)
  assert.equal('longitude' in output.queue[0], false)
  assert.equal(output.semantics.automaticGeographyAcceptance, false)
  assert.equal(output.semantics.cityInferenceAllowed, false)
  assert.equal(output.mutation.d1Writes, 0)
  console.log(JSON.stringify({ ok: true, schemaVersion: output.schemaVersion, reviewedIdentities: output.reviewedCityCatalog.identities }, null, 2))
}

if (process.argv.includes('--self-test')) {
  selfTest()
} else if (import.meta.url === `file://${process.argv[1]}`) {
  const inputPath = process.argv[2]
  const outputPath = process.argv[3]
  if (!inputPath || !outputPath) {
    console.error('usage: node scripts/build-kick-stream-map-city-review-queue.mjs <stable-id-result.json> <city-review-queue.json>')
    process.exit(2)
  }
  const input = JSON.parse(fs.readFileSync(inputPath, 'utf8'))
  const output = buildKickCityReviewQueue(input)
  fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`)
  console.log(JSON.stringify({ ok: true, outputPath, queueRows: output.population.queueRows }, null, 2))
}
