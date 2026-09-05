import './preview.css'
import { buildKickStreamMapPreviewModel } from './preview-model.mjs'

type PreviewModel = ReturnType<typeof buildKickStreamMapPreviewModel>

const root = document.querySelector<HTMLElement>('[data-kick-map-preview]')
if (!root) throw new Error('Kick Stream Map preview root is missing')

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
    render(buildKickStreamMapPreviewModel(payload))
  } catch (error) {
    setText('[data-kick-preview-state]', 'Unavailable')
    setText('[data-kick-preview-gate-heading]', 'Preview data unavailable')
    setText('[data-kick-preview-gate-detail]', error instanceof Error ? error.message : String(error))
  }
}

function render(model: PreviewModel): void {
  setText('[data-kick-preview-state]', model.presentation.state)
  setText('[data-kick-preview-updated]', model.updatedAt || '—')
  setText('[data-kick-preview-observed]', number(model.coverage.observedStreams))
  setText('[data-kick-preview-stable]', number(model.coverage.stableIdentityStreams))
  setText('[data-kick-preview-mapped]', number(model.coverage.mappedStreams))
  setText('[data-kick-preview-unmapped]', number(model.coverage.unmappedStreams))
  setText('[data-kick-preview-gate-heading]', model.presentation.heading)
  setText('[data-kick-preview-gate-detail]', model.presentation.detail)

  const gate = root?.querySelector<HTMLElement>('[data-kick-preview-gate]')
  if (gate) gate.dataset.ready = String(model.canRenderCountryGeography)

  renderList('[data-kick-preview-blockers]', model.blockers.map((label) => ({ label, value: 'blocked' })))
  renderList(
    '[data-kick-preview-reasons]',
    model.coverage.reasonRows.map((row) => ({ label: row.reason, value: number(row.count) })),
  )

  const contract = model.stableIdentityContractValid ? 'broadcaster_user_id only' : 'invalid contract'
  setText('[data-kick-preview-identity-contract]', contract)
  setText('[data-kick-preview-activation]', model.publicActivationAuthorized ? 'authorized' : 'not authorized')
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
