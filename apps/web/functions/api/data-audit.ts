import type { Env } from '../_db/env'

type Provider = 'twitch' | 'kick'
type Row = {
  rows: number
  rows_24h: number
  oldest: string | null
  latest: string | null
  avg_payload_bytes: number | null
  max_payload_bytes: number | null
  payload_mb: number | null
}

const EXPECTED_ROWS_PER_DAY = 288

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const twitch = await audit('twitch', env.DB_TWITCH_HOT, 30)
  const kick = await audit('kick', env.DB_KICK_HOT, 60)

  return Response.json({
    ok: true,
    source: 'api',
    generatedAt: new Date().toISOString(),
    mode: 'free-strong',
    databaseSizeEvidence: 'd1_result_meta_size_after',
    providers: [twitch, kick],
  }, { headers: { 'cache-control': 'no-store' } })
}

async function audit(provider: Provider, db: D1Database, rawRetentionDays: number) {
  const result = await db.prepare(`
    SELECT
      COUNT(*) AS rows,
      SUM(CASE WHEN unixepoch(bucket_minute) >= unixepoch('now', '-24 hours') THEN 1 ELSE 0 END) AS rows_24h,
      MIN(bucket_minute) AS oldest,
      MAX(bucket_minute) AS latest,
      AVG(LENGTH(payload_json)) AS avg_payload_bytes,
      MAX(LENGTH(payload_json)) AS max_payload_bytes,
      ROUND(SUM(LENGTH(payload_json)) / 1024.0 / 1024.0, 2) AS payload_mb
    FROM minute_snapshots
    WHERE provider = ?
  `).bind(provider).run<Row>()

  const row = result.results?.[0]
  const rows24h = num(row?.rows_24h)
  const avgPayloadBytes = num(row?.avg_payload_bytes)
  const payloadMbPerDay = roundMb((avgPayloadBytes * (rows24h || EXPECTED_ROWS_PER_DAY)) / 1024 / 1024)
  const databaseSizeBytes = num(result.meta?.size_after)

  return {
    provider,
    rawRetentionDays,
    rollupRetentionDays: 180,
    rows: num(row?.rows),
    rows24h,
    expectedRows24h: EXPECTED_ROWS_PER_DAY,
    cadenceOk: rows24h === EXPECTED_ROWS_PER_DAY,
    oldest: text(row?.oldest),
    latest: text(row?.latest),
    avgPayloadBytes: Math.round(avgPayloadBytes),
    maxPayloadBytes: Math.round(num(row?.max_payload_bytes)),
    payloadMb: num(row?.payload_mb),
    estimatedPayloadMbPerDay: payloadMbPerDay,
    estimatedPayloadMbAtRetention: roundMb(payloadMbPerDay * rawRetentionDays),
    estimatedPayloadMbAt90Days: roundMb(payloadMbPerDay * 90),
    databaseSizeBytes,
    databaseSizeMb: roundMb(databaseSizeBytes / 1024 / 1024),
    databaseSizeEvidence: 'd1_result_meta_size_after',
    auditQuery: {
      rowsRead: num(result.meta?.rows_read),
      rowsWritten: num(result.meta?.rows_written),
      sqlDurationMs: roundMs(result.meta?.timings?.sql_duration_ms ?? result.meta?.duration),
    },
  }
}

function num(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

function text(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function roundMb(value: number): number {
  return Number.isFinite(value) ? Math.round(value * 100) / 100 : 0
}

function roundMs(value: unknown): number {
  const parsed = num(value)
  return Math.round(parsed * 1000) / 1000
}
