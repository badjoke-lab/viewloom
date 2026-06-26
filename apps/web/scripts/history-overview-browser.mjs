import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { chromium } from 'playwright'
import { historyPayload } from './history-period-comparison-fixture.mjs'

const base = process.env.HISTORY_OVERVIEW_BASE_URL ?? 'http://127.0.0.1:4173'
const out = resolve(process.env.HISTORY_OVERVIEW_ARTIFACT_DIR ?? 'artifacts/history-overview')
const assert = (ok, message) => { if (!ok) throw new Error(message) }
mkdirSync(out, { recursive: true })

async function routes(context, calls, state) {
  const reply = async (route, provider) => {
    calls[provider] += 1
    const url = new URL(route.request().url())
    const payload = structuredClone(historyPayload(provider, state))
    payload.metric = url.searchParams.get('metric') === 'peak_viewers' ? 'peak_viewers' : 'viewer_minutes'
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(payload) })
  }
  await context.route('**/api/history*', (route) => reply(route, 'twitch'))
  await context.route('**/api/kick-history*', (route) => reply(route, 'kick'))
}

async function ready(page) {
  await page.waitForFunction(() => document.querySelector('[data-history-view-panel="overview"]')?.dataset.historyOverviewReady === 'true'
    && document.querySelector('[data-history-overview-insights]')?.dataset.historyOverviewInsightsReady === 'true')
}

async function noOverflow(page, label) {
  const [scroll, inner] = await page.evaluate(() => [document.documentElement.scrollWidth, innerWidth])
  assert(scroll <= inner + 1, `${label}: horizontal overflow.`)
}

async function desktop(browser) {
  const calls = { twitch: 0, kick: 0 }
  const context = await browser.newContext({ viewport: { width: 1440, height: 1100 } })
  await routes(context, calls, 'comparable')
  const page = await context.newPage()
  await page.goto(`${base}/twitch/history/?period=7d&metric=viewer_minutes`, { waitUntil: 'domcontentloaded' })
  await ready(page)
  assert(calls.twitch > 0 && calls.kick === 0, 'Twitch Overview crossed provider endpoints.')

  const layout = await page.evaluate(() => {
    const box = (selector) => {
      const node = document.querySelector(selector)
      const rect = node?.getBoundingClientRect()
      return rect ? { top: rect.top, bottom: rect.bottom, width: rect.width } : null
    }
    return {
      chart: box('.history-trend-card'), inspector: box('[data-history-selected-day]'),
      columns: box('[data-history-columns]'), comparison: box('.history-period-comparison-block'),
      calendar: box('.history-calendar-block'), ranking: box('.history-table-wrap'),
      insights: box('[data-history-overview-insights]'), coverage: box('.history-coverage-detail'),
      strip: getComputedStyle(document.querySelector('.data-strip')).display,
      archiveHidden: document.querySelector('[data-history-view-panel="archives"]')?.hidden,
      reportHidden: document.querySelector('[data-history-view-panel="report"]')?.hidden,
      viewport: innerHeight,
    }
  })
  assert(layout.strip === 'none', 'Desktop: duplicate data strip is visible.')
  assert(layout.archiveHidden, 'Desktop: full archive content is visible in Overview.')
  assert(layout.reportHidden, 'Desktop: Report content is visible in Overview.')
  assert(layout.chart.width > layout.inspector.width * 2, 'Desktop: chart is not dominant.')
  assert(layout.chart.top < layout.viewport && Math.min(layout.chart.bottom, layout.viewport) - layout.chart.top > 240, 'Desktop: chart is not meaningfully visible in the first viewport.')
  assert(layout.comparison.top >= layout.columns.bottom - 2, 'Desktop: comparison no longer follows the summary before the chart.')
  assert(layout.calendar.top >= layout.comparison.bottom - 2, 'Desktop: calendar order is wrong.')
  assert(layout.ranking.top < layout.insights.bottom && layout.insights.top < layout.ranking.bottom, 'Desktop: Key changes is not paired with Top streamers.')
  assert(layout.coverage.top > layout.ranking.top, 'Desktop: detailed coverage appears too early.')
  const text = await page.locator('[data-history-overview-insights]').textContent()
  assert(text?.includes('Viewer-minutes vs previous') && text.includes('+40%') && text.includes('Alpha 0'), 'Desktop: selected metric Key changes are incomplete.')
  assert(!text?.includes('Peak vs previous'), 'Desktop: unselected peak comparison remained visible.')
  await noOverflow(page, 'Twitch desktop Overview')
  await page.screenshot({ path: resolve(out, 'history-overview-twitch-desktop.png'), fullPage: true })
  await context.close()
}

async function mobile(browser) {
  const calls = { twitch: 0, kick: 0 }
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true })
  await routes(context, calls, 'partial')
  const page = await context.newPage()
  await page.goto(`${base}/kick/history/?period=7d&metric=peak_viewers`, { waitUntil: 'domcontentloaded' })
  await ready(page)
  assert(calls.kick > 0 && calls.twitch === 0, 'Kick Overview crossed provider endpoints.')
  const text = await page.locator('[data-history-overview-insights]').textContent()
  assert(text?.includes('Peak viewers vs previous'), 'Mobile: selected peak comparison label is missing.')
  assert((text?.match(/Withheld/g) ?? []).length === 1, 'Mobile: unsupported selected metric comparison is not withheld exactly once.')
  assert(text?.includes('7 and 4 selected days'), 'Mobile: partial reason is missing.')
  assert(text?.includes('Alpha 0'), 'Mobile: supported streamer context is missing.')
  const tops = await page.evaluate(() => ['[data-history-columns]','.history-period-comparison-block','.history-calendar-block','.history-overview-ranking-title','[data-history-overview-insights]','.history-overview-coverage-title'].map((selector) => document.querySelector(selector)?.getBoundingClientRect().top ?? -1))
  assert(tops.every((value, index) => index === 0 || value > tops[index - 1]), 'Mobile: Overview reading order is incorrect.')
  await noOverflow(page, 'Kick mobile Overview')
  await page.screenshot({ path: resolve(out, 'history-overview-kick-mobile.png'), fullPage: true })
  await context.close()
}

const browser = await chromium.launch({ headless: true })
try { await desktop(browser); await mobile(browser); console.log('History Overview browser gate passed.') }
finally { await browser.close() }
