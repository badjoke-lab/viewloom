import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { chromium } from 'playwright'
import { historyPayload } from './history-period-comparison-fixture.mjs'

const base = process.env.HISTORY_H2_BASE_URL ?? 'http://127.0.0.1:4173'
const out = resolve(process.env.HISTORY_H2_ARTIFACT_DIR ?? 'artifacts/history-ui-h2')
mkdirSync(out, { recursive: true })
const evidence = { schema: 'viewloom-history-ui-h2-chart-v1', phase: 'P9H2', scenarios: [], diagnostics: [], checkpoint: 'start', result: 'running' }

function payload(provider, metric) {
  const value = structuredClone(historyPayload(provider, 'comparable'))
  value.metric = metric
  const states = ['good', 'partial', 'in-progress', 'missing', 'demo', 'good', 'partial']
  value.daily.forEach((day, index) => {
    day.coverageState = states[index]
    if (day.coverageState === 'missing') {
      day.totalViewerMinutes = 0
      day.peakViewers = 0
      day.topStreamers = []
    }
  })
  value.coverage.state = 'partial'
  return value
}

async function run(browser, provider, viewport, touch) {
  const calls = []
  const context = await browser.newContext({ viewport, isMobile: touch, hasTouch: touch })
  const reply = async (route, routeProvider) => {
    const url = new URL(route.request().url())
    const metric = url.searchParams.get('metric') === 'peak_viewers' ? 'peak_viewers' : 'viewer_minutes'
    calls.push({ provider: routeProvider, metric })
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(payload(routeProvider, metric)) })
  }
  await context.route('**/api/kick-history*', (route) => reply(route, 'kick'))
  await context.route('**/api/history*', (route) => reply(route, 'twitch'))
  const page = await context.newPage()
  evidence.checkpoint = `${provider}:navigate`
  await page.goto(`${base}/${provider}/history/?period=7d&metric=viewer_minutes`, { waitUntil: 'domcontentloaded' })
  await ready(page, 'viewer_minutes')
  const initial = await snapshot(page)
  evidence.diagnostics.push({ provider, checkpoint: 'initial', state: initial, url: page.url() })
  assert.match(initial.title, /Viewer-minutes by UTC day/)
  assert.match(initial.description, /Arrow keys move between days/)
  assert.equal(initial.labelledBy, 'history-chart-title history-chart-description')
  assert.match(initial.caption, /UTC daily rollup/)
  assert.ok(initial.yTicks >= 5 && initial.xTicks >= 2)
  for (const symbol of ['●', '▲', '◐', '×', '◇']) {
    assert.ok(initial.markers.includes(symbol), `${provider}: missing state marker ${symbol}; ${JSON.stringify(initial.days)}`)
  }
  for (const label of ['Complete', 'Partial', 'In progress', 'Missing', 'Demo']) assert.match(initial.legend, new RegExp(label, 'i'))
  assert.equal(initial.focusable, 1)

  const requestCount = calls.length
  let selectedHit = page.locator('[data-history-day][aria-current="date"] .history-bar-hit')
  evidence.checkpoint = `${provider}:home-focus`
  await selectedHit.focus()
  assert.equal((await interactionSnapshot(page)).activeDay, initial.selected)
  evidence.checkpoint = `${provider}:home-press`
  await selectedHit.press('Home')
  evidence.diagnostics.push({ provider, checkpoint: 'after-home', state: await snapshot(page), interaction: await interactionSnapshot(page), url: page.url() })
  evidence.checkpoint = `${provider}:home-wait`
  await dayReady(page, '2026-06-12')

  selectedHit = page.locator('[data-history-day][aria-current="date"] .history-bar-hit')
  evidence.checkpoint = `${provider}:arrow-focus`
  await selectedHit.focus()
  assert.equal((await interactionSnapshot(page)).activeDay, '2026-06-12')
  evidence.checkpoint = `${provider}:arrow-press`
  await selectedHit.press('ArrowRight')
  evidence.diagnostics.push({ provider, checkpoint: 'after-arrow', state: await snapshot(page), interaction: await interactionSnapshot(page), url: page.url() })
  evidence.checkpoint = `${provider}:arrow-wait`
  await dayReady(page, '2026-06-13')
  let state = await snapshot(page)
  assert.equal(state.selected, '2026-06-13')
  assert.equal(state.inspectionDay, '2026-06-13')
  assert.equal(calls.length, requestCount)

  const demoDay = page.locator('[data-history-day="2026-06-16"]')
  const demoHit = demoDay.locator('.history-bar-hit')
  evidence.checkpoint = `${provider}:demo-action`
  if (touch) await demoHit.tap()
  else await demoHit.click()
  evidence.diagnostics.push({ provider, checkpoint: 'after-demo', state: await snapshot(page), interaction: await interactionSnapshot(page), url: page.url() })
  evidence.checkpoint = `${provider}:demo-wait`
  await dayReady(page, '2026-06-16')
  state = await snapshot(page)
  assert.match(state.inspection, /coverage state demo/i)
  assert.equal(calls.length, requestCount)

  evidence.checkpoint = `${provider}:metric-click`
  await page.locator('[data-history-metric="peak_viewers"]').click()
  evidence.diagnostics.push({ provider, checkpoint: 'after-metric', state: await snapshot(page), interaction: await interactionSnapshot(page), url: page.url(), calls: structuredClone(calls) })
  evidence.checkpoint = `${provider}:metric-wait`
  await ready(page, 'peak_viewers')
  const peak = await snapshot(page)
  assert.match(peak.title, /Peak viewers by UTC day/)
  assert.match(peak.inspection, /Peak viewers/i)
  assert.equal(calls.filter((call) => call.metric === 'viewer_minutes').length, 1)
  assert.equal(calls.filter((call) => call.metric === 'peak_viewers').length, 1)
  assert.ok(calls.every((call) => call.provider === provider))
  await page.screenshot({ path: resolve(out, `${provider}-${viewport.width}.png`), fullPage: true })
  evidence.scenarios.push({ provider, viewport, touch, calls, initial, peak })
  await context.close()
}

async function ready(page, metric) {
  await page.waitForFunction((value) => document.querySelector('.history-stage')?.getAttribute('data-history-chart-ready') === 'true'
    && document.querySelector('.history-stage')?.getAttribute('data-history-chart-metric') === value, metric)
}

async function dayReady(page, day) {
  await page.waitForFunction((value) => new URL(location.href).searchParams.get('day') === value
    && document.querySelector('[data-history-day][aria-current="date"]')?.getAttribute('data-history-day') === value, day)
}

async function interactionSnapshot(page) {
  return page.evaluate(() => ({
    activeTag: document.activeElement?.tagName ?? '',
    activeDay: document.activeElement?.closest?.('[data-history-day]')?.getAttribute('data-history-day') ?? '',
    urlDay: new URL(location.href).searchParams.get('day') ?? '',
    selectedClass: document.querySelector('[data-history-day].is-selected')?.getAttribute('data-history-day') ?? '',
    ariaCurrent: document.querySelector('[data-history-day][aria-current="date"]')?.getAttribute('data-history-day') ?? '',
  }))
}

async function snapshot(page) {
  return page.evaluate(() => ({
    title: document.querySelector('#history-chart-title')?.textContent ?? '',
    description: document.querySelector('#history-chart-description')?.textContent ?? '',
    labelledBy: document.querySelector('.history-stage svg')?.getAttribute('aria-labelledby') ?? '',
    caption: document.querySelector('.history-chart-caption')?.textContent ?? '',
    yTicks: document.querySelectorAll('.history-y-label').length,
    xTicks: document.querySelectorAll('.history-x-label').length,
    markers: [...document.querySelectorAll('.history-state-marker')].map((node) => node.textContent ?? ''),
    days: [...document.querySelectorAll('[data-history-day]')].map((node) => ({
      day: node.getAttribute('data-history-day') ?? '',
      coverage: node.getAttribute('data-history-coverage') ?? '',
      symbol: node.getAttribute('data-history-state-symbol') ?? '',
      marker: node.querySelector('.history-state-marker')?.textContent ?? '',
      barClass: node.querySelector('.history-bar')?.getAttribute('class') ?? '',
    })),
    legend: document.querySelector('[data-history-chart-legend]')?.textContent ?? '',
    inspection: document.querySelector('[data-history-chart-inspection]')?.textContent ?? '',
    inspectionDay: document.querySelector('[data-history-chart-inspection]')?.getAttribute('data-history-inspection-day') ?? '',
    selected: document.querySelector('[data-history-day][aria-current="date"]')?.getAttribute('data-history-day') ?? '',
    focusable: document.querySelectorAll('[data-history-day] .history-bar-hit[tabindex="0"]').length,
  }))
}

const browser = await chromium.launch({ headless: true })
try {
  await run(browser, 'twitch', { width: 1440, height: 1000 }, false)
  await run(browser, 'kick', { width: 390, height: 844 }, true)
  evidence.result = 'pass'
  evidence.checkpoint = 'complete'
  writeFileSync(resolve(out, 'history-ui-h2-chart-evidence.json'), `${JSON.stringify(evidence, null, 2)}\n`)
} catch (error) {
  evidence.result = 'fail'
  evidence.error = error instanceof Error ? error.message : String(error)
  writeFileSync(resolve(out, 'history-ui-h2-chart-evidence.json'), `${JSON.stringify(evidence, null, 2)}\n`)
  throw error
} finally {
  await browser.close()
}
