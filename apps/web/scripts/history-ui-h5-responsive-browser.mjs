import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { chromium } from 'playwright'
import { historyPayload } from './history-peak-archive-fixture.mjs'

const base = process.env.HISTORY_H5_BASE_URL ?? 'http://127.0.0.1:4173'
const out = resolve(process.env.HISTORY_H5_ARTIFACT_DIR ?? 'artifacts/history-ui-h5')
mkdirSync(out, { recursive: true })

const evidence = {
  schema: 'viewloom-history-ui-h5-responsive-v1',
  phase: 'P9H5',
  candidateHead: process.env.GITHUB_HEAD_SHA ?? process.env.GITHUB_SHA ?? null,
  checkpoint: 'start',
  scenarios: [],
  result: 'running',
}

async function installRoutes(context, calls) {
  const reply = async (route, provider) => {
    const url = new URL(route.request().url())
    calls.push({ provider, path: `${url.pathname}${url.search}` })
    const body = historyPayload(provider, true)
    body.metric = url.searchParams.get('metric') === 'peak_viewers' ? 'peak_viewers' : 'viewer_minutes'
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) })
  }
  await context.route('**/api/kick-history*', (route) => reply(route, 'kick'))
  await context.route('**/api/history*', (route) => reply(route, 'twitch'))
}

async function ready(page) {
  await page.waitForFunction(() => {
    const historyPage = document.querySelector('.history-page')
    const stage = document.querySelector('.history-stage')
    const selectedDay = document.querySelector('[data-history-day][aria-current="date"]')?.getAttribute('data-history-day') ?? ''
    const keyboardDay = document.querySelector('[data-history-chart-keyboard-target]')?.getAttribute('data-history-keyboard-day') ?? ''
    const urlDay = new URL(location.href).searchParams.get('day') ?? ''
    return historyPage?.getAttribute('data-history-p9h5-ready') === 'true'
      && historyPage?.getAttribute('data-history-p9h4b-ready') === 'true'
      && stage?.getAttribute('data-history-chart-ready') === 'true'
      && Boolean(selectedDay)
      && selectedDay === keyboardDay
      && selectedDay === urlDay
  }, null, { timeout: 15_000 })
}

async function snapshot(page) {
  return page.evaluate(() => {
    const heights = (selector) => [...document.querySelectorAll(selector)].map((node) => {
      const rectHeight = node.getBoundingClientRect().height
      const minHeight = Number.parseFloat(getComputedStyle(node).minHeight) || 0
      return Math.max(rectHeight, minHeight)
    })
    const min = (values) => values.length ? Math.min(...values) : 0
    const focusable = document.querySelector('[data-history-period="30d"]')
    if (focusable instanceof HTMLElement) focusable.focus()
    const focusStyle = focusable ? getComputedStyle(focusable) : null
    const chart = document.querySelector('.history-stage')
    const selected = document.querySelector('[data-history-day][aria-current="date"]')
    return {
      url: `${location.pathname}${location.search}${location.hash}`,
      activeTag: document.activeElement?.tagName ?? '',
      activeId: document.activeElement?.id ?? '',
      activeSkip: document.activeElement?.hasAttribute('data-history-skip-link') ?? false,
      bodyOverflow: Math.max(0, document.documentElement.scrollWidth - innerWidth),
      mainWidth: document.querySelector('#history-main')?.getBoundingClientRect().width ?? 0,
      viewportWidth: innerWidth,
      chartClientWidth: chart?.clientWidth ?? 0,
      chartScrollWidth: chart?.scrollWidth ?? 0,
      chartOverflowX: chart ? getComputedStyle(chart).overflowX : '',
      selectedDay: selected?.getAttribute('data-history-day') ?? '',
      selectedHasAria: selected?.getAttribute('aria-current') === 'date',
      focusOutlineStyle: focusStyle?.outlineStyle ?? '',
      focusOutlineWidth: focusStyle?.outlineWidth ?? '',
      minPeriodHeight: min(heights('[data-history-period]')),
      minMetricHeight: min(heights('[data-history-metric]')),
      minTaskHeight: min(heights('button[data-history-view]')),
      minArchiveHeight: min(heights('button[data-history-archive-view]')),
      minPublishHeight: min(heights('.history-publish-group button')),
      taskCount: document.querySelectorAll('button[data-history-view]').length,
      archiveCount: document.querySelectorAll('button[data-history-archive-view]').length,
      keyboardTargets: document.querySelectorAll('[data-history-chart-keyboard-target]').length,
      p9h5Owner: document.querySelector('.history-page')?.getAttribute('data-history-accessibility-owner') ?? '',
      reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
      forcedColors: matchMedia('(forced-colors: active)').matches,
    }
  })
}

async function keyboardState(page) {
  return page.evaluate(() => ({
    urlDay: new URL(location.href).searchParams.get('day') ?? '',
    selectedDay: document.querySelector('[data-history-day][aria-current="date"]')?.getAttribute('data-history-day') ?? '',
    keyboardDay: document.querySelector('[data-history-chart-keyboard-target]')?.getAttribute('data-history-keyboard-day') ?? '',
    chartReady: document.querySelector('.history-stage')?.getAttribute('data-history-chart-ready') ?? '',
    keyboardActive: document.querySelector('.history-stage')?.getAttribute('data-history-keyboard-active') ?? '',
  }))
}

async function assertSkipEntry(page, label) {
  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
  })
  assert.equal(await page.evaluate(() => document.activeElement === document.body), true, `${label}: initial focus is not body`)
  await page.keyboard.press('Tab')
  assert.equal(await page.evaluate(() => document.activeElement?.hasAttribute('data-history-skip-link') ?? false), true, `${label}: first Tab did not reach History skip link`)
  const style = await page.locator('[data-history-skip-link]').evaluate((node) => {
    const value = getComputedStyle(node)
    return { outlineStyle: value.outlineStyle, outlineWidth: value.outlineWidth, transform: value.transform }
  })
  assert.notEqual(style.outlineStyle, 'none', `${label}: skip-link focus outline is missing`)
  assert.notEqual(style.outlineWidth, '0px', `${label}: skip-link focus outline width is zero`)
  await page.keyboard.press('Enter')
  await page.waitForFunction(() => document.activeElement?.id === 'history-main')
}

async function focusStableKeyboard(page) {
  await page.waitForFunction(async () => {
    const keyboard = document.querySelector('[data-history-chart-keyboard-target]')
    if (!(keyboard instanceof HTMLButtonElement)) return false
    keyboard.focus()
    await new Promise((resolveFrame) => requestAnimationFrame(() => requestAnimationFrame(resolveFrame)))
    return keyboard.isConnected
      && document.querySelector('[data-history-chart-keyboard-target]') === keyboard
      && document.activeElement === keyboard
  })
}

async function pressKeyboardDay(page, key, targetDay, label) {
  let lastError = null
  for (let attempt = 0; attempt < 3; attempt += 1) {
    await focusStableKeyboard(page)
    await page.locator('[data-history-chart-keyboard-target]').press(key)
    try {
      await page.waitForFunction((value) => new URL(location.href).searchParams.get('day') === value
        && document.querySelector('[data-history-day][aria-current="date"]')?.getAttribute('data-history-day') === value
        && document.querySelector('[data-history-chart-keyboard-target]')?.getAttribute('data-history-keyboard-day') === value, targetDay, { timeout: 10_000 })
      return
    } catch (error) {
      lastError = error
    }
  }
  const state = await keyboardState(page)
  throw new Error(`${label}: ${key} did not select ${targetDay}; state=${JSON.stringify(state)}; last=${lastError instanceof Error ? lastError.message : String(lastError)}`)
}

async function assertKeyboardControls(page, label) {
  const archives = page.locator('button[data-history-view="archives"]')
  await archives.focus()
  await archives.press('Enter')
  await page.waitForFunction(() => document.querySelector('.history-page')?.getAttribute('data-history-view') === 'archives')
  const peaks = page.locator('button[data-history-archive-view="peaks"]')
  await peaks.focus()
  await peaks.press('Enter')
  await page.waitForFunction(() => document.querySelector('.history-page')?.getAttribute('data-history-archive-view') === 'peaks')
  assert.equal(await peaks.getAttribute('aria-selected'), 'true', `${label}: archive keyboard selection is not exposed`)

  const overview = page.locator('button[data-history-view="overview"]')
  await overview.focus()
  await overview.press('Enter')
  await page.waitForFunction(() => document.querySelector('.history-page')?.getAttribute('data-history-view') === 'overview')
  await pressKeyboardDay(page, 'Home', '2026-06-12', label)
  await pressKeyboardDay(page, 'ArrowRight', '2026-06-13', label)
}

async function runScenario(browser, { provider, width, height, touch, mode = 'normal' }) {
  const id = `${provider}-${width}-${mode}`
  const calls = []
  evidence.checkpoint = `${id}:context`
  const context = await browser.newContext({
    viewport: { width, height },
    isMobile: touch,
    hasTouch: touch,
    reducedMotion: mode === 'forced' ? 'reduce' : 'no-preference',
    forcedColors: mode === 'forced' ? 'active' : 'none',
  })
  await installRoutes(context, calls)
  const page = await context.newPage()
  const metric = provider === 'kick' ? 'peak_viewers' : 'viewer_minutes'
  evidence.checkpoint = `${id}:navigate`
  await page.goto(`${base}/${provider}/history/?period=30d&metric=${metric}`, { waitUntil: 'domcontentloaded' })
  evidence.checkpoint = `${id}:ready`
  await ready(page)
  const requestCount = calls.length
  assert.equal(requestCount, 1, `${provider}-${width}: expected one initial History request`)
  assert.ok(calls.every((call) => call.provider === provider), `${provider}-${width}: crossed provider endpoint`)

  if (!touch && mode === 'normal') {
    evidence.checkpoint = `${id}:skip-entry`
    await assertSkipEntry(page, `${provider}-${width}`)
    evidence.checkpoint = `${id}:keyboard-controls`
    await assertKeyboardControls(page, `${provider}-${width}`)
  } else if (mode === 'normal') {
    evidence.checkpoint = `${id}:touch-day`
    const day = page.locator('[data-history-day="2026-06-12"] .history-bar-hit')
    await day.tap()
    await page.waitForFunction(() => document.querySelector('[data-history-day][aria-current="date"]')?.getAttribute('data-history-day') === '2026-06-12')
  }

  evidence.checkpoint = `${id}:report`
  await page.locator('button[data-history-view="report"]').click()
  await page.waitForFunction(() => document.querySelector('.history-page')?.getAttribute('data-history-view') === 'report')
  evidence.checkpoint = `${id}:snapshot`
  const state = await snapshot(page)
  assert.equal(state.p9h5Owner, 'p9h5', `${provider}-${width}: P9H5 owner is missing`)
  assert.ok(state.bodyOverflow <= 2, `${provider}-${width}: page horizontal overflow ${state.bodyOverflow}px`)
  assert.ok(state.mainWidth <= state.viewportWidth + 2, `${provider}-${width}: History main exceeds viewport`)
  assert.ok(state.minPeriodHeight >= 44, `${provider}-${width}: period target ${state.minPeriodHeight}px`)
  assert.ok(state.minMetricHeight >= 44, `${provider}-${width}: metric target ${state.minMetricHeight}px`)
  assert.ok(state.minTaskHeight >= 44, `${provider}-${width}: task target ${state.minTaskHeight}px`)
  assert.ok(state.minArchiveHeight >= 48, `${provider}-${width}: archive target ${state.minArchiveHeight}px`)
  assert.ok(state.minPublishHeight >= 48, `${provider}-${width}: publishing target ${state.minPublishHeight}px`)
  assert.equal(state.taskCount, 3, `${provider}-${width}: task controls missing`)
  assert.equal(state.archiveCount, 3, `${provider}-${width}: archive controls missing`)
  assert.equal(state.keyboardTargets, 1, `${provider}-${width}: chart keyboard target count changed`)
  assert.notEqual(state.focusOutlineStyle, 'none', `${provider}-${width}: control focus outline is missing`)
  assert.notEqual(state.focusOutlineWidth, '0px', `${provider}-${width}: control focus outline width is zero`)
  assert.equal(calls.length, requestCount, `${provider}-${width}: task switching refetched History`)
  if (mode === 'forced') {
    assert.equal(state.reducedMotion, true, `${provider}-${width}: reduced-motion mode was not active`)
    assert.equal(state.forcedColors, true, `${provider}-${width}: forced-colors mode was not active`)
  }

  evidence.checkpoint = `${id}:screenshot`
  await page.screenshot({ path: resolve(out, `${id}.png`), fullPage: true })
  evidence.scenarios.push({ id, provider, width, touch, mode, calls, state })
  await context.close()
}

const browser = await chromium.launch({ headless: true })
try {
  await runScenario(browser, { provider: 'twitch', width: 1440, height: 1000, touch: false })
  await runScenario(browser, { provider: 'kick', width: 820, height: 1000, touch: false })
  await runScenario(browser, { provider: 'kick', width: 390, height: 844, touch: true })
  await runScenario(browser, { provider: 'twitch', width: 360, height: 800, touch: true })
  await runScenario(browser, { provider: 'twitch', width: 390, height: 844, touch: false, mode: 'forced' })
  evidence.result = 'pass'
  evidence.checkpoint = 'complete'
  writeFileSync(resolve(out, 'history-ui-h5-responsive-evidence.json'), `${JSON.stringify(evidence, null, 2)}\n`)
} catch (error) {
  evidence.result = 'fail'
  evidence.error = `${evidence.checkpoint}: ${error instanceof Error ? error.message : String(error)}`
  writeFileSync(resolve(out, 'history-ui-h5-responsive-evidence.json'), `${JSON.stringify(evidence, null, 2)}\n`)
  throw error
} finally {
  await browser.close()
}
