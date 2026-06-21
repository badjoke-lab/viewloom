import { chromium } from 'playwright'
import { historyPayload } from './history-peak-archive-fixture.mjs'

const baseUrl = process.env.HISTORY_BASE_URL ?? 'http://127.0.0.1:4173'

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

async function installRoutes(context) {
  await context.route('**/api/history?**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(historyPayload('twitch', true)) }))
  await context.route('**/api/kick-history?**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(historyPayload('kick', false)) }))
}

async function waitForArchive(page) {
  await page.waitForSelector('[data-history-peak-archive]')
  await page.waitForFunction(() => document.querySelectorAll('[data-history-peak-day]').length > 0)
}

async function openPeakArchive(page) {
  await page.locator('button[data-history-view="archives"]').click()
  await page.locator('button[data-history-archive-view="peaks"]').click()
  await page.waitForFunction(() => document.querySelector('.history-page')?.getAttribute('data-history-archive-view') === 'peaks')
}

async function assertNoOverflow(page, label) {
  const dimensions = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, innerWidth: window.innerWidth }))
  assert(dimensions.scrollWidth <= dimensions.innerWidth + 1, `${label}: horizontal overflow (${dimensions.scrollWidth} > ${dimensions.innerWidth})`)
}

async function desktopGate(browser) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
  await installRoutes(context)
  const page = await context.newPage()
  await page.goto(`${baseUrl}/twitch/history/`, { waitUntil: 'networkidle' })
  await waitForArchive(page)
  await openPeakArchive(page)

  const cards = page.locator('[data-history-peak-day]')
  assert(await cards.count() === 10, 'Desktop: Peak Archive must default to Top 10.')
  const summary = await page.locator('[data-history-peak-summary]').textContent()
  assert(summary?.includes('12 completed daily peaks'), 'Desktop: peak summary count is wrong.')
  assert(summary?.includes('1 exact timestamp'), 'Desktop: exact timestamp count is wrong.')
  const firstText = await cards.first().textContent()
  assert(firstText?.includes('99,000'), 'Desktop: highest peak is not first.')
  assert(firstText?.includes('Observed minute'), 'Desktop: exact timestamp precision is missing.')
  assert(firstText?.includes('Just Chatting'), 'Desktop: category context is missing.')

  const firstDay = await cards.first().getAttribute('data-history-peak-day')
  const dayFlowHref = await cards.first().locator('a').nth(0).getAttribute('href')
  const battleHref = await cards.first().locator('a').nth(1).getAttribute('href')
  assert(dayFlowHref?.startsWith('/twitch/day-flow/?date='), 'Desktop: Twitch Day Flow peak link is wrong.')
  assert(dayFlowHref?.includes('time='), 'Desktop: exact peak link must retain time.')
  assert(battleHref?.startsWith('/twitch/battle-lines/?date='), 'Desktop: Twitch Battle Lines peak link is wrong.')

  await page.locator('[data-history-peak-toggle]').click()
  await page.waitForFunction(() => document.querySelectorAll('[data-history-peak-day]').length === 12)
  assert((await page.locator('[data-history-peak-toggle]').textContent())?.includes('Show top 10'), 'Desktop: expanded toggle label is wrong.')

  await page.locator('[data-history-peak-day]').first().click({ position: { x: 8, y: 8 } })
  await page.waitForFunction((day) => new URL(location.href).searchParams.get('day') === day, firstDay)
  await assertNoOverflow(page, 'Desktop')
  await page.screenshot({ path: '/tmp/history-peak-twitch-desktop.png', fullPage: true })
  await context.close()
}

async function mobileGate(browser) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true })
  await installRoutes(context)
  const page = await context.newPage()
  await page.goto(`${baseUrl}/kick/history/`, { waitUntil: 'networkidle' })
  await waitForArchive(page)
  await openPeakArchive(page)

  const cards = page.locator('[data-history-peak-day]')
  assert(await cards.count() === 10, 'Mobile: fallback Peak Archive must default to Top 10.')
  const summary = await page.locator('[data-history-peak-summary]').textContent()
  assert(summary?.includes('0 exact timestamps'), 'Mobile: fallback archive must not invent exact timestamps.')
  const firstText = await cards.first().textContent()
  assert(firstText?.includes('Day only'), 'Mobile: fallback precision must be Day only.')
  assert(firstText?.includes('Unavailable'), 'Mobile: missing category must be explicit.')
  assert((await cards.first().locator('a').nth(0).getAttribute('href'))?.startsWith('/kick/day-flow/?date='), 'Mobile: Kick Day Flow peak link is wrong.')
  assert((await cards.first().locator('a').nth(1).getAttribute('href'))?.startsWith('/kick/battle-lines/?date='), 'Mobile: Kick Battle Lines peak link is wrong.')
  await assertNoOverflow(page, 'Mobile')
  await page.screenshot({ path: '/tmp/history-peak-kick-mobile.png', fullPage: true })
  await context.close()
}

const browser = await chromium.launch({ headless: true })
try {
  await desktopGate(browser)
  await mobileGate(browser)
  console.log('History Peak Archive browser gate passed for Twitch desktop and Kick mobile.')
} finally {
  await browser.close()
}
