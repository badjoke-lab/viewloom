export type ProviderKey = 'twitch' | 'kick'

export type SiteConfig = {
  platform: ProviderKey
  label: string
  dataLabel: string
  basePath: string
  statusPath: string
  streamUrl: (slug: string) => string
}

export type NormalizedStream = {
  id: string
  name: string
  title: string
  viewers: number
  url: string
  startedAt?: string
}

export type RawStreamRecord = Record<string, unknown>

export type StreamAdapter = {
  provider: ProviderKey
  normalizeStream: (raw: RawStreamRecord) => NormalizedStream | null
  normalizePayload: (payload: unknown) => NormalizedStream[]
}
