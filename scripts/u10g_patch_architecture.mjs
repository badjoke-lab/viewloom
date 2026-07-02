import { readFileSync, writeFileSync } from 'node:fs'

function replaceExact(source, before, after, label) {
  if (!source.includes(before)) throw new Error(`missing ${label}`)
  return source.replace(before, after)
}

function replaceRegex(source, pattern, replacement, label) {
  if (!pattern.test(source)) throw new Error(`missing ${label}`)
  return source.replace(pattern, replacement)
}

function patchDayFlow() {
  const path = 'apps/web/src/live/day-flow-current-shell-entry.ts'
  let source = readFileSync(path, 'utf8')
  if (!source.startsWith("import { applyDayFlowLayout")) {
    source = `import { applyDayFlowLayout, normalizeDayFlowLayout, renderEnhancedDayFlowSummary, type DayFlowLayoutMode } from './day-flow-layout-summary'\n\n${source}`
  }
  source = replaceExact(source,
    `  autoUpdate: boolean\n  highlightOnly: boolean\n}`,
    `  autoUpdate: boolean\n  highlightOnly: boolean\n  layout: DayFlowLayoutMode\n  layoutInUrl: boolean\n}`,
    'Day Flow state layout fields')
  source = replaceExact(source,
    `const providerBase = provider === 'kick' ? '/kick' : '/twitch'\nconst state: DayFlowState = readInitialState()`,
    `const providerBase = provider === 'kick' ? '/kick' : '/twitch'\nconst layoutStorageKey = \`viewloom:\${provider}:dayflow-layout\`\nconst state: DayFlowState = readInitialState()`,
    'Day Flow layout storage key')
  source = replaceExact(source,
    `  const scope = params.get('scope')\n  return {`,
    `  const scope = params.get('scope')\n  const layoutParam = params.get('layout')\n  const layoutInUrl = layoutParam === 'wide' || layoutParam === 'split' || layoutParam === 'theater'\n  const layout = normalizeDayFlowLayout(layoutParam, window.localStorage.getItem(layoutStorageKey))\n  return {`,
    'Day Flow initial layout input')
  source = replaceExact(source,
    `    autoUpdate: params.get('auto') !== 'off',\n    highlightOnly: false,\n`,
    `    autoUpdate: params.get('auto') !== 'off',\n    highlightOnly: false,\n    layout,\n    layoutInUrl,\n`,
    'Day Flow initial layout state')
  source = replaceExact(source,
    `function wireControls(): void {\n  document.querySelectorAll<HTMLButtonElement>('[data-dayflow-metric]')`,
    `function wireControls(): void {\n  document.querySelectorAll<HTMLButtonElement>('[data-dayflow-layout]').forEach((button) => {\n    button.addEventListener('click', () => {\n      state.layout = button.dataset.dayflowLayout === 'split' ? 'split' : 'wide'\n      state.layoutInUrl = true\n      window.localStorage.setItem(layoutStorageKey, state.layout)\n      syncControls()\n      syncUrl(lastPayload ?? undefined)\n    })\n  })\n\n  window.addEventListener('resize', () => { applyDayFlowLayout(state.layout) })\n  window.addEventListener('popstate', () => {\n    const params = new URLSearchParams(window.location.search)\n    const value = params.get('layout')\n    state.layoutInUrl = value === 'wide' || value === 'split' || value === 'theater'\n    state.layout = normalizeDayFlowLayout(value, window.localStorage.getItem(layoutStorageKey))\n    syncControls()\n  })\n\n  document.querySelectorAll<HTMLButtonElement>('[data-dayflow-metric]')`,
    'Day Flow layout controls')
  source = replaceExact(source,
    `  if (autoButton) {\n    autoButton.disabled = !isLiveRange()\n    autoButton.classList.toggle('active', state.autoUpdate && isLiveRange())\n    autoButton.textContent = isLiveRange() ? \`Auto \${state.autoUpdate ? 'on' : 'off'}\` : 'Auto off'\n    autoButton.setAttribute('aria-pressed', String(state.autoUpdate && isLiveRange()))\n  }\n}`,
    `  if (autoButton) {\n    autoButton.disabled = !isLiveRange()\n    autoButton.classList.toggle('active', state.autoUpdate && isLiveRange())\n    autoButton.textContent = isLiveRange() ? \`Auto \${state.autoUpdate ? 'on' : 'off'}\` : 'Auto off'\n    autoButton.setAttribute('aria-pressed', String(state.autoUpdate && isLiveRange()))\n  }\n  applyDayFlowLayout(state.layout)\n}`,
    'Day Flow sync layout')
  source = replaceRegex(source,
    /function renderSummary\(payload: DayFlowPayload\): void \{[\s\S]*?\n\}\n\nfunction renderCoverage/,
    `function renderSummary(payload: DayFlowPayload): void {\n  const target = document.querySelector<HTMLElement>('[data-dayflow-summary]')\n  if (!target) return\n  if (renderEnhancedDayFlowSummary(target, payload)) return\n  const summary = payload.summary ?? {}\n  target.innerHTML = \`<div class="dayflow-summary-grid"><div><small>Peak leader</small><strong>\${escapeHtml(summary.peakLeader || 'Unavailable')}</strong></div><div><small>Longest dominance</small><strong>\${escapeHtml(summary.longestDominance || 'Unavailable')}</strong></div><div><small>Biggest rise</small><strong>\${escapeHtml(summary.biggestRise || 'Unavailable')}</strong></div><div><small>Highest activity</small><strong>\${escapeHtml(summary.highestActivity || 'Activity unavailable')}</strong></div></div>\`\n}\n\nfunction renderCoverage`,
    'Day Flow summary owner')
  source = replaceExact(source,
    `  const current = new URLSearchParams(window.location.search)\n  const params = new URLSearchParams()\n  const layout = current.get('layout')\n  if (layout === 'split' || layout === 'wide') params.set('layout', layout)\n  else if (layout === 'theater') params.set('layout', 'wide')`,
    `  const params = new URLSearchParams()\n  if (state.layoutInUrl) params.set('layout', state.layout)`,
    'Day Flow canonical layout URL')
  writeFileSync(path, source)
}

function patchBattleLines() {
  const path = 'apps/web/src/live/battle-lines-current-shell-entry.ts'
  let source = readFileSync(path, 'utf8')
  if (!source.startsWith("import { applyBattleLinesLayout")) {
    source = `import { applyBattleLinesLayout, canUseBattleLinesSplit, initializeBattleLinesLayoutHost, normalizeBattleLayout, renderBattleLinesSplitRail, type BattleLayoutMode } from './battle-lines-layout'\nimport { canonicalBattleLinesTime, readBattleLinesSelection } from '../navigation/battle-lines-deep-link-bridge'\n\n${source}`
  }
  source = replaceExact(source,
    `type State = { metric: Metric; top: 3 | 5 | 10; bucket: '5m' | '10m'; range: RangeMode; date: string; selectedBattleId: string | null; selectedLineId: string | null; selectedIndex: number; manualBattle: boolean; followLatest: boolean; dragging: boolean }`,
    `type State = { metric: Metric; top: 3 | 5 | 10; bucket: '5m' | '10m'; range: RangeMode; date: string; selectedBattleId: string | null; selectedLineId: string | null; selectedIndex: number; requestedTime: string | null; legacyPoint: number; manualBattle: boolean; followLatest: boolean; dragging: boolean; layout: BattleLayoutMode; layoutInUrl: boolean }`,
    'Battle Lines state architecture fields')
  source = replaceExact(source,
    `const params = new URLSearchParams(location.search)\nconst todayUtc`,
    `const params = new URLSearchParams(location.search)\nconst selection = readBattleLinesSelection(params)\nconst todayUtc`,
    'Battle Lines selection parser')
  source = replaceExact(source,
    `  selectedIndex: parseIndex(params.get('point')),\n  manualBattle: Boolean(params.get('battle')),\n  followLatest: params.get('point') === null,\n  dragging: false,`,
    `  selectedIndex: selection.point,\n  requestedTime: selection.time,\n  legacyPoint: selection.point,\n  manualBattle: Boolean(params.get('battle')),\n  followLatest: selection.time === null && selection.point < 0,\n  dragging: false,\n  layout: normalizeBattleLayout(params.get('layout')),\n  layoutInUrl: params.get('layout') !== null,`,
    'Battle Lines initial architecture state')
  source = replaceExact(source,
    `let requestSerial = 0\nlet autoTimer = 0\n\nwireControls()`,
    `let requestSerial = 0\nlet autoTimer = 0\nconst BATTLE_LINES_TIMEOUT_MS = 12_000\n\ninitializeBattleLinesLayoutHost()\nwireControls()`,
    'Battle Lines layout initialization')
  source = replaceExact(source,
    `function wireControls(): void {\n  document.querySelectorAll<HTMLButtonElement>('[data-battle-metric]')`,
    `function wireControls(): void {\n  document.querySelectorAll<HTMLButtonElement>('[data-battle-layout]').forEach((button) => button.addEventListener('click', () => {\n    const next: BattleLayoutMode = button.dataset.battleLayout === 'split' ? 'split' : 'wide'\n    if (next === 'split' && !canUseBattleLinesSplit()) return\n    state.layout = next\n    state.layoutInUrl = true\n    syncControls()\n    syncUrl()\n    renderBattleLinesSplitRail()\n  }))\n  window.addEventListener('resize', () => {\n    if (state.layout === 'split' && !canUseBattleLinesSplit()) {\n      state.layout = 'wide'\n      state.layoutInUrl = true\n      syncUrl()\n    }\n    syncControls()\n    renderBattleLinesSplitRail()\n  })\n  window.addEventListener('popstate', () => {\n    const nextParams = new URLSearchParams(location.search)\n    state.layout = normalizeBattleLayout(nextParams.get('layout'))\n    state.layoutInUrl = nextParams.get('layout') !== null\n    syncControls()\n    renderBattleLinesSplitRail()\n  })\n\n  document.querySelectorAll<HTMLButtonElement>('[data-battle-metric]')`,
    'Battle Lines layout controls')
  source = replaceExact(source,
    `    const response = await fetch(\`${endpoint}?\${query}\`, { headers: { accept: 'application/json' }, cache: 'no-store' })`,
    `    const response = await fetchBattleLinesResponse(\`${endpoint}?\${query}\`)`,
    'Battle Lines owned request timeout')
  source = replaceExact(source,
    `    if (previousBucket) state.selectedIndex = nearestTimelineIndex(next.timeline, previousBucket)\n    if (state.followLatest || state.selectedIndex < 0 || state.selectedIndex >= next.timeline.length) state.selectedIndex = latestUsefulIndex(next)`,
    `    if (previousBucket) state.selectedIndex = nearestTimelineIndex(next.timeline, previousBucket)\n    else if (state.requestedTime) state.selectedIndex = nearestTimelineIndex(next.timeline, state.requestedTime)\n    if (state.followLatest || state.selectedIndex < 0 || state.selectedIndex >= next.timeline.length) state.selectedIndex = latestUsefulIndex(next)\n    state.requestedTime = next.timeline[state.selectedIndex] ?? null\n    state.legacyPoint = -1`,
    'Battle Lines selected-time resolution')
  source = replaceExact(source,
    `  renderFeed(payload)\n  renderCoverage(payload)\n}`,
    `  renderFeed(payload)\n  renderCoverage(payload)\n  applyBattleLinesLayout(state.layout)\n  renderBattleLinesSplitRail()\n}`,
    'Battle Lines explicit split render')
  source = replaceExact(source,
    `  setPressed('[data-battle-range]', 'battleRange', state.range)\n  const input = dateInput()\n  if (input) { input.value = state.date; input.max = todayUtc }`,
    `  setPressed('[data-battle-range]', 'battleRange', state.range)\n  setPressed('[data-battle-layout]', 'battleLayout', state.layout)\n  const input = dateInput()\n  if (input) {\n    input.value = state.date\n    input.max = todayUtc\n    input.hidden = state.range !== 'date'\n    input.disabled = state.range !== 'date'\n  }\n  applyBattleLinesLayout(state.layout)`,
    'Battle Lines owned date and layout sync')
  source = replaceExact(source,
    `  const next = new URLSearchParams()\n  if (state.metric !== 'viewers')`,
    `  const next = new URLSearchParams()\n  if (state.layoutInUrl) next.set('layout', state.layout)\n  if (state.metric !== 'viewers')`,
    'Battle Lines layout URL')
  source = replaceExact(source,
    `  if (state.selectedLineId) next.set('stream', state.selectedLineId)\n  if (!state.followLatest && state.selectedIndex >= 0) next.set('point', String(state.selectedIndex))\n  history.replaceState(null, '', \`${location.pathname}\${next.size ? \`?\${next}\` : ''}\`)`,
    `  if (state.selectedLineId) next.set('stream', state.selectedLineId)\n  if (!state.followLatest && state.selectedIndex >= 0) {\n    const time = canonicalBattleLinesTime(payload?.timeline ?? [], state.selectedIndex, state.legacyPoint, state.bucket, state.range, state.range === 'date' ? state.date : null)\n    if (time) next.set('time', time)\n  }\n  history.replaceState(null, '', \`${location.pathname}\${next.size ? \`?\${next}\` : ''}\`)`,
    'Battle Lines canonical time URL')
  source = replaceRegex(source,
    /function renderFatal\(message: string\): void \{[\s\S]*?\n\}\n\nfunction startAutoRefresh/,
    `async function fetchBattleLinesResponse(url: string): Promise<Response> {\n  const controller = new AbortController()\n  const timeoutId = window.setTimeout(() => controller.abort(new DOMException('Battle Lines API timed out.', 'TimeoutError')), BATTLE_LINES_TIMEOUT_MS)\n  try {\n    return await fetch(url, { headers: { accept: 'application/json' }, cache: 'no-store', signal: controller.signal })\n  } catch (error) {\n    if (controller.signal.aborted) throw new Error(\`Battle Lines API did not respond within \${Math.round(BATTLE_LINES_TIMEOUT_MS / 1000)} seconds.\`)\n    throw error\n  } finally {\n    window.clearTimeout(timeoutId)\n  }\n}\n\nfunction renderFatal(message: string): void {\n  const safe = escapeHtml(message)\n  const facts = document.querySelectorAll<HTMLElement>('.head-facts .fact strong')\n  if (facts[0]) facts[0].textContent = 'Error'\n  if (facts[1]) facts[1].textContent = 'Unavailable'\n  if (facts[2]) facts[2].textContent = '—'\n  if (facts[3]) facts[3].textContent = 'Request failed'\n  const status = document.querySelector<HTMLElement>('[data-battle-status]')\n  if (status) { status.className = 'battle-status battle-status--error'; status.innerHTML = \`<strong>Error</strong><span>\${safe}</span>\` }\n  const primary = document.querySelector<HTMLElement>('[data-battle-primary]')\n  if (primary) primary.innerHTML = '<div class="notice">Recommended battle is unavailable because the data request failed.</div>'\n  const stage = document.querySelector<HTMLElement>('[data-battle-stage]')\n  if (stage) stage.innerHTML = \`<div class="notice">Battle Lines is unavailable: \${safe}</div>\`\n  const inspector = document.querySelector<HTMLElement>('[data-battle-inspector]')\n  if (inspector) inspector.innerHTML = '<p>No battle time can be inspected until the API responds.</p>'\n  const reversals = document.querySelector<HTMLElement>('[data-battle-reversals]')\n  if (reversals) reversals.innerHTML = '<p class="empty-inline">Reversals are unavailable.</p>'\n  const secondary = document.querySelector<HTMLElement>('[data-battle-secondary]')\n  if (secondary) secondary.innerHTML = '<p class="empty-inline">Secondary battles are unavailable.</p>'\n  const feed = document.querySelector<HTMLElement>('[data-battle-feed]')\n  if (feed) feed.innerHTML = '<p class="empty-inline">Battle events are unavailable.</p>'\n  const coverage = document.querySelector<HTMLElement>('[data-battle-coverage]')\n  if (coverage) coverage.innerHTML = \`<strong>Coverage & limits</strong><p>\${safe} Use Refresh to retry.</p>\`\n  applyBattleLinesLayout(state.layout)\n  renderBattleLinesSplitRail()\n}\n\nfunction startAutoRefresh`,
    'Battle Lines owned fatal state')
  writeFileSync(path, source)
}

function patchHtml(path) {
  let source = readFileSync(path, 'utf8')
  source = source.replace('<script type="module" src="/src/live/day-flow-layout-summary.ts"></script>', '')
  source = source.replace('<script type="module" src="/src/live/battle-lines-layout.ts"></script>', '')
  source = source.replace('<script type="module" src="/src/live/battle-lines-loading-guard.ts"></script>', '')
  source = source.replace('<script type="module" src="/src/navigation/battle-lines-deep-link-bridge.ts"></script>', '')
  writeFileSync(path, source)
}

patchDayFlow()
patchBattleLines()
for (const path of [
  'apps/web/twitch/day-flow/index.html',
  'apps/web/kick/day-flow/index.html',
  'apps/web/twitch/battle-lines/index.html',
  'apps/web/kick/battle-lines/index.html',
]) patchHtml(path)

console.log('U10G architecture patch applied.')
