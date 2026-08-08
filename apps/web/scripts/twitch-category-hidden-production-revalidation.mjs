import fs from 'node:fs'
import path from 'node:path'
import { chromium } from 'playwright'

const ORIGIN = process.env.VIEWLOOM_ORIGIN || 'https://www.viewloom.net'
const OUT = process.env.OUTPUT_DIR || 'artifacts/12a5-twitch-category-hidden-production-revalidation'
const screenshots = path.join(OUT, 'screenshots')
fs.mkdirSync(screenshots, { recursive: true })

const evidence = {
  schemaVersion: 'viewloom-12a5-twitch-category-hidden-production-revalidation-evidence-v1',
  observedAt: new Date().toISOString(),
  origin: ORIGIN,
  status: 'running',
  scenarios: [],
  failures: [],
  publicCutoverAuthorized: false,
  productionMutationPerformed: false,
}

const assert = (condition, message) => {
  if (!condition) throw new Error(message)
}
const endpoint = (url, pathname) => {
  try { return new URL(url).pathname === pathname } catch { return false }
}
const responseJson = async (response) => {
  const json = await response.json()
  assert(json && typeof json === 'object', `invalid JSON from ${response.url()}`)
  return json
}
const overflow = (page) => page.evaluate(() => ({
  width: window.innerWidth,
  scrollWidth: document.documentElement.scrollWidth,
  overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
}))

async function scenario(browser, options) {
  const context = await browser.newContext({ viewport: options.viewport })
  const page = await context.newPage()
  const requests = []
  page.on('request', (request) => {
    const url = request.url()
    if (url.includes('/api/twitch-heatmap') || url.includes('/api/kick-heatmap')) requests.push(url)
  })
  const record = { name: options.name, viewport: options.viewport, requests, checks: {} }
  evidence.scenarios.push(record)
  try {
    await options.run({ page, record, requests })
    record.status = 'pass'
  } catch (error) {
    record.status = 'fail'
    record.error = error instanceof Error ? error.message : String(error)
    evidence.failures.push(`${options.name}: ${record.error}`)
  } finally {
    await context.close()
  }
}

const browser = await chromium.launch({ headless: true })
try {
  await scenario(browser, {
    name: 'twitch-normal-desktop',
    viewport: { width: 1440, height: 1000 },
    run: async ({ page, record, requests }) => {
      const api = page.waitForResponse((r) => endpoint(r.url(), '/api/twitch-heatmap'))
      const nav = await page.goto(`${ORIGIN}/twitch/heatmap/`, { waitUntil: 'domcontentloaded', timeout: 45000 })
      assert(nav?.ok(), `normal Twitch page HTTP ${nav?.status()}`)
      const response = await api
      assert(response.ok(), `normal Twitch API HTTP ${response.status()}`)
      const json = await responseJson(response)
      await page.waitForSelector('.chart-placeholder--heatmap:not([aria-busy="true"])', { timeout: 30000 })
      assert(await page.locator('#heatmap-category-preview-controls').count() === 0, 'normal Twitch route exposed hidden category controls')
      const u = new URL(response.url())
      assert(!u.searchParams.has('category') && !u.searchParams.has('top'), 'normal Twitch route sent category preview query')
      assert(json.provider === 'twitch', `normal Twitch API provider=${json.provider}`)
      assert(json.state === 'live', `normal Twitch API state=${json.state}`)
      assert(Array.isArray(json.items) && json.items.length > 0, 'normal Twitch API returned no real items')
      assert(json.categoryFilter?.implementationState === 'hidden', 'normal Twitch API category implementation is not hidden')
      assert(json.categoryFilter?.publicExposureAuthorized === false, 'normal Twitch API claims public exposure')
      assert(!requests.some((url) => endpoint(url, '/api/kick-heatmap')), 'normal Twitch route crossed into Kick Heatmap API')
      const geometry = await overflow(page)
      assert(!geometry.overflow, `normal Twitch desktop horizontal overflow ${geometry.scrollWidth}/${geometry.width}`)
      record.checks = { itemCount: json.items.length, state: json.state, categoryImplementation: json.categoryFilter?.implementationState, geometry }
      await page.screenshot({ path: path.join(screenshots, 'twitch-normal-desktop.png'), fullPage: true })
    },
  })

  await scenario(browser, {
    name: 'twitch-hidden-desktop',
    viewport: { width: 1440, height: 1000 },
    run: async ({ page, record, requests }) => {
      const initialApi = page.waitForResponse((r) => {
        if (!endpoint(r.url(), '/api/twitch-heatmap')) return false
        const u = new URL(r.url())
        return u.searchParams.get('category') === 'all' && u.searchParams.get('top') === '50'
      })
      const nav = await page.goto(`${ORIGIN}/twitch/heatmap/?categoryPreview=1`, { waitUntil: 'domcontentloaded', timeout: 45000 })
      assert(nav?.ok(), `hidden Twitch page HTTP ${nav?.status()}`)
      const response = await initialApi
      const json = await responseJson(response)
      const root = page.locator('#heatmap-category-preview-controls')
      await root.waitFor({ state: 'visible', timeout: 30000 })
      const category = root.locator('[data-category-preview-select]')
      const top = root.locator('[data-category-preview-top]')
      assert(await category.getAttribute('aria-label') === 'Twitch category preview', 'category select accessible label mismatch')
      assert(await top.getAttribute('aria-label') === 'Twitch category preview maximum streams', 'Top select accessible label mismatch')
      assert(json.provider === 'twitch', `hidden Twitch API provider=${json.provider}`)
      assert(json.state === 'live', `hidden Twitch API state=${json.state}`)
      assert(json.categoryFilter?.implementationState === 'hidden', 'hidden API implementation state mismatch')
      assert(json.categoryFilter?.publicExposureAuthorized === false, 'hidden API public exposure flag changed')
      assert(json.categoryFilter?.available === true, 'hidden API category contract unavailable')
      assert(json.categoryFilter?.filterBeforeTopN === true, 'hidden API no longer filters before Top N')
      assert(json.categoryFilter?.selectedCategory === 'all', 'hidden API initial category is not all')
      assert(json.categoryFilter?.requestedTop === 50, 'hidden API initial Top is not 50')
      assert(Array.isArray(json.availableCategories) && json.availableCategories.length > 0, 'hidden API has no category options')
      assert(Array.isArray(json.items) && json.items.length > 0 && json.items.length <= 50, `hidden initial item count=${json.items?.length}`)
      const status = await root.locator('[role="status"]').innerText()
      assert(status.includes('Hidden preview') && status.includes('public exposure disabled'), `hidden status copy=${status}`)

      const option = json.availableCategories.find((value) => value && value.id && value.streamCount > 0)
      assert(option, 'no non-empty category option available for live selection')
      const selectedApi = page.waitForResponse((r) => {
        if (!endpoint(r.url(), '/api/twitch-heatmap')) return false
        const u = new URL(r.url())
        return u.searchParams.get('category') === String(option.id) && u.searchParams.get('top') === '50'
      })
      await category.selectOption(String(option.id))
      const selectedJson = await responseJson(await selectedApi)
      assert(selectedJson.categoryFilter?.state === 'selected', `selected category state=${selectedJson.categoryFilter?.state}`)
      assert(selectedJson.categoryFilter?.selectedCategory === String(option.id), 'selected category ID mismatch')
      assert(Array.isArray(selectedJson.items) && selectedJson.items.length > 0 && selectedJson.items.length <= 50, `selected category item count=${selectedJson.items?.length}`)
      assert(selectedJson.items.every((item) => item.categoryId === String(option.id)), 'selected response contains a different category ID')

      const top20Api = page.waitForResponse((r) => {
        if (!endpoint(r.url(), '/api/twitch-heatmap')) return false
        const u = new URL(r.url())
        return u.searchParams.get('category') === String(option.id) && u.searchParams.get('top') === '20'
      })
      await top.selectOption('20')
      const top20Json = await responseJson(await top20Api)
      assert(top20Json.categoryFilter?.requestedTop === 20, 'Top 20 request not reflected in API')
      assert(Array.isArray(top20Json.items) && top20Json.items.length <= 20, `Top 20 returned ${top20Json.items?.length}`)
      assert(top20Json.items.every((item) => item.categoryId === String(option.id)), 'Top 20 crossed selected category')
      const pageUrl = new URL(page.url())
      assert(pageUrl.searchParams.get('categoryPreview') === '1', 'hidden preview query was lost')
      assert(pageUrl.searchParams.get('category') === String(option.id), 'selected category URL state mismatch')
      assert(pageUrl.searchParams.get('top') === '20', 'Top URL state mismatch')

      await category.focus()
      assert(await page.evaluate(() => document.activeElement?.hasAttribute('data-category-preview-select')) === true, 'category select cannot receive keyboard focus')
      await page.keyboard.press('Tab')
      assert(await page.evaluate(() => document.activeElement?.hasAttribute('data-category-preview-top')) === true, 'Tab did not move from Category to Top')
      assert(!requests.some((url) => endpoint(url, '/api/kick-heatmap')), 'hidden Twitch route crossed into Kick Heatmap API')
      const geometry = await overflow(page)
      assert(!geometry.overflow, `hidden Twitch desktop horizontal overflow ${geometry.scrollWidth}/${geometry.width}`)
      record.checks = {
        initialItems: json.items.length,
        categoryOptions: json.availableCategories.length,
        categoryCoverageState: json.categoryFilter?.coverageState,
        selectedCategory: option.id,
        selectedItems: selectedJson.items.length,
        top20Items: top20Json.items.length,
        keyboard: true,
        geometry,
      }
      await page.screenshot({ path: path.join(screenshots, 'twitch-hidden-desktop.png'), fullPage: true })
    },
  })

  await scenario(browser, {
    name: 'twitch-hidden-mobile',
    viewport: { width: 390, height: 844 },
    run: async ({ page, record, requests }) => {
      const api = page.waitForResponse((r) => endpoint(r.url(), '/api/twitch-heatmap') && new URL(r.url()).searchParams.get('top') === '50')
      const nav = await page.goto(`${ORIGIN}/twitch/heatmap/?categoryPreview=1`, { waitUntil: 'domcontentloaded', timeout: 45000 })
      assert(nav?.ok(), `hidden mobile Twitch page HTTP ${nav?.status()}`)
      const json = await responseJson(await api)
      const root = page.locator('#heatmap-category-preview-controls')
      await root.waitFor({ state: 'visible', timeout: 30000 })
      assert(await root.locator('[data-category-preview-select]').count() === 1, 'mobile category select missing')
      assert(await root.locator('[data-category-preview-top]').count() === 1, 'mobile Top select missing')
      assert(json.provider === 'twitch' && json.categoryFilter?.available === true, 'mobile hidden preview lacks live Twitch category data')
      assert(Array.isArray(json.availableCategories) && json.availableCategories.length > 0, 'mobile hidden preview has no categories')
      assert(!requests.some((url) => endpoint(url, '/api/kick-heatmap')), 'mobile Twitch route crossed into Kick API')
      const geometry = await overflow(page)
      assert(!geometry.overflow, `hidden Twitch mobile horizontal overflow ${geometry.scrollWidth}/${geometry.width}`)
      record.checks = { categoryOptions: json.availableCategories.length, geometry }
      await page.screenshot({ path: path.join(screenshots, 'twitch-hidden-mobile.png'), fullPage: true })
    },
  })

  await scenario(browser, {
    name: 'twitch-hidden-unknown-category',
    viewport: { width: 820, height: 900 },
    run: async ({ page, record }) => {
      const unknown = '__viewloom_unknown_category__'
      const api = page.waitForResponse((r) => endpoint(r.url(), '/api/twitch-heatmap') && new URL(r.url()).searchParams.get('category') === unknown)
      const nav = await page.goto(`${ORIGIN}/twitch/heatmap/?categoryPreview=1&category=${encodeURIComponent(unknown)}&top=20`, { waitUntil: 'domcontentloaded', timeout: 45000 })
      assert(nav?.ok(), `unknown-category Twitch page HTTP ${nav?.status()}`)
      const json = await responseJson(await api)
      assert(json.categoryFilter?.state === 'unknown_category', `unknown category state=${json.categoryFilter?.state}`)
      assert(Array.isArray(json.items) && json.items.length === 0, 'unknown category returned live items')
      await page.waitForSelector('.heatmap-runtime-state strong', { timeout: 30000 })
      const title = await page.locator('.heatmap-runtime-state strong').innerText()
      assert(title === 'Unknown Twitch category', `unknown category UI title=${title}`)
      record.checks = { state: json.categoryFilter?.state, itemCount: json.items.length, uiTitle: title }
    },
  })

  await scenario(browser, {
    name: 'kick-preview-query-control',
    viewport: { width: 390, height: 844 },
    run: async ({ page, record, requests }) => {
      const api = page.waitForResponse((r) => endpoint(r.url(), '/api/kick-heatmap'))
      const nav = await page.goto(`${ORIGIN}/kick/heatmap/?categoryPreview=1`, { waitUntil: 'domcontentloaded', timeout: 45000 })
      assert(nav?.ok(), `Kick page HTTP ${nav?.status()}`)
      const response = await api
      assert(response.ok(), `Kick API HTTP ${response.status()}`)
      const json = await responseJson(response)
      await page.waitForSelector('.chart-placeholder--heatmap:not([aria-busy="true"])', { timeout: 30000 })
      assert(await page.locator('#heatmap-category-preview-controls').count() === 0, 'Kick enabled Twitch category preview controls')
      const u = new URL(response.url())
      assert(!u.searchParams.has('category') && !u.searchParams.has('top'), 'Kick request inherited Twitch category preview parameters')
      assert(json.provider === 'kick' || json.platform === 'kick', `Kick API provider=${json.provider || json.platform}`)
      assert(Array.isArray(json.items) && json.items.length > 0, 'Kick control route has no live items')
      assert(!requests.some((url) => endpoint(url, '/api/twitch-heatmap')), 'Kick route crossed into Twitch Heatmap API')
      const geometry = await overflow(page)
      assert(!geometry.overflow, `Kick mobile horizontal overflow ${geometry.scrollWidth}/${geometry.width}`)
      record.checks = { itemCount: json.items.length, state: json.state || json.status, geometry }
      await page.screenshot({ path: path.join(screenshots, 'kick-preview-query-mobile.png'), fullPage: true })
    },
  })
} finally {
  await browser.close()
}

evidence.observedAt = new Date().toISOString()
evidence.status = evidence.failures.length === 0 ? 'pass' : 'fail'
fs.writeFileSync(path.join(OUT, 'evidence.json'), JSON.stringify(evidence, null, 2) + '\n')
console.log(JSON.stringify({ status: evidence.status, failures: evidence.failures, scenarios: evidence.scenarios.map(({ name, status }) => ({ name, status })) }, null, 2))
if (evidence.failures.length > 0) process.exitCode = 1
