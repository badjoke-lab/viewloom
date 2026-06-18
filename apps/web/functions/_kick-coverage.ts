export type KickCoverageMode = 'official-livestreams' | 'registry' | 'seed-list'

export type KickCoverageContract = {
  mode: KickCoverageMode
  targetSource: string
  sourceMode: string
  authMode: 'authenticated' | 'fixture' | 'public-channel-fallback'
  label: string
  isDirectoryCoverage: boolean
  isProviderWide: false
  isBounded: true
  description: string
  configuredChannelMechanism: string
  publicNote: string
  limitation: string
  sourceLimitation: string
  nextRequiredArchitecture: string
}

type Raw = Record<string, unknown>

export function kickCoverageFromPayload(payloadJson: string | null | undefined, sourceMode = 'unknown'): KickCoverageContract {
  return kickCoverageFromMeta(readCollectorMeta(payloadJson), sourceMode)
}

export function kickCoverageFromMeta(meta: Raw | null | undefined, sourceMode = 'unknown'): KickCoverageContract {
  const row = meta ?? {}
  const metaMode = text(row.coverageMode)
  const metaTarget = text(row.targetSource)
  const metaSource = text(row.sourceMode)
  const normalizedSourceMode = sourceMode || metaSource || 'unknown'
  const mode = normalizeKickCoverageMode(metaMode, metaTarget, metaSource, normalizedSourceMode)
  const targetSource = metaTarget || mode
  const authMode = normalizedSourceMode === 'fixture' || normalizedSourceMode === 'demo'
    ? 'fixture'
    : normalizedSourceMode === 'authenticated' || mode === 'official-livestreams'
      ? 'authenticated'
      : 'public-channel-fallback'

  if (mode === 'official-livestreams') {
    return {
      mode,
      targetSource,
      sourceMode: normalizedSourceMode,
      authMode,
      label: 'Official livestream endpoint coverage',
      isDirectoryCoverage: true,
      isProviderWide: false,
      isBounded: true,
      description: 'Kick observations use the authenticated official livestreams endpoint within the configured per-run limit. This is a bounded observed window, not complete platform coverage.',
      configuredChannelMechanism: 'authenticated official livestreams endpoint',
      publicNote: 'Kick used the official livestreams endpoint for this snapshot. The observed window remains bounded by the configured Top limit.',
      limitation: 'Official endpoint observations are bounded by the configured per-run limit and must not be described as complete provider-wide coverage.',
      sourceLimitation: 'Authenticated rows represent the bounded official endpoint response for that collection run.',
      nextRequiredArchitecture: 'pagination and coverage diagnostics beyond the current official endpoint limit',
    }
  }

  if (mode === 'registry') {
    return {
      mode,
      targetSource,
      sourceMode: normalizedSourceMode,
      authMode,
      label: 'Registry-backed candidate coverage',
      isDirectoryCoverage: false,
      isProviderWide: false,
      isBounded: true,
      description: 'Kick attempts channel slugs selected from the kick_channels registry. Channels outside that candidate set may be omitted.',
      configuredChannelMechanism: 'kick_channels registry target selection',
      publicNote: 'Kick is using registry-backed candidate coverage, not provider-wide directory coverage.',
      limitation: 'Registry-backed observations cover the configured candidate set and must not be described as complete platform coverage.',
      sourceLimitation: 'Registry candidate rows may omit live channels outside the maintained candidate set.',
      nextRequiredArchitecture: 'candidate expansion and discovery diagnostics',
    }
  }

  return {
    mode,
    targetSource,
    sourceMode: normalizedSourceMode,
    authMode,
    label: 'Seed-list candidate coverage',
    isDirectoryCoverage: false,
    isProviderWide: false,
    isBounded: true,
    description: 'Kick attempts configured and built-in channel slug candidates. Channels outside that seed list may be omitted.',
    configuredChannelMechanism: 'configured and built-in seed slug list',
    publicNote: 'Kick coverage is seed-list based and is not provider-wide directory coverage.',
    limitation: 'Seed-list observations cover configured candidates only and must not be described as complete platform coverage.',
    sourceLimitation: 'Seed-list and public-channel fallback rows are sampled from configured or built-in channel candidates.',
    nextRequiredArchitecture: 'registry expansion and discovery diagnostics',
  }
}

export function normalizeKickCoverageMode(...values: unknown[]): KickCoverageMode {
  const normalized = values.map(text)
  if (normalized.some((value) => value === 'official-livestreams' || value === 'authenticated')) return 'official-livestreams'
  if (normalized.some((value) => value === 'registry')) return 'registry'
  return 'seed-list'
}

export function readCollectorMeta(payloadJson: string | null | undefined): Raw {
  if (!payloadJson) return {}
  try {
    const payload = object(JSON.parse(payloadJson))
    return object(payload?.collectorMeta) ?? {}
  } catch {
    return {}
  }
}

function object(value: unknown): Raw | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? value as Raw : null
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}
