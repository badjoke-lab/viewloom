function record(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? value : null
}

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

function parsePayload(payloadJson) {
  if (typeof payloadJson !== 'string' || payloadJson.trim() === '') return null
  try {
    return record(JSON.parse(payloadJson))
  } catch {
    return null
  }
}

/**
 * Production-independent source adapter for the future Twitch Current layer.
 * It accepts only retained snapshot `twitchUserId` as stable identity and
 * discards raw stream metadata before the Current response core.
 */
export function extractTwitchCurrentSnapshotItems(payloadJson) {
  const payload = parsePayload(payloadJson)
  if (!payload) return []

  const values = Array.isArray(payload.items)
    ? payload.items
    : Array.isArray(payload.data)
      ? payload.data
      : []

  return values
    .map((value) => {
      const row = record(value)
      if (!row) return null
      const channelLogin = text(row.channelLogin ?? row.userLogin).toLowerCase()
      if (!channelLogin) return null

      const stableTwitchUserId = identifier(row.twitchUserId)
      const displayName = text(row.displayName ?? row.userName ?? row.name) || channelLogin

      return {
        twitchUserId: stableTwitchUserId || null,
        userLogin: channelLogin,
        displayName,
        viewers: viewers(row.viewers ?? row.viewer_count ?? row.viewerCount),
        url: text(row.url) || `https://www.twitch.tv/${channelLogin}`,
      }
    })
    .filter(Boolean)
}
