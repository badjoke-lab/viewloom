export const KICK_STREAM_MAP_PREVIEW_MODEL_VERSION = 'viewloom-kick-stream-map-ui-preview-v0.1'

function object(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {}
}

function integer(value) {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0
}

function text(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function stringList(value) {
  return Array.isArray(value) ? value.map(text).filter(Boolean) : []
}

/**
 * Read-only UI projection for the pre-public Kick Stream Map surface.
 *
 * This model intentionally exposes readiness/accounting only until BOTH the
 * existing public-readiness contract and a separate public activation decision
 * are true. Payload geography is ignored while either gate is closed so a
 * preview can never turn staged/demo/candidate geography into a public-looking
 * placement by accident.
 */
export function buildKickStreamMapPreviewModel(payload) {
  const source = object(payload)
  const provider = text(source.provider || source.platform).toLowerCase()
  if (provider !== 'kick') throw new Error('Kick Stream Map preview requires provider=kick')

  const geographyMode = text(source.geographyMode || 'country').toLowerCase()
  if (geographyMode !== 'country') throw new Error('Kick Stream Map preview supports Country only')

  const coverage = object(source.coverage)
  const identity = object(source.identity)
  const activation = object(source.activation)
  const publicActivationAuthorized = source.publicActivationAuthorized === true
  const publicCountryActivationReady = activation.publicCountryActivationReady === true
  const canRenderCountryGeography = publicActivationAuthorized && publicCountryActivationReady

  const stableKey = text(identity.stableKey)
  const stableIdentityContractValid = stableKey === 'broadcaster_user_id'
    && identity.slugIsStableIdentity !== true
    && identity.loginDisplayMetadataOnly !== false

  const blockers = stringList(activation.blockers)
  if (!stableIdentityContractValid) blockers.unshift('invalid_stable_identity_contract')
  if (!publicActivationAuthorized && !blockers.includes('public_country_activation_not_authorized')) {
    blockers.push('public_country_activation_not_authorized')
  }

  const unmappedReasons = object(coverage.unmappedReasons)
  const reasonRows = Object.entries(unmappedReasons)
    .map(([reason, count]) => ({ reason: text(reason), count: integer(count) }))
    .filter((row) => row.reason && row.count > 0)
    .sort((a, b) => b.count - a.count || a.reason.localeCompare(b.reason))

  return {
    version: KICK_STREAM_MAP_PREVIEW_MODEL_VERSION,
    provider: 'kick',
    geographyMode: 'country',
    previewOnly: true,
    sourceState: text(source.state) || 'unknown',
    updatedAt: text(source.updatedAt) || null,
    publicActivationAuthorized,
    publicCountryActivationReady,
    canRenderCountryGeography,
    stableIdentityContractValid,
    coverage: {
      observedStreams: integer(coverage.observedStreams),
      observedViewers: integer(coverage.observedViewers),
      stableIdentityStreams: integer(coverage.stableIdentityStreams),
      missingStableIdentityStreams: integer(identity.missingStableIdentityStreams),
      mappedStreams: canRenderCountryGeography ? integer(coverage.mappedStreams) : 0,
      mappedViewers: canRenderCountryGeography ? integer(coverage.mappedViewers) : 0,
      mappedCountryCount: canRenderCountryGeography ? integer(coverage.mappedCountryCount) : 0,
      unmappedStreams: integer(coverage.unmappedStreams),
      unmappedViewers: integer(coverage.unmappedViewers),
      reasonRows,
    },
    blockers: [...new Set(blockers)],
    presentation: canRenderCountryGeography
      ? {
          state: 'country_ready_for_preview',
          heading: 'Country geography ready for gated preview',
          detail: 'Rendering may use only production-connected reviewed Kick Country evidence.',
        }
      : {
          state: 'country_blocked',
          heading: 'Country geography is gated',
          detail: 'The preview may show real accounting/readiness, but it must not render candidate, staged, or demo geography.',
        },
  }
}
