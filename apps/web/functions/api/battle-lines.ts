import type { Env } from '../_db/env'

type SnapshotRow = {
  bucket_minute: string
  collected_at: string
  payload_json: string
  source_mode: string
}

type Item = {
  channelLogin?: string
  displayName?: string
  viewers?: number
}

type Point = {
  time: string
  bucket: string
  value: number | null
  state: 'observed' | 'offline' | 'not_observed' | 'missing'
}

type Line = {
  id: string
  name: string
  points: Point[]
  peakViewers: number
  latestViewers: number | null
  viewerMinutes: number
}

type Pair = [string, string]

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url)
  const top = normalizeTop(url.searchParams.get('top'))
  const bucket = normalizeBucket(url.searchParams.get('bucket'))
  const minutes = bucket === '1m' ? 1 : bucket === '10m' ? 10 : 5
  const period = buildPeriod(url)

  try {
    const rows = await env.DB_TWITCH_HOT.prepare(`
      SELECT bucket_minute, collected_at, payload_json, source_mode
      FROM minute_snapshots
      WHERE provider = ? AND bucket_minute >= ? AND bucket_minute <= ?
      ORDER BY bucket_minute ASC
    `).bind('twitch', period.from, period.to).all<SnapshotRow>()

    const payload = buildPayload(rows.results ?? [], { top, bucket, minutes, period })
    return Response.json(payload, { headers: { 'cache-control': 'no-store' } })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Battle Lines API failed.'
    return Response.json({
      source: 'api',
      state: 'error',
      status: 'error',
      platform: 'twitch',
      updatedAt: new Date().toISOString(),
      top,
      bucket,
      lines: [],
      primaryBattle: null,
      recommendedBattle: null,
      secondaryBattles: [],
      battles: [],
      events: [],
      reversals: [],
      feed: [],
      error: { code: 'battle_lines_api_error', message },
    }, { status: 500 })
  }
}

function buildPayload(rows: SnapshotRow[], options: { top: number; bucket: string; minutes: number; period: { from: string; to: string } }) {
  const buckets = buildBuckets(options.period.from, options.period.to, options.minutes)
  const bucketIndex = new Map(buckets.map((bucket, index) => [bucket, index]))
  const map = new Map<string, { name: string; values: number[] }>()
  let demoRows = 0

  for (const row of rows) {
    const bucket = floorToBucket(row.bucket_minute, options.minutes)
    const index = bucketIndex.get(bucket)
    if (index == null) continue
    if (row.source_mode === 'demo') demoRows += 1
    for (const item of readItems(row.payload_json)) {
      const id = slug(item.channelLogin ?? item.displayName ?? '')
      if (!id) continue
      const entry = map.get(id) ?? { name: String(item.displayName ?? item.channelLogin ?? id), values: Array(buckets.length).fill(-1) }
      const viewers = safeNumber(item.viewers)
      entry.values[index] = Math.max(entry.values[index] ?? -1, viewers)
      map.set(id, entry)
    }
  }

  const lines = [...map.entries()]
    .map(([id, entry]) => toLine(id, entry.name, entry.values, buckets, options.minutes))
    .filter((line) => line.points.some((point) => point.state === 'observed'))
    .sort((a, b) => b.viewerMinutes - a.viewerMinutes)
    .slice(0, options.top)

  const primaryBattle = lines.length >= 2 ? [lines[0].id, lines[1].id] as Pair : null
  const secondaryBattles = buildPairs(lines, primaryBattle)
  const events = primaryBattle ? buildEvents(lines, primaryBattle) : []
  const state = rows.length === 0 || lines.length < 2 ? 'empty' : demoRows >= Math.max(1, rows.length / 2) ? 'demo' : 'live'

  return {
    source: 'api',
    state,
    status: state,
    platform: 'twitch',
    updatedAt: rows.at(-1)?.collected_at ?? new Date().toISOString(),
    generatedAt: new Date().toISOString(),
    top: options.top,
    bucket: options.bucket,
    window: options.period,
    lines,
    primaryBattle,
    recommendedBattle: primaryBattle,
    secondaryBattles,
    battles: secondaryBattles,
    events,
    reversals: events,
    feed: events,
    notes: [
      'ViewLoom-owned Battle Lines payload generated from observed minute snapshots.',
      'Missing and not-observed samples are returned as null values and are not connected as real lines.',
    ],
  }
}

function toLine(id: string, name: string, values: number[], buckets: string[], minutes: number): Line {
  const observed = values.filter((value) => value >= 0)
  const latest = lastObserved(values)
  return {
    id,
    name,
    points: values.map((value, index) => ({
      time: buckets[index].slice(11, 16),
      bucket: buckets[index],
      value: value >= 0 ? value : null,
      state: value > 0 ? 'observed' : value === 0 ? 'offline' : 'not_observed',
    })),
    peakViewers: observed.length > 0 ? Math.max(...observed) : 0,
    latestViewers: latest,
    viewerMinutes: values.reduce((sum, value) => value > 0 ? sum + value * minutes : sum, 0),
  }
}

function buildPairs(lines: Line[], primary: Pair | null): Pair[] {
  const pairs: Pair[] = []
  for (let i = 0; i < lines.length; i += 1) {
    for (let j = i + 1; j < lines.length; j += 1) {
      const pair: Pair = [lines[i].id, lines[j].id]
      if (!primary || !samePair(pair, primary)) pairs.push(pair)
    }
  }
  return pairs.slice(0, 6)
}

function buildEvents(lines: Line[], pair: Pair) {
  const a = lines.find((line) => line.id === pair[0])
  const b = lines.find((line) => line.id === pair[1])
  if (!a || !b) return []
  const events: Array<{ time: string; index: number; label: string; pair: Pair }> = []
  let previousLeader: string | null = null
  for (let index = 0; index < Math.min(a.points.length, b.points.length); index += 1) {
    const av = a.points[index].value
    const bv = b.points[index].value
    if (av === null || bv === null) continue
    const leader = av >= bv ? a : b
    const other = av >= bv ? b : a
    if (previousLeader && previousLeader !== leader.id) {
      events.unshift({ time: a.points[index].time, index, label: `${leader.name} passed ${other.name}`, pair })
    }
    previousLeader = leader.id
  }
  if (events.length === 0) events.push({ time: a.points[0]?.time ?? '00:00', index: 0, label: `${a.name} vs ${b.name} observed`, pair })
  return events.slice(0, 10)
}

function buildPeriod(url: URL): { from: string; to: string } {
  const requestedFrom = url.searchParams.get('from')
  const requestedTo = url.searchParams.get('to')
  if (requestedFrom && requestedTo && !Number.isNaN(Date.parse(requestedFrom)) && !Number.isNaN(Date.parse(requestedTo))) {
    return { from: new Date(requestedFrom).toISOString(), to: new Date(requestedTo).toISOString() }
  }
  const to = new Date()
  const from = new Date(to.getTime() - 24 * 60 * 60 * 1000)
  return { from: from.toISOString(), to: to.toISOString() }
}

function buildBuckets(fromIso: string, toIso: string, minutes: number): string[] {
  const buckets: string[] = []
  let cursor = Date.parse(floorToBucket(fromIso, minutes))
  const end = Date.parse(toIso)
  const step = minutes * 60 * 1000
  while (cursor <= end) {
    buckets.push(new Date(cursor).toISOString())
    cursor += step
  }
  return buckets.length > 0 ? buckets : [floorToBucket(fromIso, minutes)]
}

function floorToBucket(iso: string, minutes: number): string {
  const date = new Date(iso)
  const current = date.getUTCMinutes()
  date.setUTCMinutes(current - (current % minutes), 0, 0)
  return date.toISOString()
}

function readItems(payloadJson: string): Item[] {
  try {
    const parsed = JSON.parse(payloadJson) as { items?: Item[] }
    return Array.isArray(parsed.items) ? parsed.items : []
  } catch {
    return []
  }
}

function normalizeTop(value: unknown): number {
  const n = Number(value)
  if (n === 3 || n === 10) return n
  return 5
}

function normalizeBucket(value: unknown): '1m' | '5m' | '10m' {
  return value === '1m' || value === '10m' ? value : '5m'
}

function lastObserved(values: number[]): number | null {
  for (let i = values.length - 1; i >= 0; i -= 1) if (values[i] >= 0) return values[i]
  return null
}

function samePair(a: Pair, b: Pair): boolean {
  return a.includes(b[0]) && a.includes(b[1])
}

function safeNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0
}

function slug(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9_]+/g, '-').replace(/^-+|-+$/g, '')
}
