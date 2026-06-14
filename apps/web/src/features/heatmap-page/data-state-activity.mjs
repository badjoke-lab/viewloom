import { asRecord, firstBoolean, firstString, firstNullableFinite } from './data-state-utils.mjs'

export function summarizeActivity(items) {
  const counts = { available: 0, zero: 0, unavailable: 0, not_sampled: 0 }
  const byLogin = {}

  for (const raw of items) {
    const item = asRecord(raw)
    if (!item) continue
    const login = firstString(item.channelLogin, item.channel_login, item.login, item.slug, item.username, item.id, item.displayName, item.name)
    if (!login) continue
    const value = normalizeActivity(item)
    byLogin[login] = value
    counts[value.state] += 1
  }

  const state = counts.available > 0
    ? 'available'
    : counts.zero > 0
      ? 'zero'
      : counts.unavailable > 0
        ? 'unavailable'
        : 'not_sampled'
  return { summary: { state, counts }, byLogin }
}

function normalizeActivity(item) {
  const explicit = firstString(item.activityState, item.activity_state, item.activityAvailability, item.activity_availability).toLowerCase()
  if (['unavailable', 'missing', 'unsupported'].includes(explicit)) return { state: 'unavailable', value: null }
  if (['not_sampled', 'not-sampled', 'unsampled'].includes(explicit)) return { state: 'not_sampled', value: null }
  if (['zero', 'sampled_zero', 'sampled-but-zero'].includes(explicit)) return { state: 'zero', value: 0 }
  if (firstBoolean(item.activityAvailable, item.activity_available) === false) return { state: 'unavailable', value: null }
  if (firstBoolean(item.activitySampled, item.activity_sampled, item.sampled) === false) return { state: 'not_sampled', value: null }
  if (!Object.prototype.hasOwnProperty.call(item, 'activity') || item.activity === null || item.activity === '') return { state: 'unavailable', value: null }
  const value = firstNullableFinite(item.activity)
  if (value === null) return { state: 'unavailable', value: null }
  return value === 0 ? { state: 'zero', value: 0 } : { state: 'available', value }
}
