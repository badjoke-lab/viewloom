type SecondaryGroup = 'comparison' | 'calendar' | 'ranking' | 'coverage'

type AnalysisCopy = {
  label: string
  description: string
}

const analysisCopy: Record<SecondaryGroup, AnalysisCopy> = {
  comparison: { label: 'Compare periods', description: 'Current vs previous retained period' },
  calendar: { label: 'Calendar', description: 'Daily intensity and coverage' },
  ranking: { label: 'Rankings & changes', description: 'Top streamers and supported movement' },
  coverage: { label: 'Coverage', description: 'Partial, missing and in-progress days' },
}

const overview = document.querySelector<HTMLElement>('[data-history-view-panel="overview"]')
if (overview) installOverviewBalance(overview)

function installOverviewBalance(panel: HTMLElement): void {
  const waitForP9H3 = (): void => {
    if (panel.dataset.historyOverviewP9h3Ready !== 'true') {
      requestAnimationFrame(waitForP9H3)
      return
    }

    const mobileNavigation = panel.querySelector<HTMLElement>('[data-history-mobile-analysis]')
    if (!mobileNavigation) {
      requestAnimationFrame(waitForP9H3)
      return
    }

    enhanceMobileNavigation(mobileNavigation)
    panel.dataset.historyOverviewP9h4aReady = 'true'
  }

  requestAnimationFrame(waitForP9H3)
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

export {}
