const isDayFlowPage = document.body.dataset.page === 'twitch-day-flow'

if (isDayFlowPage) {
  window.requestAnimationFrame(() => {
    ensureDayFlowUnifyStyles()
    applyDayFlowUiUnification()
  })
}

function applyDayFlowUiUnification(): void {
  const hero = document.querySelector<HTMLElement>('.hero--feature')
  const subnav = document.querySelector<HTMLElement>('.site-subnav')
  const controls = document.querySelector<HTMLElement>('#dayflow-controls')
  const summary = document.querySelector<HTMLElement>('.df-summary')
  const mainCard = document.querySelector<HTMLElement>('.df-main')
  const railCards = document.querySelectorAll<HTMLElement>('.df-rail .rail-card')
  const supportCards = document.querySelectorAll<HTMLElement>('.support-grid--feature .support-card')

  hero?.classList.add('vl-page-hero', 'df-hero--unified')
  subnav?.classList.add('vl-feature-nav', 'df-feature-nav--unified')
  controls?.classList.add('vl-control-dock', 'df-controls--unified')
  summary?.classList.add('vl-kpi-row', 'df-summary--unified')
  mainCard?.classList.add('vl-visual-card', 'df-main--unified')
  railCards.forEach((card) => card.classList.add('vl-inspector-card'))
  supportCards.forEach((card) => card.classList.add('vl-section-card'))

  if (subnav && !subnav.querySelector('[href="/twitch/history/"]')) {
    subnav.insertAdjacentHTML('beforeend', '<a class="subnav-link" href="/twitch/history/">History</a>')
  }
}

function ensureDayFlowUnifyStyles(): void {
  if (document.querySelector('#dayflow-unify-styles')) return
  const style = document.createElement('style')
  style.id = 'dayflow-unify-styles'
  style.textContent = `
.df-hero--unified{border-radius:var(--radius-xl);padding:34px;box-shadow:var(--shadow)}
.df-feature-nav--unified{margin-top:18px}.df-controls--unified{display:flex;flex-wrap:wrap;align-items:end;gap:10px;margin-top:18px;padding:12px;border:1px solid var(--border);border-radius:22px;background:rgba(12,21,37,.74)}
.df-controls--unified label{min-width:120px}.df-controls--unified .df-checkbox{align-self:center}.df-summary--unified .summary-card{border-radius:var(--radius-lg)}
.df-main--unified{border-color:var(--border);border-radius:var(--radius-lg);background:var(--card);box-shadow:var(--shadow)}
.vl-inspector-card,.vl-section-card{border-radius:var(--radius-lg)}
@media(max-width:760px){.df-hero--unified{padding:20px}.df-controls--unified{display:grid;grid-template-columns:1fr 1fr}.df-controls--unified label{min-width:0}}
@media(max-width:520px){.df-controls--unified{grid-template-columns:1fr}}
`
  document.head.append(style)
}
