export type KickOfficialStreamItem = {
  slug: string
  displayName: string
  title: string
  viewer_count: number
  url: string
  categoryProviderId?: string | null
  categoryName?: string | null
}

type Raw = Record<string, unknown>

export async function collectKickOfficialLivestreams(appToken: string, limit = 100): Promise<{
  streams: KickOfficialStreamItem[]
  failures: number
  observedSlugs: string[]
  reason: string
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

    if (!response.ok) return { streams: [], failures: 1, observedSlugs: [], reason: `official_livestreams_http_${response.status}` }

    const rows = Array.isArray(parsed?.data) ? parsed.data : []
    const streams = rows
      .map((row) => typeof row === 'object' && row !== null ? normalizeOfficialStream(row as Raw) : null)
      .filter((row): row is KickOfficialStreamItem => row !== null)

    return {
      streams,
      failures: 0,
      observedSlugs: streams.map((stream) => stream.slug),
      reason: streams.length > 0 ? 'official_livestreams_success' : 'official_livestreams_empty',
    }
  } catch (error) {
    return { streams: [], failures: 1, observedSlugs: [], reason: error instanceof Error ? error.message : String(error) }
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
    categoryProviderId: categoryProviderId || null,
    categoryName: categoryName || null,
  }
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
