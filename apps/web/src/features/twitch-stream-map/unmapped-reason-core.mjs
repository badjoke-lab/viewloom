const REASON_META = {
  missing_stable_identity: {
    label: 'Missing stable identity',
    detail: 'The observed row cannot be joined to a stable Twitch channel login.',
  },
  no_reviewed_evidence: {
    label: 'No reviewed evidence',
    detail: 'No reviewed location record exists for this observed channel.',
  },
  excluded_nonperson: {
    label: 'Excluded non-person channel',
    detail: 'The observed channel is an organization or event broadcast and is not placed as a person.',
  },
  entity_kind_unresolved: {
    label: 'Entity kind unresolved',
    detail: 'The reviewed record does not yet establish that the channel represents a person.',
  },
  context_only_or_unaccepted_evidence: {
    label: 'Context-only or unaccepted evidence',
    detail: 'Evidence exists, but none is accepted for geographic placement. Candidate-only evidence remains here.',
  },
  conflicting_accepted_evidence: {
    label: 'Conflicting accepted country evidence',
    detail: 'Accepted evidence points to more than one country, so ViewLoom leaves the channel unmapped.',
  },
  accepted_evidence_without_country: {
    label: 'Accepted evidence without country',
    detail: 'Accepted placement evidence exists but does not resolve to a country code.',
  },
  missing_payload_rows: {
    label: 'Missing snapshot payload rows',
    detail: 'The snapshot reports more observed streams than are present in the retained payload rows.',
  },
}

export function buildUnmappedReasonView({
  reasonCounts,
  baselineUnmappedStreams,
  baselineMappedStreams,
  filteredMappedStreams,
}) {
  const reasons = Object.entries(reasonCounts && typeof reasonCounts === 'object' ? reasonCounts : {})
    .map(([code, value]) => reasonRow(code, safeCount(value), false))
    .filter((row) => row.count > 0)
    .sort((left, right) => right.count - left.count || left.code.localeCompare(right.code))

  const baselineUnmapped = safeCount(baselineUnmappedStreams)
  const baselineMapped = safeCount(baselineMappedStreams)
  const filteredMapped = Math.min(baselineMapped, safeCount(filteredMappedStreams))
  const baselineReasonTotal = reasons.reduce((sum, row) => sum + row.count, 0)
  const filteredOutAcceptedStreams = Math.max(0, baselineMapped - filteredMapped)
  const currentViewUnmappedStreams = baselineUnmapped + filteredOutAcceptedStreams
  const currentReasons = [...reasons]

  if (filteredOutAcceptedStreams > 0) {
    currentReasons.push({
      code: 'filtered_out_accepted_evidence',
      label: 'Accepted evidence filtered out in this view',
      detail: 'These streams are mapped in the base API result, but the active source/type filters exclude their accepted evidence.',
      count: filteredOutAcceptedStreams,
      derived: true,
    })
  }

  const currentViewReasonTotal = currentReasons.reduce((sum, row) => sum + row.count, 0)

  return {
    baselineReasons: reasons,
    currentReasons,
    baselineReasonTotal,
    baselineUnmappedStreams: baselineUnmapped,
    baselineReconciles: baselineReasonTotal === baselineUnmapped,
    filteredOutAcceptedStreams,
    currentViewUnmappedStreams,
    currentViewReasonTotal,
    currentViewReconciles: currentViewReasonTotal === currentViewUnmappedStreams,
  }
}

export function unmappedReasonMeta(code) {
  const key = String(code ?? '').trim()
  const known = REASON_META[key]
  if (known) return { code: key, ...known }
  return {
    code: key,
    label: humanize(key) || 'Unknown reason',
    detail: 'The API returned an unmapped reason code that this client does not yet describe.',
  }
}

function reasonRow(code, count, derived) {
  const meta = unmappedReasonMeta(code)
  return { ...meta, count, derived }
}

function safeCount(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : 0
}

function humanize(value) {
  return String(value ?? '')
    .replace(/[_-]+/g, ' ')
    .trim()
    .replace(/\b\w/g, (character) => character.toUpperCase())
}
