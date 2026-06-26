type Metric = 'viewer_minutes' | 'peak_viewers'

type Coverage = 'good' | 'partial' | 'in-progress' | 'missing' | 'demo'

const stage = document.querySelector<HTMLElement>('.history-stage')
let queued = false

if (stage) {
  new MutationObserver(queue).observe(stage, { childList: true, subtree: true })
  stage.addEventListener('keydown', onKeydown, true)
  stage.addEventListener('focusin', inspect)
  stage.addEventListener('pointerover', inspect)
  stage.addEventListener('click', queue)
  queue()
}

function queue(): void {
  if (queued) return
  queued = true
  requestAnimationFrame(() => {
    queued = false
    enhance()
  })
}

function enhance(): void {
  if (!stage) return
  const svg = stage.querySelector<SVGSVGElement>('svg')
  const days = chartDays()
  if (!svg || !days.length) {
    stage.dataset.historyChartReady = 'false'
    return
  }
  const metric = currentMetric()
  const title = svgText(svg, 'title', 'history-chart-title')
  const description = svgText(svg, 'desc', 'history-chart-description')
  title.textContent = `${metricLabel(metric)} by UTC day`
  description.textContent = `${metricLabel(metric)} daily rollup. Arrow keys move between days. Home and End jump. Enter or Space selects. Symbols identify coverage without color.`
  svg.setAttribute('aria-labelledby', `${title.id} ${description.id}`)
  svg.removeAttribute('aria-label')

  let focusIndex = days.findIndex((day) => day.classList.contains('is-selected'))
  if (focusIndex < 0) focusIndex = 0
  days.forEach((day, index) => enhanceDay(day, index === focusIndex))
  const caption = stage.querySelector<HTMLElement>('.history-chart-caption span')
  if (caption) caption.textContent = `UTC daily rollup · ${metricUnit(metric)} · Arrow keys move between days`
  enhanceLegend()
  showInspection(days[focusIndex])
  stage.dataset.historyChartReady = 'true'
  stage.dataset.historyChartMetric = metric
}

function enhanceDay(day: SVGGElement, focusable: boolean): void {
  const bar = day.querySelector<SVGRectElement>('.history-bar')
  if (!bar) return
  const coverage = coverageFrom(bar)
  day.dataset.historyCoverage = coverage
  day.setAttribute('tabindex', focusable ? '0' : '-1')
  day.setAttribute('aria-roledescription', 'daily observation')
  day.setAttribute('aria-keyshortcuts', 'ArrowLeft ArrowRight Home End Enter Space')
  if (day.classList.contains('is-selected')) day.setAttribute('aria-current', 'date')
  else day.removeAttribute('aria-current')
  const label = day.getAttribute('aria-label') ?? ''
  if (!label.includes('coverage state')) day.setAttribute('aria-label', `${label}, coverage state ${coverage.replace('-', ' ')}`)

  let marker = day.querySelector<SVGTextElement>('.history-state-marker')
  if (!marker) {
    marker = document.createElementNS('http://www.w3.org/2000/svg', 'text')
    marker.classList.add('history-state-marker')
    marker.setAttribute('text-anchor', 'middle')
    marker.setAttribute('aria-hidden', 'true')
    day.append(marker)
  }
  marker.setAttribute('x', String(attributeNumber(bar, 'x') + attributeNumber(bar, 'width') / 2))
  marker.setAttribute('y', String(Math.max(22, attributeNumber(bar, 'y') - 8)))
  marker.textContent = coverageSymbol(coverage)
}

function onKeydown(event: KeyboardEvent): void {
  const current = (event.target as Element | null)?.closest<SVGGElement>('[data-history-day]')
  if (!current) return
  const days = chartDays()
  const index = days.indexOf(current)
  let next = index
  if (event.key === 'ArrowRight') next = Math.min(days.length - 1, index + 1)
  else if (event.key === 'ArrowLeft') next = Math.max(0, index - 1)
  else if (event.key === 'Home') next = 0
  else if (event.key === 'End') next = days.length - 1
  else return
  event.preventDefault()
  days[next]?.focus()
  days[next]?.click()
  showInspection(days[next])
}

function inspect(event: Event): void {
  const day = (event.target as Element | null)?.closest<SVGGElement>('[data-history-day]')
  if (day) showInspection(day)
}

function showInspection(day?: SVGGElement): void {
  if (!stage || !day) return
  let node = stage.parentElement?.querySelector<HTMLElement>('[data-history-chart-inspection]')
  if (!node) {
    node = document.createElement('div')
    node.className = 'history-chart-inspection'
    node.dataset.historyChartInspection = ''
    node.setAttribute('role', 'status')
    node.setAttribute('aria-live', 'polite')
    stage.insertAdjacentElement('afterend', node)
  }
  node.textContent = `${day.dataset.historyDay ?? 'Day'} UTC · ${day.getAttribute('aria-label') ?? 'Details unavailable'} · Arrow keys inspect adjacent days`
  node.dataset.historyInspectionDay = day.dataset.historyDay ?? ''
}

function enhanceLegend(): void {
  const legend = document.querySelector<HTMLElement>('[data-history-chart-legend]')
  if (!legend || legend.dataset.historyLegendNonColor === 'true') return
  const symbols = ['●', '▲', '◐', '×']
  legend.querySelectorAll('span').forEach((item, index) => item.prepend(`${symbols[index] ?? '?'} `))
  const demo = document.createElement('span')
  demo.textContent = '◇ Demo'
  demo.dataset.historyLegendState = 'demo'
  legend.append(demo)
  legend.dataset.historyLegendNonColor = 'true'
}

function chartDays(): SVGGElement[] {
  return stage ? [...stage.querySelectorAll<SVGGElement>('[data-history-day]')] : []
}

function currentMetric(): Metric {
  return stage?.querySelector('.history-chart-caption strong')?.textContent?.includes('Peak') ? 'peak_viewers' : 'viewer_minutes'
}

function coverageFrom(bar: SVGRectElement): Coverage {
  if (bar.classList.contains('history-bar--in-progress')) return 'in-progress'
  if (bar.classList.contains('history-bar--missing')) return 'missing'
  if (bar.classList.contains('history-bar--demo')) return 'demo'
  if (bar.classList.contains('history-bar--partial') || bar.classList.contains('history-bar--poor')) return 'partial'
  return 'good'
}

function coverageSymbol(value: Coverage): string {
  if (value === 'partial') return '▲'
  if (value === 'in-progress') return '◐'
  if (value === 'missing') return '×'
  if (value === 'demo') return '◇'
  return '●'
}

function metricLabel(metric: Metric): string {
  return metric === 'peak_viewers' ? 'Peak viewers' : 'Viewer-minutes'
}

function metricUnit(metric: Metric): string {
  return metric === 'peak_viewers' ? 'viewers' : 'viewer-minutes'
}

function attributeNumber(node: Element, name: string): number {
  const value = Number(node.getAttribute(name))
  return Number.isFinite(value) ? value : 0
}

function svgText(svg: SVGSVGElement, tag: 'title' | 'desc', id: string): SVGTitleElement | SVGDescElement {
  const found = svg.querySelector<SVGTitleElement | SVGDescElement>(`#${id}`)
  if (found) return found
  const node = document.createElementNS('http://www.w3.org/2000/svg', tag)
  node.id = id
  svg.prepend(node)
  return node
}

export {}
