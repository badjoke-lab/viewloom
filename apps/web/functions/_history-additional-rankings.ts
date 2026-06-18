type JsonRecord = Record<string, unknown>
type RankingKey = 'viewer_minutes' | 'peak_viewers' | 'avg_viewers' | 'observed_minutes' | 'rising'

const CANDIDATE_LIMIT = 50
const AVERAGE_MINIMUM_OBSERVED_MINUTES = 360

export async function enrichHistoryAdditionalRankings(response: Response): Promise<Response> {
  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.includes('application/json')) return response
  try {
    const payload = await response.clone().json<JsonRecord>()
    const result = historyRankingsFromPayload(payload)
    const headers = new Headers(response.headers)
    headers.delete('content-length')
    headers.set('cache-control', 'no-store')
    return Response.json({ ...payload, ...result }, {
      status: response.status,
      statusText: response.statusText,
      headers,
    })
  } catch {
    return response
  }
}

export function historyRankingsFromPayload(payload: JsonRecord): JsonRecord {
  const candidates = records(payload.topStreamers)
    .slice(0, CANDIDATE_LIMIT)
    .map(normalizeCandidate)
    .filter((item) => Boolean(item.streamerId))
  return {
    rankings: {
      viewerMinutes: rank(candidates, 'viewer_minutes'),
      peakViewers: rank(candidates, 'peak_viewers'),
      averageViewers: rank(candidates, 'avg_viewers'),
      observedMinutes: rank(candidates, 'observed_minutes'),
      rising: rank(candidates, 'rising'),
    },
    rankingsMeta: {
      sourcePopulation: 'topStreamers',
      candidateCount: candidates.length,
      candidateLimit: CANDIDATE_LIMIT,
      limitPerRanking: CANDIDATE_LIMIT,
      bounded: true,
      providerSeparated: true,
      averageMinimumObservedMinutes: AVERAGE_MINIMUM_OBSERVED_MINUTES,
      risingRequiresComparableBaseline: true,
      inProgressDayExcluded: true,
    },
  }
}

function rank(candidates: JsonRecord[], key: RankingKey): JsonRecord[] {
  const eligible = key === 'avg_viewers'
    ? candidates.filter((item) => number(item.observedMinutes) >= AVERAGE_MINIMUM_OBSERVED_MINUTES)
    : key === 'rising'
      ? candidates.filter((item) => item.comparisonState === 'comparable' && nullableNumber(item.changePct) !== null && number(item.changePct) > 0)
      : candidates
  return [...eligible]
    .sort((a, b) => metricValue(b, key) - metricValue(a, key) || number(b.viewerMinutes) - number(a.viewerMinutes) || text(a.displayName).localeCompare(text(b.displayName)))
    .slice(0, CANDIDATE_LIMIT)
    .map((item, index) => ({ ...item, rank: index + 1, rankingMetric: key, metricValue: metricValue(item, key) }))
}

function metricValue(item: JsonRecord, key: RankingKey): number {
  if (key === 'peak_viewers') return number(item.peakViewers)
  if (key === 'avg_viewers') return number(item.avgViewers)
  if (key === 'observed_minutes') return number(item.observedMinutes)
  if (key === 'rising') return number(item.changePct)
  return number(item.viewerMinutes)
}

function normalizeCandidate(item: JsonRecord): JsonRecord {
  return {
    streamerId: text(item.streamerId),
    displayName: text(item.displayName),
    viewerMinutes: number(item.viewerMinutes),
    peakViewers: number(item.peakViewers),
    avgViewers: number(item.avgViewers),
    observedMinutes: number(item.observedMinutes),
    rankByViewerMinutes: number(item.rankByViewerMinutes),
    rankByPeak: number(item.rankByPeak),
    changePct: nullableNumber(item.changePct),
    changeAbs: nullableNumber(item.changeAbs),
    comparisonState: comparisonState(item.comparisonState),
  }
}

function records(value: unknown): JsonRecord[] {
  return Array.isArray(value)
    ? value.filter((item): item is JsonRecord => typeof item === 'object' && item !== null && !Array.isArray(item))
    : []
}
function text(value: unknown): string { return typeof value === 'string' ? value.trim() : '' }
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
