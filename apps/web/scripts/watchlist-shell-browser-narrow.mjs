import { appendFile } from 'node:fs/promises'
import { chromium } from 'playwright'
import {
  baseUrl,
  check,
  installNetworkGuards,
  readStoredDocument,
  waitReady,
} from './watchlist-shell-browser-fixture.mjs'

const browser = await chromium.launch({ headless: true })
try {
  const calls = { api: [], analytics: 0 }
  const context = await browser.newContext({
    viewport: { width: 360, height: 800 },
    isMobile: true,
    reducedMotion: 'reduce',
  })
  await installNetworkGuards(context, calls)
  const page = await context.newPage()
  await page.goto(`${baseUrl}/kick/watchlist/`, { waitUntil: 'domcontentloaded' })
  await waitReady(page)

  check(await page.title() === 'Kick Local Watchlist — ViewLoom', 'Kick Watchlist title is wrong.')
  check(await page.locator('[data-watchlist-empty]').isVisible(), 'Kick empty state is not visible.')
  check(calls.api.length === 0, `Kick empty Watchlist issued API requests: ${JSON.stringify(calls.api)}`)

  const menu = page.locator('[data-mobile-menu]')
  await menu.click()
  check(await page.locator('.global-nav').evaluate((node) => getComputedStyle(node).display !== 'none'), 'Mobile global navigation did not open.')
  check(await menu.getAttribute('aria-expanded') === 'true', 'Mobile menu did not expose expanded state.')
  check(await menu.getAttribute('aria-label') === 'Close navigation', 'Mobile menu label did not switch to close state.')
  await menu.click()
  check(await menu.getAttribute('aria-expanded') === 'false', 'Mobile menu did not close.')

  const input = page.getByLabel('Kick channel id or Kick URL')
  await input.fill('https://kick.com/Kick_One/')
  await page.getByRole('button', { name: 'Add channel' }).click()
  await page.locator('[data-watchlist-entry="kick_one"]').waitFor()
  check((await readStoredDocument(page, 'kick')).entries[0].channelId === 'kick_one', 'Kick URL was not normalized and saved.')
  check(await page.evaluate(() => localStorage.getItem('viewloom.watchlist.twitch.v1')) === null, 'Kick Watchlist mutated Twitch storage.')

  await input.fill('https://www.twitch.tv/not_kick')
  await page.getByRole('button', { name: 'Add channel' }).click()
  check((await page.locator('[data-watchlist-storage-feedback]').innerText()).includes('Twitch URL'), 'Cross-provider Kick feedback is not specific.')

  const longId = `long_${'x'.repeat(58)}`
  await input.fill(longId)
  await page.getByRole('button', { name: 'Add channel' }).click()
  await page.locator(`[data-watchlist-entry="${longId}"]`).waitFor()

  const dimensions = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth,
  }))
  check(dimensions.scrollWidth <= dimensions.innerWidth + 1, `Kick 360 page has horizontal overflow: ${JSON.stringify(dimensions)}`)

  const primaryTargets = await page.locator('[data-watchlist-add], [data-watchlist-period], .watchlist-card__manage .button').evaluateAll((nodes) => nodes.map((node) => ({
    text: node.textContent?.trim(),
    height: node.getBoundingClientRect().height,
  })))
  check(primaryTargets.every((target) => target.height >= 44), `Kick 360 target below 44px: ${JSON.stringify(primaryTargets)}`)
  check(primaryTargets.filter((target) => ['Move up', 'Move down', 'Remove'].includes(target.text ?? '')).every((target) => target.height >= 48), `Kick 360 manage target below 48px: ${JSON.stringify(primaryTargets)}`)

  const headingBox = await page.locator(`[data-watchlist-entry="${longId}"] h2`).evaluate((node) => ({
    scrollWidth: node.scrollWidth,
    clientWidth: node.clientWidth,
  }))
  check(headingBox.scrollWidth <= headingBox.clientWidth + 1, `Long Kick id widened the card: ${JSON.stringify(headingBox)}`)

  const transitionDuration = await page.locator('.watchlist-card').first().evaluate((node) => getComputedStyle(node).transitionDuration)
  const durationMs = transitionDuration.trim().endsWith('ms')
    ? Number.parseFloat(transitionDuration)
    : Number.parseFloat(transitionDuration) * 1000
  check(!Number.isFinite(durationMs) || durationMs <= .011, `Reduced-motion transition is too long: ${transitionDuration}`)

  await page.getByRole('button', { name: 'Last 7 days' }).click()
  check(new URL(page.url()).searchParams.get('period') === '7d', 'Kick mobile period state is wrong.')
  check(calls.api.length === 0, `Kick mobile period issued API requests: ${JSON.stringify(calls.api)}`)

  await page.screenshot({ path: '/tmp/watchlist-kick-mobile-360.png', fullPage: true })
  const diagnostics = {
    apiCalls: calls.api,
    analyticsLoads: calls.analytics,
    dimensions,
    primaryTargets,
    transitionDuration,
  }
  console.log(JSON.stringify(diagnostics))
  await appendFile('/tmp/watchlist-shell-preview.log', `\nW3A_NARROW ${JSON.stringify(diagnostics)}\n`)

  await context.close()
  console.log('Watchlist W3A narrow responsive gate passed.')
} finally {
  await browser.close()
}
