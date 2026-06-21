import { chromium } from 'playwright'
import { historyPayload } from './history-battle-archive-fixture.mjs'

const baseUrl = process.env.HISTORY_BASE_URL ?? 'http://127.0.0.1:4173'
const assert = (condition, message) => { if (!condition) throw new Error(message) }

async function installRoutes(context) {
  await context.route('**/api/history?**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(historyPayload('twitch')) }))
  await context.route('**/api/kick-history?**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(historyPayload('kick')) }))
}

async function waitForArchive(page) {
  await page.waitForSelector('[data-history-battle-archive]', { state: 'attached' })
  await page.waitForFunction(() => document.querySelectorAll('[data-history-battle-day]').length > 0)
}

async function openBattleArchive(page) {
  await page.locator('button[data-history-view="archives"]').click()
  await page.locator('button[data-history-archive-view="battles"]').click()
  await page.waitForFunction(() => document.querySelector('.history-page')?.getAttribute('data-history-archive-view') === 'battles')
}

async function assertNoOverflow(page, label) {
  const dimensions = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, innerWidth: window.innerWidth }))
  assert(dimensions.scrollWidth <= dimensions.innerWidth + 1, `${label}: horizontal overflow (${dimensions.scrollWidth} > ${dimensions.innerWidth})`)
}

async function desktopGate(browser) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1100 } })
  await installRoutes(context)
  const page = await context.newPage()
  await page.goto(`${baseUrl}/twitch/history/`, { waitUntil: 'networkidle' })
  await waitForArchive(page)
  await openBattleArchive(page)

  const cards = page.locator('[data-history-battle-day]')
  assert(await cards.count() === 10, 'Desktop: Battle Archive must default to Top 10.')
  const summary = await page.locator('[data-history-battle-summary]').textContent()
  assert(summary?.includes('12 completed-day matchups'), 'Desktop: battle summary count is wrong.')
  assert(summary?.includes('exact event times unavailable'), 'Desktop: battle evidence limitation is missing.')
  const firstText = await cards.first().textContent()
  assert(firstText?.includes('Alpha 0') && firstText?.includes('Beta 0'), 'Desktop: matchup names are missing.')
  assert(firstText?.includes('Daily aggregates'), 'Desktop: aggregate basis is missing.')
  assert(firstText?.includes('Day only'), 'Desktop: day precision is missing.')
  assert(firstText?.includes('No reversal or exact event time inferred.'), 'Desktop: non-inference statement is missing.')

  const firstDay = await cards.first().getAttribute('data-history-battle-day')
  const href = await cards.first().locator('a').getAttribute('href')
  assert(href?.startsWith('/twitch/battle-lines/?'), 'Desktop: Twitch Battle Lines link is wrong.')
  assert(href?.includes('battle=alpha-0%3Abeta-0'), 'Desktop: selected battle pair is missing from the link.')
  assert(href?.includes('date=2026-06-06') && href?.includes('range=date'), 'Desktop: selected battle day is missing from the link.')

  await page.locator('[data-history-battle-toggle]').click()
  await page.waitForFunction(() => document.querySelectorAll('[data-history-battle-day]').length === 12)
  assert((await page.locator('[data-history-battle-toggle]').textContent())?.includes('Show top 10'), 'Desktop: expanded toggle label is wrong.')

  await page.locator('[data-history-battle-day]').first().click({ position: { x: 8, y: 8 } })
  await page.waitForFunction((day) => new URL(location.href).searchParams.get('day') === day, firstDay)
  await assertNoOverflow(page, 'Desktop')
  await page.screenshot({ path: '/tmp/history-battle-twitch-desktop.png', fullPage: true })
  await context.close()
}

async function mobileGate(browser) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true })
  await installRoutes(context)
  const page = await context.newPage()
  await page.goto(`${baseUrl}/kick/history/`, { waitUntil: 'networkidle' })
  await waitForArchive(page)
  await openBattleArchive(page)

  const cards = page.locator('[data-history-battle-day]')
  assert(await cards.count() === 10, 'Mobile: Battle Archive must default to Top 10.')
  const firstText = await cards.first().textContent()
  assert(firstText?.includes('Day only'), 'Mobile: day precision is missing.')
  assert(firstText?.includes('No reversal or exact event time inferred.'), 'Mobile: evidence limitation is missing.')
  const href = await cards.first().locator('a').getAttribute('href')
  assert(href?.startsWith('/kick/battle-lines/?'), 'Mobile: Kick Battle Lines link is wrong.')
  await assertNoOverflow(page, 'Mobile')
  await page.screenshot({ path: '/tmp/history-battle-kick-mobile.png', fullPage: true })
  await context.close()
}

const browser = await chromium.launch({ headless: true })
try {
  await desktopGate(browser)
  await mobileGate(browser)
  console.log('History Battle Archive browser gate passed for Twitch desktop and Kick mobile.')
} finally {
  await browser.close()
}
