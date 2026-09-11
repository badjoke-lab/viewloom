import './preview.css'
import { buildKickStreamMapPreviewModel } from './preview-model.mjs'
import { buildKickCountryPreviewModel, type KickCountryPreviewModel } from './country-preview-model.mjs'
import { buildKickCityPreviewModel, type KickCityPreviewModel } from './city-preview-model.mjs'
import type { KickCountryPreviewMapController } from './country-preview-map'
import type { KickCityPreviewMapController } from './city-preview-map'

type PreviewModel = ReturnType<typeof buildKickStreamMapPreviewModel>
type GeographyMode = 'country' | 'city'

type SurfacePresentation = {
  ready: boolean
  state: string
  heading: string
  detail: string
}

type ReasonRow = { reason: string; count: number }

const root = document.querySelector<HTMLElement>('[data-kick-map-preview]')
if (!root) throw new Error('Kick Stream Map preview root is missing')

let activeGeography: GeographyMode = 'country'
let countryReadiness: PreviewModel | null = null
let countryModel: KickCountryPreviewModel | null = null
let countryMapController: KickCountryPreviewMapController | null = null
let countryUpdatedAt = ''
let selectedCountryCode: string | null = null

let cityModel: KickCityPreviewModel | null = null
let cityMapController: KickCityPreviewMapController | null = null
let cityUpdatedAt = ''
let cityReasonRows: ReasonRow[] = []
let selectedCityKey: string | null = null
let cityLoadError: string | null = null

let interactionsBound = false

bindInteractions()
void boot()

async function boot(): Promise<void> {
  setText('[data-kick-preview-state]', 'Loading')

  try {
    const response = await fetch('/api/kick-stream-map', {
      headers: { accept: 'application/json' },
      cache: 'no-store',
    })
    if (!response.ok) throw new Error(`Kick Stream Map API HTTP ${response.status}`)
    const payload = await response.json()
    countryUpdatedAt = text(payload?.updatedAt)
    countryReadiness = buildKickStreamMapPreviewModel(payload)
    countryModel = buildKickCountryPreviewModel(payload, { allowGeography: countryReadiness.canRenderCountryGeography })
    renderCountryReadiness(countryReadiness, countryModel)
    await renderCountrySurface(countryModel)
  } catch (error) {
    renderCountryLoadError(error)
  }

  try {
    const response = await fetch('/api/kick-stream-map?geography=city', {
      headers: { accept: 'application/json' },
      cache: 'no-store',
    })
    if (!response.ok) throw new Error(`Kick City API HTTP ${response.status}`)
    const payload = await response.json()
    cityUpdatedAt = text(payload?.updatedAt)
    cityReasonRows = reasonRows(payload?.coverage?.unmappedReasons)
    cityModel = buildKickCityPreviewModel(payload, { allowGeography: true })
    cityLoadError = null
    renderCitySurface(cityModel)
  } catch (error) {
    renderCityLoadError(error)
  }

  updateModeVisibility()
  renderActiveSummary()
}

function renderCountryReadiness(model: PreviewModel, country: KickCountryPreviewModel): void {
  const surface = deriveCountrySurfacePresentation(model, country)
  setText('[data-kick-preview-gate-heading]', surface.heading)
  setText('[data-kick-preview-gate-detail]', surface.detail)

  const gate = root?.querySelector<HTMLElement>('[data-kick-preview-gate]')
  if (gate) gate.dataset.ready = String(surface.ready)

  const blockers = [...model.blockers]
  if (!country.contractSafe) blockers.unshift('unsafe_country_response_contract')
  if (model.canRenderCountryGeography && country.contractSafe && country.countryRows.length === 0) {
    blockers.unshift('no_reviewed_country_rows')
  }
  renderList('[data-kick-preview-blockers]', [...new Set(blockers)].map((label) => ({ label, value: 'blocked' })))
  renderList(
    '[data-kick-preview-reasons]',
    model.coverage.reasonRows.map((row) => ({ label: row.reason, value: number(row.count) })),
  )

  const contract = model.stableIdentityContractValid && country.contractSafe
    ? 'broadcaster_user_id only'
    : 'invalid contract'
  setText('[data-kick-preview-identity-contract]', contract)
}

function deriveCountrySurfacePresentation(model: PreviewModel, country: KickCountryPreviewModel): SurfacePresentation {
  if (!model.canRenderCountryGeography) {
    return {
      ready: false,
      state: model.presentation.state,
      heading: model.presentation.heading,
      detail: model.presentation.detail,
    }
  }
  if (!country.contractSafe) {
    return {
      ready: false,
      state: 'country_contract_blocked',
      heading: 'Country response contract is unsafe',
      detail: 'The preview suppressed geography because the Kick Country response violates provider, identity, or geography safety semantics.',
    }
  }
  if (country.countryRows.length === 0) {
    return {
      ready: false,
      state: 'country_empty',
      heading: 'No reviewed Country rows to render',
      detail: 'The current response contains no reviewed mapped Kick Country rows.',
    }
  }
  return {
    ready: true,
    state: model.presentation.state,
    heading: model.presentation.heading,
    detail: model.presentation.detail,
  }
}

async function renderCountrySurface(model: KickCountryPreviewModel): Promise<void> {
  const gate = root?.querySelector<HTMLElement>('[data-kick-preview-gate]')
  const mapRoot = root?.querySelector<HTMLElement>('[data-kick-preview-map]')
  const results = root?.querySelector<HTMLElement>('[data-kick-preview-country-results]')
  const metric = root?.querySelector<HTMLSelectElement>('[data-kick-preview-metric]')
  const ready = model.allowGeography && model.contractSafe && model.countryRows.length > 0

  if (!ready || !mapRoot) {
    if (gate) gate.hidden = false
    if (mapRoot) mapRoot.hidden = true
    if (results) results.hidden = true
    if (metric) metric.disabled = true
    return
  }

  if (gate) gate.hidden = true
  mapRoot.hidden = false
  if (results) results.hidden = activeGeography !== 'country'
  if (metric) metric.disabled = false

  renderCountryRows(model)
  renderCountryStreamRows(model)
  setText(
    '[data-kick-preview-reconciliation]',
    model.accounting.reconciliationPasses
      ? `Reconciliation passes · ${number(model.accounting.observedStreams)} observed streams accounted for.`
      : 'Reconciliation failed · Country preview remains review-only.',
  )

  const { renderKickCountryPreviewMap } = await import('./country-preview-map')
  countryMapController?.destroy()
  countryMapController = await renderKickCountryPreviewMap(mapRoot, model)
}

function renderCitySurface(model: KickCityPreviewModel): void {
  const presentation = deriveCitySurfacePresentation(model)
  const gate = root?.querySelector<HTMLElement>('[data-kick-city-gate]')
  const mapRoot = root?.querySelector<HTMLElement>('[data-kick-city-map]')
  const results = root?.querySelector<HTMLElement>('[data-kick-city-results]')
  const metric = root?.querySelector<HTMLSelectElement>('[data-kick-city-metric]')

  setText('[data-kick-city-gate-heading]', presentation.heading)
  setText('[data-kick-city-gate-detail]', presentation.detail)
  if (gate) gate.dataset.ready = String(presentation.ready)

  const hasRows = model.previewAllowed && model.contractSafe && model.cityRows.length > 0
  if (gate) gate.hidden = hasRows
  if (mapRoot) mapRoot.hidden = true
  if (results) results.hidden = activeGeography !== 'city' || !hasRows
  if (metric) metric.disabled = !hasRows || model.referenceRows.length === 0

  renderCityRows(model)
  renderCityStreamRows(model)
  setText(
    '[data-kick-city-reconciliation]',
    model.accounting.reconciliationPasses
      ? `Reconciliation passes · ${number(model.accounting.observedStreams)} observed streams accounted for · ${number(model.accounting.referenceGeometryAggregates)} reference point · ${number(model.accounting.listOnlyAggregates)} list-only.`
      : 'Reconciliation failed · City preview remains fail closed.',
  )
}

function deriveCitySurfacePresentation(model: KickCityPreviewModel): SurfacePresentation {
  if (!model.contractSafe) {
    return {
      ready: false,
      state: 'city_contract_blocked',
      heading: 'City response contract is unsafe',
      detail: 'Kick City geography is suppressed because provider, stable-identity, Base City, Current, precision, or aggregate-reference semantics failed closed.',
    }
  }
  if (!model.runtimeReady) {
    return {
      ready: false,
      state: 'city_runtime_blocked',
      heading: 'City runtime is not ready',
      detail: 'Stable provider identity coverage is incomplete, so reviewed City rows are not rendered even if present in the response.',
    }
  }
  if (model.cityRows.length === 0) {
    return {
      ready: false,
      state: 'city_empty',
      heading: 'No reviewed City rows in the current population',
      detail: 'The City contract is connected, but the current Kick population has no reviewed accepted Base City overlap. No inferred placement is substituted.',
    }
  }
  if (model.referenceRows.length === 0) {
    return {
      ready: true,
      state: 'city_list_only',
      heading: 'Reviewed City rows are list-only',
      detail: 'Reviewed Base City aggregates are available, but no separately reviewed aggregate reference geometry is available. The map remains empty by design.',
    }
  }
  return {
    ready: true,
    state: 'city_ready',
    heading: 'Reviewed City aggregate preview ready',
    detail: 'Only separately reviewed City aggregate reference points are mapped. no_geometry aggregates remain list-only.',
  }
}

function renderCountryLoadError(error: unknown): void {
  countryMapController?.destroy()
  countryMapController = null
  countryReadiness = null
  countryModel = null
  setText('[data-kick-preview-state]', 'Unavailable')
  setText('[data-kick-preview-gate-heading]', 'Country preview data unavailable')
  setText('[data-kick-preview-gate-detail]', error instanceof Error ? error.message : String(error))
  const gate = root?.querySelector<HTMLElement>('[data-kick-preview-gate]')
  const mapRoot = root?.querySelector<HTMLElement>('[data-kick-preview-map]')
  const results = root?.querySelector<HTMLElement>('[data-kick-preview-country-results]')
  const metric = root?.querySelector<HTMLSelectElement>('[data-kick-preview-metric]')
  if (gate) {
    gate.hidden = false
    gate.dataset.ready = 'false'
  }
  if (mapRoot) mapRoot.hidden = true
  if (results) results.hidden = true
  if (metric) metric.disabled = true
}

function renderCityLoadError(error: unknown): void {
  cityMapController?.destroy()
  cityMapController = null
  cityModel = null
  cityLoadError = error instanceof Error ? error.message : String(error)
  setText('[data-kick-city-gate-heading]', 'City preview data unavailable')
  setText('[data-kick-city-gate-detail]', cityLoadError)
  const gate = root?.querySelector<HTMLElement>('[data-kick-city-gate]')
  const mapRoot = root?.querySelector<HTMLElement>('[data-kick-city-map]')
  const results = root?.querySelector<HTMLElement>('[data-kick-city-results]')
  const metric = root?.querySelector<HTMLSelectElement>('[data-kick-city-metric]')
  if (gate) {
    gate.hidden = false
    gate.dataset.ready = 'false'
  }
  if (mapRoot) mapRoot.hidden = true
  if (results) results.hidden = true
  if (metric) metric.disabled = true
}

function bindInteractions(): void {
  if (interactionsBound) return
  interactionsBound = true

  for (const button of root?.querySelectorAll<HTMLButtonElement>('[data-kick-preview-geography]') ?? []) {
    button.addEventListener('click', () => {
      const mode = button.dataset.kickPreviewGeography === 'city' ? 'city' : 'country'
      void setGeography(mode)
    })
  }

  root?.querySelector<HTMLSelectElement>('[data-kick-preview-metric]')?.addEventListener('change', (event) => {
    const value = (event.currentTarget as HTMLSelectElement).value
    countryMapController?.setMetric(value === 'streams' ? 'streams' : 'viewers')
  })

  root?.querySelector<HTMLElement>('[data-kick-preview-map]')?.addEventListener('kick-country-select', (event) => {
    const detail = (event as CustomEvent<{ countryCode?: string }>).detail
    selectCountry(detail?.countryCode || null)
  })

  root?.querySelector<HTMLButtonElement>('[data-kick-preview-world]')?.addEventListener('click', () => selectCountry(null))

  root?.querySelector<HTMLSelectElement>('[data-kick-city-metric]')?.addEventListener('change', (event) => {
    const value = (event.currentTarget as HTMLSelectElement).value
    cityMapController?.setMetric(value === 'streams' ? 'streams' : 'viewers')
  })

  root?.querySelector<HTMLElement>('[data-kick-city-map]')?.addEventListener('kick-city-select', (event) => {
    const detail = (event as CustomEvent<{ cityAggregateKey?: string }>).detail
    selectCity(detail?.cityAggregateKey || null)
  })

  root?.querySelector<HTMLButtonElement>('[data-kick-city-all]')?.addEventListener('click', () => selectCity(null))
}

async function setGeography(mode: GeographyMode): Promise<void> {
  activeGeography = mode
  updateModeVisibility()
  renderActiveSummary()
  if (mode === 'city') await ensureCityMap()
}

function updateModeVisibility(): void {
  for (const button of root?.querySelectorAll<HTMLButtonElement>('[data-kick-preview-geography]') ?? []) {
    const mode = button.dataset.kickPreviewGeography === 'city' ? 'city' : 'country'
    button.setAttribute('aria-pressed', String(mode === activeGeography))
  }

  const countrySurface = root?.querySelector<HTMLElement>('[data-kick-preview-country-surface]')
  const countryResults = root?.querySelector<HTMLElement>('[data-kick-preview-country-results]')
  const citySurface = root?.querySelector<HTMLElement>('[data-kick-preview-city-surface]')
  const cityResults = root?.querySelector<HTMLElement>('[data-kick-city-results]')

  if (countrySurface) countrySurface.hidden = activeGeography !== 'country'
  if (countryResults) {
    const ready = Boolean(countryModel?.allowGeography && countryModel.contractSafe && countryModel.countryRows.length > 0)
    countryResults.hidden = activeGeography !== 'country' || !ready
  }
  if (citySurface) citySurface.hidden = activeGeography !== 'city'
  if (cityResults) {
    const ready = Boolean(cityModel?.previewAllowed && cityModel.contractSafe && cityModel.cityRows.length > 0)
    cityResults.hidden = activeGeography !== 'city' || !ready
  }

  if (activeGeography !== 'city') {
    const cityMap = root?.querySelector<HTMLElement>('[data-kick-city-map]')
    if (cityMap) cityMap.hidden = true
  }
}

async function ensureCityMap(): Promise<void> {
  if (!cityModel || !cityModel.previewAllowed || !cityModel.contractSafe || cityModel.referenceRows.length === 0) return
  const mapRoot = root?.querySelector<HTMLElement>('[data-kick-city-map]')
  if (!mapRoot) return
  mapRoot.hidden = false
  if (cityMapController) return
  const { renderKickCityPreviewMap } = await import('./city-preview-map')
  cityMapController = await renderKickCityPreviewMap(mapRoot, cityModel)
}

function renderActiveSummary(): void {
  if (activeGeography === 'city') {
    if (cityModel) {
      const presentation = deriveCitySurfacePresentation(cityModel)
      setText('[data-kick-preview-state]', presentation.state)
      setText('[data-kick-preview-updated]', cityUpdatedAt || '—')
      setText('[data-kick-preview-observed]', number(cityModel.accounting.observedStreams))
      setText('[data-kick-preview-stable]', number(cityModel.accounting.stableIdentityStreams))
      setText('[data-kick-preview-mapped]', number(cityModel.accounting.mappedStreams))
      setText('[data-kick-preview-unmapped]', number(cityModel.accounting.unmappedStreams))
      setText('[data-kick-preview-excluded]', number(cityModel.accounting.excludedStreams))
      setText('[data-kick-preview-conflicts]', number(cityModel.accounting.conflictStreams))
      setText('[data-kick-preview-activation]', cityModel.publicCityActivationAuthorized ? 'City authorized' : 'City not authorized')
      setText('[data-kick-preview-identity-contract]', cityModel.contractSafe ? 'broadcaster_user_id only' : 'invalid contract')
      const blockers = [...cityModel.blockers]
      if (!cityModel.contractSafe) blockers.unshift('unsafe_city_response_contract')
      if (cityModel.runtimeReady && cityModel.contractSafe && cityModel.cityRows.length === 0) blockers.unshift('no_reviewed_city_rows')
      renderList('[data-kick-preview-blockers]', [...new Set(blockers)].map((label) => ({ label, value: 'blocked' })))
      renderList('[data-kick-preview-reasons]', cityReasonRows.map((row) => ({ label: row.reason, value: number(row.count) })))
      return
    }

    setText('[data-kick-preview-state]', cityLoadError ? 'Unavailable' : 'Loading')
    setText('[data-kick-preview-updated]', '—')
    setText('[data-kick-preview-mapped]', '—')
    setText('[data-kick-preview-unmapped]', '—')
    setText('[data-kick-preview-excluded]', '—')
    setText('[data-kick-preview-conflicts]', '—')
    setText('[data-kick-preview-activation]', 'City not authorized')
    return
  }

  if (!countryReadiness || !countryModel) return
  const presentation = deriveCountrySurfacePresentation(countryReadiness, countryModel)
  setText('[data-kick-preview-state]', presentation.state)
  setText('[data-kick-preview-updated]', countryUpdatedAt || countryReadiness.updatedAt || '—')
  setText('[data-kick-preview-observed]', number(countryReadiness.coverage.observedStreams))
  setText('[data-kick-preview-stable]', number(countryReadiness.coverage.stableIdentityStreams))
  setText('[data-kick-preview-mapped]', number(countryModel.accounting.mappedStreams))
  setText('[data-kick-preview-unmapped]', number(countryReadiness.coverage.unmappedStreams))
  setText('[data-kick-preview-excluded]', number(countryModel.accounting.excludedStreams))
  setText('[data-kick-preview-conflicts]', number(countryModel.accounting.conflictStreams))
  setText('[data-kick-preview-activation]', countryReadiness.publicActivationAuthorized ? 'Country authorized' : 'Country not authorized')
  setText('[data-kick-preview-identity-contract]', countryReadiness.stableIdentityContractValid && countryModel.contractSafe ? 'broadcaster_user_id only' : 'invalid contract')

  const blockers = [...countryReadiness.blockers]
  if (!countryModel.contractSafe) blockers.unshift('unsafe_country_response_contract')
  if (countryReadiness.canRenderCountryGeography && countryModel.contractSafe && countryModel.countryRows.length === 0) blockers.unshift('no_reviewed_country_rows')
  renderList('[data-kick-preview-blockers]', [...new Set(blockers)].map((label) => ({ label, value: 'blocked' })))
  renderList('[data-kick-preview-reasons]', countryReadiness.coverage.reasonRows.map((row) => ({ label: row.reason, value: number(row.count) })))
}

function renderCountryRows(model: KickCountryPreviewModel): void {
  const list = root?.querySelector<HTMLElement>('[data-kick-preview-countries]')
  if (!list) return
  list.replaceChildren()
  for (const row of model.countryRows) {
    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'kick-map-preview__country-row'
    button.dataset.countryCode = row.countryCode
    button.setAttribute('aria-pressed', String(selectedCountryCode === row.countryCode))
    const label = document.createElement('strong')
    label.textContent = row.countryCode
    const detail = document.createElement('span')
    detail.textContent = `${number(row.streams)} stream${row.streams === 1 ? '' : 's'} · ${number(row.viewers)} viewers`
    button.append(label, detail)
    button.addEventListener('click', () => selectCountry(row.countryCode))
    list.append(button)
  }
}

function renderCountryStreamRows(model: KickCountryPreviewModel): void {
  const list = root?.querySelector<HTMLElement>('[data-kick-preview-streams]')
  if (!list) return
  list.replaceChildren()
  const rows = selectedCountryCode
    ? model.mappedStreams.filter((row) => row.countryCode === selectedCountryCode)
    : model.mappedStreams
  setText('[data-kick-preview-stream-heading]', selectedCountryCode ? `${selectedCountryCode} mapped streams` : 'Mapped streams')

  if (rows.length === 0) {
    const empty = document.createElement('p')
    empty.className = 'kick-map-preview__empty'
    empty.textContent = 'No mapped Kick streams in this Country selection.'
    list.append(empty)
    return
  }

  for (const row of [...rows].sort((a, b) => b.viewers - a.viewers || a.displayName.localeCompare(b.displayName))) {
    const article = document.createElement('article')
    article.className = 'kick-map-preview__stream-row'
    const name = document.createElement('strong')
    name.textContent = row.displayName || row.slug
    const viewers = document.createElement('span')
    viewers.textContent = `${number(row.viewers)} viewers`
    const detail = document.createElement('small')
    detail.textContent = `${row.countryCode} · reviewed Country terminal state · stable join only`
    article.append(name, viewers, detail)
    list.append(article)
  }
}

function renderCityRows(model: KickCityPreviewModel): void {
  const list = root?.querySelector<HTMLElement>('[data-kick-city-aggregates]')
  if (!list) return
  list.replaceChildren()

  if (model.cityRows.length === 0) {
    const empty = document.createElement('p')
    empty.className = 'kick-map-preview__empty'
    empty.textContent = 'No reviewed Kick City aggregates in the current population.'
    list.append(empty)
    return
  }

  for (const row of model.cityRows) {
    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'kick-map-preview__city-row'
    button.dataset.cityAggregateKey = row.cityAggregateKey
    button.setAttribute('aria-pressed', String(selectedCityKey === row.cityAggregateKey))

    const labelWrap = document.createElement('span')
    labelWrap.className = 'kick-map-preview__city-label'
    const label = document.createElement('strong')
    label.textContent = row.city
    const location = document.createElement('small')
    location.textContent = [row.region, row.countryCode].filter(Boolean).join(' · ')
    labelWrap.append(label, location)

    const detail = document.createElement('span')
    detail.className = 'kick-map-preview__city-detail'
    detail.textContent = `${number(row.streams)} stream${row.streams === 1 ? '' : 's'} · ${number(row.viewers)} viewers · ${row.referenceGeometry.state === 'reference_point' ? 'aggregate reference point' : 'list-only'}`
    button.append(labelWrap, detail)
    button.addEventListener('click', () => selectCity(row.cityAggregateKey))
    list.append(button)
  }
}

function renderCityStreamRows(model: KickCityPreviewModel): void {
  const list = root?.querySelector<HTMLElement>('[data-kick-city-streams]')
  if (!list) return
  list.replaceChildren()
  const rows = selectedCityKey
    ? model.mappedStreams.filter((row) => row.cityAggregateKey === selectedCityKey)
    : model.mappedStreams
  const selected = selectedCityKey ? model.cityRows.find((row) => row.cityAggregateKey === selectedCityKey) : null
  setText('[data-kick-city-stream-heading]', selected ? `${selected.city} mapped streams` : 'Mapped streams')

  if (rows.length === 0) {
    const empty = document.createElement('p')
    empty.className = 'kick-map-preview__empty'
    empty.textContent = 'No mapped Kick streams in this City selection.'
    list.append(empty)
    return
  }

  for (const row of [...rows].sort((a, b) => b.viewers - a.viewers || a.displayName.localeCompare(b.displayName))) {
    const article = document.createElement('article')
    article.className = 'kick-map-preview__stream-row'
    const name = document.createElement('strong')
    name.textContent = row.displayName || row.slug
    const viewers = document.createElement('span')
    viewers.textContent = `${number(row.viewers)} viewers`
    const detail = document.createElement('small')
    detail.textContent = `${row.city}${row.region ? ` · ${row.region}` : ''} · ${row.countryCode} · reviewed Base City terminal state`
    article.append(name, viewers, detail)
    list.append(article)
  }
}

function selectCountry(countryCode: string | null): void {
  selectedCountryCode = countryCode && /^[A-Z]{2}$/.test(countryCode.toUpperCase()) ? countryCode.toUpperCase() : null
  countryMapController?.selectCountry(selectedCountryCode)
  if (countryModel) {
    renderCountryRows(countryModel)
    renderCountryStreamRows(countryModel)
  }
}

function selectCity(cityAggregateKey: string | null): void {
  const key = text(cityAggregateKey)
  selectedCityKey = key && cityModel?.cityRows.some((row) => row.cityAggregateKey === key) ? key : null
  cityMapController?.selectCity(selectedCityKey)
  if (cityModel) {
    renderCityRows(cityModel)
    renderCityStreamRows(cityModel)
  }
}

function reasonRows(value: unknown): ReasonRow[] {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return []
  return Object.entries(value as Record<string, unknown>)
    .flatMap(([reason, count]) => typeof count === 'number' && Number.isFinite(count) && count > 0
      ? [{ reason, count: Math.round(count) }]
      : [])
    .sort((a, b) => b.count - a.count || a.reason.localeCompare(b.reason))
}

function renderList(selector: string, rows: Array<{ label: string; value: string }>): void {
  const list = root?.querySelector<HTMLElement>(selector)
  if (!list) return
  list.replaceChildren()
  if (rows.length === 0) {
    const li = document.createElement('li')
    li.textContent = 'None'
    list.append(li)
    return
  }
  for (const row of rows) {
    const li = document.createElement('li')
    const label = document.createElement('span')
    const value = document.createElement('strong')
    label.textContent = row.label
    value.textContent = row.value
    li.append(label, value)
    list.append(li)
  }
}

function setText(selector: string, value: string): void {
  const node = root?.querySelector<HTMLElement>(selector) || document.querySelector<HTMLElement>(selector)
  if (node) node.textContent = value
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function number(value: number): string {
  return new Intl.NumberFormat('en-US').format(value)
}
