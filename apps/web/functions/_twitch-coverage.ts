export type TwitchCoverageMode = 'helix' | 'fixture' | 'unknown'

export type TwitchCoverageContract = {
  mode: TwitchCoverageMode
  targetSource: 'twitch-helix-streams'
  sourceMode: string
  authMode: 'authenticated' | 'fixture' | 'unknown'
  label: string
  isDirectoryCoverage: boolean
  isProviderWide: false
  isBounded: true
  description: string
  publicNote: string
  limitation: string
  sourceLimitation: string
}

type Raw = Record<string, unknown>

export function twitchCoverageFromMeta(meta: Raw | null | undefined, sourceMode = 'unknown'): TwitchCoverageContract {
  const row = meta ?? {}
  const requestedSourceMode = text(sourceMode)
  const resolvedSourceMode = requestedSourceMode && requestedSourceMode !== 'unknown'
    ? requestedSourceMode
    : text(row.sourceMode) || requestedSourceMode || 'unknown'
  const mode = normalizeTwitchCoverageMode(
    row.coverageMode,
    row.targetSource,
    row.sourceMode,
    resolvedSourceMode,
  )

  if (mode === 'fixture') {
    return {
      mode,
      targetSource: 'twitch-helix-streams',
      sourceMode: resolvedSourceMode,
      authMode: 'fixture',
      label: 'Fixture-backed Twitch coverage',
      isDirectoryCoverage: false,
      isProviderWide: false,
      isBounded: true,
      description: 'This Twitch response is fixture-backed and is exposed only for interface or fallback verification.',
      publicNote: 'Twitch is showing fixture-backed data for this response, not a live provider-wide observation.',
      limitation: 'Fixture-backed data must not be described as live or complete Twitch coverage.',
      sourceLimitation: 'Fixture rows do not represent a current Twitch Helix collection run.',
    }
  }

  if (mode === 'helix') {
    return {
      mode,
      targetSource: 'twitch-helix-streams',
      sourceMode: resolvedSourceMode,
      authMode: 'authenticated',
      label: 'Twitch Helix endpoint coverage',
      isDirectoryCoverage: true,
      isProviderWide: false,
      isBounded: true,
      description: 'Twitch observations use the authenticated Helix streams endpoint within the configured Top 300 collection window.',
      publicNote: 'Twitch uses the Helix streams endpoint for a bounded Top 300 observation window.',
      limitation: 'The observed Top 300 window is bounded and must not be described as complete provider-wide Twitch coverage.',
      sourceLimitation: 'Rows represent the configured paginated Helix response retained for that collection run.',
    }
  }

  return {
    mode,
    targetSource: 'twitch-helix-streams',
    sourceMode: resolvedSourceMode,
    authMode: 'unknown',
    label: 'Unknown Twitch source coverage',
    isDirectoryCoverage: false,
    isProviderWide: false,
    isBounded: true,
    description: 'The Twitch source mode could not be confirmed for this response.',
    publicNote: 'Twitch coverage is bounded, but the source mode could not be confirmed for this response.',
    limitation: 'Unknown source-mode responses must not be described as complete provider-wide Twitch coverage.',
    sourceLimitation: 'No confirmed collector source mode was available while enriching this response.',
  }
}

export function normalizeTwitchCoverageMode(...values: unknown[]): TwitchCoverageMode {
  const normalized = values.map(text).map((value) => value.toLowerCase())
  if (normalized.some((value) => value === 'demo' || value === 'fixture')) return 'fixture'
  if (normalized.some((value) => [
    'real',
    'api',
    'authenticated',
    'helix',
    'twitch-helix-streams',
    'observed-top-pages',
    'partial-top-pages',
  ].includes(value))) return 'helix'
  return 'unknown'
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}
