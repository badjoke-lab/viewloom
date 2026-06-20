import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { chromium } from 'playwright'
import { historyPayload } from './history-battle-archive-fixture.mjs'

const base = process.env.HISTORY_REPORT_BASE_URL ?? 'http://127.0.0.1:4173'
const screenshotDir = resolve(process.env.HISTORY_REPORT_SCREENSHOT_DIR ?? 'artifacts/history-report')
const assert = (value, message) => { if (!value) throw new Error(message) }

mkdirSync(screenshotDir, { recursive: true })

async function check(browser, provider, viewport) {
  const calls = { twitch: 0, kick: 0 }
  const context = await browser.newContext({ viewport, isMobile: viewport.width < 500 })
  await context.addInitScript(() => {
    window.__viewloomCopiedText = ''
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: async (text) => { window.__viewloomCopiedText = String(text) },
      },
    })
  })

  const fulfill = async (route, requestedProvider) => {
    calls[requestedProvider] += 1
    const requestUrl = new URL(route.request().url())
    const payload = historyPayload(requestedProvider)
    payload.metric = requestUrl.searchParams.get('metric') === 'peak_viewers' ? 'peak_viewers' : 'viewer_minutes'
    payload.period = { ...payload.period, to: '2026-06-18', days: 13, label: 'Fixture report range' }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(payload) })
  }

  await context.route('**/api/history*', (route) => fulfill(route, 'twitch'))
  await context.route('**/api/kick-history*', (route) => fulfill(route, 'kick'))

  const page = await context.newPage()
  await page.goto(`${base}/${provider}/history/?period=30d&metric=viewer_minutes&day=2026-06-10&sort=rising&limit=50`, { waitUntil: 'domcontentloaded' })
  await page.waitForFunction(() => {
    const button = document.querySelector('[data-history-report-copy]')
    const preview = document.querySelector('[data-history-report-preview]')
    return button && !button.hasAttribute('disabled') && preview?.textContent?.includes('Observed days: 12 of 13')
  })

  const fullPreview = await page.locator('[data-history-report-preview]').textContent()
  const providerLabel = provider === 'twitch' ? 'Twitch' : 'Kick'
  const otherLabel = provider === 'twitch' ? 'Kick' : 'Twitch'
  assert(fullPreview?.includes(`ViewLoom — ${providerLabel} History & Trends`), `${provider} report title is incorrect.`)
  assert(!fullPreview?.includes(`ViewLoom — ${otherLabel} History & Trends`), `${provider} report contains the other provider title.`)
  assert(fullPreview?.includes('Observed days: 12 of 13'), `${provider} observed-day summary is incorrect.`)
  assert(fullPreview?.includes('1 missing'), `${provider} missing-day summary is absent.`)
  assert(fullPreview?.includes('not a provider-wide total.'), `${provider} provider-wide limitation is absent.`)
  assert(fullPreview?.includes(`/${provider}/history/`), `${provider} report link is incorrect.`)

  const callsBeforeModeSwitch = calls[provider]
  await page.locator('[data-history-report-mode="post"]').click()
  await page.waitForFunction((label) => document.querySelector('[data-history-report-preview]')?.textContent?.startsWith(`ViewLoom | ${label} History snapshot`), providerLabel)
  const shortPost = await page.locator('[data-history-report-preview]').textContent()
  const shortLength = [...(shortPost ?? '')].length
  assert(shortLength <= 280, `${provider} short post exceeds 280 characters: ${shortLength}.`)
  assert(shortPost?.includes(`${providerLabel} History snapshot`), `${provider} short post title is incorrect.`)
  assert(!shortPost?.includes(`${otherLabel} History snapshot`), `${provider} short post contains the other provider.`)
  assert(shortPost?.includes('Viewer-minutes'), `${provider} short post metric is absent.`)
  assert(shortPost?.includes('Coverage: 12/13 days observed'), `${provider} short post coverage is incorrect.`)
  assert(shortPost?.includes('not provider-wide.'), `${provider} short post limitation is absent.`)
  assert((await page.locator('[data-history-report-count]').textContent()) === `${shortLength} / 280 characters`, `${provider} short-post count is incorrect.`)
  assert(calls[provider] === callsBeforeModeSwitch, `${provider} report mode switch caused another History request.`)

  const shortUrl = new URL(shortPost?.split('\n').at(-1) ?? '')
  assert(shortUrl.pathname === `/${provider}/history/`, `${provider} short-post path is incorrect.`)
  assert(shortUrl.searchParams.get('period') === '30d', `${provider} short-post period is missing.`)
  assert(shortUrl.searchParams.get('metric') === 'viewer_minutes', `${provider} short-post metric query is missing.`)
  for (const parameter of ['day', 'sort', 'limit']) {
    assert(!shortUrl.searchParams.has(parameter), `${provider} short-post URL retained ${parameter}.`)
  }

  const callsBeforeCopy = calls[provider]
  await page.locator('[data-history-report-copy]').click()
  await page.waitForFunction(() => document.querySelector('[data-history-report-status]')?.textContent === 'Short post copied.')
  const copied = await page.evaluate(() => window.__viewloomCopiedText)
  assert(copied === shortPost, `${provider} copied short post differs from the preview.`)
  assert(calls[provider] === callsBeforeCopy, `${provider} copying caused another History request.`)

  await page.locator('[data-history-report-mode="report"]').click()
  await page.waitForFunction(() => document.querySelector('[data-history-report-preview]')?.textContent?.startsWith('ViewLoom —'))
  assert((await page.locator('[data-history-report-preview]').textContent()) === fullPreview, `${provider} full report was not restored.`)

  const other = provider === 'twitch' ? 'kick' : 'twitch'
  assert(calls[other] === 0, `${provider} report crossed provider endpoints.`)

  await page.locator('[data-history-metric="peak_viewers"]').click()
  await page.waitForFunction(() => document.querySelector('[data-history-report-preview]')?.textContent?.includes('Metric: Peak viewers'))
  assert(calls[provider] >= 2, `${provider} metric refresh did not reuse the provider History endpoint.`)
  assert(calls[other] === 0, `${provider} metric refresh crossed provider endpoints.`)

  await page.locator('[data-history-report-mode="post"]').click()
  await page.waitForFunction(() => document.querySelector('[data-history-report-preview]')?.textContent?.includes('Peak viewers'))
  const peakPost = await page.locator('[data-history-report-preview]').textContent()
  const peakUrl = new URL(peakPost?.split('\n').at(-1) ?? '')
  assert(peakUrl.searchParams.get('metric') === 'peak_viewers', `${provider} refreshed short-post metric query is incorrect.`)

  const width = await page.evaluate(() => [document.documentElement.scrollWidth, innerWidth])
  assert(width[0] <= width[1] + 1, `${provider} report introduced horizontal page overflow.`)
  await page.screenshot({ path: resolve(screenshotDir, `history-report-${provider}.png`), fullPage: true })
  await context.close()
}

const browser = await chromium.launch({ headless: true })
try {
  await check(browser, 'twitch', { width: 1440, height: 1100 })
  await check(browser, 'kick', { width: 390, height: 844 })
  console.log('History report text browser gate passed.')
} finally {
  await browser.close()
}
