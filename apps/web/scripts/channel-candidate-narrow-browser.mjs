import { appendFile } from 'node:fs/promises'
import { chromium } from 'playwright'
import {
  assert,
  baseUrl,
  installRoutes,
  longNamePayload,
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
    focused = await page.evaluate(() => document.activeElement?.matches('.channel-task-tabs [data-channel-view="days"]') ?? false)
    if (focused) break
  }
  assert(focused, 'kick 360: keyboard navigation did not reach the Retained Days task.')

  const daysButton = page.locator('.channel-task-tabs [data-channel-view="days"]')
  await page.waitForFunction(() => {
    const node = document.querySelector('.channel-task-tabs [data-channel-view="days"]')
    return node instanceof HTMLElement && getComputedStyle(node).boxShadow.includes('3px')
  })
  const focus = await daysButton.evaluate((node) => {
    const style = getComputedStyle(node)
    return { outlineWidth: style.outlineWidth, outlineStyle: style.outlineStyle, boxShadow: style.boxShadow }
  })
  const transition = await page.locator('.channel-trend-bar').first().evaluate((node) => getComputedStyle(node).transitionDuration)
  const durationMs = transition.trim().endsWith('ms') ? parseFloat(transition) : parseFloat(transition) * 1000
  const viewport = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, innerWidth }))
  const diagnostics = { focus, transition, durationMs, calls, viewport }
  console.log(JSON.stringify(diagnostics))
  await appendFile('/tmp/channel-candidate-preview.log', `\nC5A_DIAGNOSTICS ${JSON.stringify(diagnostics)}\n`)
  await page.screenshot({ path: '/tmp/channel-candidate-kick-overview-360.png', fullPage: true })

  assert(focus.boxShadow !== 'none' && focus.boxShadow.includes('3px'), `kick 360: visible task focus ring is missing (${JSON.stringify(focus)}).`)
  assert(durationMs <= 0.011, `kick 360: reduced motion transition is ${transition} (${durationMs}ms).`)
  assert(calls.kick === 1 && calls.twitch === 0, `kick 360 overview: provider request count is wrong (${JSON.stringify(calls)}).`)
  assert(viewport.scrollWidth <= viewport.innerWidth + 1, `kick 360: horizontal overflow (${viewport.scrollWidth} > ${viewport.innerWidth}).`)
  await context.close()
  console.log('Channel C5A narrow accessibility gate passed.')
} finally {
  await browser.close()
}
