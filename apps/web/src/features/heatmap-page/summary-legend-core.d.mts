import type { HeatmapDataTruth, HeatmapProviderKey } from './data-state-core.mjs'

export type HeatmapOverviewItem = {
  channelLogin: string
  displayName: string
  viewers: number
  momentum: number
  activity: number | null
  activityAvailable: boolean
  activitySampled: boolean
}

export type HeatmapOverview = {
  provider: HeatmapProviderKey
  truth: HeatmapDataTruth
  items: HeatmapOverviewItem[]
  activeRecords: number
  totalViewers: number
  strongestMomentum: HeatmapOverviewItem | null
  highestActivity: HeatmapOverviewItem | null
  activityState: HeatmapDataTruth['activity']['state']
  legend: {
    area: string
    rising: string
    falling: string
    stable: string
    activity: string
  }
  coverageLines: string[]
}

export function buildHeatmapOverview(raw: unknown, providerKey: HeatmapProviderKey, nowMs?: number): HeatmapOverview
export function momentumLabel(momentum: number): 'Rising' | 'Falling' | 'Stable'
export function formatMomentum(momentum: number): string
export function formatActivity(activity: number | null): string
export function buildCoverageLines(truth: HeatmapDataTruth): string[]
