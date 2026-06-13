export type BattleMetric = 'viewers' | 'indexed'
export type BattleBucket = '5m' | '10m'
export type RequestedBattleBucket = '1m' | BattleBucket
export type BattlePointState = 'observed' | 'offline' | 'not_observed' | 'missing'
export type BattlePageState = 'live' | 'partial' | 'stale' | 'empty' | 'demo' | 'error'
export type BattlePeriodMode = 'today' | 'yesterday' | 'date' | 'custom'

export type BattlePeriod = {
  mode: BattlePeriodMode
  selectedDate: string
  from: string
  to: string
  isLive: boolean
}

export type BattleSourceItem = {
  id: string
  name: string
  title?: string
  url?: string
  viewers: number
}

export type BattleSourceRow = {
  bucketMinute: string
  collectedAt: string
  sourceMode: string
  items: BattleSourceItem[]
}

export type BattlePoint = {
  bucket: string
  time: string
  viewers: number | null
  value: number | null
  state: BattlePointState
}

export type BattleLine = {
  id: string
  streamerId: string
  name: string
  displayName: string
  title: string
  url: string
  viewerMinutes: number
  peakViewers: number
  latestViewers: number | null
  latestValue: number | null
  points: BattlePoint[]
}

export type BattlePair = [string, string]
export type GapTrend = 'closing' | 'widening' | 'steady' | 'unavailable'

export type BattleScoreInputs = {
  closeness: number
  overlapContinuity: number
  recentReversal: number
  momentumConflict: number
  rankRelevance: number
  missingPenalty: number
  activityAvailable: false
}

export type BattleModel = {
  id: string
  pair: BattlePair
  streamerAId: string
  streamerBId: string
  streamerAName: string
  streamerBName: string
  score: number
  overlapCount: number
  longestRun: number
  reversalCount: number
  recentOverlap: number
  missingPenalty: number
  currentIndex: number | null
  currentBucket: string | null
  currentLeaderId: string | null
  currentLeaderName: string | null
  currentGap: number | null
  previousGap: number | null
  gapTrend: GapTrend
  latestReversalAt: string | null
  scoreInputs: BattleScoreInputs
}

export type BattleEvent = {
  id: string
  type: 'reversal' | 'rapid_rise' | 'gap_collapse' | 'peak'
  battleId: string
  pair: BattlePair
  time: string
  bucket: string
  index: number
  title: string
  summary: string
  passer?: string
  passed?: string
  gapBefore?: number
  gapAfter?: number
  delta?: number
  streamerId?: string
}

export type BuildBattlePayloadOptions = {
  platform: 'twitch' | 'kick'
  top: number
  requestedBucket: RequestedBattleBucket
  metric: BattleMetric
  period: BattlePeriod
  now?: Date
  sampleIntervalMinutes?: number
}

const MINUTE = 60 * 1000
const STALE_AFTER_MS = 15 * MINUTE

export function normalizeTop(value: unknown): 3 | 5 | 10 {
  const parsed = Number(value)
  if (parsed === 3 || parsed === 10) return parsed
  return 5
}

export function normalizeMetric(value: unknown): BattleMetric {
  return value === 'indexed' ? 'indexed' : 'viewers'
}

export function normalizeRequestedBucket(value: unknown): RequestedBattleBucket {
  if (value === '1m' || value === '10m') return value
  return '5m'
}

export function normalizeDisplayBucket(requested: RequestedBattleBucket, sampleIntervalMinutes = 5): BattleBucket {
  if (requested === '10m') return '10m'
  return sampleIntervalMinutes > 5 ? '10m' : '5m'
}

export function buildBattlePeriod(url: URL, now = new Date()): BattlePeriod {
  const explicitFrom = validInstant(url.searchParams.get('from'))
  const explicitTo = validInstant(url.searchParams.get('to'))
  if (explicitFrom && explicitTo && explicitFrom.getTime() < explicitTo.getTime()) {
    return {
      mode: 'custom',
      selectedDate: explicitFrom.toISOString().slice(0, 10),
      from: explicitFrom.toISOString(),
      to: explicitTo.toISOString(),
      isLive: false,
    }
  }

  const today = now.toISOString().slice(0, 10)
  const requestedMode = String(url.searchParams.get('rangeMode') ?? url.searchParams.get('range') ?? url.searchParams.get('day') ?? 'today').toLowerCase()
  const requestedDate = validDate(url.searchParams.get('date'))
  const mode: BattlePeriodMode = requestedMode === 'yesterday'
    ? 'yesterday'
    : requestedMode === 'date' || (requestedDate && requestedDate !== today)
      ? 'date'
      : 'today'
  const selectedDate = mode === 'yesterday' ? shiftDate(today, -1) : requestedDate ?? today
  const start = new Date(`${selectedDate}T00:00:00.000Z`)
  const end = mode === 'today' && selectedDate === today ? now : new Date(start.getTime() + 24 * 60 * MINUTE)

  return {
    mode,
    selectedDate,
    from: start.toISOString(),
    to: end.toISOString(),
    isLive: mode === 'today' && selectedDate === today,
  }
}

export function buildTimeline(fromIso: string, toIso: string, minutes: number): string[] {
  const start = Date.parse(floorToBucket(fromIso, minutes))
  const rawEnd = Date.parse(toIso)
  if (!Number.isFinite(start) || !Number.isFinite(rawEnd) || rawEnd <= start) return []
  const last = Date.parse(floorToBucket(new Date(rawEnd - 1).toISOString(), minutes))
  const step = minutes * MINUTE
  const buckets: string[] = []
  for (let cursor = start; cursor <= last; cursor += step) buckets.push(new Date(cursor).toISOString())
  return buckets
}

export function buildBattleLinesPayload(rows: BattleSourceRow[], options: BuildBattlePayloadOptions) {
  const now = options.now ?? new Date()
  const bucket = normalizeDisplayBucket(options.requestedBucket, options.sampleIntervalMinutes ?? 5)
  const bucketMinutes = bucket === '10m' ? 10 : 5
  const timeline = buildTimeline(options.period.from, options.period.to, bucketMinutes)
  const bucketIndex = new Map(timeline.map((value, index) => [value, index]))
  const observedBuckets = new Set<number>()
  const streams = new Map<string, {
    item: BattleSourceItem
    values: Array<number | null>
    present: Set<number>
    first: number | null
    last: number | null
  }>()
  let demoRows = 0

  for (const row of rows) {
    const index = bucketIndex.get(floorToBucket(row.bucketMinute, bucketMinutes))
    if (index === undefined) continue
    observedBuckets.add(index)
    if (row.sourceMode === 'demo') demoRows += 1
    for (const rawItem of row.items) {
      const id = slug(rawItem.id || rawItem.name)
      if (!id) continue
      const item: BattleSourceItem = {
        id,
        name: rawItem.name || id,
        title: rawItem.title ?? '',
        url: rawItem.url ?? '',
        viewers: safeViewerCount(rawItem.viewers),
      }
      const entry = streams.get(id) ?? {
        item,
        values: timeline.map(() => null),
        present: new Set<number>(),
        first: null,
        last: null,
      }
      entry.item = { ...entry.item, ...item }
      entry.values[index] = Math.max(entry.values[index] ?? 0, item.viewers)
      entry.present.add(index)
      entry.first = entry.first === null ? index : Math.min(entry.first, index)
      entry.last = entry.last === null ? index : Math.max(entry.last, index)
      streams.set(id, entry)
    }
  }

  const allLines = [...streams.values()]
    .map((entry) => makeLine(entry, timeline, observedBuckets, bucketMinutes, options.metric))
    .filter((line) => line.viewerMinutes > 0)
    .sort((a, b) => b.viewerMinutes - a.viewerMinutes)
  const lines = allLines.slice(0, options.top)
  const battles = scoreBattles(lines, options.metric)
  const primaryBattle = battles[0] ?? null
  const secondaryBattles = battles.slice(1, 4)
  const reversals = primaryBattle ? buildReversalEvents(primaryBattle, lines) : []
  const events = primaryBattle ? buildBattleEvents(primaryBattle, lines, reversals) : []
  const updatedAt = latestRowTime(rows) ?? now.toISOString()
  const coverage = buildCoverage(timeline.length, observedBuckets.size)
  const state = resolveState({
    lines: lines.length,
    rows: rows.length,
    demoRows,
    coverage,
    updatedAt,
    isLive: options.period.isLive,
    now,
  })

  return {
    source: 'api' as const,
    platform: options.platform,
    state,
    status: state,
    updatedAt,
    generatedAt: now.toISOString(),
    top: options.top,
    requestedBucket: options.requestedBucket,
    bucket,
    metric: options.metric,
    valueMode: options.metric,
    sampleIntervalMinutes: options.sampleIntervalMinutes ?? 5,
    availableGranularity: ['5m', '10m'] as BattleBucket[],
    disabledGranularity: options.requestedBucket === '1m'
      ? [{ bucket: '1m' as const, reason: 'Battle Lines snapshots are currently collected every 5 minutes.' }]
      : [],
    granularityNote: options.requestedBucket === '1m'
      ? '1m was requested but Battle Lines uses 5m buckets because snapshots are currently collected every 5 minutes.'
      : `Battle Lines uses ${bucket} display buckets from 5m snapshots.`,
    metricNote: options.metric === 'indexed'
      ? 'Indexed mode normalizes each line peak in the selected day to 100.'
      : 'Viewers mode uses observed viewer counts.',
    window: options.period,
    timeline,
    coverage,
    lines,
    primaryBattle,
    recommendedBattle: primaryBattle,
    recommendedQuality: primaryBattle ? {
      score: primaryBattle.score,
      overlapCount: primaryBattle.overlapCount,
      longestRun: primaryBattle.longestRun,
      reversalCount: primaryBattle.reversalCount,
      missingPenalty: primaryBattle.missingPenalty,
      scoreInputs: primaryBattle.scoreInputs,
    } : null,
    secondaryBattles,
    battles,
    latestReversal: reversals[0] ?? null,
    fastestChallenger: fastestChallenger(primaryBattle, lines),
    events,
    reversals,
    feed: events,
    notes: [
      'All lines share the same UTC bucket timeline.',
      'Missing, not_observed, and offline points stay explicit and are never returned as observed values.',
      'Recommended Battle is stable across Viewers and Indexed because pair scoring uses raw observed viewers.',
      'Activity / heat fusion is unavailable and is not included in the recommendation score.',
    ],
    contract: {
      linePointStates: ['observed', 'missing', 'not_observed', 'offline'] as BattlePointState[],
      requiredBattleFields: ['id', 'pair', 'score', 'currentLeaderId', 'currentGap', 'gapTrend', 'scoreInputs'],
      requiredLineFields: ['id', 'name', 'viewerMinutes', 'peakViewers', 'latestViewers', 'points'],
    },
  }
}

function makeLine(
  entry: {
    item: BattleSourceItem
    values: Array<number | null>
    present: Set<number>
    first: number | null
    last: number | null
  },
  timeline: string[],
  observedBuckets: Set<number>,
  bucketMinutes: number,
  metric: BattleMetric,
): BattleLine {
  const observedValues = entry.values.filter((value): value is number => value !== null && value > 0)
  const peakViewers = observedValues.length > 0 ? Math.max(...observedValues) : 0
  const points = timeline.map((bucket, index): BattlePoint => {
    const raw = entry.values[index]
    const state = pointState(raw, index, entry.present, observedBuckets, entry.first, entry.last)
    const viewers = state === 'observed' && raw !== null ? raw : null
    const value = viewers === null ? null : metric === 'indexed' && peakViewers > 0 ? round((viewers / peakViewers) * 100, 2) : viewers
    return { bucket, time: bucket.slice(11, 16), viewers, value, state }
  })
  const latestPoint = lastObservedPoint(points)
  return {
    id: entry.item.id,
    streamerId: entry.item.id,
    name: entry.item.name,
    displayName: entry.item.name,
    title: entry.item.title ?? '',
    url: entry.item.url ?? '',
    viewerMinutes: observedValues.reduce((sum, value) => sum + value * bucketMinutes, 0),
    peakViewers,
    latestViewers: latestPoint?.viewers ?? null,
    latestValue: latestPoint?.value ?? null,
    points,
  }
}

function pointState(
  raw: number | null,
  index: number,
  present: Set<number>,
  observedBuckets: Set<number>,
  first: number | null,
  last: number | null,
): BattlePointState {
  if (!observedBuckets.has(index)) return 'not_observed'
  if (present.has(index)) return raw !== null && raw > 0 ? 'observed' : 'offline'
  if (first !== null && last !== null && index >= first && index <= last) return 'missing'
  return 'offline'
}

function scoreBattles(lines: BattleLine[], metric: BattleMetric): BattleModel[] {
  const output: BattleModel[] = []
  const maxViewerMinutes = Math.max(1, ...lines.map((line) => line.viewerMinutes))
  for (let aIndex = 0; aIndex < lines.length; aIndex += 1) {
    for (let bIndex = aIndex + 1; bIndex < lines.length; bIndex += 1) {
      const battle = scoreBattle(lines[aIndex], lines[bIndex], metric, maxViewerMinutes)
      if (battle.overlapCount > 0) output.push(battle)
    }
  }
  return output.sort((a, b) => b.score - a.score).slice(0, 6)
}

function scoreBattle(a: BattleLine, b: BattleLine, metric: BattleMetric, maxViewerMinutes: number): BattleModel {
  let overlapCount = 0
  let currentRun = 0
  let longestRun = 0
  let recentOverlap = 0
  let closenessTotal = 0
  let missingCount = 0
  let previousRawLeader: string | null = null
  let reversalCount = 0
  let latestReversalIndex: number | null = null
  const overlapIndexes: number[] = []
  const recentStart = Math.max(0, a.points.length - 12)

  for (let index = 0; index < Math.min(a.points.length, b.points.length); index += 1) {
    const av = a.points[index].viewers
    const bv = b.points[index].viewers
    if (av === null || bv === null) {
      missingCount += 1
      currentRun = 0
      continue
    }
    overlapIndexes.push(index)
    overlapCount += 1
    currentRun += 1
    longestRun = Math.max(longestRun, currentRun)
    if (index >= recentStart) recentOverlap += 1
    const scale = Math.max(av, bv, 1)
    closenessTotal += 1 - Math.min(1, Math.abs(av - bv) / scale)
    const leader: string | null = av === bv ? previousRawLeader : av > bv ? a.id : b.id
    if (previousRawLeader && leader && leader !== previousRawLeader) {
      reversalCount += 1
      latestReversalIndex = index
    }
    if (leader) previousRawLeader = leader
  }

  const totalPoints = Math.max(a.points.length, b.points.length, 1)
  const closeness = overlapCount > 0 ? closenessTotal / overlapCount : 0
  const overlapContinuity = longestRun / totalPoints
  const recentReversal = latestReversalIndex === null ? 0 : Math.max(0, 1 - ((totalPoints - 1 - latestReversalIndex) / 12))
  const momentumConflict = calculateMomentumConflict(a, b)
  const rankRelevance = ((a.viewerMinutes / maxViewerMinutes) + (b.viewerMinutes / maxViewerMinutes)) / 2
  const missingPenalty = missingCount / totalPoints
  const scoreInputs: BattleScoreInputs = {
    closeness: round(closeness, 4),
    overlapContinuity: round(overlapContinuity, 4),
    recentReversal: round(recentReversal, 4),
    momentumConflict: round(momentumConflict, 4),
    rankRelevance: round(rankRelevance, 4),
    missingPenalty: round(missingPenalty, 4),
    activityAvailable: false,
  }
  const score = clamp(round(
    (closeness * 30)
    + (overlapContinuity * 20)
    + (recentReversal * 15)
    + (momentumConflict * 15)
    + (rankRelevance * 20)
    - (missingPenalty * 25),
    2,
  ), 0, 100)
  const currentIndex = overlapIndexes.at(-1) ?? null
  const previousIndex = overlapIndexes.length > 1 ? overlapIndexes.at(-2) ?? null : null
  const current = currentIndex === null ? null : metricSnapshot(a, b, currentIndex, metric)
  const previous = previousIndex === null ? null : metricSnapshot(a, b, previousIndex, metric)
  const currentLeader = current?.leaderId === a.id ? a : current?.leaderId === b.id ? b : null

  return {
    id: `${a.id}__${b.id}`,
    pair: [a.id, b.id],
    streamerAId: a.id,
    streamerBId: b.id,
    streamerAName: a.name,
    streamerBName: b.name,
    score,
    overlapCount,
    longestRun,
    reversalCount,
    recentOverlap,
    missingPenalty: round(missingPenalty, 4),
    currentIndex,
    currentBucket: currentIndex === null ? null : a.points[currentIndex]?.bucket ?? null,
    currentLeaderId: current?.leaderId ?? null,
    currentLeaderName: currentLeader?.name ?? null,
    currentGap: current?.gap ?? null,
    previousGap: previous?.gap ?? null,
    gapTrend: gapTrend(previous?.gap ?? null, current?.gap ?? null),
    latestReversalAt: latestReversalIndex === null ? null : a.points[latestReversalIndex]?.bucket ?? null,
    scoreInputs,
  }
}

function calculateMomentumConflict(a: BattleLine, b: BattleLine): number {
  const indexes: number[] = []
  for (let index = 0; index < Math.min(a.points.length, b.points.length); index += 1) {
    if (a.points[index].viewers !== null && b.points[index].viewers !== null) indexes.push(index)
  }
  if (indexes.length < 2) return 0
  const lastIndexes = indexes.slice(-4)
  const first = lastIndexes[0]
  const last = lastIndexes[lastIndexes.length - 1]
  const aStart = a.points[first].viewers ?? 0
  const aEnd = a.points[last].viewers ?? 0
  const bStart = b.points[first].viewers ?? 0
  const bEnd = b.points[last].viewers ?? 0
  const aChange = aEnd - aStart
  const bChange = bEnd - bStart
  if (aChange === 0 && bChange === 0) return 0
  if ((aChange > 0 && bChange < 0) || (aChange < 0 && bChange > 0)) return 1
  const previousGap = Math.abs(aStart - bStart)
  const currentGap = Math.abs(aEnd - bEnd)
  return currentGap < previousGap ? 0.6 : 0.2
}

function metricSnapshot(a: BattleLine, b: BattleLine, index: number, metric: BattleMetric) {
  const av = metric === 'indexed' ? a.points[index]?.value : a.points[index]?.viewers
  const bv = metric === 'indexed' ? b.points[index]?.value : b.points[index]?.viewers
  if (av === null || av === undefined || bv === null || bv === undefined) return null
  return {
    leaderId: av === bv ? null : av > bv ? a.id : b.id,
    gap: round(Math.abs(av - bv), metric === 'indexed' ? 2 : 0),
  }
}

function buildReversalEvents(battle: BattleModel, lines: BattleLine[]): BattleEvent[] {
  const a = lines.find((line) => line.id === battle.streamerAId)
  const b = lines.find((line) => line.id === battle.streamerBId)
  if (!a || !b) return []
  const events: BattleEvent[] = []
  let previousLeaderId: string | null = null
  let previousGap: number | null = null
  for (let index = 0; index < Math.min(a.points.length, b.points.length); index += 1) {
    const av = a.points[index].value
    const bv = b.points[index].value
    if (av === null || bv === null || av === bv) continue
    const leader = av > bv ? a : b
    const passed = av > bv ? b : a
    const gap = round(Math.abs(av - bv), 2)
    if (previousLeaderId && previousLeaderId !== leader.id) {
      const bucket = a.points[index].bucket
      events.unshift({
        id: `reversal:${battle.id}:${bucket}`,
        type: 'reversal',
        battleId: battle.id,
        pair: battle.pair,
        time: bucket,
        bucket,
        index,
        title: `${leader.name} passed ${passed.name}`,
        summary: `${formatNumber(previousGap)} gap before · ${formatNumber(gap)} gap after`,
        passer: leader.name,
        passed: passed.name,
        gapBefore: previousGap ?? undefined,
        gapAfter: gap,
      })
    }
    previousLeaderId = leader.id
    previousGap = gap
  }
  return events
}

function buildBattleEvents(battle: BattleModel, lines: BattleLine[], reversals: BattleEvent[]): BattleEvent[] {
  const a = lines.find((line) => line.id === battle.streamerAId)
  const b = lines.find((line) => line.id === battle.streamerBId)
  if (!a || !b) return reversals
  const events = [...reversals]
  const riseA = largestRise(a, battle)
  const riseB = largestRise(b, battle)
  if (riseA) events.push(riseA)
  if (riseB) events.push(riseB)
  const collapse = largestGapCollapse(a, b, battle)
  if (collapse) events.push(collapse)
  const peakA = peakEvent(a, battle)
  const peakB = peakEvent(b, battle)
  if (peakA) events.push(peakA)
  if (peakB) events.push(peakB)
  return events.sort((left, right) => right.index - left.index).slice(0, 20)
}

function largestRise(line: BattleLine, battle: BattleModel): BattleEvent | null {
  let best: { index: number; delta: number } | null = null
  for (let index = 1; index < line.points.length; index += 1) {
    const previous = line.points[index - 1].viewers
    const current = line.points[index].viewers
    if (previous === null || current === null) continue
    const delta = current - previous
    if (delta > 0 && (!best || delta > best.delta)) best = { index, delta }
  }
  if (!best) return null
  const bucket = line.points[best.index].bucket
  return {
    id: `rise:${battle.id}:${line.id}:${bucket}`,
    type: 'rapid_rise',
    battleId: battle.id,
    pair: battle.pair,
    time: bucket,
    bucket,
    index: best.index,
    title: `${line.name} rose fastest`,
    summary: `+${formatNumber(best.delta)} viewers in one bucket`,
    delta: best.delta,
    streamerId: line.id,
  }
}

function largestGapCollapse(a: BattleLine, b: BattleLine, battle: BattleModel): BattleEvent | null {
  let best: { index: number; drop: number; before: number; after: number } | null = null
  for (let index = 1; index < Math.min(a.points.length, b.points.length); index += 1) {
    const previousA = a.points[index - 1].value
    const previousB = b.points[index - 1].value
    const currentA = a.points[index].value
    const currentB = b.points[index].value
    if (previousA === null || previousB === null || currentA === null || currentB === null) continue
    const before = Math.abs(previousA - previousB)
    const after = Math.abs(currentA - currentB)
    const drop = before - after
    if (drop > 0 && (!best || drop > best.drop)) best = { index, drop, before, after }
  }
  if (!best) return null
  const bucket = a.points[best.index].bucket
  return {
    id: `gap-collapse:${battle.id}:${bucket}`,
    type: 'gap_collapse',
    battleId: battle.id,
    pair: battle.pair,
    time: bucket,
    bucket,
    index: best.index,
    title: `${a.name} vs ${b.name} tightened`,
    summary: `${formatNumber(best.before)} → ${formatNumber(best.after)} gap`,
    gapBefore: round(best.before, 2),
    gapAfter: round(best.after, 2),
  }
}

function peakEvent(line: BattleLine, battle: BattleModel): BattleEvent | null {
  let peakIndex = -1
  let peak = -1
  for (let index = 0; index < line.points.length; index += 1) {
    const value = line.points[index].viewers
    if (value !== null && value > peak) {
      peak = value
      peakIndex = index
    }
  }
  if (peakIndex < 0) return null
  const bucket = line.points[peakIndex].bucket
  return {
    id: `peak:${battle.id}:${line.id}:${bucket}`,
    type: 'peak',
    battleId: battle.id,
    pair: battle.pair,
    time: bucket,
    bucket,
    index: peakIndex,
    title: `${line.name} reached its daily peak`,
    summary: `${formatNumber(peak)} viewers`,
    streamerId: line.id,
  }
}

function fastestChallenger(battle: BattleModel | null, lines: BattleLine[]) {
  if (!battle) return null
  const candidates = battle.pair
    .map((id) => lines.find((line) => line.id === id))
    .filter((line): line is BattleLine => Boolean(line))
    .map((line) => {
      let bestDelta = 0
      let at: string | null = null
      for (let index = 1; index < line.points.length; index += 1) {
        const previous = line.points[index - 1].viewers
        const current = line.points[index].viewers
        if (previous === null || current === null) continue
        const delta = current - previous
        if (delta > bestDelta) {
          bestDelta = delta
          at = line.points[index].bucket
        }
      }
      return { streamerId: line.id, streamerName: line.name, delta: bestDelta, at }
    })
    .sort((a, b) => b.delta - a.delta)
  return candidates[0]?.delta ? candidates[0] : null
}

function buildCoverage(expectedBuckets: number, observedBuckets: number) {
  const missingBuckets = Math.max(0, expectedBuckets - observedBuckets)
  return {
    expectedBuckets,
    observedBuckets,
    missingBuckets,
    missingRatio: expectedBuckets > 0 ? round(missingBuckets / expectedBuckets, 4) : 1,
  }
}

function resolveState(input: {
  lines: number
  rows: number
  demoRows: number
  coverage: { missingRatio: number; observedBuckets: number }
  updatedAt: string
  isLive: boolean
  now: Date
}): BattlePageState {
  if (input.lines < 2 || input.coverage.observedBuckets === 0) return 'empty'
  if (input.rows > 0 && input.demoRows >= Math.max(1, Math.ceil(input.rows / 2))) return 'demo'
  if (input.isLive && input.now.getTime() - Date.parse(input.updatedAt) > STALE_AFTER_MS) return 'stale'
  if (input.coverage.missingRatio > 0.1) return 'partial'
  return 'live'
}

function gapTrend(previous: number | null, current: number | null): GapTrend {
  if (previous === null || current === null) return 'unavailable'
  const tolerance = Math.max(1, previous * 0.02)
  if (current < previous - tolerance) return 'closing'
  if (current > previous + tolerance) return 'widening'
  return 'steady'
}

function lastObservedPoint(points: BattlePoint[]): BattlePoint | null {
  for (let index = points.length - 1; index >= 0; index -= 1) {
    if (points[index].state === 'observed') return points[index]
  }
  return null
}

function latestRowTime(rows: BattleSourceRow[]): string | null {
  let latest: string | null = null
  let latestMs = -1
  for (const row of rows) {
    const candidate = validInstant(row.collectedAt) ?? validInstant(row.bucketMinute)
    if (candidate && candidate.getTime() > latestMs) {
      latest = candidate.toISOString()
      latestMs = candidate.getTime()
    }
  }
  return latest
}

function validDate(value: string | null): string | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const date = new Date(`${value}T00:00:00.000Z`)
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? null : value
}

function validInstant(value: string | null): Date | null {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function shiftDate(value: string, days: number): string {
  const date = new Date(`${value}T00:00:00.000Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

function floorToBucket(iso: string, minutes: number): string {
  const date = new Date(iso)
  const current = date.getUTCMinutes()
  date.setUTCMinutes(current - (current % minutes), 0, 0)
  return date.toISOString()
}

function safeViewerCount(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0
}

function slug(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9_]+/g, '-').replace(/^-+|-+$/g, '')
}

function round(value: number, digits: number): number {
  const scale = 10 ** digits
  return Math.round(value * scale) / scale
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function formatNumber(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return '—'
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(value)
}
