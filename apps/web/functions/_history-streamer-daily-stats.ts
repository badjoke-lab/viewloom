type JsonRecord = Record<string, unknown>

export const STREAMER_DAILY_STATS_LIMIT_PER_DAY = 10

export async function enrichHistoryStreamerDailyStats(response: Response): Promise<Response> {
  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.includes('application/json')) return response

  try {
    const payload = await response.clone().json<JsonRecord>()
    const daily = records(payload.daily)
    const streamerDailyStats = daily.flatMap((day) => dailyStatsFor(day))
    const headers = new Headers(response.headers)
    headers.delete('content-length')
    headers.set('cache-control', 'no-store')

    return Response.json({
      ...payload,
      streamerDailyStats,
      streamerDailyStatsMeta: {
        rankingBasis: 'viewer_minutes',
        limitPerDay: STREAMER_DAILY_STATS_LIMIT_PER_DAY,
        bounded: true,
        includesDayOverDayComparison: true,
        providerSeparated: true,
        source: 'daily.topStreamers',
      },
    }, {
      status: response.status,
      statusText: response.statusText,
      headers,
    })
  } catch {
    return response
  }
}

export function streamerDailyStatsFromPayload(payload: JsonRecord): JsonRecord[] {
  return records(payload.daily).flatMap((day) => dailyStatsFor(day))
}

function dailyStatsFor(day: JsonRecord): JsonRecord[] {
  const dayValue = text(day.day)
  const coverageState = text(day.coverageState) || 'missing'
  if (!dayValue) return []

  return records(day.topStreamers)
    .slice(0, STREAMER_DAILY_STATS_LIMIT_PER_DAY)
    .map((stream) => ({
      day: dayValue,
      coverageState,
      streamerId: text(stream.streamerId),
      displayName: text(stream.displayName),
      viewerMinutes: number(stream.viewerMinutes),
      peakViewers: number(stream.peakViewers),
      avgViewers: number(stream.avgViewers),
      observedMinutes: number(stream.observedMinutes),
      rankByViewerMinutes: number(stream.rankByViewerMinutes),
      rankByPeak: number(stream.rankByPeak),
      changePct: nullableNumber(stream.changePct),
      changeAbs: nullableNumber(stream.changeAbs),
      comparisonState: comparisonState(stream.comparisonState),
    }))
    .filter((stream) => Boolean(stream.streamerId))
}

function records(value: unknown): JsonRecord[] {
  return Array.isArray(value)
    ? value.filter((item): item is JsonRecord => typeof item === 'object' && item !== null && !Array.isArray(item))
    : []
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function number(value: unknown): number {
  const parsed = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : Number.NaN
  return Number.isFinite(parsed) ? parsed : 0
}

function nullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const parsed = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : Number.NaN
  return Number.isFinite(parsed) ? parsed : null
}

function comparisonState(value: unknown): 'comparable' | 'new' | 'insufficient' {
  return value === 'comparable' || value === 'new' ? value : 'insufficient'
}
