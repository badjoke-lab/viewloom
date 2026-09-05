import { buildKickReviewedCountryEvidence } from './kick-stream-map-reviewed-country-evidence-core.mjs'
import { buildKickCountryResponse } from './kick-stream-map-country-response-core.mjs'

/**
 * Compose completed reviewed Kick Country artifacts with a stable-ID-capable
 * snapshot for internal runtime staging only.
 *
 * This core deliberately does not read D1, mutate canonical evidence, authorize
 * public activation, or provide a slug fallback for broadcaster_user_id. The
 * public /api/kick-stream-map route does not import this module.
 */
export function buildKickCountryRuntimeStaging({
  snapshotItems = [],
  reviewResults = [],
  observedAt = null,
} = {}) {
  const reviewedEvidence = buildKickReviewedCountryEvidence(reviewResults)
  const countryResponse = buildKickCountryResponse({
    snapshotItems,
    reviewedEvidence,
    observedAt,
  })

  if (countryResponse.publicActivationAuthorized !== false) {
    throw new Error('kick_country_runtime_staging_public_activation_boundary_failed')
  }

  return {
    schemaVersion: 'viewloom-kick-stream-map-country-runtime-staging-v0.1',
    provider: 'kick',
    publicActivationAuthorized: false,
    reviewedEvidenceCount: reviewedEvidence.length,
    countryResponse,
  }
}
