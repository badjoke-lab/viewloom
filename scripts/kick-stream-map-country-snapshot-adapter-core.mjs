import { deriveKickCountryLiveStates } from './kick-stream-map-country-live-join-core.mjs'

function slugOf(row) {
  return String(row?.slug ?? row?.channel?.slug ?? '').trim().toLowerCase()
}

function stableIdOf(row) {
  const value = row?.broadcaster_user_id
  const text = String(value ?? '').trim()
  return text || null
}

export function deriveKickCountrySnapshotStates({ snapshotItems = [], reviewedEvidence = [] } = {}) {
  const liveRows = snapshotItems
    .map((item) => ({ provider: 'kick', slug: slugOf(item) }))
    .filter((row) => row.slug)

  const idsBySlug = new Map()
  for (const item of snapshotItems) {
    const slug = slugOf(item)
    if (!slug) continue
    const ids = idsBySlug.get(slug) ?? new Set()
    const id = stableIdOf(item)
    if (id) ids.add(id)
    idsBySlug.set(slug, ids)
  }

  const channelRows = []
  for (const [slug, ids] of idsBySlug.entries()) {
    if (ids.size === 0) {
      channelRows.push({ provider: 'kick', slug, broadcaster_user_id: null })
      continue
    }
    for (const id of ids) channelRows.push({ provider: 'kick', slug, broadcaster_user_id: id })
  }

  return deriveKickCountryLiveStates({ liveRows, channelRows, reviewedEvidence })
}
