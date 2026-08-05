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
  const context = await browser.newContext({ viewport, isMobile: viewport.width < 500, acceptDownloads: true })
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
    const copy = document.querySelector('[data-history-report-copy]')
    const preview = document.querySelector('[data-history-report-preview]')
    const highlights = document.querySelector('[data-history-period-highlights]')
    return copy && !copy.hasAttribute('disabled')
      && preview?.textContent?.includes('Observed days: 12 of 13')
      && highlights?.getAttribute('data-highlight-count') === '3'
  })

  const other = provider === 'twitch' ? 'kick' : 'twitch'
  const providerLabel = provider === 'twitch' ? 'Twitch' : 'Kick'
  const otherLabel = provider === 'twitch' ? 'Kick' : 'Twitch'

  const highlights = await page.evaluate(() => ({
    provider: document.querySelector('[data-history-period-highlights]')?.getAttribute('data-provider'),
    metric: document.querySelector('[data-history-period-highlights]')?.getAttribute('data-metric'),
    kinds: Array.from(document.querySelectorAll('[data-history-period-highlight]')).map((node) => node.getAttribute('data-history-period-highlight')),
    high: document.querySelector('[data-history-period-highlight="high"] p')?.textContent?.trim(),
    leader: document.querySelector('[data-history-period-highlight="leader"] strong')?.textContent?.trim(),
    coverage: document.querySelector('[data-history-period-highlight="coverage"] p')?.textContent?.trim(),
    periodHref: document.querySelector('[data-history-period-highlights-period-link]')?.getAttribute('href'),
    dayFlowHref: document.querySelector('[data-history-period-highlight="high"] a[href*="day-flow"]')?.getAttribute('href'),
    battleHref: document.querySelector('[data-history-period-highlight="high"] a[href*="battle-lines"]')?.getAttribute('href'),
  }))
  assert(highlights.provider === provider && highlights.metric === 'viewer_minutes', `${provider} period highlights are not provider-separated.`)
  assert(JSON.stringify(highlights.kinds) === JSON.stringify(['high', 'leader', 'coverage']), `${provider} period highlight order is incorrect.`)
  assert(highlights.high === '5,000,000 viewer-minutes', `${provider} highest-day highlight is incorrect.`)
  assert(highlights.leader === 'Alpha 0', `${provider} period leader is incorrect.`)
  assert(highlights.coverage === '1 missing · 1 partial or stale', `${provider} period coverage is incorrect.`)
  assert(calls[provider] === 1, `${provider} period highlights caused another History request.`)
  assert(calls[other] === 0, `${provider} period highlights crossed provider endpoints.`)

  const periodUrl = new URL(highlights.periodHref ?? '', base)
  assert(periodUrl.pathname === `/${provider}/history/`, `${provider} period highlight path is incorrect.`)
  assert(periodUrl.searchParams.get('period') === '30d' && periodUrl.searchParams.get('metric') === 'viewer_minutes', `${provider} period highlight state is incomplete.`)
  for (const parameter of ['day', 'sort', 'limit']) assert(!periodUrl.searchParams.has(parameter), `${provider} period highlight retained ${parameter}.`)
  const dayFlowUrl = new URL(highlights.dayFlowHref ?? '', base)
  const battleUrl = new URL(highlights.battleHref ?? '', base)
  assert(dayFlowUrl.pathname.replace(/\/$/, '') === `/${provider}/day-flow` && dayFlowUrl.searchParams.get('date') === '2026-06-06', `${provider} Day Flow highlight link is incorrect.`)
  assert(battleUrl.pathname.replace(/\/$/, '') === `/${provider}/battle-lines` && battleUrl.searchParams.get('date') === '2026-06-06', `${provider} Battle Lines highlight link is incorrect.`)

  await page.locator('button[data-history-view="report"]').click()
  await page.waitForFunction(() => document.querySelector('.history-page')?.getAttribute('data-history-view') === 'report')
  await page.waitForFunction(() => document.querySelector('[data-history-report-share-native]'))

  const semantics = await page.evaluate(() => {
    const statusIds = ['history-report-status', 'history-share-status', 'history-export-status']
    const actionDescriptions = [
      ['[data-history-report-copy]', 'history-report-status'],
      ['[data-history-report-share-native]', 'history-report-status'],
      ['[data-history-share-toggle]', 'history-share-status'],
      ['[data-history-share-download]', 'history-share-status'],
      ['[data-history-export-csv]', 'history-export-status'],
      ['[data-history-export-json]', 'history-export-status'],
    ]
    return {
      statuses: statusIds.map((id) => {
        const node = document.getElementById(id)
        return [node?.getAttribute('role'), node?.getAttribute('aria-live'), node?.getAttribute('aria-atomic')]
      }),
      descriptions: actionDescriptions.map(([selector, expected]) => document.querySelector(selector)?.getAttribute('aria-describedby') === expected),
      controls: Array.from(document.querySelectorAll('[data-history-report-mode]')).every((node) => node.getAttribute('aria-controls') === 'history-report-preview'),
      preview: document.querySelector('[data-history-report-preview]')?.getAttribute('aria-label'),
    }
  })
  assert(semantics.statuses.every(([role, live, atomic]) => role === 'status' && live === 'polite' && atomic === 'true'), `${provider} role=status semantics are incomplete.`)
  assert(semantics.descriptions.every(Boolean), `${provider} output action status associations are incomplete.`)
  assert(semantics.controls && semantics.preview === 'Full report preview', `${provider} report preview semantics are incomplete.`)

  const callsBeforeKeyboard = calls[provider]
  const fullModeButton = page.locator('[data-history-report-mode="report"]')
  const postModeButton = page.locator('[data-history-report-mode="post"]')
  await fullModeButton.focus()
  await fullModeButton.press('ArrowRight')
  await waitForModeAndFocus(page, 'post')
  assert((await page.locator('[data-history-report-preview]').getAttribute('aria-label')) === 'Short post preview', `${provider} keyboard mode switch did not rename the preview.`)
  await postModeButton.press('Home')
  await waitForModeAndFocus(page, 'report')
  assert(calls[provider] === callsBeforeKeyboard, `${provider} keyboard report mode switch caused another History request.`)

  const fullPreview = await page.locator('[data-history-report-preview]').textContent()
  assert(fullPreview?.includes(`ViewLoom — ${providerLabel} History & Trends`), `${provider} report title is incorrect.`)
  assert(!fullPreview?.includes(`ViewLoom — ${otherLabel} History & Trends`), `${provider} report contains the other provider.`)
  assert(fullPreview?.includes('Observed days: 12 of 13') && fullPreview?.includes('not a provider-wide total.'), `${provider} report coverage limitation is absent.`)

  const callsBeforeMode = calls[provider]
  await postModeButton.click()
  await page.waitForFunction((label) => document.querySelector('[data-history-report-preview]')?.textContent?.startsWith(`ViewLoom | ${label} History snapshot`), providerLabel)
  const shortPost = await page.locator('[data-history-report-preview]').textContent()
  const shortLength = [...(shortPost ?? '')].length
  assert(shortLength <= 280, `${provider} short post exceeds 280 characters.`)
  assert(shortPost?.includes('Coverage: 12/13 days observed') && shortPost?.includes('not provider-wide.'), `${provider} short post coverage is incomplete.`)
  assert((await page.locator('[data-history-report-share-native]').textContent()) === 'Share short post', `${provider} native-share label did not follow report mode.`)
  assert(calls[provider] === callsBeforeMode, `${provider} report mode switch caused another History request.`)

  const shortUrl = new URL(shortPost?.split('\n').at(-1) ?? '')
  assert(shortUrl.pathname === `/${provider}/history/` && shortUrl.searchParams.get('metric') === 'viewer_minutes', `${provider} short-post URL is incorrect.`)
  for (const parameter of ['day', 'sort', 'limit']) assert(!shortUrl.searchParams.has(parameter), `${provider} short-post URL retained ${parameter}.`)

  const callsBeforeCopy = calls[provider]
  await page.locator('[data-history-report-copy]').click()
  await page.waitForFunction(() => document.querySelector('[data-history-report-status]')?.textContent === 'Short post copied.')
  assert((await page.evaluate(() => window.__viewloomCopiedText)) === shortPost, `${provider} copied short post differs from the preview.`)
  assert(calls[provider] === callsBeforeCopy, `${provider} copying caused another History request.`)

  const nativeShare = await page.evaluate(() => {
    const button = document.querySelector('[data-history-report-share-native]')
    return {
      supported: typeof navigator.share === 'function',
      present: button instanceof HTMLButtonElement,
      hidden: button instanceof HTMLButtonElement ? button.hidden : null,
      disabled: button instanceof HTMLButtonElement ? button.disabled : null,
    }
  })
  assert(nativeShare.supported, `${provider} browser fixture did not expose the Web Share API.`)
  assert(nativeShare.present && nativeShare.hidden === false && nativeShare.disabled === false, `${provider} native-share action is unavailable.`)
  const callsBeforeShare = calls[provider]
  await page.locator('[data-history-report-share-native]').click()
  await page.waitForFunction(() => document.querySelector('[data-history-report-status]')?.textContent === 'Share completed.')
  const shared = await page.evaluate(() => window.__viewloomSharedData)
  assert(shared?.title === `ViewLoom — ${providerLabel} History & Trends` && shared?.text === shortPost, `${provider} native-share payload is incorrect.`)
  assert(calls[provider] === callsBeforeShare, `${provider} native sharing caused another History request.`)

  await fullModeButton.click()
  await page.waitForFunction(() => document.querySelector('[data-history-report-preview]')?.textContent?.startsWith('ViewLoom —'))

  const callsBeforeCard = calls[provider]
  const shareToggle = page.locator('[data-history-share-toggle]')
  await shareToggle.click()
  await page.waitForFunction(() => document.querySelector('[data-history-share-card]')?.getAttribute('data-share-rendered') === 'true')
  const card = await page.evaluate(() => {
    const canvas = document.querySelector('[data-history-share-card]')
    return {
      role: canvas?.getAttribute('role'),
      tabIndex: canvas instanceof HTMLElement ? canvas.tabIndex : null,
      label: canvas?.getAttribute('aria-label') ?? '',
      fallback: canvas?.textContent ?? '',
    }
  })
  assert(card.role === 'img' && card.tabIndex === 0, `${provider} share-card image semantics are incomplete.`)
  assert(card.label.includes(`ViewLoom ${providerLabel} History share card.`) && card.label.includes('Coverage 12 of 13 days'), `${provider} share-card accessible description is incomplete.`)
  assert(card.label.includes('Observed ViewLoom data, not provider-wide.') && card.fallback === card.label, `${provider} share-card limitation or fallback is incomplete.`)
  assert(calls[provider] === callsBeforeCard, `${provider} share-card preview caused another History request.`)
  await page.locator('[data-history-share-card]').focus()
  await page.locator('[data-history-share-card]').press('Escape')
  await page.waitForFunction(() => document.querySelector('[data-history-share-toggle]')?.getAttribute('aria-expanded') === 'false'
    && document.activeElement?.hasAttribute('data-history-share-toggle'))
  assert(await page.evaluate(() => document.activeElement?.hasAttribute('data-history-share-toggle')), `${provider} share-card Escape did not return focus.`)

  const callsBeforeCsv = calls[provider]
  const [csvDownload] = await Promise.all([page.waitForEvent('download'), page.locator('[data-history-export-csv]').click()])
  await page.waitForFunction(() => document.querySelector('[data-history-export-status]')?.textContent?.startsWith('CSV downloaded as '))
  assert(csvDownload.suggestedFilename().startsWith(`viewloom-${provider}-history-`) && csvDownload.suggestedFilename().endsWith('.csv'), `${provider} CSV filename is incorrect.`)
  assert(calls[provider] === callsBeforeCsv, `${provider} CSV export caused another History request.`)

  const callsBeforeJson = calls[provider]
  const [jsonDownload] = await Promise.all([page.waitForEvent('download'), page.locator('[data-history-export-json]').click()])
  await page.waitForFunction(() => document.querySelector('[data-history-export-status]')?.textContent?.startsWith('JSON downloaded as '))
  assert(jsonDownload.suggestedFilename().startsWith(`viewloom-${provider}-history-`) && jsonDownload.suggestedFilename().endsWith('.json'), `${provider} JSON filename is incorrect.`)
  assert(calls[provider] === callsBeforeJson, `${provider} JSON export caused another History request.`)

  const callsBeforeMetric = calls[provider]
  await page.locator('[data-history-metric="peak_viewers"]').click()
  await page.waitForFunction(() => document.querySelector('[data-history-period-highlights]')?.getAttribute('data-metric') === 'peak_viewers')
  assert(calls[provider] === callsBeforeMetric + 1, `${provider} metric refresh did not use exactly one History request.`)
  assert(calls[other] === 0, `${provider} metric refresh crossed provider endpoints.`)
  assert((await page.locator('[data-history-period-highlight="high"] p').textContent()) === '100,000 viewers', `${provider} peak-viewer highlight did not refresh.`)

  await page.locator('[data-history-report-mode="post"]').click()
  await page.waitForFunction(() => document.querySelector('[data-history-report-preview]')?.textContent?.includes('Peak viewers'))
  const peakPost = await page.locator('[data-history-report-preview]').textContent()
  assert(new URL(peakPost?.split('\n').at(-1) ?? '').searchParams.get('metric') === 'peak_viewers', `${provider} refreshed short-post metric is incorrect.`)

  const widths = await page.evaluate(() => [document.documentElement.scrollWidth, innerWidth])
  assert(widths[0] <= widths[1] + 1, `${provider} report introduced horizontal overflow.`)
  await page.screenshot({ path: resolve(screenshotDir, `history-report-${provider}.png`), fullPage: true })
  await context.close()
}

async function waitForModeAndFocus(page, mode) {
  await page.waitForFunction((expectedMode) => {
    const button = document.querySelector(`[data-history-report-mode="${expectedMode}"]`)
    return button?.getAttribute('aria-pressed') === 'true' && document.activeElement === button
  }, mode, { timeout: 5000 }).catch(async (error) => {
    const diagnostic = await page.evaluate(() => ({
      activeTag: document.activeElement?.tagName,
      activeMode: document.activeElement?.getAttribute('data-history-report-mode'),
      activeText: document.activeElement?.textContent?.trim(),
      reportPressed: document.querySelector('[data-history-report-mode="report"]')?.getAttribute('aria-pressed'),
      postPressed: document.querySelector('[data-history-report-mode="post"]')?.getAttribute('aria-pressed'),
    }))
    throw new Error(`${mode} history report mode keyboard focus did not move: ${JSON.stringify(diagnostic)}; ${error.message}`)
  })
}

const browser = await chromium.launch({ headless: true })
try {
  await check(browser, 'twitch', { width: 1440, height: 1100 })
  await check(browser, 'kick', { width: 390, height: 844 })
  console.log('History report browser gate passed with output accessibility and provider-separated period highlights.')
} finally {
  await browser.close()
}
