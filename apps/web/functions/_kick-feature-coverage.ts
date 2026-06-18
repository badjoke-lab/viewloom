import type { Env } from './_db/env'
import { kickCoverageFromMeta, kickCoverageFromPayload } from './_kick-coverage'
import { providerRuntime } from './_provider-runtime'

type LatestSnapshotRow = { payload_json: string; source_mode: string }
type JsonRecord = Record<string, unknown>

const runtime = providerRuntime('kick')

export async function enrichKickFeatureResponse(env: Env, response: Response): Promise<Response> {
  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.includes('application/json')) return response

  try {
    const payload = await response.clone().json<JsonRecord>()
    const latest = await env.DB_KICK_HOT.prepare(
      'SELECT payload_json,source_mode FROM minute_snapshots WHERE provider = ? ORDER BY bucket_minute DESC LIMIT 1'
    ).bind('kick').first<LatestSnapshotRow>()

    const coverage = latest
      ? kickCoverageFromPayload(latest.payload_json, latest.source_mode)
      : kickCoverageFromMeta({
          coverageMode: payload.coverageMode,
          targetSource: payload.targetSource,
          sourceMode: payload.sourceMode,
        }, text(payload.sourceMode))

    const currentCoverage = object(payload.coverage) ?? {}
    const currentNotes = Array.isArray(payload.notes)
      ? payload.notes.filter((item): item is string => typeof item === 'string')
      : []
    const notes = currentNotes.includes(coverage.publicNote)
      ? currentNotes
      : [...currentNotes, coverage.publicNote]

    const enriched = {
      ...payload,
      coverageMode: text(payload.coverageMode) || coverage.mode,
      targetSource: text(payload.targetSource) || coverage.targetSource,
      sourceMode: text(payload.sourceMode) || coverage.sourceMode,
      coverage: {
        ...currentCoverage,
        mode: coverage.mode,
        topLimit: runtime.topLimit,
        isProviderWide: false,
        isBounded: true,
        note: coverage.publicNote,
      },
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

function object(value: unknown): JsonRecord | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value as JsonRecord
    : null
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}
