import type { Env } from './_db/env'
import { enrichKickFeatureResponse } from './_kick-feature-coverage'

const KICK_FEATURE_ROUTES = new Set([
  '/api/kick-heatmap',
  '/api/kick-day-flow',
  '/api/kick-battle-lines',
])

export const onRequest: PagesFunction<Env> = async ({ request, next, env }) => {
  const response = await next()
  const pathname = new URL(request.url).pathname.replace(/\/$/, '')
  return KICK_FEATURE_ROUTES.has(pathname)
    ? enrichKickFeatureResponse(env, response)
    : response
}
