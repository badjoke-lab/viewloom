type ClarityStreamer = {
  displayName?: string
  comparisonState?: 'comparable' | 'new' | 'insufficient' | string
  changePct?: number | null
  changeAbs?: number | null
}

type ClarityDay = {
  day?: string
  totalViewerMinutes?: number
  peakViewers?: number
  peakStreamerName?: string | null
  observedStreamCount?: number
  observedMinutes?: number
  coverageState?: string
  topStreamers?: ClarityStreamer[]
  biggestRise?: unknown
}

type ClarityPayload = {
  period?: { from?: string; to?: string; days?: number }
  summary?: { biggestRise?: unknown } | null
  daily?: ClarityDay[]
  topStreamers?: ClarityStreamer[]
  comparison?: { previousPeriodAvailable?: boolean }
  coverage?: {
    state?: string
    observedDays?: number
    missingDays?: number
    partialDays?: number
    inProgressDays?: number
    observedMinutes?: number
    expectedMinutes?: number
    affectedDays?: string[]
    inProgressDates?: string[]
    partialDates?: string[]
    missingDates?: string[]
    demoDates?: string[]
    notes?: string[]
  }
}

type ArchiveFilter = 'all' | 'complete' | 'in-progress' | 'partial' | 'missing'

let latestPayload: ClarityPayload | null = null
let archiveFilter: ArchiveFilter = 'all'
let archiveExpanded = false
let scheduled = false
let applying = false

const originalFetch = window.fetch.bind(window)
window.fetch = (async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const response = await originalFetch(input, init)
  const url = new URL(typeof input === 'string' || input instanceof URL ? input : input.url, location.origin)
  if (url.pathname !== '/api/history' && url.pathname !== '/api/kick-history') return response

  try {
    const payload = await response.clone().json() as ClarityPayload
    const normalized = normalizePayload(payload)
    latestPayload = normalized
    schedule()
    return new Response(JSON.stringify(normalized), {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    })
  } catch {
    return response
  }
}) as typeof window.fetch

const observer = new MutationObserver(schedule)
observe()
document.addEventListener('click', handleArchiveClick)
schedule()

function observe(): void {
  observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true })
}

function schedule(): void {
  if (scheduled) return
  scheduled = true
  requestAnimationFrame(() => {
    scheduled = false
    apply()
  })
}

function apply(): void {
  if (applying) return
  applying = true
  observer.disconnect()
  try {
    alignRanking()
    simplifySummary()
    clarifyTrackedStreams()
    suppressDuplicateFeedback()
    classifyArchiveCards()
    renderArchiveToolbar()
    applyArchiveFilter()
    if (latestPayload) renderCoverageBreakdown(latestPayload)
  } finally {
    observe()
    applying = false
  }
}

function normalizePayload(payload: ClarityPayload): ClarityPayload {
  const normalized = structuredClone(payload)
  const from = normalized.period?.from
  const to = normalized.period?.to
  if (from && to) {
    const byDay = new Map((normalized.daily ?? []).filter((day) => day.day).map((day) => [day.day as string, day]))
    normalized.daily = enumerateDays(from, to).map((day) => byDay.get(day) ?? missingDay(day))
  }

  const top = normalized.topStreamers ?? []
  const explicitNoBaseline = normalized.comparison?.previousPeriodAvailable === false
  const inferredNoBaseline = normalized.comparison?.previousPeriodAvailable == null
    && top.length > 0
    && top.every((streamer) => streamer.comparisonState === 'new')
    && !normalized.summary?.biggestRise
  if (explicitNoBaseline || inferredNoBaseline) {
    normalized.comparison = { previousPeriodAvailable: false }
    normalized.topStreamers = top.map((streamer): ClarityStreamer => ({
      ...streamer,
      comparisonState: 'insufficient',
      changePct: undefined,
      changeAbs: undefined,
    }))
  }

  normalized.coverage = recalculateCoverage(normalized)
  return normalized
}

function recalculateCoverage(payload: ClarityPayload): NonNullable<ClarityPayload['coverage']> {
  const today = todayUtc()
  const daily = payload.daily ?? []
  const observed = daily.filter((day) => day.coverageState !== 'missing')
  const inProgressDates = observed.filter((day) => day.day === today).map((day) => day.day as string)
  const partialDates = observed
    .filter((day) => day.day !== today && day.coverageState !== 'good' && day.coverageState !== 'demo')
    .map((day) => day.day as string)
  const missingDates = daily.filter((day) => day.coverageState === 'missing').map((day) => day.day as string)
  const demoDates = observed.filter((day) => day.coverageState === 'demo').map((day) => day.day as string)
  const original = payload.coverage ?? {}
  return {
    ...original,
    state: observed.length === 0 ? 'missing' : inProgressDates.length || partialDates.length || missingDates.length || demoDates.length ? 'partial' : 'good',
    observedDays: observed.length,
    missingDays: missingDates.length,
    partialDays: partialDates.length + demoDates.length,
    inProgressDays: inProgressDates.length,
    affectedDays: [...inProgressDates, ...partialDates, ...missingDates, ...demoDates],
    inProgressDates,
    partialDates,
    missingDates,
    demoDates,
  }
}

function alignRanking(): void {
  const table = document.querySelector<HTMLTableElement>('.history-peak-archive')
  if (!table) return
  table.classList.add('history-peak-archive--aligned')
  const headers = table.querySelectorAll<HTMLTableCellElement>('thead th')
  if (headers[0]) headers[0].className = 'history-col-rank'
  if (headers[1]) headers[1].className = 'history-col-streamer'
  if (headers[2]) headers[2].className = 'history-col-number'
  if (headers[3]) headers[3].className = 'history-col-number'
  if (headers[6]) {
    headers[6].className = 'history-col-change'
    setText(headers[6], 'Vs previous')
    headers[6].title = 'Change versus the immediately preceding equal-length period'
  }
}

function simplifySummary(): void {
  const cards = document.querySelectorAll<HTMLElement>('[data-history-summary] > div')
  const leadDetail = cards[0]?.querySelector<HTMLElement>('span')
  if (leadDetail?.textContent?.includes('exact')) setText(leadDetail, 'viewer-minutes')

  const riseCard = cards[3]
  const riseStrong = riseCard?.querySelector<HTMLElement>('strong')
  const riseDetail = riseCard?.querySelector<HTMLElement>('span')
  if (riseStrong?.textContent?.includes('Not enough previous data') || latestPayload?.comparison?.previousPeriodAvailable === false) {
    setText(riseStrong, 'No baseline')
    setText(riseDetail, 'Previous-period data unavailable')
  }
}

function clarifyTrackedStreams(): void {
  document.querySelectorAll<HTMLElement>('[data-history-selected-day] small, [data-history-daily-archive] dt').forEach((label) => {
    if (label.textContent?.trim() === 'Observed streams') setText(label, 'Tracked streams (max)')
  })
}

function suppressDuplicateFeedback(): void {
  const feedback = document.querySelector<HTMLElement>('[data-history-feedback]')
  if (!feedback) return
  if (feedback.classList.contains('is-error')) {
    feedback.hidden = false
    return
  }
  feedback.textContent = ''
  feedback.hidden = true
}

function classifyArchiveCards(): void {
  const today = todayUtc()
  document.querySelectorAll<HTMLElement>('[data-history-day-card]').forEach((card) => {
    const day = card.dataset.historyDayCard ?? ''
    const badge = card.querySelector<HTMLElement>('.history-badge')
    let state: ArchiveFilter = 'partial'
    if (day === today && !badge?.classList.contains('history-badge--missing')) state = 'in-progress'
    else if (badge?.classList.contains('history-badge--good')) state = 'complete'
    else if (badge?.classList.contains('history-badge--missing')) state = 'missing'
    card.dataset.historyClarityState = state
    if (state === 'missing') {
      const value = card.querySelector<HTMLElement>(':scope > strong')
      const unit = card.querySelector<HTMLElement>(':scope > span')
      setText(value, 'No data')
      setText(unit, 'Observation missing')
    }
  })
}

function renderArchiveToolbar(): void {
  const toolbar = document.querySelector<HTMLElement>('[data-history-archive-toolbar]')
  if (!toolbar) return
  const counts = archiveCounts()
  const html = `<div class="control-group history-archive-filters">
    ${filterButton('all', `All (${counts.all})`)}
    ${filterButton('complete', `Complete (${counts.complete})`)}
    ${filterButton('in-progress', `In progress (${counts['in-progress']})`)}
    ${filterButton('partial', `Partial (${counts.partial})`)}
    ${filterButton('missing', `Missing (${counts.missing})`)}
  </div>
  <div class="history-archive-toolbar__right"><span data-history-archive-status></span><button class="button button--paper" type="button" data-history-clarity-toggle aria-expanded="${archiveExpanded}"></button></div>`
  if (toolbar.dataset.historyClarityToolbar !== 'true') {
    toolbar.innerHTML = html
    toolbar.dataset.historyClarityToolbar = 'true'
  }
  toolbar.querySelectorAll<HTMLButtonElement>('[data-history-clarity-filter]').forEach((button) => {
    const active = button.dataset.historyClarityFilter === archiveFilter
    button.classList.toggle('active', active)
    button.setAttribute('aria-pressed', String(active))
  })
}

function applyArchiveFilter(): void {
  const cards = Array.from(document.querySelectorAll<HTMLElement>('[data-history-day-card]'))
  if (!cards.length) return
  const selected = new URL(location.href).searchParams.get('day')
  const matches = (card: HTMLElement) => archiveFilter === 'all' || card.dataset.historyClarityState === archiveFilter
  const matching = cards.filter(matches)
  let shown = 0
  cards.forEach((card) => {
    const match = matches(card)
    const keepSelected = card.dataset.historyDayCard === selected
    const visible = match && (archiveExpanded || shown < 9 || keepSelected)
    card.hidden = !visible
    if (match) shown += 1
  })

  const visibleCount = cards.filter((card) => !card.hidden).length
  setText(document.querySelector<HTMLElement>('[data-history-archive-status]'), `${visibleCount} of ${matching.length} matching days shown`)
  const toggle = document.querySelector<HTMLButtonElement>('[data-history-clarity-toggle]')
  if (toggle) {
    toggle.hidden = matching.length <= 9
    toggle.setAttribute('aria-expanded', String(archiveExpanded))
    setText(toggle, archiveExpanded ? 'Show recent 9' : `Show all ${matching.length} days`)
  }
}

function renderCoverageBreakdown(payload: ClarityPayload): void {
  const root = document.querySelector<HTMLElement>('[data-history-notes]')
  const coverage = payload.coverage
  if (!root || !coverage) return
  const observed = coverage.observedDays ?? 0
  const total = payload.period?.days ?? payload.daily?.length ?? 0
  const partial = coverage.partialDates ?? []
  const missing = coverage.missingDates ?? []
  const progress = coverage.inProgressDates ?? []
  const html = `<div class="history-coverage-grid">
    <div><small>Observed days</small><strong>${observed} / ${total}</strong></div>
    <div><small>In progress</small><strong>${progress.length}</strong></div>
    <div><small>Partial days</small><strong>${partial.length}</strong></div>
    <div><small>Missing days</small><strong>${missing.length}</strong></div>
  </div>
  <div class="history-coverage-breakdown">
    ${coverageRow('In progress', progress, 'progress')}
    ${coverageRow('Partial', partial, 'partial')}
    ${coverageRow('Missing', missing, 'missing')}
  </div>
  <p class="history-coverage-impact">Partial or missing observation can make totals and rankings lower than actual platform activity.</p>`
  if (root.innerHTML !== html) root.innerHTML = html
}

function coverageRow(label: string, days: string[], state: string): string {
  return `<div class="history-coverage-row history-coverage-row--${state}"><strong>${label}</strong><span>${days.length ? days.map(formatDate).join(', ') : 'None'}</span></div>`
}

function archiveCounts(): Record<ArchiveFilter, number> & { all: number } {
  const cards = Array.from(document.querySelectorAll<HTMLElement>('[data-history-day-card]'))
  const counts: Record<ArchiveFilter, number> & { all: number } = { all: cards.length, complete: 0, 'in-progress': 0, partial: 0, missing: 0 }
  cards.forEach((card) => {
    const state = card.dataset.historyClarityState as Exclude<ArchiveFilter, 'all'> | undefined
    if (state) counts[state] += 1
  })
  return counts
}

function filterButton(filter: ArchiveFilter, label: string): string {
  return `<button type="button" data-history-clarity-filter="${filter}" aria-pressed="${archiveFilter === filter}">${label}</button>`
}

function handleArchiveClick(event: MouseEvent): void {
  const target = event.target instanceof Element ? event.target : null
  const filterButton = target?.closest<HTMLButtonElement>('[data-history-clarity-filter]')
  if (filterButton) {
    const next = filterButton.dataset.historyClarityFilter as ArchiveFilter | undefined
    if (!next) return
    archiveFilter = next
    archiveExpanded = false
    schedule()
    return
  }
  if (target?.closest('[data-history-clarity-toggle]')) {
    archiveExpanded = !archiveExpanded
    schedule()
  }
}

function missingDay(day: string): ClarityDay {
  return {
    day,
    totalViewerMinutes: 0,
    peakViewers: 0,
    peakStreamerName: null,
    observedStreamCount: 0,
    observedMinutes: 0,
    coverageState: 'missing',
    topStreamers: [],
    biggestRise: null,
  }
}

function enumerateDays(from: string, to: string): string[] {
  const result: string[] = []
  const cursor = new Date(`${from}T00:00:00.000Z`)
  const end = Date.parse(`${to}T00:00:00.000Z`)
  while (cursor.getTime() <= end) {
    result.push(cursor.toISOString().slice(0, 10))
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }
  return result
}

function formatDate(day: string): string {
  const date = new Date(`${day}T00:00:00.000Z`)
  if (Number.isNaN(date.getTime())) return day
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
}

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10)
}

function setText(node: HTMLElement | null | undefined, value: string): void {
  if (node && node.textContent !== value) node.textContent = value
}

export {}
