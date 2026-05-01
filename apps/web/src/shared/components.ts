export type DataState = 'Fresh' | 'Partial' | 'Stale' | 'Empty' | 'Demo' | 'Error'
export type DataSource = 'Real' | 'Demo'

export type KpiCardInput = {
  label: string
  value: string
  body?: string
}

export function escapeText(value: unknown): string {
  return String(value ?? '')
}

export function renderStatusPill(label: string): string {
  return `<span class="vl-status-pill">${escapeText(label)}</span>`
}

export function renderKpiCard(input: KpiCardInput): string {
  return `<article class="summary-card vl-kpi-card"><div class="summary-card__label">${escapeText(input.label)}</div><div class="summary-card__value">${escapeText(input.value)}</div>${input.body ? `<p>${escapeText(input.body)}</p>` : ''}</article>`
}
