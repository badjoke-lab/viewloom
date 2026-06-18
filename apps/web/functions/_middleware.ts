import type { Env } from './_db/env'
import { enrichHistoryStreamerDailyStats } from './_history-streamer-daily-stats'
import { enrichKickFeatureResponse } from './_kick-feature-coverage'
import { enrichTwitchFeatureResponse } from './_twitch-feature-coverage'

const HISTORY_ROUTES = new Set([
  '/api/history',
  '/api/kick-history',
])

const KICK_FEATURE_ROUTES = new Set([
  '/api/kick-heatmap',
  '/api/kick-day-flow',
  '/api/kick-battle-lines',
])

const TWITCH_FEATURE_ROUTES = new Set([
  '/api/twitch-heatmap',
  '/api/day-flow',
  '/api/battle-lines',
  '/api/history',
])

export const onRequest: PagesFunction<Env> = async ({ request, next, env }) => {
  const response = await next()
  const pathname = new URL(request.url).pathname.replace(/\/$/, '')
  const historyResponse = HISTORY_ROUTES.has(pathname)
    ? await enrichHistoryStreamerDailyStats(response)
    : response
  if (KICK_FEATURE_ROUTES.has(pathname)) return enrichKickFeatureResponse(env, historyResponse)
  if (TWITCH_FEATURE_ROUTES.has(pathname)) return enrichTwitchFeatureResponse(env, historyResponse)
  return historyResponse
}
