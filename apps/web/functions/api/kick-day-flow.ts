import type { Env } from '../_db/env'

type State = 'not_ready' | 'empty' | 'partial' | 'stale' | 'live' | 'error'
type Metric = 'volume' | 'share'
type Row = { bucket_minute: string; collected_at: string; total_viewers: number; payload_json: string; source_mode: string }
type Stream = { id: string; name: string; title: string; url: string; viewers: number }
type Acc = { stream: Stream; sums: number[]; counts: number[]; firstSeen: string | null; lastSeen: string | null }
type Band = {
  streamerId: string
  name: string
  title: string
  url: string
  isOthers?: boolean
  totalViewerMinutes: number
  peakViewers: number
  avgViewers: number
  peakShare: number
  biggestRiseBucket: string | null
  biggestRiseValue: number
  firstSeen: string | null
  lastSeen: string | null
  buckets: Array<{ viewers: number; share: number; activity: number; activityAvailable: boolean; peak: boolean; rise: boolean }>
}

const MINUTE = 60 * 1000
const STALE_AFTER_MS = 10 * MINUTE
const MAX_ROWS = 1600

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url)
  const now = new Date()
  const bucketSize: 5 | 10 = Number(url.searchParams.get('bucket')) === 10 ? 10 : 5
  const topN = top(url.searchParams.get('top'))
  const valueMode: Metric = url.searchParams.get('metric') === 'share' || url.searchParams.get('mode') === 'share' ? 'share' : 'volume'
  const range = getRange(url, now)
  const bucketLabels = buckets(range.start, range.end, bucketSize)

  try {
    const result = await env.DB_TWITCH_HOT.prepare(`
      SELECT bucket_minute, collected_at, total_viewers, payload_json, source_mode
      FROM minute_snapshots
      WHERE provider = ? AND bucket_minute >= ? AND bucket_minute < ?
      ORDER BY bucket_minute ASC
      LIMIT ${MAX_ROWS}
    `).bind('kick', range.start.toISOString(), range.end.toISOString()).all<Row>()

    const rows = result.results ?? []
    if (rows.length === 0) {
      return json(empty('empty', 'No Kick snapshots exist in the selected Day Flow window.', 'provider=kick returned no rows for this range.', '', now.toISOString(), range, bucketSize, topN, valueMode, bucketLabels))
    }

    const built = build(rows, bucketLabels, bucketSize, topN)
    const latest = rows[rows.length - 1]
    const lastUpdated = latest?.collected_at || latest?.bucket_minute || now.toISOString()
    const stale = Date.now() - parseTime(lastUpdated).getTime() > STALE_AFTER_MS
    const state = getState(built.bands.length > 0, stale, built.observed, bucketLabels.length)
    const partialNote = state === 'partial' ? `Only ${built.observed}/${bucketLabels.length} Day Flow buckets have observed Kick samples in this window.` : ''

    return json({
      ok: true,
      source: 'api',
      platform: 'kick',
      state,
      status: state,
      note: note(state, built.bands.length),
      coverageNote: `${rows.length} provider=kick snapshot rows read. ${built.observed}/${bucketLabels.length} buckets observed. source_mode=${latest?.source_mode || 'unknown'}.`,
      partialNote,
      lastUpdated,
      selectedDate: range.selectedDate,
      bucketSize,
      topN,
      valueMode,
      rangeMode: range.mode,
      windowStart: range.start.toISOString(),
      windowEnd: range.end.toISOString(),
      isRolling: range.isRolling,
      buckets: bucketLabels,
      totalViewersByBucket: built.totals,
      bands: built.bands,
      detailPanelSource: { defaultStreamerId: built.streamers[0]?.streamerId ?? null, streamers: built.streamers },
      activity: { available: false, note: 'Kick activity data is not connected yet. Day Flow bands use observed viewer counts only.' },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return json(empty('error', 'Kick Day Flow API could not read D1 snapshots.', message, '', now.toISOString(), range, bucketSize, topN, valueMode, bucketLabels), 500)
  }
}

function build(rows: Row[], labels: string[], bucketSize: 5 | 10, topN: number): { bands: Band[]; streamers: ReturnType<typeof streamer>[]; totals: number[]; observed: number } {
  const indexByLabel = new Map(labels.map((label, index) => [label, index]))
  const streams = new Map<string, Acc>()
  const totalSums = labels.map(() => 0)
  const totalCounts = labels.map(() => 0)
  const observed = new Set<number>()

  for (const row of rows) {
    const index = indexByLabel.get(floor(row.bucket_minute, bucketSize))
    if (index === undefined) continue
    const items = normalize(row.payload_json)
    if (items.length === 0) continue
    observed.add(index)
    totalSums[index] += items.reduce((sum, item) => sum + item.viewers, 0)
    totalCounts[index] += 1
    for (const item of items) {
      const acc = streams.get(item.id) ?? { stream: item, sums: labels.map(() => 0), counts: labels.map(() => 0), firstSeen: null, lastSeen: null }
      acc.stream = item
      acc.sums[index] += item.viewers
      acc.counts[index] += 1
      acc.firstSeen = min(acc.firstSeen, row.bucket_minute)
      acc.lastSeen = max(acc.lastSeen, row.bucket_minute)
      streams.set(item.id, acc)
    }
  }

  const totals = totalSums.map((sum, index) => totalCounts[index] > 0 ? Math.round(sum / totalCounts[index]) : 0)
  const all = [...streams.values()].map((acc) => {
    const viewers = acc.sums.map((sum, index) => acc.counts[index] > 0 ? Math.round(sum / acc.counts[index]) : 0)
    return makeBand(acc.stream, viewers, labels, totals, bucketSize, acc.firstSeen, acc.lastSeen)
  }).filter((band) => band.totalViewerMinutes > 0).sort((a, b) => b.totalViewerMinutes - a.totalViewerMinutes)

  const topBands = all.slice(0, topN)
  const rest = all.slice(topN)
  const others = rest.length > 0 ? makeOthers(rest, labels, totals, bucketSize) : null
  const bands = others ? [...topBands, others] : topBands
  return { bands, streamers: topBands.map(streamer), totals, observed: observed.size }
}

function makeBand(stream: Stream, viewers: number[], labels: string[], totals: number[], bucketSize: 5 | 10, firstSeen: string | null, lastSeen: string | null): Band {
  const peak = Math.max(0, ...viewers)
  const nonZero = viewers.filter((value) => value > 0)
  const shares = viewers.map((value, index) => totals[index] > 0 ? value / totals[index] : 0)
  const rise = biggestRise(viewers, labels)
  return {
    streamerId: stream.id,
    name: stream.name,
    title: stream.title,
    url: stream.url,
    totalViewerMinutes: viewers.reduce((sum, value) => sum + value * bucketSize, 0),
    peakViewers: peak,
    avgViewers: nonZero.length ? Math.round(nonZero.reduce((sum, value) => sum + value, 0) / nonZero.length) : 0,
    peakShare: Math.max(0, ...shares),
    biggestRiseBucket: rise.bucket,
    biggestRiseValue: rise.value,
    firstSeen,
    lastSeen,
    buckets: viewers.map((value, index) => ({ viewers: value, share: shares[index], activity: 0, activityAvailable: false, peak: value > 0 && value === peak, rise: index === rise.index && rise.value > 0 })),
  }
}

function makeOthers(bands: Band[], labels: string[], totals: number[], bucketSize: 5 | 10): Band {
  const viewers = labels.map((_, index) => bands.reduce((sum, band) => sum + band.buckets[index].viewers, 0))
  return { ...makeBand({ id: 'others', name: 'Others', title: 'Observed Kick streams outside the selected Top N.', url: '', viewers: 0 }, viewers, labels, totals, bucketSize, null, null), isOthers: true }
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

function streamer(band: Band) {
  return { streamerId: band.streamerId, name: band.name, title: band.title, url: band.url, peakViewers: band.peakViewers, avgViewers: band.avgViewers, viewerMinutes: band.totalViewerMinutes, peakShare: band.peakShare, biggestRiseTime: band.biggestRiseBucket, biggestRiseValue: band.biggestRiseValue, firstSeen: band.firstSeen, lastSeen: band.lastSeen }
}

function empty(state: State, noteText: string, coverageNote: string, partialNote: string, lastUpdated: string, range: ReturnType<typeof getRange>, bucketSize: 5 | 10, topN: number, valueMode: Metric, labels: string[]) {
  return { ok: state !== 'error', source: 'api', platform: 'kick', state, status: state, note: noteText, coverageNote, partialNote, lastUpdated, selectedDate: range.selectedDate, bucketSize, topN, valueMode, rangeMode: range.mode, windowStart: range.start.toISOString(), windowEnd: range.end.toISOString(), isRolling: range.isRolling, buckets: labels, totalViewersByBucket: labels.map(() => 0), bands: [], detailPanelSource: { defaultStreamerId: null, streamers: [] }, activity: { available: false, note: 'Kick activity data is not connected yet.' } }
}

function getRange(url: URL, now: Date) {
  const today = now.toISOString().slice(0, 10)
  const mode = url.searchParams.get('rangeMode') === 'rolling24h' ? 'rolling24h' : url.searchParams.get('rangeMode') === 'yesterday' || url.searchParams.get('day') === 'yesterday' ? 'yesterday' : 'today'
  if (mode === 'rolling24h') return { selectedDate: today, mode, start: new Date(now.getTime() - 24 * 60 * MINUTE), end: now, isRolling: true }
  const selectedDate = validDate(url.searchParams.get('date')) ?? (mode === 'yesterday' ? shift(today, -1) : today)
  const start = new Date(`${selectedDate}T00:00:00.000Z`)
  return { selectedDate, mode, start, end: selectedDate === today ? now : new Date(start.getTime() + 24 * 60 * MINUTE), isRolling: false }
}

function buckets(start: Date, end: Date, bucketSize: 5 | 10): string[] {
  const labels: string[] = []
  for (let time = floorDate(start, bucketSize).getTime(); time < end.getTime(); time += bucketSize * MINUTE) labels.push(new Date(time).toISOString())
  return labels
}

function getState(hasBands: boolean, stale: boolean, observed: number, expected: number): State { if (!hasBands) return 'empty'; if (stale) return 'stale'; if (expected > 0 && observed / expected < 0.5) return 'partial'; return 'live' }
function note(state: State, count: number): string { return state === 'live' ? `${count} Kick Day Flow bands from observed provider rows.` : state === 'partial' ? `${count} Kick Day Flow bands from a sparse observed window.` : state === 'stale' ? `${count} Kick Day Flow bands are available, but the latest snapshot is stale.` : 'Kick provider rows exist, but no usable Day Flow bands were found.' }
function biggestRise(values: number[], labels: string[]) { let index = -1; let value = 0; for (let i = 1; i < values.length; i += 1) { const delta = values[i] - values[i - 1]; if (delta > value) { index = i; value = delta } } return { index, value, bucket: index >= 0 ? labels[index] : null } }
function json(payload: unknown, status = 200): Response { return Response.json(payload, { status, headers: { 'cache-control': 'no-store' } }) }
function floor(value: string, bucketSize: 5 | 10): string { return floorDate(parseTime(value), bucketSize).toISOString() }
function floorDate(date: Date, bucketSize: 5 | 10): Date { const copy = new Date(date); copy.setUTCMinutes(Math.floor(copy.getUTCMinutes() / bucketSize) * bucketSize, 0, 0); return copy }
function parseTime(value: string): Date { return new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(value) ? value : `${value}Z`) }
function top(value: string | null): number { const parsed = Number(value); return parsed === 10 || parsed === 20 || parsed === 50 ? parsed : 20 }
function validDate(value: string | null): string | null { return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null }
function shift(date: string, days: number): string { const parsed = new Date(`${date}T00:00:00.000Z`); parsed.setUTCDate(parsed.getUTCDate() + days); return parsed.toISOString().slice(0, 10) }
function min(a: string | null, b: string | null): string | null { if (!a) return b; if (!b) return a; return a < b ? a : b }
function max(a: string | null, b: string | null): string | null { if (!a) return b; if (!b) return a; return a > b ? a : b }
function safeJson(value: string): unknown { try { return JSON.parse(value) } catch { return null } }
function object(value: unknown): Record<string, unknown> | null { return typeof value === 'object' && value !== null ? value as Record<string, unknown> : null }
function str(value: unknown): string { return typeof value === 'string' ? value.trim() : '' }
function num(value: unknown): number { if (typeof value === 'number' && Number.isFinite(value)) return Math.max(0, Math.round(value)); if (typeof value === 'string') { const parsed = Number(value.replace(/,/g, '')); return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : 0 } return 0 }
function slugify(value: string): string { return value.toLowerCase().replace(/[^a-z0-9_]+/g, '-').replace(/^-+|-+$/g, '') }
