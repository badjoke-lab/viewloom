export const onRequestGet: PagesFunction = async () => {
  return Response.json({
    source: 'api',
    platform: 'kick',
    state: 'not_ready',
    status: 'not_ready',
    updatedAt: new Date().toISOString(),
    items: [],
    coverageNote: 'Kick Heatmap API exists. Real Kick samples are not connected yet.',
    notes: [
      'Provider-specific Kick route.',
      'No live Kick heatmap samples are returned yet.',
    ],
  }, { headers: { 'cache-control': 'no-store' } })
}
