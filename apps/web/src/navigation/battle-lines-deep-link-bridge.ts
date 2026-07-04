const minuteMs = 60_000

export type BattleLinesSelectionInput = {
  time: string | null
  point: number
}

export function pointFromTime(value: string, bucket: string): number | null {
  const instant = new Date(value)
  if (Number.isNaN(instant.getTime())) return null
  const bucketMinutes = bucket === '10m' ? 10 : 5
  const dayStart = Date.UTC(instant.getUTCFullYear(), instant.getUTCMonth(), instant.getUTCDate())
  const point = Math.round((instant.getTime() - dayStart) / (bucketMinutes * minuteMs))
  return Number.isSafeInteger(point) && point >= 0 ? point : null
}

export function timeFromPoint(point: number, bucket: string, range: string, date: string | null, now = new Date()): string | null {
  if (!Number.isSafeInteger(point) || point < 0) return null
  const bucketMinutes = bucket === '10m' ? 10 : 5
  let dayStart: number

  if (range === 'date' && date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    dayStart = Date.parse(`${date}T00:00:00.000Z`)
  } else {
    dayStart = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
    if (range === 'yesterday') dayStart -= 24 * 60 * minuteMs
  }

  if (!Number.isFinite(dayStart)) return null
  return new Date(dayStart + point * bucketMinutes * minuteMs).toISOString()
}

export function readBattleLinesSelection(params: URLSearchParams): BattleLinesSelectionInput {
  const time = validInstant(params.get('time'))
  if (time) return { time, point: -1 }
  const pointValue = params.get('point')
  const point = pointValue !== null && /^\d+$/.test(pointValue) ? Number(pointValue) : -1
  return { time: null, point: Number.isSafeInteger(point) && point >= 0 ? point : -1 }
}

export function canonicalBattleLinesTime(
  timeline: string[],
  selectedIndex: number,
  fallbackPoint: number,
  bucket: string,
  range: string,
  date: string | null,
): string | null {
  const direct = validInstant(timeline[selectedIndex] ?? null)
  if (direct) return direct
  return fallbackPoint >= 0 ? timeFromPoint(fallbackPoint, bucket, range, date) : null
}

function validInstant(value: string | null): string | null {
  if (!value) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString()
}
