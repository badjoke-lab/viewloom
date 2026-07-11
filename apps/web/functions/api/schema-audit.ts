import type { Env } from '../_db/env'

type Provider = 'twitch' | 'kick'
type SchemaRow = {
  type: string
  name: string
  sql: string | null
}

type ExpectedObject = {
  type: 'table' | 'index'
  name: string
  fragments: string[]
}

const EXPECTED_OBJECTS: ExpectedObject[] = [
  {
    type: 'table',
    name: 'streamer_intraday_rollups',
    fragments: [
      'provider text not null',
      'day text not null',
      'streamer_id text not null',
      "hourly_json text not null default '[]'",
      "contract_version text not null default 'analytics-source-v1'",
      'primary key (provider, day, streamer_id)',
    ],
  },
  {
    type: 'index',
    name: 'idx_intraday_streamer_day',
    fragments: [
      'on streamer_intraday_rollups (provider, streamer_id, day)',
    ],
  },
  {
    type: 'table',
    name: 'intraday_rollup_status',
    fragments: [
      'provider text not null',
      'day text not null',
      'candidate_streamers integer not null',
      'retained_streamers integer not null',
      'retained_streamer_cap integer not null',
      'primary key (provider, day)',
    ],
  },
]

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const [twitch, kick] = await Promise.all([
    audit('twitch', env.DB_TWITCH_HOT),
    audit('kick', env.DB_KICK_HOT),
  ])

  return Response.json({
    ok: true,
    source: 'api',
    generatedAt: new Date().toISOString(),
    mode: 'read-only-schema-probe',
    expectedObjectCount: EXPECTED_OBJECTS.length,
    providers: [twitch, kick],
  }, { headers: { 'cache-control': 'no-store' } })
}

async function audit(provider: Provider, db: D1Database) {
  const names = EXPECTED_OBJECTS.map((object) => object.name)
  const result = await db.prepare(`
    SELECT type, name, sql
    FROM sqlite_master
    WHERE name IN (?, ?, ?)
    ORDER BY type, name
  `).bind(...names).run<SchemaRow>()

  const byName = new Map((result.results ?? []).map((row) => [row.name, row]))
  const objects = EXPECTED_OBJECTS.map((expected) => {
    const observed = byName.get(expected.name)
    const normalizedSql = normalizeSql(observed?.sql)
    const definitionMatches = Boolean(
      observed
      && observed.type === expected.type
      && expected.fragments.every((fragment) => normalizedSql.includes(normalizeSql(fragment))),
    )

    return {
      type: expected.type,
      name: expected.name,
      present: Boolean(observed),
      observedType: observed?.type ?? null,
      definitionMatches,
    }
  })

  return {
    provider,
    schemaComplete: objects.every((object) => object.present && object.definitionMatches),
    observedObjectCount: objects.filter((object) => object.present).length,
    expectedObjectCount: EXPECTED_OBJECTS.length,
    objects,
    auditQuery: {
      rowsRead: num(result.meta?.rows_read),
      rowsWritten: num(result.meta?.rows_written),
      sqlDurationMs: roundMs(result.meta?.timings?.sql_duration_ms ?? result.meta?.duration),
      databaseSizeBytes: num(result.meta?.size_after),
    },
  }
}

function normalizeSql(value: unknown): string {
  if (typeof value !== 'string') return ''
  return value
    .toLowerCase()
    .replace(/["`\[\]]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*,\s*/g, ', ')
    .replace(/\(\s+/g, '(')
    .replace(/\s+\)/g, ')')
    .trim()
}

function num(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

function roundMs(value: unknown): number {
  const parsed = num(value)
  return Math.round(parsed * 1000) / 1000
}
