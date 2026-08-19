export const KICK_HISTORY_CATEGORY_V2_CONTRACT_VERSION = 'category-source-v2-chunked'
export const KICK_HISTORY_CATEGORY_V2_CHUNK_SIZE = 128
export const KICK_HISTORY_CATEGORY_V2_CATEGORY_ROW_CAP = 300
export const KICK_HISTORY_CATEGORY_V2_PHYSICAL_CHUNK_ROW_BUDGET = 1000
export const KICK_HISTORY_CATEGORY_V2_ENCODED_BYTES_CAP = 47_196
export const KICK_HISTORY_CATEGORY_V2_RETENTION_DAYS = 180

export type KickHistoryCategoryV2CoverageState =
  | 'observed'
  | 'partial'
  | 'unavailable_no_category_data'
  | 'unavailable_missing_category'
  | 'unavailable_overflow'
  | 'unavailable_encoded_bytes_overflow'
  | 'unavailable_generation_mismatch'

export type KickHistoryCategoryV2CategoryRow = {
  categoryId: string
  totalViewerMinutes: number
  peakViewers: number
  observedSnapshots: number
}

export type KickHistoryCategoryV2Contributor = {
  categoryId: string
  streamerId: string
  displayName: string
  viewerMinutes: number
  peakViewers: number
  observedMinutes: number
  sampleCount: number
}

export type KickHistoryCategoryV2ChunkRow = {
  categoryId: string
  chunkIndex: number
  contributorCount: number
  contributorsJson: string
  encodedBytes: number
}

export type KickHistoryCategoryV2DayStatus = {
  candidateCategoryRows: number
  logicalStreamerCategoryContributors: number
  physicalContributorChunkRows: number
  contributorEncodedBytes: number
  categoryRowCap: typeof KICK_HISTORY_CATEGORY_V2_CATEGORY_ROW_CAP
  physicalContributorRowBudget: typeof KICK_HISTORY_CATEGORY_V2_PHYSICAL_CHUNK_ROW_BUDGET
  contributorEncodedBytesCap: typeof KICK_HISTORY_CATEGORY_V2_ENCODED_BYTES_CAP
  sourceSnapshots: number
  observedCategoryItems: number
  missingCategoryItems: number
  coverageState: KickHistoryCategoryV2CoverageState
  sourceMode: string
  contractVersion: typeof KICK_HISTORY_CATEGORY_V2_CONTRACT_VERSION
}

export type KickHistoryCategoryV2DayInput = {
  provider: 'kick'
  sourceSnapshots: number
  observedCategoryItems: number
  missingCategoryItems: number
  sourceMode: string
  categoryRows: KickHistoryCategoryV2CategoryRow[]
  contributors: KickHistoryCategoryV2Contributor[]
}

export type KickHistoryCategoryV2DayCandidate = {
  provider: 'kick'
  authoritative: boolean
  status: KickHistoryCategoryV2DayStatus
  categoryRows: KickHistoryCategoryV2CategoryRow[]
  chunks: KickHistoryCategoryV2ChunkRow[]
}

type ContributorTuple = [string, string, number, number, number, number]

const utf8 = new TextEncoder()

export function buildKickHistoryCategoryV2DayCandidate(
  input: KickHistoryCategoryV2DayInput,
): KickHistoryCategoryV2DayCandidate {
  const categoryRows = [...input.categoryRows]
    .map((row) => ({ ...row, categoryId: row.categoryId.trim() }))
    .sort((a, b) => a.categoryId.localeCompare(b.categoryId))
  const categoryIds = new Set(categoryRows.map((row) => row.categoryId))
  const logicalContributorCount = input.contributors.length

  const unavailable = baseUnavailableState(input, categoryRows, categoryIds)
  if (unavailable) {
    return failClosed(input, categoryRows.length, logicalContributorCount, 0, 0, unavailable)
  }

  const grouped = new Map<string, KickHistoryCategoryV2Contributor[]>()
  const seenPairs = new Set<string>()
  for (const raw of input.contributors) {
    const contributor = normalizeContributor(raw)
    if (!categoryIds.has(contributor.categoryId)) {
      return failClosed(
        input,
        categoryRows.length,
        logicalContributorCount,
        0,
        0,
        'unavailable_generation_mismatch',
      )
    }
    const pairKey = `${contributor.categoryId}\u0000${contributor.streamerId}`
    if (seenPairs.has(pairKey)) {
      return failClosed(
        input,
        categoryRows.length,
        logicalContributorCount,
        0,
        0,
        'unavailable_generation_mismatch',
      )
    }
    seenPairs.add(pairKey)
    const current = grouped.get(contributor.categoryId) ?? []
    current.push(contributor)
    grouped.set(contributor.categoryId, current)
  }

  const chunks: KickHistoryCategoryV2ChunkRow[] = []
  let encodedBytes = 0
  for (const categoryId of [...grouped.keys()].sort()) {
    const contributors = grouped.get(categoryId)!
      .sort((a, b) => a.streamerId.localeCompare(b.streamerId))
    for (let offset = 0; offset < contributors.length; offset += KICK_HISTORY_CATEGORY_V2_CHUNK_SIZE) {
      const tuples = contributors
        .slice(offset, offset + KICK_HISTORY_CATEGORY_V2_CHUNK_SIZE)
        .map(toCanonicalTuple)
      const contributorsJson = JSON.stringify(tuples)
      const chunkEncodedBytes = utf8.encode(contributorsJson).byteLength
      encodedBytes += chunkEncodedBytes
      chunks.push({
        categoryId,
        chunkIndex: offset / KICK_HISTORY_CATEGORY_V2_CHUNK_SIZE,
        contributorCount: tuples.length,
        contributorsJson,
        encodedBytes: chunkEncodedBytes,
      })
    }
  }

  if (chunks.length > KICK_HISTORY_CATEGORY_V2_PHYSICAL_CHUNK_ROW_BUDGET) {
    return failClosed(
      input,
      categoryRows.length,
      logicalContributorCount,
      chunks.length,
      encodedBytes,
      'unavailable_overflow',
    )
  }
  if (encodedBytes > KICK_HISTORY_CATEGORY_V2_ENCODED_BYTES_CAP) {
    return failClosed(
      input,
      categoryRows.length,
      logicalContributorCount,
      chunks.length,
      encodedBytes,
      'unavailable_encoded_bytes_overflow',
    )
  }

  const coverageState: KickHistoryCategoryV2CoverageState =
    input.sourceSnapshots >= 240 ? 'observed' : 'partial'
  return {
    provider: 'kick',
    authoritative: true,
    status: statusFor(
      input,
      categoryRows.length,
      logicalContributorCount,
      chunks.length,
      encodedBytes,
      coverageState,
    ),
    categoryRows,
    chunks,
  }
}

function baseUnavailableState(
  input: KickHistoryCategoryV2DayInput,
  categoryRows: KickHistoryCategoryV2CategoryRow[],
  categoryIds: Set<string>,
): KickHistoryCategoryV2CoverageState | null {
  if (input.sourceSnapshots <= 0 || input.observedCategoryItems <= 0 || categoryRows.length <= 0) {
    return 'unavailable_no_category_data'
  }
  if (input.missingCategoryItems > 0) return 'unavailable_missing_category'
  if (categoryRows.length > KICK_HISTORY_CATEGORY_V2_CATEGORY_ROW_CAP) return 'unavailable_overflow'
  if (categoryIds.size !== categoryRows.length || categoryIds.has('')) return 'unavailable_generation_mismatch'
  return null
}

function normalizeContributor(raw: KickHistoryCategoryV2Contributor): KickHistoryCategoryV2Contributor {
  return {
    categoryId: raw.categoryId.trim(),
    streamerId: raw.streamerId.trim(),
    displayName: raw.displayName,
    viewerMinutes: integer(raw.viewerMinutes),
    peakViewers: integer(raw.peakViewers),
    observedMinutes: integer(raw.observedMinutes),
    sampleCount: integer(raw.sampleCount),
  }
}

function toCanonicalTuple(row: KickHistoryCategoryV2Contributor): ContributorTuple {
  return [
    row.streamerId,
    row.displayName,
    row.viewerMinutes,
    row.peakViewers,
    row.observedMinutes,
    row.sampleCount,
  ]
}

function failClosed(
  input: KickHistoryCategoryV2DayInput,
  categoryRows: number,
  logicalContributors: number,
  physicalChunks: number,
  encodedBytes: number,
  coverageState: KickHistoryCategoryV2CoverageState,
): KickHistoryCategoryV2DayCandidate {
  return {
    provider: 'kick',
    authoritative: false,
    status: statusFor(
      input,
      categoryRows,
      logicalContributors,
      physicalChunks,
      encodedBytes,
      coverageState,
    ),
    categoryRows: [],
    chunks: [],
  }
}

function statusFor(
  input: KickHistoryCategoryV2DayInput,
  categoryRows: number,
  logicalContributors: number,
  physicalChunks: number,
  encodedBytes: number,
  coverageState: KickHistoryCategoryV2CoverageState,
): KickHistoryCategoryV2DayStatus {
  return {
    candidateCategoryRows: categoryRows,
    logicalStreamerCategoryContributors: logicalContributors,
    physicalContributorChunkRows: physicalChunks,
    contributorEncodedBytes: encodedBytes,
    categoryRowCap: KICK_HISTORY_CATEGORY_V2_CATEGORY_ROW_CAP,
    physicalContributorRowBudget: KICK_HISTORY_CATEGORY_V2_PHYSICAL_CHUNK_ROW_BUDGET,
    contributorEncodedBytesCap: KICK_HISTORY_CATEGORY_V2_ENCODED_BYTES_CAP,
    sourceSnapshots: integer(input.sourceSnapshots),
    observedCategoryItems: integer(input.observedCategoryItems),
    missingCategoryItems: integer(input.missingCategoryItems),
    coverageState,
    sourceMode: input.sourceMode,
    contractVersion: KICK_HISTORY_CATEGORY_V2_CONTRACT_VERSION,
  }
}

function integer(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0
}

export const KICK_HISTORY_CATEGORY_V2_PERIOD_RANKING_SQL = `
WITH selected_chunks AS (
  SELECT day, contributors_json
  FROM history_category_streamer_daily_chunks_v2
  WHERE provider = ?
    AND category_id = ?
    AND day >= ? AND day <= ?
),
expanded AS (
  SELECT
    selected_chunks.day,
    CAST(json_extract(j.value, '$[0]') AS TEXT) AS streamer_id,
    CAST(json_extract(j.value, '$[1]') AS TEXT) AS display_name,
    CAST(json_extract(j.value, '$[2]') AS INTEGER) AS viewer_minutes,
    CAST(json_extract(j.value, '$[3]') AS INTEGER) AS peak_viewers,
    CAST(json_extract(j.value, '$[4]') AS INTEGER) AS observed_minutes,
    CAST(json_extract(j.value, '$[5]') AS INTEGER) AS sample_count
  FROM selected_chunks, json_each(selected_chunks.contributors_json) j
)
SELECT
  streamer_id,
  MAX(display_name) AS display_name,
  SUM(viewer_minutes) AS viewer_minutes,
  MAX(peak_viewers) AS peak_viewers,
  SUM(observed_minutes) AS observed_minutes,
  SUM(sample_count) AS sample_count
FROM expanded
GROUP BY streamer_id
ORDER BY viewer_minutes DESC, peak_viewers DESC, streamer_id
`

export const KICK_HISTORY_CATEGORY_V2_CANDIDATE_BOUNDARY = {
  provider: 'kick',
  chunkSize: KICK_HISTORY_CATEGORY_V2_CHUNK_SIZE,
  categoryRowCap: KICK_HISTORY_CATEGORY_V2_CATEGORY_ROW_CAP,
  physicalChunkRowBudget: KICK_HISTORY_CATEGORY_V2_PHYSICAL_CHUNK_ROW_BUDGET,
  encodedBytesCap: KICK_HISTORY_CATEGORY_V2_ENCODED_BYTES_CAP,
  retentionDays: KICK_HISTORY_CATEGORY_V2_RETENTION_DAYS,
  topK: false,
  sampling: false,
  backfill: false,
  productionWiringIncluded: false,
} as const
