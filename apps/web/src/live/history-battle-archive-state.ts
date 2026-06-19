export type BattleArchiveEntry = {
  rank?: number
  day?: string
  timestamp?: string | null
  timestampPrecision?: 'day' | string
  battleId?: string
  pair?: string[]
  streamerAId?: string
  streamerAName?: string
  streamerBId?: string
  streamerBName?: string
  viewerMinutesA?: number
  viewerMinutesB?: number
  peakViewersA?: number
  peakViewersB?: number
  leaderId?: string
  leaderName?: string
  challengerId?: string
  challengerName?: string
  viewerMinutesGap?: number
  closeness?: number
  score?: number
  coverageState?: string
  archiveBasis?: string
  exactEventTimeAvailable?: boolean
  reversalCount?: number | null
}

type DailyStreamer = {
  streamerId?: string
  displayName?: string
  viewerMinutes?: number
  peakViewers?: number
  observedMinutes?: number
}

type BattleArchiveDay = {
  day?: string
  coverageState?: string
  topStreamers?: DailyStreamer[]
}

export type BattleArchivePayload = {
  battleArchive?: BattleArchiveEntry[]
  daily?: BattleArchiveDay[]
}

const LIMIT = 30
const CANDIDATE_LIMIT = 5
const MIN_OBSERVED_MINUTES = 60
let currentPayload: BattleArchivePayload | null = null

export function installBattleArchivePayloadCapture(onChange: () => void): void {
  const originalFetch = window.fetch.bind(window)
  window.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const response = await originalFetch(input, init)
    const url = new URL(typeof input === 'string' || input instanceof URL ? input : input.url, location.origin)
    if (url.pathname === '/api/history' || url.pathname === '/api/kick-history') {
      try {
        currentPayload = await response.clone().json() as BattleArchivePayload
        onChange()
      } catch {
        currentPayload = null
        onChange()
      }
    }
    return response
  }) as typeof window.fetch
}

export function battleArchivePayload(): BattleArchivePayload | null {
  return currentPayload
}

export function battleArchiveEntries(payload: BattleArchivePayload): BattleArchiveEntry[] {
  const supplied = Array.isArray(payload.battleArchive) ? payload.battleArchive : []
  if (supplied.length) return supplied.slice(0, LIMIT)

  const today = new Date().toISOString().slice(0, 10)
  return (payload.daily ?? [])
    .filter((day) => validDay(day.day) && day.day! < today && day.coverageState !== 'missing')
    .map(bestPair)
    .filter((entry): entry is BattleArchiveEntry => entry !== null)
    .sort((left, right) => number(right.score) - number(left.score) || String(right.day).localeCompare(String(left.day)))
    .slice(0, LIMIT)
    .map((entry, index) => ({ ...entry, rank: index + 1 }))
}

function bestPair(day: BattleArchiveDay): BattleArchiveEntry | null {
  const streams = [...(day.topStreamers ?? [])]
    .filter((stream) => text(stream.streamerId)
      && number(stream.viewerMinutes) > 0
      && number(stream.observedMinutes) >= MIN_OBSERVED_MINUTES)
    .sort((left, right) => number(right.viewerMinutes) - number(left.viewerMinutes))
    .slice(0, CANDIDATE_LIMIT)
  if (streams.length < 2 || !validDay(day.day)) return null

  const maximum = Math.max(1, ...streams.map((stream) => number(stream.viewerMinutes)))
  let best: BattleArchiveEntry | null = null
  for (let leftIndex = 0; leftIndex < streams.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < streams.length; rightIndex += 1) {
      const left = streams[leftIndex]
      const right = streams[rightIndex]
      const leftMinutes = number(left.viewerMinutes)
      const rightMinutes = number(right.viewerMinutes)
      const gap = Math.abs(leftMinutes - rightMinutes)
      const closeness = 1 - Math.min(1, gap / Math.max(leftMinutes, rightMinutes, 1))
      const relevance = ((leftMinutes / maximum) + (rightMinutes / maximum)) / 2
      const score = round((closeness * 0.75 + relevance * 0.25) * 100, 2)
      const leader = leftMinutes >= rightMinutes ? left : right
      const challenger = leader === left ? right : left
      const candidate: BattleArchiveEntry = {
        day: day.day,
        timestamp: null,
        timestampPrecision: 'day',
        battleId: `${text(left.streamerId)}__${text(right.streamerId)}`,
        pair: [text(left.streamerId), text(right.streamerId)],
        streamerAId: text(left.streamerId),
        streamerAName: text(left.displayName) || text(left.streamerId),
        streamerBId: text(right.streamerId),
        streamerBName: text(right.displayName) || text(right.streamerId),
        viewerMinutesA: leftMinutes,
        viewerMinutesB: rightMinutes,
        peakViewersA: number(left.peakViewers),
        peakViewersB: number(right.peakViewers),
        leaderId: text(leader.streamerId),
        leaderName: text(leader.displayName) || text(leader.streamerId),
        challengerId: text(challenger.streamerId),
        challengerName: text(challenger.displayName) || text(challenger.streamerId),
        viewerMinutesGap: gap,
        closeness: round(closeness, 4),
        score,
        coverageState: day.coverageState ?? 'partial',
        archiveBasis: 'daily_aggregate_pair',
        exactEventTimeAvailable: false,
        reversalCount: null,
      }
      if (!best || number(candidate.score) > number(best.score)) best = candidate
    }
  }
  return best
}

function validDay(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const parsed = new Date(`${value}T00:00:00.000Z`)
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
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
