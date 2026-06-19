import { chromium } from 'playwright'
import { historyPayload } from './history-battle-archive-fixture.mjs'

const base = process.env.HISTORY_CALENDAR_BASE_URL ?? 'http://127.0.0.1:4173'
const assert = (value, message) => { if (!value) throw new Error(message) }

async function check(browser, provider, viewport) {
  const calls = { twitch: 0, kick: 0 }
  const context = await browser.newContext({ viewport, isMobile: viewport.width < 500 })

  const fulfill = async (route, requestedProvider) => {
    calls[requestedProvider] += 1
    const requestUrl = new URL(route.request().url())
    const payload = historyPayload(requestedProvider)
    payload.metric = requestUrl.searchParams.get('metric') === 'peak_viewers' ? 'peak_viewers' : 'viewer_minutes'
    payload.period = { ...payload.period, to: '2026-06-18', days: 13, label: 'Fixture calendar range' }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(payload) })
  }

  await context.route('**/api/history*', (route) => fulfill(route, 'twitch'))
  await context.route('**/api/kick-history*', (route) => fulfill(route, 'kick'))

  const page = await context.newPage()
  await page.goto(`${base}/${provider}/history/?period=30d&metric=viewer_minutes`, { waitUntil: 'domcontentloaded' })
  await page.waitForFunction(() => document.querySelectorAll('[data-history-calendar-day]').length === 13)

  const other = provider === 'twitch' ? 'kick' : 'twitch'
  assert(calls[provider] > 0, `${provider} History endpoint was not requested.`)
  assert(calls[other] === 0, `${provider} History calendar crossed provider endpoints.`)
  assert(await page.locator('.history-calendar__weekdays span').count() === 7, `${provider} weekday header is incomplete.`)
  assert(await page.locator('[data-history-calendar-day]:not([disabled])').count() === 12, `${provider} observed calendar cells are incomplete.`)
  assert(await page.locator('[data-history-calendar-day][disabled]').count() === 1, `${provider} missing day is not explicit.`)
  assert(await page.locator('.history-calendar__cell--partial').count() >= 1, `${provider} partial coverage is not visible.`)
  assert(await page.locator('[data-calendar-level="4"]').count() >= 1, `${provider} relative intensity is missing.`)
  assert((await page.locator('[data-history-calendar-summary]').textContent())?.includes('12 observed'), `${provider} calendar summary is incorrect.`)
  assert((await page.locator('[data-history-calendar-metric]').textContent()) === 'Viewer-minutes', `${provider} initial metric label is incorrect.`)

  const firstDay = await page.locator('[data-history-calendar-day]:not([disabled])').first().getAttribute('data-history-calendar-day')
  await page.locator('[data-history-calendar-day]:not([disabled])').first().click()
  await page.waitForFunction((day) => new URL(location.href).searchParams.get('day') === day, firstDay)
  assert(await page.locator('[data-history-calendar-day].is-selected').count() === 1, `${provider} calendar selection is not synchronized.`)

  await page.locator('[data-history-metric="peak_viewers"]').click()
  await page.waitForFunction(() => document.querySelector('[data-history-calendar-metric]')?.textContent === 'Peak viewers')
  assert(calls[provider] >= 2, `${provider} metric refresh did not reuse the provider History endpoint.`)
  assert(calls[other] === 0, `${provider} metric refresh crossed provider endpoints.`)

  const width = await page.evaluate(() => [document.documentElement.scrollWidth, innerWidth])
  assert(width[0] <= width[1] + 1, `${provider} calendar introduced horizontal page overflow.`)
  await page.screenshot({ path: `/tmp/history-calendar-${provider}.png`, fullPage: true })
  await context.close()
}

const browser = await chromium.launch({ headless: true })
try {
  await check(browser, 'twitch', { width: 1440, height: 1100 })
  await check(browser, 'kick', { width: 390, height: 844 })
  console.log('History calendar heat browser gate passed.')
} finally {
  await browser.close()
}
