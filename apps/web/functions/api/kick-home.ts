import type { Env } from '../_db/env'
import { buildProviderHomeResponse } from '../_home/model'

export const onRequestGet: PagesFunction<Env> = async ({ env }) => buildProviderHomeResponse({
  platform: 'kick',
  db: env.DB_KICK_HOT,
  topLimit: 100,
  staleAfterMinutes: 10,
})
