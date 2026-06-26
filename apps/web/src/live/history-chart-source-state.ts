const stage = document.querySelector<HTMLElement>('.history-stage')

function capture(): void {
  if (!stage) return
  stage.querySelectorAll<SVGGElement>('[data-history-day]').forEach((day) => {
    if (day.dataset.historySourceCoverage) return
    const label = (day.getAttribute('aria-label') ?? '').toLowerCase()
    const source = label.includes('coverage in progress')
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
  })
}

if (stage) {
  new MutationObserver(capture).observe(stage, { childList: true, subtree: true })
  capture()
}

export {}
