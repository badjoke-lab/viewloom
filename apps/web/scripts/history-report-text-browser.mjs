import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { chromium } from 'playwright'
import { historyPayload } from './history-battle-archive-fixture.mjs'

const base = process.env.HISTORY_REPORT_BASE_URL ?? 'http://127.0.0.1:4173'
const screenshotDir = resolve(process.env.HISTORY_REPORT_SCREENSHOT_DIR ?? 'artifacts/history-report')
const assert = (value, message) => { if (!value) throw new Error(message) }

mkdirSync(screenshotDir, { recursive: true })

async function openReport(page) {
  await page.locator('button[data-history-view="report"]').click()
  await page.waitForFunction(() => document.querySelector('.history-page')?.getAttribute('data-history-view') === 'report')
}

async function check(browser, provider, viewport) {
  const calls = { twitch: 0, kick: 0 }
  const context = await browser.newContext({ viewport, isMobile: viewport.width < 500 })
  await context.addInitScript(() => {
    window.__viewloomCopiedText = ''
    window.__viewloomSharedData = null
    Object.defineProperty(Navigator.prototype, 'share', {
      configurable: true,
      value: async function (data) { window.__viewloomSharedData = data },
    })
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: async (text) => { window.__viewloomCopiedText = String(text) } },
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
  await page.waitForFunction((expectedProvider) => {
    const mount = document.querySelector('[data-history-period-highlights]')
    return mount?.getAttribute('data-provider') === expectedProvider
      && mount?.getAttribute('data-metric') === 'viewer_minutes'
      && mount?.getAttribute('data-highlight-count') === '3'
  }, provider)

  const highlightState = await page.evaluate(() => ({
    kinds: Array.from(document.querySelectorAll('[data-history-period-highlight]')).map((node) => node.getAttribute('data-history-period-highlight')),
    highTitle: document.querySelector('[data-history-period-highlight="high"] strong')?.textContent?.trim(),
    highDetail: document.querySelector('[data-history-period-highlight="high"] p')?.textContent?.trim(),
    leaderTitle: document.querySelector('[data-history-period-highlight="leader"] strong')?.textContent?.trim(),
    coverageTitle: document.querySelector('[data-history-period-highlight="coverage"] strong')?.textContent?.trim(),
    coverageDetail: document.querySelector('[data-history-period-highlight="coverage"] p')?.textContent?.trim(),
    periodHref: document.querySelector('[data-history-period-highlights-period-link]')?.getAttribute('href'),
    dayFlowHref: document.querySelector('[data-history-period-highlight="high"] a[href*="day-flow"]')?.getAttribute('href'),
    battleHref: document.querySelector('[data-history-period-highlight="high"] a[href*="battle-lines"]')?.getAttribute('href'),
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }))
  assert(JSON.stringify(highlightState.kinds) === JSON.stringify(['high', 'leader', 'coverage']), `${provider} period highlight order or omission rules are incorrect.`)
  assert(highlightState.highTitle === 'Jun 6, 2026', `${provider} highest-day title is incorrect.`)
  assert(highlightState.highDetail === '5,000,000 viewer-minutes', `${provider} highest-day viewer-minutes detail is incorrect.`)
  assert(highlightState.leaderTitle === 'Alpha 0', `${provider} period leader is incorrect.`)
  assert(highlightState.coverageTitle === '12 of 13 UTC days observed', `${provider} period coverage title is incorrect.`)
  assert(highlightState.coverageDetail === '1 missing · 1 partial or stale', `${provider} period coverage detail is incorrect.`)
  assert(calls[provider] === 1, `${provider} period highlights caused another History request.`)
  assert(calls[provider === 'twitch' ? 'kick' : 'twitch'] === 0, `${provider} period highlights crossed provider endpoints.`)

  const periodUrl = new URL(highlightState.periodHref ?? '', base)
  assert(periodUrl.pathname === `/${provider}/history/`, `${provider} period-highlight URL path is incorrect.`)
  assert(periodUrl.searchParams.get('period') === '30d', `${provider} period-highlight URL lost the period.`)
  assert(periodUrl.searchParams.get('metric') === 'viewer_minutes', `${provider} period-highlight URL lost the metric.`)
  for (const parameter of ['day', 'sort', 'limit']) assert(!periodUrl.searchParams.has(parameter), `${provider} period-highlight URL retained ${parameter}.`)
  const dayFlowUrl = new URL(highlightState.dayFlowHref ?? '', base)
  const battleUrl = new URL(highlightState.battleHref ?? '', base)
  assert(dayFlowUrl.pathname.replace(/\/$/, '') === `/${provider}/day-flow`, `${provider} period-highlight Day Flow path is incorrect.`)
  assert(dayFlowUrl.searchParams.get('date') === '2026-06-06', `${provider} period-highlight Day Flow date is incorrect.`)
  assert(battleUrl.pathname.replace(/\/$/, '') === `/${provider}/battle-lines`, `${provider} period-highlight Battle Lines path is incorrect.`)
  assert(battleUrl.searchParams.get('date') === '2026-06-06', `${provider} period-highlight Battle Lines date is incorrect.`)
  assert(highlightState.scrollWidth <= highlightState.innerWidth + 1, `${provider} period highlights introduced horizontal page overflow.`)

  await openReport(page)
  await page.waitForFunction(() => document.querySelector('[data-history-report-share-native]'))

  const shareState = await page.evaluate(() => {
    const button = document.querySelector('[data-history-report-share-native]')
    return {
      present: button instanceof HTMLButtonElement,
      hidden: button instanceof HTMLButtonElement ? button.hidden : null,
      disabled: button instanceof HTMLButtonElement ? button.disabled : null,
      supported: typeof navigator.share === 'function',
    }
  })
  assert(shareState.present, `${provider} native-share action is absent.`)
  assert(shareState.supported, `${provider} browser fixture did not expose the Web Share API.`)
  assert(shareState.hidden === false, `${provider} native-share action is hidden despite Web Share support.`)
  assert(shareState.disabled === false, `${provider} native-share action is disabled despite Web Share support.`)

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
  assert((await page.locator('[data-history-report-share-native]').textContent()) === 'Share short post', `${provider} native-share label did not follow report mode.`)
  assert(calls[provider] === callsBeforeModeSwitch, `${provider} report mode switch caused another History request.`)

  const shortUrl = new URL(shortPost?.split('\n').at(-1) ?? '')
  assert(shortUrl.pathname === `/${provider}/history/`, `${provider} short-post path is incorrect.`)
  assert(shortUrl.searchParams.get('period') === '30d', `${provider} short-post period is missing.`)
  assert(shortUrl.searchParams.get('metric') === 'viewer_minutes', `${provider} short-post metric query is missing.`)
  for (const parameter of ['day', 'sort', 'limit']) assert(!shortUrl.searchParams.has(parameter), `${provider} short-post URL retained ${parameter}.`)

  const callsBeforeCopy = calls[provider]
  await page.locator('[data-history-report-copy]').click()
  await page.waitForFunction(() => document.querySelector('[data-history-report-status]')?.textContent === 'Short post copied.')
  const copied = await page.evaluate(() => window.__viewloomCopiedText)
  assert(copied === shortPost, `${provider} copied short post differs from the preview.`)
  assert(calls[provider] === callsBeforeCopy, `${provider} copying caused another History request.`)

  const callsBeforeShare = calls[provider]
  await page.locator('[data-history-report-share-native]').click()
  await page.waitForFunction(() => document.querySelector('[data-history-report-status]')?.textContent === 'Share sheet opened.')
  const shared = await page.evaluate(() => window.__viewloomSharedData)
  assert(shared?.title === `ViewLoom — ${providerLabel} History & Trends`, `${provider} native-share title is incorrect.`)
  assert(shared?.text === shortPost, `${provider} native-share text differs from the active preview.`)
  assert(calls[provider] === callsBeforeShare, `${provider} native sharing caused another History request.`)

  await page.locator('[data-history-report-mode="report"]').click()
  await page.waitForFunction(() => document.querySelector('[data-history-report-preview]')?.textContent?.startsWith('ViewLoom —'))
  await page.waitForFunction(() => document.querySelector('[data-history-report-share-native]')?.textContent === 'Share report')
  assert((await page.locator('[data-history-report-preview]').textContent()) === fullPreview, `${provider} full report was not restored.`)
  assert((await page.locator('[data-history-report-share-native]').textContent()) === 'Share report', `${provider} native-share label did not restore full-report mode.`)

  const other = provider === 'twitch' ? 'kick' : 'twitch'
  assert(calls[other] === 0, `${provider} report crossed provider endpoints.`)

  const callsBeforeMetric = calls[provider]
  await page.locator('[data-history-metric="peak_viewers"]').click()
  await page.waitForFunction(() => document.querySelector('[data-history-report-preview]')?.textContent?.includes('Metric: Peak viewers'))
  await page.waitForFunction(() => document.querySelector('[data-history-period-highlights]')?.getAttribute('data-metric') === 'peak_viewers')
  assert(calls[provider] === callsBeforeMetric + 1, `${provider} metric refresh did not use exactly one provider History request.`)
  assert(calls[other] === 0, `${provider} metric refresh crossed provider endpoints.`)
  assert((await page.locator('[data-history-period-highlight="high"] p').textContent()) === '100,000 viewers', `${provider} peak-viewer highlight did not refresh.`)
  assert(await page.locator('[data-history-period-highlight="rise"]').count() === 0, `${provider} unsupported rise highlight appeared in peak-viewers mode.`)

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
  console.log('History report text browser gate passed with provider-separated period highlights.')
} finally {
  await browser.close()
}
