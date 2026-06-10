import './provider-home-redesign.css'
import {
  applyDataState,
  getDataStateLabel,
  getDataStateNote,
  normalizeDataState,
  type DataState,
} from './shared/data-state'

type Provider = 'twitch' | 'kick'

type HeatmapItem = {
  id?: string
  name?: string
  title?: string
  viewers?: number
  momentum?: number
  url?: string
}

type ProviderHomeData = {
  provider: Provider
  state: DataState
  sourceMode: string
  coverage: string
  observedCount: number | null
  totalViewers: number | null
  updatedAt: string | null
  largest: HeatmapItem | null
  riser: HeatmapItem | null
  note: string
}

const page = document.body.dataset.page
if (page === 'twitch' || page === 'kick') {
  mountProviderHome(page)
}

function mountProviderHome(provider: Provider): void {
  const main = document.querySelector<HTMLElement>('main')
  if (!main) return

  main.className = 'vl-provider-home'
  main.innerHTML = renderHome(provider)
  void hydrate(provider)
}

function renderHome(provider: Provider): string {
  const label = providerLabel(provider)
  return `
    <section class="vl-provider-home__head">
      <div>
        <div class="vl-provider-home__kicker">${label} data · unofficial observation</div>
        <h1>Read ${label} through four fixed views.</h1>
        <p class="vl-provider-home__lede">
          Start with the current field, follow the shape of the day, inspect live rivalries, or review observed history. Coverage and source limitations remain visible.
        </p>
      </div>
      <aside class="vl-provider-home__status">
        <div class="vl-data-state" id="provider-home-state" data-state="loading">Loading</div>
        <p id="provider-home-note">Checking the current ${label} observation state.</p>
      </aside>
    </section>

    <section class="vl-provider-home__metrics" aria-label="Current ${label} observation summary">
      ${metric('Observed streams', 'provider-home-observed')}
      ${metric('Observed viewers', 'provider-home-viewers')}
      ${metric('Largest live stream', 'provider-home-largest')}
      ${metric('Last update', 'provider-home-updated')}
    </section>

    <section class="vl-provider-home__section-head">
      <h2>Open a view</h2>
      <span>Now / Today / Rivalry / Trends</span>
    </section>
    <section class="vl-feature-ledger" aria-label="${label} data views">
      ${featureRow(provider, 'Now', 'Heatmap', 'Read the current observed field by viewer size, momentum, and available activity signals.', 'heatmap')}
      ${featureRow(provider, 'Today', 'Day Flow', 'Read audience volume and share across the observed day, with time focus and selected-stream detail.', 'day-flow')}
      ${featureRow(provider, 'Rivalry', 'Battle Lines', 'Inspect primary battles, reversals, viewer gaps, selected time, and contextual competitors.', 'battle-lines')}
      ${featureRow(provider, 'Trends', 'History & Trends', 'Review observed days, viewer-minutes, peaks, top streamers, and coverage over time.', 'history')}
    </section>

    <section class="vl-provider-home__section-head">
      <h2>Current movement</h2>
      <span>Latest observed Heatmap snapshot</span>
    </section>
    <div class="vl-feature-ledger">
      <div class="vl-feature-ledger__row">
        <div class="vl-feature-ledger__role">Largest</div>
        <div><h3 id="provider-home-largest-name">—</h3><p id="provider-home-largest-detail">No current stream detail loaded.</p></div>
        <a class="vl-provider-home__button" id="provider-home-largest-link" href="/${provider}/heatmap/">Open Heatmap</a>
      </div>
      <div class="vl-feature-ledger__row">
        <div class="vl-feature-ledger__role">Rising</div>
        <div><h3 id="provider-home-riser-name">—</h3><p id="provider-home-riser-detail">No positive movement loaded.</p></div>
        <a class="vl-provider-home__button" href="/${provider}/battle-lines/">Open Battle Lines</a>
      </div>
    </div>

    <p class="vl-provider-home__footnote">
      Source mode: <strong id="provider-home-source">—</strong> · Coverage: <strong id="provider-home-coverage">—</strong> ·
      <a href="/${provider}/status/">Open ${label} Data Status</a>
    </p>
  `
}

async function hydrate(provider: Provider): Promise<void> {
  const [statusResult, heatmapResult] = await Promise.allSettled([
    fetchJson(`/api/${provider}-status`),
    fetchJson(`/api/${provider}-heatmap`),
  ])

  const statusPayload = statusResult.status === 'fulfilled' ? statusResult.value : null
  const heatmapPayload = heatmapResult.status === 'fulfilled' ? heatmapResult.value : null

  if (!statusPayload && !heatmapPayload) {
    renderData({
      provider,
      state: 'error',
      sourceMode: 'unknown',
      coverage: 'Unavailable',
      observedCount: null,
      totalViewers: null,
      updatedAt: null,
      largest: null,
      riser: null,
      note: 'Provider status and Heatmap requests both failed.',
    })
    return
  }

  renderData(normalize(provider, statusPayload, heatmapPayload))
}

async function fetchJson(url: string): Promise<any> {
  const response = await fetch(url, { cache: 'no-store' })
  if (!response.ok) throw new Error(`${url} returned ${response.status}`)
  return response.json()
}

function normalize(provider: Provider, status: any, heatmap: any): ProviderHomeData {
  const statusSource = String(status?.sourceMode ?? status?.source ?? '')
  const heatmapSource = String(heatmap?.latest?.source_mode ?? heatmap?.sourceMode ?? heatmap?.source ?? '')
  const sourceMode = statusSource || heatmapSource || 'unknown'
  const rawState = status?.state ?? heatmap?.state ?? heatmap?.status
  const state = provider === 'kick' && sourceMode.toLowerCase() === 'fixture'
    ? normalizeDataState('demo')
    : normalizeDataState(rawState)

  const items = normalizeItems(heatmap?.items)
  const latest = status?.latestSnapshot ?? heatmap?.latest ?? {}
  const freshness = status?.freshness ?? {}
  const coverageObject = status?.coverage ?? {}
  const observedCount = firstFinite(
    latest.observedCount,
    latest.streamCount,
    heatmap?.latest?.stream_count,
    items.length > 0 ? items.length : null,
  )
  const totalViewers = firstFinite(
    latest.totalViewers,
    heatmap?.latest?.total_viewers,
    items.length > 0 ? items.reduce((sum, item) => sum + finite(item.viewers), 0) : null,
  )
  const updatedAt = firstString(
    heatmap?.updatedAt,
    latest.collectedAt,
    latest.bucketMinute,
    freshness.lastSuccessAt,
    heatmap?.latest?.collected_at,
    heatmap?.latest?.bucket_minute,
  )
  const sortedByViewers = [...items].sort((a, b) => finite(b.viewers) - finite(a.viewers))
  const sortedByMomentum = [...items]
    .filter((item) => finite(item.momentum) > 0)
    .sort((a, b) => finite(b.momentum) - finite(a.momentum))
  const largest = sortedByViewers[0] ?? null
  const riser = sortedByMomentum[0] ?? null
  const coverage = coverageText(coverageObject, heatmap, latest)
  const note = status?.error?.message
    ? String(status.error.message)
    : providerNote(provider, state, sourceMode)

  return {
    provider,
    state,
    sourceMode,
    coverage,
    observedCount,
    totalViewers,
    updatedAt,
    largest,
    riser,
    note,
  }
}

function renderData(data: ProviderHomeData): void {
  const stateElement = document.getElementById('provider-home-state')
  applyDataState(stateElement, data.state)
  setText('provider-home-state', `${getDataStateLabel(data.state)} · ${data.sourceMode}`)
  setText('provider-home-note', data.note)
  setText('provider-home-observed', formatNumber(data.observedCount))
  setText('provider-home-viewers', formatNumber(data.totalViewers))
  setText('provider-home-largest', data.largest ? `${data.largest.name ?? data.largest.id ?? 'Unknown'} · ${formatNumber(data.largest.viewers)}` : '—')
  setText('provider-home-updated', data.updatedAt ? relativeTime(data.updatedAt) : '—')
  setText('provider-home-source', data.sourceMode)
  setText('provider-home-coverage', data.coverage)

  renderStream('largest', data.largest, 'No qualifying stream was returned by the latest Heatmap snapshot.')
  renderStream('riser', data.riser, 'No positive momentum was returned by the latest Heatmap snapshot.')
}

function renderStream(kind: 'largest' | 'riser', item: HeatmapItem | null, emptyText: string): void {
  setText(`provider-home-${kind}-name`, item?.name ?? item?.id ?? '—')
  if (!item) {
    setText(`provider-home-${kind}-detail`, emptyText)
    return
  }

  const viewers = formatNumber(item.viewers)
  const movement = kind === 'riser' ? ` · momentum ${formatMomentum(item.momentum)}` : ''
  const title = item.title ? ` · ${item.title}` : ''
  setText(`provider-home-${kind}-detail`, `${viewers} viewers${movement}${title}`)

  if (kind === 'largest' && item.url) {
    const link = document.getElementById('provider-home-largest-link') as HTMLAnchorElement | null
    if (link) {
      link.href = item.url
      link.target = '_blank'
      link.rel = 'noreferrer'
      link.textContent = 'Open stream'
    }
  }
}

function metric(label: string, id: string): string {
  return `<div class="vl-provider-home__metric"><small>${label}</small><strong id="${id}">—</strong></div>`
}

function featureRow(provider: Provider, role: string, title: string, description: string, slug: string): string {
  return `
    <article class="vl-feature-ledger__row">
      <div class="vl-feature-ledger__role">${role}</div>
      <div><h3>${title}</h3><p>${description}</p></div>
      <a class="vl-provider-home__button" href="/${provider}/${slug}/">Open</a>
    </article>
  `
}

function providerLabel(provider: Provider): string {
  return provider === 'twitch' ? 'Twitch' : 'Kick'
}

function providerNote(provider: Provider, state: DataState, sourceMode: string): string {
  if (provider === 'kick') {
    const mode = sourceMode.toLowerCase()
    if (mode === 'fixture') return 'Fixture rows are shown and must not be read as current live production data.'
    if (mode === 'public-channel-fallback') return 'Observed data comes from the public channel fallback and configured seed slugs.'
    if (mode === 'authenticated') return 'Observed data is marked as authenticated provider data.'
  }
  return getDataStateNote(state)
}

function coverageText(coverage: any, heatmap: any, latest: any): string {
  const mode = firstString(heatmap?.coverageMode, coverage?.mode)
  const limit = firstFinite(coverage?.topLimit, latest?.topLimit)
  const hasMore = coverage?.hasMore ?? latest?.hasMore ?? heatmap?.latest?.has_more

  if (limit != null && Boolean(hasMore)) return `Top ${limit}+`
  if (limit != null) return `Top ${limit}`
  if (mode) return mode.replace(/-/g, ' ')
  if (Boolean(hasMore)) return 'Partial observed window'
  return 'Observed window'
}

function normalizeItems(value: unknown): HeatmapItem[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is HeatmapItem => typeof item === 'object' && item !== null)
}

function firstFinite(...values: unknown[]): number | null {
  for (const value of values) {
    if (value == null || value === '') continue
    const number = typeof value === 'number' ? value : Number(value)
    if (Number.isFinite(number)) return number
  }
  return null
}

function firstString(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return null
}

function finite(value: unknown): number {
  const number = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(number) ? number : 0
}

function formatNumber(value: unknown): string {
  const number = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(number) ? Math.round(number).toLocaleString('en-US') : '—'
}

function formatMomentum(value: unknown): string {
  const number = finite(value)
  const percent = Math.abs(number) <= 3 ? number * 100 : number
  return `${percent >= 0 ? '+' : ''}${percent.toFixed(Math.abs(percent) >= 10 ? 0 : 1)}%`
}

function relativeTime(value: string): string {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  const minutes = Math.max(0, Math.floor((Date.now() - parsed.getTime()) / 60_000))
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return parsed.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function setText(id: string, value: string): void {
  const element = document.getElementById(id)
  if (element) element.textContent = value
}
