import { formatCompactNumber, formatInteger } from './i18n/format'
import { localeFromPathname } from './i18n/locale'
import { portalText } from './i18n/portal'
import { localizeAvailableHref } from './i18n/route'

type Platform = 'twitch' | 'kick'
type HomeState = 'fresh' | 'partial' | 'stale' | 'empty' | 'demo' | 'error'

type HomePayload = {
  version: 'viewloom-home-v1'
  platform: Platform
  source: 'real' | 'demo'
  sourceMode: string
  state: HomeState
  updatedAt: string | null
  coverage: {
    label: string
    note: string
  }
  now: {
    observedStreams: number
    observedViewers: number
    largestStream: {
      displayName: string
      viewers: number
    } | null
  }
  error?: {
    message: string
  }
}

const locale = localeFromPathname(window.location.pathname)
const t = (key: Parameters<typeof portalText>[1], params: Record<string, string | number> = {}) => portalText(locale, key, params)
const settled = new Set<Platform>()

void loadProvider('twitch')
void loadProvider('kick')

async function loadProvider(platform: Platform): Promise<void> {
  try {
    const response = await fetch(`/api/${platform}-home`, { cache: 'no-store' })
    const payload = await response.json() as HomePayload
    validatePayload(payload, platform)
    renderProvider(payload)
  } catch (error) {
    renderProviderError(platform, error instanceof Error ? error.message : 'Provider data could not be loaded.')
  } finally {
    settled.add(platform)
    if (settled.size === 2) document.body.dataset.portalState = 'ready'
  }
}

function validatePayload(payload: HomePayload, platform: Platform): void {
  if (payload?.version !== 'viewloom-home-v1') throw new Error('Unexpected provider Home data version.')
  if (payload.platform !== platform) throw new Error('Provider Home data did not match the requested platform.')
}

function renderProvider(payload: HomePayload): void {
  const platform = payload.platform
  const visibleState = presentationState(payload)
  const card = document.querySelector<HTMLElement>(`[data-portal-provider="${platform}"]`)
  if (card) card.dataset.state = visibleState

  setText(`portal-${platform}-status`, stateLabel(visibleState))
  setText(`portal-${platform}-updated`, payload.updatedAt ? ago(payload.updatedAt) : t('provider.unavailable'))
  setText(`portal-${platform}-observed`, number(payload.now.observedStreams))
  setText(`portal-${platform}-viewers`, compact(payload.now.observedViewers))
  setText(
    `portal-${platform}-largest`,
    payload.now.largestStream
      ? `${payload.now.largestStream.displayName} · ${compact(payload.now.largestStream.viewers)}`
      : visibleState === 'empty'
        ? t('provider.noObservedStream')
        : t('provider.unavailable'),
  )
  setText(`portal-${platform}-note`, coverageNote(payload))
  renderProviderNext(platform, visibleState, payload.now.largestStream !== null)
  renderHeaderPill(platform, visibleState, payload.updatedAt)
}

function renderProviderError(platform: Platform, message: string): void {
  const card = document.querySelector<HTMLElement>(`[data-portal-provider="${platform}"]`)
  if (card) card.dataset.state = 'error'

  setText(`portal-${platform}-status`, t('provider.unavailable'))
  setText(`portal-${platform}-updated`, t('provider.updateFailed'))
  setText(`portal-${platform}-observed`, t('provider.unavailable'))
  setText(`portal-${platform}-viewers`, t('provider.unavailable'))
  setText(`portal-${platform}-largest`, t('provider.unavailable'))
  setText(`portal-${platform}-note`, t('provider.loadError', { name: platformLabel(platform), message }))
  renderProviderNext(platform, 'error', false)
  renderHeaderPill(platform, 'error', null)
}

function presentationState(payload: HomePayload): HomeState {
  if (payload.platform === 'twitch' && payload.state === 'partial' && payload.source === 'real') return 'fresh'
  return payload.state
}

function coverageNote(payload: HomePayload): string {
  if (payload.state === 'error') return t('coverage.error', { name: platformLabel(payload.platform) })
  if (payload.platform === 'twitch') {
    if (locale === 'en' && payload.coverage.note) return payload.coverage.note
    return t('coverage.twitchFallback')
  }
  if (locale === 'en' && payload.coverage.note) return payload.coverage.note
  return t('coverage.kickFallback')
}

function renderProviderNext(platform: Platform, state: HomeState, hasLargest: boolean): void {
  const link = document.getElementById(`portal-${platform}-next`) as HTMLAnchorElement | null
  if (!link) return

  if (state === 'error' || state === 'demo' || state === 'empty' || !hasLargest) {
    link.hidden = true
    return
  }

  link.hidden = false
  link.href = localizeAvailableHref(`/${platform}/heatmap/`, locale)
  link.innerHTML = `${t('next.heatmap')} <span aria-hidden="true">→</span>`
}

function renderHeaderPill(platform: Platform, state: HomeState, updatedAt: string | null): void {
  const pill = document.getElementById(`portal-health-${platform}`)
  if (!pill) return
  pill.dataset.state = state
  const label = pill.querySelector('span')
  if (!label) return

  const age = updatedAt ? shortAge(updatedAt) : null
  label.textContent = age
    ? `${platformLabel(platform)} · ${stateLabel(state)} · ${age}`
    : `${platformLabel(platform)} · ${stateLabel(state)}`
}

function stateLabel(state: HomeState): string {
  return t(`state.${state}` as Parameters<typeof portalText>[1])
}

function setText(id: string, value: string): void {
  const node = document.getElementById(id)
  if (node) node.textContent = value
}

function platformLabel(platform: Platform): string {
  return platform === 'twitch' ? 'Twitch' : 'Kick'
}

function number(value: number): string {
  return Number.isFinite(value) ? formatInteger(Math.max(0, value), locale) : t('provider.unavailable')
}

function compact(value: number): string {
  return Number.isFinite(value) ? formatCompactNumber(Math.max(0, value), locale) : t('provider.unavailable')
}

function ago(value: string): string {
  const milliseconds = Date.now() - Date.parse(value)
  if (!Number.isFinite(milliseconds)) return t('provider.unavailable')
  const minutes = Math.max(0, Math.floor(milliseconds / 60000))
  if (minutes < 1) return t('time.justNow')
  if (minutes < 60) return t('time.minutesAgo', { value: minutes })
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return t('time.hoursAgo', { value: hours })
  return t('time.daysAgo', { value: Math.floor(hours / 24) })
}

function shortAge(value: string): string | null {
  const milliseconds = Date.now() - Date.parse(value)
  if (!Number.isFinite(milliseconds)) return null
  const minutes = Math.max(0, Math.floor(milliseconds / 60000))
  if (minutes < 1) return t('time.nowShort')
  if (minutes < 60) return t('time.minutesShort', { value: minutes })
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return t('time.hoursShort', { value: hours })
  return t('time.daysShort', { value: Math.floor(hours / 24) })
}
