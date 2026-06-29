import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { chromium } from 'playwright'

const base = process.env.QUALITY_U10C_BASE_URL ?? 'http://127.0.0.1:4173'
const out = resolve(process.env.QUALITY_U10C_ARTIFACT_DIR ?? 'artifacts/quality-u10c')
mkdirSync(out, { recursive: true })

const routes = [
  { path: '/twitch/heatmap/', provider: 'twitch', feature: 'heatmap' },
  { path: '/kick/heatmap/', provider: 'kick', feature: 'heatmap' },
  { path: '/twitch/day-flow/', provider: 'twitch', feature: 'day-flow' },
  { path: '/kick/day-flow/', provider: 'kick', feature: 'day-flow' },
  { path: '/twitch/battle-lines/', provider: 'twitch', feature: 'battle-lines' },
  { path: '/kick/battle-lines/', provider: 'kick', feature: 'battle-lines' },
  { path: '/twitch/history/', provider: 'twitch', feature: 'history' },
  { path: '/kick/history/', provider: 'kick', feature: 'history' },
]
const viewports = [1440, 820, 390, 360]
const allowedStates = ['loading', 'fresh', 'partial', 'stale', 'missing', 'empty', 'demo', 'error', 'unknown']

const evidence = {
  schema: 'viewloom-quality-u10c-visualization-browser-v1',
  phase: 'U10C',
  candidateHead: process.env.GITHUB_HEAD_SHA ?? process.env.GITHUB_SHA ?? null,
  routes: routes.length,
  viewports,
  scenarios: [],
  result: 'running',
}

const browser = await chromium.launch({ headless: true })
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
  await context.route('**/googletagmanager.com/**', (route) => route.abort())
  await context.route('**/google-analytics.com/**', (route) => route.abort())
  await context.route('**/api/**', (route) => route.fulfill({
    status: 503,
    contentType: 'application/json',
    body: JSON.stringify({ status: 'unavailable', state: 'unavailable', error: { message: 'U10C deterministic unavailable fixture' } }),
  }))

  for (const route of routes) {
    for (const width of viewports) await auditScenario(context, route, width)
  }
  evidence.result = 'pass'
} catch (error) {
  evidence.result = 'fail'
  evidence.error = error instanceof Error ? error.stack ?? error.message : String(error)
  throw error
} finally {
  writeFileSync(resolve(out, 'quality-u10c-visualization-browser-evidence.json'), `${JSON.stringify(evidence, null, 2)}\n`)
  await browser.close()
}

async function auditScenario(context, route, width) {
  const page = await context.newPage()
  const height = width >= 820 ? 1000 : 844
  await page.setViewportSize({ width, height })
  await page.goto(`${base}${route.path}`, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector(`[data-visualization-guide="${route.feature}"]`)
  await page.waitForFunction((feature) => {
    const guide = document.querySelector(`[data-visualization-guide="${feature}"]`)
    const stage = document.querySelector(`[data-visualization-surface="${feature}"]`)
    return Boolean(guide && stage)
  }, route.feature)

  const initial = await visualizationSnapshot(page, route.feature)
  assertGuide(route, width, initial)
  await assertMetricSynchronization(page, route, width)
  const afterMetric = await visualizationSnapshot(page, route.feature)
  assertGuide(route, width, afterMetric)

  evidence.scenarios.push({
    id: `${routeKey(route.path)}-${width}`,
    route: route.path,
    provider: route.provider,
    feature: route.feature,
    width,
    initial,
    afterMetric,
    result: 'pass',
  })

  if ((width === 1440 || width === 390) && route.provider === 'twitch') {
    await page.screenshot({ path: resolve(out, `${routeKey(route.path)}-${width}.png`), fullPage: true })
  }
  await page.close()
}

async function visualizationSnapshot(page, feature) {
  return page.evaluate((featureName) => {
    const guide = document.querySelector(`[data-visualization-guide="${featureName}"]`)
    const stage = document.querySelector(`[data-visualization-surface="${featureName}"]`)
    const cells = [...(guide?.querySelectorAll('[data-visualization-guide-cell]') ?? [])].map((cell) => ({
      key: cell.getAttribute('data-visualization-guide-cell'),
      label: cell.querySelector('dt')?.textContent?.trim() ?? '',
      value: cell.querySelector('strong')?.textContent?.trim() ?? '',
      detail: cell.querySelector('span')?.textContent?.trim() ?? '',
      state: cell.getAttribute('data-state'),
      mark: cell.querySelector('[data-visualization-state-mark]')?.textContent?.trim() ?? '',
    }))
    const guideRect = guide?.getBoundingClientRect()
    const stageRect = stage?.getBoundingClientRect()
    const describedBy = stage?.getAttribute('aria-describedby')?.split(/\s+/).filter(Boolean) ?? []
    return {
      bodyProvider: document.body.dataset.provider ?? null,
      bodyFeature: document.body.dataset.visualizationFeature ?? null,
      mainFeature: document.querySelector('main')?.getAttribute('data-visualization-feature') ?? null,
      guideId: guide?.id ?? '',
      guideLabel: guide?.getAttribute('aria-label') ?? '',
      guideState: guide?.getAttribute('data-visualization-state') ?? '',
      guideVisible: Boolean(guideRect && guideRect.width > 0 && guideRect.height > 0 && getComputedStyle(guide).display !== 'none'),
      cells,
      stageSurface: stage?.getAttribute('data-visualization-surface') ?? '',
      stageState: stage?.getAttribute('data-visualization-state') ?? '',
      stageMetric: stage?.getAttribute('data-visualization-metric') ?? '',
      stageBusy: stage?.getAttribute('aria-busy') ?? '',
      stageLabel: stage?.getAttribute('aria-label') ?? '',
      stageDescribedBy: describedBy,
      stageVisible: Boolean(stageRect && stageRect.width > 0 && stageRect.height > 0),
      horizontalOverflow: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - window.innerWidth,
      viewportWidth: window.innerWidth,
    }
  }, feature)
}

function assertGuide(route, width, snapshot) {
  assert.equal(snapshot.bodyProvider, route.provider, `${route.path} ${width}: provider identity diverged`)
  assert.equal(snapshot.bodyFeature, route.feature, `${route.path} ${width}: body feature identity diverged`)
  assert.equal(snapshot.mainFeature, route.feature, `${route.path} ${width}: main feature identity diverged`)
  assert.equal(snapshot.guideLabel, 'How to read this visualization', `${route.path} ${width}: guide label diverged`)
  assert.equal(snapshot.guideVisible, true, `${route.path} ${width}: reading guide is not visible`)
  assert.equal(snapshot.stageVisible, true, `${route.path} ${width}: visualization stage is not visible`)
  assert.equal(snapshot.stageSurface, route.feature, `${route.path} ${width}: stage ownership diverged`)
  assert.ok(snapshot.stageDescribedBy.includes(snapshot.guideId), `${route.path} ${width}: stage does not reference guide`)
  assert.ok(allowedStates.includes(snapshot.stageState), `${route.path} ${width}: stage state is not normalized`)
  assert.ok(allowedStates.includes(snapshot.guideState), `${route.path} ${width}: guide state is not normalized`)
  assert.equal(snapshot.stageState, snapshot.guideState, `${route.path} ${width}: stage and guide states diverged`)
  assert.ok(['true', 'false'].includes(snapshot.stageBusy), `${route.path} ${width}: aria-busy is invalid`)
  assert.ok(snapshot.stageLabel.length > 0, `${route.path} ${width}: stage accessible label is empty`)
  assert.equal(snapshot.cells.length, 5, `${route.path} ${width}: guide must expose five cells`)
  assert.deepEqual(snapshot.cells.map((cell) => cell.label), ['Scale', 'Time', 'Selection', 'Detail', 'State'], `${route.path} ${width}: guide order diverged`)
  for (const cell of snapshot.cells) {
    assert.ok(cell.value.length > 0, `${route.path} ${width}: ${cell.label} value is empty`)
    assert.ok(cell.detail.length > 0, `${route.path} ${width}: ${cell.label} detail is empty`)
  }
  const stateCell = snapshot.cells.find((cell) => cell.key === 'state')
  assert.ok(stateCell?.mark, `${route.path} ${width}: state lacks a non-color mark`)
  assert.ok(snapshot.stageMetric.length > 0, `${route.path} ${width}: metric ownership is missing`)
  assert.ok(snapshot.horizontalOverflow <= 1, `${route.path} ${width}: page horizontal overflow ${snapshot.horizontalOverflow}px`)
}

async function assertMetricSynchronization(page, route, width) {
  const expectations = {
    heatmap: { metric: 'field', detail: 'Tile area = viewers · color = momentum' },
    'day-flow': { selector: '[data-dayflow-metric="share"]', metric: 'share', detail: 'Percent of selected scope' },
    'battle-lines': { selector: '[data-battle-metric="indexed"]', metric: 'indexed', detail: 'Index from 0 to 100' },
    history: { selector: '[data-history-metric="peak_viewers"]', metric: 'peak_viewers', detail: 'Peak observed viewers per UTC day' },
  }
  const expected = expectations[route.feature]
  if (expected.selector) {
    await page.locator(expected.selector).click()
    await page.waitForFunction(({ feature, metric }) => document.querySelector(`[data-visualization-surface="${feature}"]`)?.getAttribute('data-visualization-metric') === metric, { feature: route.feature, metric: expected.metric })
  }
  const snapshot = await visualizationSnapshot(page, route.feature)
  assert.equal(snapshot.stageMetric, expected.metric, `${route.path} ${width}: metric did not synchronize`)
  const scale = snapshot.cells.find((cell) => cell.key === 'scale')
  assert.ok(scale?.detail.includes(expected.detail), `${route.path} ${width}: scale detail does not describe ${expected.metric}`)
}

function routeKey(route) {
  return route.replace(/^\//, '').replace(/\/$/, '').replaceAll('/', '-')
}
