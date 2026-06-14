import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const root = new URL('../', import.meta.url)
const [ui, layout, guard, twitch, kick, css, recoveryCss, polishCss, splitCss] = await Promise.all([
  readFile(new URL('src/live/battle-lines-current-shell-entry.ts', root), 'utf8'),
  readFile(new URL('src/live/battle-lines-layout.ts', root), 'utf8'),
  readFile(new URL('src/live/battle-lines-loading-guard.ts', root), 'utf8'),
  readFile(new URL('twitch/battle-lines/index.html', root), 'utf8'),
  readFile(new URL('kick/battle-lines/index.html', root), 'utf8'),
  readFile(new URL('src/live/battle-lines-wide.css', root), 'utf8'),
  readFile(new URL('src/live/battle-lines-recovery.css', root), 'utf8'),
  readFile(new URL('src/live/battle-lines-polish.css', root), 'utf8'),
  readFile(new URL('src/live/battle-lines-split.css', root), 'utf8'),
])

for (const [name, html] of [['twitch', twitch], ['kick', kick]]) {
  assert.ok(!html.includes('class="layout-split"'), `${name}: obsolete fixed Split shell must not return`)
  for (const hook of [
    '/src/live/battle-lines-layout.ts',
    '/src/live/battle-lines-loading-guard.ts',
    '/src/live/battle-lines-recovery.css',
    '/src/live/battle-lines-polish.css',
    '/src/live/battle-lines-split.css',
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
    'data-battle-primary',
    'data-battle-stage',
    'data-battle-inspector',
    'data-battle-reversals',
    'data-battle-secondary',
    'data-battle-feed',
    'data-battle-coverage',
  ]) assert.ok(html.includes(hook), `${name}: missing ${hook}`)
}

for (const behavior of [
  'lineSegments(',
  'gapBand(',
  "event.key === 'ArrowLeft'",
  "event.key === 'ArrowRight'",
  "chart.addEventListener('pointerdown'",
  'state.followLatest',
  'data-battle-event-index',
  'state.manualBattle',
  'history.replaceState',
  'window.setInterval',
  'x-axis-tick',
  'x-axis-title',
  'Selected time',
  'Leader at selected time',
  'Selected battle',
  'Gap before',
  'Gap after',
  'ranking__row--unavailable',
  'Collector health:',
  'chart-marker--dot-only',
  'secondary-card${active',
]) assert.ok(ui.includes(behavior), `Wide behavior missing: ${behavior}`)

for (const behavior of [
  "type BattleLayoutMode = 'wide' | 'split'",
  'SPLIT_MIN_WIDTH = 1180',
  "if (value === 'split') return 'split'",
  "return 'wide'",
  "value === 'theater'",
  'data-battle-layout-shell',
  'data-battle-split-rail',
  'effectiveLayout',
  "requestedLayout = 'wide'",
  "next.searchParams.set('layout', requestedLayout)",
  'nativeReplaceState',
  'Selected stream',
  'Top at selected time',
  'Recent battle feed',
  '.slice(0, 3)',
]) assert.ok(layout.includes(behavior), `Layout behavior missing: ${behavior}`)
assert.ok(!layout.includes('fetch('), 'Layout switching must not refetch Battle Lines data')

for (const behavior of [
  'BATTLE_LINES_TIMEOUT_MS',
  'AbortController',
  'renderUnavailableSurface(',
  'syncDateInputVisibility(',
  'Use Refresh to retry.',
]) assert.ok(guard.includes(behavior), `Loading guard missing: ${behavior}`)

assert.ok(!ui.includes('.filter(isObservedPoint)'), 'UI must not delete timeline gaps')
assert.ok(css.includes('@media(max-width:760px)'), 'Mobile-specific layout is required')
assert.ok(css.includes('.battle-gap-band'), 'Gap band styling is required')
assert.ok(css.includes('.battle-chart-wrap'), 'Wide chart styling is required')
assert.ok(recoveryCss.includes('.battle-stage:has(> .notice)'), 'Loading stage must collapse instead of reserving an empty chart')
assert.ok(recoveryCss.includes('.battle-control input[hidden]'), 'Inactive date input must stay hidden')
assert.ok(polishCss.includes('.chart-grid .x-axis-tick text'), 'Readable X-axis labels are required')
assert.ok(polishCss.includes('.secondary-card.active'), 'Selected Secondary battle must be visibly active')
assert.ok(polishCss.includes('.ranking__row--unavailable'), 'Unavailable ranking rows must remain visible')
assert.ok(splitCss.includes('.battle-layout-shell.is-split'), 'Split must use a dedicated desktop grid')
assert.ok(splitCss.includes('position:sticky'), 'Split inspector must stay visible while the chart is inspected')
assert.ok(splitCss.includes('@media(max-width:1179px)'), 'Tablet and mobile must collapse to Wide')
assert.ok(splitCss.includes('.battle-split-rail[hidden]'), 'Wide mode must remove the Split rail')

console.log('Battle Lines Wide and Split layout contract passed.')
