type HistoryView = 'overview' | 'archives' | 'report'
type HistoryArchiveView = 'daily' | 'peaks' | 'battles'
type ViewState = { view: HistoryView; archive: HistoryArchiveView }

const root = document.querySelector<HTMLElement>('.history-page')
if (root) installHistoryViewShell(root)

function installHistoryViewShell(page: HTMLElement): void {
  const nativeReplaceState = history.replaceState.bind(history)
  const nativePushState = history.pushState.bind(history)
  const shell = ensureShell(page)
  const observer = new MutationObserver(scheduleRehome)
  let state = readViewState()
  let rememberedArchive = state.archive
  let scheduled = false
  let applying = false

  installReplaceStateBridge(nativeReplaceState)
  bindTabs()
  observer.observe(page, { childList: true, subtree: true })
  canonicalizeState()
  rehome()
  syncView()

  window.addEventListener('popstate', () => {
    const next = readViewState()
    if (next.view === 'archives') rememberedArchive = next.archive
    else next.archive = rememberedArchive
    state = next
    canonicalizeState()
    syncView()
    scheduleRehome()
  })

  function bindTabs(): void {
    shell.querySelectorAll<HTMLButtonElement>('[data-history-view]').forEach((button) => {
      button.addEventListener('click', () => {
        const view = validView(button.dataset.historyView)
        if (!view) return
        state.view = view
        if (view === 'archives') state.archive = rememberedArchive
        writeState(true)
        syncView()
      })
    })
    shell.querySelectorAll<HTMLButtonElement>('[data-history-archive-view]').forEach((button) => {
      button.addEventListener('click', () => {
        const archive = validArchive(button.dataset.historyArchiveView)
        if (!archive) return
        state = { view: 'archives', archive }
        rememberedArchive = archive
        writeState(true)
        syncView()
      })
    })
    shell.querySelectorAll<HTMLElement>('[role="tablist"]').forEach((tablist) => {
      tablist.addEventListener('keydown', handleTabKey)
    })
  }

  function handleTabKey(event: KeyboardEvent): void {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
    const tablist = event.currentTarget instanceof HTMLElement ? event.currentTarget : null
    const current = document.activeElement instanceof HTMLButtonElement ? document.activeElement : null
    if (!tablist || !current) return
    const tabs = Array.from(tablist.querySelectorAll<HTMLButtonElement>(':scope > [role="tab"]'))
    const index = tabs.indexOf(current)
    if (index < 0 || !tabs.length) return
    event.preventDefault()
    const next = event.key === 'Home' ? 0
      : event.key === 'End' ? tabs.length - 1
        : event.key === 'ArrowRight' ? (index + 1) % tabs.length
          : (index - 1 + tabs.length) % tabs.length
    tabs[next]?.focus()
    tabs[next]?.click()
  }

  function canonicalizeState(): void {
    const url = new URL(location.href)
    const rawView = url.searchParams.get('view')
    const rawArchive = url.searchParams.get('archive')
    const invalid = rawView === 'overview'
      || rawView !== null && !validView(rawView)
      || state.view === 'archives' && rawArchive !== state.archive
      || state.view !== 'archives' && rawArchive !== null
    if (invalid) writeState(false)
  }

  function writeState(push: boolean): void {
    const url = new URL(location.href)
    applyViewParams(url, state)
    const target = `${url.pathname}${url.search}${url.hash}`
    const payload = { view: state.view, archive: state.archive }
    if (push) nativePushState(payload, '', target)
    else nativeReplaceState(payload, '', target)
  }

  function installReplaceStateBridge(replace: History['replaceState']): void {
    history.replaceState = ((data: unknown, unused: string, url?: string | URL | null) => {
      if (url == null) return replace(data, unused, url)
      const target = new URL(String(url), location.href)
      if (target.origin === location.origin && target.pathname === location.pathname) {
        applyViewParams(target, state)
      }
      return replace(data, unused, `${target.pathname}${target.search}${target.hash}`)
    }) as History['replaceState']
  }

  function syncView(): void {
    page.dataset.historyView = state.view
    page.dataset.historyArchiveView = state.archive
    syncTabs('[data-history-view]', 'historyView', state.view, state.view)
    syncTabs('[data-history-archive-view]', 'historyArchiveView', state.archive, state.view === 'archives' ? state.archive : '')
    shell.querySelectorAll<HTMLElement>('[data-history-view-panel]').forEach((panel) => {
      panel.hidden = panel.dataset.historyViewPanel !== state.view
    })
    shell.querySelectorAll<HTMLElement>('[data-history-archive-panel]').forEach((panel) => {
      panel.hidden = panel.dataset.historyArchivePanel !== state.archive
    })
  }

  function syncTabs(selector: string, key: 'historyView' | 'historyArchiveView', selected: string, tabbable: string): void {
    shell.querySelectorAll<HTMLButtonElement>(selector).forEach((button) => {
      const value = button.dataset[key]
      const active = value === selected
      button.classList.toggle('active', active)
      button.setAttribute('aria-selected', String(active))
      button.tabIndex = value === tabbable ? 0 : -1
    })
  }

  function scheduleRehome(): void {
    if (scheduled || applying) return
    scheduled = true
    requestAnimationFrame(() => {
      scheduled = false
      rehome()
    })
  }

  function rehome(): void {
    if (applying) return
    applying = true
    observer.disconnect()
    try {
      move('overview', [
        '.data-strip',
        '[data-history-summary]',
        '[data-history-coverage-summary]',
        '.history-period-comparison-block',
        '[data-history-columns]',
        '.history-calendar-block',
        '.history-ranking-toolbar',
        '.history-table-wrap',
        '[data-history-streamer-cards]',
        '.history-coverage-detail',
      ], true)
      moveArchive('daily', ['[data-history-archive-toolbar]', '[data-history-daily-archive]'], true)
      moveArchive('peaks', ['.history-peak-events-block'])
      moveArchive('battles', ['.history-battle-archive-block'])
      move('report', ['.history-report-block', '.history-share-block', '.history-export-block'])
      shell.dataset.historyShellReady = 'true'
    } finally {
      observer.observe(page, { childList: true, subtree: true })
      applying = false
    }
  }

  function move(view: HistoryView, selectors: string[], includeRules = false): void {
    const panel = shell.querySelector<HTMLElement>(`[data-history-view-panel="${view}"]`)
    if (panel) appendMatches(panel, selectors, includeRules)
  }

  function moveArchive(view: HistoryArchiveView, selectors: string[], includeRules = false): void {
    const panel = shell.querySelector<HTMLElement>(`[data-history-archive-panel="${view}"]`)
    if (panel) appendMatches(panel, selectors, includeRules)
  }

  function appendMatches(panel: HTMLElement, selectors: string[], includeRules: boolean): void {
    selectors.forEach((selector) => {
      const node = page.querySelector<HTMLElement>(selector)
      if (!node || node === panel) return
      if (includeRules) {
        const previous = node.previousElementSibling
        if (previous instanceof HTMLElement && previous.classList.contains('rule-title')) panel.append(previous)
      }
      panel.append(node)
    })
  }
}

function ensureShell(page: HTMLElement): HTMLElement {
  const existing = page.querySelector<HTMLElement>('[data-history-view-shell]')
  if (existing) return existing
  const shell = document.createElement('div')
  shell.className = 'history-view-shell'
  shell.dataset.historyViewShell = ''
  shell.innerHTML = `
    <nav class="history-view-tabs" role="tablist" aria-label="History views">
      ${viewTab('overview', 'Overview')}${viewTab('archives', 'Archives')}${viewTab('report', 'Report & Export')}
    </nav>
    <div class="history-view-panels">
      <section id="history-view-overview" class="history-view-panel" data-history-view-panel="overview" role="tabpanel" aria-labelledby="history-view-tab-overview"></section>
      <section id="history-view-archives" class="history-view-panel" data-history-view-panel="archives" role="tabpanel" aria-labelledby="history-view-tab-archives">
        <nav class="history-archive-view-tabs" role="tablist" aria-label="History archive views">
          ${archiveTab('daily', 'Daily')}${archiveTab('peaks', 'Peaks')}${archiveTab('battles', 'Battles')}
        </nav>
        <section id="history-archive-daily" class="history-archive-view-panel" data-history-archive-panel="daily" role="tabpanel" aria-labelledby="history-archive-tab-daily"></section>
        <section id="history-archive-peaks" class="history-archive-view-panel" data-history-archive-panel="peaks" role="tabpanel" aria-labelledby="history-archive-tab-peaks"></section>
        <section id="history-archive-battles" class="history-archive-view-panel" data-history-archive-panel="battles" role="tabpanel" aria-labelledby="history-archive-tab-battles"></section>
      </section>
      <section id="history-view-report" class="history-view-panel" data-history-view-panel="report" role="tabpanel" aria-labelledby="history-view-tab-report"></section>
    </div>`
  const anchor = page.querySelector<HTMLElement>('[data-history-feedback]') ?? page.querySelector<HTMLElement>('.history-controls')
  if (anchor) anchor.insertAdjacentElement('afterend', shell)
  else page.append(shell)
  return shell
}

function applyViewParams(url: URL, state: ViewState): void {
  if (state.view === 'overview') {
    url.searchParams.delete('view')
    url.searchParams.delete('archive')
  } else if (state.view === 'archives') {
    url.searchParams.set('view', 'archives')
    url.searchParams.set('archive', state.archive)
  } else {
    url.searchParams.set('view', 'report')
    url.searchParams.delete('archive')
  }
}

function readViewState(): ViewState {
  const params = new URLSearchParams(location.search)
  return {
    view: validView(params.get('view')) ?? 'overview',
    archive: validArchive(params.get('archive')) ?? 'daily',
  }
}

function validView(value: unknown): HistoryView | null {
  return value === 'overview' || value === 'archives' || value === 'report' ? value : null
}

function validArchive(value: unknown): HistoryArchiveView | null {
  return value === 'daily' || value === 'peaks' || value === 'battles' ? value : null
}

function viewTab(view: HistoryView, label: string): string {
  return `<button id="history-view-tab-${view}" type="button" role="tab" data-history-view="${view}" aria-controls="history-view-${view}" aria-selected="false" tabindex="-1">${label}</button>`
}

function archiveTab(view: HistoryArchiveView, label: string): string {
  return `<button id="history-archive-tab-${view}" type="button" role="tab" data-history-archive-view="${view}" aria-controls="history-archive-${view}" aria-selected="false" tabindex="-1">${label}</button>`
}

export {}
