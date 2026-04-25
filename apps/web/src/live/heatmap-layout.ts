const STYLE_ID = 'twitch-heatmap-layout-style'

export function initHeatmapLayout(): void {
  ensureStyles()

  const root = document.querySelector<HTMLElement>('#heatmap-layout-root')
  if (!root) return

  root.dataset.layoutMode = 'wide'
  removeLayoutModeBar()
  moveHeatmapSections(root)
}

function removeLayoutModeBar(): void {
  document.querySelector<HTMLElement>('.view-mode-bar')?.remove()
}

function moveHeatmapSections(root: HTMLElement): void {
  const featureLayout = root.querySelector<HTMLElement>('.feature-layout--heatmap')
  const summaryGrid = document.querySelector<HTMLElement>('.summary-grid')
  const railStack = featureLayout?.querySelector<HTMLElement>('.rail-stack') ?? null
  const supportGrid = root.querySelector<HTMLElement>('.support-grid--feature')

  if (featureLayout && summaryGrid && summaryGrid.parentElement !== root) {
    featureLayout.after(summaryGrid)
  }

  if (railStack && railStack.parentElement !== root) {
    if (summaryGrid?.parentElement === root) {
      summaryGrid.after(railStack)
    } else if (featureLayout) {
      featureLayout.after(railStack)
    } else {
      root.append(railStack)
    }
  }

  if (supportGrid) {
    root.append(supportGrid)
  }
}

function ensureStyles(): void {
  if (document.getElementById(STYLE_ID)) return

  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = `
    .page-shell--site.theme-twitch .hero--feature {
      min-height: auto;
      padding: clamp(28px, 4vw, 52px);
      margin-top: 10px;
    }
    .page-shell--site.theme-twitch .hero--feature h1 {
      font-size: clamp(3rem, 6vw, 5.4rem);
    }
    .page-shell--site.theme-twitch .hero--feature .hero-copy {
      max-width: 760px;
      margin-top: 14px;
    }
    .page-shell--site.theme-twitch .hero--feature .status-panel {
      min-height: auto;
      align-self: center;
      padding: 22px 24px;
    }
    .page-shell--site.theme-twitch .site-subnav {
      margin-top: 18px;
      min-height: 56px;
    }
    .view-mode-bar {
      display: none !important;
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 14px;
      margin-top: 0;
    }
    .summary-card {
      min-height: 124px;
      padding: 17px 18px;
      border-radius: var(--radius-lg);
      border: 1px solid var(--border);
      background: var(--card);
      box-shadow: 0 16px 44px rgba(0, 0, 0, 0.18);
    }
    .summary-card__label {
      color: rgba(var(--accent-rgb), 0.9);
      font-size: 0.72rem;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }
    .summary-card__value {
      margin-top: 8px;
      font-size: clamp(1.3rem, 1.8vw, 1.8rem);
      line-height: 1.1;
      font-weight: 800;
      color: var(--text);
      word-break: break-word;
    }
    .summary-card p {
      margin: 8px 0 0;
      color: var(--muted);
      line-height: 1.45;
      font-size: 0.9rem;
    }
    .heatmap-layout-root {
      display: grid;
      gap: 18px;
      margin-top: 18px;
    }
    .heatmap-layout-root .feature-layout,
    .heatmap-layout-root .support-grid,
    .heatmap-layout-root .rail-stack {
      margin-top: 0;
    }
    .heatmap-layout-root[data-layout-mode='wide'] {
      width: min(calc(100vw - 40px), 1600px);
      margin-left: 50%;
      transform: translateX(-50%);
    }
    .heatmap-layout-root[data-layout-mode='wide'] .feature-layout {
      grid-template-columns: 1fr;
    }
    .heatmap-layout-root[data-layout-mode='wide'] > .rail-stack {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 22px;
    }
    .heatmap-layout-root[data-layout-mode='wide'] .chart-stage--feature {
      min-height: auto;
      padding: 14px;
    }
    .heatmap-layout-root[data-layout-mode='wide'] .chart-stage__label {
      margin-bottom: 6px;
    }
    .heatmap-layout-root[data-layout-mode='wide'] .chart-stage--feature h2 {
      margin-bottom: 6px;
    }
    .heatmap-layout-root[data-layout-mode='wide'] .chart-stage--feature p {
      margin-bottom: 14px;
      max-width: 880px;
    }
    .heatmap-layout-root[data-layout-mode='wide'] .chart-placeholder--heatmap {
      min-height: clamp(620px, 74vh, 820px);
    }
    .heatmap-layout-root[data-layout-mode='wide'] .rail-card,
    .heatmap-layout-root[data-layout-mode='wide'] .support-card {
      min-height: auto;
    }
    @media (max-width: 1080px) {
      .page-shell--site.theme-twitch .hero--feature {
        grid-template-columns: 1fr;
      }
      .summary-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      .heatmap-layout-root[data-layout-mode='wide'] {
        width: min(calc(100vw - 32px), 1280px);
      }
      .heatmap-layout-root[data-layout-mode='wide'] > .rail-stack {
        grid-template-columns: 1fr;
      }
    }
    @media (max-width: 760px) {
      .page-shell--site.theme-twitch .hero--feature {
        padding: 24px;
      }
      .summary-grid {
        grid-template-columns: 1fr;
      }
      .summary-card {
        min-height: auto;
        padding: 16px;
      }
      .heatmap-layout-root {
        gap: 14px;
        margin-top: 14px;
      }
      .heatmap-layout-root[data-layout-mode='wide'] {
        width: min(calc(100vw - 24px), 760px);
      }
      .heatmap-layout-root[data-layout-mode='wide'] .chart-stage--feature {
        padding: 12px;
      }
      .heatmap-layout-root[data-layout-mode='wide'] .chart-stage--feature p {
        margin-bottom: 10px;
      }
      .heatmap-layout-root[data-layout-mode='wide'] .chart-placeholder--heatmap {
        min-height: clamp(460px, 70vh, 660px);
      }
    }
  `
  document.head.appendChild(style)
}
