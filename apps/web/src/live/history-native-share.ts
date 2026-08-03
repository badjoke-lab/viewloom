const provider = document.body.dataset.provider === 'kick' ? 'kick' : 'twitch'
const providerLabel = provider === 'kick' ? 'Kick' : 'Twitch'
let scheduled = false
let sharing = false

const observer = new MutationObserver(schedule)
observer.observe(document.documentElement, {
  childList: true,
  subtree: true,
  characterData: true,
  attributes: true,
  attributeFilter: ['data-history-report-active-mode'],
})

document.addEventListener('click', (event) => {
  const target = event.target instanceof Element ? event.target : null
  if (target?.closest('[data-history-report-mode]')) schedule()
})

schedule()

function schedule(): void {
  if (scheduled) return
  scheduled = true
  requestAnimationFrame(() => {
    scheduled = false
    syncNativeShare()
  })
}

function syncNativeShare(): void {
  const mount = document.querySelector<HTMLElement>('[data-history-report]')
  const copyButton = mount?.querySelector<HTMLButtonElement>('[data-history-report-copy]')
  const preview = mount?.querySelector<HTMLElement>('[data-history-report-preview]')
  const status = mount?.querySelector<HTMLElement>('[data-history-report-status]')
  if (!mount || !copyButton || !preview || !status) return

  const button = ensureButton(mount, copyButton)
  const mode = mount.dataset.historyReportActiveMode === 'post' ? 'post' : 'report'
  const supported = typeof navigator.share === 'function'
  const label = mode === 'post' ? 'Share short post' : 'Share report'

  if (button.textContent !== label) button.textContent = label
  if (button.hidden === supported) button.hidden = !supported
  if (!sharing && button.disabled === supported) button.disabled = !supported
  button.dataset.historyNativeShareReady = String(supported)

  button.onclick = async () => {
    if (!navigator.share) {
      status.textContent = 'Native sharing is unavailable. Use the copy action instead.'
      return
    }

    const text = preview.textContent ?? ''
    if (!text.trim()) {
      status.textContent = 'Report text is not ready yet.'
      return
    }

    sharing = true
    button.disabled = true
    status.textContent = 'Opening share sheet…'
    try {
      await navigator.share({
        title: `ViewLoom — ${providerLabel} History & Trends`,
        text,
      })
      status.textContent = 'Share sheet opened.'
    } catch (error) {
      status.textContent = error instanceof DOMException && error.name === 'AbortError'
        ? 'Sharing cancelled.'
        : 'Native sharing was unavailable. Use the copy action instead.'
    } finally {
      sharing = false
      button.disabled = false
      schedule()
    }
  }
}

function ensureButton(mount: HTMLElement, copyButton: HTMLButtonElement): HTMLButtonElement {
  const existing = mount.querySelector<HTMLButtonElement>('[data-history-report-share-native]')
  if (existing) return existing

  const button = document.createElement('button')
  button.className = 'button button--paper'
  button.type = 'button'
  button.dataset.historyReportShareNative = ''
  button.hidden = true
  button.disabled = true
  button.textContent = 'Share report'
  copyButton.insertAdjacentElement('afterend', button)
  return button
}

export {}
