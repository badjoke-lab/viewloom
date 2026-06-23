import { chromium } from 'playwright'
import { channelHistoryPayload } from './channel-profile-fixture.mjs'

const baseUrl = process.env.CHANNEL_BASE_URL ?? 'http://127.0.0.1:4173'
const assert = (condition, message) => { if (!condition) throw new Error(message) }

function channelC4aPayload(provider) {
  const payload = structuredClone(channelHistoryPayload(provider))
  const extraDays = Array.from({ length: 8 }, (_, index) => {
    const day = `2026-06-${String(index + 1).padStart(2, '0')}`
    return {
      day,
      coverageState: index === 2 ? 'partial' : 'good',
      topStreamers: [{
        streamerId: 'alpha',
        displayName: 'Alpha Channel',
        viewerMinutes: 420000 + index * 17000,
        peakViewers: 8200 + index * 110,
        avgViewers: 6900 + index * 90,
        observedMinutes: 60,
        rankByViewerMinutes: (index % 5) + 1,
      }],
    }
  })

  payload.daily = [...extraDays, ...(payload.daily ?? [])]
  payload.period = { ...(payload.period ?? {}), label: 'Last 30 days', days: 30 }
  payload.coverage = { ...(payload.coverage ?? {}), observedDays: payload.daily.length }
  payload.battleArchive = [
    battle('2026-06-20', 'Zulu', 'zulu', 70, 100),
    battle('2026-06-20', 'Beta', 'beta', 95, 500),
    battle('2026-06-18', 'Gamma', 'gamma', 95, 200),
    battle('2026-06-21', 'Echo', 'echo', 95, 200),
    battle('2026-06-21', 'Delta', 'delta', 95, 200),
  ]
  return payload
}

function battle(day, opponentName, opponentId, score, viewerMinutesGap) {
  return {
    day,
    streamerAId: 'alpha',
    streamerAName: 'Alpha Channel',
    streamerBId: opponentId,
    streamerBName: opponentName,
    score,
    viewerMinutesGap,
  }
}

function retainedCount(payload) {
  return (payload.daily ?? []).filter((day) => (day.topStreamers ?? []).some((row) => row.streamerId === 'alpha')).length
}

async function installRoutes(context, calls) {
  await context.route('**/api/history?**', (route) => {
    calls.twitch += 1
    const period = new URL(route.request().url()).searchParams.get('period')
    const payload = period === '30d' ? channelC4aPayload('twitch') : channelHistoryPayload('twitch')
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(payload) })
  })
  await context.route('**/api/kick-history?**', (route) => {
    calls.kick += 1
    const period = new URL(route.request().url()).searchParams.get('period')
    const payload = period === '30d' ? channelC4aPayload('kick') : channelHistoryPayload('kick')
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(payload) })
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

async function runOverview(browser, provider, viewport, screenshot) {
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
  await noOverflow(page, `${provider} overview ${viewport.width}px`)
  await page.screenshot({ path: screenshot, fullPage: true })
  await context.close()
}

async function runC4a(browser, provider, viewport, screenshot) {
  const calls = { twitch: 0, kick: 0 }
  const context = await browser.newContext({ viewport, isMobile: viewport.width <= 420 })
  await installRoutes(context, calls)
  const page = await context.newPage()
  const total = retainedCount(channelC4aPayload(provider))
  await page.goto(`${baseUrl}/${provider}/channel/?id=alpha&name=Alpha+Channel&period=30d&view=days`, { waitUntil: 'domcontentloaded' })
  await waitReady(page)
  await page.waitForFunction((expected) => document.querySelectorAll('.channel-day-card').length === expected, total)
  await page.waitForFunction((expected) => document.querySelector('[data-channel-days-count]')?.textContent === `Showing 6 of ${expected} retained days`, total)

  const cards = page.locator('.channel-day-card')
  const visibleCount = () => cards.evaluateAll((nodes) => nodes.filter((node) => !node.hidden).length)
  assert(total > 6, `${provider}: C4A fixture does not exceed the recent-day limit.`)
  assert(await visibleCount() === 6, `${provider}: Retained Days did not start at six cards.`)
  assert(calls[provider] === 1, `${provider}: initial C4A request count is wrong.`)

  const toggle = page.locator('[data-channel-days-toggle]')
  assert(await toggle.textContent() === 'Show all', `${provider}: initial retained-day toggle label is wrong.`)
  await toggle.click()
  await page.waitForFunction(() => document.body.dataset.channelDaysExpanded === 'true')
  assert(await visibleCount() === total, `${provider}: Show all did not reveal every retained day.`)
  assert((await page.locator('[data-channel-days-count]').textContent()) === `Showing all ${total} retained days`, `${provider}: expanded retained-day count is wrong.`)
  assert(await toggle.textContent() === 'Show recent', `${provider}: expanded toggle label is wrong.`)
  assert(calls[provider] === 1, `${provider}: Show all refetched History data.`)

  await toggle.click()
  await page.waitForFunction(() => document.body.dataset.channelDaysExpanded === 'false')
  assert(await visibleCount() === 6, `${provider}: Show recent did not restore six cards.`)
  assert(calls[provider] === 1, `${provider}: Show recent refetched History data.`)

  await page.locator('[data-channel-view="overview"]').click()
  await page.waitForFunction(() => document.body.dataset.channelView === 'overview')
  const rivals = await page.locator('.channel-rival-card strong').allTextContents()
  assert(JSON.stringify(rivals) === JSON.stringify(['Delta', 'Echo', 'Gamma']), `${provider}: rivalry ordering is not deterministic (${rivals.join(', ')}).`)
  assert(calls[provider] === 1, `${provider}: task switch refetched History data.`)

  await noOverflow(page, `${provider} C4A ${viewport.width}px`)
  await page.screenshot({ path: screenshot, fullPage: true })
  await context.close()
}

const browser = await chromium.launch({ headless: true })
try {
  await runOverview(browser, 'twitch', { width: 1440, height: 1100 }, '/tmp/channel-overview-twitch-desktop.png')
  await runOverview(browser, 'kick', { width: 390, height: 844 }, '/tmp/channel-overview-kick-mobile.png')
  await runC4a(browser, 'twitch', { width: 1440, height: 1100 }, '/tmp/channel-c4a-twitch-desktop.png')
  await runC4a(browser, 'kick', { width: 390, height: 844 }, '/tmp/channel-c4a-kick-mobile.png')
  console.log('Channel Overview and C4A browser gate passed.')
} finally {
  await browser.close()
}
