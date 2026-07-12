import collector from './index'
import { maybeApplyIntradaySchema } from '../../shared/intraday-schema'
import {
  intradayGenerationEnabled,
  maybeGenerateIntradayRollups,
} from '../../shared/intraday-rollup'

type Env = {
  DB_KICK_HOT: D1Database
  KICK_CHANNEL_SLUGS?: string
  KICK_INGEST_TOKEN?: string
  KICK_CLIENT_ID?: string
  KICK_CLIENT_SECRET?: string
  KICK_ACCESS_TOKEN?: string
  KICK_USE_AUTHENTICATED_CHANNEL_READS?: string
  INTRADAY_GENERATION_ENABLED?: string
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    return collector.fetch(request, env)
  },

  async scheduled(event: ScheduledEvent, env: Env): Promise<void> {
    try {
      await collector.scheduled(event, env)
    } finally {
      const schemaBootstrap = await maybeApplyIntradaySchema(env.DB_KICK_HOT)
      if (schemaBootstrap.attempted) {
        console.log(JSON.stringify({
          event: 'intraday_schema_bootstrap',
          provider: 'kick',
          ...schemaBootstrap,
        }))
      }

      const intradayGeneration = await maybeGenerateIntradayRollups(env.DB_KICK_HOT, {
        provider: 'kick',
        streamerCap: 200,
        bucketMinutes: 5,
        enabled: intradayGenerationEnabled(env.INTRADAY_GENERATION_ENABLED),
      })
      if (intradayGeneration.attempted) {
        console.log(JSON.stringify({
          event: 'intraday_rollup_generation',
          worker: 'viewloom-collector-kick',
          ...intradayGeneration,
        }))
      }
    }
  },
}
