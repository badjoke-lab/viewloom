import type { KickStreamMapSnapshotItem } from './kick-stream-map-snapshot-source-core.mjs'

export const KICK_STREAM_MAP_CITY_RUNTIME_VERSION: 'viewloom-kick-stream-map-city-runtime-v0.1'

export type KickStreamMapCityRuntimeResponse = Record<string, unknown>

export function buildKickStreamMapCityRuntime(input?: {
  snapshotItems?: KickStreamMapSnapshotItem[]
  updatedAt?: string | null
  sourceMode?: string
  publicCityActivationAuthorized?: boolean
}): KickStreamMapCityRuntimeResponse
