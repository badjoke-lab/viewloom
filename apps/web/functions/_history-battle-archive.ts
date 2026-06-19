type JsonRecord = Record<string, unknown>

type BattleCandidate = {
  streamerId: string
  displayName: string
  viewerMinutes: number
  peakViewers: number
  observedMinutes: number
}

export const HISTORY_BATTLE_ARCHIVE_LIMIT = 30
export const HISTORY_BATTLE_CANDIDATE_LIMIT = 5
export const HISTORY_BATTLE_MIN_OBSERVED_MINUTES = 60

export async function enrichHistoryBattleArchive(response: Response): Promise<Response> {
  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.includes('application/json')) return response

  try {
    const payload = await response.clone().json<JsonRecord>()
    const result = historyBattleArchiveFromPayload(payload)
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

export function historyBattleArchiveFromPayload(payload: JsonRecord): JsonRecord {
  const today = new Date().toISOString().slice(0, 10)
  const completedDays = records(payload.daily)
    .filter((day) => {
      const date = text(day.day)
      return isDay(date) && date < today && text(day.coverageState) !== 'missing'
    })

  const entries = completedDays
    .map(bestDailyPair)
    .filter((entry): entry is JsonRecord => entry !== null)
    .sort((left, right) => number(right.score) - number(left.score) || text(right.day).localeCompare(text(left.day)))
    .slice(0, HISTORY_BATTLE_ARCHIVE_LIMIT)
    .map((entry, index) => ({ ...entry, rank: index + 1 }))

  return {
    battleArchive: entries,
    battleArchiveMeta: {
      sourcePopulation: 'daily.topStreamers',
      archiveBasis: 'daily_aggregate_pair',
      limit: HISTORY_BATTLE_ARCHIVE_LIMIT,
      candidateLimitPerDay: HISTORY_BATTLE_CANDIDATE_LIMIT,
      minimumObservedMinutes: HISTORY_BATTLE_MIN_OBSERVED_MINUTES,
      bounded: true,
      providerSeparated: true,
      inProgressDayExcluded: true,
      exactEventTimesAvailable: false,
      inferredReversals: false,
      completedDaysEvaluated: completedDays.length,
    },
  }
}

function bestDailyPair(day: JsonRecord): JsonRecord | null {
  const candidates = records(day.topStreamers)
    .map(normalizeCandidate)
    .filter((candidate) => candidate.streamerId
      && candidate.viewerMinutes > 0
      && candidate.observedMinutes >= HISTORY_BATTLE_MIN_OBSERVED_MINUTES)
    .sort((left, right) => right.viewerMinutes - left.viewerMinutes)
    .slice(0, HISTORY_BATTLE_CANDIDATE_LIMIT)
  if (candidates.length < 2) return null

  const maximumViewerMinutes = Math.max(1, ...candidates.map((candidate) => candidate.viewerMinutes))
  let best: JsonRecord | null = null

  for (let leftIndex = 0; leftIndex < candidates.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < candidates.length; rightIndex += 1) {
      const left = candidates[leftIndex]
      const right = candidates[rightIndex]
      const gapViewerMinutes = Math.abs(left.viewerMinutes - right.viewerMinutes)
      const closeness = 1 - Math.min(1, gapViewerMinutes / Math.max(left.viewerMinutes, right.viewerMinutes, 1))
      const relevance = ((left.viewerMinutes / maximumViewerMinutes) + (right.viewerMinutes / maximumViewerMinutes)) / 2
      const score = round((closeness * 0.75 + relevance * 0.25) * 100, 2)
      const leader = left.viewerMinutes >= right.viewerMinutes ? left : right
      const challenger = leader === left ? right : left
      const candidate: JsonRecord = {
        day: text(day.day),
        timestamp: null,
        timestampPrecision: 'day',
        battleId: `${left.streamerId}__${right.streamerId}`,
        pair: [left.streamerId, right.streamerId],
        streamerAId: left.streamerId,
        streamerAName: left.displayName,
        streamerBId: right.streamerId,
        streamerBName: right.displayName,
        viewerMinutesA: left.viewerMinutes,
        viewerMinutesB: right.viewerMinutes,
        peakViewersA: left.peakViewers,
        peakViewersB: right.peakViewers,
        leaderId: leader.streamerId,
        leaderName: leader.displayName,
        challengerId: challenger.streamerId,
        challengerName: challenger.displayName,
        viewerMinutesGap: gapViewerMinutes,
        closeness: round(closeness, 4),
        score,
        coverageState: text(day.coverageState) || 'partial',
        archiveBasis: 'daily_aggregate_pair',
        exactEventTimeAvailable: false,
        reversalCount: null,
      }
      if (!best || number(candidate.score) > number(best.score)) best = candidate
    }
  }

  return best
}

function normalizeCandidate(item: JsonRecord): BattleCandidate {
  return {
    streamerId: text(item.streamerId),
    displayName: text(item.displayName) || text(item.streamerId),
    viewerMinutes: number(item.viewerMinutes),
    peakViewers: number(item.peakViewers),
    observedMinutes: number(item.observedMinutes),
  }
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
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0
}

function round(value: number, digits: number): number {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}

function isDay(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const parsed = new Date(`${value}T00:00:00.000Z`)
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
}
