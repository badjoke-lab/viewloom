type JsonRecord = Record<string, unknown>

export const HISTORY_PEAK_ARCHIVE_LIMIT = 30

export async function enrichHistoryPeakArchive(response: Response): Promise<Response> {
  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.includes('application/json')) return response

  try {
    const payload = await response.clone().json<JsonRecord>()
    const result = historyPeakArchiveFromPayload(payload)
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

export function historyPeakArchiveFromPayload(payload: JsonRecord): JsonRecord {
  const today = new Date().toISOString().slice(0, 10)
  const entries = records(payload.daily)
    .filter((day) => {
      const date = text(day.day)
      return isDay(date)
        && date < today
        && text(day.coverageState) !== 'missing'
        && number(day.peakViewers) > 0
    })
    .map((day) => {
      const date = text(day.day)
      const timestamp = exactTimestamp(day.peakTime, date)
      return {
        day: date,
        timestamp,
        timestampPrecision: timestamp ? 'minute' : 'day',
        peakViewers: number(day.peakViewers),
        streamerId: text(day.peakStreamerId) || null,
        streamer: text(day.peakStreamerName) || null,
        category: text(day.peakCategory) || null,
        coverageState: text(day.coverageState) || 'partial',
      }
    })
    .sort((a, b) => b.peakViewers - a.peakViewers || b.day.localeCompare(a.day))
    .slice(0, HISTORY_PEAK_ARCHIVE_LIMIT)
    .map((entry, index) => ({ ...entry, rank: index + 1 }))

  return {
    peakArchive: entries,
    peakArchiveMeta: {
      sourcePopulation: 'daily',
      limit: HISTORY_PEAK_ARCHIVE_LIMIT,
      bounded: true,
      providerSeparated: true,
      inProgressDayExcluded: true,
      exactTimestampCount: entries.filter((entry) => entry.timestamp !== null).length,
      categoryCount: entries.filter((entry) => entry.category !== null).length,
    },
  }
}

function exactTimestamp(value: unknown, day: string): string | null {
  if (typeof value !== 'string' || !value.trim()) return null
  const parsed = new Date(value)
  if (!Number.isFinite(parsed.getTime())) return null
  const iso = parsed.toISOString()
  return iso.slice(0, 10) === day ? iso : null
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
  return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : 0
}

function isDay(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const parsed = new Date(`${value}T00:00:00.000Z`)
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
}
