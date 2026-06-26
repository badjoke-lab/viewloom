import {
  historyReportCoverage,
  metricLabel,
  metricTopStreamer,
  metricUnit,
  reportMetric,
  streamerMetricValue,
  topMetricDay,
  type HistoryReportPayload,
  type HistoryReportProvider,
} from './history-report-text-state'

const CARD_WIDTH = 1200
const CARD_HEIGHT = 630

export function renderHistoryShareCard(payload: HistoryReportPayload): void {
  const provider: HistoryReportProvider = document.body.dataset.provider === 'kick' ? 'kick' : 'twitch'
  const mount = ensureMount()
  const canvas = mount.querySelector<HTMLCanvasElement>('[data-history-share-card]')
  const preview = mount.querySelector<HTMLElement>('[data-history-share-preview]')
  const toggle = mount.querySelector<HTMLButtonElement>('[data-history-share-toggle]')
  const button = mount.querySelector<HTMLButtonElement>('[data-history-share-download]')
  const status = mount.querySelector<HTMLElement>('[data-history-share-status]')
  if (!canvas || !preview || !toggle || !button || !status) return

  const coverage = historyReportCoverage(payload)
  const metric = reportMetric(payload)
  const summary = payload.summary
  const topStreamer = metricTopStreamer(payload, metric)
  const metricDay = topMetricDay(payload, metric)
  const topValue = streamerMetricValue(topStreamer, metric)
  const primaryValue = metric === 'peak_viewers'
    ? summary?.peakViewers
    : summary?.totalViewerMinutes
  const state = normalize(payload.state || payload.coverage?.state || summary?.coverageState)
  const source = normalize(payload.source)
  const period = periodParts(payload)
  const model: CardModel = {
    provider,
    metric,
    periodLabel: period.label,
    topLabel: `TOP BY ${metricLabel(metric).toUpperCase()}`,
    topStreamer: clean(topStreamer?.displayName) || 'Unavailable for this period',
    topStreamerValue: finite(topValue)
      ? `${formatNumber(topValue)} ${metricUnit(metric)}`
      : 'Observed ranking value unavailable',
    primaryLabel: metric === 'peak_viewers' ? 'HIGHEST PEAK' : 'TOTAL OBSERVED',
    primaryValue: finite(primaryValue)
      ? `${formatNumber(primaryValue)} ${metricUnit(metric)}`
      : 'Unavailable',
    primaryDetail: validDay(metricDay?.day)
      ? `${metric === 'peak_viewers' ? 'Highest day' : 'Peak day'}: ${formatDay(metricDay.day)}`
      : 'Metric day unavailable',
    observedDays: coverage.observedDays,
    totalDays: coverage.totalDays,
    missingDays: coverage.missingDays,
    attentionDays: coverage.attentionDays,
    dataLabel: source === 'demo' || state === 'demo' ? 'DEMO DATA' : `${humanLabel(state || 'observed')} DATA`,
    linkLabel: `vl.badjoke-lab.com/${provider}/history/`,
  }

  canvas.width = CARD_WIDTH
  canvas.height = CARD_HEIGHT
  canvas.dataset.shareProvider = provider
  canvas.dataset.shareMetric = metric
  canvas.dataset.shareObserved = String(coverage.observedDays)
  canvas.dataset.shareTotal = String(coverage.totalDays)
  canvas.dataset.shareMissing = String(coverage.missingDays)
  canvas.dataset.shareAttention = String(coverage.attentionDays)
  canvas.dataset.shareWidth = String(CARD_WIDTH)
  canvas.dataset.shareHeight = String(CARD_HEIGHT)
  canvas.dataset.shareTopStreamer = model.topStreamer
  canvas.dataset.sharePrimaryValue = model.primaryValue

  const draw = (): boolean => {
    const context = canvas.getContext('2d')
    if (!context) {
      button.disabled = true
      toggle.disabled = true
      status.textContent = 'Share-card preview is unavailable in this browser.'
      return false
    }
    context.clearRect(0, 0, CARD_WIDTH, CARD_HEIGHT)
    drawCard(context, model)
    canvas.dataset.shareRendered = 'true'
    return true
  }

  const setOpen = (open: boolean): void => {
    mount.dataset.historyShareOpen = String(open)
    preview.hidden = !open
    toggle.setAttribute('aria-expanded', String(open))
    toggle.textContent = open ? 'Hide share card' : 'Preview share card'
    if (open && draw()) status.textContent = `${metricLabel(metric)} share card ready.`
    else if (!open) status.textContent = `${metricLabel(metric)} share card available on demand.`
  }

  toggle.disabled = false
  toggle.onclick = () => setOpen(mount.dataset.historyShareOpen !== 'true')
  button.disabled = false
  button.onclick = async () => {
    button.disabled = true
    status.textContent = 'Preparing PNG…'
    try {
      if (!draw()) return
      const blob = await canvasBlob(canvas)
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `viewloom-${provider}-history-${period.from}-${period.to}.png`
      document.body.append(anchor)
      anchor.click()
      anchor.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
      status.textContent = `${metricLabel(metric)} PNG downloaded.`
    } catch {
      status.textContent = 'PNG generation failed in this browser.'
    } finally {
      button.disabled = false
    }
  }

  setOpen(mount.dataset.historyShareOpen === 'true')
}

type CardModel = {
  provider: HistoryReportProvider
  metric: 'viewer_minutes' | 'peak_viewers'
  periodLabel: string
  topLabel: string
  topStreamer: string
  topStreamerValue: string
  primaryLabel: string
  primaryValue: string
  primaryDetail: string
  observedDays: number
  totalDays: number
  missingDays: number
  attentionDays: number
  dataLabel: string
  linkLabel: string
}

function drawCard(context: CanvasRenderingContext2D, model: CardModel): void {
  const accent = model.provider === 'kick' ? '#53fc18' : '#9b7cff'
  const background = context.createLinearGradient(0, 0, CARD_WIDTH, CARD_HEIGHT)
  background.addColorStop(0, '#07111f')
  background.addColorStop(1, '#101728')
  context.fillStyle = background
  context.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT)

  context.fillStyle = accent
  context.fillRect(0, 0, 18, CARD_HEIGHT)
  context.fillRect(70, 76, 92, 8)

  context.fillStyle = '#f5f7fb'
  context.font = '800 28px system-ui, sans-serif'
  context.fillText('VIEWLOOM', 70, 62)

  context.fillStyle = accent
  context.font = '800 20px ui-monospace, monospace'
  context.fillText(`${model.provider.toUpperCase()} DATA · HISTORY`, 70, 120)

  context.fillStyle = '#f5f7fb'
  context.font = '800 58px system-ui, sans-serif'
  context.fillText('History snapshot', 70, 196)

  context.fillStyle = '#aeb8ca'
  context.font = '650 25px ui-monospace, monospace'
  context.fillText(`${model.periodLabel} UTC`, 70, 238)
  context.fillText(`Metric: ${metricLabel(model.metric)}`, 70, 276)

  drawPanel(context, 70, 322, 485, 164, accent, model.topLabel, model.topStreamer, model.topStreamerValue)
  drawPanel(context, 575, 322, 250, 164, accent, model.primaryLabel, model.primaryValue, model.primaryDetail)
  drawCoveragePanel(context, 845, 322, 285, 164, accent, model)

  context.fillStyle = '#aeb8ca'
  context.font = '700 18px ui-monospace, monospace'
  context.fillText(model.dataLabel, 70, 538)
  context.fillText('Observed ViewLoom data · not provider-wide · independent and unofficial', 70, 570)

  context.textAlign = 'right'
  context.fillStyle = '#f5f7fb'
  context.font = '700 18px ui-monospace, monospace'
  context.fillText(model.linkLabel, 1130, 606)
  context.textAlign = 'left'
}

function drawPanel(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  accent: string,
  label: string,
  value: string,
  detail: string,
): void {
  context.fillStyle = 'rgba(255,255,255,.035)'
  context.fillRect(x, y, width, height)
  context.strokeStyle = 'rgba(255,255,255,.16)'
  context.lineWidth = 2
  context.strokeRect(x, y, width, height)
  context.fillStyle = accent
  context.font = '800 17px ui-monospace, monospace'
  context.fillText(label, x + 24, y + 35)
  context.fillStyle = '#f5f7fb'
  context.font = '800 30px system-ui, sans-serif'
  drawFittedText(context, value, x + 24, y + 88, width - 48, 30)
  context.fillStyle = '#aeb8ca'
  context.font = '650 18px ui-monospace, monospace'
  drawFittedText(context, detail, x + 24, y + 126, width - 48, 18)
}

function drawCoveragePanel(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  accent: string,
  model: CardModel,
): void {
  context.fillStyle = 'rgba(255,255,255,.035)'
  context.fillRect(x, y, width, height)
  context.strokeStyle = 'rgba(255,255,255,.16)'
  context.lineWidth = 2
  context.strokeRect(x, y, width, height)
  context.fillStyle = accent
  context.font = '800 17px ui-monospace, monospace'
  context.fillText('COVERAGE', x + 24, y + 35)
  context.fillStyle = '#f5f7fb'
  context.font = '800 42px system-ui, sans-serif'
  context.fillText(`${model.observedDays}/${model.totalDays} days`, x + 24, y + 90)
  context.fillStyle = '#aeb8ca'
  context.font = '650 17px ui-monospace, monospace'
  context.fillText(`${model.missingDays} missing · ${model.attentionDays} partial`, x + 24, y + 128)
}

function drawFittedText(
  context: CanvasRenderingContext2D,
  value: string,
  x: number,
  y: number,
  maxWidth: number,
  initialSize: number,
): void {
  let size = initialSize
  const family = initialSize >= 24 ? 'system-ui, sans-serif' : 'ui-monospace, monospace'
  while (size > 14) {
    context.font = `800 ${size}px ${family}`
    if (context.measureText(value).width <= maxWidth) break
    size -= 1
  }
  const fitted = context.measureText(value).width <= maxWidth ? value : truncate(context, value, maxWidth)
  context.fillText(fitted, x, y)
}

function truncate(context: CanvasRenderingContext2D, value: string, maxWidth: number): string {
  const points = [...value]
  while (points.length && context.measureText(`${points.join('')}…`).width > maxWidth) points.pop()
  return points.length ? `${points.join('')}…` : '—'
}

function ensureMount(): HTMLElement {
  const existing = document.querySelector<HTMLElement>('[data-history-share]')
  if (existing) return existing

  const block = document.createElement('div')
  block.className = 'history-share-block'
  block.innerHTML = `
    <div class="rule-title"><h2>Share card</h2><span>1200 × 630 PNG</span></div>
    <section class="surface history-share" data-history-share data-history-share-open="false">
      <div class="surface__head"><strong>Download history snapshot</strong><small>Generated in this browser</small></div>
      <div class="surface__body history-share__body">
        <p>The card keeps the current provider, period, metric, and coverage limits. No additional data request is made.</p>
        <div class="history-share__actions">
          <button class="button" type="button" data-history-share-toggle aria-expanded="false" aria-controls="history-share-preview-fallback">Preview share card</button>
          <button class="button button--paper" type="button" data-history-share-download disabled>Download PNG</button>
          <span data-history-share-status aria-live="polite">Share card available on demand.</span>
        </div>
        <div id="history-share-preview-fallback" class="history-share__preview" data-history-share-preview hidden><canvas width="1200" height="630" data-history-share-card aria-label="History share-card preview"></canvas></div>
      </div>
    </section>`

  const reportBlock = document.querySelector<HTMLElement>('.history-report-block')
  const calendarBlock = document.querySelector<HTMLElement>('.history-calendar-block')
  const columns = document.querySelector<HTMLElement>('[data-history-columns]')
  if (reportBlock) reportBlock.insertAdjacentElement('afterend', block)
  else if (calendarBlock) calendarBlock.insertAdjacentElement('afterend', block)
  else if (columns) columns.insertAdjacentElement('afterend', block)
  else document.querySelector<HTMLElement>('.history-page')?.append(block)
  return block.querySelector<HTMLElement>('[data-history-share]')!
}

function canvasBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Canvas returned no PNG.')), 'image/png')
  })
}

function periodParts(payload: HistoryReportPayload): { from: string; to: string; label: string } {
  const supplied = (payload.daily ?? []).map((row) => row.day).filter(validDay).sort()
  const from = validDay(payload.period?.from) ? payload.period.from : supplied[0] ?? 'unknown'
  const to = validDay(payload.period?.to) ? payload.period.to : supplied.at(-1) ?? 'unknown'
  return {
    from,
    to,
    label: from !== 'unknown' && to !== 'unknown' ? `${from} – ${to}` : clean(payload.period?.label) || 'Current retained period',
  }
}

function formatDay(day: string): string {
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(`${day}T00:00:00.000Z`))
}

function formatNumber(value: number): string {
  return Math.round(value).toLocaleString('en-US')
}

function normalize(value: unknown): string {
  return typeof value === 'string' ? value.trim().toLowerCase() : ''
}

function humanLabel(value: string): string {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase())
}

function clean(value: unknown): string {
  return typeof value === 'string' ? value.replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim() : ''
}

function finite(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function validDay(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00.000Z`)
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
}
