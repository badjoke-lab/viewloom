import { buildKickStreamMapPublicAdapter } from './kick-stream-map-public-adapter-core.mjs'
import {
  KICK_REVIEWED_CITY_RUNTIME_DATA,
  KICK_REVIEWED_CITY_RUNTIME_DATA_VERSION,
} from './kick-stream-map-reviewed-city-runtime-data.mjs'

export const KICK_STREAM_MAP_CITY_RUNTIME_VERSION = 'viewloom-kick-stream-map-city-runtime-v0.1'

const ALLOWED_OUTCOMES = new Set([
  'accepted',
  'no_qualifying_evidence',
  'excluded_nonperson',
  'conflict_unmapped',
])
const ACCEPTED_CLAIM_KINDS = new Set(['home_base', 'declared_location'])

function text(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function identifier(value) {
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return ''
}

function viewers(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.max(0, Math.round(value))
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/,/g, ''))
    return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : 0
  }
  return 0
}

function normalized(value) {
  return text(value)
    .normalize('NFKC')
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

function countryCode(value) {
  const code = text(value).toUpperCase()
  return /^[A-Z]{2}$/.test(code) ? code : null
}

function cityAggregateKey({ countryCode: code, region, city }) {
  return `${code}|${normalized(region) || '__none__'}|${normalized(city)}`
}

function publicRow(row, geography) {
  const slug = text(row?.slug).toLowerCase()
  return {
    slug,
    displayName: text(row?.displayName) || slug,
    viewers: viewers(row?.viewer_count),
    url: text(row?.url) || (slug ? `https://kick.com/${slug}` : ''),
    geography,
  }
}

function sumViewers(rows) {
  return rows.reduce((sum, row) => sum + viewers(row?.viewers), 0)
}

function incrementReason(target, reason) {
  target[reason] = (target[reason] ?? 0) + 1
}

function buildReviewedCityIndex() {
  const index = new Map()

  for (const row of KICK_REVIEWED_CITY_RUNTIME_DATA) {
    const stableKickUserId = identifier(row?.stableKickUserId)
    const outcome = text(row?.outcome)
    const claimKind = row?.claimKind == null ? null : text(row.claimKind)
    const placement = row?.placement ?? null

    if (!stableKickUserId) throw new Error('kick_reviewed_city_runtime_missing_stable_id')
    if (index.has(stableKickUserId)) throw new Error('kick_reviewed_city_runtime_duplicate_stable_id')
    if (!ALLOWED_OUTCOMES.has(outcome)) throw new Error('kick_reviewed_city_runtime_invalid_outcome')

    if (outcome === 'accepted') {
      const code = countryCode(placement?.countryCode)
      const city = text(placement?.city)
      if (!ACCEPTED_CLAIM_KINDS.has(claimKind) || placement?.state !== 'mapped' || !code || !city) {
        throw new Error('kick_reviewed_city_runtime_invalid_accepted_city')
      }
      index.set(stableKickUserId, {
        outcome,
        claimKind,
        placement: {
          countryCode: code,
          region: text(placement?.region) || null,
          city,
        },
      })
      continue
    }

    if (claimKind !== null || placement !== null) {
      throw new Error('kick_reviewed_city_runtime_nonaccepted_placement')
    }
    index.set(stableKickUserId, { outcome, claimKind: null, placement: null })
  }

  return index
}

const REVIEWED_CITY_BY_STABLE_ID = buildReviewedCityIndex()

function buildCityAggregates(mappedStreams) {
  const aggregates = new Map()
  for (const stream of mappedStreams) {
    const key = stream.geography.cityAggregateKey
    const existing = aggregates.get(key)
    if (existing) {
      existing.streams += 1
      existing.viewers += stream.viewers
      continue
    }
    aggregates.set(key, {
      cityAggregateKey: key,
      countryCode: stream.geography.countryCode,
      region: stream.geography.region,
      city: stream.geography.city,
      streams: 1,
      viewers: stream.viewers,
      referenceGeometry: {
        state: 'no_geometry',
        referenceKey: null,
        semantics: 'list_only',
      },
    })
  }

  return [...aggregates.values()].sort(
    (a, b) => b.viewers - a.viewers || a.cityAggregateKey.localeCompare(b.cityAggregateKey),
  )
}

/**
 * KC3 production-connected City join.
 *
 * Stable Kick user IDs are used only for the internal join and are never
 * returned. KC3 exposes reviewed Base City state only when geography=city is
 * explicitly requested. City public activation defaults false. Until KC4
 * reviews aggregate reference geometry, every accepted City remains list-only.
 */
export function buildKickStreamMapCityRuntime({
  snapshotItems = [],
  updatedAt = null,
  sourceMode = 'unknown',
  publicCityActivationAuthorized = false,
} = {}) {
  const activationAuthorized = publicCityActivationAuthorized === true
  const base = buildKickStreamMapPublicAdapter({
    snapshotItems,
    updatedAt,
    sourceMode,
    publicActivationAuthorized: activationAuthorized,
  })
  const rows = Array.isArray(snapshotItems) ? snapshotItems : []
  const mappedStreams = []
  const unmappedStreams = []
  const excludedStreams = []
  const conflictStreams = []
  const unmappedReasons = {}
  let reviewedIdentityStreams = 0

  for (const row of rows) {
    const slug = text(row?.slug).toLowerCase()
    if (!slug) continue

    const stableKickUserId = identifier(row?.broadcaster_user_id)
    if (!stableKickUserId) {
      const reason = 'stable_identity_unavailable'
      incrementReason(unmappedReasons, reason)
      unmappedStreams.push(publicRow(row, {
        mode: 'city',
        state: 'unmapped',
        reason,
        countryCode: null,
        region: null,
        city: null,
        cityAggregateKey: null,
        referenceGeometry: null,
      }))
      continue
    }

    const reviewed = REVIEWED_CITY_BY_STABLE_ID.get(stableKickUserId)
    if (!reviewed) {
      const reason = 'no_reviewed_kick_city_evidence'
      incrementReason(unmappedReasons, reason)
      unmappedStreams.push(publicRow(row, {
        mode: 'city',
        state: 'unmapped',
        reason,
        countryCode: null,
        region: null,
        city: null,
        cityAggregateKey: null,
        referenceGeometry: null,
      }))
      continue
    }

    reviewedIdentityStreams += 1

    if (reviewed.outcome === 'accepted') {
      const placement = reviewed.placement
      const key = cityAggregateKey(placement)
      mappedStreams.push(publicRow(row, {
        mode: 'city',
        state: 'mapped',
        reason: 'reviewed_city_accepted',
        countryCode: placement.countryCode,
        region: placement.region,
        city: placement.city,
        cityAggregateKey: key,
        referenceGeometry: {
          state: 'no_geometry',
          referenceKey: null,
          semantics: 'list_only',
        },
      }))
      continue
    }

    if (reviewed.outcome === 'excluded_nonperson') {
      excludedStreams.push(publicRow(row, {
        mode: 'city',
        state: 'excluded',
        reason: 'reviewed_nonperson_exclusion',
        countryCode: null,
        region: null,
        city: null,
        cityAggregateKey: null,
        referenceGeometry: null,
      }))
      continue
    }

    if (reviewed.outcome === 'conflict_unmapped') {
      conflictStreams.push(publicRow(row, {
        mode: 'city',
        state: 'conflict',
        reason: 'reviewed_city_conflict',
        countryCode: null,
        region: null,
        city: null,
        cityAggregateKey: null,
        referenceGeometry: null,
      }))
      continue
    }

    const reason = 'no_qualifying_reviewed_city'
    incrementReason(unmappedReasons, reason)
    unmappedStreams.push(publicRow(row, {
      mode: 'city',
      state: 'unmapped',
      reason,
      countryCode: null,
      region: null,
      city: null,
      cityAggregateKey: null,
      referenceGeometry: null,
    }))
  }

  const cityAggregates = buildCityAggregates(mappedStreams)
  const observedStreams = base.coverage.observedStreams
  const mappedViewers = sumViewers(mappedStreams)
  const unmappedViewers = sumViewers(unmappedStreams)
  const excludedViewers = sumViewers(excludedStreams)
  const conflictViewers = sumViewers(conflictStreams)
  const reconciledPopulation = mappedStreams.length + unmappedStreams.length + excludedStreams.length + conflictStreams.length
  const stableIdentityComplete = base.identity.missingStableIdentityStreams === 0
  const runtimeReady = observedStreams === 0 || stableIdentityComplete

  return {
    ...base,
    version: KICK_STREAM_MAP_CITY_RUNTIME_VERSION,
    geographyMode: 'city',
    implementationState: 'reviewed_city_runtime_connected',
    publicActivationAuthorized: activationAuthorized,
    publicCityActivationAuthorized: activationAuthorized,
    state: observedStreams === 0
      ? 'empty'
      : !stableIdentityComplete
        ? 'blocked_stable_identity'
        : activationAuthorized
          ? 'ready'
          : 'blocked_public_activation',
    coverage: {
      ...base.coverage,
      reviewedEvidenceCatalogSize: KICK_REVIEWED_CITY_RUNTIME_DATA.length,
      reviewedIdentityStreams,
      unreviewedStableIdentityStreams: Math.max(0, base.coverage.stableIdentityStreams - reviewedIdentityStreams),
      mappedStreams: mappedStreams.length,
      mappedViewers,
      mappedCityAggregateCount: cityAggregates.length,
      referenceGeometryAggregates: 0,
      listOnlyAggregates: cityAggregates.length,
      unmappedStreams: unmappedStreams.length,
      unmappedViewers,
      excludedStreams: excludedStreams.length,
      excludedViewers,
      conflictStreams: conflictStreams.length,
      conflictViewers,
      unmappedReasons,
      reconciliation: {
        selectedPopulation: observedStreams,
        reconciledPopulation,
        passes: reconciledPopulation === observedStreams,
      },
    },
    activation: {
      publicCityActivationReady: runtimeReady,
      blockers: [
        ...(!stableIdentityComplete ? ['production_livestream_snapshot_missing_broadcaster_user_id'] : []),
        ...(!activationAuthorized ? ['public_city_activation_not_authorized'] : []),
      ],
    },
    cityAggregates,
    mappedStreams,
    unmappedStreams,
    excludedStreams,
    conflictStreams,
    semantics: {
      ...base.semantics,
      reviewedCityEvidenceRuntimeConnected: true,
      reviewedCityEvidenceDataVersion: KICK_REVIEWED_CITY_RUNTIME_DATA_VERSION,
      acceptedBaseCityClaimKinds: ['home_base', 'declared_location'],
      stableIdentityPublished: false,
      geographyPayloadAvailableBeforePublicPageActivation: true,
      countryInferenceToCityAllowed: false,
      currentLocationUsedForBaseCity: false,
      temporaryLocationUsedForBaseCity: false,
      preciseAddressAllowed: false,
      creatorCoordinatesAllowed: false,
      reviewedAggregateReferenceOnly: true,
      noGeometryListOnly: true,
    },
  }
}
