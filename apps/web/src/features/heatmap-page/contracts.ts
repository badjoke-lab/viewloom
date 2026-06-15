export type HeatmapPageBoundary =
  | 'fetch'
  | 'state'
  | 'layout'
  | 'renderer'
  | 'inspector'
  | 'summary'
  | 'status'

export type HeatmapPageLifecycleState =
  | 'idle'
  | 'mounting'
  | 'mounted'
  | 'refreshing'
  | 'failed'
  | 'destroyed'

export type HeatmapPageLifecycleSnapshot = {
  state: HeatmapPageLifecycleState
  generation: number
  lastError: Error | null
}

export interface HeatmapPageAdapter {
  readonly name: string
  readonly boundaries: readonly HeatmapPageBoundary[]
  mount(): Promise<void>
  refresh(): Promise<void>
  destroy(): void
}

export interface HeatmapPageRuntime {
  mount(): Promise<void>
  refresh(): Promise<void>
  destroy(): void
  snapshot(): HeatmapPageLifecycleSnapshot
}
