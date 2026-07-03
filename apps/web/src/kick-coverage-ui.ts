import {
  providerCoverageNote,
  providerCoverageSource,
  providerCoverageSummary,
  type ProviderCoveragePayload,
} from './provider-coverage'

declare global {
  interface Window {
    __viewloomApplyKickCoveragePayload?: (payload: ProviderCoveragePayload) => void
  }
}

window.__viewloomApplyKickCoveragePayload = applyKickCoveragePayload

export function applyKickCoveragePayload(payload: ProviderCoveragePayload): void {
  if (document.body.dataset.provider !== 'kick') return
  applyCoverage(payload)
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
