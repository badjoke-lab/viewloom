export type ProviderKey = 'twitch' | 'kick'

export type ProviderCoveragePayload = {
  source?: string
  sourceMode?: string
  coverageMode?: string
  targetSource?: string
  coverage?: Record<string, unknown>
  coverageModel?: Record<string, unknown>
}

export function providerCoverageSource(payload: ProviderCoveragePayload, provider: ProviderKey): string {
  const model = asRecord(payload.coverageModel)
  const coverage = asRecord(payload.coverage)
  const raw = String(model?.mode ?? coverage?.mode ?? payload.coverageMode ?? payload.targetSource ?? payload.sourceMode ?? payload.source ?? '').toLowerCase()
  if (provider === 'twitch') return 'Helix endpoint'
  if (raw === 'official-livestreams' || raw === 'authenticated') return 'Official endpoint'
  if (raw === 'registry') return 'Registry candidates'
  if (raw === 'seed-list') return 'Seed list'
  if (raw === 'public-channel-fallback') return 'Candidate fallback'
  if (raw === 'fixture' || raw === 'demo') return 'Fixture'
  return 'Observed source'
}

export function providerCoverageLimit(payload: ProviderCoveragePayload, provider: ProviderKey): number {
  const model = asRecord(payload.coverageModel)
  const coverage = asRecord(payload.coverage)
  const value = Number(model?.topLimit ?? coverage?.topLimit)
  return Number.isInteger(value) && value > 0 ? value : provider === 'kick' ? 100 : 300
}

export function providerCoverageSummary(payload: ProviderCoveragePayload, provider: ProviderKey): string {
  return `${providerCoverageSource(payload, provider)} · Top ${providerCoverageLimit(payload, provider).toLocaleString('en-US')} observed`
}

export function providerCoverageNote(payload: ProviderCoveragePayload): string {
  const model = asRecord(payload.coverageModel)
  const coverage = asRecord(payload.coverage)
  const value = model?.description ?? model?.limitation ?? coverage?.note
  return typeof value === 'string' && value.trim() ? value.trim() : 'Coverage is limited to the configured observed window.'
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : null
}
