const stage = document.querySelector<HTMLElement>('.history-stage')

function capture(): void {
  if (!stage) return
  stage.querySelectorAll<SVGGElement>('[data-history-day]').forEach((day) => {
    let source = day.dataset.historySourceCoverage ?? ''
    if (!source) {
      const label = (day.getAttribute('aria-label') ?? '').toLowerCase()
      source = label.includes('coverage in progress')
        ? 'in-progress'
        : label.includes('coverage missing')
          ? 'missing'
          : label.includes('coverage demo')
            ? 'demo'
            : label.includes('coverage partial') || label.includes('coverage poor')
              ? 'partial'
              : label.includes('coverage good')
                ? 'good'
                : ''
      if (source) day.dataset.historySourceCoverage = source
    }
    if (!source) return
    const symbol = source === 'in-progress'
      ? '◐'
      : source === 'missing'
        ? '×'
        : source === 'demo'
          ? '◇'
          : source === 'partial'
            ? '▲'
            : '●'
    day.dataset.historyCoverage = source
    day.dataset.historyStateSymbol = symbol
    const marker = day.querySelector<SVGTextElement>('.history-state-marker')
    if (marker && marker.textContent !== symbol) marker.textContent = symbol
  })
}

if (stage) {
  new MutationObserver(capture).observe(stage, { childList: true, subtree: true })
  capture()
}

export {}
