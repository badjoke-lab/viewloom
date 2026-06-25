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

const browser = await chromium.launch({ headless: true })
try {
  await verifyTwitchMixedMobile()
  await verifyKickEmptyMobile()
  await verifyKickStorageError()
  await verifyKickLongContent()
  console.log('Watchlist W3C mobile candidate gate passed.')
} finally {
  await browser.close()
}

async function verifyTwitchMixedMobile() {
  const calls = { api: [], analytics: 0, failLatest: false, failHistory: false }
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, reducedMotion: 'reduce' })
  await installNetworkGuards(context, calls)
  const page = await openPopulated(context, 'twitch', [
    { channelId: 'daily_only', displayName: 'Daily Only' },
  ])

  const text = await page.locator('[data-watchlist-entry="daily_only"]').innerText()
  check(text.includes('Not in latest observed set'), 'Twitch 390 latest-absent state is missing.')
  check(text.includes('Present in retained History result'), 'Twitch 390 retained-present state is missing.')
  await assertNoOverflow(page, 'Twitch 390 mixed evidence')
  await assertTouchTargets(page)
  await assertReducedMotion(page)
  await assertLiveRegions(page)

  await page.screenshot({ path: '/tmp/watchlist-candidate-twitch-mobile-390-mixed.png', fullPage: true })
  await appendFile('/tmp/watchlist-candidate.log', `TWITCH_MOBILE_MIXED ${JSON.stringify({ calls: calls.api })}\n`)
  await context.close()
}

async function verifyKickEmptyMobile() {
  const calls = { api: [], analytics: 0, failLatest: false, failHistory: false }
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, reducedMotion: 'reduce' })
  await installNetworkGuards(context, calls)
  const page = await context.newPage()
  await page.goto(`${baseUrl}/kick/watchlist/`, { waitUntil: 'domcontentloaded' })
  await waitReady(page)
  await waitDataIdle(page)

  check(await page.locator('[data-watchlist-empty]').isVisible(), 'Kick 390 empty state is not visible.')
  check(calls.api.length === 0, `Kick 390 empty state made data requests: ${JSON.stringify(calls.api)}`)
  await assertNoOverflow(page, 'Kick 390 empty')
  await assertTouchTargets(page)

  await page.screenshot({ path: '/tmp/watchlist-candidate-kick-mobile-390-empty.png', fullPage: true })
  await appendFile('/tmp/watchlist-candidate.log', `KICK_MOBILE_EMPTY ${JSON.stringify({ calls: calls.api })}\n`)
  await context.close()
}

async function verifyKickStorageError() {
  const calls = { api: [], analytics: 0, failLatest: false, failHistory: false }
  const context = await browser.newContext({ viewport: { width: 360, height: 800 }, isMobile: true, reducedMotion: 'reduce' })
  await context.addInitScript(() => {
    Storage.prototype.getItem = function getItem() { throw new DOMException('Storage blocked', 'SecurityError') }
    Storage.prototype.setItem = function setItem() { throw new DOMException('Storage blocked', 'SecurityError') }
    Storage.prototype.removeItem = function removeItem() { throw new DOMException('Storage blocked', 'SecurityError') }
  })
  await installNetworkGuards(context, calls)
  const page = await context.newPage()
  await page.goto(`${baseUrl}/kick/watchlist/`, { waitUntil: 'domcontentloaded' })
  await waitReady(page)
  await waitDataIdle(page)

  check(await page.locator('[data-watchlist-storage-error]').isVisible(), 'Kick 360 storage-error state is not visible.')
  check(await page.locator('body').getAttribute('data-watchlist-storage') === 'unavailable', 'Kick 360 storage state is not unavailable.')
  check(calls.api.length === 0, 'Kick 360 storage-error state made data requests.')
  await assertNoOverflow(page, 'Kick 360 storage error')

  await page.screenshot({ path: '/tmp/watchlist-candidate-kick-mobile-360-storage-error.png', fullPage: true })
  await appendFile('/tmp/watchlist-candidate.log', `KICK_MOBILE_STORAGE_ERROR ${JSON.stringify({ calls: calls.api })}\n`)
  await context.close()
}

async function verifyKickLongContent() {
  const calls = { api: [], analytics: 0, failLatest: false, failHistory: false }
  const context = await browser.newContext({ viewport: { width: 360, height: 800 }, isMobile: true, reducedMotion: 'reduce' })
  await installNetworkGuards(context, calls)
  const longId = `long_${'x'.repeat(58)}`
  const page = await openPopulated(context, 'kick', [
    { channelId: longId, displayName: 'A deliberately long observed-channel label used to verify narrow wrapping without clipping or horizontal drift' },
  ])

  await assertNoOverflow(page, 'Kick 360 long content')
  await assertTouchTargets(page)
  const boxes = await page.locator('[data-watchlist-entry], [data-watchlist-entry] h2, [data-watchlist-entry] code, .watchlist-evidence-facts').evaluateAll((nodes) => nodes.map((node) => ({
    tag: node.tagName,
    scrollWidth: node.scrollWidth,
    clientWidth: node.clientWidth,
  })))
  check(boxes.every((box) => box.scrollWidth <= box.clientWidth + 1), `Kick 360 long content overflowed: ${JSON.stringify(boxes.filter((box) => box.scrollWidth > box.clientWidth + 1))}`)

  await page.screenshot({ path: '/tmp/watchlist-candidate-kick-mobile-360-long-content.png', fullPage: true })
  await appendFile('/tmp/watchlist-candidate.log', `KICK_MOBILE_LONG ${JSON.stringify({ calls: calls.api, boxes })}\n`)
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

async function assertNoOverflow(page, label) {
  const dimensions = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, innerWidth }))
  check(dimensions.scrollWidth <= dimensions.innerWidth + 1, `${label} has horizontal overflow: ${JSON.stringify(dimensions)}`)
}

async function assertTouchTargets(page) {
  const targets = await page.locator('.watchlist-page button:visible, .watchlist-page a.button:visible, .watchlist-page .watchlist-external:visible').evaluateAll((nodes) => nodes.map((node) => ({
    text: node.textContent?.trim(),
    height: node.getBoundingClientRect().height,
  })))
  check(targets.every((target) => target.height >= 44), `Mobile target below 44px: ${JSON.stringify(targets.filter((target) => target.height < 44))}`)
}

async function assertReducedMotion(page) {
  const duration = await page.locator('.watchlist-card').evaluate((node) => getComputedStyle(node).transitionDuration)
  const milliseconds = duration.trim().endsWith('ms') ? Number.parseFloat(duration) : Number.parseFloat(duration) * 1000
  check(!Number.isFinite(milliseconds) || milliseconds <= .011, `Reduced-motion transition is too long: ${duration}`)
}

async function assertLiveRegions(page) {
  const regions = await page.locator('.watchlist-page [aria-live]').count()
  check(regions >= 3, `Watchlist candidate has too few live regions: ${regions}`)
}
