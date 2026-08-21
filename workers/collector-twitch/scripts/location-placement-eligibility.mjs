export const LOCATION_ENTITY_KINDS = [
  'person',
  'organization',
  'event_broadcast',
  'unknown',
]

export const LOCATION_CLAIM_KINDS = [
  'home_base',
  'declared_location',
  'current_location',
  'birthplace',
  'event_venue',
  'organization_headquarters',
  'nationality',
]

export const LOCATION_EVIDENCE_SOURCES = [
  'account_profile',
  'stream_title',
  'stream_tag',
  'channel_profile',
  'official_external',
  'manual_review',
]

export const LOCATION_EVIDENCE_CONFIDENCE = [
  'candidate_only',
  'explicit',
  'corroborated',
  'reviewed',
]

const PLACEABLE_CLAIMS = new Set([
  'home_base',
  'declared_location',
  'current_location',
])

/**
 * Placement eligibility is intentionally stricter than candidate extraction.
 * A location-like string may be retained as evidence without becoming a map point.
 */
export function evaluateLocationPlacementEligibility(input) {
  const entityKind = String(input?.entityKind ?? '')
  const claimKind = String(input?.claimKind ?? '')
  const evidenceSource = String(input?.evidenceSource ?? '')
  const confidence = String(input?.confidence ?? '')

  if (!LOCATION_ENTITY_KINDS.includes(entityKind)) {
    return { placementEligible: false, reason: 'unknown_entity_kind' }
  }
  if (!LOCATION_CLAIM_KINDS.includes(claimKind)) {
    return { placementEligible: false, reason: 'unknown_claim_kind' }
  }
  if (!LOCATION_EVIDENCE_SOURCES.includes(evidenceSource)) {
    return { placementEligible: false, reason: 'unsupported_evidence_source' }
  }
  if (!LOCATION_EVIDENCE_CONFIDENCE.includes(confidence)) {
    return { placementEligible: false, reason: 'unknown_confidence' }
  }
  if (entityKind !== 'person') {
    return { placementEligible: false, reason: 'entity_kind_not_placeable' }
  }
  if (!PLACEABLE_CLAIMS.has(claimKind)) {
    return { placementEligible: false, reason: 'context_only_claim' }
  }
  if (confidence === 'candidate_only') {
    return { placementEligible: false, reason: 'candidate_only' }
  }

  return { placementEligible: true, reason: 'person_with_reviewable_place_claim' }
}
