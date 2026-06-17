export type ViewLoomProvider = 'twitch' | 'kick'

export const PROVIDER_RUNTIME = {
  twitch: {
    collectionCadenceMinutes: 5,
    collectionCadenceSeconds: 300,
    topLimit: 300,
    staleAfterMinutes: 10,
    strongStaleAfterMinutes: 30,
    rawRetentionDays: 30,
    rollupRetentionDays: 180,
  },
  kick: {
    collectionCadenceMinutes: 5,
    collectionCadenceSeconds: 300,
    topLimit: 100,
    staleAfterMinutes: 10,
    strongStaleAfterMinutes: 30,
    rawRetentionDays: 60,
    rollupRetentionDays: 180,
  },
} as const

export function providerRuntime<P extends ViewLoomProvider>(provider: P): (typeof PROVIDER_RUNTIME)[P] {
  return PROVIDER_RUNTIME[provider]
}
