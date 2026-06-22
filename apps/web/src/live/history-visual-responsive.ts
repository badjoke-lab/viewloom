const page = document.querySelector<HTMLElement>('.history-page')
const statePill = document.querySelector<HTMLElement>('.history-state-pill')

const mobile = window.matchMedia('(max-width: 760px)')
const tablet = window.matchMedia('(max-width: 1180px)')
const focusTargetSelector = [
  'button[data-history-view]',
  'button[data-history-archive-view]',
  'button[data-history-report-mode]',
].join(',')
const boundFocusTargets = new WeakSet<HTMLElement>()

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

function setFocusPaint(target: HTMLElement, active: boolean): void {
  if (active) {
    target.style.setProperty('outline', '3px solid #c4b5fd', 'important')
    target.style.setProperty('outline-offset', '3px', 'important')
    return
  }
  target.style.removeProperty('outline')
  target.style.removeProperty('outline-offset')
}

function bindFocusTarget(target: HTMLElement): void {
  if (!target.matches(focusTargetSelector) || boundFocusTargets.has(target)) return
  target.addEventListener('focus', () => setFocusPaint(target, true))
  target.addEventListener('blur', () => setFocusPaint(target, false))
  target.dataset.historyFocusBound = 'true'
  boundFocusTargets.add(target)
}

function bindFocusTargets(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>(focusTargetSelector).forEach(bindFocusTarget)
}

syncVisualContract()
bindFocusTargets()
mobile.addEventListener('change', syncVisualContract)
tablet.addEventListener('change', syncVisualContract)

if (document.body) {
  new MutationObserver((records) => {
    records.forEach((record) => {
      record.addedNodes.forEach((node) => {
        if (!(node instanceof HTMLElement)) return
        bindFocusTarget(node)
        bindFocusTargets(node)
      })
    })
  }).observe(document.body, { childList: true, subtree: true })
}

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
