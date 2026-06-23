import '../channel-profile.css'
import type {
  ChannelBattleEntry,
  ChannelDay,
  ChannelHistoryPayload,
  ChannelProvider,
  ChannelState,
  ChannelStreamer,
} from './channel/model'
import {
  channelStateUrl,
  isChannelDay,
  normalizeChannelId,
  parseChannelState,
  sameChannelRequestScope,
} from './channel/url-state'

const provider: ChannelProvider = document.body.dataset.provider === 'kick' ? 'kick' : 'twitch'
const providerName = provider === 'kick' ? 'Kick' : 'Twitch'
const endpoint = provider === 'kick' ? '/api/kick-history' : '/api/history'
let state = parseChannelState(new URL(location.href), provider)
let controller: AbortController | null = null
let currentPayload: ChannelHistoryPayload | null = null

normalizeInitialUrl()
bindControls()
window.addEventListener('popstate', restoreUrlState)
syncStateToDom()
void load()

function normalizeInitialUrl(): void {
  const normalized = channelStateUrl(new URL(location.href), state)
  const current = `${location.pathname}${location.search}${location.hash}`
  if (normalized !== current) history.replaceState(null, '', normalized)
}

function bindControls(): void {
  document.querySelectorAll<HTMLButtonElement>('[data-channel-period]').forEach((button) => {
    button.addEventListener('click', () => {
      const next = button.dataset.channelPeriod
      if ((next !== '7d' && next !== '30d') || next === state.period) return
      transition({ ...state, period: next, selectedDay: undefined }, 'push')
    })
  })
}

function transition(next: ChannelState, mode: 'push' | 'replace'): void {
  const previous = state
  state = next
  const href = channelStateUrl(new URL(location.href), state)
  if (mode === 'push') history.pushState(null, '', href)
  else history.replaceState(null, '', href)
  syncStateToDom()
  reconcileState(previous)
}

function restoreUrlState(): void {
  const previous = state
  state = parseChannelState(new URL(location.href), provider)
  syncStateToDom()
  reconcileState(previous)
}

function reconcileState(previous: ChannelState): void {
  if (!state.channelId) {
    controller?.abort()
    currentPayload = null
    renderMissingId()
    return
  }

  if (!sameChannelRequestScope(previous, state) || !currentPayload) {
    void load()
    return
  }

  render(currentPayload)
}

function syncStateToDom(): void {
  document.body.dataset.channelView = state.view
  document.body.dataset.channelPeriod = state.period
  if (state.selectedDay) document.body.dataset.channelSelectedDay = state.selectedDay
  else delete document.body.dataset.channelSelectedDay

  document.querySelectorAll<HTMLButtonElement>('[data-channel-period]').forEach((button) => {
    const active = button.dataset.channelPeriod === state.period
    button.classList.toggle('active', active)
    button.setAttribute('aria-pressed', String(active))
  })
}

async function load(): Promise<void> {
  setStatus('Loading', 'loading')
  setText('[data-channel-feedback]', 'Loading retained ranking footprint…')
  if (!state.channelId) return renderMissingId()

  controller?.abort()
  controller = new AbortController()
  const requestState = state

  try {
    const response = await fetch(`${endpoint}?period=${requestState.period}&metric=viewer_minutes`, {
      headers: { accept: 'application/json' },
      cache: 'no-store',
      signal: controller.signal,
    })
    const payload = await response.json() as ChannelHistoryPayload
    if (!response.ok) throw new Error(payload.error?.message ?? `History API returned ${response.status}.`)
    if (!sameChannelRequestScope(requestState, state)) return
    currentPayload = payload
    render(payload)
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') return
    if (!sameChannelRequestScope(requestState, state)) return
    currentPayload = null
    renderError(error instanceof Error ? error.message : String(error))
  }
}

function render(payload: ChannelHistoryPayload): void {
  normalizeSelectedDay(payload)
  const periodRow = findStreamer(payload.topStreamers ?? [])
  const daily = (payload.daily ?? []).map((day) => ({ day, streamer: findStreamer(day.topStreamers ?? []) }))
  const appearances = daily.filter((entry) => Boolean(entry.streamer))
  const displayName = (
    periodRow?.displayName
    ?? appearances.at(-1)?.streamer?.displayName
    ?? state.requestedName
  ) || state.channelId
  const battles = (payload.battleArchive ?? []).filter(involvesStreamer).slice(0, 5)

  document.title = `${displayName} ${providerName} history | ViewLoom`
  setText('[data-channel-name]', displayName)
  setText('[data-channel-provider]', `${providerName} retained ranking footprint`)
  setText('[data-channel-period-label]', payload.period?.label ?? labelForPeriod())
  setStatus(payload.state ?? 'unknown', payload.state ?? 'unknown')
  setText('[data-channel-feedback]', payload.coverage?.notes?.[0] ?? `${appearances.length} retained daily Top 10 appearances in this period.`)
  setExternalLink(displayName)
  renderSummary(periodRow, appearances.length, payload.period?.days)
  renderTrend(daily)
  renderDays(appearances)
  renderRivals(battles)
  renderScope(payload.period?.days, appearances.length)
}

function normalizeSelectedDay(payload: ChannelHistoryPayload): void {
  if (!state.selectedDay) return
  const availableDays = new Set((payload.daily ?? []).map((day) => day.day).filter(isChannelDay))
  if (availableDays.has(state.selectedDay)) return
  state = { ...state, selectedDay: undefined }
  history.replaceState(null, '', channelStateUrl(new URL(location.href), state))
  syncStateToDom()
}

function renderSummary(streamer: ChannelStreamer | undefined, appearances: number, requestedDays?: number): void {
  setHtml('[data-channel-summary]', `
    ${summaryCard('Viewer-minutes', formatNumber(streamer?.viewerMinutes), 'Retained period total')}
    ${summaryCard('Peak viewers', formatNumber(streamer?.peakViewers), 'Highest retained observation')}
    ${summaryCard('Average viewers', formatNumber(streamer?.avgViewers), 'Viewer-minutes / observed minutes')}
    ${summaryCard('Observed time', formatDuration(streamer?.observedMinutes), 'Retained observation time')}
    ${summaryCard('Daily Top 10 days', formatNumber(appearances), `${requestedDays ?? 0} requested days`)}
  `)
}

function renderTrend(entries: Array<{ day: ChannelDay; streamer?: ChannelStreamer }>): void {
  if (!entries.length) return setHtml('[data-channel-trend]', '<div class="notice">No requested days are available.</div>')
  const max = Math.max(1, ...entries.map((entry) => numeric(entry.streamer?.viewerMinutes)))
  setHtml('[data-channel-trend]', `
    <div class="channel-trend-legend">
      <span>Daily viewer-minutes in retained Top 10</span>
      <small>Absent bars mean not present in retained daily Top 10, not confirmed offline.</small>
    </div>
    <div class="channel-trend-bars" role="img" aria-label="Retained daily viewer-minute footprint">
      ${entries.map((entry) => {
        const value = numeric(entry.streamer?.viewerMinutes)
        const observed = Boolean(entry.streamer)
        const height = observed ? Math.max(4, (value / max) * 100) : 2
        const detail = observed ? formatNumber(value) : 'Not in retained daily Top 10'
        return `<div class="channel-trend-column channel-trend-column--${observed ? 'observed' : 'absent'}" title="${escapeHtml(formatDate(entry.day.day))}: ${escapeHtml(detail)}">
          <div class="channel-trend-bar" style="height:${height.toFixed(1)}%"></div>
          <time>${escapeHtml(shortDate(entry.day.day))}</time>
        </div>`
      }).join('')}
    </div>`)
}

function renderDays(entries: Array<{ day: ChannelDay; streamer?: ChannelStreamer }>): void {
  if (!entries.length) {
    return setHtml('[data-channel-days]', '<div class="notice">This streamer did not appear in the retained daily Top 10 for the selected period.</div>')
  }
  setHtml('[data-channel-days]', [...entries].reverse().map(({ day, streamer }) => {
    const date = isChannelDay(day.day) ? day.day : ''
    return `<article class="channel-day-card">
      <div class="channel-day-card__head"><time>${escapeHtml(formatDate(date))}</time><span class="history-badge history-badge--${safeClass(day.coverageState ?? 'partial')}">${escapeHtml(humanLabel(day.coverageState ?? 'partial'))}</span></div>
      <dl>
        <div><dt>Viewer-minutes</dt><dd>${formatNumber(streamer?.viewerMinutes)}</dd></div>
        <div><dt>Peak viewers</dt><dd>${formatNumber(streamer?.peakViewers)}</dd></div>
        <div><dt>Average viewers</dt><dd>${formatNumber(streamer?.avgViewers)}</dd></div>
        <div><dt>Observed time</dt><dd>${formatDuration(streamer?.observedMinutes)}</dd></div>
        <div><dt>Daily rank</dt><dd>${formatRank(streamer?.rankByViewerMinutes)}</dd></div>
      </dl>
      <div class="channel-day-card__actions">
        <a href="/${provider}/day-flow/?date=${encodeURIComponent(date)}&rangeMode=date">Day Flow</a>
        <a href="/${provider}/battle-lines/?date=${encodeURIComponent(date)}&range=date">Battle Lines</a>
      </div>
    </article>`
  }).join(''))
}

function renderRivals(entries: ChannelBattleEntry[]): void {
  if (!entries.length) {
    return setHtml('[data-channel-rivals]', '<div class="notice">No retained daily rivalry candidate includes this streamer in the selected period.</div>')
  }
  setHtml('[data-channel-rivals]', entries.map((entry) => {
    const leftMatches = normalizeChannelId(entry.streamerAId) === state.channelId
    const opponentId = leftMatches ? normalizeChannelId(entry.streamerBId) : normalizeChannelId(entry.streamerAId)
    const opponentName = leftMatches ? entry.streamerBName : entry.streamerAName
    const date = isChannelDay(entry.day) ? entry.day : ''
    const battle = opponentId ? `${state.channelId}:${opponentId}` : state.channelId
    return `<article class="channel-rival-card">
      <div><small>${escapeHtml(formatDate(date))}</small><strong>${escapeHtml(opponentName || opponentId || 'Unavailable')}</strong></div>
      <dl><div><dt>Daily rivalry score</dt><dd>${formatScore(entry.score)}</dd></div><div><dt>Viewer-minute gap</dt><dd>${formatNumber(entry.viewerMinutesGap)}</dd></div></dl>
      <a href="/${provider}/battle-lines/?battle=${encodeURIComponent(battle)}&date=${encodeURIComponent(date)}&range=date">Open Battle Lines</a>
    </article>`
  }).join(''))
}

function renderScope(requestedDays: number | undefined, appearances: number): void {
  setHtml('[data-channel-scope]', `
    <p><strong>Scope:</strong> ${appearances} retained daily Top 10 appearances across ${requestedDays ?? 0} requested days.</p>
    <p>Days without a matching row are not confirmed offline. They only mean the streamer was not present in the retained daily Top 10 payload.</p>
    <p>Session start/end history is not available in this initial page.</p>
    <p><a href="/${provider}/history/?period=${state.period}">Back to ${providerName} History</a></p>`)
}

function renderMissingId(): void {
  setStatus('Missing channel', 'empty')
  setText('[data-channel-feedback]', 'Open this page from a History streamer ranking or provide an id query parameter.')
  setText('[data-channel-name]', 'Channel not selected')
  setHtml('[data-channel-summary]', '<div class="notice">No channel identifier was provided.</div>')
  setHtml('[data-channel-trend]', '<div class="notice">No retained footprint can be loaded.</div>')
  setHtml('[data-channel-days]', '<div class="notice">No retained days are available.</div>')
  setHtml('[data-channel-rivals]', '<div class="notice">No rivalry candidates are available.</div>')
}

function renderError(message: string): void {
  setStatus('Error', 'error')
  setText('[data-channel-feedback]', message)
  setHtml('[data-channel-summary]', '<div class="notice">Channel history could not be loaded.</div>')
  setHtml('[data-channel-trend]', '<div class="notice">No retained daily footprint is available.</div>')
  setHtml('[data-channel-days]', '<div class="notice">No retained days are available.</div>')
  setHtml('[data-channel-rivals]', '<div class="notice">No rivalry candidates are available.</div>')
}

function findStreamer(rows: ChannelStreamer[]): ChannelStreamer | undefined {
  return rows.find((row) => normalizeChannelId(row.streamerId) === state.channelId)
}

function involvesStreamer(entry: ChannelBattleEntry): boolean {
  return normalizeChannelId(entry.streamerAId) === state.channelId || normalizeChannelId(entry.streamerBId) === state.channelId
}

function setExternalLink(name: string): void {
  const link = document.querySelector<HTMLAnchorElement>('[data-channel-external]')
  if (!link || !state.channelId) return
  link.href = provider === 'twitch' ? `https://www.twitch.tv/${encodeURIComponent(state.channelId)}` : `https://kick.com/${encodeURIComponent(state.channelId)}`
  link.textContent = `Open ${name} on ${providerName}`
}

function summaryCard(label: string, value: string, note: string): string {
  return `<div><small>${escapeHtml(label)}</small><strong>${escapeHtml(value)}</strong><span>${escapeHtml(note)}</span></div>`
}

function setStatus(label: string, value: string): void {
  const node = document.querySelector<HTMLElement>('[data-channel-state]')
  if (!node) return
  node.textContent = humanLabel(label)
  node.className = `history-state-pill history-state-pill--${safeClass(value)}`
}

function setText(selector: string, value: string): void { document.querySelector<HTMLElement>(selector)?.replaceChildren(value) }
function setHtml(selector: string, value: string): void { const node = document.querySelector<HTMLElement>(selector); if (node) node.innerHTML = value }
function labelForPeriod(): string { return state.period === '7d' ? 'Last 7 days' : 'Last 30 days' }
function numeric(value: unknown): number { return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, value) : 0 }
function finiteNumber(value: unknown): value is number { return typeof value === 'number' && Number.isFinite(value) }
function formatNumber(value: unknown): string { return finiteNumber(value) ? Math.round(Math.max(0, value)).toLocaleString('en-US') : '—' }
function formatDuration(value: unknown): string { if (!finiteNumber(value)) return '—'; const minutes = Math.max(0, Math.round(value)); return `${Math.floor(minutes / 60).toLocaleString('en-US')}h ${minutes % 60}m` }
function formatRank(value: unknown): string { return finiteNumber(value) ? `#${Math.max(1, Math.round(value))}` : '—' }
function formatScore(value: unknown): string { return finiteNumber(value) ? `${Math.round(value)}/100` : '—' }
function formatDate(value: unknown): string { return isChannelDay(value) ? new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${value}T00:00:00.000Z`)) : 'Unknown day' }
function shortDate(value: unknown): string { return isChannelDay(value) ? value.slice(5) : '—' }
function humanLabel(value: string): string { return value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()) }
function safeClass(value: string): string { return value.toLowerCase().replace(/[^a-z0-9_-]/g, '-') }
function escapeHtml(value: unknown): string { return String(value ?? '').replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character] ?? character) }
