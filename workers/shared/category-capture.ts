export type CategoryProvider = 'twitch' | 'kick'

export type CategorySourceFields = {
  categoryProviderId?: string | null
  categoryName?: string | null
}

export type CategoryDictionaryEntry = {
  id: string
  name: string
}

export type CategoryCoverageState =
  | 'observed'
  | 'missing_from_source'
  | 'partial_source_coverage'
  | 'unavailable'

export type EncodedCategorySnapshot = {
  payloadFields: {
    categoryContractVersion: typeof CATEGORY_CONTRACT_VERSION
    categoryIds: string[]
    categoryRefs: Array<number | null>
  }
  dictionaryEntries: CategoryDictionaryEntry[]
  observedItems: number
  missingItems: number
  coverageState: CategoryCoverageState
}

export type CategoryDictionaryWriteResult = {
  attempted: boolean
  entries: number
  rowsRead: number
  rowsWritten: number
  changes: number
  durationMs: number
}

export const CATEGORY_CONTRACT_VERSION = 'category-source-v1'

export function categoryCaptureEnabled(value: string | undefined): boolean {
  return value?.trim().toLowerCase() === 'true'
}

export function encodeCategorySnapshot(
  items: CategorySourceFields[],
  sourceCoveragePartial = false,
): EncodedCategorySnapshot {
  const categoryIds: string[] = []
  const categoryIndex = new Map<string, number>()
  const dictionary = new Map<string, string>()
  const categoryRefs: Array<number | null> = []
  let observedItems = 0
  let missingItems = 0

  for (const item of items) {
    const id = categoryText(item.categoryProviderId, 160)
    const name = categoryText(item.categoryName, 240)
    if (!id || !name) {
      categoryRefs.push(null)
      missingItems += 1
      continue
    }

    let ref = categoryIndex.get(id)
    if (ref === undefined) {
      ref = categoryIds.length
      categoryIds.push(id)
      categoryIndex.set(id, ref)
    }
    dictionary.set(id, name)
    categoryRefs.push(ref)
    observedItems += 1
  }

  const coverageState: CategoryCoverageState = sourceCoveragePartial
    ? 'partial_source_coverage'
    : missingItems > 0
      ? 'missing_from_source'
      : observedItems > 0
        ? 'observed'
        : 'unavailable'

  return {
    payloadFields: {
      categoryContractVersion: CATEGORY_CONTRACT_VERSION,
      categoryIds,
      categoryRefs,
    },
    dictionaryEntries: [...dictionary.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.id.localeCompare(b.id)),
    observedItems,
    missingItems,
    coverageState,
  }
}

export function stripCategorySourceFields<T extends CategorySourceFields>(items: T[]): Array<Omit<T, keyof CategorySourceFields>> {
  return items.map((item) => {
    const {
      categoryProviderId: _categoryProviderId,
      categoryName: _categoryName,
      ...stored
    } = item
    return stored
  })
}

export async function writeCategoryDictionary(
  db: D1Database,
  provider: CategoryProvider,
  entries: CategoryDictionaryEntry[],
  observedAt: string,
): Promise<CategoryDictionaryWriteResult> {
  if (entries.length === 0) {
    return {
      attempted: false,
      entries: 0,
      rowsRead: 0,
      rowsWritten: 0,
      changes: 0,
      durationMs: 0,
    }
  }

  const result = await db.prepare(CATEGORY_DICTIONARY_UPSERT_SQL)
    .bind(provider, observedAt, observedAt, CATEGORY_CONTRACT_VERSION, JSON.stringify(entries))
    .run()
  const meta = (result.meta ?? {}) as Record<string, unknown>

  return {
    attempted: true,
    entries: entries.length,
    rowsRead: integer(meta.rows_read),
    rowsWritten: integer(meta.rows_written),
    changes: integer(meta.changes),
    durationMs: number(meta.duration),
  }
}

function categoryText(value: unknown, maxLength: number): string {
  return typeof value === 'string'
    ? value.trim().replace(/\s+/g, ' ').slice(0, maxLength)
    : ''
}

function integer(value: unknown): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0
}

function number(value: unknown): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0
}

export const CATEGORY_DICTIONARY_UPSERT_SQL = `
INSERT INTO provider_category_dictionary (
  provider,
  category_id,
  category_name,
  first_observed_at,
  last_observed_at,
  contract_version
)
SELECT
  ?,
  TRIM(CAST(json_extract(j.value, '$.id') AS TEXT)),
  TRIM(CAST(json_extract(j.value, '$.name') AS TEXT)),
  ?,
  ?,
  ?
FROM json_each(?) AS j
WHERE TRIM(CAST(json_extract(j.value, '$.id') AS TEXT)) != ''
  AND TRIM(CAST(json_extract(j.value, '$.name') AS TEXT)) != ''
ON CONFLICT(provider, category_id) DO UPDATE SET
  category_name = excluded.category_name,
  last_observed_at = excluded.last_observed_at,
  contract_version = excluded.contract_version
WHERE provider_category_dictionary.category_name != excluded.category_name
   OR provider_category_dictionary.contract_version != excluded.contract_version
`
