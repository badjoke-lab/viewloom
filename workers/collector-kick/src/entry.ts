import collector from './index'
import { maybeRunKickHistoryCategoryPermanentIntegration } from '../../dormant/history-category-aggregate-integration'
import { categoryCaptureEnabled } from '../../shared/category-capture'
import { maybeGenerateCategoryIntradayRollups } from '../../shared/category-intraday-rollup'
import { maybeApplyIntradaySchema } from '../../shared/intraday-schema'
import {
  intradayGenerationEnabled,
  maybeGenerateIntradayRollups,
} from '../../shared/intraday-rollup'
import { runKickScheduledObservation } from './scheduled-observation'

type Env = {
  DB_KICK_HOT: D1Database
  KICK_CHANNEL_SLUGS?: string
  KICK_INGEST_TOKEN?: string
  KICK_CLIENT_ID?: string
  KICK_CLIENT_SECRET?: string
  KICK_ACCESS_TOKEN?: string
  KICK_USE_AUTHENTICATED_CHANNEL_READS?: string
  INTRADAY_GENERATION_ENABLED?: string
  CATEGORY_CAPTURE_ENABLED?: string
  HISTORY_CATEGORY_GENERATION_ENABLED?: string
  HISTORY_CATEGORY_START_DAY?: string
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    return collector.fetch(request, env)
  },

  async scheduled(event: ScheduledEvent, env: Env): Promise<void> {
    try {
      await runKickScheduledObservation(event, env, () => collector.scheduled(event, env))
    } finally {
      const schemaBootstrap = await maybeApplyIntradaySchema(env.DB_KICK_HOT)
      if (schemaBootstrap.attempted) {
        console.log(JSON.stringify({
          event: 'intraday_schema_bootstrap',
          provider: 'kick',
          ...schemaBootstrap,
        }))
      }

      const generationConfig = {
        provider: 'kick' as const,
        streamerCap: 200,
        bucketMinutes: 5,
        enabled: intradayGenerationEnabled(env.INTRADAY_GENERATION_ENABLED),
      }
      const categoryEnabled = categoryCaptureEnabled(env.CATEGORY_CAPTURE_ENABLED)
      const intradayGeneration = categoryEnabled && generationConfig.enabled
        ? await maybeGenerateCategoryIntradayRollups(env.DB_KICK_HOT, generationConfig)
        : await maybeGenerateIntradayRollups(env.DB_KICK_HOT, generationConfig)
      if (intradayGeneration.attempted) {
        console.log(JSON.stringify({
          event: categoryEnabled ? 'category_intraday_rollup_generation' : 'intraday_rollup_generation',
          worker: 'viewloom-collector-kick',
          ...intradayGeneration,
        }))
      }

      const historyCategoryEnabled = categoryEnabled
        && env.HISTORY_CATEGORY_GENERATION_ENABLED === 'true'
      const historyCategoryStartDay = env.HISTORY_CATEGORY_START_DAY?.trim() ?? ''
      const historyCategoryGeneration = await maybeRunKickHistoryCategoryPermanentIntegration(
        env.DB_KICK_HOT,
        {
          enabled: historyCategoryEnabled,
          startDay: historyCategoryStartDay,
        },
      )
      if (historyCategoryGeneration.attempted || historyCategoryEnabled) {
        console.log(JSON.stringify({
          event: 'history_category_aggregate_generation',
          worker: 'viewloom-collector-kick',
          ...historyCategoryGeneration,
        }))
      }
    }
  },
}
