import './provider-home.css'

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
  text('home-strip-observed', `${number(payload.now.observedStreams)} streams`)
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
  node.replaceChildren(dot, document.createTextNode(`${stateLabel(payload.state)} · ${payload.updatedAt ? ago(payload.updatedAt) : 'Update unavailable'}`))
}

function featureFacts(payload: Payload): void {
  text('home-feature-heatmap', payload.now.largestStream ? `Largest now: ${payload.now.largestStream.displayName} · ${compact(payload.now.largestStream.viewers)}` : unavailable(payload.state))
  text('home-feature-dayflow', payload.today.observedPeak == null ? unavailable(payload.state) : `Observed peak: ${compact(payload.today.observedPeak)} · ${time(payload.today.peakTime)}`)
  text('home-feature-battle', payload.today.closestCurrentBattle ? `Closest gap: ${battle(payload.today.closestCurrentBattle)}` : 'No qualifying current pair')
  text('home-feature-history', payload.recent.latestCompletedDay ? `Latest completed day: ${day(payload.recent.latestCompletedDay)}` : 'No completed day available')
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

    const movement = stream.changePct == null ? '—' : `${stream.changePct >= 0 ? '+' : ''}${(stream.changePct * 100).toFixed(1)}%`
    text(`home-live-momentum-${index}`, movement)
    const movementNode = document.getElementById(`home-live-momentum-${index}`)
    if (movementNode) movementNode.dataset.direction = stream.direction
  }

  let caption = payload.now.topStreams.length
    ? `Showing ${payload.now.topStreams.length} of ${number(payload.now.observedStreams)} observed streams`
    : payload.state === 'empty'
      ? 'No qualifying live streams were observed.'
      : 'Live ranking is unavailable.'
  if (payload.now.topStreams.length > 0 && !hasContext) caption += ' · Stream context is unavailable in this snapshot.'
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
  text('home-today-peak', payload.today.observedPeak == null ? 'Unavailable' : compact(payload.today.observedPeak))
  text('home-today-time', time(payload.today.peakTime))
  text('home-today-current', compact(payload.today.currentObservedViewers))
  text('home-today-top', payload.today.topByViewerMinutes?.displayName ?? 'Unavailable')
  text('home-today-top-value', payload.today.topByViewerMinutes ? `${compact(payload.today.topByViewerMinutes.viewerMinutes)} viewer-minutes` : 'No current rollup')
  text('home-today-battle', payload.today.closestCurrentBattle ? battle(payload.today.closestCurrentBattle) : 'No qualifying current pair')
  text('home-today-reversal', payload.availability.latestReversal === 'unavailable' ? 'Review reversals in Battle Lines' : 'No reversal detected')

  const maximum = Math.max(payload.today.observedPeak ?? 0, payload.today.currentObservedViewers, 1)
  meter('home-meter-peak', payload.today.observedPeak ?? 0, maximum)
  meter('home-meter-current', payload.today.currentObservedViewers, maximum)
}

function recent(payload: Payload): void {
  text('home-recent-day', payload.recent.latestCompletedDay ? day(payload.recent.latestCompletedDay) : 'Unavailable')
  text('home-recent-top', payload.recent.topStreamer?.displayName ?? 'Unavailable')
  text('home-recent-top-value', payload.recent.topStreamer ? `${compact(payload.recent.topStreamer.viewerMinutes)} viewer-minutes` : 'No completed rollup')
  text('home-recent-rise', payload.recent.biggestRise?.displayName ?? 'Unavailable')
  text('home-recent-rise-value', payload.recent.biggestRise ? `${percent(payload.recent.biggestRise.changePct)} vs previous completed day` : 'Not enough comparable data')
  text('home-recent-coverage', payload.recent.coverageState ? label(payload.recent.coverageState) : 'Unavailable')

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
      item.title = `${day(point.day)} · ${number(point.peakViewers)} peak viewers · ${label(point.coverageState)}`
      item.setAttribute('aria-label', item.title)
    }
  }

  const empty = document.getElementById('home-trend-empty')
  if (empty) empty.hidden = payload.recent.trend.length > 0
}

function fail(message: string): void {
  document.body.dataset.homeState = 'error'
  for (const id of ['home-live-observed', 'home-observed-viewers', 'home-largest-observed', 'home-updated', 'home-strip-updated', 'home-strip-observed', 'home-strip-coverage']) text(id, 'Unavailable')
  text('home-state', 'Error')
  text('home-strip-source', 'Unavailable')
  text('home-status-note', `Home data could not be loaded. ${message}`)
  text('home-live-caption', 'Live ranking could not be loaded.')

  const status = document.querySelector<HTMLElement>('.status-inline')
  if (status) {
    status.dataset.state = 'error'
    const dot = document.createElement('span')
    dot.className = 'dot'
    dot.setAttribute('aria-hidden', 'true')
    status.replaceChildren(dot, document.createTextNode('Unavailable · update failed'))
  }
}

function sourceLabel(payload: Payload): string {
  if (payload.source === 'demo') return 'Demo'
  if (payload.platform === 'twitch') return 'Helix'
  return payload.sourceMode === 'authenticated' ? 'Authenticated' : 'Candidate feed'
}

function stateLabel(state: string): string {
  const labels: Record<string, string> = {
    fresh: 'Fresh',
    partial: 'Limited',
    stale: 'Stale',
    empty: 'No data',
    demo: 'Demo',
    error: 'Unavailable',
    loading: 'Loading',
  }
  return labels[state] ?? label(state)
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
function unavailable(state: string): string { return state === 'empty' ? 'No observed data' : 'Unavailable' }
function number(value: number): string { return new Intl.NumberFormat('en-US').format(Math.max(0, value)) }
function compact(value: number): string { return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(Math.max(0, value)) }
function percent(value: number): string { return `${value >= 0 ? '+' : ''}${(value * 100).toFixed(1)}%` }
function ago(value: string): string {
  const ms = Date.now() - Date.parse(value)
  if (!Number.isFinite(ms)) return 'Update unavailable'
  const minutes = Math.max(0, Math.floor(ms / 60000))
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  return hours < 24 ? `${hours}h ago` : `${Math.floor(hours / 24)}d ago`
}
function time(value: string | null): string {
  if (!value) return 'Unavailable'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Unavailable' : `${date.toISOString().slice(11, 16)} UTC`
}
function day(value: string): string {
  const date = new Date(`${value}T00:00:00.000Z`)
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(date)
}
function shortDay(value: string): string {
  const date = new Date(`${value}T00:00:00.000Z`)
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(date)
}
function label(value: string): string {
  return value.split('_').map((word) => word ? word[0].toUpperCase() + word.slice(1) : word).join(' ')
}
