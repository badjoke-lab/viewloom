import {
  CURRENT_ACCEPTED_EVIDENCE_CLASSES,
  CURRENT_DEFAULT_OPEN_ENDED_TTL_HOURS,
} from '../../workers/collector-twitch/scripts/current-location-evidence-eligibility.mjs'

const MAX_LOOKUPS_PER_IDENTITY = CURRENT_ACCEPTED_EVIDENCE_CLASSES.length
const TEMPORARY_MAX_DAYS = 14

const SOURCE_PURPOSE = Object.freeze({
  self_controlled_current_statement: 'creator-controlled public source explicitly stating present location',
  official_affiliated_current_statement: 'official affiliated source explicitly placing the creator at a current location',
  attributable_editorial_current_statement: 'dated attributable editorial source explicitly placing the creator at a current location',
  reviewed_direct_self_statement_transcript: 'reviewable attributable transcript of a direct self-statement explicitly stating present location',
})

function clean(value) {
  return typeof value === 'string' ? value.trim() : String(value ?? '').trim()
}

function iso(value) {
  const date = new Date(value)
  return Number.isFinite(date.getTime()) ? date.toISOString() : null
}

function addHours(value, hours) {
  const date = new Date(value)
  return new Date(date.getTime() + hours * 60 * 60 * 1000).toISOString()
}

export function buildCurrentTemporalEvidenceAcquisitionQueue(reviewBatch, { createdAt } = {}) {
  const created = iso(createdAt ?? new Date().toISOString())
  if (!created) throw new Error('invalid_created_at')
  if (reviewBatch?.provider !== 'twitch' || reviewBatch?.layer !== 'current') {
    throw new Error('invalid_review_batch_scope')
  }

  const entries = Array.isArray(reviewBatch?.entries) ? reviewBatch.entries : []
  const identities = []
  const lookupTasks = []
  const seenIds = new Set()

  for (const entry of entries) {
    const twitchUserId = clean(entry?.twitchUserId)
    const userLogin = clean(entry?.userLogin).toLowerCase()
    const countryCode = clean(entry?.candidate?.countryCode).toUpperCase()
    const countryName = clean(entry?.candidate?.countryName) || countryCode
    const city = clean(entry?.candidate?.city) || null

    if (!twitchUserId || !userLogin || !/^[A-Z]{2}$/.test(countryCode)) {
      throw new Error(`invalid_identity_or_candidate:${userLogin || twitchUserId || 'unknown'}`)
    }
    if (seenIds.has(twitchUserId)) throw new Error(`duplicate_twitch_user_id:${twitchUserId}`)
    seenIds.add(twitchUserId)

    identities.push({ twitchUserId, userLogin, candidate: { countryCode, countryName, city } })

    for (const sourceClass of CURRENT_ACCEPTED_EVIDENCE_CLASSES) {
      lookupTasks.push({
        taskId: `${twitchUserId}:${sourceClass}`,
        twitchUserId,
        userLogin,
        candidate: { countryCode, countryName, city },
        sourceClass,
        purpose: SOURCE_PURPOSE[sourceClass],
        reviewRequired: true,
        automaticAcceptanceAuthorized: false,
      })
    }
  }

  return {
    schemaVersion: 'viewloom-twitch-stream-map-current-temporal-evidence-acquisition-queue-v0.1',
    provider: 'twitch',
    layer: 'current',
    createdAt: created,
    reviewWindowExpiresAt: addHours(created, 24),
    acceptedEvidenceClasses: [...CURRENT_ACCEPTED_EVIDENCE_CLASSES],
    identities,
    lookupTasks,
    summary: {
      identities: identities.length,
      acceptedEvidenceClasses: CURRENT_ACCEPTED_EVIDENCE_CLASSES.length,
      lookupTasks: lookupTasks.length,
      maxLookupsPerIdentity: MAX_LOOKUPS_PER_IDENTITY,
      maxExternalLookups: identities.length * MAX_LOOKUPS_PER_IDENTITY,
      providerRequests: 0,
    },
    freshness: {
      openEndedCurrentTtlHours: CURRENT_DEFAULT_OPEN_ENDED_TTL_HOURS,
      temporaryMaxDays: TEMPORARY_MAX_DAYS,
      evidenceMustBeFreshAtReview: true,
    },
    boundary: {
      candidateTitleOrTagCanQualify: false,
      profileBaseContextCanQualifyWithoutCurrentTimeMeaning: false,
      plannedFutureTravelCanQualify: false,
      searchSnippetCanQualify: false,
      automaticAcceptanceAuthorized: false,
      publicCurrentPlacementAuthorized: false,
      baseMutationAuthorized: false,
      rawTitleTagLanguageRetained: false,
      preciseLocationAllowed: false,
      twitchKickAggregationAuthorized: false,
    },
  }
}
