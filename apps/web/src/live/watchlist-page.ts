import '../watchlist-page.css'
import {
  WATCHLIST_INITIAL_VISIBLE_ENTRIES,
  WATCHLIST_MAX_ENTRIES,
  createWatchlistDocument,
  type WatchlistDocument,
  type WatchlistMoveDirection,
  type WatchlistOperationCode,
  type WatchlistPeriod,
  type WatchlistProvider,
} from './watchlist/model'
import {
  addStoredWatchlistEntry,
  clearStoredWatchlist,
  moveStoredWatchlistEntry,
  readWatchlistStorage,
  readWatchlistStorageEvent,
  removeStoredWatchlistEntry,
  resetStoredWatchlist,
  watchlistStorageKey,
  type WatchlistReadResult,
  type WatchlistStorageLike,
  type WatchlistStorageState,
} from './watchlist/storage'
import {
  parseWatchlistUrlState,
  watchlistStateUrl,
} from './watchlist/url-state'

const provider = document.body.dataset.provider as WatchlistProvider | undefined
if (provider !== 'twitch' && provider !== 'kick') {
  throw new Error('Local Watchlist provider is missing.')
}

const providerName = provider === 'twitch' ? 'Twitch' : 'Kick'
const otherProviderName = provider === 'twitch' ? 'Kick' : 'Twitch'
const providerUrl = provider === 'twitch' ? 'https://www.twitch.tv/' : 'https://kick.com/'
const storage = readBrowserStorage()
let documentState = createWatchlistDocument(provider)
let storageState: WatchlistStorageState = 'empty'
let storageLocked = false
let showAll = false
let filterText = ''
let period = parseWatchlistUrlState(new URL(window.location.href), provider).period

const addForm = required<HTMLFormElement>('[data-watchlist-add-form]')
const addInput = required<HTMLInputElement>('[data-watchlist-input]')
const addButton = required<HTMLButtonElement>('[data-watchlist-add]')
const filterInput = required<HTMLInputElement>('[data-watchlist-filter]')
const showButton = required<HTMLButtonElement>('[data-watchlist-show]')
const clearButton = required<HTMLButtonElement>('[data-watchlist-clear]')
const resetButton = required<HTMLButtonElement>('[data-watchlist-reset]')
const refreshButton = required<HTMLButtonElement>('[data-watchlist-refresh]')
const list = required<HTMLOListElement>('[data-watchlist-list]')
const emptyState = required<HTMLElement>('[data-watchlist-empty]')
const noResults = required<HTMLElement>('[data-watchlist-no-results]')
const storageError = required<HTMLElement>('[data-watchlist-storage-error]')
const storageFeedback = required<HTMLElement>('[data-watchlist-storage-feedback]')
const latestFeedback = required<HTMLElement>('[data-watchlist-latest-feedback]')
const historyFeedback = required<HTMLElement>('[data-watchlist-history-feedback]')
const savedCount = required<HTMLElement>('[data-watchlist-saved-count]')
const periodFact = required<HTMLElement>('[data-watchlist-period-fact]')
const storageFact = required<HTMLElement>('[data-watchlist-storage-fact]')
const storageKeyFact = required<HTMLElement>('[data-watchlist-storage-key]')
const listSummary = required<HTMLElement>('[data-watchlist-list-summary]')
const filterControls = required<HTMLElement>('[data-watchlist-filter-controls]')

installMobileNavigation()
installInteractions()
applyReadResult(readWatchlistStorage(storage, provider), 'initial')
render()
document.body.dataset.watchlistState = 'ready'

function installInteractions(): void {
  addForm.addEventListener('submit', (event) => {
    event.preventDefault()
    if (storageLocked) return

    const result = addStoredWatchlistEntry(storage, documentState, addInput.value)
    if (!result.ok) {
      handleOperationFailure(result.code)
      return
    }

    documentState = result.document
    storageState = documentState.entries.length ? 'ready' : 'empty'
    showAll = false
    filterText = ''
    filterInput.value = ''
    addInput.value = ''
    announceStorage(`Saved ${result.entry?.channelId ?? 'channel'} in this browser.`)
    render()
    focusEntryHeading(result.entry?.channelId)
  })

  filterInput.addEventListener('input', () => {
    filterText = filterInput.value.trim().toLowerCase()
    renderList()
  })

  showButton.addEventListener('click', () => {
    showAll = !showAll
    renderList()
    showButton.focus()
  })

  clearButton.addEventListener('click', () => {
    if (storageLocked || documentState.entries.length === 0) return
    const confirmed = window.confirm(`Clear this ${providerName} Watchlist from this browser?`)
    if (!confirmed) {
      announceStorage('Clear cancelled.')
      return
    }

    const result = clearStoredWatchlist(storage, documentState, true)
    if (!result.ok) {
      handleOperationFailure(result.code)
      return
    }

    documentState = result.document
    storageState = 'empty'
    showAll = false
    filterText = ''
    filterInput.value = ''
    announceStorage('Local Watchlist cleared from this browser.')
    render()
    addInput.focus()
  })

  resetButton.addEventListener('click', () => {
    const confirmed = window.confirm(`Reset the corrupted ${providerName} Watchlist in this browser?`)
    if (!confirmed) {
      announceStorage('Reset cancelled.')
      return
    }

    const result = resetStoredWatchlist(storage, provider, true)
    if (!result.ok) {
      handleOperationFailure(result.code)
      return
    }

    documentState = result.document
    storageState = 'empty'
    storageLocked = false
    announceStorage('Local Watchlist reset in this browser.')
    render()
    addInput.focus()
  })

  document.querySelectorAll<HTMLButtonElement>('[data-watchlist-period]').forEach((button) => {
    button.addEventListener('click', () => {
      const nextPeriod = button.dataset.watchlistPeriod as WatchlistPeriod | undefined
      if (nextPeriod !== '7d' && nextPeriod !== '30d') return
      if (period === nextPeriod) return
      period = nextPeriod
      window.history.pushState(null, '', watchlistStateUrl(
        new URL(window.location.href),
        { provider, period },
      ))
      announceHistory(`Selected retained period: ${periodLabel(period)}. History data was not requested.`)
      renderPeriod()
      renderList()
    })
  })

  refreshButton.addEventListener('click', () => {
    announceLatest('Latest observation is not connected in the W3A storage-first shell.')
    announceHistory('Retained History is not connected in the W3A storage-first shell.')
  })

  window.addEventListener('popstate', () => {
    period = parseWatchlistUrlState(new URL(window.location.href), provider).period
    announceHistory(`Restored retained period: ${periodLabel(period)}. No data request was made.`)
    renderPeriod()
    renderList()
  })

  window.addEventListener('storage', (event) => {
    const external = readWatchlistStorageEvent(provider, event)
    if (!external.matched) return
    applyReadResult(external.result, 'external')
    render()
  })

  list.addEventListener('click', (event) => {
    const button = (event.target as HTMLElement | null)?.closest<HTMLButtonElement>('button[data-watchlist-action]')
    if (!button || storageLocked) return
    const channelId = button.dataset.channelId ?? ''
    const action = button.dataset.watchlistAction

    if (action === 'remove') {
      removeEntry(channelId)
      return
    }
    if (action === 'move-up' || action === 'move-down') {
      moveEntry(channelId, action === 'move-up' ? 'up' : 'down')
    }
  })
}

function applyReadResult(result: WatchlistReadResult, source: 'initial' | 'external'): void {
  if (!result.ok) {
    storageState = result.state
    storageLocked = true
    documentState = createWatchlistDocument(provider)
    announceStorage(result.state === 'corrupted'
      ? 'Storage unavailable or corrupted. Reset this local Watchlist to continue.'
      : 'Storage unavailable or corrupted. Local saving is unavailable in this browser.')
    return
  }

  documentState = result.document
  storageState = result.state
  storageLocked = result.state === 'write_error'

  if (source === 'external') {
    announceStorage(result.state === 'repaired'
      ? 'Watchlist updated in another tab. Some invalid saved entries were removed.'
      : 'Watchlist updated in another tab.')
    return
  }

  if (result.state === 'repaired') {
    announceStorage('Some invalid saved entries were removed.')
  } else if (result.state === 'write_error') {
    announceStorage('Some invalid saved entries were removed. Changes cannot be saved in this browser.')
  } else if (result.state === 'empty') {
    announceStorage('No channels are saved in this browser.')
  } else {
    announceStorage(`${documentState.entries.length} saved ${providerName} channel${documentState.entries.length === 1 ? '' : 's'} loaded from this browser.`)
  }
}

function removeEntry(channelId: string): void {
  const originalIndex = documentState.entries.findIndex((entry) => entry.channelId === channelId)
  const result = removeStoredWatchlistEntry(storage, documentState, channelId)
  if (!result.ok) {
    handleOperationFailure(result.code)
    return
  }

  documentState = result.document
  storageState = documentState.entries.length ? 'ready' : 'empty'
  announceStorage(`Removed ${channelId} from this browser.`)
  render()

  const focusIndex = Math.min(originalIndex, documentState.entries.length - 1)
  if (focusIndex >= 0) focusEntryHeading(documentState.entries[focusIndex]?.channelId)
  else addInput.focus()
}

function moveEntry(channelId: string, direction: WatchlistMoveDirection): void {
  const result = moveStoredWatchlistEntry(storage, documentState, channelId, direction)
  if (!result.ok) {
    handleOperationFailure(result.code)
    return
  }
  if (!result.changed) return

  documentState = result.document
  storageState = 'ready'
  announceStorage(`Moved ${channelId} ${direction}.`)
  render()
  const selector = direction === 'up' ? 'move-up' : 'move-down'
  list.querySelector<HTMLButtonElement>(`[data-watchlist-action="${selector}"][data-channel-id="${cssEscape(channelId)}"]`)?.focus()
}

function handleOperationFailure(code: WatchlistOperationCode): void {
  const messages: Record<WatchlistOperationCode, string> = {
    ok: 'Local Watchlist updated.',
    'invalid-id': `Enter a valid ${providerName} channel id or ${providerName} channel URL.`,
    'wrong-provider-url': `That is a ${otherProviderName} URL. Use a ${providerName} channel id or ${providerName} URL here.`,
    'already-saved': 'Already saved.',
    'limit-reached': `Watchlist limit reached. Remove a channel before adding another. Maximum: ${WATCHLIST_MAX_ENTRIES}.`,
    'not-found': 'That saved channel could not be found.',
    'storage-unavailable': 'Changes cannot be saved in this browser.',
    'storage-corrupted': 'Storage unavailable or corrupted.',
    'write-failed': 'Changes cannot be saved in this browser.',
    'confirmation-required': 'Confirmation is required.',
  }
  announceStorage(messages[code])
  if (code === 'write-failed' || code === 'storage-unavailable') {
    storageState = code === 'write-failed' ? 'write_error' : 'unavailable'
    storageLocked = true
    render()
  }
}

function render(): void {
  document.body.dataset.watchlistStorage = storageState
  savedCount.textContent = `${documentState.entries.length} saved`
  storageFact.textContent = storageStateLabel(storageState)
  storageKeyFact.textContent = watchlistStorageKey(provider)
  addInput.placeholder = provider === 'twitch'
    ? 'example_channel or https://www.twitch.tv/example_channel'
    : 'example_channel or https://kick.com/example_channel'
  addInput.disabled = storageLocked
  addButton.disabled = storageLocked
  clearButton.disabled = storageLocked || documentState.entries.length === 0
  resetButton.hidden = storageState !== 'corrupted'
  storageError.hidden = storageState !== 'corrupted' && storageState !== 'unavailable'
  emptyState.hidden = storageState === 'corrupted' || storageState === 'unavailable' || documentState.entries.length > 0
  filterControls.hidden = documentState.entries.length === 0
  renderPeriod()
  renderList()
}

function renderPeriod(): void {
  periodFact.textContent = periodLabel(period)
  document.querySelectorAll<HTMLButtonElement>('[data-watchlist-period]').forEach((button) => {
    const active = button.dataset.watchlistPeriod === period
    button.setAttribute('aria-pressed', String(active))
    button.classList.toggle('active', active)
  })
}

function renderList(): void {
  const normalizedFilter = filterText.toLowerCase()
  const filtered = documentState.entries.filter((entry) => {
    if (!normalizedFilter) return true
    return entry.channelId.includes(normalizedFilter)
      || entry.displayName.toLowerCase().includes(normalizedFilter)
  })
  const visible = normalizedFilter || showAll
    ? filtered
    : filtered.slice(0, WATCHLIST_INITIAL_VISIBLE_ENTRIES)

  list.replaceChildren(...visible.map((entry) => renderEntry(entry.channelId)))
  list.hidden = visible.length === 0
  noResults.hidden = documentState.entries.length === 0 || filtered.length > 0

  const bounded = documentState.entries.length > WATCHLIST_INITIAL_VISIBLE_ENTRIES && !normalizedFilter
  showButton.hidden = !bounded
  showButton.textContent = showAll ? 'Show recent' : 'Show all'
  showButton.setAttribute('aria-expanded', String(showAll))

  const shown = visible.length
  const total = documentState.entries.length
  if (total === 0) listSummary.textContent = 'No saved channels.'
  else if (normalizedFilter) listSummary.textContent = `${shown} of ${total} saved channels match the local filter.`
  else if (!showAll && total > WATCHLIST_INITIAL_VISIBLE_ENTRIES) {
    listSummary.textContent = `Showing the first ${shown} of ${total} saved channels.`
  } else listSummary.textContent = `Showing ${shown} saved channel${shown === 1 ? '' : 's'}.`
}

function renderEntry(channelId: string): HTMLLIElement {
  const entry = documentState.entries.find((candidate) => candidate.channelId === channelId)
  if (!entry) throw new Error(`Missing Watchlist entry: ${channelId}`)
  const index = documentState.entries.findIndex((candidate) => candidate.channelId === channelId)
  const item = document.createElement('li')
  item.className = 'watchlist-card'
  item.dataset.watchlistEntry = channelId

  const headingId = `watchlist-entry-${index}`
  const channelHref = `/${provider}/channel/?id=${encodeURIComponent(channelId)}${period === '7d' ? '&period=7d' : ''}`
  const historyHref = `/${provider}/history/${period === '7d' ? '?period=7d' : ''}`
  const externalHref = `${providerUrl}${encodeURIComponent(channelId)}`

  item.innerHTML = `
    <div class="watchlist-card__head">
      <div class="watchlist-card__identity">
        <span class="watchlist-card__index">${index + 1}</span>
        <div><h2 id="${headingId}" tabindex="-1">${escapeHtml(entry.displayName)}</h2><code>${escapeHtml(channelId)}</code></div>
      </div>
      <a class="watchlist-external" href="${externalHref}" target="_blank" rel="noreferrer">Open on ${providerName}<span class="sr-only">: ${escapeHtml(entry.displayName)}</span></a>
    </div>
    <div class="watchlist-evidence-grid" aria-label="Evidence placeholders for ${escapeHtml(entry.displayName)}">
      <section class="watchlist-evidence watchlist-evidence--latest"><small>Latest observation</small><strong>Not requested</strong><p>Latest evidence will be connected in W3B. No live or offline conclusion is shown.</p></section>
      <section class="watchlist-evidence watchlist-evidence--history"><small>Retained History · ${periodLabel(period)}</small><strong>Not requested</strong><p>Retained evidence will be connected in W3B. No complete history is implied.</p></section>
    </div>
    <div class="watchlist-card__actions">
      <div class="watchlist-card__links"><a class="button button--paper" href="${channelHref}">Open Channel</a><a class="button button--quiet" href="${historyHref}">Open History</a></div>
      <div class="watchlist-card__manage" aria-label="Manage ${escapeHtml(entry.displayName)}">
        <button class="button button--quiet" type="button" data-watchlist-action="move-up" data-channel-id="${escapeHtml(channelId)}" ${index === 0 || storageLocked ? 'disabled' : ''} aria-label="Move ${escapeHtml(entry.displayName)} up" title="${index === 0 ? 'Already first' : 'Move up'}">Move up</button>
        <button class="button button--quiet" type="button" data-watchlist-action="move-down" data-channel-id="${escapeHtml(channelId)}" ${index === documentState.entries.length - 1 || storageLocked ? 'disabled' : ''} aria-label="Move ${escapeHtml(entry.displayName)} down" title="${index === documentState.entries.length - 1 ? 'Already last' : 'Move down'}">Move down</button>
        <button class="button watchlist-remove" type="button" data-watchlist-action="remove" data-channel-id="${escapeHtml(channelId)}" ${storageLocked ? 'disabled' : ''} aria-label="Remove ${escapeHtml(entry.displayName)} from Watchlist">Remove</button>
      </div>
    </div>`
  return item
}

function announceStorage(message: string): void {
  storageFeedback.textContent = message
}

function announceLatest(message: string): void {
  latestFeedback.textContent = message
}

function announceHistory(message: string): void {
  historyFeedback.textContent = message
}

function storageStateLabel(state: WatchlistStorageState): string {
  const labels: Record<WatchlistStorageState, string> = {
    ready: 'Ready',
    repaired: 'Repaired',
    empty: 'Empty',
    unavailable: 'Unavailable',
    corrupted: 'Corrupted',
    write_error: 'Write error',
  }
  return labels[state]
}

function periodLabel(value: WatchlistPeriod): string {
  return value === '7d' ? 'Last 7 days' : 'Last 30 days'
}

function focusEntryHeading(channelId?: string): void {
  if (!channelId) return
  list.querySelector<HTMLElement>(`[data-watchlist-entry="${cssEscape(channelId)}"] h2`)?.focus()
}

function installMobileNavigation(): void {
  const menu = document.querySelector<HTMLButtonElement>('[data-mobile-menu]')
  const nav = document.querySelector<HTMLElement>('.global-nav')
  if (!menu || !nav) return

  const setOpen = (open: boolean) => {
    nav.classList.toggle('is-open', open)
    menu.setAttribute('aria-expanded', String(open))
    menu.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation')
  }
  menu.addEventListener('click', () => setOpen(!nav.classList.contains('is-open')))
  nav.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setOpen(false)))
}

function readBrowserStorage(): WatchlistStorageLike | null {
  try {
    return window.localStorage
  } catch {
    return null
  }
}

function required<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector)
  if (!element) throw new Error(`Required Watchlist element is missing: ${selector}`)
  return element
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function cssEscape(value: string): string {
  return window.CSS?.escape ? window.CSS.escape(value) : value.replace(/[^a-z0-9_-]/gi, '\\$&')
}
