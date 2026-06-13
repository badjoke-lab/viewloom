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
    if (controller.signal.aborted && !upstreamSignal?.aborted) {
      throw new Error(`Battle Lines API did not respond within ${Math.round(BATTLE_LINES_TIMEOUT_MS / 1000)} seconds.`)
    }
    throw error
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
