import { buildKickStreamMapPublicAdapter } from './kick-stream-map-public-adapter-core.mjs'
import {
  KICK_REVIEWED_COUNTRY_RUNTIME_DATA,
  KICK_REVIEWED_COUNTRY_RUNTIME_DATA_VERSION,
} from './kick-stream-map-reviewed-country-runtime-data.mjs'

export const KICK_STREAM_MAP_COUNTRY_RUNTIME_VERSION = 'viewloom-kick-stream-map-country-runtime-v0.1'

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

function buildReviewedEvidenceIndex() {
  const allowedOutcomes = new Set(['accepted', 'excluded_nonperson', 'no_qualifying_evidence', 'conflict_unmapped'])
  const index = new Map()

  for (const row of KICK_REVIEWED_COUNTRY_RUNTIME_DATA) {
    const stableKickUserId = identifier(row?.stableKickUserId)
    const outcome = text(row?.outcome)
    const countryCode = text(row?.countryCode).toUpperCase() || null

    if (!stableKickUserId) throw new Error('kick_reviewed_country_runtime_missing_stable_id')
    if (index.has(stableKickUserId)) throw new Error('kick_reviewed_country_runtime_duplicate_stable_id')
    if (!allowedOutcomes.has(outcome)) throw new Error('kick_reviewed_country_runtime_invalid_outcome')
    if (outcome === 'accepted' && !/^[A-Z]{2}$/.test(countryCode ?? '')) {
      throw new Error('kick_reviewed_country_runtime_invalid_accepted_country')
    }
    if (outcome !== 'accepted' && countryCode !== null) {
      throw new Error('kick_reviewed_country_runtime_nonaccepted_country')
    }

    index.set(stableKickUserId, { outcome, countryCode })
  }

  return index
}

const REVIEWED_EVIDENCE_BY_STABLE_ID = buildReviewedEvidenceIndex()

/**
 * Production K3 Country join.
 *
 * Stable Kick user IDs exist only inside this function's join. Returned rows
 * deliberately omit stable IDs and expose at most reviewed Country terminal
 * state. K4 remains a separate public activation decision.
 */
export function buildKickStreamMapCountryRuntime({
  snapshotItems = [],
  updatedAt = null,
  sourceMode = 'unknown',
} = {}) {
  const base = buildKickStreamMapPublicAdapter({ snapshotItems, updatedAt, sourceMode })
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
        mode: 'country',
        state: 'unmapped',
        reason,
        countryCode: null,
      }))
      continue
    }

    const reviewed = REVIEWED_EVIDENCE_BY_STABLE_ID.get(stableKickUserId)
    if (!reviewed) {
      const reason = 'no_reviewed_kick_evidence'
      incrementReason(unmappedReasons, reason)
      unmappedStreams.push(publicRow(row, {
        mode: 'country',
        state: 'unmapped',
        reason,
        countryCode: null,
      }))
      continue
    }

    reviewedIdentityStreams += 1

    if (reviewed.outcome === 'accepted') {
      mappedStreams.push(publicRow(row, {
        mode: 'country',
        state: 'mapped',
        reason: 'reviewed_country_accepted',
        countryCode: reviewed.countryCode,
      }))
      continue
    }

    if (reviewed.outcome === 'excluded_nonperson') {
      excludedStreams.push(publicRow(row, {
        mode: 'country',
        state: 'excluded',
        reason: 'reviewed_nonperson_exclusion',
        countryCode: null,
      }))
      continue
    }

    if (reviewed.outcome === 'conflict_unmapped') {
      conflictStreams.push(publicRow(row, {
        mode: 'country',
        state: 'conflict',
        reason: 'reviewed_country_conflict',
        countryCode: null,
      }))
      continue
    }

    const reason = 'no_qualifying_reviewed_country'
    incrementReason(unmappedReasons, reason)
    unmappedStreams.push(publicRow(row, {
      mode: 'country',
      state: 'unmapped',
      reason,
      countryCode: null,
    }))
  }

  const observedStreams = base.coverage.observedStreams
  const mappedViewers = sumViewers(mappedStreams)
  const unmappedViewers = sumViewers(unmappedStreams)
  const excludedViewers = sumViewers(excludedStreams)
  const conflictViewers = sumViewers(conflictStreams)
  const reconciledPopulation = mappedStreams.length + unmappedStreams.length + excludedStreams.length + conflictStreams.length
  const mappedCountryCount = new Set(mappedStreams.map((row) => row.geography.countryCode).filter(Boolean)).size
  const stableIdentityComplete = base.identity.missingStableIdentityStreams === 0
  const runtimeReady = observedStreams === 0 || stableIdentityComplete

  return {
    ...base,
    version: KICK_STREAM_MAP_COUNTRY_RUNTIME_VERSION,
    implementationState: 'reviewed_country_runtime_connected',
    state: observedStreams === 0
      ? 'empty'
      : stableIdentityComplete
        ? 'blocked_public_activation'
        : 'blocked_stable_identity',
    coverage: {
      ...base.coverage,
      reviewedEvidenceCatalogSize: KICK_REVIEWED_COUNTRY_RUNTIME_DATA.length,
      reviewedIdentityStreams,
      unreviewedStableIdentityStreams: Math.max(0, base.coverage.stableIdentityStreams - reviewedIdentityStreams),
      mappedStreams: mappedStreams.length,
      mappedViewers,
      mappedCountryCount,
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
      publicCountryActivationReady: runtimeReady,
      blockers: [
        ...(!stableIdentityComplete ? ['production_livestream_snapshot_missing_broadcaster_user_id'] : []),
        'public_country_activation_not_authorized',
      ],
    },
    mappedStreams,
    unmappedStreams,
    excludedStreams,
    conflictStreams,
    semantics: {
      ...base.semantics,
      reviewedEvidenceRuntimeConnected: true,
      reviewedEvidenceDataVersion: KICK_REVIEWED_COUNTRY_RUNTIME_DATA_VERSION,
      stableIdentityPublished: false,
      geographyPayloadAvailableBeforePublicPageActivation: true,
      cityInferenceAllowed: false,
      currentLocationPromotionAllowed: false,
      preciseAddressAllowed: false,
      preciseCoordinatesAllowed: false,
    },
  }
}
