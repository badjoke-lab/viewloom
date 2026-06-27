// Accepted History entry: source capture, compatibility, task views, archives, and final visual layers load in this order.
import './history-chart-source-state'
import '../history-clarity-hotfix.css'
import '../history-card-visibility.css'
import '../history-view-shell.css'
import '../history-overview.css'
import './history-clarity-hotfix'
import './history-clarity-compat'
import './history-number-format'
import './history-view-shell'
import './history-overview'
import './history-comparison-clarity'
import './history-usability'
import './history-default-day'
import '../history-archives.css'
import './history-archives'
import '../history-visual-responsive.css'
import '../history-focus-fallback.css'
import './history-visual-responsive'
import '../history-chart-p9h2.css'
import './history-chart-p9h2'
import './history-chart-keyboard-delegation'

document.addEventListener('click', syncDailyCardSelectionKey, true)
document.addEventListener('keydown', syncDailyCardSelectionKey, true)

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Enter' && event.key !== ' ') return
  const target = event.target as Element | null
  const card = target?.closest<HTMLElement>('[data-history-battle-day]')
  if (!card || target?.closest('a')) return
  event.preventDefault()
  selectBattleDay(card)
}, true)

document.addEventListener('click', (event) => {
  const target = event.target as Element | null
  const card = target?.closest<HTMLElement>('[data-history-battle-day]')
  if (!card || target?.closest('a')) return
  selectBattleDay(card)
}, true)

function syncDailyCardSelectionKey(event: Event): void {
  const card = (event.target as Element | null)?.closest<HTMLElement>('[data-history-day-card]')
  const day = card?.dataset.historyDayCard
  if (card && day) card.dataset.historyDay = day
}

function selectBattleDay(card: HTMLElement): void {
  const day = card.dataset.historyBattleDay
  if (!day) return
  const selectorDay = window.CSS?.escape ? window.CSS.escape(day) : day
  const dailyCard = document.querySelector<HTMLElement>(`[data-history-day-card="${selectorDay}"]`)
  if (dailyCard) {
    dailyCard.dataset.historyDay = dailyCard.dataset.historyDayCard ?? day
    dailyCard.click()
    return
  }
  document.querySelector<SVGGElement>(`.history-day-column[data-history-day="${selectorDay}"]`)
    ?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }))
}

export {}
