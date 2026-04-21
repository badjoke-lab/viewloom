const STORAGE_KEY = 'viewloom:twitch-heatmap-layout-mode'
const STYLE_ID = 'twitch-heatmap-layout-style'

type LayoutMode = 'split' | 'theater'

export function initHeatmapLayout(): void {
  ensureStyles()

  const root = document.querySelector<HTMLElement>('#heatmap-layout-root')
  const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-layout-mode]'))
  if (!root || !buttons.length) return

  const storedMode = readStoredMode()
  applyMode(root, buttons, storedMode)

  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      const nextMode = button.dataset.layoutMode === 'theater' ? 'theater' : 'split'
      applyMode(root, buttons, nextMode)
      window.localStorage.setItem(STORAGE_KEY, nextMode)
    })
  })
}

function readStoredMode(): LayoutMode {
  const value = window.localStorage.getItem(STORAGE_KEY)
  return value === 'theater' ? 'theater' : 'split'
}

function applyMode(root: HTMLElement, buttons: HTMLButtonElement[], mode: LayoutMode): void {
  root.dataset.layoutMode = mode
  buttons.forEach((button) => {
    const active = button.dataset.layoutMode === mode
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
    .heatmap-layout-root {
      display: grid;
      gap: 22px;
      margin-top: 22px;
    }
    .heatmap-layout-root .feature-layout,
    .heatmap-layout-root .support-grid {
      margin-top: 0;
    }
    .heatmap-layout-root[data-layout-mode='theater'] .feature-layout {
      grid-template-columns: 1fr;
    }
    .heatmap-layout-root[data-layout-mode='theater'] .rail-stack {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .heatmap-layout-root[data-layout-mode='theater'] .chart-stage--feature {
      min-height: auto;
    }
    @media (max-width: 1080px) {
      .heatmap-layout-root[data-layout-mode='theater'] .rail-stack {
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
    }
  `
  document.head.appendChild(style)
}
