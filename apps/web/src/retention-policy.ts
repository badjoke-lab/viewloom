export type Provider = 'twitch' | 'kick'

export type ProviderRetentionPolicy = {
  provider: Provider
  rawRetentionDays: number
  rollupRetentionDays: number
  detailWindowLabel: string
  historyWindowLabel: string
  detailUnavailableMessage: string
  detailAvailable: boolean | null
  rollupAvailable: boolean | null
}

export type RetentionPolicyPayload = {
  ok: boolean
  source: string
  mode: string
  generatedAt: string
  selectedDate: string | null
  providers: ProviderRetentionPolicy[]
  notes: string[]
}

const FALLBACK: Record<Provider, ProviderRetentionPolicy> = {
  twitch: {
    provider: 'twitch',
    rawRetentionDays: 30,
    rollupRetentionDays: 180,
    detailWindowLabel: '30 days',
    historyWindowLabel: '180 days',
    detailUnavailableMessage: 'Detailed 5-minute Twitch data is retained for 30 days in Free Strong mode. Use History for older summary trends.',
    detailAvailable: null,
    rollupAvailable: null,
  },
  kick: {
    provider: 'kick',
    rawRetentionDays: 60,
    rollupRetentionDays: 180,
    detailWindowLabel: '60 days',
    historyWindowLabel: '180 days',
    detailUnavailableMessage: 'Detailed 5-minute Kick data is retained for 60 days in Free Strong mode. Use History for older summary trends.',
    detailAvailable: null,
    rollupAvailable: null,
  },
}

export async function fetchRetentionPolicy(provider: Provider, selectedDate?: string | null): Promise<ProviderRetentionPolicy> {
  const params = new URLSearchParams({ provider })
  if (selectedDate) params.set('date', selectedDate)
  try {
    const response = await fetch(`/api/retention-policy?${params.toString()}`, { cache: 'no-store' })
    if (!response.ok) return fallbackPolicy(provider, selectedDate)
    const payload = await response.json() as Partial<RetentionPolicyPayload>
    const policy = payload.providers?.find((item) => item.provider === provider)
    return policy ?? fallbackPolicy(provider, selectedDate)
  } catch {
    return fallbackPolicy(provider, selectedDate)
  }
}

export function fallbackPolicy(provider: Provider, selectedDate?: string | null): ProviderRetentionPolicy {
  const base = FALLBACK[provider]
  return {
    ...base,
    detailAvailable: selectedDate ? isWithinDays(selectedDate, base.rawRetentionDays) : null,
    rollupAvailable: selectedDate ? isWithinDays(selectedDate, base.rollupRetentionDays) : null,
  }
}

export function retentionSummary(policy: ProviderRetentionPolicy): string {
  return `Detailed 5-minute data is retained for ${policy.detailWindowLabel}; History summaries are retained for ${policy.historyWindowLabel}.`
}

export function shouldShowRetentionBoundary(policy: ProviderRetentionPolicy): boolean {
  return policy.detailAvailable === false && policy.rollupAvailable !== false
}

function isWithinDays(day: string, days: number): boolean {
  const selected = Date.parse(`${day}T00:00:00.000Z`)
  if (!Number.isFinite(selected)) return false
  return selected >= Date.now() - days * 86400000
}
