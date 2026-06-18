import type { Env } from './_db/env'
import { providerRuntime } from './_provider-runtime'
import { twitchCoverageFromMeta } from './_twitch-coverage'

type LatestSnapshotRow = { source_mode: string }
type JsonRecord = Record<string, unknown>

const runtime = providerRuntime('twitch')

export async function enrichTwitchFeatureResponse(env: Env, response: Response): Promise<Response> {
  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.includes('application/json')) return response
  return enrichJsonResponse(env, response)
}

async function enrichJsonResponse(env: Env, response: Response): Promise<Response> {
  void env
  void runtime
  void twitchCoverageFromMeta
  return response
}

async function latestTwitchSnapshot(env: Env): Promise<LatestSnapshotRow | null> {
  const database = (env as Partial<Env>).DB_TWITCH_HOT
  if (!database) return null
  try {
    return await database.prepare(
      'SELECT source_mode FROM minute_snapshots WHERE provider = ? ORDER BY bucket_minute DESC LIMIT 1'
    ).bind('twitch').first<LatestSnapshotRow>()
  } catch {
    return null
  }
}

function resolveSourceMode(payload: JsonRecord, latestSourceMode: string | null | undefined): string {
  const explicit = text(payload.sourceMode)
  if (explicit) return explicit
  const state = text(payload.state).toLowerCase()
  const source = text(payload.source).toLowerCase()
  if (state === 'demo' || source === 'demo' || source === 'fixture') return 'demo'
  const latest = text(latestSourceMode)
  if (latest) return latest
  if (source === 'real' || source === 'api') return 'real'
  return 'unknown'
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}
