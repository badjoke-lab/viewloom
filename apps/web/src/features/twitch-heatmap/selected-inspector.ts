import './selected-inspector.css'
import { escapeHtml, formatIso, formatSignedPercent } from './format'
import {
  activityPresentation,
  buildInspectorLinks,
  formatObservationDuration,
  momentumDirection,
  selectedRank,
} from './selected-inspector-core.mjs'
import type { HeatmapItem, TwitchHeatmapApiResponse } from './model'

export type SelectedInspectorProvider = {
  key: 'twitch' | 'kick'
  label: string
  streamUrl: (login: string) => string
}

type StreamContext = {
  ok: boolean
  state?: 'observed' | 'not_observed'
  observedSince?: string | null
  lastObservedAt?: string | null
  observedDurationMinutes?: number | null
  peakViewers?: number | null
  peakAt?: string | null
  sampleCount?: number
  windowTruncated?: boolean
  expectedBucketMinutes?: number
  error?: string
}

type SelectedInspectorInput = {
  item: HeatmapItem
  items: HeatmapItem[]
  latest: NonNullable<TwitchHeatmapApiResponse['latest']>
  response: TwitchHeatmapApiResponse
  provider: SelectedInspectorProvider
}

let requestSerial = 0
const contextCache = new Map<string, { expiresAt: number; value: StreamContext }>()

export function ensureSelectedInspectorShell(): void {
  const stack = document.querySelector<HTMLElement>('#heatmap-inspector .rail-stack')
  if (!stack || stack.querySelector('[data-heatmap-selected-inspector]')) return

  stack.innerHTML = `
    <section class="heatmap-selected-inspector" data-heatmap-selected-inspector aria-live="polite">
      <div class="heatmap-selected-inspector__card">
        <div class="heatmap-selected-inspector__head">
          <div class="heatmap-selected-inspector__identity">
            <div class="heatmap-selected-inspector__eyebrow"><span class="heatmap-selected-inspector__live" id="heatmap-detail-live">Waiting</span><span>Selected stream</span></div>
            <h2 id="heatmap-detail-title">No stream selected</h2>
            <div id="heatmap-detail-login" class="heatmap-selected-inspector__login">—</div>
            <p id="heatmap-detail-body" class="heatmap-selected-inspector__title">Select a tile to inspect its current observed position.</p>
          </div>
          <div id="heatmap-detail-snapshot" class="heatmap-selected-inspector__snapshot">Snapshot —</div>
        </div>
        <div class="heatmap-selected-inspector__metrics">
          ${metric('Viewers', 'heatmap-detail-viewers')}
          ${metric('Observed rank', 'heatmap-detail-rank')}
          ${metric('Observed share', 'heatmap-detail-share')}
          ${metric('Momentum', 'heatmap-detail-momentum', 'heatmap-detail-momentum-note')}
          ${metric('Activity', 'heatmap-detail-activity', 'heatmap-detail-activity-note')}
        </div>
        <div class="heatmap-selected-inspector__observations">
          ${observation('Observed since', 'heatmap-detail-observed-since')}
          ${observation('Observed duration', 'heatmap-detail-observed-duration')}
          ${observation('Latest observed peak', 'heatmap-detail-peak')}
          ${observation('Peak time', 'heatmap-detail-peak-time')}
        </div>
        <p id="heatmap-detail-context-note" class="heatmap-selected-inspector__context-note">Recent observation context has not been loaded.</p>
        <div class="heatmap-selected-inspector__actions">
          <a id="heatmap-detail-link" target="_blank" rel="noreferrer">Open stream</a>
          <a id="heatmap-detail-battle-lines">Open in Battle Lines</a>
          <a id="heatmap-detail-history">Review 7-day history</a>
        </div>
      </div>
    </section>
  `
}

export function renderSelectedInspectorPending(): void {
  requestSerial += 1
  ensureSelectedInspectorShell()
  setText('#heatmap-detail-live', 'Waiting')
  setText('#heatmap-detail-title', 'No stream selected')
  setText('#heatmap-detail-login', '—')
  setText('#heatmap-detail-body', 'Select a tile to inspect its current observed position.')
  setText('#heatmap-detail-snapshot', 'Snapshot —')
  resetValues()
  setText('#heatmap-detail-context-note', 'Recent observation context has not been loaded.')
  clearLink('#heatmap-detail-link', 'Open stream')
  clearLink('#heatmap-detail-battle-lines', 'Open in Battle Lines')
  clearLink('#heatmap-detail-history', 'Review 7-day history')
}

export function renderSelectedInspectorUnavailable(title: string, body: string): void {
  requestSerial += 1
  ensureSelectedInspectorShell()
  setText('#heatmap-detail-live', 'Unavailable')
  setText('#heatmap-detail-title', title)
  setText('#heatmap-detail-login', '—')
  setText('#heatmap-detail-body', body)
  setText('#heatmap-detail-snapshot', 'Snapshot unavailable')
  resetValues()
  setText('#heatmap-detail-context-note', 'No selected-stream context is available for this page state.')
}

export function renderSelectedStreamInspector(input: SelectedInspectorInput): void {
  ensureSelectedInspectorShell()
  const { item, items, latest, response, provider } = input
  const serial = ++requestSerial
  const rank = selectedRank(items, item.channelLogin)
  const share = latest.total_viewers > 0 ? item.viewers / latest.total_viewers : 0
  const direction = momentumDirection(item.momentum)
  const activity = activityPresentation(item)
  const bucketMinutes = response.bucketMinutes ?? response.expectedBucketMinutes ?? 5
  const links = buildInspectorLinks(provider.key, item.channelLogin)
  const streamUrl = item.url || provider.streamUrl(item.channelLogin)

  const root = document.querySelector<HTMLElement>('[data-heatmap-selected-inspector]')
  if (root) root.dataset.streamLogin = item.channelLogin
  setText('#heatmap-detail-live', 'Live')
  setText('#heatmap-detail-title', item.displayName)
  setText('#heatmap-detail-login', `@${item.channelLogin}`)
  setText('#heatmap-detail-body', item.title || `${provider.label} stream observed in the latest Heatmap snapshot.`)
  setText('#heatmap-detail-snapshot', `Snapshot ${formatInstant(latest.collected_at)}`)
  setText('#heatmap-detail-viewers', item.viewers.toLocaleString())
  setText('#heatmap-detail-rank', rank ? `#${rank}` : 'Unavailable')
  setText('#heatmap-detail-share', `${(share * 100).toFixed(2)}%`)
  setText('#heatmap-detail-momentum', formatSignedPercent(item.momentum))
  setText('#heatmap-detail-momentum-note', `${direction} · ${bucketMinutes}m window`)
  setText('#heatmap-detail-activity', activity.value)
  setText('#heatmap-detail-activity-note', activity.note)
  setText('#heatmap-detail-observed-since', 'Loading…')
  setText('#heatmap-detail-observed-duration', 'Loading…')
  setText('#heatmap-detail-peak', 'Loading…')
  setText('#heatmap-detail-peak-time', 'Loading…')
  setText('#heatmap-detail-context-note', 'Reading the current contiguous observation run from stored 5-minute snapshots.')
  setLink('#heatmap-detail-link', streamUrl, `Open on ${provider.label}`)
  setLink('#heatmap-detail-battle-lines', links.battleLines, 'Open in Battle Lines')
  setLink('#heatmap-detail-history', links.history, 'Review 7-day history')

  void loadStreamContext(provider.key, item.channelLogin).then((context) => {
    const current = document.querySelector<HTMLElement>('[data-heatmap-selected-inspector]')?.dataset.streamLogin
    if (serial !== requestSerial || current !== item.channelLogin) return
    renderContext(context, bucketMinutes)
  })
}

async function loadStreamContext(provider: 'twitch' | 'kick', login: string): Promise<StreamContext> {
  const cacheKey = `${provider}:${login}`
  const cached = contextCache.get(cacheKey)
  if (cached && cached.expiresAt > Date.now()) return cached.value

  try {
    const query = new URLSearchParams({ provider, stream: login })
    const response = await fetch(`/api/heatmap-stream-context?${query.toString()}`, {
      headers: { accept: 'application/json' },
      cache: 'no-store',
    })
    const value = await response.json() as StreamContext
    const result = response.ok ? value : { ...value, ok: false }
    contextCache.set(cacheKey, { expiresAt: Date.now() + 60_000, value: result })
    return result
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) }
  }
}

function renderContext(context: StreamContext, fallbackBucketMinutes: number): void {
  if (!context.ok) {
    setUnavailableContext('Recent observation context could not be loaded. Current snapshot values remain valid.')
    return
  }
  if (context.state !== 'observed' || !context.observedSince) {
    setUnavailableContext('This stream is present now, but a contiguous recent observation run was not available.')
    return
  }

  const bucketMinutes = context.expectedBucketMinutes ?? fallbackBucketMinutes
  setText('#heatmap-detail-observed-since', formatInstant(context.observedSince))
  setText('#heatmap-detail-observed-duration', formatObservationDuration(context.observedDurationMinutes ?? null, Boolean(context.windowTruncated), bucketMinutes))
  setText('#heatmap-detail-peak', typeof context.peakViewers === 'number' ? context.peakViewers.toLocaleString() : 'Unavailable')
  setText('#heatmap-detail-peak-time', context.peakAt ? formatInstant(context.peakAt) : 'Unavailable')
  const samples = context.sampleCount ?? 0
  const boundary = context.windowTruncated ? ' The run reaches the 24-hour query boundary.' : ''
  setText('#heatmap-detail-context-note', `Based on ${samples.toLocaleString()} consecutive stored observation sample${samples === 1 ? '' : 's'}.${boundary}`)
}

function setUnavailableContext(note: string): void {
  setText('#heatmap-detail-observed-since', 'Unavailable')
  setText('#heatmap-detail-observed-duration', 'Unavailable')
  setText('#heatmap-detail-peak', 'Unavailable')
  setText('#heatmap-detail-peak-time', 'Unavailable')
  setText('#heatmap-detail-context-note', note)
}

function resetValues(): void {
  for (const selector of [
    '#heatmap-detail-viewers',
    '#heatmap-detail-rank',
    '#heatmap-detail-share',
    '#heatmap-detail-momentum',
    '#heatmap-detail-activity',
    '#heatmap-detail-observed-since',
    '#heatmap-detail-observed-duration',
    '#heatmap-detail-peak',
    '#heatmap-detail-peak-time',
  ]) setText(selector, '—')
  setText('#heatmap-detail-momentum-note', '')
  setText('#heatmap-detail-activity-note', '')
}

function metric(label: string, id: string, noteId?: string): string {
  return `<div class="heatmap-selected-inspector__metric"><small>${escapeHtml(label)}</small><strong id="${id}">—</strong>${noteId ? `<span id="${noteId}"></span>` : ''}</div>`
}

function observation(label: string, id: string): string {
  return `<div class="heatmap-selected-inspector__observation"><small>${escapeHtml(label)}</small><strong id="${id}">—</strong></div>`
}

function formatInstant(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return formatIso(value)
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Local time'
  return `${formatIso(value)} · ${zone}`
}

function setText(selector: string, value: string): void {
  const node = document.querySelector<HTMLElement>(selector)
  if (node) node.textContent = value
}

function setLink(selector: string, href: string, label: string): void {
  const link = document.querySelector<HTMLAnchorElement>(selector)
  if (!link) return
  link.href = href
  link.textContent = label
  link.removeAttribute('aria-disabled')
}

function clearLink(selector: string, label: string): void {
  const link = document.querySelector<HTMLAnchorElement>(selector)
  if (!link) return
  link.removeAttribute('href')
  link.textContent = label
  link.setAttribute('aria-disabled', 'true')
}
