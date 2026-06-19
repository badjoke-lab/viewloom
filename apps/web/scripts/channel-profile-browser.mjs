import { chromium } from 'playwright'
import { channelHistoryPayload } from './channel-profile-fixture.mjs'

const baseUrl = process.env.CHANNEL_BASE_URL ?? 'http://127.0.0.1:4173'
const assert = (condition, message) => { if (!condition) throw new Error(message) }

async function installRoutes(context, counts) {
  await context.route('**/api/history?**', (route) => {
    counts.twitch += 1
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(channelHistoryPayload('twitch')) })
  })
  await context.route('**/api/kick-history?**', (route) => {
    counts.kick += 1
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(channelHistoryPayload('kick')) })
  })
  await context.route('**/api/twitch-status', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ state: 'fresh' }) }))
  await context.route('**/api/kick-status', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ state: 'fresh' }) }))
}

async function waitForProfile(page) {
  await page.waitForSelector('[data-channel-name]')
  await page.waitForFunction(() => {
    const node = document.querySelector('[data-channel-state]')
    return node && node.textContent && node.textContent !== 'Loading'
  })
}

async function assertNoOverflow(page, label) {
  const size = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, innerWidth: window.innerWidth }))
  assert(size.scrollWidth <= size.innerWidth + 1, `${label}: horizontal overflow (${size.scrollWidth} > ${size.innerWidth})`)
}

async function twitchDesktop(browser) {
  const counts = { twitch: 0, kick: 0 }
  const context = await browser.newContext({ viewport: { width: 1440, height: 1100 } })
  await installRoutes(context, counts)
  const page = await context.newPage()

  await page.goto(`${baseUrl}/twitch/history/?period=7d`, { waitUntil: 'domcontentloaded' })
  const rankingLink = page.locator('.history-streamer-profile-link').first()
  await rankingLink.waitFor()
  const href = await rankingLink.getAttribute('href')
  assert(href?.startsWith('/twitch/channel/?'), 'Twitch History ranking did not link to the Twitch channel page.')
  assert(href?.includes('id=alpha') && href?.includes('name=Alpha+Channel') && href?.includes('period=7d'), 'Twitch ranking link lost channel identity or period.')

  counts.twitch = 0
  await page.goto(`${baseUrl}/twitch/channel/?id=alpha&name=Alpha+Channel&period=7d`, { waitUntil: 'domcontentloaded' })
  await waitForProfile(page)
  assert(counts.twitch === 1, `Twitch channel page made ${counts.twitch} History requests instead of one.`)
  assert(counts.kick === 0, 'Twitch channel page called the Kick History endpoint.')
  assert((await page.locator('[data-channel-name]').textContent()) === 'Alpha Channel', 'Twitch channel name is wrong.')
  assert((await page.locator('[data-channel-provider]').textContent())?.includes('Twitch retained ranking footprint'), 'Twitch provider scope is missing.')
  const external = await page.locator('[data-channel-external]').getAttribute('href')
  assert(external === 'https://www.twitch.tv/alpha', 'Twitch external channel link is wrong.')

  const summary = await page.locator('[data-channel-summary]').textContent()
  assert(summary?.includes('4,200,000') && summary?.includes('42,000'), 'Twitch period summary values are missing.')
  assert(summary?.includes('Daily Top 10 days') && summary?.includes('4'), 'Twitch retained daily appearance count is wrong.')
  assert(await page.locator('.channel-trend-column').count() === 7, 'Twitch daily footprint must show seven requested days.')
  assert(await page.locator('.channel-trend-column--absent').count() === 3, 'Twitch daily footprint must show three non-retained days.')
  assert(await page.locator('.channel-day-card').count() === 4, 'Twitch recent retained days count is wrong.')
  assert(await page.locator('.channel-rival-card').count() === 2, 'Twitch rivalry candidate count is wrong.')

  const trendText = await page.locator('[data-channel-trend]').textContent()
  assert(trendText?.includes('not confirmed offline'), 'Twitch trend does not disclose the Top 10 limitation.')
  const scope = await page.locator('[data-channel-scope]').textContent()
  assert(scope?.includes('not confirmed offline') && scope?.includes('Session start/end history is not available'), 'Twitch scope limitations are missing.')
  const dayHref = await page.locator('.channel-day-card__actions a').first().getAttribute('href')
  assert(dayHref?.startsWith('/twitch/day-flow/'), 'Twitch retained day link crossed provider routes.')
  const battleHref = await page.locator('.channel-rival-card a').first().getAttribute('href')
  assert(battleHref?.startsWith('/twitch/battle-lines/'), 'Twitch rivalry link crossed provider routes.')
  await assertNoOverflow(page, 'Twitch desktop')
  await page.screenshot({ path: '/tmp/channel-profile-twitch-desktop.png', fullPage: true })
  await context.close()
}

async function kickMobile(browser) {
  const counts = { twitch: 0, kick: 0 }
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true })
  await installRoutes(context, counts)
  const page = await context.newPage()
  await page.goto(`${baseUrl}/kick/channel/?id=alpha&name=Alpha+Channel&period=30d`, { waitUntil: 'domcontentloaded' })
  await waitForProfile(page)

  assert(counts.kick === 1, `Kick channel page made ${counts.kick} History requests instead of one.`)
  assert(counts.twitch === 0, 'Kick channel page called the Twitch History endpoint.')
  assert((await page.locator('[data-channel-provider]').textContent())?.includes('Kick retained ranking footprint'), 'Kick provider scope is missing.')
  const external = await page.locator('[data-channel-external]').getAttribute('href')
  assert(external === 'https://kick.com/alpha', 'Kick external channel link is wrong.')
  const dayHref = await page.locator('.channel-day-card__actions a').first().getAttribute('href')
  assert(dayHref?.startsWith('/kick/day-flow/'), 'Kick retained day link crossed provider routes.')
  const battleHref = await page.locator('.channel-rival-card a').first().getAttribute('href')
  assert(battleHref?.startsWith('/kick/battle-lines/'), 'Kick rivalry link crossed provider routes.')
  await assertNoOverflow(page, 'Kick mobile')
  await page.screenshot({ path: '/tmp/channel-profile-kick-mobile.png', fullPage: true })
  await context.close()
}

async function missingId(browser) {
  const counts = { twitch: 0, kick: 0 }
  const context = await browser.newContext({ viewport: { width: 900, height: 700 } })
  await installRoutes(context, counts)
  const page = await context.newPage()
  await page.goto(`${baseUrl}/twitch/channel/`, { waitUntil: 'domcontentloaded' })
  await waitForProfile(page)
  assert((await page.locator('[data-channel-name]').textContent()) === 'Channel not selected', 'Missing-id state title is wrong.')
  assert((await page.locator('[data-channel-feedback]').textContent())?.includes('provide an id query parameter'), 'Missing-id guidance is absent.')
  assert(counts.twitch === 0 && counts.kick === 0, 'Missing-id state must not request History data.')
  await context.close()
}

const browser = await chromium.launch({ headless: true })
try {
  await twitchDesktop(browser)
  await kickMobile(browser)
  await missingId(browser)
  console.log('Channel profile browser gate passed for Twitch desktop, Kick mobile, History links, and missing-id state.')
} finally {
  await browser.close()
}
