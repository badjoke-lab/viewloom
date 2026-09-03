function text(value) {
  return typeof value === 'string' ? value.trim() : String(value ?? '').trim()
}

function viewers(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.max(0, Math.round(value))
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/,/g, ''))
    return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : 0
  }
  return 0
}

export function adaptTwitchCurrentSnapshotItems(payloadJson) {
  let payload = null
  try {
    payload = JSON.parse(String(payloadJson ?? ''))
  } catch {
    return []
  }

  const items = Array.isArray(payload?.items) ? payload.items : Array.isArray(payload?.data) ? payload.data : []
  const adapted = []

  for (const value of items) {
    if (!value || typeof value !== 'object') continue
    const userLogin = text(value.channelLogin ?? value.user_login ?? value.login).toLowerCase()
    if (!userLogin) continue

    adapted.push({
      twitchUserId: text(value.twitchUserId ?? value.user_id) || null,
      userLogin,
      displayName: text(value.displayName ?? value.user_name ?? value.name) || userLogin,
      viewers: viewers(value.viewers ?? value.viewer_count ?? value.viewerCount),
      url: text(value.url) || `https://www.twitch.tv/${userLogin}`,
    })
  }

  return adapted
}
