export const KICK_STREAM_MAP_PUBLIC_ADAPTER_VERSION = 'viewloom-kick-stream-map-public-adapter-v0.1'

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

function ratio(numerator, denominator) {
  return denominator > 0 ? Number((numerator / denominator).toFixed(6)) : 0
}

/**
 * Public, fail-closed projection for the current Kick Stream Map runtime path.
 *
 * The adapter deliberately does not map geography yet. A retained
 * broadcaster_user_id is only identity readiness; it is never treated as
 * reviewed location evidence. Slug/display metadata is never promoted to a
 * stable identity or geography signal.
 */
export function buildKickStreamMapPublicAdapter({ snapshotItems = [], updatedAt = null, sourceMode = 'unknown' } = {}) {
  const rows = Array.isArray(snapshotItems) ? snapshotItems : []
  const normalized = rows.map((row) => {
    const slug = text(row?.slug).toLowerCase()
    const stableKickUserId = identifier(row?.broadcaster_user_id)
    const viewerCount = viewers(row?.viewer_count)
    return {
      slug,
      displayName: text(row?.displayName) || slug,
      viewers: viewerCount,
      url: text(row?.url) || (slug ? `https://kick.com/${slug}` : ''),
      stableIdentityAvailable: stableKickUserId.length > 0,
    }
  }).filter((row) => row.slug.length > 0)

  const observedStreams = normalized.length
  const observedViewers = normalized.reduce((sum, row) => sum + row.viewers, 0)
  const stableIdentityStreams = normalized.filter((row) => row.stableIdentityAvailable).length
  const stableIdentityViewers = normalized
    .filter((row) => row.stableIdentityAvailable)
    .reduce((sum, row) => sum + row.viewers, 0)
  const missingStableIdentityStreams = observedStreams - stableIdentityStreams
  const reviewedEvidenceUnavailableStreams = stableIdentityStreams

  const unmappedReasons = {}
  if (missingStableIdentityStreams > 0) unmappedReasons.stable_identity_unavailable = missingStableIdentityStreams
  if (reviewedEvidenceUnavailableStreams > 0) unmappedReasons.reviewed_evidence_unavailable = reviewedEvidenceUnavailableStreams

  const identityCoverageState = observedStreams === 0
    ? 'empty'
    : stableIdentityStreams === 0
      ? 'unavailable'
      : stableIdentityStreams === observedStreams
        ? 'observed'
        : 'partial'

  const state = observedStreams === 0
    ? 'empty'
    : stableIdentityStreams === 0
      ? 'blocked_stable_identity'
      : 'blocked_reviewed_evidence'

  return {
    version: KICK_STREAM_MAP_PUBLIC_ADAPTER_VERSION,
    platform: 'kick',
    provider: 'kick',
    source: 'real',
    sourceMode: text(sourceMode) || 'unknown',
    geographyMode: 'country',
    implementationState: 'public_adapter_staged',
    publicActivationAuthorized: false,
    state,
    updatedAt: text(updatedAt) || null,
    coverage: {
      observedStreams,
      observedViewers,
      stableIdentityStreams,
      stableIdentityViewers,
      stableIdentityPercent: ratio(stableIdentityStreams, observedStreams),
      mappedStreams: 0,
      mappedViewers: 0,
      mappedCountryCount: 0,
      unmappedStreams: observedStreams,
      unmappedViewers: observedViewers,
      unmappedReasons,
    },
    identity: {
      stableKey: 'broadcaster_user_id',
      stableIdentityCoverageState: identityCoverageState,
      stableIdentityStreams,
      missingStableIdentityStreams,
      slugIsStableIdentity: false,
      loginDisplayMetadataOnly: true,
    },
    activation: {
      publicCountryActivationReady: false,
      blockers: [
        ...(missingStableIdentityStreams > 0 ? ['production_livestream_snapshot_missing_broadcaster_user_id'] : []),
        'reviewed_kick_country_evidence_runtime_not_connected',
        'public_country_activation_not_authorized',
      ],
    },
    mappedStreams: [],
    unmappedStreams: normalized.map((row) => ({
      slug: row.slug,
      displayName: row.displayName,
      viewers: row.viewers,
      url: row.url,
      reason: row.stableIdentityAvailable ? 'reviewed_evidence_unavailable' : 'stable_identity_unavailable',
    })),
    semantics: {
      stableIdentity: 'broadcaster_user_id',
      slugIsStableIdentity: false,
      twitchEvidenceReuseAllowed: false,
      twitchCreatorKeyReuseAllowed: false,
      providerAggregationAllowed: false,
      automaticGeographyPromotionAllowed: false,
      cityInferenceAllowed: false,
      currentLocationPromotionAllowed: false,
      preciseAddressAllowed: false,
      preciseCoordinatesAllowed: false,
      geographyPublishedWhileActivationBlocked: false,
    },
  }
}
