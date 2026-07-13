import { CATEGORY_CONTRACT_VERSION } from './category-capture'
import {
  CATEGORY_PRECHECK_SQL,
  CATEGORY_STATUS_UPSERT_SQL,
  CATEGORY_UPSERT_STREAMER_ROLLUPS_SQL,
} from './category-intraday-sql'
import type {
  IntradayGenerationConfig,
  IntradayProvider,
} from './intraday-rollup'
import { shouldRunIntradayGeneration } from './intraday-rollup'

type PrecheckRow = {
  source_snapshots: number
  candidate_streamers: number
  category_observed_items: number
  category_missing_items: number
  source_mode: string
}

type MetaSummary = {
  statements: number
  durationMs: number
  rowsRead: number
  rowsWritten: number
  changes: number
}

type CategoryCoverageState = 'observed' | 'missing_from_source' | 'unavailable'

type CategoryDayResult = {
  day: string
  sourceSnapshots: number
  candidateStreamers: number
  retainedStreamers: number
  selectionState: 'complete_within_daily_cap' | 'capped_at_daily_limit'
  coverageState: 'good' | 'partial' | 'poor'
  categoryCoverageState: CategoryCoverageState
  categoryObservedItems: number
  categoryMissingItems: number
  sourceMode: string
  precheck: MetaSummary
  writeBatch: MetaSummary
  workerWallMs: number
}

export type CategoryIntradayGenerationResult = {
  provider: IntradayProvider
  enabled: true
  attempted: boolean
  maintenanceWindow: boolean
  reason?: 'outside_maintenance_window'
  categoryContractVersion: typeof CATEGORY_CONTRACT_VERSION
  days?: CategoryDayResult[]
  retentionCleanup?: MetaSummary & { attempted: boolean }
  totals?: MetaSummary & {
    sourceSnapshots: number
    candidateStreamers: number
    retainedStreamers: number
    categoryObservedItems: number
    categoryMissingItems: number
    workerWallMs: number
    maximumQueries: number
  }
  error?: string
}

const ANALYTICS_CONTRACT_VERSION = 'analytics-source-v1'
const INTRADAY_RETENTION_DAYS = 90
const MAX_GENERATOR_QUERIES = 12

export async function maybeGenerateCategoryIntradayRollups(
  db: D1Database,
  config: IntradayGenerationConfig,
  now = new Date(),
): Promise<CategoryIntradayGenerationResult> {
  if (!shouldRunIntradayGeneration(now)) {
    return {
      provider: config.provider,
      enabled: true,
      attempted: false,
      maintenanceWindow: false,
      reason: 'outside_maintenance_window',
      categoryContractVersion: CATEGORY_CONTRACT_VERSION,
    }
  }

  const startedAt = Date.now()
  const days: CategoryDayResult[] = []

  try {
    for (const day of targetDays(now)) {
      const result = await refreshCategoryIntradayDay(db, config, day)
      if (result) days.push(result)
    }

    const retentionCleanup = shouldRunIntradayRetentionCleanup(now)
      ? await cleanupIntradayRetention(db, config.provider)
      : { attempted: false, statements: 0, durationMs: 0, rowsRead: 0, rowsWritten: 0, changes: 0 }
    const totals = summarizeDayResults(days, retentionCleanup, Date.now() - startedAt)

    return {
      provider: config.provider,
      enabled: true,
      attempted: true,
      maintenanceWindow: true,
      categoryContractVersion: CATEGORY_CONTRACT_VERSION,
      days,
      retentionCleanup,
      totals: {
        ...totals,
        maximumQueries: MAX_GENERATOR_QUERIES,
      },
    }
  } catch (error) {
    return {
      provider: config.provider,
      enabled: true,
      attempted: true,
      maintenanceWindow: true,
      categoryContractVersion: CATEGORY_CONTRACT_VERSION,
      days,
      error: sanitizeError(error),
    }
  }
}

async function refreshCategoryIntradayDay(
  db: D1Database,
  config: IntradayGenerationConfig,
  day: string,
): Promise<CategoryDayResult | null> {
  const startedAt = Date.now()
  const precheckResult = await db.prepare(CATEGORY_PRECHECK_SQL)
    .bind(config.provider, day)
    .all<PrecheckRow>()
  const precheck = summarizeMeta([precheckResult])
  const row = precheckResult.results?.[0]
  const sourceSnapshots = integer(row?.source_snapshots)
  if (sourceSnapshots <= 0) return null

  const candidateStreamers = integer(row?.candidate_streamers)
  const retainedStreamers = Math.min(candidateStreamers, config.streamerCap)
  const categoryObservedItems = integer(row?.category_observed_items)
  const categoryMissingItems = integer(row?.category_missing_items)
  const categoryCoverageState: CategoryCoverageState = categoryObservedItems <= 0 && categoryMissingItems <= 0
    ? 'unavailable'
    : categoryMissingItems > 0
      ? 'missing_from_source'
      : 'observed'
  const selectionState = candidateStreamers > config.streamerCap
    ? 'capped_at_daily_limit'
    : 'complete_within_daily_cap'
  const coverageState = sourceSnapshots >= 240
    ? 'good'
    : sourceSnapshots >= 60
      ? 'partial'
      : 'poor'
  const sourceMode = normalizeSourceMode(row?.source_mode)
  const updatedAt = new Date().toISOString()

  const writeResults = await db.batch([
    db.prepare(`
      UPDATE streamer_intraday_rollups
      SET selection_state = 'refresh_pending'
      WHERE provider = ? AND day = ?
    `).bind(config.provider, day),
    db.prepare(CATEGORY_UPSERT_STREAMER_ROLLUPS_SQL).bind(
      config.provider,
      day,
      config.bucketMinutes,
      config.bucketMinutes,
      config.streamerCap,
      config.bucketMinutes,
      config.bucketMinutes,
      config.provider,
      config.provider,
      day,
      CATEGORY_CONTRACT_VERSION,
      selectionState,
      sourceMode,
      ANALYTICS_CONTRACT_VERSION,
      updatedAt,
    ),
    db.prepare(`
      DELETE FROM streamer_intraday_rollups
      WHERE provider = ? AND day = ? AND selection_state = 'refresh_pending'
    `).bind(config.provider, day),
    db.prepare(CATEGORY_STATUS_UPSERT_SQL).bind(
      config.provider,
      day,
      candidateStreamers,
      retainedStreamers,
      config.streamerCap,
      sourceSnapshots,
      selectionState,
      coverageState,
      sourceMode,
      ANALYTICS_CONTRACT_VERSION,
      updatedAt,
      config.provider,
      day,
    ),
  ])

  return {
    day,
    sourceSnapshots,
    candidateStreamers,
    retainedStreamers,
    selectionState,
    coverageState,
    categoryCoverageState,
    categoryObservedItems,
    categoryMissingItems,
    sourceMode,
    precheck,
    writeBatch: summarizeMeta(writeResults),
    workerWallMs: round(Date.now() - startedAt, 2),
  }
}

async function cleanupIntradayRetention(
  db: D1Database,
  provider: IntradayProvider,
): Promise<MetaSummary & { attempted: boolean }> {
  const results = await db.batch([
    db.prepare(`
      DELETE FROM streamer_intraday_rollups
      WHERE provider = ? AND day < date('now', ?)
    `).bind(provider, `-${INTRADAY_RETENTION_DAYS} days`),
    db.prepare(`
      DELETE FROM intraday_rollup_status
      WHERE provider = ? AND day < date('now', ?)
    `).bind(provider, `-${INTRADAY_RETENTION_DAYS} days`),
  ])
  return { attempted: true, ...summarizeMeta(results) }
}

function shouldRunIntradayRetentionCleanup(now: Date): boolean {
  return now.getUTCHours() === 0 && now.getUTCMinutes() >= 20 && now.getUTCMinutes() < 25
}

function targetDays(now: Date): [string, string] {
  const today = dayString(now)
  const yesterdayDate = new Date(now)
  yesterdayDate.setUTCDate(yesterdayDate.getUTCDate() - 1)
  return [today, dayString(yesterdayDate)]
}

function summarizeDayResults(
  days: CategoryDayResult[],
  retention: MetaSummary,
  workerWallMs: number,
): MetaSummary & {
  sourceSnapshots: number
  candidateStreamers: number
  retainedStreamers: number
  categoryObservedItems: number
  categoryMissingItems: number
  workerWallMs: number
} {
  const summary = {
    statements: retention.statements,
    durationMs: retention.durationMs,
    rowsRead: retention.rowsRead,
    rowsWritten: retention.rowsWritten,
    changes: retention.changes,
    sourceSnapshots: 0,
    candidateStreamers: 0,
    retainedStreamers: 0,
    categoryObservedItems: 0,
    categoryMissingItems: 0,
    workerWallMs: round(workerWallMs, 2),
  }

  for (const day of days) {
    summary.statements += day.precheck.statements + day.writeBatch.statements
    summary.durationMs += day.precheck.durationMs + day.writeBatch.durationMs
    summary.rowsRead += day.precheck.rowsRead + day.writeBatch.rowsRead
    summary.rowsWritten += day.precheck.rowsWritten + day.writeBatch.rowsWritten
    summary.changes += day.precheck.changes + day.writeBatch.changes
    summary.sourceSnapshots += day.sourceSnapshots
    summary.candidateStreamers += day.candidateStreamers
    summary.retainedStreamers += day.retainedStreamers
    summary.categoryObservedItems += day.categoryObservedItems
    summary.categoryMissingItems += day.categoryMissingItems
  }

  summary.durationMs = round(summary.durationMs, 3)
  return summary
}

function summarizeMeta(results: Array<{ meta?: unknown }>): MetaSummary {
  const summary = { statements: results.length, durationMs: 0, rowsRead: 0, rowsWritten: 0, changes: 0 }
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

function dayString(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function normalizeSourceMode(value: unknown): string {
  const text = typeof value === 'string' ? value.trim() : ''
  return text || 'unknown'
}

function sanitizeError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error)
  return message
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [redacted]')
    .slice(0, 240)
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
