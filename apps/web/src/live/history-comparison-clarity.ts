type ComparisonPayload = {
  comparison?: {
    previousPeriodAvailable?: boolean
  }
  periodComparison?: {
    state?: string
  } | null
  summary?: {
    biggestRise?: unknown
  } | null
  topStreamers?: Array<{
    comparisonState?: string
  }>
}

let noBaseline = false
let scheduled = false

const originalFetch = window.fetch.bind(window)
window.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
  const response = await originalFetch(input, init)
  const url = new URL(typeof input === 'string' || input instanceof URL ? input : input.url, location.origin)
  if (url.pathname === '/api/history' || url.pathname === '/api/kick-history') {
    try {
      const payload = await response.clone().json() as ComparisonPayload
      const streamers = payload.topStreamers ?? []
      noBaseline = payload.comparison?.previousPeriodAvailable === false
        || payload.periodComparison?.state === 'insufficient'
        || payload.periodComparison?.state === 'unavailable'
        || streamers.length > 0
          && streamers.every((streamer) => streamer.comparisonState === 'insufficient' || streamer.comparisonState === 'new')
          && !payload.summary?.biggestRise
      schedule()
    } catch {
      noBaseline = false
    }
  }
  return response
}) as typeof window.fetch

const observer = new MutationObserver((records) => {
  if (records.some(isRelevantMutation)) schedule()
})
observer.observe(document.documentElement, { childList: true, subtree: true })
schedule()

function isRelevantMutation(record: MutationRecord): boolean {
  const target = record.target instanceof Element ? record.target : record.target.parentElement
  if (target?.closest('[data-history-summary],[data-history-selected-day],[data-history-daily-archive]')) return true
  return [...record.addedNodes].some((node) => node instanceof Element
    && (node.matches('[data-history-summary],[data-history-selected-day],[data-history-daily-archive]')
      || Boolean(node.querySelector('[data-history-summary],[data-history-selected-day],[data-history-daily-archive]'))))
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
  applyComparisonState()
  applyTrackedStreamLabels()
}

function applyComparisonState(): void {
  const card = document.querySelectorAll<HTMLElement>('[data-history-summary] > div')[3]
  if (!card || !noBaseline) return
  card.dataset.historyComparisonState = 'no-baseline'
  setText(card.querySelector<HTMLElement>('strong'), 'No baseline')
  setText(card.querySelector<HTMLElement>('span'), 'Previous-period data unavailable')
}

function applyTrackedStreamLabels(): void {
  document.querySelectorAll<HTMLElement>('[data-history-selected-day] small, [data-history-daily-archive] dt').forEach((label) => {
    if (label.textContent?.trim() === 'Observed streams') setText(label, 'Tracked streams (max)')
  })
}

function setText(node: HTMLElement | null | undefined, value: string): void {
  if (node && node.textContent !== value) node.textContent = value
}

export {}
