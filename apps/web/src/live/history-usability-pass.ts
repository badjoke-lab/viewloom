type UsabilityStreamer = {
  displayName?: string
  viewerMinutes?: number
  changePct?: number | null
  comparisonState?: 'comparable' | 'new' | 'insufficient' | string
}

type UsabilityDay = {
  day?: string
  totalViewerMinutes?: number
  peakViewers?: number
  coverageState?: string
  topStreamers?: UsabilityStreamer[]
}

type UsabilityPayload = {
  platform?: string
  source?: string
  state?: string
  summary?: {
    totalViewerMinutes?: number
    peakViewers?: number
    peakDayViewerMinutes?: number
    topStreamer?: UsabilityStreamer | null
  } | null
  daily?: UsabilityDay[]
  topStreamers?: UsabilityStreamer[]
  coverage?: {
    state?: string
    observedDays?: number
    partialDays?: number
    missingDays?: number
    inProgressDays?: number
  }
}

type ArchiveFilter = 'all' | 'complete' | 'attention'

const initialParams = new URLSearchParams(window.location.search)
const initialDayWasExplicit = initialParams.has('day')
if (!initialParams.has('limit')) {
  initialParams.set('limit', '10')
  window.history.replaceState(null, '', `${window.location.pathname}?${initialParams.toString()}`)
}

let latestPayload: UsabilityPayload | null = null
let payloadRevision = 0
let appliedPayloadRevision = -1
let autoSelectionPending = !initialDayWasExplicit
let archiveFilter: ArchiveFilter = 'all'
let archiveExpanded = false
let scheduled = false
let applying = false

const originalFetch = window.fetch.bind(window)
window.fetch = (async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const response = await originalFetch(input, init)
  const requestUrl = new URL(typeof input === 'string' || input instanceof URL ? input : input.url, window.location.origin)
  if (requestUrl.pathname === '/api/history' || requestUrl.pathname === '/api/kick-history') {
    try {
      latestPayload = await response.clone().json() as UsabilityPayload
      payloadRevision += 1
      archiveExpanded = false
      autoSelectionPending = !initialDayWasExplicit
      scheduleEnhancements()
    } catch {
      latestPayload = null
    }
  }
  return response
}) as typeof window.fetch

bindArchiveControls()

const observer = new MutationObserver(() => scheduleEnhancements())
observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true })
scheduleEnhancements()

function scheduleEnhancements(): void {
  if (scheduled) return
  scheduled = true
  window.requestAnimationFrame(() => {
    scheduled = false
    applyEnhancements()
  })
}

function applyEnhancements(): void {
  if (applying || !latestPayload) return
  applying = true
  try {
    const isNewPayload = appliedPayloadRevision !== payloadRevision
    compactSummary(latestPayload)
    renderCoverageSummary(latestPayload)
    markDayStates(latestPayload)
    improveSelectedDay(latestPayload)
    improveRanking(latestPayload)
    applyArchiveVisibility(latestPayload)
    if (isNewPayload) {
      selectLatestCompletedDay(latestPayload)
      appliedPayloadRevision = payloadRevision
    }
  } finally {
    applying = false
  }
}

function selectLatestCompletedDay(payload: UsabilityPayload): void {
  if (!autoSelectionPending) return
  const days = payload.daily ?? []
  const today = todayUtc()
  const candidate = [...days]
    .reverse()
    .find((day) => day.day && day.day < today && day.coverageState === 'good')
    ?? [...days].reverse().find((day) => day.day && day.day < today && day.coverageState !== 'missing')
  const targetDay = candidate?.day
  if (!targetDay) {
    autoSelectionPending = false
    return
  }
  const selectedDay = new URL(window.location.href).searchParams.get('day')
  if (selectedDay !== targetDay) {
    const target = document.querySelector<SVGGElement>(`.history-day-column[data-history-day="${cssEscape(targetDay)}"]`)
    target?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  }
  autoSelectionPending = false
}

function compactSummary(payload: UsabilityPayload): void {
  const root = document.querySelector<HTMLElement>('[data-history-summary]')
  const summary = payload.summary
  if (!root || !summary) return
  const cards = Array.from(root.children) as HTMLElement[]
  setCompactCard(cards[0], summary.totalViewerMinutes, 'viewer-minutes')
  const peakDetail = cards[1]?.querySelector<HTMLElement>('span')
  if (peakDetail && typeof summary.peakDayViewerMinutes === 'number') {
    peakDetail.textContent = `${formatCompact(summary.peakDayViewerMinutes)} viewer-minutes`
    peakDetail.title = formatExact(summary.peakDayViewerMinutes)
  }
  const topDetail = cards[2]?.querySelector<HTMLElement>('span')
  if (topDetail && typeof summary.topStreamer?.viewerMinutes === 'number') {
    topDetail.textContent = `${formatCompact(summary.topStreamer.viewerMinutes)} viewer-minutes`
    topDetail.title = formatExact(summary.topStreamer.viewerMinutes)
  }

  const stripPeak = document.querySelectorAll<HTMLElement>('.data-strip__cell')[2]
  if (stripPeak && typeof summary.peakViewers === 'number') {
    const label = stripPeak.querySelector('small')?.outerHTML ?? '<small>Peak viewers</small>'
    stripPeak.innerHTML = `${label}${formatCompact(summary.peakViewers)}`
    stripPeak.title = formatExact(summary.peakViewers)
  }
}

function setCompactCard(card: HTMLElement | undefined, value: number | undefined, unit: string): void {
  if (!card || typeof value !== 'number' || !Number.isFinite(value)) return
  const strong = card.querySelector<HTMLElement>('strong')
  const detail = card.querySelector<HTMLElement>('span')
  if (strong) {
    strong.textContent = formatCompact(value)
    strong.title = formatExact(value)
  }
  if (detail) detail.textContent = `${unit} · exact ${formatExact(value)}`
}

function renderCoverageSummary(payload: UsabilityPayload): void {
  const root = document.querySelector<HTMLElement>('[data-history-coverage-summary]')
  if (!root) return
  const today = todayUtc()
  const todayObserved = (payload.daily ?? []).some((day) => day.day === today)
  const partial = payload.coverage?.partialDays ?? 0
  const missing = payload.coverage?.missingDays ?? 0
  const observed = payload.coverage?.observedDays ?? payload.daily?.length ?? 0
  root.className = `history-coverage-summary ${todayObserved || partial || missing ? 'is-attention' : 'is-good'}`
  root.innerHTML = todayObserved
    ? `<div><strong>Today is still in progress.</strong><span>Today remains visible in the chart and archive, but completed-period summaries and rankings stop at the latest finished day.</span></div><div class="history-coverage-summary__counts"><span>${observed} observed</span><span>${partial} partial</span><span>${missing} missing</span></div>`
    : `<div><strong>Completed-period view.</strong><span>Summary cards and rankings use finished observed days in this range.</span></div><div class="history-coverage-summary__counts"><span>${observed} observed</span><span>${partial} partial</span><span>${missing} missing</span></div>`
}

function markDayStates(payload: UsabilityPayload): void {
  const today = todayUtc()
  const dayMap = new Map((payload.daily ?? []).filter((day) => day.day).map((day) => [day.day as string, day]))

  document.querySelectorAll<SVGGElement>('.history-day-column[data-history-day]').forEach((group) => {
    const day = group.dataset.historyDay ?? ''
    const current = day === today
    group.classList.toggle('is-in-progress', current)
    const bar = group.querySelector<SVGRectElement>('.history-bar')
    bar?.classList.toggle('history-bar--in-progress', current)
    if (current && !group.getAttribute('aria-label')?.includes('in progress')) {
      group.setAttribute('aria-label', `${group.getAttribute('aria-label') ?? day}, in progress`)
    }
  })

  document.querySelectorAll<HTMLElement>('[data-history-day-card]').forEach((card) => {
    const day = card.dataset.historyDayCard ?? ''
    const record = dayMap.get(day)
    const state = day === today ? 'in-progress' : record?.coverageState === 'good' ? 'complete' : 'attention'
    card.dataset.historyArchiveState = state
    const badge = card.querySelector<HTMLElement>('.history-badge')
    if (badge && day === today) {
      badge.textContent = 'In progress'
      badge.className = 'history-badge history-badge--in-progress'
    }
  })
}

function improveSelectedDay(payload: UsabilityPayload): void {
  const root = document.querySelector<HTMLElement>('[data-history-selected-day]')
  if (!root) return
  const selectedDay = new URL(window.location.href).searchParams.get('day')
  const day = (payload.daily ?? []).find((item) => item.day === selectedDay)
  if (!day?.day) return
  const today = todayUtc()
  const isInProgress = day.day === today
  const needsAttention = isInProgress || day.coverageState !== 'good'
  const headLabel = root.querySelector<HTMLElement>('.surface__head small')
  if (headLabel && isInProgress) headLabel.textContent = 'Today · In progress'

  const body = root.querySelector<HTMLElement>('.history-selected-body')
  if (body) {
    let warning = body.querySelector<HTMLElement>('[data-history-selected-warning]')
    if (needsAttention) {
      if (!warning) {
        warning = document.createElement('div')
        warning.dataset.historySelectedWarning = 'true'
        body.prepend(warning)
      }
      warning.className = 'history-selected-warning'
      warning.innerHTML = isInProgress
        ? '<strong>In-progress day</strong><span>Values can still change and are excluded from completed-period summary and ranking.</span>'
        : `<strong>${humanLabel(day.coverageState ?? 'partial')} coverage</strong><span>This day may understate actual platform activity.</span>`
    } else {
      warning?.remove()
    }
  }

  root.querySelectorAll<HTMLLIElement>('.history-selected-top li').forEach((item, index) => {
    const name = item.querySelector<HTMLElement>('span')
    if (!name) return
    name.textContent = `#${index + 1} ${name.textContent?.replace(/^#\d+\s+/, '') ?? '—'}`
  })
}

function improveRanking(payload: UsabilityPayload): void {
  const streamerMap = new Map(
    (payload.topStreamers ?? [])
      .filter((streamer) => streamer.displayName)
      .map((streamer) => [streamer.displayName as string, streamer]),
  )

  document.querySelectorAll<HTMLTableRowElement>('.history-peak-archive tbody tr').forEach((row) => {
    const cells = row.querySelectorAll<HTMLTableCellElement>('td')
    if (cells.length < 2) return
    const name = cells[1]?.textContent?.trim() ?? ''
    const streamer = streamerMap.get(name)
    const changeCell = cells[cells.length - 1]
    if (!streamer || !changeCell) return
    changeCell.textContent = comparisonLabel(streamer)
    changeCell.className = `num ${comparisonClass(streamer)}`
  })

  document.querySelectorAll<HTMLElement>('.history-streamer-card').forEach((card) => {
    const name = card.querySelector<HTMLElement>('.history-streamer-card__head strong')?.textContent?.trim() ?? ''
    const streamer = streamerMap.get(name)
    if (!streamer) return
    card.querySelectorAll<HTMLElement>('dl > div').forEach((metric) => {
      const label = metric.querySelector('dt')?.textContent?.trim()
      if (label === 'Change') {
        const value = metric.querySelector<HTMLElement>('dd')
        if (value) {
          value.textContent = comparisonLabel(streamer)
          value.className = comparisonClass(streamer)
        }
      }
    })
  })
}

function comparisonLabel(streamer: UsabilityStreamer): string {
  if (streamer.comparisonState === 'new') return 'New'
  if (streamer.comparisonState === 'insufficient') return 'Low baseline'
  if (typeof streamer.changePct !== 'number' || !Number.isFinite(streamer.changePct)) return 'Not comparable'
  if (Math.abs(streamer.changePct) > 3) return 'Low baseline'
  const percentage = Math.round(streamer.changePct * 100)
  return `${percentage >= 0 ? '+' : ''}${percentage}%`
}

function comparisonClass(streamer: UsabilityStreamer): string {
  if (streamer.comparisonState !== 'comparable' || typeof streamer.changePct !== 'number') return 'flat'
  if (Math.abs(streamer.changePct) > 3 || streamer.changePct === 0) return 'flat'
  return streamer.changePct > 0 ? 'up' : 'down'
}

function bindArchiveControls(): void {
  const toolbar = document.querySelector<HTMLElement>('[data-history-archive-toolbar]')
  if (!toolbar || toolbar.dataset.bound === 'true') return
  toolbar.dataset.bound = 'true'
  toolbar.querySelectorAll<HTMLButtonElement>('[data-history-archive-filter]').forEach((button) => {
    button.addEventListener('click', () => {
      const filter = button.dataset.historyArchiveFilter
      if (filter !== 'all' && filter !== 'complete' && filter !== 'attention') return
      archiveFilter = filter
      archiveExpanded = false
      syncArchiveControls()
      if (latestPayload) applyArchiveVisibility(latestPayload)
    })
  })
  toolbar.querySelector<HTMLButtonElement>('[data-history-archive-toggle]')?.addEventListener('click', () => {
    archiveExpanded = !archiveExpanded
    if (latestPayload) applyArchiveVisibility(latestPayload)
  })
  syncArchiveControls()
}

function syncArchiveControls(): void {
  document.querySelectorAll<HTMLButtonElement>('[data-history-archive-filter]').forEach((button) => {
    const active = button.dataset.historyArchiveFilter === archiveFilter
    button.classList.toggle('active', active)
    button.setAttribute('aria-pressed', String(active))
  })
}

function applyArchiveVisibility(payload: UsabilityPayload): void {
  const cards = Array.from(document.querySelectorAll<HTMLElement>('[data-history-day-card]'))
  if (!cards.length) return
  const selectedDay = new URL(window.location.href).searchParams.get('day')
  let matchingIndex = 0
  let matchingCount = 0

  for (const card of cards) {
    const state = card.dataset.historyArchiveState ?? 'attention'
    const matches = archiveFilter === 'all'
      || archiveFilter === 'complete' && state === 'complete'
      || archiveFilter === 'attention' && state !== 'complete'
    if (matches) matchingCount += 1
  }

  for (const card of cards) {
    const state = card.dataset.historyArchiveState ?? 'attention'
    const matches = archiveFilter === 'all'
      || archiveFilter === 'complete' && state === 'complete'
      || archiveFilter === 'attention' && state !== 'complete'
    const selected = card.dataset.historyDayCard === selectedDay
    const insideRecentWindow = matchingIndex < 9
    card.hidden = !matches || (!archiveExpanded && !insideRecentWindow && !selected)
    if (matches) matchingIndex += 1
  }

  const toggle = document.querySelector<HTMLButtonElement>('[data-history-archive-toggle]')
  if (toggle) {
    toggle.hidden = matchingCount <= 9
    toggle.textContent = archiveExpanded ? 'Show recent 9' : `Show all ${matchingCount} days`
    toggle.setAttribute('aria-expanded', String(archiveExpanded))
  }
  const status = document.querySelector<HTMLElement>('[data-history-archive-status]')
  if (status) {
    const visibleCount = cards.filter((card) => !card.hidden).length
    status.textContent = `${visibleCount} of ${matchingCount} matching days shown`
  }

  const completeCount = cards.filter((card) => card.dataset.historyArchiveState === 'complete').length
  const attentionCount = cards.length - completeCount
  setArchiveButtonLabel('all', `All (${cards.length})`)
  setArchiveButtonLabel('complete', `Complete (${completeCount})`)
  setArchiveButtonLabel('attention', `Needs attention (${attentionCount})`)
}

function setArchiveButtonLabel(filter: ArchiveFilter, label: string): void {
  const button = document.querySelector<HTMLButtonElement>(`[data-history-archive-filter="${filter}"]`)
  if (button) button.textContent = label
}

function formatCompact(value: number): string {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value)
}

function formatExact(value: number): string {
  return Math.round(value).toLocaleString('en-US')
}

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10)
}

function humanLabel(value: string): string {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

function cssEscape(value: string): string {
  return window.CSS?.escape ? window.CSS.escape(value) : value.replace(/[^a-zA-Z0-9_-]/g, '\\$&')
}

export {}
