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
  setText(`portal-${platform}-updated`, payload.updatedAt ? ago(payload.updatedAt) : 'Unavailable')
  setText(`portal-${platform}-observed`, number(payload.now.observedStreams))
  setText(`portal-${platform}-viewers`, compact(payload.now.observedViewers))
  setText(
    `portal-${platform}-largest`,
    payload.now.largestStream
      ? `${payload.now.largestStream.displayName} · ${compact(payload.now.largestStream.viewers)}`
      : visibleState === 'empty'
        ? 'No observed stream'
        : 'Unavailable',
  )
  setText(`portal-${platform}-note`, coverageNote(payload))
  renderHeaderPill(platform, visibleState)
}

function renderProviderError(platform: Platform, message: string): void {
  const card = document.querySelector<HTMLElement>(`[data-portal-provider="${platform}"]`)
  if (card) card.dataset.state = 'error'

  setText(`portal-${platform}-status`, 'Unavailable')
  setText(`portal-${platform}-updated`, 'Update failed')
  setText(`portal-${platform}-observed`, 'Unavailable')
  setText(`portal-${platform}-viewers`, 'Unavailable')
  setText(`portal-${platform}-largest`, 'Unavailable')
  setText(`portal-${platform}-note`, `${platformLabel(platform)} data could not be loaded. ${message}`)
  renderHeaderPill(platform, 'error')
}

function presentationState(payload: HomePayload): HomeState {
  if (payload.platform === 'twitch' && payload.state === 'partial' && payload.source === 'real') return 'fresh'
  return payload.state
}

function coverageNote(payload: HomePayload): string {
  if (payload.state === 'error') return `${platformLabel(payload.platform)} data is unavailable. Open Status for details.`
  if (payload.platform === 'twitch') return payload.coverage.note || 'Top 300 observed window. More live streams may exist beyond it.'
  return payload.coverage.note || 'Top 100 observed candidates. Not provider-wide directory coverage.'
}

function renderHeaderPill(platform: Platform, state: HomeState): void {
  const pill = document.getElementById(`portal-health-${platform}`)
  if (!pill) return
  pill.dataset.state = state
  const label = pill.querySelector('span')
  if (label) label.textContent = `${platformLabel(platform)}: ${stateLabel(state)}`
}

function stateLabel(state: HomeState): string {
  const labels: Record<HomeState, string> = {
    fresh: 'Fresh',
    partial: 'Limited',
    stale: 'Delayed',
    empty: 'No data',
    demo: 'Demo',
    error: 'Unavailable',
  }
  return labels[state]
}

function setText(id: string, value: string): void {
  const node = document.getElementById(id)
  if (node) node.textContent = value
}

function platformLabel(platform: Platform): string {
  return platform === 'twitch' ? 'Twitch' : 'Kick'
}

function number(value: number): string {
  return Number.isFinite(value) ? new Intl.NumberFormat('en-US').format(Math.max(0, value)) : 'Unavailable'
}

function compact(value: number): string {
  return Number.isFinite(value)
    ? new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(Math.max(0, value))
    : 'Unavailable'
}

function ago(value: string): string {
  const milliseconds = Date.now() - Date.parse(value)
  if (!Number.isFinite(milliseconds)) return 'Unavailable'
  const minutes = Math.max(0, Math.floor(milliseconds / 60000))
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}
