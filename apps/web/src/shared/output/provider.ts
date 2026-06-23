export type OutputProvider = 'twitch' | 'kick'

const PROVIDER_LABELS: Record<OutputProvider, string> = {
  twitch: 'Twitch',
  kick: 'Kick',
}

export function isOutputProvider(value: unknown): value is OutputProvider {
  return value === 'twitch' || value === 'kick'
}

export function providerDisplayName(provider: OutputProvider): string {
  return PROVIDER_LABELS[provider]
}
