import type { Env } from '../_db/env'
import { extractKickStreamMapSnapshotItems } from './kick-stream-map-snapshot-source-core.mjs'
import { buildKickStreamMapPublicAdapter } from './kick-stream-map-public-adapter-core.mjs'
import { buildKickStreamMapCountryRuntime } from './kick-stream-map-country-runtime-core.mjs'

type SnapshotRow = {
  bucket_minute: string
  collected_at: string
  payload_json: string
  source_mode: string
}

const K4_PUBLIC_ACTIVATION_AUTHORIZED = true

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  if (!env.DB_KICK_HOT) {
    return Response.json({
      ...buildKickStreamMapPublicAdapter({ publicActivationAuthorized: K4_PUBLIC_ACTIVATION_AUTHORIZED }),
      state: 'not_ready',
      error: {
        code: 'kick_hot_binding_unavailable',
        message: 'DB_KICK_HOT is not configured.',
      },
    }, {
      status: 503,
      headers: { 'cache-control': 'no-store' },
    })
  }

  try {
    const latest = await env.DB_KICK_HOT.prepare(`
      SELECT bucket_minute, collected_at, payload_json, source_mode
      FROM minute_snapshots
      WHERE provider = ?
      ORDER BY bucket_minute DESC
      LIMIT 1
    `).bind('kick').first<SnapshotRow>()

    if (!latest) {
      return Response.json(buildKickStreamMapCountryRuntime({
        snapshotItems: [],
        updatedAt: null,
        sourceMode: 'missing',
        publicActivationAuthorized: K4_PUBLIC_ACTIVATION_AUTHORIZED,
      }), {
        headers: { 'cache-control': 'no-store' },
      })
    }

    const snapshotItems = extractKickStreamMapSnapshotItems(latest.payload_json)
    return Response.json(buildKickStreamMapCountryRuntime({
      snapshotItems,
      updatedAt: latest.collected_at || latest.bucket_minute,
      sourceMode: latest.source_mode,
      publicActivationAuthorized: K4_PUBLIC_ACTIVATION_AUTHORIZED,
    }), {
      headers: { 'cache-control': 'no-store' },
    })
  } catch (error) {
    return Response.json({
      ...buildKickStreamMapPublicAdapter({ publicActivationAuthorized: K4_PUBLIC_ACTIVATION_AUTHORIZED }),
      state: 'error',
      error: {
        code: 'kick_stream_map_unavailable',
        message: sanitizeError(error),
      },
    }, {
      status: 500,
      headers: { 'cache-control': 'no-store' },
    })
  }
}

function sanitizeError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error)
  return message.replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [redacted]').slice(0, 180)
}
