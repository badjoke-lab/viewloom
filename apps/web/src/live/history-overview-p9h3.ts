type SecondaryGroup = 'comparison' | 'calendar' | 'ranking' | 'coverage'

const overview = document.querySelector<HTMLElement>('[data-history-view-panel="overview"]')
if (overview) installOverviewHierarchy(overview)

function installOverviewHierarchy(panel: HTMLElement): void {
  const waitForAcceptedOverview = (): void => {
    if (panel.dataset.historyOverviewReady !== 'true') {
      requestAnimationFrame(waitForAcceptedOverview)
      return
    }
    markSecondaryGroups(panel)
    const navigation = ensureMobileNavigation(panel)
    bindMobileNavigation(panel, navigation)
    panel.dataset.historyOverviewP9h3Ready = 'true'
  }

  requestAnimationFrame(waitForAcceptedOverview)
}

function markSecondaryGroups(panel: HTMLElement): void {
  mark(panel.querySelector<HTMLElement>('.history-period-comparison-block'), 'comparison')
  mark(panel.querySelector<HTMLElement>('.history-calendar-block'), 'calendar')

  for (const node of [
    panel.querySelector<HTMLElement>('.history-overview-ranking-title'),
    panel.querySelector<HTMLElement>('.history-ranking-toolbar'),
    panel.querySelector<HTMLElement>('.history-table-wrap'),
    panel.querySelector<HTMLElement>('[data-history-streamer-cards]'),
    panel.querySelector<HTMLElement>('[data-history-overview-insights]'),
  ]) mark(node, 'ranking')

  mark(panel.querySelector<HTMLElement>('.history-overview-coverage-title'), 'coverage')
  mark(panel.querySelector<HTMLElement>('.history-coverage-detail'), 'coverage')
}

function mark(node: HTMLElement | null, group: SecondaryGroup): void {
  if (!node) return
  node.dataset.historySecondaryGroup = group
}

function ensureMobileNavigation(panel: HTMLElement): HTMLElement {
  const existing = panel.querySelector<HTMLElement>('[data-history-mobile-analysis]')
  if (existing) return existing

  const navigation = document.createElement('nav')
  navigation.className = 'history-overview-mobile-analysis'
  navigation.dataset.historyMobileAnalysis = ''
  navigation.setAttribute('aria-label', 'More History analysis')
  navigation.innerHTML = `
    <div class="history-overview-mobile-analysis__head">
      <strong>More analysis</strong>
      <span>Open one secondary view at a time.</span>
    </div>
    <div class="history-overview-mobile-analysis__buttons">
      ${toggleButton('comparison', 'Compare periods')}
      ${toggleButton('calendar', 'Calendar')}
      ${toggleButton('ranking', 'Rankings & changes')}
      ${toggleButton('coverage', 'Coverage')}
    </div>`

  const primary = panel.querySelector<HTMLElement>('[data-history-columns]')
  if (primary) primary.insertAdjacentElement('afterend', navigation)
  else panel.prepend(navigation)
  return navigation
}

function toggleButton(group: SecondaryGroup, label: string): string {
  return `<button type="button" data-history-mobile-analysis-toggle="${group}" aria-expanded="false">${label}</button>`
}

function bindMobileNavigation(panel: HTMLElement, navigation: HTMLElement): void {
  if (navigation.dataset.historyMobileAnalysisBound === 'true') return
  navigation.dataset.historyMobileAnalysisBound = 'true'
  navigation.addEventListener('click', (event) => {
    const target = event.target instanceof Element
      ? event.target.closest<HTMLButtonElement>('[data-history-mobile-analysis-toggle]')
      : null
    if (!target) return
    const group = validGroup(target.dataset.historyMobileAnalysisToggle)
    if (!group) return
    const isOpen = target.getAttribute('aria-expanded') === 'true'
    setOpenGroup(panel, navigation, isOpen ? null : group)
    if (!isOpen) firstGroupNode(panel, group)?.scrollIntoView({ block: 'start', behavior: reducedMotion() ? 'auto' : 'smooth' })
  })
}

function setOpenGroup(panel: HTMLElement, navigation: HTMLElement, selected: SecondaryGroup | null): void {
  navigation.querySelectorAll<HTMLButtonElement>('[data-history-mobile-analysis-toggle]').forEach((button) => {
    const active = button.dataset.historyMobileAnalysisToggle === selected
    button.setAttribute('aria-expanded', String(active))
    button.classList.toggle('active', active)
  })
  panel.querySelectorAll<HTMLElement>('[data-history-secondary-group]').forEach((node) => {
    node.classList.toggle('is-mobile-open', node.dataset.historySecondaryGroup === selected)
  })
  panel.dataset.historyMobileAnalysisOpen = selected ?? ''
}

function firstGroupNode(panel: HTMLElement, group: SecondaryGroup): HTMLElement | null {
  return panel.querySelector<HTMLElement>(`[data-history-secondary-group="${group}"]`)
}

function validGroup(value: unknown): SecondaryGroup | null {
  return value === 'comparison' || value === 'calendar' || value === 'ranking' || value === 'coverage' ? value : null
}

function reducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export {}
