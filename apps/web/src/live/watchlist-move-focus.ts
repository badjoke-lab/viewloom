import '../watchlist-touch.css'

let pendingChannelId = ''

const list = document.querySelector<HTMLElement>('[data-watchlist-list]')
if (list) {
  document.addEventListener('click', (event) => {
    const button = (event.target as HTMLElement | null)?.closest<HTMLButtonElement>(
      'button[data-watchlist-action="move-up"], button[data-watchlist-action="move-down"]',
    )
    const channelId = button?.dataset.channelId
    if (!button || button.disabled || !channelId) return
    pendingChannelId = channelId
  }, { capture: true })

  const observer = new MutationObserver(() => {
    if (!pendingChannelId) return
    const channelId = pendingChannelId
    pendingChannelId = ''
    requestAnimationFrame(() => {
      const escaped = window.CSS?.escape
        ? window.CSS.escape(channelId)
        : channelId.replace(/[^a-z0-9_-]/gi, '\\$&')
      document.querySelector<HTMLElement>(
        `[data-watchlist-entry="${escaped}"] h2`,
      )?.focus()
    })
  })
  observer.observe(list, { childList: true })
}

document.body.dataset.watchlistFocusReady = 'true'
