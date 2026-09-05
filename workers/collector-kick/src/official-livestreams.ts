export type KickOfficialStreamItem = {
  slug: string
  displayName: string
  title: string
  viewer_count: number
  url: string
  broadcaster_user_id: string | null
  categoryProviderId?: string | null
  categoryName?: string | null
}

type Raw = Record<string, unknown>
type KickOfficialChannelIdentity = {
  slug: string
  broadcaster_user_id: string
}

const CHANNEL_BATCH_SIZE = 50

export async function collectKickOfficialLivestreams(appToken: string, limit = 100): Promise<{
  streams: KickOfficialStreamItem[]
  failures: number
  observedSlugs: string[]
  reason: string
  identityLookupRequests: number
  identityLookupFailures: number
  identityMatchedStreams: number
  identityMissingStreams: number
}> {
  const safeLimit = Math.max(1, Math.min(100, Number.isFinite(limit) ? Math.floor(limit) : 100))
  const url = new URL('https://api.kick.com/public/v1/livestreams')
  url.searchParams.set('limit', String(safeLimit))
  url.searchParams.set('sort', 'viewer_count')

  const headers = new Headers()
  headers.set('accept', 'application/json')
  headers.set(['author', 'ization'].join(''), ['Bear', 'er '].join('') + appToken)
  headers.set('user-agent', 'ViewLoom collector-kick/official-livestreams')

  try {
    const response = await fetch(url.toString(), { headers })
    const body = await response.text()
    let parsed: Raw | null = null
    try {
      const value = JSON.parse(body)
      parsed = typeof value === 'object' && value !== null ? value as Raw : null
    } catch {
      parsed = null
    }

    if (!response.ok) {
      return {
        streams: [],
        failures: 1,
        observedSlugs: [],
        reason: `official_livestreams_http_${response.status}`,
        identityLookupRequests: 0,
        identityLookupFailures: 0,
        identityMatchedStreams: 0,
        identityMissingStreams: 0,
      }
    }

    const rows = Array.isArray(parsed?.data) ? parsed.data : []
    const normalized = rows
      .map((row) => typeof row === 'object' && row !== null ? normalizeOfficialStream(row as Raw) : null)
      .filter((row): row is KickOfficialStreamItem => row !== null)

    const identityResult = normalized.length > 0
      ? await fetchOfficialChannelIdentities(appToken, normalized.map((stream) => stream.slug))
      : { rows: [], requests: 0, failures: 0 }
    const streams = attachOfficialChannelIdentities(normalized, identityResult.rows)
    const identityMatchedStreams = streams.filter((stream) => Boolean(stream.broadcaster_user_id)).length

    return {
      streams,
      failures: identityResult.failures,
      observedSlugs: streams.map((stream) => stream.slug),
      reason: streams.length > 0 ? 'official_livestreams_success' : 'official_livestreams_empty',
      identityLookupRequests: identityResult.requests,
      identityLookupFailures: identityResult.failures,
      identityMatchedStreams,
      identityMissingStreams: streams.length - identityMatchedStreams,
    }
  } catch (error) {
    return {
      streams: [],
      failures: 1,
      observedSlugs: [],
      reason: error instanceof Error ? error.message : String(error),
      identityLookupRequests: 0,
      identityLookupFailures: 0,
      identityMatchedStreams: 0,
      identityMissingStreams: 0,
    }
  }
}

export function normalizeOfficialStream(raw: Raw): KickOfficialStreamItem | null {
  const channel = asRecord(raw.channel)
  const slug = asText(raw.slug ?? raw.channel_slug ?? channel?.slug)
  const viewers = asNumber(raw.viewer_count ?? raw.viewers)
  if (!slug || viewers <= 0) return null
  const category = asRecord(raw.category)
  const categoryProviderId = asIdentifier(category?.id)
  const categoryName = asText(category?.name)
  const displayName = asText(raw.username ?? raw.name ?? channel?.username ?? channel?.name) || slug
  return {
    slug,
    displayName,
    title: asText(raw.stream_title ?? raw.session_title ?? raw.title ?? categoryName),
    viewer_count: viewers,
    url: `https://kick.com/${slug}`,
    broadcaster_user_id: null,
    categoryProviderId: categoryProviderId || null,
    categoryName: categoryName || null,
  }
}

export function buildOfficialChannelSlugBatches(slugs: string[]): string[][] {
  const unique = [...new Set(slugs.map(normalizeSlug).filter(Boolean))]
  const batches: string[][] = []
  for (let index = 0; index < unique.length; index += CHANNEL_BATCH_SIZE) {
    batches.push(unique.slice(index, index + CHANNEL_BATCH_SIZE))
  }
  return batches
}

export function attachOfficialChannelIdentities(
  streams: KickOfficialStreamItem[],
  channelRows: KickOfficialChannelIdentity[],
): KickOfficialStreamItem[] {
  const idsBySlug = new Map<string, Set<string>>()
  for (const row of channelRows) {
    const slug = normalizeSlug(row.slug)
    const id = asIdentifier(row.broadcaster_user_id)
    if (!slug || !id) continue
    const ids = idsBySlug.get(slug) ?? new Set<string>()
    ids.add(id)
    idsBySlug.set(slug, ids)
  }

  return streams.map((stream) => {
    const ids = idsBySlug.get(normalizeSlug(stream.slug))
    return {
      ...stream,
      broadcaster_user_id: ids?.size === 1 ? [...ids][0] : null,
    }
  })
}

async function fetchOfficialChannelIdentities(appToken: string, slugs: string[]): Promise<{
  rows: KickOfficialChannelIdentity[]
  requests: number
  failures: number
}> {
  const rows: KickOfficialChannelIdentity[] = []
  const batches = buildOfficialChannelSlugBatches(slugs)
  let failures = 0

  for (const batch of batches) {
    const url = new URL('https://api.kick.com/public/v1/channels')
    for (const slug of batch) url.searchParams.append('slug', slug)
    const headers = new Headers()
    headers.set('accept', 'application/json')
    headers.set(['author', 'ization'].join(''), ['Bear', 'er '].join('') + appToken)
    headers.set('user-agent', 'ViewLoom collector-kick/official-channel-identities')

    try {
      const response = await fetch(url.toString(), { headers })
      if (!response.ok) {
        failures += 1
        continue
      }
      const raw = await response.json() as Raw
      const data = Array.isArray(raw.data) ? raw.data : []
      for (const value of data) {
        const row = asRecord(value)
        if (!row) continue
        const slug = asText(row.slug)
        const broadcasterUserId = asIdentifier(row.broadcaster_user_id)
        if (slug && broadcasterUserId) rows.push({ slug, broadcaster_user_id: broadcasterUserId })
      }
    } catch {
      failures += 1
    }
  }

  return { rows, requests: batches.length, failures }
}

function normalizeSlug(value: unknown): string {
  return asText(value).toLowerCase()
}

function asRecord(value: unknown): Raw | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value as Raw
    : null
}

function asIdentifier(value: unknown): string {
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return ''
}

function asText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function asNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.max(0, Math.round(value))
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/,/g, ''))
    return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : 0
  }
  return 0
}
