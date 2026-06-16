import type { Env } from '../_db/env'
import { buildProviderHomeResponse } from '../_home/model'

export const onRequestGet: PagesFunction<Env> = async ({ env }) => buildProviderHomeResponse({
  platform: 'twitch',
  db: env.DB_TWITCH_HOT,
  topLimit: 300,
  staleAfterMinutes: 10,
})
