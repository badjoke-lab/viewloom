type KickDayFlowState = 'not_ready' | 'empty' | 'partial' | 'stale' | 'live' | 'error'

type KickDayFlowValueMode = 'volume' | 'share'

type KickDayFlowStreamer = {
  streamerId: string
  name: string
  title: string
  url: string
  peakViewers: number
  avgViewers: number
  viewerMinutes: number
  peakShare: number
  biggestRiseTime: string | null
  biggestRiseValue: number
  firstSeen: string | null
  lastSeen: string | null
}

type KickDayFlowBand = {
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
  buckets: Array<{
    viewers: number
    share: number
    activity: number
    activityAvailable: boolean
    peak: boolean
    rise: boolean
  }>
}

type KickDayFlowPayload = {
  ok: boolean
  source: 'api'
  platform: 'kick'
  state: KickDayFlowState
  status: KickDayFlowState
  note: string
  coverageNote: string
  partialNote: string
  lastUpdated: string
  selectedDate: string
  bucketSize: 5 | 10
  topN: number
  valueMode: KickDayFlowValueMode
  rangeMode: string
  windowStart: string
  windowEnd: string
  isRolling: boolean
  buckets: string[]
  totalViewersByBucket: number[]
  bands: KickDayFlowBand[]
  detailPanelSource: {
    defaultStreamerId: string | null
    streamers: KickDayFlowStreamer[]
  }
  activity: {
    available: boolean
    note: string
  }
}

export const onRequestGet: PagesFunction = async ({ request }) => {
  const url = new URL(request.url)
  const now = new Date()
  const today = now.toISOString().slice(0, 10)
  const bucketSize: 5 | 10 = Number(url.searchParams.get('bucket')) === 10 ? 10 : 5
  const topN = Number(url.searchParams.get('top')) || 20
  const rangeMode = url.searchParams.get('rangeMode') ?? url.searchParams.get('day') ?? 'today'
  const valueMode: KickDayFlowValueMode = url.searchParams.get('metric') === 'share' || url.searchParams.get('mode') === 'share' ? 'share' : 'volume'
  const state: KickDayFlowState = 'not_ready'
  const payload: KickDayFlowPayload = {
    ok: true,
    source: 'api',
    platform: 'kick',
    state,
    status: state,
    note: 'Kick Day Flow API uses the shared Day Flow contract. Real Kick samples are not connected yet.',
    coverageNote: 'No normalized Kick day-flow samples are returned yet.',
    partialNote: 'Kick raw payloads must be normalized before reaching Day Flow bands.',
    lastUpdated: now.toISOString(),
    selectedDate: url.searchParams.get('date') ?? today,
    bucketSize,
    topN,
    valueMode,
    rangeMode,
    windowStart: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
    windowEnd: now.toISOString(),
    isRolling: rangeMode === 'rolling24h',
    buckets: [],
    totalViewersByBucket: [],
    bands: [],
    detailPanelSource: { defaultStreamerId: null, streamers: [] },
    activity: { available: false, note: 'Kick activity data is not connected yet.' },
  }

  return Response.json(payload, { headers: { 'cache-control': 'no-store' } })
}
