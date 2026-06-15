export type HomePlatform = 'twitch' | 'kick'
export type HomeState = 'fresh' | 'partial' | 'stale' | 'empty' | 'demo' | 'error'

type SnapshotRow = {
  provider: string
  bucket_minute: string
  collected_at: string
  stream_count: number
  total_viewers: number
  payload_json: string
  source_mode: string
}

type CoverageRow = {
  covered_pages: number | null
  has_more: number | null
}

type PeakRow = {
  bucket_minute: string
  total_viewers: number
}

type RollupRow = {
  day: string
  total_viewer_minutes: number
  peak_viewers: number
  peak_streamer_name: string | null
  observed_snapshots: number
  observed_stream_count: number
  top_streamers_json: string
  coverage_state: string
}

type RawRecord = Record<string, unknown>

type ParsedStream = {
  id: string
  displayName: string
  title: string
  category: string
  viewers: number
  rawMomentum: number | null
  url: string
}

export type HomeStream = {
  id: string
  displayName: string
  title: string
  category: string
  viewers: number
  previousViewers: number | null
  change: number | null
  changePct: number | null
  direction: 'up' | 'down' | 'flat' | 'unknown'
  url: string
}

export type HomeBattle = {
  left: Pick<HomeStream, 'id' | 'displayName' | 'viewers'>
  right: Pick<HomeStream, 'id' | 'displayName' | 'viewers'>
  gap: number
}

export type HomeSignal = {
  type: 'largest_observed' | 'fastest_riser' | 'closest_gap' | 'top_category'
  label: string
  summary: string
  observedAt: string | null
}

type RollupTopStream = {
  id: string
  displayName: string
  viewerMinutes: number
  peakViewers: number
}

export type ProviderHomePayload = {
  version: 'viewloom-home-v1'
  platform: HomePlatform
  source: 'real' | 'demo'
  sourceMode: string
  state: HomeState
  generatedAt: string
  updatedAt: string | null
  freshness: {
    minutesSinceUpdate: number | null
    staleAfterMinutes: number
  }
  coverage: {
    observedCount: number
    topLimit: number
    coveredPages: number | null
    hasMore: boolean
    mode: string
    label: string
    note: string
  }
  now: {
    observedStreams: number
    observedViewers: number
    largestStream: HomeStream | null
    topStreams: HomeStream[]
    fastestRiser: HomeStream | null
    closestGap: HomeBattle | null
    topCategory: { name: string; viewers: number; streams: number } | null
  }
  today: {
    day: string
    observedPeak: number | null
    peakTime: string | null
    currentObservedViewers: number
    topByViewerMinutes: RollupTopStream | null
    closestCurrentBattle: HomeBattle | null
    latestReversal: null
  }
  recent: {
    latestCompletedDay: string | null
    topStreamer: RollupTopStream | null
    biggestRise: { id: string; displayName: string; changePct: number; changeAbs: number } | null
    coverageState: string | null
    trend: Array<{ day: string; totalViewerMinutes: number; peakViewers: number; coverageState: string }>
  }
  signals: HomeSignal[]
  availability: {
    activity: 'available' | 'unavailable'
    latestReversal: 'available' | 'unavailable'
  }
  notes: string[]
  error?: { code: string; message: string }
}

export type ProviderHomeConfig = {
  platform: HomePlatform
  db: D1Database
  topLimit: number
  staleAfterMinutes: number
}

export async function buildProviderHomeResponse(config: ProviderHomeConfig): Promise<Response> {
  try {
    const payload = await buildProviderHomePayload(config)
    return Response.json(payload, { headers: { 'cache-control': 'no-store' } })
  } catch (error) {
    const payload = errorPayload(config, error)
    return Response.json(payload, { status: 500, headers: { 'cache-control': 'no-store' } })
  }
}

export async function buildProviderHomePayload(config: ProviderHomeConfig): Promise<ProviderHomePayload> {
  const generatedAt = new Date().toISOString()
  const today = generatedAt.slice(0, 10)
  const todayStart = `${today}T00:00:00.000Z`

  const [snapshots, coverageRow, peak, rollups] = await Promise.all([
    fetchLatestSnapshots(config.db, config.platform),
    fetchCoverage(config.db, config.platform),
    fetchTodayPeak(config.db, config.platform, todayStart),
    fetchRecentRollups(config.db, config.platform, today),
  ])

  const latest = snapshots[0] ?? null
  const previous = snapshots[1] ?? null
  const currentParsed = latest ? parseStreams(config.platform, latest.payload_json) : []
  const previousParsed = previous ? parseStreams(config.platform, previous.payload_json) : []
  const topStreams = withMovement(currentParsed, previousParsed).sort((a, b) => b.viewers - a.viewers).slice(0, 5)
  const observedStreams = latest?.stream_count ?? currentParsed.length
  const observedViewers = latest?.total_viewers ?? currentParsed.reduce((sum, stream) => sum + stream.viewers, 0)
  const sourceMode = latest?.source_mode ?? 'missing'
  const minutesSinceUpdate = minutesBetween(latest?.collected_at ?? latest?.bucket_minute ?? null, generatedAt)
  const coverageMeta = providerCoverage(config, latest, coverageRow, observedStreams)
  const state = deriveHomeState({
    platform: config.platform,
    sourceMode,
    minutesSinceUpdate,
    staleAfterMinutes: config.staleAfterMinutes,
    observedStreams,
    hasMore: coverageMeta.hasMore,
  })

  const largestStream = topStreams[0] ?? null
  const fastestRiser = topStreams
    .filter((stream) => typeof stream.changePct === 'number' && stream.changePct > 0)
    .sort((a, b) => (b.changePct ?? 0) - (a.changePct ?? 0))[0] ?? null
  const closestGap = closestBattle(topStreams)
  const topCategory = categorySummary(currentParsed)
  const todayRollup = rollups.find((row) => row.day === today) ?? null
  const completedRollups = rollups.filter((row) => row.day < today).sort((a, b) => b.day.localeCompare(a.day))
  const latestCompleted = completedRollups[0] ?? null
  const previousCompleted = completedRollups[1] ?? null
  const latestTop = parseRollupTopStreams(latestCompleted?.top_streamers_json)
  const previousTop = parseRollupTopStreams(previousCompleted?.top_streamers_json)
  const biggestRise = compareRollupTopStreams(latestTop, previousTop)
  const trend = [...completedRollups]
    .sort((a, b) => a.day.localeCompare(b.day))
    .slice(-7)
    .map((row) => ({
      day: row.day,
      totalViewerMinutes: safeInteger(row.total_viewer_minutes),
      peakViewers: safeInteger(row.peak_viewers),
      coverageState: row.coverage_state || 'unknown',
    }))

  const signals = buildSignals({ largestStream, fastestRiser, closestGap, topCategory, observedAt: latest?.collected_at ?? null })
  const notes = [coverageMeta.note]
  if (!latest) notes.push(`No latest ${config.platform} snapshot was found.`)
  if (!todayRollup) notes.push(`No ${config.platform} daily rollup is available for ${today}; today's top viewer-minutes stream is unavailable.`)
  notes.push('Latest reversal is unavailable in Home v1 until the battle-event summary contract is connected.')
  if (config.platform === 'kick') notes.push('Kick activity remains unavailable and coverage is candidate based rather than Twitch-parity directory coverage.')
  else notes.push('Twitch activity may be sampled or unavailable and is not used for Home ranking totals.')

  return {
    version: 'viewloom-home-v1',
    platform: config.platform,
    source: state === 'demo' ? 'demo' : 'real',
    sourceMode,
    state,
    generatedAt,
    updatedAt: latest?.collected_at ?? latest?.bucket_minute ?? null,
    freshness: {
      minutesSinceUpdate,
      staleAfterMinutes: config.staleAfterMinutes,
    },
    coverage: coverageMeta,
    now: {
      observedStreams,
      observedViewers,
      largestStream,
      topStreams,
      fastestRiser,
      closestGap,
      topCategory,
    },
    today: {
      day: today,
      observedPeak: peak ? safeInteger(peak.total_viewers) : null,
      peakTime: peak?.bucket_minute ?? null,
      currentObservedViewers: observedViewers,
      topByViewerMinutes: parseRollupTopStreams(todayRollup?.top_streamers_json)[0] ?? null,
      closestCurrentBattle: closestGap,
      latestReversal: null,
    },
    recent: {
      latestCompletedDay: latestCompleted?.day ?? null,
      topStreamer: latestTop[0] ?? null,
      biggestRise,
      coverageState: latestCompleted?.coverage_state ?? null,
      trend,
    },
    signals,
    availability: {
      activity: 'unavailable',
      latestReversal: 'unavailable',
    },
    notes,
  }
}

async function fetchLatestSnapshots(db: D1Database, platform: HomePlatform): Promise<SnapshotRow[]> {
  const result = await db.prepare(`
    SELECT provider,bucket_minute,collected_at,stream_count,total_viewers,payload_json,source_mode
    FROM minute_snapshots
    WHERE provider = ?
    ORDER BY bucket_minute DESC
    LIMIT 2
  `).bind(platform).all<SnapshotRow>()
  return result.results ?? []
}

async function fetchCoverage(db: D1Database, platform: HomePlatform): Promise<CoverageRow | null> {
  try {
    return await db.prepare(`
      SELECT covered_pages,has_more
      FROM minute_snapshots
      WHERE provider = ?
      ORDER BY bucket_minute DESC
      LIMIT 1
    `).bind(platform).first<CoverageRow>()
  } catch {
    return null
  }
}

async function fetchTodayPeak(db: D1Database, platform: HomePlatform, todayStart: string): Promise<PeakRow | null> {
  return db.prepare(`
    SELECT bucket_minute,total_viewers
    FROM minute_snapshots
    WHERE provider = ? AND bucket_minute >= ?
    ORDER BY total_viewers DESC, bucket_minute ASC
    LIMIT 1
  `).bind(platform, todayStart).first<PeakRow>()
}

async function fetchRecentRollups(db: D1Database, platform: HomePlatform, today: string): Promise<RollupRow[]> {
  try {
    const result = await db.prepare(`
      SELECT day,total_viewer_minutes,peak_viewers,peak_streamer_name,observed_snapshots,observed_stream_count,top_streamers_json,coverage_state
      FROM daily_rollups
      WHERE provider = ? AND day <= ?
      ORDER BY day DESC
      LIMIT 9
    `).bind(platform, today).all<RollupRow>()
    return result.results ?? []
  } catch {
    return []
  }
}

function providerCoverage(
  config: ProviderHomeConfig,
  latest: SnapshotRow | null,
  row: CoverageRow | null,
  observedCount: number,
): ProviderHomePayload['coverage'] {
  if (config.platform === 'twitch') {
    const hasMore = Boolean(row?.has_more)
    const coveredPages = nullableInteger(row?.covered_pages)
    return {
      observedCount,
      topLimit: config.topLimit,
      coveredPages,
      hasMore,
      mode: hasMore ? 'partial-top-pages' : 'observed-top-pages',
      label: `Top ${config.topLimit} observed`,
      note: hasMore
        ? `More Twitch streams may exist beyond the observed Top ${config.topLimit} window.`
        : `Twitch values describe the latest observed Top ${config.topLimit} window, not a provider-wide total.`,
    }
  }

  const payload = object(safeJson(latest?.payload_json ?? ''))
  const collectorMeta = object(payload?.collectorMeta) ?? {}
  const coverageMode = stringValue(collectorMeta.coverageMode) === 'registry' ? 'registry' : 'seed-list'
  return {
    observedCount,
    topLimit: config.topLimit,
    coveredPages: null,
    hasMore: false,
    mode: coverageMode,
    label: `Top ${config.topLimit} observed candidates`,
    note: coverageMode === 'registry'
      ? 'Kick values describe registry-backed candidate observations and are not Twitch-parity directory coverage.'
      : 'Kick values describe seed-list candidate observations and are not Twitch-parity directory coverage.',
  }
}

export function deriveHomeState(input: {
  platform: HomePlatform
  sourceMode: string
  minutesSinceUpdate: number | null
  staleAfterMinutes: number
  observedStreams: number
  hasMore: boolean
}): HomeState {
  const mode = input.sourceMode.toLowerCase()
  if (mode === 'demo' || mode === 'fixture') return 'demo'
  if (input.minutesSinceUpdate == null) return 'empty'
  if (input.minutesSinceUpdate >= input.staleAfterMinutes) return 'stale'
  if (input.observedStreams === 0) return 'empty'
  if (input.platform === 'kick' && mode !== 'authenticated') return 'partial'
  if (input.hasMore) return 'partial'
  return 'fresh'
}

function parseStreams(platform: HomePlatform, payloadJson: string): ParsedStream[] {
  const payload = object(safeJson(payloadJson))
  const values = Array.isArray(payload?.items) ? payload.items : Array.isArray(payload?.data) ? payload.data : []
  return values.map((value) => parseStream(platform, value)).filter((value): value is ParsedStream => value !== null)
}

function parseStream(platform: HomePlatform, value: unknown): ParsedStream | null {
  const row = object(value)
  if (!row) return null
  const channel = object(row.channel)
  const livestream = object(row.livestream)
  const rawId = platform === 'kick'
    ? row.channelLogin ?? row.slug ?? row.username ?? row.user_slug ?? channel?.slug ?? channel?.username ?? channel?.name
    : row.channelLogin ?? row.id ?? row.login ?? row.user_login ?? row.displayName ?? row.name
  const rawName = platform === 'kick'
    ? row.displayName ?? row.name ?? row.username ?? channel?.displayName ?? channel?.name ?? channel?.username ?? rawId
    : row.displayName ?? row.name ?? row.user_name ?? row.channelLogin ?? rawId
  const id = slug(rawId ?? rawName ?? '')
  const viewers = numberValue(row.viewers ?? row.viewer_count ?? row.viewerCount ?? livestream?.viewer_count)
  if (!id || viewers <= 0) return null
  const category = stringValue(
    row.categoryName ?? row.category ?? row.gameName ?? row.game_name ?? object(row.category)?.name ?? object(row.game)?.name,
  )
  return {
    id,
    displayName: stringValue(rawName) || id,
    title: stringValue(row.title ?? row.streamTitle ?? livestream?.session_title),
    category,
    viewers,
    rawMomentum: nullableNumber(row.momentum),
    url: stringValue(row.url) || (platform === 'kick' ? `https://kick.com/${id}` : `https://www.twitch.tv/${id}`),
  }
}

function withMovement(current: ParsedStream[], previous: ParsedStream[]): HomeStream[] {
  const previousById = new Map(previous.map((stream) => [stream.id, stream]))
  return current.map((stream) => {
    const before = previousById.get(stream.id)
    const previousViewers = before?.viewers ?? null
    const change = previousViewers == null ? null : stream.viewers - previousViewers
    const changePct = previousViewers && previousViewers > 0 ? change! / previousViewers : stream.rawMomentum
    const direction = changePct == null ? 'unknown' : changePct > 0.002 ? 'up' : changePct < -0.002 ? 'down' : 'flat'
    return {
      id: stream.id,
      displayName: stream.displayName,
      title: stream.title,
      category: stream.category,
      viewers: stream.viewers,
      previousViewers,
      change,
      changePct,
      direction,
      url: stream.url,
    }
  })
}

function closestBattle(streams: HomeStream[]): HomeBattle | null {
  const candidates = streams.slice(0, 5)
  let best: HomeBattle | null = null
  for (let leftIndex = 0; leftIndex < candidates.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < candidates.length; rightIndex += 1) {
      const left = candidates[leftIndex]
      const right = candidates[rightIndex]
      const gap = Math.abs(left.viewers - right.viewers)
      if (!best || gap < best.gap) {
        best = {
          left: { id: left.id, displayName: left.displayName, viewers: left.viewers },
          right: { id: right.id, displayName: right.displayName, viewers: right.viewers },
          gap,
        }
      }
    }
  }
  return best
}

function categorySummary(streams: ParsedStream[]): { name: string; viewers: number; streams: number } | null {
  const totals = new Map<string, { viewers: number; streams: number }>()
  for (const stream of streams) {
    if (!stream.category) continue
    const current = totals.get(stream.category) ?? { viewers: 0, streams: 0 }
    current.viewers += stream.viewers
    current.streams += 1
    totals.set(stream.category, current)
  }
  const winner = [...totals.entries()].sort((a, b) => b[1].viewers - a[1].viewers)[0]
  return winner ? { name: winner[0], viewers: winner[1].viewers, streams: winner[1].streams } : null
}

function parseRollupTopStreams(value: string | null | undefined): RollupTopStream[] {
  const parsed = safeJson(value ?? '')
  if (!Array.isArray(parsed)) return []
  return parsed.map((entry) => {
    const row = object(entry)
    if (!row) return null
    const id = slug(row.streamerId ?? row.id ?? row.channelLogin ?? row.displayName ?? row.name ?? '')
    const displayName = stringValue(row.displayName ?? row.name ?? row.channelLogin ?? id)
    const viewerMinutes = numberValue(row.viewerMinutes ?? row.viewer_minutes)
    const peakViewers = numberValue(row.peakViewers ?? row.peak_viewers)
    if (!id || !displayName) return null
    return { id, displayName, viewerMinutes, peakViewers }
  }).filter((entry): entry is RollupTopStream => entry !== null)
}

function compareRollupTopStreams(current: RollupTopStream[], previous: RollupTopStream[]) {
  const previousById = new Map(previous.map((stream) => [stream.id, stream]))
  const candidates = current.map((stream) => {
    const before = previousById.get(stream.id)
    if (!before || before.viewerMinutes <= 0) return null
    const changeAbs = stream.viewerMinutes - before.viewerMinutes
    const changePct = changeAbs / before.viewerMinutes
    return changePct > 0 ? { id: stream.id, displayName: stream.displayName, changePct, changeAbs } : null
  }).filter((entry): entry is { id: string; displayName: string; changePct: number; changeAbs: number } => entry !== null)
  return candidates.sort((a, b) => b.changePct - a.changePct)[0] ?? null
}

function buildSignals(input: {
  largestStream: HomeStream | null
  fastestRiser: HomeStream | null
  closestGap: HomeBattle | null
  topCategory: { name: string; viewers: number; streams: number } | null
  observedAt: string | null
}): HomeSignal[] {
  const result: HomeSignal[] = []
  if (input.largestStream) result.push({
    type: 'largest_observed',
    label: 'Largest observed',
    summary: `${input.largestStream.displayName} · ${input.largestStream.viewers} viewers`,
    observedAt: input.observedAt,
  })
  if (input.fastestRiser) result.push({
    type: 'fastest_riser',
    label: 'Fastest riser',
    summary: `${input.fastestRiser.displayName} · ${formatPercent(input.fastestRiser.changePct)}`,
    observedAt: input.observedAt,
  })
  if (input.closestGap) result.push({
    type: 'closest_gap',
    label: 'Closest current gap',
    summary: `${input.closestGap.left.displayName} / ${input.closestGap.right.displayName} · ${input.closestGap.gap} viewers`,
    observedAt: input.observedAt,
  })
  if (input.topCategory) result.push({
    type: 'top_category',
    label: 'Largest observed category',
    summary: `${input.topCategory.name} · ${input.topCategory.viewers} viewers across ${input.topCategory.streams} streams`,
    observedAt: input.observedAt,
  })
  return result
}

function errorPayload(config: ProviderHomeConfig, error: unknown): ProviderHomePayload {
  const generatedAt = new Date().toISOString()
  const message = sanitizeError(error instanceof Error ? error.message : String(error))
  return {
    version: 'viewloom-home-v1',
    platform: config.platform,
    source: 'real',
    sourceMode: 'unavailable',
    state: 'error',
    generatedAt,
    updatedAt: null,
    freshness: { minutesSinceUpdate: null, staleAfterMinutes: config.staleAfterMinutes },
    coverage: {
      observedCount: 0,
      topLimit: config.topLimit,
      coveredPages: null,
      hasMore: false,
      mode: 'unavailable',
      label: `Top ${config.topLimit} observed`,
      note: `The ${config.platform} Home payload could not read its configured data source.`,
    },
    now: { observedStreams: 0, observedViewers: 0, largestStream: null, topStreams: [], fastestRiser: null, closestGap: null, topCategory: null },
    today: { day: generatedAt.slice(0, 10), observedPeak: null, peakTime: null, currentObservedViewers: 0, topByViewerMinutes: null, closestCurrentBattle: null, latestReversal: null },
    recent: { latestCompletedDay: null, topStreamer: null, biggestRise: null, coverageState: null, trend: [] },
    signals: [],
    availability: { activity: 'unavailable', latestReversal: 'unavailable' },
    notes: ['No demo fallback was substituted for the failed real Home payload.'],
    error: { code: 'home_payload_unavailable', message },
  }
}

function minutesBetween(from: string | null, to: string): number | null {
  if (!from) return null
  const difference = Date.parse(to) - Date.parse(from)
  return Number.isFinite(difference) ? Math.max(0, Math.floor(difference / 60000)) : null
}

function safeJson(value: string): unknown {
  try { return JSON.parse(value) } catch { return null }
}

function object(value: unknown): RawRecord | null {
  return typeof value === 'object' && value !== null ? value as RawRecord : null
}

function stringValue(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function numberValue(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.max(0, Math.round(value))
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/,/g, ''))
    return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : 0
  }
  return 0
}

function nullableNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/,/g, ''))
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function nullableInteger(value: unknown): number | null {
  const parsed = nullableNumber(value)
  return parsed == null ? null : Math.max(0, Math.round(parsed))
}

function safeInteger(value: unknown): number {
  return Math.max(0, Math.round(nullableNumber(value) ?? 0))
}

function slug(value: unknown): string {
  return stringValue(value).toLowerCase().replace(/[^a-z0-9_]+/g, '-').replace(/^-+|-+$/g, '')
}

function formatPercent(value: number | null): string {
  if (value == null || !Number.isFinite(value)) return 'Unavailable'
  return `${value >= 0 ? '+' : ''}${(value * 100).toFixed(1)}%`
}

function sanitizeError(value: string): string {
  return value.replace(/Bearer\s+[A-Za-z0-9._-]+/g, 'Bearer [redacted]').slice(0, 220)
}
