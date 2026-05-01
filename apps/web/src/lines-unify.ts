const isLinesPage = document.body.dataset.page === 'twitch-battle-lines'

if (isLinesPage) {
  window.requestAnimationFrame(() => {
    applyLinesUiUnification()
  })
}

function applyLinesUiUnification(): void {
  const main = document.querySelector<HTMLElement>('.bl-main')
  const hero = document.querySelector<HTMLElement>('.bl-hero')
  const controls = document.querySelector<HTMLElement>('.bl-controls')
  const status = document.querySelector<HTMLElement>('.bl-status')
  const summary = document.querySelector<HTMLElement>('.bl-summary')
  const chartCard = document.querySelector<HTMLElement>('.bl-chart-card')
  const note = document.querySelector<HTMLElement>('.bl-note')

  if (!main || !hero) return

  hero.classList.add('hero', 'hero--site', 'hero--feature', 'vl-page-hero', 'bl-hero--unified')
  hero.querySelector('.bl-icon')?.remove()

  if (!main.querySelector('.vl-feature-nav')) {
    hero.insertAdjacentHTML('afterend', renderFeatureNav())
  }

  controls?.classList.add('vl-control-dock', 'bl-controls--unified')
  status?.classList.add('vl-data-state-card', 'bl-status--unified')
  summary?.classList.add('summary-grid', 'vl-kpi-row', 'bl-summary--unified')
  chartCard?.classList.add('chart-stage', 'chart-stage--feature', 'vl-visual-card', 'bl-chart-card--unified')
  note?.classList.add('vl-data-quality-note')

  document.querySelectorAll<HTMLElement>('.bl-section').forEach((section) => {
    section.classList.add('support-card', 'vl-section-card', 'bl-section--unified')
  })
}

function renderFeatureNav(): string {
  return `
    <nav class="site-subnav vl-feature-nav" aria-label="Feature navigation">
      <a class="subnav-link" href="/twitch/heatmap/">Heatmap</a>
      <a class="subnav-link" href="/twitch/day-flow/">Day Flow</a>
      <a class="subnav-link is-current" href="/twitch/battle-lines/">Battle Lines</a>
      <a class="subnav-link" href="/twitch/history/">History</a>
    </nav>
  `
}
