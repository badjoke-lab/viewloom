import { parseChannelState } from './channel/url-state'
import type { ChannelProvider } from './channel/model'
import {
  addStoredWatchlistEntry,
  readWatchlistStorage,
  readWatchlistStorageEvent,
  type WatchlistStorageLike,
} from './watchlist/storage'

const provider: ChannelProvider = document.body.dataset.provider === 'kick' ? 'kick' : 'twitch'
const providerName = provider === 'kick' ? 'Kick' : 'Twitch'
const actions = document.querySelector<HTMLElement>('.channel-profile-actions')
const storage = readBrowserStorage()

if (actions) {
  const host = document.createElement('span')
  host.className = 'channel-watchlist-action'
  host.dataset.channelWatchlistAction = ''

  const feedback = document.createElement('span')
  feedback.className = 'channel-watchlist-feedback'
  feedback.dataset.channelWatchlistFeedback = ''
  feedback.setAttribute('aria-live', 'polite')

  actions.prepend(host)
  actions.insertAdjacentElement('afterend', feedback)

  render()
  window.addEventListener('popstate', render)
  window.addEventListener('storage', (event) => {
    const result = readWatchlistStorageEvent(provider, event)
    if (result.matched) render()
  })

  function render(): void {
    const state = parseChannelState(new URL(window.location.href), provider)
    const channelId = state.channelId
    host.replaceChildren()

    if (!channelId) {
      const button = actionButton('Save to Watchlist', true)
      button.title = `A valid ${providerName} channel id is required.`
      host.append(button)
      feedback.textContent = ''
      document.body.dataset.channelWatchlist = 'invalid'
      return
    }

    const read = readWatchlistStorage(storage, provider)
    if (!read.ok || read.state === 'write_error') {
      const button = actionButton('Watchlist unavailable', true)
      button.title = 'Local Watchlist storage is unavailable in this browser.'
      host.append(button)
      feedback.textContent = 'Local Watchlist storage is unavailable in this browser.'
      document.body.dataset.channelWatchlist = 'unavailable'
      return
    }

    const saved = read.document.entries.some((entry) => entry.channelId === channelId)
    if (saved) {
      const link = document.createElement('a')
      link.className = 'button button--paper'
      link.href = `/${provider}/watchlist/${state.period === '7d' ? '?period=7d' : ''}`
      link.textContent = 'Saved in Watchlist'
      link.setAttribute('aria-label', `${channelId} is saved. Open ${providerName} Watchlist management.`)
      host.append(link)
      feedback.textContent = ''
      document.body.dataset.channelWatchlist = 'saved'
      return
    }

    const button = actionButton('Save to Watchlist', false)
    button.addEventListener('click', () => {
      const current = parseChannelState(new URL(window.location.href), provider)
      if (!current.channelId) return render()
      const latestRead = readWatchlistStorage(storage, provider)
      if (!latestRead.ok || latestRead.state === 'write_error') return render()

      const displayName = currentDisplayName(current.channelId)
      const result = addStoredWatchlistEntry(
        storage,
        latestRead.document,
        current.channelId,
        displayName,
      )
      if (!result.ok) {
        feedback.textContent = operationMessage(result.code)
        document.body.dataset.channelWatchlist = 'error'
        return
      }

      feedback.textContent = `Saved ${current.channelId} in this browser. No data request was made.`
      render()
      feedback.textContent = `Saved ${current.channelId} in this browser. No data request was made.`
    })
    host.append(button)
    feedback.textContent = ''
    document.body.dataset.channelWatchlist = 'available'
  }
}

function actionButton(label: string, disabled: boolean): HTMLButtonElement {
  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'button button--paper'
  button.textContent = label
  button.disabled = disabled
  return button
}

function currentDisplayName(channelId: string): string {
  const value = document.querySelector<HTMLElement>('[data-channel-name]')?.textContent?.trim() ?? ''
  if (!value || value === 'Loading channel…') return channelId
  return value
}

function operationMessage(code: string): string {
  if (code === 'already-saved') return 'Already saved.'
  if (code === 'limit-reached') return 'Watchlist limit reached. Remove a channel before saving another.'
  if (code === 'storage-unavailable' || code === 'write-failed') return 'Changes cannot be saved in this browser.'
  return 'This channel could not be saved to the local Watchlist.'
}

function readBrowserStorage(): WatchlistStorageLike | null {
  try {
    return window.localStorage
  } catch {
    return null
  }
}
