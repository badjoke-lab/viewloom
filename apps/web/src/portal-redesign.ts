import './portal-redesign.css'
import {
  applyDataState,
  getDataStateLabel,
  getDataStateNote,
  normalizeDataState,
  type DataState,
} from './shared/data-state'

type Provider = 'twitch' | 'kick'

type ProviderStatus = {
  provider: Provider
  state: DataState
  sourceMode: string
  observedCount: number | null
  updatedAt: string | null
  coverage: string
  note: string
}

if (document.body.dataset.page === 'portal') {
  mountPortal()
}

function mountPortal(): void {
  const main = document.querySelector<HTMLElement>('main')
  if (!main) return

  main.className = 'vl-portal-main'
  main.innerHTML = renderPortal()

  void hydrateProvider('twitch')
  void hydrateProvider('kick')
}

function renderPortal(): string {
  return `
    <section class="vl-portal-head">
      <div>
        <div class="vl-portal-kicker">Live-stream data, separated by platform</div>
        <h1>Observe the field.<br>Then follow the movement.</h1>
        <p class="vl-portal-lede">
          ViewLoom reads Twitch and Kick through separate observation surfaces. Open the current field, the shape of a day, live rivalries, or observed history without mixing provider totals.
        </p>
      </div>
      <div class="vl-portal-principles" aria-label="ViewLoom reading model">
        <div><small>Collection</small><strong>Five-minute observation cadence</strong></div>
        <div><small>Structure</small><strong>Separate Twitch and Kick views</strong></div>
        <div><small>Core views</small><strong>Now / Today / Rivalry / Trends</strong></div>
        <div><small>Data policy</small><strong>Coverage and stale states remain visible</strong></div>
      </div>
    </section>

    <section class="vl-provider-grid" aria-label="Provider data views">
      ${renderProviderPanel('twitch')}
      ${renderProviderPanel('kick')}
    </section>

    <section class="vl-portal-section-head">
      <h2>Current observations</h2>
      <span>Provider status responses</span>
    </section>
    <div class="vl-observation-list" id="portal-observations" aria-live="polite">
      ${renderObservationLoading('twitch')}
      ${renderObservationLoading('kick')}
    </div>
  `
}

function renderProviderPanel(provider: Provider): string {
  const label = provider === 'twitch' ? 'Twitch' : 'Kick'
  return `
    <article class="vl-provider-panel vl-provider-panel--${provider}">
      <div>
        <div class="vl-provider-label">${label} data</div>
        <h2>${label}</h2>
        <p>${providerDescription(provider)}</p>
      </div>
      <div>
        <div class="vl-provider-state">
          <div class="vl-data-state" id="${provider}-portal-state" data-state="loading">Loading</div>
          <p class="vl-provider-note vl-data-state-note" id="${provider}-portal-note">Checking the current provider data state.</p>
        </div>
        <div class="vl-provider-stats">
          <div class="vl-provider-stat"><small>Observed</small><strong id="${provider}-portal-observed">—</strong></div>
          <div class="vl-provider-stat"><small>Updated</small><strong id="${provider}-portal-updated">—</strong></div>
          <div class="vl-provider-stat"><small>Coverage</small><strong id="${provider}-portal-coverage">—</strong></div>
        </div>
        <div class="vl-provider-actions">
          <a class="vl-portal-button vl-portal-button--primary" href="/${provider}/">Open ${label} data</a>
          <a class="vl-portal-button" href="/${provider}/status/">Data Status</a>
        </div>
      </div>
    </article>
  `
}

async function hydrateProvider(provider: Provider): Promise<void> {
  try {
    const response = await fetch(`/api/${provider}-status`, { cache: 'no-store' })
    if (!response.ok) throw new Error(`Status request returned ${response.status}`)
    const payload = await response.json()
    updateProvider(normalizeStatus(provider, payload))
  } catch (error) {
    updateProvider({
      provider,
      state: 'error',
      sourceMode: 'unknown',
      observedCount: null,
      updatedAt: null,
      coverage: 'Unavailable',
      note: error instanceof Error ? error.message : 'Status request failed.',
    })
  }
}

function normalizeStatus(provider: Provider, payload: any): ProviderStatus {
  const sourceMode = String(payload?.sourceMode ?? payload?.source ?? 'unknown')
  const state = provider === 'kick' && sourceMode.toLowerCase() === 'fixture'
    ? normalizeDataState('demo')
    : normalizeDataState(payload?.state)
  const latest = payload?.latestSnapshot ?? {}
  const freshness = payload?.freshness ?? {}
  const coverage = payload?.coverage ?? {}
  const observedCount = toFiniteNumber(latest.observedCount ?? latest.streamCount)
  const updatedAt = stringOrNull(latest.collectedAt ?? latest.bucketMinute ?? freshness.lastSuccessAt)
  const coverageText = coverageLabel(coverage, latest)
  const note = payload?.error?.message
    ? String(payload.error.message)
    : providerNote(provider, state, sourceMode)

  return {
    provider,
    state,
    sourceMode,
    observedCount,
    updatedAt,
    coverage: coverageText,
    note,
  }
}

function updateProvider(status: ProviderStatus): void {
  const stateElement = document.getElementById(`${status.provider}-portal-state`)
  applyDataState(stateElement, status.state)
  setText(`${status.provider}-portal-state`, `${getDataStateLabel(status.state)} · ${status.sourceMode}`)
  setText(`${status.provider}-portal-note`, status.note)
  setText(`${status.provider}-portal-observed`, status.observedCount == null ? '—' : status.observedCount.toLocaleString('en-US'))
  setText(`${status.provider}-portal-updated`, status.updatedAt ? formatUpdated(status.updatedAt) : '—')
  setText(`${status.provider}-portal-coverage`, status.coverage)
  replaceObservation(status)
}

function replaceObservation(status: ProviderStatus): void {
  const existing = document.querySelector<HTMLElement>(`[data-portal-observation="${status.provider}"]`)
  if (!existing) return
  const providerLabel = status.provider === 'twitch' ? 'Twitch' : 'Kick'
  existing.dataset.state = status.state.replace('_', '-')
  existing.innerHTML = `
    <small>${providerLabel}</small>
    <strong>${escapeHtml(status.note)}</strong>
    <span>${escapeHtml(observationMeta(status))}</span>
  `
}

function renderObservationLoading(provider: Provider): string {
  const providerLabel = provider === 'twitch' ? 'Twitch' : 'Kick'
  return `
    <div class="vl-observation-row" data-portal-observation="${provider}" data-state="loading">
      <small>${providerLabel}</small>
      <strong>Checking current ${providerLabel} status.</strong>
      <span>Loading</span>
    </div>
  `
}

function observationMeta(status: ProviderStatus): string {
  const observed = status.observedCount == null ? 'observed —' : `observed ${status.observedCount.toLocaleString('en-US')}`
  const updated = status.updatedAt ? `updated ${formatUpdated(status.updatedAt)}` : 'updated —'
  return `${getDataStateLabel(status.state)} · ${observed} · ${updated}`
}

function providerDescription(provider: Provider): string {
  if (provider === 'twitch') {
    return 'Read the current Twitch field, daily audience movement, rivalry changes, and observed history from the Twitch collector.'
  }
  return 'Use the same reading grammar for Kick while keeping source mode, coverage, and provider-specific limitations separate.'
}

function providerNote(provider: Provider, state: DataState, sourceMode: string): string {
  if (provider === 'kick') {
    const mode = sourceMode.toLowerCase()
    if (mode === 'fixture') return 'Fixture rows are shown and must not be interpreted as current live production data.'
    if (mode === 'public-channel-fallback') return 'Observed data comes from the public channel fallback and configured seed slugs.'
    if (mode === 'authenticated') return 'Observed data is marked as authenticated provider data.'
  }
  return getDataStateNote(state)
}

function coverageLabel(coverage: any, latest: any): string {
  const limit = toFiniteNumber(coverage?.topLimit ?? latest?.topLimit)
  const hasMore = coverage?.hasMore ?? latest?.hasMore
  const state = coverage?.state ? getDataStateLabel(coverage.state) : ''

  if (limit != null && hasMore === true) return `Top ${limit}+`
  if (limit != null) return `Top ${limit}`
  if (state) return state
  if (hasMore === true) return 'Partial'
  return 'Observed window'
}

function formatUpdated(value: string): string {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  const diffMs = Date.now() - parsed.getTime()
  const minutes = Math.max(0, Math.floor(diffMs / 60_000))
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return parsed.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function toFiniteNumber(value: unknown): number | null {
  const number = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(number) ? number : null
}

function stringOrNull(value: unknown): string | null {
  if (value == null || value === '') return null
  return String(value)
}

function setText(id: string, value: string): void {
  const element = document.getElementById(id)
  if (element) element.textContent = value
}

function escapeHtml(value: string): string {
  const element = document.createElement('span')
  element.textContent = value
  return element.innerHTML
}
