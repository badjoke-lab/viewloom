type TaskView = 'overview' | 'archives' | 'report'
type ArchiveView = 'daily' | 'peaks' | 'battles'

const taskCopy: Record<TaskView, { label: string; description: string }> = {
  overview: { label: 'Overview', description: 'Trend, selected day, and comparison' },
  archives: { label: 'Archives', description: 'Daily records, peaks, and matchups' },
  report: { label: 'Report & Export', description: 'Copy, share, and download this view' },
}

const archiveCopy: Record<ArchiveView, { label: string; description: string; empty: string }> = {
  daily: { label: 'Daily', description: 'One retained record per observed UTC day', empty: 'No retained daily records' },
  peaks: { label: 'Peaks', description: 'Highest completed-day observed peaks', empty: 'No completed observed peaks' },
  battles: { label: 'Battles', description: 'Closest completed-day aggregate matchups', empty: 'No completed-day matchups' },
}

const page = document.querySelector<HTMLElement>('.history-page')
if (page) boot(page)

function boot(root: HTMLElement): void {
  let attempts = 0
  const wait = (): void => {
    const shell = root.querySelector<HTMLElement>('[data-history-view-shell]')
    const archives = shell?.querySelector<HTMLElement>('[data-history-view-panel="archives"]')
    const report = shell?.querySelector<HTMLElement>('[data-history-view-panel="report"] [data-history-report]')
    if (!shell || !archives || !report || archives.dataset.historyArchivesReady !== 'true') {
      attempts += 1
      if (attempts < 600) requestAnimationFrame(wait)
      return
    }
    install(root, shell, archives, report)
  }
  requestAnimationFrame(wait)
}

function install(root: HTMLElement, shell: HTMLElement, archives: HTMLElement, report: HTMLElement): void {
  if (root.dataset.historyP9h4bReady === 'true') return

  enhanceTaskTabs(shell)
  enhanceArchiveTabs(shell)
  ensureArchivesIntro(archives)
  ensureArchivePanelIntro(archives, 'daily')
  ensureArchivePanelIntro(archives, 'peaks')
  ensureArchivePanelIntro(archives, 'battles')
  ensureReportContext(report)
  groupPublishingActions(report)
  labelPublishingStatuses(report)

  let scheduled = false
  let reportSource = ''
  let sourceAttempts = 0
  const refresh = (): void => {
    scheduled = false
    refreshArchiveCounts(archives)
    reportSource = refreshContext(root, report, reportSource)
    if (!reportSource && sourceAttempts < 120) {
      sourceAttempts += 1
      requestAnimationFrame(schedule)
      return
    }
    sourceAttempts = 0
    root.dataset.historyP9h4bReady = 'true'
  }
  const schedule = (): void => {
    if (scheduled) return
    scheduled = true
    requestAnimationFrame(() => requestAnimationFrame(refresh))
  }

  document.addEventListener('click', (event) => {
    const target = event.target as Element | null
    if (target?.closest('[data-history-view],[data-history-archive-view],[data-history-period],[data-history-metric],[data-history-apply-range],[data-history-peak-toggle],[data-history-battle-toggle],[data-history-report-mode]')) schedule()
  }, true)
  window.addEventListener('popstate', schedule)
  window.addEventListener('viewloom:peak-archive-toggle', schedule)
  window.addEventListener('viewloom:battle-archive-toggle', schedule)

  refresh()
}

function enhanceTaskTabs(shell: HTMLElement): void {
  shell.querySelectorAll<HTMLButtonElement>('[data-history-view]').forEach((button) => {
    const view = validTask(button.dataset.historyView)
    if (!view || button.dataset.historyP9h4bCopy === 'true') return
    const copy = taskCopy[view]
    button.dataset.historyP9h4bCopy = 'true'
    button.innerHTML = `<span><strong>${copy.label}</strong><small>${copy.description}</small></span>`
  })
}

function enhanceArchiveTabs(shell: HTMLElement): void {
  shell.querySelectorAll<HTMLButtonElement>('[data-history-archive-view]').forEach((button) => {
    const view = validArchive(button.dataset.historyArchiveView)
    if (!view || button.dataset.historyP9h4bCopy === 'true') return
    const copy = archiveCopy[view]
    button.dataset.historyP9h4bCopy = 'true'
    button.innerHTML = `<span><strong>${copy.label}</strong><small>${copy.description}</small></span>`
  })
}

function ensureArchivesIntro(panel: HTMLElement): void {
  if (panel.querySelector('[data-history-archives-intro]')) return
  const intro = document.createElement('section')
  intro.className = 'history-task-intro history-task-intro--archives'
  intro.dataset.historyArchivesIntro = ''
  intro.innerHTML = `
    <div>
      <small>Retained evidence</small>
      <h2>Archives</h2>
      <p>Scan the current provider and period by observed day, completed-day peak, or aggregate matchup.</p>
    </div>
    <p class="history-task-intro__note">Changing archive views reuses the loaded History response.</p>`
  panel.prepend(intro)
}

function ensureArchivePanelIntro(archives: HTMLElement, view: ArchiveView): void {
  const panel = archives.querySelector<HTMLElement>(`[data-history-archive-panel="${view}"]`)
  if (!panel || panel.querySelector('[data-history-archive-panel-intro]')) return
  const copy = archiveCopy[view]
  const intro = document.createElement('div')
  intro.className = 'history-archive-panel-intro'
  intro.dataset.historyArchivePanelIntro = view
  intro.innerHTML = `
    <div><strong>${copy.label}</strong><span>${copy.description}</span></div>
    <small data-history-archive-count="${view}">${copy.empty}</small>`
  panel.prepend(intro)
}

function ensureReportContext(report: HTMLElement): void {
  if (report.querySelector('[data-history-publish-context]')) return
  const body = report.querySelector<HTMLElement>('.history-report__body')
  if (!body) return
  const context = document.createElement('section')
  context.className = 'history-publish-context'
  context.dataset.historyPublishContext = ''
  context.setAttribute('aria-label', 'Current History view')
  context.innerHTML = `
    <div class="history-publish-context__head">
      <small>Current view</small>
      <strong>Outputs use this loaded response</strong>
    </div>
    <dl>
      ${contextItem('provider', 'Provider')}
      ${contextItem('period', 'Period')}
      ${contextItem('metric', 'Metric')}
      ${contextItem('scope', 'Observed scope')}
      ${contextItem('state', 'State / source')}
    </dl>
    <p>Observed ViewLoom data only; not a provider-wide total.</p>`
  body.prepend(context)
}

function groupPublishingActions(report: HTMLElement): void {
  const actions = report.querySelector<HTMLElement>('.history-publish-actions')
  if (!actions || actions.dataset.historyPublishGroupsReady === 'true') return
  const copy = actions.querySelector<HTMLButtonElement>('[data-history-report-copy]')
  const shareToggle = actions.querySelector<HTMLButtonElement>('[data-history-share-toggle]')
  const png = actions.querySelector<HTMLButtonElement>('[data-history-share-download]')
  const csv = actions.querySelector<HTMLButtonElement>('[data-history-export-csv]')
  const json = actions.querySelector<HTMLButtonElement>('[data-history-export-json]')
  if (!copy || !shareToggle || !png || !csv || !json) return

  actions.dataset.historyPublishGroupsReady = 'true'
  actions.innerHTML = ''
  actions.append(
    publishGroup('Copy text', 'Full report or short post', [copy]),
    publishGroup('Share image', 'Preview first, then download PNG', [shareToggle, png]),
    publishGroup('Download data', 'Current retained daily rows', [csv, json]),
  )
}

function publishGroup(title: string, description: string, buttons: HTMLButtonElement[]): HTMLElement {
  const group = document.createElement('section')
  group.className = 'history-publish-group'
  group.innerHTML = `<div><strong>${title}</strong><small>${description}</small></div>`
  const row = document.createElement('div')
  row.className = 'history-publish-group__actions'
  row.append(...buttons)
  group.append(row)
  return group
}

function labelPublishingStatuses(report: HTMLElement): void {
  const labels = ['Text', 'Image', 'Data']
  report.querySelectorAll<HTMLElement>('.history-publish-statuses > span').forEach((status, index) => {
    status.dataset.historyPublishStatusLabel = labels[index] ?? 'Status'
  })
}

function refreshArchiveCounts(archives: HTMLElement): void {
  const counts: Record<ArchiveView, number> = {
    daily: archives.querySelectorAll('[data-history-day-card]').length,
    peaks: archives.querySelectorAll('[data-history-peak-day]').length,
    battles: archives.querySelectorAll('[data-history-battle-day]').length,
  }
  const nouns: Record<ArchiveView, string> = { daily: 'retained days', peaks: 'visible peaks', battles: 'visible matchups' }
  ;(['daily', 'peaks', 'battles'] as ArchiveView[]).forEach((view) => {
    const node = archives.querySelector<HTMLElement>(`[data-history-archive-count="${view}"]`)
    if (node) node.textContent = counts[view] ? `${counts[view]} ${nouns[view]}` : archiveCopy[view].empty
  })
}

function refreshContext(root: HTMLElement, report: HTMLElement, previousSource: string): string {
  const provider = document.body.dataset.provider === 'kick' ? 'Kick' : 'Twitch'
  const facts = [...root.querySelectorAll<HTMLElement>('.head-facts .fact strong')].map((node) => clean(node.textContent))
  const period = clean(root.querySelector('[data-history-period-label]')?.textContent) || facts[0] || 'Current retained period'
  const metricButton = root.querySelector<HTMLElement>('[data-history-metric].active')
  const metric = clean(metricButton?.textContent) || (new URL(location.href).searchParams.get('metric') === 'peak_viewers' ? 'Peak viewers' : 'Viewer-minutes')
  const scope = facts[3] || 'Observed days unavailable'
  const state = clean(root.querySelector('[data-history-state-pill]')?.textContent) || facts[2] || 'Unknown'
  const source = reportField(report, 'Source') || previousSource
  setContext(report, 'provider', provider)
  setContext(report, 'period', period)
  setContext(report, 'metric', metric)
  setContext(report, 'scope', scope)
  setContext(report, 'state', source ? `${state} · ${source}` : state)
  return source
}

function reportField(report: HTMLElement, label: string): string {
  const text = report.querySelector<HTMLElement>('[data-history-report-preview]')?.textContent ?? ''
  const marker = `${label}:`
  const line = text.split(/\r?\n/).map((value) => value.trim()).find((value) => value.includes(marker))
  if (!line) return ''
  const markerIndex = line.indexOf(marker)
  return clean(line.slice(markerIndex + marker.length))
}

function setContext(report: HTMLElement, key: string, value: string): void {
  const node = report.querySelector<HTMLElement>(`[data-history-publish-context-value="${key}"]`)
  if (node) node.textContent = value
}

function contextItem(key: string, label: string): string {
  return `<div><dt>${label}</dt><dd data-history-publish-context-value="${key}">—</dd></div>`
}

function validTask(value: unknown): TaskView | null {
  return value === 'overview' || value === 'archives' || value === 'report' ? value : null
}

function validArchive(value: unknown): ArchiveView | null {
  return value === 'daily' || value === 'peaks' || value === 'battles' ? value : null
}

function clean(value: string | null | undefined): string {
  return value?.replace(/\s+/g, ' ').trim() ?? ''
}

export {}
