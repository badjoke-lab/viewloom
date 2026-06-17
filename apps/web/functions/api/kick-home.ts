import type { Env } from '../_db/env'
import { buildKickHomeResponse } from '../_home/kick'
import { providerRuntime } from '../_provider-runtime'

const runtime = providerRuntime('kick')
const topLimit: 100 = runtime.topLimit
const staleAfterMinutes: 10 = runtime.staleAfterMinutes

export const onRequestGet: PagesFunction<Env> = async ({ env }) => buildKickHomeResponse({
  platform: 'kick',
  db: env.DB_KICK_HOT,
  topLimit,
  staleAfterMinutes,
})
