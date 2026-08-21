import assert from 'node:assert/strict'
import { evaluateLocationPlacementEligibility } from './location-placement-eligibility.mjs'

assert.deepEqual(evaluateLocationPlacementEligibility({
  entityKind: 'person',
  claimKind: 'declared_location',
  evidenceSource: 'official_external',
  confidence: 'explicit',
}), {
  placementEligible: true,
  reason: 'person_with_reviewable_place_claim',
})

assert.deepEqual(evaluateLocationPlacementEligibility({
  entityKind: 'person',
  claimKind: 'birthplace',
  evidenceSource: 'official_external',
  confidence: 'explicit',
}), {
  placementEligible: false,
  reason: 'context_only_claim',
})

assert.deepEqual(evaluateLocationPlacementEligibility({
  entityKind: 'event_broadcast',
  claimKind: 'event_venue',
  evidenceSource: 'official_external',
  confidence: 'explicit',
}), {
  placementEligible: false,
  reason: 'entity_kind_not_placeable',
})

assert.deepEqual(evaluateLocationPlacementEligibility({
  entityKind: 'organization',
  claimKind: 'organization_headquarters',
  evidenceSource: 'manual_review',
  confidence: 'reviewed',
}), {
  placementEligible: false,
  reason: 'entity_kind_not_placeable',
})

assert.deepEqual(evaluateLocationPlacementEligibility({
  entityKind: 'person',
  claimKind: 'declared_location',
  evidenceSource: 'account_profile',
  confidence: 'candidate_only',
}), {
  placementEligible: false,
  reason: 'candidate_only',
})

assert.equal(evaluateLocationPlacementEligibility({
  entityKind: 'person',
  claimKind: 'current_location',
  evidenceSource: 'stream_title',
  confidence: 'reviewed',
}).placementEligible, true)

assert.equal(evaluateLocationPlacementEligibility({
  entityKind: 'person',
  claimKind: 'nationality',
  evidenceSource: 'manual_review',
  confidence: 'reviewed',
}).placementEligible, false)

console.log('location placement eligibility tests passed')
