import assert from 'node:assert/strict'
import { appendFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { chromium } from 'playwright'

const origin = strip(process.env.HISTORY_H7_ORIGIN || 'https://preview-history-ui-h7-acceptance.viewloom.pages.dev')
const expectedEnvironment = process.env.HISTORY_H7_EXPECTED_ENVIRONMENT || 'preview'
const expectedBranch = process.env.HISTORY_H7_EXPECTED_BRANCH || 'preview-history-ui-h7-acceptance'
const expectedSha = process.env.HISTORY_H7_EXPECTED_SHA || process.env.GITHUB_SHA || ''
const out = resolve(process.env.HISTORY_H7_ARTIFACT_DIR || 'artifacts/history-ui-h7')
const logPath = resolve(out, 'history-ui-h7.log')
const evidencePath = resolve(out, 'history-ui-h7-evidence.json')

mkdirSync(out, { recursive: true })

const evidence = {
  schema: 'viewloom-history-ui-h7-hosted-acceptance-v1',
  phase: 'P9H7',
  origin,
  expectedEnvironment,
  expectedBranch,
  expectedSha,
  result: 'running',
  deployment: null,
  providers: {},
  scenarios: [],
  diagnostics: [],
}

try {
  check(expectedSha.length >= 40, 'P9H7 requires an exact expected SHA.')
  evidence.deployment = await waitForDeployment()
  evidence.providers.twitch = await inspectProvider('twitch')
  evidence.providers.kick = await inspectProvider('kick')

  const browser = await chromium.launch({ headless: true })
  try {
    evidence.scenarios.push(await verifyDesktop(browser))
    evidence.scenarios.push(await verifyTablet(browser))
    evidence.scenarios.push(await verifyMobileReport(browser))
    evidence.scenarios.push(await verifyMobileChart(browser))
    evidence.scenarios.push(await verifyForcedColors(browser))
  } finally {
    await browser.close()
  }

  evidence.result = 'pass'
  writeEvidence()
  log('History P9H7 hosted acceptance passed.')
} catch (error) {
  evidence.result = 'fail'
  evidence.error = message(error)
  writeEvidence()
  throw error
}

async function waitForDeployment() {
  let last = null
  for (let attempt = 1; attempt <= 60; attempt += 1) {
    try {
      const response = await fetch(`${origin}/deployment.json?p9h7=${Date.now()}`, {
        headers: { accept: 'application/json', 'cache-control': 'no-cache' },
        cache: 'no-store',
      })
      const text = await response.text()
      log(`deployment ${attempt}/60: ${response.status} ${text.slice(0, 500)}`)
      if (response.ok) {
        last = JSON.parse(text)
        if (
          last?.schema === 'viewloom-deployment-v1'
          && last?.environment === expectedEnvironment
          && last?.branch === expectedBranch
          && last?.commit_sha === expectedSha
        ) {
          check(typeof last.pages_url === 'string' && last.pages_url.startsWith('https://'), 'Matching deployment has no Pages URL.')
          return last
        }
      }
    } catch (error) {
      log(`deployment ${attempt}/60 failed: ${message(error)}`)
    }
    await delay(10_000)
  }
  throw new Error(`Matching ${expectedEnvironment} deployment was not observed. Last deployment: ${JSON.stringify(last)}`)
}

async function inspectProvider(provider) {
  const paths = providerPaths(provider)
  const [status, viewerMinutes, peakViewers] = await Promise.all([
    fetchJson(paths.status),
    fetchJson(`${paths.history}?period=30d&metric=viewer_minutes&p9h7=${Date.now()}`),
    fetchJson(`${paths.history}?period=30d&metric=peak_viewers&p9h7=${Date.now()}`),
  ])

  check(status?.platform === provider, `${provider}: status platform mismatch.`)
  check(status?.storage?.binding === paths.binding, `${provider}: status binding mismatch.`)
  check(status?.storage?.database === paths.database, `${provider}: status database mismatch.`)
  check(!status?.error, `${provider}: status exposes an error.`)
  check(Number(status?.latestSnapshot?.observedCount ?? 0) > 0, `${provider}: status has no observed streams.`)

  const collectorState = String(status?.collector?.state ?? '')
  if (provider === 'twitch') check(collectorState === 'ok', `twitch: collector state ${collectorState}.`)
  else check(collectorState === 'snapshot_available', `kick: collector state ${collectorState}.`)

  const viewerSummary = inspectHistoryPayload(viewerMinutes, provider, 'viewer_minutes')
  const peakSummary = inspectHistoryPayload(peakViewers, provider, 'peak_viewers')
  const summary = {
    binding: status.storage.binding,
    database: status.storage.database,
    collectorState,
    observedCount: status.latestSnapshot.observedCount,
    sourceMode: status.sourceMode ?? null,
    state: status.state ?? null,
    viewerMinutes: viewerSummary,
    peakViewers: peakSummary,
  }
  log(`${provider} provider evidence: ${JSON.stringify(summary)}`)
  return summary
}

function inspectHistoryPayload(payload, provider, metric) {
  check(payload?.platform === provider, `${provider} ${metric}: platform mismatch.`)
  check(payload?.source === 'real', `${provider} ${metric}: source is ${payload?.source ?? 'missing'}, expected real.`)
  check(payload?.metric === metric, `${provider} ${metric}: metric mismatch.`)
  check(['fresh', 'partial', 'stale', 'in_progress'].includes(String(payload?.state)), `${provider} ${metric}: unusable state ${payload?.state ?? 'missing'}.`)
  const daily = Array.isArray(payload?.daily) ? payload.daily : []
  const observedDays = daily.filter((day) => day && day.coverageState !== 'missing').length
  const topStreamers = Array.isArray(payload?.topStreamers) ? payload.topStreamers.length : 0
  check(observedDays > 0, `${provider} ${metric}: no retained observed day.`)
  check(topStreamers > 0, `${provider} ${metric}: no retained top streamers.`)
  return {
    source: payload.source,
    state: payload.state,
    metric: payload.metric,
    requestedDays: daily.length,
    observedDays,
    topStreamers,
  }
}

async function verifyDesktop(browser) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
  const page = await context.newPage()
  const calls = trackRequests(page)
  await page.goto(`${origin}/twitch/history/?period=30d&metric=viewer_minutes&p9h7=${Date.now()}`, {
    waitUntil: 'domcontentloaded',
    timeout: 30_000,
  })
  await ready(page, 'viewer_minutes')
  await assertPublicIdentity(page, 'twitch')
  await assertLayout(page, 'twitch desktop 1440')
  await assertSkipEntry(page, 'twitch desktop 1440')
  await assertChartKeyboard(page, 'twitch desktop 1440')
  assertProviderCalls(calls, 'twitch', 1, 'twitch desktop initial')

  const beforeMetric = historyCalls(calls).length
  await page.locator('[data-history-metric="peak_viewers"]').click()
  await ready(page, 'peak_viewers')
  check(new URL(page.url()).searchParams.get('metric') === 'peak_viewers', 'twitch desktop: metric URL did not update.')
  check(await page.locator('[data-history-summary]').getAttribute('data-history-metric') === 'peak_viewers', 'twitch desktop: Summary metric stayed stale.')
  check(historyCalls(calls).length === beforeMetric + 1, 'twitch desktop: metric change did not make exactly one History request.')
  assertProviderCalls(calls, 'twitch', 2, 'twitch desktop after metric change')

  const beforeTasks = historyCalls(calls).length
  await clickTask(page, 'archives')
  for (const archive of ['daily', 'peaks', 'battles']) await clickArchive(page, archive)
  await clickTask(page, 'report')
  await assertPublishing(page, 'Twitch', 'Peak viewers', 'twitch desktop')
  check(historyCalls(calls).length === beforeTasks, 'twitch desktop: task/archive switching refetched History.')

  await page.goBack()
  await page.waitForFunction(() => document.querySelector('.history-page')?.getAttribute('data-history-view') === 'archives')
  await page.goForward()
  await page.waitForFunction(() => document.querySelector('.history-page')?.getAttribute('data-history-view') === 'report')
  check(historyCalls(calls).length === beforeTasks, 'twitch desktop: Back/Forward refetched History.')

  await page.screenshot({ path: resolve(out, 'twitch-1440-production.png'), fullPage: true })
  const state = await snapshot(page)
  await context.close()
  return { id: 'twitch-desktop-1440-hosted', result: 'pass', provider: 'twitch', viewport: 1440, calls, state }
}

async function verifyTablet(browser) {
  const context = await browser.newContext({ viewport: { width: 820, height: 1000 } })
  const page = await context.newPage()
  const calls = trackRequests(page)
  await page.goto(`${origin}/kick/history/?period=30d&metric=peak_viewers&view=archives&archive=battles&p9h7=${Date.now()}`, {
    waitUntil: 'domcontentloaded',
    timeout: 30_000,
  })
  await ready(page, 'peak_viewers')
  await assertPublicIdentity(page, 'kick')
  await assertLayout(page, 'kick tablet 820')
  await assertSkipEntry(page, 'kick tablet 820')
  check(await page.locator('.history-page').getAttribute('data-history-view') === 'archives', 'kick tablet: direct task state was not restored.')
  check(await page.locator('.history-page').getAttribute('data-history-archive-view') === 'battles', 'kick tablet: direct archive state was not restored.')
  check(await visibleCount(page, '[data-history-view-panel]') === 1, 'kick tablet: multiple task panels visible.')
  check(await visibleCount(page, '[data-history-archive-panel]') === 1, 'kick tablet: multiple archive panels visible.')
  assertProviderCalls(calls, 'kick', 1, 'kick tablet')
  await page.screenshot({ path: resolve(out, 'kick-820-production.png'), fullPage: true })
  const state = await snapshot(page)
  await context.close()
  return { id: 'kick-tablet-820-hosted', result: 'pass', provider: 'kick', viewport: 820, calls, state }
}

async function verifyMobileReport(browser) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
  const page = await context.newPage()
  const calls = trackRequests(page)
  await page.goto(`${origin}/kick/history/?period=30d&metric=peak_viewers&view=report&p9h7=${Date.now()}`, {
    waitUntil: 'domcontentloaded',
    timeout: 30_000,
  })
  await ready(page, 'peak_viewers')
  await assertPublicIdentity(page, 'kick')
  await assertLayout(page, 'kick mobile 390')
  await assertPublishing(page, 'Kick', 'Peak viewers', 'kick mobile 390')
  const beforeShare = historyCalls(calls).length
  await page.locator('[data-history-share-toggle]').click()
  await page.waitForFunction(() => document.querySelector('[data-history-share-toggle]')?.getAttribute('aria-expanded') === 'true')
  check(historyCalls(calls).length === beforeShare, 'kick mobile: share preview refetched History.')
  await assertNoOverflow(page, 'kick mobile 390 open share preview')
  assertProviderCalls(calls, 'kick', 1, 'kick mobile 390')
  await page.screenshot({ path: resolve(out, 'kick-390-production.png'), fullPage: true })
  const state = await snapshot(page)
  await context.close()
  return { id: 'kick-mobile-390-hosted', result: 'pass', provider: 'kick', viewport: 390, calls, state }
}

async function verifyMobileChart(browser) {
  const context = await browser.newContext({ viewport: { width: 360, height: 800 }, isMobile: true, hasTouch: true })
  const page = await context.newPage()
  const calls = trackRequests(page)
  await page.goto(`${origin}/twitch/history/?period=30d&metric=viewer_minutes&p9h7=${Date.now()}`, {
    waitUntil: 'domcontentloaded',
    timeout: 30_000,
  })
  await ready(page, 'viewer_minutes')
  await assertPublicIdentity(page, 'twitch')
  await assertLayout(page, 'twitch mobile 360')
  const hit = page.locator('[data-history-day] .history-bar-hit').first()
  await hit.tap()
  await page.waitForFunction(() => document.querySelector('[data-history-day][aria-current="date"]'))
  check(new URL(page.url()).searchParams.has('day'), 'twitch mobile: touch day did not update URL state.')
  assertProviderCalls(calls, 'twitch', 1, 'twitch mobile 360')
  await page.screenshot({ path: resolve(out, 'twitch-360-production.png'), fullPage: true })
  const state = await snapshot(page)
  await context.close()
  return { id: 'twitch-mobile-360-hosted', result: 'pass', provider: 'twitch', viewport: 360, calls, state }
}

async function verifyForcedColors(browser) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    reducedMotion: 'reduce',
    forcedColors: 'active',
  })
  const page = await context.newPage()
  const calls = trackRequests(page)
  await page.goto(`${origin}/twitch/history/?period=7d&metric=viewer_minutes&p9h7=${Date.now()}`, {
    waitUntil: 'domcontentloaded',
    timeout: 30_000,
  })
  await ready(page, 'viewer_minutes')
  await assertLayout(page, 'twitch forced-colors 390')
  check(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches), 'forced-colors scenario: reduced motion inactive.')
  check(await page.evaluate(() => matchMedia('(forced-colors: active)').matches), 'forced-colors scenario: forced colors inactive.')
  assertProviderCalls(calls, 'twitch', 1, 'twitch forced-colors 390')
  await page.screenshot({ path: resolve(out, 'twitch-390-forced-colors.png'), fullPage: true })
  const state = await snapshot(page)
  await context.close()
  return { id: 'twitch-forced-colors-390-hosted', result: 'pass', provider: 'twitch', viewport: 390, calls, state }
}

async function ready(page, metric) {
  await page.waitForFunction((value) => {
    const root = document.querySelector('.history-page')
    return root?.getAttribute('data-history-p9h5-ready') === 'true'
      && root?.getAttribute('data-history-p9h4b-ready') === 'true'
      && document.querySelector('.history-stage')?.getAttribute('data-history-chart-ready') === 'true'
      && document.querySelector('.history-stage')?.getAttribute('data-history-chart-metric') === value
      && document.querySelector('[data-history-summary]')?.getAttribute('data-history-metric') === value
      && document.querySelector('[data-history-publish-groups-ready="true"]')
      && document.querySelector('[data-history-chart-keyboard-target]')
  }, metric, { timeout: 30_000 })
}

async function assertPublicIdentity(page, provider) {
  const label = provider === 'kick' ? 'Kick' : 'Twitch'
  check((await page.title()).includes(label) && (await page.title()).includes('History'), `${provider}: public title mismatch.`)
  check(await page.locator('link[rel="canonical"]').getAttribute('href') === `https://vl.badjoke-lab.com/${provider}/history/`, `${provider}: canonical URL mismatch.`)
  check(await page.locator('meta[property="og:url"]').getAttribute('content') === `https://vl.badjoke-lab.com/${provider}/history/`, `${provider}: og:url mismatch.`)
}

async function assertLayout(page, label) {
  const state = await snapshot(page)
  check(state.bodyOverflow <= 2, `${label}: page horizontal overflow ${state.bodyOverflow}px.`)
  check(state.mainWidth <= state.viewportWidth + 2, `${label}: History main exceeds viewport.`)
  check(state.taskCount === 3, `${label}: task controls missing.`)
  check(state.archiveCount === 3, `${label}: archive controls missing.`)
  check(state.yTicks >= 3, `${label}: chart numeric scale is missing.`)
  check(state.xTicks >= 2, `${label}: chart date ticks are missing.`)
  check(/UTC daily rollup/i.test(state.caption), `${label}: UTC chart context missing.`)
  check(state.minPeriodHeight >= 44, `${label}: period target ${state.minPeriodHeight}px.`)
  check(state.minMetricHeight >= 44, `${label}: metric target ${state.minMetricHeight}px.`)
  check(state.minTaskHeight >= 44, `${label}: task target ${state.minTaskHeight}px.`)
  check(state.minArchiveHeight >= 48, `${label}: archive target ${state.minArchiveHeight}px.`)
  check(state.minPublishHeight >= 48, `${label}: publishing target ${state.minPublishHeight}px.`)
}

async function assertSkipEntry(page, label) {
  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
  })
  check(await page.evaluate(() => document.activeElement === document.body), `${label}: initial focus is not body.`)
  await page.keyboard.press('Tab')
  check(await page.evaluate(() => document.activeElement?.hasAttribute('data-history-skip-link') ?? false), `${label}: first Tab did not reach History skip link.`)
  const style = await page.locator('[data-history-skip-link]').evaluate((node) => {
    const value = getComputedStyle(node)
    return { outlineStyle: value.outlineStyle, outlineWidth: value.outlineWidth }
  })
  check(style.outlineStyle !== 'none' && style.outlineWidth !== '0px', `${label}: skip-link focus is not visible.`)
  await page.keyboard.press('Enter')
  await page.waitForFunction(() => document.activeElement?.id === 'history-main')
}

async function assertChartKeyboard(page, label) {
  const days = await page.locator('[data-history-day]').evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-history-day')).filter(Boolean))
  check(days.length > 0, `${label}: no chart days.`)
  await focusStableKeyboard(page)
  await page.locator('[data-history-chart-keyboard-target]').press('Home')
  await waitForDay(page, days[0])
  if (days.length > 1) {
    await focusStableKeyboard(page)
    await page.locator('[data-history-chart-keyboard-target]').press('ArrowRight')
    await waitForDay(page, days[1])
  }
}

async function focusStableKeyboard(page) {
  await page.waitForFunction(async () => {
    const keyboard = document.querySelector('[data-history-chart-keyboard-target]')
    if (!(keyboard instanceof HTMLButtonElement)) return false
    keyboard.focus()
    await new Promise((resolveFrame) => requestAnimationFrame(() => requestAnimationFrame(resolveFrame)))
    return keyboard.isConnected && document.activeElement === keyboard
  })
}

async function waitForDay(page, day) {
  await page.waitForFunction((value) => new URL(location.href).searchParams.get('day') === value
    && document.querySelector('[data-history-day][aria-current="date"]')?.getAttribute('data-history-day') === value
    && document.querySelector('[data-history-chart-keyboard-target]')?.getAttribute('data-history-keyboard-day') === value, day)
}

async function clickTask(page, task) {
  await page.locator(`button[data-history-view="${task}"]`).click()
  await page.waitForFunction((value) => document.querySelector('.history-page')?.getAttribute('data-history-view') === value, task)
}

async function clickArchive(page, archive) {
  await page.locator(`button[data-history-archive-view="${archive}"]`).click()
  await page.waitForFunction((value) => document.querySelector('.history-page')?.getAttribute('data-history-archive-view') === value, archive)
  check(await visibleCount(page, '[data-history-archive-panel]') === 1, `${archive}: multiple archive panels visible.`)
}

async function assertPublishing(page, provider, metric, label) {
  const state = await page.evaluate(() => ({
    groups: [...document.querySelectorAll('.history-publish-group')].map((node) => ({
      text: node.textContent?.replace(/\s+/g, ' ').trim() ?? '',
      buttons: node.querySelectorAll('button').length,
    })),
    context: Object.fromEntries([...document.querySelectorAll('[data-history-publish-context-value]')]
      .map((node) => [node.getAttribute('data-history-publish-context-value'), node.textContent?.replace(/\s+/g, ' ').trim() ?? ''])),
    limitation: document.querySelector('[data-history-publish-context] > p')?.textContent?.replace(/\s+/g, ' ').trim() ?? '',
  }))
  check(state.groups.length === 3, `${label}: publishing groups incomplete.`)
  check(JSON.stringify(state.groups.map((group) => group.buttons)) === JSON.stringify([1, 2, 2]), `${label}: publishing buttons grouped incorrectly.`)
  check(state.context.provider === provider, `${label}: publishing provider mismatch.`)
  check(new RegExp(metric, 'i').test(state.context.metric ?? ''), `${label}: publishing metric mismatch.`)
  check(/not a provider-wide total/i.test(state.limitation), `${label}: bounded-scope limitation missing.`)
}

async function snapshot(page) {
  return page.evaluate(() => {
    const heights = (selector) => [...document.querySelectorAll(selector)].map((node) => {
      const rectHeight = node.getBoundingClientRect().height
      const minHeight = Number.parseFloat(getComputedStyle(node).minHeight) || 0
      return Math.max(rectHeight, minHeight)
    })
    const min = (values) => values.length ? Math.min(...values) : 0
    return {
      url: `${location.pathname}${location.search}`,
      view: document.querySelector('.history-page')?.getAttribute('data-history-view') ?? '',
      archive: document.querySelector('.history-page')?.getAttribute('data-history-archive-view') ?? '',
      bodyOverflow: Math.max(0, document.documentElement.scrollWidth - innerWidth),
      viewportWidth: innerWidth,
      mainWidth: document.querySelector('#history-main')?.getBoundingClientRect().width ?? 0,
      taskCount: document.querySelectorAll('button[data-history-view]').length,
      archiveCount: document.querySelectorAll('button[data-history-archive-view]').length,
      yTicks: document.querySelectorAll('.history-y-label').length,
      xTicks: document.querySelectorAll('.history-x-label').length,
      caption: document.querySelector('.history-chart-caption')?.textContent?.replace(/\s+/g, ' ').trim() ?? '',
      selectedDay: document.querySelector('[data-history-day][aria-current="date"]')?.getAttribute('data-history-day') ?? '',
      minPeriodHeight: min(heights('[data-history-period]')),
      minMetricHeight: min(heights('[data-history-metric]')),
      minTaskHeight: min(heights('button[data-history-view]')),
      minArchiveHeight: min(heights('button[data-history-archive-view]')),
      minPublishHeight: min(heights('.history-publish-group button')),
      p9h5Owner: document.querySelector('.history-page')?.getAttribute('data-history-accessibility-owner') ?? '',
    }
  })
}

function trackRequests(page) {
  const calls = []
  page.on('request', (request) => {
    const url = new URL(request.url())
    if (url.origin === origin && url.pathname.startsWith('/api/')) calls.push(`${url.pathname}${url.search}`)
  })
  page.on('console', (entry) => {
    if (entry.type() === 'error') evidence.diagnostics.push({ type: 'console.error', text: entry.text() })
  })
  page.on('pageerror', (error) => evidence.diagnostics.push({ type: 'pageerror', text: error.message }))
  return calls
}

function historyCalls(calls) {
  return calls.filter((value) => value.startsWith('/api/history?') || value.startsWith('/api/kick-history?'))
}

function assertProviderCalls(calls, provider, expectedHistoryCount, label) {
  const history = historyCalls(calls)
  check(history.length === expectedHistoryCount, `${label}: expected ${expectedHistoryCount} History requests, got ${history.length}: ${JSON.stringify(history)}`)
  const forbidden = provider === 'twitch'
    ? calls.filter((value) => value.startsWith('/api/kick-'))
    : calls.filter((value) => value.startsWith('/api/history?') || value.startsWith('/api/twitch-'))
  check(forbidden.length === 0, `${label}: crossed provider APIs ${JSON.stringify(forbidden)}.`)
}

async function visibleCount(page, selector) {
  return page.locator(selector).evaluateAll((nodes) => nodes.filter((node) => {
    if (!(node instanceof HTMLElement) || node.hidden) return false
    const style = getComputedStyle(node)
    return style.display !== 'none' && style.visibility !== 'hidden' && node.getClientRects().length > 0
  }).length)
}

async function assertNoOverflow(page, label) {
  const size = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, innerWidth }))
  check(size.scrollWidth <= size.innerWidth + 2, `${label}: overflow ${JSON.stringify(size)}.`)
}

async function fetchJson(path) {
  const url = `${origin}${path}`
  const response = await fetch(url, {
    headers: { accept: 'application/json', 'cache-control': 'no-cache' },
    cache: 'no-store',
  })
  const text = await response.text()
  log(`${response.status} ${url} ${text.slice(0, 300)}`)
  check(response.ok, `Hosted request failed: ${response.status} ${url}`)
  try {
    return JSON.parse(text)
  } catch {
    throw new Error(`Hosted response is not JSON: ${url}`)
  }
}

function providerPaths(provider) {
  return provider === 'kick'
    ? { status: '/api/kick-status', history: '/api/kick-history', binding: 'DB_KICK_HOT', database: 'vl_kick_hot' }
    : { status: '/api/twitch-status', history: '/api/history', binding: 'DB_TWITCH_HOT', database: 'vl_twitch_hot' }
}

function check(condition, text) {
  assert.ok(condition, text)
}

function strip(value) {
  return String(value).replace(/\/$/, '')
}

function delay(ms) {
  return new Promise((resolveDelay) => setTimeout(resolveDelay, ms))
}

function message(error) {
  return error instanceof Error ? `${error.name}: ${error.message}` : String(error)
}

function log(value) {
  const line = `[${new Date().toISOString()}] ${typeof value === 'string' ? value : JSON.stringify(value)}\n`
  appendFileSync(logPath, line)
  process.stdout.write(line)
}

function writeEvidence() {
  writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`)
}
