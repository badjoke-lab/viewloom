import { shouldRunIntradayGeneration } from '../shared/intraday-rollup'
import {
  precheckKickHistoryCategoryDay,
  type KickHistoryCategoryPrecheck,
} from '../shared/history-category-aggregate'
import {
  buildKickHistoryCategoryV2DayCandidate,
  KICK_HISTORY_CATEGORY_V2_CATEGORY_ROW_CAP,
  KICK_HISTORY_CATEGORY_V2_CHUNK_SIZE,
  KICK_HISTORY_CATEGORY_V2_CONTRACT_VERSION,
  KICK_HISTORY_CATEGORY_V2_ENCODED_BYTES_CAP,
  KICK_HISTORY_CATEGORY_V2_PHYSICAL_CHUNK_ROW_BUDGET,
  KICK_HISTORY_CATEGORY_V2_RETENTION_DAYS,
  type KickHistoryCategoryV2CategoryRow,
  type KickHistoryCategoryV2Contributor,
  type KickHistoryCategoryV2CoverageState,
  type KickHistoryCategoryV2DayCandidate,
  type KickHistoryCategoryV2DayStatus,
} from './history-category-chunked-v2-candidate'
import {
  KICK_HISTORY_CATEGORY_V2_CATEGORY_ROWS_SELECT_SQL,
  KICK_HISTORY_CATEGORY_V2_CONTRIBUTOR_ROWS_SELECT_SQL,
  KICK_HISTORY_CATEGORY_V2_DELETE_CATEGORY_DAY_SQL,
  KICK_HISTORY_CATEGORY_V2_DELETE_CHUNK_DAY_SQL,
  KICK_HISTORY_CATEGORY_V2_INSERT_CATEGORY_JSON_SQL,
  KICK_HISTORY_CATEGORY_V2_INSERT_CHUNK_JSON_SQL,
  KICK_HISTORY_CATEGORY_V2_RETENTION_DELETE_CATEGORY_SQL,
  KICK_HISTORY_CATEGORY_V2_RETENTION_DELETE_CHUNK_SQL,
  KICK_HISTORY_CATEGORY_V2_RETENTION_DELETE_STATUS_SQL,
  KICK_HISTORY_CATEGORY_V2_STATUS_UPSERT_SQL,
} from './history-category-v2-generator-sql'

const PROVIDER = 'kick' as const
const BUCKET_MINUTES = 5
export const KICK_HISTORY_CATEGORY_V2_DORMANT_GENERATOR_VERSION =
  'kick-history-category-v2-dormant-generator-v1'
export const KICK_HISTORY_CATEGORY_V2_MAX_NORMAL_STATEMENTS = 19

type MetaSummary = {
  statements: number
  durationMs: number
  rowsRead: number
  rowsWritten: number
  changes: number
}

type CategoryDbRow = {
  category_id: string
  total_viewer_minutes: number
  peak_viewers: number
  observed_snapshots: number
}

type ContributorDbRow = {
  category_id: string
  streamer_id: string
  display_name: string
  viewer_minutes: number
  peak_viewers: number
  observed_minutes: number
  sample_count: number
}

export type KickHistoryCategoryV2DormantGeneratorConfig = {
  enabled: boolean
  startDay: string
}

export type KickHistoryCategoryV2DormantDayResult = {
  day: string
  startDay: string
  precheck: KickHistoryCategoryPrecheck
  coverageState: KickHistoryCategoryV2CoverageState
  aggregateRowsAuthoritative: boolean
  generatedCategoryRows: number
  generatedChunkRows: number
  encodedContributorBytes: number
  sourceRead: MetaSummary
  writeBatch: MetaSummary
  recoveryBatch?: MetaSummary
  workerWallMs: number
}

export type KickHistoryCategoryV2DormantGenerationResult = {
  provider: typeof PROVIDER
  version: typeof KICK_HISTORY_CATEGORY_V2_DORMANT_GENERATOR_VERSION
  enabled: boolean
  attempted: boolean
  maintenanceWindow: boolean
  startDay: string
  reason?: 'disabled' | 'outside_maintenance_window' | 'no_eligible_target_days' | 'invalid_start_day'
  days?: KickHistoryCategoryV2DormantDayResult[]
  retentionCleanup?: MetaSummary & { attempted: boolean }
  totals?: MetaSummary & { workerWallMs: number; maximumNormalStatements: number }
  error?: string
}

export async function maybeGenerateKickHistoryCategoryV2Dormant(
  db: D1Database,
  config: KickHistoryCategoryV2DormantGeneratorConfig,
  now = new Date(),
): Promise<KickHistoryCategoryV2DormantGenerationResult> {
  if (!config.enabled) return baseResult(config, false, false, 'disabled')
  if (!isCalendarDay(config.startDay)) return baseResult(config, true, false, 'invalid_start_day')
  if (!shouldRunIntradayGeneration(now)) return baseResult(config, true, false, 'outside_maintenance_window')

  const eligibleDays = targetDays(now).filter((day) => day >= config.startDay)
  if (eligibleDays.length === 0) return baseResult(config, true, true, 'no_eligible_target_days')

  const startedAt = Date.now()
  const days: KickHistoryCategoryV2DormantDayResult[] = []
  try {
    for (const day of eligibleDays) {
      days.push(await refreshKickHistoryCategoryV2DormantDay(db, day, config.startDay))
    }
    const retentionCleanup = shouldRunRetentionCleanup(now)
      ? await cleanupKickHistoryCategoryV2Retention(db)
      : { attempted: false, ...emptyMeta() }
    return {
      provider: PROVIDER,
      version: KICK_HISTORY_CATEGORY_V2_DORMANT_GENERATOR_VERSION,
      enabled: true,
      attempted: true,
      maintenanceWindow: true,
      startDay: config.startDay,
      days,
      retentionCleanup,
      totals: summarizeGeneration(days, retentionCleanup, Date.now() - startedAt),
    }
  } catch (error) {
    return {
      provider: PROVIDER,
      version: KICK_HISTORY_CATEGORY_V2_DORMANT_GENERATOR_VERSION,
      enabled: true,
      attempted: true,
      maintenanceWindow: true,
      startDay: config.startDay,
      days,
      error: sanitizeError(error),
    }
  }
}

export async function refreshKickHistoryCategoryV2DormantDay(
  db: D1Database,
  day: string,
  startDay = day,
): Promise<KickHistoryCategoryV2DormantDayResult> {
  const startedAt = Date.now()
  if (!isCalendarDay(day) || !isCalendarDay(startDay) || day < startDay) {
    throw new Error('history_category_v2_day_before_start_boundary')
  }

  const precheck = await precheckKickHistoryCategoryDay(db, day)
  const earlyUnavailable = precheckUnavailableState(precheck)
  if (earlyUnavailable) {
    const status = statusFromPrecheck(precheck, earlyUnavailable)
    const writeBatch = await persistFailClosedStatus(db, day, status, new Date().toISOString())
    return dayResult(day, startDay, precheck, status, false, 0, 0, 0, precheck.meta, writeBatch, startedAt)
  }

  const categoryResult = await db.prepare(KICK_HISTORY_CATEGORY_V2_CATEGORY_ROWS_SELECT_SQL)
    .bind(PROVIDER, day, BUCKET_MINUTES)
    .all<CategoryDbRow>()
  const contributorResult = await db.prepare(KICK_HISTORY_CATEGORY_V2_CONTRIBUTOR_ROWS_SELECT_SQL)
    .bind(PROVIDER, day, BUCKET_MINUTES, BUCKET_MINUTES)
    .all<ContributorDbRow>()
  const sourceRead = summarizeMeta([precheck.meta, categoryResult, contributorResult])
  const categoryRows = (categoryResult.results ?? []).map(mapCategoryRow)
  const contributors = (contributorResult.results ?? []).map(mapContributorRow)

  if (
    categoryRows.length !== precheck.candidateCategoryRows
    || contributors.length !== precheck.candidateStreamerCategoryRows
  ) {
    const status = statusFromPrecheck(precheck, 'unavailable_generation_mismatch')
    const writeBatch = await persistFailClosedStatus(db, day, status, new Date().toISOString())
    return dayResult(day, startDay, precheck, status, false, 0, 0, 0, sourceRead, writeBatch, startedAt)
  }

  const candidate = buildKickHistoryCategoryV2DayCandidate({
    provider: PROVIDER,
    sourceSnapshots: precheck.sourceSnapshots,
    observedCategoryItems: precheck.categoryObservedItems,
    missingCategoryItems: precheck.categoryMissingItems,
    sourceMode: precheck.sourceMode,
    categoryRows,
    contributors,
  })

  const updatedAt = new Date().toISOString()
  if (!candidate.authoritative) {
    const writeBatch = await persistFailClosedStatus(db, day, candidate.status, updatedAt)
    return dayResult(
      day,
      startDay,
      precheck,
      candidate.status,
      false,
      0,
      0,
      candidate.status.contributorEncodedBytes,
      sourceRead,
      writeBatch,
      startedAt,
    )
  }

  const writeResults = await db.batch([
    db.prepare(KICK_HISTORY_CATEGORY_V2_DELETE_CATEGORY_DAY_SQL).bind(PROVIDER, day),
    db.prepare(KICK_HISTORY_CATEGORY_V2_DELETE_CHUNK_DAY_SQL).bind(PROVIDER, day),
    db.prepare(KICK_HISTORY_CATEGORY_V2_INSERT_CATEGORY_JSON_SQL).bind(
      PROVIDER,
      day,
      precheck.sourceMode,
      KICK_HISTORY_CATEGORY_V2_CONTRACT_VERSION,
      updatedAt,
      JSON.stringify(candidate.categoryRows),
    ),
    db.prepare(KICK_HISTORY_CATEGORY_V2_INSERT_CHUNK_JSON_SQL).bind(
      PROVIDER,
      day,
      KICK_HISTORY_CATEGORY_V2_CONTRACT_VERSION,
      updatedAt,
      JSON.stringify(candidate.chunks),
    ),
    statusStatement(db, day, candidate.status, updatedAt),
  ])
  const writeBatch = summarizeMeta(writeResults)
  const generatedCategoryRows = metaInteger(writeResults[2], 'changes')
  const generatedChunkRows = metaInteger(writeResults[3], 'changes')

  if (
    generatedCategoryRows !== candidate.categoryRows.length
    || generatedChunkRows !== candidate.chunks.length
  ) {
    const mismatchStatus = {
      ...candidate.status,
      coverageState: 'unavailable_generation_mismatch' as const,
    }
    const recoveryBatch = await persistFailClosedStatus(db, day, mismatchStatus, new Date().toISOString())
    return dayResult(
      day,
      startDay,
      precheck,
      mismatchStatus,
      false,
      0,
      0,
      candidate.status.contributorEncodedBytes,
      sourceRead,
      writeBatch,
      startedAt,
      recoveryBatch,
    )
  }

  return dayResult(
    day,
    startDay,
    precheck,
    candidate.status,
    true,
    generatedCategoryRows,
    generatedChunkRows,
    candidate.status.contributorEncodedBytes,
    sourceRead,
    writeBatch,
    startedAt,
  )
}

async function persistFailClosedStatus(
  db: D1Database,
  day: string,
  status: KickHistoryCategoryV2DayStatus,
  updatedAt: string,
): Promise<MetaSummary> {
  const results = await db.batch([
    db.prepare(KICK_HISTORY_CATEGORY_V2_DELETE_CATEGORY_DAY_SQL).bind(PROVIDER, day),
    db.prepare(KICK_HISTORY_CATEGORY_V2_DELETE_CHUNK_DAY_SQL).bind(PROVIDER, day),
    statusStatement(db, day, status, updatedAt),
  ])
  return summarizeMeta(results)
}

function statusStatement(
  db: D1Database,
  day: string,
  status: KickHistoryCategoryV2DayStatus,
  updatedAt: string,
): D1PreparedStatement {
  return db.prepare(KICK_HISTORY_CATEGORY_V2_STATUS_UPSERT_SQL).bind(
    PROVIDER,
    day,
    status.candidateCategoryRows,
    status.logicalStreamerCategoryContributors,
    status.physicalContributorChunkRows,
    status.contributorEncodedBytes,
    status.categoryRowCap,
    status.physicalContributorRowBudget,
    status.contributorEncodedBytesCap,
    status.sourceSnapshots,
    status.observedCategoryItems,
    status.missingCategoryItems,
    status.coverageState,
    status.sourceMode,
    status.contractVersion,
    updatedAt,
  )
}

async function cleanupKickHistoryCategoryV2Retention(
  db: D1Database,
): Promise<MetaSummary & { attempted: boolean }> {
  const boundary = `-${KICK_HISTORY_CATEGORY_V2_RETENTION_DAYS} days`
  const results = await db.batch([
    db.prepare(KICK_HISTORY_CATEGORY_V2_RETENTION_DELETE_CATEGORY_SQL).bind(PROVIDER, boundary),
    db.prepare(KICK_HISTORY_CATEGORY_V2_RETENTION_DELETE_CHUNK_SQL).bind(PROVIDER, boundary),
    db.prepare(KICK_HISTORY_CATEGORY_V2_RETENTION_DELETE_STATUS_SQL).bind(PROVIDER, boundary),
  ])
  return { attempted: true, ...summarizeMeta(results) }
}

function precheckUnavailableState(
  precheck: KickHistoryCategoryPrecheck,
): Extract<KickHistoryCategoryV2CoverageState, `unavailable_${string}`> | null {
  if (precheck.sourceSnapshots <= 0 || precheck.validStreamItems <= 0 || precheck.categoryObservedItems <= 0) {
    return 'unavailable_no_category_data'
  }
  if (precheck.categoryMissingItems > 0) return 'unavailable_missing_category'
  if (precheck.candidateCategoryRows > KICK_HISTORY_CATEGORY_V2_CATEGORY_ROW_CAP) return 'unavailable_overflow'
  return null
}

function statusFromPrecheck(
  precheck: KickHistoryCategoryPrecheck,
  coverageState: KickHistoryCategoryV2CoverageState,
): KickHistoryCategoryV2DayStatus {
  return {
    candidateCategoryRows: precheck.candidateCategoryRows,
    logicalStreamerCategoryContributors: precheck.candidateStreamerCategoryRows,
    physicalContributorChunkRows: 0,
    contributorEncodedBytes: 0,
    categoryRowCap: KICK_HISTORY_CATEGORY_V2_CATEGORY_ROW_CAP,
    physicalContributorRowBudget: KICK_HISTORY_CATEGORY_V2_PHYSICAL_CHUNK_ROW_BUDGET,
    contributorEncodedBytesCap: KICK_HISTORY_CATEGORY_V2_ENCODED_BYTES_CAP,
    sourceSnapshots: precheck.sourceSnapshots,
    observedCategoryItems: precheck.categoryObservedItems,
    missingCategoryItems: precheck.categoryMissingItems,
    coverageState,
    sourceMode: precheck.sourceMode,
    contractVersion: KICK_HISTORY_CATEGORY_V2_CONTRACT_VERSION,
  }
}

function mapCategoryRow(row: CategoryDbRow): KickHistoryCategoryV2CategoryRow {
  return {
    categoryId: text(row.category_id),
    totalViewerMinutes: integer(row.total_viewer_minutes),
    peakViewers: integer(row.peak_viewers),
    observedSnapshots: integer(row.observed_snapshots),
  }
}

function mapContributorRow(row: ContributorDbRow): KickHistoryCategoryV2Contributor {
  return {
    categoryId: text(row.category_id),
    streamerId: text(row.streamer_id),
    displayName: text(row.display_name),
    viewerMinutes: integer(row.viewer_minutes),
    peakViewers: integer(row.peak_viewers),
    observedMinutes: integer(row.observed_minutes),
    sampleCount: integer(row.sample_count),
  }
}

function dayResult(
  day: string,
  startDay: string,
  precheck: KickHistoryCategoryPrecheck,
  status: KickHistoryCategoryV2DayStatus,
  authoritative: boolean,
  generatedCategoryRows: number,
  generatedChunkRows: number,
  encodedContributorBytes: number,
  sourceRead: MetaSummary,
  writeBatch: MetaSummary,
  startedAt: number,
  recoveryBatch?: MetaSummary,
): KickHistoryCategoryV2DormantDayResult {
  return {
    day,
    startDay,
    precheck,
    coverageState: status.coverageState,
    aggregateRowsAuthoritative: authoritative,
    generatedCategoryRows,
    generatedChunkRows,
    encodedContributorBytes,
    sourceRead,
    writeBatch,
    recoveryBatch,
    workerWallMs: round(Date.now() - startedAt, 2),
  }
}

function baseResult(
  config: KickHistoryCategoryV2DormantGeneratorConfig,
  enabled: boolean,
  maintenanceWindow: boolean,
  reason: NonNullable<KickHistoryCategoryV2DormantGenerationResult['reason']>,
): KickHistoryCategoryV2DormantGenerationResult {
  return {
    provider: PROVIDER,
    version: KICK_HISTORY_CATEGORY_V2_DORMANT_GENERATOR_VERSION,
    enabled,
    attempted: false,
    maintenanceWindow,
    startDay: config.startDay,
    reason,
  }
}

function targetDays(now: Date): [string, string] {
  const today = dayString(now)
  const yesterday = new Date(now)
  yesterday.setUTCDate(yesterday.getUTCDate() - 1)
  return [today, dayString(yesterday)]
}

function shouldRunRetentionCleanup(now: Date): boolean {
  return now.getUTCHours() === 0 && now.getUTCMinutes() >= 20 && now.getUTCMinutes() < 25
}

function summarizeGeneration(
  days: KickHistoryCategoryV2DormantDayResult[],
  retention: MetaSummary,
  workerWallMs: number,
): MetaSummary & { workerWallMs: number; maximumNormalStatements: number } {
  const total = { ...emptyMeta(), workerWallMs: round(workerWallMs, 2), maximumNormalStatements: KICK_HISTORY_CATEGORY_V2_MAX_NORMAL_STATEMENTS }
  addMeta(total, retention)
  for (const day of days) {
    addMeta(total, day.sourceRead)
    addMeta(total, day.writeBatch)
    if (day.recoveryBatch) addMeta(total, day.recoveryBatch)
  }
  total.durationMs = round(total.durationMs, 3)
  return total
}

function summarizeMeta(results: Array<{ meta?: unknown } | MetaSummary>): MetaSummary {
  const total = emptyMeta()
  for (const result of results) {
    if (isMetaSummary(result)) {
      addMeta(total, result)
      continue
    }
    const meta = (result?.meta ?? {}) as Record<string, unknown>
    total.statements += 1
    total.durationMs += numeric(meta.duration)
    total.rowsRead += integer(meta.rows_read)
    total.rowsWritten += integer(meta.rows_written)
    total.changes += integer(meta.changes)
  }
  total.durationMs = round(total.durationMs, 3)
  return total
}

function isMetaSummary(value: { meta?: unknown } | MetaSummary): value is MetaSummary {
  return 'statements' in value && 'rowsRead' in value
}

function addMeta(target: MetaSummary, value: MetaSummary): void {
  target.statements += value.statements
  target.durationMs += value.durationMs
  target.rowsRead += value.rowsRead
  target.rowsWritten += value.rowsWritten
  target.changes += value.changes
}

function emptyMeta(): MetaSummary {
  return { statements: 0, durationMs: 0, rowsRead: 0, rowsWritten: 0, changes: 0 }
}

function metaInteger(result: { meta?: unknown } | undefined, key: string): number {
  const meta = (result?.meta ?? {}) as Record<string, unknown>
  return integer(meta[key])
}

function isCalendarDay(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const parsed = new Date(`${value}T00:00:00.000Z`)
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
}

function dayString(value: Date): string {
  return value.toISOString().slice(0, 10)
}

function text(value: unknown): string {
  return typeof value === 'string' ? value : String(value ?? '')
}

function integer(value: unknown): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0
}

function numeric(value: unknown): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function round(value: number, digits: number): number {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}

function sanitizeError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error)
  return message.replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [redacted]').slice(0, 240)
}

export const KICK_HISTORY_CATEGORY_V2_DORMANT_GENERATOR_BOUNDARY = {
  provider: PROVIDER,
  sourceCategoryContract: 'category-source-v1',
  outputContract: KICK_HISTORY_CATEGORY_V2_CONTRACT_VERSION,
  bucketMinutes: BUCKET_MINUTES,
  chunkSize: KICK_HISTORY_CATEGORY_V2_CHUNK_SIZE,
  categoryRowCap: KICK_HISTORY_CATEGORY_V2_CATEGORY_ROW_CAP,
  physicalChunkRowBudget: KICK_HISTORY_CATEGORY_V2_PHYSICAL_CHUNK_ROW_BUDGET,
  encodedContributorBytesCap: KICK_HISTORY_CATEGORY_V2_ENCODED_BYTES_CAP,
  retentionDays: KICK_HISTORY_CATEGORY_V2_RETENTION_DAYS,
  rawCategoryReadPathsPerDay: 3,
  normalStatementsMaximumForTwoDaysWithRetention: KICK_HISTORY_CATEGORY_V2_MAX_NORMAL_STATEMENTS,
  explicitStartDayRequired: true,
  preActivationDaysEligible: false,
  topK: false,
  sampling: false,
  activeCollectorWiringIncluded: false,
  productionEnablementIncluded: false,
  v1DisablementIncluded: false,
  backfill: false,
  newCron: false,
} as const
