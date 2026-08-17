import {
  HISTORY_CATEGORY_BUCKET_MINUTES,
  HISTORY_CATEGORY_RETENTION_DAYS,
  HISTORY_CATEGORY_ROW_CAP,
  HISTORY_CATEGORY_STREAMER_ROW_CAP,
  maybeGenerateKickHistoryCategoryAggregates,
  type KickHistoryCategoryGenerationResult,
} from '../shared/history-category-aggregate'

export const KICK_HISTORY_CATEGORY_INTEGRATION_VERSION =
  'kick-history-category-aggregate-integration-v1'

export type KickHistoryCategoryPermanentIntegrationConfig = {
  enabled: boolean
  startDay: string
}

export type KickHistoryCategoryGenerator = typeof maybeGenerateKickHistoryCategoryAggregates

export const KICK_HISTORY_CATEGORY_PERMANENT_INTEGRATION_BOUNDARY = {
  provider: 'kick',
  bucketMinutes: HISTORY_CATEGORY_BUCKET_MINUTES,
  retentionDays: HISTORY_CATEGORY_RETENTION_DAYS,
  categoryRowCapPerDay: HISTORY_CATEGORY_ROW_CAP,
  streamerCategoryRowCapPerDay: HISTORY_CATEGORY_STREAMER_ROW_CAP,
  requiresExplicitStartDay: true,
  preActivationDaysEligible: false,
  newCron: false,
  currentRuntimeWiringIncluded: false,
} as const

export function buildKickHistoryCategoryPermanentGenerationConfig(
  config: KickHistoryCategoryPermanentIntegrationConfig,
) {
  return {
    enabled: config.enabled,
    startDay: config.startDay,
    categoryRowCap: HISTORY_CATEGORY_ROW_CAP,
    streamerCategoryRowCap: HISTORY_CATEGORY_STREAMER_ROW_CAP,
    bucketMinutes: HISTORY_CATEGORY_BUCKET_MINUTES,
  } as const
}

export async function maybeRunKickHistoryCategoryPermanentIntegration(
  db: D1Database,
  config: KickHistoryCategoryPermanentIntegrationConfig,
  now = new Date(),
  generate: KickHistoryCategoryGenerator = maybeGenerateKickHistoryCategoryAggregates,
): Promise<KickHistoryCategoryGenerationResult> {
  return generate(
    db,
    buildKickHistoryCategoryPermanentGenerationConfig(config),
    now,
  )
}
