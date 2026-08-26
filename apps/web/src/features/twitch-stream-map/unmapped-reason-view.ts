import './stream-map-population.css'
import './geography-ui-bootstrap'
import { buildUnmappedReasonView, type StreamMapUnmappedReasonView } from './unmapped-reason-core.mjs'

type StreamMapCoverageForUnmapped = {
  mappedStreams: number
  unmappedStreams: number
  excludedNonPersonStreams: number
  unmappedReasons: Record<string, number>
}

type ExcludedNonPersonStream = {
  login: string
  displayName: string
  viewers: number
  url: string
  entityKind: string
}

export function renderUnmappedReasonAnalysis(input: {
  coverage: StreamMapCoverageForUnmapped
  excludedNonPersonStreams: ExcludedNonPersonStream[]
  filteredMappedStreams: number
}): StreamMapUnmappedReasonView {
  const model = buildUnmappedReasonView({
    reasonCounts: input.coverage.unmappedReasons,
    baselineUnmappedStreams: input.coverage.unmappedStreams,
    baselineMappedStreams: input.coverage.mappedStreams,
    filteredMappedStreams: input.filteredMappedStreams,
  })

  text('stream-map-unmapped-current', formatNumber(model.currentViewUnmappedStreams))
  text('stream-map-unmapped-baseline', formatNumber(model.baselineUnmappedStreams))
  text('stream-map-unmapped-filtered-out', formatNumber(model.filteredOutAcceptedStreams))
  renderReasonRows(model)
  renderExcludedRows(input.excludedNonPersonStreams)
  renderReconciliation(model)
  return model
}

function renderReasonRows(model: StreamMapUnmappedReasonView): void {
  const list = document.getElementById('stream-map-unmapped-reason-list')
  if (!list) return
  list.replaceChildren()

  if (model.currentReasons.length === 0) {
    const empty = document.createElement('p')
    empty.className = 'stream-map-empty'
    empty.textContent = 'No unmapped reason is present in the current evidence view.'
    list.append(empty)
    return
  }

  for (const reason of model.currentReasons) {
    const row = document.createElement('div')
    row.className = 'stream-map-unmapped-reason-row'
    row.dataset.reasonCode = reason.code
    if (reason.derived) row.dataset.reasonSource = 'client_filter'
    else row.dataset.reasonSource = 'api'

    const copy = document.createElement('div')
    copy.className = 'stream-map-unmapped-reason-copy'
    const title = document.createElement('strong')
    title.textContent = reason.label
    const code = document.createElement('code')
    code.textContent = reason.code
    const detail = document.createElement('p')
    detail.textContent = reason.detail
    copy.append(title, code, detail)

    const count = document.createElement('strong')
    count.className = 'stream-map-unmapped-reason-count'
    count.textContent = formatNumber(reason.count)
    row.append(copy, count)
    list.append(row)
  }
}

function renderExcludedRows(streams: ExcludedNonPersonStream[]): void {
  const list = document.getElementById('stream-map-excluded-nonperson-list')
  if (!list) return
  list.replaceChildren()

  if (!Array.isArray(streams) || streams.length === 0) {
    const empty = document.createElement('p')
    empty.className = 'stream-map-empty'
    empty.textContent = 'No excluded non-person channel is present in the current snapshot.'
    list.append(empty)
    return
  }

  for (const stream of [...streams].sort((left, right) => right.viewers - left.viewers || left.login.localeCompare(right.login))) {
    const row = document.createElement('div')
    row.className = 'stream-map-excluded-row'
    const channel = document.createElement('a')
    channel.href = stream.url
    channel.target = '_blank'
    channel.rel = 'noreferrer'
    channel.textContent = stream.displayName || stream.login
    const detail = document.createElement('span')
    detail.textContent = `${stream.entityKind.replace(/_/g, ' ')} · ${formatNumber(stream.viewers)} viewers`
    row.append(channel, detail)
    list.append(row)
  }
}

function renderReconciliation(model: StreamMapUnmappedReasonView): void {
  const node = document.getElementById('stream-map-unmapped-reconciliation')
  if (!node) return
  node.dataset.baselineReconciles = String(model.baselineReconciles)
  node.dataset.currentViewReconciles = String(model.currentViewReconciles)

  if (model.baselineReconciles && model.currentViewReconciles) {
    node.textContent = `Reason accounting reconciles: ${formatNumber(model.currentViewReasonTotal)} / ${formatNumber(model.currentViewUnmappedStreams)} unmapped streams in the current evidence view.`
    return
  }

  node.textContent = `Reason accounting mismatch: API reasons ${formatNumber(model.baselineReasonTotal)} / ${formatNumber(model.baselineUnmappedStreams)} baseline unmapped; current view ${formatNumber(model.currentViewReasonTotal)} / ${formatNumber(model.currentViewUnmappedStreams)}.`
}

function text(id: string, value: string): void {
  const node = document.getElementById(id)
  if (node) node.textContent = value
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(Math.max(0, Math.round(value)))
}
