import { appendFile, mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { chromium } from 'playwright'

const webRoot = process.cwd()
const repoRoot = resolve(webRoot, '../..')
const outputRoot = '/tmp/public-browser-audit'
const productionOrigin = stripOrigin(process.env.P8B_PRODUCTION_ORIGIN || 'https://vl.badjoke-lab.com')
const localOrigin = stripOrigin(process.env.P8B_LOCAL_ORIGIN || 'http://127.0.0.1:4173')
const candidateHead = process.env.GITHUB_HEAD_SHA || process.env.GITHUB_SHA || null

const viewports = [
  { id: 'desktop-1440', width: 1440, height: 1000, reducedMotion: 'no-preference' },
  { id: 'tablet-820', width: 820, height: 1180, reducedMotion: 'reduce' },
  { id: 'mobile-390', width: 390, height: 844, reducedMotion: 'no-preference' },
  { id: 'mobile-360', width: 360, height: 800, reducedMotion: 'reduce' },
]

const evidence = {
  schema: 'viewloom-public-browser-audit-v1',
  phase: 'P8B',
  candidateHead,
  productionOrigin,
  localOrigin,
  result: 'running',
  counts: {},
  productionMatrix: [],
  missingSurfaceProbes: [],
  historyScenarios: [],
  findings: [],
  artifacts: [],
}

await mkdir(outputRoot, { recursive: true })
const routeInventory = await loadRoutes()
const gapInventory = JSON.parse(await readFile(resolve(repoRoot, 'docs/audits/public-surface-gaps.json'), 'utf8'))
const browser = await chromium.launch({ headless: true })

try {
  for (const route of routeInventory) {
    for (const viewport of viewports) {
      evidence.productionMatrix.push(await auditProductionRoute(browser, route, viewport))
    }
  }

  for (const missing of gapInventory.missing_surfaces ?? []) {
    evidence.missingSurfaceProbes.push(await auditMissingSurface(browser, missing))
  }

  evidence.historyScenarios.push(await auditHistoryReal(browser, 'twitch', viewports[0]))
  evidence.historyScenarios.push(await auditHistoryReal(browser, 'kick', viewports[2]))
  evidence.historyScenarios.push(await auditHistoryState(browser, 'twitch', viewports[1], 'partial'))
  evidence.historyScenarios.push(await auditHistoryState(browser, 'kick', viewports[3], 'stale'))
  evidence.historyScenarios.push(await auditHistoryState(browser, 'twitch', viewports[2], 'empty'))
  evidence.historyScenarios.push(await auditHistoryState(browser, 'kick', viewports[2], 'missing'))
  evidence.historyScenarios.push(await auditHistoryState(browser, 'twitch', viewports[3], 'demo'))
  evidence.historyScenarios.push(await auditHistoryState(browser, 'kick', viewports[1], 'in_progress'))
  evidence.historyScenarios.push(await auditHistoryError(browser, 'twitch', viewports[2]))
  evidence.historyScenarios.push(await auditHistoryLoading(browser, 'kick', viewports[3]))

  evidence.findings = classifyFindings(evidence)
  evidence.counts = {
    ownedRoutes: routeInventory.length,
    viewports: viewports.length,
    productionScenarios: evidence.productionMatrix.length,
    missingSurfaceProbes: evidence.missingSurfaceProbes.length,
    historyScenarios: evidence.historyScenarios.length,
    p0: evidence.findings.filter((finding) => finding.severity === 'P0').length,
    p1: evidence.findings.filter((finding) => finding.severity === 'P1').length,
    p2: evidence.findings.filter((finding) => finding.severity === 'P2').length,
    p3: evidence.findings.filter((finding) => finding.severity === 'P3').length,
  }
  evidence.result = 'pass'
  await saveEvidence()
  console.log(JSON.stringify({ result: evidence.result, counts: evidence.counts, findings: evidence.findings.map(({ id, severity }) => ({ id, severity })) }, null, 2))
} catch (error) {
  evidence.result = 'fail'
  evidence.error = error instanceof Error ? error.stack || error.message : String(error)
  await saveEvidence()
  throw error
} finally {
  await browser.close()
}

async function loadRoutes() {
  const files = [
    'docs/audits/public-surface-routes-portal.json',
    'docs/audits/public-surface-routes-twitch.json',
    'docs/audits/public-surface-routes-kick.json',
  ]
  const routes = []
  for (const file of files) {
    const parsed = JSON.parse(await readFile(resolve(repoRoot, file), 'utf8'))
    routes.push(...parsed.routes)
  }
  return routes.map((route) => route.route === '*'
    ? { ...route, route: '/__viewloom_p8b_not_found_probe__/', expectedStatus: 404 }
    : { ...route, expectedStatus: 200 })
}

async function auditProductionRoute(browser, route, viewport) {
  const requests = []
  const failedRequests = []
  const consoleErrors = []
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    reducedMotion: viewport.reducedMotion,
  })
  context.on('request', (request) => {
    const url = request.url()
    if (url.includes('/api/')) requests.push(url)
  })
  context.on('requestfailed', (request) => failedRequests.push({ url: request.url(), error: request.failure()?.errorText ?? 'unknown' }))
  const page = await context.newPage()
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text())
  })

  const url = `${productionOrigin}${route.route}`
  const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45_000 })
  await page.waitForTimeout(1800)
  const status = response?.status() ?? null
  const pageFacts = await page.evaluate(() => {
    const body = document.body
    const title = document.title
    const canonical = document.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? null
    const robots = document.querySelector('meta[name="robots"]')?.getAttribute('content') ?? null
    const h1 = Array.from(document.querySelectorAll('h1')).find((node) => isVisible(node))?.textContent?.trim() ?? null
    const interactive = Array.from(document.querySelectorAll('button, input:not([type="hidden"]), select, textarea, [role="button"], a.button'))
      .filter((node) => isVisible(node))
      .map((node) => {
        const rect = node.getBoundingClientRect()
        const name = node.getAttribute('aria-label') || node.getAttribute('title') || node.textContent?.trim() || (node instanceof HTMLInputElement ? node.name || node.placeholder : '') || ''
        return { tag: node.tagName.toLowerCase(), name, width: Math.round(rect.width), height: Math.round(rect.height) }
      })
    return {
      title,
      canonical,
      robots,
      h1,
      bodyText: body.innerText.slice(0, 12_000),
      clientWidth: body.clientWidth,
      scrollWidth: body.scrollWidth,
      overflow: Math.max(0, body.scrollWidth - body.clientWidth),
      unlabeledControls: interactive.filter((item) => !item.name).slice(0, 20),
      smallControls: interactive.filter((item) => item.height > 0 && item.height < 44).slice(0, 30),
    }

    function isVisible(node) {
      if (!(node instanceof HTMLElement || node instanceof SVGElement)) return false
      const style = getComputedStyle(node)
      const rect = node.getBoundingClientRect()
      return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity || '1') > 0 && rect.width > 0 && rect.height > 0
    }
  })

  await page.keyboard.press('Tab')
  const focus = await page.evaluate(() => {
    const active = document.activeElement
    if (!(active instanceof HTMLElement)) return { moved: false, tag: null, name: null, outline: null }
    const style = getComputedStyle(active)
    return {
      moved: active !== document.body && active !== document.documentElement,
      tag: active.tagName.toLowerCase(),
      name: active.getAttribute('aria-label') || active.textContent?.trim() || null,
      outline: `${style.outlineStyle} ${style.outlineWidth} ${style.boxShadow}`,
    }
  })

  const providerCrossing = route.provider === 'twitch'
    ? requests.filter((request) => /\/api\/kick(?:-|\/)/.test(new URL(request).pathname))
    : route.provider === 'kick'
      ? requests.filter((request) => /\/api\/(?:twitch(?:-|\/)|history(?:\?|$)|day-flow(?:\?|$)|battle-lines(?:\?|$))/.test(new URL(request).pathname))
      : []

  const violations = []
  if (route.expectedStatus === 200 && status !== null && status >= 400) violations.push(`owned route returned ${status}`)
  if (route.expectedStatus === 404 && status !== 404) violations.push(`not-found probe returned ${status}`)
  if (!pageFacts.title) violations.push('document title missing')
  if (!pageFacts.h1) violations.push('visible h1 missing')
  if (route.canonical && pageFacts.canonical !== route.canonical) violations.push(`canonical mismatch: ${pageFacts.canonical}`)
  if (pageFacts.overflow > 2) violations.push(`horizontal overflow ${pageFacts.overflow}px`)
  if (!focus.moved) violations.push('keyboard focus did not leave body')
  if (pageFacts.unlabeledControls.length) violations.push(`${pageFacts.unlabeledControls.length} unlabeled controls`)
  if (providerCrossing.length) violations.push(`provider-crossing requests: ${providerCrossing.join(', ')}`)

  const filename = `${safe(route.id)}--${viewport.id}.png`
  const screenshotPath = `${outputRoot}/${filename}`
  await page.screenshot({ path: screenshotPath, fullPage: true })
  evidence.artifacts.push(filename)
  await context.close()

  const result = {
    id: `${route.id}--${viewport.id}`,
    routeId: route.id,
    route: route.route,
    provider: route.provider,
    profile: route.profile,
    viewport,
    status,
    title: pageFacts.title,
    canonical: pageFacts.canonical,
    robots: pageFacts.robots,
    h1: pageFacts.h1,
    overflow: pageFacts.overflow,
    focus,
    unlabeledControls: pageFacts.unlabeledControls,
    smallControls: pageFacts.smallControls,
    apiRequests: requests.map((request) => new URL(request).pathname + new URL(request).search),
    providerCrossing,
    failedRequests: failedRequests.slice(0, 20),
    consoleErrors: consoleErrors.slice(0, 20),
    violations,
    screenshot: filename,
  }
  await appendLog(result)
  return result
}

async function auditMissingSurface(browser, missing) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await context.newPage()
  const response = await page.goto(`${productionOrigin}${missing.route}`, { waitUntil: 'domcontentloaded', timeout: 45_000 })
  await page.waitForTimeout(500)
  const result = {
    route: missing.route,
    expected: 'missing',
    status: response?.status() ?? null,
    title: await page.title(),
    h1: await page.locator('h1').first().textContent().catch(() => null),
    currentReplacement: missing.current_replacement,
    requiredPhase: missing.required_phase,
    confirmedMissing: response?.status() === 404 || (await page.title()).toLowerCase().includes('not found'),
  }
  const filename = `missing-${safe(missing.route)}.png`
  await page.screenshot({ path: `${outputRoot}/${filename}`, fullPage: true })
  evidence.artifacts.push(filename)
  result.screenshot = filename
  await context.close()
  await appendLog(result)
  return result
}

async function auditHistoryReal(browser, provider, viewport) {
  const calls = []
  const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, reducedMotion: viewport.reducedMotion })
  await context.route('**/api/history?*', async (route) => fulfillHistory(route, provider, calls))
  await context.route('**/api/kick-history?*', async (route) => fulfillHistory(route, provider, calls))
  const page = await context.newPage()
  await page.goto(`${localOrigin}/${provider}/history/`, { waitUntil: 'domcontentloaded' })
  await waitHistory(page)

  const initial = await historySnapshot(page)
  await page.locator('[data-history-metric="peak_viewers"]').click()
  await waitHistory(page)
  const peak = await historySnapshot(page)

  const callsBeforeTasks = calls.length
  await page.locator('[data-history-view="archives"]').click()
  await page.locator('[data-history-archive-view="peaks"]').click()
  await page.locator('[data-history-archive-view="battles"]').click()
  await page.locator('[data-history-archive-view="daily"]').click()
  await page.locator('[data-history-view="report"]').click()
  const reportVisible = await page.locator('[data-history-view-panel="report"]').isVisible()
  await page.goBack()
  await page.waitForFunction(() => document.querySelector('.history-page')?.getAttribute('data-history-view') === 'archives')
  await page.goBack()
  await page.waitForFunction(() => document.querySelector('.history-page')?.getAttribute('data-history-view') === 'overview')

  const taskRequests = calls.length - callsBeforeTasks
  const filename = `history-${provider}-real-${viewport.id}.png`
  await page.screenshot({ path: `${outputRoot}/${filename}`, fullPage: true })
  evidence.artifacts.push(filename)
  const result = {
    id: `history-${provider}-real-${viewport.id}`,
    provider,
    state: 'real',
    viewport,
    calls,
    initial,
    peak,
    metricUrlChanged: peak.url.includes('metric=peak_viewers'),
    metricButtonChanged: peak.peakPressed && !peak.viewerPressed,
    chartMeaningChanged: initial.chartCaption !== peak.chartCaption || initial.chartAria !== peak.chartAria,
    summaryChanged: initial.summaryText !== peak.summaryText,
    selectedDayChanged: initial.selectedDayText !== peak.selectedDayText,
    taskRequests,
    reportVisible,
    backForwardRestored: (await page.locator('.history-page').getAttribute('data-history-view')) === 'overview',
    screenshot: filename,
  }
  await context.close()
  await appendLog(result)
  return result
}

async function auditHistoryState(browser, provider, viewport, state) {
  const calls = []
  const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, reducedMotion: viewport.reducedMotion })
  await context.route('**/api/history?*', async (route) => fulfillHistory(route, provider, calls, state))
  await context.route('**/api/kick-history?*', async (route) => fulfillHistory(route, provider, calls, state))
  const page = await context.newPage()
  await page.goto(`${localOrigin}/${provider}/history/`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(900)
  const snapshot = await historySnapshot(page)
  const filename = `history-${provider}-${state}-${viewport.id}.png`
  await page.screenshot({ path: `${outputRoot}/${filename}`, fullPage: true })
  evidence.artifacts.push(filename)
  const result = { id: `history-${provider}-${state}-${viewport.id}`, provider, state, viewport, calls, snapshot, screenshot: filename }
  await context.close()
  await appendLog(result)
  return result
}

async function auditHistoryError(browser, provider, viewport) {
  const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height } })
  await context.route('**/api/history?*', (route) => route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: { message: 'P8B deterministic outage' } }) }))
  await context.route('**/api/kick-history?*', (route) => route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: { message: 'P8B deterministic outage' } }) }))
  const page = await context.newPage()
  await page.goto(`${localOrigin}/${provider}/history/`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(900)
  const snapshot = await historySnapshot(page)
  const filename = `history-${provider}-error-${viewport.id}.png`
  await page.screenshot({ path: `${outputRoot}/${filename}`, fullPage: true })
  evidence.artifacts.push(filename)
  const result = { id: `history-${provider}-error-${viewport.id}`, provider, state: 'error', viewport, snapshot, screenshot: filename }
  await context.close()
  await appendLog(result)
  return result
}

async function auditHistoryLoading(browser, provider, viewport) {
  const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, reducedMotion: 'reduce' })
  await context.route('**/api/history?*', async (route) => { await new Promise((resolve) => setTimeout(resolve, 4_000)); await fulfillHistory(route, provider, [], 'real') })
  await context.route('**/api/kick-history?*', async (route) => { await new Promise((resolve) => setTimeout(resolve, 4_000)); await fulfillHistory(route, provider, [], 'real') })
  const page = await context.newPage()
  await page.goto(`${localOrigin}/${provider}/history/`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(350)
  const snapshot = await historySnapshot(page)
  const filename = `history-${provider}-loading-${viewport.id}.png`
  await page.screenshot({ path: `${outputRoot}/${filename}`, fullPage: true })
  evidence.artifacts.push(filename)
  const result = { id: `history-${provider}-loading-${viewport.id}`, provider, state: 'loading', viewport, snapshot, screenshot: filename }
  await context.close()
  await appendLog(result)
  return result
}

async function fulfillHistory(route, provider, calls, forcedState = 'real') {
  const requestUrl = new URL(route.request().url())
  const metric = requestUrl.searchParams.get('metric') === 'peak_viewers' ? 'peak_viewers' : 'viewer_minutes'
  calls.push({ provider, metric, path: requestUrl.pathname, search: requestUrl.search })
  const payload = historyFixture(provider, metric, forcedState)
  await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(payload) })
}

function historyFixture(provider, metric, state) {
  const empty = state === 'empty' || state === 'missing'
  const days = empty ? [] : Array.from({ length: 7 }, (_, index) => {
    const day = `2026-06-${String(19 + index).padStart(2, '0')}`
    return {
      day,
      totalViewerMinutes: 120_000 + index * 31_000,
      peakViewers: 9_000 + index * 1_700,
      peakStreamerName: `${provider}-streamer-${index + 1}`,
      observedStreamCount: 20 + index,
      observedMinutes: 1_100 + index * 30,
      coverageState: state === 'partial' && index > 3 ? 'partial' : state === 'in_progress' && index === 6 ? 'in_progress' : 'good',
      topStreamers: [{ displayName: `${provider}-streamer-${index + 1}`, viewerMinutes: 70_000 + index * 5_000, peakViewers: 8_000 + index * 900 }],
    }
  })
  return {
    source: state === 'demo' ? 'demo' : 'daily_rollups',
    state,
    metric,
    platform: provider,
    period: { from: '2026-06-19', to: '2026-06-25', label: 'P8B fixture · 7 days', days: 7 },
    summary: empty ? null : {
      totalViewerMinutes: days.reduce((sum, day) => sum + day.totalViewerMinutes, 0),
      peakViewers: Math.max(...days.map((day) => day.peakViewers)),
      peakDay: days.at(-1).day,
      peakDayViewerMinutes: days.at(-1).totalViewerMinutes,
      coverageState: state,
      topStreamer: { displayName: `${provider}-leader`, viewerMinutes: 560_000, peakViewers: 18_000 },
      biggestRise: { displayName: `${provider}-riser`, changePct: 22.5, changeAbs: 40_000 },
    },
    daily: days,
    topStreamers: empty ? [] : [
      { displayName: `${provider}-leader`, viewerMinutes: 560_000, peakViewers: 18_000, avgViewers: 11_000, observedMinutes: 2_100, changePct: 12.2, changeAbs: 60_000, comparisonState: 'comparable' },
      { displayName: `${provider}-second`, viewerMinutes: 440_000, peakViewers: 15_500, avgViewers: 9_500, observedMinutes: 1_900, changePct: -3.4, changeAbs: -15_000, comparisonState: 'comparable' },
    ],
    coverage: {
      state,
      observedDays: days.length,
      missingDays: empty ? 7 : 0,
      partialDays: state === 'partial' ? 3 : 0,
      observedMinutes: days.reduce((sum, day) => sum + day.observedMinutes, 0),
      expectedMinutes: 10_080,
      affectedDays: state === 'partial' ? days.slice(4).map((day) => day.day) : [],
      notes: [state === 'empty' ? 'No retained observations are available.' : state === 'missing' ? 'Requested retained evidence is missing.' : `${state} deterministic P8B evidence.`],
    },
    readPath: state === 'demo' ? 'demo' : 'daily_rollups',
    notes: [],
  }
}

async function waitHistory(page) {
  await page.waitForFunction(() => Boolean(document.querySelector('.history-stage svg')) || Boolean(document.querySelector('.history-empty')), null, { timeout: 15_000 })
  await page.waitForTimeout(200)
}

async function historySnapshot(page) {
  return page.evaluate(() => {
    const text = (selector) => document.querySelector(selector)?.textContent?.replace(/\s+/g, ' ').trim() ?? ''
    const visiblePanels = Array.from(document.querySelectorAll('[data-history-view-panel]')).filter((node) => !node.hidden && getComputedStyle(node).display !== 'none').map((node) => node.getAttribute('data-history-view-panel'))
    const visibleArchives = Array.from(document.querySelectorAll('[data-history-archive-panel]')).filter((node) => !node.hidden && getComputedStyle(node).display !== 'none').map((node) => node.getAttribute('data-history-archive-panel'))
    const body = document.body
    return {
      url: location.href,
      bodyState: document.querySelector('.history-page')?.getAttribute('data-history-state') ?? null,
      statePill: text('[data-history-state-pill]'),
      feedback: text('[data-history-feedback]'),
      summaryText: text('[data-history-summary]'),
      chartCaption: text('.history-chart-caption'),
      chartAria: document.querySelector('.history-stage svg')?.getAttribute('aria-label') ?? null,
      yLabelCount: document.querySelectorAll('.history-y-label').length,
      xLabelCount: document.querySelectorAll('.history-x-label').length,
      dayControlCount: document.querySelectorAll('[data-history-day][role="button"]').length,
      selectedDayText: text('[data-history-selected-day]'),
      viewerPressed: document.querySelector('[data-history-metric="viewer_minutes"]')?.getAttribute('aria-pressed') === 'true',
      peakPressed: document.querySelector('[data-history-metric="peak_viewers"]')?.getAttribute('aria-pressed') === 'true',
      visiblePanels,
      visibleArchives,
      overflow: Math.max(0, body.scrollWidth - body.clientWidth),
    }
  })
}

function classifyFindings(current) {
  const findings = []
  const production = current.productionMatrix
  const p0Routes = production.filter((scenario) => (scenario.status ?? 0) >= 500 || scenario.providerCrossing.length)
  if (p0Routes.length) {
    findings.push({
      id: 'P8B-P0-PUBLIC-RUNTIME',
      severity: 'P0',
      title: 'Public runtime or provider-separation failure',
      reproduction: p0Routes.map((scenario) => scenario.id),
      owner: 'affected route owner from P8A inventory',
      missingAssertion: 'existing gates did not prevent the observed production failure',
    })
  }

  const historyReal = current.historyScenarios.filter((scenario) => scenario.state === 'real')
  const metricFailures = historyReal.filter((scenario) => !scenario.metricUrlChanged || !scenario.metricButtonChanged || !scenario.chartMeaningChanged || !scenario.summaryChanged || !scenario.selectedDayChanged)
  if (metricFailures.length) {
    findings.push({
      id: 'P8B-P1-HISTORY-METRIC-SYNCHRONIZATION',
      severity: 'P1',
      title: 'History metric switching does not update every metric-dependent surface',
      routes: ['/twitch/history/', '/kick/history/'],
      states: ['real'],
      viewports: metricFailures.map((scenario) => scenario.viewport.id),
      reproduction: metricFailures.map((scenario) => ({
        scenario: scenario.id,
        metricUrlChanged: scenario.metricUrlChanged,
        metricButtonChanged: scenario.metricButtonChanged,
        chartMeaningChanged: scenario.chartMeaningChanged,
        summaryChanged: scenario.summaryChanged,
        selectedDayChanged: scenario.selectedDayChanged,
      })),
      owner: ['apps/web/src/live/history-current-shell-entry.ts', 'apps/web/src/live/history-overview.ts'],
      existingGate: ['history browser workflows', 'history production acceptance'],
      missingAssertion: 'no permanent gate requires chart, summary, selected-day, ranking, archives, and outputs to change together for different metrics',
      next: 'P9H0 then P9H1',
    })
  }

  const chartFailures = historyReal.filter((scenario) => scenario.peak.yLabelCount < 2 || scenario.peak.xLabelCount < 2 || scenario.peak.dayControlCount < 1 || !scenario.peak.chartAria)
  if (chartFailures.length) {
    findings.push({
      id: 'P8B-P1-HISTORY-CHART-INTERPRETABILITY',
      severity: 'P1',
      title: 'History chart lacks required readable or accessible interpretation signals',
      routes: ['/twitch/history/', '/kick/history/'],
      reproduction: chartFailures.map((scenario) => scenario.id),
      owner: ['apps/web/src/live/history-current-shell-entry.ts', 'apps/web/src/history-page.css'],
      missingAssertion: 'chart gates do not permanently require numeric scale, date ticks, unit, and day controls together',
      next: 'P9H0 then P9H2',
    })
  }

  const historyOverflow = current.historyScenarios.filter((scenario) => (scenario.snapshot?.overflow ?? scenario.peak?.overflow ?? 0) > 2)
  const publicOverflow = production.filter((scenario) => scenario.overflow > 2)
  if (historyOverflow.length || publicOverflow.length) {
    findings.push({
      id: 'P8B-P1-RESPONSIVE-OVERFLOW',
      severity: 'P1',
      title: 'One or more primary public surfaces overflow at required viewports',
      reproduction: [...historyOverflow.map((scenario) => scenario.id), ...publicOverflow.map((scenario) => scenario.id)],
      owner: 'affected route styles from P8A inventory',
      missingAssertion: 'no consolidated route matrix rejects page-level overflow at all required widths',
      next: 'narrow P0/P1 repair branch or P9H5 for History',
    })
  }

  const touchFailures = production.filter((scenario) => scenario.viewport.width <= 390 && scenario.smallControls.length)
  if (touchFailures.length) {
    findings.push({
      id: 'P8B-P2-SMALL-INTERACTIVE-TARGETS',
      severity: 'P2',
      title: 'Some visible button-like controls are below the 44px audit target',
      reproduction: touchFailures.map((scenario) => ({ scenario: scenario.id, controls: scenario.smallControls.slice(0, 5) })),
      owner: 'shared and route-specific responsive styles',
      missingAssertion: 'cross-route mobile target-size coverage is fragmented',
      next: 'Phase 10 unless required by a P1 repair',
    })
  }

  const readinessOmissions = ['twitch-watchlist', 'kick-watchlist']
  findings.push({
    id: 'P8B-P2-WATCHLIST-PUBLIC-READINESS-OMISSION',
    severity: 'P2',
    title: 'Built Watchlist routes are omitted from Public Readiness configuration',
    routes: readinessOmissions,
    reproduction: 'P8A inventory and public-readiness configuration comparison',
    owner: ['apps/web/scripts/public-readiness-audit.mjs'],
    existingGate: ['Watchlist dedicated acceptance'],
    missingAssertion: 'general Public Readiness does not enumerate both Watchlist routes',
    next: 'Phase 10 or narrow maintenance PR after P9H0 entry',
  })

  findings.push({
    id: 'P8B-P2-PRODUCTION-SMOKE-OMISSIONS',
    severity: 'P2',
    title: 'General Production Smoke omits several owned public routes',
    routes: ['/about/', '/support/', '/changelog/', '/twitch/channel/', '/kick/channel/', '/twitch/watchlist/', '/kick/watchlist/'],
    reproduction: 'P8A inventory and Production Smoke route-list comparison',
    owner: ['.github/workflows/production-smoke.yml'],
    existingGate: ['Channel dedicated acceptance', 'Watchlist dedicated acceptance'],
    missingAssertion: 'general smoke does not exercise all owned route groups',
    next: 'Phase 11 acceptance-matrix consolidation',
  })

  const missingConfirmed = current.missingSurfaceProbes.filter((probe) => probe.confirmedMissing)
  if (missingConfirmed.length) {
    findings.push({
      id: 'P8B-P2-RELEASE-POLICY-SURFACES-MISSING',
      severity: 'P2',
      title: 'Repository-owned release-policy routes are absent',
      routes: missingConfirmed.map((probe) => probe.route),
      reproduction: missingConfirmed.map((probe) => ({ route: probe.route, status: probe.status, title: probe.title })),
      owner: ['Phase 12 release-readiness program'],
      missingAssertion: 'release readiness cannot pass without dedicated policy and disclosure surfaces',
      next: 'R12A; do not interrupt P9H0 unless external compliance requires earlier action',
    })
  }

  const unlabeled = production.filter((scenario) => scenario.unlabeledControls.length)
  if (unlabeled.length) {
    findings.push({
      id: 'P8B-P2-UNLABELED-CONTROLS',
      severity: 'P2',
      title: 'Visible controls without accessible names were found',
      reproduction: unlabeled.map((scenario) => ({ scenario: scenario.id, controls: scenario.unlabeledControls })),
      owner: 'affected route owner from P8A inventory',
      missingAssertion: 'no consolidated public-route accessible-name audit',
      next: 'Phase 10 or narrow repair when blocking P1 acceptance',
    })
  }

  return findings
}

async function saveEvidence() {
  await writeFile(`${outputRoot}/public-browser-audit-evidence.json`, `${JSON.stringify(evidence, null, 2)}\n`)
}

async function appendLog(value) {
  await appendFile(`${outputRoot}/public-browser-audit.log`, `${JSON.stringify(value)}\n`)
}

function safe(value) {
  return String(value).replace(/^\/+|\/+$/g, '').replace(/[^a-z0-9-]+/gi, '-').replace(/-+/g, '-').toLowerCase() || 'root'
}

function stripOrigin(value) {
  return String(value).replace(/\/$/, '')
}
