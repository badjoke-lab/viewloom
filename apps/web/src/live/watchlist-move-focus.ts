document.addEventListener('click', (event) => {
  const button = (event.target as HTMLElement | null)?.closest<HTMLButtonElement>(
    'button[data-watchlist-action="move-up"], button[data-watchlist-action="move-down"]',
  )
  const channelId = button?.dataset.channelId
  if (!button || button.disabled || !channelId) return

  requestAnimationFrame(() => {
    const escaped = window.CSS?.escape
      ? window.CSS.escape(channelId)
      : channelId.replace(/[^a-z0-9_-]/gi, '\\$&')
    document.querySelector<HTMLElement>(
      `[data-watchlist-entry="${escaped}"] h2`,
    )?.focus()
  })
}, { capture: true })
