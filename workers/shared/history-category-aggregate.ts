import { CATEGORY_CONTRACT_VERSION } from './category-capture'
import { shouldRunIntradayGeneration } from './intraday-rollup'
import {
  HISTORY_CATEGORY_INSERT_DAILY_SQL,
  HISTORY_CATEGORY_INSERT_STREAMER_DAILY_SQL,
  HISTORY_CATEGORY_PRECHECK_SQL,
  HISTORY_CATEGORY_STATUS_UPSERT_SQL,
} from './history-category-aggregate-sql'

export const HISTORY_CATEGORY_RETENTION_DAYS = 180
export const HISTORY_CATEGORY_ROW_CAP = 300
export const HISTORY_CATEGORY_STREAMER_ROW_CAP = 1000
export const HISTORY_CATEGORY_BUCKET_MINUTES = 5
export const HISTORY_CATEGORY_MAX_NORMAL_STATEMENTS = 17

const PROVIDER = 'kick' as const

type MetaSummary = {
  statements: number
  durationMs: number
  rowsRead: number
  rowsWritten: number
  changes: number
}

type PrecheckRow = {
  source_snapshots: number
  valid_stream_items: number
  category_observed_items: number
  category_missing_items: number
  candidate_category_rows: number
  candidate_streamer_category_rows: number
  source_mode: string
}

export type KickHistoryCategoryPrecheck = {
  day: string
  sourceSnapshots: number
  validStreamItems: number
  categoryObservedItems: number
  categoryMissingItems: number
  candidateCategoryRows: number
  candidateStreamerCategoryRows: number
  sourceMode: string
  meta: MetaSummary
}

export type KickHistoryCategoryCoverageState =
  | 'refresh_pending'
  | 'observed'
  | 'partial'
  | 'unavailable_no_category_data'
  | 'unavailable_missing_category'
  | 'unavailable_overflow'
  | 'unavailable_generation_mismatch'

export type KickHistoryCategoryDayResult = {
  day: string
  startDay: string
  precheck: KickHistoryCategoryPrecheck
  coverageState: KickHistoryCategoryCoverageState
  aggregateRowsAuthoritative: boolean
  generatedCategoryRows: number
  generatedStreamerCategoryRows: number
  pendingWrite: MetaSummary
  writeBatch: MetaSummary
  recoveryBatch?: MetaSummary
  workerWallMs: number
}

export type KickHistoryCategoryGenerationConfig = {
  enabled: boolean
  startDay: string
  categoryRowCap?: number
  streamerCategoryRowCap?: number
  bucketMinutes?: number
}

export type KickHistoryCategoryGenerationResult = {
  provider: typeof PROVIDER
  enabled: boolean
  attempted: boolean
  maintenanceWindow: boolean
  startDay: string
  categoryContractVersion: typeof CATEGORY_CONTRACT_VERSION
  reason?: 'disabled' | 'outside_maintenance_window' | 'no_eligible_target_days' | 'invalid_start_day'
  days?: KickHistoryCategoryDayResult[]
  retentionCleanup?: MetaSummary & { attempted: boolean }
  totals?: MetaSummary & {
    workerWallMs: number
    maximumNormalStatements: number
  }
  error?: string
}

export async function maybeGenerateKickHistoryCategoryAggregates(
  db: D1Database,
  config: KickHistoryCategoryGenerationConfig,
  now = new Date(),
): Promise<KickHistoryCategoryGenerationResult> {
  if (!config.enabled) {
    return {
      provider: PROVIDER,
      enabled: false,
      attempted: false,
      maintenanceWindow: false,
      startDay: config.startDay,
      categoryContractVersion: CATEGORY_CONTRACT_VERSION,
      reason: 'disabled',
    }
  }
  if (!isCalendarDay(config.startDay)) {
    return {
      provider: PROVIDER,
      enabled: true,
      attempted: false,
      maintenanceWindow: false,
      startDay: config.startDay,
      categoryContractVersion: CATEGORY_CONTRACT_VERSION,
      reason: 'invalid_start_day',
    }
  }
  if (!shouldRunIntradayGeneration(now)) {
    return {
      provider: PROVIDER,
      enabled: true,
      attempted: false,
      maintenanceWindow: false,
      startDay: config.startDay,
      categoryContractVersion: CATEGORY_CONTRACT_VERSION,
      reason: 'outside_maintenance_window',
    }
  }

  const eligibleDays = targetDays(now).filter((day) => day >= config.startDay)
  if (eligibleDays.length === 0) {
    return {
      provider: PROVIDER,
      enabled: true,
      attempted: false,
      maintenanceWindow: true,
      startDay: config.startDay,
      categoryContractVersion: CATEGORY_CONTRACT_VERSION,
      reason: 'no_eligible_target_days',
    }
  }

  const startedAt = Date.now()
  const days: KickHistoryCategoryDayResult[] = []
  try {
    for (const day of eligibleDays) {
      days.push(await refreshKickHistoryCategoryAggregateDay(db, day, config))
    }
    const retentionCleanup = shouldRunRetentionCleanup(now)
      ? await cleanupKickHistoryCategoryRetention(db)
      : emptyMetaWithAttempt(false)
    return {
      provider: PROVIDER,
      enabled: true,
      attempted: true,
      maintenanceWindow: true,
      startDay: config.startDay,
      categoryContractVersion: CATEGORY_CONTRACT_VERSION,
      days,
      retentionCleanup,
      totals: summarizeGeneration(days, retentionCleanup, Date.now() - startedAt),
    }
  } catch (error) {
    return {
      provider: PROVIDER,
      enabled: true,
      attempted: true,
      maintenanceWindow: true,
      startDay: config.startDay,
      categoryContractVersion: CATEGORY_CONTRACT_VERSION,
      days,
      error: sanitizeError(error),
    }
  }
}

export async function precheckKickHistoryCategoryDay(
  db: D1Database,
  day: string,
): Promise<KickHistoryCategoryPrecheck> {
  if (!isCalendarDay(day)) throw new Error('history_category_invalid_day')
  const result = await db.prepare(HISTORY_CATEGORY_PRECHECK_SQL).bind(PROVIDER, day).all<PrecheckRow>()
  const row = result.results?.[0]
  return {
    day,
    sourceSnapshots: integer(row?.source_snapshots),
    validStreamItems: integer(row?.valid_stream_items),
    categoryObservedItems: integer(row?.category_observed_items),
    categoryMissingItems: integer(row?.category_missing_items),
    candidateCategoryRows: integer(row?.candidate_category_rows),
    candidateStreamerCategoryRows: integer(row?.candidate_streamer_category_rows),
    sourceMode: normalizeSourceMode(row?.source_mode),
    meta: summarizeMeta([result]),
  }
}

export async function refreshKickHistoryCategoryAggregateDay(
  db: D1Database,
  day: string,
  config: Omit<KickHistoryCategoryGenerationConfig, 'enabled' | 'startDay'> & { startDay?: string } = {},
): Promise<KickHistoryCategoryDayResult> {
  const startedAt = Date.now()
  const startDay = config.startDay ?? day
  if (!isCalendarDay(day) || !isCalendarDay(startDay) || day < startDay) {
    throw new Error('history_category_day_before_start_boundary')
  }

  const categoryRowCap = boundedPositiveInteger(config.categoryRowCap, HISTORY_CATEGORY_ROW_CAP)
  const streamerCategoryRowCap = boundedPositiveInteger(config.streamerCategoryRowCap, HISTORY_CATEGORY_STREAMER_ROW_CAP)
  const bucketMinutes = boundedPositiveInteger(config.bucketMinutes, HISTORY_CATEGORY_BUCKET_MINUTES)
  const precheck = await precheckKickHistoryCategoryDay(db, day)
  const unavailableState = precheckUnavailableState(precheck, categoryRowCap, streamerCategoryRowCap)
  const updatedAt = new Date().toISOString()

  const pendingResult = await upsertStatus(
    db,
    precheck,
    categoryRowCap,
    streamerCategoryRowCap,
    'refresh_pending',
    updatedAt,
  )
  const pendingWrite = summarizeMeta([pendingResult])

  if (unavailableState) {
    const unavailableBatch = await db.batch([
      db.prepare('DELETE FROM history_category_daily WHERE provider = ? AND day = ?').bind(PROVIDER, day),
      db.prepare('DELETE FROM history_category_streamer_daily WHERE provider = ? AND day = ?').bind(PROVIDER, day),
      statusStatement(db, precheck, categoryRowCap, streamerCategoryRowCap, unavailableState, updatedAt),
    ])
    return {
      day,
      startDay,
      precheck,
      coverageState: unavailableState,
      aggregateRowsAuthoritative: false,
      generatedCategoryRows: 0,
      generatedStreamerCategoryRows: 0,
      pendingWrite,
      writeBatch: summarizeMeta(unavailableBatch),
      workerWallMs: round(Date.now() - startedAt, 2),
    }
  }

  const finalCoverage: KickHistoryCategoryCoverageState = precheck.sourceSnapshots >= 240 ? 'observed' : 'partial'
  const batch = await db.batch([
    db.prepare('DELETE FROM history_category_daily WHERE provider = ? AND day = ?').bind(PROVIDER, day),
    db.prepare('DELETE FROM history_category_streamer_daily WHERE provider = ? AND day = ?').bind(PROVIDER, day),
    db.prepare(HISTORY_CATEGORY_INSERT_DAILY_SQL).bind(
      PROVIDER,
      day,
      bucketMinutes,
      PROVIDER,
      day,
      precheck.sourceMode,
      CATEGORY_CONTRACT_VERSION,
      updatedAt,
    ),
    db.prepare(HISTORY_CATEGORY_INSERT_STREAMER_DAILY_SQL).bind(
      PROVIDER,
      day,
      bucketMinutes,
      bucketMinutes,
      PROVIDER,
      day,
      CATEGORY_CONTRACT_VERSION,
      updatedAt,
    ),
    statusStatement(db, precheck, categoryRowCap, streamerCategoryRowCap, finalCoverage, updatedAt),
  ])

  const generatedCategoryRows = metaInteger(batch[2], 'changes')
  const generatedStreamerCategoryRows = metaInteger(batch[3], 'changes')
  if (
    generatedCategoryRows !== precheck.candidateCategoryRows
    || generatedStreamerCategoryRows !== precheck.candidateStreamerCategoryRows
  ) {
    const recoveryBatch = await failCloseGeneratedDay(
      db,
      precheck,
      categoryRowCap,
      streamerCategoryRowCap,
      'unavailable_generation_mismatch',
      new Date().toISOString(),
    )
    return {
      day,
      startDay,
      precheck,
      coverageState: 'unavailable_generation_mismatch',
      aggregateRowsAuthoritative: false,
      generatedCategoryRows: 0,
      generatedStreamerCategoryRows: 0,
      pendingWrite,
      writeBatch: summarizeMeta(batch),
      recoveryBatch,
      workerWallMs: round(Date.now() - startedAt, 2),
    }
  }

  return {
    day,
    startDay,
    precheck,
    coverageState: finalCoverage,
    aggregateRowsAuthoritative: true,
    generatedCategoryRows,
    generatedStreamerCategoryRows,
    pendingWrite,
    writeBatch: summarizeMeta(batch),
    workerWallMs: round(Date.now() - startedAt, 2),
  }
}

export async function cleanupKickHistoryCategoryProbeDay(
  db: D1Database,
  day: string,
): Promise<MetaSummary> {
  const results = await db.batch([
    db.prepare('DELETE FROM history_category_daily WHERE provider = ? AND day = ?').bind(PROVIDER, day),
    db.prepare('DELETE FROM history_category_streamer_daily WHERE provider = ? AND day = ?').bind(PROVIDER, day),
    db.prepare('DELETE FROM history_category_day_status WHERE provider = ? AND day = ?').bind(PROVIDER, day),
  ])
  return summarizeMeta(results)
}

async function cleanupKickHistoryCategoryRetention(db: D1Database): Promise<MetaSummary & { attempted: boolean }> {
  const boundary = `-${HISTORY_CATEGORY_RETENTION_DAYS} days`
  const results = await db.batch([
    db.prepare("DELETE FROM history_category_daily WHERE provider = ? AND day < date('now', ?)").bind(PROVIDER, boundary),
    db.prepare("DELETE FROM history_category_streamer_daily WHERE provider = ? AND day < date('now', ?)").bind(PROVIDER, boundary),
    db.prepare("DELETE FROM history_category_day_status WHERE provider = ? AND day < date('now', ?)").bind(PROVIDER, boundary),
  ])
  return { attempted: true, ...summarizeMeta(results) }
}

function precheckUnavailableState(
  precheck: KickHistoryCategoryPrecheck,
  categoryRowCap: number,
  streamerCategoryRowCap: number,
): Extract<KickHistoryCategoryCoverageState, `unavailable_${string}`> | null {
  if (precheck.sourceSnapshots <= 0 || precheck.validStreamItems <= 0 || precheck.categoryObservedItems <= 0) {
    return 'unavailable_no_category_data'
  }
  if (precheck.categoryMissingItems > 0) return 'unavailable_missing_category'
  if (
    precheck.candidateCategoryRows > categoryRowCap
    || precheck.candidateStreamerCategoryRows > streamerCategoryRowCap
  ) return 'unavailable_overflow'
  return null
}

async function upsertStatus(
  db: D1Database,
  precheck: KickHistoryCategoryPrecheck,
  categoryRowCap: number,
  streamerCategoryRowCap: number,
  coverageState: KickHistoryCategoryCoverageState,
  updatedAt: string,
): Promise<D1Result<unknown>> {
  return await statusStatement(
    db,
    precheck,
    categoryRowCap,
    streamerCategoryRowCap,
    coverageState,
    updatedAt,
  ).run()
}

function statusStatement(
  db: D1Database,
  precheck: KickHistoryCategoryPrecheck,
  categoryRowCap: number,
  streamerCategoryRowCap: number,
  coverageState: KickHistoryCategoryCoverageState,
  updatedAt: string,
): D1PreparedStatement {
  return db.prepare(HISTORY_CATEGORY_STATUS_UPSERT_SQL).bind(
    PROVIDER,
    precheck.day,
    precheck.candidateCategoryRows,
    precheck.candidateStreamerCategoryRows,
    categoryRowCap,
    streamerCategoryRowCap,
    precheck.sourceSnapshots,
    precheck.categoryObservedItems,
    precheck.categoryMissingItems,
    coverageState,
    precheck.sourceMode,
    CATEGORY_CONTRACT_VERSION,
    updatedAt,
  )
}

async function failCloseGeneratedDay(
  db: D1Database,
  precheck: KickHistoryCategoryPrecheck,
  categoryRowCap: number,
  streamerCategoryRowCap: number,
  coverageState: KickHistoryCategoryCoverageState,
  updatedAt: string,
): Promise<MetaSummary> {
  const results = await db.batch([
    db.prepare('DELETE FROM history_category_daily WHERE provider = ? AND day = ?').bind(PROVIDER, precheck.day),
    db.prepare('DELETE FROM history_category_streamer_daily WHERE provider = ? AND day = ?').bind(PROVIDER, precheck.day),
    statusStatement(db, precheck, categoryRowCap, streamerCategoryRowCap, coverageState, updatedAt),
  ])
  return summarizeMeta(results)
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
  days: KickHistoryCategoryDayResult[],
  retention: MetaSummary,
  workerWallMs: number,
): MetaSummary & { workerWallMs: number; maximumNormalStatements: number } {
  const total: MetaSummary & { workerWallMs: number; maximumNormalStatements: number } = {
    statements: retention.statements,
    durationMs: retention.durationMs,
    rowsRead: retention.rowsRead,
    rowsWritten: retention.rowsWritten,
    changes: retention.changes,
    workerWallMs: round(workerWallMs, 2),
    maximumNormalStatements: HISTORY_CATEGORY_MAX_NORMAL_STATEMENTS,
  }
  for (const day of days) {
    for (const part of [day.precheck.meta, day.pendingWrite, day.writeBatch, day.recoveryBatch]) {
      if (!part) continue
      total.statements += part.statements
      total.durationMs += part.durationMs
      total.rowsRead += part.rowsRead
      total.rowsWritten += part.rowsWritten
      total.changes += part.changes
    }
  }
  total.durationMs = round(total.durationMs, 3)
  return total
}

function summarizeMeta(results: Array<{ meta?: unknown }>): MetaSummary {
  const summary: MetaSummary = { statements: results.length, durationMs: 0, rowsRead: 0, rowsWritten: 0, changes: 0 }
  for (const result of results) {
    const meta = (result?.meta ?? {}) as Record<string, unknown>
    summary.durationMs += numeric(meta.duration)
    summary.rowsRead += integer(meta.rows_read)
    summary.rowsWritten += integer(meta.rows_written)
    summary.changes += integer(meta.changes)
  }
  summary.durationMs = round(summary.durationMs, 3)
  return summary
}

function emptyMetaWithAttempt(attempted: boolean): MetaSummary & { attempted: boolean } {
  return { attempted, statements: 0, durationMs: 0, rowsRead: 0, rowsWritten: 0, changes: 0 }
}

function metaInteger(result: D1Result<unknown>, key: string): number {
  const meta = (result.meta ?? {}) as Record<string, unknown>
  return integer(meta[key])
}

function boundedPositiveInteger(value: unknown, fallback: number): number {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback
  return Math.max(1, Math.floor(parsed))
}

function normalizeSourceMode(value: unknown): string {
  const text = typeof value === 'string' ? value.trim() : ''
  return text || 'unknown'
}

function isCalendarDay(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const parsed = new Date(`${value}T00:00:00.000Z`)
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
}

function dayString(value: Date): string {
  return value.toISOString().slice(0, 10)
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
