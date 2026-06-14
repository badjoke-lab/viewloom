type BattleLayoutMode = 'wide' | 'split'

const SPLIT_MIN_WIDTH = 1180
const layoutButtons = [...document.querySelectorAll<HTMLButtonElement>('[data-battle-layout]')]
const stage = document.querySelector<HTMLElement>('[data-battle-stage]')
const inspector = document.querySelector<HTMLElement>('[data-battle-inspector]')
const inspectorSection = inspector?.closest<HTMLElement>('.battle-section') ?? null
const layoutHost = stage?.parentElement ?? null
let requestedLayout: BattleLayoutMode = readInitialLayout()
let renderingRail = false

const nativeReplaceState = window.history.replaceState.bind(window.history)
window.history.replaceState = function replaceState(data: unknown, unused: string, url?: string | URL | null): void {
  if (url === undefined || url === null) {
    nativeReplaceState(data, unused, url)
    return
  }
  const next = new URL(String(url), window.location.href)
  next.searchParams.set('layout', requestedLayout)
  nativeReplaceState(data, unused, `${next.pathname}?${next.searchParams.toString()}${next.hash}`)
}

if (stage && inspectorSection && layoutHost) setupLayout()

function setupLayout(): void {
  const shell = document.createElement('div')
  shell.className = 'battle-layout-shell is-wide'
  shell.setAttribute('data-battle-layout-shell', '')

  const main = document.createElement('div')
  main.className = 'battle-layout-main'
  main.setAttribute('data-battle-layout-main', '')

  const rail = document.createElement('aside')
  rail.className = 'battle-split-rail'
  rail.setAttribute('data-battle-split-rail', '')
  rail.hidden = true
  rail.innerHTML = '<div class="battle-split-rail__head"><small>SPLIT INSPECTOR</small><strong>Waiting for battle data…</strong></div><div data-battle-split-content></div>'

  layoutHost.insertBefore(shell, stage)
  main.append(stage)
  shell.append(main, rail)
  inspectorSection.setAttribute('data-battle-inspector-section', '')

  for (const button of layoutButtons) {
    button.addEventListener('click', () => {
      const next: BattleLayoutMode = button.dataset.battleLayout === 'split' ? 'split' : 'wide'
      if (next === 'split' && !canSplit()) return
      requestedLayout = next
      applyLayout(true)
    })
  }

  window.addEventListener('resize', () => {
    if (!canSplit() && requestedLayout === 'split') {
      requestedLayout = 'wide'
      applyLayout(true)
      return
    }
    applyLayout(false)
  })

  window.addEventListener('popstate', () => {
    requestedLayout = readInitialLayout()
    if (!canSplit() && requestedLayout === 'split') requestedLayout = 'wide'
    applyLayout(false)
  })

  const sources = [
    document.querySelector<HTMLElement>('[data-battle-primary]'),
    document.querySelector<HTMLElement>('[data-battle-status]'),
    document.querySelector<HTMLElement>('[data-battle-inspector]'),
    document.querySelector<HTMLElement>('[data-battle-feed]'),
    document.querySelector<HTMLElement>('[data-battle-stage]'),
  ].filter((node): node is HTMLElement => Boolean(node))

  const observer = new MutationObserver(() => renderRail())
  for (const source of sources) observer.observe(source, { childList: true, subtree: true, characterData: true })

  applyLayout(true)
  renderRail()
}

function readInitialLayout(): BattleLayoutMode {
  const value = new URLSearchParams(window.location.search).get('layout')
  if (value === 'split') return 'split'
  return 'wide'
}

function canSplit(): boolean {
  return window.matchMedia(`(min-width: ${SPLIT_MIN_WIDTH}px)`).matches
}

function applyLayout(updateUrl: boolean): void {
  const shell = document.querySelector<HTMLElement>('[data-battle-layout-shell]')
  const rail = document.querySelector<HTMLElement>('[data-battle-split-rail]')
  if (!shell || !rail || !inspectorSection) return

  const effectiveLayout: BattleLayoutMode = requestedLayout === 'split' && canSplit() ? 'split' : 'wide'
  shell.classList.toggle('is-wide', effectiveLayout === 'wide')
  shell.classList.toggle('is-split', effectiveLayout === 'split')
  shell.dataset.battleLayoutCurrent = effectiveLayout
  document.body.dataset.battleLayoutRequested = requestedLayout
  document.body.dataset.battleLayoutCurrent = effectiveLayout
  rail.hidden = effectiveLayout !== 'split'
  inspectorSection.hidden = effectiveLayout === 'split'

  for (const button of layoutButtons) {
    const mode: BattleLayoutMode = button.dataset.battleLayout === 'split' ? 'split' : 'wide'
    const disabled = mode === 'split' && !canSplit()
    const active = mode === effectiveLayout
    button.disabled = disabled
    button.classList.toggle('active', active)
    button.setAttribute('aria-pressed', String(active))
    button.title = disabled ? 'Split is available on wider desktop screens.' : `${mode === 'wide' ? 'Wide' : 'Split'} layout`
  }

  if (effectiveLayout === 'split') renderRail()
  if (!updateUrl) return

  const next = new URL(window.location.href)
  next.searchParams.set('layout', effectiveLayout)
  nativeReplaceState(null, '', `${next.pathname}?${next.searchParams.toString()}${next.hash}`)
}

function renderRail(): void {
  if (renderingRail) return
  const target = document.querySelector<HTMLElement>('[data-battle-split-content]')
  if (!target) return
  renderingRail = true

  const primary = document.querySelector<HTMLElement>('[data-battle-primary]')
  const status = document.querySelector<HTMLElement>('[data-battle-status]')
  const inspectorRoot = document.querySelector<HTMLElement>('[data-battle-inspector]')
  const feed = document.querySelector<HTMLElement>('[data-battle-feed]')
  const stageRoot = document.querySelector<HTMLElement>('[data-battle-stage]')

  const pair = primary?.querySelector('h2')?.textContent?.trim() || 'No battle selected'
  const selectedTime = inspectorRoot?.querySelector('.inspector-head h2')?.textContent?.trim()
    || primary?.querySelector('.battle-primary__identity p')?.textContent?.replace(/Selected time/i, '').trim()
    || 'No selected time'
  const selectedStream = stageRoot?.querySelector('.battle-legend__item.active span')?.textContent?.trim() || 'None'
  const dataState = status?.querySelector('strong')?.textContent?.trim() || 'Unknown'
  const statusDetail = status?.querySelector('span')?.textContent?.trim() || 'No API detail'

  const pairCards = [...(inspectorRoot?.querySelectorAll<HTMLElement>('.pair-inspector article') ?? [])].map((card) => ({
    label: card.querySelector('small')?.textContent?.trim() || 'Value',
    value: card.querySelector('strong')?.textContent?.trim() || '—',
    detail: card.querySelector('span')?.textContent?.trim() || '',
  }))

  const rankingRows = [...(inspectorRoot?.querySelectorAll<HTMLElement>('.ranking__row') ?? [])].slice(0, 5).map((row) => {
    const cells = [...row.children].map((cell) => cell.textContent?.trim() || '—')
    return { rank: cells[0] ?? '—', stream: cells[1] ?? '—', value: cells[2] ?? '—' }
  })

  const recentEvents = [...(feed?.querySelectorAll<HTMLElement>('.event-item') ?? [])].slice(0, 3).map((event) => ({
    meta: event.querySelector('span')?.textContent?.trim() || 'Event',
    title: event.querySelector('strong')?.textContent?.trim() || 'Observed event',
    detail: event.querySelector('p')?.textContent?.trim() || '',
  }))

  const cardsMarkup = pairCards.length
    ? pairCards.map((card) => `<div class="battle-split-value"><small>${escapeHtml(card.label)}</small><strong>${escapeHtml(card.value)}</strong><span>${escapeHtml(card.detail)}</span></div>`).join('')
    : '<p class="battle-split-empty">No selected-time values.</p>'
  const rankingMarkup = rankingRows.length
    ? rankingRows.map((row) => `<div class="battle-split-rank"><b>${escapeHtml(row.rank)}</b><strong>${escapeHtml(row.stream)}</strong><span>${escapeHtml(row.value)}</span></div>`).join('')
    : '<p class="battle-split-empty">No ranking at this bucket.</p>'
  const feedMarkup = recentEvents.length
    ? recentEvents.map((event) => `<div class="battle-split-event"><small>${escapeHtml(event.meta)}</small><strong>${escapeHtml(event.title)}</strong><span>${escapeHtml(event.detail)}</span></div>`).join('')
    : '<p class="battle-split-empty">No recent event for this battle.</p>'

  target.innerHTML = `<section class="battle-split-block battle-split-identity"><small>Selected battle</small><h2>${escapeHtml(pair)}</h2><span>${escapeHtml(selectedTime)}</span></section><section class="battle-split-block"><div class="battle-split-subhead"><strong>Selected time</strong><span>${escapeHtml(selectedTime)}</span></div><div class="battle-split-values">${cardsMarkup}</div></section><section class="battle-split-block"><div class="battle-split-subhead"><strong>Selected stream</strong><span>${escapeHtml(selectedStream)}</span></div></section><section class="battle-split-block"><div class="battle-split-subhead"><strong>Top at selected time</strong><span>Value / state</span></div><div class="battle-split-ranking">${rankingMarkup}</div></section><section class="battle-split-block"><div class="battle-split-subhead"><strong>Data state</strong><span>${escapeHtml(dataState)}</span></div><p>${escapeHtml(statusDetail)}</p></section><section class="battle-split-block"><div class="battle-split-subhead"><strong>Recent battle feed</strong><span>Latest 3</span></div><div class="battle-split-feed">${feedMarkup}</div></section>`

  const head = document.querySelector<HTMLElement>('.battle-split-rail__head strong')
  if (head) head.textContent = pair
  renderingRail = false
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character] ?? character)
}
