import {
  historyReportText,
  type HistoryReportPayload,
  type HistoryReportProvider,
} from './history-report-text-state'

export function renderHistoryReport(payload: HistoryReportPayload): void {
  const provider: HistoryReportProvider = document.body.dataset.provider === 'kick' ? 'kick' : 'twitch'
  const mount = ensureMount()
  const preview = mount.querySelector<HTMLElement>('[data-history-report-preview]')
  const copyButton = mount.querySelector<HTMLButtonElement>('[data-history-report-copy]')
  const status = mount.querySelector<HTMLElement>('[data-history-report-status]')
  if (!preview || !copyButton || !status) return

  const text = historyReportText(payload, provider, location.href)
  preview.textContent = text
  copyButton.disabled = false
  copyButton.onclick = async () => {
    copyButton.disabled = true
    status.textContent = 'Copying…'
    try {
      if (!navigator.clipboard?.writeText) {
        selectPreview(preview)
        status.textContent = 'Report selected. Use your browser copy command.'
        return
      }
      await navigator.clipboard.writeText(text)
      status.textContent = 'Report text copied.'
    } catch {
      selectPreview(preview)
      status.textContent = 'Automatic copy was unavailable. The report text is selected.'
    } finally {
      copyButton.disabled = false
    }
  }
}

function ensureMount(): HTMLElement {
  const existing = document.querySelector<HTMLElement>('[data-history-report]')
  if (existing) return existing

  const block = document.createElement('div')
  block.className = 'history-report-block'
  block.innerHTML = `
    <div class="rule-title"><h2>Report text</h2><span>Current provider view</span></div>
    <section class="surface history-report" data-history-report>
      <div class="surface__head"><strong>Copy period summary</strong><small>Observed data only</small></div>
      <div class="surface__body history-report__body">
        <p>Use this plain-text summary for notes or posts. Coverage limits remain included.</p>
        <pre class="history-report__preview" data-history-report-preview tabindex="0">Loading report text…</pre>
        <div class="history-report__actions">
          <button class="button button--paper" type="button" data-history-report-copy disabled>Copy report text</button>
          <span data-history-report-status aria-live="polite">Waiting for retained History data…</span>
        </div>
      </div>
    </section>`

  const calendarBlock = document.querySelector<HTMLElement>('.history-calendar-block')
  const columns = document.querySelector<HTMLElement>('[data-history-columns]')
  if (calendarBlock) calendarBlock.insertAdjacentElement('afterend', block)
  else if (columns) columns.insertAdjacentElement('afterend', block)
  else document.querySelector<HTMLElement>('.history-page')?.append(block)
  return block.querySelector<HTMLElement>('[data-history-report]')!
}

function selectPreview(preview: HTMLElement): void {
  const selection = window.getSelection()
  const range = document.createRange()
  range.selectNodeContents(preview)
  selection?.removeAllRanges()
  selection?.addRange(range)
  preview.focus()
}
