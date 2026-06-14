const compactFormatter = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1,
})

let scheduled = false
let formatting = false

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
    formatHistoryNumbers()
  })
}

function formatHistoryNumbers(): void {
  if (formatting) return
  formatting = true
  observer.disconnect()
  try {
    const selectors = [
      '[data-history-selected-day] .history-selected-metrics strong',
      '[data-history-selected-day] .history-selected-top strong',
      '[data-history-daily-archive] .day-card > strong',
      '[data-history-daily-archive] .day-card dd',
      '.history-peak-archive tbody td:nth-child(3)',
      '.history-peak-archive tbody td:nth-child(4)',
      '.history-streamer-card dd',
    ]
    document.querySelectorAll<HTMLElement>(selectors.join(',')).forEach(formatNode)
  } finally {
    observe()
    formatting = false
  }
}

function formatNode(node: HTMLElement): void {
  const raw = node.textContent?.trim() ?? ''
  if (!/^-?[\d,]+$/.test(raw)) return
  const value = Number(raw.replace(/,/g, ''))
  if (!Number.isFinite(value) || Math.abs(value) < 100_000) return
  const exact = Math.round(value).toLocaleString('en-US')
  const compact = compactFormatter.format(value)
  if (node.textContent !== compact) node.textContent = compact
  node.title = exact
  node.dataset.historyExactValue = exact
}

export {}
