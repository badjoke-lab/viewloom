import './styles.css'
import { applyDataState, getDataStateAttribute, getDataStateLabel, getDataStateNote, normalizeDataState } from './shared/data-state'
import { getHeroEyebrow, getUnofficialBadge } from './shared/labels'

const app = document.querySelector<HTMLDivElement>('#app')
if (!app) throw new Error('#app not found')

ensureStatusStyles()

app.innerHTML = `
<div class="page-shell page-shell--site theme-kick status-page">
  <header class="site-header"><a class="brand" href="/">ViewLoom</a><nav class="site-nav" aria-label="Primary"><a class="nav-link" href="/">Portal</a><a class="nav-link" href="/twitch/">Twitch data</a><a class="nav-link is-current" href="/kick/">Kick data</a></nav><div class="header-note">Unofficial Kick data</div></header>
  <main class="page-main status-main">
    <section class="hero hero--site hero--feature status-hero"><div><div class="eyebrow">${getHeroEyebrow('kick','status')}</div><h1>Data Status</h1><p class="hero-copy">Current health, freshness, source mode, and limitations for ViewLoom's Kick observations.</p></div><aside class="status-panel"><div class="status-panel__label">${getUnofficialBadge('kick')}</div><div class="status-panel__title vl-data-state" id="overall-state" data-state="loading">Checking status</div><p id="overall-note">Loading current Kick data state.</p></aside></section>
    <nav class="site-subnav vl-feature-nav" aria-label="Feature navigation"><a class="subnav-link" href="/kick/heatmap/">Heatmap</a><a class="subnav-link" href="/kick/day-flow/">Day Flow</a><a class="subnav-link" href="/kick/battle-lines/">Battle Lines</a><a class="subnav-link" href="/kick/history/">History</a><a class="subnav-link is-current" href="/kick/status/">Data Status</a></nav>
    <section class="status-toolbar" aria-label="Status actions"><span>Refresh the latest Kick status response.</span><button class="button button--primary" id="status-refresh" type="button">Refresh</button></section>
    <section class="summary-grid status-summary" id="status-summary"></section>
    <section class="feature-layout status-layout"><article class="chart-stage status-card"><div class="chart-stage__label">Collector Truth</div><h2>Collector and Source Mode</h2><div id="collector-health"></div></article><aside class="rail-stack"><section class="rail-card status-card"><div class="rail-card__label">DB_KICK_HOT / vl_kick_hot</div><div id="coverage-panel"></div></section><section class="rail-card status-card"><div class="rail-card__label">Source Modes</div><div id="source-modes"></div></section></aside></section>
    <section class="rail-card status-card status-observed-channels"><div class="rail-card__label">Latest observed channels</div><h2>Seed-list observations</h2><div id="observed-channels"></div></section>
    <section class="support-grid support-grid--feature status-feature-grid" id="feature-matrix"></section>
    <section class="support-grid support-grid--feature status-notes-grid" id="status-notes"></section>
    <details class="rail-card status-debug"><summary>Show debug details</summary><pre id="debug-details"></pre></details>
  </main>
</div>`

const refresh = document.querySelector<HTMLButtonElement>('#status-refresh')
refresh?.addEventListener('click', () => void loadStatus())
void loadStatus()

async function loadStatus(): Promise<void> {
  applyDataState(document.getElementById('overall-state'), 'loading')
  setText('overall-state', getDataStateLabel('loading'))
  setText('overall-note', getDataStateNote('loading'))
  setHtml('status-summary', ['Current state','Collected at','Latest bucket','Streams','Source mode'].map((item) => card(item, '—', 'Loading...')).join(''))
  setHtml('status-notes', renderNotes(['Loading limitations and notes.'], []))
  try {
    const response = await fetch('/api/kick-status', { cache: 'no-store' })
    render(await response.json())
  } catch (error) {
    render({ state: 'error', sourceMode: 'unknown', error: { message: error instanceof Error ? error.message : 'Status request failed' }, features: [], limitations: ['Kick status request failed before limitations could be loaded.'] })
  }
}

function render(payload: any): void {
  const normalizedState = normalizeKickState(payload.state, payload.sourceMode)
  const state = getDataStateLabel(normalizedState)
  const latest = payload.latestSnapshot ?? {}
  const freshness = payload.freshness ?? {}
  applyDataState(document.getElementById('overall-state'), normalizedState)
  setText('overall-state', `${state} · ${payload.sourceMode ?? 'unknown'}`)
  setText('overall-note', payload.error?.message ?? kickStateNote(normalizedState, payload.sourceMode))
  setHtml('status-summary', [
    card('Current state', state, kickStateNote(normalizedState, payload.sourceMode), normalizedState),
    card('Collected at', value(latest.collectedAt ?? freshness.lastSuccessAt), `${value(freshness.minutesSinceSuccess)} minutes since collection.`),
    card('Latest bucket', value(latest.bucketMinute), 'Most recent Kick bucket_minute in DB_KICK_HOT.'),
    card('Streams / viewers', `${value(latest.streamCount ?? latest.observedCount)} / ${value(latest.totalViewers)}`, 'Latest stream_count and total_viewers when available.'),
    card('Source mode', value(payload.sourceMode), 'fixture, public-channel-fallback, empty-public-channel-fallback, or authenticated.'),
  ].join(''))
  setHtml('collector-health', kv(payload.collector ?? {}))
  setHtml('coverage-panel', kv({ ...(payload.storage ?? {}), ...(payload.latestSnapshot ?? {}) }))
  setHtml('source-modes', renderSourceModes(payload.sourceModes ?? []))
  setHtml('observed-channels', renderObservedChannels(payload.latestObservedChannels ?? []))
  setHtml('feature-matrix', renderFeatures(payload.features ?? []))
  setHtml('status-notes', renderNotes(payload.limitations ?? [], payload.notes ?? []))
  setText('debug-details', JSON.stringify(payload, null, 2))
}

function renderFeatures(features: any[]): string {
  if (!features.length) return '<article class="support-card"><h2>No feature rows</h2><p>Status data is unavailable.</p></article>'
  return features.map((f) => `<article class="support-card" data-state="${getDataStateAttribute(f.state)}"><div class="support-card__label">${text(f.role)}</div><h2>${text(f.label)}</h2><p>${text(getDataStateLabel(f.state))} · ${text(f.source)} · ${text(f.knownGap)}</p><a class="button button--secondary" href="${text(f.pagePath)}">Open</a></article>`).join('')
}

function renderObservedChannels(channels: any[]): string {
  if (!Array.isArray(channels) || channels.length === 0) return '<p class="status-muted">No observed Kick channels in the latest snapshot.</p>'
  return `<div class="status-channel-list">${channels.map((channel) => `<article class="status-channel-row"><div><span>${text(channel.slug ?? channel.displayName)}</span><strong>${text(channel.displayName ?? channel.slug)}</strong><p>${text(channel.title ?? '')}</p></div><div><strong>${text(formatNumber(channel.viewers))}</strong><a href="${text(channel.url ?? '')}" target="_blank" rel="noreferrer">Open</a></div></article>`).join('')}</div>`
}

function renderSourceModes(rows: any[]): string {
  if (!Array.isArray(rows) || rows.length === 0) return '<p class="status-muted">No Kick source modes are present yet.</p>'
  return `<div class="status-kv">${rows.map((row) => `<div><span>${text(row.source_mode ?? 'unknown')}</span><strong>${text(row.rows ?? 0)} rows</strong></div>`).join('')}</div>`
}

function renderNotes(limitations: unknown[], notes: unknown[]): string {
  const limitationItems = Array.isArray(limitations) && limitations.length > 0 ? limitations : ['No explicit limitations were returned by the status API.']
  const noteItems = Array.isArray(notes) && notes.length > 0 ? notes : ['No additional status notes.']
  return `<article class="support-card status-note-card"><div class="support-card__label">Known limitations</div><h2>Read before using Kick data</h2><ul>${limitationItems.map((item) => `<li>${text(item)}</li>`).join('')}</ul></article><article class="support-card status-note-card"><div class="support-card__label">Current notes</div><h2>Pipeline notes</h2><ul>${noteItems.map((item) => `<li>${text(item)}</li>`).join('')}</ul></article>`
}

function normalizeKickState(state: unknown, sourceMode?: unknown) {
  const mode = String(sourceMode ?? '').toLowerCase()
  if (mode === 'fixture') return normalizeDataState('demo')
  return normalizeDataState(state)
}

function kickStateNote(state: unknown, sourceMode?: unknown): string {
  const mode = String(sourceMode ?? '').toLowerCase()
  if (mode === 'fixture') return 'Latest Kick rows are fixture data and must not be interpreted as live production data.'
  if (mode === 'public-channel-fallback') return 'Kick rows come from the public channel fallback and configured seed slugs.'
  if (mode === 'authenticated') return 'Kick rows are marked authenticated.'
  return getDataStateNote(state)
}

function kv(input: Record<string, unknown>): string { return `<div class="status-kv">${Object.entries(input).map(([k,v]) => `<div><span>${text(k)}</span><strong>${text(v)}</strong></div>`).join('')}</div>` }
function card(labelText: string, valueText: string, body: string, state?: unknown): string { const stateAttr = state == null ? '' : ` data-state="${getDataStateAttribute(state)}"`; return `<article class="summary-card status-summary-card"${stateAttr}><div class="summary-card__label">${text(labelText)}</div><div class="summary-card__value">${text(valueText)}</div><p>${text(body)}</p></article>` }
function value(v: unknown): string { return v == null ? '—' : String(v) }
function formatNumber(v: unknown): string { const n = typeof v === 'number' ? v : Number(v); return Number.isFinite(n) ? Math.round(n).toLocaleString('en-US') : '—' }
function text(v: unknown): string { const n = document.createElement('span'); n.textContent = value(v); return n.innerHTML }
function setText(id: string, v: string): void { const n = document.getElementById(id); if (n) n.textContent = v }
function setHtml(id: string, v: string): void { const n = document.getElementById(id); if (n) n.innerHTML = v }

function ensureStatusStyles(): void {
  if (document.querySelector('#status-page-polish')) return
  const style = document.createElement('style')
  style.id = 'status-page-polish'
  style.textContent = `.status-toolbar{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:14px;padding:12px 14px;border:1px solid var(--border);border-radius:18px;background:rgba(12,21,37,.74);box-shadow:var(--shadow)}.status-toolbar span{color:var(--muted);font-size:.92rem;line-height:1.4}.status-toolbar .button{white-space:nowrap}.status-summary{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:14px;margin-top:18px}.status-summary-card{min-height:150px;background:var(--card);border:1px solid var(--border);border-radius:var(--radius-lg);padding:18px;box-shadow:var(--shadow);position:relative;overflow:hidden}.status-summary-card::before{content:'';position:absolute;inset:0;background:radial-gradient(circle at top right,rgba(var(--accent-rgb),.16),transparent 38%);pointer-events:none}.status-summary-card>*{position:relative}.summary-card__label{font-size:.72rem;letter-spacing:.12em;text-transform:uppercase;color:rgba(var(--accent-rgb),.9);font-weight:700}.summary-card__value{margin-top:8px;font-size:1.25rem;font-weight:800;color:var(--text);overflow-wrap:anywhere}.status-summary-card p{margin:8px 0 0;color:var(--muted);line-height:1.45}.status-layout{margin-top:22px}.status-card{min-height:100%}.status-kv{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:12px}.status-kv div{padding:12px;border:1px solid rgba(255,255,255,.07);border-radius:14px;background:rgba(255,255,255,.035)}.status-kv span{display:block;margin-bottom:5px;color:var(--muted);font-size:.78rem}.status-kv strong{display:block;color:var(--text);font-size:.95rem;overflow-wrap:anywhere}.status-observed-channels{margin-top:22px}.status-channel-list{display:grid;gap:10px;margin-top:14px}.status-channel-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:center;padding:12px;border:1px solid rgba(255,255,255,.07);border-radius:14px;background:rgba(255,255,255,.035)}.status-channel-row span{display:block;color:rgba(var(--accent-rgb),.9);font-size:.74rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase}.status-channel-row strong{display:block;color:var(--text);overflow-wrap:anywhere}.status-channel-row p{margin:4px 0 0;color:var(--muted);line-height:1.4}.status-channel-row a{display:inline-flex;margin-top:6px;color:var(--text);text-decoration:none;border:1px solid rgba(148,163,184,.24);border-radius:999px;padding:5px 9px}.status-feature-grid,.status-notes-grid{margin-top:22px}.status-note-card ul{margin:12px 0 0;padding-left:20px;color:var(--muted);line-height:1.6}.status-debug{margin-top:18px}.status-debug pre{white-space:pre-wrap;overflow:auto;color:var(--muted);font-size:.8rem}.status-muted{color:var(--muted)}@media(max-width:1080px){.status-summary{grid-template-columns:repeat(2,minmax(0,1fr))}.status-kv{grid-template-columns:1fr}}@media(max-width:760px){.status-toolbar,.status-channel-row{align-items:flex-start;grid-template-columns:1fr;flex-direction:column}.status-summary{grid-template-columns:1fr}.status-summary-card{min-height:auto}}`
  document.head.append(style)
}
