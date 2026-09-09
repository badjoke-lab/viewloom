import './provider-home.css'
import { formatCompactNumber, formatInteger, localeTag } from './i18n/format'
import { localeFromPathname } from './i18n/locale'
import { providerHomeText } from './i18n/provider-home'

type Platform = 'twitch' | 'kick'
type Stream = {
  displayName: string
  title: string
  category: string
  viewers: number
  changePct: number | null
  direction: string
  url: string
}
type Battle = { left: { displayName: string }; right: { displayName: string }; gap: number }
type Payload = {
  version: string
  platform: Platform
  state: string
  source: string
  sourceMode: string
  updatedAt: string | null
  coverage: { label: string; note: string }
  now: {
    observedStreams: number
    observedViewers: number
    largestStream: Stream | null
    topStreams: Stream[]
    fastestRiser: Stream | null
    closestGap: Battle | null
    topCategory: { name: string; viewers: number; streams: number } | null
  }
  today: {
    observedPeak: number | null
    peakTime: string | null
    currentObservedViewers: number
    topByViewerMinutes: { displayName: string; viewerMinutes: number } | null
    closestCurrentBattle: Battle | null
  }
  recent: {
    latestCompletedDay: string | null
    topStreamer: { displayName: string; viewerMinutes: number } | null
    biggestRise: { displayName: string; changePct: number } | null
    coverageState: string | null
    trend: Array<{ day: string; peakViewers: number; coverageState: string }>
  }
  signals: Array<{ label: string; summary: string; observedAt: string | null }>
  availability: { latestReversal: string }
  error?: { message: string }
}

const platform = document.body.dataset.provider as Platform | undefined
const locale = localeFromPathname(window.location.pathname)
const t = (key: Parameters<typeof providerHomeText>[1], params: Record<string, string | number> = {}) => providerHomeText(locale, key, params)

if (platform === 'twitch' || platform === 'kick') void load(platform)

async function load(active: Platform): Promise<void> {
  document.body.dataset.homeState = 'loading'
  try {
    const response = await fetch(`/api/${active}-home`, { cache: 'no-store' })
    const payload = await response.json() as Payload
    if (payload.version !== 'viewloom-home-v1' || payload.platform !== active) throw new Error('Unexpected Home data.')
    render(payload)
  } catch (error) {
    fail(error instanceof Error ? error.message : String(error))
  }
}

function render(payload: Payload): void {
  document.body.dataset.homeState = payload.state
  text('home-live-observed', number(payload.now.observedStreams))
  text('home-observed-viewers', compact(payload.now.observedViewers))
  text('home-largest-observed', payload.now.largestStream ? compact(payload.now.largestStream.viewers) : unavailable(payload.state))
  text('home-updated', payload.updatedAt ? ago(payload.updatedAt) : unavailable(payload.state))
  text('home-state', stateLabel(payload.state))
  text('home-strip-updated', payload.updatedAt ? ago(payload.updatedAt) : unavailable(payload.state))
  text('home-strip-observed', locale === 'ja' ? `${number(payload.now.observedStreams)}配信` : `${number(payload.now.observedStreams)} streams`)
  text('home-strip-coverage', payload.coverage.label)
  text('home-strip-source', sourceLabel(payload))
  text('home-status-note', payload.coverage.note)

  headerStatus(payload)
  featureFacts(payload)
  liveRows(payload)
  signalRows(payload)
  today(payload)
  recent(payload)
}

function headerStatus(payload: Payload): void {
  const node = document.querySelector<HTMLElement>('.status-inline')
  if (!node) return
  node.dataset.state = payload.state
  const dot = document.createElement('span')
  dot.className = 'dot'
  dot.setAttribute('aria-hidden', 'true')
  node.replaceChildren(dot, document.createTextNode(`${stateLabel(payload.state)} · ${payload.updatedAt ? ago(payload.updatedAt) : t('data.updateUnavailable')}`))
}

function featureFacts(payload: Payload): void {
  text('home-feature-heatmap', payload.now.largestStream
    ? t('data.largestNow', { name: payload.now.largestStream.displayName, value: compact(payload.now.largestStream.viewers) })
    : unavailable(payload.state))
  text('home-feature-dayflow', payload.today.observedPeak == null
    ? unavailable(payload.state)
    : t('data.observedPeak', { value: compact(payload.today.observedPeak), time: time(payload.today.peakTime) }))
  text('home-feature-battle', payload.today.closestCurrentBattle
    ? t('data.closestGap', { battle: battle(payload.today.closestCurrentBattle) })
    : t('data.noCurrentPair'))
  text('home-feature-history', payload.recent.latestCompletedDay
    ? t('data.latestCompletedDay', { day: day(payload.recent.latestCompletedDay) })
    : t('data.noCompletedDay'))
}

function liveRows(payload: Payload): void {
  const hasContext = payload.now.topStreams.some((stream) => Boolean(stream.category || stream.title))
  document.getElementById('home-live-table')?.classList.toggle('home-table--no-context', !hasContext)

  for (let index = 0; index < 5; index += 1) {
    const stream = payload.now.topStreams[index]
    const row = document.getElementById(`home-live-row-${index}`)
    if (row) row.hidden = !stream
    if (!stream) continue

    text(`home-live-rank-${index}`, String(index + 1))
    const channel = document.getElementById(`home-live-name-${index}`) as HTMLAnchorElement | null
    if (channel) {
      channel.textContent = stream.displayName
      channel.href = stream.url || '#'
      channel.hidden = false
    }
    text(`home-live-context-${index}`, stream.category || stream.title || '')
    text(`home-live-viewers-${index}`, number(stream.viewers))

    const movement = stream.changePct == null ? '—' : percent(stream.changePct)
    text(`home-live-momentum-${index}`, movement)
    const movementNode = document.getElementById(`home-live-momentum-${index}`)
    if (movementNode) movementNode.dataset.direction = stream.direction
  }

  let caption = payload.now.topStreams.length
    ? t('data.showingStreams', { shown: payload.now.topStreams.length, observed: number(payload.now.observedStreams) })
    : payload.state === 'empty'
      ? t('data.noLiveStreams')
      : t('data.liveRankingUnavailable')
  if (payload.now.topStreams.length > 0 && !hasContext) caption += ` · ${t('data.contextUnavailable')}`
  text('home-live-caption', caption)
}

function signalRows(payload: Payload): void {
  for (let index = 0; index < 4; index += 1) {
    const signal = payload.signals[index]
    const row = document.getElementById(`home-signal-${index}`)
    if (row) row.hidden = !signal
    if (!signal) continue
    text(`home-signal-label-${index}`, signal.label)
    text(`home-signal-summary-${index}`, signal.summary)
    text(`home-signal-time-${index}`, signal.observedAt ? ago(signal.observedAt) : '')
  }
  const empty = document.getElementById('home-signals-empty')
  if (empty) empty.hidden = payload.signals.length > 0
}

function today(payload: Payload): void {
  text('home-today-peak', payload.today.observedPeak == null ? t('data.unavailable') : compact(payload.today.observedPeak))
  text('home-today-time', time(payload.today.peakTime))
  text('home-today-current', compact(payload.today.currentObservedViewers))
  text('home-today-top', payload.today.topByViewerMinutes?.displayName ?? t('data.unavailable'))
  text('home-today-top-value', payload.today.topByViewerMinutes
    ? t('data.viewerMinutes', { value: compact(payload.today.topByViewerMinutes.viewerMinutes) })
    : t('data.noCurrentRollup'))
  text('home-today-battle', payload.today.closestCurrentBattle ? battle(payload.today.closestCurrentBattle) : t('data.noCurrentPair'))
  text('home-today-reversal', payload.availability.latestReversal === 'unavailable' ? t('data.reviewReversals') : t('data.noReversal'))

  const maximum = Math.max(payload.today.observedPeak ?? 0, payload.today.currentObservedViewers, 1)
  meter('home-meter-peak', payload.today.observedPeak ?? 0, maximum)
  meter('home-meter-current', payload.today.currentObservedViewers, maximum)
}

function recent(payload: Payload): void {
  text('home-recent-day', payload.recent.latestCompletedDay ? day(payload.recent.latestCompletedDay) : t('data.unavailable'))
  text('home-recent-top', payload.recent.topStreamer?.displayName ?? t('data.unavailable'))
  text('home-recent-top-value', payload.recent.topStreamer
    ? t('data.viewerMinutes', { value: compact(payload.recent.topStreamer.viewerMinutes) })
    : t('data.noCompletedRollup'))
  text('home-recent-rise', payload.recent.biggestRise?.displayName ?? t('data.unavailable'))
  text('home-recent-rise-value', payload.recent.biggestRise
    ? t('data.vsPrevious', { value: percent(payload.recent.biggestRise.changePct) })
    : t('data.notComparable'))
  text('home-recent-coverage', payload.recent.coverageState ? label(payload.recent.coverageState) : t('data.unavailable'))

  const maximum = Math.max(...payload.recent.trend.map((point) => point.peakViewers), 1)
  for (let index = 0; index < 7; index += 1) {
    const point = payload.recent.trend[index]
    const item = document.getElementById(`home-trend-${index}`)
    if (item) item.hidden = !point
    if (!point) continue

    const bar = document.getElementById(`home-trend-bar-${index}`)
    if (bar) bar.style.height = `${Math.max(6, Math.round((point.peakViewers / maximum) * 100))}%`
    text(`home-trend-label-${index}`, shortDay(point.day))
    if (item) {
      item.title = t('trend.title', { day: day(point.day), value: number(point.peakViewers), coverage: label(point.coverageState) })
      item.setAttribute('aria-label', item.title)
    }
  }

  const empty = document.getElementById('home-trend-empty')
  if (empty) empty.hidden = payload.recent.trend.length > 0
}

function fail(message: string): void {
  document.body.dataset.homeState = 'error'
  for (const id of ['home-live-observed', 'home-observed-viewers', 'home-largest-observed', 'home-updated', 'home-strip-updated', 'home-strip-observed', 'home-strip-coverage']) text(id, t('data.unavailable'))
  text('home-state', t('state.error'))
  text('home-strip-source', t('data.unavailable'))
  text('home-status-note', t('data.loadError', { message }))
  text('home-live-caption', t('data.rankingError'))

  const status = document.querySelector<HTMLElement>('.status-inline')
  if (status) {
    status.dataset.state = 'error'
    const dot = document.createElement('span')
    dot.className = 'dot'
    dot.setAttribute('aria-hidden', 'true')
    status.replaceChildren(dot, document.createTextNode(t('data.updateFailed')))
  }
}

function sourceLabel(payload: Payload): string {
  if (payload.source === 'demo') return t('source.demo')
  if (payload.platform === 'twitch') return 'Helix'
  return payload.sourceMode === 'authenticated' ? t('source.authenticated') : t('source.candidate')
}

function stateLabel(state: string): string {
  const keys: Record<string, Parameters<typeof providerHomeText>[1]> = {
    fresh: 'state.fresh',
    partial: 'state.partial',
    stale: 'state.stale',
    empty: 'state.empty',
    demo: 'state.demo',
    error: 'state.error',
    loading: 'state.loading',
  }
  const key = keys[state]
  return key ? t(key) : label(state)
}

function text(id: string, value: string): void {
  const node = document.getElementById(id)
  if (node) node.textContent = value
}

function meter(id: string, value: number, maximum: number): void {
  const fill = document.getElementById(id)
  if (!fill) return
  const percentage = Math.round(Math.max(0, Math.min(1, value / maximum)) * 100)
  fill.style.width = `${percentage}%`
  fill.parentElement?.setAttribute('aria-valuenow', String(percentage))
}

function battle(value: Battle): string { return `${value.left.displayName} / ${value.right.displayName} · ${number(value.gap)}` }
function unavailable(state: string): string { return state === 'empty' ? t('data.noObserved') : t('data.unavailable') }
function number(value: number): string { return formatInteger(Math.max(0, value), locale) }
function compact(value: number): string { return formatCompactNumber(Math.max(0, value), locale) }
function percent(value: number): string {
  return new Intl.NumberFormat(localeTag(locale), {
    style: 'percent',
    signDisplay: 'always',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value)
}
function ago(value: string): string {
  const ms = Date.now() - Date.parse(value)
  if (!Number.isFinite(ms)) return t('data.updateUnavailable')
  const minutes = Math.max(0, Math.floor(ms / 60000))
  if (minutes < 1) return t('time.justNow')
  if (minutes < 60) return t('time.minutesAgo', { value: minutes })
  const hours = Math.floor(minutes / 60)
  return hours < 24 ? t('time.hoursAgo', { value: hours }) : t('time.daysAgo', { value: Math.floor(hours / 24) })
}
function time(value: string | null): string {
  if (!value) return t('data.unavailable')
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? t('data.unavailable') : `${date.toISOString().slice(11, 16)} UTC`
}
function day(value: string): string {
  const date = new Date(`${value}T00:00:00.000Z`)
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat(localeTag(locale), { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(date)
}
function shortDay(value: string): string {
  const date = new Date(`${value}T00:00:00.000Z`)
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat(localeTag(locale), { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(date)
}
function label(value: string): string {
  return value.split('_').map((word) => word ? word[0].toUpperCase() + word.slice(1) : word).join(' ')
}