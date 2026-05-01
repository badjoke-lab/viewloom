const isLinesPage = document.body.dataset.page === 'twitch-battle-lines'

if (isLinesPage) {
  window.requestAnimationFrame(() => {
    ensureLinesUnifyStyles()
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

function ensureLinesUnifyStyles(): void {
  if (document.querySelector('#lines-unify-styles')) return
  const style = document.createElement('style')
  style.id = 'lines-unify-styles'
  style.textContent = `
.bl-hero--unified{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(300px,.72fr);gap:24px;align-items:start;background:linear-gradient(180deg,rgba(12,21,37,.88),rgba(9,16,29,.86));border:1px solid var(--border);border-radius:var(--radius-xl);padding:34px;box-shadow:var(--shadow)}
.bl-hero--unified h1{margin:10px 0 0;font-size:clamp(2.6rem,5vw,4.6rem);line-height:.94}
.bl-hero--unified p{margin:16px 0 0;line-height:1.7}.bl-controls--unified{margin-top:18px;padding:12px;border:1px solid var(--border);border-radius:22px;background:rgba(12,21,37,.74)}
.bl-status--unified,.bl-chart-card--unified,.bl-section--unified,.bl-summary--unified{border-color:var(--border);border-radius:var(--radius-lg);background:var(--card);box-shadow:var(--shadow)}
.vl-data-quality-note{border:1px solid var(--border);border-radius:var(--radius-lg);background:var(--card);color:var(--muted)}
@media(max-width:1040px){.bl-hero--unified{grid-template-columns:1fr}}
@media(max-width:760px){.bl-hero--unified{padding:20px}.bl-controls--unified{grid-template-columns:1fr 1fr}}
@media(max-width:520px){.bl-controls--unified{grid-template-columns:1fr}}
`
  document.head.append(style)
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
