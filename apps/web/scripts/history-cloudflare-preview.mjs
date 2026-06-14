import { writeFileSync } from 'node:fs'
import { chromium } from 'playwright'

const previewBaseUrl = process.env.HISTORY_PREVIEW_URL ?? 'https://fix-history-usability-pass.viewloom.pages.dev'
const productionBaseUrl = process.env.HISTORY_PRODUCTION_URL ?? 'https://vl.badjoke-lab.com'
const today = new Date().toISOString().slice(0, 10)
const diagnostics = []

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function log(message) {
  diagnostics.push(message)
  console.log(message)
}

async function proxyProductionHistory(context) {
  for (const pattern of ['**/api/history?**', '**/api/kick-history?**']) {
    await context.route(pattern, async (route) => {
      const requested = new URL(route.request().url())
      const sourceUrl = `${productionBaseUrl}${requested.pathname}${requested.search}`
      try {
        const response = await fetch(sourceUrl, {
          headers: { accept: 'application/json' },
          cache: 'no-store',
        })
        const body = await response.text()
        log(`production API: ${response.status} ${sourceUrl}`)
        await route.fulfill({
          status: response.status,
          contentType: response.headers.get('content-type') ?? 'application/json',
          body,
        })
      } catch (error) {
        log(`production API proxy failed: ${sourceUrl}: ${error instanceof Error ? error.message : String(error)}`)
        await route.abort('failed')
      }
    })
  }
}

async function saveDiagnostics(page, mode, attempt, reason) {
  const prefix = `/tmp/history-cloudflare-${mode}`
  let html = ''
  let body = ''
  let title = ''
  try { html = await page.content() } catch {}
  try { body = (await page.locator('body').innerText()).slice(0, 8000) } catch {}
  try { title = await page.title() } catch {}
  writeFileSync(`${prefix}.html`, html)
  writeFileSync(`${prefix}.txt`, [
    `attempt=${attempt}`,
    `url=${page.url()}`,
    `title=${title}`,
    `reason=${reason}`,
    '',
    body,
    '',
    ...diagnostics,
  ].join('\n'))
  try { await page.screenshot({ path: `${prefix}.png`, fullPage: true }) } catch {}
}

async function waitForLatestPreview(page, path, mode) {
  page.on('console', (message) => log(`${mode} console.${message.type()}: ${message.text()}`))
  page.on('pageerror', (error) => log(`${mode} pageerror: ${error.message}`))
  page.on('requestfailed', (request) => log(`${mode} requestfailed: ${request.method()} ${request.url()} ${request.failure()?.errorText ?? ''}`))
  page.on('response', (response) => {
    if (response.status() >= 400) log(`${mode} response: ${response.status()} ${response.url()}`)
  })

  let lastReason = 'preview did not load'
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await page.goto(`${previewBaseUrl}${path}?qa=${Date.now()}`, { waitUntil: 'domcontentloaded', timeout: 20000 })
      log(`${mode} navigation: status=${response?.status() ?? 'none'} url=${page.url()} title=${await page.title()}`)
      await page.waitForSelector('.history-day-column', { timeout: 15000 })
      await page.waitForSelector('[data-history-daily-archive] .day-card', { timeout: 15000 })
      await page.waitForFunction(() => document.querySelector('[data-history-coverage-summary]')?.textContent?.trim().length > 0, null, { timeout: 10000 })

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
      log(`Cloudflare preview attempt ${attempt}/3 pending: ${lastReason}`)
      await saveDiagnostics(page, mode, attempt, lastReason)
    }
    await page.waitForTimeout(5000)
  }
  throw new Error(`Cloudflare preview did not reach the latest History usability build: ${lastReason}`)
}

const browser = await chromium.launch({ headless: true })
try {
  const desktopContext = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  await proxyProductionHistory(desktopContext)
  const desktop = await desktopContext.newPage()
  await waitForLatestPreview(desktop, '/twitch/history/', 'desktop')
  assert(await desktop.locator('.metric-ledger tbody tr').count() === 10, 'Cloudflare desktop preview does not default to Top 10')
  assert(await desktop.locator('[data-history-chart-legend] span').count() === 4, 'Cloudflare desktop preview is missing the chart legend')
  await desktop.screenshot({ path: '/tmp/history-twitch-cloudflare.png', fullPage: true })
  await desktopContext.close()

  const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true })
  await proxyProductionHistory(mobileContext)
  const mobile = await mobileContext.newPage()
  await waitForLatestPreview(mobile, '/kick/history/', 'mobile')
  assert(await mobile.locator('.history-streamer-card').count() === 10, 'Cloudflare mobile preview does not default to Top 10 cards')
  assert(await mobile.locator('[data-history-day-card]:visible').count() <= 9, 'Cloudflare mobile archive is not collapsed')
  const overflow = await mobile.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  assert(overflow <= 1, `Cloudflare mobile preview overflows horizontally by ${overflow}px`)
  await mobile.screenshot({ path: '/tmp/history-kick-cloudflare-mobile.png', fullPage: true })
  await mobileContext.close()

  console.log('Cloudflare History preview gate passed with production data.')
} finally {
  await browser.close()
}
