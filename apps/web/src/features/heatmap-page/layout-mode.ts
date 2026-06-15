export type HeatmapLayoutMode = 'wide' | 'split'

const STORAGE_KEY = 'viewloom.heatmap.layout'
const QUERY_KEY = 'layout'
const MOBILE_WIDE_QUERY = '(max-width: 760px)'

export function installHeatmapLayoutMode(): () => void {
  const root = document.querySelector<HTMLElement>('#heatmap-layout-root')
  const controls = document.querySelector<HTMLElement>('[data-heatmap-layout-controls]')
  if (!root || !controls) return () => undefined

  const media = window.matchMedia(MOBILE_WIDE_QUERY)
  let mode = media.matches ? 'wide' : readInitialMode()
  const buttons = Array.from(controls.querySelectorAll<HTMLButtonElement>('[data-heatmap-layout]'))

  const syncMobileAvailability = (): void => {
    for (const button of buttons) {
      const split = button.dataset.heatmapLayout === 'split'
      button.disabled = media.matches && split
      button.hidden = media.matches && split
      button.setAttribute('aria-disabled', media.matches && split ? 'true' : 'false')
    }
    controls.dataset.mobileWideOnly = media.matches ? 'true' : 'false'
  }

  const apply = (next: HeatmapLayoutMode, persist: boolean): void => {
    const resolved: HeatmapLayoutMode = media.matches ? 'wide' : next
    mode = resolved
    root.dataset.layout = resolved
    document.body.dataset.heatmapLayout = resolved

    for (const button of buttons) {
      const active = button.dataset.heatmapLayout === resolved
      button.classList.toggle('active', active)
      button.setAttribute('aria-pressed', active ? 'true' : 'false')
    }

    document.querySelectorAll<HTMLElement>('.head-facts .fact').forEach((fact) => {
      if (fact.querySelector('small')?.textContent?.trim().toLowerCase() !== 'view') return
      const value = fact.querySelector<HTMLElement>('strong')
      if (value) value.textContent = resolved === 'wide' ? 'Wide' : 'Split'
    })

    if (persist) {
      window.localStorage.setItem(STORAGE_KEY, resolved)
      const url = new URL(window.location.href)
      url.searchParams.set(QUERY_KEY, resolved)
      window.history.replaceState({}, '', url)
    }

    window.dispatchEvent(new CustomEvent('viewloom:heatmap-layout-change', {
      detail: { mode: resolved, mobileWideOnly: media.matches },
    }))
  }

  const onClick = (event: Event): void => {
    const button = (event.target as Element | null)?.closest<HTMLButtonElement>('[data-heatmap-layout]')
    if (!button || button.disabled) return
    const next = normalizeMode(button.dataset.heatmapLayout)
    if (!next || next === mode) return
    apply(next, true)
  }

  const onMediaChange = (): void => {
    syncMobileAvailability()
    if (media.matches && mode !== 'wide') apply('wide', true)
    else apply(mode, false)
  }

  controls.addEventListener('click', onClick)
  media.addEventListener('change', onMediaChange)
  syncMobileAvailability()
  apply(mode, media.matches && readInitialMode() !== 'wide')

  return () => {
    controls.removeEventListener('click', onClick)
    media.removeEventListener('change', onMediaChange)
  }
}

function readInitialMode(): HeatmapLayoutMode {
  const params = new URLSearchParams(window.location.search)
  const queryMode = normalizeMode(params.get(QUERY_KEY))
  if (queryMode) return queryMode

  const savedMode = normalizeMode(window.localStorage.getItem(STORAGE_KEY))
  if (savedMode) return savedMode

  return 'wide'
}

function normalizeMode(value: string | null | undefined): HeatmapLayoutMode | null {
  if (value === 'split') return 'split'
  if (value === 'wide' || value === 'theater') return 'wide'
  return null
}
