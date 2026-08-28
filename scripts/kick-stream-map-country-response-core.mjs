import { deriveKickCountrySnapshotStates } from './kick-stream-map-country-snapshot-adapter-core.mjs'

function clean(value) {
  return typeof value === 'string' ? value.trim() : String(value ?? '').trim()
}

function slug(value) {
  return clean(value).toLowerCase()
}

function viewers(value) {
  const number = Number(value)
  return Number.isFinite(number) ? Math.max(0, Math.round(number)) : 0
}

function stableId(value) {
  const text = clean(value)
  return text || null
}

export function buildKickCountryResponse({ snapshotItems = [], reviewedEvidence = [], observedAt = null } = {}) {
  const normalizedItems = snapshotItems
    .map((item, index) => ({
      index,
      slug: slug(item?.slug ?? item?.channel?.slug),
      displayName: clean(item?.displayName ?? item?.name ?? item?.username ?? item?.slug ?? item?.channel?.slug),
      viewers: viewers(item?.viewer_count ?? item?.viewers),
      url: clean(item?.url),
      broadcaster_user_id: stableId(item?.broadcaster_user_id),
    }))
    .filter((item) => item.slug)

  const states = deriveKickCountrySnapshotStates({ snapshotItems: normalizedItems, reviewedEvidence })
  const queues = new Map()
  for (const state of states) {
    const key = slug(state.slug)
    const queue = queues.get(key) ?? []
    queue.push(state)
    queues.set(key, queue)
  }

  const rows = normalizedItems.map((item) => {
    const queue = queues.get(item.slug) ?? []
    const state = queue.shift() ?? {
      provider: 'kick',
      slug: item.slug,
      stableKickUserId: item.broadcaster_user_id,
      state: 'unmapped',
      reason: 'adapter_state_unavailable',
      placement: null,
    }
    queues.set(item.slug, queue)
    return {
      provider: 'kick',
      slug: item.slug,
      displayName: item.displayName || item.slug,
      viewers: item.viewers,
      url: item.url || `https://kick.com/${item.slug}`,
      identity: {
        provider: 'kick',
        slug: item.slug,
        stableKickUserId: state.stableKickUserId,
        stableIdAvailable: Boolean(state.stableKickUserId),
        slugIsStableIdentity: false,
      },
      geography: {
        mode: 'country',
        state: state.state,
        reason: state.reason,
        countryCode: state.placement?.countryCode ?? null,
      },
    }
  })

  const mappedStreams = rows.filter((row) => row.geography.state === 'mapped')
  const unmappedStreams = rows.filter((row) => row.geography.state === 'unmapped')
  const excludedStreams = rows.filter((row) => row.geography.state === 'excluded')
  const conflictStreams = rows.filter((row) => row.geography.state === 'conflict')
  const observedStreams = rows.length
  const observedViewers = rows.reduce((sum, row) => sum + row.viewers, 0)
  const mappedViewers = mappedStreams.reduce((sum, row) => sum + row.viewers, 0)
  const unmappedViewers = unmappedStreams.reduce((sum, row) => sum + row.viewers, 0)
  const excludedViewers = excludedStreams.reduce((sum, row) => sum + row.viewers, 0)
  const conflictViewers = conflictStreams.reduce((sum, row) => sum + row.viewers, 0)

  return {
    version: 'viewloom-kick-stream-map-country-response-v0.1',
    provider: 'kick',
    geographyMode: 'country',
    observedAt: clean(observedAt) || null,
    publicActivationAuthorized: false,
    mappedStreams,
    unmappedStreams,
    excludedStreams,
    conflictStreams,
    coverage: {
      observedStreams,
      observedViewers,
      mappedStreams: mappedStreams.length,
      mappedViewers,
      unmappedStreams: unmappedStreams.length,
      unmappedViewers,
      excludedStreams: excludedStreams.length,
      excludedViewers,
      conflictStreams: conflictStreams.length,
      conflictViewers,
      streamCoverage: observedStreams ? Number((mappedStreams.length / observedStreams).toFixed(6)) : 0,
      viewerCoverage: observedViewers ? Number((mappedViewers / observedViewers).toFixed(6)) : 0,
      reconciliation: {
        selectedPopulation: observedStreams,
        reconciledPopulation: mappedStreams.length + unmappedStreams.length + excludedStreams.length + conflictStreams.length,
        passes: mappedStreams.length + unmappedStreams.length + excludedStreams.length + conflictStreams.length === observedStreams,
      },
    },
    semantics: {
      stableIdentity: 'broadcaster_user_id',
      slugIsStableIdentity: false,
      twitchEvidenceReuseAllowed: false,
      providerAggregationAllowed: false,
      automaticGeographyPromotionAllowed: false,
      cityInferenceFromCountryAllowed: false,
      currentLocationUsedForBasePlacement: false,
      preciseAddressPublished: false,
      coordinatesPublished: false,
    },
  }
}
