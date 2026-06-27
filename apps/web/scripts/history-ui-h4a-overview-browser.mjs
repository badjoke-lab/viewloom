import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { chromium } from 'playwright'
import { historyPayload } from './history-period-comparison-fixture.mjs'

const base = process.env.HISTORY_H4A_BASE_URL ?? 'http://127.0.0.1:4173'
const out = resolve(process.env.HISTORY_H4A_ARTIFACT_DIR ?? 'artifacts/history-ui-h4a')
mkdirSync(out, { recursive: true })

const evidence = {
  schema: 'viewloom-history-ui-h4a-overview-balance-v1',
  phase: 'P9H4A',
  candidateHead: process.env.GITHUB_HEAD_SHA ?? process.env.GITHUB_SHA ?? null,
  scenarios: [],
  result: 'running',
}

function thirtyDayPayload(provider) {
  const body = structuredClone(historyPayload(provider, 'partial'))
  const start = new Date('2026-05-29T00:00:00.000Z')
  body.daily = Array.from({ length: 30 }, (_, index) => {
    const template = body.daily[index % body.daily.length]
    const day = new Date(start)
    day.setUTCDate(day.getUTCDate() + index)
    return {
      ...template,
      day: day.toISOString().slice(0, 10),
      totalViewerMinutes: 1_100_000 + index * 47_000,
      peakViewers: 70_000 + index * 1_400,
      coverageState: index === 29 ? 'in-progress' : index === 22 ? 'partial' : 'good',
    }
  })
  body.period = { from: body.daily[0].day, to: body.daily.at(-1).day, label: 'Last 30 days', days: 30 }
  body.summary.totalViewerMinutes = body.daily.reduce((sum, day) => sum + day.totalViewerMinutes, 0)
  body.summary.peakViewers = Math.max(...body.daily.map((day) => day.peakViewers))
  body.summary.peakDay = body.daily.at(-2).day
  body.summary.peakDayViewerMinutes = body.daily.at(-2).totalViewerMinutes
  body.summary.coverageState = 'partial'
  body.coverage = {
    ...body.coverage,
    state: 'partial',
    observedDays: 30,
    partialDays: 1,
    missingDays: 0,
    inProgressDays: 1,
    affectedDays: [body.daily[22].day, body.daily[29].day],
    notes: ['One completed day is partial and the latest day is still in progress.'],
  }
  return body
}

async function installRoutes(context, calls) {
  const reply = async (route, provider) => {
    const url = new URL(route.request().url())
    const metric = url.searchParams.get('metric') === 'peak_viewers' ? 'peak_viewers' : 'viewer_minutes'
    calls.push({ provider, metric, path: `${url.pathname}${url.search}` })
    const body = thirtyDayPayload(provider)
    body.metric = metric
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) })
  }
  await context.route('**/api/kick-history*', (route) => reply(route, 'kick'))
  await context.route('**/api/history*', (route) => reply(route, 'twitch'))
}

async function ready(page) {
  await page.waitForFunction(() => document.querySelector('[data-history-view-panel="overview"]')?.getAttribute('data-history-overview-p9h4a-ready') === 'true'
    && document.querySelector('.history-stage')?.getAttribute('data-history-chart-ready') === 'true')
}

async function snapshot(page) {
  return page.evaluate(() => {
    const visible = (node) => node instanceof HTMLElement
      && getComputedStyle(node).display !== 'none'
      && getComputedStyle(node).visibility !== 'hidden'
      && node.getClientRects().length > 0
    const box = (selector) => {
      const rect = document.querySelector(selector)?.getBoundingClientRect()
      return rect ? { top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right, width: rect.width, height: rect.height } : null
    }
    const summaryCards = [...document.querySelectorAll('[data-history-summary] > div')]
    const secondary = [...document.querySelectorAll('[data-history-secondary-group]')]
    const metrics = document.querySelector('.history-selected-metrics')
    return {
      bodyOverflow: Math.max(0, document.documentElement.scrollWidth - innerWidth),
      documentHeight: document.documentElement.scrollHeight,
      summaryCards: summaryCards.length,
      visibleSummaryCards: summaryCards.filter(visible).length,
      hiddenCoverageSource: document.querySelector('[data-history-coverage-source]')?.hasAttribute('hidden') ?? false,
      coverageQuality: document.querySelector('[data-history-coverage-quality]')?.textContent?.replace(/\s+/g, ' ').trim() ?? '',
      keyPosition: getComputedStyle(document.querySelector('[data-history-overview-insights]')).position,
      comparisonGridDisplay: getComputedStyle(document.querySelector('.history-comparison-grid')).display,
      calendar: box('.history-calendar'),
      calendarCell: box('.history-calendar__cell'),
      ranking: box('.history-table-wrap'),
      insights: box('[data-history-overview-insights]'),
      coverage: box('.history-coverage-detail'),
      chart: box('.history-stage'),
      selectedMetricColumns: metrics ? getComputedStyle(metrics).gridTemplateColumns.split(' ').filter(Boolean).length : 0,
      visibleSelectedStreamers: [...document.querySelectorAll('.history-selected-top li')].filter(visible).length,
      mobileNavVisible: visible(document.querySelector('[data-history-mobile-analysis]')),
      mobileDescriptions: document.querySelectorAll('[data-history-mobile-analysis-copy]').length,
      visibleSecondaryGroups: secondary.filter(visible).length,
      openGroups: [...new Set(secondary.filter((node) => node.classList.contains('is-mobile-open')).map((node) => node.getAttribute('data-history-secondary-group')))].filter(Boolean),
    }
  })
}

async function coverageCollision(page) {
  await page.locator('.history-overview-coverage-title').scrollIntoViewIfNeeded()
  await page.waitForTimeout(80)
  return page.evaluate(() => {
    const a = document.querySelector('[data-history-overview-insights]')?.getBoundingClientRect()
    const b = document.querySelector('.history-coverage-detail')?.getBoundingClientRect()
    if (!a || !b) return Number.POSITIVE_INFINITY
    const width = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left))
    const height = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top))
    return width * height
  })
}

async function desktopScenario(browser, provider, width) {
  const calls = []
  const viewport = { width, height: 1000 }
  const context = await browser.newContext({ viewport })
  await installRoutes(context, calls)
  const page = await context.newPage()
  await page.goto(`${base}/${provider}/history/?period=30d&metric=viewer_minutes`, { waitUntil: 'domcontentloaded' })
  await ready(page)
  const initial = await snapshot(page)

  assert.equal(calls.length, 1, `${provider}-${width}: initial request count changed`)
  assert.ok(calls.every((call) => call.provider === provider), `${provider}-${width}: crossed provider endpoint`)
  assert.ok(initial.bodyOverflow <= 2, `${provider}-${width}: body overflow ${initial.bodyOverflow}px`)
  assert.equal(initial.summaryCards, 5, `${provider}-${width}: compatibility Summary source count changed`)
  assert.equal(initial.visibleSummaryCards, 4, `${provider}-${width}: visible Summary must contain four primary facts`)
  assert.equal(initial.hiddenCoverageSource, true, `${provider}-${width}: legacy coverage source is visible`)
  assert.match(initial.coverageQuality, /Coverage Partial/i, `${provider}-${width}: coverage quality was not moved into the status band`)
  assert.ok(initial.keyPosition !== 'sticky' && initial.keyPosition !== 'fixed', `${provider}-${width}: Key changes remains ${initial.keyPosition}`)
  assert.ok(initial.calendar && initial.calendar.height <= 540, `${provider}-${width}: Calendar height ${initial.calendar?.height}px remains dominant`)
  assert.ok(initial.calendarCell && initial.calendarCell.height >= 54 && initial.calendarCell.height <= 74, `${provider}-${width}: Calendar cell height ${initial.calendarCell?.height}px is outside bounds`)
  assert.equal(initial.comparisonGridDisplay, 'none', `${provider}-${width}: withheld comparison metric tiles remain visible`)

  if (width > 1320) {
    assert.ok(initial.ranking.width >= 850, `${provider}-${width}: ranking table width collapsed to ${initial.ranking.width}px`)
    assert.ok(initial.insights.left >= initial.ranking.right - 2, `${provider}-${width}: Key changes is not paired beside ranking`)
  } else {
    assert.ok(initial.ranking.width >= width - 90, `${provider}-${width}: stacked ranking width collapsed to ${initial.ranking.width}px`)
    assert.ok(initial.insights.top >= initial.ranking.bottom - 2, `${provider}-${width}: Key changes did not stack after ranking`)
  }

  const overlap = await coverageCollision(page)
  assert.equal(overlap, 0, `${provider}-${width}: Key changes overlaps detailed coverage by ${overlap}px²`)
  await page.screenshot({ path: resolve(out, `${provider}-${width}-desktop.png`), fullPage: true })
  evidence.scenarios.push({ id: `${provider}-desktop-${width}`, provider, viewport, calls, initial, coverageOverlap: overlap })
  await context.close()
}

async function mobileScenario(browser, provider, width) {
  const calls = []
  const viewport = { width, height: 844 }
  const context = await browser.newContext({ viewport, isMobile: true, hasTouch: true })
  await installRoutes(context, calls)
  const page = await context.newPage()
  await page.goto(`${base}/${provider}/history/?period=30d&metric=viewer_minutes`, { waitUntil: 'domcontentloaded' })
  await ready(page)
  const initial = await snapshot(page)

  assert.equal(calls.length, 1, `${provider}-${width}: initial request count changed`)
  assert.ok(calls.every((call) => call.provider === provider), `${provider}-${width}: crossed provider endpoint`)
  assert.ok(initial.bodyOverflow <= 2, `${provider}-${width}: body overflow ${initial.bodyOverflow}px`)
  assert.equal(initial.visibleSummaryCards, 4, `${provider}-${width}: visible Summary must contain four primary facts`)
  assert.match(initial.coverageQuality, /Coverage Partial/i, `${provider}-${width}: coverage quality is missing`)
  assert.equal(initial.mobileNavVisible, true, `${provider}-${width}: More analysis is hidden`)
  assert.equal(initial.mobileDescriptions, 4, `${provider}-${width}: More analysis descriptions are incomplete`)
  assert.equal(initial.visibleSecondaryGroups, 0, `${provider}-${width}: secondary analysis is open by default`)
  assert.ok(initial.chart.height >= 450, `${provider}-${width}: chart remains too short at ${initial.chart.height}px`)
  assert.ok(initial.selectedMetricColumns >= 2, `${provider}-${width}: Selected day metrics are not compacted to two columns`)
  assert.equal(initial.visibleSelectedStreamers, 3, `${provider}-${width}: Selected day streamer limit changed`)
  assert.ok(initial.documentHeight < viewport.height * 7.8, `${provider}-${width}: collapsed Overview remains too long at ${initial.documentHeight}px`)

  const before = calls.length
  await page.locator('[data-history-mobile-analysis-toggle="ranking"]').click()
  await page.waitForFunction(() => document.querySelector('[data-history-mobile-analysis-toggle="ranking"]')?.getAttribute('aria-expanded') === 'true')
  const ranking = await snapshot(page)
  assert.ok(ranking.openGroups.includes('ranking'), `${provider}-${width}: ranking did not open`)
  assert.equal(calls.length, before, `${provider}-${width}: ranking disclosure refetched History`)

  await page.locator('[data-history-mobile-analysis-toggle="coverage"]').click()
  await page.waitForFunction(() => document.querySelector('[data-history-mobile-analysis-toggle="coverage"]')?.getAttribute('aria-expanded') === 'true')
  const coverage = await snapshot(page)
  assert.ok(coverage.openGroups.includes('coverage'), `${provider}-${width}: coverage did not open`)
  assert.ok(!coverage.openGroups.includes('ranking'), `${provider}-${width}: multiple secondary groups stayed open`)
  assert.equal(calls.length, before, `${provider}-${width}: coverage disclosure refetched History`)

  await page.screenshot({ path: resolve(out, `${provider}-${width}-mobile.png`), fullPage: true })
  evidence.scenarios.push({ id: `${provider}-mobile-${width}`, provider, viewport, calls, initial, final: coverage })
  await context.close()
}

const browser = await chromium.launch({ headless: true })
try {
  await desktopScenario(browser, 'twitch', 1440)
  await desktopScenario(browser, 'kick', 1280)
  await desktopScenario(browser, 'twitch', 1024)
  await desktopScenario(browser, 'kick', 820)
  await mobileScenario(browser, 'kick', 390)
  await mobileScenario(browser, 'twitch', 360)
  evidence.result = 'pass'
  writeFileSync(resolve(out, 'history-ui-h4a-overview-evidence.json'), `${JSON.stringify(evidence, null, 2)}\n`)
  console.log(JSON.stringify({ result: evidence.result, scenarios: evidence.scenarios.map((item) => item.id) }, null, 2))
} catch (error) {
  evidence.result = 'fail'
  evidence.error = error instanceof Error ? error.message : String(error)
  writeFileSync(resolve(out, 'history-ui-h4a-overview-evidence.json'), `${JSON.stringify(evidence, null, 2)}\n`)
  throw error
} finally {
  await browser.close()
}
