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
 * Normalizes the future Kick minute-snapshot payload into the narrow source
 * shape required by the staged Stream Map Country response core.
 *
 * This module is deliberately not a Pages Function route. It does not read D1,
 * authorize public activation, infer geography, or manufacture a stable ID from
 * a slug. The only accepted stable identity is the retained top-level
 * broadcaster_user_id supplied by the official Kick Channels enrichment path.
 */
export function extractKickStreamMapSnapshotItems(payloadJson) {
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
      const channel = record(row.channel)
      const slug = text(row.slug ?? row.channel_slug ?? channel?.slug).toLowerCase()
      if (!slug) return null

      const stableKickUserId = identifier(row.broadcaster_user_id)
      const displayName = text(
        row.displayName ?? row.username ?? row.name ?? channel?.displayName ?? channel?.username ?? channel?.name,
      ) || slug

      return {
        slug,
        displayName,
        viewer_count: viewers(row.viewer_count ?? row.viewers ?? row.viewerCount),
        url: text(row.url) || `https://kick.com/${slug}`,
        broadcaster_user_id: stableKickUserId || null,
      }
    })
    .filter(Boolean)
}
