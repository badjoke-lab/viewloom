let scheduled = false
let applying = false
let observedRoot: HTMLElement | null = null

const observer = new MutationObserver(() => {
  invalidateDailyHierarchy()
  schedule()
})

observeRelevantRoot()
document.addEventListener('click', (event) => {
  if ((event.target as HTMLElement | null)?.closest('[data-history-clarity-filter],[data-history-archive-toggle]')) scheduleAfterInteraction()
})
window.addEventListener('viewloom:peak-archive-toggle', scheduleAfterInteraction)
window.addEventListener('viewloom:battle-archive-toggle', scheduleAfterInteraction)
schedule()

function observeRelevantRoot(): void {
  observer.disconnect()
  const root = document.querySelector<HTMLElement>('[data-history-daily-archive]')
  observedRoot = root
  if (root) {
    observer.observe(root, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['hidden'],
    })
    return
  }
  observer.observe(document.documentElement, { childList: true, subtree: true })
}

function invalidateDailyHierarchy(): void {
  const root = document.querySelector<HTMLElement>('[data-history-daily-archive]')
  if (root) root.dataset.historyDailyHierarchyReady = 'false'
}

function scheduleAfterInteraction(): void {
  invalidateDailyHierarchy()
  requestAnimationFrame(schedule)
}

function schedule(): void {
  if (scheduled || applying) return
  scheduled = true
  requestAnimationFrame(() => {
    scheduled = false
    enhanceArchives()
  })
}

function enhanceArchives(): void {
  if (applying) return
  applying = true
  observer.disconnect()
  try {
    enhanceDailyArchive()
    const archivePanel = document.querySelector<HTMLElement>('[data-history-view-panel="archives"]')
    if (archivePanel) {
      archivePanel.dataset.historyArchivesReady = String(Boolean(
        archivePanel.querySelector('[data-history-daily-archive]')
        && archivePanel.querySelector('[data-history-peak-archive]')
        && archivePanel.querySelector('[data-history-battle-archive]'),
      ))
    }
  } finally {
    observeRelevantRoot()
    applying = false
  }
}

function enhanceDailyArchive(): void {
  const root = document.querySelector<HTMLElement>('[data-history-daily-archive]')
  if (!root) return
  const cards = Array.from(root.querySelectorAll<HTMLElement>('[data-history-day-card]'))
  if (!cards.length) return

  cards.forEach((card) => {
    card.classList.remove('is-featured')
    let label = card.querySelector<HTMLElement>('[data-history-day-type]')
    if (!label) {
      label = document.createElement('span')
      label.className = 'history-archive-event-type'
      label.dataset.historyDayType = ''
      card.prepend(label)
    }
    label.textContent = 'Observed day'
  })

  const featured = cards.find((card) => !card.hidden)
  if (featured) {
    featured.classList.add('is-featured')
    const label = featured.querySelector<HTMLElement>('[data-history-day-type]')
    if (label) label.textContent = 'Latest matching day'
  }
  root.dataset.historyDailyHierarchyReady = 'true'
}

export {}
