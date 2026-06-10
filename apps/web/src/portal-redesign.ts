import './portal-mock.css'
import { getDataStateLabel, normalizeDataState } from './shared/data-state'

type Provider = 'twitch' | 'kick'
type HeatmapItem = { id?: string; name?: string; viewers?: number; momentum?: number }
type PortalData = {
  provider: Provider
  state: string
  observed: number | null
  largest: HeatmapItem | null
  riser: HeatmapItem | null
  updatedAt: string | null
  coverage: string
}

if (document.body.dataset.page === 'portal') mountPortal()

function mountPortal(): void {
  const main = document.querySelector<HTMLElement>('main')
  if (!main) return

  main.className = 'page'
  main.innerHTML = `
    <div class="breadcrumb">ViewLoom / Portal</div>
    <section class="page-head">
      <div>
        <div class="kicker">Live-stream data, separated by platform</div>
        <h1>Observe the field.<br>Then follow the movement.</h1>
        <p class="lede">A restrained observation interface for Twitch and Kick. No mixed totals, no simulated completeness, no marketing dashboard.</p>
      </div>
      <div class="head-facts" aria-label="ViewLoom collection facts">
        <div class="fact"><small>Cadence</small><strong>5 minutes</strong></div>
        <div class="fact"><small>History</small><strong>180 days</strong></div>
        <div class="fact"><small>Twitch set</small><strong>Top 300</strong></div>
        <div class="fact"><small>Kick set</small><strong>Top 100</strong></div>
      </div>
    </section>

    <div class="portal-grid">
      ${providerPanel('twitch')}
      ${providerPanel('kick')}
    </div>

    <div class="rule-title">
      <h2>Current observations</h2>
      <span>Across both independent data views</span>
    </div>
    <div class="signal-list" id="portal-signals" aria-live="polite">
      <div class="signal"><time>—</time><strong>Loading Twitch observation.</strong><span>Status</span></div>
      <div class="signal"><time>—</time><strong>Loading Kick observation.</strong><span>Status</span></div>
      <div class="signal"><time>—</time><strong>Checking collector state.</strong><span>Status</span></div>
    </div>
  `

  void hydratePortal()
}

function providerPanel(provider: Provider): string {
  const label = provider === 'twitch' ? 'Twitch' : 'Kick'
  const description = provider === 'twitch'
    ? 'Read the current field, the shape of a day, live rivalries, and observed history from the Twitch collector.'
    : 'The same reading grammar, a separate collector, and provider-specific coverage notes.'

  return `
    <section class="portal-panel portal-panel--${provider}">
      <div>
        <div class="kicker">${label} data</div>
        <h2>${label}</h2>
        <p>${description}</p>
      </div>
      <div>
        <div class="portal-panel__stats">
          <div><small>Live now</small><strong id="portal-${provider}-live">—</strong></div>
          <div><small>Largest</small><strong id="portal-${provider}-largest">—</strong></div>
          <div><small>Updated</small><strong id="portal-${provider}-updated">—</strong></div>
        </div>
        <p><a class="button" href="/${provider}/">Open ${label} data</a></p>
      </div>
    </section>
  `
}

async function hydratePortal(): Promise<void> {
  const [twitch, kick] = await Promise.all([loadProvider('twitch'), loadProvider('kick')])

  for (const data of [twitch, kick]) {
    setText(`portal-${data.provider}-live`, formatNumber(data.observed))
    setText(`portal-${data.provider}-largest`, data.largest ? formatNumber(data.largest.viewers) : '—')
    setText(`portal-${data.provider}-updated`, formatRelative(data.updatedAt))
  }

  const signals = document.getElementById('portal-signals')
  if (!signals) return
  signals.innerHTML = `${renderSignal(twitch)}${renderSignal(kick)}${renderCollectorSignal(twitch, kick)}`
}

async function loadProvider(provider: Provider): Promise<PortalData> {
  const [statusResult, heatmapResult] = await Promise.allSettled([
    fetchJson(`/api/${provider}-status`),
    fetchJson(`/api/${provider}-heatmap`),
  ])

  const status = statusResult.status === 'fulfilled' ? statusResult.value : null
  const heatmap = heatmapResult.status === 'fulfilled' ? heatmapResult.value : null
  const sourceMode = String(status?.sourceMode ?? status?.source ?? heatmap?.latest?.source_mode ?? 'unknown')
  const state = provider === 'kick' && sourceMode.toLowerCase() === 'fixture'
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
    observed: firstNumber(latest.observedCount, latest.streamCount, latest.stream_count, items.length || null),
    largest,
    riser,
    updatedAt: firstString(
      heatmap?.updatedAt,
      latest.collectedAt,
      latest.bucketMinute,
      latest.collected_at,
      latest.bucket_minute,
      status?.freshness?.lastSuccessAt,
    ),
    coverage: coverageLabel(status?.coverage, heatmap, latest),
  }
}

function renderSignal(data: PortalData): string {
  const label = data.provider === 'twitch' ? 'Twitch' : 'Kick'
  const time = data.updatedAt ? formatUtcTime(data.updatedAt) : '—'

  if (data.riser) {
    const name = escapeHtml(data.riser.name ?? data.riser.id ?? 'Unknown')
    return `<div class="signal"><time>${time}</time><strong>${label} fastest observed rise: ${name}.</strong><span>${formatMomentum(data.riser.momentum)} · ${formatNumber(data.riser.viewers)}</span></div>`
  }

  return `<div class="signal"><time>${time}</time><strong>${label} current observation state: ${escapeHtml(getDataStateLabel(data.state))}.</strong><span>${escapeHtml(data.coverage)}</span></div>`
}

function renderCollectorSignal(twitch: PortalData, kick: PortalData): string {
  const states = [twitch.state, kick.state]
  const allFresh = states.every((state) => state === 'fresh')
  const message = allFresh
    ? 'Both collectors reported fresh data.'
    : 'Collector status includes a limitation or delay.'
  return `<div class="signal"><time>${currentUtcTime()}</time><strong>${message}</strong><span>Status</span></div>`
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

function currentUtcTime(): string {
  const date = new Date()
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
