import { buildKickCountryPreviewModel, type KickCountryPreviewModel } from './country-preview-model.mjs'
import type { KickCountryPreviewMapController } from './country-preview-map'

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
  }
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
  activation?: {
    publicCountryActivationReady?: boolean
    blockers?: string[]
  }
  coverage?: Record<string, any>
  semantics?: Record<string, any>
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
const clearCountry = document.querySelector<HTMLButtonElement>('[data-clear-selected-country]')
const metricButtons = [...document.querySelectorAll<HTMLButtonElement>('[data-kick-metric]')]
const worldButton = document.querySelector<HTMLButtonElement>('[data-kick-world]')

let payload: KickPayload | null = null
let countryModel: KickCountryPreviewModel | null = null
let mapController: KickCountryPreviewMapController | null = null
let selectedCountryCode: string | null = null
let metric: 'streams' | 'viewers' = 'viewers'
let mapRenderId = 0

for (const select of [populationTop, populationMinViewers]) select?.addEventListener('change', () => void render())
resetPopulation?.addEventListener('click', () => {
  if (populationTop) populationTop.value = '100'
  if (populationMinViewers) populationMinViewers.value = '0'
  void render()
})
clearCountry?.addEventListener('click', () => selectCountry(null))
worldButton?.addEventListener('click', () => selectCountry(null))
for (const button of metricButtons) {
  button.addEventListener('click', () => {
    metric = button.dataset.kickMetric === 'streams' ? 'streams' : 'viewers'
    for (const candidate of metricButtons) candidate.dataset.active = String(candidate === button)
    mapController?.setMetric(metric)
  })
}
mapRoot?.addEventListener('kick-country-select', (event) => {
  const code = (event as CustomEvent<{ countryCode?: string }>).detail?.countryCode
  selectCountry(code || null)
})

void boot()

async function boot(): Promise<void> {
  setState('Loading')
  showMapStatus('Loading live Kick geography…', 'No demo geography will be substituted.')
  try {
    const response = await fetch('/api/kick-stream-map', {
      headers: { accept: 'application/json' },
      cache: 'no-store',
    })
    if (!response.ok) throw new Error(`Kick Stream Map API HTTP ${response.status}`)
    const next = await response.json() as KickPayload
    validatePayload(next)
    payload = next
    await render()
  } catch (error) {
    renderFailure(error instanceof Error ? error.message : String(error))
  }
}

function validatePayload(next: KickPayload): void {
  const provider = String(next.provider ?? next.platform ?? '').trim().toLowerCase()
  if (provider !== 'kick' || next.source !== 'real' || next.geographyMode !== 'country') {
    throw new Error('Unexpected Kick Stream Map data contract.')
  }
  if (next.publicActivationAuthorized !== true || next.activation?.publicCountryActivationReady !== true) {
    throw new Error('Kick Country public activation is not ready.')
  }
  if (!next.coverage || !next.semantics || !Array.isArray(next.mappedStreams)) {
    throw new Error('Kick Stream Map accounting is incomplete.')
  }
}

async function render(): Promise<void> {
  if (!payload) return
  const current = filterPopulation(payload)
  countryModel = buildKickCountryPreviewModel(current, { allowGeography: true })
  const reconciliation = current.coverage?.reconciliation?.passes === true
  const ready = countryModel.contractSafe && reconciliation

  if (!ready) {
    renderFailure(countryModel.contractSafe ? 'Kick Stream Map reconciliation failed.' : 'Kick Stream Map response contract is unsafe.')
    return
  }

  const coverage = current.coverage ?? {}
  const observed = count(coverage.observedStreams)
  const observedViewers = count(coverage.observedViewers)
  const mapped = count(coverage.mappedStreams)
  const mappedViewers = count(coverage.mappedViewers)
  const unmapped = count(coverage.unmappedStreams)
  const excluded = count(coverage.excludedStreams)
  const excludedViewers = count(coverage.excludedViewers)
  const conflicts = count(coverage.conflictStreams)
  const mappedPercent = ratio(mapped, observed)
  const mappedViewerPercent = ratio(mappedViewers, observedViewers)

  setState(observed === 0 ? 'Empty' : 'Ready')
  text('stream-map-observed', format(observed))
  text('stream-map-mapped', format(mapped))
  text('stream-map-unmapped', format(unmapped))
  text('stream-map-strip-updated', payload.updatedAt ? formatAgo(payload.updatedAt) : 'Unavailable')
  text('stream-map-strip-coverage', `${percent(mappedPercent)} streams · ${percent(mappedViewerPercent)} viewers`)
  text('stream-map-population-summary', populationSummary())
  text('stream-map-population-state', `${format(observed)} streams · ${format(observedViewers)} viewers selected from the observed Kick Top 100.`)
  text('stream-map-card-mapped', `${format(mapped)} / ${format(observed)}`)
  text('stream-map-card-viewers', `${format(mappedViewers)} / ${format(observedViewers)}`)
  text('stream-map-card-excluded', `${format(excluded)} streams · ${format(excludedViewers)} viewers`)
  text('stream-map-unmapped-current', format(unmapped))
  text('stream-map-conflict-current', format(conflicts))
  text('stream-map-excluded-current', format(excluded))
  text('stream-map-country-count', format(countryModel.countryRows.length))
  text('stream-map-conflict-count', format(conflicts))
  text('stream-map-unmapped-reconciliation', reconciliation
    ? `Reconciliation passes · ${format(observed)} selected streams are accounted for.`
    : 'Reconciliation failed · public geography is fail-closed.')

  if (selectedCountryCode && !countryModel.countryRows.some((row) => row.countryCode === selectedCountryCode)) {
    selectedCountryCode = null
  }

  renderReasons(current)
  renderExcluded(current)
  renderCountryRows(countryModel)
  renderSelectedCountry(countryModel)
  renderStreamRows(countryModel)
  await renderMap(countryModel)
}

function filterPopulation(source: KickPayload): KickPayload {
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

  const observedStreams = selected.length
  const observedViewers = sum(selected)
  const mappedViewers = sum(mappedStreams)
  const unmappedViewers = sum(unmappedStreams)
  const excludedViewers = sum(excludedStreams)
  const conflictViewers = sum(conflictStreams)
  const unmappedReasons: Record<string, number> = {}
  for (const row of unmappedStreams) {
    const reason = String(row.geography?.reason ?? 'unmapped').trim() || 'unmapped'
    unmappedReasons[reason] = (unmappedReasons[reason] ?? 0) + 1
  }

  return {
    ...source,
    mappedStreams,
    unmappedStreams,
    excludedStreams,
    conflictStreams,
    coverage: {
      ...(source.coverage ?? {}),
      observedStreams,
      observedViewers,
      mappedStreams: mappedStreams.length,
      mappedViewers,
      mappedCountryCount: new Set(mappedStreams.map((row) => row.geography?.countryCode).filter(Boolean)).size,
      unmappedStreams: unmappedStreams.length,
      unmappedViewers,
      excludedStreams: excludedStreams.length,
      excludedViewers,
      conflictStreams: conflictStreams.length,
      conflictViewers,
      unmappedReasons,
      reconciliation: {
        selectedPopulation: observedStreams,
        reconciledPopulation: mappedStreams.length + unmappedStreams.length + excludedStreams.length + conflictStreams.length,
        passes: mappedStreams.length + unmappedStreams.length + excludedStreams.length + conflictStreams.length === observedStreams,
      },
    },
  }
}

async function renderMap(model: KickCountryPreviewModel): Promise<void> {
  const renderId = ++mapRenderId
  mapController?.destroy()
  mapController = null

  if (!mapRoot) return
  mapRoot.replaceChildren()
  if (model.countryRows.length === 0) {
    mapRoot.dataset.mapState = 'empty'
    showMapStatus('No reviewed Country rows in this view', 'The selected population is valid, but no accepted Country placement is currently visible.')
    return
  }

  mapRoot.dataset.mapState = 'basemap-loading'
  showMapStatus('Loading live Kick geography…', 'No demo geography will be substituted.')
  const { renderKickCountryPreviewMap } = await import('./country-preview-map')
  const controller = await renderKickCountryPreviewMap(mapRoot, model)
  if (renderId !== mapRenderId) {
    controller?.destroy()
    return
  }
  if (!controller) throw new Error('Kick Country map renderer did not initialize.')
  mapController = controller
  mapController.setMetric(metric)
  mapController.selectCountry(selectedCountryCode)
  mapRoot.dataset.mapState = 'basemap-ready'
  if (mapStatus) {
    mapStatus.dataset.state = 'ready'
    mapStatus.style.display = 'none'
  }
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
    const row = document.createElement('button')
    row.type = 'button'
    row.className = 'stream-map-country-row'
    row.dataset.countryCode = country.countryCode
    row.setAttribute('aria-pressed', String(selectedCountryCode === country.countryCode))
    row.setAttribute('aria-label', `Show ${countryName(country.countryCode)} drilldown: ${country.streams} mapped streams, ${format(country.viewers)} viewers`)
    if (selectedCountryCode === country.countryCode) row.classList.add('is-selected')
    const name = document.createElement('strong')
    name.textContent = countryName(country.countryCode)
    const detail = document.createElement('span')
    detail.textContent = `${format(country.streams)} stream${country.streams === 1 ? '' : 's'} · ${format(country.viewers)} viewers`
    row.append(name, detail)
    row.addEventListener('click', () => selectCountry(country.countryCode))
    list.append(row)
  }
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
}

function renderStreamRows(model: KickCountryPreviewModel): void {
  const list = document.getElementById('stream-map-stream-list')
  if (!list) return
  list.replaceChildren()
  const rows = model.mappedStreams
    .filter((row) => !selectedCountryCode || row.countryCode === selectedCountryCode)
    .sort((a, b) => b.viewers - a.viewers || a.displayName.localeCompare(b.displayName))
  text('stream-map-stream-list-title', selectedCountryCode ? `${countryName(selectedCountryCode)} mapped streams` : 'Mapped streams')
  if (!rows.length) return list.append(empty(selectedCountryCode ? 'No mapped Kick stream in this country for the selected population.' : 'No mapped Kick stream matches the selected population.'))

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
    location.textContent = countryName(row.countryCode)
    const badges = document.createElement('div')
    badges.className = 'stream-map-badges'
    const badge = document.createElement('span')
    badge.className = 'stream-map-badge stream-map-badge--kick-reviewed'
    badge.textContent = 'Reviewed Country'
    badges.append(badge)
    article.append(head, location, badges)
    list.append(article)
  }
}

function selectCountry(value: string | null): void {
  const normalized = String(value ?? '').trim().toUpperCase()
  selectedCountryCode = /^[A-Z]{2}$/.test(normalized) ? normalized : null
  mapController?.selectCountry(selectedCountryCode)
  if (countryModel) {
    renderCountryRows(countryModel)
    renderSelectedCountry(countryModel)
    renderStreamRows(countryModel)
  }
}

function renderFailure(message: string): void {
  mapController?.destroy()
  mapController = null
  setState('Unavailable')
  if (mapRoot) {
    mapRoot.replaceChildren()
    mapRoot.dataset.mapState = 'data-error'
  }
  showMapStatus('Kick Stream Map unavailable', message)
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
  const hours = Math.round(minutes / 60)
  return `${hours}h ago`
}
