import type { Env } from './_db/env'
import { enrichKickFeatureResponse } from './_kick-feature-coverage'
import { enrichTwitchFeatureResponse } from './_twitch-feature-coverage'

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
  if (KICK_FEATURE_ROUTES.has(pathname)) return enrichKickFeatureResponse(env, response)
  if (TWITCH_FEATURE_ROUTES.has(pathname)) return enrichTwitchFeatureResponse(env, response)
  return response
}
