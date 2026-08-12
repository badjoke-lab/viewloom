import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { chromium } from 'playwright'

const base = process.env.QUALITY_U10G_BASE_URL ?? 'http://127.0.0.1:4173'
const out = process.env.QUALITY_U10G_ARTIFACT_DIR ?? '/tmp/quality-u10g'
const head = process.env.GITHUB_HEAD_SHA ?? 'local'
await mkdir(out, { recursive: true })

const browser = await chromium.launch({ headless: true })
const evidence = {
  schema: 'viewloom-quality-u10g-architecture-browser-v2',
  head,
  base,
  generatedAt: new Date().toISOString(),
  checkpoint: null,
  scenarios: [],
}

try {
  for (const provider of ['twitch', 'kick']) {
    await auditDayFlow(provider, 1440, 'desktop-layout')
    await auditDayFlow(provider, 390, 'mobile-fallback')
    await auditBattle(provider, 1440, 'direct-time')
    await auditBattle(provider, 390, 'legacy-point')
  }
  assert.equal(evidence.scenarios.length, 8)
  await BunWrite(resolve(out, 'evidence.json'), evidence)
  console.log('U10G architecture browser acceptance passed.')
} finally {
  await browser.close()
}

async function auditDayFlow(provider, width, mode) {
  const id = `${provider}-day-flow-${mode}-${width}`
  evidence.checkpoint = id
  const { context, requests, crossRequests, categoryRequests } = await dayFlowContext(provider, width)
  const page = await context.newPage()
  await page.goto(`${base}/${provider}/day-flow/?layout=split`, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('[data-dayflow-layout-shell]')
  await page.waitForFunction(() => document.querySelector('[data-dayflow-category-preview-select]') !== null)
  await page.waitForTimeout(50)

  const initial = await architectureSnapshot(page, 'day-flow')
  const expectsCategoryBoundary = provider === 'twitch' || provider === 'kick'
  assert.equal(requests.value, 1, `${id}: Day Flow issued ${requests.value} feature requests`)
  assert.equal(crossRequests.value, 0, `${id}: Day Flow crossed provider endpoint`)
  assert.equal(categoryRequests.value, expectsCategoryBoundary ? 1 : 0, `${id}: category request count mismatch`)
  assert.equal(initial.fetchSame, true, `${id}: global fetch was replaced\n${initial.fetchReplacementStack ?? ''}`)
  assert.equal(initial.replaceStateSame, true, `${id}: history.replaceState was replaced\n${initial.replaceStateReplacementStack ?? ''}`)
  assert.equal(initial.urlGetSame, true, `${id}: URLSearchParams.get was replaced\n${initial.urlGetReplacementStack ?? ''}`)
  assert.equal(initial.categoryControlPresent, expectsCategoryBoundary, `${id}: category control visibility mismatch`)
  assert.equal(initial.categoryControlPublic, expectsCategoryBoundary, `${id}: category control public state mismatch`)
  assert.equal(initial.categoryParam, expectsCategoryBoundary ? 'all' : null, `${id}: category URL state mismatch`)
  assert.ok(initial.summaryCards > 0, `${id}: summary enhancement missing`)
  assert.ok(initial.horizontalOverflow <= 2, `${id}: horizontal overflow ${initial.horizontalOverflow}`)

  if (mode === 'desktop-layout') {
    assert.equal(initial.layoutCurrent, 'split', `${id}: desktop split layout did not apply`)
    await page.locator('[data-dayflow-layout="wide"]').click()
    await page.waitForSelector('[data-dayflow-layout-shell][data-dayflow-layout-current="wide"]')
    await page.locator('[data-dayflow-layout="split"]').click()
    await page.waitForSelector('[data-dayflow-layout-shell][data-dayflow-layout-current="split"]')
    assert.equal(requests.value, 1, `${id}: layout-only changes refetched Day Flow`)
  } else {
    assert.equal(initial.layoutCurrent, 'wide', `${id}: mobile split request did not fall back to wide`)
    assert.equal(initial.layoutRequested, 'split', `${id}: requested split state was lost`)
  }

  evidence.scenarios.push({ id, feature: 'day-flow', provider, width, mode, requests: requests.value, crossRequests: crossRequests.value, categoryRequests: categoryRequests.value, initial })
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
  const expectedCategoryParam = provider === 'kick' ? 'all' : null
  assert.equal(requests.value, 1, `${id}: Battle Lines issued ${requests.value} feature requests`)
  assert.equal(crossRequests.value, 0, `${id}: Battle Lines crossed provider endpoint`)
  assert.equal(initial.fetchSame, true, `${id}: global fetch was replaced\n${initial.fetchReplacementStack ?? ''}`)
  assert.equal(initial.replaceStateSame, true, `${id}: history.replaceState was replaced\n${initial.replaceStateReplacementStack ?? ''}`)
  assert.equal(initial.urlGetSame, true, `${id}: URLSearchParams.get was replaced\n${initial.urlGetReplacementStack ?? ''}`)
  assert.equal(initial.categoryControlPresent, false, `${id}: Battle Lines exposed Day Flow Category control`)
  assert.equal(initial.categoryParam, expectedCategoryParam, `${id}: Battle Lines category URL state mismatch`)
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
    const categoryControl = document.querySelector('[data-dayflow-category-preview-select]')
    const categoryRoot = document.getElementById('dayflow-category-preview-controls')
    return {
      fetchSame: native.fetchReplaced === false,
      replaceStateSame: native.replaceStateReplaced === false,
      urlGetSame: native.urlGetReplaced === false,
      fetchReplacementStack: native.fetchReplacementStack,
      replaceStateReplacementStack: native.replaceStateReplacementStack,
      urlGetReplacementStack: native.urlGetReplacementStack,
      categoryControlPresent: categoryControl !== null,
      categoryControlPublic: categoryRoot?.dataset.dayflowCategoryPreview === 'public',
      categoryParam: params.get('category'),
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
  const categoryRequests = { value: 0 }
  await context.route('**/api/kick-day-flow*', (route) => {
    if (provider === 'kick') {
      requests.value += 1
      const url = new URL(route.request().url())
      if (url.searchParams.get('category') === 'all') categoryRequests.value += 1
      return replyJson(route, dayFlowPayload('kick'))
    }
    crossRequests.value += 1
    return route.abort()
  })
  await context.route('**/api/day-flow*', (route) => {
    if (provider === 'twitch') {
      requests.value += 1
      const url = new URL(route.request().url())
      if (url.searchParams.get('category') === 'all') categoryRequests.value += 1
      return replyJson(route, dayFlowPayload('twitch'))
    }
    crossRequests.value += 1
    return route.abort()
  })
  return { context, requests, crossRequests, categoryRequests }
}

async function battleContext(provider, width) {
  const context = await baseContext(width)
  const requests = { value: 0 }
  const crossRequests = { value: 0 }
  await context.route('**/api/kick-battle-lines*', (route) => {
    if (provider === 'kick') {
      requests.value += 1
      return replyJson(route, battlePayload('kick'))
    }
    crossRequests.value += 1
    return route.abort()
  })
  await context.route('**/api/battle-lines*', (route) => {
    if (provider === 'twitch') {
      requests.value += 1
      return replyJson(route, battlePayload('twitch'))
    }
    crossRequests.value += 1
    return route.abort()
  })
  return { context, requests, crossRequests }
}

async function quietThirdParties(context) {
  for (const pattern of ['**/logo_qqwwoer.jpg','**/api/status*','**/api/watchlist*']) {
    await context.route(pattern, (route) => route.fulfill({ status: 204, body: '' }))
  }
}

function dayFlowPayload(provider) {
  const timeline = ['2026-06-29T00:00:00.000Z','2026-06-29T00:05:00.000Z','2026-06-29T00:10:00.000Z','2026-06-29T00:15:00.000Z']
  const bands = [
    { id: 'alpha', name: 'Alpha', displayName: 'Alpha', viewerMinutes: 570, color: '#667788', values: [100,110,120,130], shares: [52.6,52.4,52.2,52.0], ranks: [1,1,1,1], latestViewers: 130, peakViewers: 130 },
    { id: 'beta', name: 'Beta', displayName: 'Beta', viewerMinutes: 510, color: '#8899aa', values: [90,100,110,120], shares: [47.4,47.6,47.8,48.0], ranks: [2,2,2,2], latestViewers: 120, peakViewers: 120 },
  ]
  return {
    platform: provider,
    state: 'fresh', status: 'fresh', source: 'api', updatedAt: timeline.at(-1), generatedAt: timeline.at(-1),
    mode: 'day', scope: 'full', metric: 'volume', top: 20, bucket: '5m', requestedBucket: '5m', timeline, bands,
    others: { values: [0,0,0,0], shares: [0,0,0,0] },
    coverage: { expectedBuckets: 4, observedBuckets: 4, missingBuckets: 0, missingRatio: 0 },
    window: { mode: 'today', selectedDate: '2026-06-29', from: timeline[0], to: '2026-06-30T00:00:00.000Z', isLive: true },
    categoryFilter: { implementationState: 'public', publicExposureAuthorized: true, selectedCategory: 'all', state: 'all', coverageState: 'observed', availableCategories: [{ id: '1', name: 'Category One' }], coverageCounts: { observed: 4, partial: 0, unavailable: 0 } },
    availableCategories: [{ id: '1', name: 'Category One' }],
    summary: { totalViewerMinutes: 1080, peakViewers: 250, peakAt: timeline.at(-1), topStreamerName: 'Alpha', topStreamerViewerMinutes: 570 },
    notes: ['fixture'],
  }
}

function battlePayload(provider) {
  const timeline = ['2026-06-29T00:00:00.000Z','2026-06-29T00:05:00.000Z','2026-06-29T00:10:00.000Z']
  const line = (id, name, values) => ({ id, name, displayName: name, peakViewers: Math.max(...values), latestViewers: values.at(-1), latestValue: values.at(-1), viewerMinutes: values.reduce((sum, value) => sum + value * 5, 0), points: timeline.map((time, index) => ({ bucket: time, time, viewers: values[index], value: values[index], state: 'observed' })) })
  const lines = [line('alpha','Alpha',[100,120,130]), line('beta','Beta',[110,115,112]), line('gamma','Gamma',[80,85,90])]
  const battle = {
    id: 'alpha__beta', pair: ['alpha','beta'], streamerAId:'alpha',streamerBId:'beta',streamerAName:'Alpha',streamerBName:'Beta',score:90,overlapCount:3,longestRun:3,reversalCount:1,recentOverlap:3,missingPenalty:0,currentIndex:2,currentBucket:timeline[2],currentLeaderId:'alpha',currentLeaderName:'Alpha',currentGap:18,previousGap:5,gapTrend:'widening',latestReversalAt:timeline[1],
  }
  const reversal = { id:'rev1',type:'reversal',battleId:battle.id,pair:battle.pair,time:timeline[1],bucket:timeline[1],index:1,title:'Lead change',summary:'Alpha passed Beta',passer:'Alpha',passed:'Beta',gapBefore:10,gapAfter:5 }
  return {
    platform: provider,
    state:'fresh',status:'fresh',source:'api',updatedAt:timeline[2],generatedAt:timeline[2],top:5,requestedBucket:'5m',bucket:'5m',metric:'viewers',valueMode:'viewers',metricNote:'fixture',granularityNote:'fixture',timeline,
    coverage:{expectedBuckets:3,observedBuckets:3,missingBuckets:0,missingRatio:0},
    window:{mode:'today',selectedDate:'2026-06-29',from:timeline[0],to:'2026-06-30T00:00:00.000Z',isLive:true},
    lines,primaryBattle:battle,recommendedBattle:battle,secondaryBattles:[],battles:[battle],events:[reversal],reversals:[reversal],feed:[reversal],notes:['fixture'],
  }
}

async function replyJson(route, payload) {
  return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(payload) })
}

async function BunWrite(path, value) {
  const { writeFile } = await import('node:fs/promises')
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`)
}
