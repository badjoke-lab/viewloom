const isHistoryPage = document.body.dataset.page === 'twitch-history'

if (isHistoryPage) {
  window.requestAnimationFrame(() => {
    ensureHistoryUnifyStyles()
    applyHistoryUiUnification()
  })
}

function applyHistoryUiUnification(): void {
  const main = document.querySelector<HTMLElement>('.history-main')
  const hero = document.querySelector<HTMLElement>('.history-hero')
  const controls = document.querySelector<HTMLElement>('.history-controls')
  const summary = document.querySelector<HTMLElement>('.history-summary')
  const trendCard = document.querySelector<HTMLElement>('.history-trend-card')
  const peakCard = document.querySelector<HTMLElement>('.history-peak-archive')
  const cards = document.querySelectorAll<HTMLElement>('.history-card')
  const coverage = document.querySelector<HTMLElement>('#history-coverage')
  const methods = document.querySelector<HTMLElement>('[data-history-method-notes]')

  hero?.classList.add('vl-page-hero', 'history-hero--unified')
  controls?.classList.add('vl-control-dock', 'history-controls--unified')
  summary?.classList.add('vl-kpi-row', 'history-summary--unified')
  trendCard?.classList.add('vl-visual-card', 'history-visual-card--unified')
  peakCard?.classList.add('vl-section-card')
  cards.forEach((card) => card.classList.add('vl-section-card'))
  coverage?.classList.add('vl-data-quality-note', 'history-data-quality--unified')
  methods?.classList.add('history-methods--unified')

  const heroActions = hero?.querySelector<HTMLElement>('.hero-actions')
  if (main && heroActions && !main.querySelector('.history-feature-nav--unified')) {
    const featureNav = document.createElement('nav')
    featureNav.className = 'site-subnav vl-feature-nav history-feature-nav--unified'
    featureNav.setAttribute('aria-label', 'Feature navigation')
    featureNav.innerHTML = heroActions.innerHTML
    featureNav.querySelectorAll('.button').forEach((item) => {
      item.classList.remove('button', 'button--secondary', 'button--primary')
      item.classList.add('subnav-link')
    })
    hero.insertAdjacentElement('afterend', featureNav)
    heroActions.remove()
  }
}

function ensureHistoryUnifyStyles(): void {
  if (document.querySelector('#history-unify-styles')) return
  const style = document.createElement('style')
  style.id = 'history-unify-styles'
  style.textContent = `
.history-hero--unified{border-radius:var(--radius-xl);padding:34px;box-shadow:var(--shadow)}
.history-feature-nav--unified{margin-top:18px}.history-controls--unified{margin-top:18px;padding:12px;border:1px solid var(--border);border-radius:22px;background:rgba(12,21,37,.74)}
.history-summary--unified .summary-card{border-radius:var(--radius-lg)}.history-visual-card--unified,.history-page .vl-section-card{border-color:var(--border);border-radius:var(--radius-lg);background:var(--card);box-shadow:var(--shadow)}
.history-data-quality--unified{margin-top:18px}.history-methods--unified .history-method-card{border-radius:var(--radius-lg)}
@media(max-width:760px){.history-hero--unified{padding:20px}.history-controls--unified{display:grid;grid-template-columns:1fr}.history-feature-nav--unified{display:flex;overflow-x:auto}}
`
  document.head.append(style)
}
