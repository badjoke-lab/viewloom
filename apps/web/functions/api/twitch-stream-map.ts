import type { Env } from '../_db/env'
import { providerRuntime } from '../_provider-runtime'
import { buildTwitchStreamMapLiveModel } from './twitch-stream-map-core.mjs'
import {
  normalizeTwitchStreamMapPopulationQuery,
  selectTwitchStreamMapPopulation,
  twitchStreamMapPopulationNeedsCategoryDictionary,
} from './twitch-stream-map-population-core.mjs'
import {
  projectTwitchStreamMapCityContract,
  projectTwitchStreamMapCountryOnly,
} from './twitch-stream-map-public-core.mjs'
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

type CategoryRow = {
  category_id: string
  category_name: string
}

type GeographyMode = 'country' | 'city'

const runtime = providerRuntime('twitch')

export const onRequestGet: PagesFunction<Env> = async ({ env, request }) => {
  let geographyMode: GeographyMode = 'country'
  try {
    const url = new URL(request.url)
    const normalizedGeography = normalizeGeographyMode(url.searchParams.get('geography'))
    if (!normalizedGeography.ok) {
      return Response.json({
        version: 'viewloom-stream-map-live-v1',
        platform: 'twitch',
        source: 'real',
        state: 'error',
        updatedAt: null,
        coverage: null,
        populationFilter: null,
        mappedStreams: [],
        excludedNonPersonStreams: [],
        semantics: mapSemantics(),
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

    const populationQuery = normalizeTwitchStreamMapPopulationQuery({
      top: url.searchParams.get('top'),
      minViewers: url.searchParams.get('min_viewers'),
      category: url.searchParams.get('category'),
    })

    const latest = await env.DB_TWITCH_HOT.prepare(`
      SELECT bucket_minute,collected_at,stream_count,total_viewers,payload_json,source_mode
      FROM minute_snapshots
      WHERE provider = 'twitch'
      ORDER BY bucket_minute DESC
      LIMIT 1
    `).first<SnapshotRow>()

    if (!latest) {
      const emptyModel = {
        version: 'viewloom-stream-map-live-v1' as const,
        platform: 'twitch' as const,
        source: 'real' as const,
        sourceMode: 'missing',
        updatedAt: null,
        coverage: {
          topLimit: populationQuery.selectedTop,
          observedStreams: 0,
          observedViewers: 0,
          payloadStreams: 0,
          missingPayloadStreams: 0,
          mappedStreams: 0,
          unmappedStreams: 0,
          eligibleUnmappedStreams: 0,
          excludedNonPersonStreams: 0,
          mappedPercent: 0,
          mappedViewers: 0,
          unmappedViewers: 0,
          excludedNonPersonViewers: 0,
          mappedViewerPercent: 0,
          mappedCountryCount: 0,
          currentLocationStreams: 0,
          currentLocationPercent: 0,
          coveredPages: null,
          hasMore: false,
          mappedBySource: {},
          unmappedReasons: {},
        },
        mappedStreams: [],
        excludedNonPersonStreams: [],
        semantics: {
          languageUsedForPlacement: false as const,
          candidateOnlyPlacementAllowed: false as const,
          nonPersonPlacementAllowed: false as const,
          conflictingAcceptedCountriesAreMapped: false as const,
          mappedPlusUnmappedEqualsObserved: true as const,
          excludedNonPersonIsSubsetOfUnmapped: true as const,
          evidenceSourcesRemainDistinct: true as const,
        },
      }
      const publicModel = geographyMode === 'city'
        ? projectTwitchStreamMapCityContract(emptyModel)
        : projectTwitchStreamMapCountryOnly(emptyModel)
      return Response.json({
        ...publicModel,
        populationFilter: populationQuery,
        semantics: { ...publicModel.semantics, ...mapSemantics() },
        state: 'empty',
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

    const categoryNames = new Map<string, string>()
    if (twitchStreamMapPopulationNeedsCategoryDictionary(latest.payload_json)) {
      try {
        const dictionary = await env.DB_TWITCH_HOT.prepare(`
          SELECT category_id,category_name
          FROM provider_category_dictionary
          WHERE provider = 'twitch'
          ORDER BY category_id
        `).all<CategoryRow>()
        for (const row of dictionary.results ?? []) {
          const id = String(row.category_id ?? '').trim()
          const name = String(row.category_name ?? '').trim()
          if (id && name) categoryNames.set(id, name)
        }
      } catch {
        // The population core reports dictionary misses as partial coverage.
      }
    }

    const population = selectTwitchStreamMapPopulation({
      payloadJson: latest.payload_json,
      top: populationQuery.selectedTop,
      minViewers: populationQuery.minViewers,
      category: populationQuery.selectedCategory,
      categoryNames,
    })

    const model = buildTwitchStreamMapLiveModel({
      snapshot: {
        bucketMinute: latest.bucket_minute,
        collectedAt: latest.collected_at,
        streamCount: population.streamCount,
        totalViewers: population.totalViewers,
        payloadJson: population.payloadJson,
        sourceMode: latest.source_mode,
        coveredPages: coverage?.covered_pages ?? null,
        hasMore: Boolean(coverage?.has_more),
      },
      evidenceRecords: TWITCH_REVIEWED_LOCATION_RECORDS,
      topLimit: population.metadata.selectedTop,
    })
    const publicModel = geographyMode === 'city'
      ? projectTwitchStreamMapCityContract(model)
      : projectTwitchStreamMapCountryOnly(model)

    return Response.json({
      ...publicModel,
      populationFilter: population.metadata,
      semantics: { ...publicModel.semantics, ...mapSemantics() },
      state: 'ready',
    }, {
      headers: { 'cache-control': 'no-store' },
    })
  } catch (error) {
    return Response.json({
      version: geographyMode === 'city' ? 'viewloom-stream-map-city-contract-v0.1' : 'viewloom-stream-map-live-v1',
      platform: 'twitch',
      source: 'real',
      geographyMode,
      state: 'error',
      updatedAt: null,
      coverage: null,
      populationFilter: null,
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

function normalizeGeographyMode(value: string | null): { ok: true; value: GeographyMode } | { ok: false } {
  const normalized = String(value ?? '').trim().toLowerCase()
  if (!normalized || normalized === 'country') return { ok: true, value: 'country' }
  if (normalized === 'city') return { ok: true, value: 'city' }
  return { ok: false }
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
    populationFilterBeforeEvidenceFilter: true,
    languageUsedForPopulationFiltering: false,
  } as const
}

function sanitizeError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error)
  return message.replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [redacted]').slice(0, 180)
}
