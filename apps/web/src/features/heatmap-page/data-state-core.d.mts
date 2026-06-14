export type HeatmapProviderKey = 'twitch' | 'kick'
export type HeatmapDataState = 'loading' | 'fresh' | 'stale' | 'partial' | 'empty' | 'error' | 'demo'
export type HeatmapSourceMode = 'real' | 'stale' | 'demo' | 'unknown'
export type HeatmapActivityState = 'available' | 'zero' | 'unavailable' | 'not_sampled'
export type HeatmapCoverageState = 'observed' | 'partial' | 'missing'

export type HeatmapActivityValue = {
  state: HeatmapActivityState
  value: number | null
}

export type HeatmapActivitySummary = {
  state: HeatmapActivityState
  counts: Record<HeatmapActivityState, number>
}

export type HeatmapDataTruth = {
  provider: HeatmapProviderKey
  providerLabel: string
  state: HeatmapDataState
  stateLabel: string
  sourceMode: HeatmapSourceMode
  sourceLabel: string
  collectionMethod: string
  updatedAt: string | null
  snapshotAgeMinutes: number | null
  staleAfterMinutes: number
  strongStaleAfterMinutes: number
  isStrongStale: boolean
  observedRecords: number
  configuredLimit: number
  hasMore: boolean | null
  coveredPages: number | null
  coverageState: HeatmapCoverageState
  activity: HeatmapActivitySummary
  activityByLogin: Record<string, HeatmapActivityValue>
  reasons: string[]
}

export function normalizeHeatmapDataTruth(
  raw: unknown,
  providerKey: HeatmapProviderKey,
  nowMs?: number,
): HeatmapDataTruth

export function createHeatmapLoadingTruth(providerKey: HeatmapProviderKey): HeatmapDataTruth
export function createHeatmapErrorTruth(providerKey: HeatmapProviderKey, message?: string): HeatmapDataTruth
