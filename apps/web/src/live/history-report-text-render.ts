import {
  historyReportText,
  type HistoryReportPayload,
  type HistoryReportProvider,
} from './history-report-text-state'
import {
  historyShortPostLength,
  historyShortPostText,
} from './history-report-social'

type HistoryReportMode = 'report' | 'post'

type KeyboardHandlers = {
  keydown: EventListener
  keyup: EventListener
}

const keyboardHandlers = new WeakMap<HTMLElement, KeyboardHandlers>()
const navigationKeys = new Set(['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Home', 'End'])

export function renderHistoryReport(payload: HistoryReportPayload): void {
  const provider: HistoryReportProvider = document.body.dataset.provider === 'kick' ? 'kick' : 'twitch'
  const mount = ensureMount()
  const preview = mount.querySelector<HTMLElement>('[data-history-report-preview]')
  const copyButton = mount.querySelector<HTMLButtonElement>('[data-history-report-copy]')
  const status = mount.querySelector<HTMLElement>('[data-history-report-status]')
  const count = mount.querySelector<HTMLElement>('[data-history-report-count]')
  const modeButtons = mount.querySelectorAll<HTMLButtonElement>('[data-history-report-mode]')
  if (!preview || !copyButton || !status || !count || !modeButtons.length) return

  const texts: Record<HistoryReportMode, string> = {
    report: historyReportText(payload, provider, location.href),
    post: historyShortPostText(payload, provider, location.href),
  }

  const applyMode = (mode: HistoryReportMode): void => {
    mount.dataset.historyReportActiveMode = mode
    modeButtons.forEach((button) => {
      const active = button.dataset.historyReportMode === mode
      button.classList.toggle('active', active)
      button.setAttribute('aria-pressed', String(active))
    })
    preview.textContent = texts[mode]
    preview.setAttribute('aria-label', mode === 'post' ? 'Short post preview' : 'Full report preview')
    copyButton.textContent = mode === 'post' ? 'Copy short post' : 'Copy report'
    count.textContent = mode === 'post'
      ? `${historyShortPostLength(texts.post)} / 280 characters`
      : `${texts.report.split('\n').length} lines`
    status.textContent = mode === 'post' ? 'Short post ready.' : 'Full report ready.'
  }

  modeButtons.forEach((button) => {
    button.onclick = () => applyMode(button.dataset.historyReportMode === 'post' ? 'post' : 'report')
  })
  installModeKeyboardNavigation(mount, applyMode)

  copyButton.disabled = false
  copyButton.onclick = async () => {
    const mode: HistoryReportMode = mount.dataset.historyReportActiveMode === 'post' ? 'post' : 'report'
    const text = texts[mode]
    copyButton.disabled = true
    status.textContent = 'Copying…'
    try {
      if (!navigator.clipboard?.writeText) {
        selectPreview(preview)
        status.textContent = `${mode === 'post' ? 'Short post' : 'Report'} selected. Use your browser copy command.`
        return
      }
      await navigator.clipboard.writeText(text)
      status.textContent = mode === 'post' ? 'Short post copied.' : 'Report text copied.'
    } catch {
      selectPreview(preview)
      status.textContent = 'Automatic copy was unavailable. The visible text is selected.'
    } finally {
      copyButton.disabled = false
    }
  }

  applyMode(mount.dataset.historyReportActiveMode === 'post' ? 'post' : 'report')
}

function ensureMount(): HTMLElement {
  const existing = document.querySelector<HTMLElement>('[data-history-report]')
  if (existing) return existing

  const block = document.createElement('div')
  block.className = 'history-report-block'
  block.innerHTML = `
    <div class="rule-title"><h2>Report &amp; Export</h2><span>Current provider view</span></div>
    <section class="surface history-report history-publish-workspace" data-history-report data-history-share data-history-export data-history-report-active-mode="report" data-history-share-open="false">
      <div class="surface__head"><strong>Prepare the current period view</strong><small>Observed data only</small></div>
      <div class="surface__body history-report__body">
        <div class="history-publish-intro">
          <p>Copy a full report or compact post, preview a share card only when needed, or download the retained daily data.</p>
          <span>All outputs reuse the current provider response.</span>
        </div>
        <div class="history-report__mode" role="group" aria-label="Report text format">
          <button type="button" class="active" data-history-report-mode="report" aria-pressed="true" aria-controls="history-report-preview">Full report</button>
          <button type="button" data-history-report-mode="post" aria-pressed="false" aria-controls="history-report-preview">Short post</button>
          <span data-history-report-count>Loading…</span>
        </div>
        <pre id="history-report-preview" class="history-report__preview" data-history-report-preview tabindex="0" aria-label="Full report preview">Loading report text…</pre>
        <div class="history-publish-actions" aria-label="Report and export actions">
          <button class="button button--paper" type="button" data-history-report-copy aria-describedby="history-report-status" disabled>Copy report</button>
          <button class="button" type="button" data-history-share-toggle aria-expanded="false" aria-controls="history-share-preview" aria-describedby="history-share-status">Preview share card</button>
          <button class="button" type="button" data-history-share-download aria-describedby="history-share-status" disabled>Download PNG</button>
          <button class="button" type="button" data-history-export-csv aria-describedby="history-export-status" disabled>Download CSV</button>
          <button class="button" type="button" data-history-export-json aria-describedby="history-export-status" disabled>Download JSON</button>
        </div>
        <div class="history-publish-statuses">
          <span id="history-report-status" data-history-report-status role="status" aria-live="polite" aria-atomic="true">Waiting for retained History data…</span>
          <span id="history-share-status" data-history-share-status role="status" aria-live="polite" aria-atomic="true">Share card available on demand.</span>
          <span id="history-export-status" data-history-export-status role="status" aria-live="polite" aria-atomic="true">Waiting for retained History data…</span>
        </div>
        <div id="history-share-preview" class="history-share__preview" data-history-share-preview hidden>
          <canvas width="1200" height="630" data-history-share-card role="img" aria-label="History share-card preview">History share-card preview</canvas>
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

function installModeKeyboardNavigation(
  mount: HTMLElement,
  applyMode: (mode: HistoryReportMode) => void,
): void {
  const group = mount.querySelector<HTMLElement>('.history-report__mode')
  if (!group) return

  const previous = keyboardHandlers.get(group)
  if (previous) {
    group.removeEventListener('keydown', previous.keydown, true)
    group.removeEventListener('keyup', previous.keyup, true)
  }

  const keydown: EventListener = (rawEvent) => {
    const event = rawEvent as KeyboardEvent
    const target = modeButtonTarget(event, group)
    if (!target || !navigationKeys.has(event.key)) return

    const ordered = Array.from(group.querySelectorAll<HTMLButtonElement>('[data-history-report-mode]'))
    const index = ordered.indexOf(target)
    if (index < 0) return

    let nextIndex = index
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') nextIndex = (index + 1) % ordered.length
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') nextIndex = (index - 1 + ordered.length) % ordered.length
    else if (event.key === 'Home') nextIndex = 0
    else if (event.key === 'End') nextIndex = ordered.length - 1

    event.preventDefault()
    event.stopPropagation()
    const mode: HistoryReportMode = ordered[nextIndex].dataset.historyReportMode === 'post' ? 'post' : 'report'
    applyMode(mode)
    focusCurrentMode(mode)
  }

  const keyup: EventListener = (rawEvent) => {
    const event = rawEvent as KeyboardEvent
    if (!navigationKeys.has(event.key)) return
    const target = modeButtonTarget(event, group)
    if (!target) return

    event.preventDefault()
    event.stopPropagation()
    const mode: HistoryReportMode = document.querySelector<HTMLElement>('[data-history-report]')?.dataset.historyReportActiveMode === 'post'
      ? 'post'
      : 'report'
    focusCurrentMode(mode)
  }

  keyboardHandlers.set(group, { keydown, keyup })
  group.addEventListener('keydown', keydown, true)
  group.addEventListener('keyup', keyup, true)
}

function modeButtonTarget(event: KeyboardEvent, group: HTMLElement): HTMLButtonElement | null {
  const target = event.target instanceof Element
    ? event.target.closest<HTMLButtonElement>('[data-history-report-mode]')
    : null
  return target && group.contains(target) ? target : null
}

function focusCurrentMode(mode: HistoryReportMode): void {
  const selector = `[data-history-report-mode="${mode}"]`
  document.querySelector<HTMLButtonElement>(selector)?.focus({ preventScroll: true })
  queueMicrotask(() => document.querySelector<HTMLButtonElement>(selector)?.focus({ preventScroll: true }))
}

function selectPreview(preview: HTMLElement): void {
  const selection = window.getSelection()
  const range = document.createRange()
  range.selectNodeContents(preview)
  selection?.removeAllRanges()
  selection?.addRange(range)
  preview.focus()
}
