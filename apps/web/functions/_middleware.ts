import type { Env } from './_db/env'
import { enrichHistoryAdditionalRankings } from './_history-additional-rankings'
import { enrichHistoryBattleArchive } from './_history-battle-archive'
import { enrichHistoryPeakArchive } from './_history-peak-archive'
import { enrichHistoryStreamerDailyStats } from './_history-streamer-daily-stats'
import { enrichKickFeatureResponse } from './_kick-feature-coverage'
import { enrichTwitchFeatureResponse } from './_twitch-feature-coverage'

const HISTORY_ROUTES = new Set(['/api/history'])
const KICK_FEATURE_ROUTES = new Set(['/api/kick-heatmap', '/api/kick-day-flow', '/api/kick-battle-lines'])
const TWITCH_FEATURE_ROUTES = new Set(['/api/twitch-heatmap', '/api/day-flow', '/api/battle-lines', '/api/history'])

export const onRequest: PagesFunction<Env> = async ({ request, next, env }) => {
  const response = await next()
  const pathname = new URL(request.url).pathname.replace(/\/$/, '')
  if (KICK_FEATURE_ROUTES.has(pathname)) return enrichKickFeatureResponse(env, response)
  if (TWITCH_FEATURE_ROUTES.has(pathname)) {
    const coveredResponse = await enrichTwitchFeatureResponse(env, response)
    return HISTORY_ROUTES.has(pathname) ? enrichHistoryResponse(env, 'twitch', coveredResponse) : coveredResponse
  }
  if (pathname.endsWith('/kick-history')) return enrichHistoryResponse(env, 'kick', response)
  return response
}

async function enrichHistoryResponse(env: Env, provider: 'twitch' | 'kick', response: Response): Promise<Response> {
  const dailyResponse = await enrichHistoryStreamerDailyStats(response)
  const rankedResponse = await enrichHistoryRankings(dailyResponse)
  const peakResponse = await enrichHistoryPeakArchive(rankedResponse)
  return enrichHistoryBattleArchive(env, provider, peakResponse)
}

async function enrichHistoryRankings(dailyResponse: Response): Promise<Response> {
  return enrichHistoryAdditionalRankings(dailyResponse)
}
