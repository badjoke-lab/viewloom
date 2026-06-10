import './status-redesign.css'
import {
  applyDataState,
  getDataStateLabel,
  getDataStateNote,
  normalizeDataState,
  type DataState,
} from './shared/data-state'

type Provider = 'twitch' | 'kick'

const page = document.body.dataset.page ?? ''
const provider: Provider | null = page === 'twitch-status' ? 'twitch' : page === 'kick-status' ? 'kick' : null

if (provider) mount(provider)

function mount(current: Provider): void {
  const main = document.querySelector<HTMLElement>('main')
  if (!main) return
  main.className = 'vl-status-main'
  main.innerHTML = renderShell(current)
  document.getElementById('vl-status-refresh')?.addEventListener('click', () => void load(current))
  void load(current)
}

function renderShell(provider: Provider): string {
  const label = provider === 'twitch' ? 'Twitch' : 'Kick'
  return `
    <section class="vl-status-head">
      <div>
        <div class="vl-status-kicker">${label} data · operational status</div>
        <h1>Data Status</h1>
        <p>Collector health, latest observation, source mode, coverage, feature readiness, and known limitations for ViewLoom's ${label} data.</p>
      </div>
      <aside class="vl-status-head__state">
        <div class="vl-data-state" id="vl-status-state" data-state="loading">Loading</div>
        <p id="vl-status-note">Checking the current ${label} data state.</p>
      </aside>
    </section>

    <div class="vl-status-actions">
      <span>Latest provider status response. Values are not inferred when unavailable.</span>
      <button class="vl-status-button" id="vl-status-refresh" type="button">Refresh</button>
    </div>

    <section class="vl-status-ledger" id="vl-status-ledger"></section>

    <div class="vl-status-section-head"><h2>Feature data matrix</h2><span>Current provider routes</span></div>
    <div id="vl-status-features"></div>

    <div class="vl-status-section-head"><h2>Pipeline and limitations</h2><span>Read before using charts</span></div>
    <section class="vl-status-two-col">
      <div><ul class="vl-status-list" id="vl-status-pipeline"></ul></div>
      <div><ul class="vl-status-list" id="vl-status-limitations"></ul></div>
    </section>

    <details class="vl-status-debug">
      <summary>Show raw status response</summary>
      <pre id="vl-status-debug"></pre>
    </details>
  `
}

async function load(provider: Provider): Promise<void> {
  renderLoading()
  try {
    const response = await fetch(`/api/${provider}-status`, { cache: 'no-store' })
    const payload = await response.json()
    if (!response.ok && !payload) throw new Error(`Status request returned ${response.status}`)
    render(provider, payload)
  } catch (error) {
    render(provider, {
      state: 'error',
      sourceMode: 'unknown',
      error: { message: error instanceof Error ? error.message : 'Status request failed.' },
      features: [],
      limitations: ['Status request failed before provider limitations could be loaded.'],
    })
  }
}

function renderLoading(): void {
  const stateEl = document.getElementById('vl-status-state')
  applyDataState(stateEl, 'loading')
  setText('vl-status-state', 'Loading')
  setText('vl-status-note', getDataStateNote('loading'))
  setHtml('vl-status-ledger', ledgerRow('State', 'Loading', 'Checking current provider state.'))
  setHtml('vl-status-features', '<p class="vl-status-row__note">Loading feature matrix.</p>')
  setHtml('vl-status-pipeline', '<li>Loading pipeline details.</li>')
  setHtml('vl-status-limitations', '<li>Loading limitations.</li>')
  setText('vl-status-debug', '')
}

function render(provider: Provider, payload: any): void {
  const sourceMode = String(payload?.sourceMode ?? payload?.source ?? 'unknown')
  const state = normalizeProviderState(provider, payload?.state, sourceMode)
  const stateEl = document.getElementById('vl-status-state')
  applyDataState(stateEl, state)
  setText('vl-status-state', `${getDataStateLabel(state)} · ${sourceMode}`)
  setText('vl-status-note', payload?.error?.message ? String(payload.error.message) : providerNote(provider, state, sourceMode))

  const latest = payload?.latestSnapshot ?? {}
  const freshness = payload?.freshness ?? {}
  const collector = payload?.collector ?? {}
  const coverage = payload?.coverage ?? {}
  const storage = payload?.storage ?? {}

  const rows = [
    ledgerRow('Current state', getDataStateLabel(state), providerNote(provider, state, sourceMode)),
    ledgerRow('Source mode', sourceMode, sourceModeNote(provider, sourceMode)),
    ledgerRow('Last success', value(freshness.lastSuccessAt ?? collector.lastSuccessAt ?? latest.collectedAt), minutesNote(freshness.minutesSinceSuccess)),
    ledgerRow('Latest bucket', value(latest.bucketMinute ?? latest.bucket_minute), 'Most recent observed bucket returned by the provider status API.'),
    ledgerRow('Observed streams', value(latest.observedCount ?? latest.streamCount ?? latest.stream_count), 'Latest observed stream count when available.'),
    ledgerRow('Observed viewers', value(latest.totalViewers ?? latest.total_viewers), 'Latest total viewers across the observed provider snapshot when available.'),
    ledgerRow('Coverage', coverageValue(coverage, latest), coverageNote(coverage, latest)),
    ledgerRow('Storage', storageValue(storage, provider), 'Provider-specific D1 storage and bindings remain separate.'),
  ]
  setHtml('vl-status-ledger', rows.join(''))
  setHtml('vl-status-features', renderFeatures(payload?.features ?? [], provider))
  setHtml('vl-status-pipeline', renderPipeline(payload))
  setHtml('vl-status-limitations', renderLimitations(payload?.limitations, payload?.notes))
  setText('vl-status-debug', JSON.stringify(payload, null, 2))
}

function ledgerRow(label: string, valueText: string, note: string): string {
  return `<div class="vl-status-row"><div class="vl-status-row__label">${escapeHtml(label)}</div><div class="vl-status-row__value">${escapeHtml(valueText)}</div><div class="vl-status-row__note">${escapeHtml(note)}</div></div>`
}

function renderFeatures(features: any[], provider: Provider): string {
  const rows = Array.isArray(features) ? features : []
  if (!rows.length) return '<p class="vl-status-row__note">No feature rows were returned.</p>'
  return `<table class="vl-status-table"><thead><tr><th>Feature</th><th>State</th><th>Source</th><th>Known gap</th><th>Route</th></tr></thead><tbody>${rows.map((feature) => {
    const state = normalizeDataState(feature?.state)
    const route = String(feature?.pagePath ?? `/${provider}/`)
    return `<tr data-state="${state.replace('_', '-')}"><td>${escapeHtml(String(feature?.label ?? feature?.role ?? 'Feature'))}</td><td>${escapeHtml(getDataStateLabel(state))}</td><td>${escapeHtml(value(feature?.source))}</td><td>${escapeHtml(value(feature?.knownGap))}</td><td><a href="${escapeAttr(route)}">Open</a></td></tr>`
  }).join('')}</tbody></table>`
}

function renderPipeline(payload: any): string {
  const steps = [
    ['Collector', value(payload?.collector?.status ?? payload?.state)],
    ['Minute snapshots', value(payload?.latestSnapshot?.bucketMinute ?? payload?.latestSnapshot?.bucket_minute)],
    ['Feature APIs', Array.isArray(payload?.features) ? `${payload.features.length} reported routes` : '—'],
    ['Public pages', 'Provider views read the normalized API output'],
  ]
  return steps.map(([label, detail]) => `<li><strong>${escapeHtml(label)}</strong><br>${escapeHtml(detail)}</li>`).join('')
}

function renderLimitations(limitations: unknown, notes: unknown): string {
  const items = [
    ...(Array.isArray(limitations) ? limitations : []),
    ...(Array.isArray(notes) ? notes : []),
  ]
  if (!items.length) return '<li>No explicit limitations or notes were returned.</li>'
  return items.map((item) => `<li>${escapeHtml(String(item))}</li>`).join('')
}

function normalizeProviderState(provider: Provider, raw: unknown, sourceMode: string): DataState {
  if (provider === 'kick' && sourceMode.toLowerCase() === 'fixture') return 'demo'
  return normalizeDataState(raw)
}

function providerNote(provider: Provider, state: DataState, sourceMode: string): string {
  if (provider === 'kick') {
    const mode = sourceMode.toLowerCase()
    if (mode === 'fixture') return 'Fixture rows are shown and must not be interpreted as current live production data.'
    if (mode === 'public-channel-fallback') return 'Observed rows come from the public channel fallback and configured seed slugs.'
    if (mode === 'empty-public-channel-fallback') return 'The public fallback ran but returned no qualifying observed channels.'
    if (mode === 'authenticated') return 'Observed rows are marked as authenticated provider data.'
  }
  return getDataStateNote(state)
}

function sourceModeNote(provider: Provider, sourceMode: string): string {
  if (provider === 'kick') return providerNote(provider, normalizeProviderState(provider, 'fresh', sourceMode), sourceMode)
  return 'Twitch source mode returned by the current collector and status pipeline.'
}

function coverageValue(coverage: any, latest: any): string {
  const state = coverage?.state ? getDataStateLabel(coverage.state) : ''
  const pages = latest?.coveredPages ?? latest?.covered_pages
  const hasMore = coverage?.hasMore ?? latest?.hasMore ?? latest?.has_more
  if (pages != null) return `${state || 'Observed'} · ${pages} pages${Boolean(hasMore) ? '+' : ''}`
  if (state) return state
  if (hasMore != null) return Boolean(hasMore) ? 'Partial' : 'Observed window'
  return '—'
}

function coverageNote(coverage: any, latest: any): string {
  const limit = coverage?.topLimit ?? latest?.topLimit
  const hasMore = coverage?.hasMore ?? latest?.hasMore ?? latest?.has_more
  if (limit != null) return `Collection limit: ${limit}. Additional records: ${Boolean(hasMore) ? 'yes' : 'no'}.`
  return 'Coverage reflects only the provider records returned by the current observation pipeline.'
}

function storageValue(storage: any, provider: Provider): string {
  const explicit = storage?.binding ?? storage?.database ?? storage?.name
  if (explicit) return String(explicit)
  return provider === 'twitch' ? 'DB_TWITCH_HOT' : 'DB_KICK_HOT'
}

function minutesNote(valueInput: unknown): string {
  const number = Number(valueInput)
  return Number.isFinite(number) ? `${Math.max(0, Math.round(number))} minutes since the last successful collection.` : 'Age since last success was not returned.'
}

function value(input: unknown): string {
  if (input == null || input === '') return '—'
  if (typeof input === 'number' && Number.isFinite(input)) return Math.round(input).toLocaleString('en-US')
  return String(input)
}

function setText(id: string, valueText: string): void {
  const element = document.getElementById(id)
  if (element) element.textContent = valueText
}

function setHtml(id: string, html: string): void {
  const element = document.getElementById(id)
  if (element) element.innerHTML = html
}

function escapeHtml(valueText: string): string {
  const span = document.createElement('span')
  span.textContent = valueText
  return span.innerHTML
}

function escapeAttr(valueText: string): string {
  return escapeHtml(valueText).replace(/"/g, '&quot;')
}
