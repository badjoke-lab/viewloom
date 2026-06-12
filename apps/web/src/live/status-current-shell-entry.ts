type StatusFeature = {
  label?: string
  role?: string
  state?: string
  source?: string
  lastUpdatedAt?: string | null
  knownGap?: string
  pagePath?: string
}

type StatusPayload = {
  platform?: string
  sourceMode?: string
  state?: string
  generatedAt?: string
  collector?: Record<string, unknown>
  freshness?: Record<string, unknown>
  latestSnapshot?: Record<string, unknown>
  coverage?: Record<string, unknown>
  features?: StatusFeature[]
  storage?: { database?: string; binding?: string }
}

const provider = document.body.dataset.provider === 'kick' ? 'kick' : 'twitch'
const endpoint = provider === 'kick' ? '/api/kick-status' : '/api/twitch-status'

void hydrateStatus()

async function hydrateStatus(): Promise<void> {
  try {
    const response = await fetch(endpoint, { headers: { accept: 'application/json' }, cache: 'no-store' })
    if (!response.ok) throw new Error(`status api returned ${response.status}`)
    const payload = await response.json() as StatusPayload
    renderFacts(payload)
    renderBoard(payload)
    renderFeatures(payload)
  } catch (error) {
    renderError(error instanceof Error ? error.message : String(error))
  }
}

function renderFacts(payload: StatusPayload): void {
  const values = [
    label(payload.state ?? payload.sourceMode ?? 'unknown'),
    time(value(payload.freshness, 'lastSuccessAt') ?? value(payload.latestSnapshot, 'collectedAt') ?? value(payload.latestSnapshot, 'bucketMinute')),
    count(value(payload.latestSnapshot, 'observedCount') ?? value(payload.latestSnapshot, 'streamCount')),
    label(payload.sourceMode ?? 'api'),
  ]
  document.querySelectorAll<HTMLElement>('.head-facts .fact strong').forEach((node, index) => { node.textContent = values[index] ?? '—' })
}

function renderBoard(payload: StatusPayload): void {
  const cells = document.querySelectorAll<HTMLElement>('.status-board .status-cell strong')
  const values = [
    label(String(value(payload.collector, 'state') ?? payload.state ?? 'unknown')),
    time(value(payload.latestSnapshot, 'bucketMinute') ?? value(payload.latestSnapshot, 'collectedAt')),
    cadence(payload),
    coverage(payload),
    payload.storage?.database ?? (provider === 'kick' ? 'vl_kick_hot' : 'vl_twitch_hot'),
  ]
  cells.forEach((node, index) => { node.textContent = values[index] ?? '—' })
}

function renderFeatures(payload: StatusPayload): void {
  const body = document.querySelector<HTMLTableSectionElement>('.metric-ledger tbody')
  if (!body) return
  const features = Array.isArray(payload.features) ? payload.features : []
  if (features.length === 0) {
    body.innerHTML = '<tr><td colspan="6">No feature status rows are available yet.</td></tr>'
    return
  }
  body.innerHTML = features.map((feature) => `
    <tr>
      <td><a class="text-link" href="${escapeAttr(feature.pagePath ?? '#')}">${escapeHtml(feature.label ?? 'Feature')}</a></td>
      <td>${escapeHtml(feature.role ?? '—')}</td>
      <td class="${stateClass(feature.state)}">${escapeHtml(label(feature.state ?? 'unknown'))}</td>
      <td>${escapeHtml(time(feature.lastUpdatedAt))}</td>
      <td>${escapeHtml(label(feature.source ?? payload.sourceMode ?? 'api'))}</td>
      <td>${escapeHtml(feature.knownGap ?? '—')}</td>
    </tr>`).join('')
}

function renderError(message: string): void {
  document.querySelectorAll<HTMLElement>('.head-facts .fact strong').forEach((node, index) => { if (index === 0) node.textContent = 'Error' })
  const body = document.querySelector<HTMLTableSectionElement>('.metric-ledger tbody')
  if (body) body.innerHTML = `<tr><td colspan="6">Status API unavailable: ${escapeHtml(message)}</td></tr>`
}

function cadence(payload: StatusPayload): string {
  const seconds = value(payload.collector, 'runCadenceSeconds')
  if (typeof seconds === 'number' && seconds > 0) return seconds >= 60 ? `${Math.round(seconds / 60)} minutes` : `${seconds} seconds`
  return '5 minutes'
}

function coverage(payload: StatusPayload): string {
  const observed = value(payload.coverage, 'observedCount') ?? value(payload.latestSnapshot, 'observedCount') ?? value(payload.latestSnapshot, 'streamCount')
  const mode = value(payload.coverage, 'mode') ?? value(payload.latestSnapshot, 'coverageMode')
  const prefix = observed == null ? '' : `${count(observed)} observed`
  return [prefix, typeof mode === 'string' ? mode : ''].filter(Boolean).join(' · ') || '—'
}

function value(source: Record<string, unknown> | undefined, key: string): unknown {
  return source ? source[key] : undefined
}

function count(input: unknown): string {
  if (typeof input === 'number' && Number.isFinite(input)) return input.toLocaleString('en-US')
  if (typeof input === 'string' && input.trim()) return input
  return '—'
}

function time(input: unknown): string {
  if (typeof input !== 'string' || !input) return '—'
  const parsed = new Date(input)
  if (Number.isNaN(parsed.getTime())) return input
  return parsed.toISOString().slice(0, 16).replace('T', ' ') + ' UTC'
}

function label(input: string): string {
  return input.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

function stateClass(input: string | undefined): string {
  const state = String(input ?? '').toLowerCase()
  return state === 'fresh' || state === 'live' || state === 'partial' ? 'up' : state === 'error' || state === 'unconfigured' ? 'down' : ''
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function escapeAttr(value: string): string {
  return escapeHtml(value).replace(/'/g, '&#39;')
}
