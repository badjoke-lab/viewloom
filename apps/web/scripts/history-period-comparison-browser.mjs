import { chromium } from 'playwright'
import { historyPayload } from './history-period-comparison-fixture.mjs'

const baseUrl = process.env.HISTORY_BASE_URL ?? 'http://127.0.0.1:4173'
const assert = (condition, message) => { if (!condition) throw new Error(message) }

async function installRoute(context, provider, state) {
  const routePath = provider === 'kick' ? '**/api/kick-history?**' : '**/api/history?**'
  await context.route(routePath, (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(historyPayload(provider, state)),
  }))
}

async function waitForComparison(page) {
  await page.waitForSelector('[data-history-period-comparison]')
  await page.waitForFunction(() => {
    const node = document.querySelector('[data-history-period-comparison-status]')
    return node && node.textContent && node.textContent !== 'Loading'
  })
}

async function assertNoOverflow(page, label) {
  const size = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }))
  assert(size.scrollWidth <= size.innerWidth + 1, `${label}: horizontal overflow (${size.scrollWidth} > ${size.innerWidth})`)
}

async function desktopComparable(browser) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1100 } })
  await installRoute(context, 'twitch', 'comparable')
  const page = await context.newPage()
  await page.goto(`${baseUrl}/twitch/history/`, { waitUntil: 'networkidle' })
  await waitForComparison(page)

  const block = page.locator('[data-history-period-comparison]')
  const text = await block.textContent()
  assert((await page.locator('[data-history-period-comparison-status]').textContent()) === 'Comparable', 'Desktop: comparable status is missing.')
  assert(text?.includes('Current period vs immediately preceding period'), 'Desktop: comparison heading is missing.')
  assert((text?.match(/7 selected days/g) ?? []).length === 2, 'Desktop: equal selected-day scopes are not visible.')
  assert(text?.includes('Viewer-minutes') && text?.includes('+40%'), 'Desktop: viewer-minute comparison is wrong.')
  assert(text?.includes('Peak viewers') && text?.includes('+20%'), 'Desktop: peak comparison is wrong.')
  assert(text?.includes('Average observed viewers') && text?.includes('+40%'), 'Desktop: average comparison is wrong.')
  assert(text?.includes('Equal completed-day scopes with complete coverage.'), 'Desktop: comparison evidence note is missing.')
  assert(await page.locator('[data-history-comparison-metric]').count() === 4, 'Desktop: four comparison metrics are required.')
  await assertNoOverflow(page, 'Desktop')
  await page.screenshot({ path: '/tmp/history-period-comparison-twitch-desktop.png', fullPage: true })
  await context.close()
}

async function mobilePartial(browser) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true })
  await installRoute(context, 'kick', 'partial')
  const page = await context.newPage()
  await page.goto(`${baseUrl}/kick/history/`, { waitUntil: 'networkidle' })
  await waitForComparison(page)

  const block = page.locator('[data-history-period-comparison]')
  const text = await block.textContent()
  assert((await page.locator('[data-history-period-comparison-status]').textContent()) === 'Partial', 'Mobile: partial status is missing.')
  assert(text?.includes('7 selected days') && text?.includes('4 selected days'), 'Mobile: mismatched day counts are not disclosed.')
  assert(text?.includes('Current and previous scopes contain 7 and 4 selected days.'), 'Mobile: partial reason is missing.')
  assert(text?.includes('Percentages withheld.'), 'Mobile: percentage withholding is not disclosed.')
  assert((text?.match(/Comparison withheld/g) ?? []).length === 4, 'Mobile: partial metrics must withhold comparisons.')
  await assertNoOverflow(page, 'Mobile')
  await page.screenshot({ path: '/tmp/history-period-comparison-kick-mobile.png', fullPage: true })
  await context.close()
}

const browser = await chromium.launch({ headless: true })
try {
  await desktopComparable(browser)
  await mobilePartial(browser)
  console.log('History period comparison browser gate passed for Twitch desktop and Kick mobile.')
} finally {
  await browser.close()
}
