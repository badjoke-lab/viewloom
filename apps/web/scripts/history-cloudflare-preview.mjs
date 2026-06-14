import { chromium } from 'playwright'

const baseUrl = process.env.HISTORY_PREVIEW_URL ?? 'https://fix-history-usability-pass.viewloom.pages.dev'
const today = new Date().toISOString().slice(0, 10)

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

async function waitForLatestPreview(page, path, mode) {
  let lastReason = 'preview did not load'
  for (let attempt = 1; attempt <= 24; attempt += 1) {
    try {
      await page.goto(`${baseUrl}${path}?qa=${Date.now()}`, { waitUntil: 'networkidle', timeout: 30000 })
      await page.waitForSelector('.history-day-column', { timeout: 15000 })
      await page.waitForSelector('[data-history-daily-archive] .day-card', { timeout: 15000 })
      await page.waitForFunction(() => document.querySelector('[data-history-coverage-summary]')?.textContent?.trim().length > 0)

      const compactArchiveValue = (await page.locator('[data-history-daily-archive] .day-card').first().locator(':scope > strong').textContent())?.trim() ?? ''
      const coverageText = (await page.locator('[data-history-coverage-summary]').textContent()) ?? ''
      const selectedDay = new URL(page.url()).searchParams.get('day')
      const hasCompactArchive = /[KMBT]$/.test(compactArchiveValue)
      const hasScopeMessage = coverageText.includes('Today is still in progress.') || coverageText.includes('Completed-period view.')
      const selectedCompletedDay = Boolean(selectedDay && selectedDay < today)

      if (!hasCompactArchive) lastReason = `${mode}: archive value is not compact (${compactArchiveValue})`
      else if (!hasScopeMessage) lastReason = `${mode}: completed-period scope message is missing`
      else if (!selectedCompletedDay) lastReason = `${mode}: latest completed day is not selected (${selectedDay})`
      else return
    } catch (error) {
      lastReason = error instanceof Error ? error.message : String(error)
    }
    await page.waitForTimeout(10000)
  }
  throw new Error(`Cloudflare preview did not reach the latest History usability build: ${lastReason}`)
}

const browser = await chromium.launch({ headless: true })
try {
  const desktopContext = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const desktop = await desktopContext.newPage()
  await waitForLatestPreview(desktop, '/twitch/history/', 'desktop')
  assert(await desktop.locator('.metric-ledger tbody tr').count() === 10, 'Cloudflare desktop preview does not default to Top 10')
  assert(await desktop.locator('[data-history-chart-legend] span').count() === 4, 'Cloudflare desktop preview is missing the chart legend')
  await desktop.screenshot({ path: '/tmp/history-twitch-cloudflare.png', fullPage: true })
  await desktopContext.close()

  const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true })
  const mobile = await mobileContext.newPage()
  await waitForLatestPreview(mobile, '/kick/history/', 'mobile')
  assert(await mobile.locator('.history-streamer-card').count() === 10, 'Cloudflare mobile preview does not default to Top 10 cards')
  assert(await mobile.locator('[data-history-day-card]:visible').count() <= 9, 'Cloudflare mobile archive is not collapsed')
  const overflow = await mobile.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  assert(overflow <= 1, `Cloudflare mobile preview overflows horizontally by ${overflow}px`)
  await mobile.screenshot({ path: '/tmp/history-kick-cloudflare-mobile.png', fullPage: true })
  await mobileContext.close()

  console.log('Cloudflare History preview gate passed with real data.')
} finally {
  await browser.close()
}
