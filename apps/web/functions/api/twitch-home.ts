import type { Env } from '../_db/env'
import { buildProviderHomeResponse } from '../_home/model'
import { providerRuntime } from '../_provider-runtime'

const runtime = providerRuntime('twitch')
const topLimit: 300 = runtime.topLimit
const staleAfterMinutes: 10 = runtime.staleAfterMinutes

export const onRequestGet: PagesFunction<Env> = async ({ env }) => buildProviderHomeResponse({
  platform: 'twitch',
  db: env.DB_TWITCH_HOT,
  topLimit: topLimit,
  staleAfterMinutes: staleAfterMinutes,
})
