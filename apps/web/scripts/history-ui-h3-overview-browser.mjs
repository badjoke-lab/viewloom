import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { chromium } from 'playwright'
import { historyPayload } from './history-period-comparison-fixture.mjs'

const base = process.env.HISTORY_H3_BASE_URL ?? 'http://127.0.0.1:4173'
const out = resolve(process.env.HISTORY_H3_ARTIFACT_DIR ?? 'artifacts/history-ui-h3')
mkdirSync(out, { recursive: true })
const evidence = { schema: 'viewloom-history-ui-h3-overview-v1', phase: 'P9H3', scenarios: [], result: 'running' }

async function run(browser, provider, viewport, touch) {
  const calls = []
  const context = await browser.newContext({ viewport, isMobile: touch, hasTouch: touch })
  const reply = async (route, routeProvider) => {
    const url = new URL(route.request().url())
    const metric = url.searchParams.get('metric') === 'peak_viewers' ? 'peak_viewers' : 'viewer_minutes'
    calls.push({ provider: routeProvider, metric })
    const body = structuredClone(historyPayload(routeProvider, 'comparable'))
    body.metric = metric
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) })
  }
  await context.route('**/api/kick-history*', (route) => reply(route, 'kick'))
  await context.route('**/api/history*', (route) => reply(route, 'twitch'))
  const page = await context.newPage()
  await page.goto(`${base}/${provider}/history/?period=7d&metric=viewer_minutes`, { waitUntil: 'domcontentloaded' })
  await ready(page)

  const initial = await snapshot(page)
  assert.equal(initial.requestCount, 1)
  assert.ok(calls.every((call) => call.provider === provider), `${provider}: crossed provider endpoint`)
  assert.equal(initial.summaryCards, 5)
  assert.equal(initial.mobileNavButtons, 4)
  assert.ok(initial.bodyOverflow <= 2, `${provider}: body overflow ${initial.bodyOverflow}px`)

  if (!touch) {
    assert.equal(initial.mobileNavDisplay, 'none')
    assert.ok(initial.visibleSecondaryGroups >= 7)
    assert.ok(initial.order.summary < initial.order.primary)
    assert.ok(initial.order.primary < initial.order.comparison)
    assert.ok(initial.order.comparison < initial.order.calendar)
    assert.ok(initial.order.calendar < initial.order.ranking)
    assert.ok(initial.order.ranking < initial.order.insights)
    assert.ok(initial.order.insights < initial.order.coverage)
  } else {
    assert.notEqual(initial.mobileNavDisplay, 'none')
    assert.equal(initial.visibleSecondaryGroups, 0)
    assert.ok(initial.documentHeight < viewport.height * 7, `${provider}: mobile Overview remains too long at ${initial.documentHeight}px`)
    assert.equal(initial.visibleSelectedStreamers, 3)

    const before = calls.length
    await page.locator('[data-history-mobile-analysis-toggle="ranking"]').click()
    await page.waitForFunction(() => document.querySelector('[data-history-mobile-analysis-toggle="ranking"]')?.getAttribute('aria-expanded') === 'true')
    const ranking = await snapshot(page)
    assert.ok(ranking.openGroups.includes('ranking'))
    assert.ok(ranking.visibleSecondaryGroups >= 3)
    assert.equal(calls.length, before)

    await page.locator('[data-history-mobile-analysis-toggle="coverage"]').click()
    await page.waitForFunction(() => document.querySelector('[data-history-mobile-analysis-toggle="coverage"]')?.getAttribute('aria-expanded') === 'true')
    const coverage = await snapshot(page)
    assert.ok(coverage.openGroups.includes('coverage'))
    assert.ok(!coverage.openGroups.includes('ranking'))
    assert.equal(calls.length, before)
  }

  await page.screenshot({ path: resolve(out, `${provider}-${viewport.width}.png`), fullPage: true })
  evidence.scenarios.push({ provider, viewport, touch, calls, initial, final: await snapshot(page) })
  await context.close()
}

async function ready(page) {
  await page.waitForFunction(() => document.querySelector('[data-history-view-panel="overview"]')?.getAttribute('data-history-overview-p9h3-ready') === 'true'
    && document.querySelector('.history-stage')?.getAttribute('data-history-chart-ready') === 'true')
}

async function snapshot(page) {
  return page.evaluate(() => {
    const visible = (selector) => {
      const node = document.querySelector(selector)
      if (!(node instanceof HTMLElement)) return false
      const style = getComputedStyle(node)
      return style.display !== 'none' && style.visibility !== 'hidden' && node.getClientRects().length > 0
    }
    const top = (selector) => document.querySelector(selector)?.getBoundingClientRect().top ?? Number.MAX_SAFE_INTEGER
    const groupNodes = [...document.querySelectorAll('[data-history-secondary-group]')]
    return {
      requestCount: performance.getEntriesByType('resource').filter((entry) => entry.name.includes('/api/history') || entry.name.includes('/api/kick-history')).length,
      summaryCards: document.querySelectorAll('[data-history-summary] > div').length,
      mobileNavButtons: document.querySelectorAll('[data-history-mobile-analysis-toggle]').length,
      mobileNavDisplay: getComputedStyle(document.querySelector('[data-history-mobile-analysis]')).display,
      visibleSecondaryGroups: groupNodes.filter((node) => visible(`[data-history-secondary-group="${node.getAttribute('data-history-secondary-group')}"]${node.classList.contains('is-mobile-open') ? '.is-mobile-open' : ':not(.is-mobile-open)'}`)).length,
      openGroups: [...new Set(groupNodes.filter((node) => node.classList.contains('is-mobile-open')).map((node) => node.getAttribute('data-history-secondary-group')))].filter(Boolean),
      visibleSelectedStreamers: [...document.querySelectorAll('.history-selected-top li')].filter((node) => node instanceof HTMLElement && getComputedStyle(node).display !== 'none').length,
      documentHeight: document.documentElement.scrollHeight,
      bodyOverflow: Math.max(0, document.documentElement.scrollWidth - window.innerWidth),
      order: {
        summary: top('[data-history-summary]'),
        primary: top('[data-history-columns]'),
        comparison: top('.history-period-comparison-block'),
        calendar: top('.history-calendar-block'),
        ranking: top('.history-overview-ranking-title'),
        insights: top('[data-history-overview-insights]'),
        coverage: top('.history-overview-coverage-title'),
      },
    }
  })
}

const browser = await chromium.launch({ headless: true })
try {
  await run(browser, 'twitch', { width: 1440, height: 1000 }, false)
  await run(browser, 'kick', { width: 390, height: 844 }, true)
  evidence.result = 'pass'
  writeFileSync(resolve(out, 'history-ui-h3-overview-evidence.json'), `${JSON.stringify(evidence, null, 2)}\n`)
} catch (error) {
  evidence.result = 'fail'
  evidence.error = error instanceof Error ? error.message : String(error)
  writeFileSync(resolve(out, 'history-ui-h3-overview-evidence.json'), `${JSON.stringify(evidence, null, 2)}\n`)
  throw error
} finally {
  await browser.close()
}