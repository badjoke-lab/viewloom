export type ChannelProfileProvider = 'twitch' | 'kick'

export function channelProfileHref(
  provider: ChannelProfileProvider,
  streamerId: unknown,
  displayName?: unknown,
  period: '7d' | '30d' = '30d',
): string | null {
  const id = normalizeId(streamerId)
  if (!id) return null
  const params = new URLSearchParams()
  params.set('id', id)
  const name = typeof displayName === 'string' ? displayName.trim() : ''
  if (name) params.set('name', name)
  params.set('period', period)
  params.sort()
  return `/${provider}/channel/?${params.toString()}`
}

function normalizeId(value: unknown): string {
  return typeof value === 'string'
    ? value.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '')
    : ''
}
