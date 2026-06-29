import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { chromium } from 'playwright'

const base = process.env.QUALITY_U10A_BASE_URL ?? 'http://127.0.0.1:4173'
const out = resolve(process.env.QUALITY_U10A_ARTIFACT_DIR ?? 'artifacts/quality-u10a')
mkdirSync(out, { recursive: true })

const evidence = {
  schema: 'viewloom-quality-u10a-browser-v1',
  phase: 'U10A',
  candidateHead: process.env.GITHUB_HEAD_SHA ?? process.env.GITHUB_SHA ?? null,
  checkpoint: 'start',
  result: 'running',
  scenarios: [],
  mobileTargets: [],
}

const browser = await chromium.launch({ headless: true })
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
  await context.route('**/googletagmanager.com/**', (route) => route.abort())
  await context.route('**/google-analytics.com/**', (route) => route.abort())
  await context.route('**/api/kick-day-flow*', (route) => replyJson(route, dayFlowPayload('kick')))
  await context.route('**/api/day-flow*', (route) => replyJson(route, dayFlowPayload('twitch')))
  await context.route('**/api/kick-battle-lines*', (route) => replyJson(route, battlePayload('kick')))
  await context.route('**/api/battle-lines*', (route) => replyJson(route, battlePayload('twitch')))

  for (const provider of ['twitch', 'kick']) {
    await auditDayFlowAccessibleName(context, provider)
    await auditChannelNoId(context, provider)
    await auditBattleCoherence(context, provider)
  }

  const targetRoutes = [
    '/',
    '/twitch/day-flow/',
    '/kick/day-flow/',
    '/twitch/battle-lines/',
    '/kick/battle-lines/',
    '/twitch/channel/',
    '/kick/channel/',
    '/twitch/watchlist/',
    '/kick/watchlist/',
  ]
  for (const width of [390, 360]) {
    for (const route of targetRoutes) await auditMobileTargets(context, route, width)
  }

  evidence.result = 'pass'
  evidence.checkpoint = 'complete'
} catch (error) {
  evidence.result = 'fail'
  evidence.checkpoint = 'error'
  evidence.error = error instanceof Error ? error.stack ?? error.message : String(error)
  throw error
} finally {
  writeFileSync(resolve(out, 'quality-u10a-browser-evidence.json'), `${JSON.stringify(evidence, null, 2)}\n`)
  await browser.close()
}

async function auditDayFlowAccessibleName(context, provider) {
  const page = await context.newPage()
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`${base}/${provider}/day-flow/`, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('[data-dayflow-date]')
  const snapshot = await page.locator('[data-dayflow-date]').evaluate((input) => ({
    id: input.id,
    label: [...input.labels].map((item) => item.textContent?.trim() ?? '').filter(Boolean).join(' '),
    ariaLabel: input.getAttribute('aria-label') ?? '',
    hidden: input.hidden,
    disabled: input.disabled,
  }))
  assert.equal(snapshot.label, 'UTC date', `${provider}: Day Flow date input lost its visible accessible label`)
  evidence.scenarios.push({
    id: `${provider}-day-flow-accessible-name`,
    provider,
    route: `/${provider}/day-flow/`,
    classification: 'resolved_before_u10a',
    snapshot,
  })
  await page.screenshot({ path: resolve(out, `${provider}-day-flow-390.png`), fullPage: true })
  await page.close()
}

async function auditChannelNoId(context, provider) {
  const page = await context.newPage()
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`${base}/${provider}/channel/`, { waitUntil: 'domcontentloaded' })
  await page.waitForFunction(() => document.querySelector('[data-channel-name]')?.textContent?.includes('Channel not selected'))
  const snapshot = await page.evaluate(() => ({
    name: document.querySelector('[data-channel-name]')?.textContent?.trim() ?? '',
    feedback: document.querySelector('[data-channel-feedback]')?.textContent?.trim() ?? '',
    feedbackLinks: document.querySelectorAll('[data-channel-feedback] a').length,
    visibleTaskTabs: [...document.querySelectorAll('[data-channel-view]')].filter((node) => {
      const rect = node.getBoundingClientRect()
      return rect.width > 0 && rect.height > 0
    }).length,
    visibleCopyActions: [...document.querySelectorAll('[data-channel-copy-url]')].filter((node) => {
      const rect = node.getBoundingClientRect()
      return rect.width > 0 && rect.height > 0
    }).length,
  }))
  assert.equal(snapshot.feedbackLinks, 0, `${provider}: baseline changed; no-id feedback unexpectedly gained an inline action`)
  assert.ok(snapshot.visibleTaskTabs >= 3, `${provider}: baseline changed; no-id task tabs are no longer present`)
  assert.ok(snapshot.visibleCopyActions >= 1, `${provider}: baseline changed; no-id copy action is no longer present`)
  evidence.scenarios.push({
    id: `${provider}-channel-no-id-entry`,
    provider,
    route: `/${provider}/channel/`,
    classification: 'reproduced',
    snapshot,
  })
  await page.screenshot({ path: resolve(out, `${provider}-channel-no-id-390.png`), fullPage: true })
  await page.close()
}

async function auditBattleCoherence(context, provider) {
  const page = await context.newPage()
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto(`${base}/${provider}/battle-lines/`, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('[data-battle-chart]')
  const initial = await battleSnapshot(page)
  assert.equal(initial.primaryPair, 'Alpha vs Beta', `${provider}: default pair baseline changed`)
  assert.notEqual(initial.primaryPair, 'Alpha vs Gamma', `${provider}: recommendation divergence is no longer reproduced`)
  assert.equal(initial.primaryTime, initial.inspectorTime, `${provider}: initial selected-time surfaces disagree`)
  assert.equal(initial.point, null, `${provider}: latest selected time should omit point from URL`)

  await page.locator('[data-battle-chart]').focus()
  await page.keyboard.press('ArrowLeft')
  await page.waitForFunction(() => new URL(location.href).searchParams.get('point') === '1')
  const moved = await battleSnapshot(page)
  assert.equal(moved.primaryTime, moved.inspectorTime, `${provider}: keyboard-selected time surfaces disagree`)
  assert.equal(moved.point, '1', `${provider}: selected point URL state did not move to index 1`)

  evidence.scenarios.push({
    id: `${provider}-battle-recommended-owner-divergence`,
    provider,
    route: `/${provider}/battle-lines/`,
    classification: 'reproduced',
    expectedRecommendedPair: 'Alpha vs Gamma',
    initial,
  })
  evidence.scenarios.push({
    id: `${provider}-battle-selected-time-coherence`,
    provider,
    route: `/${provider}/battle-lines/`,
    classification: 'protected_by_existing_logic',
    initial,
    moved,
  })
  await page.screenshot({ path: resolve(out, `${provider}-battle-lines-1440.png`), fullPage: true })
  await page.close()
}

async function auditMobileTargets(context, route, width) {
  const page = await context.newPage()
  await page.setViewportSize({ width, height: 844 })
  await page.goto(`${base}${route}`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(250)
  const snapshot = await page.evaluate(() => {
    const selector = 'button, a.button, input[type="date"], [role="button"]'
    const targets = [...document.querySelectorAll(selector)].flatMap((node) => {
      const rect = node.getBoundingClientRect()
      const style = getComputedStyle(node)
      if (rect.width <= 0 || rect.height <= 0 || style.visibility === 'hidden' || style.display === 'none') return []
      const label = (node.getAttribute('aria-label') || node.textContent || node.getAttribute('name') || node.id || node.tagName).trim().replace(/\s+/g, ' ').slice(0, 80)
      return [{
        tag: node.tagName.toLowerCase(),
        label,
        width: Number(rect.width.toFixed(1)),
        height: Number(rect.height.toFixed(1)),
      }]
    })
    const under44 = targets.filter((target) => target.height < 44)
    return {
      path: location.pathname,
      measured: targets.length,
      minimumHeight: targets.length ? Math.min(...targets.map((target) => target.height)) : null,
      under44Count: under44.length,
      under44: under44.slice(0, 20),
      horizontalOverflow: Math.max(0, document.documentElement.scrollWidth - innerWidth),
    }
  })
  assert.ok(snapshot.measured > 0, `${route} at ${width}: no visible interactive targets measured`)
  evidence.mobileTargets.push({ id: `${routeKey(route)}-${width}`, route, width, ...snapshot })
  await page.close()
}

async function battleSnapshot(page) {
  return page.evaluate(() => {
    const normalize = (value) => (value ?? '').replace(/\s+/g, ' ').trim()
    const primaryTimeText = normalize(document.querySelector('.battle-primary__identity p')?.textContent)
    return {
      primaryPair: normalize(document.querySelector('[data-battle-primary] h2')?.textContent),
      primaryTime: normalize(primaryTimeText.replace(/^Selected time/i, '')),
      inspectorTime: normalize(document.querySelector('[data-battle-inspector] .inspector-head h2')?.textContent),
      inspectorPair: normalize(document.querySelector('[data-battle-inspector] .pair-inspector__result strong')?.textContent),
      point: new URL(location.href).searchParams.get('point'),
      layout: new URL(location.href).searchParams.get('layout'),
    }
  })
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
    source: 'real',
    platform,
    state: 'complete',
    status: 'ok',
    lastUpdated: '2026-06-29T00:10:00.000Z',
    updatedAt: '2026-06-29T00:10:00.000Z',
    coverageNote: 'Deterministic U10A fixture.',
    selectedDate: '2026-06-29',
    bucketSize: 5,
    topN: 20,
    valueMode: 'volume',
    rangeMode: 'today',
    windowStart: buckets[0],
    windowEnd: buckets.at(-1),
    isRolling: false,
    buckets,
    totalViewersByBucket: [300, 300, 300],
    bands: [alpha, beta, others],
    summary: { peakLeader: 'Alpha', longestDominance: 'Alpha', biggestRise: 'Alpha', highestActivity: null },
    detailPanelSource: { defaultStreamerId: 'alpha', streamers: [alpha, beta] },
    activity: { available: false, note: 'Activity unavailable.' },
  }
}

function dayFlowBand(streamerId, name, viewers, shares) {
  return {
    streamerId,
    name,
    title: `${name} stream`,
    totalViewerMinutes: viewers.reduce((sum, value) => sum + value * 5, 0),
    viewerMinutes: viewers.reduce((sum, value) => sum + value * 5, 0),
    peakViewers: Math.max(...viewers),
    avgViewers: viewers.reduce((sum, value) => sum + value, 0) / viewers.length,
    peakShare: Math.max(...shares),
    biggestRiseBucket: '2026-06-29T00:05:00.000Z',
    biggestRiseTime: '2026-06-29T00:05:00.000Z',
    biggestRiseValue: 30,
    firstSeen: '2026-06-29T00:00:00.000Z',
    lastSeen: '2026-06-29T00:10:00.000Z',
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
    platform,
    state: 'complete',
    status: 'ok',
    source: 'real',
    updatedAt: timeline.at(-1),
    generatedAt: timeline.at(-1),
    top: 5,
    requestedBucket: '5m',
    bucket: '5m',
    metric: 'viewers',
    valueMode: 'viewers',
    metricNote: 'Observed viewers.',
    granularityNote: '5 minute deterministic fixture.',
    timeline,
    coverage: { expectedBuckets: 3, observedBuckets: 3, missingBuckets: 0, missingRatio: 0 },
    window: { mode: 'today', selectedDate: '2026-06-29', from: timeline[0], to: timeline.at(-1), isLive: true },
    lines,
    primaryBattle,
    recommendedBattle,
    secondaryBattles: [recommendedBattle],
    battles: [primaryBattle, recommendedBattle],
    events: [],
    reversals: [],
    feed: [],
  }
}

function battleLine(id, name, viewers, timeline) {
  return {
    id,
    streamerId: id,
    name,
    displayName: name,
    title: `${name} stream`,
    peakViewers: Math.max(...viewers),
    latestViewers: viewers.at(-1),
    latestValue: viewers.at(-1),
    viewerMinutes: viewers.reduce((sum, value) => sum + value * 5, 0),
    points: viewers.map((value, index) => ({ bucket: timeline[index], time: timeline[index], viewers: value, value, state: 'observed' })),
  }
}

function battle(id, streamerAId, streamerBId, streamerAName, streamerBName, score, currentGap) {
  return {
    id,
    pair: [streamerAId, streamerBId],
    streamerAId,
    streamerBId,
    streamerAName,
    streamerBName,
    score,
    overlapCount: 3,
    longestRun: 3,
    reversalCount: 0,
    recentOverlap: 3,
    missingPenalty: 0,
    currentIndex: 2,
    currentBucket: '2026-06-29T00:10:00.000Z',
    currentLeaderId: streamerBId,
    currentLeaderName: streamerBName,
    currentGap,
    previousGap: currentGap,
    gapTrend: 'steady',
    latestReversalAt: null,
  }
}

function routeKey(route) {
  if (route === '/') return 'portal'
  return route.replace(/^\/+|\/+$/g, '').replaceAll('/', '-')
}

console.log('U10A deterministic browser baseline passed.')
