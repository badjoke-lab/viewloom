const startedWithExplicitDay = new URLSearchParams(location.search).has('day')
let pending = !startedWithExplicitDay
let scheduled = false
let selecting = false

const observer = new MutationObserver(schedule)
observer.observe(document.documentElement, { childList: true, subtree: true })

document.addEventListener('click', (event) => {
  const target = event.target instanceof Element ? event.target : null
  if (!target) return
  if (target.closest('.history-day-column,[data-history-day-card]')) {
    pending = false
    return
  }
  if (target.closest('[data-history-period],[data-history-metric],[data-history-apply-range]')) {
    pending = true
    schedule()
  }
})

schedule()

function schedule(): void {
  if (!pending || scheduled || selecting) return
  scheduled = true
  requestAnimationFrame(() => {
    scheduled = false
    selectLatestCompletedDay()
  })
}

function selectLatestCompletedDay(): void {
  if (!pending || selecting) return
  const today = new Date().toISOString().slice(0, 10)
  const cards = Array.from(document.querySelectorAll<HTMLElement>('[data-history-day-card]'))
  const candidates = cards
    .map((card) => ({
      day: card.dataset.historyDayCard ?? '',
      complete: card.dataset.historyArchiveState === 'complete' || Boolean(card.querySelector('.history-badge--good')),
    }))
    .filter((item) => item.day && item.day < today && item.complete)
    .sort((a, b) => b.day.localeCompare(a.day))
  const day = candidates[0]?.day
  if (!day) return

  const selected = new URL(location.href).searchParams.get('day')
  if (selected === day) {
    pending = false
    return
  }

  const chartDay = document.querySelector<SVGGElement>(`.history-day-column[data-history-day="${cssEscape(day)}"]`)
  if (!chartDay) return
  selecting = true
  chartDay.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  selecting = false
  pending = false
}

function cssEscape(value: string): string {
  return window.CSS?.escape ? window.CSS.escape(value) : value.replace(/[^a-zA-Z0-9_-]/g, '\\$&')
}

export {}
