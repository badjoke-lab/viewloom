import type { HistoryReportPayload, HistoryReportProvider } from './history-report-text-state'
import { historyExportModel } from './history-export-model'
import { historyExportCsv, historyExportJson } from './history-export-serialize'

export function renderHistoryExport(payload: HistoryReportPayload): void {
  const provider: HistoryReportProvider = document.body.dataset.provider === 'kick' ? 'kick' : 'twitch'
  const model = historyExportModel(payload, provider, location.href)
  const mount = ensureMount()
  const csvButton = mount.querySelector<HTMLButtonElement>('[data-history-export-csv]')
  const jsonButton = mount.querySelector<HTMLButtonElement>('[data-history-export-json]')
  const status = mount.querySelector<HTMLElement>('[data-history-export-status]')
  if (!csvButton || !jsonButton || !status) return

  mount.dataset.exportProvider = provider
  mount.dataset.exportMetric = model.metric
  mount.dataset.exportRows = String(model.daily.length)
  mount.dataset.exportMissing = String(model.coverage.missing_days)
  mount.dataset.exportFrom = model.period.from
  mount.dataset.exportTo = model.period.to
  status.textContent = `${model.daily.length} UTC rows · ${model.coverage.missing_days} missing · ${metricLabel(model.metric)}`

  csvButton.disabled = false
  jsonButton.disabled = false
  csvButton.onclick = () => downloadText(
    historyExportCsv(model),
    `viewloom-${provider}-history-${model.period.from}-${model.period.to}.csv`,
    'text/csv;charset=utf-8',
    status,
    'CSV downloaded.',
  )
  jsonButton.onclick = () => downloadText(
    historyExportJson(model),
    `viewloom-${provider}-history-${model.period.from}-${model.period.to}.json`,
    'application/json;charset=utf-8',
    status,
    'JSON downloaded.',
  )
}

function ensureMount(): HTMLElement {
  const existing = document.querySelector<HTMLElement>('[data-history-export]')
  if (existing) return existing

  const block = document.createElement('div')
  block.className = 'history-export-block'
  block.innerHTML = `
    <div class="rule-title"><h2>Export</h2><span>Current provider view</span></div>
    <section class="surface history-export" data-history-export>
      <div class="surface__head"><strong>Download retained History data</strong><small>Client-side export</small></div>
      <div class="surface__body history-export__body">
        <p>CSV contains normalized UTC daily rows. JSON preserves the structured current view and coverage limits.</p>
        <div class="history-export__actions">
          <button class="button button--paper" type="button" data-history-export-csv disabled>Download CSV</button>
          <button class="button" type="button" data-history-export-json disabled>Download JSON</button>
        </div>
        <span data-history-export-status aria-live="polite">Waiting for retained History data…</span>
      </div>
    </section>`

  const shareBlock = document.querySelector<HTMLElement>('.history-share-block')
  const reportBlock = document.querySelector<HTMLElement>('.history-report-block')
  const calendarBlock = document.querySelector<HTMLElement>('.history-calendar-block')
  if (shareBlock) shareBlock.insertAdjacentElement('afterend', block)
  else if (reportBlock) reportBlock.insertAdjacentElement('afterend', block)
  else if (calendarBlock) calendarBlock.insertAdjacentElement('afterend', block)
  else document.querySelector<HTMLElement>('.history-page')?.append(block)
  return block.querySelector<HTMLElement>('[data-history-export]')!
}

function downloadText(
  text: string,
  filename: string,
  type: string,
  status: HTMLElement,
  success: string,
): void {
  const blob = new Blob([text], { type })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  status.textContent = success
}

function metricLabel(metric: 'viewer_minutes' | 'peak_viewers'): string {
  return metric === 'peak_viewers' ? 'Peak viewers' : 'Viewer-minutes'
}
