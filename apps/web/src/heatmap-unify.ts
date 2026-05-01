const isHeatmapPage = document.body.dataset.page === 'twitch-heatmap'

if (isHeatmapPage) {
  window.requestAnimationFrame(() => {
    ensureHeatmapUnifyStyles()
    applyHeatmapUiUnification()
  })
}

function applyHeatmapUiUnification(): void {
  const hero = document.querySelector<HTMLElement>('.hero--feature')
  const subnav = document.querySelector<HTMLElement>('.site-subnav')
  const viewMode = document.querySelector<HTMLElement>('.view-mode-bar')
  const summary = document.querySelector<HTMLElement>('.summary-grid')
  const layoutRoot = document.querySelector<HTMLElement>('#heatmap-layout-root')
  const chartStage = document.querySelector<HTMLElement>('#heatmap-layout-root .chart-stage')
  const railCards = document.querySelectorAll<HTMLElement>('#heatmap-layout-root .rail-card')
  const supportCards = document.querySelectorAll<HTMLElement>('#heatmap-layout-root .support-card')

  hero?.classList.add('vl-page-hero', 'hm-hero--unified')
  subnav?.classList.add('vl-feature-nav', 'hm-feature-nav--unified')
  viewMode?.classList.add('vl-control-dock', 'hm-control-dock--unified')
  summary?.classList.add('vl-kpi-row', 'hm-summary--unified')
  layoutRoot?.classList.add('hm-layout--unified')
  chartStage?.classList.add('vl-visual-card', 'hm-visual-card--unified')
  railCards.forEach((card) => card.classList.add('vl-inspector-card'))
  supportCards.forEach((card) => card.classList.add('vl-section-card'))

  if (subnav && !subnav.querySelector('[href="/twitch/history/"]')) {
    subnav.insertAdjacentHTML('beforeend', '<a class="subnav-link" href="/twitch/history/">History</a>')
  }

  if (layoutRoot && !layoutRoot.querySelector('.hm-data-quality-note')) {
    layoutRoot.insertAdjacentHTML('beforeend', '<section class="vl-data-quality-note hm-data-quality-note"><p>This page shows observed data only. Coverage may be partial when collection limits are reached or some buckets are missing.</p></section>')
  }
}

function ensureHeatmapUnifyStyles(): void {
  if (document.querySelector('#heatmap-unify-styles')) return
  const style = document.createElement('style')
  style.id = 'heatmap-unify-styles'
  style.textContent = `
.hm-hero--unified{border-radius:var(--radius-xl);padding:34px;box-shadow:var(--shadow)}
.hm-feature-nav--unified{margin-top:18px}.hm-control-dock--unified{display:flex;justify-content:space-between;align-items:center;gap:14px;margin-top:18px;padding:12px;border:1px solid var(--border);border-radius:22px;background:rgba(12,21,37,.74)}
.hm-control-dock--unified .view-mode-bar__title{margin:0}.hm-control-dock--unified .view-mode-bar__body{margin:4px 0 0;color:var(--muted)}
.hm-summary--unified .summary-card{border-radius:var(--radius-lg)}.hm-visual-card--unified{border-color:var(--border);border-radius:var(--radius-lg);background:var(--card);box-shadow:var(--shadow)}
.hm-layout--unified .vl-inspector-card,.hm-layout--unified .vl-section-card{border-radius:var(--radius-lg)}.hm-data-quality-note{margin-top:18px;border:1px solid var(--border);border-radius:var(--radius-lg);background:var(--card);padding:16px;color:var(--muted)}.hm-data-quality-note p{margin:0}
@media(max-width:760px){.hm-hero--unified{padding:20px}.hm-control-dock--unified{display:grid;grid-template-columns:1fr}.hm-control-dock--unified .view-mode-bar__actions{justify-content:start}}
`
  document.head.append(style)
}
