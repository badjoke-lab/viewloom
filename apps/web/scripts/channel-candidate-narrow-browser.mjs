import { chromium } from 'playwright'
import {
  assert,
  baseUrl,
  installRoutes,
  longNamePayload,
  noOverflow,
  waitReady,
} from './channel-candidate-fixture.mjs'

const browser = await chromium.launch({ headless: true })
try {
  const calls = { twitch: 0, kick: 0 }
  const context = await browser.newContext({ viewport: { width: 360, height: 800 }, isMobile: true, reducedMotion: 'reduce' })
  await installRoutes(context, calls, { kick: longNamePayload('kick') })
  const page = await context.newPage()
  await page.goto(`${baseUrl}/kick/channel/?id=alpha&period=7d`, { waitUntil: 'domcontentloaded' })
  await waitReady(page)

  const heading = await page.locator('[data-channel-name]').evaluate((node) => ({
    scrollWidth: node.scrollWidth,
    clientWidth: node.clientWidth,
    text: node.textContent,
  }))
  assert(heading.text?.includes('日本語'), 'kick 360: long Unicode heading is missing.')
  assert(heading.scrollWidth <= heading.clientWidth + 1, 'kick 360: long heading widened the page.')

  const taskBoxes = await page.locator('.channel-task-tabs button').evaluateAll((nodes) => nodes.map((node) => node.getBoundingClientRect()))
  assert(taskBoxes.every((box) => Math.abs(box.y - taskBoxes[0].y) < 1), 'kick 360: task tabs wrapped into a stack.')
  assert(taskBoxes.every((box) => box.height >= 48), 'kick 360: task target height is below 48px.')

  await page.evaluate(() => { if (document.activeElement instanceof HTMLElement) document.activeElement.blur() })
  let focused = false
  for (let attempt = 0; attempt < 30; attempt += 1) {
    await page.keyboard.press('Tab')
    focused = await page.evaluate(() => document.activeElement?.matches('.channel-task-tabs [data-channel-view="overview"]') ?? false)
    if (focused) break
  }
  assert(focused, 'kick 360: keyboard navigation did not reach the Overview task.')

  const overviewButton = page.locator('.channel-task-tabs [data-channel-view="overview"]')
  const focus = await overviewButton.evaluate((node) => {
    const style = getComputedStyle(node)
    return { width: style.outlineWidth, style: style.outlineStyle }
  })
  const transition = await page.locator('.channel-trend-bar').first().evaluate((node) => getComputedStyle(node).transitionDuration)
  console.log(JSON.stringify({ focus, transition }))
  await page.screenshot({ path: '/tmp/channel-candidate-kick-overview-360.png', fullPage: true })

  assert(focus.style !== 'none' && parseFloat(focus.width) >= 3, `kick 360: visible focus is missing (${JSON.stringify(focus)}).`)
  assert(parseFloat(transition) <= 0.001, `kick 360: reduced motion transition is ${transition}.`)
  assert(calls.kick === 1 && calls.twitch === 0, 'kick 360 overview: provider request count is wrong.')
  await noOverflow(page, 'kick overview 360px')
  await context.close()
  console.log('Channel C5A narrow accessibility gate passed.')
} finally {
  await browser.close()
}
