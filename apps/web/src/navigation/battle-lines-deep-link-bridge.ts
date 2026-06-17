import { buildDeepLink } from './deep-link-contract'

const BRIDGE_KEY = '__viewloomBattleLinesTimeBridge'
const minuteMs = 60_000

type BridgeWindow = Window & { [BRIDGE_KEY]?: boolean }

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

export function installBattleLinesTimeBridge(): void {
  if (typeof window === 'undefined') return
  const target = window as BridgeWindow
  if (target[BRIDGE_KEY]) return
  target[BRIDGE_KEY] = true

  const originalGet = URLSearchParams.prototype.get
  URLSearchParams.prototype.get = function get(name: string): string | null {
    const direct = originalGet.call(this, name)
    if (name !== 'point' || direct !== null) return direct
    const time = originalGet.call(this, 'time')
    if (!time) return null
    const bucket = originalGet.call(this, 'bucket') ?? '5m'
    const point = pointFromTime(time, bucket)
    return point === null ? null : String(point)
  }

  const originalReplaceState = history.replaceState.bind(history)
  history.replaceState = (data: unknown, unused: string, url?: string | URL | null): void => {
    if (url === null || url === undefined) {
      originalReplaceState(data, unused, url)
      return
    }

    const parsed = new URL(String(url), location.href)
    if (!/\/(?:twitch|kick)\/battle-lines\/$/.test(parsed.pathname)) {
      originalReplaceState(data, unused, url)
      return
    }

    const pointValue = originalGet.call(parsed.searchParams, 'point')
    const point = pointValue !== null && /^\d+$/.test(pointValue) ? Number(pointValue) : null
    if (point !== null && originalGet.call(parsed.searchParams, 'time') === null) {
      const time = timeFromPoint(
        point,
        originalGet.call(parsed.searchParams, 'bucket') ?? '5m',
        originalGet.call(parsed.searchParams, 'range') ?? 'today',
        originalGet.call(parsed.searchParams, 'date'),
      )
      if (time) parsed.searchParams.set('time', time)
    }
    parsed.searchParams.delete('point')

    originalReplaceState(data, unused, buildDeepLink(parsed.pathname, 'battleLines', parsed.searchParams))
  }
}

installBattleLinesTimeBridge()
