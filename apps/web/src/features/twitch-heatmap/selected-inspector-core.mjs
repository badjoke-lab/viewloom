export function selectedRank(items, login) {
  const target = String(login || '').toLowerCase()
  const index = Array.isArray(items)
    ? items.findIndex((item) => String(item && item.channelLogin || '').toLowerCase() === target)
    : -1
  return index >= 0 ? index + 1 : null
}

export function momentumDirection(value) {
  const numeric = numberOrZero(value)
  if (numeric > 0.02) return 'Rising'
  if (numeric < -0.02) return 'Falling'
  return 'Flat'
}

export function activityPresentation(item) {
  if (item && item.activityAvailable === true && item.activitySampled === true) {
    return {
      state: 'available',
      value: `${(Math.max(0, numberOrZero(item.activity)) * 100).toFixed(1)}%`,
      note: 'Observed activity signal',
    }
  }

  if (item && item.activityAvailable === true) {
    return {
      state: 'not_sampled',
      value: 'Not sampled',
      note: readableReason(item.activityUnavailableReason) || 'Activity was available but not sampled for this stream.',
    }
  }

  return {
    state: 'unavailable',
    value: 'Unavailable',
    note: readableReason(item && item.activityUnavailableReason) || 'Activity sampling is not connected for this provider.',
  }
}

export function formatObservationDuration(minutes, truncated = false, bucketMinutes = 5) {
  if (!Number.isFinite(minutes) || minutes < 0) return 'Unavailable'
  const bucket = Number.isFinite(bucketMinutes) && bucketMinutes > 0 ? Math.round(bucketMinutes) : 5
  if (minutes === 0) return `Less than ${bucket}m`
  const rounded = Math.round(minutes)
  const hours = Math.floor(rounded / 60)
  const rest = rounded % 60
  const value = hours === 0 ? `${rest}m` : rest === 0 ? `${hours}h` : `${hours}h ${rest}m`
  return truncated ? `At least ${value}` : value
}

export function buildInspectorLinks(provider, login) {
  const base = provider === 'kick' ? 'kick' : 'twitch'
  const stream = encodeURIComponent(String(login || ''))
  return {
    battleLines: `/${base}/battle-lines/?range=today&metric=viewers&stream=${stream}`,
    history: `/${base}/history/?period=7d&metric=viewer_minutes&sort=viewer_minutes&stream=${stream}`,
  }
}

function readableReason(value) {
  const text = typeof value === 'string' ? value.trim() : ''
  if (!text) return ''
  return text.split('_').filter(Boolean).map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ')
}

function numberOrZero(value) {
  return Number.isFinite(value) ? value : 0
}
