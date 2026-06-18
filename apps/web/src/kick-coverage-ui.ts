import {
  providerCoverageNote,
  providerCoverageSource,
  providerCoverageSummary,
  type ProviderCoveragePayload,
} from './provider-coverage'

const installedKey = '__viewloomKickCoverageUiInstalled'
const targetEndpoint = endpointForPath(window.location.pathname)

if (document.body.dataset.provider === 'kick' && targetEndpoint && !(window as unknown as Record<string, unknown>)[installedKey]) {
  ;(window as unknown as Record<string, unknown>)[installedKey] = true
  install(targetEndpoint)
}

function install(endpoint: string): void {
  const originalFetch = window.fetch.bind(window)
  let payload: ProviderCoveragePayload | null = null
  let queued = false

  window.fetch = (async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const response = await originalFetch(input, init)
    if (requestPath(input) === endpoint) {
      void response.clone().json().then((raw: unknown): void => {
        payload = isRecord(raw) ? raw as ProviderCoveragePayload : null
        queueApply()
      }).catch((): void => undefined)
    }
    return response
  }) as typeof window.fetch

  const observer = new MutationObserver(queueApply)
  observer.observe(document.body, { subtree: true, childList: true, characterData: true })

  function queueApply(): void {
    if (!payload || queued) return
    queued = true
    window.requestAnimationFrame(() => {
      queued = false
      if (payload) applyCoverage(payload)
    })
  }
}

function applyCoverage(payload: ProviderCoveragePayload): void {
  const source = providerCoverageSource(payload, 'kick')
  const summary = providerCoverageSummary(payload, 'kick')
  const note = providerCoverageNote(payload)
  const path = normalizePath(window.location.pathname)

  if (path === '/kick/') {
    setTextById('home-strip-coverage', summary)
    setTextById('home-strip-source', source)
    setTextById('home-status-note', note)
    return
  }

  if (path === '/kick/status/') {
    setLabeledStrong('.head-facts .fact', 'Source', source)
    const cell = setLabeledStrong('.status-board .status-cell', 'Coverage', summary)
    if (cell) cell.title = note
    return
  }

  if (path === '/kick/day-flow/') {
    setLabeledCell('Source', source)
    upsertNote('[data-dayflow-coverage]', `${summary}. ${note}`, 'span')
    return
  }

  if (path === '/kick/battle-lines/') {
    upsertNote('[data-battle-coverage]', `${summary}. ${note}`, 'p')
    return
  }

  if (path === '/kick/history/') {
    setLabeledCell('Source', source)
    upsertNote('[data-history-notes]', `${summary}. ${note}`, 'p')
  }
}

function endpointForPath(pathname: string): string | null {
  const path = normalizePath(pathname)
  if (path === '/kick/') return '/api/kick-home'
  if (path === '/kick/status/') return '/api/kick-status'
  if (path === '/kick/day-flow/') return '/api/kick-day-flow'
  if (path === '/kick/battle-lines/') return '/api/kick-battle-lines'
  if (path === '/kick/history/') return '/api/kick-history'
  return null
}

function requestPath(input: RequestInfo | URL): string {
  try {
    if (typeof input === 'string') return new URL(input, window.location.href).pathname
    if (input instanceof URL) return input.pathname
    return new URL(input.url, window.location.href).pathname
  } catch {
    return ''
  }
}

function normalizePath(pathname: string): string {
  return pathname.endsWith('/') ? pathname : `${pathname}/`
}

function setTextById(id: string, value: string): void {
  const node = document.getElementById(id)
  if (node && node.textContent !== value) node.textContent = value
}

function setLabeledStrong(selector: string, label: string, value: string): HTMLElement | null {
  const root = findLabeled(selector, label)
  const target = root?.querySelector<HTMLElement>('strong')
  if (target && target.textContent !== value) target.textContent = value
  return root
}

function setLabeledCell(label: string, value: string): void {
  const cell = findLabeled('.data-strip__cell', label)
  const small = cell?.querySelector('small')
  if (!cell || !small) return
  const current = Array.from(cell.childNodes).filter((node) => node !== small).map((node) => node.textContent ?? '').join('').trim()
  if (current !== value) cell.replaceChildren(small, document.createTextNode(value))
}

function findLabeled(selector: string, label: string): HTMLElement | null {
  return Array.from(document.querySelectorAll<HTMLElement>(selector)).find((node) => node.querySelector('small')?.textContent?.trim().toLowerCase() === label.toLowerCase()) ?? null
}

function upsertNote(selector: string, value: string, tag: 'p' | 'span'): void {
  const root = document.querySelector<HTMLElement>(selector)
  if (!root) return
  let node = root.querySelector<HTMLElement>('[data-kick-coverage-ui]')
  if (!node) {
    node = document.createElement(tag)
    node.dataset.kickCoverageUi = 'true'
    root.append(node)
  }
  if (node.textContent !== value) node.textContent = value
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
