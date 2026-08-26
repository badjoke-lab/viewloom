export type StreamMapGeographyMode = 'country' | 'city'
export function normalizeStreamMapGeographyMode(value: unknown): StreamMapGeographyMode
export function applyStreamMapGeographyMode(url: string, mode: unknown): string
export function geographyModeLabel(mode: unknown): 'Country' | 'City'
export const STREAM_MAP_PUBLIC_GEOGRAPHY_MODES: readonly ['country', 'city']
export const STREAM_MAP_CURRENT_IRL_UI_ACTIVE: false
