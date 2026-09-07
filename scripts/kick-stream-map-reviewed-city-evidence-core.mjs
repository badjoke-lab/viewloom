const RESULT_SCHEMA_VERSION = 'viewloom-kick-stream-map-city-review-result-v0.1'
const ALLOWED_OUTCOMES = new Set([
  'accepted',
  'no_qualifying_evidence',
  'excluded_nonperson',
  'conflict_unmapped',
])
const ACCEPTED_BASE_CITY_CLAIM_KINDS = new Set(['home_base', 'declared_location'])

function clean(value) {
  return typeof value === 'string' ? value.trim() : String(value ?? '').trim()
}

function stableId(value) {
  const text = clean(value)
  return text || null
}

function countryCode(value) {
  const text = clean(value).toUpperCase()
  return /^[A-Z]{2}$/.test(text) ? text : null
}

/**
 * Convert completed, manually reviewed Kick City result artifacts into the
 * narrow terminal shape reserved for future City runtime use.
 *
 * This bridge deliberately drops slug, source URLs, research prose and all
 * unaccepted location claims. broadcaster_user_id is the only runtime identity
 * key. It does not connect City to production and does not authorize City UI.
 */
export function buildKickReviewedCityEvidence(results = []) {
  const evidence = []
  const seenStableIds = new Set()

  for (const result of Array.isArray(results) ? results : []) {
    if (result?.schemaVersion !== RESULT_SCHEMA_VERSION) {
      throw new Error('unsupported_kick_city_review_result')
    }
    if (result?.completed !== true || result?.reviewMode !== 'manual_bounded_city_review') {
      throw new Error('kick_city_review_not_completed')
    }
    if (result?.providerRequests !== 0 || result?.canonicalMutationApplied !== false || result?.productionDeployment !== false) {
      throw new Error('kick_city_review_safety_boundary_failed')
    }
    if (result?.constraints?.countryOnlyPromotionAllowed !== false
      || result?.constraints?.currentLocationAllowedForBaseCity !== false
      || result?.constraints?.temporaryLocationAllowedForBaseCity !== false
      || result?.constraints?.creatorCoordinatesAllowed !== false
      || result?.constraints?.twitchEvidenceReuseAllowed !== false
      || result?.constraints?.automaticRuntimePromotion !== false) {
      throw new Error('kick_city_review_semantic_boundary_failed')
    }

    for (const row of Array.isArray(result?.identities) ? result.identities : []) {
      const id = stableId(row?.broadcasterUserId)
      if (!id) throw new Error('kick_city_review_missing_stable_identity')
      if (seenStableIds.has(id)) throw new Error(`kick_city_review_duplicate_stable_identity:${id}`)
      seenStableIds.add(id)

      const outcome = clean(row?.outcome)
      if (!ALLOWED_OUTCOMES.has(outcome)) throw new Error(`kick_city_review_invalid_outcome:${id}`)

      let claimKind = null
      let placement = null
      if (outcome === 'accepted') {
        const code = countryCode(row?.placement?.countryCode)
        const region = clean(row?.placement?.region) || null
        const city = clean(row?.placement?.city)
        const acceptedEvidence = (Array.isArray(row?.evidence) ? row.evidence : []).find((item) => {
          const evidenceKind = clean(item?.claimKind)
          return ACCEPTED_BASE_CITY_CLAIM_KINDS.has(evidenceKind)
            && countryCode(item?.countryCode) === code
            && clean(item?.city) === city
        })
        claimKind = clean(acceptedEvidence?.claimKind)

        if (row?.placement?.state !== 'mapped' || !code || !city || !ACCEPTED_BASE_CITY_CLAIM_KINDS.has(claimKind)) {
          throw new Error(`kick_city_review_invalid_accepted_placement:${id}`)
        }

        placement = {
          state: 'mapped',
          countryCode: code,
          region,
          city,
        }
      } else {
        if (row?.placement !== null) throw new Error(`kick_city_review_nonaccepted_placement:${id}`)
        if ((Array.isArray(row?.evidence) ? row.evidence : []).some((item) => ACCEPTED_BASE_CITY_CLAIM_KINDS.has(clean(item?.claimKind)))) {
          throw new Error(`kick_city_review_nonaccepted_contains_accepted_evidence:${id}`)
        }
      }

      evidence.push({
        provider: 'kick',
        stableKickUserId: id,
        outcome,
        claimKind,
        placement,
      })
    }
  }

  return evidence
}
