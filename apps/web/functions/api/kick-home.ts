import type { Env } from '../_db/env'
import { buildProviderHomeResponse } from '../_home/model'
import { providerRuntime } from '../_provider-runtime'

const runtime = providerRuntime('kick')

export const onRequestGet: PagesFunction<Env> = async ({ env }) => buildProviderHomeResponse({
  platform: 'kick',
  db: env.DB_KICK_HOT,
  topLimit: runtime.topLimit,
  staleAfterMinutes: runtime.staleAfterMinutes,
})
