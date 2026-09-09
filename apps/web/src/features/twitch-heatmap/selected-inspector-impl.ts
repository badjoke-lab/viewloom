import './selected-inspector.css'
import { escapeHtml, formatSignedPercent } from './format'
import {
  activityPresentation,
  buildInspectorLinks,
  selectedRank,
} from './selected-inspector-core.mjs'
import type { HeatmapItem, TwitchHeatmapApiResponse } from './model'
import { localeFromPathname, type Locale } from '../../i18n/locale'
import { localizeAvailableHref } from '../../i18n/route'
import {
  heatmapDateTime,
  heatmapMomentumLabel,
  heatmapNumber,
  heatmapObservationDuration,
  heatmapText,
} from '../../i18n/heatmap'

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

function activeLocale(): Locale {
  return localeFromPathname(window.location.pathname)
}

export function ensureSelectedInspectorShell(): void {
  const stack = document.querySelector<HTMLElement>('#heatmap-inspector .rail-stack')
  if (!stack || stack.querySelector('[data-heatmap-selected-inspector]')) return
  const locale = activeLocale()

  stack.innerHTML = `
    <section class="heatmap-selected-inspector" data-heatmap-selected-inspector aria-live="polite">
      <div class="heatmap-selected-inspector__card">
        <div class="heatmap-selected-inspector__head">
          <div class="heatmap-selected-inspector__identity">
            <div class="heatmap-selected-inspector__eyebrow"><span class="heatmap-selected-inspector__live" id="heatmap-inspector-live">${escapeHtml(heatmapText(locale, 'inspector.waiting'))}</span><span>${escapeHtml(heatmapText(locale, 'inspector.selected'))}</span></div>
            <h2 id="heatmap-inspector-title">${escapeHtml(heatmapText(locale, 'inspector.none'))}</h2>
            <div id="heatmap-inspector-login" class="heatmap-selected-inspector__login">—</div>
            <p id="heatmap-inspector-body" class="heatmap-selected-inspector__title">${escapeHtml(heatmapText(locale, 'inspector.select'))}</p>
          </div>
          <div id="heatmap-inspector-snapshot" class="heatmap-selected-inspector__snapshot">${escapeHtml(heatmapText(locale, 'inspector.snapshotEmpty'))}</div>
        </div>
        <div class="heatmap-selected-inspector__metrics">
          ${metric(heatmapText(locale, 'inspector.viewers'), 'heatmap-inspector-viewers')}
          ${metric(heatmapText(locale, 'inspector.rank'), 'heatmap-inspector-rank')}
          ${metric(heatmapText(locale, 'inspector.share'), 'heatmap-inspector-share')}
          ${metric(heatmapText(locale, 'inspector.momentum'), 'heatmap-inspector-momentum', 'heatmap-inspector-momentum-note')}
          ${metric(heatmapText(locale, 'inspector.activity'), 'heatmap-inspector-activity', 'heatmap-inspector-activity-note')}
        </div>
        <div class="heatmap-selected-inspector__observations">
          ${observation(heatmapText(locale, 'inspector.since'), 'heatmap-inspector-observed-since')}
          ${observation(heatmapText(locale, 'inspector.duration'), 'heatmap-inspector-observed-duration')}
          ${observation(heatmapText(locale, 'inspector.peak'), 'heatmap-inspector-peak')}
          ${observation(heatmapText(locale, 'inspector.peakTime'), 'heatmap-inspector-peak-time')}
        </div>
        <p id="heatmap-inspector-context-note" class="heatmap-selected-inspector__context-note">${escapeHtml(heatmapText(locale, 'inspector.contextPending'))}</p>
        <div class="heatmap-selected-inspector__actions">
          <a id="heatmap-inspector-link" target="_blank" rel="noreferrer">${escapeHtml(heatmapText(locale, 'inspector.openStream'))}</a>
          <a id="heatmap-inspector-battle-lines">${escapeHtml(heatmapText(locale, 'inspector.openBattle'))}</a>
          <a id="heatmap-inspector-history">${escapeHtml(heatmapText(locale, 'inspector.openHistory'))}</a>
        </div>
      </div>
      <div hidden aria-hidden="true" data-heatmap-legacy-selection-bridge>
        <span id="heatmap-detail-title"></span>
        <span id="heatmap-detail-body"></span>
        <span id="heatmap-detail-viewers"></span>
        <span id="heatmap-detail-share"></span>
        <span id="heatmap-detail-momentum"></span>
        <span id="heatmap-detail-activity"></span>
        <a id="heatmap-detail-link"></a>
      </div>
    </section>
  `
}

export function renderSelectedInspectorPending(): void {
  requestSerial += 1
  ensureSelectedInspectorShell()
  const locale = activeLocale()
  setText('#heatmap-inspector-live', heatmapText(locale, 'inspector.waiting'))
  setText('#heatmap-inspector-title', heatmapText(locale, 'inspector.none'))
  setText('#heatmap-inspector-login', '—')
  setText('#heatmap-inspector-body', heatmapText(locale, 'inspector.select'))
  setText('#heatmap-inspector-snapshot', heatmapText(locale, 'inspector.snapshotEmpty'))
  resetValues()
  setText('#heatmap-inspector-context-note', heatmapText(locale, 'inspector.contextPending'))
  clearLink('#heatmap-inspector-link', heatmapText(locale, 'inspector.openStream'))
  clearLink('#heatmap-inspector-battle-lines', heatmapText(locale, 'inspector.openBattle'))
  clearLink('#heatmap-inspector-history', heatmapText(locale, 'inspector.openHistory'))
  clearLink('#heatmap-detail-link', '')
}

export function renderSelectedInspectorUnavailable(title: string, body: string): void {
  requestSerial += 1
  ensureSelectedInspectorShell()
  const locale = activeLocale()
  setText('#heatmap-inspector-live', heatmapText(locale, 'inspector.unavailable'))
  setText('#heatmap-inspector-title', title)
  setText('#heatmap-inspector-login', '—')
  setText('#heatmap-inspector-body', body)
  setText('#heatmap-inspector-snapshot', heatmapText(locale, 'inspector.snapshotUnavailable'))
  resetValues()
  setText('#heatmap-inspector-context-note', heatmapText(locale, 'inspector.contextUnavailable'))
  clearLink('#heatmap-inspector-link', heatmapText(locale, 'inspector.openStream'))
  clearLink('#heatmap-inspector-battle-lines', heatmapText(locale, 'inspector.openBattle'))
  clearLink('#heatmap-inspector-history', heatmapText(locale, 'inspector.openHistory'))
}

export function renderSelectedStreamInspector(input: SelectedInspectorInput): void {
  ensureSelectedInspectorShell()
  const locale = activeLocale()
  const { item, items, latest, response, provider } = input
  const serial = ++requestSerial
  const rank = selectedRank(items, item.channelLogin)
  const share = latest.total_viewers > 0 ? item.viewers / latest.total_viewers : 0
  const direction = heatmapMomentumLabel(locale, item.momentum, true)
  const activity = activityPresentation(item)
  const bucketMinutes = response.bucketMinutes ?? response.expectedBucketMinutes ?? 5
  const links = buildInspectorLinks(provider.key, item.channelLogin)
  const streamUrl = item.url || provider.streamUrl(item.channelLogin)

  const root = document.querySelector<HTMLElement>('[data-heatmap-selected-inspector]')
  if (root) root.dataset.streamLogin = item.channelLogin
  setText('#heatmap-inspector-live', heatmapText(locale, 'inspector.live'))
  setText('#heatmap-inspector-title', item.displayName)
  setText('#heatmap-inspector-login', `@${item.channelLogin}`)
  setText('#heatmap-inspector-body', item.title || heatmapText(locale, 'inspector.fallbackTitle', { provider: provider.label }))
  setText('#heatmap-inspector-snapshot', heatmapText(locale, 'inspector.snapshot', { value: heatmapDateTime(locale, latest.collected_at) }))
  setText('#heatmap-inspector-viewers', heatmapNumber(locale, item.viewers))
  setText('#heatmap-inspector-rank', rank ? `#${rank}` : heatmapText(locale, 'common.unavailable'))
  setText('#heatmap-inspector-share', `${(share * 100).toFixed(2)}%`)
  setText('#heatmap-inspector-momentum', formatSignedPercent(item.momentum))
  setText('#heatmap-inspector-momentum-note', heatmapText(locale, 'inspector.window', { direction, minutes: bucketMinutes }))
  setText('#heatmap-inspector-activity', activityValue(activity.state, activity.value, locale))
  setText('#heatmap-inspector-activity-note', activityNote(activity.state, locale))
  setText('#heatmap-inspector-observed-since', heatmapText(locale, 'inspector.loadingValue'))
  setText('#heatmap-inspector-observed-duration', heatmapText(locale, 'inspector.loadingValue'))
  setText('#heatmap-inspector-peak', heatmapText(locale, 'inspector.loadingValue'))
  setText('#heatmap-inspector-peak-time', heatmapText(locale, 'inspector.loadingValue'))
  setText('#heatmap-inspector-context-note', heatmapText(locale, 'inspector.contextLoading'))
  setLink('#heatmap-inspector-link', streamUrl, heatmapText(locale, 'inspector.openOn', { provider: provider.label }))
  setLink('#heatmap-inspector-battle-lines', localizeAvailableHref(links.battleLines, locale), heatmapText(locale, 'inspector.openBattle'))
  setLink('#heatmap-inspector-history', localizeAvailableHref(links.history, locale), heatmapText(locale, 'inspector.openHistory'))

  void loadStreamContext(provider.key, item.channelLogin).then((context) => {
    const current = document.querySelector<HTMLElement>('[data-heatmap-selected-inspector]')?.dataset.streamLogin
    if (serial !== requestSerial || current !== item.channelLogin) return
    renderContext(context, bucketMinutes, locale)
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

function renderContext(context: StreamContext, fallbackBucketMinutes: number, locale: Locale): void {
  if (!context.ok) {
    setUnavailableContext(heatmapText(locale, 'inspector.contextLoadFailed'), locale)
    return
  }
  if (context.state !== 'observed' || !context.observedSince) {
    setUnavailableContext(heatmapText(locale, 'inspector.contextRunMissing'), locale)
    return
  }

  const bucketMinutes = context.expectedBucketMinutes ?? fallbackBucketMinutes
  setText('#heatmap-inspector-observed-since', heatmapDateTime(locale, context.observedSince))
  setText('#heatmap-inspector-observed-duration', heatmapObservationDuration(locale, context.observedDurationMinutes ?? null, Boolean(context.windowTruncated), bucketMinutes))
  setText('#heatmap-inspector-peak', typeof context.peakViewers === 'number' ? heatmapNumber(locale, context.peakViewers) : heatmapText(locale, 'common.unavailable'))
  setText('#heatmap-inspector-peak-time', context.peakAt ? heatmapDateTime(locale, context.peakAt) : heatmapText(locale, 'common.unavailable'))
  const samples = context.sampleCount ?? 0
  const boundary = context.windowTruncated ? heatmapText(locale, 'inspector.boundary') : ''
  setText('#heatmap-inspector-context-note', heatmapText(locale, 'inspector.samples', {
    count: heatmapNumber(locale, samples),
    plural: locale === 'en' && samples !== 1 ? 's' : '',
    boundary,
  }))
}

function setUnavailableContext(note: string, locale: Locale): void {
  const unavailable = heatmapText(locale, 'common.unavailable')
  setText('#heatmap-inspector-observed-since', unavailable)
  setText('#heatmap-inspector-observed-duration', unavailable)
  setText('#heatmap-inspector-peak', unavailable)
  setText('#heatmap-inspector-peak-time', unavailable)
  setText('#heatmap-inspector-context-note', note)
}

function resetValues(): void {
  for (const selector of [
    '#heatmap-inspector-viewers',
    '#heatmap-inspector-rank',
    '#heatmap-inspector-share',
    '#heatmap-inspector-momentum',
    '#heatmap-inspector-activity',
    '#heatmap-inspector-observed-since',
    '#heatmap-inspector-observed-duration',
    '#heatmap-inspector-peak',
    '#heatmap-inspector-peak-time',
  ]) setText(selector, '—')
  setText('#heatmap-inspector-momentum-note', '')
  setText('#heatmap-inspector-activity-note', '')
}

function activityValue(state: string, value: string, locale: Locale): string {
  if (state === 'not_sampled') return heatmapText(locale, 'common.notSampled')
  if (state === 'unavailable') return heatmapText(locale, 'common.unavailable')
  return value
}

function activityNote(state: string, locale: Locale): string {
  if (state === 'available') return heatmapText(locale, 'inspector.activityNoteAvailable')
  if (state === 'not_sampled') return heatmapText(locale, 'inspector.activityNoteNotSampled')
  return heatmapText(locale, 'inspector.activityNoteUnavailable')
}

function metric(label: string, id: string, noteId?: string): string {
  return `<div class="heatmap-selected-inspector__metric"><small>${escapeHtml(label)}</small><strong id="${id}">—</strong>${noteId ? `<span id="${noteId}"></span>` : ''}</div>`
}

function observation(label: string, id: string): string {
  return `<div class="heatmap-selected-inspector__observation"><small>${escapeHtml(label)}</small><strong id="${id}">—</strong></div>`
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
