import type { Env } from '../_db/env'
import { extractKickStreamMapSnapshotItems } from './kick-stream-map-snapshot-source-core.mjs'
import { buildKickStreamMapPublicAdapter } from './kick-stream-map-public-adapter-core.mjs'
import { buildKickStreamMapCountryRuntime } from './kick-stream-map-country-runtime-core.mjs'
import { buildKickStreamMapCityRuntime } from './kick-stream-map-city-runtime-core.mjs'

type SnapshotRow = {
  bucket_minute: string
  collected_at: string
  payload_json: string
  source_mode: string
}

type GeographyMode = 'country' | 'city'

const K4_PUBLIC_ACTIVATION_AUTHORIZED = true
const KICK_CITY_PUBLIC_ACTIVATION_AUTHORIZED = true

export const onRequestGet: PagesFunction<Env> = async ({ env, request }) => {
  let geographyMode: GeographyMode = 'country'

  try {
    const url = new URL(request.url)
    const normalizedGeography = normalizeGeographyMode(url.searchParams.get('geography'))
    if (!normalizedGeography.ok) {
      return Response.json({
        version: 'viewloom-kick-stream-map-geography-error-v0.1',
        platform: 'kick',
        provider: 'kick',
        source: 'real',
        geographyMode: 'country',
        state: 'error',
        mappedStreams: [],
        unmappedStreams: [],
        excludedStreams: [],
        conflictStreams: [],
        error: {
          code: 'invalid_geography_mode',
          message: 'geography must be country or city',
        },
      }, {
        status: 400,
        headers: { 'cache-control': 'no-store' },
      })
    }
    geographyMode = normalizedGeography.value

    if (!env.DB_KICK_HOT) {
      const unavailable = geographyMode === 'city'
        ? buildKickStreamMapCityRuntime({ publicCityActivationAuthorized: KICK_CITY_PUBLIC_ACTIVATION_AUTHORIZED })
        : buildKickStreamMapPublicAdapter({ publicActivationAuthorized: K4_PUBLIC_ACTIVATION_AUTHORIZED })
      return Response.json({
        ...unavailable,
        geographyMode,
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

    const latest = await env.DB_KICK_HOT.prepare(`
      SELECT bucket_minute, collected_at, payload_json, source_mode
      FROM minute_snapshots
      WHERE provider = ?
      ORDER BY bucket_minute DESC
      LIMIT 1
    `).bind('kick').first<SnapshotRow>()

    if (!latest) {
      const empty = geographyMode === 'city'
        ? buildKickStreamMapCityRuntime({
            snapshotItems: [],
            updatedAt: null,
            sourceMode: 'missing',
            publicCityActivationAuthorized: KICK_CITY_PUBLIC_ACTIVATION_AUTHORIZED,
          })
        : buildKickStreamMapCountryRuntime({
            snapshotItems: [],
            updatedAt: null,
            sourceMode: 'missing',
            publicActivationAuthorized: K4_PUBLIC_ACTIVATION_AUTHORIZED,
          })
      return Response.json(empty, {
        headers: { 'cache-control': 'no-store' },
      })
    }

    const snapshotItems = extractKickStreamMapSnapshotItems(latest.payload_json)
    const response = geographyMode === 'city'
      ? buildKickStreamMapCityRuntime({
          snapshotItems,
          updatedAt: latest.collected_at || latest.bucket_minute,
          sourceMode: latest.source_mode,
          publicCityActivationAuthorized: KICK_CITY_PUBLIC_ACTIVATION_AUTHORIZED,
        })
      : buildKickStreamMapCountryRuntime({
          snapshotItems,
          updatedAt: latest.collected_at || latest.bucket_minute,
          sourceMode: latest.source_mode,
          publicActivationAuthorized: K4_PUBLIC_ACTIVATION_AUTHORIZED,
        })

    return Response.json(response, {
      headers: { 'cache-control': 'no-store' },
    })
  } catch (error) {
    const fallback = geographyMode === 'city'
      ? buildKickStreamMapCityRuntime({ publicCityActivationAuthorized: KICK_CITY_PUBLIC_ACTIVATION_AUTHORIZED })
      : buildKickStreamMapPublicAdapter({ publicActivationAuthorized: K4_PUBLIC_ACTIVATION_AUTHORIZED })
    return Response.json({
      ...fallback,
      geographyMode,
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

function normalizeGeographyMode(value: string | null): { ok: true; value: GeographyMode } | { ok: false } {
  const normalized = String(value ?? '').trim().toLowerCase()
  if (!normalized || normalized === 'country') return { ok: true, value: 'country' }
  if (normalized === 'city') return { ok: true, value: 'city' }
  return { ok: false }
}

function sanitizeError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error)
  return message.replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [redacted]').slice(0, 180)
}
