import { buildKickCountryPreviewModel, type KickCountryPreviewModel } from './country-preview-model.mjs'
import { buildKickCityPreviewModel, type KickCityPreviewModel } from './city-preview-model.mjs'
import type { KickCountryPreviewMapController } from './country-preview-map'
import type { KickCityPreviewMapController } from './city-preview-map'

type GeographyMode = 'country' | 'city'
type Metric = 'streams' | 'viewers'

type ReferenceGeometry = {
  state?: string
  referenceKey?: string | null
  semantics?: string
  referencePoint?: { longitude?: number; latitude?: number } | null
}

type KickRow = {
  slug?: string
  displayName?: string
  viewers?: number
  url?: string
  geography?: {
    mode?: string
    state?: string
    reason?: string
    countryCode?: string | null
    region?: string | null
    city?: string | null
    cityAggregateKey?: string | null
    referenceGeometry?: ReferenceGeometry | null
  }
}

type CityAggregate = {
  cityAggregateKey?: string
  countryCode?: string
  region?: string | null
  city?: string
  streams?: number
  viewers?: number
  referenceGeometry?: ReferenceGeometry | null
}

type KickPayload = {
  version?: string
  provider?: string
  platform?: string
  source?: string
  geographyMode?: string
  state?: string
  updatedAt?: string | null
  publicActivationAuthorized?: boolean
  publicCityActivationAuthorized?: boolean
  activation?: {
    publicCountryActivationReady?: boolean
    publicCityActivationReady?: boolean
    blockers?: string[]
  }
  identity?: Record<string, any>
  coverage?: Record<string, any>
  semantics?: Record<string, any>
  cityAggregates?: CityAggregate[]
  mappedStreams?: KickRow[]
  unmappedStreams?: KickRow[]
  excludedStreams?: KickRow[]
  conflictStreams?: KickRow[]
}

type PopulationRow = KickRow & { bucket: 'mapped' | 'unmapped' | 'excluded' | 'conflict' }

const root = document.querySelector<HTMLElement>('[data-kick-map-public]')
if (!root) throw new Error('Kick Stream Map public root is missing')

const mapRoot = document.querySelector<HTMLElement>('#stream-map-root')
const mapStatus = document.querySelector<HTMLElement>('[data-kick-stream-map-status]')
const populationTop = document.querySelector<HTMLSelectElement>('[data-population-top]')
const populationMinViewers = document.querySelector<HTMLSelectElement>('[data-population-min-viewers]')
const resetPopulation = document.querySelector<HTMLButtonElement>('[data-reset-population-filters]')
const clearSelection = document.querySelector<HTMLButtonElement>('[data-clear-selected-country]')
const metricButtons = [...document.querySelectorAll<HTMLButtonElement>('[data-kick-metric]')]
const worldButton = document.querySelector<HTMLButtonElement>('[data-kick-world]')
const geographyButtons = [...document.querySelectorAll<HTMLButtonElement>('.stream-map-geography-options button')]
const countryButton = geographyButtons.find((button) => button.textContent?.trim() === 'Country') ?? null
const cityButton = geographyButtons.find((button) => button.textContent?.trim() === 'City') ?? null

const payloads = new Map<GeographyMode, KickPayload>()
let mode: GeographyMode = modeFromUrl()
let countryModel: KickCountryPreviewModel | null = null
let cityModel: KickCityPreviewModel | null = null
let countryMapController: KickCountryPreviewMapController | null = null
let cityMapController: KickCityPreviewMapController | null = null
let selectedCountryCode: string | null = null
let selectedCityKey: string | null = null
let metric: Metric = 'viewers'
let mapRenderId = 0

prepareGeographyControls()

for (const select of [populationTop, populationMinViewers]) select?.addEventListener('change', () => void render())
resetPopulation?.addEventListener('click', () => {
  if (populationTop) populationTop.value = '100'
  if (populationMinViewers) populationMinViewers.value = '0'
  void render()
})
clearSelection?.addEventListener('click', () => clearCurrentSelection())
worldButton?.addEventListener('click', () => clearCurrentSelection())
for (const button of metricButtons) {
  button.addEventListener('click', () => {
    metric = button.dataset.kickMetric === 'streams' ? 'streams' : 'viewers'
    for (const candidate of metricButtons) candidate.dataset.active = String(candidate === button)
    countryMapController?.setMetric(metric)
    cityMapController?.setMetric(metric)
  })
}
mapRoot?.addEventListener('kick-country-select', (event) => {
  if (mode !== 'country') return
  const code = (event as CustomEvent<{ countryCode?: string }>).detail?.countryCode
  selectCountry(code || null)
})
mapRoot?.addEventListener('kick-city-select', (event) => {
  if (mode !== 'city') return
  const key = (event as CustomEvent<{ cityAggregateKey?: string }>).detail?.cityAggregateKey
  selectCity(key || null)
})
window.addEventListener('popstate', () => {
  const next = modeFromUrl()
  if (next !== mode) void switchMode(next, false)
})

void boot()

async function boot(): Promise<void> {
  await switchMode(mode, false)
}

function prepareGeographyControls(): void {
  if (countryButton) {
    countryButton.disabled = false
    countryButton.removeAttribute('aria-disabled')
    countryButton.dataset.kickGeography = 'country'
  }
  if (cityButton) {
    cityButton.disabled = false
    cityButton.removeAttribute('aria-disabled')
    cityButton.dataset.kickGeography = 'city'
  }
  countryButton?.addEventListener('click', () => void switchMode('country', true))
  cityButton?.addEventListener('click', () => void switchMode('city', true))
  const copy = document.querySelector<HTMLElement>('.stream-map-geography-copy p')
  if (copy) copy.textContent = 'Country is the default. City uses a separate reviewed Base City contract. Current / IRL remains unavailable.'
  const evidence = document.querySelector<HTMLElement>('.stream-map-fixed-evidence p')
  if (evidence) evidence.textContent = 'Stable broadcaster IDs are used only for internal provider-separated joins. Country and Base City never infer Current / IRL, address, or creator coordinates.'
}

async function switchMode(next: GeographyMode, updateHistory: boolean): Promise<void> {
  mode = next
  selectedCountryCode = null
  selectedCityKey = null
  updateModeControls()
  if (updateHistory) updateUrl(next)
  setState('Loading')
  showMapStatus(`Loading live Kick ${next === 'city' ? 'City' : 'Country'} geography…`, 'No demo geography will be substituted.')
  if (!payloads.has(next)) {
    try {
      payloads.set(next, await loadPayload(next))
    } catch (error) {
      renderFailure(error instanceof Error ? error.message : String(error))
      return
    }
  }
  await render()
}

async function loadPayload(next: GeographyMode): Promise<KickPayload> {
  const endpoint = next === 'city' ? '/api/kick-stream-map?geography=city' : '/api/kick-stream-map'
  const response = await fetch(endpoint, { headers: { accept: 'application/json' }, cache: 'no-store' })
  if (!response.ok) throw new Error(`Kick Stream Map ${next} API HTTP ${response.status}`)
  const payload = await response.json() as KickPayload
  validatePayload(payload, next)
  return payload
}

function validatePayload(next: KickPayload, nextMode: GeographyMode): void {
  const provider = String(next.provider ?? next.platform ?? '').trim().toLowerCase()
  if (provider !== 'kick' || next.source !== 'real' || next.geographyMode !== nextMode) {
    throw new Error(`Unexpected Kick Stream Map ${nextMode} data contract.`)
  }
  if (!next.coverage || !next.semantics || !Array.isArray(next.mappedStreams)) {
    throw new Error('Kick Stream Map accounting is incomplete.')
  }
  if (nextMode === 'country') {
    if (next.publicActivationAuthorized !== true || next.activation?.publicCountryActivationReady !== true) {
      throw new Error('Kick Country public activation is not ready.')
    }
  } else {
    if (next.publicCityActivationAuthorized !== true || next.activation?.publicCityActivationReady !== true || !Array.isArray(next.cityAggregates)) {
      throw new Error('Kick City public activation is not ready.')
    }
  }
  for (const rows of [next.mappedStreams, next.unmappedStreams, next.excludedStreams, next.conflictStreams]) {
    if (hasForbiddenPublicRowField(rows)) throw new Error('Kick public geography response contains a forbidden private or creator-precision field.')
  }
}

async function render(): Promise<void> {
  const source = payloads.get(mode)
  if (!source) return
  const current = filterPopulation(source, mode)
  const reconciliation = current.coverage?.reconciliation?.passes === true

  if (mode === 'country') {
    countryModel = buildKickCountryPreviewModel(current, { allowGeography: true })
    cityModel = null
    if (!countryModel.contractSafe || !reconciliation) {
      renderFailure(countryModel.contractSafe ? 'Kick Country reconciliation failed.' : 'Kick Country response contract is unsafe.')
      return
    }
    renderAccounting(current, countryModel.countryRows.length, reconciliation)
    renderReasons(current)
    renderExcluded(current)
    renderCountryRows(countryModel)
    renderSelectedCountry(countryModel)
    renderCountryStreams(countryModel)
    await renderCountryMap(countryModel)
    return
  }

  cityModel = buildKickCityPreviewModel(current, { allowGeography: true })
  countryModel = null
  const cityAuthorized = current.publicCityActivationAuthorized === true
  if (!cityAuthorized || !cityModel.contractSafe || !cityModel.runtimeReady || !reconciliation) {
    const message = !cityAuthorized
      ? 'Kick City public activation is not authorized.'
      : !cityModel.contractSafe
        ? 'Kick City response contract is unsafe.'
        : !cityModel.runtimeReady
          ? 'Kick City runtime is not ready.'
          : 'Kick City reconciliation failed.'
    renderFailure(message)
    return
  }
  renderAccounting(current, cityModel.cityRows.length, reconciliation)
  renderReasons(current)
  renderExcluded(current)
  renderCityRows(cityModel)
  renderSelectedCity(cityModel)
  renderCityStreams(cityModel)
  await renderCityMap(cityModel)
}

function renderAccounting(current: KickPayload, areaCount: number, reconciliation: boolean): void {
  const coverage = current.coverage ?? {}
  const observed = count(coverage.observedStreams)
  const observedViewers = count(coverage.observedViewers)
  const mapped = count(coverage.mappedStreams)
  const mappedViewers = count(coverage.mappedViewers)
  const unmapped = count(coverage.unmappedStreams)
  const excluded = count(coverage.excludedStreams)
  const excludedViewers = count(coverage.excludedViewers)
  const conflicts = count(coverage.conflictStreams)

  setState(observed === 0 ? 'Empty' : 'Ready')
  text('stream-map-observed', format(observed))
  text('stream-map-mapped', format(mapped))
  text('stream-map-unmapped', format(unmapped))
  text('stream-map-strip-updated', current.updatedAt ? formatAgo(current.updatedAt) : 'Unavailable')
  text('stream-map-strip-coverage', `${percent(ratio(mapped, observed))} streams · ${percent(ratio(mappedViewers, observedViewers))} viewers`)
  text('stream-map-population-summary', populationSummary())
  text('stream-map-population-state', `${format(observed)} streams · ${format(observedViewers)} viewers selected from the observed Kick Top 100.`)
  text('stream-map-card-mapped', `${format(mapped)} / ${format(observed)}`)
  text('stream-map-card-viewers', `${format(mappedViewers)} / ${format(observedViewers)}`)
  text('stream-map-card-excluded', `${format(excluded)} streams · ${format(excludedViewers)} viewers`)
  text('stream-map-unmapped-current', format(unmapped))
  text('stream-map-conflict-current', format(conflicts))
  text('stream-map-excluded-current', format(excluded))
  text('stream-map-country-count', format(areaCount))
  text('stream-map-conflict-count', format(conflicts))
  text('stream-map-unmapped-reconciliation', reconciliation
    ? `Reconciliation passes · ${format(observed)} selected streams are accounted for.`
    : 'Reconciliation failed · public geography is fail-closed.')
  updateModeCopy()
}

function filterPopulation(source: KickPayload, sourceMode: GeographyMode): KickPayload {
  const rows: PopulationRow[] = [
    ...(source.mappedStreams ?? []).map((row) => ({ ...row, bucket: 'mapped' as const })),
    ...(source.unmappedStreams ?? []).map((row) => ({ ...row, bucket: 'unmapped' as const })),
    ...(source.excludedStreams ?? []).map((row) => ({ ...row, bucket: 'excluded' as const })),
    ...(source.conflictStreams ?? []).map((row) => ({ ...row, bucket: 'conflict' as const })),
  ]
  rows.sort((a, b) => viewers(b) - viewers(a) || String(a.slug ?? '').localeCompare(String(b.slug ?? '')))

  const top = Math.max(1, Math.min(100, Number(populationTop?.value || 100) || 100))
  const minViewers = Math.max(0, Number(populationMinViewers?.value || 0) || 0)
  const selected = rows.slice(0, top).filter((row) => viewers(row) >= minViewers)
  const mappedStreams = selected.filter((row) => row.bucket === 'mapped').map(stripBucket)
  const unmappedStreams = selected.filter((row) => row.bucket === 'unmapped').map(stripBucket)
  const excludedStreams = selected.filter((row) => row.bucket === 'excluded').map(stripBucket)
  const conflictStreams = selected.filter((row) => row.bucket === 'conflict').map(stripBucket)
  const unmappedReasons: Record<string, number> = {}
  for (const row of unmappedStreams) {
    const reason = String(row.geography?.reason ?? 'unmapped').trim() || 'unmapped'
    unmappedReasons[reason] = (unmappedReasons[reason] ?? 0) + 1
  }

  const coverage: Record<string, any> = {
    ...(source.coverage ?? {}),
    observedStreams: selected.length,
    observedViewers: sum(selected),
    mappedStreams: mappedStreams.length,
    mappedViewers: sum(mappedStreams),
    unmappedStreams: unmappedStreams.length,
    unmappedViewers: sum(unmappedStreams),
    excludedStreams: excludedStreams.length,
    excludedViewers: sum(excludedStreams),
    conflictStreams: conflictStreams.length,
    conflictViewers: sum(conflictStreams),
    unmappedReasons,
    reconciliation: {
      selectedPopulation: selected.length,
      reconciledPopulation: mappedStreams.length + unmappedStreams.length + excludedStreams.length + conflictStreams.length,
      passes: mappedStreams.length + unmappedStreams.length + excludedStreams.length + conflictStreams.length === selected.length,
    },
  }

  if (sourceMode === 'country') {
    coverage.mappedCountryCount = new Set(mappedStreams.map((row) => row.geography?.countryCode).filter(Boolean)).size
    return { ...source, mappedStreams, unmappedStreams, excludedStreams, conflictStreams, coverage }
  }

  const cityAggregates = rebuildCityAggregates(source.cityAggregates ?? [], mappedStreams)
  coverage.mappedCityAggregateCount = cityAggregates.length
  coverage.referenceGeometryAggregates = cityAggregates.filter((row) => row.referenceGeometry?.state === 'reference_point').length
  coverage.listOnlyAggregates = cityAggregates.filter((row) => row.referenceGeometry?.state !== 'reference_point').length
  return { ...source, cityAggregates, mappedStreams, unmappedStreams, excludedStreams, conflictStreams, coverage }
}

function rebuildCityAggregates(sourceAggregates: CityAggregate[], mappedStreams: KickRow[]): CityAggregate[] {
  const meta = new Map(sourceAggregates.map((row) => [String(row.cityAggregateKey ?? ''), row]))
  const grouped = new Map<string, CityAggregate>()
  for (const stream of mappedStreams) {
    const key = String(stream.geography?.cityAggregateKey ?? '').trim()
    if (!key) continue
    const existing = grouped.get(key)
    if (existing) {
      existing.streams = count(existing.streams) + 1
      existing.viewers = count(existing.viewers) + viewers(stream)
      continue
    }
    const source = meta.get(key)
    grouped.set(key, {
      cityAggregateKey: key,
      countryCode: source?.countryCode ?? stream.geography?.countryCode ?? '',
      region: source?.region ?? stream.geography?.region ?? null,
      city: source?.city ?? stream.geography?.city ?? '',
      streams: 1,
      viewers: viewers(stream),
      referenceGeometry: source?.referenceGeometry ?? stream.geography?.referenceGeometry ?? { state: 'no_geometry', referenceKey: null, semantics: 'list_only' },
    })
  }
  return [...grouped.values()].sort((a, b) => count(b.viewers) - count(a.viewers) || String(a.cityAggregateKey).localeCompare(String(b.cityAggregateKey)))
}

async function renderCountryMap(model: KickCountryPreviewModel): Promise<void> {
  destroyMaps()
  const renderId = ++mapRenderId
  if (!mapRoot) return
  mapRoot.replaceChildren()
  if (model.countryRows.length === 0) {
    mapRoot.dataset.mapState = 'empty'
    showMapStatus('No reviewed Country rows in this view', 'The selected population is valid, but no accepted Country placement is currently visible.')
    return
  }
  mapRoot.dataset.mapState = 'basemap-loading'
  showMapStatus('Loading live Kick Country geography…', 'No demo geography will be substituted.')
  const { renderKickCountryPreviewMap } = await import('./country-preview-map')
  const controller = await renderKickCountryPreviewMap(mapRoot, model)
  if (renderId !== mapRenderId) return controller?.destroy()
  if (!controller) throw new Error('Kick Country map renderer did not initialize.')
  countryMapController = controller
  controller.setMetric(metric)
  controller.selectCountry(selectedCountryCode)
  mapRoot.dataset.mapState = 'basemap-ready'
  hideMapStatus()
}

async function renderCityMap(model: KickCityPreviewModel): Promise<void> {
  destroyMaps()
  const renderId = ++mapRenderId
  if (!mapRoot) return
  mapRoot.replaceChildren()
  if (model.cityRows.length === 0) {
    mapRoot.dataset.mapState = 'empty'
    showMapStatus('No reviewed City rows in this view', 'The selected population is valid, but no accepted Base City placement is currently visible.')
    return
  }
  if (model.referenceRows.length === 0) {
    mapRoot.dataset.mapState = 'list-only'
    showMapStatus('Reviewed City rows are list-only', 'No reviewed aggregate reference geometry is available for the mapped City rows in this view. The City list remains available without inventing coordinates.')
    return
  }
  mapRoot.dataset.mapState = 'basemap-loading'
  showMapStatus('Loading reviewed Kick City aggregate references…', 'Reference points are aggregate UI targets, never creator locations.')
  const { renderKickCityPreviewMap } = await import('./city-preview-map')
  const controller = await renderKickCityPreviewMap(mapRoot, model)
  if (renderId !== mapRenderId) return controller?.destroy()
  if (!controller) throw new Error('Kick City map renderer did not initialize.')
  cityMapController = controller
  controller.setMetric(metric)
  controller.selectCity(selectedCityKey)
  mapRoot.dataset.mapState = 'basemap-ready'
  hideMapStatus()
}

function renderReasons(source: KickPayload): void {
  const list = document.getElementById('stream-map-unmapped-reason-list')
  if (!list) return
  list.replaceChildren()
  const reasons = Object.entries(source.coverage?.unmappedReasons ?? {})
    .map(([reason, value]) => [reason, count(value)] as const)
    .filter(([, value]) => value > 0)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
  if (!reasons.length) return list.append(empty('No unmapped reasons in this view.'))
  for (const [reason, value] of reasons) {
    const row = document.createElement('div')
    row.className = 'stream-map-kick-reason-row'
    const label = document.createElement('code')
    label.textContent = reason
    const amount = document.createElement('strong')
    amount.textContent = format(value)
    row.append(label, amount)
    list.append(row)
  }
}

function renderExcluded(source: KickPayload): void {
  const list = document.getElementById('stream-map-excluded-nonperson-list')
  if (!list) return
  list.replaceChildren()
  const rows = source.excludedStreams ?? []
  if (!rows.length) return list.append(empty('No excluded non-person channel in this view.'))
  for (const row of rows) {
    const article = document.createElement('article')
    article.className = 'stream-map-stream-row'
    const head = document.createElement('div')
    head.className = 'stream-map-stream-row__head'
    const name = document.createElement('strong')
    name.textContent = row.displayName || row.slug || 'Unknown'
    const amount = document.createElement('span')
    amount.textContent = `${format(viewers(row))} viewers`
    head.append(name, amount)
    const detail = document.createElement('div')
    detail.className = 'stream-map-stream-row__location'
    detail.textContent = 'Excluded non-person · not placed as a creator'
    article.append(head, detail)
    list.append(article)
  }
}

function renderCountryRows(model: KickCountryPreviewModel): void {
  const list = document.getElementById('stream-map-country-list')
  if (!list) return
  list.replaceChildren()
  if (!model.countryRows.length) return list.append(empty('No accepted mapped country matches the selected population.'))
  for (const country of model.countryRows) {
    const row = areaButton(country.countryCode, countryName(country.countryCode), `${format(country.streams)} stream${country.streams === 1 ? '' : 's'} · ${format(country.viewers)} viewers`, selectedCountryCode === country.countryCode)
    row.dataset.countryCode = country.countryCode
    row.addEventListener('click', () => selectCountry(country.countryCode))
    list.append(row)
  }
}

function renderCityRows(model: KickCityPreviewModel): void {
  const list = document.getElementById('stream-map-country-list')
  if (!list) return
  list.replaceChildren()
  if (!model.cityRows.length) return list.append(empty('No accepted mapped Base City matches the selected population.'))
  for (const city of model.cityRows) {
    const label = cityLabel(city.city, city.region, city.countryCode)
    const geometry = city.referenceGeometry.state === 'reference_point' ? 'aggregate reference' : 'list-only'
    const row = areaButton(city.cityAggregateKey, label, `${format(city.streams)} stream${city.streams === 1 ? '' : 's'} · ${format(city.viewers)} viewers · ${geometry}`, selectedCityKey === city.cityAggregateKey)
    row.classList.add('stream-map-city-row')
    row.dataset.cityAggregateKey = city.cityAggregateKey
    row.addEventListener('click', () => selectCity(city.cityAggregateKey))
    list.append(row)
  }
}

function areaButton(key: string, label: string, detailText: string, selected: boolean): HTMLButtonElement {
  const row = document.createElement('button')
  row.type = 'button'
  row.className = 'stream-map-country-row'
  row.setAttribute('aria-pressed', String(selected))
  row.setAttribute('aria-label', `Show ${label}: ${detailText}`)
  if (selected) row.classList.add('is-selected')
  const name = document.createElement('strong')
  name.textContent = label
  const detail = document.createElement('span')
  detail.textContent = detailText
  row.append(name, detail)
  row.dataset.areaKey = key
  return row
}

function renderSelectedCountry(model: KickCountryPreviewModel): void {
  const panel = document.getElementById('stream-map-selected-country')
  if (!panel) return
  panel.hidden = !selectedCountryCode
  if (!selectedCountryCode) return
  const country = model.countryRows.find((row) => row.countryCode === selectedCountryCode)
  text('stream-map-selected-country-name', countryName(selectedCountryCode))
  text('stream-map-selected-country-streams', format(country?.streams ?? 0))
  text('stream-map-selected-country-viewers', format(country?.viewers ?? 0))
  setSelectedEvidence('Reviewed Country')
}

function renderSelectedCity(model: KickCityPreviewModel): void {
  const panel = document.getElementById('stream-map-selected-country')
  if (!panel) return
  panel.hidden = !selectedCityKey
  if (!selectedCityKey) return
  const city = model.cityRows.find((row) => row.cityAggregateKey === selectedCityKey)
  if (!city) return
  text('stream-map-selected-country-name', cityLabel(city.city, city.region, city.countryCode))
  text('stream-map-selected-country-streams', format(city.streams))
  text('stream-map-selected-country-viewers', format(city.viewers))
  setSelectedEvidence(city.referenceGeometry.state === 'reference_point' ? 'Reviewed Base City · aggregate reference' : 'Reviewed Base City · list-only')
}

function renderCountryStreams(model: KickCountryPreviewModel): void {
  const rows = model.mappedStreams
    .filter((row) => !selectedCountryCode || row.countryCode === selectedCountryCode)
    .sort((a, b) => b.viewers - a.viewers || a.displayName.localeCompare(b.displayName))
  text('stream-map-stream-list-title', selectedCountryCode ? `${countryName(selectedCountryCode)} mapped streams` : 'Mapped streams')
  renderStreamList(rows.map((row) => ({ ...row, location: countryName(row.countryCode), badge: 'Reviewed Country' })))
}

function renderCityStreams(model: KickCityPreviewModel): void {
  const rows = model.mappedStreams
    .filter((row) => !selectedCityKey || row.cityAggregateKey === selectedCityKey)
    .sort((a, b) => b.viewers - a.viewers || a.displayName.localeCompare(b.displayName))
  const selected = selectedCityKey ? model.cityRows.find((row) => row.cityAggregateKey === selectedCityKey) : null
  text('stream-map-stream-list-title', selected ? `${selected.city} mapped streams` : 'Mapped streams')
  renderStreamList(rows.map((row) => ({ ...row, location: cityLabel(row.city, row.region, row.countryCode), badge: 'Reviewed Base City' })))
}

function renderStreamList(rows: Array<{ slug: string; displayName: string; viewers: number; url: string; location: string; badge: string }>): void {
  const list = document.getElementById('stream-map-stream-list')
  if (!list) return
  list.replaceChildren()
  if (!rows.length) return list.append(empty('No mapped Kick stream matches the selected geography and population.'))
  for (const row of rows) {
    const article = document.createElement('article')
    article.className = 'stream-map-stream-row'
    const head = document.createElement('div')
    head.className = 'stream-map-stream-row__head'
    const channel = document.createElement('a')
    channel.href = row.url || `https://kick.com/${row.slug}`
    channel.target = '_blank'
    channel.rel = 'noreferrer'
    channel.textContent = row.displayName || row.slug
    const amount = document.createElement('strong')
    amount.textContent = `${format(row.viewers)} viewers`
    head.append(channel, amount)
    const location = document.createElement('div')
    location.className = 'stream-map-stream-row__location'
    location.textContent = row.location
    const badges = document.createElement('div')
    badges.className = 'stream-map-badges'
    const badge = document.createElement('span')
    badge.className = 'stream-map-badge stream-map-badge--kick-reviewed'
    badge.textContent = row.badge
    badges.append(badge)
    article.append(head, location, badges)
    list.append(article)
  }
}

function selectCountry(value: string | null): void {
  const normalized = String(value ?? '').trim().toUpperCase()
  selectedCountryCode = /^[A-Z]{2}$/.test(normalized) ? normalized : null
  countryMapController?.selectCountry(selectedCountryCode)
  if (countryModel) {
    renderCountryRows(countryModel)
    renderSelectedCountry(countryModel)
    renderCountryStreams(countryModel)
  }
}

function selectCity(value: string | null): void {
  selectedCityKey = String(value ?? '').trim() || null
  cityMapController?.selectCity(selectedCityKey)
  if (cityModel) {
    renderCityRows(cityModel)
    renderSelectedCity(cityModel)
    renderCityStreams(cityModel)
  }
}

function clearCurrentSelection(): void {
  if (mode === 'city') selectCity(null)
  else selectCountry(null)
}

function updateModeControls(): void {
  for (const button of [countryButton, cityButton]) {
    if (!button) continue
    const buttonMode = button.dataset.kickGeography as GeographyMode
    const active = buttonMode === mode
    button.dataset.active = String(active)
    button.setAttribute('aria-pressed', String(active))
  }
}

function updateModeCopy(): void {
  const mapHeading = document.querySelector<HTMLElement>('.stream-map-shell h2')
  const mapCopy = document.querySelector<HTMLElement>('.stream-map-shell__head p')
  const resultsHeading = document.querySelector<HTMLElement>('.stream-map-results__head h2')
  const resultsCopy = document.querySelector<HTMLElement>('.stream-map-results__head p')
  const areaHeading = document.querySelector<HTMLElement>('#stream-map-country-list')?.parentElement?.querySelector('h3') ?? null
  const evidenceLabel = document.querySelector<HTMLElement>('.data-strip__cell:last-child span')
  if (mode === 'city') {
    if (mapHeading) mapHeading.textContent = 'City aggregate map'
    if (mapCopy) mapCopy.textContent = 'Select a reviewed Base City aggregate to restrict the mapped-stream list. Only separately reviewed aggregate reference geometry may appear on the map; no_geometry rows remain list-only.'
    if (resultsHeading) resultsHeading.textContent = 'Mapped cities and streams'
    if (resultsCopy) resultsCopy.textContent = 'Choose a reviewed Base City aggregate to restrict the result list. Country-only and Current / IRL evidence are never promoted into Base City.'
    if (areaHeading) areaHeading.textContent = 'Cities'
    if (evidenceLabel) evidenceLabel.textContent = 'Reviewed Base City only'
  } else {
    if (mapHeading) mapHeading.textContent = 'World map'
    if (mapCopy) mapCopy.textContent = 'Select a country on the map or in the country list to restrict the mapped-stream list. Country selection does not change evidence acceptance.'
    if (resultsHeading) resultsHeading.textContent = 'Mapped countries and streams'
    if (resultsCopy) resultsCopy.textContent = 'Choose a country to restrict the result list. The underlying reviewed Country decision does not change.'
    if (areaHeading) areaHeading.textContent = 'Countries'
    if (evidenceLabel) evidenceLabel.textContent = 'Reviewed Country only'
  }
}

function renderFailure(message: string): void {
  destroyMaps()
  setState('Unavailable')
  if (mapRoot) {
    mapRoot.replaceChildren()
    mapRoot.dataset.mapState = 'data-error'
  }
  showMapStatus(`Kick Stream Map ${mode} unavailable`, message)
}

function destroyMaps(): void {
  countryMapController?.destroy()
  cityMapController?.destroy()
  countryMapController = null
  cityMapController = null
}

function showMapStatus(heading: string, detail: string): void {
  if (!mapStatus) return
  mapStatus.dataset.state = 'loading'
  mapStatus.style.display = ''
  const strong = mapStatus.querySelector('strong')
  const span = mapStatus.querySelector('span')
  if (strong) strong.textContent = heading
  if (span) span.textContent = detail
}

function hideMapStatus(): void {
  if (!mapStatus) return
  mapStatus.dataset.state = 'ready'
  mapStatus.style.display = 'none'
}

function setSelectedEvidence(value: string): void {
  const panel = document.getElementById('stream-map-selected-country')
  const facts = panel?.querySelectorAll('.stream-map-selected-country__facts > div')
  const target = facts?.[2]?.querySelector('strong')
  if (target) target.textContent = value
}

function hasForbiddenPublicRowField(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(hasForbiddenPublicRowField)
  if (!value || typeof value !== 'object') return false
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (['broadcaster_user_id', 'stableKickUserId', 'currentLocation', 'current_location', 'temporaryLocation', 'temporary_location', 'address', 'coordinates', 'lat', 'lng', 'latitude', 'longitude'].includes(key)) return true
    if (hasForbiddenPublicRowField(child)) return true
  }
  return false
}

function modeFromUrl(): GeographyMode {
  try {
    return new URL(window.location.href).searchParams.get('geography')?.toLowerCase() === 'city' ? 'city' : 'country'
  } catch {
    return 'country'
  }
}

function updateUrl(next: GeographyMode): void {
  const url = new URL(window.location.href)
  if (next === 'city') url.searchParams.set('geography', 'city')
  else url.searchParams.delete('geography')
  window.history.pushState({}, '', `${url.pathname}${url.search}${url.hash}`)
}

function populationSummary(): string {
  const top = Number(populationTop?.value || 100) || 100
  const min = Number(populationMinViewers?.value || 0) || 0
  return `Top ${format(top)} · ${min > 0 ? `${format(min)}+ viewers` : 'all viewers'}`
}

function stripBucket(row: PopulationRow): KickRow {
  const { bucket: _bucket, ...rest } = row
  return rest
}

function viewers(row: KickRow): number {
  return count(row.viewers)
}

function sum(rows: KickRow[]): number {
  return rows.reduce((total, row) => total + viewers(row), 0)
}

function countryName(code: string): string {
  try {
    return new Intl.DisplayNames(['en'], { type: 'region' }).of(code) || code
  } catch {
    return code
  }
}

function cityLabel(city: string, region: string | null, code: string): string {
  return [city, region, countryName(code)].filter(Boolean).join(' · ')
}

function empty(message: string): HTMLParagraphElement {
  const node = document.createElement('p')
  node.className = 'stream-map-empty'
  node.textContent = message
  return node
}

function setState(value: string): void {
  const node = document.querySelector<HTMLElement>('[data-stream-map-state]')
  if (node) node.textContent = value
}

function text(id: string, value: string): void {
  const node = document.getElementById(id)
  if (node) node.textContent = value
}

function count(value: unknown): number {
  const parsed = Number(value ?? 0)
  return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : 0
}

function ratio(numerator: number, denominator: number): number {
  return denominator > 0 ? numerator / denominator : 0
}

function percent(value: number): string {
  return `${(Math.max(0, value) * 100).toFixed(1)}%`
}

function format(value: number): string {
  return new Intl.NumberFormat('en-US').format(value)
}

function formatAgo(value: string): string {
  const time = new Date(value).getTime()
  if (!Number.isFinite(time)) return 'Unavailable'
  const seconds = Math.max(0, Math.round((Date.now() - time) / 1000))
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  return `${Math.round(minutes / 60)}h ago`
}
