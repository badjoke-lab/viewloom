import './mock-cutover.css'

type Provider = 'portal' | 'twitch' | 'kick'
type PageKind = 'portal' | 'provider' | 'about' | 'support' | 'heatmap' | 'day-flow' | 'battle-lines' | 'history' | 'status'

type PageInfo = { provider: Provider; kind: PageKind }

type StatusPayload = {
  state?: string
  sourceMode?: string
  freshness?: { minutesSinceSuccess?: number | null; lastSuccessAt?: string | null }
  latestSnapshot?: { observedCount?: number | null; streamCount?: number | null; totalViewers?: number | null; bucketMinute?: string | null; collectedAt?: string | null }
  coverage?: { state?: string | null }
}

const app = document.querySelector<HTMLDivElement>('#app')
if (!app) throw new Error('#app not found')

const page = detectPage()
document.body.dataset.provider = page.provider
render(page)
void hydrate(page)

function detectPage(): PageInfo {
  const pageName = document.body.dataset.page ?? ''
  if (pageName === 'about') return { provider: 'portal', kind: 'about' }
  if (pageName === 'support') return { provider: 'portal', kind: 'support' }
  if (pageName === 'portal') return { provider: 'portal', kind: 'portal' }
  const provider: Provider = pageName.startsWith('kick') ? 'kick' : pageName.startsWith('twitch') ? 'twitch' : 'portal'
  if (pageName.endsWith('heatmap')) return { provider, kind: 'heatmap' }
  if (pageName.endsWith('day-flow')) return { provider, kind: 'day-flow' }
  if (pageName.endsWith('battle-lines')) return { provider, kind: 'battle-lines' }
  if (pageName.endsWith('history')) return { provider, kind: 'history' }
  if (pageName.endsWith('status')) return { provider, kind: 'status' }
  return { provider, kind: provider === 'portal' ? 'portal' : 'provider' }
}

function render(info: PageInfo): void {
  app.innerHTML = `<div class="site-frame">${masthead(info)}<main>${pageMarkup(info)}</main>${footer()}</div>`
  document.querySelector<HTMLButtonElement>('[data-mobile-menu]')?.addEventListener('click', () => {
    document.querySelector('.global-nav')?.classList.toggle('open')
  })
}

async function hydrate(info: PageInfo): Promise<void> {
  if (info.provider === 'portal') {
    const [twitch, kick] = await Promise.all([safeStatus('twitch'), safeStatus('kick')])
    setText('[data-twitch-state]', labelState(twitch?.state))
    setText('[data-kick-state]', labelState(kick?.state))
    setText('[data-twitch-observed]', formatCount(twitch?.latestSnapshot?.observedCount ?? twitch?.latestSnapshot?.streamCount))
    setText('[data-kick-observed]', formatCount(kick?.latestSnapshot?.observedCount ?? kick?.latestSnapshot?.streamCount))
    setText('[data-twitch-updated]', relativeMinutes(twitch?.freshness?.minutesSinceSuccess))
    setText('[data-kick-updated]', relativeMinutes(kick?.freshness?.minutesSinceSuccess))
    return
  }

  const status = await safeStatus(info.provider)
  const heatmap = await safeJson(`/api/${info.provider}-heatmap`).catch(() => null)
  setText('[data-current-state]', labelState(status?.state))
  setText('[data-source-mode]', String(status?.sourceMode ?? '—'))
  setText('[data-latest-update]', relativeMinutes(status?.freshness?.minutesSinceSuccess))
  setText('[data-observed-count]', formatCount(status?.latestSnapshot?.observedCount ?? status?.latestSnapshot?.streamCount ?? heatmap?.nodes?.length))
  setText('[data-total-viewers]', formatCount(status?.latestSnapshot?.totalViewers ?? heatmap?.summary?.totalViewers))
}

function masthead(info: PageInfo): string {
  const current = info.provider
  return `<header class="masthead"><div class="masthead__inner"><a class="brand" href="/"><span class="brand-mark">VL</span><span>ViewLoom<small>Live data observatory</small></span></a><button class="mobile-menu mobile-only" data-mobile-menu type="button">Menu</button><nav class="global-nav" aria-label="Global"><a href="/" ${current === 'portal' ? 'aria-current="page"' : ''}>Portal</a><a href="/twitch/" ${current === 'twitch' ? 'aria-current="page"' : ''}>Twitch data</a><a href="/kick/" ${current === 'kick' ? 'aria-current="page"' : ''}>Kick data</a><a href="/about/">About</a><a href="/support/">Support</a></nav><div class="status-inline"><span class="dot"></span><span>Unofficial data view</span></div></div></header>`
}

function footer(): string {
  return `<footer class="footer"><div>ViewLoom · Unofficial live-stream observation pages.</div><nav><a href="/about/">About</a><a href="/support/">Support</a><a href="https://docs.google.com/forms/d/e/1FAIpQLSdhreuxEz7w0eSjslTyVLL-axV6IJdTp5RU5VXCM3ApIz35-Q/viewform?usp=dialog" target="_blank" rel="noreferrer">Contact</a><a href="https://github.com/badjoke-lab/viewloom" target="_blank" rel="noreferrer">GitHub</a></nav></footer>`
}

function pageMarkup(info: PageInfo): string {
  if (info.kind === 'portal') return portalPage()
  if (info.kind === 'about') return aboutPage()
  if (info.kind === 'support') return supportPage()
  if (info.kind === 'provider') return providerHome(info.provider)
  if (info.kind === 'heatmap') return heatmapPage(info.provider)
  if (info.kind === 'day-flow') return dayFlowPage(info.provider)
  if (info.kind === 'battle-lines') return battleLinesPage(info.provider)
  if (info.kind === 'history') return historyPage(info.provider)
  return statusPage(info.provider)
}

function portalPage(): string {
  return `<section class="page"><div class="breadcrumb">Portal / Multi-platform observation</div><section class="page-head"><div><div class="kicker">VIEWLOOM · LIVE DATA OBSERVATORY</div><h1>Read live-stream movement without mixing platforms.</h1><p class="lede">ViewLoom separates Twitch and Kick into dedicated observation surfaces: Heatmap for now, Day Flow for today, Battle Lines for rivalry, and History for trends.</p></div><div class="head-facts"><div class="fact"><small>Twitch state</small><strong data-twitch-state>Checking</strong></div><div class="fact"><small>Kick state</small><strong data-kick-state>Checking</strong></div><div class="fact"><small>Twitch observed</small><strong data-twitch-observed>—</strong></div><div class="fact"><small>Kick observed</small><strong data-kick-observed>—</strong></div></div></section><div class="portal-grid"><article class="portal-panel portal-panel--twitch"><div><h2>Twitch data</h2><p>Open the Twitch observation surface and read current scale, daily movement, rivalries, and historical trends.</p><div class="portal-panel__stats"><div><small>State</small><strong data-twitch-state>—</strong></div><div><small>Observed</small><strong data-twitch-observed>—</strong></div><div><small>Updated</small><strong data-twitch-updated>—</strong></div></div></div><a class="button" href="/twitch/">Open Twitch data</a></article><article class="portal-panel portal-panel--kick"><div><h2>Kick data</h2><p>Open the Kick observation surface with the same visual language and separate status honesty for Kick coverage.</p><div class="portal-panel__stats"><div><small>State</small><strong data-kick-state>—</strong></div><div><small>Observed</small><strong data-kick-observed>—</strong></div><div><small>Updated</small><strong data-kick-updated>—</strong></div></div></div><a class="button" href="/kick/">Open Kick data</a></article></div>${observations('Current observations')}</section>`
}

function providerHome(provider: Provider): string {
  const name = cap(provider)
  return `<section class="page"><div class="breadcrumb">Portal / ${name} data</div>${providerTabs(provider)}<section class="page-head"><div><div class="kicker">${name.toUpperCase()} DATA · HOME</div><h1>${name} observation surface.</h1><p class="lede">Read ${name} live-stream movement through four dedicated views. The data state and limitations stay visible instead of being hidden behind marketing copy.</p></div>${facts()}</section><div class="provider-overview"><section class="surface"><div class="surface__head"><div><small>Current field</small><strong>Observed live surface</strong></div><a class="text-link" href="/${provider}/heatmap/">Open Heatmap</a></div><div class="surface__body">${miniHeatmap()}</div></section><aside>${observations('What changed')}</aside></div><section class="rule-title"><h2>Four ways to read ${name} data</h2><span>Now / Today / Rivalry / Trends</span></section>${featureDirectory(provider)}</section>`
}

function heatmapPage(provider: Provider): string {
  const name = cap(provider)
  return `<section class="page page--full"><div class="breadcrumb">${name} data / Heatmap</div>${featureTabs(provider, 'heatmap')}${featureHead(provider, 'NOW', 'Heatmap', 'Who is big, rising, or active right now.', true)}${toolbar(['Top 20','Top 50','Top 100','Wide','Split'])}<div class="data-strip"><div class="data-strip__title">Data state</div><div class="data-strip__cell"><small>State</small><strong data-current-state>Checking</strong></div><div class="data-strip__cell"><small>Observed</small><strong data-observed-count>—</strong></div><div class="data-strip__cell"><small>Total viewers</small><strong data-total-viewers>—</strong></div><div class="data-strip__cell"><small>Updated</small><strong data-latest-update>—</strong></div></div><div class="layout-split"><section class="heatmap-wrap">${mockTiles()}</section><aside class="surface inspector"><div class="surface__body"><div class="kicker">Selected stream</div><h2>Live field</h2><p class="lede">Tiles use area for viewers and color for movement. Select a tile to inspect the stream.</p><div class="inspector__row"><div><small>Top stream</small><strong>Observed leader</strong></div><span class="up">Live</span></div><div class="inspector__row"><div><small>Momentum</small><strong>Rising / flat / falling</strong></div></div><a class="text-link" href="/${provider}/battle-lines/">Compare in Battle Lines</a></div></aside></div></section>`
}

function dayFlowPage(provider: Provider): string {
  const name = cap(provider)
  return `<section class="page page--full"><div class="breadcrumb">${name} data / Day Flow</div>${featureTabs(provider, 'day-flow')}${featureHead(provider, 'TODAY', 'Day Flow', 'Read the day as an audience terrain.', true)}${toolbar(['Today','Yesterday','Volume','Share','Full','Top Focus'])}${dataStrip()}<div class="layout-split"><section class="chart-wrap">${dayFlowSvg()}</section><aside class="surface inspector"><div class="surface__body"><div class="kicker">Time focus</div><h2>Selected time</h2><div class="inspector__row"><div><small>Peak band</small><strong>Audience high point</strong></div></div><div class="rank-list">${rankRows(['Top stream','Second stream','Third stream'])}</div></div></aside></div></section>`
}

function battleLinesPage(provider: Provider): string {
  const name = cap(provider)
  return `<section class="page page--full"><div class="breadcrumb">${name} data / Battle Lines</div>${featureTabs(provider, 'battle-lines')}${featureHead(provider, 'RIVALRY', 'Battle Lines', 'Read who is competing, reversing, or closing the gap.', true)}${toolbar(['Recommended','Custom','Inspect','Viewers','Indexed','Top 5'])}${dataStrip()}<section class="chart-wrap">${battleSvg()}</section><section class="rule-title"><h2>Battle feed</h2><span>Reversals / pressure / gap changes</span></section>${observations('Recent rivalry events')}</section>`
}

function historyPage(provider: Provider): string {
  const name = cap(provider)
  return `<section class="page"><div class="breadcrumb">${name} data / History</div>${featureTabs(provider, 'history')}${featureHead(provider, 'TRENDS', 'History & Trends', 'Review what changed across observed days.', false)}${toolbar(['Last 7 days','Last 30 days','Viewer-minutes','Peak viewers'])}<div class="history-grid"><section class="chart-wrap">${historySvg()}</section><aside class="surface"><div class="surface__body"><div class="kicker">Top streamers</div><div class="rank-list">${rankRows(['Observed leader','Most viewer-minutes','Highest peak','Biggest rise'])}</div></div></aside></div><section class="rule-title"><h2>Daily archive</h2><span>Open Day Flow or Battle Lines for each day</span></section><div class="archive-grid">${[1,2,3].map((n)=>`<article class="archive-card"><time>Day ${n}</time><h3>Observed day summary</h3><p>Viewer-minutes, peak viewers, coverage, and rivalry links.</p><a class="text-link" href="/${provider}/day-flow/">Open Day Flow</a></article>`).join('')}</div></section>`
}

function statusPage(provider: Provider): string {
  const name = cap(provider)
  return `<section class="page"><div class="breadcrumb">${name} data / Status</div>${featureTabs(provider, 'status')}${featureHead(provider, 'STATUS', `${name} Data Status`, `Current health, freshness, and coverage for ViewLoom's ${name} observations.`, false)}<div class="status-grid"><div class="status-card"><small>Current state</small><strong data-current-state>Checking</strong><p>Fresh, partial, stale, empty, demo, or error.</p></div><div class="status-card"><small>Last success</small><strong data-latest-update>—</strong><p>Relative freshness from collector state.</p></div><div class="status-card"><small>Latest snapshot</small><strong data-observed-count>—</strong><p>Observed streams in latest window.</p></div><div class="status-card"><small>Total viewers</small><strong data-total-viewers>—</strong><p>Observed total when available.</p></div><div class="status-card"><small>Source mode</small><strong data-source-mode>—</strong><p>Real, fallback, demo, or fixture.</p></div></div><section class="surface"><div class="surface__head"><div><small>Feature data matrix</small><strong>Operational ledger</strong></div></div><div class="matrix"><div class="matrix-row head"><div>Feature</div><div>Role</div><div>State</div><div>Known gap</div><div>Open</div></div>${['Heatmap|Now|Activity may be sampled','Day Flow|Today|Share is derived from observed buckets','Battle Lines|Rivalry|Events are viewer-delta derived','History|Trends|Rollup coverage may vary'].map((row)=>{const [f,r,g]=row.split('|'); const url=f==='Day Flow'?'day-flow':f.toLowerCase().replace(/ /g,'-'); return `<div class="matrix-row"><div>${f}</div><div>${r}</div><div data-current-state>Checking</div><div>${g}</div><div><a class="text-link" href="/${provider}/${url}/">Open</a></div></div>`}).join('')}</div></section></section>`
}

function aboutPage(): string {
  return `<section class="page"><div class="breadcrumb">Portal / About</div><section class="page-head"><div><div class="kicker">ABOUT VIEWLOOM</div><h1>An observation interface for live-stream movement.</h1><p class="lede">ViewLoom is an unofficial project that separates platforms and shows current scale, daily movement, rivalries, history, and data status without pretending coverage is complete.</p></div><div class="head-facts"><div class="fact"><small>Platforms</small><strong>2</strong></div><div class="fact"><small>Core views</small><strong>4</strong></div><div class="fact"><small>Status</small><strong>Visible</strong></div><div class="fact"><small>Official</small><strong>No</strong></div></div></section><div class="content-grid"><section><div class="copy-block"><h2>What it is</h2><p>ViewLoom is built as a live data observatory. It keeps Twitch and Kick separate because their data sources, coverage, and limitations are different.</p></div><div class="copy-block"><h2>How to read it</h2><p>Heatmap is Now, Day Flow is Today, Battle Lines is Rivalry, and History is Trends. Status pages explain freshness and coverage.</p></div></section><aside class="surface"><div class="surface__body"><div class="kicker">Navigation</div><div class="rank-list">${rankRows(['Portal','Twitch data','Kick data','Status pages'])}</div></div></aside></div></section>`
}

function supportPage(): string {
  return `<section class="page"><div class="breadcrumb">Portal / Support</div><section class="page-head"><div><div class="kicker">SUPPORT VIEWLOOM</div><h1>Keep the observation pages running.</h1><p class="lede">Support is optional. ViewLoom keeps the public pages free and uses lightweight infrastructure where possible.</p></div><div class="head-facts"><div class="fact"><small>Access</small><strong>Free</strong></div><div class="fact"><small>Infra</small><strong>Cloudflare</strong></div><div class="fact"><small>Data</small><strong>D1</strong></div><div class="fact"><small>Support</small><strong>Optional</strong></div></div></section><div class="support-tiers"><article class="tier"><small>One-time</small><strong>¥300</strong><p class="lede">Small support for running costs.</p><a class="button" href="https://buy.stripe.com/4gM14n9yA7UI1FRaQugbm00" target="_blank" rel="noreferrer">Support</a></article><article class="tier"><small>One-time</small><strong>¥700</strong><p class="lede">Help keep collectors and pages alive.</p><a class="button" href="https://buy.stripe.com/4gM14n9yA7UI1FRaQugbm00" target="_blank" rel="noreferrer">Support</a></article><article class="tier"><small>Contact</small><strong>Form</strong><p class="lede">Report data or display issues.</p><a class="button button--paper" href="https://docs.google.com/forms/d/e/1FAIpQLSdhreuxEz7w0eSjslTyVLL-axV6IJdTp5RU5VXCM3ApIz35-Q/viewform?usp=dialog" target="_blank" rel="noreferrer">Contact</a></article></div></section>`
}

function providerTabs(provider: Provider): string { return `<nav class="provider-tabs"><a href="/" >Portal</a><a href="/twitch/" class="${provider==='twitch'?'active':''}">Twitch data</a><a href="/kick/" class="${provider==='kick'?'active':''}">Kick data</a></nav>` }
function featureTabs(provider: Provider, active: string): string { return `<nav class="feature-tabs"><a href="/${provider}/" class="${active==='home'?'active':''}">Home</a><a href="/${provider}/heatmap/" class="${active==='heatmap'?'active':''}">Heatmap</a><a href="/${provider}/day-flow/" class="${active==='day-flow'?'active':''}">Day Flow</a><a href="/${provider}/battle-lines/" class="${active==='battle-lines'?'active':''}">Battle Lines</a><a href="/${provider}/history/" class="${active==='history'?'active':''}">History</a><a href="/${provider}/status/" class="${active==='status'?'active':''}">Status</a></nav>` }
function featureHead(provider: Provider, role: string, title: string, copy: string, compact: boolean): string { const name = cap(provider); return `<section class="page-head ${compact?'page-head--compact':''}"><div><div class="kicker">${name.toUpperCase()} DATA · ${role}</div><h1>${title}</h1><p class="lede">${copy}</p></div>${compact ? '' : facts()}</section>` }
function facts(): string { return `<div class="head-facts"><div class="fact"><small>State</small><strong data-current-state>Checking</strong></div><div class="fact"><small>Observed</small><strong data-observed-count>—</strong></div><div class="fact"><small>Total viewers</small><strong data-total-viewers>—</strong></div><div class="fact"><small>Updated</small><strong data-latest-update>—</strong></div></div>` }
function toolbar(labels: string[]): string { return `<div class="toolbar"><span class="toolbar-label">Controls</span>${labels.map((label,i)=>`<button class="${i===0?'active':''}" type="button">${label}</button>`).join('')}<button class="button button--quiet" type="button">Refresh</button></div>` }
function dataStrip(): string { return `<div class="data-strip"><div class="data-strip__title">Data state</div><div class="data-strip__cell"><small>State</small><strong data-current-state>Checking</strong></div><div class="data-strip__cell"><small>Observed</small><strong data-observed-count>—</strong></div><div class="data-strip__cell"><small>Source</small><strong data-source-mode>—</strong></div><div class="data-strip__cell"><small>Updated</small><strong data-latest-update>—</strong></div></div>` }
function featureDirectory(provider: Provider): string { return `<div class="feature-directory">${[['01','Heatmap','Now','heatmap'],['02','Day Flow','Today','day-flow'],['03','Battle Lines','Rivalry','battle-lines'],['04','History','Trends','history']].map(([n,t,r,u])=>`<a class="feature-item" href="/${provider}/${u}/"><div class="num">${n} · ${r}</div><h3>${t}</h3><p>Open the ${r.toLowerCase()} view for ${provider} data.</p></a>`).join('')}</div>` }
function observations(title: string): string { return `<section class="surface"><div class="surface__head"><div><small>${title}</small><strong>Operational ledger</strong></div></div><div class="surface__body"><div class="signal-list">${['Freshness checked','Coverage separated','No cross-platform mixing','Status remains visible'].map((txt,i)=>`<div class="signal"><time>0${i+1}</time><strong>${txt}</strong><span>ViewLoom</span></div>`).join('')}</div></div></section>` }
function miniHeatmap(): string { return `<div class="heatmap-grid">${tiles(36)}</div>` }
function mockTiles(): string { return `<div class="heatmap-grid">${tiles(72)}</div>` }
function tiles(n: number): string { return Array.from({length:n},(_,i)=>`<div class="tile ${['a','b','c','d','e'][i%5]}" style="grid-column:span ${i%11===0?3:i%7===0?2:1};grid-row:span ${i%13===0?3:i%5===0?2:1}"><strong>Stream ${i+1}</strong><span>${formatCount(54000-i*531)}</span><small>${i%3===0?'Rising':i%3===1?'Flat':'Falling'}</small></div>`).join('') }
function rankRows(labels: string[]): string { return labels.map((name,i)=>`<div class="rank-row"><small>#${i+1}</small><strong>${name}</strong><span>${formatCount(120000-i*17000)}</span></div>`).join('') }
function dayFlowSvg(): string { return `<svg viewBox="0 0 1200 560" role="img" aria-label="Day Flow mock chart"><g>${grid()}</g><path class="area-a" d="M0 420 C120 330 180 360 260 290 C380 170 500 230 620 180 C760 115 900 180 1200 120 L1200 560 L0 560Z"/><path class="area-b" d="M0 500 C160 460 280 430 360 390 C520 300 640 330 760 260 C880 210 1000 240 1200 190 L1200 560 L0 560Z"/><path class="area-c" d="M0 540 C180 520 320 500 460 450 C600 400 780 430 920 360 C1040 320 1120 300 1200 260 L1200 560 L0 560Z"/><line class="cursor" x1="760" y1="40" x2="760" y2="530"/><text class="chart-label" x="36" y="54">Volume terrain</text><text class="chart-muted" x="1030" y="532">00:00 → 24:00</text></svg>` }
function battleSvg(): string { return `<svg viewBox="0 0 1200 560" role="img" aria-label="Battle Lines mock chart"><g>${grid()}</g><path class="gap-band" d="M120 340 C270 280 410 310 560 240 C710 185 860 210 1040 150 L1040 250 C860 300 710 300 560 350 C410 410 270 370 120 460Z"/><path class="line-a" d="M70 430 C220 370 330 310 460 300 C620 285 760 160 920 180 C1040 190 1100 130 1160 115"/><path class="line-b" d="M70 360 C220 330 340 380 470 350 C630 310 760 260 920 215 C1040 175 1100 190 1160 150"/><path class="line-c" d="M70 470 C220 445 360 440 500 420 C700 390 880 350 1160 340"/><line class="cursor" x1="790" y1="40" x2="790" y2="530"/><text class="chart-label" x="36" y="54">Primary battle</text><text class="chart-muted" x="970" y="532">Selected time 18:40</text></svg>` }
function historySvg(): string { return `<svg viewBox="0 0 1200 560" role="img" aria-label="History mock chart"><g>${grid()}</g>${Array.from({length:30},(_,i)=>`<rect x="${45+i*36}" y="${500-80-(i%9)*28}" width="20" height="${80+(i%9)*28}" fill="rgba(44,151,255,.45)" stroke="rgba(255,255,255,.12)"/>`).join('')}<text class="chart-label" x="36" y="54">Daily viewer-minutes</text><text class="chart-muted" x="980" y="532">Last 30 days</text></svg>` }
function grid(): string { return Array.from({length:7},(_,i)=>`<line class="chart-grid" x1="40" x2="1160" y1="${80+i*70}" y2="${80+i*70}"/>`).join('')+Array.from({length:8},(_,i)=>`<line class="chart-grid" y1="50" y2="520" x1="${80+i*150}" x2="${80+i*150}"/>`).join('') }
async function safeStatus(provider: Provider): Promise<StatusPayload | null> { return safeJson(`/api/${provider}-status`).catch(() => safeJson(`/api/status`).catch(() => null)) }
async function safeJson(url: string): Promise<any> { const res = await fetch(url,{cache:'no-store'}); if(!res.ok) throw new Error(String(res.status)); return res.json() }
function setText(selector: string, value: string): void { document.querySelectorAll(selector).forEach((node)=>{ node.textContent = value }) }
function labelState(value: unknown): string { const raw = String(value ?? 'checking').replace(/_/g,' '); return raw.charAt(0).toUpperCase()+raw.slice(1) }
function relativeMinutes(value: unknown): string { const n = Number(value); if (!Number.isFinite(n)) return '—'; if (n <= 0) return 'Just now'; return `${Math.round(n)}m ago` }
function formatCount(value: unknown): string { const n = Number(value); return Number.isFinite(n) ? Math.max(0, Math.round(n)).toLocaleString('en-US') : '—' }
function cap(value: Provider): string { return value.charAt(0).toUpperCase() + value.slice(1) }
