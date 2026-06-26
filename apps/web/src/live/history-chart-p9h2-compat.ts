const legend = document.querySelector<HTMLElement>('[data-history-chart-legend]')

if (legend) {
  const normalize = () => {
    const demo = legend.querySelector<HTMLSpanElement>('span[data-history-legend-state="demo"]')
    if (!demo) return
    const replacement = document.createElement('small')
    replacement.className = 'history-legend-demo'
    replacement.dataset.historyLegendState = 'demo'
    replacement.textContent = demo.textContent
    demo.replaceWith(replacement)
  }
  new MutationObserver(normalize).observe(legend, { childList: true })
  normalize()
}

export {}
