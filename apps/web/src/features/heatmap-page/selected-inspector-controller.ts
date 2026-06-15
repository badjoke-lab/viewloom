import {
  ensureSelectedInspectorShell,
  renderSelectedInspectorPending,
  renderSelectedInspectorUnavailable,
  renderSelectedStreamInspector,
  type SelectedInspectorProvider,
} from '../twitch-heatmap/selected-inspector'
import type {
  HeatmapItem,
  TwitchHeatmapApiResponse,
} from '../twitch-heatmap/model'
import type { HeatmapProviderKey } from './data-state-core.mjs'

type ResponseDetail = {
  provider?: HeatmapProviderKey
  raw?: unknown
}

type NormalizedSelectionData = {
  provider: SelectedInspectorProvider
  response: TwitchHeatmapApiResponse
  items: HeatmapItem[]
}

let currentData: NormalizedSelectionData | null = null
let rendering = false
let queued = false
let lastRenderKey = ''

export function installHeatmapSelectedInspector(providerKey: HeatmapProviderKey): () => void {
  ensureSelectedInspectorShell()
  renderSelectedInspectorPending()

  const inspector = document.querySelector<HTMLElement>('#heatmap-inspector')
  const observer = inspector ? new MutationObserver(scheduleRenderFromDom) : null
  observer?.observe(inspector!, {
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true,
    attributeFilter: ['href'],
  })

  const onRequestStart = (event: Event): void => {
    const detail = (event as CustomEvent<{ provider?: HeatmapProviderKey }>).detail
    if (detail?.provider && detail.provider !== providerKey) return
    currentData = null
    lastRenderKey = ''
    rendering = true
    renderSelectedInspectorPending()
    rendering = false
  }

  const onResponse = (event: Event): void => {
    const detail = (event as CustomEvent<ResponseDetail>).detail
    const provider = detail?.provider ?? providerKey
    if (provider !== providerKey) return
    const normalized = normalizeSelectionData(detail?.raw, provider)
    if (!normalized || normalized.items.length === 0 || !normalized.response.latest) {
      currentData = null
      lastRenderKey = ''
      rendering = true
      renderSelectedInspectorUnavailable('No selectable stream', errorMessage(detail?.raw, provider))
      rendering = false
      return
    }
    currentData = normalized
    lastRenderKey = ''
    scheduleRenderFromDom()
  }

  window.addEventListener('viewloom:heatmap-request-start', onRequestStart)
  window.addEventListener('viewloom:heatmap-response', onResponse)

  return () => {
    observer?.disconnect()
    window.removeEventListener('viewloom:heatmap-request-start', onRequestStart)
    window.removeEventListener('viewloom:heatmap-response', onResponse)
    currentData = null
    queued = false
    lastRenderKey = ''
  }
}

function scheduleRenderFromDom(): void {
  if (rendering || queued) return
  queued = true
  window.setTimeout(() => {
    queued = false
    renderFromDom()
  }, 0)
}

function renderFromDom(): void {
  if (rendering || !currentData?.response.latest) return
  ensureSelectedInspectorShell()
  const selectedLogin = selectedLoginFromDom() ?? currentData.items[0]?.channelLogin
  if (!selectedLogin) return
  const item = currentData.items.find((entry) => entry.channelLogin === selectedLogin) ?? currentData.items[0]
  if (!item) return
  const key = `${currentData.provider.key}:${currentData.response.latest.bucket_minute}:${item.channelLogin}`
  if (key === lastRenderKey) return

  lastRenderKey = key
  rendering = true
  renderSelectedStreamInspector({
    item,
    items: currentData.items,
    latest: currentData.response.latest,
    response: currentData.response,
    provider: currentData.provider,
  })
  rendering = false
}

function selectedLoginFromDom(): string | null {
  const link = document.querySelector<HTMLAnchorElement>('#heatmap-detail-link')
  if (!link?.href) return null
  try {
    const url = new URL(link.href, window.location.href)
    const segment = url.pathname.split('/').filter(Boolean).at(-1)
    return segment ? normalizeId(decodeURIComponent(segment)) : null
  } catch {
    return null
  }
}

function normalizeSelectionData(raw: unknown, providerKey: HeatmapProviderKey): NormalizedSelectionData | null {
  const record = asRecord(raw)
  if (!record) return null
  const provider = providerConfig(providerKey)
  const topLevelActivityAvailable = booleanValue(record.activityAvailable)
  const topLevelActivitySampled = booleanValue(record.activitySampled)
  const topLevelActivityReason = stringValue(record.activityUnavailableReason)
  const rawItems = Array.isArray(record.items)
    ? record.items
    : payloadItems(asRecord(record.latest)?.payload_json)
  const items = rawItems
    .map((rawItem) => normalizeItem(rawItem, provider, topLevelActivityAvailable, topLevelActivitySampled, topLevelActivityReason))
    .filter((item): item is HeatmapItem => item !== null)
    .sort((a, b) => b.viewers - a.viewers)

  const latestRecord = asRecord(record.latest)
  const updatedAt = stringValue(latestRecord?.collected_at ?? latestRecord?.bucket_minute ?? record.updatedAt) || new Date().toISOString()
  const totalViewers = numberValue(latestRecord?.total_viewers) || items.reduce((sum, item) => sum + item.viewers, 0)
  const latest = latestRecord || items.length > 0 ? {
    provider: providerKey,
    bucket_minute: stringValue(latestRecord?.bucket_minute) || updatedAt,
    collected_at: updatedAt,
    covered_pages: numberValue(latestRecord?.covered_pages) || numberFromNotes(record.notes, 'covered_pages') || 1,
    has_more: numberValue(latestRecord?.has_more) || numberFromNotes(record.notes, 'has_more'),
    stream_count: numberValue(latestRecord?.stream_count) || items.length,
    total_viewers: totalViewers,
    payload_json: stringValue(latestRecord?.payload_json) || JSON.stringify({ provider: providerKey, bucketMinute: updatedAt, items }),
    source_mode: stringValue(latestRecord?.source_mode) || valueFromNotes(record.notes, 'source_mode') || 'unknown',
  } : null

  const statusRecord = asRecord(record.collectorStatus) ?? asRecord(record.statusRecord) ?? (asRecord(record.status)?.provider ? asRecord(record.status) : null)
  const response: TwitchHeatmapApiResponse = {
    ok: record.ok !== false && stringValue(record.state) !== 'error',
    provider: providerKey,
    latest,
    status: statusRecord ? {
      provider: stringValue(statusRecord.provider) || providerKey,
      status: stringValue(statusRecord.status) || 'unknown',
      last_attempt_at: nullableString(statusRecord.last_attempt_at),
      last_success_at: nullableString(statusRecord.last_success_at),
      last_failure_at: nullableString(statusRecord.last_failure_at),
      last_error: nullableString(statusRecord.last_error),
      latest_bucket_minute: nullableString(statusRecord.latest_bucket_minute),
      latest_collected_at: nullableString(statusRecord.latest_collected_at),
      latest_stream_count: numberValue(statusRecord.latest_stream_count),
      latest_total_viewers: numberValue(statusRecord.latest_total_viewers),
      covered_pages: numberValue(statusRecord.covered_pages),
      has_more: numberValue(statusRecord.has_more),
      updated_at: stringValue(statusRecord.updated_at) || updatedAt,
    } : null,
    items,
    bucketMinutes: nullableNumber(record.bucketMinutes) ?? numberFromNotes(record.notes, 'bucket_minutes') ?? 5,
    expectedBucketMinutes: nullableNumber(record.expectedBucketMinutes) ?? numberFromNotes(record.notes, 'expected_bucket_minutes') ?? 5,
    activityAvailable: topLevelActivityAvailable,
    activitySampled: topLevelActivitySampled,
    activityUnavailableReason: topLevelActivityReason,
  }

  return { provider, response, items }
}

function normalizeItem(raw: unknown, provider: SelectedInspectorProvider, defaultActivityAvailable: boolean, defaultActivitySampled: boolean, defaultActivityReason: string): HeatmapItem | null {
  const record = asRecord(raw)
  if (!record) return null
  const channel = asRecord(record.channel)
  const livestream = asRecord(record.livestream)
  const login = normalizeId(stringValue(
    record.channelLogin
    ?? record.id
    ?? record.login
    ?? record.user_login
    ?? record.slug
    ?? record.username
    ?? record.user_slug
    ?? channel?.slug
    ?? channel?.username
    ?? channel?.name,
  ))
  const displayName = stringValue(record.displayName ?? record.name ?? record.user_name ?? channel?.displayName ?? channel?.name ?? login) || login
  const viewers = numberValue(record.viewers ?? record.viewer_count ?? record.viewerCount ?? livestream?.viewer_count)
  if (!login || viewers <= 0) return null

  return {
    channelLogin: login,
    displayName,
    viewers,
    momentum: signedNumber(record.momentum),
    activity: signedNumber(record.activity),
    title: stringValue(record.title ?? record.streamTitle ?? record.gameName ?? record.session_title ?? record.stream_title ?? livestream?.session_title) || undefined,
    url: stringValue(record.url) || provider.streamUrl(login),
    startedAt: stringValue(record.startedAt ?? record.started_at ?? record.start_time ?? livestream?.created_at) || undefined,
    activityAvailable: optionalBoolean(record.activityAvailable) ?? defaultActivityAvailable,
    activitySampled: optionalBoolean(record.activitySampled) ?? defaultActivitySampled,
    activityUnavailableReason: stringValue(record.activityUnavailableReason) || defaultActivityReason,
  }
}

function providerConfig(provider: HeatmapProviderKey): SelectedInspectorProvider {
  return provider === 'kick'
    ? { key: 'kick', label: 'Kick', streamUrl: (login) => `https://kick.com/${encodeURIComponent(login)}` }
    : { key: 'twitch', label: 'Twitch', streamUrl: (login) => `https://www.twitch.tv/${encodeURIComponent(login)}` }
}

function payloadItems(payloadJson: unknown): unknown[] {
  if (typeof payloadJson !== 'string') return []
  try {
    const payload = asRecord(JSON.parse(payloadJson))
    return Array.isArray(payload?.items) ? payload.items : Array.isArray(payload?.data) ? payload.data : []
  } catch {
    return []
  }
}

function errorMessage(raw: unknown, provider: HeatmapProviderKey): string {
  const record = asRecord(raw)
  const error = asRecord(record?.error)
  return stringValue(error?.message)
    || stringValue(record?.coverageNote)
    || `The latest ${provider === 'kick' ? 'Kick' : 'Twitch'} response contains no selectable stream.`
}

function valueFromNotes(notes: unknown, key: string): string {
  if (!Array.isArray(notes)) return ''
  const prefix = `${key}=`
  const value = notes.find((note) => typeof note === 'string' && note.startsWith(prefix))
  return typeof value === 'string' ? value.slice(prefix.length) : ''
}

function numberFromNotes(notes: unknown, key: string): number {
  return numberValue(valueFromNotes(notes, key))
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null ? value as Record<string, unknown> : null
}

function stringValue(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function nullableString(value: unknown): string | null {
  const text = stringValue(value)
  return text || null
}

function numberValue(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.max(0, Math.round(value))
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/,/g, ''))
    return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : 0
  }
  return 0
}

function signedNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/,/g, ''))
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

function nullableNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) return Number(value)
  return null
}

function booleanValue(value: unknown): boolean {
  return value === true || value === 'true' || value === 1 || value === '1'
}

function optionalBoolean(value: unknown): boolean | undefined {
  if (value === true || value === 'true' || value === 1 || value === '1') return true
  if (value === false || value === 'false' || value === 0 || value === '0') return false
  return undefined
}

function normalizeId(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9_]+/g, '-').replace(/^-+|-+$/g, '')
}
