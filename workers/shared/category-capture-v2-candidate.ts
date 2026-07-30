export type CategorySourceFieldsV2Candidate = {
  categoryProviderId?: string | null
  categoryName?: string | null
}

export type CategorySourceState =
  | 'both_present'
  | 'both_empty'
  | 'provider_id_only'
  | 'category_name_only'

export type CategorySourceStateCounts = {
  bothPresent: number
  bothEmpty: number
  providerIdOnly: number
  categoryNameOnly: number
}

export type EncodedCategorySourceCompletenessV2Candidate = {
  payloadFields: {
    categoryContractVersion: typeof CATEGORY_SOURCE_V2_CANDIDATE_CONTRACT_VERSION
    categoryIds: string[]
    categoryRefs: Array<number | null>
    categorySourceStateEncoding: {
      format: typeof CATEGORY_SOURCE_STATE_ENCODING
      itemCount: number
      packedHex: string
    }
    categorySourceStateCounts: CategorySourceStateCounts
  }
  dictionaryEntries: Array<{ id: string; name: string }>
  observedItems: number
  missingItems: number
  partialPairItems: number
  coverageState: 'observed' | 'missing_from_source' | 'partial_source_coverage' | 'unavailable'
}

export const CATEGORY_SOURCE_V2_CANDIDATE_CONTRACT_VERSION = 'category-source-v2-candidate'
export const CATEGORY_SOURCE_STATE_ENCODING = '2bit-hex-v1'

const STATE_CODE = {
  both_present: 0,
  both_empty: 1,
  provider_id_only: 2,
  category_name_only: 3,
} as const satisfies Record<CategorySourceState, number>

export function classifyCategorySourceState(item: CategorySourceFieldsV2Candidate): CategorySourceState {
  const id = categoryText(item.categoryProviderId, 160)
  const name = categoryText(item.categoryName, 240)
  return classifyNormalizedState(id, name)
}

export function encodeCategorySourceCompletenessV2Candidate(
  items: CategorySourceFieldsV2Candidate[],
  sourceCoveragePartial = false,
): EncodedCategorySourceCompletenessV2Candidate {
  const categoryIds: string[] = []
  const categoryIndex = new Map<string, number>()
  const dictionary = new Map<string, string>()
  const categoryRefs: Array<number | null> = []
  const stateCodes: number[] = []
  const counts: CategorySourceStateCounts = {
    bothPresent: 0,
    bothEmpty: 0,
    providerIdOnly: 0,
    categoryNameOnly: 0,
  }

  for (const item of items) {
    const id = categoryText(item.categoryProviderId, 160)
    const name = categoryText(item.categoryName, 240)
    const state = classifyNormalizedState(id, name)
    stateCodes.push(STATE_CODE[state])

    if (state === 'both_present') {
      counts.bothPresent += 1
      let ref = categoryIndex.get(id)
      if (ref === undefined) {
        ref = categoryIds.length
        categoryIds.push(id)
        categoryIndex.set(id, ref)
      }
      dictionary.set(id, name)
      categoryRefs.push(ref)
      continue
    }

    if (state === 'both_empty') counts.bothEmpty += 1
    else if (state === 'provider_id_only') counts.providerIdOnly += 1
    else counts.categoryNameOnly += 1
    categoryRefs.push(null)
  }

  const missingItems = counts.bothEmpty + counts.providerIdOnly + counts.categoryNameOnly
  const partialPairItems = counts.providerIdOnly + counts.categoryNameOnly
  const coverageState = sourceCoveragePartial
    ? 'partial_source_coverage'
    : missingItems > 0
      ? 'missing_from_source'
      : counts.bothPresent > 0
        ? 'observed'
        : 'unavailable'

  return {
    payloadFields: {
      categoryContractVersion: CATEGORY_SOURCE_V2_CANDIDATE_CONTRACT_VERSION,
      categoryIds,
      categoryRefs,
      categorySourceStateEncoding: {
        format: CATEGORY_SOURCE_STATE_ENCODING,
        itemCount: items.length,
        packedHex: packTwoBitCodesToHex(stateCodes),
      },
      categorySourceStateCounts: counts,
    },
    dictionaryEntries: [...dictionary.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.id.localeCompare(b.id)),
    observedItems: counts.bothPresent,
    missingItems,
    partialPairItems,
    coverageState,
  }
}

export function unpackCategorySourceStateCodes(packedHex: string, itemCount: number): number[] {
  if (!Number.isInteger(itemCount) || itemCount < 0) throw new Error('invalid_item_count')
  if (!/^(?:[0-9a-f]{2})*$/i.test(packedHex)) throw new Error('invalid_packed_hex')
  const expectedBytes = Math.ceil(itemCount / 4)
  if (packedHex.length !== expectedBytes * 2) throw new Error('packed_length_mismatch')

  const codes: number[] = []
  for (let byteIndex = 0; byteIndex < expectedBytes; byteIndex += 1) {
    const byte = Number.parseInt(packedHex.slice(byteIndex * 2, byteIndex * 2 + 2), 16)
    for (let offset = 0; offset < 4 && codes.length < itemCount; offset += 1) {
      codes.push((byte >> (offset * 2)) & 0b11)
    }
  }
  return codes
}

function packTwoBitCodesToHex(codes: number[]): string {
  let output = ''
  for (let index = 0; index < codes.length; index += 4) {
    let byte = 0
    for (let offset = 0; offset < 4; offset += 1) {
      const code = codes[index + offset] ?? 0
      if (!Number.isInteger(code) || code < 0 || code > 3) throw new Error('invalid_source_state_code')
      byte |= code << (offset * 2)
    }
    output += byte.toString(16).padStart(2, '0')
  }
  return output
}

function classifyNormalizedState(id: string, name: string): CategorySourceState {
  if (id && name) return 'both_present'
  if (!id && !name) return 'both_empty'
  if (id) return 'provider_id_only'
  return 'category_name_only'
}

function categoryText(value: unknown, maxLength: number): string {
  return typeof value === 'string'
    ? value.trim().replace(/\s+/g, ' ').slice(0, maxLength)
    : ''
}
