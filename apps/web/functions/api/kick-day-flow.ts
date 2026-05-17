export const onRequestGet: PagesFunction = async ({ request }) => {
  const url = new URL(request.url)
  const today = new Date().toISOString().slice(0, 10)
  const bucketSize = Number(url.searchParams.get('bucket')) === 10 ? 10 : 5
  const topN = Number(url.searchParams.get('top')) || 20
  const rangeMode = url.searchParams.get('rangeMode') ?? url.searchParams.get('day') ?? 'today'
  return Response.json({
    ok: true,
    source: 'api',
    platform: 'kick',
    state: 'not_ready',
    status: 'not_ready',
    note: 'Kick Day Flow API exists. Real Kick samples are not connected yet.',
    coverageNote: 'No live Kick day-flow samples are returned yet.',
    partialNote: 'Provider-specific Kick route. This does not use Twitch data.',
    lastUpdated: new Date().toISOString(),
    selectedDate: url.searchParams.get('date') ?? today,
    bucketSize,
    topN,
    valueMode: url.searchParams.get('metric') === 'share' || url.searchParams.get('mode') === 'share' ? 'share' : 'volume',
    rangeMode,
    windowStart: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    windowEnd: new Date().toISOString(),
    isRolling: rangeMode === 'rolling24h',
    buckets: [],
    totalViewersByBucket: [],
    bands: [],
    detailPanelSource: { defaultStreamerId: null, streamers: [] },
    activity: { available: false, note: 'Kick activity data is not connected yet.' },
  }, { headers: { 'cache-control': 'no-store' } })
}
