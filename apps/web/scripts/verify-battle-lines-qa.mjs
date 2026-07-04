import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const failures = []

function read(path) {
  return readFileSync(join(root, path), 'utf8')
}

function requireFile(path) {
  if (!existsSync(join(root, path))) failures.push(`${path}: missing required Battle Lines QA file`)
}

function requireFragment(path, source, fragment) {
  if (!source.includes(fragment)) failures.push(`${path}: missing required Battle Lines QA fragment: ${fragment}`)
}

function forbidPattern(path, source, label, pattern) {
  if (pattern.test(source)) failures.push(`${path}: contains forbidden Battle Lines regression: ${label}`)
}

function assertEqual(label, actual, expected) {
  if (actual !== expected) failures.push(`behavior: ${label}: expected ${expected}, received ${actual}`)
}

const battlePages = ['twitch/battle-lines/index.html', 'kick/battle-lines/index.html']
const entryPath = 'src/live/battle-lines-current-shell-entry.ts'
const layoutPath = 'src/live/battle-lines-layout.ts'
const deepLinkPath = 'src/navigation/battle-lines-deep-link-bridge.ts'
const retiredGuardPath = 'src/live/battle-lines-loading-guard.ts'
const stylePath = 'src/live/battle-lines-wide.css'
const recoveryStylePath = 'src/live/battle-lines-recovery.css'
const polishStylePath = 'src/live/battle-lines-polish.css'
const splitStylePath = 'src/live/battle-lines-split.css'
const requestPath = 'functions/_lib/battle-lines-request.ts'
const twitchApiPath = 'functions/api/battle-lines.ts'
const kickApiPath = 'functions/api/kick-battle-lines.ts'
const contractPath = 'docs/battle-lines-qa-contract.md'

for (const path of [
  ...battlePages,
  entryPath,
  layoutPath,
  deepLinkPath,
  stylePath,
  recoveryStylePath,
  polishStylePath,
  splitStylePath,
  requestPath,
  twitchApiPath,
  kickApiPath,
  contractPath,
]) requireFile(path)
assertEqual('retired Battle Lines loading guard removed', existsSync(join(root, retiredGuardPath)), false)

for (const path of battlePages.filter((path) => existsSync(join(root, path)))) {
  const source = read(path)
  for (const fragment of [
    '/src/live/battle-lines-current-shell-entry.ts',
    '/src/live/battle-lines-wide.css',
    '/src/live/battle-lines-recovery.css',
    '/src/live/battle-lines-polish.css',
    '/src/live/battle-lines-split.css',
    'class="battle-stage"',
    'data-battle-primary',
    'data-battle-inspector',
    'data-battle-reversals',
    'data-battle-secondary',
    'data-battle-feed',
    'data-battle-coverage',
    'data-battle-layout="wide"',
    'data-battle-layout="split"',
    'data-battle-range="today"',
    'data-battle-range="yesterday"',
    'data-battle-date',
    'hidden disabled',
    'data-battle-metric="viewers"',
    'data-battle-metric="indexed"',
    'data-battle-top="3"',
    'data-battle-top="5"',
    'data-battle-top="10"',
    'data-battle-bucket="5m"',
    'data-battle-bucket="10m"',
    'data-battle-recommended',
    'data-battle-latest',
    'data-battle-refresh',
  ]) requireFragment(path, source, fragment)
  assertEqual(`${path} primary feature entry count`, (source.match(/battle-lines-current-shell-entry\.ts/g) ?? []).length, 1)
  for (const retired of [
    'src="/src/live/battle-lines-layout.ts"',
    'src="/src/live/battle-lines-loading-guard.ts"',
    'src="/src/navigation/battle-lines-deep-link-bridge.ts"',
  ]) forbidPattern(path, source, `retired independent entry ${retired}`, new RegExp(retired.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
  forbidPattern(path, source, 'obsolete fixed Split layout', /class="layout-split"/)
  forbidPattern(path, source, 'static legacy Battle Lines SVG', /<svg viewBox="0 0 1210 560"/)
  forbidPattern(path, source, 'static Stream tile labels', /data-name="Stream [A-Z]"|>Stream [A-Z]</)
}

if (existsSync(join(root, entryPath))) {
  const source = read(entryPath)
  for (const fragment of [
    "from './battle-lines-layout'",
    "from '../navigation/battle-lines-deep-link-bridge'",
    "provider === 'kick' ? '/api/kick-battle-lines' : '/api/battle-lines'",
    'const BATTLE_LINES_TIMEOUT_MS = 12_000',
    'async function fetchBattleLinesResponse',
    'new AbortController()',
    "cache: 'no-store'",
    'signal: controller.signal',
    'readBattleLinesSelection(params)',
    'requestedTime: selection.time',
    'legacyPoint: selection.point',
    'canonicalBattleLinesTime(',
    "next.set('time', time)",
    'initializeBattleLinesLayoutHost()',
    'applyBattleLinesLayout(state.layout)',
    'renderBattleLinesSplitRail()',
    "input.hidden = state.range !== 'date'",
    'renderPrimary(payload)',
    'renderChart(payload)',
    'renderInspector(payload)',
    'renderReversals(payload)',
    'renderSecondary(payload)',
    'renderFeed(payload)',
    'renderCoverage(payload)',
    'selectedBattleId',
    'selectedLineId',
    'selectedIndex',
    'manualBattle',
    'followLatest',
    'data-battle-chart',
    'data-battle-line-select',
    'data-battle-event-index',
    'lineSegments(',
    'gapBand(',
    "chart.addEventListener('pointerdown'",
    "event.key === 'ArrowLeft'",
    "event.key === 'ArrowRight'",
    "event.key === 'Home'",
    "event.key === 'End'",
    'history.replaceState',
    'window.setInterval',
    'Use Refresh to retry.',
    'missing',
    'offline',
    'not_observed',
  ]) requireFragment(entryPath, source, fragment)
  forbidPattern(entryPath, source, 'legacy point URL emission', /next\.set\(['"]point['"]/)
  forbidPattern(entryPath, source, 'global fetch replacement', /window\.fetch\s*=/)
  forbidPattern(entryPath, source, 'global history replacement', /window\.history\.replaceState\s*=/)
  forbidPattern(entryPath, source, 'URLSearchParams prototype replacement', /URLSearchParams\.prototype\.get\s*=/)
  forbidPattern(entryPath, source, 'MutationObserver coordination', /new MutationObserver/)
  forbidPattern(entryPath, source, 'per-line point deletion before comparison', /\.filter\(isObservedPoint\)/)
  forbidPattern(entryPath, source, 'app-root rewrite renderer', /document\.querySelector<HTMLElement>\('\#app'\)/)
  forbidPattern(entryPath, source, 'old selected-stream inspector', /Selected stream|Nearest line/)
}

if (existsSync(join(root, layoutPath))) {
  const source = read(layoutPath)
  for (const fragment of [
    "export type BattleLayoutMode = 'wide' | 'split'",
    'SPLIT_MIN_WIDTH = 1180',
    'export function normalizeBattleLayout',
    "if (value === 'split') return 'split'",
    "return 'wide'",
    'function splitViewportAvailable()',
    'export function canUseBattleLinesSplit',
    "document.body.dataset.battleLayoutRequested === 'split'",
    'export function initializeBattleLinesLayoutHost',
    'data-battle-layout-shell',
    'data-battle-split-rail',
    'export function applyBattleLinesLayout',
    "requestedLayout === 'split' && splitAvailable ? 'split' : 'wide'",
    'shell.dataset.battleLayoutCurrent = effectiveLayout',
    'shell.dataset.battleLayoutRequested = requestedLayout',
    'export function renderBattleLinesSplitRail',
    'Selected stream',
    'Top at selected time',
    'Recent battle feed',
    '.slice(0, 3)',
  ]) requireFragment(layoutPath, source, fragment)
  forbidPattern(layoutPath, source, 'layout-triggered API request', /\bfetch\s*\(/)
  forbidPattern(layoutPath, source, 'history replacement', /history\.replaceState\s*=|window\.history\.replaceState\s*=/)
  forbidPattern(layoutPath, source, 'MutationObserver coordination', /new MutationObserver/)
}

if (existsSync(join(root, deepLinkPath))) {
  const source = read(deepLinkPath)
  for (const fragment of [
    'export function pointFromTime',
    'export function timeFromPoint',
    'export function readBattleLinesSelection',
    "params.get('point')",
    'export function canonicalBattleLinesTime',
  ]) requireFragment(deepLinkPath, source, fragment)
  forbidPattern(deepLinkPath, source, 'URLSearchParams prototype replacement', /URLSearchParams\.prototype\.get\s*=/)
  forbidPattern(deepLinkPath, source, 'history replacement', /history\.replaceState\s*=|window\.history\.replaceState\s*=/)
  forbidPattern(deepLinkPath, source, 'MutationObserver coordination', /new MutationObserver/)
}

if (existsSync(join(root, requestPath))) {
  const source = read(requestPath)
  for (const fragment of [
    'BATTLE_QUERY_TIMEOUT_MS',
    'BATTLE_MAX_SNAPSHOT_ROWS',
    'withTimeout',
    'compactBattleRows',
    '.slice(0, Math.max(2, top))',
  ]) requireFragment(requestPath, source, fragment)
}

for (const path of [twitchApiPath, kickApiPath].filter((path) => existsSync(join(root, path)))) {
  const source = read(path)
  for (const fragment of [
    'ORDER BY bucket_minute DESC',
    'LIMIT ${BATTLE_MAX_SNAPSHOT_ROWS}',
    'withTimeout(',
    'compactBattleRows(',
    'diagnostics:',
    "'server-timing'",
  ]) requireFragment(path, source, fragment)
}

if (existsSync(join(root, stylePath))) {
  const source = read(stylePath)
  for (const fragment of ['.battle-controls', '.battle-primary', '.battle-chart-wrap', '.battle-gap-band', '.battle-inspector', '.reversal-strip', '.secondary-grid', '.event-feed', '@media(max-width:760px)']) requireFragment(stylePath, source, fragment)
}

if (existsSync(join(root, recoveryStylePath))) {
  const source = read(recoveryStylePath)
  for (const fragment of ['.battle-control input[hidden]', '.battle-stage:has(> .notice)', '@media(max-width:760px)']) requireFragment(recoveryStylePath, source, fragment)
}

if (existsSync(join(root, polishStylePath))) {
  const source = read(polishStylePath)
  for (const fragment of ['.chart-grid .x-axis-tick text', '.secondary-card.active', '.ranking__row--unavailable']) requireFragment(polishStylePath, source, fragment)
}

if (existsSync(join(root, splitStylePath))) {
  const source = read(splitStylePath)
  for (const fragment of ['.battle-layout-shell.is-split', 'position:sticky', '.battle-split-rail[hidden]', '@media(max-width:1179px)']) requireFragment(splitStylePath, source, fragment)
}

if (existsSync(join(root, contractPath))) {
  const source = read(contractPath)
  for (const fragment of [
    'Each provider page loads exactly one Battle Lines feature entry',
    'The primary controller owns request state, timeout',
    'The retired loading guard must not exist.',
    'Wide is the default layout.',
    'Responsive fallback must preserve the requested layout state',
    'New canonical links use the selected UTC bucket `time` value.',
    'Legacy non-negative integer `point` values remain readable.',
    'shared UTC bucket timeline',
    'not-observed points are not connected',
    'selected-time cursor',
    'Reversal strip',
    'Secondary battles',
  ]) requireFragment(contractPath, source, fragment)
}

if (failures.length > 0) {
  console.error('ViewLoom Battle Lines QA verification failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(`ViewLoom Battle Lines QA verification passed for ${battlePages.length} single-owner Wide and Split rivalry workspaces.`)
