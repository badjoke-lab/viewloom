const STORAGE_KEY = 'viewloom:twitch-heatmap-layout-mode'
const STYLE_ID = 'twitch-heatmap-layout-style'
const LEGACY_WIDE_MODE = 'the' + 'ater'

type LayoutMode = 'wide' | 'split'

export function initHeatmapLayout(): void {
  ensureStyles()

  const root = document.querySelector<HTMLElement>('#heatmap-layout-root')
  const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>('.view-mode-bar__actions button[data-layout-mode]'))
  if (!root || !buttons.length) return

  normalizeLayoutBarCopy(buttons)
  orderLayoutButtons()

  const storedMode = readStoredMode()
  applyMode(root, buttons, storedMode)

  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      const nextMode = normalizeMode(button.dataset.layoutMode)
      applyMode(root, buttons, nextMode)
      window.localStorage.setItem(STORAGE_KEY, nextMode)
    })
  })
}

function normalizeLayoutBarCopy(buttons: HTMLButtonElement[]): void {
  const body = document.querySelector<HTMLElement>('.view-mode-bar__body')
  if (body) {
    body.textContent = 'Wide keeps the visual field large. Split pairs the field with the detail panel.'
  }

  buttons.forEach((button) => {
    const mode = normalizeMode(button.dataset.layoutMode)
    button.dataset.layoutMode = mode
    button.textContent = mode === 'wide' ? 'Wide' : 'Split'
    button.classList.add('layout-toggle')
  })
}

function orderLayoutButtons(): void {
  const actions = document.querySelector<HTMLElement>('.view-mode-bar__actions')
  const wideButton = document.querySelector<HTMLButtonElement>('.view-mode-bar__actions button[data-layout-mode="wide"]')
  const splitButton = document.querySelector<HTMLButtonElement>('.view-mode-bar__actions button[data-layout-mode="split"]')
  if (!actions || !wideButton || !splitButton) return
  actions.append(wideButton, splitButton)
}

function readStoredMode(): LayoutMode {
  return normalizeMode(window.localStorage.getItem(STORAGE_KEY))
}

function normalizeMode(value: string | null | undefined): LayoutMode {
  if (value === 'split') return 'split'
  if (value === 'wide' || value === LEGACY_WIDE_MODE) return 'wide'
  return 'wide'
}

function applyMode(root: HTMLElement, buttons: HTMLButtonElement[], mode: LayoutMode): void {
  root.dataset.layoutMode = mode
  buttons.forEach((button) => {
    const active = normalizeMode(button.dataset.layoutMode) === mode
    button.classList.toggle('is-active', active)
    button.setAttribute('aria-pressed', active ? 'true' : 'false')
  })
}

function ensureStyles(): void {
  if (document.getElementById(STYLE_ID)) return

  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = `
    .view-mode-bar {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 14px;
      align-items: center;
      margin-top: 18px;
      padding: 16px 18px;
      border-radius: 20px;
      border: 1px solid var(--border);
      background: rgba(12, 21, 37, 0.74);
      box-shadow: var(--shadow);
    }
    .view-mode-bar__title {
      margin: 0;
      font-size: 1rem;
    }
    .view-mode-bar__body {
      margin: 6px 0 0;
      color: var(--muted);
      line-height: 1.6;
      font-size: 0.92rem;
    }
    .view-mode-bar__actions {
      display: inline-flex;
      gap: 10px;
      flex-wrap: wrap;
      justify-content: flex-end;
    }
    .layout-toggle {
      min-height: 42px;
      padding: 0 16px;
      border-radius: 999px;
      border: 1px solid rgba(255, 255, 255, 0.08);
      background: rgba(255, 255, 255, 0.05);
      color: var(--muted);
      cursor: pointer;
      transition: background-color 160ms ease, color 160ms ease, border-color 160ms ease;
    }
    .layout-toggle:hover {
      background: rgba(255, 255, 255, 0.1);
      color: var(--text);
    }
    .layout-toggle.is-active {
      background: rgba(var(--accent-rgb), 0.18);
      border-color: rgba(var(--accent-rgb), 0.26);
      color: var(--text);
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 18px;
      margin-top: 22px;
    }
    .summary-card {
      min-height: 150px;
      padding: 20px;
      border-radius: var(--radius-lg);
      border: 1px solid var(--border);
      background: var(--card);
      box-shadow: var(--shadow);
    }
    .summary-card__label {
      color: rgba(var(--accent-rgb), 0.9);
      font-size: 0.78rem;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }
    .summary-card__value {
      margin-top: 10px;
      font-size: clamp(1.4rem, 2.2vw, 2rem);
      line-height: 1.1;
      font-weight: 800;
      color: var(--text);
      word-break: break-word;
    }
    .summary-card p {
      margin: 10px 0 0;
      color: var(--muted);
      line-height: 1.6;
    }
    .heatmap-layout-root {
      display: grid;
      gap: 22px;
      margin-top: 22px;
    }
    .heatmap-layout-root .feature-layout,
    .heatmap-layout-root .support-grid {
      margin-top: 0;
    }
    .heatmap-layout-root[data-layout-mode='wide'] {
      width: min(calc(100vw - 48px), 1560px);
      margin-left: 50%;
      transform: translateX(-50%);
    }
    .heatmap-layout-root[data-layout-mode='wide'] .feature-layout {
      grid-template-columns: 1fr;
    }
    .heatmap-layout-root[data-layout-mode='wide'] .rail-stack {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .heatmap-layout-root[data-layout-mode='wide'] .chart-stage--feature {
      min-height: auto;
      padding: 16px;
    }
    .heatmap-layout-root[data-layout-mode='wide'] .chart-placeholder--heatmap {
      min-height: clamp(560px, 72vh, 780px);
    }
    @media (max-width: 1080px) {
      .summary-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      .heatmap-layout-root[data-layout-mode='wide'] {
        width: min(calc(100vw - 32px), 1280px);
      }
      .heatmap-layout-root[data-layout-mode='wide'] .rail-stack {
        grid-template-columns: 1fr;
      }
    }
    @media (max-width: 760px) {
      .view-mode-bar {
        grid-template-columns: 1fr;
      }
      .view-mode-bar__actions {
        justify-content: stretch;
      }
      .layout-toggle {
        width: 100%;
      }
      .summary-grid {
        grid-template-columns: 1fr;
      }
      .summary-card {
        min-height: auto;
        padding: 18px;
      }
      .heatmap-layout-root[data-layout-mode='wide'] {
        width: min(calc(100vw - 24px), 760px);
      }
      .heatmap-layout-root[data-layout-mode='wide'] .chart-stage--feature {
        padding: 12px;
      }
      .heatmap-layout-root[data-layout-mode='wide'] .chart-placeholder--heatmap {
        min-height: clamp(420px, 68vh, 620px);
      }
    }
  `
  document.head.appendChild(style)
}
