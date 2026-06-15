export type Platform = 'twitch' | 'kick'
export type HomeState = 'fresh' | 'partial' | 'stale' | 'empty' | 'demo' | 'error'

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
  type: string
  label: string
  summary: string
  observedAt: string | null
}

export type RankedRollupStream = {
  id: string
  displayName: string
  viewerMinutes: number
  peakViewers: number
}

export type ProviderHomePayload = {
  version: 'viewloom-home-v1'
  platform: Platform
  source: 'real' | 'demo'
  sourceMode: string
  state: HomeState
  generatedAt: string
  updatedAt: string | null
  freshness: { minutesSinceUpdate: number | null; staleAfterMinutes: number }
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
    topByViewerMinutes: RankedRollupStream | null
    closestCurrentBattle: HomeBattle | null
    latestReversal: null
  }
  recent: {
    latestCompletedDay: string | null
    topStreamer: RankedRollupStream | null
    biggestRise: { id: string; displayName: string; changePct: number; changeAbs: number } | null
    coverageState: string | null
    trend: Array<{ day: string; totalViewerMinutes: number; peakViewers: number; coverageState: string }>
  }
  signals: HomeSignal[]
  availability: { activity: 'available' | 'unavailable'; latestReversal: 'available' | 'unavailable' }
  notes: string[]
  error?: { code: string; message: string }
}
