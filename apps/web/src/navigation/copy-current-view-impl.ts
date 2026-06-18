import { buildDeepLink } from './deep-link-contract'
import { VIEWLOOM_ORIGIN } from './url-contract'

type SupportedFeature = 'dayFlow' | 'battleLines' | 'history'

type ViewContext = {
  feature: SupportedFeature
  pathname: string
}

const HISTORY_ORDER = ['period', 'from', 'to', 'metric', 'sort', 'limit', 'day'] as const
const HISTORY_SORTS = new Set(['viewer_minutes', 'peak_viewers', 'avg_viewers', 'observed_minutes', 'rising'])

export function buildCurrentViewUrl(input: URL, now = new Date()): string | null {
  const context = viewContext(input.pathname)
  if (!context) return null

  if (context.feature === 'dayFlow') {
    const params = new URLSearchParams(input.search)
    freezeSelectedInstant(params, 'rangeMode')
    freezeRelativeDay(params, 'rangeMode', now)
    if (params.get('rangeMode') === 'date') params.set('auto', 'off')
    return `${VIEWLOOM_ORIGIN}${buildDeepLink(context.pathname, 'dayFlow', params)}`
  }

  if (context.feature === 'battleLines') {
    const params = new URLSearchParams(input.search)
    freezeSelectedInstant(params, 'range')
    freezeRelativeDay(params, 'range', now)
    params.delete('point')
    return `${VIEWLOOM_ORIGIN}${buildDeepLink(context.pathname, 'battleLines', params)}`
  }

  const params = normalizeHistoryParams(input.searchParams)
  return `${VIEWLOOM_ORIGIN}${normalizePathname(context.pathname)}${params.size ? `?${params.toString()}` : ''}`
}

export function installCopyCurrentView(): void {
  if (typeof document === 'undefined' || typeof window === 'undefined') return
  if (document.querySelector('[data-copy-current-view]')) return

  const context = viewContext(window.location.pathname)
  if (!context) return
  const mount = copyMount(context.feature)
  if (!mount) return

  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'button button--paper view-copy-button'
  button.dataset.copyCurrentView = context.feature
  button.textContent = 'Copy current view'
  button.setAttribute('aria-describedby', 'view-copy-feedback')

  const feedback = document.createElement('span')
  feedback.id = 'view-copy-feedback'
  feedback.className = 'view-copy-feedback'
  feedback.setAttribute('aria-live', 'polite')

  button.addEventListener('click', async () => {
    const shareUrl = buildCurrentViewUrl(new URL(window.location.href))
    if (!shareUrl) {
      showFeedback(button, feedback, 'Link unavailable')
      return
    }

    try {
      await copyText(shareUrl)
      showFeedback(button, feedback, 'Copied')
    } catch {
      showFeedback(button, feedback, 'Copy failed')
    }
  })

  if (context.feature === 'history') {
    const wrapper = document.createElement('div')
    wrapper.className = 'history-control-section view-copy-control'
    const label = document.createElement('span')
    label.className = 'toolbar-label'
    label.textContent = 'Share'
    wrapper.append(label, button, feedback)
    mount.append(wrapper)
  } else {
    mount.append(button, feedback)
  }
}

function viewContext(pathname: string): ViewContext | null {
  const normalized = normalizePathname(pathname)
  if (/^\/(?:twitch|kick)\/day-flow\/$/.test(normalized)) return { feature: 'dayFlow', pathname: normalized }
  if (/^\/(?:twitch|kick)\/battle-lines\/$/.test(normalized)) return { feature: 'battleLines', pathname: normalized }
  if (/^\/(?:twitch|kick)\/history\/$/.test(normalized)) return { feature: 'history', pathname: normalized }
  return null
}

function copyMount(feature: SupportedFeature): HTMLElement | null {
  if (feature === 'dayFlow') return document.querySelector<HTMLElement>('.dayflow-toolbar')
  if (feature === 'battleLines') return document.querySelector<HTMLElement>('.battle-actions')
  return document.querySelector<HTMLElement>('.history-controls')
}

function freezeSelectedInstant(params: URLSearchParams, rangeKey: 'rangeMode' | 'range'): void {
  const time = params.get('time')
  if (!time) return
  const instant = new Date(time)
  if (Number.isNaN(instant.getTime())) return
  params.set(rangeKey, 'date')
  params.set('date', instant.toISOString().slice(0, 10))
  params.set('time', instant.toISOString())
}

function freezeRelativeDay(params: URLSearchParams, rangeKey: 'rangeMode' | 'range', now: Date): void {
  if (params.get(rangeKey) !== 'yesterday') return
  const yesterday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) - 86_400_000)
  params.set(rangeKey, 'date')
  params.set('date', yesterday.toISOString().slice(0, 10))
}

function normalizeHistoryParams(source: URLSearchParams): URLSearchParams {
  const output = new URLSearchParams()
  const from = validDate(source.get('from'))
  const to = validDate(source.get('to'))

  if (from && to && from <= to) {
    output.set('from', from)
    output.set('to', to)
  } else {
    output.set('period', source.get('period') === '7d' ? '7d' : '30d')
  }

  output.set('metric', source.get('metric') === 'peak_viewers' ? 'peak_viewers' : 'viewer_minutes')
  const sort = source.get('sort')
  output.set('sort', sort && HISTORY_SORTS.has(sort) ? sort : 'viewer_minutes')
  const limit = source.get('limit')
  output.set('limit', limit === '10' || limit === '50' ? limit : '20')
  const day = validDate(source.get('day'))
  if (day) output.set('day', day)

  return reorder(output, HISTORY_ORDER)
}

function reorder(params: URLSearchParams, order: readonly string[]): URLSearchParams {
  const output = new URLSearchParams()
  for (const key of order) {
    const value = params.get(key)
    if (value !== null) output.set(key, value)
  }
  return output
}

async function copyText(value: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value)
    return
  }

  const textarea = document.createElement('textarea')
  textarea.value = value
  textarea.readOnly = true
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.append(textarea)
  textarea.select()
  const copied = document.execCommand('copy')
  textarea.remove()
  if (!copied) throw new Error('copy command failed')
}

function showFeedback(button: HTMLButtonElement, feedback: HTMLElement, text: string): void {
  button.textContent = text === 'Copied' ? 'Copied' : 'Copy current view'
  feedback.textContent = text === 'Copied' ? 'Current analysis link copied.' : text
  window.setTimeout(() => {
    button.textContent = 'Copy current view'
    feedback.textContent = ''
  }, 1800)
}

function normalizePathname(pathname: string): string {
  const leading = pathname.startsWith('/') ? pathname : `/${pathname}`
  const collapsed = leading.replace(/\/{2,}/g, '/')
  return collapsed === '/' || collapsed.endsWith('/') ? collapsed : `${collapsed}/`
}

function validDate(value: string | null): string | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const parsed = new Date(`${value}T00:00:00.000Z`)
  return Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value ? null : value
}

installCopyCurrentView()
