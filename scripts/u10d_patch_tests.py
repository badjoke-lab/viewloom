from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def write(path: str, content: str) -> None:
    target = ROOT / path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(content, encoding="utf-8")


write("apps/web/scripts/quality-u10d-analysis-coherence-browser.mjs", r"""import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { chromium } from 'playwright'

const base = process.env.QUALITY_U10D_BASE_URL ?? 'http://127.0.0.1:4173'
const out = resolve(process.env.QUALITY_U10D_ARTIFACT_DIR ?? 'artifacts/quality-u10d')
const widths = [1440, 820, 390, 360]
const providers = ['twitch', 'kick']
mkdirSync(out, { recursive: true })

const evidence = {
  schema: 'viewloom-quality-u10d-analysis-coherence-v1',
  phase: 'U10D',
  candidateHead: process.env.GITHUB_HEAD_SHA ?? process.env.GITHUB_SHA ?? null,
  result: 'running',
  checkpoint: 'start',
  scenarios: [],
}

const browser = await chromium.launch({ headless: true })
try {
  for (const provider of providers) {
    for (const width of widths) await auditDayFlowDefault(provider, width)
    await auditDayFlowUrlSplit(provider)
    await auditDayFlowStoredSplit(provider)
    for (const width of widths) await auditBattleCoherence(provider, width)
  }
  assert.equal(evidence.scenarios.length, 20)
  evidence.result = 'pass'
  evidence.checkpoint = 'complete'
} catch (error) {
  evidence.result = 'fail'
  evidence.checkpoint = 'error'
  evidence.error = error instanceof Error ? error.stack ?? error.message : String(error)
  throw error
} finally {
  writeFileSync(resolve(out, 'quality-u10d-analysis-coherence.json'), `${JSON.stringify(evidence, null, 2)}\n`)
  await browser.close()
}

async function auditDayFlowDefault(provider, width) {
  const { context, requests, crossRequests } = await dayFlowContext(provider, width)
  const page = await context.newPage()
  await page.goto(`${base}/${provider}/day-flow/`, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('[data-dayflow-layout-shell][data-dayflow-layout-current="wide"]')
  await page.waitForSelector('.dayflow-summary-overview')
  const initial = await dayFlowSnapshot(page)
  assert.equal(initial.current, 'wide', `${provider} ${width}: clean default is not Wide`)
  assert.equal(initial.requested, 'wide', `${provider} ${width}: clean requested layout is not Wide`)
  assert.equal(initial.shellWide, true, `${provider} ${width}: Wide class missing`)
  assert.equal(initial.shellSplit, false, `${provider} ${width}: Split class remained`)
  assert.equal(initial.widePressed, 'true', `${provider} ${width}: Wide control is not pressed`)
  assert.equal(initial.splitPressed, 'false', `${provider} ${width}: Split control is pressed`)
  assert.equal(initial.urlLayout, 'wide', `${provider} ${width}: URL did not normalize to Wide`)
  assert.equal(initial.storedLayout, null, `${provider} ${width}: default visit wrote a storage preference`)

  let actionRefetched = false
  if (width === 1440) {
    const before = requests.value
    await page.locator('[data-dayflow-layout="split"]').click()
    await page.waitForSelector('[data-dayflow-layout-shell][data-dayflow-layout-current="split"]')
    await page.waitForTimeout(50)
    assert.equal(requests.value, before, `${provider}: Split layout refetched Day Flow`)
    await page.locator('[data-dayflow-layout="wide"]').click()
    await page.waitForSelector('[data-dayflow-layout-shell][data-dayflow-layout-current="wide"]')
    await page.waitForTimeout(50)
    assert.equal(requests.value, before, `${provider}: Wide layout refetched Day Flow`)
    actionRefetched = requests.value !== before
  }
  assert.equal(crossRequests.value, 0, `${provider}: Day Flow crossed provider endpoint`)
  evidence.scenarios.push({
    id: `${provider}-day-flow-default-${width}`,
    feature: 'day-flow', provider, width, mode: 'clean-default',
    requests: requests.value, crossRequests: crossRequests.value, actionRefetched, initial,
  })
  if (width === 1440 || width === 390) await page.screenshot({ path: resolve(out, `${provider}-day-flow-default-${width}.png`), fullPage: true })
  await context.close()
}

async function auditDayFlowUrlSplit(provider) {
  const { context, requests, crossRequests } = await dayFlowContext(provider, 1440)
  const page = await context.newPage()
  await page.goto(`${base}/${provider}/day-flow/?layout=split`, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('[data-dayflow-layout-shell][data-dayflow-layout-current="split"]')
  await page.waitForSelector('.dayflow-summary-overview')
  const snapshot = await dayFlowSnapshot(page)
  assert.equal(snapshot.current, 'split')
  assert.equal(snapshot.requested, 'split')
  assert.equal(snapshot.splitPressed, 'true')
  assert.equal(snapshot.widePressed, 'false')
  assert.equal(snapshot.urlLayout, 'split')
  assert.equal(snapshot.storedLayout, null)
  assert.equal(crossRequests.value, 0)
  evidence.scenarios.push({ id: `${provider}-day-flow-url-split-1440`, feature: 'day-flow', provider, width: 1440, mode: 'url-split', requests: requests.value, crossRequests: crossRequests.value, actionRefetched: false, snapshot })
  await context.close()
}

async function auditDayFlowStoredSplit(provider) {
  const { context, requests, crossRequests } = await dayFlowContext(provider, 1440)
  const key = `viewloom:${provider}:dayflow-layout`
  await context.addInitScript(({ storageKey }) => localStorage.setItem(storageKey, 'split'), { storageKey: key })
  const page = await context.newPage()
  await page.goto(`${base}/${provider}/day-flow/`, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('[data-dayflow-layout-shell][data-dayflow-layout-current="split"]')
  await page.waitForSelector('.dayflow-summary-overview')
  const snapshot = await dayFlowSnapshot(page)
  assert.equal(snapshot.current, 'split')
  assert.equal(snapshot.requested, 'split')
  assert.equal(snapshot.splitPressed, 'true')
  assert.equal(snapshot.urlLayout, 'split')
  assert.equal(snapshot.storedLayout, 'split')
  assert.equal(crossRequests.value, 0)
  evidence.scenarios.push({ id: `${provider}-day-flow-stored-split-1440`, feature: 'day-flow', provider, width: 1440, mode: 'stored-split', requests: requests.value, crossRequests: crossRequests.value, actionRefetched: false, snapshot })
  await context.close()
}

async function auditBattleCoherence(provider, width) {
  const context = await browser.newContext({ viewport: { width, height: 1000 } })
  await installFixedDate(context)
  const requests = { value: 0 }
  const crossRequests = { value: 0 }
  await context.route('**/api/kick-battle-lines*', (route) => {
    if (provider === 'kick') { requests.value += 1; return replyJson(route, battlePayload('kick')) }
    crossRequests.value += 1
    return route.abort()
  })
  await context.route('**/api/battle-lines*', (route) => {
    if (provider === 'twitch') { requests.value += 1; return replyJson(route, battlePayload('twitch')) }
    crossRequests.value += 1
    return route.abort()
  })
  await quietThirdParties(context)
  const page = await context.newPage()
  await page.goto(`${base}/${provider}/battle-lines/`, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('[data-battle-chart]')
  await page.waitForFunction(() => document.querySelector('[data-battle-primary] h2')?.textContent?.includes('Gamma'))

  const initial = await battleSnapshot(page)
  assert.equal(initial.primaryPair, 'Alpha vs Gamma', `${provider} ${width}: initial pair did not use recommendedBattle`)
  assert.equal(initial.inspectorPair, 'Alpha vs Gamma', `${provider} ${width}: inspector did not use recommendedBattle`)
  assert.equal(initial.kicker, 'RECOMMENDED BATTLE')
  assert.equal(initial.owner, 'recommendedBattle')
  assert.deepEqual(initial.primaryLineIds, ['alpha', 'gamma'])
  assert.equal(initial.primaryTime, initial.inspectorTime)
  assert.equal(initial.chartTime, '2026-06-29T00:10:00.000Z')
  assert.equal(initial.chartIndex, '2')
  assert.equal(initial.cursorTime, '00:10 UTC')
  assert.equal(initial.battleParam, null)
  assert.equal(initial.timeParam, null)
  assert.equal(initial.recommendedDisabled, true)

  const beforeActions = requests.value
  await page.locator('[data-battle-select="alpha:beta"]').click()
  await page.waitForFunction(() => document.querySelector('[data-battle-primary]')?.getAttribute('data-battle-selected-battle-id') === 'alpha:beta')
  const selected = await battleSnapshot(page)
  assert.equal(selected.primaryPair, 'Alpha vs Beta')
  assert.equal(selected.inspectorPair, 'Alpha vs Beta')
  assert.equal(selected.kicker, 'SELECTED BATTLE')
  assert.equal(selected.battleParam, 'alpha:beta')
  assert.equal(selected.recommendedDisabled, false)
  assert.equal(requests.value, beforeActions, `${provider} ${width}: selecting a pair refetched Battle Lines`)

  await page.locator('[data-battle-recommended]').click()
  await page.waitForFunction(() => document.querySelector('[data-battle-primary]')?.getAttribute('data-battle-selected-battle-id') === 'alpha:gamma')
  const restored = await battleSnapshot(page)
  assert.equal(restored.primaryPair, 'Alpha vs Gamma')
  assert.equal(restored.kicker, 'RECOMMENDED BATTLE')
  assert.equal(restored.battleParam, null)
  assert.equal(restored.recommendedDisabled, true)
  assert.equal(requests.value, beforeActions, `${provider} ${width}: Back to recommended refetched Battle Lines`)

  await page.locator('[data-battle-chart]').focus()
  await page.keyboard.press('ArrowLeft')
  await page.waitForFunction(() => new URLSearchParams(location.search).get('time') === '2026-06-29T00:05:00.000Z')
  const moved = await battleSnapshot(page)
  assert.equal(moved.primaryPair, 'Alpha vs Gamma')
  assert.equal(moved.primaryTime, moved.inspectorTime)
  assert.equal(moved.chartTime, '2026-06-29T00:05:00.000Z')
  assert.equal(moved.inspectorDataTime, '2026-06-29T00:05:00.000Z')
  assert.equal(moved.chartIndex, '1')
  assert.equal(moved.inspectorIndex, '1')
  assert.equal(moved.cursorTime, '00:05 UTC')
  assert.equal(moved.timeParam, '2026-06-29T00:05:00.000Z')
  assert.equal(moved.legacyPoint, '1')
  assert.equal(requests.value, beforeActions, `${provider} ${width}: selected-time inspection refetched Battle Lines`)
  assert.equal(crossRequests.value, 0, `${provider} ${width}: Battle Lines crossed provider endpoint`)

  evidence.scenarios.push({
    id: `${provider}-battle-analysis-${width}`,
    feature: 'battle-lines', provider, width, mode: 'recommended-and-selected-time',
    requests: requests.value, crossRequests: crossRequests.value,
    actionRefetched: requests.value !== beforeActions,
    initial, selected, restored, moved,
  })
  if (width === 1440 || width === 390) await page.screenshot({ path: resolve(out, `${provider}-battle-analysis-${width}.png`), fullPage: true })
  await context.close()
}

async function dayFlowContext(provider, width) {
  const context = await browser.newContext({ viewport: { width, height: 1000 } })
  await installFixedDate(context)
  const requests = { value: 0 }
  const crossRequests = { value: 0 }
  await context.route('**/api/kick-day-flow*', (route) => {
    if (provider === 'kick') { requests.value += 1; return replyJson(route, dayFlowPayload('kick')) }
    crossRequests.value += 1
    return route.abort()
  })
  await context.route('**/api/day-flow*', (route) => {
    if (provider === 'twitch') { requests.value += 1; return replyJson(route, dayFlowPayload('twitch')) }
    crossRequests.value += 1
    return route.abort()
  })
  await quietThirdParties(context)
  return { context, requests, crossRequests }
}

async function dayFlowSnapshot(page) {
  return page.evaluate(() => {
    const shell = document.querySelector('[data-dayflow-layout-shell]')
    const split = document.querySelector('[data-dayflow-layout="split"]')
    const wide = document.querySelector('[data-dayflow-layout="wide"]')
    const provider = document.body.dataset.provider === 'kick' ? 'kick' : 'twitch'
    return {
      current: shell?.getAttribute('data-dayflow-layout-current'),
      requested: shell?.getAttribute('data-dayflow-layout-requested'),
      shellWide: shell?.classList.contains('is-wide') ?? false,
      shellSplit: shell?.classList.contains('is-split') ?? false,
      splitPressed: split?.getAttribute('aria-pressed'),
      widePressed: wide?.getAttribute('aria-pressed'),
      urlLayout: new URLSearchParams(location.search).get('layout'),
      storedLayout: localStorage.getItem(`viewloom:${provider}:dayflow-layout`),
    }
  })
}

async function battleSnapshot(page) {
  return page.evaluate(() => {
    const normalize = (value) => (value ?? '').replace(/\s+/g, ' ').trim()
    const primary = document.querySelector('[data-battle-primary]')
    const chart = document.querySelector('[data-battle-chart]')
    const inspector = document.querySelector('[data-battle-inspector]')
    const params = new URLSearchParams(location.search)
    return {
      primaryPair: normalize(primary?.querySelector('h2')?.textContent),
      inspectorPair: normalize(inspector?.querySelector('.pair-inspector__result strong')?.textContent),
      kicker: normalize(primary?.querySelector('.kicker')?.textContent),
      owner: primary?.getAttribute('data-battle-recommendation-owner'),
      selectedBattleId: primary?.getAttribute('data-battle-selected-battle-id'),
      primaryTime: normalize(primary?.querySelector('.battle-primary__identity p')?.textContent).replace(/^Selected time/i, '').trim(),
      inspectorTime: normalize(inspector?.querySelector('.inspector-head h2')?.textContent),
      chartIndex: chart?.getAttribute('data-battle-selected-index'),
      chartTime: chart?.getAttribute('data-battle-selected-time'),
      inspectorIndex: inspector?.getAttribute('data-battle-selected-index'),
      inspectorDataTime: inspector?.getAttribute('data-battle-selected-time'),
      cursorTime: normalize(chart?.querySelector('.battle-cursor text')?.textContent),
      primaryLineIds: [...document.querySelectorAll('.battle-line--primary[data-line-id]')].map((node) => node.getAttribute('data-line-id')).filter(Boolean).sort(),
      battleParam: params.get('battle'),
      timeParam: params.get('time'),
      legacyPoint: params.get('point'),
      recommendedDisabled: document.querySelector('[data-battle-recommended]')?.disabled ?? null,
      rawSearch: location.search,
    }
  })
}

async function installFixedDate(context) {
  await context.addInitScript(({ now }) => {
    const RealDate = Date
    class FixedDate extends RealDate {
      constructor(...args) { super(...(args.length ? args : [now])) }
      static now() { return new RealDate(now).getTime() }
    }
    globalThis.Date = FixedDate
  }, { now: '2026-06-29T00:20:00.000Z' })
}

async function quietThirdParties(context) {
  await context.route('**/googletagmanager.com/**', (route) => route.abort())
  await context.route('**/google-analytics.com/**', (route) => route.abort())
}

async function replyJson(route, value) {
  await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(value) })
}

function dayFlowPayload(platform) {
  const buckets = ['2026-06-29T00:00:00.000Z', '2026-06-29T00:05:00.000Z', '2026-06-29T00:10:00.000Z']
  const alpha = dayFlowBand('alpha', 'Alpha', [120, 150, 140], [0.4, 0.5, 0.47])
  const beta = dayFlowBand('beta', 'Beta', [100, 90, 110], [0.33, 0.3, 0.37])
  const others = { ...dayFlowBand('others', 'Others', [80, 60, 50], [0.27, 0.2, 0.16]), isOthers: true }
  return {
    source: 'real', platform, state: 'complete', status: 'ok',
    lastUpdated: buckets.at(-1), updatedAt: buckets.at(-1), coverageNote: 'Deterministic U10D fixture.',
    selectedDate: '2026-06-29', bucketSize: 5, topN: 20, valueMode: 'volume', rangeMode: 'today',
    windowStart: buckets[0], windowEnd: buckets.at(-1), isRolling: false, buckets,
    totalViewersByBucket: [300, 300, 300], bands: [alpha, beta, others],
    summary: { peakLeader: 'Alpha', longestDominance: 'Alpha', biggestRise: 'Alpha', highestActivity: null },
    detailPanelSource: { defaultStreamerId: 'alpha', streamers: [alpha, beta] },
    activity: { available: false, note: 'Activity unavailable.' },
  }
}

function dayFlowBand(streamerId, name, viewers, shares) {
  return {
    streamerId, name, title: `${name} stream`,
    totalViewerMinutes: viewers.reduce((sum, value) => sum + value * 5, 0),
    viewerMinutes: viewers.reduce((sum, value) => sum + value * 5, 0),
    peakViewers: Math.max(...viewers), avgViewers: viewers.reduce((sum, value) => sum + value, 0) / viewers.length,
    peakShare: Math.max(...shares), biggestRiseBucket: '2026-06-29T00:05:00.000Z', biggestRiseTime: '2026-06-29T00:05:00.000Z', biggestRiseValue: 30,
    firstSeen: '2026-06-29T00:00:00.000Z', lastSeen: '2026-06-29T00:10:00.000Z',
    buckets: viewers.map((value, index) => ({ viewers: value, share: shares[index], activityAvailable: false })),
  }
}

function battlePayload(platform) {
  const timeline = ['2026-06-29T00:00:00.000Z', '2026-06-29T00:05:00.000Z', '2026-06-29T00:10:00.000Z']
  const lines = [
    battleLine('alpha', 'Alpha', [100, 130, 150], timeline),
    battleLine('beta', 'Beta', [90, 120, 140], timeline),
    battleLine('gamma', 'Gamma', [80, 145, 160], timeline),
  ]
  const primaryBattle = battle('alpha:beta', 'alpha', 'beta', 'Alpha', 'Beta', 71, 10)
  const recommendedBattle = battle('alpha:gamma', 'alpha', 'gamma', 'Alpha', 'Gamma', 92, 10)
  return {
    platform, state: 'complete', status: 'ok', source: 'real', updatedAt: timeline.at(-1), generatedAt: timeline.at(-1),
    top: 5, requestedBucket: '5m', bucket: '5m', metric: 'viewers', valueMode: 'viewers',
    metricNote: 'Observed viewers.', granularityNote: '5 minute deterministic fixture.', timeline,
    coverage: { expectedBuckets: 3, observedBuckets: 3, missingBuckets: 0, missingRatio: 0 },
    window: { mode: 'today', selectedDate: '2026-06-29', from: timeline[0], to: timeline.at(-1), isLive: true },
    lines, primaryBattle, recommendedBattle, secondaryBattles: [primaryBattle], battles: [primaryBattle, recommendedBattle], events: [], reversals: [], feed: [],
  }
}

function battleLine(id, name, viewers, timeline) {
  return {
    id, streamerId: id, name, displayName: name, title: `${name} stream`,
    peakViewers: Math.max(...viewers), latestViewers: viewers.at(-1), latestValue: viewers.at(-1),
    viewerMinutes: viewers.reduce((sum, value) => sum + value * 5, 0),
    points: viewers.map((value, index) => ({ bucket: timeline[index], time: timeline[index], viewers: value, value, state: 'observed' })),
  }
}

function battle(id, streamerAId, streamerBId, streamerAName, streamerBName, score, currentGap) {
  return {
    id, pair: [streamerAId, streamerBId], streamerAId, streamerBId, streamerAName, streamerBName,
    score, overlapCount: 3, longestRun: 3, reversalCount: 0, recentOverlap: 3, missingPenalty: 0,
    currentIndex: 2, currentBucket: '2026-06-29T00:10:00.000Z', currentLeaderId: streamerBId,
    currentLeaderName: streamerBName, currentGap, previousGap: currentGap, gapTrend: 'steady', latestReversalAt: null,
  }
}

console.log('U10D analysis coherence browser acceptance passed.')
""")

write("scripts/verify-quality-u10d-browser-evidence.mjs", """import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const path = process.env.QUALITY_U10D_EVIDENCE ?? '/tmp/quality-u10d/quality-u10d-analysis-coherence.json'
const evidence = JSON.parse(readFileSync(path, 'utf8'))
assert.equal(evidence.schema, 'viewloom-quality-u10d-analysis-coherence-v1')
assert.equal(evidence.phase, 'U10D')
assert.equal(evidence.result, 'pass')
assert.equal(evidence.checkpoint, 'complete')
assert.equal(evidence.scenarios.length, 20)
assert.equal(evidence.scenarios.filter((item) => item.feature === 'day-flow').length, 12)
assert.equal(evidence.scenarios.filter((item) => item.feature === 'battle-lines').length, 8)
for (const provider of ['twitch', 'kick']) {
  for (const width of [1440, 820, 390, 360]) {
    assert.ok(evidence.scenarios.some((item) => item.id === `${provider}-day-flow-default-${width}`))
    assert.ok(evidence.scenarios.some((item) => item.id === `${provider}-battle-analysis-${width}`))
  }
  assert.ok(evidence.scenarios.some((item) => item.id === `${provider}-day-flow-url-split-1440`))
  assert.ok(evidence.scenarios.some((item) => item.id === `${provider}-day-flow-stored-split-1440`))
}
for (const item of evidence.scenarios) {
  assert.equal(item.crossRequests, 0, `${item.id}: crossed provider request`)
  assert.equal(item.actionRefetched, false, `${item.id}: local analysis action refetched data`)
  assert.ok(item.requests >= 1, `${item.id}: expected provider request was not observed`)
}
console.log('U10D browser evidence verification passed.')
console.log('- 20 provider-separated scenarios passed')
console.log('- layout, recommendation, and selected-time actions did not refetch')
""")

write("scripts/verify-quality-u10d-analysis-coherence.mjs", """import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const read = (path) => readFileSync(join(root, path), 'utf8')
const required = [
  'docs/work-in-progress/u10d-analysis-coherence.md',
  'apps/web/twitch/day-flow/index.html', 'apps/web/kick/day-flow/index.html',
  'apps/web/src/live/day-flow-layout-summary.ts',
  'apps/web/src/live/battle-lines-current-shell-entry.ts',
  'apps/web/functions/_lib/battle-lines-core.ts',
  'apps/web/scripts/quality-u10d-analysis-coherence-browser.mjs',
  'scripts/verify-quality-u10d-analysis-coherence.mjs',
  'scripts/verify-quality-u10d-browser-evidence.mjs',
  '.github/workflows/quality-u10d-analysis-coherence.yml',
]
for (const path of required) assert.equal(existsSync(join(root, path)), true, `missing file: ${path}`)
for (const path of ['scripts/u10d_patch_runtime.py', 'scripts/u10d_patch_tests.py', 'scripts/u10d_patch_docs.py', '.github/workflows/u10d-bootstrap.yml']) {
  assert.equal(existsSync(join(root, path)), false, `temporary U10D bootstrap remains: ${path}`)
}

for (const path of ['apps/web/twitch/day-flow/index.html', 'apps/web/kick/day-flow/index.html']) {
  const html = read(path)
  assert.ok(html.includes('class="dayflow-layout-shell is-wide" data-dayflow-layout-shell data-dayflow-layout-current="wide"'))
  assert.ok(html.includes('<button data-dayflow-layout="split" aria-pressed="false">Split</button><button class="active" data-dayflow-layout="wide" aria-pressed="true">Wide</button>'))
  assert.equal(html.includes("window.localStorage.setItem(key, 'wide')"), false)
  assert.equal(html.includes('const key = \'viewloom:'), false)
}
const dayFlow = read('apps/web/src/live/day-flow-layout-summary.ts')
assert.ok(dayFlow.includes("return 'wide'\n}\n\nfunction applyLayout"))
assert.ok(dayFlow.includes('shell.dataset.dayflowLayoutRequested = requestedLayout'))

const battle = read('apps/web/src/live/battle-lines-current-shell-entry.ts')
for (const fragment of [
  'function recommendedBattleFor(data: Payload): Battle | null',
  'data.recommendedBattle ?? data.primaryBattle ?? data.battles[0] ?? null',
  'const recommended = payload ? recommendedBattleFor(payload) : null',
  'state.selectedBattleId = recommended?.id ?? null',
  "battle.id === recommendedBattleFor(data)?.id && !state.manualBattle",
  "target.dataset.battleRecommendationOwner = data.recommendedBattle ? 'recommendedBattle'",
  'data-battle-selected-index="${selectedIndex}"',
  'target.dataset.battleSelectedTime = data.timeline[index] ??',
  'state.manualBattle = state.selectedBattleId !== recommendedBattleFor(data)?.id',
]) assert.ok(battle.includes(fragment), `Battle Lines missing ${fragment}`)
for (const forbidden of [
  'state.selectedBattleId = payload.primaryBattle.id',
  'state.selectedBattleId = next.primaryBattle?.id ?? null',
  'battle.id === data.primaryBattle?.id && !state.manualBattle',
  'state.manualBattle = state.selectedBattleId !== data.primaryBattle?.id',
]) assert.equal(battle.includes(forbidden), false, `stale recommendation owner remains: ${forbidden}`)
assert.equal(battle.includes('window.fetch ='), false)
assert.equal(battle.includes('new MutationObserver'), false)

const core = read('apps/web/functions/_lib/battle-lines-core.ts')
assert.ok(core.includes('recommendedBattle: primaryBattle'))
assert.ok(core.includes('primaryBattle,'))

const note = read('docs/work-in-progress/u10d-analysis-coherence.md')
for (const fragment of ['Status: active', 'work-quality-u10d-analysis-coherence', 'work-quality-u10e-responsive', 'API change authorized: no', 'Provider combination authorized: no']) assert.ok(note.includes(fragment))
for (const [path, fragment] of [
  ['README.md', 'Phase 10 U10D analysis coherence'],
  ['docs/README.md', 'Phase 10 U10D analysis coherence'],
  ['AGENTS.md', 'Active implementation branch: work-quality-u10d-analysis-coherence'],
  ['CONTRIBUTING.md', 'Active implementation branch: work-quality-u10d-analysis-coherence'],
  ['docs/product/current-roadmap.md', 'Phase 10 U10D analysis coherence active'],
  ['docs/product/current-schedule.md', 'U10D analysis coherence active'],
  ['docs/product/post-watchlist-program-plan.md', 'Current phase: Phase 10 — U10D analysis coherence'],
  ['docs/product/cross-site-quality-remediation-plan.md', 'Current branch: `work-quality-u10d-analysis-coherence`'],
]) assert.ok(read(path).includes(fragment), `${path}: active U10D state missing`)

const workflow = read('.github/workflows/quality-u10d-analysis-coherence.yml')
for (const fragment of ['name: Quality U10D Analysis Coherence', 'Run U10D browser acceptance', 'Verify U10D browser evidence', 'cancel-in-progress: true']) assert.ok(workflow.includes(fragment))

console.log('U10D analysis coherence repository verification passed.')
console.log('- Day Flow has one authored default layout owner')
console.log('- Battle Lines uses recommendedBattle as the UI recommendation owner')
console.log('- selected-time ownership and provider separation are protected')
""")

write(".github/workflows/quality-u10d-analysis-coherence.yml", """name: Quality U10D Analysis Coherence

on:
  workflow_dispatch:
  pull_request:
    paths:
      - 'README.md'
      - 'AGENTS.md'
      - 'CONTRIBUTING.md'
      - 'docs/README.md'
      - 'docs/work-in-progress/u10d-analysis-coherence.md'
      - 'docs/product/current-roadmap.md'
      - 'docs/product/current-schedule.md'
      - 'docs/product/post-watchlist-program-plan.md'
      - 'docs/product/cross-site-quality-remediation-plan.md'
      - 'apps/web/twitch/day-flow/index.html'
      - 'apps/web/kick/day-flow/index.html'
      - 'apps/web/src/live/day-flow-layout-summary.ts'
      - 'apps/web/src/live/battle-lines-current-shell-entry.ts'
      - 'apps/web/scripts/quality-u10d-analysis-coherence-browser.mjs'
      - 'scripts/verify-quality-u10d-analysis-coherence.mjs'
      - 'scripts/verify-quality-u10d-browser-evidence.mjs'
      - 'scripts/verify-quality-u10a-baseline.mjs'
      - 'scripts/verify-development-policy.mjs'
      - '.github/workflows/quality-u10a-baseline.yml'
      - '.github/workflows/quality-u10d-analysis-coherence.yml'

concurrency:
  group: ${{ github.workflow }}-${{ github.event.pull_request.number || github.ref }}
  cancel-in-progress: true

jobs:
  coherence:
    runs-on: ubuntu-latest
    timeout-minutes: 60
    env:
      QUALITY_U10D_BASE_URL: http://127.0.0.1:4173
      QUALITY_U10D_ARTIFACT_DIR: /tmp/quality-u10d
      GITHUB_HEAD_SHA: ${{ github.event.pull_request.head.sha || github.sha }}
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 10.17.1
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 22
      - name: Install dependencies
        run: pnpm install --no-frozen-lockfile
      - name: Verify development policy
        run: node scripts/verify-development-policy.mjs
      - name: Verify U10D repository contract
        run: node scripts/verify-quality-u10d-analysis-coherence.mjs
      - name: Verify retained U10C visualization
        run: node scripts/verify-quality-u10c-visualization.mjs
      - name: Verify retained U10B shell
        run: node scripts/verify-quality-u10b-shell.mjs
      - name: Verify retained U10A evidence
        run: node scripts/verify-quality-u10a-baseline.mjs
      - name: Verify retained History acceptance
        run: node scripts/verify-history-ui-h7-acceptance.mjs
      - name: Verify Battle Lines contracts
        run: |
          pnpm --filter @viewloom/web verify:battle-lines
          pnpm --filter @viewloom/web verify:battle-lines-ui
      - name: Verify Watchlist contracts
        run: pnpm --filter @viewloom/web verify:watchlist-contracts
      - name: Typecheck web application
        run: pnpm --filter @viewloom/web typecheck:app
      - name: Build web application
        run: pnpm build:web
      - name: Start local preview
        run: |
          pnpm --filter @viewloom/web preview --host 127.0.0.1 --port 4173 > /tmp/quality-u10d-preview.log 2>&1 &
          for attempt in {1..60}; do
            curl --silent --fail http://127.0.0.1:4173/twitch/day-flow/ > /dev/null \
              && curl --silent --fail http://127.0.0.1:4173/kick/day-flow/ > /dev/null \
              && curl --silent --fail http://127.0.0.1:4173/twitch/battle-lines/ > /dev/null \
              && curl --silent --fail http://127.0.0.1:4173/kick/battle-lines/ > /dev/null \
              && exit 0
            sleep 1
          done
          cat /tmp/quality-u10d-preview.log
          exit 1
      - name: Install Playwright
        working-directory: apps/web
        run: npm install playwright@1.52.0 --no-save --no-audit --no-fund
      - name: Install Chromium
        working-directory: apps/web
        run: npx playwright install --with-deps chromium
      - name: Run U10D browser acceptance
        working-directory: apps/web
        run: node scripts/quality-u10d-analysis-coherence-browser.mjs
      - name: Verify U10D browser evidence
        run: node scripts/verify-quality-u10d-browser-evidence.mjs
      - name: Upload U10D artifacts
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: quality-u10d-analysis-coherence
          path: |
            /tmp/quality-u10d/**
            /tmp/quality-u10d-preview.log
          if-no-files-found: warn
""")

print('U10D tests and workflow written.')
