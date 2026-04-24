const STORAGE_KEY = 'viewloom:twitch-heatmap-layout-mode'
const STYLE_ID = 'twitch-heatmap-layout-style'
const LEGACY_WIDE_MODE = 'the' + 'ater'

type LayoutMode = 'wide' | 'split'

export function initHeatmapLayout(): void {
  ensureStyles()

  const root = document.querySelector<HTMLElement>('#heatmap-layout-root')
  const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-layout-mode]'))
  if (!root || !buttons.length) return

  normalizeLayoutBarCopy(buttons)

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
  })
}

function readStoredMode(): LayoutMode {
  return normalizeMode(window.localStorage.getItem(STORAGE_KEY))
}

function normalizeMode(value: string | null | undefined): LayoutMode {
  if (value === 'wide' || value === LEGACY_WIDE_MODE) return 'wide'
  return 'split'
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
  style.textContent = `.heatmap-layout-root[data-layout-mode='wide']{width:min(calc(100vw - 48px),1560px);margin-left:50%;transform:translateX(-50%)}.heatmap-layout-root[data-layout-mode='wide'] .feature-layout{grid-template-columns:1fr}.heatmap-layout-root[data-layout-mode='wide'] .rail-stack{grid-template-columns:repeat(2,minmax(0,1fr))}.heatmap-layout-root[data-layout-mode='wide'] .chart-stage--feature{min-height:auto;padding:16px}.heatmap-layout-root[data-layout-mode='wide'] .chart-placeholder--heatmap{min-height:clamp(560px,72vh,780px)}@media(max-width:1080px){.heatmap-layout-root[data-layout-mode='wide']{width:min(calc(100vw - 32px),1280px)}.heatmap-layout-root[data-layout-mode='wide'] .rail-stack{grid-template-columns:1fr}}@media(max-width:760px){.heatmap-layout-root[data-layout-mode='wide']{width:min(calc(100vw - 24px),760px)}.heatmap-layout-root[data-layout-mode='wide'] .chart-stage--feature{padding:12px}.heatmap-layout-root[data-layout-mode='wide'] .chart-placeholder--heatmap{min-height:clamp(420px,68vh,620px)}}`
  document.head.appendChild(style)
}
