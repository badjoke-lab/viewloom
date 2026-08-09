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
for (const fragment of [
  'Status: complete',
  'work-quality-u10g-architecture',
  'work-quality-u10h-acceptance',
  'Merged PR: #470',
  'Day Flow has one request/state/controller owner per provider route.',
  'Battle Lines has one request/state/controller owner per provider route.',
  'No feature coordination code replaces `window.fetch`, `history.replaceState`, or `URLSearchParams.prototype.get`.',
  'Post-U10G authorized Twitch Day Flow category boundary',
  'only the Twitch Day Flow bootstrap may load `day-flow-category-preview-entry.ts` before the shared Day Flow controller',
  '`URLSearchParams.prototype.get` must never be replaced',
  'This is a scoped compatibility boundary for the already-authorized public Twitch Category filter, not a general relaxation of U10G.',
]) assert.ok(note.includes(fragment),`U10G note missing ${fragment}`)

const twitchHtml=read('apps/web/twitch/day-flow/index.html')
const kickHtml=read('apps/web/kick/day-flow/index.html')
assert.equal((twitchHtml.match(/day-flow-twitch-entry\.ts/g)??[]).length,1,'Twitch Day Flow must have one provider bootstrap entry')
assert.equal((twitchHtml.match(/day-flow-current-shell-entry\.ts/g)??[]).length,0,'Twitch HTML must not race the controller beside its bootstrap')
assert.equal((kickHtml.match(/day-flow-current-shell-entry\.ts/g)??[]).length,1,'Kick Day Flow primary entry count changed')
assert.equal(kickHtml.includes('day-flow-twitch-entry.ts'),false,'Kick must not load Twitch Day Flow bootstrap')
for (const html of [twitchHtml,kickHtml]) assert.equal(html.includes('day-flow-layout-summary.ts'),false,'secondary Day Flow entry remains')

const twitchEntry=read('apps/web/src/live/day-flow-twitch-entry.ts')
const categoryBoundary=read('apps/web/src/live/day-flow-category-preview-entry.ts')
const categoryImport="import './day-flow-category-preview-entry'"
const controllerImport="void import('./day-flow-current-shell-entry')"
assert.ok(twitchEntry.includes(categoryImport),'Twitch bootstrap missing public category boundary')
assert.ok(twitchEntry.includes(controllerImport),'Twitch bootstrap missing single Day Flow controller')
assert.ok(twitchEntry.indexOf(categoryImport)<twitchEntry.indexOf(controllerImport),'public category boundary must initialize before controller hydration')
for (const fragment of [
  "const enabled = provider === 'twitch'",
  "root.dataset.dayflowCategoryPreview = 'public'",
  "filter.implementationState !== 'public'",
  'filter.publicExposureAuthorized !== true',
  'window.fetch =',
  'window.history.replaceState =',
  "requestUrl.origin !== window.location.origin || requestUrl.pathname !== '/api/day-flow'",
  'if (next.pathname === window.location.pathname)',
  'requestUrl.searchParams.set(CATEGORY_PARAM, selectedCategory)',
  'next.searchParams.set(CATEGORY_PARAM, selectedCategory)',
  'if (publicInteractionSeen) next.searchParams.delete(PREVIEW_PARAM)',
]) assert.ok(categoryBoundary.includes(fragment),`public Twitch category boundary missing ${fragment}`)
assert.equal(categoryBoundary.includes("initialUrl.searchParams.get(PREVIEW_PARAM) === '1'"),false,'public category boundary must not require categoryPreview=1')
assert.equal(categoryBoundary.includes('URLSearchParams.prototype.get ='),false,'public category boundary must not replace URLSearchParams.prototype.get')

const dayMain=read('apps/web/src/live/day-flow-current-shell-entry.ts')
const dayHelper=read('apps/web/src/live/day-flow-layout-summary.ts')
for (const fragment of ["from './day-flow-layout-summary'",'layout: DayFlowLayoutMode','renderEnhancedDayFlowSummary(target, payload)','applyDayFlowLayout(state.layout)',"if (state.layoutInUrl) params.set('layout', state.layout)"]) assert.ok(dayMain.includes(fragment),`Day Flow primary owner missing ${fragment}`)
assert.equal((dayMain.match(/fetch\(`/g)??[]).length,1,'Day Flow must have one feature request call owner')
for (const forbidden of ['new MutationObserver','window.fetch =','window.history.replaceState =','URLSearchParams.prototype.get =']) { assert.equal(dayMain.includes(forbidden),false,`Day Flow primary owner contains ${forbidden}`); assert.equal(dayHelper.includes(forbidden),false,`Day Flow helper contains ${forbidden}`) }
for (const forbidden of ['fetch(','setInterval(','addEventListener(']) assert.equal(dayHelper.includes(forbidden),false,`Day Flow helper owns runtime state: ${forbidden}`)

// PR #758 authorizes exactly one bounded provider-specific compatibility layer:
// Twitch Day Flow may wrap fetch/history before the shared controller hydrates.
// The browser gate must prove that the wrapper appears only on Twitch Day Flow,
// issues one provider-correct request, preserves URLSearchParams.get identity,
// and leaves Kick/Battle Lines on native browser identities.
for (const forbidden of ['URLSearchParams.prototype.get =','/api/kick-day-flow','/api/battle-lines','/api/kick-battle-lines']) assert.equal(categoryBoundary.includes(forbidden),false,`public Twitch category boundary exceeds scope: ${forbidden}`)

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
for (const fragment of [
  "schema: 'viewloom-quality-u10g-architecture-browser-v2'",
  "for (const provider of ['twitch', 'kick'])",
  "await auditDayFlow(provider, 1440, 'desktop-layout')",
  "await auditDayFlow(provider, 390, 'mobile-fallback')",
  "await auditBattle(provider, 1440, 'direct-time')",
  "await auditBattle(provider, 390, 'legacy-point')",
  'assert.equal(evidence.scenarios.length, 8)',
  "const expectsCategoryBoundary = provider === 'twitch'",
  "installValueReplacementTrap(globalThis, 'fetch', replacementStatus, 'fetchReplaced')",
  "installValueReplacementTrap(Object.getPrototypeOf(history), 'replaceState', replacementStatus, 'replaceStateReplaced')",
  "installValueReplacementTrap(URLSearchParams.prototype, 'get', replacementStatus, 'urlGetReplaced')",
  'categoryControlPublic:',
  'categoryParam:',
]) assert.ok(browser.includes(fragment),`U10G browser contract missing ${fragment}`)

const workflow=read('.github/workflows/quality-u10g-architecture.yml')
for (const fragment of ['name: Quality U10G Architecture','Verify U10G repository contract','Run U10G browser acceptance','Verify U10G browser evidence','cancel-in-progress: true']) assert.ok(workflow.includes(fragment),`U10G workflow missing ${fragment}`)

console.log('U10G architecture repository verification passed.')
console.log('- one Day Flow controller remains authoritative per provider route')
console.log('- Twitch public category boundary is explicitly scoped to same-origin Day Flow fetch/history coordination')
console.log('- Kick Day Flow and both Battle Lines routes retain native browser identities')
console.log('- URLSearchParams.prototype.get remains native on every route')
console.log('- Battle Lines architecture and provider separation retained')
