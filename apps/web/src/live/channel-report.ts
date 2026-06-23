import '../channel-report.css'
import type {
  ChannelBattleEntry,
  ChannelDay,
  ChannelHistoryPayload,
  ChannelProvider,
  ChannelStreamer,
} from './channel/model'

type ReportMode = 'full' | 'short'
type DailyEntry = { day: ChannelDay; streamer?: ChannelStreamer }

type ReportContext = {
  provider: ChannelProvider
  providerName: string
  channelId: string
  displayName: string
  period: '7d' | '30d'
  periodLabel: string
  source: string
  state: string
  requestedDays: number
  observedDays: number
  summary?: ChannelStreamer
  daily: DailyEntry[]
  retained: DailyEntry[]
  rivals: ChannelBattleEntry[]
  pageUrl: string
  coverage: ChannelHistoryPayload['coverage']
}

const provider: ChannelProvider = document.body.dataset.provider === 'kick' ? 'kick' : 'twitch'
const providerName = provider === 'kick' ? 'Kick' : 'Twitch'
const endpoint = provider === 'kick' ? '/api/kick-history' : '/api/history'
const limitations = [
  "This output covers ViewLoom's retained provider-specific footprint only.",
  'Absence from a retained daily Top 10 is not confirmation that the channel was offline.',
  'Exact session start/end history is not available from this retained footprint.',
]

let payload: ChannelHistoryPayload | null = null
let mode: ReportMode = 'full'

installWorkspace()
installHistoryCapture()

function installWorkspace(): void {
  const panel = document.querySelector<HTMLElement>('[data-channel-view-panel="report"]')
  if (!panel) return
  panel.innerHTML = `
    <div class="rule-title"><h2>Report &amp; Export</h2><span>Provider-specific retained evidence</span></div>
    <section class="channel-report-workspace" data-channel-report-workspace>
      <div class="channel-report-main">
        <div class="channel-report-modes" aria-label="Report mode">
          <button type="button" data-channel-report-mode="full" aria-pressed="true">Full summary</button>
          <button type="button" data-channel-report-mode="short" aria-pressed="false">Short post</button>
        </div>
        <pre class="channel-report-preview" data-channel-report-preview tabindex="0">Loading retained report data…</pre>
      </div>
      <aside class="channel-report-actions" aria-label="Report actions">
        <h3>Use this retained view</h3>
        <button class="button button--paper" type="button" data-channel-report-copy disabled>Copy summary</button>
        <button class="button button--paper" type="button" data-channel-report-csv disabled>Download CSV</button>
        <button class="button button--paper" type="button" data-channel-report-json disabled>Download JSON</button>
        <p class="channel-report-feedback" data-channel-report-feedback aria-live="polite">Waiting for the provider History response.</p>
        <p class="channel-report-limit">CSV contains one row per requested day. Missing observations remain blank; JSON uses null.</p>
      </aside>
    </section>`

  panel.querySelectorAll<HTMLButtonElement>('[data-channel-report-mode]').forEach((button) => {
    button.addEventListener('click', () => {
      const next = button.dataset.channelReportMode
      if ((next !== 'full' && next !== 'short') || next === mode) return
      mode = next
      syncMode(panel)
      renderReport()
    })
  })
  panel.querySelector<HTMLButtonElement>('[data-channel-report-copy]')?.addEventListener('click', () => { void copySummary() })
  panel.querySelector<HTMLButtonElement>('[data-channel-report-csv]')?.addEventListener('click', downloadCsv)
  panel.querySelector<HTMLButtonElement>('[data-channel-report-json]')?.addEventListener('click', downloadJson)
  syncMode(panel)
}

function installHistoryCapture(): void {
  const originalFetch = window.fetch.bind(window)
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const response = await originalFetch(input, init)
    const url = requestUrl(input)
    if (!url || url.origin !== location.origin || url.pathname !== endpoint || !response.ok) return response
    try {
      payload = await response.clone().json() as ChannelHistoryPayload
      renderReport()
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Unable to prepare report data.', 'error')
    }
    return response
  }
}

function syncMode(panel: HTMLElement): void {
  panel.querySelectorAll<HTMLButtonElement>('[data-channel-report-mode]').forEach((button) => {
    const active = button.dataset.channelReportMode === mode
    button.classList.toggle('active', active)
    button.setAttribute('aria-pressed', String(active))
  })
}

function renderReport(): void {
  const preview = document.querySelector<HTMLElement>('[data-channel-report-preview]')
  const actions = document.querySelectorAll<HTMLButtonElement>('[data-channel-report-copy], [data-channel-report-csv], [data-channel-report-json]')
  if (!preview) return
  if (!payload) {
    preview.textContent = 'Loading retained report data…'
    actions.forEach((button) => { button.disabled = true })
    return
  }
  const context = buildContext(payload)
  preview.textContent = mode === 'full' ? fullSummary(context) : shortPost(context)
  actions.forEach((button) => { button.disabled = false })
  document.body.dataset.channelReportReady = 'true'
  setFeedback(`${mode === 'full' ? 'Full summary' : 'Short post'} ready from the loaded ${providerName} History response.`, 'ready')
}

async function copySummary(): Promise<void> {
  if (!payload) return setFeedback('Report data is not ready.', 'error')
  const context = buildContext(payload)
  const text = mode === 'full' ? fullSummary(context) : shortPost(context)
  try {
    await writeClipboard(text)
    setFeedback(`${mode === 'full' ? 'Full summary' : 'Short post'} copied.`, 'success')
  } catch (error) {
    setFeedback(error instanceof Error ? error.message : 'Copy failed.', 'error')
  }
}

function downloadCsv(): void {
  if (!payload) return setFeedback('Report data is not ready.', 'error')
  try {
    const context = buildContext(payload)
    downloadFile(filename(context, 'csv'), '\ufeff' + csvOutput(context), 'text/csv;charset=utf-8')
    setFeedback('Daily CSV prepared without another network request.', 'success')
  } catch (error) {
    setFeedback(error instanceof Error ? error.message : 'CSV export failed.', 'error')
  }
}

function downloadJson(): void {
  if (!payload) return setFeedback('Report data is not ready.', 'error')
  try {
    const context = buildContext(payload)
    downloadFile(filename(context, 'json'), JSON.stringify(jsonOutput(context), null, 2) + '\n', 'application/json;charset=utf-8')
    setFeedback('Structured JSON prepared without another network request.', 'success')
  } catch (error) {
    setFeedback(error instanceof Error ? error.message : 'JSON export failed.', 'error')
  }
}

function buildContext(history: ChannelHistoryPayload): ReportContext {
  const url = new URL(location.href)
  const channelId = normalizeId(url.searchParams.get('id') ?? '')
  const period = url.searchParams.get('period') === '7d' ? '7d' : '30d'
  const daily = (history.daily ?? []).map((day) => ({ day, streamer: findStreamer(day.topStreamers ?? [], channelId) }))
  const retained = daily.filter((entry) => Boolean(entry.streamer)).sort((left, right) => text(right.day.day).localeCompare(text(left.day.day), 'en'))
  const summary = findStreamer(history.topStreamers ?? [], channelId)
  const displayName = summary?.displayName
    ?? retained[0]?.streamer?.displayName
    ?? safeRequestedName(url.searchParams.get('name'))
    ?? channelId
    ?? 'Unselected channel'
  const rivals = (history.battleArchive ?? [])
    .filter((entry) => normalized(entry.streamerAId) === channelId || normalized(entry.streamerBId) === channelId)
    .sort(compareBattles)
    .slice(0, 3)
  const requestedDays = history.period?.days ?? daily.length
  const observedDays = history.coverage?.observedDays ?? daily.filter((entry) => entry.day.coverageState !== 'missing').length
  return {
    provider,
    providerName,
    channelId,
    displayName,
    period,
    periodLabel: history.period?.label ?? (period === '7d' ? 'Last 7 days' : 'Last 30 days'),
    source: history.source ?? 'unknown',
    state: history.state ?? 'unknown',
    requestedDays,
    observedDays,
    summary,
    daily,
    retained,
    rivals,
    pageUrl: location.href,
    coverage: history.coverage,
  }
}

function fullSummary(context: ReportContext): string {
  const newest = context.retained[0]
  const rivalLines = context.rivals.length
    ? context.rivals.map((entry) => `- ${text(entry.day) || 'Unknown day'} · ${rivalLabel(entry, context.channelId)} · score ${numberOrDash(entry.score)} · viewer-minute gap ${numberOrDash(entry.viewerMinutesGap)}`).join('\n')
    : '- No retained daily rivalry candidate is available for this channel and period.'
  return [
    `ViewLoom · ${context.providerName} retained channel footprint`,
    `Channel: ${context.displayName} (${context.channelId || 'unselected'})`,
    `Period: ${context.periodLabel} (${context.period})`,
    `Source / state: ${context.source} / ${context.state}`,
    `Observed scope: ${context.observedDays} / ${context.requestedDays} days`,
    `Retained daily Top 10 appearances: ${context.retained.length}`,
    '',
    `Viewer-minutes: ${numberOrDash(context.summary?.viewerMinutes)}`,
    `Peak viewers: ${numberOrDash(context.summary?.peakViewers)}`,
    `Average viewers: ${numberOrDash(context.summary?.avgViewers)}`,
    `Observed time: ${durationOrDash(context.summary?.observedMinutes)}`,
    `Newest retained day: ${text(newest?.day.day) || '—'}`,
    '',
    'Rivalry candidates (daily aggregates):',
    rivalLines,
    '',
    'Limits:',
    ...limitations.map((value) => `- ${value}`),
    '',
    `Page: ${context.pageUrl}`,
  ].join('\n')
}

function shortPost(context: ReportContext): string {
  const viewerMinutes = numberOrDash(context.summary?.viewerMinutes)
  const peak = numberOrDash(context.summary?.peakViewers)
  return `ViewLoom · ${context.providerName} retained footprint for ${context.displayName} (${context.periodLabel}): ${context.retained.length} retained daily Top 10 appearances, ${viewerMinutes} viewer-minutes, retained peak ${peak} viewers. Data: ${context.source}/${context.state}. Retained data only; absence does not confirm offline. ${context.pageUrl}`
}

function csvOutput(context: ReportContext): string {
  const header = [
    'provider',
    'channel_id',
    'display_name',
    'period',
    'day',
    'retained_top10',
    'coverage_state',
    'viewer_minutes',
    'peak_viewers',
    'avg_viewers',
    'observed_minutes',
    'rank_by_viewer_minutes',
  ]
  const rows = context.daily.map(({ day, streamer }) => [
    context.provider,
    context.channelId,
    context.displayName,
    context.period,
    text(day.day),
    String(Boolean(streamer)),
    day.coverageState ?? '',
    csvNumber(streamer?.viewerMinutes),
    csvNumber(streamer?.peakViewers),
    csvNumber(streamer?.avgViewers),
    csvNumber(streamer?.observedMinutes),
    csvNumber(streamer?.rankByViewerMinutes),
  ])
  return [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n') + '\r\n'
}

function jsonOutput(context: ReportContext): Record<string, unknown> {
  const newest = context.retained[0]
  return {
    schema: 'viewloom-channel-v1',
    provider: context.provider,
    channel: {
      id: context.channelId,
      display_name: context.displayName,
      page_url: context.pageUrl,
    },
    period: {
      key: context.period,
      label: context.periodLabel,
      requested_days: context.requestedDays,
    },
    source: context.source,
    state: context.state,
    coverage: context.coverage ?? null,
    summary: {
      viewer_minutes: nullableNumber(context.summary?.viewerMinutes),
      peak_viewers: nullableNumber(context.summary?.peakViewers),
      avg_viewers: nullableNumber(context.summary?.avgViewers),
      observed_minutes: nullableNumber(context.summary?.observedMinutes),
      retained_top10_days: context.retained.length,
      observed_days: context.observedDays,
      requested_days: context.requestedDays,
      newest_retained_day: text(newest?.day.day) || null,
    },
    daily: context.daily.map(({ day, streamer }) => ({
      day: text(day.day) || null,
      retained_top10: Boolean(streamer),
      coverage_state: day.coverageState ?? null,
      viewer_minutes: nullableNumber(streamer?.viewerMinutes),
      peak_viewers: nullableNumber(streamer?.peakViewers),
      avg_viewers: nullableNumber(streamer?.avgViewers),
      observed_minutes: nullableNumber(streamer?.observedMinutes),
      rank_by_viewer_minutes: nullableNumber(streamer?.rankByViewerMinutes),
    })),
    rivalry_candidates: context.rivals.map((entry) => ({
      day: text(entry.day) || null,
      opponent_id: opponentId(entry, context.channelId) || null,
      opponent_name: opponentName(entry, context.channelId) || null,
      score: nullableNumber(entry.score),
      viewer_minutes_gap: nullableNumber(entry.viewerMinutesGap),
    })),
    limitations,
  }
}

function compareBattles(left: ChannelBattleEntry, right: ChannelBattleEntry): number {
  return number(right.score, Number.NEGATIVE_INFINITY) - number(left.score, Number.NEGATIVE_INFINITY)
    || text(right.day).localeCompare(text(left.day), 'en')
    || Math.abs(number(left.viewerMinutesGap, Number.POSITIVE_INFINITY)) - Math.abs(number(right.viewerMinutesGap, Number.POSITIVE_INFINITY))
    || pairKey(left).localeCompare(pairKey(right), 'en')
}

function pairKey(entry: ChannelBattleEntry): string {
  return [normalized(entry.streamerAId), normalized(entry.streamerBId)].sort().join(':')
}

function rivalLabel(entry: ChannelBattleEntry, channelId: string): string {
  return `${opponentName(entry, channelId) || 'Unknown rival'} vs ${contextName(entry, channelId)}`
}

function contextName(entry: ChannelBattleEntry, channelId: string): string {
  return normalized(entry.streamerAId) === channelId ? text(entry.streamerAName) : text(entry.streamerBName)
}

function opponentId(entry: ChannelBattleEntry, channelId: string): string {
  return normalized(entry.streamerAId) === channelId ? normalized(entry.streamerBId) : normalized(entry.streamerAId)
}

function opponentName(entry: ChannelBattleEntry, channelId: string): string {
  return normalized(entry.streamerAId) === channelId ? text(entry.streamerBName) : text(entry.streamerAName)
}

function findStreamer(rows: ChannelStreamer[], channelId: string): ChannelStreamer | undefined {
  return rows.find((row) => normalized(row.streamerId) === channelId)
}

function filename(context: ReportContext, extension: 'csv' | 'json'): string {
  return `viewloom-${context.provider}-channel-${context.channelId || 'unselected'}-${context.period}.${extension}`
}

function downloadFile(name: string, content: string, type: string): void {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = name
  anchor.hidden = true
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}

async function writeClipboard(textValue: string): Promise<void> {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(textValue)
  const textarea = document.createElement('textarea')
  textarea.value = textValue
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.append(textarea)
  textarea.select()
  const copied = document.execCommand('copy')
  textarea.remove()
  if (!copied) throw new Error('Clipboard access is unavailable.')
}

function setFeedback(message: string, stateValue: 'ready' | 'success' | 'error'): void {
  const node = document.querySelector<HTMLElement>('[data-channel-report-feedback]')
  if (!node) return
  node.textContent = message
  node.dataset.state = stateValue
}

function requestUrl(input: RequestInfo | URL): URL | null {
  try {
    if (input instanceof URL) return input
    if (typeof input === 'string') return new URL(input, location.href)
    return new URL(input.url, location.href)
  } catch {
    return null
  }
}

function normalizeId(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '')
}

function normalized(value: unknown): string {
  return typeof value === 'string' ? normalizeId(value) : ''
}

function safeRequestedName(value: string | null): string | undefined {
  const result = value?.trim()
  return result ? result.slice(0, 160) : undefined
}

function text(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function number(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function nullableNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function csvNumber(value: unknown): string {
  return typeof value === 'number' && Number.isFinite(value) ? String(value) : ''
}

function numberOrDash(value: unknown): string {
  return typeof value === 'number' && Number.isFinite(value) ? new Intl.NumberFormat('en-US').format(value) : '—'
}

function durationOrDash(value: unknown): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '—'
  const hours = Math.floor(value / 60)
  const minutes = Math.round(value % 60)
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
}

function csvCell(value: unknown): string {
  const result = String(value ?? '')
  return /[",\r\n]/.test(result) ? `"${result.replace(/"/g, '""')}"` : result
}
