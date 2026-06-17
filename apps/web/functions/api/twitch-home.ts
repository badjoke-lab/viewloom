import type { Env } from '../_db/env'
import { buildProviderHomeResponse } from '../_home/model'
import { providerRuntime } from '../_provider-runtime'

const runtime = providerRuntime('twitch')

export const onRequestGet: PagesFunction<Env> = async ({ env }) => buildProviderHomeResponse({
  platform: 'twitch',
  db: env.DB_TWITCH_HOT,
  topLimit: runtime.topLimit,
  staleAfterMinutes: runtime.staleAfterMinutes,
})
