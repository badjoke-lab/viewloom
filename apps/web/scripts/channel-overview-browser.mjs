import { chromium } from 'playwright'
import { channelHistoryPayload } from './channel-profile-fixture.mjs'

const baseUrl = process.env.CHANNEL_BASE_URL ?? 'http://127.0.0.1:4173'
const assert = (condition, message) => { if (!condition) throw new Error(message) }

async function installRoutes(context, calls) {
  await context.route('**/api/history?**', (route) => {
    calls.twitch += 1
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(channelHistoryPayload('twitch')) })
  })
  await context.route('**/api/kick-history?**', (route) => {
    calls.kick += 1
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(channelHistoryPayload('kick')) })
  })
  await context.route('**/api/twitch-status', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{"state":"fresh"}' }))
  await context.route('**/api/kick-status', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{"state":"fresh"}' }))
}

async function waitReady(page) {
  await page.waitForFunction(() => document.querySelector('[data-channel-state]')?.textContent !== 'Loading')
}

async function noOverflow(page, label) {
  const result = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, innerWidth }))
  assert(result.scrollWidth <= result.innerWidth + 1, `${label}: horizontal overflow (${result.scrollWidth} > ${result.innerWidth}).`)
}

async function run(browser, provider, viewport, screenshot) {
  const calls = { twitch: 0, kick: 0 }
  const context = await browser.newContext({ viewport, isMobile: viewport.width <= 420 })
  await installRoutes(context, calls)
  const page = await context.newPage()
  await page.goto(`${baseUrl}/${provider}/channel/?id=alpha&name=Alpha+Channel&period=7d`, { waitUntil: 'domcontentloaded' })
  await waitReady(page)

  assert(calls[provider] === 1, `${provider}: initial request count is wrong.`)
  assert(await page.locator('.channel-summary-card--primary').count() === 2, `${provider}: primary summary hierarchy is wrong.`)
  assert(await page.locator('.channel-trend-column').count() === 7, `${provider}: requested-day footprint is wrong.`)
  assert(await page.locator('.channel-trend-column--absent').count() === 3, `${provider}: absent-day count is wrong.`)
  assert(await page.locator('.channel-trend-column--partial').count() === 1, `${provider}: partial-day count is wrong.`)
  assert(await page.locator('[data-channel-recent-days] .channel-recent-day').count() === 3, `${provider}: recent preview is not bounded to three.`)
  assert(await page.locator('.channel-rival-card').count() <= 3, `${provider}: rivalry preview is not bounded to three.`)

  const initialPanel = await page.locator('[data-channel-selected-day]').textContent()
  assert(initialPanel?.includes('Latest retained day') && initialPanel.includes('Jun 17, 2026'), `${provider}: latest retained-day fallback is wrong.`)

  await page.locator('[data-channel-select-day="2026-06-18"]').first().click()
  await page.waitForFunction(() => document.body.dataset.channelSelectedDate === '2026-06-18')
  const absentPanel = await page.locator('[data-channel-selected-day]').textContent()
  assert(absentPanel?.includes('Not in retained daily Top 10'), `${provider}: absent day label is missing.`)
  assert(absentPanel?.includes('does not confirm that the channel was offline'), `${provider}: offline limitation is missing.`)
  assert(new URL(page.url()).searchParams.get('day') === '2026-06-18', `${provider}: absent day URL state is wrong.`)
  assert(calls[provider] === 1, `${provider}: absent day selection refetched.`)

  await page.locator('[data-channel-select-day="2026-06-15"]').first().click()
  await page.waitForFunction(() => document.body.dataset.channelSelectedDate === '2026-06-15')
  const partialPanel = await page.locator('[data-channel-selected-day]').textContent()
  assert(partialPanel?.includes('Partial') && partialPanel.includes('575,000'), `${provider}: partial retained day is wrong.`)
  assert(calls[provider] === 1, `${provider}: partial day selection refetched.`)

  const selected = page.locator('[data-channel-select-day="2026-06-15"].is-selected')
  assert(await selected.count() >= 1, `${provider}: selected-day visual state is missing.`)
  await noOverflow(page, `${provider} ${viewport.width}px`)
  await page.screenshot({ path: screenshot, fullPage: true })
  await context.close()
}

const browser = await chromium.launch({ headless: true })
try {
  await run(browser, 'twitch', { width: 1440, height: 1100 }, '/tmp/channel-overview-twitch-desktop.png')
  await run(browser, 'kick', { width: 390, height: 844 }, '/tmp/channel-overview-kick-mobile.png')
  console.log('Channel Overview browser gate passed.')
} finally {
  await browser.close()
}
