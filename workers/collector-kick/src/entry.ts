import collector from './index'
import { maybeApplyIntradaySchema } from '../../shared/intraday-schema'

type Env = {
  DB_KICK_HOT: D1Database
  KICK_CHANNEL_SLUGS?: string
  KICK_INGEST_TOKEN?: string
  KICK_CLIENT_ID?: string
  KICK_CLIENT_SECRET?: string
  KICK_ACCESS_TOKEN?: string
  KICK_USE_AUTHENTICATED_CHANNEL_READS?: string
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
    }
  },
}
