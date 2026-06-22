const page = document.querySelector<HTMLElement>('.history-page')
const statePill = document.querySelector<HTMLElement>('.history-state-pill')

const mobile = window.matchMedia('(max-width: 760px)')
const tablet = window.matchMedia('(max-width: 1180px)')

function normalizedState(): string {
  if (!statePill) return 'unknown'
  const classState = Array.from(statePill.classList)
    .find((name) => name.startsWith('history-state-pill--'))
    ?.replace('history-state-pill--', '')
  const textState = statePill.textContent?.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')
  const value = classState || textState || 'unknown'
  if (value === 'ok') return 'fresh'
  if (value.includes('strong-stale')) return 'stale'
  return value
}

function syncVisualContract(): void {
  if (!page) return
  page.dataset.historyVisualState = normalizedState()
  page.dataset.historyViewport = mobile.matches ? 'mobile' : tablet.matches ? 'tablet' : 'desktop'
  page.dataset.historyVisualReady = 'true'
}

syncVisualContract()
mobile.addEventListener('change', syncVisualContract)
tablet.addEventListener('change', syncVisualContract)

if (statePill) {
  new MutationObserver(syncVisualContract).observe(statePill, {
    attributes: true,
    attributeFilter: ['class'],
    childList: true,
    characterData: true,
    subtree: true,
  })
}

export {}
