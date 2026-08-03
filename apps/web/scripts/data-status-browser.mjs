import { readFileSync } from 'node:fs'
import { chromium } from 'playwright'

const base = process.env.STATUS_BASE_URL ?? 'http://127.0.0.1:4173'
const fixture = name => JSON.parse(readFileSync(new URL(`./fixtures/${name}-status.json`, import.meta.url), 'utf8'))
const assert = (value, message) => { if (!value) throw new Error(message) }
const pause = ms => new Promise(resolve => setTimeout(resolve, ms))

function refreshedFixture(provider) {
  const payload = fixture(provider)
  payload.generatedAt = '2026-06-19T13:03:00.000Z'
  payload.collector.lastAttemptAt = '2026-06-19T13:02:00.000Z'
  payload.collector.lastSuccessAt = '2026-06-19T13:02:00.000Z'
  payload.freshness.lastSuccessAt = '2026-06-19T13:02:00.000Z'
  payload.latestSnapshot.bucketMinute = '2026-06-19T13:00:00.000Z'
  payload.features = payload.features.map(feature => ({ ...feature, lastUpdatedAt: '2026-06-19T13:00:00.000Z' }))
  return payload
}

async function check(browser, provider, viewport) {
  const calls = { twitch: 0, kick: 0 }
  const apiPaths = []
  const context = await browser.newContext({ viewport, isMobile: viewport.width < 500 })

  const fulfill = async (route, requestedProvider) => {
    calls[requestedProvider] += 1
    const attempt = calls[requestedProvider]
    const manualAttempt = Math.max(0, attempt - initialRequestAllowance[requestedProvider])
    if (manualAttempt > 0) await pause(220)
    if (manualAttempt === 2) {
      await route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'fixture failure' }) })
      return
    }
    const payload = manualAttempt === 1 ? refreshedFixture(requestedProvider) : fixture(requestedProvider)
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(payload) })
  }

  const initialRequestAllowance = { twitch: Number.POSITIVE_INFINITY, kick: Number.POSITIVE_INFINITY }
  await context.route('**/api/twitch-status', route => fulfill(route, 'twitch'))
  await context.route('**/api/kick-status', route => fulfill(route, 'kick'))

  const page = await context.newPage()
  page.on('request', request => {
    const path = new URL(request.url()).pathname
    if (path.startsWith('/api/')) apiPaths.push(path)
  })

  await page.goto(`${base}/${provider}/status/`, { waitUntil: 'domcontentloaded' })
  await page.waitForFunction(() => document.querySelector('[data-status-pill]')?.textContent !== 'Loading')
  await page.waitForTimeout(100)

  const other = provider === 'twitch' ? 'kick' : 'twitch'
  const endpoint = provider === 'twitch' ? '/api/twitch-status' : '/api/kick-status'
  const initialCalls = calls[provider]
  initialRequestAllowance[provider] = initialCalls
  initialRequestAllowance[other] = calls[other]
  assert(initialCalls >= 1, `${provider} status endpoint was not requested.`)
  assert(calls[other] === 0, `${provider} page crossed provider endpoints.`)
  assert(await page.locator('.status-summary-card').count() === 6, `${provider} six-card summary is incomplete.`)

  const summaryLabels = await page.locator('.status-summary-card small').allTextContents()
  for (const label of ['Last success', 'Latest snapshot', 'Status generated']) {
    assert(summaryLabels.includes(label), `${provider} ${label} summary is missing.`)
  }
  const initialNotes = await page.locator('.status-summary-card span').allTextContents()
  assert(initialNotes.some(value => value.includes('Collector success time')), `${provider} last-success meaning is missing.`)
  assert(initialNotes.some(value => value.includes('Observed bucket time')), `${provider} snapshot meaning is missing.`)
  assert(initialNotes.some(value => value.includes('Status response time')), `${provider} generation meaning is missing.`)

  assert(await page.locator('[data-status-collector] div').count() >= 5, `${provider} collector detail is incomplete.`)
  const storage = provider === 'twitch' ? 'vl_twitch_hot' : 'vl_kick_hot'
  assert((await page.locator('[data-status-coverage]').textContent())?.includes(storage), `${provider} storage identity is missing.`)
  assert(await page.locator('[data-status-features] tr').count() === 4, `${provider} feature matrix is incomplete.`)
  const links = await page.locator('[data-status-features] a').evaluateAll(nodes => nodes.map(node => node.getAttribute('href')))
  for (const link of links) assert(link?.startsWith(`/${provider}/`), `${provider} feature link crossed providers.`)
  assert(await page.locator('[data-status-limitations] li').count() >= 2, `${provider} limitations are missing.`)

  const refresh = page.locator('[data-status-refresh]')
  assert(await refresh.isVisible(), `${provider} refresh control is missing.`)
  await page.evaluate(() => { window.__statusRefreshSentinel = 'preserved' })

  await refresh.click()
  await page.waitForFunction(() => document.querySelector('[data-status-refresh]')?.hasAttribute('disabled'))
  assert(await refresh.getAttribute('aria-busy') === 'true', `${provider} refresh control did not enter its busy state.`)
  assert((await page.locator('[data-status-feedback]').textContent())?.includes('Refreshing Data Status'), `${provider} refresh loading feedback is missing.`)
  await page.waitForFunction(() => document.querySelector('[data-status-feedback]')?.getAttribute('data-refresh-result') === 'success' && !document.querySelector('[data-status-refresh]')?.hasAttribute('disabled'))

  assert(calls[provider] === initialCalls + 1, `${provider} successful refresh did not make exactly one additional provider request.`)
  assert(calls[other] === 0, `${provider} successful refresh crossed provider endpoints.`)
  assert(await page.evaluate(() => window.__statusRefreshSentinel) === 'preserved', `${provider} refresh caused a document reload.`)
  assert(await refresh.getAttribute('aria-busy') === 'false', `${provider} refresh control did not leave its busy state.`)

  const refreshedCards = await page.locator('.status-summary-card').evaluateAll(cards => Object.fromEntries(cards.map(card => [card.querySelector('small')?.textContent?.trim(), card.textContent?.trim()])))
  assert(refreshedCards['Last success']?.includes('2026-06-19 13:02 UTC'), `${provider} refreshed last-success timestamp is incorrect.`)
  assert(refreshedCards['Latest snapshot']?.includes('2026-06-19 13:00 UTC'), `${provider} refreshed snapshot timestamp is incorrect.`)
  assert(refreshedCards['Status generated']?.includes('2026-06-19 13:03 UTC'), `${provider} refreshed status-generated timestamp is incorrect.`)

  await refresh.click()
  await page.waitForFunction(() => document.querySelector('[data-status-refresh]')?.hasAttribute('disabled'))
  await page.waitForFunction(() => document.querySelector('[data-status-feedback]')?.getAttribute('data-refresh-result') === 'error' && !document.querySelector('[data-status-refresh]')?.hasAttribute('disabled'))
  assert(calls[provider] === initialCalls + 2, `${provider} failed refresh did not make exactly one additional provider request.`)
  assert(calls[other] === 0, `${provider} failed refresh crossed provider endpoints.`)
  assert((await page.locator('[data-status-feedback]').textContent())?.includes('Data Status refresh failed'), `${provider} refresh failure feedback is missing.`)
  assert(await page.evaluate(() => window.__statusRefreshSentinel) === 'preserved', `${provider} failed refresh caused a document reload.`)
  assert(await refresh.isEnabled(), `${provider} refresh control did not recover after failure.`)

  assert(apiPaths.length === calls[provider], `${provider} API request accounting is inconsistent: ${apiPaths.join(', ')}.`)
  for (const path of apiPaths) assert(path === endpoint, `${provider} page requested non-status API ${path}.`)

  const size = await page.evaluate(() => [document.documentElement.scrollWidth, innerWidth])
  assert(size[0] <= size[1] + 1, `${provider} page has horizontal overflow.`)
  if (viewport.width < 500) assert(await page.locator('.status-feature-card').count() === 4, `${provider} mobile feature cards are incomplete.`)
  await page.screenshot({ path: `/tmp/data-status-${provider}.png`, fullPage: true })
  await context.close()
}

const browser = await chromium.launch({ headless: true })
try {
  await check(browser, 'twitch', { width: 1440, height: 1100 })
  await check(browser, 'kick', { width: 390, height: 844 })
  console.log('Data Status browser gate passed with in-place refresh and timestamp separation.')
} finally {
  await browser.close()
}
