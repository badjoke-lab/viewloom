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
import {
  createWatchlistCombinedController,
  type WatchlistCombinedAction,
} from './watchlist/combined-controller'
import type {
  WatchlistCombinedEntry,
  WatchlistCombinedEvidence,
} from './watchlist/combined-model'
import type {
  WatchlistLatestEvidence,
  WatchlistLatestSnapshot,
} from './watchlist/latest-model'
import type {
  WatchlistHistorySnapshot,
  WatchlistRetainedEvidence,
} from './watchlist/history-model'

const provider = document.body.dataset.provider as WatchlistProvider | undefined
if (provider !== 'twitch' && provider !== 'kick') {
  throw new Error('Local Watchlist provider is missing.')
}

const providerName = provider === 'twitch' ? 'Twitch' : 'Kick'
const otherProviderName = provider === 'twitch' ? 'Kick' : 'Twitch'
const providerUrl = provider === 'twitch' ? 'https://www.twitch.tv/' : 'https://kick.com/'
const storage = readBrowserStorage()
const dataController = createWatchlistCombinedController({
  provider,
  latestRequest: requestProviderData,
  historyRequest: requestProviderData,
})

let documentState = createWatchlistDocument(provider)
let storageState: WatchlistStorageState = 'empty'
let storageLocked = false
let showAll = false
let filterText = ''
let period = parseWatchlistUrlState(new URL(window.location.href), provider).period
let combinedEvidence: WatchlistCombinedEvidence | null = null
let latestPending = 0
let historyPending = 0

const addForm = required<HTMLFormElement>('[data-watchlist-add-form]')
const addInput = required<HTMLInputElement>('[data-watchlist-input]')
const addButton = required<HTMLButtonElement>('[data-watchlist-add]')
const filterInput = required<HTMLInputElement>('[data-watchlist-filter]')
const showButton = required<HTMLButtonElement>('[data-watchlist-show]')
const clearButton = required<HTMLButtonElement>('[data-watchlist-clear]')
const resetButton = required<HTMLButtonElement>('[data-watchlist-reset]')
const refreshButton = required<HTMLButtonElement>('[data-watchlist-refresh]')
const retryLatestButton = required<HTMLButtonElement>('[data-watchlist-retry-latest]')
const retryHistoryButton = required<HTMLButtonElement>('[data-watchlist-retry-history]')
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
const latestSourceFact = required<HTMLElement>('[data-watchlist-latest-source]')
const historySourceFact = required<HTMLElement>('[data-watchlist-history-source]')
const requestFact = required<HTMLElement>('[data-watchlist-request-fact]')
const listSummary = required<HTMLElement>('[data-watchlist-list-summary]')
const filterControls = required<HTMLElement>('[data-watchlist-filter-controls]')

installMobileNavigation()
installInteractions()
applyReadResult(readWatchlistStorage(storage, provider), 'initial')
syncTaskLocalEvidence()
render()
document.body.dataset.watchlistState = 'ready'
void executeDataAction('initial_load')

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
    syncTaskLocalEvidence()
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
    syncTaskLocalEvidence()
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
    syncTaskLocalEvidence()
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
      syncTaskLocalEvidence()
      render()
      void executeDataAction('period_change')
    })
  })

  refreshButton.addEventListener('click', () => {
    void executeDataAction('refresh')
  })

  retryLatestButton.addEventListener('click', () => {
    void executeDataAction('retry_latest')
  })

  retryHistoryButton.addEventListener('click', () => {
    void executeDataAction('retry_history')
  })

  window.addEventListener('popstate', () => {
    period = parseWatchlistUrlState(new URL(window.location.href), provider).period
    syncTaskLocalEvidence()
    render()
    void executeDataAction('period_change')
  })

  window.addEventListener('storage', (event) => {
    const external = readWatchlistStorageEvent(provider, event)
    if (!external.matched) return
    applyReadResult(external.result, 'external')
    syncTaskLocalEvidence()
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

async function executeDataAction(action: Exclude<WatchlistCombinedAction, 'task_local'>): Promise<void> {
  const entries = [...documentState.entries]
  const requestedPeriod = period
  const hasEntries = entries.length > 0
  const touchesLatest = action === 'initial_load' || action === 'refresh' || action === 'retry_latest'
  const touchesHistory = action === 'initial_load' || action === 'period_change' || action === 'refresh' || action === 'retry_history'

  if (!hasEntries) {
    syncTaskLocalEvidence()
    render()
    return
  }

  if (touchesLatest) latestPending += 1
  if (touchesHistory) historyPending += 1
  render()

  try {
    if (action === 'initial_load') await dataController.initialLoad(entries, requestedPeriod)
    else if (action === 'period_change') await dataController.changePeriod(entries, requestedPeriod)
    else if (action === 'refresh') await dataController.refresh(entries, requestedPeriod)
    else if (action === 'retry_latest') await dataController.retryLatest(entries, requestedPeriod)
    else await dataController.retryHistory(entries, requestedPeriod)
  } finally {
    if (touchesLatest) latestPending = Math.max(0, latestPending - 1)
    if (touchesHistory) historyPending = Math.max(0, historyPending - 1)
    syncTaskLocalEvidence()
    render()
  }
}

function syncTaskLocalEvidence(): void {
  combinedEvidence = dataController.taskLocal(documentState.entries, period).evidence
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
  syncTaskLocalEvidence()
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
  syncTaskLocalEvidence()
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
  renderDataState()
  renderList()
}

function renderPeriod(): void {
  periodFact.textContent = periodLabel(period)
  document.querySelectorAll<HTMLButtonElement>('[data-watchlist-period]').forEach((button) => {
    const active = button.dataset.watchlistPeriod === period
    button.setAttribute('aria-pressed', String(active))
    button.classList.toggle('active', active)
    button.disabled = historyPending > 0
  })
}

function renderDataState(): void {
  const latestSnapshot = currentLatestSnapshot()
  const historySnapshot = currentHistorySnapshot()
  const hasEntries = documentState.entries.length > 0

  document.body.dataset.watchlistLatestState = latestPending > 0
    ? 'loading'
    : latestSnapshot?.state ?? 'not_requested'
  document.body.dataset.watchlistHistoryState = historyPending > 0
    ? 'loading'
    : historySnapshot?.state ?? 'not_requested'

  latestSourceFact.textContent = latestPending > 0
    ? 'Loading'
    : latestSnapshot
      ? `${humanLabel(latestSnapshot.state)} · ${latestSnapshot.source ?? 'provider payload'}`
      : 'Not requested'
  historySourceFact.textContent = historyPending > 0
    ? `Loading · ${periodLabel(period)}`
    : historySnapshot
      ? `${humanLabel(historySnapshot.state)} · ${historySnapshot.source ?? 'provider payload'}`
      : 'Not requested'

  requestFact.textContent = !hasEntries
    ? '0 while empty'
    : latestPending > 0 || historyPending > 0
      ? 'Bounded requests in progress'
      : latestSnapshot || historySnapshot
        ? 'One provider payload per source'
        : 'Use Refresh data'

  refreshButton.disabled = !hasEntries || latestPending > 0 || historyPending > 0
  retryLatestButton.hidden = latestSnapshot?.state !== 'error'
  retryLatestButton.disabled = !hasEntries || latestPending > 0
  retryHistoryButton.hidden = historySnapshot?.state !== 'error'
  retryHistoryButton.disabled = !hasEntries || historyPending > 0

  latestFeedback.textContent = latestFeedbackMessage(latestSnapshot, hasEntries)
  historyFeedback.textContent = historyFeedbackMessage(historySnapshot, hasEntries)
}

function renderList(): void {
  const normalizedFilter = filterText.toLowerCase()
  const filtered = documentState.entries.filter((entry) => {
    if (!normalizedFilter) return true
    const combined = evidenceFor(entry.channelId)
    const displayName = effectiveDisplayName(combined, entry.displayName)
    return entry.channelId.includes(normalizedFilter)
      || entry.displayName.toLowerCase().includes(normalizedFilter)
      || displayName.toLowerCase().includes(normalizedFilter)
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
  const combined = evidenceFor(channelId)
  const index = documentState.entries.findIndex((candidate) => candidate.channelId === channelId)
  const item = document.createElement('li')
  item.className = 'watchlist-card'
  item.dataset.watchlistEntry = channelId
  item.dataset.latestEvidence = combined?.latest.state ?? 'latest_unavailable'
  item.dataset.historyEvidence = combined?.retained.state ?? 'history_unavailable'

  const displayName = effectiveDisplayName(combined, entry.displayName)
  const headingId = `watchlist-entry-${index}`
  const channelHref = `/${provider}/channel/?id=${encodeURIComponent(channelId)}${period === '7d' ? '&period=7d' : ''}`
  const historyHref = `/${provider}/history/${period === '7d' ? '?period=7d' : ''}`
  const heatmapHref = `/${provider}/heatmap/`
  const externalHref = combined?.latest.item?.url ?? `${providerUrl}${encodeURIComponent(channelId)}`

  item.innerHTML = `
    <div class="watchlist-card__head">
      <div class="watchlist-card__identity">
        <span class="watchlist-card__index">${index + 1}</span>
        <div><h2 id="${headingId}" tabindex="-1">${escapeHtml(displayName)}</h2><code>${escapeHtml(channelId)}</code></div>
      </div>
      <a class="watchlist-external" href="${escapeHtml(externalHref)}" target="_blank" rel="noreferrer">Open on ${providerName}<span class="sr-only">: ${escapeHtml(displayName)}</span></a>
    </div>
    <div class="watchlist-evidence-grid" aria-label="Evidence for ${escapeHtml(displayName)}">
      ${renderLatestEvidence(combined?.latest, currentLatestSnapshot())}
      ${renderHistoryEvidence(combined?.retained, currentHistorySnapshot())}
    </div>
    <div class="watchlist-card__actions">
      <div class="watchlist-card__links"><a class="button button--paper" href="${channelHref}">Open Channel</a><a class="button button--quiet" href="${historyHref}">Open History</a><a class="button button--quiet" href="${heatmapHref}">Open Heatmap</a></div>
      <div class="watchlist-card__manage" aria-label="Manage ${escapeHtml(displayName)}">
        <button class="button button--quiet" type="button" data-watchlist-action="move-up" data-channel-id="${escapeHtml(channelId)}" ${index === 0 || storageLocked ? 'disabled' : ''} aria-label="Move ${escapeHtml(displayName)} up" title="${index === 0 ? 'Already first' : 'Move up'}">Move up</button>
        <button class="button button--quiet" type="button" data-watchlist-action="move-down" data-channel-id="${escapeHtml(channelId)}" ${index === documentState.entries.length - 1 || storageLocked ? 'disabled' : ''} aria-label="Move ${escapeHtml(displayName)} down" title="${index === documentState.entries.length - 1 ? 'Already last' : 'Move down'}">Move down</button>
        <button class="button watchlist-remove" type="button" data-watchlist-action="remove" data-channel-id="${escapeHtml(channelId)}" ${storageLocked ? 'disabled' : ''} aria-label="Remove ${escapeHtml(displayName)} from Watchlist">Remove</button>
      </div>
    </div>`
  return item
}

function renderLatestEvidence(
  latest: WatchlistLatestEvidence | undefined,
  snapshot: WatchlistLatestSnapshot | null,
): string {
  if (latestPending > 0 && !snapshot) {
    return evidenceMarkup('latest', 'Latest observation', 'Loading latest observation…', 'The bounded provider observation is loading.', '')
  }

  if (!latest || latest.state === 'latest_unavailable') {
    return evidenceMarkup('latest unavailable', 'Latest observation', 'Latest observation unavailable', 'No presence or absence conclusion is shown.', '')
  }

  if (latest.state === 'absent_usable') {
    return evidenceMarkup('latest absent', 'Latest observation', 'Not in latest observed set', 'Not confirmed offline', '')
  }

  const item = latest.item
  const stale = latest.state === 'present_stale'
  const primary = stale ? 'In latest available observed set' : 'In latest observed set'
  const qualifier = stale ? 'Provider data is stale' : 'Matched by normalized provider channel id.'
  const facts = [
    evidenceFact('Observed viewers', formatNumber(item?.viewers)),
    evidenceFact('Observed at', formatTimestamp(snapshot?.updatedAt)),
    item?.title ? evidenceFact('Observed title', item.title) : '',
    item?.momentum !== null && item?.momentum !== undefined
      ? evidenceFact('Momentum', formatMomentum(item.momentum))
      : '',
  ].filter(Boolean).join('')
  return evidenceMarkup(`latest ${stale ? 'stale' : 'present'}`, 'Latest observation', primary, qualifier, facts)
}

function renderHistoryEvidence(
  retained: WatchlistRetainedEvidence | undefined,
  snapshot: WatchlistHistorySnapshot | null,
): string {
  const label = `Retained History · ${periodLabel(period)}`
  if (historyPending > 0 && !snapshot) {
    return evidenceMarkup('history', label, 'Loading retained History…', 'The selected bounded History result is loading.', '')
  }

  if (!retained || retained.state === 'history_unavailable') {
    return evidenceMarkup('history unavailable', label, 'Retained History unavailable', 'No retained-presence conclusion is shown.', '')
  }

  if (retained.state === 'absent_usable') {
    return evidenceMarkup('history absent', label, 'Not in retained History result', 'No complete history is implied', '')
  }

  const item = retained.item
  const partial = retained.state === 'history_partial'
  const primary = partial ? 'Retained History is partial' : 'Present in retained History result'
  const qualifier = partial
    ? 'Available retained facts are shown, but the payload cannot support a complete presence or absence conclusion.'
    : 'Bounded retained result only. No complete history is implied.'
  const facts = item ? [
    evidenceFact('Viewer-minutes', formatNumber(item.viewerMinutes)),
    evidenceFact('Peak viewers', formatNumber(item.peakViewers)),
    evidenceFact('Average viewers', formatNumber(item.averageViewers)),
    evidenceFact('Observed time', formatDuration(item.observedMinutes)),
    evidenceFact('Retained days', formatNumber(item.dailyAppearanceCount)),
    evidenceFact('Most recent', formatDate(item.mostRecentAppearance)),
    item.rankByViewerMinutes !== null ? evidenceFact('Bounded rank', `#${formatNumber(item.rankByViewerMinutes)}`) : '',
  ].filter(Boolean).join('') : ''
  return evidenceMarkup(`history ${partial ? 'partial' : 'present'}`, label, primary, qualifier, facts)
}

function evidenceMarkup(
  classNames: string,
  label: string,
  primary: string,
  qualifier: string,
  facts: string,
): string {
  return `<section class="watchlist-evidence watchlist-evidence--${classNames.replace(/\s+/g, ' watchlist-evidence--')}"><small>${escapeHtml(label)}</small><strong>${escapeHtml(primary)}</strong><p>${escapeHtml(qualifier)}</p>${facts ? `<dl class="watchlist-evidence-facts">${facts}</dl>` : ''}</section>`
}

function evidenceFact(label: string, value: string): string {
  return `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`
}

function evidenceFor(channelId: string): WatchlistCombinedEntry | undefined {
  return combinedEvidence?.entries.find((entry) => entry.stored.channelId === channelId)
}

function effectiveDisplayName(combined: WatchlistCombinedEntry | undefined, fallback: string): string {
  return combined?.latest.item?.displayName
    ?? combined?.retained.item?.displayName
    ?? fallback
}

function currentLatestSnapshot(): WatchlistLatestSnapshot | null {
  return combinedEvidence?.latestSnapshot ?? null
}

function currentHistorySnapshot(): WatchlistHistorySnapshot | null {
  return combinedEvidence?.historySnapshot ?? null
}

function latestFeedbackMessage(snapshot: WatchlistLatestSnapshot | null, hasEntries: boolean): string {
  if (!hasEntries) return 'No saved channels. Latest observation was not requested.'
  if (latestPending > 0) return 'Loading the latest bounded provider observation…'
  if (!snapshot) return 'Latest observation has not been loaded. Use Refresh data to request it.'
  if (snapshot.state === 'error') return 'Latest observation unavailable. Retained History remains independent and usable when available.'
  if (snapshot.state === 'empty') return 'The latest provider result is empty. No presence or absence conclusion is shown.'
  const update = snapshot.updatedAt ? ` Updated ${formatTimestamp(snapshot.updatedAt)}.` : ''
  const coverage = snapshot.coverageNote ? ` ${snapshot.coverageNote}` : ''
  return `${humanLabel(snapshot.state)} latest provider payload with ${snapshot.itemCount} normalized item${snapshot.itemCount === 1 ? '' : 's'}.${update}${coverage}`
}

function historyFeedbackMessage(snapshot: WatchlistHistorySnapshot | null, hasEntries: boolean): string {
  if (!hasEntries) return 'No saved channels. Retained History was not requested.'
  if (historyPending > 0) return `Loading retained History for ${periodLabel(period).toLowerCase()}…`
  if (!snapshot) return 'Retained History has not been loaded. Use Refresh data to request it.'
  if (snapshot.state === 'error') return 'Retained History unavailable. Latest observation remains independent and usable when available.'
  if (snapshot.state === 'empty') return 'The selected retained History result is empty. No complete history is implied.'
  const coverage = snapshot.coverageNote ? ` ${snapshot.coverageNote}` : ''
  return `${humanLabel(snapshot.state)} retained History for ${periodLabel(period).toLowerCase()} with ${snapshot.itemCount} normalized item${snapshot.itemCount === 1 ? '' : 's'}.${coverage}`
}

function announceStorage(message: string): void {
  storageFeedback.textContent = message
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

function humanLabel(value: string): string {
  return value.replace(/[_-]+/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase())
}

function formatNumber(value: number | null | undefined): string {
  return typeof value === 'number' && Number.isFinite(value)
    ? new Intl.NumberFormat('en-US').format(value)
    : 'Unavailable'
}

function formatDuration(value: number | null | undefined): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 'Unavailable'
  const minutes = Math.max(0, Math.round(value))
  const hours = Math.floor(minutes / 60)
  const remainder = minutes % 60
  if (hours === 0) return `${remainder} min`
  return remainder ? `${hours}h ${remainder}m` : `${hours}h`
}

function formatMomentum(value: number): string {
  if (!Number.isFinite(value)) return 'Unavailable'
  const percent = value * 100
  return `${percent > 0 ? '+' : ''}${percent.toFixed(1)}%`
}

function formatTimestamp(value: string | null | undefined): string {
  if (!value) return 'Unavailable'
  const timestamp = new Date(value)
  if (!Number.isFinite(timestamp.getTime())) return 'Unavailable'
  return `${new Intl.DateTimeFormat('en-GB', {
    timeZone: 'UTC',
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(timestamp)} UTC`
}

function formatDate(value: string | null | undefined): string {
  if (!value) return 'Unavailable'
  const timestamp = new Date(`${value}T00:00:00.000Z`)
  if (!Number.isFinite(timestamp.getTime())) return value
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'UTC',
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  }).format(timestamp)
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

async function requestProviderData(
  endpoint: string,
  init: { headers: Readonly<Record<string, string>>; cache: 'no-store' },
): Promise<Response> {
  return fetch(endpoint, {
    headers: { ...init.headers },
    cache: init.cache,
  })
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
