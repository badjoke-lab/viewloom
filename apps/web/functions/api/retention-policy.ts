type Provider = 'twitch' | 'kick'

type ProviderPolicy = {
  provider: Provider
  rawRetentionDays: number
  rollupRetentionDays: number
  detailWindowLabel: string
  historyWindowLabel: string
  detailUnavailableMessage: string
}

const PROVIDERS: ProviderPolicy[] = [
  {
    provider: 'twitch',
    rawRetentionDays: 30,
    rollupRetentionDays: 180,
    detailWindowLabel: '30 days',
    historyWindowLabel: '180 days',
    detailUnavailableMessage: 'Detailed 5-minute Twitch data is retained for 30 days in Free Strong mode. Use History for older summary trends.',
  },
  {
    provider: 'kick',
    rawRetentionDays: 60,
    rollupRetentionDays: 180,
    detailWindowLabel: '60 days',
    historyWindowLabel: '180 days',
    detailUnavailableMessage: 'Detailed 5-minute Kick data is retained for 60 days in Free Strong mode. Use History for older summary trends.',
  },
]

export const onRequestGet: PagesFunction = async ({ request }) => {
  const url = new URL(request.url)
  const provider = url.searchParams.get('provider')
  const selectedDate = url.searchParams.get('date')
  const policies = provider === 'twitch' || provider === 'kick'
    ? PROVIDERS.filter((item) => item.provider === provider)
    : PROVIDERS

  return Response.json({
    ok: true,
    source: 'api',
    mode: 'free-strong',
    generatedAt: new Date().toISOString(),
    selectedDate: isDate(selectedDate) ? selectedDate : null,
    providers: policies.map((policy) => ({
      ...policy,
      detailAvailable: isDate(selectedDate) ? isWithinDays(selectedDate, policy.rawRetentionDays) : null,
      rollupAvailable: isDate(selectedDate) ? isWithinDays(selectedDate, policy.rollupRetentionDays) : null,
    })),
    notes: [
      'History summary views use daily_rollups where available.',
      'Day Flow and Battle Lines require raw 5-minute snapshots inside the provider detail window.',
    ],
  }, { headers: { 'cache-control': 'public, max-age=300' } })
}

function isDate(value: string | null): value is string {
  return !!value && /^\d{4}-\d{2}-\d{2}$/.test(value)
}

function isWithinDays(day: string, days: number): boolean {
  const selected = Date.parse(`${day}T00:00:00.000Z`)
  if (!Number.isFinite(selected)) return false
  const cutoff = Date.now() - days * 86400000
  return selected >= cutoff
}
