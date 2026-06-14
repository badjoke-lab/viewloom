import { summarizeActivity } from './data-state-activity.mjs'
import {
  ageMinutes,
  asRecord,
  firstBoolean,
  firstFinite,
  firstNullableFinite,
  firstString,
  normalizeCoverage,
  normalizeExplicitState,
  normalizeSourceMode,
  parsePayload,
  sourceLabel,
} from './data-state-utils.mjs'

const DEFAULTS = {
  twitch: { label: 'Twitch', limit: 300, method: 'Authenticated API' },
  kick: { label: 'Kick', limit: 100, method: 'Public listing' },
}
const LABELS = { loading: 'Loading', fresh: 'Fresh', stale: 'Stale', partial: 'Partial', empty: 'Empty', error: 'Error', demo: 'Demo' }

export function normalizeHeatmapDataTruth(raw, providerKey, nowMs = Date.now()) {
  const provider = providerKey === 'kick' ? DEFAULTS.kick : DEFAULTS.twitch
  const root = asRecord(raw) || {}
  const latest = asRecord(root.latest)
  const status = asRecord(root.status)
  const payload = latest ? parsePayload(latest.payload_json) : root
  const hasItemArray = Array.isArray(payload.items) || Array.isArray(root.items)
  const items = Array.isArray(payload.items) ? payload.items : Array.isArray(root.items) ? root.items : []
  const notes = [...(Array.isArray(root.notes) ? root.notes.map(String) : []), ...(Array.isArray(payload.notes) ? payload.notes.map(String) : [])]
  const noteSource = notes.find((note) => note.startsWith('source_mode='))?.split('=')[1]

  const observedRecords = hasItemArray ? items.length : firstFinite(latest?.stream_count, root.observedCount, root.streamCount, status?.latest_stream_count)
  const configuredLimit = firstFinite(root.topLimit, root.limit, payload.topLimit, payload.limit, provider.limit)
  const hasMore = firstBoolean(latest?.has_more, root.hasMore, root.has_more, payload.hasMore, payload.has_more, status?.has_more)
  const coveredPages = firstNullableFinite(latest?.covered_pages, root.coveredPages, root.covered_pages, payload.coveredPages, payload.covered_pages, status?.covered_pages)
  const updatedAt = firstString(latest?.collected_at, latest?.bucket_minute, root.updatedAt, root.updated_at, root.generatedAt, payload.updatedAt, payload.bucketMinute, status?.last_success_at, status?.latest_collected_at)
  const sourceMode = normalizeSourceMode(firstString(latest?.source_mode, root.sourceMode, root.source_mode, payload.sourceMode, payload.source_mode, noteSource, root.source))
  const collectionMethod = firstString(root.collectionMethod, root.collection_method, payload.collectionMethod, payload.collection_method, latest?.collection_method, provider.method)
  const explicitState = normalizeExplicitState(firstString(root.state, payload.state, status?.status, root.status))
  const coverageHint = normalizeCoverage(firstString(asRecord(root.coverage)?.state, asRecord(payload.coverage)?.state))
  const freshness = asRecord(root.freshness) || asRecord(payload.freshness) || {}
  const staleAfterMinutes = firstFinite(freshness.staleAfterMinutes, freshness.stale_after_minutes, 10)
  const strongStaleAfterMinutes = firstFinite(freshness.strongStaleAfterMinutes, freshness.strong_stale_after_minutes, 30)
  const snapshotAgeMinutes = ageMinutes(updatedAt, nowMs)
  const isStale = sourceMode === 'stale' || explicitState === 'stale' || (snapshotAgeMinutes !== null && snapshotAgeMinutes >= staleAfterMinutes)
  const isStrongStale = snapshotAgeMinutes !== null && snapshotAgeMinutes >= strongStaleAfterMinutes
  const activityData = summarizeActivity(items)
  const snapshotExists = Boolean(latest) || hasItemArray || Boolean(updatedAt)
  const collectorFailure = ['failing', 'failed', 'error', 'unconfigured'].includes(firstString(status?.status, root.collectorState, root.collector_state).toLowerCase())
  const coverageIsPartial = hasMore === true || ['partial', 'poor', 'missing'].includes(coverageHint)
  const activityIsPartial = ['unavailable', 'not_sampled'].includes(activityData.summary.state)
  const sourceIsUncertain = sourceMode === 'unknown'

  let state
  if ((root.ok === false || explicitState === 'error') && !snapshotExists) state = 'error'
  else if (sourceMode === 'demo' || explicitState === 'demo') state = 'demo'
  else if (snapshotExists && observedRecords === 0) state = 'empty'
  else if (isStale) state = 'stale'
  else if (explicitState === 'partial' || collectorFailure || coverageIsPartial || activityIsPartial || sourceIsUncertain) state = 'partial'
  else state = snapshotExists ? 'fresh' : explicitState === 'loading' ? 'loading' : 'error'

  const reasons = []
  if (hasMore === true) reasons.push('Collector reports more records beyond the current snapshot scope.')
  if (activityData.summary.state === 'unavailable') reasons.push('Activity signal is unavailable for the current observed field.')
  if (activityData.summary.state === 'not_sampled') reasons.push('Activity was not sampled in the current window.')
  if (collectorFailure) reasons.push('Collector health is degraded.')
  if (sourceIsUncertain) reasons.push('Snapshot source mode is unknown.')
  if (isStale) reasons.push('The latest successful snapshot is delayed.')

  return {
    provider: providerKey === 'kick' ? 'kick' : 'twitch', providerLabel: provider.label,
    state, stateLabel: LABELS[state], sourceMode, sourceLabel: sourceLabel(sourceMode), collectionMethod,
    updatedAt: updatedAt || null, snapshotAgeMinutes, staleAfterMinutes, strongStaleAfterMinutes, isStrongStale,
    observedRecords, configuredLimit, hasMore, coveredPages,
    coverageState: coverageIsPartial ? 'partial' : snapshotExists ? 'observed' : 'missing',
    activity: activityData.summary, activityByLogin: activityData.byLogin, reasons,
  }
}

export function createHeatmapLoadingTruth(providerKey) {
  const provider = providerKey === 'kick' ? DEFAULTS.kick : DEFAULTS.twitch
  return {
    provider: providerKey === 'kick' ? 'kick' : 'twitch', providerLabel: provider.label,
    state: 'loading', stateLabel: LABELS.loading, sourceMode: 'unknown', sourceLabel: 'Unknown', collectionMethod: provider.method,
    updatedAt: null, snapshotAgeMinutes: null, staleAfterMinutes: 10, strongStaleAfterMinutes: 30, isStrongStale: false,
    observedRecords: 0, configuredLimit: provider.limit, hasMore: null, coveredPages: null, coverageState: 'missing',
    activity: { state: 'not_sampled', counts: { available: 0, zero: 0, unavailable: 0, not_sampled: 0 } }, activityByLogin: {}, reasons: [],
  }
}

export function createHeatmapErrorTruth(providerKey, message = 'Heatmap data could not be loaded.') {
  return { ...createHeatmapLoadingTruth(providerKey), state: 'error', stateLabel: LABELS.error, reasons: [message] }
}
