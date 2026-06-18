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
  try {
    const payload = await response.clone().json<JsonRecord>()
    const latest = await latestTwitchSnapshot(env)
    const sourceMode = resolveSourceMode(payload, latest?.source_mode)
    const coverage = twitchCoverageFromMeta({
      coverageMode: payload.coverageMode,
      targetSource: payload.targetSource,
      sourceMode: payload.sourceMode,
    }, sourceMode)
    const currentNotes = Array.isArray(payload.notes)
      ? payload.notes.filter((item): item is string => typeof item === 'string')
      : []
    const notes = currentNotes.includes(coverage.publicNote)
      ? currentNotes
      : [...currentNotes, coverage.publicNote]
    const enriched = {
      ...payload,
      provider: text(payload.provider) || 'twitch',
      platform: text(payload.platform) || 'twitch',
      coverageMode: text(payload.coverageMode) || coverage.mode,
      targetSource: text(payload.targetSource) || coverage.targetSource,
      sourceMode: coverage.sourceMode,
      coverageModel: {
        mode: coverage.mode,
        targetSource: coverage.targetSource,
        sourceMode: coverage.sourceMode,
        authMode: coverage.authMode,
        label: coverage.label,
        isDirectoryCoverage: coverage.isDirectoryCoverage,
        isProviderWide: coverage.isProviderWide,
        isBounded: coverage.isBounded,
        description: coverage.description,
        limitation: coverage.limitation,
        sourceLimitation: coverage.sourceLimitation,
        topLimit: runtime.topLimit,
        collectionCadenceSeconds: runtime.collectionCadenceSeconds,
      },
      notes,
    }
    const headers = new Headers(response.headers)
    headers.delete('content-length')
    headers.set('cache-control', 'no-store')
    return Response.json(enriched, {
      status: response.status,
      statusText: response.statusText,
      headers,
    })
  } catch {
    return response
  }
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
  const payloadLatest = object(payload.latest)
  const embedded = text(payloadLatest?.source_mode ?? payloadLatest?.sourceMode)
  if (embedded) return embedded
  if (source === 'real') return 'real'
  const latest = text(latestSourceMode)
  if (latest) return latest
  if (source === 'api') return 'real'
  return 'unknown'
}

function object(value: unknown): JsonRecord | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value as JsonRecord
    : null
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}
