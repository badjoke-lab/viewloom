type DebugPayload = {
  source?: string
  state?: string
  status?: string
  note?: string
  coverageNote?: string
  partialNote?: string
  lastUpdated?: string
  selectedDate?: string
  bucketSize?: number
  topN?: number
  valueMode?: string
  rangeMode?: string
  windowStart?: string
  windowEnd?: string
  isRolling?: boolean
  buckets?: string[]
  totalViewersByBucket?: number[]
  bands?: Array<{
    streamerId?: string
    name?: string
    isOthers?: boolean
    totalViewerMinutes?: number
    peakViewers?: number
    avgViewers?: number
    peakShare?: number
    biggestRiseBucket?: string | null
    firstSeen?: string | null
    lastSeen?: string | null
    buckets?: Array<{ viewers?: number; share?: number; activity?: number; activityAvailable?: boolean }>
  }>
  detailPanelSource?: {
    defaultStreamerId?: string | null
    streamers?: Array<Record<string, unknown>>
  }
  activity?: {
    available?: boolean
    note?: string
  }
}

type DebugRequest = {
  day: string
  rangeMode: string
  date?: string
  top: string
  metric: string
  mode: string
  bucket: string
}

const DEBUG_ID = 'dayflow-debug-details'

function q<T extends Element>(selector: string): T | null {
  return document.querySelector<T>(selector)
}

function valueFromForm(name: string): string | null {
  return q<HTMLSelectElement | HTMLInputElement>(`#dayflow-controls [name="${name}"]`)?.value ?? null
}

function checkedFromForm(name: string): boolean | null {
  const node = q<HTMLInputElement>(`#dayflow-controls [name="${name}"]`)
  return node ? node.checked : null
}

function readRequest(): DebugRequest {
  const params = new URLSearchParams(window.location.search)
  const rangeMode = valueFromForm('day') ?? params.get('rangeMode') ?? params.get('day') ?? 'today'
  const metric = valueFromForm('metric') ?? params.get('metric') ?? params.get('mode') ?? 'volume'
  const date = valueFromForm('date') ?? params.get('date') ?? new Date().toISOString().slice(0, 10)
  return {
    day: rangeMode,
    rangeMode,
    date: rangeMode === 'date' ? date : undefined,
    top: valueFromForm('top') ?? params.get('top') ?? '20',
    metric,
    mode: metric,
    bucket: valueFromForm('bucket') ?? params.get('bucket') ?? '5',
  }
}

function apiUrl(request: DebugRequest): string {
  const url = new URL('/api/day-flow', window.location.origin)
  url.searchParams.set('day', request.day)
  url.searchParams.set('rangeMode', request.rangeMode)
  if (request.date) url.searchParams.set('date', request.date)
  url.searchParams.set('top', request.top)
  url.searchParams.set('metric', request.metric)
  url.searchParams.set('mode', request.mode)
  url.searchParams.set('bucket', request.bucket)
  return url.toString()
}

function ensureHost(): HTMLDetailsElement {
  let details = q<HTMLDetailsElement>(`#${DEBUG_ID}`)
  if (details) return details
  details = document.createElement('details')
  details.id = DEBUG_ID
  details.className = 'rail-card dayflow-debug-details'
  details.innerHTML = '<summary>Debug details</summary><pre data-dayflow-debug-body>Loading Day Flow debug…</pre>'
  const root = q<HTMLElement>('#dayflow-root') ?? q<HTMLElement>('.page-main') ?? document.body
  root.insertAdjacentElement('afterend', details)
  installDebugStyles()
  return details
}

function installDebugStyles(): void {
  if (document.getElementById('dayflow-debug-style')) return
  const style = document.createElement('style')
  style.id = 'dayflow-debug-style'
  style.textContent = `
    .dayflow-debug-details{margin:18px auto 42px;max-width:min(1180px,calc(100vw - 32px));background:rgba(15,23,42,.78);border:1px solid rgba(122,162,255,.16);border-radius:18px;padding:14px 16px;color:var(--text)}
    .dayflow-debug-details summary{cursor:pointer;color:#cbd5e1;font-weight:700}
    .dayflow-debug-details pre{margin:14px 0 0;max-height:460px;overflow:auto;white-space:pre-wrap;word-break:break-word;color:#dbeafe;font-size:12px;line-height:1.55;background:rgba(2,6,23,.52);border:1px solid rgba(148,163,184,.14);border-radius:14px;padding:12px}
  `
  document.head.appendChild(style)
}

function observedBucketCount(values: number[] | undefined): number {
  return (values ?? []).filter((value) => Number.isFinite(value) && value > 0).length
}

function summarizePayload(payload: DebugPayload, request: DebugRequest) {
  const totals = payload.totalViewersByBucket ?? []
  const bands = payload.bands ?? []
  const observedTotals = observedBucketCount(totals)
  const maxTotal = totals.length > 0 ? Math.max(...totals.map((value) => Number.isFinite(value) ? value : 0)) : 0
  return {
    fetchedAt: new Date().toISOString(),
    request,
    autoUpdate: checkedFromForm('autoUpdate'),
    source: payload.source,
    state: payload.state,
    status: payload.status,
    rangeMode: payload.rangeMode,
    selectedDate: payload.selectedDate,
    windowStart: payload.windowStart,
    windowEnd: payload.windowEnd,
    lastUpdated: payload.lastUpdated,
    bucketSize: payload.bucketSize,
    topN: payload.topN,
    valueMode: payload.valueMode,
    bucketCount: payload.buckets?.length ?? 0,
    totalViewersByBucketCount: totals.length,
    observedTotalBuckets: observedTotals,
    maxTotalViewers: maxTotal,
    bandCount: bands.length,
    detailDefaultStreamerId: payload.detailPanelSource?.defaultStreamerId ?? null,
    detailStreamerCount: payload.detailPanelSource?.streamers?.length ?? 0,
    activity: payload.activity ?? null,
    notes: {
      note: payload.note,
      coverageNote: payload.coverageNote,
      partialNote: payload.partialNote,
    },
    bands: bands.slice(0, 12).map((band) => {
      const points = band.buckets ?? []
      const observed = points.filter((point) => (point.viewers ?? 0) > 0).length
      const max = points.length > 0 ? Math.max(...points.map((point) => point.viewers ?? 0)) : 0
      const zeroOrMissing = points.length - observed
      return {
        streamerId: band.streamerId,
        name: band.name,
        isOthers: band.isOthers ?? false,
        bucketCount: points.length,
        observedBuckets: observed,
        zeroOrMissingBuckets: zeroOrMissing,
        maxViewers: max,
        totalViewerMinutes: band.totalViewerMinutes,
        peakViewers: band.peakViewers,
        avgViewers: band.avgViewers,
        peakShare: band.peakShare,
        biggestRiseBucket: band.biggestRiseBucket,
        firstSeen: band.firstSeen,
        lastSeen: band.lastSeen,
      }
    }),
  }
}

async function refreshDebug(): Promise<void> {
  const host = ensureHost()
  const body = host.querySelector<HTMLElement>('[data-dayflow-debug-body]')
  if (!body) return
  const request = readRequest()
  body.textContent = 'Loading Day Flow debug…'
  try {
    const response = await fetch(apiUrl(request), { headers: { accept: 'application/json' }, cache: 'no-store' })
    const payload = await response.json() as DebugPayload
    body.textContent = JSON.stringify({ httpStatus: response.status, ok: response.ok, ...summarizePayload(payload, request) }, null, 2)
  } catch (error) {
    body.textContent = JSON.stringify({ error: error instanceof Error ? error.message : String(error), request }, null, 2)
  }
}

function schedule(): void {
  window.setTimeout(() => void refreshDebug(), 800)
  document.addEventListener('change', (event) => {
    const target = event.target
    if (target instanceof Element && target.closest('#dayflow-controls')) window.setTimeout(() => void refreshDebug(), 600)
  })
  document.addEventListener('submit', (event) => {
    const target = event.target
    if (target instanceof Element && target.id === 'dayflow-controls') window.setTimeout(() => void refreshDebug(), 900)
  })
  window.setInterval(() => void refreshDebug(), 60_000)
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', schedule)
else schedule()
