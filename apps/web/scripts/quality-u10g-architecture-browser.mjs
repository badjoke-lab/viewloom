import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { chromium } from 'playwright'

const base = process.env.QUALITY_U10G_BASE_URL ?? 'http://127.0.0.1:4173'
const out = resolve(process.env.QUALITY_U10G_ARTIFACT_DIR ?? 'artifacts/quality-u10g')
mkdirSync(out, { recursive: true })

const evidence = {
  schema: 'viewloom-quality-u10g-architecture-browser-v1',
  phase: 'U10G',
  candidateHead: process.env.GITHUB_HEAD_SHA ?? process.env.GITHUB_SHA ?? null,
  checkpoint: 'start',
  scenarios: [],
  result: 'running',
}

const browser = await chromium.launch({ headless: true })
try {
  for (const provider of ['twitch', 'kick']) {
    await auditDayFlow(provider, 1440, 'desktop-layout')
    await auditDayFlow(provider, 390, 'mobile-fallback')
    await auditBattle(provider, 1440, 'direct-time')
    await auditBattle(provider, 390, 'legacy-point')
  }
  assert.equal(evidence.scenarios.length, 8)
  evidence.result = 'pass'
  evidence.checkpoint = 'complete'
  writeFileSync(resolve(out, 'quality-u10g-architecture-evidence.json'), `${JSON.stringify(evidence, null, 2)}\n`)
  console.log('U10G architecture browser acceptance passed: 8 provider and feature scenarios.')
} catch (error) {
  evidence.result = 'fail'
  evidence.error = `${evidence.checkpoint}: ${error instanceof Error ? error.stack ?? error.message : String(error)}`
  writeFileSync(resolve(out, 'quality-u10g-architecture-evidence.json'), `${JSON.stringify(evidence, null, 2)}\n`)
  throw error
} finally {
  await browser.close()
}

async function auditDayFlow(provider, width, mode) {
  const id = `${provider}-day-flow-${mode}-${width}`
  evidence.checkpoint = id
  const { context, requests, crossRequests } = await dayFlowContext(provider, width)
  const page = await context.newPage()
  const path = mode === 'mobile-fallback' ? `/${provider}/day-flow/?layout=split` : `/${provider}/day-flow/`
  await page.goto(`${base}${path}`, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('.dayflow-summary-overview')
  await page.waitForSelector('[data-dayflow-layout-shell]')

  const initial = await architectureSnapshot(page, 'day-flow')
  assert.equal(requests.value, 1, `${id}: Day Flow issued ${requests.value} feature requests`)
  assert.equal(crossRequests.value, 0, `${id}: Day Flow crossed provider endpoint`)
  assert.equal(initial.fetchSame, true, `${id}: global fetch was replaced\n${initial.fetchReplacementStack ?? ''}`)
  assert.equal(initial.replaceStateSame, true, `${id}: history.replaceState was replaced\n${initial.replaceStateReplacementStack ?? ''}`)
  assert.equal(initial.urlGetSame, true, `${id}: URLSearchParams.get was replaced\n${initial.urlGetReplacementStack ?? ''}`)
  assert.ok(initial.summaryCards >= 5, `${id}: enhanced summary did not render from primary payload`)
  assert.ok(initial.horizontalOverflow <= 2, `${id}: horizontal overflow ${initial.horizontalOverflow}`)

  if (mode === 'desktop-layout') {
    await page.locator('[data-dayflow-layout="split"]').click()
    await page.waitForSelector('[data-dayflow-layout-shell][data-dayflow-layout-current="split"]')
    await page.locator('[data-dayflow-layout="wide"]').click()
    await page.waitForSelector('[data-dayflow-layout-shell][data-dayflow-layout-current="wide"]')
    assert.equal(requests.value, 1, `${id}: layout-only changes refetched Day Flow`)
  } else {
    assert.equal(initial.layoutCurrent, 'wide', `${id}: mobile split request did not fall back to wide`)
    assert.equal(initial.layoutRequested, 'split', `${id}: requested split state was lost`)
  }

  evidence.scenarios.push({ id, feature: 'day-flow', provider, width, mode, requests: requests.value, crossRequests: crossRequests.value, initial })
  await page.screenshot({ path: resolve(out, `${id}.png`), fullPage: true })
  await context.close()
}

async function auditBattle(provider, width, mode) {
  const id = `${provider}-battle-lines-${mode}-${width}`
  evidence.checkpoint = id
  const { context, requests, crossRequests } = await battleContext(provider, width)
  const page = await context.newPage()
  const query = mode === 'direct-time'
    ? 'time=2026-06-29T00%3A05%3A00.000Z&layout=split'
    : 'point=1&layout=split'
  await page.goto(`${base}/${provider}/battle-lines/?${query}`, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('[data-battle-chart][data-battle-selected-index="1"]')
  await page.waitForFunction(() => new URLSearchParams(location.search).get('time') === '2026-06-29T00:05:00.000Z')

  const initial = await architectureSnapshot(page, 'battle-lines')
  assert.equal(requests.value, 1, `${id}: Battle Lines issued ${requests.value} feature requests`)
  assert.equal(crossRequests.value, 0, `${id}: Battle Lines crossed provider endpoint`)
  assert.equal(initial.fetchSame, true, `${id}: global fetch was replaced\n${initial.fetchReplacementStack ?? ''}`)
  assert.equal(initial.replaceStateSame, true, `${id}: history.replaceState was replaced\n${initial.replaceStateReplacementStack ?? ''}`)
  assert.equal(initial.urlGetSame, true, `${id}: URLSearchParams.get was replaced\n${initial.urlGetReplacementStack ?? ''}`)
  assert.equal(initial.selectedIndex, '1', `${id}: selected bucket was not resolved`)
  assert.equal(initial.timeParam, '2026-06-29T00:05:00.000Z', `${id}: canonical time missing`)
  assert.equal(initial.pointParam, null, `${id}: legacy point remained in canonical URL`)
  assert.ok(initial.horizontalOverflow <= 2, `${id}: horizontal overflow ${initial.horizontalOverflow}`)

  if (mode === 'direct-time') {
    assert.equal(initial.layoutCurrent, 'split', `${id}: desktop split layout did not apply`)
    await page.locator('[data-battle-layout="wide"]').click()
    await page.waitForSelector('[data-battle-layout-shell][data-battle-layout-current="wide"]')
    await page.locator('[data-battle-layout="split"]').click()
    await page.waitForSelector('[data-battle-layout-shell][data-battle-layout-current="split"]')
    assert.equal(requests.value, 1, `${id}: layout-only changes refetched Battle Lines`)
  } else {
    assert.equal(initial.layoutCurrent, 'wide', `${id}: mobile split request did not fall back to wide`)
    assert.equal(initial.layoutRequested, 'split', `${id}: requested split state was lost`)
  }

  evidence.scenarios.push({ id, feature: 'battle-lines', provider, width, mode, requests: requests.value, crossRequests: crossRequests.value, initial })
  await page.screenshot({ path: resolve(out, `${id}.png`), fullPage: true })
  await context.close()
}

async function architectureSnapshot(page, feature) {
  return page.evaluate((featureName) => {
    const native = globalThis.__viewloomU10GNative
    const shell = featureName === 'day-flow'
      ? document.querySelector('[data-dayflow-layout-shell]')
      : document.querySelector('[data-battle-layout-shell]')
    const params = new URLSearchParams(location.search)
    return {
      fetchSame: native.fetchReplaced === false,
      replaceStateSame: native.replaceStateReplaced === false,
      urlGetSame: native.urlGetReplaced === false,
      fetchReplacementStack: native.fetchReplacementStack,
      replaceStateReplacementStack: native.replaceStateReplacementStack,
      urlGetReplacementStack: native.urlGetReplacementStack,
      layoutCurrent: shell?.getAttribute(featureName === 'day-flow' ? 'data-dayflow-layout-current' : 'data-battle-layout-current'),
      layoutRequested: shell?.getAttribute(featureName === 'day-flow' ? 'data-dayflow-layout-requested' : 'data-battle-layout-requested'),
      summaryCards: document.querySelectorAll('.dayflow-summary-stat').length,
      selectedIndex: document.querySelector('[data-battle-chart]')?.getAttribute('data-battle-selected-index'),
      timeParam: params.get('time'),
      pointParam: params.get('point'),
      horizontalOverflow: Math.max(0, document.documentElement.scrollWidth - innerWidth),
    }
  }, feature)
}

async function baseContext(width) {
  const context = await browser.newContext({ viewport: { width, height: 1000 }, isMobile: width <= 390, hasTouch: width <= 390 })
  await context.addInitScript(({ now }) => {
    const replacementStatus = {
      fetchReplaced: false,
      replaceStateReplaced: false,
      urlGetReplaced: false,
      fetchReplacementStack: null,
      replaceStateReplacementStack: null,
      urlGetReplacementStack: null,
    }

    installValueReplacementTrap(globalThis, 'fetch', replacementStatus, 'fetchReplaced')
    installValueReplacementTrap(Object.getPrototypeOf(history), 'replaceState', replacementStatus, 'replaceStateReplaced')
    installValueReplacementTrap(URLSearchParams.prototype, 'get', replacementStatus, 'urlGetReplaced')

    globalThis.__viewloomU10GNative = replacementStatus

    const RealDate = Date
    class FixedDate extends RealDate {
      constructor(...args) { super(...(args.length ? args : [now])) }
      static now() { return new RealDate(now).getTime() }
    }
    globalThis.Date = FixedDate

    function installValueReplacementTrap(target, property, status, statusKey) {
      const descriptor = Object.getOwnPropertyDescriptor(target, property)
      if (!descriptor || descriptor.configurable === false || typeof descriptor.value !== 'function') return
      let value = descriptor.value
      const stackKey = `${statusKey.replace(/Replaced$/, '')}ReplacementStack`
      Object.defineProperty(target, property, {
        configurable: true,
        enumerable: descriptor.enumerable,
        get() { return value },
        set(nextValue) {
          status[statusKey] = true
          status[stackKey] = new Error(`${String(property)} replacement detected`).stack ?? null
          value = nextValue
        },
      })
    }
  }, { now: '2026-06-29T00:20:00.000Z' })
  await quietThirdParties(context)
  return context
}

async function dayFlowContext(provider, width) {
  const context = await baseContext(width)
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
  return { context, requests, crossRequests }
}

async function battleContext(provider, width) {
  const context = await baseContext(width)
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
  return { context, requests, crossRequests }
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
    source: 'real', platform, state: 'complete', status: 'ok', lastUpdated: buckets.at(-1), updatedAt: buckets.at(-1),
    coverageNote: 'Deterministic U10G fixture.', selectedDate: '2026-06-29', bucketSize: 5, topN: 20,
    valueMode: 'volume', rangeMode: 'today', windowStart: buckets[0], windowEnd: buckets.at(-1), isRolling: false,
    buckets, totalViewersByBucket: [300, 300, 300], bands: [alpha, beta, others],
    summary: { peakLeader: 'Alpha', longestDominance: 'Alpha', biggestRise: 'Alpha', highestActivity: null },
    detailPanelSource: { defaultStreamerId: 'alpha', streamers: [alpha, beta] }, activity: { available: false, note: 'Activity unavailable.' },
  }
}

function dayFlowBand(streamerId, name, viewers, shares) {
  return {
    streamerId, name, title: `${name} stream`, totalViewerMinutes: viewers.reduce((sum, value) => sum + value * 5, 0),
    viewerMinutes: viewers.reduce((sum, value) => sum + value * 5, 0), peakViewers: Math.max(...viewers),
    avgViewers: viewers.reduce((sum, value) => sum + value, 0) / viewers.length, peakShare: Math.max(...shares),
    biggestRiseBucket: '2026-06-29T00:05:00.000Z', biggestRiseTime: '2026-06-29T00:05:00.000Z', biggestRiseValue: 30,
    firstSeen: '2026-06-29T00:00:00.000Z', lastSeen: '2026-06-29T00:10:00.000Z',
    buckets: viewers.map((value, index) => ({ viewers: value, share: shares[index], activityAvailable: false })),
  }
}

function battlePayload(platform) {
  const timeline = ['2026-06-29T00:00:00.000Z', '2026-06-29T00:05:00.000Z', '2026-06-29T00:10:00.000Z']
  const lines = [battleLine('alpha', 'Alpha', [100, 130, 150], timeline), battleLine('beta', 'Beta', [90, 120, 140], timeline), battleLine('gamma', 'Gamma', [80, 145, 160], timeline)]
  const primaryBattle = battle('alpha:beta', 'alpha', 'beta', 'Alpha', 'Beta', 71, 10)
  const recommendedBattle = battle('alpha:gamma', 'alpha', 'gamma', 'Alpha', 'Gamma', 92, 10)
  return {
    platform, state: 'complete', status: 'ok', source: 'real', updatedAt: timeline.at(-1), generatedAt: timeline.at(-1),
    top: 5, requestedBucket: '5m', bucket: '5m', metric: 'viewers', valueMode: 'viewers', metricNote: 'Observed viewers.',
    granularityNote: '5 minute deterministic fixture.', timeline, coverage: { expectedBuckets: 3, observedBuckets: 3, missingBuckets: 0, missingRatio: 0 },
    window: { mode: 'today', selectedDate: '2026-06-29', from: timeline[0], to: timeline.at(-1), isLive: true },
    lines, primaryBattle, recommendedBattle, secondaryBattles: [primaryBattle], battles: [primaryBattle, recommendedBattle], events: [], reversals: [], feed: [],
  }
}

function battleLine(id, name, viewers, timeline) {
  return {
    id, streamerId: id, name, displayName: name, title: `${name} stream`, peakViewers: Math.max(...viewers), latestViewers: viewers.at(-1),
    latestValue: viewers.at(-1), viewerMinutes: viewers.reduce((sum, value) => sum + value * 5, 0),
    points: viewers.map((value, index) => ({ bucket: timeline[index], time: timeline[index], viewers: value, value, state: 'observed' })),
  }
}

function battle(id, streamerAId, streamerBId, streamerAName, streamerBName, score, currentGap) {
  return {
    id, pair: [streamerAId, streamerBId], streamerAId, streamerBId, streamerAName, streamerBName, score,
    overlapCount: 3, longestRun: 3, reversalCount: 0, recentOverlap: 3, missingPenalty: 0, currentIndex: 2,
    currentBucket: '2026-06-29T00:10:00.000Z', currentLeaderId: streamerBId, currentLeaderName: streamerBName,
    currentGap, previousGap: currentGap, gapTrend: 'steady', latestReversalAt: null,
  }
}
