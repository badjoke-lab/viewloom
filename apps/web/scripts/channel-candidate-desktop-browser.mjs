import { chromium } from 'playwright'
import {
  assert,
  assertDarkSurface,
  baseUrl,
  installRoutes,
  noOverflow,
  waitReady,
} from './channel-candidate-fixture.mjs'

async function runDesktopOverview(browser) {
  const calls = { twitch: 0, kick: 0 }
  const context = await browser.newContext({ viewport: { width: 1440, height: 1100 } })
  await installRoutes(context, calls)
  const page = await context.newPage()
  await page.goto(`${baseUrl}/twitch/channel/?id=alpha&name=Alpha+Channel&period=30d`, { waitUntil: 'domcontentloaded' })
  await waitReady(page)

  await assertDarkSurface(page, '.channel-profile-summary > div', 'desktop summary card')
  await assertDarkSurface(page, '.channel-recent-day', 'desktop recent-day card')
  await assertDarkSurface(page, '.channel-rival-card', 'desktop rivalry card')
  await assertDarkSurface(page, '.channel-task-tabs', 'desktop task tabs')

  const primary = await page.locator('.channel-summary-card--primary').first().evaluate((node) => {
    const style = getComputedStyle(node)
    return { width: style.borderTopWidth, color: style.borderTopColor }
  })
  assert(primary.width === '3px', `desktop overview: primary hierarchy border is ${primary.width}.`)
  assert(calls.twitch === 1 && calls.kick === 0, 'desktop overview: provider request count is wrong.')
  await noOverflow(page, 'twitch overview desktop')
  await page.screenshot({ path: '/tmp/channel-candidate-twitch-overview-desktop.png', fullPage: true })
  await context.close()
}

async function runTabletReport(browser) {
  const calls = { twitch: 0, kick: 0 }
  const context = await browser.newContext({ viewport: { width: 820, height: 1000 } })
  await installRoutes(context, calls)
  const page = await context.newPage()
  await page.goto(`${baseUrl}/twitch/channel/?id=alpha&name=Alpha+Channel&period=7d&view=report`, { waitUntil: 'domcontentloaded' })
  await waitReady(page)
  await page.waitForFunction(() => document.body.dataset.channelReportReady === 'true')

  await assertDarkSurface(page, '.channel-report-main', 'tablet report main')
  await assertDarkSurface(page, '.channel-report-actions', 'tablet report actions')
  const columns = await page.locator('.channel-report-workspace').evaluate((node) => getComputedStyle(node).gridTemplateColumns)
  assert(!columns.includes(' '), `tablet report: expected one column, got ${columns}.`)

  const preview = await page.locator('.channel-report-preview').evaluate((node) => {
    const style = getComputedStyle(node)
    return { maxHeight: style.maxHeight, overflowY: style.overflowY }
  })
  assert(preview.maxHeight !== 'none', `tablet report: preview max-height is ${preview.maxHeight}.`)
  assert(preview.overflowY === 'auto' || preview.overflowY === 'scroll', `tablet report: preview overflow is ${preview.overflowY}.`)
  assert(calls.twitch === 1 && calls.kick === 0, 'tablet report: provider request count is wrong.')
  await noOverflow(page, 'twitch report tablet')
  await page.screenshot({ path: '/tmp/channel-candidate-twitch-report-tablet.png', fullPage: true })
  await context.close()
}

const browser = await chromium.launch({ headless: true })
try {
  await runDesktopOverview(browser)
  await runTabletReport(browser)
  console.log('Channel C5A desktop and tablet visual gate passed.')
} finally {
  await browser.close()
}
