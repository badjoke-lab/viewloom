export function asRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? value : null
}

export function firstString(...values) {
  for (const value of values) if (typeof value === 'string' && value.trim()) return value.trim()
  return ''
}

export function firstFinite(...values) {
  for (const value of values) {
    if (value === null || value === undefined || value === '') continue
    const number = Number(value)
    if (Number.isFinite(number)) return number
  }
  return 0
}

export function firstNullableFinite(...values) {
  for (const value of values) {
    if (value === null || value === undefined || value === '') continue
    const number = Number(value)
    if (Number.isFinite(number)) return number
  }
  return null
}

export function firstBoolean(...values) {
  for (const value of values) {
    if (typeof value === 'boolean') return value
    if (value === 1 || value === '1' || value === 'true') return true
    if (value === 0 || value === '0' || value === 'false') return false
  }
  return null
}

export function parsePayload(value) {
  if (typeof value !== 'string' || !value.trim()) return {}
  try { return asRecord(JSON.parse(value)) || {} } catch { return {} }
}

export function normalizeSourceMode(value) {
  const key = String(value || '').trim().toLowerCase().replaceAll(' ', '_')
  if (key === 'demo' || key === 'fixture') return 'demo'
  if (key === 'stale' || key === 'stale_real') return 'stale'
  if (key === 'authenticated' || key === 'official-livestreams') return 'official-livestreams'
  if (key === 'registry') return 'registry'
  if (key === 'seed-list') return 'seed-list'
  if (key === 'public-channel-fallback') return 'public-channel-fallback'
  if (key === 'real' || key === 'api') return 'real'
  return 'unknown'
}

export function sourceLabel(mode) {
  if (mode === 'official-livestreams') return 'Official endpoint'
  if (mode === 'registry') return 'Registry candidates'
  if (mode === 'seed-list') return 'Seed list'
  if (mode === 'public-channel-fallback') return 'Candidate fallback'
  return mode === 'real' ? 'Real' : mode === 'stale' ? 'Stale real' : mode === 'demo' ? 'Demo' : 'Unknown'
}

export function normalizeExplicitState(value) {
  const key = String(value || '').trim().toLowerCase().replaceAll('-', '_').replaceAll(' ', '_')
  if (['live', 'ok', 'healthy', 'ready', 'complete', 'fresh'].includes(key)) return 'fresh'
  if (['partial', 'empty', 'demo', 'loading'].includes(key)) return key
  if (['stale', 'strong_stale'].includes(key)) return 'stale'
  if (['failing', 'degraded'].includes(key)) return 'partial'
  if (['error', 'failed', 'failure', 'unconfigured', 'not_ready'].includes(key)) return 'error'
  return null
}

export function normalizeCoverage(value) {
  const key = String(value || '').trim().toLowerCase()
  if (['good', 'observed', 'complete'].includes(key)) return 'good'
  if (['partial', 'poor', 'missing'].includes(key)) return key
  return null
}

export function ageMinutes(value, nowMs) {
  if (!value) return null
  const time = Date.parse(value)
  return Number.isFinite(time) ? Math.max(0, (nowMs - time) / 60_000) : null
}
