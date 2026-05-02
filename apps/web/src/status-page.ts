import './styles.css'
import { getHeroEyebrow, getUnofficialBadge } from './shared/labels'

const app = document.querySelector<HTMLDivElement>('#app')
if (!app) throw new Error('#app not found')

app.innerHTML = `
<div class="page-shell page-shell--site theme-twitch status-page">
  <header class="site-header"><a class="brand" href="/">ViewLoom</a><nav class="site-nav" aria-label="Primary"><a class="nav-link" href="/">Portal</a><a class="nav-link is-current" href="/twitch/">Twitch data</a><a class="nav-link" href="/kick/">Kick data</a></nav><div class="header-note">Unofficial Twitch data</div></header>
  <main class="page-main status-main">
    <section class="hero hero--site hero--feature status-hero"><div><div class="eyebrow">${getHeroEyebrow('twitch','status')}</div><h1>Data Status</h1><p class="hero-copy">Current health, freshness, and coverage for ViewLoom's Twitch observations.</p><div class="hero-actions"><button class="button button--primary" id="status-refresh" type="button">Refresh</button></div></div><aside class="status-panel"><div class="status-panel__label">${getUnofficialBadge('twitch')}</div><div class="status-panel__title" id="overall-state">Checking status</div><p id="overall-note">Loading current data state.</p></aside></section>
    <nav class="site-subnav vl-feature-nav" aria-label="Feature navigation"><a class="subnav-link" href="/twitch/heatmap/">Heatmap</a><a class="subnav-link" href="/twitch/day-flow/">Day Flow</a><a class="subnav-link" href="/twitch/battle-lines/">Battle Lines</a><a class="subnav-link" href="/twitch/history/">History</a><a class="subnav-link is-current" href="/twitch/status/">Status</a></nav>
    <section class="summary-grid" id="status-summary"></section>
    <section class="feature-layout"><article class="chart-stage"><div class="chart-stage__label">Collector Health</div><h2>Collector</h2><div id="collector-health"></div></article><aside class="rail-stack"><section class="rail-card"><div class="rail-card__label">Latest Snapshot / Coverage</div><div id="coverage-panel"></div></section><section class="rail-card"><div class="rail-card__label">Data Pipeline</div><ol><li>Collector</li><li>Minute snapshots</li><li>Feature APIs</li><li>ViewLoom pages</li></ol></section></aside></section>
    <section class="support-grid support-grid--feature" id="feature-matrix"></section>
    <details class="rail-card"><summary>Show debug details</summary><pre id="debug-details"></pre></details>
  </main>
</div>`

const refresh = document.querySelector<HTMLButtonElement>('#status-refresh')
refresh?.addEventListener('click', () => void loadStatus())
void loadStatus()

async function loadStatus(): Promise<void> {
  setHtml('status-summary', ['Current state','Last success','Latest snapshot','Coverage','Source'].map((item) => card(item, '—', 'Loading...')).join(''))
  try {
    const response = await fetch('/api/twitch-status', { cache: 'no-store' })
    const payload = await response.json()
    render(payload)
  } catch (error) {
    render({ state: 'error', sourceMode: 'demo', error: { message: error instanceof Error ? error.message : 'Status request failed' }, features: [] })
  }
}

function render(payload: any): void {
  const state = label(payload.state ?? 'unknown')
  setText('overall-state', `${state} · ${payload.sourceMode ?? 'unknown'}`)
  setText('overall-note', payload.error?.message ?? note(payload.state))
  const freshness = payload.freshness ?? {}
  const latest = payload.latestSnapshot ?? {}
  const coverage = payload.coverage ?? {}
  setHtml('status-summary', [
    card('Current state', state, note(payload.state)),
    card('Last success', value(freshness.lastSuccessAt), `${value(freshness.minutesSinceSuccess)} minutes since success.`),
    card('Latest snapshot', value(latest.bucketMinute), `${value(latest.observedCount)} observed streams.`),
    card('Coverage', label(coverage.state ?? 'unknown'), `${value(latest.coveredPages)} pages · has more: ${value(latest.hasMore)}`),
    card('Source', value(payload.sourceMode), 'real, stale, or demo state.'),
  ].join(''))
  setHtml('collector-health', kv(payload.collector ?? {}))
  setHtml('coverage-panel', kv(latest))
  setHtml('feature-matrix', renderFeatures(payload.features ?? []))
  setText('debug-details', JSON.stringify(payload, null, 2))
}

function renderFeatures(features: any[]): string {
  if (!features.length) return '<article class="support-card"><h2>No feature rows</h2><p>Status data is unavailable.</p></article>'
  return features.map((f) => `<article class="support-card"><div class="support-card__label">${text(f.role)}</div><h2>${text(f.label)}</h2><p>${text(f.state)} · ${text(f.source)} · ${text(f.knownGap)}</p><a class="button button--secondary" href="${text(f.pagePath)}">Open</a></article>`).join('')
}

function kv(input: Record<string, unknown>): string { return `<div class="status-kv">${Object.entries(input).map(([k,v]) => `<p><strong>${text(k)}</strong><br>${text(v)}</p>`).join('')}</div>` }
function card(labelText: string, valueText: string, body: string): string { return `<article class="summary-card"><div class="summary-card__label">${text(labelText)}</div><div class="summary-card__value">${text(valueText)}</div><p>${text(body)}</p></article>` }
function note(s: unknown): string { const v = String(s ?? '').toLowerCase(); if (v === 'fresh') return 'Recent real data is available.'; if (v === 'partial') return 'Data is real, but coverage is limited.'; if (v === 'stale') return 'Real data exists, but collection is delayed.'; if (v === 'empty') return 'The pipeline is working, but no qualifying streams were observed.'; if (v === 'demo') return 'Demo data is shown.'; return 'Current state is being checked.' }
function label(v: unknown): string { return String(v ?? '—').replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()) }
function value(v: unknown): string { return v == null ? '—' : String(v) }
function text(v: unknown): string { const n = document.createElement('span'); n.textContent = value(v); return n.innerHTML }
function setText(id: string, v: string): void { const n = document.getElementById(id); if (n) n.textContent = v }
function setHtml(id: string, v: string): void { const n = document.getElementById(id); if (n) n.innerHTML = v }
