import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { chromium } from 'playwright'
import { historyPayload } from './history-period-comparison-fixture.mjs'

const base = process.env.HISTORY_H0_BASE_URL ?? 'http://127.0.0.1:4173'
const out = resolve(process.env.HISTORY_H0_ARTIFACT_DIR ?? 'artifacts/history-ui-h0')
const expectedFailures = [
  'history-first-keyboard-entry-missing',
  'history-metric-ranking-context-stale',
  'history-metric-summary-stale',
  'history-mobile-task-flow-too-long',
  'history-selected-day-context-stale',
]
const evidence = {
  schema: 'viewloom-history-ui-h0-baseline-v1',
  phase: 'P9H0',
  candidateHead: process.env.GITHUB_HEAD_SHA ?? process.env.GITHUB_SHA ?? null,
  expectedFailures,
  observedFailures: [],
  scenarios: [],
  result: 'running',
}
mkdirSync(out, { recursive: true })

const fail = (id) => {
  if (!evidence.observedFailures.includes(id)) evidence.observedFailures.push(id)
}
const assert = (ok, message) => { if (!ok) throw new Error(message) }

async function installRoutes(context, calls) {
  const reply = async (route, provider) => {
    const url = new URL(route.request().url())
    const metric = url.searchParams.get('metric') === 'peak_viewers' ? 'peak_viewers' : 'viewer_minutes'
    calls.push({ provider, metric, path: `${url.pathname}${url.search}` })
    const payload = structuredClone(historyPayload(provider, 'comparable'))
    payload.metric = metric
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(payload) })
  }
  await context.route('**/api/kick-history*', (route) => reply(route, 'kick'))
  await context.route('**/api/history*', (route) => reply(route, 'twitch'))
}

async function ready(page) {
  await page.waitForFunction(() => {
    const chart = document.querySelector('.history-chart-caption strong')?.textContent?.trim()
    const summary = document.querySelector('[data-history-summary]')?.textContent?.trim()
    return Boolean(chart && summary)
  })
}

async function snapshot(page) {
  return page.evaluate(() => ({
    url: location.href,
    chart: document.querySelector('.history-chart-caption')?.textContent?.replace(/\s+/g, ' ').trim() ?? '',
    chartAria: document.querySelector('.history-stage svg')?.getAttribute('aria-label') ?? '',
    summary: document.querySelector('[data-history-summary]')?.textContent?.replace(/\s+/g, ' ').trim() ?? '',
    selectedDay: document.querySelector('[data-history-selected-day]')?.textContent?.replace(/\s+/g, ' ').trim() ?? '',
    ranking: document.querySelector('.history-ranking-toolbar')?.textContent?.replace(/\s+/g, ' ').trim() ?? '',
    firstRow: document.querySelector('.metric-ledger tbody tr')?.textContent?.replace(/\s+/g, ' ').trim() ?? '',
  }))
}

async function metricScenario(browser, provider, viewport) {
  const calls = []
  const context = await browser.newContext({ viewport })
  await installRoutes(context, calls)
  const page = await context.newPage()
  await page.goto(`${base}/${provider}/history/?period=7d&metric=viewer_minutes`, { waitUntil: 'domcontentloaded' })
  await ready(page)
  const before = await snapshot(page)
  await page.screenshot({ path: resolve(out, `${provider}-${viewport.width}-viewer-minutes.png`), fullPage: true })

  await page.locator('[data-history-metric="peak_viewers"]').click()
  await page.waitForFunction(() => location.search.includes('metric=peak_viewers')
    && document.querySelector('.history-chart-caption strong')?.textContent?.includes('Peak viewers'))
  const after = await snapshot(page)
  await page.screenshot({ path: resolve(out, `${provider}-${viewport.width}-peak-viewers.png`), fullPage: true })

  assert(before.url !== after.url, `${provider}: metric URL did not change.`)
  assert(before.chart !== after.chart || before.chartAria !== after.chartAria, `${provider}: chart meaning did not change.`)
  assert(calls.some((call) => call.provider === provider && call.metric === 'viewer_minutes'), `${provider}: viewer-minute request missing.`)
  assert(calls.some((call) => call.provider === provider && call.metric === 'peak_viewers'), `${provider}: peak-viewer request missing.`)
  assert(calls.every((call) => call.provider === provider), `${provider}: crossed provider endpoint.`)

  if (before.summary === after.summary) fail('history-metric-summary-stale')
  if (before.selectedDay === after.selectedDay) fail('history-selected-day-context-stale')
  if (`${before.ranking}|${before.firstRow}` === `${after.ranking}|${after.firstRow}`) fail('history-metric-ranking-context-stale')

  evidence.scenarios.push({ id: `${provider}-metric-${viewport.width}`, provider, viewport, calls, before, after })
  await context.close()
}

async function keyboardScenario(browser, provider, viewport) {
  const calls = []
  const context = await browser.newContext({ viewport })
  await installRoutes(context, calls)
  const page = await context.newPage()
  await page.goto(`${base}/${provider}/history/?period=7d`, { waitUntil: 'domcontentloaded' })
  await ready(page)
  await page.keyboard.press('Tab')
  const focus = await page.evaluate(() => {
    const active = document.activeElement
    return {
      moved: active !== document.body && active !== document.documentElement,
      tag: active?.tagName?.toLowerCase() ?? null,
      text: active?.textContent?.trim().slice(0, 120) ?? null,
    }
  })
  if (!focus.moved) fail('history-first-keyboard-entry-missing')
  evidence.scenarios.push({ id: `${provider}-keyboard-${viewport.width}`, provider, viewport, focus })
  await context.close()
}

async function hierarchyScenario(browser, provider, viewport) {
  const calls = []
  const context = await browser.newContext({ viewport, isMobile: viewport.width <= 390 })
  await installRoutes(context, calls)
  const page = await context.newPage()
  await page.goto(`${base}/${provider}/history/?period=7d`, { waitUntil: 'domcontentloaded' })
  await ready(page)
  const layout = await page.evaluate(() => {
    const selectors = [
      '[data-history-summary]',
      '[data-history-columns]',
      '.history-period-comparison-block',
      '.history-calendar-block',
      '.history-ranking-toolbar',
      '[data-history-overview-insights]',
      '.history-coverage-detail',
    ]
    return {
      scrollHeight: document.documentElement.scrollHeight,
      viewportHeight: innerHeight,
      ratio: document.documentElement.scrollHeight / innerHeight,
      majorSections: selectors.filter((selector) => document.querySelector(selector)).length,
      overviewTop: document.querySelector('[data-history-view-panel="overview"]')?.getBoundingClientRect().top ?? null,
    }
  })
  if (viewport.width <= 390 && layout.majorSections >= 6 && layout.ratio > 6) fail('history-mobile-task-flow-too-long')
  await page.screenshot({ path: resolve(out, `${provider}-${viewport.width}-task-flow.png`), fullPage: true })
  evidence.scenarios.push({ id: `${provider}-hierarchy-${viewport.width}`, provider, viewport, layout })
  await context.close()
}

const browser = await chromium.launch({ headless: true })
try {
  await metricScenario(browser, 'twitch', { width: 1440, height: 1000 })
  await metricScenario(browser, 'kick', { width: 390, height: 844 })
  await keyboardScenario(browser, 'twitch', { width: 820, height: 1180 })
  await keyboardScenario(browser, 'kick', { width: 360, height: 800 })
  await hierarchyScenario(browser, 'twitch', { width: 1440, height: 1000 })
  await hierarchyScenario(browser, 'kick', { width: 390, height: 844 })

  evidence.observedFailures.sort()
  const expected = [...expectedFailures].sort()
  evidence.result = JSON.stringify(evidence.observedFailures) === JSON.stringify(expected) ? 'pass' : 'fail'
  writeFileSync(resolve(out, 'history-ui-h0-evidence.json'), `${JSON.stringify(evidence, null, 2)}\n`)
  assert(evidence.result === 'pass', `Unexpected P9H0 acceptance set. Expected ${expected.join(', ')}; observed ${evidence.observedFailures.join(', ')}.`)
  console.log(JSON.stringify({ result: evidence.result, expectedFailures: expected, scenarios: evidence.scenarios.map((item) => item.id) }, null, 2))
} finally {
  await browser.close()
}
