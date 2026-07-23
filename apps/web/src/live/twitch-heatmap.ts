import {
  buildCategoryPreviewEndpoint,
  categoryPreviewMessage,
  installCategoryPreviewControls,
  readCategoryPreviewState,
  syncCategoryPreviewControls,
} from '../features/twitch-heatmap/category-preview-controls'
import {
  destroyCanvasScene,
  renderCanvasScene,
} from '../features/twitch-heatmap/canvas-scene'
import { escapeHtml } from '../features/twitch-heatmap/format'
import {
  AUTO_REFRESH_MS,
  type HeatmapItem,
  type TwitchHeatmapApiResponse,
  type TwitchHeatmapPayload,
} from '../features/twitch-heatmap/model'

let selectedStreamLogin: string | null = null
let refreshTimer: number | null = null
let visibilityListenerBound = false

type HeatmapProvider = {
  key: 'twitch' | 'kick'
  label: string
  endpoint: string
  storageLabel: string
  streamUrl: (login: string) => string
}

const HEATMAP_RUNTIME_CSS = `
.chart-placeholder--heatmap.heatmap-live-stage {
  min-height: 560px;
  padding: 0;
  background: linear-gradient(180deg, rgba(7, 16, 30, 0.98), rgba(9, 18, 33, 0.92));
}
.heatmap-runtime-state {
  display: grid;
  place-items: center;
  min-height: 560px;
  padding: 28px;
  color: var(--muted);
  text-align: center;
}
.heatmap-runtime-state strong {
  display: block;
  margin-bottom: 8px;
  color: var(--text);
  font-size: 1rem;
}
@media (max-width: 760px) {
  .chart-placeholder--heatmap.heatmap-live-stage,
  .heatmap-runtime-state {
    min-height: 430px;
  }
}
`

export async function hydrateTwitchHeatmap(): Promise<void> {
  const provider = heatmapProvider()
  const categoryPreview = readCategoryPreviewState(provider.key)
  ensureRuntimeStyles()
  ensureHeatmapAutoRefresh()
  installCategoryPreviewControls({
    provider: provider.key,
    state: categoryPreview,
    onChange: () => { void hydrateTwitchHeatmap() },
  })

  const stage = document.querySelector<HTMLElement>('.chart-placeholder--heatmap')
  if (!stage) return

  destroyCanvasScene()
  stage.classList.add('heatmap-live-stage')
  stage.setAttribute('aria-busy', 'true')
  stage.innerHTML = renderRuntimeState('Loading latest snapshot', `Reading the latest stored ${provider.label} Heatmap snapshot.`)

  try {
    const endpoint = buildCategoryPreviewEndpoint(provider.endpoint, provider.key, categoryPreview)
    const response = await fetch(endpoint, {
      headers: { accept: 'application/json' },
      cache: 'no-store',
    })
    if (!response.ok) throw new Error(`API ${response.status}`)

    const data = normalizeHeatmapResponse(await response.json(), provider)
    syncCategoryPreviewControls({
      state: categoryPreview,
      filter: data.categoryFilter,
      availableCategories: data.availableCategories,
    })

    const previewMessage = categoryPreview.enabled ? categoryPreviewMessage(data.categoryFilter) : null
    if (previewMessage) {
      stage.innerHTML = renderRuntimeState(previewMessage.title, previewMessage.body)
      return
    }

    if (!data.latest) {
      stage.innerHTML = renderRuntimeState(`No ${provider.label} snapshot yet`, `${provider.storageLabel} is connected, but no latest snapshot is available.`)
      return
    }
    const latest = data.latest

    const payload = parsePayload(latest.payload_json)
    const responseItems = Array.isArray(data.items) ? data.items : []
    const rawItems = responseItems.length > 0 || categoryPreview.enabled ? responseItems : payload.items
    const items = rawItems
      .map(normalizeHeatmapItem)
      .filter((item): item is HeatmapItem => item !== null)
      .sort((a, b) => b.viewers - a.viewers || a.channelLogin.localeCompare(b.channelLogin))

    if (items.length === 0) {
      const selectedCategory = data.categoryFilter?.selectedCategory ?? categoryPreview.category
      const categoryEmpty = categoryPreview.enabled && data.categoryFilter?.state === 'selected'
      stage.innerHTML = categoryEmpty
        ? renderRuntimeState('No live streams in this category', `The latest real Twitch snapshot has no qualifying live streams for category “${selectedCategory}” inside the selected Top ${categoryPreview.top} preview.`)
        : renderRuntimeState('No live records in this snapshot', 'The data path responded successfully, but the latest stored snapshot contains no valid live stream records.')
      return
    }

    if (selectedStreamLogin && !items.some((item) => item.channelLogin === selectedStreamLogin)) {
      selectedStreamLogin = null
    }

    renderCanvasScene({
      stage,
      items,
      latest,
      selectedStreamLogin,
      onSelect: (item) => {
        selectedStreamLogin = item.channelLogin
        syncSelectedStreamBridge(item, latest, provider)
      },
    })

    const initial = items.find((item) => item.channelLogin === selectedStreamLogin) ?? items[0]
    if (initial) {
      selectedStreamLogin = initial.channelLogin
      syncSelectedStreamBridge(initial, latest, provider)
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    stage.innerHTML = renderRuntimeState(`Failed to load ${provider.label} Heatmap`, message)
  } finally {
    stage.removeAttribute('aria-busy')
  }
}

function heatmapProvider(): HeatmapProvider {
  const isKick = document.body.dataset.page === 'kick-heatmap'
  return isKick
    ? {
        key: 'kick',
        label: 'Kick',
        endpoint: '/api/kick-heatmap',
        storageLabel: 'DB_KICK_HOT / vl_kick_hot',
        streamUrl: (login) => `https://kick.com/${encodeURIComponent(login)}`,
      }
    : {
        key: 'twitch',
        label: 'Twitch',
        endpoint: '/api/twitch-heatmap',
        storageLabel: 'DB_TWITCH_HOT',
        streamUrl: (login) => `https://www.twitch.tv/${encodeURIComponent(login)}`,
      }
}

function normalizeHeatmapResponse(raw: unknown, provider: HeatmapProvider): TwitchHeatmapApiResponse {
  const record = isRecord(raw) ? raw : {}
  if (isRecord(record.latest) || record.latest === null) return record as TwitchHeatmapApiResponse

  const items = Array.isArray(record.items)
    ? record.items.map(normalizeHeatmapItem).filter((item): item is HeatmapItem => item !== null)
    : []
  const updatedAt = stringValue(record.updatedAt ?? record.updated_at) || new Date().toISOString()
  const totalViewers = items.reduce((sum, item) => sum + item.viewers, 0)
  const notes = Array.isArray(record.notes) ? record.notes.map(String) : []

  return {
    ok: record.state !== 'error',
    provider: provider.key,
    state: stringValue(record.state),
    latest: items.length > 0 || record.state !== 'not_ready'
      ? {
          provider: provider.key,
          bucket_minute: noteValue(notes, 'bucket_minute') || updatedAt,
          collected_at: updatedAt,
          covered_pages: numericValue(record.coveredPages) || numericNoteValue(notes, 'covered_pages') || 1,
          has_more: numericValue(record.hasMore) || numericNoteValue(notes, 'has_more'),
          stream_count: items.length,
          total_viewers: numericValue(record.totalViewers) || totalViewers,
          payload_json: JSON.stringify({ provider: provider.key, bucketMinute: updatedAt, items }),
          source_mode: noteValue(notes, 'source_mode') || stringValue(record.sourceMode) || 'unknown',
        }
      : null,
    status: null,
    items,
  }
}

function parsePayload(payloadJson: string): TwitchHeatmapPayload {
  try {
    const parsed = JSON.parse(payloadJson) as TwitchHeatmapPayload
    return { ...parsed, items: Array.isArray(parsed.items) ? parsed.items : [] }
  } catch {
    return { provider: heatmapProvider().key, bucketMinute: new Date().toISOString(), items: [] }
  }
}

function normalizeHeatmapItem(raw: unknown): HeatmapItem | null {
  if (!isRecord(raw)) return null
  const login = normalizeLogin(stringValue(raw.channelLogin ?? raw.id ?? raw.login ?? raw.slug ?? raw.username ?? raw.user_login))
  const displayName = stringValue(raw.displayName ?? raw.name ?? raw.user_name ?? raw.username ?? login) || login
  const viewers = numericValue(raw.viewers ?? raw.viewer_count ?? raw.viewerCount)
  if (!login || viewers <= 0) return null

  return {
    channelLogin: login,
    displayName,
    viewers,
    momentum: signedNumericValue(raw.momentum),
    activity: signedNumericValue(raw.activity),
    title: stringValue(raw.title ?? raw.streamTitle ?? raw.gameName) || undefined,
    url: stringValue(raw.url) || undefined,
    startedAt: stringValue(raw.startedAt ?? raw.started_at ?? raw.start_time) || undefined,
    activityAvailable: optionalBoolean(raw.activityAvailable),
    activitySampled: optionalBoolean(raw.activitySampled),
    activityUnavailableReason: stringValue(raw.activityUnavailableReason) || undefined,
    categoryId: stringValue(raw.categoryId) || null,
    categoryName: stringValue(raw.categoryName) || null,
  }
}

function syncSelectedStreamBridge(
  item: HeatmapItem,
  latest: NonNullable<TwitchHeatmapApiResponse['latest']>,
  provider: HeatmapProvider,
): void {
  const share = latest.total_viewers > 0 ? item.viewers / latest.total_viewers : 0
  setText('#heatmap-detail-title', item.displayName)
  setText('#heatmap-detail-body', item.title || `${item.channelLogin} is selected in the latest observed snapshot.`)
  setText('#heatmap-detail-viewers', item.viewers.toLocaleString())
  setText('#heatmap-detail-share', `${(share * 100).toFixed(2)}%`)
  setText('#heatmap-detail-momentum', formatSignedPercent(item.momentum))
  setText('#heatmap-detail-activity', item.activityAvailable === false ? 'Unavailable' : formatPercent(item.activity))

  const link = document.querySelector<HTMLAnchorElement>('#heatmap-detail-link')
  if (link) {
    link.href = item.url || provider.streamUrl(item.channelLogin)
    link.textContent = `Open ${item.displayName}`
  }
}

function ensureHeatmapAutoRefresh(): void {
  if (refreshTimer !== null) window.clearInterval(refreshTimer)
  refreshTimer = window.setInterval(() => {
    if (document.visibilityState === 'visible') void hydrateTwitchHeatmap()
  }, AUTO_REFRESH_MS)

  if (visibilityListenerBound) return
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void hydrateTwitchHeatmap()
  })
  visibilityListenerBound = true
}

function renderRuntimeState(title: string, body: string): string {
  return `<div class="heatmap-runtime-state" role="status"><div><strong>${escapeHtml(title)}</strong><span>${escapeHtml(body)}</span></div></div>`
}

function ensureRuntimeStyles(): void {
  if (document.getElementById('viewloom-heatmap-runtime-style')) return
  const style = document.createElement('style')
  style.id = 'viewloom-heatmap-runtime-style'
  style.textContent = HEATMAP_RUNTIME_CSS
  document.head.appendChild(style)
}

function formatSignedPercent(value: number): string {
  const safe = Number.isFinite(value) ? value : 0
  return `${safe > 0 ? '+' : ''}${(safe * 100).toFixed(1)}%`
}

function formatPercent(value: number): string {
  const safe = Number.isFinite(value) ? Math.max(0, value) : 0
  return `${(safe * 100).toFixed(1)}%`
}

function setText(selector: string, value: string): void {
  const element = document.querySelector<HTMLElement>(selector)
  if (element) element.textContent = value
}

function noteValue(notes: string[], key: string): string {
  const prefix = `${key}=`
  return notes.find((note) => note.startsWith(prefix))?.slice(prefix.length) ?? ''
}

function numericNoteValue(notes: string[], key: string): number {
  return numericValue(noteValue(notes, key))
}

function normalizeLogin(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9_]+/g, '-').replace(/^-+|-+$/g, '')
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function stringValue(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function numericValue(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.max(0, Math.round(value))
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value.replace(/,/g, ''))
    return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : 0
  }
  return 0
}

function signedNumericValue(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value.replace(/,/g, ''))
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

function optionalBoolean(value: unknown): boolean | undefined {
  if (value === true || value === 'true' || value === 1 || value === '1') return true
  if (value === false || value === 'false' || value === 0 || value === '0') return false
  return undefined
}