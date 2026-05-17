import type { Env } from '../_db/env'

type State = 'not_ready' | 'empty' | 'partial' | 'stale' | 'live' | 'error'
type Metric = 'viewers' | 'indexed'
type Bucket = '1m' | '5m' | '10m'
type PointState = 'observed' | 'missing' | 'not_observed' | 'offline'
type Row = { bucket_minute: string; collected_at: string; total_viewers: number; payload_json: string; source_mode: string }
type Stream = { id: string; name: string; title: string; url: string; viewers: number }
type Acc = { stream: Stream; values: number[]; first: number | null; last: number | null }
type LinePoint = { bucket: string; viewers: number | null; value: number | null; state: PointState }
type Line = { streamerId: string; name: string; title: string; url: string; viewerMinutes: number; peakViewers: number; points: LinePoint[] }
type Battle = { id: string; streamerAId: string; streamerBId: string; streamerAName: string; streamerBName: string; score: number; overlapCount: number; longestRun: number; reversalCount: number; recentOverlap: number; missingPenalty: number }

const MINUTE = 60 * 1000
const STALE_AFTER_MS = 10 * MINUTE
const MAX_ROWS = 1800

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url)
  const now = new Date()
  const topN = parseTop(url.searchParams.get('top'))
  const bucket = parseBucket(url.searchParams.get('bucket'))
  const metric: Metric = url.searchParams.get('metric') === 'indexed' ? 'indexed' : 'viewers'
  const bucketMinutes = bucket === '1m' ? 1 : bucket === '10m' ? 10 : 5
  const range = makeRange(url, now)
  const labels = makeBuckets(range.start, range.end, bucketMinutes)

  try {
    const result = await env.DB_TWITCH_HOT.prepare(`
      SELECT bucket_minute, collected_at, total_viewers, payload_json, source_mode
      FROM minute_snapshots
      WHERE provider = ? AND bucket_minute >= ? AND bucket_minute < ?
      ORDER BY bucket_minute ASC
      LIMIT ${MAX_ROWS}
    `).bind('kick', range.start.toISOString(), range.end.toISOString()).all<Row>()
    const rows = result.results ?? []
    if (rows.length === 0) return json(payload('empty', now.toISOString(), topN, bucket, metric, [], [], [], ['provider=kick returned no rows for this range.']))

    const built = build(rows, labels, bucketMinutes, topN, metric)
    const latest = rows[rows.length - 1]
    const updatedAt = latest?.collected_at || latest?.bucket_minute || now.toISOString()
    const stale = Date.now() - toDate(updatedAt).getTime() > STALE_AFTER_MS
    const state = stateFor(built.lines.length > 0, stale, built.observed, labels.length)
    const notes = [
      `${rows.length} provider=kick snapshot rows read. ${built.observed}/${labels.length} buckets observed.`,
      `source_mode=${latest?.source_mode || 'unknown'}`,
      'Activity / heat fusion is not connected for Kick Battle Lines yet.',
      'Missing, not_observed, and offline points are kept separate and should not be drawn as observed values.',
    ]
    return json(payload(state, updatedAt, topN, bucket, metric, built.lines, built.battles, built.events, notes))
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return json(payload('error', now.toISOString(), topN, bucket, metric, [], [], [], ['Kick Battle Lines API could not read D1 snapshots.', message]), 500)
  }
}

function build(rows: Row[], labels: string[], bucketMinutes: number, topN: number, metric: Metric): { lines: Line[]; battles: Battle[]; events: unknown[]; observed: number } {
  const labelIndex = new Map(labels.map((label, index) => [label, index]))
  const observed = new Set<number>()
  const streams = new Map<string, Acc>()

  for (const row of rows) {
    const index = labelIndex.get(floor(row.bucket_minute, bucketMinutes))
    if (index === undefined) continue
    const items = normalize(row.payload_json)
    if (items.length === 0) continue
    observed.add(index)
    for (const item of items) {
      const current = streams.get(item.id) ?? { stream: item, values: labels.map(() => 0), first: null, last: null }
      current.stream = item
      current.values[index] = Math.max(current.values[index], item.viewers)
      current.first = current.first === null ? index : Math.min(current.first, index)
      current.last = current.last === null ? index : Math.max(current.last, index)
      streams.set(item.id, current)
    }
  }

  const lines = [...streams.values()].map((entry) => makeLine(entry, labels, observed, bucketMinutes, metric))
    .filter((line) => line.viewerMinutes > 0)
    .sort((a, b) => b.viewerMinutes - a.viewerMinutes)
    .slice(0, topN)
  const battles = scoreBattles(lines)
  const events = makeEvents(battles, lines)
  return { lines, battles, events, observed: observed.size }
}

function makeLine(entry: Acc, labels: string[], observed: Set<number>, bucketMinutes: number, metric: Metric): Line {
  const peak = Math.max(0, ...entry.values)
  const points = entry.values.map((viewers, index) => {
    const state = pointState(viewers, index, observed, entry.first, entry.last)
    const observedValue = state === 'observed' ? viewers : null
    return { bucket: labels[index], viewers: observedValue, value: observedValue === null ? null : metric === 'indexed' && peak > 0 ? Math.round((observedValue / peak) * 100) : observedValue, state }
  })
  return { streamerId: entry.stream.id, name: entry.stream.name, title: entry.stream.title, url: entry.stream.url, viewerMinutes: entry.values.reduce((sum, value) => sum + value * bucketMinutes, 0), peakViewers: peak, points }
}

function pointState(viewers: number, index: number, observed: Set<number>, first: number | null, last: number | null): PointState {
  if (!observed.has(index)) return 'not_observed'
  if (viewers > 0) return 'observed'
  if (first !== null && last !== null && index >= first && index <= last) return 'missing'
  return 'offline'
}

function scoreBattles(lines: Line[]): Battle[] {
  const battles: Battle[] = []
  for (let a = 0; a < lines.length; a += 1) {
    for (let b = a + 1; b < lines.length; b += 1) {
      const battle = scorePair(lines[a], lines[b])
      if (battle.overlapCount > 0) battles.push(battle)
    }
  }
  return battles.sort((a, b) => b.score - a.score).slice(0, 6)
}

function scorePair(a: Line, b: Line): Battle {
  let overlap = 0
  let run = 0
  let longest = 0
  let reversals = 0
  let lastLeader = ''
  let recentOverlap = 0
  let missing = 0
  let closeness = 0
  for (let i = 0; i < a.points.length; i += 1) {
    const av = a.points[i].viewers
    const bv = b.points[i].viewers
    if (av === null || bv === null) { missing += 1; run = 0; continue }
    overlap += 1
    run += 1
    longest = Math.max(longest, run)
    if (i > a.points.length - 12) recentOverlap += 1
    const leader = av === bv ? lastLeader : av > bv ? a.streamerId : b.streamerId
    if (lastLeader && leader && leader !== lastLeader) reversals += 1
    lastLeader = leader
    const maxValue = Math.max(av, bv)
    const diff = Math.abs(av - bv)
    closeness += maxValue > 0 ? 1 - Math.min(1, diff / maxValue) : 0
  }
  const missingPenalty = a.points.length > 0 ? missing / a.points.length : 1
  const score = Math.round((closeness * 10) + (reversals * 15) + (longest * 2) + (recentOverlap * 4) - (missingPenalty * 30))
  return { id: `${a.streamerId}__${b.streamerId}`, streamerAId: a.streamerId, streamerBId: b.streamerId, streamerAName: a.name, streamerBName: b.name, score, overlapCount: overlap, longestRun: longest, reversalCount: reversals, recentOverlap, missingPenalty }
}

function makeEvents(battles: Battle[], lines: Line[]): unknown[] {
  return battles.slice(0, 3).map((battle) => ({ type: 'recommended_battle', battleId: battle.id, title: `${battle.streamerAName} vs ${battle.streamerBName}`, score: battle.score, overlapCount: battle.overlapCount, reversalCount: battle.reversalCount, lineCount: lines.length }))
}

function payload(state: State, updatedAt: string, top: number, bucket: Bucket, metric: Metric, lines: Line[], battles: Battle[], events: unknown[], notes: string[]) {
  const primaryBattle = battles[0] ?? null
  return { source: 'api', platform: 'kick', state, status: state, updatedAt, top, bucket, metric, valueMode: metric, metricNote: metric === 'indexed' ? 'Indexed mode normalizes each line peak to 100.' : 'Viewers mode uses observed viewer counts.', lines, primaryBattle, recommendedBattle: primaryBattle, recommendedQuality: primaryBattle ? { score: primaryBattle.score, overlapCount: primaryBattle.overlapCount, missingPenalty: primaryBattle.missingPenalty } : null, secondaryBattles: battles.slice(1, 4), battles, events, reversals: events.filter((event) => typeof event === 'object'), feed: events, notes, contract: { linePointStates: ['observed', 'missing', 'not_observed', 'offline'], requiredBattleFields: ['id', 'streamerAId', 'streamerBId', 'score', 'overlapCount', 'longestRun', 'reversalCount'], requiredLineFields: ['streamerId', 'name', 'url', 'viewerMinutes', 'peakViewers', 'points'] } }
}

function normalize(payloadJson: string): Stream[] {
  const parsed = safeJson(payloadJson)
  const record = object(parsed)
  const rawItems = Array.isArray(record?.items) ? record.items : Array.isArray(record?.data) ? record.data : []
  return rawItems.map(stream).filter((item): item is Stream => item !== null)
}

function stream(raw: unknown): Stream | null {
  const record = object(raw)
  if (!record) return null
  const channel = object(record.channel)
  const live = object(record.livestream)
  const slug = str(record.channelLogin ?? record.slug ?? record.username ?? record.user_slug ?? channel?.slug ?? channel?.username ?? channel?.name)
  const name = str(record.displayName ?? record.name ?? record.username ?? channel?.displayName ?? channel?.name ?? channel?.username ?? slug)
  const viewers = num(record.viewers ?? record.viewer_count ?? record.viewerCount ?? live?.viewer_count)
  const id = slugify(slug || name)
  if (!id || viewers <= 0) return null
  return { id, name: name || id, title: str(record.title ?? record.session_title ?? record.stream_title ?? live?.session_title), viewers, url: str(record.url) || `https://kick.com/${id}` }
}

function makeRange(url: URL, now: Date) {
  const today = now.toISOString().slice(0, 10)
  const raw = url.searchParams.get('rangeMode') ?? url.searchParams.get('range') ?? url.searchParams.get('day') ?? 'today'
  const mode = raw === 'rolling24h' || raw === 'yesterday' ? raw : 'today'
  if (mode === 'rolling24h') return { selectedDate: today, mode, start: new Date(now.getTime() - 24 * 60 * MINUTE), end: now, isRolling: true }
  const selectedDate = validDate(url.searchParams.get('date')) ?? (mode === 'yesterday' ? shift(today, -1) : today)
  const start = new Date(`${selectedDate}T00:00:00.000Z`)
  return { selectedDate, mode, start, end: selectedDate === today ? now : new Date(start.getTime() + 24 * 60 * MINUTE), isRolling: false }
}

function makeBuckets(start: Date, end: Date, bucketMinutes: number): string[] { const labels: string[] = []; for (let time = floorDate(start, bucketMinutes).getTime(); time < end.getTime(); time += bucketMinutes * MINUTE) labels.push(new Date(time).toISOString()); return labels }
function stateFor(hasLines: boolean, stale: boolean, observed: number, expected: number): State { if (!hasLines) return 'empty'; if (stale) return 'stale'; if (expected > 0 && observed / expected < 0.5) return 'partial'; return 'live' }
function json(payloadValue: unknown, status = 200): Response { return Response.json(payloadValue, { status, headers: { 'cache-control': 'no-store' } }) }
function floor(value: string, bucketMinutes: number): string { return floorDate(toDate(value), bucketMinutes).toISOString() }
function floorDate(date: Date, bucketMinutes: number): Date { const copy = new Date(date); copy.setUTCMinutes(Math.floor(copy.getUTCMinutes() / bucketMinutes) * bucketMinutes, 0, 0); return copy }
function toDate(value: string): Date { return new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(value) ? value : `${value}Z`) }
function parseTop(value: string | null): number { const parsed = Number(value); return parsed === 3 || parsed === 5 || parsed === 10 ? parsed : 5 }
function parseBucket(value: string | null): Bucket { return value === '1m' ? '1m' : value === '10m' ? '10m' : '5m' }
function validDate(value: string | null): string | null { return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null }
function shift(date: string, days: number): string { const parsed = new Date(`${date}T00:00:00.000Z`); parsed.setUTCDate(parsed.getUTCDate() + days); return parsed.toISOString().slice(0, 10) }
function safeJson(value: string): unknown { try { return JSON.parse(value) } catch { return null } }
function object(value: unknown): Record<string, unknown> | null { return typeof value === 'object' && value !== null ? value as Record<string, unknown> : null }
function str(value: unknown): string { return typeof value === 'string' ? value.trim() : '' }
function num(value: unknown): number { if (typeof value === 'number' && Number.isFinite(value)) return Math.max(0, Math.round(value)); if (typeof value === 'string') { const parsed = Number(value.replace(/,/g, '')); return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : 0 } return 0 }
function slugify(value: string): string { return value.toLowerCase().replace(/[^a-z0-9_]+/g, '-').replace(/^-+|-+$/g, '') }
