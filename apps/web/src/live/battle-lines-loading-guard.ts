const BATTLE_LINES_TIMEOUT_MS = 12_000
const originalFetch = window.fetch.bind(window)

syncDateInputVisibility()

window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const url = typeof input === 'string'
    ? input
    : input instanceof URL
      ? input.toString()
      : input.url

  if (!url.includes('/api/battle-lines') && !url.includes('/api/kick-battle-lines')) {
    return originalFetch(input, init)
  }

  const controller = new AbortController()
  const upstreamSignal = init?.signal
  const abortFromUpstream = () => controller.abort(upstreamSignal?.reason)
  if (upstreamSignal) {
    if (upstreamSignal.aborted) abortFromUpstream()
    else upstreamSignal.addEventListener('abort', abortFromUpstream, { once: true })
  }

  const timeoutId = window.setTimeout(() => {
    controller.abort(new DOMException('Battle Lines API timed out.', 'TimeoutError'))
  }, BATTLE_LINES_TIMEOUT_MS)

  try {
    return await originalFetch(input, { ...init, signal: controller.signal })
  } catch (error) {
    const message = controller.signal.aborted && !upstreamSignal?.aborted
      ? `Battle Lines API did not respond within ${Math.round(BATTLE_LINES_TIMEOUT_MS / 1000)} seconds.`
      : error instanceof Error
        ? error.message
        : 'Battle Lines API request failed.'
    renderUnavailableSurface(message)
    throw new Error(message)
  } finally {
    window.clearTimeout(timeoutId)
    upstreamSignal?.removeEventListener('abort', abortFromUpstream)
  }
}

function syncDateInputVisibility(): void {
  const dateButton = document.querySelector<HTMLButtonElement>('[data-battle-range="date"]')
  const dateInput = document.querySelector<HTMLInputElement>('[data-battle-date]')
  if (!dateButton || !dateInput) return

  const sync = () => {
    const active = dateButton.classList.contains('active')
    dateInput.hidden = !active
    dateInput.disabled = !active
  }

  sync()
  new MutationObserver(sync).observe(dateButton, { attributes: true, attributeFilter: ['class', 'aria-pressed'] })
}

function renderUnavailableSurface(message: string): void {
  const facts = document.querySelectorAll<HTMLElement>('.head-facts .fact strong')
  if (facts[0]) facts[0].textContent = 'Error'
  if (facts[1]) facts[1].textContent = 'Unavailable'
  if (facts[2]) facts[2].textContent = '—'
  if (facts[3]) facts[3].textContent = 'Request failed'

  const primary = document.querySelector<HTMLElement>('[data-battle-primary]')
  if (primary) primary.innerHTML = '<div class="notice">Recommended battle is unavailable because the data request failed.</div>'

  const inspector = document.querySelector<HTMLElement>('[data-battle-inspector]')
  if (inspector) inspector.innerHTML = '<p>No battle time can be inspected until the API responds.</p>'

  const reversals = document.querySelector<HTMLElement>('[data-battle-reversals]')
  if (reversals) reversals.innerHTML = '<p class="empty-inline">Reversals are unavailable.</p>'

  const secondary = document.querySelector<HTMLElement>('[data-battle-secondary]')
  if (secondary) secondary.innerHTML = '<p class="empty-inline">Secondary battles are unavailable.</p>'

  const feed = document.querySelector<HTMLElement>('[data-battle-feed]')
  if (feed) feed.innerHTML = '<p class="empty-inline">Battle events are unavailable.</p>'

  const coverage = document.querySelector<HTMLElement>('[data-battle-coverage]')
  if (coverage) coverage.innerHTML = `<strong>Coverage & limits</strong><p>${escapeHtml(message)} Use Refresh to retry.</p>`
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
