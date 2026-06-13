import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const root = new URL('../', import.meta.url)
const [ui, twitch, kick, css] = await Promise.all([
  readFile(new URL('src/live/battle-lines-current-shell-entry.ts', root), 'utf8'),
  readFile(new URL('twitch/battle-lines/index.html', root), 'utf8'),
  readFile(new URL('kick/battle-lines/index.html', root), 'utf8'),
  readFile(new URL('src/live/battle-lines-wide.css', root), 'utf8'),
])

for (const [name, html] of [['twitch', twitch], ['kick', kick]]) {
  assert.ok(!html.includes('layout-split'), `${name}: obsolete Split layout must be removed`)
  for (const hook of [
    'data-battle-range="today"',
    'data-battle-range="yesterday"',
    'data-battle-date',
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
  "window.setInterval",
]) assert.ok(ui.includes(behavior), `UI behavior missing: ${behavior}`)

assert.ok(!ui.includes('.filter(isObservedPoint)'), 'UI must not delete timeline gaps')
assert.ok(css.includes('@media(max-width:760px)'), 'Mobile-specific layout is required')
assert.ok(css.includes('.battle-gap-band'), 'Gap band styling is required')
assert.ok(css.includes('.battle-chart-wrap'), 'Wide chart styling is required')

console.log('Battle Lines Wide UI contract passed.')
