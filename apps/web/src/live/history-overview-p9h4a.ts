type SecondaryGroup = 'comparison' | 'calendar' | 'ranking' | 'coverage'

type AnalysisCopy = {
  label: string
  description: string
}

const analysisCopy: Record<SecondaryGroup, AnalysisCopy> = {
  comparison: {
    label: 'Compare periods',
    description: 'Current vs previous retained period',
  },
  calendar: {
    label: 'Calendar',
    description: 'Daily intensity and coverage',
  },
  ranking: {
    label: 'Rankings & changes',
    description: 'Top streamers and supported movement',
  },
  coverage: {
    label: 'Coverage',
    description: 'Partial, missing and in-progress days',
  },
}

const overview = document.querySelector<HTMLElement>('[data-history-view-panel="overview"]')
if (overview) installOverviewBalance(overview)

function installOverviewBalance(panel: HTMLElement): void {
  const waitForP9H3 = (): void => {
    if (panel.dataset.historyOverviewP9h3Ready !== 'true') {
      requestAnimationFrame(waitForP9H3)
      return
    }

    const summary = panel.querySelector<HTMLElement>('[data-history-summary]')
    const coverage = panel.querySelector<HTMLElement>('[data-history-coverage-summary]')
    const mobileNavigation = panel.querySelector<HTMLElement>('[data-history-mobile-analysis]')
    if (!summary || !coverage || !mobileNavigation) {
      requestAnimationFrame(waitForP9H3)
      return
    }

    let scheduled = false
    let applying = false
    let lastCoverageQuality = qualityFallback()

    const reconcile = (): void => {
      if (applying) return
      applying = true
      try {
        lastCoverageQuality = balanceSummary(summary, lastCoverageQuality)
        ensureCoverageQuality(coverage, lastCoverageQuality)
        enhanceMobileNavigation(mobileNavigation)
        panel.dataset.historyOverviewP9h4aReady = 'true'
      } finally {
        applying = false
      }
    }

    const schedule = (): void => {
      if (scheduled) return
      scheduled = true
      requestAnimationFrame(() => {
        scheduled = false
        reconcile()
      })
    }

    // These observers are intentionally scoped to the two owned render roots.
    // They keep the compatibility source hidden after metric/period rerenders and
    // may be removed when P9H6 retires the legacy five-card Summary renderer.
    new MutationObserver(schedule).observe(summary, { childList: true, subtree: true })
    new MutationObserver(schedule).observe(coverage, { childList: true, subtree: true })

    reconcile()
  }

  requestAnimationFrame(waitForP9H3)
}

function balanceSummary(summary: HTMLElement, fallback: string): string {
  const cards = [...summary.children].filter((node): node is HTMLElement => node instanceof HTMLElement)
  const coverageSource = cards[4]
  if (!coverageSource) return fallback

  const quality = coverageSource.querySelector('strong')?.textContent?.trim() || fallback
  coverageSource.classList.add('history-summary-coverage-source')
  coverageSource.dataset.historyCoverageSource = 'true'
  coverageSource.hidden = true
  coverageSource.setAttribute('aria-hidden', 'true')
  return quality
}

function ensureCoverageQuality(root: HTMLElement, quality: string): void {
  let block = root.querySelector<HTMLElement>('[data-history-coverage-quality]')
  if (!block) {
    block = document.createElement('div')
    block.className = 'history-coverage-summary__quality'
    block.dataset.historyCoverageQuality = ''
    const label = document.createElement('small')
    label.textContent = 'Coverage'
    const value = document.createElement('strong')
    block.append(label, document.createTextNode(' '), value)
    root.prepend(block)
  }

  const value = block.querySelector<HTMLElement>('strong')
  if (value && value.textContent !== quality) value.textContent = quality
}

function enhanceMobileNavigation(navigation: HTMLElement): void {
  navigation.querySelectorAll<HTMLButtonElement>('[data-history-mobile-analysis-toggle]').forEach((button) => {
    const group = validGroup(button.dataset.historyMobileAnalysisToggle)
    if (!group || button.dataset.historyP9h4aCopy === 'true') return
    const copy = analysisCopy[group]
    button.dataset.historyP9h4aCopy = 'true'
    button.innerHTML = `
      <span class="history-overview-mobile-analysis__copy" data-history-mobile-analysis-copy>
        <strong>${copy.label}</strong>
        <span>${copy.description}</span>
      </span>
      <b aria-hidden="true">›</b>`
  })
}

function validGroup(value: unknown): SecondaryGroup | null {
  return value === 'comparison' || value === 'calendar' || value === 'ranking' || value === 'coverage' ? value : null
}

function qualityFallback(): string {
  const value = document.querySelector<HTMLElement>('.history-page')?.dataset.historyVisualState ?? 'unknown'
  return value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

export {}
