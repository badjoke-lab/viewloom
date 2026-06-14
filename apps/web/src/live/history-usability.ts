type Streamer = {
  displayName?: string
  viewerMinutes?: number
  changePct?: number | null
  comparisonState?: 'comparable' | 'new' | 'insufficient' | string
}

type Day = {
  day?: string
  coverageState?: string
}

type Payload = {
  summary?: {
    totalViewerMinutes?: number
    peakViewers?: number
    peakDayViewerMinutes?: number
    topStreamer?: Streamer | null
  } | null
  daily?: Day[]
  topStreamers?: Streamer[]
  coverage?: {
    observedDays?: number
    partialDays?: number
    missingDays?: number
  }
}

type ArchiveFilter = 'all' | 'complete' | 'attention'

const initialParams = new URLSearchParams(location.search)
const preserveExplicitDay = initialParams.has('day')
if (!initialParams.has('limit')) {
  initialParams.set('limit', '10')
  history.replaceState(null, '', `${location.pathname}?${initialParams.toString()}`)
}

let payload: Payload | null = null
let revision = 0
let appliedRevision = -1
let archiveFilter: ArchiveFilter = 'all'
let archiveExpanded = false
let autoSelectPending = !preserveExplicitDay
let scheduled = false
let applying = false

const originalFetch = window.fetch.bind(window)
window.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
  const response = await originalFetch(input, init)
  const requestUrl = new URL(typeof input === 'string' || input instanceof URL ? input : input.url, location.origin)
  if (requestUrl.pathname === '/api/history' || requestUrl.pathname === '/api/kick-history') {
    try {
      payload = await response.clone().json() as Payload
      revision += 1
      archiveExpanded = false
      autoSelectPending = !preserveExplicitDay
      schedule()
    } catch {
      payload = null
    }
  }
  return response
}) as typeof window.fetch

bindArchiveToolbar()

const observer = new MutationObserver(schedule)
observe()
schedule()

function observe(): void {
  observer.observe(document.documentElement, { childList: true, subtree: true })
}

function schedule(): void {
  if (scheduled) return
  scheduled = true
  requestAnimationFrame(() => {
    scheduled = false
    enhance()
  })
}

function enhance(): void {
  if (applying || !payload) return
  applying = true
  observer.disconnect()
  try {
    const isNewPayload = revision !== appliedRevision
    if (isNewPayload) selectLatestCompletedDay(payload)
    compactSummary(payload)
    renderCoverageScope(payload)
    markDayStates(payload)
    improveSelectedDay(payload)
    improveRanking(payload)
    updateArchive(payload)
    appliedRevision = revision
  } finally {
    observe()
    applying = false
  }
}

function selectLatestCompletedDay(data: Payload): void {
  if (!autoSelectPending) return
  const today = todayUtc()
  const days = data.daily ?? []
  const candidate = [...days].reverse().find((day) => day.day && day.day < today && day.coverageState === 'good')
    ?? [...days].reverse().find((day) => day.day && day.day < today && day.coverageState !== 'missing')
  if (candidate?.day && new URL(location.href).searchParams.get('day') !== candidate.day) {
    const target = document.querySelector<SVGGElement>(`.history-day-column[data-history-day="${cssEscape(candidate.day)}"]`)
    target?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  }
  autoSelectPending = false
}

function compactSummary(data: Payload): void {
  const summary = data.summary
  const root = document.querySelector<HTMLElement>('[data-history-summary]')
  if (!summary || !root) return
  const cards = Array.from(root.children) as HTMLElement[]
  const total = summary.totalViewerMinutes
  if (typeof total === 'number') {
    const strong = cards[0]?.querySelector<HTMLElement>('strong')
    const detail = cards[0]?.querySelector<HTMLElement>('span')
    setText(strong, compact(total), exact(total))
    setText(detail, `viewer-minutes · exact ${exact(total)}`)
  }
  if (typeof summary.peakDayViewerMinutes === 'number') {
    setText(cards[1]?.querySelector<HTMLElement>('span'), `${compact(summary.peakDayViewerMinutes)} viewer-minutes`, exact(summary.peakDayViewerMinutes))
  }
  if (typeof summary.topStreamer?.viewerMinutes === 'number') {
    setText(cards[2]?.querySelector<HTMLElement>('span'), `${compact(summary.topStreamer.viewerMinutes)} viewer-minutes`, exact(summary.topStreamer.viewerMinutes))
  }
  if (typeof summary.peakViewers === 'number') {
    const cell = document.querySelectorAll<HTMLElement>('.data-strip__cell')[2]
    if (cell) {
      const label = cell.querySelector('small')?.outerHTML ?? '<small>Peak viewers</small>'
      const value = compact(summary.peakViewers)
      if (cell.innerHTML !== `${label}${value}`) cell.innerHTML = `${label}${value}`
      cell.title = exact(summary.peakViewers)
    }
  }
}

function renderCoverageScope(data: Payload): void {
  const root = document.querySelector<HTMLElement>('[data-history-coverage-summary]')
  if (!root) return
  const hasToday = (data.daily ?? []).some((day) => day.day === todayUtc())
  const observed = data.coverage?.observedDays ?? data.daily?.length ?? 0
  const partial = data.coverage?.partialDays ?? 0
  const missing = data.coverage?.missingDays ?? 0
  root.className = `history-coverage-summary ${hasToday || partial || missing ? 'is-attention' : 'is-good'}`
  const html = hasToday
    ? `<div><strong>Today is still in progress.</strong><span>Today stays visible in the chart and archive, but completed-period summaries and rankings stop at the latest finished day.</span></div>`
    : `<div><strong>Completed-period view.</strong><span>Summary cards and rankings use finished observed days in this range.</span></div>`
  const counts = `<div class="history-coverage-summary__counts"><span>${observed} observed</span><span>${partial} partial</span><span>${missing} missing</span></div>`
  if (root.innerHTML !== html + counts) root.innerHTML = html + counts
}

function markDayStates(data: Payload): void {
  const today = todayUtc()
  const dayMap = new Map((data.daily ?? []).filter((day) => day.day).map((day) => [day.day as string, day]))
  document.querySelectorAll<SVGGElement>('.history-day-column[data-history-day]').forEach((group) => {
    const inProgress = group.dataset.historyDay === today
    group.classList.toggle('is-in-progress', inProgress)
    group.querySelector('.history-bar')?.classList.toggle('history-bar--in-progress', inProgress)
  })
  document.querySelectorAll<HTMLElement>('[data-history-day-card]').forEach((card) => {
    const day = card.dataset.historyDayCard ?? ''
    const record = dayMap.get(day)
    const state = day === today ? 'in-progress' : record?.coverageState === 'good' ? 'complete' : 'attention'
    card.dataset.historyArchiveState = state
    const badge = card.querySelector<HTMLElement>('.history-badge')
    if (badge && day === today) {
      setText(badge, 'In progress')
      badge.className = 'history-badge history-badge--in-progress'
    }
  })
}

function improveSelectedDay(data: Payload): void {
  const root = document.querySelector<HTMLElement>('[data-history-selected-day]')
  const selected = new URL(location.href).searchParams.get('day')
  const day = (data.daily ?? []).find((item) => item.day === selected)
  if (!root || !day?.day) return
  const inProgress = day.day === todayUtc()
  const needsAttention = inProgress || day.coverageState !== 'good'
  if (inProgress) setText(root.querySelector<HTMLElement>('.surface__head small'), 'Today · In progress')
  const body = root.querySelector<HTMLElement>('.history-selected-body')
  let warning = body?.querySelector<HTMLElement>('[data-history-selected-warning]') ?? null
  if (body && needsAttention) {
    if (!warning) {
      warning = document.createElement('div')
      warning.dataset.historySelectedWarning = 'true'
      body.prepend(warning)
    }
    warning.className = 'history-selected-warning'
    const html = inProgress
      ? '<strong>In-progress day</strong><span>Values can still change and are excluded from completed-period summary and ranking.</span>'
      : `<strong>${human(day.coverageState ?? 'partial')} coverage</strong><span>This day may understate actual platform activity.</span>`
    if (warning.innerHTML !== html) warning.innerHTML = html
  } else {
    warning?.remove()
  }
  root.querySelectorAll('.history-selected-top li span').forEach((name, index) => {
    const value = `#${index + 1} ${name.textContent?.replace(/^#\d+\s+/, '') ?? '—'}`
    if (name.textContent !== value) name.textContent = value
  })
}

function improveRanking(data: Payload): void {
  const byName = new Map((data.topStreamers ?? []).filter((item) => item.displayName).map((item) => [item.displayName as string, item]))
  document.querySelectorAll<HTMLTableRowElement>('.history-peak-archive tbody tr').forEach((row) => {
    const cells = row.querySelectorAll<HTMLTableCellElement>('td')
    const streamer = byName.get(cells[1]?.textContent?.trim() ?? '')
    const change = cells[cells.length - 1]
    if (!streamer || !change) return
    setText(change, comparison(streamer))
    change.className = `num ${comparisonClass(streamer)}`
  })
  document.querySelectorAll<HTMLElement>('.history-streamer-card').forEach((card) => {
    const streamer = byName.get(card.querySelector('.history-streamer-card__head strong')?.textContent?.trim() ?? '')
    if (!streamer) return
    card.querySelectorAll<HTMLElement>('dl > div').forEach((metric) => {
      if (metric.querySelector('dt')?.textContent?.trim() !== 'Change') return
      const value = metric.querySelector<HTMLElement>('dd')
      setText(value, comparison(streamer))
      if (value) value.className = comparisonClass(streamer)
    })
  })
}

function comparison(streamer: Streamer): string {
  if (streamer.comparisonState === 'new') return 'New'
  if (streamer.comparisonState === 'insufficient') return 'Low baseline'
  if (typeof streamer.changePct !== 'number' || !Number.isFinite(streamer.changePct)) return 'Not comparable'
  if (Math.abs(streamer.changePct) > 3) return 'Low baseline'
  const value = Math.round(streamer.changePct * 100)
  return `${value >= 0 ? '+' : ''}${value}%`
}

function comparisonClass(streamer: Streamer): string {
  if (streamer.comparisonState !== 'comparable' || typeof streamer.changePct !== 'number' || Math.abs(streamer.changePct) > 3 || streamer.changePct === 0) return 'flat'
  return streamer.changePct > 0 ? 'up' : 'down'
}

function bindArchiveToolbar(): void {
  const toolbar = document.querySelector<HTMLElement>('[data-history-archive-toolbar]')
  if (!toolbar || toolbar.dataset.bound === 'true') return
  toolbar.dataset.bound = 'true'
  toolbar.querySelectorAll<HTMLButtonElement>('[data-history-archive-filter]').forEach((button) => {
    button.addEventListener('click', () => {
      const filter = button.dataset.historyArchiveFilter
      if (filter !== 'all' && filter !== 'complete' && filter !== 'attention') return
      archiveFilter = filter
      archiveExpanded = false
      syncArchiveButtons()
      if (payload) updateArchive(payload)
    })
  })
  toolbar.querySelector<HTMLButtonElement>('[data-history-archive-toggle]')?.addEventListener('click', () => {
    archiveExpanded = !archiveExpanded
    if (payload) updateArchive(payload)
  })
  syncArchiveButtons()
}

function syncArchiveButtons(): void {
  document.querySelectorAll<HTMLButtonElement>('[data-history-archive-filter]').forEach((button) => {
    const active = button.dataset.historyArchiveFilter === archiveFilter
    button.classList.toggle('active', active)
    button.setAttribute('aria-pressed', String(active))
  })
}

function updateArchive(_data: Payload): void {
  const cards = Array.from(document.querySelectorAll<HTMLElement>('[data-history-day-card]'))
  if (!cards.length) return
  const selected = new URL(location.href).searchParams.get('day')
  const matches = (card: HTMLElement) => {
    const state = card.dataset.historyArchiveState ?? 'attention'
    return archiveFilter === 'all' || archiveFilter === 'complete' && state === 'complete' || archiveFilter === 'attention' && state !== 'complete'
  }
  const matchingCount = cards.filter(matches).length
  let index = 0
  cards.forEach((card) => {
    const match = matches(card)
    const keepSelected = card.dataset.historyDayCard === selected
    const recent = index < 9
    card.hidden = !match || !archiveExpanded && !recent && !keepSelected
    if (match) index += 1
  })
  const toggle = document.querySelector<HTMLButtonElement>('[data-history-archive-toggle]')
  if (toggle) {
    toggle.hidden = matchingCount <= 9
    setText(toggle, archiveExpanded ? 'Show recent 9' : `Show all ${matchingCount} days`)
    toggle.setAttribute('aria-expanded', String(archiveExpanded))
  }
  const visible = cards.filter((card) => !card.hidden).length
  setText(document.querySelector<HTMLElement>('[data-history-archive-status]'), `${visible} of ${matchingCount} matching days shown`)
  const complete = cards.filter((card) => card.dataset.historyArchiveState === 'complete').length
  setText(document.querySelector<HTMLButtonElement>('[data-history-archive-filter="all"]'), `All (${cards.length})`)
  setText(document.querySelector<HTMLButtonElement>('[data-history-archive-filter="complete"]'), `Complete (${complete})`)
  setText(document.querySelector<HTMLButtonElement>('[data-history-archive-filter="attention"]'), `Needs attention (${cards.length - complete})`)
}

function setText(node: HTMLElement | null | undefined, value: string, title?: string): void {
  if (!node) return
  if (node.textContent !== value) node.textContent = value
  if (title !== undefined && node.title !== title) node.title = title
}

function compact(value: number): string {
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(value)
}

function exact(value: number): string {
  return Math.round(value).toLocaleString('en-US')
}

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10)
}

function human(value: string): string {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase())
}

function cssEscape(value: string): string {
  return window.CSS?.escape ? window.CSS.escape(value) : value.replace(/[^a-zA-Z0-9_-]/g, '\\$&')
}

export {}
