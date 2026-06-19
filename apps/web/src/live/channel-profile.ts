import '../channel-profile.css'

type Provider = 'twitch' | 'kick'
type PeriodMode = '7d' | '30d'

type Streamer = {
  streamerId?: string
  displayName?: string
  viewerMinutes?: number
  peakViewers?: number
  avgViewers?: number
  observedMinutes?: number
  rankByViewerMinutes?: number
  rankByPeak?: number
  changePct?: number | null
  comparisonState?: string
}

type Day = {
  day?: string
  coverageState?: string
  topStreamers?: Streamer[]
}

type BattleEntry = {
  day?: string
  streamerAId?: string
  streamerAName?: string
  streamerBId?: string
  streamerBName?: string
  score?: number
  viewerMinutesGap?: number
  coverageState?: string
}

type HistoryPayload = {
  state?: string
  platform?: string
  period?: { from?: string; to?: string; label?: string; days?: number }
  topStreamers?: Streamer[]
  daily?: Day[]
  battleArchive?: BattleEntry[]
  coverage?: { state?: string; observedDays?: number; notes?: string[] }
  error?: { message?: string }
}

const provider: Provider = document.body.dataset.provider === 'kick' ? 'kick' : 'twitch'
const providerName = provider === 'kick' ? 'Kick' : 'Twitch'
const endpoint = provider === 'kick' ? '/api/kick-history' : '/api/history'
const params = new URL(location.href).searchParams
const streamerId = normalizeId(params.get('id'))
const requestedName = params.get('name')?.trim() ?? ''
let periodMode: PeriodMode = params.get('period') === '7d' ? '7d' : '30d'
let controller: AbortController | null = null

bindControls()
syncControls()
void load()

function bindControls(): void {
  document.querySelectorAll<HTMLButtonElement>('[data-channel-period]').forEach((button) => {
    button.addEventListener('click', () => {
      const next = button.dataset.channelPeriod
      if (next !== '7d' && next !== '30d') return
      periodMode = next
      const url = new URL(location.href)
      url.searchParams.set('period', next)
      history.replaceState(null, '', `${url.pathname}?${url.searchParams.toString()}`)
      syncControls()
      void load()
    })
  })
}

function syncControls(): void {
  document.querySelectorAll<HTMLButtonElement>('[data-channel-period]').forEach((button) => {
    const active = button.dataset.channelPeriod === periodMode
    button.classList.toggle('active', active)
    button.setAttribute('aria-pressed', String(active))
  })
}

async function load(): Promise<void> {
  setStatus('Loading', 'loading')
  setFeedback('Loading retained ranking footprint…')
  if (!streamerId) {
    renderMissingId()
    return
  }

  controller?.abort()
  controller = new AbortController()
  try {
    const response = await fetch(`${endpoint}?period=${periodMode}&metric=viewer_minutes`, {
      headers: { accept: 'application/json' },
      cache: 'no-store',
      signal: controller.signal,
    })
    const payload = await response.json() as HistoryPayload
    if (!response.ok) throw new Error(payload.error?.message ?? `History API returned ${response.status}.`)
    render(payload)
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') return
    setStatus('Error', 'error')
    setFeedback(error instanceof Error ? error.message : String(error))
    setHtml('[data-channel-summary]', '<div class="notice">Channel history could not be loaded.</div>')
    setHtml('[data-channel-trend]', '<div class="notice">No retained daily footprint is available.</div>')
    setHtml('[data-channel-days]', '<div class="notice">No retained days are available.</div>')
    setHtml('[data-channel-rivals]', '<div class="notice">No rivalry candidates are available.</div>')
  }
}

function render(payload: HistoryPayload): void {
  const periodRow = findStreamer(payload.topStreamers ?? [])
  const daily = (payload.daily ?? []).map((day) => ({ day, streamer: findStreamer(day.topStreamers ?? []) }))
  const appearances = daily.filter((entry) => Boolean(entry.streamer))
  const displayName = periodRow?.displayName ?? appearances.at(-1)?.streamer?.displayName ?? requestedName || streamerId
  const battles = (payload.battleArchive ?? []).filter(involvesStreamer).slice(0, 5)

  document.title = `${displayName} ${providerName} history | ViewLoom`
  setText('[data-channel-name]', displayName)
  setText('[data-channel-provider]', `${providerName} retained ranking footprint`)
  setText('[data-channel-period-label]', payload.period?.label ?? (periodMode === '7d' ? 'Last 7 days' : 'Last 30 days'))
  setExternalLink(displayName)
  setStatus(payload.state ?? 'unknown', payload.state ?? 'unknown')
  setFeedback(payload.coverage?.notes?.[0] ?? `${appearances.length} retained daily Top 10 appearances in this period.`)
  renderSummary(periodRow, appearances.length, payload)
  renderTrend(daily)
  renderDays(appearances)
  renderRivals(battles)
  renderScope(payload, appearances.length)
}

function renderSummary(streamer: Streamer | undefined, appearances: number, payload: HistoryPayload): void {
  const root = document.querySelector<HTMLElement>('[data-channel-summary]')
  if (!root) return
  root.innerHTML = `
    ${summaryCard('Viewer-minutes', streamer?.viewerMinutes, 'Retained period total')}
    ${summaryCard('Peak viewers', streamer?.peakViewers, 'Highest retained observation')}
    ${summaryCard('Average viewers', streamer?.avgViewers, 'Viewer-minutes / observed minutes')}
    ${summaryCard('Observed time', streamer?.observedMinutes, 'Retained observation time', formatDuration)}
    ${summaryCard('Daily Top 10 days', appearances, `${payload.period?.days ?? 0} requested days`)}
  `
}

function renderTrend(entries: Array<{ day: Day; streamer?: Streamer }>): void {
  const root = document.querySelector<HTMLElement>('[data-channel-trend]')
  if (!root) return
  if (!entries.length) {
    root.innerHTML = '<div class="notice">No requested days are available.</div>'
    return
  }
  const max = Math.max(1, ...entries.map((entry) => number(entry.streamer?.viewerMinutes)))
  root.innerHTML = `
    <div class="channel-trend-legend"><span>Daily viewer-minutes in retained Top 10</span><small>Absent bars mean not present in retained daily Top 10, not confirmed offline.</small></div>
    <div class="channel-trend-bars" role="img" aria-label="Retained daily viewer-minute footprint">
      ${entries.map((entry) => {
        const value = number(entry.streamer?.viewerMinutes)
        const height = value > 0 ? Math.max(4, (value / max) * 100) : 2
        const state = entry.streamer ? 'observed' : 'absent'
        return `<div class="channel-trend-column channel-trend-column--${state}" title="${escapeHtml(formatDate(entry.day.day))}: ${entry.streamer ? formatNumber(value) : 'Not in retained daily Top 10'}">
          <div class="channel-trend-bar" style="height:${height.toFixed(1)}%"></div>
          <time>${escapeHtml(shortDate(entry.day.day))}</time>
        </div>`
      }).join('')}
    </div>`
}

function renderDays(entries: Array<{ day: Day; streamer?: Streamer }>): void {
  const root = document.querySelector<HTMLElement>('[data-channel-days]')
  if (!root) return
  if (!entries.length) {
    root.innerHTML = '<div class="notice">This streamer did not appear in the retained daily Top 10 for the selected period.</div>'
    return
  }
  root.innerHTML = [...entries].reverse().map(({ day, streamer }) => {
    const date = day.day ?? ''
    return `<article class="channel-day-card">
      <div class="channel-day-card__head"><time>${escapeHtml(formatDate(date))}</time><span class="history-badge history-badge--${safeClass(day.coverageState ?? 'partial')}">${escapeHtml(humanLabel(day.coverageState ?? 'partial'))}</span></div>
      <dl>
        <div><dt>Viewer-minutes</dt><dd>${formatNumber(streamer?.viewerMinutes)}</dd></div>
        <div><dt>Peak viewers</dt><dd>${formatNumber(streamer?.peakViewers)}</dd></div>
        <div><dt>Average viewers</dt><dd>${formatNumber(streamer?.avgViewers)}</dd></div>
        <div><dt>Observed time</dt><dd>${formatDuration(streamer?.observedMinutes)}</dd></div>
        <div><dt>Daily rank</dt><dd>#${formatNumber(streamer?.rankByViewerMinutes)}</dd></div>
      </dl>
      <div class="channel-day-card__actions">
        <a href="/${provider}/day-flow/?date=${encodeURIComponent(date)}&rangeMode=date">Day Flow</a>
        <a href="/${provider}/battle-lines/?date=${encodeURIComponent(date)}&range=date">Battle Lines</a>
      </div>
    </article>`
  }).join('')
}

function renderRivals(entries: BattleEntry[]): void {
  const root = document.querySelector<HTMLElement>('[data-channel-rivals]')
  if (!root) return
  if (!entries.length) {
    root.innerHTML = '<div class="notice">No retained daily rivalry candidate includes this streamer in the selected period.</div>'
    return
  }
  root.innerHTML = entries.map((entry) => {
    const opponentId = normalizeId(entry.streamerAId) === streamerId ? normalizeId(entry.streamerBId) : normalizeId(entry.streamerAId)
    const opponentName = normalizeId(entry.streamerAId) === streamerId ? entry.streamerBName : entry.streamerAName
    const date = entry.day ?? ''
    return `<article class="channel-rival-card">
      <div><small>${escapeHtml(formatDate(date))}</small><strong>${escapeHtml(opponentName ?? opponentId ?? 'Unavailable')}</strong></div>
      <dl><div><dt>Daily rivalry score</dt><dd>${formatNumber(entry.score)}/100</dd></div><div><dt>Viewer-minute gap</dt><dd>${formatNumber(entry.viewerMinutesGap)}</dd></div></dl>
      <a href="/${provider}/battle-lines/?battle=${encodeURIComponent(`${streamerId}:${opponentId}`)}&date=${encodeURIComponent(date)}&range=date">Open Battle Lines</a>
    </article>`
  }).join('')
}

function renderScope(payload: HistoryPayload, appearances: number): void {
  setHtml('[data-channel-scope]', `
    <p><strong>Scope:</strong> ${appearances} retained daily Top 10 appearances across ${payload.period?.days ?? 0} requested days.</p>
    <p>Days without a matching row are not confirmed offline. They only mean the streamer was not present in the retained daily Top 10 payload.</p>
    <p>Session start/end history is not available in this initial page.</p>
    <p><a href="/${provider}/history/?period=${periodMode}">Back to ${providerName} History</a></p>`)
}

function renderMissingId(): void {
  setStatus('Missing channel', 'empty')
  setFeedback('Open this page from a History streamer ranking or provide an id query parameter.')
  setText('[data-channel-name]', 'Channel not selected')
  setHtml('[data-channel-summary]', '<div class="notice">No channel identifier was provided.</div>')
  setHtml('[data-channel-trend]', '<div class="notice">No retained footprint can be loaded.</div>')
  setHtml('[data-channel-days]', '<div class="notice">No retained days are available.</div>')
  setHtml('[data-channel-rivals]', '<div class="notice">No rivalry candidates are available.</div>')
}

function findStreamer(rows: Streamer[]): Streamer | undefined {
  return rows.find((row) => normalizeId(row.streamerId) === streamerId)
}

function involvesStreamer(entry: BattleEntry): boolean {
  return normalizeId(entry.streamerAId) === streamerId || normalizeId(entry.streamerBId) === streamerId
}

function setExternalLink(name: string): void {
  const link = document.querySelector<HTMLAnchorElement>('[data-channel-external]')
  if (!link || !streamerId) return
  link.href = provider === 'twitch' ? `https://www.twitch.tv/${encodeURIComponent(streamerId)}` : `https://kick.com/${encodeURIComponent(streamerId)}`
  link.textContent = `Open ${name} on ${providerName}`
}

function summaryCard(label: string, value: unknown, note: string, formatter = formatNumber): string {
  return `<div><small>${escapeHtml(label)}</small><strong>${formatter(value)}</strong><span>${escapeHtml(note)}</span></div>`
}

function setStatus(label: string, state: string): void {
  const node = document.querySelector<HTMLElement>('[data-channel-state]')
  if (!node) return
  node.textContent = humanLabel(label)
  node.className = `history-state-pill history-state-pill--${safeClass(state)}`
}

function setFeedback(value: string): void { setText('[data-channel-feedback]', value) }
function setText(selector: string, value: string): void { document.querySelector<HTMLElement>(selector)?.replaceChildren(value) }
function setHtml(selector: string, value: string): void { const node = document.querySelector<HTMLElement>(selector); if (node) node.innerHTML = value }
function normalizeId(value: unknown): string { return typeof value === 'string' ? value.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '') : '' }
function number(value: unknown): number { return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, value) : 0 }
function formatNumber(value: unknown): string { return Math.round(number(value)).toLocaleString('en-US') }
function formatDuration(value: unknown): string { const minutes = Math.round(number(value)); return `${Math.floor(minutes / 60).toLocaleString('en-US')}h ${minutes % 60}m` }
function validDay(value: unknown): value is string { return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) }
function formatDate(value: unknown): string { return validDay(value) ? new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${value}T00:00:00.000Z`)) : 'Unknown day' }
function shortDate(value: unknown): string { return validDay(value) ? value.slice(5) : '—' }
function humanLabel(value: string): string { return value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()) }
function safeClass(value: string): string { return value.toLowerCase().replace(/[^a-z0-9_-]/g, '-') }
function escapeHtml(value: unknown): string { return String(value ?? '').replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character] ?? character) }
