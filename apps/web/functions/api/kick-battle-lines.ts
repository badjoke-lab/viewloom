import type { Env } from '../_db/env'
import {
  buildBattleLinesPayload,
  buildBattlePeriod,
  normalizeMetric,
  normalizeRequestedBucket,
  normalizeTop,
  type BattleSourceItem,
  type BattleSourceRow,
} from '../_lib/battle-lines-core'
import {
  BATTLE_CATEGORY_CONTRACT_VERSION,
  normalizeBattleCategory,
  projectKickBattleLinesCategory,
  type KickBattleCategoryDictionaryRow,
} from '../_lib/battle-lines-category'
import {
  BATTLE_MAX_SNAPSHOT_ROWS,
  BATTLE_QUERY_TIMEOUT_MS,
  compactBattleRows,
  withTimeout,
} from '../_lib/battle-lines-request'

type SnapshotRow = {
  bucket_minute: string
  collected_at: string
  payload_json: string
  source_mode: string
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url)
  const now = new Date()
  const startedAt = Date.now()
  const top = normalizeTop(url.searchParams.get('top'))
  const requestedBucket = normalizeRequestedBucket(url.searchParams.get('bucket'))
  const metric = normalizeMetric(url.searchParams.get('metric'))
  const period = buildBattlePeriod(url, now)
  const categoryCandidateRequested = url.searchParams.has('category')
  const requestedCategory = normalizeBattleCategory(url.searchParams.get('category'))
  const options = {
    platform: 'kick' as const,
    top,
    requestedBucket,
    metric,
    period,
    now,
    sampleIntervalMinutes: 5,
  }

  try {
    const result = await withTimeout(
      env.DB_KICK_HOT.prepare(`
        SELECT bucket_minute, collected_at, payload_json, source_mode
        FROM minute_snapshots
        WHERE provider = ? AND bucket_minute >= ? AND bucket_minute < ?
        ORDER BY bucket_minute DESC
        LIMIT ${BATTLE_MAX_SNAPSHOT_ROWS}
      `).bind('kick', period.from, period.to).all<SnapshotRow>(),
      BATTLE_QUERY_TIMEOUT_MS,
      `Kick Battle Lines snapshot query exceeded ${BATTLE_QUERY_TIMEOUT_MS}ms.`,
    )

    const orderedRows = [...(result.results ?? [])].reverse()
    const parsedRows: BattleSourceRow[] = orderedRows.map((row) => ({
      bucketMinute: row.bucket_minute,
      collectedAt: row.collected_at,
      sourceMode: row.source_mode,
      items: readItems(row.payload_json),
    }))
    const latestPayload = orderedRows.at(-1)?.payload_json ?? ''
    const meta = collectorMeta(latestPayload)
    const compacted = compactBattleRows(parsedRows, top)

    if (!categoryCandidateRequested) {
      const payload = buildBattleLinesPayload(compacted.rows, options)
      const durationMs = Date.now() - startedAt
      return Response.json({
        ...payload,
        targetSource: str(meta?.targetSource) || 'unknown',
        coverageMode: str(meta?.coverageMode) || 'unknown',
        diagnostics: {
          durationMs,
          snapshotRows: parsedRows.length,
          candidateStreams: compacted.candidateCount,
          retainedItems: compacted.retainedItemCount,
          maxSnapshotRows: BATTLE_MAX_SNAPSHOT_ROWS,
        },
        notes: [
          ...payload.notes,
          `${parsedRows.length} provider=kick snapshot rows read from DB_KICK_HOT.`,
          `${compacted.candidateCount} candidate streams reduced to the requested Top ${top} before timeline expansion.`,
          `target_source=${str(meta?.targetSource) || 'unknown'}`,
          `coverage_mode=${str(meta?.coverageMode) || 'unknown'}`,
        ],
      }, {
        headers: {
          'cache-control': 'no-store',
          'server-timing': `battle-lines;dur=${durationMs}`,
        },
      })
    }

    const dictionaryResult = await withTimeout(
      env.DB_KICK_HOT.prepare(`
        SELECT category_id, category_name, contract_version
        FROM provider_category_dictionary
        WHERE provider = ?
        ORDER BY category_name COLLATE NOCASE, category_id
      `).bind('kick').all<KickBattleCategoryDictionaryRow>(),
      BATTLE_QUERY_TIMEOUT_MS,
      `Kick Battle Lines category dictionary query exceeded ${BATTLE_QUERY_TIMEOUT_MS}ms.`,
    )
    const projection = projectKickBattleLinesCategory({
      rows: orderedRows,
      dictionaryRows: dictionaryResult.results ?? [],
      selectedCategory: requestedCategory,
      requestedBucket,
      period,
      sampleIntervalMinutes: 5,
    })
    const payload = requestedCategory === 'all'
      ? buildBattleLinesPayload(compacted.rows, options)
      : buildBattleLinesPayload(projection.rows, { ...options, categoryScoped: true })
    const durationMs = Date.now() - startedAt
    const candidateStreams = requestedCategory === 'all' ? compacted.candidateCount : projection.candidateCount
    const retainedItems = requestedCategory === 'all' ? compacted.retainedItemCount : projection.retainedItemCount

    return Response.json({
      ...payload,
      targetSource: str(meta?.targetSource) || 'unknown',
      coverageMode: str(meta?.coverageMode) || 'unknown',
      categoryFilter: {
        implementationState: 'public',
        publicExposureAuthorized: true,
        contractVersion: projection.contractRows > 0 ? BATTLE_CATEGORY_CONTRACT_VERSION : null,
        selectedCategory: requestedCategory,
        state: projection.state,
        coverageState: projection.coverageState,
        filterBeforeCandidateCompaction: true,
        filterBeforeTopN: true,
        filterBeforeRecommendedBattleScoring: true,
        candidateRankingMetric: 'category_qualified_viewer_minutes',
        membershipEvaluation: 'per_observed_snapshot',
        latestCategoryBackProjectionAllowed: false,
        categoryIdentity: '(kick, categoryProviderId)',
        categoryNamePresentationOnly: true,
        selectedCategoryPointStates: ['observed', 'outside_category', 'category_unavailable', 'offline', 'not_observed', 'missing'],
        outsideCategoryNeverZeroFilled: true,
        categoryUnavailableNeverZeroFilled: true,
        outsideCategoryExcludedFromMissingPenalty: true,
        categoryUnavailableExcludedFromMissingPenalty: true,
        battleOverlapRequiresCategoryQualifiedObserved: true,
        unknownCategoryMaySubstituteGlobalLines: false,
        availableCategories: projection.availableCategories,
        bucketCoverage: projection.bucketCoverage,
        coverageCounts: projection.coverageCounts,
        observedItems: projection.observedItems,
        missingItems: projection.missingItems,
        dictionaryMissingItems: projection.dictionaryMissingItems,
      },
      availableCategories: projection.availableCategories,
      diagnostics: {
        durationMs,
        snapshotRows: parsedRows.length,
        candidateStreams,
        retainedItems,
        maxSnapshotRows: BATTLE_MAX_SNAPSHOT_ROWS,
        categoryContractRows: projection.contractRows,
      },
      notes: [
        ...payload.notes,
        `${parsedRows.length} provider=kick snapshot rows read from DB_KICK_HOT.`,
        requestedCategory === 'all'
          ? `${compacted.candidateCount} unfiltered candidate streams reduced to the requested Top ${top}; category=all preserves the exact unfiltered fallback.`
          : `${projection.candidateCount} category-qualified candidate streams entered Battle Lines before Top ${top} and Recommended Battle scoring.`,
        'category_implementation_state=public',
        'category_public_exposure=true',
        `category_selected=${requestedCategory}`,
        `category_filter_state=${projection.state}`,
        `category_coverage_state=${projection.coverageState}`,
        'category_membership=per_observed_snapshot',
        'category_filter_before_candidate_compaction=true',
        'category_filter_before_top_n=true',
        'category_filter_before_recommended_battle_scoring=true',
        'category_outside_state=outside_category',
        'category_unavailable_state=category_unavailable',
        'category_latest_back_projection=false',
        `target_source=${str(meta?.targetSource) || 'unknown'}`,
        `coverage_mode=${str(meta?.coverageMode) || 'unknown'}`,
      ],
    }, {
      headers: {
        'cache-control': 'no-store',
        'server-timing': `battle-lines;dur=${durationMs}`,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Kick Battle Lines API failed.'
    const payload = buildBattleLinesPayload([], options)
    const durationMs = Date.now() - startedAt
    return Response.json({
      ...payload,
      state: 'error',
      status: 'error',
      targetSource: 'unknown',
      coverageMode: 'unknown',
      diagnostics: { durationMs, maxSnapshotRows: BATTLE_MAX_SNAPSHOT_ROWS },
      error: { code: 'kick_battle_lines_api_error', message },
      ...(categoryCandidateRequested ? {
        categoryFilter: {
          implementationState: 'public',
          publicExposureAuthorized: true,
          selectedCategory: requestedCategory,
          state: 'category_unavailable',
          coverageState: 'unavailable',
          filterBeforeCandidateCompaction: true,
          filterBeforeTopN: true,
          filterBeforeRecommendedBattleScoring: true,
          membershipEvaluation: 'per_observed_snapshot',
          latestCategoryBackProjectionAllowed: false,
          availableCategories: [],
          bucketCoverage: [],
          coverageCounts: { observed: 0, partial: 0, unavailable: 0 },
        },
        availableCategories: [],
      } : {}),
      notes: [...payload.notes, 'Kick Battle Lines could not read or process DB_KICK_HOT snapshots.'],
    }, {
      status: 500,
      headers: {
        'cache-control': 'no-store',
        'server-timing': `battle-lines;dur=${durationMs}`,
      },
    })
  }
}

function readItems(payloadJson: string): BattleSourceItem[] {
  const parsed = safeJson(payloadJson)
  const record = object(parsed)
  const rawItems = Array.isArray(record?.items) ? record.items : Array.isArray(record?.data) ? record.data : []
  return rawItems.map(readItem).filter((item): item is BattleSourceItem => item !== null)
}

function readItem(raw: unknown): BattleSourceItem | null {
  const record = object(raw)
  if (!record) return null
  const channel = object(record.channel)
  const live = object(record.livestream)
  const rawId = str(record.channelLogin ?? record.slug ?? record.username ?? record.user_slug ?? channel?.slug ?? channel?.username ?? channel?.name)
  const id = slug(rawId || str(record.displayName ?? record.name))
  if (!id) return null
  const name = str(record.displayName ?? record.name ?? record.username ?? channel?.displayName ?? channel?.name ?? channel?.username ?? id) || id
  const viewers = number(record.viewers ?? record.viewer_count ?? record.viewerCount ?? live?.viewer_count)
  return {
    id,
    name,
    title: str(record.title ?? record.session_title ?? record.stream_title ?? live?.session_title),
    url: str(record.url) || `https://kick.com/${id}`,
    viewers,
  }
}

function collectorMeta(payloadJson: string): Record<string, unknown> | null {
  const parsed = safeJson(payloadJson)
  return object(object(parsed)?.collectorMeta)
}

function safeJson(value: string): unknown {
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

function object(value: unknown): Record<string, any> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, any> : null
}

function str(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function number(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9_]+/g, '-').replace(/^-+|-+$/g, '')
}
