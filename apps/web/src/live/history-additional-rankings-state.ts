export type RankingSort = 'viewer_minutes' | 'peak_viewers' | 'avg_viewers' | 'observed_minutes' | 'rising'

export type RankingStreamer = {
  displayName?: string
  viewerMinutes?: number
  peakViewers?: number
  avgViewers?: number
  observedMinutes?: number
  changePct?: number | null
  changeAbs?: number | null
  comparisonState?: 'comparable' | 'new' | 'insufficient' | string
}

export type RankingPayload = {
  topStreamers?: RankingStreamer[]
  rankings?: {
    viewerMinutes?: RankingStreamer[]
    peakViewers?: RankingStreamer[]
    averageViewers?: RankingStreamer[]
    observedMinutes?: RankingStreamer[]
    rising?: RankingStreamer[]
  }
}

const SORTS: RankingSort[] = ['viewer_minutes', 'peak_viewers', 'avg_viewers', 'observed_minutes', 'rising']
let currentPayload: RankingPayload | null = null
let currentSort: RankingSort = parseRankingSort(new URL(location.href).searchParams.get('sort')) ?? 'viewer_minutes'

export function installRankingPayloadCapture(onChange: () => void): void {
  const originalFetch = window.fetch.bind(window)
  window.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const response = await originalFetch(input, init)
    const url = new URL(typeof input === 'string' || input instanceof URL ? input : input.url, location.origin)
    if (url.pathname === '/api/history' || url.pathname === '/api/kick-history') {
      try {
        currentPayload = await response.clone().json() as RankingPayload
        currentSort = parseRankingSort(new URL(location.href).searchParams.get('sort')) ?? currentSort
        onChange()
        window.setTimeout(() => setRankingSort(currentSort), 0)
      } catch {
        currentPayload = null
      }
    }
    return response
  }) as typeof window.fetch
}

export function rankingPayload(): RankingPayload | null { return currentPayload }
export function rankingSort(): RankingSort { return currentSort }
export function setRankingSort(sort: RankingSort): void {
  currentSort = sort
  const url = new URL(location.href)
  url.searchParams.set('sort', sort)
  history.replaceState(null, '', `${url.pathname}?${url.searchParams.toString()}`)
}

export function parseRankingSort(value: string | null | undefined): RankingSort | null {
  return SORTS.includes(value as RankingSort) ? value as RankingSort : null
}

export function rankingRows(payload: RankingPayload, sort: RankingSort): RankingStreamer[] {
  if (sort === 'peak_viewers') return payload.rankings?.peakViewers ?? fallback(payload.topStreamers, sort)
  if (sort === 'avg_viewers') return payload.rankings?.averageViewers ?? []
  if (sort === 'observed_minutes') return payload.rankings?.observedMinutes ?? []
  if (sort === 'rising') return payload.rankings?.rising ?? []
  return payload.rankings?.viewerMinutes ?? fallback(payload.topStreamers, sort)
}

function fallback(rows: RankingStreamer[] | undefined, sort: RankingSort): RankingStreamer[] {
  return [...(rows ?? [])].sort((a, b) => sort === 'peak_viewers'
    ? number(b.peakViewers) - number(a.peakViewers)
    : number(b.viewerMinutes) - number(a.viewerMinutes))
}

function number(value: unknown): number {
  const parsed = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : Number.NaN
  return Number.isFinite(parsed) ? parsed : 0
}
