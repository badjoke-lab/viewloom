import { chromium } from 'playwright'
import {
  assert,
  assertDarkSurface,
  baseUrl,
  installRoutes,
  noOverflow,
  waitReady,
} from './channel-candidate-fixture.mjs'

const browser = await chromium.launch({ headless: true })
try {
  const calls = { twitch: 0, kick: 0 }
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true })
  await installRoutes(context, calls)
  const page = await context.newPage()
  await page.goto(`${baseUrl}/kick/channel/?id=alpha&name=Alpha+Channel&period=30d&view=days`, { waitUntil: 'domcontentloaded' })
  await waitReady(page)
  await page.waitForFunction(() => document.querySelectorAll('.channel-day-card').length > 6)
  await page.waitForFunction(() => document.querySelectorAll('.channel-day-card:not([hidden])').length === 6)

  const taskBoxes = await page.locator('.channel-task-tabs button').evaluateAll((nodes) => nodes.map((node) => node.getBoundingClientRect()))
  assert(taskBoxes.every((box) => Math.abs(box.y - taskBoxes[0].y) < 1), 'kick 390: task tabs must remain one compact row.')
  assert(taskBoxes.every((box) => box.height >= 48), 'kick 390: task targets are below 48px.')

  const evidence = await page.locator('.channel-evidence-facts .fact').evaluateAll((nodes) => nodes.map((node) => node.getBoundingClientRect()))
  assert(Math.abs(evidence[0].y - evidence[1].y) < 1 && evidence[2].y > evidence[0].y, 'kick 390: evidence facts are not two columns.')

  const masthead = await page.locator('.masthead').evaluate((node) => getComputedStyle(node).position)
  assert(masthead === 'static', `kick 390: Channel masthead is ${masthead}.`)
  await assertDarkSurface(page, '.channel-day-card', 'kick retained-day card')
  await assertDarkSurface(page, '.channel-day-controls', 'kick retained-day controls')
  assert(calls.kick === 1 && calls.twitch === 0, 'kick 390 days: provider request count is wrong.')
  await noOverflow(page, 'kick retained days 390px')
  await page.screenshot({ path: '/tmp/channel-candidate-kick-days-mobile.png', fullPage: true })
  await context.close()
  console.log('Channel C5A retained days mobile gate passed.')
} finally {
  await browser.close()
}
