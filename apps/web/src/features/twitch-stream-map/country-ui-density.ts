import './country-ui-density.css'

type CountryUiMap = {
  addLayer(layer: Record<string, unknown>): void
  getLayer(id: string): unknown
  setFilter(layerId: string, filter: unknown[]): void
  on(event: 'mousemove' | 'mouseleave', layerId: string, handler: (event: { features?: Array<{ properties?: Record<string, unknown> | null }> }) => void): void
  jumpTo(options: { center: [number, number]; zoom: number }): void
  setMinZoom(zoom: number): void
  setMaxZoom(zoom: number): void
}

type CountryUiWindow = Window & {
  __viewloomCountryRegionMap?: CountryUiMap
}

const REGION_SOURCE_ID = 'viewloom-country-regions'
const REGION_FILL_LAYER_ID = 'viewloom-country-regions-fill'
const REGION_HOVER_LAYER_ID = 'viewloom-country-regions-hover'
const WORLD_CENTER: [number, number] = [10, 18]
const DESKTOP_WORLD_ZOOM = 1.15
const MOBILE_WORLD_ZOOM = 0
const COUNTRY_MAX_ZOOM = 4.2
const BUCKET_COLORS = ['#302447', '#44305f', '#604084', '#7f53aa', '#aa70dd'] as const

const requestedCity = new URL(window.location.href).searchParams.get('geography') === 'city'

if (!requestedCity) bootCountryUiV2()

function bootCountryUiV2(): void {
  const run = () => {
    document.documentElement.classList.add('stream-map-country-ui-v2')
    reorderCountrySections()
    compactStaticCopy()
    installMobileFilterToggle()
    installRegionToolbar()
    installSelectedCountryStrip()
    installStreamEvidenceDisclosure()
    installUnmappedDisclosure()
    configureCountryCamera()
    installHoverOutline()
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run, { once: true })
  else run()
}

function reorderCountrySections(): void {
  const shell = document.querySelector<HTMLElement>('.stream-map-shell')
  const support = document.querySelector<HTMLElement>('.stream-map-support-grid')
  const interactionNote = shell?.querySelector<HTMLElement>('.stream-map-interaction-note')
  if (shell && support) shell.insertBefore(support, interactionNote ?? null)

  const results = document.querySelector<HTMLElement>('.stream-map-results')
  const unmapped = document.querySelector<HTMLElement>('.stream-map-unmapped')
  const selected = document.getElementById('stream-map-selected-country')
  const host = unmapped?.parentElement
  if (host && results && unmapped) host.insertBefore(results, unmapped)
  if (host && selected && results) host.insertBefore(selected, results)
}

function compactStaticCopy(): void {
  const lede = document.querySelector<HTMLElement>('.page-head--stream-map .lede')
  if (lede) lede.textContent = 'Evidence-backed geography for the selected Twitch population. Unknown, conflicting and rejected locations remain unmapped.'

  const mapCopy = document.querySelector<HTMLElement>('.stream-map-shell__head p')
  if (mapCopy) mapCopy.textContent = 'Hover for country totals. Click or tap a country to select its mapped streams. Selection does not move the map.'

  const interaction = document.querySelector<HTMLElement>('.stream-map-interaction-note')
  if (interaction) interaction.textContent = 'Drag to move. Use the visible +/− controls or gestures to zoom. World view returns to the full map without clearing the selected country.'

  const resultsCopy = document.querySelector<HTMLElement>('.stream-map-results__head p')
  if (resultsCopy) resultsCopy.textContent = 'Map and country-list selection stay synchronized. Stream evidence remains available on demand.'
}

function installMobileFilterToggle(): void {
  if (document.querySelector('[data-stream-map-filter-toggle]')) return
  const population = document.querySelector<HTMLElement>('.stream-map-population-panel')
  if (!population) return
  population.id ||= 'stream-map-population-filters'
  const evidence = document.querySelector<HTMLElement>('.stream-map-filter-panel')
  if (evidence) evidence.id ||= 'stream-map-evidence-filters'

  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'stream-map-mobile-filter-toggle'
  button.dataset.streamMapFilterToggle = ''
  button.setAttribute('aria-expanded', 'false')
  button.setAttribute('aria-controls', 'stream-map-population-filters stream-map-evidence-filters')
  button.textContent = 'Filters'
  button.addEventListener('click', () => {
    const expanded = !document.documentElement.classList.contains('stream-map-filters-open')
    document.documentElement.classList.toggle('stream-map-filters-open', expanded)
    button.setAttribute('aria-expanded', String(expanded))
    button.textContent = expanded ? 'Hide filters' : 'Filters'
  })
  population.before(button)
}

function installRegionToolbar(): void {
  const attempt = () => {
    const controls = document.querySelector<HTMLElement>('[data-stream-map-region-controls]')
    const select = controls?.querySelector<HTMLSelectElement>('.stream-map-region-controls__metric select')
    if (!controls || !select) {
      window.setTimeout(attempt, 40)
      return
    }
    if (controls.dataset.countryUiV2 === 'true') return
    controls.dataset.countryUiV2 = 'true'

    const label = controls.querySelector<HTMLElement>('.stream-map-region-controls__label')
    if (label) label.textContent = 'Intensity'
    select.classList.add('stream-map-region-controls__native-select')

    const toggle = document.createElement('div')
    toggle.className = 'stream-map-metric-toggle'
    toggle.setAttribute('role', 'group')
    toggle.setAttribute('aria-label', 'Country intensity metric')
    for (const value of ['streams', 'viewers'] as const) {
      const button = document.createElement('button')
      button.type = 'button'
      button.dataset.countryMetric = value
      button.textContent = value === 'streams' ? 'Streams' : 'Viewers'
      button.addEventListener('click', () => {
        if (select.value === value) return
        select.value = value
        select.dispatchEvent(new Event('change', { bubbles: true }))
      })
      toggle.append(button)
    }
    select.after(toggle)

    const legend = document.createElement('div')
    legend.className = 'stream-map-country-legend'
    legend.setAttribute('aria-label', 'Intensity legend from low to high')
    const low = document.createElement('span')
    low.textContent = 'Low'
    legend.append(low)
    for (const color of BUCKET_COLORS) {
      const swatch = document.createElement('i')
      swatch.style.background = color
      swatch.setAttribute('aria-hidden', 'true')
      legend.append(swatch)
    }
    const high = document.createElement('span')
    high.textContent = 'High'
    legend.append(high)

    const world = document.createElement('button')
    world.type = 'button'
    world.className = 'stream-map-world-view'
    world.dataset.countryWorldView = ''
    world.textContent = 'World view'
    world.addEventListener('click', resetWorldCamera)

    controls.append(legend, world)

    const syncMetric = () => {
      for (const button of toggle.querySelectorAll<HTMLButtonElement>('[data-country-metric]')) {
        const active = button.dataset.countryMetric === select.value
        button.classList.toggle('is-active', active)
        button.setAttribute('aria-pressed', String(active))
      }
    }
    select.addEventListener('change', syncMetric)
    syncMetric()
  }
  attempt()
}

function configureCountryCamera(): void {
  const attempt = () => {
    const map = (window as CountryUiWindow).__viewloomCountryRegionMap
    if (!map) {
      window.setTimeout(attempt, 40)
      return
    }
    map.setMinZoom(0)
    map.setMaxZoom(COUNTRY_MAX_ZOOM)
    const root = document.getElementById('stream-map-root')
    if (root?.dataset.countryUiCameraInitialized === 'true') return
    if (root) root.dataset.countryUiCameraInitialized = 'true'
    if (window.innerWidth <= 720) resetWorldCamera()
  }
  attempt()
}

function resetWorldCamera(): void {
  const map = (window as CountryUiWindow).__viewloomCountryRegionMap
  if (!map) return
  map.setMinZoom(0)
  map.setMaxZoom(COUNTRY_MAX_ZOOM)
  map.jumpTo({
    center: WORLD_CENTER,
    zoom: window.innerWidth <= 720 ? MOBILE_WORLD_ZOOM : DESKTOP_WORLD_ZOOM,
  })
  const root = document.getElementById('stream-map-root')
  if (root) {
    root.dataset.countryCamera = 'world'
    root.dataset.countryCameraMode = 'explicit-world-view'
  }
}

function installHoverOutline(): void {
  let attempts = 0
  const attempt = () => {
    const map = (window as CountryUiWindow).__viewloomCountryRegionMap
    attempts += 1
    if (!map || !map.getLayer(REGION_FILL_LAYER_ID)) {
      if (attempts < 200) window.setTimeout(attempt, 50)
      return
    }
    if (!map.getLayer(REGION_HOVER_LAYER_ID)) {
      map.addLayer({
        id: REGION_HOVER_LAYER_ID,
        type: 'line',
        source: REGION_SOURCE_ID,
        filter: ['==', ['get', 'viewloomCountryCode'], '__none__'],
        paint: {
          'line-color': '#ffffff',
          'line-width': 1.8,
          'line-opacity': 0.95,
        },
      })
    }
    map.on('mousemove', REGION_FILL_LAYER_ID, (event) => {
      const code = validCountryCode(event.features?.[0]?.properties?.viewloomCountryCode)
      map.setFilter(REGION_HOVER_LAYER_ID, ['==', ['get', 'viewloomCountryCode'], code || '__none__'])
    })
    map.on('mouseleave', REGION_FILL_LAYER_ID, () => {
      map.setFilter(REGION_HOVER_LAYER_ID, ['==', ['get', 'viewloomCountryCode'], '__none__'])
    })
  }
  attempt()
}

function installSelectedCountryStrip(): void {
  const panel = document.getElementById('stream-map-selected-country')
  if (!panel || panel.dataset.countryUiV2 === 'true') return
  panel.dataset.countryUiV2 = 'true'

  const head = panel.querySelector<HTMLElement>('.stream-map-selected-country__head')
  const titleBlock = head?.firstElementChild as HTMLElement | null
  const clear = panel.querySelector<HTMLButtonElement>('[data-clear-selected-country]')
  if (!head || !titleBlock || !clear) return

  const summary = document.createElement('span')
  summary.className = 'stream-map-selected-country__summary'
  summary.dataset.selectedCountrySummary = ''
  titleBlock.append(summary)

  const actions = document.createElement('div')
  actions.className = 'stream-map-selected-country__actions'
  const showStreams = document.createElement('button')
  showStreams.type = 'button'
  showStreams.className = 'stream-map-filter-clear stream-map-show-streams'
  showStreams.dataset.showSelectedCountryStreams = ''
  showStreams.textContent = 'Show streams'
  showStreams.addEventListener('click', () => {
    const results = document.querySelector<HTMLElement>('.stream-map-results')
    const streamList = document.getElementById('stream-map-stream-list')
    results?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    if (streamList) {
      streamList.tabIndex = -1
      window.setTimeout(() => streamList.focus({ preventScroll: true }), 350)
    }
  })
  actions.append(showStreams, clear)
  head.append(actions)

  let queued = false
  const update = () => {
    queued = false
    const streams = clean(document.getElementById('stream-map-selected-country-streams')?.textContent) || '0'
    const viewers = clean(document.getElementById('stream-map-selected-country-viewers')?.textContent) || '0'
    const next = `${streams} stream${streams === '1' ? '' : 's'} · ${viewers} viewers`
    if (summary.textContent !== next) summary.textContent = next
  }
  const schedule = () => {
    if (queued) return
    queued = true
    queueMicrotask(update)
  }
  new MutationObserver(schedule).observe(panel, { childList: true, subtree: true, characterData: true })
  update()
}

function installStreamEvidenceDisclosure(): void {
  const list = document.getElementById('stream-map-stream-list')
  if (!list) return

  const compact = () => {
    for (const evidence of list.querySelectorAll<HTMLElement>('.stream-map-evidence-list')) {
      if (evidence.parentElement?.classList.contains('stream-map-evidence-details')) continue
      const count = evidence.querySelectorAll('.stream-map-evidence-row').length
      const details = document.createElement('details')
      details.className = 'stream-map-evidence-details'
      const summary = document.createElement('summary')
      summary.textContent = `Evidence · ${count}`
      evidence.before(details)
      details.append(summary, evidence)
    }
  }

  let queued = false
  const schedule = () => {
    if (queued) return
    queued = true
    queueMicrotask(() => {
      queued = false
      compact()
    })
  }
  new MutationObserver(schedule).observe(list, { childList: true, subtree: true })
  compact()
}

function installUnmappedDisclosure(): void {
  const section = document.querySelector<HTMLElement>('.stream-map-unmapped')
  if (!section || section.dataset.countryUiV2 === 'true') return
  section.dataset.countryUiV2 = 'true'

  const compactHead = document.createElement('div')
  compactHead.className = 'stream-map-unmapped-compact'
  const title = document.createElement('strong')
  title.textContent = 'Why streams are unmapped'
  const summary = document.createElement('span')
  summary.dataset.unmappedCompactSummary = ''
  summary.textContent = 'Loading reason accounting…'
  const toggle = document.createElement('button')
  toggle.type = 'button'
  toggle.className = 'stream-map-filter-clear'
  toggle.dataset.unmappedDetailsToggle = ''
  toggle.setAttribute('aria-expanded', 'false')
  toggle.textContent = 'Details'
  toggle.addEventListener('click', () => {
    const expanded = !section.classList.contains('is-expanded')
    section.classList.toggle('is-expanded', expanded)
    toggle.setAttribute('aria-expanded', String(expanded))
    toggle.textContent = expanded ? 'Hide details' : 'Details'
  })
  compactHead.append(title, summary, toggle)
  section.prepend(compactHead)

  const update = () => {
    const current = clean(document.getElementById('stream-map-unmapped-current')?.textContent)
    const reasons = [...section.querySelectorAll<HTMLElement>('.stream-map-unmapped-reason-row')]
      .slice(0, 2)
      .map((row) => {
        const label = clean(row.querySelector('.stream-map-unmapped-reason-copy strong')?.textContent)
        const count = clean(row.querySelector('.stream-map-unmapped-reason-count')?.textContent)
        return label && count ? `${label} ${count}` : ''
      })
      .filter(Boolean)
    const next = [current ? `${current} unmapped` : '', ...reasons].filter(Boolean).join(' · ') || 'No unmapped streams in this view'
    if (summary.textContent !== next) summary.textContent = next
  }

  let queued = false
  const schedule = () => {
    if (queued) return
    queued = true
    queueMicrotask(() => {
      queued = false
      update()
    })
  }
  new MutationObserver(schedule).observe(section, { childList: true, subtree: true, characterData: true })
  update()
}

function validCountryCode(value: unknown): string {
  const code = typeof value === 'string' ? value.trim().toUpperCase() : ''
  return /^[A-Z]{2}$/.test(code) ? code : ''
}

function clean(value: unknown): string {
  return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : ''
}

export {}
