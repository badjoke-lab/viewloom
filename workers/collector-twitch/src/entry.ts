import collector from './index'
import { categoryCaptureEnabled } from '../../shared/category-capture'
import { maybeGenerateCategoryIntradayRollups } from '../../shared/category-intraday-rollup'
import { maybeApplyIntradaySchema } from '../../shared/intraday-schema'
import {
  intradayGenerationEnabled,
  maybeGenerateIntradayRollups,
} from '../../shared/intraday-rollup'

type Env = {
  DB_TWITCH_HOT: D1Database
  TWITCH_CLIENT_ID?: string
  TWITCH_CLIENT_SECRET?: string
  TWITCH_INGEST_TOKEN?: string
  INTRADAY_GENERATION_ENABLED?: string
  CATEGORY_CAPTURE_ENABLED?: string
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    return collector.fetch(request, env)
  },

  async scheduled(event: ScheduledEvent, env: Env): Promise<void> {
    try {
      await collector.scheduled(event, env)
    } finally {
      const schemaBootstrap = await maybeApplyIntradaySchema(env.DB_TWITCH_HOT)
      if (schemaBootstrap.attempted) {
        console.log(JSON.stringify({
          event: 'intraday_schema_bootstrap',
          provider: 'twitch',
          ...schemaBootstrap,
        }))
      }

      const generationConfig = {
        provider: 'twitch' as const,
        streamerCap: 600,
        bucketMinutes: 5,
        enabled: intradayGenerationEnabled(env.INTRADAY_GENERATION_ENABLED),
      }
      const categoryEnabled = categoryCaptureEnabled(env.CATEGORY_CAPTURE_ENABLED)
      const intradayGeneration = categoryEnabled && generationConfig.enabled
        ? await maybeGenerateCategoryIntradayRollups(env.DB_TWITCH_HOT, generationConfig)
        : await maybeGenerateIntradayRollups(env.DB_TWITCH_HOT, generationConfig)
      if (intradayGeneration.attempted) {
        console.log(JSON.stringify({
          event: categoryEnabled ? 'category_intraday_rollup_generation' : 'intraday_rollup_generation',
          worker: 'viewloom-collector-twitch',
          ...intradayGeneration,
        }))
      }
    }
  },
}
