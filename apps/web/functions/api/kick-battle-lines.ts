type KickBattleState = 'not_ready' | 'empty' | 'partial' | 'stale' | 'live' | 'error'
type KickBattleMetric = 'viewers' | 'indexed'
type KickBattleBucket = '1m' | '5m' | '10m'

type KickBattlePayload = {
  source: 'api'
  platform: 'kick'
  state: KickBattleState
  status: KickBattleState
  updatedAt: string
  top: number
  bucket: KickBattleBucket
  metric: KickBattleMetric
  valueMode: KickBattleMetric
  metricNote: string
  lines: unknown[]
  primaryBattle: unknown | null
  recommendedBattle: unknown | null
  recommendedQuality: unknown | null
  secondaryBattles: unknown[]
  battles: unknown[]
  events: unknown[]
  reversals: unknown[]
  feed: unknown[]
  notes: string[]
  contract: {
    linePointStates: Array<'observed' | 'missing' | 'not_observed' | 'offline'>
    requiredBattleFields: string[]
    requiredLineFields: string[]
  }
}

export const onRequestGet: PagesFunction = async ({ request }) => {
  const url = new URL(request.url)
  const top = Number(url.searchParams.get('top')) || 5
  const bucket: KickBattleBucket = url.searchParams.get('bucket') === '1m' ? '1m' : url.searchParams.get('bucket') === '10m' ? '10m' : '5m'
  const metric: KickBattleMetric = url.searchParams.get('metric') === 'indexed' ? 'indexed' : 'viewers'
  const state: KickBattleState = 'not_ready'
  const payload: KickBattlePayload = {
    source: 'api',
    platform: 'kick',
    state,
    status: state,
    updatedAt: new Date().toISOString(),
    top,
    bucket,
    metric,
    valueMode: metric,
    metricNote: 'Kick Battle Lines API uses the shared Rivalry contract. Real Kick samples are not connected yet.',
    lines: [],
    primaryBattle: null,
    recommendedBattle: null,
    recommendedQuality: null,
    secondaryBattles: [],
    battles: [],
    events: [],
    reversals: [],
    feed: [],
    notes: [
      'Provider-specific Kick route.',
      'Kick raw payloads must be normalized before line series are built.',
      'Do not connect missing, not_observed, or offline points as observed values.',
      'Recommended battles require readable overlap and popularity gating before live use.',
    ],
    contract: {
      linePointStates: ['observed', 'missing', 'not_observed', 'offline'],
      requiredBattleFields: ['id', 'streamerAId', 'streamerBId', 'score', 'overlapCount', 'longestRun', 'reversalCount'],
      requiredLineFields: ['streamerId', 'name', 'url', 'viewerMinutes', 'peakViewers', 'points'],
    },
  }

  return Response.json(payload, { headers: { 'cache-control': 'no-store' } })
}
