import { normalizeHeatmapDataTruth } from './data-state-core.mjs'

export function buildHeatmapOverview(raw, providerKey, nowMs = Date.now()) {
  const provider = providerKey === 'kick' ? 'kick' : 'twitch'
  const truth = normalizeHeatmapDataTruth(raw, provider, nowMs)
  const root = asRecord(raw) || {}
  const latest = asRecord(root.latest)
  const payload = latest ? parseJson(latest.payload_json) : root
  const sourceItems = Array.isArray(payload.items)
    ? payload.items
    : Array.isArray(root.items)
      ? root.items
      : []
  const globalActivityAvailable = firstBoolean(
    root.activityAvailable,
    root.activity_available,
    payload.activityAvailable,
    payload.activity_available,
  )
  const globalActivitySampled = firstBoolean(
    root.activitySampled,
    root.activity_sampled,
    payload.activitySampled,
    payload.activity_sampled,
  )
  const items = sourceItems
    .map((item) => normalizeItem(item, globalActivityAvailable, globalActivitySampled))
    .filter(Boolean)
    .sort((a, b) => b.viewers - a.viewers)

  const calculatedViewers = items.reduce((sum, item) => sum + item.viewers, 0)
  const totalViewers = firstFinite(
    latest?.total_viewers,
    root.totalViewers,
    root.total_viewers,
    payload.totalViewers,
    payload.total_viewers,
    calculatedViewers,
  )
  const strongestMomentum = items.length
    ? items.reduce((best, item) => item.momentum > best.momentum ? item : best, items[0])
    : null
  const activityCandidates = items.filter((item) => item.activityAvailable && item.activitySampled && item.activity !== null)
  const highestActivity = activityCandidates.length
    ? activityCandidates.reduce((best, item) => item.activity > best.activity ? item : best, activityCandidates[0])
    : null

  return {
    provider,
    truth,
    items,
    activeRecords: items.length || truth.observedRecords,
    totalViewers,
    strongestMomentum,
    highestActivity,
    activityState: truth.activity.state,
    legend: {
      area: 'Tile area equals current observed viewers.',
      rising: 'Green means the stream is rising in the current momentum window.',
      falling: 'Red means the stream is falling in the current momentum window.',
      stable: 'Blue-gray means the stream is broadly stable.',
      activity: activityLegend(truth.activity.state),
    },
    coverageLines: buildCoverageLines(truth),
  }
}

export function momentumLabel(momentum) {
  if (momentum > 0.02) return 'Rising'
  if (momentum < -0.02) return 'Falling'
  return 'Stable'
}

export function formatMomentum(momentum) {
  const value = Number.isFinite(momentum) ? momentum : 0
  return `${value > 0 ? '+' : ''}${(value * 100).toFixed(1)}%`
}

export function formatActivity(activity) {
  return Number.isFinite(activity) ? `${(activity * 100).toFixed(1)}%` : 'Unavailable'
}

export function buildCoverageLines(truth) {
  const lines = [
    `${truth.observedRecords.toLocaleString()} valid observed records are represented by the current snapshot.`,
    `Configured collection limit: ${truth.configuredLimit.toLocaleString()}.`,
    truth.hasMore === true
      ? 'More platform records were reported beyond the current observed snapshot.'
      : 'No additional records were reported beyond the current observed snapshot.',
    truth.coveredPages === null
      ? 'Covered pages: unavailable.'
      : `Covered pages: ${truth.coveredPages.toLocaleString()}.`,
    `Source mode: ${truth.sourceLabel}.`,
    `Collection method: ${truth.collectionMethod}.`,
  ]

  if (truth.snapshotAgeMinutes !== null) {
    lines.push(`Snapshot age: ${formatAge(truth.snapshotAgeMinutes)}.`)
  }
  if (truth.reasons.length) lines.push(...truth.reasons)
  return unique(lines)
}

function normalizeItem(value, globalActivityAvailable, globalActivitySampled) {
  const record = asRecord(value)
  if (!record) return null
  const channel = asRecord(record.channel)
  const login = firstString(
    record.channelLogin,
    record.channel_login,
    record.login,
    record.user_login,
    record.slug,
    record.username,
    record.id,
    channel?.slug,
    channel?.username,
  )
  const viewers = firstFinite(record.viewers, record.viewer_count, record.viewerCount)
  if (!login || viewers <= 0) return null

  const activityAvailable = firstBoolean(record.activityAvailable, record.activity_available, globalActivityAvailable) === true
  const activitySampled = firstBoolean(record.activitySampled, record.activity_sampled, globalActivitySampled) === true
  const activityValue = firstNullableFinite(record.activity, record.agitationLevel, record.agitation_level)

  return {
    channelLogin: login,
    displayName: firstString(record.displayName, record.display_name, record.name, record.username, login) || login,
    viewers,
    momentum: firstFinite(record.momentum, record.momentumRate, record.momentum_rate, 0),
    activity: activityValue,
    activityAvailable,
    activitySampled,
  }
}

function activityLegend(state) {
  if (state === 'available') return 'Activity accent is a sampled secondary signal and does not change tile area or base color.'
  if (state === 'zero') return 'Activity was sampled but zero in this field; no activity accent is shown.'
  if (state === 'unavailable') return 'Activity accent is unavailable for this snapshot.'
  return 'Activity accent was not sampled in this window.'
}

function formatAge(minutes) {
  if (minutes < 1) return 'less than 1 minute'
  if (minutes < 60) return `${Math.floor(minutes)} minutes`
  const hours = Math.floor(minutes / 60)
  const remainder = Math.floor(minutes % 60)
  return remainder ? `${hours}h ${remainder}m` : `${hours}h`
}

function unique(values) {
  return [...new Set(values.filter(Boolean))]
}

function parseJson(value) {
  if (typeof value !== 'string') return asRecord(value) || {}
  try { return asRecord(JSON.parse(value)) || {} } catch { return {} }
}

function asRecord(value) {
  return typeof value === 'object' && value !== null ? value : null
}

function firstString(...values) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return ''
}

function firstFinite(...values) {
  for (const value of values) {
    const number = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : Number.NaN
    if (Number.isFinite(number)) return number
  }
  return 0
}

function firstNullableFinite(...values) {
  for (const value of values) {
    if (value === null) return null
    const number = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : Number.NaN
    if (Number.isFinite(number)) return number
  }
  return null
}

function firstBoolean(...values) {
  for (const value of values) {
    if (typeof value === 'boolean') return value
    if (value === 1 || value === '1' || value === 'true') return true
    if (value === 0 || value === '0' || value === 'false') return false
  }
  return null
}
