export type DayFlowCategoryRow = {
  bucket_minute: string
  total_viewers: number
  payload_json: string
}

export type DayFlowCategoryOption = {
  id: string
  name: string
  streamCount: number
  viewerMinutes: number
  peakViewers: number
  observedBuckets: number
}

export type DayFlowCategoryBucketCoverage = {
  bucket: string
  state: 'observed' | 'partial' | 'unavailable'
  observedRows: number
  partialRows: number
  unavailableRows: number
  totalRows: number
}

export type DayFlowProjectedStream = {
  id: string
  name: string
  title: string
  url: string
  values: number[]
}

export function projectDayFlowCategory(options: {
  rows: DayFlowCategoryRow[]
  buckets: string[]
  bucketSize: 5 | 10
  selectedCategory: string
  categoryNames: Map<string, string>
}): {
  totals: number[]
  streams: DayFlowProjectedStream[]
  categoryFilter: {
    contractVersion: string | null
    selectedCategory: string
    state: 'all' | 'selected' | 'unknown_category' | 'category_unavailable'
    coverageState: 'observed' | 'partial' | 'unavailable'
    observedItems: number
    missingItems: number
    dictionaryMissingItems: number
    filterBeforeTopN: true
    membershipEvaluation: 'per_observed_snapshot'
    latestCategoryBackProjectionAllowed: false
    fullShareDenominator: 'all_observed_twitch_viewers_per_bucket'
    topFocusShareDenominator: 'displayed_selected_category_top_n_viewers_per_bucket'
    availableCategories: DayFlowCategoryOption[]
    bucketCoverage: DayFlowCategoryBucketCoverage[]
    coverageCounts: { observed: number; partial: number; unavailable: number }
  }
}

export function parsePayload(payloadJson: string): {
  rawItems: unknown[]
  categoryContractVersion: string | null
  categoryIds: string[]
  categoryRefs: Array<number | null>
}
