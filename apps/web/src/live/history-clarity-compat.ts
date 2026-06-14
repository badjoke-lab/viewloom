type ClarityFilter = 'all' | 'complete' | 'in-progress' | 'partial' | 'missing'

let filter: ClarityFilter = 'all'
let expanded = false
let scheduled = false

const observer = new MutationObserver(schedule)
observer.observe(document.documentElement, { childList: true, subtree: true })
document.addEventListener('click', handleClick)
schedule()

function handleClick(event: MouseEvent): void {
  const target = event.target instanceof Element ? event.target : null
  const filterButton = target?.closest<HTMLButtonElement>('[data-history-clarity-filter]')
  if (filterButton) {
    const next = filterButton.dataset.historyClarityFilter as ClarityFilter | undefined
    if (next) {
      filter = next
      expanded = false
      schedule()
    }
    return
  }
  if (target?.closest('[data-history-clarity-toggle],[data-history-archive-toggle]')) {
    expanded = !expanded
    schedule()
  }
}

function schedule(): void {
  if (scheduled) return
  scheduled = true
  requestAnimationFrame(() => {
    scheduled = false
    sync()
  })
}

function sync(): void {
  const root = document.querySelector<HTMLElement>('[data-history-daily-archive]')
  const toggle = document.querySelector<HTMLButtonElement>('[data-history-clarity-toggle]')
  if (!root || !toggle) return
  if (!toggle.hasAttribute('data-history-archive-toggle')) toggle.setAttribute('data-history-archive-toggle', '')

  root.classList.add('history-card-visibility-active')
  const cards = Array.from(root.querySelectorAll<HTMLElement>('[data-history-day-card]'))
  const matching = cards.filter((card) => filter === 'all' || card.dataset.historyClarityState === filter)
  cards.forEach((card) => card.classList.remove('history-card-visible'))
  matching.forEach((card, index) => {
    if (expanded || index < 9) card.classList.add('history-card-visible')
  })

  const visible = matching.filter((card) => card.classList.contains('history-card-visible')).length
  const status = document.querySelector<HTMLElement>('[data-history-archive-status]')
  if (status) status.textContent = `${visible} of ${matching.length} matching days shown`
  toggle.hidden = matching.length <= 9
  toggle.setAttribute('aria-expanded', String(expanded))
  toggle.textContent = expanded ? 'Show recent 9' : `Show all ${matching.length} days`
}

export {}
