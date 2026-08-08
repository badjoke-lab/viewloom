import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const read = (path) => readFileSync(join(root, path), 'utf8')
const required = [
  'docs/work-in-progress/u10g-architecture.md',
  'apps/web/src/live/day-flow-current-shell-entry.ts',
  'apps/web/src/live/day-flow-layout-summary.ts',
  'apps/web/src/live/day-flow-twitch-entry.ts',
  'apps/web/src/live/day-flow-category-preview-entry.ts',
  'apps/web/src/live/battle-lines-current-shell-entry.ts',
  'apps/web/src/live/battle-lines-layout.ts',
  'apps/web/src/navigation/battle-lines-deep-link-bridge.ts',
  'apps/web/scripts/quality-u10g-architecture-browser.mjs',
  'scripts/verify-quality-u10g-architecture.mjs',
  'scripts/verify-quality-u10g-browser-evidence.mjs',
  '.github/workflows/quality-u10g-architecture.yml',
]
for (const path of required) assert.equal(existsSync(join(root,path)),true,`missing file: ${path}`)
for (const path of ['apps/web/src/live/battle-lines-loading-guard.ts','.github/workflows/u10g-bootstrap.yml','.github/workflows/u10g-test-patch.yml','.github/workflows/u10g-mobile-layout-fix.yml','scripts/u10g_patch_architecture.mjs']) assert.equal(existsSync(join(root,path)),false,`temporary or retired architecture file remains: ${path}`)

const note=read('docs/work-in-progress/u10g-architecture.md')
for (const fragment of ['Status: complete','work-quality-u10g-architecture','work-quality-u10h-acceptance','Merged PR: #470','Day Flow has one request/state/controller owner per provider route.','Battle Lines has one request/state/controller owner per provider route.','No feature coordination code replaces `window.fetch`, `history.replaceState`, or `URLSearchParams.prototype.get`.']) assert.ok(note.includes(fragment),`U10G note missing ${fragment}`)

const twitchHtml=read('apps/web/twitch/day-flow/index.html')
const kickHtml=read('apps/web/kick/day-flow/index.html')
assert.equal((twitchHtml.match(/day-flow-twitch-entry\.ts/g)??[]).length,1,'Twitch Day Flow must have one provider bootstrap entry')
assert.equal((twitchHtml.match(/day-flow-current-shell-entry\.ts/g)??[]).length,0,'Twitch HTML must not race the controller beside its bootstrap')
assert.equal((kickHtml.match(/day-flow-current-shell-entry\.ts/g)??[]).length,1,'Kick Day Flow primary entry count changed')
assert.equal(kickHtml.includes('day-flow-twitch-entry.ts'),false,'Kick must not load Twitch Day Flow bootstrap')
for (const html of [twitchHtml,kickHtml]) assert.equal(html.includes('day-flow-layout-summary.ts'),false,'secondary Day Flow entry remains')

const twitchEntry=read('apps/web/src/live/day-flow-twitch-entry.ts')
const preview=read('apps/web/src/live/day-flow-category-preview-entry.ts')
const previewImport="import './day-flow-category-preview-entry'"
const controllerImport="void import('./day-flow-current-shell-entry')"
assert.ok(twitchEntry.includes(previewImport),'Twitch bootstrap missing hidden preview boundary')
assert.ok(twitchEntry.includes(controllerImport),'Twitch bootstrap missing single Day Flow controller')
assert.ok(twitchEntry.indexOf(previewImport)<twitchEntry.indexOf(controllerImport),'hidden preview boundary must initialize before controller hydration')
assert.ok(preview.includes("provider === 'twitch' && initialUrl.searchParams.get(PREVIEW_PARAM) === '1'"),'preview boundary must be Twitch + explicit-preview gated')
assert.ok(preview.includes('if (enabled) {'),'preview side effects must be behind the hidden-candidate gate')

const dayMain=read('apps/web/src/live/day-flow-current-shell-entry.ts')
const dayHelper=read('apps/web/src/live/day-flow-layout-summary.ts')
for (const fragment of ["from './day-flow-layout-summary'",'layout: DayFlowLayoutMode','renderEnhancedDayFlowSummary(target, payload)','applyDayFlowLayout(state.layout)',"if (state.layoutInUrl) params.set('layout', state.layout)"]) assert.ok(dayMain.includes(fragment),`Day Flow primary owner missing ${fragment}`)
assert.equal((dayMain.match(/fetch\(`/g)??[]).length,1,'Day Flow must have one feature request call owner')
for (const forbidden of ['new MutationObserver','window.fetch =','window.history.replaceState =','URLSearchParams.prototype.get =']) { assert.equal(dayMain.includes(forbidden),false,`Day Flow primary owner contains ${forbidden}`); assert.equal(dayHelper.includes(forbidden),false,`Day Flow helper contains ${forbidden}`) }
for (const forbidden of ['fetch(','setInterval(','addEventListener(']) assert.equal(dayHelper.includes(forbidden),false,`Day Flow helper owns runtime state: ${forbidden}`)

// The hidden candidate may install a temporary provider-specific boundary only
// when categoryPreview=1. Default/public Day Flow still loads the same single
// controller and U10G browser evidence verifies no global replacement there.
for (const forbidden of ['URLSearchParams.prototype.get =']) assert.equal(preview.includes(forbidden),false,`hidden candidate mutates URLSearchParams prototype: ${forbidden}`)

const battleMain=read('apps/web/src/live/battle-lines-current-shell-entry.ts')
const battleLayout=read('apps/web/src/live/battle-lines-layout.ts')
const battleLink=read('apps/web/src/navigation/battle-lines-deep-link-bridge.ts')
for (const fragment of ["from './battle-lines-layout'","from '../navigation/battle-lines-deep-link-bridge'",'const BATTLE_LINES_TIMEOUT_MS = 12_000','async function fetchBattleLinesResponse','new AbortController()','readBattleLinesSelection(params)','canonicalBattleLinesTime(',"next.set('time', time)",'renderBattleLinesSplitRail()',"input.hidden = state.range !== 'date'"]) assert.ok(battleMain.includes(fragment),`Battle Lines primary owner missing ${fragment}`)
for (const fragment of ['function splitViewportAvailable()',"document.body.dataset.battleLayoutRequested === 'split'","requestedLayout === 'split' && splitAvailable ? 'split' : 'wide'",'shell.dataset.battleLayoutCurrent = effectiveLayout','shell.dataset.battleLayoutRequested = requestedLayout']) assert.ok(battleLayout.includes(fragment),`Battle Lines responsive layout owner missing ${fragment}`)
for (const source of [battleMain,battleLayout,battleLink]) for (const forbidden of ['window.fetch =','window.history.replaceState =','URLSearchParams.prototype.get =','new MutationObserver']) assert.equal(source.includes(forbidden),false,`Battle Lines architecture contains ${forbidden}`)
assert.equal(battleMain.includes("next.set('point'"),false,'Battle Lines emits legacy point state')
assert.ok(battleLink.includes("params.get('point')"),'legacy point reader was removed')
assert.ok(battleLink.includes('export function canonicalBattleLinesTime'),'canonical selected-time helper missing')

const browser=read('apps/web/scripts/quality-u10g-architecture-browser.mjs')
for (const fragment of ["schema: 'viewloom-quality-u10g-architecture-browser-v1'","for (const provider of ['twitch', 'kick'])","await auditDayFlow(provider, 1440, 'desktop-layout')","await auditDayFlow(provider, 390, 'mobile-fallback')","await auditBattle(provider, 1440, 'direct-time')","await auditBattle(provider, 390, 'legacy-point')",'assert.equal(evidence.scenarios.length, 8)',"installValueReplacementTrap(globalThis, 'fetch', replacementStatus, 'fetchReplaced')","installValueReplacementTrap(Object.getPrototypeOf(history), 'replaceState', replacementStatus, 'replaceStateReplaced')","installValueReplacementTrap(URLSearchParams.prototype, 'get', replacementStatus, 'urlGetReplaced')",'fetchSame: native.fetchReplaced === false','replaceStateSame: native.replaceStateReplaced === false','urlGetSame: native.urlGetReplaced === false']) assert.ok(browser.includes(fragment),`U10G browser contract missing ${fragment}`)

const workflow=read('.github/workflows/quality-u10g-architecture.yml')
for (const fragment of ['name: Quality U10G Architecture','Verify U10G repository contract','Run U10G browser acceptance','Verify U10G browser evidence','cancel-in-progress: true']) assert.ok(workflow.includes(fragment),`U10G workflow missing ${fragment}`)

console.log('U10G architecture repository verification passed.')
console.log('- one Day Flow controller remains authoritative per provider route')
console.log('- Twitch hidden category bootstrap serializes preview setup before that controller only when explicitly requested')
console.log('- default/public Day Flow remains covered by no-global-replacement browser evidence')
console.log('- Battle Lines architecture and provider separation retained')
