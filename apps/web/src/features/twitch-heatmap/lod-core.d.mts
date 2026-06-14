export type HeatmapLodLevel = 0 | 1 | 2 | 3 | 4 | 5

export type HeatmapLodDecision = {
  level: HeatmapLodLevel
  titleMode: 'none' | 'short' | 'display'
  titleLines: 0 | 1 | 2
  showViewers: boolean
  showMomentum: boolean
  showActivity: boolean
  showLogin: boolean
  showRank: boolean
  paddingPx: number
  titleFontPx: number
  metricFontPx: number
  detailFontPx: number
}

export function resolveHeatmapLod(input: {
  screenWidth: number
  screenHeight: number
  isSelected?: boolean
}): HeatmapLodDecision

export function makeShortLabel(value: string, maxGraphemes?: number): string
export function segmentGraphemes(value: string): string[]
export function normalizeLabel(value: string): string

export const HEATMAP_LOD_LEVELS: Readonly<{
  FILL: 0
  SHORT: 1
  NAME: 2
  VIEWERS: 3
  MOMENTUM: 4
  DETAIL: 5
}>
