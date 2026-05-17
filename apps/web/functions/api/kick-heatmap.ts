type NormalizedStream = {
  id: string
  name: string
  title: string
  viewers: number
  url: string
  startedAt?: string
}

type KickHeatmapState = 'not_ready' | 'empty' | 'stale' | 'live' | 'error'

type KickHeatmapPayload = {
  source: 'api'
  platform: 'kick'
  state: KickHeatmapState
  status: KickHeatmapState
  updatedAt: string
  valueMode: 'viewers'
  items: NormalizedStream[]
  coverageNote: string
  notes: string[]
}

export const onRequestGet: PagesFunction = async () => {
  const state: KickHeatmapState = 'not_ready'
  const payload: KickHeatmapPayload = {
    source: 'api',
    platform: 'kick',
    state,
    status: state,
    updatedAt: new Date().toISOString(),
    valueMode: 'viewers',
    items: [],
    coverageNote: 'Kick Heatmap API uses the NormalizedStream contract. Real Kick samples are not connected yet.',
    notes: [
      'Provider-specific Kick route.',
      'Items must be normalized before reaching the renderer.',
      'Expected item shape: id, name, title, viewers, url, startedAt.',
    ],
  }

  return Response.json(payload, { headers: { 'cache-control': 'no-store' } })
}
