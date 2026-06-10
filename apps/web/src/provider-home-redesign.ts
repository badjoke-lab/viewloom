import './provider-home-mock.css'
import { getDataStateLabel, normalizeDataState } from './shared/data-state'

type Provider = 'twitch' | 'kick'
type HeatmapItem = { id?: string; name?: string; title?: string; viewers?: number; momentum?: number }
type ProviderData = {
  provider: Provider
  state: string
  source: string
  coverage: string
  observed: number | null
  viewers: number | null
  updatedAt: string | null
  largest: HeatmapItem | null
  riser: HeatmapItem | null
}

const page = document.body.dataset.page
if (page === 'twitch' || page === 'kick') mountProviderHome(page)

function mountProviderHome(provider: Provider): void {
  const main = document.querySelector<HTMLElement>('main')
  if (!main) return

  const label = provider === 'twitch' ? 'Twitch' : 'Kick'
  main.className = 'page'
  main.innerHTML = `
    <div class="breadcrumb">ViewLoom / ${label} data</div>
    <section class="page-head">
      <div>
        <div class="kicker">${label.toUpperCase()} DATA</div>
        <h1>${label}, observed as a moving field.</h1>
        <p class="lede">Current live scale, daily audience terrain, rivalry movement, and historical trends. Each view answers a different question.</p>
      </div>
      <div class="head-facts">
        <div class="fact"><small>Live now</small><strong id="home-live">—</strong></div>
        <div class="fact"><small>Largest stream</small><strong id="home-largest">—</strong></div>
        <div class="fact"><small>Observed viewers</small><strong id="home-viewers">—</strong></div>
        <div class="fact"><small>Updated</small><strong id="home-updated">—</strong></div>
      </div>
    </section>

    <div class="data-strip">
      <div class="data-strip__title">${label} observation</div>
      <div class="data-strip__cell"><small>Updated</small><span id="strip-updated">—</span></div>
      <div class="data-strip__cell"><small>Observed</small><span id="strip-observed">—</span></div>
      <div class="data-strip__cell"><small>Coverage</small><span id="strip-coverage">—</span></div>
      <div class="data-strip__cell"><small>Source</small><span id="strip-source">—</span></div>
    </div>

    <div class="provider-overview">
      <section>
        <div class="rule-title"><h2>Now</h2><span>Latest observed snapshot</span></div>
        <div class="surface surface--dark">
          <div class="surface__head"><strong>Current field summary</strong><small id="field-time">—</small></div>
          <div class="surface__body">
            <svg viewBox="0 0 900 290" role="img" aria-label="Current field summary">
              <rect width="900" height="290" fill="#07101d"/>
              <path d="M0 235 C90 210 110 205 190 190 S320 165 410 178 S540 135 630 145 S760 80 900 100" fill="none" stroke="#eef4ff" stroke-width="2"/>
              <path d="M0 250 C100 244 180 235 250 230 S380 214 450 219 S570 188 650 197 S790 150 900 168" fill="none" stroke="var(--vl-color-accent)" stroke-width="5"/>
              <text x="24" y="38" fill="#9fb0ca" font-family="monospace" font-size="12">OBSERVED LIVE AUDIENCE · LATEST SNAPSHOT</text>
              <text id="field-total" x="24" y="75" fill="#eef4ff" font-family="Inter,ui-sans-serif,system-ui,sans-serif" font-size="34">—</text>
            </svg>
          </div>
        </div>
      </section>
      <aside>
        <div class="rule-title"><h2>What changed</h2><span>Latest signals</span></div>
        <div class="signal-list" id="home-signals"><div class="signal"><time>—</time><strong>Loading observation.</strong><span>Status</span></div></div>
      </aside>
    </div>

    <div class="rule-title"><h2>Read the data</h2><span>Four separate views</span></div>
    <div class="feature-directory">
      ${feature(provider, '01 / NOW', 'Heatmap', 'Who is large, rising, or fading in the latest snapshot.', 'heatmap')}
      ${feature(provider, '02 / TODAY', 'Day Flow', 'How audience ownership and total volume moved through the day.', 'day-flow')}
      ${feature(provider, '03 / RIVALRY', 'Battle Lines', 'Where two streams closed the gap, reversed, or broke away.', 'battle-lines')}
      ${feature(provider, '04 / TRENDS', 'History', 'What changed across the last 7 or 30 observed days.', 'history')}
    </div>
  `

  void hydrate(provider)
}

async function hydrate(provider: Provider): Promise<void> {
  const data = await loadProvider(provider)
  setText('home-live', formatNumber(data.observed))
  setText('home-largest', data.largest ? formatNumber(data.largest.viewers) : '—')
  setText('home-viewers', formatNumber(data.viewers))
  setText('home-updated', formatRelative(data.updatedAt))
  setText('strip-updated', formatRelative(data.updatedAt))
  setText('strip-observed', data.observed == null ? '—' : `${formatNumber(data.observed)} streams`)
  setText('strip-coverage', data.coverage)
  setText('strip-source', data.source)
  setText('field-time', data.updatedAt ? formatUtcTime(data.updatedAt) : '—')
  setText('field-total', formatNumber(data.viewers))

  const signals = document.getElementById('home-signals')
  if (!signals) return
  signals.innerHTML = `
    <div class="signal"><time>${data.updatedAt ? formatUtcTime(data.updatedAt) : '—'}</time><strong>${data.largest ? `Largest: ${escapeHtml(data.largest.name ?? data.largest.id ?? 'Unknown')}` : 'No largest stream available'}</strong><span>${data.largest ? formatNumber(data.largest.viewers) : '—'}</span></div>
    <div class="signal"><time>${data.updatedAt ? formatUtcTime(data.updatedAt) : '—'}</time><strong>${data.riser ? `Fastest rise: ${escapeHtml(data.riser.name ?? data.riser.id ?? 'Unknown')}` : 'No positive momentum returned'}</strong><span>${data.riser ? formatMomentum(data.riser.momentum) : '—'}</span></div>
    <div class="signal"><time>${data.updatedAt ? formatUtcTime(data.updatedAt) : '—'}</time><strong>Collector state</strong><span>${escapeHtml(getDataStateLabel(data.state))}</span></div>
    <div class="signal"><time>${data.updatedAt ? formatUtcTime(data.updatedAt) : '—'}</time><strong>Coverage</strong><span>${escapeHtml(data.coverage)}</span></div>`
}

async function loadProvider(provider: Provider): Promise<ProviderData> {
  const [statusResult, heatmapResult] = await Promise.allSettled([
    fetchJson(`/api/${provider}-status`),
    fetchJson(`/api/${provider}-heatmap`),
  ])

  const status = statusResult.status === 'fulfilled' ? statusResult.value : null
  const heatmap = heatmapResult.status === 'fulfilled' ? heatmapResult.value : null
  const source = String(status?.sourceMode ?? status?.source ?? heatmap?.latest?.source_mode ?? heatmap?.sourceMode ?? 'unknown')
  const state = provider === 'kick' && source.toLowerCase() === 'fixture'
    ? 'demo'
    : normalizeDataState(status?.state ?? heatmap?.state ?? (status || heatmap ? 'partial' : 'error'))
  const items: HeatmapItem[] = Array.isArray(heatmap?.items) ? heatmap.items : []
  const latest = status?.latestSnapshot ?? heatmap?.latest ?? {}
  const largest = [...items].sort((a, b) => numberValue(b.viewers) - numberValue(a.viewers))[0] ?? null
  const riser = [...items]
    .filter((item) => numberValue(item.momentum) > 0)
    .sort((a, b) => numberValue(b.momentum) - numberValue(a.momentum))[0] ?? null

  return {
    provider,
    state,
    source,
    coverage: coverageLabel(status?.coverage, heatmap, latest),
    observed: firstNumber(latest.observedCount, latest.streamCount, latest.stream_count, items.length || null),
    viewers: firstNumber(
      latest.totalViewers,
      latest.total_viewers,
      items.length ? items.reduce((sum, item) => sum + numberValue(item.viewers), 0) : null,
    ),
    updatedAt: firstString(
      heatmap?.updatedAt,
      latest.collectedAt,
      latest.bucketMinute,
      latest.collected_at,
      latest.bucket_minute,
      status?.freshness?.lastSuccessAt,
    ),
    largest,
    riser,
  }
}

function feature(provider: Provider, number: string, title: string, body: string, slug: string): string {
  return `<a class="feature-item" href="/${provider}/${slug}/"><span class="num">${number}</span><h3>${title}</h3><p>${body}</p></a>`
}

async function fetchJson(url: string): Promise<any> {
  const response = await fetch(url, { cache: 'no-store' })
  if (!response.ok) throw new Error(`${url} returned ${response.status}`)
  return response.json()
}

function coverageLabel(coverage: any, heatmap: any, latest: any): string {
  const limit = firstNumber(coverage?.topLimit, latest?.topLimit)
  const hasMore = coverage?.hasMore ?? latest?.hasMore ?? latest?.has_more
  const mode = firstString(heatmap?.coverageMode, coverage?.mode)
  if (limit != null) return `Top ${formatNumber(limit)}${hasMore ? '+' : ''}`
  if (mode) return mode.replace(/-/g, ' ')
  return hasMore ? 'Partial' : 'Observed window'
}

function formatNumber(value: unknown): string {
  const number = Number(value)
  if (!Number.isFinite(number)) return '—'
  if (Math.abs(number) >= 1_000_000) return `${(number / 1_000_000).toFixed(2)}M`
  if (Math.abs(number) >= 1_000) return `${(number / 1_000).toFixed(number >= 100_000 ? 1 : 2)}K`
  return Math.round(number).toLocaleString('en-US')
}

function formatMomentum(value: unknown): string {
  const raw = numberValue(value)
  const percent = Math.abs(raw) <= 3 ? raw * 100 : raw
  return `${percent >= 0 ? '+' : ''}${percent.toFixed(Math.abs(percent) >= 10 ? 0 : 1)}%`
}

function formatRelative(value: string | null): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  const minutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60_000))
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function formatUtcTime(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return `${String(date.getUTCHours()).padStart(2, '0')}:${String(date.getUTCMinutes()).padStart(2, '0')} UTC`
}

function firstNumber(...values: unknown[]): number | null {
  for (const value of values) {
    if (value == null || value === '') continue
    const number = Number(value)
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

function numberValue(value: unknown): number {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
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
