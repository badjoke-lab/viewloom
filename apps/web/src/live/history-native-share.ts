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
  button.setAttribute('aria-describedby', 'history-report-status')

  const retainedStatus = mount.dataset.historyReportActionStatus
  if (retainedStatus && status.textContent !== retainedStatus) status.textContent = retainedStatus

  button.onclick = async () => {
    if (!navigator.share) {
      setReportActionStatus('Native sharing is unavailable. Use the copy action instead.')
      return
    }

    const currentPreview = document.querySelector<HTMLElement>('[data-history-report-preview]')
    const text = currentPreview?.textContent ?? ''
    if (!text.trim()) {
      setReportActionStatus('Report text is not ready yet.')
      return
    }

    sharing = true
    button.disabled = true
    setReportActionStatus('Opening share sheet…')
    try {
      await navigator.share({
        title: `ViewLoom — ${providerLabel} History & Trends`,
        text,
      })
      setReportActionStatus('Share completed.')
    } catch (error) {
      setReportActionStatus(error instanceof DOMException && error.name === 'AbortError'
        ? 'Sharing cancelled.'
        : 'Native sharing was unavailable. Use the copy action instead.')
    } finally {
      sharing = false
      button.disabled = false
      schedule()
    }
  }
}

function setReportActionStatus(message: string): void {
  const mount = document.querySelector<HTMLElement>('[data-history-report]')
  if (!mount) return
  mount.dataset.historyReportActionStatus = message
  const status = mount.querySelector<HTMLElement>('[data-history-report-status]')
  if (status) status.textContent = message
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
  button.setAttribute('aria-describedby', 'history-report-status')
  button.textContent = 'Share report'
  copyButton.insertAdjacentElement('afterend', button)
  return button
}

export {}
