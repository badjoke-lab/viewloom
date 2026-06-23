import { chromium } from 'playwright'
import { channelHistoryPayload } from './channel-profile-fixture.mjs'

const baseUrl = process.env.CHANNEL_BASE_URL ?? 'http://127.0.0.1:4173'
const ok = (value, message) => { if (!value) throw new Error(message) }

async function setup(context, calls) {
  await context.route('**/api/history?**', (route) => { calls.twitch += 1; return reply(route, 'twitch') })
  await context.route('**/api/kick-history?**', (route) => { calls.kick += 1; return reply(route, 'kick') })
  await context.route('**/api/twitch-status', status)
  await context.route('**/api/kick-status', status)
}
const reply = (route, provider) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(channelHistoryPayload(provider)) })
const status = (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{"state":"fresh"}' })
const text = (page, selector) => page.locator(selector).textContent()
const href = (page, selector) => page.locator(selector).first().getAttribute('href')

async function ready(page) {
  await page.waitForFunction(() => document.querySelector('[data-channel-state]')?.textContent !== 'Loading')
}
async function noOverflow(page, label) {
  const size = await page.evaluate(() => [document.documentElement.scrollWidth, innerWidth])
  ok(size[0] <= size[1] + 1, `${label}: horizontal overflow`)
}
async function waitForCalls(page, calls, provider, expected) {
  await page.waitForFunction(({ provider, expected }) => {
    const value = document.body.dataset.channelPeriod
    return Boolean(value && provider && expected)
  }, { provider, expected })
  for (let attempt = 0; attempt < 50 && calls[provider] < expected; attempt += 1) {
    await page.waitForTimeout(20)
  }
  ok(calls[provider] === expected, `${provider} request count is ${calls[provider]}, expected ${expected}.`)
}

async function twitchDesktop(browser) {
  const calls = { twitch: 0, kick: 0 }
  const context = await browser.newContext({ viewport: { width: 1440, height: 1100 } })
  await setup(context, calls)
  const page = await context.newPage()
  await page.goto(`${baseUrl}/twitch/history/?period=7d`, { waitUntil: 'domcontentloaded' })
  const ranking = page.locator('.metric-ledger .history-streamer-profile-link').first()
  await ranking.waitFor({ state: 'visible' })
  const rankingHref = await ranking.getAttribute('href')
  ok(rankingHref?.startsWith('/twitch/channel/?') && rankingHref.includes('id=alpha') && rankingHref.includes('period=7d'), 'Twitch History channel link is wrong.')

  calls.twitch = 0
  await page.goto(`${baseUrl}/twitch/channel/?id=alpha&name=Alpha+Channel&period=7d`, { waitUntil: 'domcontentloaded' })
  await ready(page)
  ok(calls.twitch === 1 && calls.kick === 0, 'Twitch profile did not use one Twitch-only History request.')
  ok(await page.locator('body').getAttribute('data-channel-period') === '7d', 'Initial Channel period state is wrong.')
  ok(await page.locator('body').getAttribute('data-channel-view') === 'overview', 'Initial Channel view state is wrong.')
  ok(await text(page, '[data-channel-name]') === 'Alpha Channel', 'Twitch channel name is wrong.')
  ok(await href(page, '[data-channel-external]') === 'https://www.twitch.tv/alpha', 'Twitch external link is wrong.')
  const summary = await text(page, '[data-channel-summary]')
  ok(summary?.includes('4,200,000') && summary.includes('42,000') && summary.includes('Daily Top 10 days'), 'Twitch summary is incomplete.')
  ok(await page.locator('.channel-trend-column').count() === 7, 'Twitch footprint day count is wrong.')
  ok(await page.locator('.channel-trend-column--absent').count() === 3, 'Twitch absent-day count is wrong.')
  ok(await page.locator('.channel-day-card').count() === 4, 'Twitch retained-day count is wrong.')
  ok(await page.locator('.channel-rival-card').count() === 2, 'Twitch rivalry count is wrong.')
  ok((await text(page, '[data-channel-scope]'))?.includes('not confirmed offline'), 'Twitch scope limitation is missing.')
  ok((await href(page, '.channel-day-card__actions a'))?.startsWith('/twitch/day-flow/'), 'Twitch Day Flow link crossed providers.')
  ok((await href(page, '.channel-rival-card a'))?.startsWith('/twitch/battle-lines/'), 'Twitch Battle Lines link crossed providers.')

  await page.evaluate(() => {
    const url = new URL(location.href)
    url.searchParams.set('view', 'days')
    url.searchParams.set('day', '2026-06-17')
    history.pushState(null, '', `${url.pathname}?${url.searchParams.toString()}`)
    dispatchEvent(new PopStateEvent('popstate'))
  })
  await page.waitForFunction(() => document.body.dataset.channelView === 'days' && document.body.dataset.channelSelectedDay === '2026-06-17')
  ok(calls.twitch === 1, 'View/day state change triggered another History request.')

  await page.locator('button[data-channel-period="30d"]').click()
  await ready(page)
  await waitForCalls(page, calls, 'twitch', 2)
  ok(await page.locator('body').getAttribute('data-channel-period') === '30d', 'Period control did not update Channel state.')
  ok(!new URL(page.url()).searchParams.has('period'), 'Default 30d period was not normalized from the URL.')

  await page.goBack()
  await ready(page)
  await waitForCalls(page, calls, 'twitch', 3)
  ok(await page.locator('body').getAttribute('data-channel-period') === '7d', 'Back navigation did not restore 7d Channel state.')
  ok(await page.locator('body').getAttribute('data-channel-view') === 'days', 'Back navigation did not restore the Channel view.')
  ok(await page.locator('body').getAttribute('data-channel-selected-day') === '2026-06-17', 'Back navigation did not restore the selected day.')

  await noOverflow(page, 'Twitch desktop')
  await page.screenshot({ path: '/tmp/channel-profile-twitch-desktop.png', fullPage: true })
  await context.close()
}

async function kickMobile(browser) {
  const calls = { twitch: 0, kick: 0 }
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true })
  await setup(context, calls)
  const page = await context.newPage()
  await page.goto(`${baseUrl}/kick/channel/?id=alpha&name=Alpha+Channel&period=30d`, { waitUntil: 'domcontentloaded' })
  await ready(page)
  ok(calls.kick === 1 && calls.twitch === 0, 'Kick profile did not use one Kick-only History request.')
  ok(!new URL(page.url()).searchParams.has('period'), 'Kick default 30d URL was not normalized.')
  ok(await href(page, '[data-channel-external]') === 'https://kick.com/alpha', 'Kick external link is wrong.')
  ok((await href(page, '.channel-day-card__actions a'))?.startsWith('/kick/day-flow/'), 'Kick Day Flow link crossed providers.')
  ok((await href(page, '.channel-rival-card a'))?.startsWith('/kick/battle-lines/'), 'Kick Battle Lines link crossed providers.')
  await noOverflow(page, 'Kick mobile')
  await page.screenshot({ path: '/tmp/channel-profile-kick-mobile.png', fullPage: true })
  await context.close()
}

async function missingId(browser) {
  const calls = { twitch: 0, kick: 0 }
  const context = await browser.newContext({ viewport: { width: 900, height: 700 } })
  await setup(context, calls)
  const page = await context.newPage()
  await page.goto(`${baseUrl}/twitch/channel/?period=90d&view=invalid&day=June-20`, { waitUntil: 'domcontentloaded' })
  await ready(page)
  ok(await text(page, '[data-channel-name]') === 'Channel not selected', 'Missing-id state is wrong.')
  ok(calls.twitch === 0 && calls.kick === 0, 'Missing-id state requested History data.')
  ok(await page.locator('body').getAttribute('data-channel-period') === '30d', 'Missing-id fallback period is wrong.')
  ok(await page.locator('body').getAttribute('data-channel-view') === 'overview', 'Missing-id fallback view is wrong.')
  ok(!new URL(page.url()).searchParams.has('period') && !new URL(page.url()).searchParams.has('view') && !new URL(page.url()).searchParams.has('day'), 'Invalid missing-id URL state was not normalized.')
  await context.close()
}

const browser = await chromium.launch({ headless: true })
try {
  await twitchDesktop(browser)
  await kickMobile(browser)
  await missingId(browser)
  console.log('Channel profile browser gate passed.')
} finally {
  await browser.close()
}
