const page = document.querySelector<HTMLElement>('.history-page')
const statePill = document.querySelector<HTMLElement>('.history-state-pill')

const mobile = window.matchMedia('(max-width: 760px)')
const tablet = window.matchMedia('(max-width: 1180px)')
const focusTargetSelector = [
  'button[data-history-view]',
  'button[data-history-archive-view]',
  'button[data-history-report-mode]',
].join(',')

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

function setFocusPaint(target: EventTarget | null, active: boolean): void {
  if (!(target instanceof HTMLElement) || !target.matches(focusTargetSelector)) return
  if (active) {
    target.style.setProperty('outline', '3px solid #c4b5fd', 'important')
    target.style.setProperty('outline-offset', '3px', 'important')
    return
  }
  target.style.removeProperty('outline')
  target.style.removeProperty('outline-offset')
}

syncVisualContract()
mobile.addEventListener('change', syncVisualContract)
tablet.addEventListener('change', syncVisualContract)
document.addEventListener('focusin', (event) => setFocusPaint(event.target, true))
document.addEventListener('focusout', (event) => setFocusPaint(event.target, false))

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
