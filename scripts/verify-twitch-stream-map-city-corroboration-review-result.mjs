import fs from 'node:fs'
import { TWITCH_REVIEWED_LOCATION_RECORDS } from '../apps/web/functions/api/twitch-stream-map-reviewed-evidence.mjs'

const queuePath = 'docs/audits/twitch-stream-map-city-corroboration-queue-2026-08-28.json'
const resultPath = 'docs/audits/twitch-stream-map-city-corroboration-review-result-2026-08-29.json'
const queue = JSON.parse(fs.readFileSync(queuePath, 'utf8'))
const result = JSON.parse(fs.readFileSync(resultPath, 'utf8'))

const BASE_CLAIMS = new Set(['home_base', 'declared_location'])
const ALLOWED_CANONICAL_SOURCES = new Set(['official_external', 'manual_review'])
const EXPECTED_CORROBORATED = new Set(['adinross', 'cinna', 'ddg', 'ibai', 'jasontheween', 'lacy', 'papaplatte', 'ramzes'])
const EXPECTED_UNRESOLVED = new Set(['fps_shaka', 'knirpz', 'shotzzy', 'xqc'])
const FORBIDDEN_KEYS = new Set([
  'address', 'street', 'streetaddress', 'postalcode', 'zipcode', 'coordinates', 'coordinate',
  'latitude', 'longitude', 'lat', 'lng', 'lon', 'rawtext', 'rawtitle', 'rawtags', 'quote', 'quotation',
])

assert(result.schemaVersion === 'viewloom-twitch-stream-map-city-corroboration-review-result-v0.1', 'bad_schema')
assert(result.provider === 'twitch', 'bad_provider')
assert(result.geographyLayer === 'base_city', 'bad_geography_layer')
assert(result.reviewedAgainst === queuePath, 'bad_reviewed_against')
assert(validIso(result.reviewObservedAt), 'bad_review_observed_at')
assert(result.canonicalMutationAuthorized === false, 'canonical_mutation_must_be_false')
assert(result.publicActivationAuthorized === false, 'public_activation_must_be_false')
assert(result.productionDeploymentAuthorized === false, 'production_deployment_must_be_false')

const queueEntries = Array.isArray(queue.entries) ? queue.entries : []
const resultEntries = Array.isArray(result.entries) ? result.entries : []
assert(queueEntries.length === 12, `unexpected_queue_size:${queueEntries.length}`)
assert(resultEntries.length === queueEntries.length, 'result_queue_size_mismatch')

const queueByLogin = uniqueByLogin(queueEntries, 'queue')
const resultByLogin = uniqueByLogin(resultEntries, 'result')
assertSameSet(new Set(queueByLogin.keys()), new Set(resultByLogin.keys()), 'queue_result_login_set_mismatch')

const reviewedByLogin = new Map(TWITCH_REVIEWED_LOCATION_RECORDS.map((record) => [norm(record.streamerLogin), record]))
let corroborated = 0
let unresolved = 0
let conflicts = 0
const actualCorroborated = new Set()
const actualUnresolved = new Set()

for (const [login, queueEntry] of queueByLogin) {
  const row = resultByLogin.get(login)
  assert(row, `missing_result:${login}`)
  assert(norm(row.streamerLogin) === login, `login_mismatch:${login}`)
  assert(upper(row.countryCode) === upper(queueEntry.countryCode), `country_mismatch:${login}`)
  assert(clean(row.region) === clean(queueEntry.region), `region_mismatch:${login}`)
  assert(clean(row.city) === clean(queueEntry.city), `city_mismatch:${login}`)

  const primaryRecord = reviewedByLogin.get(login)
  assert(primaryRecord, `missing_primary_reviewed_record:${login}`)
  const primaryBaseUrls = new Set((primaryRecord.evidences ?? [])
    .filter((evidence) => evidence?.status === 'accepted' && BASE_CLAIMS.has(clean(evidence?.claimKind)))
    .map((evidence) => clean(evidence?.sourceUrl))
    .filter(Boolean))
  assert(primaryBaseUrls.size >= 1, `missing_primary_base_source:${login}`)

  if (row.outcome === 'corroborated_secondary_base_evidence') {
    corroborated += 1
    actualCorroborated.add(login)
    assert(BASE_CLAIMS.has(clean(row.claimKind)), `bad_claim_kind:${login}`)
    assert(ALLOWED_CANONICAL_SOURCES.has(clean(row.proposedCanonicalSource)), `bad_proposed_source:${login}`)
    assert(clean(row.basis), `missing_basis:${login}`)
    const sourceUrls = Array.isArray(row.sourceUrls) ? row.sourceUrls.map(clean).filter(Boolean) : []
    assert(sourceUrls.length >= 1, `missing_secondary_source:${login}`)
    assert(new Set(sourceUrls).size === sourceUrls.length, `duplicate_secondary_source:${login}`)
    for (const url of sourceUrls) {
      assert(url.startsWith('https://'), `non_https_source:${login}`)
      assert(!primaryBaseUrls.has(url), `secondary_reuses_primary_source:${login}`)
    }
  } else if (row.outcome === 'no_qualifying_secondary_evidence') {
    unresolved += 1
    actualUnresolved.add(login)
    assert(clean(row.reason), `missing_unresolved_reason:${login}`)
    assert(!('sourceUrls' in row), `unresolved_must_not_publish_source_urls:${login}`)
    assert(!('claimKind' in row), `unresolved_must_not_claim_base:${login}`)
    assert(!('proposedCanonicalSource' in row), `unresolved_must_not_propose_canonical_source:${login}`)
  } else if (row.outcome === 'conflict_unmapped') {
    conflicts += 1
    throw new Error(`unexpected_conflict_in_review_result:${login}`)
  } else {
    throw new Error(`unknown_outcome:${login}:${row.outcome}`)
  }
}

assertSameSet(actualCorroborated, EXPECTED_CORROBORATED, 'corroborated_set_changed')
assertSameSet(actualUnresolved, EXPECTED_UNRESOLVED, 'unresolved_set_changed')
assert(result.summary?.reviewed === resultEntries.length, 'summary_reviewed_mismatch')
assert(result.summary?.corroboratedSecondaryBaseEvidence === corroborated, 'summary_corroborated_mismatch')
assert(result.summary?.noQualifyingSecondaryEvidence === unresolved, 'summary_unresolved_mismatch')
assert(result.summary?.conflicts === conflicts, 'summary_conflict_mismatch')
assert(corroborated === 8, `unexpected_corroborated_count:${corroborated}`)
assert(unresolved === 4, `unexpected_unresolved_count:${unresolved}`)
assert(conflicts === 0, `unexpected_conflicts:${conflicts}`)

assert(result.safety?.rawQuoteStored === false, 'raw_quote_must_be_false')
assert(result.safety?.preciseAddressStored === false, 'precise_address_must_be_false')
assert(result.safety?.coordinatesStored === false, 'coordinates_must_be_false')
assert(result.safety?.currentLocationUsedForBase === false, 'current_to_base_must_be_false')
assert(result.safety?.countryUsedToInferCity === false, 'country_to_city_must_be_false')
assert(result.safety?.automaticCanonicalPromotion === false, 'auto_promotion_must_be_false')
assert(result.safety?.twitchKickAggregation === false, 'aggregation_must_be_false')

const forbidden = new Set()
collectForbiddenKeys(result, forbidden)
assert(forbidden.size === 0, `forbidden_keys:${[...forbidden].sort().join(',')}`)

process.stdout.write(`${JSON.stringify({
  ok: true,
  reviewed: resultEntries.length,
  corroboratedSecondaryBaseEvidence: corroborated,
  noQualifyingSecondaryEvidence: unresolved,
  conflicts,
  corroborated: [...actualCorroborated].sort(),
  unresolved: [...actualUnresolved].sort(),
  canonicalMutationAuthorized: result.canonicalMutationAuthorized,
  publicActivationAuthorized: result.publicActivationAuthorized,
  productionDeploymentAuthorized: result.productionDeploymentAuthorized,
}, null, 2)}\n`)

function uniqueByLogin(entries, label) {
  const map = new Map()
  for (const entry of entries) {
    const login = norm(entry?.streamerLogin)
    assert(login, `missing_login:${label}`)
    assert(!map.has(login), `duplicate_login:${label}:${login}`)
    map.set(login, entry)
  }
  return map
}

function assertSameSet(actual, expected, message) {
  const left = [...actual].sort().join('|')
  const right = [...expected].sort().join('|')
  assert(left === right, `${message}:${left}:${right}`)
}

function collectForbiddenKeys(value, found) {
  if (Array.isArray(value)) {
    for (const item of value) collectForbiddenKeys(item, found)
    return
  }
  if (!value || typeof value !== 'object') return
  for (const [key, child] of Object.entries(value)) {
    const normalized = key.toLowerCase().replace(/[^a-z]/g, '')
    if (FORBIDDEN_KEYS.has(normalized)) found.add(key)
    collectForbiddenKeys(child, found)
  }
}

function validIso(value) {
  return typeof value === 'string' && Number.isFinite(Date.parse(value))
}

function norm(value) {
  return clean(value).toLowerCase()
}

function upper(value) {
  return clean(value).toUpperCase()
}

function clean(value) {
  return typeof value === 'string' ? value.trim() : value == null ? '' : String(value).trim()
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}
