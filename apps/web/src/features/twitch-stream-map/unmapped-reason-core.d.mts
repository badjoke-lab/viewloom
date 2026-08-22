export type StreamMapUnmappedReasonRow = {
  code: string
  label: string
  detail: string
  count: number
  derived: boolean
}

export type StreamMapUnmappedReasonView = {
  baselineReasons: StreamMapUnmappedReasonRow[]
  currentReasons: StreamMapUnmappedReasonRow[]
  baselineReasonTotal: number
  baselineUnmappedStreams: number
  baselineReconciles: boolean
  filteredOutAcceptedStreams: number
  currentViewUnmappedStreams: number
  currentViewReasonTotal: number
  currentViewReconciles: boolean
}

export function buildUnmappedReasonView(input: {
  reasonCounts: Record<string, number>
  baselineUnmappedStreams: number
  baselineMappedStreams: number
  filteredMappedStreams: number
}): StreamMapUnmappedReasonView

export function unmappedReasonMeta(code: string): {
  code: string
  label: string
  detail: string
}
