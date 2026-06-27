const legend = document.querySelector<HTMLElement>('[data-history-chart-legend]')
const stage = document.querySelector<HTMLElement>('.history-stage')
let queued = false

function normalize(): void {
  normalizeLegend()
  normalizeCoverageMarkers()
}

function queue(): void {
  if (queued) return
  queued = true
  requestAnimationFrame(() => {
    queued = false
    normalize()
  })
}

function normalizeLegend(): void {
  if (!legend) return
  const demo = legend.querySelector<HTMLSpanElement>('span[data-history-legend-state="demo"]')
  if (!demo) return
  const replacement = document.createElement('small')
  replacement.className = 'history-legend-demo'
  replacement.dataset.historyLegendState = 'demo'
  replacement.textContent = demo.textContent
  demo.replaceWith(replacement)
}

function normalizeCoverageMarkers(): void {
  if (!stage) return
  stage.querySelectorAll<SVGGElement>('[data-history-day]').forEach((day) => {
    const label = (day.getAttribute('aria-label') ?? '').toLowerCase()
    const sourceState = label.includes('coverage in progress') || label.includes('coverage state in progress')
      ? 'in-progress'
      : label.includes('coverage missing') || label.includes('coverage state missing')
        ? 'missing'
        : label.includes('coverage demo') || label.includes('coverage state demo')
          ? 'demo'
          : label.includes('coverage partial') || label.includes('coverage state partial') || label.includes('coverage poor')
            ? 'partial'
            : 'good'
    const symbol = sourceState === 'in-progress'
      ? '◐'
      : sourceState === 'missing'
        ? '×'
        : sourceState === 'demo'
          ? '◇'
          : sourceState === 'partial'
            ? '▲'
            : '●'
    day.dataset.historyCoverage = sourceState
    day.dataset.historyStateSymbol = symbol
    const marker = day.querySelector<SVGTextElement>('.history-state-marker')
    if (marker && marker.textContent !== symbol) marker.textContent = symbol
  })
}

if (legend) new MutationObserver(queue).observe(legend, { childList: true })
if (stage) new MutationObserver(queue).observe(stage, { childList: true, subtree: true })
normalize()

export {}
