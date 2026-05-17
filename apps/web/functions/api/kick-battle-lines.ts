export const onRequestGet: PagesFunction = async ({ request }) => {
  const url = new URL(request.url)
  const top = Number(url.searchParams.get('top')) || 5
  const bucket = url.searchParams.get('bucket') ?? '5m'
  const metric = url.searchParams.get('metric') === 'indexed' ? 'indexed' : 'viewers'
  return Response.json({
    source: 'api',
    platform: 'kick',
    state: 'not_ready',
    status: 'not_ready',
    updatedAt: new Date().toISOString(),
    top,
    bucket,
    metric,
    valueMode: metric,
    metricNote: 'Kick Battle Lines API exists. Real Kick samples are not connected yet.',
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
      'No live Kick battle-line samples are returned yet.',
    ],
  }, { headers: { 'cache-control': 'no-store' } })
}
