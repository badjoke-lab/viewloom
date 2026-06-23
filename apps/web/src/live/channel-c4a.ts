import '../channel-c4a.css'

type BattleEntry = {
  day?: unknown
  streamerAId?: unknown
  streamerAName?: unknown
  streamerBId?: unknown
  streamerBName?: unknown
  score?: unknown
  viewerMinutesGap?: unknown
}

type HistoryPayload = {
  battleArchive?: unknown
  [key: string]: unknown
}

const RECENT_DAY_LIMIT = 6

installHistoryNormalizer()
installRetainedDayControls()

function installHistoryNormalizer(): void {
  const originalFetch = window.fetch.bind(window)

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const response = await originalFetch(input, init)
    const url = requestUrl(input)
    if (!url || !isHistoryEndpoint(url) || !response.ok) return response

    try {
      const payload = await response.clone().json() as HistoryPayload
      if (!Array.isArray(payload.battleArchive)) return response

      const normalized: HistoryPayload = {
        ...payload,
        battleArchive: [...payload.battleArchive].sort(compareBattles),
      }
      const headers = new Headers(response.headers)
      headers.delete('content-length')
      headers.delete('content-encoding')
      headers.set('content-type', 'application/json; charset=utf-8')
      return new Response(JSON.stringify(normalized), {
        status: response.status,
        statusText: response.statusText,
        headers,
      })
    } catch {
      return response
    }
  }
}

function installRetainedDayControls(): void {
  const grid = document.querySelector<HTMLElement>('[data-channel-days]')
  if (!grid || grid.dataset.channelC4aReady === 'true') return
  grid.dataset.channelC4aReady = 'true'
  if (!grid.id) grid.id = 'channel-retained-days-grid'

  const controls = document.createElement('div')
  controls.className = 'channel-day-controls'
  controls.innerHTML = '<p data-channel-days-count aria-live="polite">Loading retained days…</p><button class="button button--paper" type="button" data-channel-days-toggle aria-controls="channel-retained-days-grid" aria-expanded="false">Show all</button>'
  grid.before(controls)

  const count = controls.querySelector<HTMLElement>('[data-channel-days-count]')
  const toggle = controls.querySelector<HTMLButtonElement>('[data-channel-days-toggle]')
  if (!count || !toggle) return

  let expanded = false
  const apply = (): void => {
    const cards = [...grid.querySelectorAll<HTMLElement>('.channel-day-card')]
    const total = cards.length
    cards.forEach((card, index) => { card.hidden = !expanded && index >= RECENT_DAY_LIMIT })

    const shown = expanded ? total : Math.min(total, RECENT_DAY_LIMIT)
    count.textContent = total === 0
      ? '0 retained days'
      : expanded
        ? `Showing all ${total} retained days`
        : `Showing ${shown} of ${total} retained days`
    toggle.hidden = total <= RECENT_DAY_LIMIT
    toggle.textContent = expanded ? 'Show recent' : 'Show all'
    toggle.setAttribute('aria-expanded', String(expanded))
    document.body.dataset.channelDaysExpanded = String(expanded)
  }

  toggle.addEventListener('click', () => {
    expanded = !expanded
    apply()
  })

  const observer = new MutationObserver(() => {
    expanded = false
    apply()
  })
  observer.observe(grid, { childList: true })
  apply()
}

function requestUrl(input: RequestInfo | URL): URL | null {
  try {
    if (input instanceof URL) return input
    if (typeof input === 'string') return new URL(input, location.href)
    return new URL(input.url, location.href)
  } catch {
    return null
  }
}

function isHistoryEndpoint(url: URL): boolean {
  return url.origin === location.origin && (url.pathname === '/api/history' || url.pathname === '/api/kick-history')
}

function compareBattles(leftValue: unknown, rightValue: unknown): number {
  const left = battleEntry(leftValue)
  const right = battleEntry(rightValue)
  return descendingNumber(left.score, right.score)
    || ascendingNumber(absNumber(left.viewerMinutesGap), absNumber(right.viewerMinutesGap))
    || descendingText(left.day, right.day)
    || ascendingText(pairKey(left), pairKey(right))
    || ascendingText(displayKey(left), displayKey(right))
}

function battleEntry(value: unknown): BattleEntry {
  return value && typeof value === 'object' ? value as BattleEntry : {}
}

function pairKey(entry: BattleEntry): string {
  return [normalizedText(entry.streamerAId), normalizedText(entry.streamerBId)].sort().join(':')
}

function displayKey(entry: BattleEntry): string {
  return [normalizedText(entry.streamerAName), normalizedText(entry.streamerBName)].sort().join(':')
}

function descendingNumber(left: unknown, right: unknown): number {
  return finiteNumber(right, Number.NEGATIVE_INFINITY) - finiteNumber(left, Number.NEGATIVE_INFINITY)
}

function ascendingNumber(left: unknown, right: unknown): number {
  return finiteNumber(left, Number.POSITIVE_INFINITY) - finiteNumber(right, Number.POSITIVE_INFINITY)
}

function absNumber(value: unknown): number {
  const number = finiteNumber(value, Number.POSITIVE_INFINITY)
  return Number.isFinite(number) ? Math.abs(number) : number
}

function descendingText(left: unknown, right: unknown): number {
  return normalizedText(right).localeCompare(normalizedText(left), 'en')
}

function ascendingText(left: unknown, right: unknown): number {
  return normalizedText(left).localeCompare(normalizedText(right), 'en')
}

function finiteNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function normalizedText(value: unknown): string {
  return typeof value === 'string' ? value.trim().toLowerCase() : ''
}
