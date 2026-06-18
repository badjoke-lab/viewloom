import { parseRankingSort, rankingSort, setRankingSort, type RankingSort } from './history-additional-rankings-state'

export function installRankingControls(onChange: () => void): void {
  const group = document.querySelector<HTMLElement>('.history-ranking-toolbar [data-history-sort]')?.parentElement
  if (!group) return
  for (const [sort, label] of [
    ['avg_viewers', 'Average viewers'],
    ['observed_minutes', 'Observed time'],
    ['rising', 'Rising'],
  ] as Array<[RankingSort, string]>) {
    if (group.querySelector(`[data-history-sort="${sort}"]`)) continue
    const button = document.createElement('button')
    button.type = 'button'
    button.dataset.historySort = sort
    button.textContent = label
    button.setAttribute('aria-pressed', 'false')
    group.append(button)
  }

  group.querySelectorAll<HTMLButtonElement>('[data-history-sort]').forEach((button) => {
    button.addEventListener('click', (event) => {
      const sort = parseRankingSort(button.dataset.historySort)
      if (!sort) return
      event.stopImmediatePropagation()
      setRankingSort(sort)
      syncRankingButtons()
      onChange()
    })
  })

  document.querySelectorAll<HTMLButtonElement>('[data-history-metric]').forEach((button) => {
    button.addEventListener('click', () => {
      const sort: RankingSort = button.dataset.historyMetric === 'peak_viewers' ? 'peak_viewers' : 'viewer_minutes'
      queueMicrotask(() => {
        setRankingSort(sort)
        syncRankingButtons()
        onChange()
      })
    })
  })

  document.querySelectorAll<HTMLButtonElement>('[data-history-limit]').forEach((button) => {
    button.addEventListener('click', () => requestAnimationFrame(onChange))
  })

  document.addEventListener('click', (event) => preserveSortAfterDaySelection(event))
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') preserveSortAfterDaySelection(event)
  })
  syncRankingButtons()
}

export function syncRankingButtons(): void {
  const sort = rankingSort()
  document.querySelectorAll<HTMLButtonElement>('[data-history-sort]').forEach((button) => {
    const active = button.dataset.historySort === sort
    button.classList.toggle('active', active)
    button.setAttribute('aria-pressed', String(active))
  })
}

export function activeRankingLimit(): number {
  const active = document.querySelector<HTMLButtonElement>('[data-history-limit][aria-pressed="true"]')
  const value = Number(active?.dataset.historyLimit ?? new URL(location.href).searchParams.get('limit'))
  return value === 20 || value === 50 ? value : 10
}

function preserveSortAfterDaySelection(event: Event): void {
  const target = event.target instanceof Element ? event.target : null
  if (!target || target.closest('a')) return
  if (!target.closest('.history-day-column,[data-history-day-card]')) return
  const sort = rankingSort()
  queueMicrotask(() => setRankingSort(sort))
}
