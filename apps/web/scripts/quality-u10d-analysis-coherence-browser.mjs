import assert from 'node:assert/strict'
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
  assert.equal(initial.urlLayout, null, `${provider} ${width}: clean default wrote a URL preference`)
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
  assert.equal(snapshot.urlLayout, null)
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
