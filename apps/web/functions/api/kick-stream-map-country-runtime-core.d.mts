import type { KickStreamMapSnapshotItem } from './kick-stream-map-snapshot-source-core.mjs'

export const KICK_STREAM_MAP_COUNTRY_RUNTIME_VERSION: 'viewloom-kick-stream-map-country-runtime-v0.1'

export type KickStreamMapCountryRuntimeResponse = Record<string, unknown>

export function buildKickStreamMapCountryRuntime(input?: {
  snapshotItems?: KickStreamMapSnapshotItem[]
  updatedAt?: string | null
  sourceMode?: string
  publicActivationAuthorized?: boolean
}): KickStreamMapCountryRuntimeResponse
