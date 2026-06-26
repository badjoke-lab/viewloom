type Metric = 'viewer_minutes' | 'peak_viewers'

type Coverage = 'good' | 'partial' | 'in-progress' | 'missing' | 'demo'

type InspectionElements = {
  root: HTMLElement
  keyboard: HTMLButtonElement
  detail: HTMLElement
}

const stage = document.querySelector<HTMLElement>('.history-stage')
let queued = false

if (stage) {
  new MutationObserver(queue).observe(stage, { childList: true, subtree: true })
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
  setText(title, `${metricLabel(metric)} by UTC day`)
  setText(description, `${metricLabel(metric)} daily rollup. Use the chart-day keyboard navigator below the chart to move with Left and Right Arrow keys or jump with Home and End. Symbols identify coverage without color.`)
  svg.setAttribute('aria-labelledby', `${title.id} ${description.id}`)
  svg.removeAttribute('aria-label')

  let selectedIndex = days.findIndex((day) => day.classList.contains('is-selected'))
  if (selectedIndex < 0) selectedIndex = 0
  days.forEach((day) => enhanceDay(day))
  const caption = stage.querySelector<HTMLElement>('.history-chart-caption span')
  if (caption) setText(caption, `UTC daily rollup · ${metricUnit(metric)} · Keyboard navigator follows the chart`)
  enhanceLegend()
  showInspection(days[selectedIndex])
  stage.dataset.historyChartReady = 'true'
  stage.dataset.historyChartMetric = metric
}

function enhanceDay(day: SVGGElement): void {
  const bar = day.querySelector<SVGRectElement>('.history-bar')
  const hit = day.querySelector<SVGRectElement>('.history-bar-hit')
  if (!bar || !hit) return
  const coverage = coverageFrom(bar)
  const symbol = coverageSymbol(coverage)
  const selected = day.classList.contains('is-selected')
  const label = day.getAttribute('aria-label') ?? ''
  const accessibleLabel = label.includes('coverage state')
    ? label
    : `${label}, coverage state ${coverage.replace('-', ' ')}`

  day.dataset.historyCoverage = coverage
  day.dataset.historyStateSymbol = symbol
  day.removeAttribute('tabindex')
  day.setAttribute('aria-roledescription', 'daily observation group')
  day.setAttribute('aria-label', accessibleLabel)
  if (selected) day.setAttribute('aria-current', 'date')
  else day.removeAttribute('aria-current')

  hit.removeAttribute('tabindex')
  hit.setAttribute('aria-hidden', 'true')

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
  setText(marker, symbol)
}

function inspect(event: Event): void {
  const day = (event.target as Element | null)?.closest<SVGGElement>('[data-history-day]')
  if (day) showInspection(day)
}

function showInspection(day?: SVGGElement): void {
  if (!stage || !day) return
  const elements = ensureInspection()
  const dayValue = day.dataset.historyDay ?? ''
  const label = day.getAttribute('aria-label') ?? 'Details unavailable'
  elements.root.dataset.historyInspectionDay = dayValue
  elements.keyboard.dataset.historyKeyboardDay = dayValue
  elements.keyboard.setAttribute('aria-label', `${label}. Use Left and Right Arrow keys to inspect adjacent days. Home and End jump to the first or last day.`)
  setText(elements.keyboard, `${dayValue || 'Selected day'} UTC`)
  setText(elements.detail, label)
}

function ensureInspection(): InspectionElements {
  if (!stage) throw new Error('History chart stage unavailable')
  let root = stage.parentElement?.querySelector<HTMLElement>('[data-history-chart-inspection]') ?? null
  if (!root) {
    root = document.createElement('div')
    root.className = 'history-chart-inspection'
    root.dataset.historyChartInspection = ''

    const keyboard = document.createElement('button')
    keyboard.type = 'button'
    keyboard.className = 'history-chart-keyboard-target'
    keyboard.dataset.historyChartKeyboardTarget = ''
    keyboard.setAttribute('aria-keyshortcuts', 'ArrowLeft ArrowRight Home End Enter Space')
    keyboard.addEventListener('keydown', onKeyboardNavigation)
    keyboard.addEventListener('click', selectKeyboardDay)

    const detail = document.createElement('span')
    detail.dataset.historyChartInspectionDetail = ''
    detail.setAttribute('role', 'status')
    detail.setAttribute('aria-live', 'polite')
    detail.setAttribute('aria-atomic', 'true')

    const help = document.createElement('small')
    help.textContent = 'Left / Right: adjacent day · Home / End: range edge · Enter: select'

    root.append(keyboard, detail, help)
    stage.insertAdjacentElement('afterend', root)
  }

  const keyboard = root.querySelector<HTMLButtonElement>('[data-history-chart-keyboard-target]')
  const detail = root.querySelector<HTMLElement>('[data-history-chart-inspection-detail]')
  if (!keyboard || !detail) throw new Error('History chart inspection controls unavailable')
  return { root, keyboard, detail }
}

function onKeyboardNavigation(event: KeyboardEvent): void {
  const keyboard = event.currentTarget as HTMLButtonElement
  const days = chartDays()
  const currentDay = keyboard.dataset.historyKeyboardDay ?? ''
  const currentIndex = Math.max(0, days.findIndex((day) => day.dataset.historyDay === currentDay))
  let nextIndex = currentIndex
  if (event.key === 'ArrowRight') nextIndex = Math.min(days.length - 1, currentIndex + 1)
  else if (event.key === 'ArrowLeft') nextIndex = Math.max(0, currentIndex - 1)
  else if (event.key === 'Home') nextIndex = 0
  else if (event.key === 'End') nextIndex = days.length - 1
  else return
  event.preventDefault()
  selectDay(days[nextIndex])
  keyboard.focus()
}

function selectKeyboardDay(event: Event): void {
  const keyboard = event.currentTarget as HTMLButtonElement
  const day = chartDays().find((item) => item.dataset.historyDay === keyboard.dataset.historyKeyboardDay)
  selectDay(day)
}

function selectDay(day?: SVGGElement): void {
  if (!day) return
  const hit = day.querySelector<SVGRectElement>('.history-bar-hit')
  if (!hit) return
  hit.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  showInspection(day)
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
  return stage ? Array.from(stage.querySelectorAll<SVGGElement>('[data-history-day]')) : []
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

function setText(node: Node, value: string): void {
  if (node.textContent !== value) node.textContent = value
}

export {}
