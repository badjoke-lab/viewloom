import { appendFile } from 'node:fs/promises'
import { chromium } from 'playwright'
import {
  baseUrl,
  check,
  countCalls,
  installNetworkGuards,
  readStoredDocument,
  waitDataIdle,
  waitReady,
} from './watchlist-shell-browser-fixture.mjs'

const browser = await chromium.launch({ headless: true })
try {
  const calls = { api: [], analytics: 0, failLatest: false, failHistory: false }
  const context = await browser.newContext({
    viewport: { width: 360, height: 800 },
    isMobile: true,
    reducedMotion: 'reduce',
  })
  await installNetworkGuards(context, calls)
  const page = await context.newPage()
  await page.goto(`${baseUrl}/kick/watchlist/`, { waitUntil: 'domcontentloaded' })
  await waitReady(page)
  await waitDataIdle(page)

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
  check(calls.api.length === 0, 'Kick task-local add made a feature-data request.')

  await input.fill('https://www.twitch.tv/not_kick')
  await page.getByRole('button', { name: 'Add channel' }).click()
  check((await page.locator('[data-watchlist-storage-feedback]').innerText()).includes('Twitch URL'), 'Cross-provider Kick feedback is not specific.')

  const longId = `long_${'x'.repeat(58)}`
  await input.fill(longId)
  await page.getByRole('button', { name: 'Add channel' }).click()
  await page.locator(`[data-watchlist-entry="${longId}"]`).waitFor()

  await page.getByRole('button', { name: 'Refresh data' }).click()
  await waitDataIdle(page)
  check(countCalls(calls, '/api/kick-heatmap') === 1, 'Kick mobile refresh did not make one latest request.')
  check(countCalls(calls, '/api/kick-history') === 1, 'Kick mobile refresh did not make one History request.')
  const kickOneText = await page.locator('[data-watchlist-entry="kick_one"]').innerText()
  check(kickOneText.includes('In latest observed set'), 'Kick latest evidence did not render on mobile.')
  check(kickOneText.includes('Not in retained History result'), 'Kick retained absence did not render on mobile.')
  check(kickOneText.includes('No complete history is implied'), 'Kick retained absence qualifier is missing on mobile.')

  const dimensions = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth,
  }))
  check(dimensions.scrollWidth <= dimensions.innerWidth + 1, `Kick 360 page has horizontal overflow: ${JSON.stringify(dimensions)}`)

  const primaryTargets = await page.locator('[data-watchlist-add], [data-watchlist-period], [data-watchlist-refresh], .watchlist-card__manage .button').evaluateAll((nodes) => nodes.map((node) => ({
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

  const evidenceBoxes = await page.locator('.watchlist-evidence-facts').evaluateAll((nodes) => nodes.map((node) => ({
    scrollWidth: node.scrollWidth,
    clientWidth: node.clientWidth,
  })))
  check(evidenceBoxes.every((box) => box.scrollWidth <= box.clientWidth + 1), `Kick evidence facts overflow at 360px: ${JSON.stringify(evidenceBoxes)}`)

  const transitionDuration = await page.locator('.watchlist-card').first().evaluate((node) => getComputedStyle(node).transitionDuration)
  const durationMs = transitionDuration.trim().endsWith('ms')
    ? Number.parseFloat(transitionDuration)
    : Number.parseFloat(transitionDuration) * 1000
  check(!Number.isFinite(durationMs) || durationMs <= .011, `Reduced-motion transition is too long: ${transitionDuration}`)

  await page.getByRole('button', { name: 'Last 7 days' }).click()
  await waitDataIdle(page)
  check(new URL(page.url()).searchParams.get('period') === '7d', 'Kick mobile period state is wrong.')
  check(countCalls(calls, '/api/kick-heatmap') === 1, 'Kick mobile period re-requested latest data.')
  check(countCalls(calls, '/api/kick-history') === 2, 'Kick mobile period did not request exactly one additional History payload.')

  const finalDimensions = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth,
  }))
  check(finalDimensions.scrollWidth <= finalDimensions.innerWidth + 1, `Kick 360 evidence page has horizontal overflow: ${JSON.stringify(finalDimensions)}`)

  await page.screenshot({ path: '/tmp/watchlist-kick-mobile-360.png', fullPage: true })
  const diagnostics = {
    apiCalls: calls.api,
    analyticsLoads: calls.analytics,
    dimensions: finalDimensions,
    primaryTargets,
    transitionDuration,
  }
  console.log(JSON.stringify(diagnostics))
  await appendFile('/tmp/watchlist-shell-preview.log', `\nW3B_NARROW ${JSON.stringify(diagnostics)}\n`)

  await context.close()
  console.log('Watchlist W3B narrow evidence gate passed.')
} finally {
  await browser.close()
}
