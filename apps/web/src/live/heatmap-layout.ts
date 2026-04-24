const STORAGE_KEY = 'viewloom:twitch-heatmap-layout-mode'
const STYLE_ID = 'twitch-heatmap-layout-style'

type LayoutMode = 'wide' | 'split'

export function initHeatmapLayout(): void {
  ensureStyles()

  const root = document.querySelector<HTMLElement>('#heatmap-layout-root')
  const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-layout-mode]'))
  if (!root || !buttons.length) return

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

function readStoredMode(): LayoutMode {
  return normalizeMode(window.localStorage.getItem(STORAGE_KEY))
}

function normalizeMode(value: string | null | undefined): LayoutMode {
  return value === 'wide' ? 'wide' : 'split'
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
  style.textContent = `.heatmap-layout-root[data-layout-mode='wide'] .feature-layout{grid-template-columns:1fr}.heatmap-layout-root[data-layout-mode='wide'] .rail-stack{grid-template-columns:repeat(2,minmax(0,1fr))}.heatmap-layout-root[data-layout-mode='wide'] .chart-stage--feature{min-height:auto}@media(max-width:1080px){.heatmap-layout-root[data-layout-mode='wide'] .rail-stack{grid-template-columns:1fr}}`
  document.head.appendChild(style)
}
