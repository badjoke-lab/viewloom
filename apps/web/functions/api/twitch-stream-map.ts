import type { Env } from '../_db/env'
import { providerRuntime } from '../_provider-runtime'
import { buildTwitchStreamMapLiveModel } from './twitch-stream-map-core.mjs'
import { TWITCH_REVIEWED_LOCATION_RECORDS } from './twitch-stream-map-reviewed-evidence.mjs'

type SnapshotRow = {
  bucket_minute: string
  collected_at: string
  stream_count: number
  total_viewers: number
  payload_json: string
  source_mode: string
}

type CoverageRow = {
  covered_pages: number | null
  has_more: number | null
}

const runtime = providerRuntime('twitch')

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  try {
    const latest = await env.DB_TWITCH_HOT.prepare(`
      SELECT bucket_minute,collected_at,stream_count,total_viewers,payload_json,source_mode
      FROM minute_snapshots
      WHERE provider = 'twitch'
      ORDER BY bucket_minute DESC
      LIMIT 1
    `).first<SnapshotRow>()

    if (!latest) {
      return Response.json({
        version: 'viewloom-stream-map-live-v1',
        platform: 'twitch',
        source: 'real',
        state: 'empty',
        updatedAt: null,
        coverage: null,
        mappedStreams: [],
        excludedNonPersonStreams: [],
        semantics: mapSemantics(),
      }, { headers: { 'cache-control': 'no-store' } })
    }

    let coverage: CoverageRow | null = null
    try {
      coverage = await env.DB_TWITCH_HOT.prepare(`
        SELECT covered_pages,has_more
        FROM minute_snapshots
        WHERE provider = 'twitch'
        ORDER BY bucket_minute DESC
        LIMIT 1
      `).first<CoverageRow>()
    } catch {
      coverage = null
    }

    const model = buildTwitchStreamMapLiveModel({
      snapshot: {
        bucketMinute: latest.bucket_minute,
        collectedAt: latest.collected_at,
        streamCount: latest.stream_count,
        totalViewers: latest.total_viewers,
        payloadJson: latest.payload_json,
        sourceMode: latest.source_mode,
        coveredPages: coverage?.covered_pages ?? null,
        hasMore: Boolean(coverage?.has_more),
      },
      evidenceRecords: TWITCH_REVIEWED_LOCATION_RECORDS,
      topLimit: runtime.topLimit,
    })

    return Response.json({ ...model, state: 'ready' }, {
      headers: { 'cache-control': 'no-store' },
    })
  } catch (error) {
    return Response.json({
      version: 'viewloom-stream-map-live-v1',
      platform: 'twitch',
      source: 'real',
      state: 'error',
      updatedAt: null,
      coverage: null,
      mappedStreams: [],
      excludedNonPersonStreams: [],
      semantics: mapSemantics(),
      error: {
        code: 'twitch_stream_map_unavailable',
        message: sanitizeError(error),
      },
    }, {
      status: 500,
      headers: { 'cache-control': 'no-store' },
    })
  }
}

function mapSemantics() {
  return {
    languageUsedForPlacement: false,
    candidateOnlyPlacementAllowed: false,
    nonPersonPlacementAllowed: false,
    conflictingAcceptedCountriesAreMapped: false,
    mappedPlusUnmappedEqualsObserved: true,
    excludedNonPersonIsSubsetOfUnmapped: true,
    evidenceSourcesRemainDistinct: true,
  } as const
}

function sanitizeError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error)
  return message.replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [redacted]').slice(0, 180)
}
