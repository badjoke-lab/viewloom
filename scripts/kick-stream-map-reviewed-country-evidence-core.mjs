const RESULT_SCHEMA_VERSION = 'viewloom-kick-stream-map-country-review-result-v0.1'
const ALLOWED_OUTCOMES = new Set([
  'accepted',
  'no_qualifying_evidence',
  'excluded_nonperson',
  'conflict_unmapped',
])

function stableId(value) {
  const text = String(value ?? '').trim()
  return text || null
}

function countryCode(value) {
  const text = String(value ?? '').trim().toUpperCase()
  return /^[A-Z]{2}$/.test(text) ? text : null
}

/**
 * Convert completed, manually reviewed Kick Country result artifacts into the
 * narrow reviewedEvidence shape consumed by the staged Country response core.
 *
 * The bridge deliberately drops slug, viewer counts, raw profile text and all
 * location detail beyond reviewed Country. broadcaster_user_id is the only
 * runtime identity key. This module does not authorize public activation.
 */
export function buildKickReviewedCountryEvidence(results = []) {
  const evidence = []
  const seenStableIds = new Set()

  for (const result of Array.isArray(results) ? results : []) {
    if (result?.schemaVersion !== RESULT_SCHEMA_VERSION) {
      throw new Error('unsupported_kick_country_review_result')
    }
    if (result?.completed !== true || result?.reviewMode !== 'manual_bounded_review') {
      throw new Error('kick_country_review_not_completed')
    }
    if (result?.providerRequests !== 0 || result?.canonicalMutationApplied !== false || result?.productionDeployment !== false) {
      throw new Error('kick_country_review_safety_boundary_failed')
    }

    for (const row of Array.isArray(result?.identities) ? result.identities : []) {
      const id = stableId(row?.broadcasterUserId)
      if (!id) throw new Error('kick_country_review_missing_stable_identity')
      if (seenStableIds.has(id)) throw new Error(`kick_country_review_duplicate_stable_identity:${id}`)
      seenStableIds.add(id)

      const outcome = String(row?.outcome ?? '')
      if (!ALLOWED_OUTCOMES.has(outcome)) throw new Error(`kick_country_review_invalid_outcome:${id}`)

      let placement = null
      if (outcome === 'accepted') {
        const code = countryCode(row?.placement?.countryCode)
        if (row?.placement?.state !== 'mapped' || !code) {
          throw new Error(`kick_country_review_invalid_accepted_placement:${id}`)
        }
        placement = { state: 'mapped', countryCode: code }
      } else if (row?.placement !== null) {
        throw new Error(`kick_country_review_nonaccepted_placement:${id}`)
      }

      evidence.push({
        provider: 'kick',
        stableKickUserId: id,
        outcome,
        placement,
      })
    }
  }

  return evidence
}
