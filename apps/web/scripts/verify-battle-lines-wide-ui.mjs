import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

const read = (path) => readFileSync(path, 'utf8')
const controllerPath = 'src/live/battle-lines-current-shell-entry.ts'
const layoutPath = 'src/live/battle-lines-layout.ts'
const linkPath = 'src/navigation/battle-lines-deep-link-bridge.ts'
const removedGuardPath = 'src/live/battle-lines-loading-guard.ts'
const controller = read(controllerPath)
const layout = read(layoutPath)
const deepLink = read(linkPath)
const twitch = read('twitch/battle-lines/index.html')
const kick = read('kick/battle-lines/index.html')
const css = `${read('src/battle-lines.css')}\n${read('src/battle-lines-wide.css')}`

assert.equal(existsSync(removedGuardPath), false, 'obsolete Battle Lines loading guard remains')

for (const [provider, html] of [['twitch', twitch], ['kick', kick]]) {
  assert.ok(html.includes('/src/live/battle-lines-current-shell-entry.ts'), `${provider}: primary controller entry missing`)
  for (const retired of [
    '/src/live/battle-lines-layout.ts',
    '/src/live/battle-lines-loading-guard.ts',
    '/src/navigation/battle-lines-deep-link-bridge.ts',
  ]) assert.equal(html.includes(retired), false, `${provider}: retired entry remains: ${retired}`)
  assert.equal((html.match(/battle-lines-current-shell-entry\.ts/g) ?? []).length, 1, `${provider}: primary controller must load once`)
}

for (const fragment of [
  "from './battle-lines-layout'",
  "from '../navigation/battle-lines-deep-link-bridge'",
  'initializeBattleLinesLayoutHost()',
  'applyBattleLinesLayout(state.layout)',
  'renderBattleLinesSplitRail()',
  'const BATTLE_LINES_TIMEOUT_MS = 12_000',
  'async function fetchBattleLinesResponse',
  'new AbortController()',
  'readBattleLinesSelection(params)',
  'canonicalBattleLinesTime(',
  "next.set('time', time)",
  "input.hidden = state.range !== 'date'",
]) assert.ok(controller.includes(fragment), `primary Battle Lines owner missing ${fragment}`)

for (const forbidden of [
  'window.fetch =',
  'window.history.replaceState =',
  'URLSearchParams.prototype.get =',
  'new MutationObserver',
  "next.set('point'",
]) assert.equal(controller.includes(forbidden), false, `primary controller contains forbidden architecture: ${forbidden}`)

for (const fragment of [
  'export function initializeBattleLinesLayoutHost',
  'export function applyBattleLinesLayout',
  'export function renderBattleLinesSplitRail',
  'export function canUseBattleLinesSplit',
  'SPLIT_MIN_WIDTH = 1180',
]) assert.ok(layout.includes(fragment), `layout helper missing ${fragment}`)
for (const forbidden of ['window.history.replaceState =', 'new MutationObserver', 'fetch(']) {
  assert.equal(layout.includes(forbidden), false, `layout helper owns forbidden state: ${forbidden}`)
}

for (const fragment of [
  'export function pointFromTime',
  'export function timeFromPoint',
  'export function readBattleLinesSelection',
  'export function canonicalBattleLinesTime',
]) assert.ok(deepLink.includes(fragment), `deep-link helper missing ${fragment}`)
for (const forbidden of ['URLSearchParams.prototype.get =', 'history.replaceState =', 'window.history.replaceState =', 'new MutationObserver']) {
  assert.equal(deepLink.includes(forbidden), false, `deep-link helper contains forbidden interception: ${forbidden}`)
}

for (const fragment of [
  '.battle-layout-shell',
  '.battle-layout-shell.is-split',
  '.battle-split-rail',
  '@media(max-width:1179px)',
]) assert.ok(css.includes(fragment), `Battle Lines wide CSS missing ${fragment}`)

console.log('Battle Lines consolidated architecture verification passed.')
console.log('- one primary controller entry per provider route')
console.log('- layout, timeout, selected-time URL, and degraded state have explicit owners')
console.log('- no fetch/history/prototype interception or MutationObserver coordination remains')
