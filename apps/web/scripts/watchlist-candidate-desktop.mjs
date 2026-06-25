import { appendFile } from 'node:fs/promises'
import { chromium } from 'playwright'
import {
  baseUrl,
  check,
  installNetworkGuards,
  setStoredDocument,
  waitDataIdle,
  waitReady,
} from './watchlist-shell-browser-fixture.mjs'
import { kickHistoryPayload } from './watchlist-history-fixtures.mjs'

const browser = await chromium.launch({ headless: true })
try {
  await verifyTwitchDesktop()
  await verifyTwitchTablet()
  await verifyKickPartialDesktop()
  console.log('Watchlist W3C desktop and tablet candidate gate passed.')
} finally {
  await browser.close()
}

async function verifyTwitchDesktop() {
  const calls = { api: [], analytics: 0, failLatest: false, failHistory: false }
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'no-preference' })
  await installNetworkGuards(context, calls)
  const page = await openPopulated(context, 'twitch', [
    { channelId: 'alpha', displayName: 'Alpha' },
    { channelId: 'daily_only', displayName: 'Daily Only' },
    { channelId: 'latest_only', displayName: 'Latest Only' },
    { channelId: 'missing', displayName: 'Missing From Both Bounded Results' },
  ])

  check(await page.locator('[data-watchlist-entry]').count() === 4, 'Twitch desktop candidate did not render four mixed entries.')
  check((await page.locator('[data-watchlist-entry="alpha"]').innerText()).includes('In latest observed set'), 'Twitch desktop latest-present state is missing.')
  check((await page.locator('[data-watchlist-entry="daily_only"]').innerText()).includes('Present in retained History result'), 'Twitch desktop retained-present state is missing.')
  check((await page.locator('[data-watchlist-entry="missing"]').innerText()).includes('Not confirmed offline'), 'Twitch desktop bounded-absence disclaimer is missing.')
  await assertNoOverflow(page, 'Twitch desktop')
  await assertFocusTreatment(page)

  const heroRadius = await page.locator('.page-head').evaluate((node) => Number.parseFloat(getComputedStyle(node).borderRadius))
  const cardRadius = await page.locator('.watchlist-card').first().evaluate((node) => Number.parseFloat(getComputedStyle(node).borderRadius))
  check(heroRadius >= 12 && cardRadius >= 12, `Candidate surface hierarchy is not active: ${JSON.stringify({ heroRadius, cardRadius })}`)

  await prepareFullPageScreenshot(page)
  await page.screenshot({ path: '/tmp/watchlist-candidate-twitch-desktop-1440.png', fullPage: true })
  await appendFile('/tmp/watchlist-candidate.log', `TWITCH_DESKTOP ${JSON.stringify({ calls: calls.api, heroRadius, cardRadius })}\n`)
  await context.close()
}

async function verifyTwitchTablet() {
  const calls = { api: [], analytics: 0, failLatest: false, failHistory: false }
  const context = await browser.newContext({ viewport: { width: 820, height: 1180 }, reducedMotion: 'reduce' })
  await installNetworkGuards(context, calls)
  const page = await openPopulated(context, 'twitch', [
    { channelId: 'alpha', displayName: 'Alpha' },
    { channelId: 'daily_only', displayName: 'Daily Only' },
    { channelId: 'missing', displayName: 'Missing' },
  ])

  await page.locator('[data-watchlist-entry="alpha"] [data-watchlist-action="move-down"]').click()
  await page.waitForFunction(() => document.activeElement?.matches('[data-watchlist-entry="alpha"] h2') ?? false)
  check(await page.locator('[data-watchlist-entry]').nth(1).getAttribute('data-watchlist-entry') === 'alpha', 'Tablet reorder did not preserve visual order.')
  await assertNoOverflow(page, 'Twitch tablet')
  await assertTouchTargets(page, 44)

  const controlColumns = await page.locator('.watchlist-controls').evaluate((node) => getComputedStyle(node).gridTemplateColumns)
  check(controlColumns.split(' ').length === 1, `Tablet controls did not collapse to one column: ${controlColumns}`)

  await prepareFullPageScreenshot(page)
  await page.screenshot({ path: '/tmp/watchlist-candidate-twitch-tablet-820.png', fullPage: true })
  await appendFile('/tmp/watchlist-candidate.log', `TWITCH_TABLET ${JSON.stringify({ calls: calls.api, controlColumns })}\n`)
  await context.close()
}

async function verifyKickPartialDesktop() {
  const calls = { api: [], analytics: 0, failLatest: false, failHistory: false }
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'no-preference' })
  await installNetworkGuards(context, calls)
  await context.route('**/api/kick-history?**', async (route) => {
    const url = new URL(route.request().url())
    const period = url.searchParams.get('period') === '7d' ? '7d' : '30d'
    const base = kickHistoryPayload(period)
    const payload = {
      ...base,
      state: 'partial',
      coverage: {
        ...base.coverage,
        state: 'partial',
        observedDays: Math.max(1, base.coverage.observedDays - 3),
        missingDays: 2,
        partialDays: 1,
        notes: ['Retained coverage is partial for this deterministic candidate state.'],
      },
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(payload) })
  })
  const page = await openPopulated(context, 'kick', [
    { channelId: 'gamma', displayName: 'Gamma' },
    { channelId: 'kick_one', displayName: 'Kick One' },
  ])

  check(await page.locator('body').getAttribute('data-watchlist-history-state') === 'partial', 'Kick partial History state was not exposed.')
  check((await page.locator('[data-watchlist-entry="gamma"]').innerText()).includes('Retained History is partial'), 'Kick partial evidence label is missing.')
  check((await page.locator('[data-watchlist-history-feedback]').innerText()).includes('Partial'), 'Kick partial feedback is missing.')
  await assertNoOverflow(page, 'Kick desktop partial')

  await prepareFullPageScreenshot(page)
  await page.screenshot({ path: '/tmp/watchlist-candidate-kick-desktop-1440-partial.png', fullPage: true })
  await appendFile('/tmp/watchlist-candidate.log', `KICK_DESKTOP_PARTIAL ${JSON.stringify({ calls: calls.api })}\n`)
  await context.close()
}

async function openPopulated(context, provider, entries) {
  const page = await context.newPage()
  await page.goto(`${baseUrl}/${provider}/watchlist/`, { waitUntil: 'domcontentloaded' })
  await waitReady(page)
  await waitDataIdle(page)
  await setStoredDocument(page, provider, entries)
  await page.reload({ waitUntil: 'domcontentloaded' })
  await waitReady(page)
  await waitDataIdle(page)
  return page
}

async function prepareFullPageScreenshot(page) {
  await page.evaluate(() => {
    const active = document.activeElement
    if (active instanceof HTMLElement) active.blur()
    window.scrollTo(0, 0)
  })
  await page.waitForFunction(() => window.scrollY === 0)
}

async function assertNoOverflow(page, label) {
  const dimensions = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, innerWidth }))
  check(dimensions.scrollWidth <= dimensions.innerWidth + 1, `${label} has horizontal overflow: ${JSON.stringify(dimensions)}`)
}

async function assertFocusTreatment(page) {
  const target = page.getByRole('button', { name: 'Refresh data' })
  await target.focus()
  const focus = await target.evaluate((node) => ({ outlineWidth: getComputedStyle(node).outlineWidth, outlineStyle: getComputedStyle(node).outlineStyle }))
  check(focus.outlineStyle !== 'none' && Number.parseFloat(focus.outlineWidth) >= 2, `Candidate focus treatment is insufficient: ${JSON.stringify(focus)}`)
}

async function assertTouchTargets(page, minimum) {
  const targets = await page.locator('button:visible, a.button:visible, .watchlist-external:visible').evaluateAll((nodes) => nodes.map((node) => ({ text: node.textContent?.trim(), height: node.getBoundingClientRect().height })))
  check(targets.every((target) => target.height >= minimum), `Candidate target below ${minimum}px: ${JSON.stringify(targets.filter((target) => target.height < minimum))}`)
}
