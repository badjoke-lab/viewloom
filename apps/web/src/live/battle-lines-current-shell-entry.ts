type Metric = 'viewers' | 'indexed'
type RangeMode = 'today' | 'yesterday' | 'date'
type PointState = 'observed' | 'offline' | 'not_observed' | 'missing'
type GapTrend = 'closing' | 'widening' | 'steady' | 'unavailable'
type Point = { bucket: string; time: string; viewers: number | null; value: number | null; state: PointState }
type Line = { id: string; streamerId?: string; name: string; displayName?: string; title?: string; url?: string; peakViewers: number; latestViewers: number | null; latestValue: number | null; viewerMinutes: number; points: Point[] }
type Battle = { id: string; pair: [string, string]; streamerAId: string; streamerBId: string; streamerAName: string; streamerBName: string; score: number; overlapCount: number; longestRun: number; reversalCount: number; recentOverlap: number; missingPenalty: number; currentIndex: number | null; currentBucket: string | null; currentLeaderId: string | null; currentLeaderName: string | null; currentGap: number | null; previousGap: number | null; gapTrend: GapTrend; latestReversalAt: string | null }
type BattleEvent = { id: string; type: 'reversal' | 'rapid_rise' | 'gap_collapse' | 'peak'; battleId: string; pair: [string, string]; time: string; bucket: string; index: number; title: string; summary: string; passer?: string; passed?: string; gapBefore?: number; gapAfter?: number; delta?: number; streamerId?: string }
type Coverage = { expectedBuckets: number; observedBuckets: number; missingBuckets: number; missingRatio: number }
type WindowContract = { mode: string; selectedDate: string; from: string; to: string; isLive: boolean }
type Payload = { platform: string; state: string; status: string; source: string; updatedAt: string; generatedAt: string; top: number; requestedBucket: string; bucket: '5m' | '10m'; metric: Metric; valueMode: Metric; metricNote: string; granularityNote: string; timeline: string[]; coverage: Coverage; window: WindowContract; lines: Line[]; primaryBattle: Battle | null; recommendedBattle: Battle | null; secondaryBattles: Battle[]; battles: Battle[]; events: BattleEvent[]; reversals: BattleEvent[]; feed: BattleEvent[]; error?: { message?: string } }
type State = { metric: Metric; top: 3 | 5 | 10; bucket: '5m' | '10m'; range: RangeMode; date: string; selectedBattleId: string | null; selectedLineId: string | null; selectedIndex: number; manualBattle: boolean; followLatest: boolean; dragging: boolean }
type PairSnapshot = { leaderName: string | null; gap: number | null; trend: GapTrend }
type MarkerCandidate = { index: number; value: number; text: string; color: string; priority: number }

const provider = document.body.dataset.provider === 'kick' ? 'kick' : 'twitch'
const endpoint = provider === 'kick' ? '/api/kick-battle-lines' : '/api/battle-lines'
const params = new URLSearchParams(location.search)
const todayUtc = new Date().toISOString().slice(0, 10)
const state: State = {
  metric: params.get('metric') === 'indexed' ? 'indexed' : 'viewers',
  top: parseTop(params.get('top')),
  bucket: params.get('bucket') === '10m' ? '10m' : '5m',
  range: parseRange(params.get('range')),
  date: validDate(params.get('date')) ?? todayUtc,
  selectedBattleId: params.get('battle'),
  selectedLineId: params.get('stream'),
  selectedIndex: parseIndex(params.get('point')),
  manualBattle: Boolean(params.get('battle')),
  followLatest: params.get('point') === null,
  dragging: false,
}
let payload: Payload | null = null
let requestSerial = 0
let autoTimer = 0

wireControls()
syncControls()
void hydrate()
startAutoRefresh()

function wireControls(): void {
  document.querySelectorAll<HTMLButtonElement>('[data-battle-metric]').forEach((button) => button.addEventListener('click', () => {
    const next = button.dataset.battleMetric === 'indexed' ? 'indexed' : 'viewers'
    if (next === state.metric) return
    state.metric = next
    syncControls()
    void hydrate({ preserveBattle: true, preserveTime: true })
  }))
  document.querySelectorAll<HTMLButtonElement>('[data-battle-top]').forEach((button) => button.addEventListener('click', () => {
    state.top = parseTop(button.dataset.battleTop ?? null)
    syncControls()
    void hydrate({ preserveBattle: true, preserveTime: true })
  }))
  document.querySelectorAll<HTMLButtonElement>('[data-battle-bucket]').forEach((button) => button.addEventListener('click', () => {
    state.bucket = button.dataset.battleBucket === '10m' ? '10m' : '5m'
    syncControls()
    void hydrate({ preserveBattle: true, preserveTime: true })
  }))
  document.querySelectorAll<HTMLButtonElement>('[data-battle-range]').forEach((button) => button.addEventListener('click', () => {
    state.range = parseRange(button.dataset.battleRange ?? null)
    if (state.range === 'date') state.date = validDate(dateInput()?.value ?? null) ?? state.date
    state.followLatest = true
    state.selectedIndex = -1
    state.manualBattle = false
    state.selectedBattleId = null
    syncControls()
    void hydrate()
  }))
  dateInput()?.addEventListener('change', () => {
    const value = validDate(dateInput()?.value ?? null)
    if (!value) return
    state.range = 'date'
    state.date = value
    state.followLatest = true
    state.selectedIndex = -1
    state.manualBattle = false
    state.selectedBattleId = null
    syncControls()
    void hydrate()
  })
  document.querySelector<HTMLElement>('[data-battle-refresh]')?.addEventListener('click', () => void hydrate({ preserveBattle: true, preserveTime: true }))
  document.querySelector<HTMLElement>('[data-battle-recommended]')?.addEventListener('click', () => {
    const recommended = payload ? recommendedBattleFor(payload) : null
    if (!recommended) return
    state.selectedBattleId = recommended.id
    state.manualBattle = false
    syncUrl()
    renderAll()
  })
  document.querySelector<HTMLElement>('[data-battle-latest]')?.addEventListener('click', () => {
    if (!payload) return
    state.selectedIndex = latestUsefulIndex(payload)
    state.followLatest = true
    syncUrl()
    renderAll()
  })
}

async function hydrate(options: { preserveBattle?: boolean; preserveTime?: boolean } = {}): Promise<void> {
  const serial = ++requestSerial
  setBusy(true)
  try {
    const query = new URLSearchParams({ metric: state.metric, top: String(state.top), bucket: state.bucket, range: state.range })
    if (state.range === 'date') query.set('date', state.date)
    const response = await fetch(`${endpoint}?${query}`, { headers: { accept: 'application/json' }, cache: 'no-store' })
    const next = await response.json() as Payload
    if (serial !== requestSerial) return
    if (!response.ok && next.state !== 'error') throw new Error(`Battle Lines API returned ${response.status}`)
    const previousBattle = options.preserveBattle && state.manualBattle ? state.selectedBattleId : null
    const previousBucket = options.preserveTime && payload && state.selectedIndex >= 0 ? payload.timeline[state.selectedIndex] : null
    payload = next
    const battles = next.battles ?? []
    const recommended = recommendedBattleFor(next)
    if (previousBattle && battles.some((battle) => battle.id === previousBattle)) {
      state.selectedBattleId = previousBattle
    } else if (state.selectedBattleId && battles.some((battle) => battle.id === state.selectedBattleId)) {
      state.manualBattle = state.selectedBattleId !== recommended?.id
    } else {
      state.selectedBattleId = recommended?.id ?? null
      state.manualBattle = false
    }
    if (previousBucket) state.selectedIndex = nearestTimelineIndex(next.timeline, previousBucket)
    if (state.followLatest || state.selectedIndex < 0 || state.selectedIndex >= next.timeline.length) state.selectedIndex = latestUsefulIndex(next)
    if (!state.selectedLineId || !next.lines.some((line) => line.id === state.selectedLineId)) state.selectedLineId = null
    syncControls()
    syncUrl()
    renderAll()
  } catch (error) {
    if (serial !== requestSerial) return
    renderFatal(error instanceof Error ? error.message : String(error))
  } finally {
    if (serial === requestSerial) setBusy(false)
  }
}

function renderAll(): void {
  if (!payload) return
  renderHeadFacts(payload)
  renderStatus(payload)
  renderPrimary(payload)
  renderChart(payload)
  renderInspector(payload)
  renderReversals(payload)
  renderSecondary(payload)
  renderFeed(payload)
  renderCoverage(payload)
}

function renderHeadFacts(data: Payload): void {
  const values = [label(data.state), `${data.coverage.observedBuckets}/${data.coverage.expectedBuckets}`, data.window.selectedDate, formatInstant(data.updatedAt)]
  document.querySelectorAll<HTMLElement>('.head-facts .fact strong').forEach((node, index) => { node.textContent = values[index] ?? '—' })
}

function renderStatus(data: Payload): void {
  const target = document.querySelector<HTMLElement>('[data-battle-status]')
  if (!target) return
  const stateLabel = label(data.state)
  const details = data.state === 'error'
    ? data.error?.message ?? 'The API request failed.'
    : `${data.coverage.observedBuckets}/${data.coverage.expectedBuckets} UTC buckets observed · ${formatInstant(data.updatedAt)} · ${data.bucket} · real API`
  const collector = collectorHealth()
  target.className = `battle-status battle-status--${escapeClass(data.state)}`
  target.innerHTML = `<strong>${escapeHtml(stateLabel)}</strong><span>${escapeHtml(details)}</span><small><b>Data API: ${escapeHtml(stateLabel)}</b><b>Collector health: ${escapeHtml(collector)}</b></small>`
}

function renderPrimary(data: Payload): void {
  const target = document.querySelector<HTMLElement>('[data-battle-primary]')
  if (!target) return
  const battle = activeBattle(data)
  if (!battle) {
    target.innerHTML = '<div class="notice">No comparable pair exists in this observed window.</div>'
    return
  }
  const selected = pairSnapshot(data, battle, state.selectedIndex)
  target.dataset.battleRecommendationOwner = data.recommendedBattle ? 'recommendedBattle' : data.primaryBattle ? 'primaryBattle-fallback' : 'none'
  target.dataset.battleSelectedBattleId = battle.id
  target.dataset.battleSelectedIndex = String(state.selectedIndex)
  const recommended = battle.id === recommendedBattleFor(data)?.id && !state.manualBattle
  target.innerHTML = `<div class="battle-primary__identity"><div class="kicker">${recommended ? 'RECOMMENDED BATTLE' : 'SELECTED BATTLE'}</div><h2>${escapeHtml(battle.streamerAName)} <span>vs</span> ${escapeHtml(battle.streamerBName)}</h2><p><small>Selected time</small>${escapeHtml(formatSelectedTime(data))}</p></div><div class="battle-primary__metrics"><div><small>Leader at selected time</small><strong>${escapeHtml(selected.leaderName ?? 'Unavailable')}</strong></div><div><small>Gap at selected time</small><strong>${escapeHtml(formatMetric(selected.gap))}</strong></div><div><small>Gap trend</small><strong>${escapeHtml(label(selected.trend))}</strong></div><div><small>Latest reversal</small><strong>${escapeHtml(battle.latestReversalAt ? formatClock(battle.latestReversalAt) : 'None')}</strong></div><div><small>Reversals</small><strong>${battle.reversalCount}</strong></div><div><small>Battle score</small><strong>${battle.score.toFixed(1)}</strong></div></div>`
}

function renderChart(data: Payload): void {
  const target = document.querySelector<HTMLElement>('[data-battle-stage]')
  if (!target) return
  const battle = activeBattle(data)
  if (!battle || data.lines.length < 2 || data.timeline.length === 0) {
    target.innerHTML = '<div class="notice">No connected Battle Lines can be drawn for this observed window.</div>'
    return
  }

  const width = 1200
  const height = 620
  const pad = { top: 42, right: 38, bottom: 76, left: 86 }
  const chartW = width - pad.left - pad.right
  const chartH = height - pad.top - pad.bottom
  const visible = displayLines(data, battle)
  const values = visible.flatMap((line) => line.points.map((point) => drawable(point))).filter((value): value is number => value !== null)
  const yMax = state.metric === 'indexed' ? 100 : niceMaximum(Math.max(1, ...values))
  const yTicks = state.metric === 'indexed' ? [0, 25, 50, 75, 100] : [0, .25, .5, .75, 1].map((ratio) => yMax * ratio)
  const xTicks = tickIndexes(data.timeline.length, isMobile() ? 4 : 7)
  const primaryIds = new Set(battle.pair)
  const band = gapBand(data, battle, width, height, pad, yMax)
  const lineMarkup = visible.map((line) => {
    const primary = primaryIds.has(line.id)
    const selected = state.selectedLineId === line.id
    const color = lineColor(data.lines.findIndex((item) => item.id === line.id))
    const paths = lineSegments(line, data.timeline.length, chartW, chartH, pad, yMax)
    const widthValue = selected ? 6 : primary ? 4.5 : 2
    const opacity = primary || selected ? 1 : .32
    return `<g class="battle-line${primary ? ' battle-line--primary' : ''}${selected ? ' battle-line--selected' : ''}" data-line-id="${escapeAttr(line.id)}" opacity="${opacity}">${paths.map((path) => `<path d="${path}" fill="none" stroke="${color}" stroke-width="${widthValue}" stroke-linecap="round" stroke-linejoin="round"/>`).join('')}</g>`
  }).join('')
  const yAxis = yTicks.map((tick) => {
    const py = y(tick, yMax, chartH, pad.top)
    return `<g class="y-axis-tick"><line x1="${pad.left}" x2="${width - pad.right}" y1="${py}" y2="${py}"/><text x="${pad.left - 12}" y="${py + 4}" text-anchor="end">${escapeHtml(axisMetric(tick))}</text></g>`
  }).join('')
  const xAxis = xTicks.map((index) => {
    const px = x(index, data.timeline.length, chartW, pad.left)
    return `<g class="x-axis-tick"><line x1="${px}" x2="${px}" y1="${pad.top}" y2="${height - pad.bottom}"/><text x="${px}" y="${height - 35}" text-anchor="middle">${escapeHtml(formatClockShort(data.timeline[index]))}</text></g>`
  }).join('')
  const axes = `${yAxis}${xAxis}<text class="x-axis-title" x="${width - pad.right}" y="${height - 12}" text-anchor="end">UTC</text>`
  const selectedIndex = clamp(state.selectedIndex, 0, Math.max(0, data.timeline.length - 1))
  const cursorX = x(selectedIndex, data.timeline.length, chartW, pad.left)
  const cursor = `<g class="battle-cursor"><line x1="${cursorX}" x2="${cursorX}" y1="${pad.top}" y2="${height - pad.bottom}"/><text x="${Math.min(width - 150, cursorX + 8)}" y="${pad.top + 17}">${escapeHtml(formatClock(data.timeline[selectedIndex]))}</text></g>`
  const markers = chartMarkers(data, battle, chartW, chartH, pad, yMax)
  const endpoints = endpointLabels(data, battle, chartW, chartH, pad, yMax)
  const legend = visible.map((line) => `<button type="button" class="battle-legend__item${state.selectedLineId === line.id ? ' active' : ''}${primaryIds.has(line.id) ? ' primary' : ''}" data-battle-line-select="${escapeAttr(line.id)}" aria-pressed="${state.selectedLineId === line.id}"><i style="background:${lineColor(data.lines.findIndex((item) => item.id === line.id))}"></i><span>${escapeHtml(line.name)}</span><small>${escapeHtml(formatMetric(lastValue(line)))}</small></button>`).join('')
  target.innerHTML = `<div class="battle-legend" aria-label="Displayed streams">${legend}</div><div class="battle-chart-wrap"><svg data-battle-chart data-battle-selected-index="${selectedIndex}" data-battle-selected-time="${escapeAttr(data.timeline[selectedIndex] ?? '')}" viewBox="0 0 ${width} ${height}" role="img" tabindex="0" aria-label="Battle Lines ${escapeAttr(state.metric)} chart. Use left and right arrow keys to inspect time."><g class="chart-grid">${axes}</g><g class="battle-gap-band">${band}</g>${lineMarkup}<g class="battle-markers">${markers}</g>${endpoints}${cursor}</svg></div>`
  bindChart(data, { width, pad, chartW })
  target.querySelectorAll<HTMLButtonElement>('[data-battle-line-select]').forEach((button) => button.addEventListener('click', () => {
    const id = button.dataset.battleLineSelect ?? null
    state.selectedLineId = state.selectedLineId === id ? null : id
    syncUrl()
    renderChart(data)
  }))
}

function renderInspector(data: Payload): void {
  const target = document.querySelector<HTMLElement>('[data-battle-inspector]')
  if (!target) return
  const battle = activeBattle(data)
  if (!battle) { target.innerHTML = '<p>No battle selected.</p>'; return }
  const a = lineById(data, battle.streamerAId)
  const b = lineById(data, battle.streamerBId)
  if (!a || !b) { target.innerHTML = '<p>Selected pair is unavailable.</p>'; return }
  const index = clamp(state.selectedIndex, 0, Math.max(0, data.timeline.length - 1))
  const ap = a.points[index]
  const bp = b.points[index]
  const snapshot = pairSnapshot(data, battle, index)
  target.dataset.battleSelectedIndex = String(index)
  target.dataset.battleSelectedTime = data.timeline[index] ?? ''
  const ranked = data.lines
    .map((line) => ({ line, point: line.points[index], value: drawable(line.points[index]) }))
    .sort((left, right) => {
      if (left.value === null && right.value === null) return left.line.name.localeCompare(right.line.name)
      if (left.value === null) return 1
      if (right.value === null) return -1
      return right.value - left.value
    })
  let observedRank = 0
  const rankingRows = ranked.slice(0, 5).map((item) => {
    const observed = item.value !== null
    if (observed) observedRank += 1
    const stateLabel = label(item.point?.state ?? 'not_observed')
    return `<div class="ranking__row${observed ? '' : ' ranking__row--unavailable'}"><span>${observed ? observedRank : '—'}</span><strong>${escapeHtml(item.line.name)}</strong><span>${observed ? escapeHtml(formatMetric(item.value)) : escapeHtml(stateLabel)}</span><span>${observed ? escapeHtml(formatDelta(item.line, index)) : 'No observed value'}</span></div>`
  }).join('')
  target.innerHTML = `<div class="inspector-head"><div><div class="kicker">TIME INSPECTOR</div><h2>${escapeHtml(formatSelectedTime(data))}</h2></div><span class="mode-pill">${state.followLatest ? 'Following latest' : 'Inspect mode'}</span></div><div class="pair-inspector"><article><small>${escapeHtml(a.name)}</small><strong>${escapeHtml(formatMetric(drawable(ap)))}</strong><span>${escapeHtml(label(ap?.state ?? 'not_observed'))} · ${escapeHtml(formatDelta(a, index))}</span></article><article><small>${escapeHtml(b.name)}</small><strong>${escapeHtml(formatMetric(drawable(bp)))}</strong><span>${escapeHtml(label(bp?.state ?? 'not_observed'))} · ${escapeHtml(formatDelta(b, index))}</span></article><article class="pair-inspector__result"><small>Selected battle</small><strong>${escapeHtml(battle.streamerAName)} <em>vs</em> ${escapeHtml(battle.streamerBName)}</strong><span>Leader: ${escapeHtml(snapshot.leaderName ?? 'Unavailable')} · ${escapeHtml(formatMetric(snapshot.gap))} gap · ${escapeHtml(label(snapshot.trend))}</span></article></div><div class="ranking"><div class="ranking__head"><span>Rank</span><span>Stream</span><span>Value / state</span><span>Δ bucket</span></div>${rankingRows || '<p>No streams are available at this bucket.</p>'}</div>`
}

function renderReversals(data: Payload): void {
  const target = document.querySelector<HTMLElement>('[data-battle-reversals]')
  if (!target) return
  const battle = activeBattle(data)
  const reversals = battle ? data.reversals.filter((event) => event.battleId === battle.id).slice(0, 12) : []
  if (!reversals.length) {
    target.innerHTML = '<p class="empty-inline">No reversal detected in this observed window.</p>'
    return
  }
  target.innerHTML = reversals.map((event) => `<button type="button" class="reversal-card" data-battle-event-index="${event.index}"><small>${escapeHtml(formatClock(event.time))}</small><strong>${escapeHtml(event.title || `${event.passer ?? 'Unknown'} passed ${event.passed ?? 'Unknown'}`)}</strong><span>Gap before ${escapeHtml(formatMetric(event.gapBefore ?? null))}</span><span>Gap after ${escapeHtml(formatMetric(event.gapAfter ?? null))}</span></button>`).join('')
  bindEventJumps(target)
}

function renderSecondary(data: Payload): void {
  const target = document.querySelector<HTMLElement>('[data-battle-secondary]')
  if (!target) return
  const current = activeBattle(data)
  const recommended = recommendedBattleFor(data)
  const ordered = current && state.manualBattle
    ? [current, ...data.battles.filter((battle) => battle.id !== current.id && battle.id !== recommended?.id)]
    : data.battles.filter((battle) => battle.id !== current?.id)
  const candidates = ordered.slice(0, 3)
  if (!candidates.length) { target.innerHTML = '<p class="empty-inline">No secondary battle has enough overlapping observations.</p>'; return }
  target.innerHTML = candidates.map((battle) => {
    const active = battle.id === current?.id
    return `<button type="button" class="secondary-card${active ? ' active' : ''}" data-battle-select="${escapeAttr(battle.id)}" aria-pressed="${active}"><span><small>${active ? 'Selected battle' : `Battle score ${battle.score.toFixed(1)}`}</small><strong>${escapeHtml(battle.streamerAName)} <em>vs</em> ${escapeHtml(battle.streamerBName)}</strong></span><span><small>Current gap</small><strong>${escapeHtml(formatMetric(battle.currentGap))}</strong><small>${escapeHtml(label(battle.gapTrend))} · ${battle.reversalCount} reversals</small></span></button>`
  }).join('')
  target.querySelectorAll<HTMLButtonElement>('[data-battle-select]').forEach((button) => button.addEventListener('click', () => {
    state.selectedBattleId = button.dataset.battleSelect ?? null
    state.manualBattle = state.selectedBattleId !== recommendedBattleFor(data)?.id
    state.selectedLineId = null
    syncUrl()
    renderAll()
  }))
}

function renderFeed(data: Payload): void {
  const target = document.querySelector<HTMLElement>('[data-battle-feed]')
  if (!target) return
  const battle = activeBattle(data)
  const events = battle ? dedupeEvents(data.events.filter((event) => event.battleId === battle.id)).slice(0, 5) : []
  if (!events.length) { target.innerHTML = '<p class="empty-inline">No distinct battle event was detected in this observed window.</p>'; return }
  target.innerHTML = events.map((event) => `<button type="button" class="event-item" data-battle-event-index="${event.index}"><span>${escapeHtml(formatClock(event.time))} · ${escapeHtml(label(event.type))}</span><strong>${escapeHtml(event.title)}</strong><p>${escapeHtml(event.summary)}</p></button>`).join('')
  bindEventJumps(target)
}

function renderCoverage(data: Payload): void {
  const target = document.querySelector<HTMLElement>('[data-battle-coverage]')
  if (!target) return
  const missing = (data.coverage.missingRatio * 100).toFixed(1)
  const selectedIndex = clamp(state.selectedIndex, 0, Math.max(0, data.timeline.length - 1))
  const unavailableAtSelection = data.lines.filter((line) => drawable(line.points[selectedIndex]) === null)
  const unavailableNote = unavailableAtSelection.length
    ? ` At the selected bucket, ${unavailableAtSelection.map((line) => `${line.name}: ${label(line.points[selectedIndex]?.state ?? 'not_observed')}`).join('; ')}.`
    : ''
  const stateText = data.state === 'partial' ? 'Some UTC buckets were not observed.' : data.state === 'stale' ? 'The latest live bucket is delayed.' : data.state === 'empty' ? 'Fewer than two comparable streams were observed.' : data.state === 'demo' ? 'This response contains demo-majority rows.' : data.state === 'error' ? 'The data API failed.' : 'The observed window is current.'
  target.innerHTML = `<strong>Coverage & limits</strong><p>${escapeHtml(stateText)} ${data.coverage.observedBuckets} of ${data.coverage.expectedBuckets} buckets are present (${missing}% missing). Offline, missing, and not-observed are kept separate.${escapeHtml(unavailableNote)} Activity / heat is unavailable and is not scored.</p>`
}

function bindChart(data: Payload, geometry: { width: number; pad: { left: number; right: number }; chartW: number }): void {
  const chart = document.querySelector<SVGSVGElement>('[data-battle-chart]')
  if (!chart) return
  const selectAt = (clientX: number) => {
    const rect = chart.getBoundingClientRect()
    const local = ((clientX - rect.left) / Math.max(1, rect.width)) * geometry.width
    const bounded = clamp(local, geometry.pad.left, geometry.width - geometry.pad.right)
    const ratio = (bounded - geometry.pad.left) / Math.max(1, geometry.chartW)
    state.selectedIndex = clamp(Math.round(ratio * Math.max(0, data.timeline.length - 1)), 0, Math.max(0, data.timeline.length - 1))
    state.followLatest = state.selectedIndex === latestUsefulIndex(data)
    syncUrl()
    renderPrimary(data)
    renderChart(data)
    renderInspector(data)
    renderCoverage(data)
  }
  chart.addEventListener('pointerdown', (event) => {
    state.dragging = true
    chart.setPointerCapture(event.pointerId)
    selectAt(event.clientX)
  })
  chart.addEventListener('pointermove', (event) => { if (state.dragging) selectAt(event.clientX) })
  chart.addEventListener('pointerup', (event) => { state.dragging = false; if (chart.hasPointerCapture(event.pointerId)) chart.releasePointerCapture(event.pointerId) })
  chart.addEventListener('pointercancel', () => { state.dragging = false })
  chart.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') moveSelected(data, -1)
    else if (event.key === 'ArrowRight') moveSelected(data, 1)
    else if (event.key === 'Home') setSelected(data, 0)
    else if (event.key === 'End') setSelected(data, latestUsefulIndex(data), true)
    else return
    event.preventDefault()
  })
}

function bindEventJumps(root: HTMLElement): void {
  root.querySelectorAll<HTMLButtonElement>('[data-battle-event-index]').forEach((button) => button.addEventListener('click', () => {
    if (!payload) return
    setSelected(payload, parseIndex(button.dataset.battleEventIndex ?? null))
    document.querySelector<HTMLElement>('[data-battle-stage]')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }))
}

function moveSelected(data: Payload, delta: number): void { setSelected(data, state.selectedIndex + delta) }
function setSelected(data: Payload, index: number, follow = false): void {
  state.selectedIndex = clamp(index, 0, Math.max(0, data.timeline.length - 1))
  state.followLatest = follow || state.selectedIndex === latestUsefulIndex(data)
  syncUrl()
  renderAll()
  document.querySelector<SVGSVGElement>('[data-battle-chart]')?.focus()
}

function recommendedBattleFor(data: Payload): Battle | null {
  return data.recommendedBattle ?? data.primaryBattle ?? data.battles[0] ?? null
}

function activeBattle(data: Payload): Battle | null {
  return data.battles.find((battle) => battle.id === state.selectedBattleId) ?? recommendedBattleFor(data)
}

function pairSnapshot(data: Payload, battle: Battle, index: number): PairSnapshot {
  const a = lineById(data, battle.streamerAId)
  const b = lineById(data, battle.streamerBId)
  if (!a || !b) return { leaderName: null, gap: null, trend: 'unavailable' }
  const currentA = drawable(a.points[index])
  const currentB = drawable(b.points[index])
  if (currentA === null || currentB === null) return { leaderName: null, gap: null, trend: 'unavailable' }
  const previousA = drawable(a.points[index - 1])
  const previousB = drawable(b.points[index - 1])
  const gap = Math.abs(currentA - currentB)
  const previousGap = previousA === null || previousB === null ? null : Math.abs(previousA - previousB)
  return { leaderName: currentA === currentB ? 'Tied' : currentA > currentB ? a.name : b.name, gap, trend: trend(previousGap, gap) }
}

function displayLines(data: Payload, battle: Battle): Line[] {
  if (!isMobile()) return data.lines
  const keep = new Set<string>(battle.pair)
  if (state.selectedLineId) keep.add(state.selectedLineId)
  for (const line of data.lines) {
    if (keep.size >= 4) break
    keep.add(line.id)
  }
  return data.lines.filter((line) => keep.has(line.id))
}

function lineSegments(line: Line, count: number, chartW: number, chartH: number, pad: { left: number; top: number }, yMax: number): string[] {
  const segments: string[] = []
  let current: string[] = []
  line.points.forEach((point, index) => {
    const value = drawable(point)
    if (value === null) {
      if (current.length > 1) segments.push(`M ${current.join(' L ')}`)
      current = []
      return
    }
    current.push(`${x(index, count, chartW, pad.left).toFixed(2)} ${y(value, yMax, chartH, pad.top).toFixed(2)}`)
  })
  if (current.length > 1) segments.push(`M ${current.join(' L ')}`)
  return segments
}

function gapBand(data: Payload, battle: Battle, width: number, height: number, pad: { left: number; right: number; top: number; bottom: number }, yMax: number): string {
  const a = lineById(data, battle.streamerAId)
  const b = lineById(data, battle.streamerBId)
  if (!a || !b) return ''
  const chartW = width - pad.left - pad.right
  const chartH = height - pad.top - pad.bottom
  const polygons: string[] = []
  let upper: string[] = []
  let lower: string[] = []
  const flush = () => {
    if (upper.length > 1) polygons.push(`<path d="M ${upper.join(' L ')} L ${lower.reverse().join(' L ')} Z"/>`)
    upper = []
    lower = []
  }
  for (let index = 0; index < data.timeline.length; index += 1) {
    const av = drawable(a.points[index])
    const bv = drawable(b.points[index])
    if (av === null || bv === null) { flush(); continue }
    const px = x(index, data.timeline.length, chartW, pad.left).toFixed(2)
    upper.push(`${px} ${y(Math.max(av, bv), yMax, chartH, pad.top).toFixed(2)}`)
    lower.push(`${px} ${y(Math.min(av, bv), yMax, chartH, pad.top).toFixed(2)}`)
  }
  flush()
  return polygons.join('')
}

function chartMarkers(data: Payload, battle: Battle, chartW: number, chartH: number, pad: { left: number; top: number }, yMax: number): string {
  const candidates: MarkerCandidate[] = []
  const primary = battle.pair.map((id) => lineById(data, id)).filter((line): line is Line => Boolean(line))
  primary.forEach((line) => {
    const peakIndex = line.points.reduce((best, point, index) => (drawable(point) ?? -1) > (drawable(line.points[best]) ?? -1) ? index : best, 0)
    const value = drawable(line.points[peakIndex])
    if (value !== null) candidates.push({ index: peakIndex, value, text: 'Peak', color: lineColor(data.lines.indexOf(line)), priority: 1 })
  })
  data.reversals.filter((event) => event.battleId === battle.id).slice(0, isMobile() ? 3 : 8).forEach((event) => {
    const a = lineById(data, battle.streamerAId)
    const b = lineById(data, battle.streamerBId)
    const value = Math.max(drawable(a?.points[event.index]) ?? 0, drawable(b?.points[event.index]) ?? 0)
    candidates.push({ index: event.index, value, text: 'Reversal', color: '#eef4ff', priority: 2 })
  })
  candidates.sort((left, right) => left.index - right.index || right.priority - left.priority)
  const labeledIndexes: number[] = []
  return candidates.map((candidate) => {
    const labelAllowed = !labeledIndexes.some((index) => Math.abs(index - candidate.index) <= 1)
    if (labelAllowed) labeledIndexes.push(candidate.index)
    return marker(candidate.index, candidate.value, labelAllowed ? candidate.text : '', candidate.color, data.timeline.length, chartW, chartH, pad, yMax)
  }).join('')
}

function marker(index: number, value: number, text: string, color: string, count: number, chartW: number, chartH: number, pad: { left: number; top: number }, yMax: number): string {
  const px = x(index, count, chartW, pad.left)
  const py = y(value, yMax, chartH, pad.top)
  const labelMarkup = text ? `<text x="${px + 7}" y="${Math.max(16, py - 8)}">${escapeHtml(text)}</text>` : ''
  return `<g class="chart-marker${text ? '' : ' chart-marker--dot-only'}"><circle cx="${px}" cy="${py}" r="5" fill="${color}"/>${labelMarkup}</g>`
}

function endpointLabels(data: Payload, battle: Battle, chartW: number, chartH: number, pad: { left: number; top: number }, yMax: number): string {
  return battle.pair.map((id) => lineById(data, id)).filter((line): line is Line => Boolean(line)).map((line) => {
    const index = lastObservedIndex(line)
    if (index < 0) return ''
    const value = drawable(line.points[index])
    if (value === null) return ''
    return `<text class="endpoint-label" x="${Math.min(1160, x(index, data.timeline.length, chartW, pad.left) + 8)}" y="${y(value, yMax, chartH, pad.top) + 4}" fill="${lineColor(data.lines.indexOf(line))}">${escapeHtml(line.name)}</text>`
  }).join('')
}

function syncControls(): void {
  setPressed('[data-battle-metric]', 'battleMetric', state.metric)
  setPressed('[data-battle-top]', 'battleTop', String(state.top))
  setPressed('[data-battle-bucket]', 'battleBucket', state.bucket)
  setPressed('[data-battle-range]', 'battleRange', state.range)
  const input = dateInput()
  if (input) { input.value = state.date; input.max = todayUtc }
  const recommended = document.querySelector<HTMLButtonElement>('[data-battle-recommended]')
  if (recommended) recommended.disabled = !state.manualBattle
}

function setPressed(selector: string, key: string, value: string): void {
  document.querySelectorAll<HTMLButtonElement>(selector).forEach((button) => {
    const active = button.dataset[key] === value
    button.classList.toggle('active', active)
    button.setAttribute('aria-pressed', String(active))
  })
}

function syncUrl(): void {
  const next = new URLSearchParams()
  if (state.metric !== 'viewers') next.set('metric', state.metric)
  if (state.top !== 5) next.set('top', String(state.top))
  if (state.bucket !== '5m') next.set('bucket', state.bucket)
  if (state.range !== 'today') next.set('range', state.range)
  if (state.range === 'date') next.set('date', state.date)
  if (state.manualBattle && state.selectedBattleId) next.set('battle', state.selectedBattleId)
  if (state.selectedLineId) next.set('stream', state.selectedLineId)
  if (!state.followLatest && state.selectedIndex >= 0) next.set('point', String(state.selectedIndex))
  history.replaceState(null, '', `${location.pathname}${next.size ? `?${next}` : ''}`)
}

function renderFatal(message: string): void {
  const status = document.querySelector<HTMLElement>('[data-battle-status]')
  if (status) { status.className = 'battle-status battle-status--error'; status.innerHTML = `<strong>Error</strong><span>${escapeHtml(message)}</span>` }
  const stage = document.querySelector<HTMLElement>('[data-battle-stage]')
  if (stage) stage.innerHTML = `<div class="notice">Battle Lines is unavailable: ${escapeHtml(message)}</div>`
}

function startAutoRefresh(): void {
  window.clearInterval(autoTimer)
  autoTimer = window.setInterval(() => {
    if (state.range === 'today') void hydrate({ preserveBattle: true, preserveTime: !state.followLatest })
  }, 60_000)
}

function setBusy(busy: boolean): void {
  document.querySelectorAll<HTMLButtonElement>('[data-battle-refresh]').forEach((button) => { button.disabled = busy; button.textContent = busy ? 'Loading…' : 'Refresh' })
}

function latestUsefulIndex(data: Payload): number {
  for (let index = data.timeline.length - 1; index >= 0; index -= 1) if (data.lines.some((line) => drawable(line.points[index]) !== null)) return index
  return Math.max(0, data.timeline.length - 1)
}
function nearestTimelineIndex(timeline: string[], bucket: string): number {
  const target = Date.parse(bucket)
  let best = 0
  let distance = Number.POSITIVE_INFINITY
  timeline.forEach((item, index) => { const next = Math.abs(Date.parse(item) - target); if (next < distance) { distance = next; best = index } })
  return best
}
function lineById(data: Payload, id: string): Line | undefined { return data.lines.find((line) => line.id === id) }
function drawable(point: Point | undefined): number | null { return point?.state === 'observed' && typeof point.value === 'number' && Number.isFinite(point.value) ? point.value : null }
function lastValue(line: Line): number | null { const index = lastObservedIndex(line); return index >= 0 ? drawable(line.points[index]) : null }
function lastObservedIndex(line: Line): number { for (let index = line.points.length - 1; index >= 0; index -= 1) if (drawable(line.points[index]) !== null) return index; return -1 }
function formatDelta(line: Line, index: number): string { const current = drawable(line.points[index]); const previous = drawable(line.points[index - 1]); if (current === null || previous === null) return 'Δ unavailable'; const delta = current - previous; return `${delta >= 0 ? '+' : '−'}${formatMetric(Math.abs(delta))}` }
function trend(previous: number | null, current: number | null): GapTrend { if (previous === null || current === null) return 'unavailable'; const tolerance = Math.max(1, previous * .02); return current < previous - tolerance ? 'closing' : current > previous + tolerance ? 'widening' : 'steady' }
function dedupeEvents(events: BattleEvent[]): BattleEvent[] { const seen = new Set<string>(); return events.filter((event) => { if (!event.id || seen.has(event.id)) return false; seen.add(event.id); return true }) }
function tickIndexes(count: number, desired: number): number[] { if (count <= 1) return [0]; return Array.from(new Set(Array.from({ length: desired }, (_, index) => Math.round((index / Math.max(1, desired - 1)) * (count - 1))))) }
function x(index: number, count: number, width: number, left: number): number { return left + (count <= 1 ? 0 : index / (count - 1)) * width }
function y(value: number, max: number, height: number, top: number): number { return top + height - (value / Math.max(1, max)) * height }
function niceMaximum(value: number): number { const power = 10 ** Math.floor(Math.log10(Math.max(1, value))); const normalized = value / power; const nice = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10; return nice * power }
function lineColor(index: number): string { return ['#7dd3fc', '#f472b6', '#facc15', '#22d378', '#a78bfa', '#fb923c', '#2dd4bf', '#e879f9', '#94a3b8', '#f87171'][Math.max(0, index) % 10] }
function formatMetric(value: number | null): string { if (value === null || !Number.isFinite(value)) return '—'; return state.metric === 'indexed' ? `${value.toFixed(value % 1 ? 1 : 0)}` : formatNumber(value) }
function axisMetric(value: number): string { return state.metric === 'indexed' ? String(Math.round(value)) : formatNumber(value) }
function formatNumber(value: number): string { const absolute = Math.abs(value); if (absolute >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`; if (absolute >= 1000) return `${(value / 1000).toFixed(1)}K`; return String(Math.round(value)) }
function formatInstant(value: string): string { const date = new Date(value); return Number.isNaN(date.getTime()) ? '—' : `${date.toISOString().slice(0, 16).replace('T', ' ')} UTC` }
function formatClock(value: string): string { const date = new Date(value); return Number.isNaN(date.getTime()) ? value : `${date.toISOString().slice(11, 16)} UTC` }
function formatClockShort(value: string): string { const date = new Date(value); return Number.isNaN(date.getTime()) ? value : date.toISOString().slice(11, 16) }
function formatSelectedTime(data: Payload): string { const value = data.timeline[state.selectedIndex]; return value ? formatInstant(value) : 'No selected bucket' }
function collectorHealth(): string {
  const text = document.querySelector<HTMLElement>('.status-inline')?.textContent?.trim() ?? 'Unknown'
  const normalized = text.replace(/^Collectors?\s*/i, '').replace(/\s*·\s*5m cadence$/i, '').trim()
  return normalized || 'Unknown'
}
function parseTop(value: string | null): 3 | 5 | 10 { return value === '3' ? 3 : value === '10' ? 10 : 5 }
function parseRange(value: string | null): RangeMode { return value === 'yesterday' || value === 'date' ? value : 'today' }
function parseIndex(value: string | null): number { const parsed = Number(value); return Number.isInteger(parsed) && parsed >= 0 ? parsed : -1 }
function validDate(value: string | null): string | null { if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null; const date = new Date(`${value}T00:00:00.000Z`); return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? null : value }
function dateInput(): HTMLInputElement | null { return document.querySelector<HTMLInputElement>('[data-battle-date]') }
function isMobile(): boolean { return window.matchMedia('(max-width: 760px)').matches }
function label(value: string): string { return value.replace(/_/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase()) }
function escapeClass(value: string): string { return value.toLowerCase().replace(/[^a-z0-9_-]+/g, '-') }
function escapeHtml(value: string): string { return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;') }
function escapeAttr(value: string): string { return escapeHtml(value).replace(/'/g, '&#39;') }
function clamp(value: number, minimum: number, maximum: number): number { return Math.min(maximum, Math.max(minimum, value)) }
