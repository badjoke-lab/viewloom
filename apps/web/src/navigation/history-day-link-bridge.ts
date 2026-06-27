type Provider = 'twitch' | 'kick'

export function historyDayLinks(provider: Provider, day: string, time?: string | null): { dayFlow: string; battleLines: string } | null {
  if (!validDay(day)) return null
  const dayFlow = new URLSearchParams(`rangeMode=date&date=${encodeURIComponent(day)}`)
  const battleLines = new URLSearchParams(`range=date&date=${encodeURIComponent(day)}`)
  dayFlow.sort()
  battleLines.sort()
  const timestamp = exactTimestampForDay(time, day)
  if (timestamp) {
    dayFlow.set('time', timestamp)
    battleLines.set('time', timestamp)
  }
  return {
    dayFlow: `/${provider}/day-flow/?${dayFlow.toString()}`,
    battleLines: `/${provider}/battle-lines/?${battleLines.toString()}`,
  }
}

export function rewriteHistoryDayLinks(root: ParentNode = document): number {
  const provider: Provider = document.body.dataset.provider === 'kick' ? 'kick' : 'twitch'
  let changed = 0
  root.querySelectorAll<HTMLAnchorElement>(`a[href^="/${provider}/day-flow/?date="], a[href^="/${provider}/battle-lines/?date="]`).forEach((anchor) => {
    const url = new URL(anchor.href, location.origin)
    const day = url.searchParams.get('date')
    const time = url.searchParams.get('time')
    const links = day ? historyDayLinks(provider, day, time) : null
    if (!links) return
    const next = url.pathname.includes('/day-flow/') ? links.dayFlow : links.battleLines
    if (anchor.getAttribute('href') !== next) {
      anchor.setAttribute('href', next)
      changed += 1
    }
  })
  return changed
}

function exactTimestampForDay(value: string | null | undefined, day: string): string | null {
  if (!value) return null
  const parsed = new Date(value)
  if (!Number.isFinite(parsed.getTime())) return null
  const iso = parsed.toISOString()
  return iso.slice(0, 10) === day ? iso : null
}

function validDay(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00.000Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
}

function battleDayFromTarget(target: EventTarget | null): string | null {
  const element = target instanceof Element ? target : null
  const card = element?.closest<HTMLElement>('[data-history-battle-day]')
  if (!card || element?.closest('a')) return null
  const day = card.dataset.historyBattleDay
  return day && validDay(day) ? day : null
}

function bridgeBattleDay(target: EventTarget | null, fallbackDay?: string): boolean {
  const day = battleDayFromTarget(target) ?? (fallbackDay && validDay(fallbackDay) ? fallbackDay : null)
  if (!day) return false
  document.body.dataset.historyBattleBridgeDay = day
  const escaped = window.CSS?.escape ? window.CSS.escape(day) : day
  const archiveDay = document.querySelector<HTMLElement>(`[data-history-day-card="${escaped}"]`)
  if (archiveDay) {
    document.body.dataset.historyBattleBridgeRoute = 'daily'
    archiveDay.dataset.historyDay = archiveDay.dataset.historyDayCard ?? day
    archiveDay.click()
    return true
  }
  const chartDay = document.querySelector<SVGGElement>(`.history-day-column[data-history-day="${escaped}"]`)
  document.body.dataset.historyBattleBridgeRoute = chartDay ? 'chart' : 'missing'
  chartDay?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }))
  return Boolean(chartDay)
}

if (typeof document !== 'undefined') {
  document.body.dataset.historyDayLinkBridgeReady = 'true'
  rewriteHistoryDayLinks()
  const observer = new MutationObserver((records) => {
    for (const record of records) {
      for (const node of record.addedNodes) {
        if (node instanceof Element) rewriteHistoryDayLinks(node)
      }
    }
  })
  observer.observe(document.body, { childList: true, subtree: true })

  document.addEventListener('focusin', (event) => {
    const day = battleDayFromTarget(event.target)
    if (day) document.body.dataset.historyBattleBridgeFocusDay = day
  }, true)
  document.addEventListener('keydown', (event) => {
    document.body.dataset.historyBattleBridgeKey = event.key
    if (event.key !== 'Enter' && event.key !== ' ') return
    if (!bridgeBattleDay(event.target, document.body.dataset.historyBattleBridgeFocusDay)) return
    event.preventDefault()
  }, true)
  document.addEventListener('click', (event) => {
    const day = battleDayFromTarget(event.target)
    if (day) document.body.dataset.historyBattleBridgeFocusDay = day
    bridgeBattleDay(event.target)
  }, true)
}
