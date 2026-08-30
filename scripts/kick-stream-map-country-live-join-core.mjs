function normalizeProvider(value) {
  return String(value ?? '').trim().toLowerCase()
}

function normalizeSlug(value) {
  return String(value ?? '').trim().toLowerCase()
}

function stableKickUserId(value) {
  const text = String(value ?? '').trim()
  return text.length > 0 ? text : null
}

export function deriveKickCountryLiveStates({ liveRows = [], channelRows = [], reviewedEvidence = [] } = {}) {
  const kickChannelsBySlug = new Map()
  for (const row of channelRows) {
    if (normalizeProvider(row?.provider) !== 'kick') continue
    const slug = normalizeSlug(row?.slug)
    if (!slug) continue
    const rows = kickChannelsBySlug.get(slug) ?? []
    rows.push(row)
    kickChannelsBySlug.set(slug, rows)
  }

  const kickEvidenceByStableId = new Map()
  for (const row of reviewedEvidence) {
    if (normalizeProvider(row?.provider) !== 'kick') continue
    const id = stableKickUserId(row?.stableKickUserId)
    if (!id) continue
    const rows = kickEvidenceByStableId.get(id) ?? []
    rows.push(row)
    kickEvidenceByStableId.set(id, rows)
  }

  return liveRows
    .filter((row) => normalizeProvider(row?.provider) === 'kick')
    .map((live) => {
      const slug = normalizeSlug(live?.channel?.slug ?? live?.slug)
      const channels = slug ? (kickChannelsBySlug.get(slug) ?? []) : []
      if (channels.length !== 1) {
        return terminal(live, null, 'unmapped', channels.length > 1 ? 'ambiguous_channel_join' : 'channel_join_unavailable')
      }

      const id = stableKickUserId(channels[0]?.broadcaster_user_id)
      if (!id) return terminal(live, null, 'unmapped', 'stable_identity_unavailable')

      const evidenceRows = kickEvidenceByStableId.get(id) ?? []
      if (evidenceRows.length !== 1) {
        return terminal(live, id, 'unmapped', evidenceRows.length > 1 ? 'ambiguous_reviewed_evidence' : 'no_reviewed_kick_evidence')
      }

      const evidence = evidenceRows[0]
      if (evidence.outcome === 'accepted' && evidence.placement?.state === 'mapped' && /^[A-Z]{2}$/.test(String(evidence.placement?.countryCode ?? ''))) {
        return terminal(live, id, 'mapped', 'reviewed_country_accepted', { countryCode: evidence.placement.countryCode })
      }
      if (evidence.outcome === 'conflict_unmapped') return terminal(live, id, 'conflict', 'reviewed_country_conflict')
      if (evidence.outcome === 'excluded_nonperson') return terminal(live, id, 'excluded', 'reviewed_nonperson_exclusion')
      return terminal(live, id, 'unmapped', 'no_qualifying_reviewed_country')
    })
}

function terminal(live, stableId, state, reason, placement = null) {
  return {
    provider: 'kick',
    slug: String(live?.channel?.slug ?? live?.slug ?? '').trim() || null,
    stableKickUserId: stableId,
    state,
    reason,
    placement,
  }
}
