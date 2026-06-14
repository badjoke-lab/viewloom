import {
  DAILY_BASELINE_MINUTES,
  DEFAULT_SAMPLE_MINUTES,
  MAX_SAMPLE_MINUTES,
  PERIOD_BASELINE_MINUTES,
  addDays,
  biggestRise,
  expectedMinutesForDay,
  num,
  ranked,
  record,
  slug,
  type BuiltHistory,
  type DailySummary,
  type RawDay,
  type RollupRow,
  type SnapshotRow,
  type StreamAgg,
} from './model'

export type ParsedStream = { id: string; displayName: string; viewers: number }

export function fromRollups(rows: RollupRow[], previousRows: RollupRow[]): BuiltHistory {
  const rowByDay = new Map([...previousRows, ...rows].map((row) => [row.day, row]))
  const daily = rows.map((row) => {
    const currentStreams = streamsForRollup(row)
    const previousRow = rowByDay.get(addDays(row.day, -1))
    const previousStreams = streamsForRollup(previousRow)
    const topStreamers = ranked(
      currentStreams,
      previousStreams,
      10,
      DAILY_BASELINE_MINUTES,
      Boolean(previousRow && num(previousRow.observed_snapshots) > 0),
    )
    return {
      day: row.day,
      totalViewerMinutes: num(row.total_viewer_minutes),
      peakViewers: num(row.peak_viewers),
      peakStreamerName: row.peak_streamer_name,
      observedStreamCount: num(row.observed_stream_count),
      observedMinutes: num(row.observed_snapshots) * DEFAULT_SAMPLE_MINUTES,
      coverageState: row.coverage_state || 'partial',
      topStreamers,
      biggestRise: biggestRise(topStreamers),
    } satisfies DailySummary
  })

  const today = new Date().toISOString().slice(0, 10)
  const completedRows = rows.filter((row) => row.day < today)
  const completedPreviousRows = previousRows.filter((row) => row.day < today)
  const comparisonAvailable = completedPreviousRows.some((row) => num(row.observed_snapshots) > 0)
  return {
    daily,
    topStreamers: ranked(
      streamsFromRollups(completedRows),
      streamsFromRollups(completedPreviousRows),
      50,
      PERIOD_BASELINE_MINUTES,
      comparisonAvailable,
    ),
    comparisonAvailable,
  }
}

export function fromRaw(
  rows: SnapshotRow[],
  previousRows: SnapshotRow[],
  parseStream: (item: Record<string, unknown>) => ParsedStream | null,
  demoModes: string[],
): BuiltHistory {
  const current = buildRaw(rows, parseStream, demoModes)
  const previous = buildRaw(previousRows, parseStream, demoModes)
  const allDays = new Map([...previous.days, ...current.days])
  const daily = [...current.days.values()]
    .sort((a, b) => a.day.localeCompare(b.day))
    .map((day) => rawDaySummary(day, allDays.get(addDays(day.day, -1))))
  const today = new Date().toISOString().slice(0, 10)
  const completedCurrentStreams = streamsFromRawDays(
    [...current.days.values()].filter((day) => day.day < today),
  )
  const previousStreams = streamsFromRawDays([...previous.days.values()])
  const comparisonAvailable = previousRows.length > 0 && previous.days.size > 0
  return {
    daily,
    topStreamers: ranked(
      completedCurrentStreams,
      previousStreams,
      50,
      PERIOD_BASELINE_MINUTES,
      comparisonAvailable,
    ),
    comparisonAvailable,
  }
}

function streamsForRollup(row?: RollupRow): Map<string, StreamAgg> {
  const map = new Map<string, StreamAgg>()
  if (!row) return map
  for (const raw of jsonArray(row.top_streamers_json)) {
    const id = slug(raw.streamerId ?? raw.channelLogin ?? raw.displayName)
    if (!id) continue
    map.set(id, {
      id,
      displayName: String(raw.displayName ?? raw.channelLogin ?? id),
      viewerMinutes: num(raw.viewerMinutes),
      peakViewers: num(raw.peakViewers),
      observedMinutes: num(raw.observedMinutes),
    })
  }
  return map
}

function streamsFromRollups(rows: RollupRow[]): Map<string, StreamAgg> {
  const map = new Map<string, StreamAgg>()
  for (const row of rows) {
    for (const raw of jsonArray(row.top_streamers_json)) {
      const id = slug(raw.streamerId ?? raw.channelLogin ?? raw.displayName)
      if (!id) continue
      const current = map.get(id) ?? {
        id,
        displayName: String(raw.displayName ?? raw.channelLogin ?? id),
        viewerMinutes: 0,
        peakViewers: 0,
        observedMinutes: 0,
      }
      current.displayName = String(raw.displayName ?? raw.channelLogin ?? current.displayName)
      current.viewerMinutes += num(raw.viewerMinutes)
      current.peakViewers = Math.max(current.peakViewers, num(raw.peakViewers))
      current.observedMinutes += num(raw.observedMinutes)
      map.set(id, current)
    }
  }
  return map
}

function streamsFromRawDays(days: RawDay[]): Map<string, StreamAgg> {
  const map = new Map<string, StreamAgg>()
  for (const day of days) {
    for (const stream of day.streams.values()) {
      const current = map.get(stream.id) ?? {
        id: stream.id,
        displayName: stream.displayName,
        viewerMinutes: 0,
        peakViewers: 0,
        observedMinutes: 0,
      }
      current.displayName = stream.displayName || current.displayName
      current.viewerMinutes += stream.viewerMinutes
      current.peakViewers = Math.max(current.peakViewers, stream.peakViewers)
      current.observedMinutes += stream.observedMinutes
      map.set(stream.id, current)
    }
  }
  return map
}

function buildRaw(
  rows: SnapshotRow[],
  parseStream: (item: Record<string, unknown>) => ParsedStream | null,
  demoModes: string[],
) {
  const days = new Map<string, RawDay>()
  const streams = new Map<string, StreamAgg>()
  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index]
    const weightMinutes = sampleWeightMinutes(rows, index)
    const dayKey = row.bucket_minute.slice(0, 10)
    const day = days.get(dayKey) ?? emptyRawDay(dayKey)
    day.totalViewerMinutes += num(row.total_viewers) * weightMinutes
    day.peakViewers = Math.max(day.peakViewers, num(row.total_viewers))
    day.observedMinutes += weightMinutes
    day.observedStreamCount = Math.max(day.observedStreamCount, num(row.stream_count))
    day.sawDemo ||= demoModes.includes(row.source_mode)

    for (const item of readItems(row.payload_json)) {
      const parsed = parseStream(item)
      if (!parsed) continue
      if (parsed.viewers > day.peakStreamerViewers) {
        day.peakStreamerViewers = parsed.viewers
        day.peakStreamerName = parsed.displayName
      }
      accumulate(day.streams, parsed, weightMinutes)
      accumulate(streams, parsed, weightMinutes)
    }
    days.set(dayKey, day)
  }
  return { days, streams }
}

function emptyRawDay(day: string): RawDay {
  return {
    day,
    totalViewerMinutes: 0,
    peakViewers: 0,
    peakStreamerName: null,
    peakStreamerViewers: 0,
    observedStreamCount: 0,
    observedMinutes: 0,
    sawDemo: false,
    streams: new Map(),
  }
}

function rawDaySummary(day: RawDay, previous?: RawDay): DailySummary {
  const topStreamers = ranked(
    day.streams,
    previous?.streams ?? new Map(),
    10,
    DAILY_BASELINE_MINUTES,
    Boolean(previous && previous.observedMinutes > 0),
  )
  const expected = expectedMinutesForDay(day.day)
  return {
    day: day.day,
    totalViewerMinutes: Math.round(day.totalViewerMinutes),
    peakViewers: Math.round(day.peakViewers),
    peakStreamerName: day.peakStreamerName,
    observedStreamCount: Math.round(day.observedStreamCount),
    observedMinutes: Math.round(day.observedMinutes),
    coverageState: day.sawDemo
      ? 'demo'
      : expected <= 0
        ? 'missing'
        : day.observedMinutes >= expected * 0.8
          ? 'good'
          : 'partial',
    topStreamers,
    biggestRise: biggestRise(topStreamers),
  }
}

function accumulate(map: Map<string, StreamAgg>, stream: ParsedStream, weightMinutes: number): void {
  const current = map.get(stream.id) ?? {
    id: stream.id,
    displayName: stream.displayName,
    viewerMinutes: 0,
    peakViewers: 0,
    observedMinutes: 0,
  }
  current.displayName = stream.displayName || current.displayName
  current.viewerMinutes += stream.viewers * weightMinutes
  current.peakViewers = Math.max(current.peakViewers, stream.viewers)
  current.observedMinutes += weightMinutes
  map.set(stream.id, current)
}

function sampleWeightMinutes(rows: SnapshotRow[], index: number): number {
  const current = rows[index]
  const next = rows[index + 1]
  const previous = rows[index - 1]
  const currentTime = Date.parse(current.bucket_minute)
  const currentDay = current.bucket_minute.slice(0, 10)
  if (next && next.bucket_minute.slice(0, 10) === currentDay) {
    return boundedMinutes(Date.parse(next.bucket_minute) - currentTime)
  }
  if (previous && previous.bucket_minute.slice(0, 10) === currentDay) {
    return boundedMinutes(currentTime - Date.parse(previous.bucket_minute))
  }
  return DEFAULT_SAMPLE_MINUTES
}

function boundedMinutes(ms: number): number {
  const minutes = Math.round(ms / 60000)
  if (!Number.isFinite(minutes) || minutes <= 0) return DEFAULT_SAMPLE_MINUTES
  return Math.max(1, Math.min(MAX_SAMPLE_MINUTES, minutes))
}

function readItems(json: string): Array<Record<string, unknown>> {
  try {
    const parsed = JSON.parse(json)
    if (Array.isArray(parsed)) return parsed.filter(record)
    if (!record(parsed)) return []
    if (Array.isArray(parsed.items)) return parsed.items.filter(record)
    if (Array.isArray(parsed.data)) return parsed.data.filter(record)
  } catch {}
  return []
}

function jsonArray(json: string): Array<Record<string, unknown>> {
  try {
    const parsed = JSON.parse(json)
    return Array.isArray(parsed) ? parsed.filter(record) : []
  } catch {
    return []
  }
}
