import type { HeatmapItem } from './model'

export type ActivityPresentation = {
  state: 'available' | 'not_sampled' | 'unavailable'
  value: string
  note: string
}

export function selectedRank(items: HeatmapItem[], login: string): number | null
export function momentumDirection(value: number): 'Rising' | 'Falling' | 'Flat'
export function activityPresentation(item: HeatmapItem): ActivityPresentation
export function formatObservationDuration(minutes: number | null, truncated?: boolean, bucketMinutes?: number): string
export function buildInspectorLinks(provider: 'twitch' | 'kick', login: string): {
  battleLines: string
  history: string
}
