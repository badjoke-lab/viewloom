import './preview.css'
import { buildKickStreamMapPreviewModel } from './preview-model.mjs'
import { buildKickCountryPreviewModel, type KickCountryPreviewModel } from './country-preview-model.mjs'
import type { KickCountryPreviewMapController } from './country-preview-map'

type PreviewModel = ReturnType<typeof buildKickStreamMapPreviewModel>

const root = document.querySelector<HTMLElement>('[data-kick-map-preview]')
if (!root) throw new Error('Kick Stream Map preview root is missing')

let countryModel: KickCountryPreviewModel | null = null
let mapController: KickCountryPreviewMapController | null = null
let selectedCountryCode: string | null = null
let interactionsBound = false

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
    const readiness = buildKickStreamMapPreviewModel(payload)
    countryModel = buildKickCountryPreviewModel(payload, { allowGeography: readiness.canRenderCountryGeography })
    renderReadiness(readiness, countryModel)
    await renderCountrySurface(countryModel)
  } catch (error) {
    setText('[data-kick-preview-state]', 'Unavailable')
    setText('[data-kick-preview-gate-heading]', 'Preview data unavailable')
    setText('[data-kick-preview-gate-detail]', error instanceof Error ? error.message : String(error))
  }
}

function renderReadiness(model: PreviewModel, country: KickCountryPreviewModel): void {
  setText('[data-kick-preview-state]', model.presentation.state)
  setText('[data-kick-preview-updated]', model.updatedAt || '—')
  setText('[data-kick-preview-observed]', number(model.coverage.observedStreams))
  setText('[data-kick-preview-stable]', number(model.coverage.stableIdentityStreams))
  setText('[data-kick-preview-mapped]', number(country.accounting.mappedStreams))
  setText('[data-kick-preview-unmapped]', number(model.coverage.unmappedStreams))
  setText('[data-kick-preview-excluded]', number(country.accounting.excludedStreams))
  setText('[data-kick-preview-conflicts]', number(country.accounting.conflictStreams))
  setText('[data-kick-preview-gate-heading]', model.presentation.heading)
  setText('[data-kick-preview-gate-detail]', model.presentation.detail)

  const gate = root?.querySelector<HTMLElement>('[data-kick-preview-gate]')
  if (gate) gate.dataset.ready = String(model.canRenderCountryGeography)

  renderList('[data-kick-preview-blockers]', model.blockers.map((label) => ({ label, value: 'blocked' })))
  renderList(
    '[data-kick-preview-reasons]',
    model.coverage.reasonRows.map((row) => ({ label: row.reason, value: number(row.count) })),
  )

  const contract = model.stableIdentityContractValid && country.contractSafe
    ? 'broadcaster_user_id only'
    : 'invalid contract'
  setText('[data-kick-preview-identity-contract]', contract)
  setText('[data-kick-preview-activation]', model.publicActivationAuthorized ? 'authorized' : 'not authorized')
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
  if (results) results.hidden = false
  if (metric) metric.disabled = false

  renderCountryRows(model)
  renderStreamRows(model)
  setText(
    '[data-kick-preview-reconciliation]',
    model.accounting.reconciliationPasses
      ? `Reconciliation passes · ${number(model.accounting.observedStreams)} observed streams accounted for.`
      : 'Reconciliation failed · Country preview remains review-only.',
  )

  const { renderKickCountryPreviewMap } = await import('./country-preview-map')
  mapController?.destroy()
  mapController = await renderKickCountryPreviewMap(mapRoot, model)
  bindInteractions()
}

function bindInteractions(): void {
  if (interactionsBound) return
  interactionsBound = true

  root?.querySelector<HTMLSelectElement>('[data-kick-preview-metric]')?.addEventListener('change', (event) => {
    const value = (event.currentTarget as HTMLSelectElement).value
    mapController?.setMetric(value === 'streams' ? 'streams' : 'viewers')
  })

  root?.querySelector<HTMLElement>('[data-kick-preview-map]')?.addEventListener('kick-country-select', (event) => {
    const detail = (event as CustomEvent<{ countryCode?: string }>).detail
    selectCountry(detail?.countryCode || null)
  })

  root?.querySelector<HTMLButtonElement>('[data-kick-preview-world]')?.addEventListener('click', () => selectCountry(null))
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

function renderStreamRows(model: KickCountryPreviewModel): void {
  const list = root?.querySelector<HTMLElement>('[data-kick-preview-streams]')
  if (!list) return
  list.replaceChildren()
  const rows = selectedCountryCode
    ? model.mappedStreams.filter((row) => row.countryCode === selectedCountryCode)
    : model.mappedStreams
  setText(
    '[data-kick-preview-stream-heading]',
    selectedCountryCode ? `${selectedCountryCode} mapped streams` : 'Mapped streams',
  )

  if (rows.length === 0) {
    const empty = document.createElement('p')
    empty.className = 'kick-map-preview__empty'
    empty.textContent = 'No mapped Kick streams in this Country selection.'
    list.append(empty)
    return
  }

  for (const row of rows.sort((a, b) => b.viewers - a.viewers || a.displayName.localeCompare(b.displayName))) {
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

function selectCountry(countryCode: string | null): void {
  selectedCountryCode = countryCode && /^[A-Z]{2}$/.test(countryCode.toUpperCase()) ? countryCode.toUpperCase() : null
  mapController?.selectCountry(selectedCountryCode)
  if (countryModel) {
    renderCountryRows(countryModel)
    renderStreamRows(countryModel)
  }
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

function number(value: number): string {
  return new Intl.NumberFormat('en-US').format(value)
}
