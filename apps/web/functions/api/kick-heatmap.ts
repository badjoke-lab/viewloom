import type { Env } from '../_db/env'
import { enrichKickFeatureResponse } from '../_kick-feature-coverage'
import { onRequestGet as handleKickHeatmap } from '../_kick-feature-handlers/heatmap'

export const onRequestGet: PagesFunction<Env> = async (context) =>
  enrichKickFeatureResponse(context.env, await handleKickHeatmap(context))
