export type TwitchStreamMapCategoryOption = {
  id: string
  name: string
  streamCount: number
  totalViewers: number
}

export type TwitchStreamMapPopulationMetadata = {
  implementationState: 'public'
  order: string[]
  baseObservedStreams: number
  selectedTop: number
  minViewers: number
  selectedCategory: string
  selectedCategoryName: string | null
  categoryState: 'all' | 'selected' | 'unknown_category' | 'category_unavailable'
  categoryAvailable: boolean
  categoryCoverageState: 'observed' | 'partial' | 'unavailable'
  categoryContractVersion: string | null
  topScopedStreams: number
  preCategoryStreams: number
  preCategoryViewers: number
  selectedPopulationStreams: number
  selectedPopulationViewers: number
  unknownCategoryStreams: number
  dictionaryMissingItems: number
  availableCategories: TwitchStreamMapCategoryOption[]
  languageFilterAvailable: false
  languageUsedForPopulationFiltering: false
}

export function normalizeTwitchStreamMapPopulationQuery(input?: {
  top?: unknown
  minViewers?: unknown
  category?: unknown
}): {
  selectedTop: number
  minViewers: number
  selectedCategory: string
}

export function twitchStreamMapPopulationNeedsCategoryDictionary(payloadJson: unknown): boolean

export function selectTwitchStreamMapPopulation(input: {
  payloadJson: unknown
  top?: unknown
  minViewers?: unknown
  category?: unknown
  categoryNames?: Map<string, string>
}): {
  payloadJson: string
  streamCount: number
  totalViewers: number
  metadata: TwitchStreamMapPopulationMetadata
}
