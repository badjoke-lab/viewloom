const stateNode = document.querySelector<HTMLElement>('[data-stream-map-state]')

const unavailableTextIds = [
  'stream-map-observed',
  'stream-map-mapped',
  'stream-map-unmapped',
  'stream-map-strip-updated',
  'stream-map-strip-coverage',
  'stream-map-population-summary',
  'stream-map-population-state',
  'stream-map-card-mapped',
  'stream-map-card-viewers',
  'stream-map-card-excluded',
  'stream-map-country-count',
  'stream-map-current-count',
  'stream-map-unmapped-current',
  'stream-map-unmapped-baseline',
  'stream-map-unmapped-filtered-out',
] as const

function replaceWithUnavailableMessage(id: string, message: string): void {
  const node = document.getElementById(id)
  if (!node) return
  const empty = document.createElement('p')
  empty.className = 'stream-map-empty'
  empty.textContent = message
  node.replaceChildren(empty)
}

function clearStaleDataState(): void {
  if ((stateNode?.textContent || '').trim() !== 'Data error') return

  for (const id of unavailableTextIds) {
    const node = document.getElementById(id)
    if (node) node.textContent = 'Unavailable'
  }

  const selectedCountry = document.getElementById('stream-map-selected-country')
  if (selectedCountry instanceof HTMLElement) selectedCountry.hidden = true

  const selectedSources = document.getElementById('stream-map-selected-country-sources')
  selectedSources?.replaceChildren()
  const listTitle = document.getElementById('stream-map-stream-list-title')
  if (listTitle) listTitle.textContent = 'Mapped streams'

  replaceWithUnavailableMessage(
    'stream-map-country-list',
    'Country results unavailable because the selected Twitch population could not be loaded.',
  )
  replaceWithUnavailableMessage(
    'stream-map-stream-list',
    'Mapped stream results unavailable because the selected Twitch population could not be loaded.',
  )
  replaceWithUnavailableMessage(
    'stream-map-unmapped-reason-list',
    'Unmapped reason analysis unavailable because the selected Twitch population could not be loaded.',
  )
  replaceWithUnavailableMessage(
    'stream-map-excluded-nonperson-list',
    'Excluded-channel accounting unavailable because the selected Twitch population could not be loaded.',
  )

  const filterNote = document.getElementById('stream-map-filter-note')
  if (filterNote) filterNote.textContent = 'Location evidence coverage unavailable until the selected Twitch population reloads.'
  const reconciliation = document.getElementById('stream-map-unmapped-reconciliation')
  if (reconciliation) reconciliation.textContent = 'Reason accounting unavailable until the selected Twitch population reloads.'

  for (const marker of document.querySelectorAll<HTMLElement>('.stream-map-country-marker')) marker.remove()
  document.documentElement.dataset.streamMapDataState = 'unavailable'

  // The compact unmapped summary is maintained by a separate presentation
  // observer. Run after its mutation pass so the data-error state never renders
  // awkward stale-derived copy such as "Unavailable unmapped".
  queueMicrotask(() => {
    if (document.documentElement.dataset.streamMapDataState !== 'unavailable') return
    const compactSummary = document.querySelector<HTMLElement>('[data-unmapped-compact-summary]')
    if (compactSummary) compactSummary.textContent = 'Unmapped accounting unavailable'
  })
}

function syncDataState(): void {
  if ((stateNode?.textContent || '').trim() === 'Data error') {
    clearStaleDataState()
    return
  }
  delete document.documentElement.dataset.streamMapDataState
}

if (stateNode) {
  new MutationObserver(syncDataState).observe(stateNode, { childList: true, characterData: true, subtree: true })
  syncDataState()
}
