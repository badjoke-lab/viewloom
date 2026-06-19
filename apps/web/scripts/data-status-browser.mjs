import { readFileSync } from 'node:fs'
import { chromium } from 'playwright'
const base = process.env.STATUS_BASE_URL ?? 'http://127.0.0.1:4173'
const fixture = (name) => readFileSync(new URL(`./fixtures/${name}-status.json`, import.meta.url), 'utf8')
const assert = (value, message) => { if (!value) throw new Error(message) }
async function check(browser, provider, viewport) {
  const calls = { twitch: 0, kick: 0 }
  const context = await browser.newContext({ viewport, isMobile: viewport.width < 500 })
  await context.route('**/api/twitch-status', route => { calls.twitch += 1; return route.fulfill({ status: 200, contentType: 'application/json', body: fixture('twitch') }) })
  await context.route('**/api/kick-status', route => { calls.kick += 1; return route.fulfill({ status: 200, contentType: 'application/json', body: fixture('kick') }) })
  const page = await context.newPage()
  await page.goto(`${base}/${provider}/status/`, { waitUntil: 'domcontentloaded' })
  await page.waitForFunction(() => document.querySelector('[data-status-pill]')?.textContent !== 'Loading')
  const other = provider === 'twitch' ? 'kick' : 'twitch'
  assert(calls[provider] > 0, `${provider} status endpoint was not requested.`)
  assert(calls[other] === 0, `${provider} page crossed provider endpoints.`)
  assert(await page.locator('.status-summary-card').count() === 5, `${provider} summary is incomplete.`)
  assert(await page.locator('[data-status-collector] div').count() >= 5, `${provider} collector detail is incomplete.`)
  const storage = provider === 'twitch' ? 'vl_twitch_hot' : 'vl_kick_hot'
  assert((await page.locator('[data-status-coverage]').textContent())?.includes(storage), `${provider} storage identity is missing.`)
  assert(await page.locator('[data-status-features] tr').count() === 4, `${provider} feature matrix is incomplete.`)
  const links = await page.locator('[data-status-features] a').evaluateAll(nodes => nodes.map(node => node.getAttribute('href')))
  for (const link of links) assert(link?.startsWith(`/${provider}/`), `${provider} feature link crossed providers.`)
  assert(await page.locator('[data-status-limitations] li').count() >= 2, `${provider} limitations are missing.`)
  assert(await page.locator('[data-status-refresh]').isVisible(), `${provider} refresh control is missing.`)
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
  console.log('Data Status browser gate passed.')
} finally {
  await browser.close()
}
