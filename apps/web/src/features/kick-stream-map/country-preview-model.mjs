function object(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {}
}

function rows(value) {
  return Array.isArray(value) ? value : []
}

function text(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function integer(value) {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0
}

function countryCode(value) {
  const code = text(value).toUpperCase()
  return /^[A-Z]{2}$/.test(code) ? code : ''
}

/**
 * Build the Country-only visualization model from the staged Kick Country
 * response contract. This function has no coordinate semantics: it aggregates
 * only reviewed `geography.countryCode` terminal states.
 *
 * `allowGeography` must come from the outer readiness + explicit activation
 * gate. When false, mapped rows are deliberately discarded even if a staged
 * response contains them.
 */
export function buildKickCountryPreviewModel(response, { allowGeography = false } = {}) {
  const source = object(response)
  const provider = text(source.provider).toLowerCase()
  const geographyMode = text(source.geographyMode).toLowerCase()
  if (provider !== 'kick') throw new Error('Kick Country preview requires provider=kick')
  if (geographyMode !== 'country') throw new Error('Kick Country preview requires geographyMode=country')

  const coverage = object(source.coverage)
  const semantics = object(source.semantics)
  const reconciliation = object(coverage.reconciliation)
  const contractSafe = semantics.stableIdentity === 'broadcaster_user_id'
    && semantics.slugIsStableIdentity !== true
    && semantics.twitchEvidenceReuseAllowed !== true
    && semantics.providerAggregationAllowed !== true
    && semantics.automaticGeographyPromotionAllowed !== true
    && semantics.cityInferenceFromCountryAllowed !== true
    && semantics.preciseAddressPublished !== true
    && semantics.coordinatesPublished !== true

  const mapped = allowGeography && contractSafe ? rows(source.mappedStreams) : []
  const countries = new Map()
  const mappedStreams = []

  for (const raw of mapped) {
    const stream = object(raw)
    const geography = object(stream.geography)
    const code = countryCode(geography.countryCode)
    if (!code || text(geography.state) !== 'mapped') continue
    const viewers = integer(stream.viewers)
    const normalized = {
      slug: text(stream.slug).toLowerCase(),
      displayName: text(stream.displayName) || text(stream.slug),
      viewers,
      url: text(stream.url),
      countryCode: code,
    }
    mappedStreams.push(normalized)
    const current = countries.get(code) || { countryCode: code, streams: 0, viewers: 0 }
    current.streams += 1
    current.viewers += viewers
    countries.set(code, current)
  }

  const countryRows = [...countries.values()].sort((a, b) => b.viewers - a.viewers || b.streams - a.streams || a.countryCode.localeCompare(b.countryCode))
  const excludedStreams = integer(coverage.excludedStreams)
  const conflictStreams = integer(coverage.conflictStreams)
  const unmappedStreams = integer(coverage.unmappedStreams)

  return {
    provider: 'kick',
    geographyMode: 'country',
    allowGeography: Boolean(allowGeography),
    contractSafe,
    countryRows,
    mappedStreams,
    accounting: {
      observedStreams: integer(coverage.observedStreams),
      mappedStreams: allowGeography && contractSafe ? mappedStreams.length : 0,
      unmappedStreams,
      excludedStreams,
      conflictStreams,
      reconciliationPasses: reconciliation.passes === true,
    },
    semantics: {
      stableIdentity: 'broadcaster_user_id',
      creatorCoordinatesUsed: false,
      twitchEvidenceReused: false,
      cityInferred: false,
      currentLocationPromoted: false,
    },
  }
}

export function metricBucket(value, max) {
  const safeValue = integer(value)
  const safeMax = integer(max)
  if (safeValue <= 0 || safeMax <= 0) return 0
  const normalized = Math.log1p(safeValue) / Math.log1p(safeMax)
  return Math.max(1, Math.min(5, Math.ceil(normalized * 5)))
}
