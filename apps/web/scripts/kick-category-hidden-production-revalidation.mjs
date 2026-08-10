import fs from 'node:fs'
import path from 'node:path'
import { chromium } from 'playwright'

const ORIGIN = process.env.VIEWLOOM_ORIGIN || 'https://www.viewloom.net'
const EXPECTED_SHA = process.env.EXPECTED_SHA || ''
const OUT = process.env.OUTPUT_DIR || 'artifacts/12a8-kick-category-hidden-production-revalidation'
const screenshots = path.join(OUT, 'screenshots')
fs.mkdirSync(screenshots, { recursive: true })

const evidence = {
  schemaVersion: 'viewloom-12a8-kick-category-hidden-production-revalidation-evidence-v1',
  observedAt: new Date().toISOString(),
  origin: ORIGIN,
  expectedSha: EXPECTED_SHA,
  status: 'running',
  productionSource: null,
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
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function waitForProductionSource() {
  assert(EXPECTED_SHA, 'EXPECTED_SHA is required for exact production-source validation')
  let last = null
  for (let attempt = 1; attempt <= 90; attempt += 1) {
    try {
      const response = await fetch(`${ORIGIN}/deployment.json?kickCategoryRevalidation=${Date.now()}-${attempt}`, {
        headers: { 'cache-control': 'no-cache' },
      })
      if (!response.ok) throw new Error(`deployment HTTP ${response.status}`)
      const deployment = await response.json()
      last = { attempt, observedAt: new Date().toISOString(), deployment }
      const exact = deployment?.commit_sha === EXPECTED_SHA
        && deployment?.environment === 'production'
        && deployment?.branch === 'main'
      if (exact) return { ...last, exact: true }
    } catch (error) {
      last = {
        attempt,
        observedAt: new Date().toISOString(),
        error: error instanceof Error ? error.message : String(error),
      }
    }
    await sleep(5000)
  }
  throw new Error(`exact production SHA ${EXPECTED_SHA} was not observed: ${JSON.stringify(last)}`)
}

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

let browser = null
try {
  evidence.productionSource = await waitForProductionSource()
  browser = await chromium.launch({ headless: true })

  await scenario(browser, {
    name: 'kick-normal-desktop',
    viewport: { width: 1440, height: 1000 },
    run: async ({ page, record, requests }) => {
      const api = page.waitForResponse((r) => endpoint(r.url(), '/api/kick-heatmap'))
      const nav = await page.goto(`${ORIGIN}/kick/heatmap/`, { waitUntil: 'domcontentloaded', timeout: 45000 })
      assert(nav?.ok(), `normal Kick page HTTP ${nav?.status()}`)
      const response = await api
      assert(response.ok(), `normal Kick API HTTP ${response.status()}`)
      const json = await responseJson(response)
      await page.waitForSelector('.chart-placeholder--heatmap:not([aria-busy="true"])', { timeout: 30000 })
      assert(await page.locator('#heatmap-category-preview-controls').count() === 0, 'normal Kick route exposed hidden category controls')
      const u = new URL(response.url())
      assert(!u.searchParams.has('category') && !u.searchParams.has('top'), 'normal Kick route sent hidden category query')
      assert(json.platform === 'kick', `normal Kick API platform=${json.platform}`)
      assert(json.state === 'live', `normal Kick API state=${json.state}`)
      assert(Array.isArray(json.items) && json.items.length > 0, 'normal Kick API returned no real items')
      assert(json.categoryFilter?.implementationState === 'hidden', 'normal Kick API category implementation is not hidden')
      assert(json.categoryFilter?.publicExposureAuthorized === false, 'normal Kick API claims public category exposure')
      assert(json.categoryFilter?.selectedCategory === 'all', 'normal Kick route is not unfiltered All categories')
      assert(!requests.some((url) => endpoint(url, '/api/twitch-heatmap')), 'normal Kick route crossed into Twitch Heatmap API')
      const geometry = await overflow(page)
      assert(!geometry.overflow, `normal Kick desktop horizontal overflow ${geometry.scrollWidth}/${geometry.width}`)
      record.checks = {
        itemCount: json.items.length,
        state: json.state,
        categoryImplementation: json.categoryFilter?.implementationState,
        publicExposureAuthorized: json.categoryFilter?.publicExposureAuthorized,
        geometry,
      }
      await page.screenshot({ path: path.join(screenshots, 'kick-normal-desktop.png'), fullPage: true })
    },
  })

  await scenario(browser, {
    name: 'kick-hidden-desktop',
    viewport: { width: 1440, height: 1000 },
    run: async ({ page, record, requests }) => {
      const initialApi = page.waitForResponse((r) => {
        if (!endpoint(r.url(), '/api/kick-heatmap')) return false
        const u = new URL(r.url())
        return u.searchParams.get('category') === 'all' && u.searchParams.get('top') === '50'
      })
      const nav = await page.goto(`${ORIGIN}/kick/heatmap/?categoryPreview=1`, { waitUntil: 'domcontentloaded', timeout: 45000 })
      assert(nav?.ok(), `hidden Kick page HTTP ${nav?.status()}`)
      const response = await initialApi
      const json = await responseJson(response)
      const root = page.locator('#heatmap-category-preview-controls')
      await root.waitFor({ state: 'visible', timeout: 30000 })
      assert(await root.getAttribute('data-category-filter') === 'hidden', 'Kick hidden control root is not marked hidden')
      const category = root.locator('[data-category-preview-select]')
      const top = root.locator('[data-category-preview-top]')
      assert(await category.getAttribute('aria-label') === 'Kick category', 'Kick category accessible label mismatch')
      assert(await top.getAttribute('aria-label') === 'Kick maximum streams', 'Kick Top accessible label mismatch')
      assert(json.platform === 'kick', `hidden Kick API platform=${json.platform}`)
      assert(json.state === 'live', `hidden Kick API state=${json.state}`)
      assert(json.categoryFilter?.implementationState === 'hidden', 'hidden Kick implementation state mismatch')
      assert(json.categoryFilter?.publicExposureAuthorized === false, 'hidden Kick API claims public exposure')
      assert(json.categoryFilter?.available === true, 'hidden Kick category contract unavailable')
      assert(json.categoryFilter?.filterBeforeTopN === true, 'hidden Kick API no longer filters before Top N')
      assert(json.categoryFilter?.selectedCategory === 'all', 'hidden Kick initial category is not all')
      assert(json.categoryFilter?.requestedTop === 50, 'hidden Kick initial Top is not 50')
      assert(['observed', 'partial'].includes(json.categoryFilter?.coverageState), `hidden Kick coverage=${json.categoryFilter?.coverageState}`)
      for (const key of ['observedItems', 'missingItems', 'dictionaryMissingItems']) {
        assert(Number.isFinite(json.categoryFilter?.[key]) && json.categoryFilter[key] >= 0, `invalid category coverage field ${key}`)
      }
      assert(typeof json.categoryFilter?.sourceMode === 'string' && json.categoryFilter.sourceMode.length > 0, 'category sourceMode missing')
      assert(typeof json.categoryFilter?.targetSource === 'string' && json.categoryFilter.targetSource.length > 0, 'category targetSource missing')
      assert(Array.isArray(json.availableCategories) && json.availableCategories.length > 0, 'hidden Kick API has no category options')
      assert(Array.isArray(json.items) && json.items.length > 0 && json.items.length <= 50, `hidden Kick initial item count=${json.items?.length}`)

      const option = json.availableCategories.find((value) => value && value.id && value.streamCount > 0)
      assert(option, 'no non-empty Kick category option available for live selection')
      const selectedApi = page.waitForResponse((r) => {
        if (!endpoint(r.url(), '/api/kick-heatmap')) return false
        const u = new URL(r.url())
        return u.searchParams.get('category') === String(option.id) && u.searchParams.get('top') === '50'
      })
      await category.selectOption(String(option.id))
      const selectedJson = await responseJson(await selectedApi)
      assert(selectedJson.categoryFilter?.state === 'selected', `selected Kick category state=${selectedJson.categoryFilter?.state}`)
      assert(selectedJson.categoryFilter?.selectedCategory === String(option.id), 'selected Kick category ID mismatch')
      assert(selectedJson.categoryFilter?.momentumScope === 'selected_category_compatible_observations', 'selected Kick momentum scope mismatch')
      assert(Array.isArray(selectedJson.items) && selectedJson.items.length > 0 && selectedJson.items.length <= 50, `selected Kick item count=${selectedJson.items?.length}`)
      assert(selectedJson.items.every((item) => item.categoryId === String(option.id)), 'selected Kick response contains a different category ID')
      assert(selectedJson.items.every((item) => typeof item.momentumAvailable === 'boolean'), 'selected Kick response omitted momentum availability')
      const unavailableMomentum = selectedJson.items.filter((item) => item.momentumAvailable === false)
      for (const item of unavailableMomentum) {
        assert(item.momentum === 0, `unavailable momentum must use neutral numeric placeholder for ${item.id}`)
        assert(typeof item.momentumUnavailableReason === 'string' && item.momentumUnavailableReason.length > 0, `unavailable momentum reason missing for ${item.id}`)
      }

      const top20Api = page.waitForResponse((r) => {
        if (!endpoint(r.url(), '/api/kick-heatmap')) return false
        const u = new URL(r.url())
        return u.searchParams.get('category') === String(option.id) && u.searchParams.get('top') === '20'
      })
      await top.selectOption('20')
      const top20Json = await responseJson(await top20Api)
      assert(top20Json.categoryFilter?.requestedTop === 20, 'Kick Top 20 request not reflected in API')
      assert(Array.isArray(top20Json.items) && top20Json.items.length <= 20, `Kick Top 20 returned ${top20Json.items?.length}`)
      assert(top20Json.items.every((item) => item.categoryId === String(option.id)), 'Kick Top 20 crossed selected category')
      const pageUrl = new URL(page.url())
      assert(pageUrl.searchParams.get('categoryPreview') === '1', 'Kick hidden preview query was lost')
      assert(pageUrl.searchParams.get('category') === String(option.id), 'Kick selected category URL state mismatch')
      assert(pageUrl.searchParams.get('top') === '20', 'Kick Top URL state mismatch')

      await category.focus()
      assert(await page.evaluate(() => document.activeElement?.hasAttribute('data-category-preview-select')) === true, 'Kick category select cannot receive keyboard focus')
      await page.keyboard.press('Tab')
      assert(await page.evaluate(() => document.activeElement?.hasAttribute('data-category-preview-top')) === true, 'Tab did not move from Kick Category to Top')
      assert(!requests.some((url) => endpoint(url, '/api/twitch-heatmap')), 'hidden Kick route crossed into Twitch Heatmap API')
      const geometry = await overflow(page)
      assert(!geometry.overflow, `hidden Kick desktop horizontal overflow ${geometry.scrollWidth}/${geometry.width}`)
      record.checks = {
        initialItems: json.items.length,
        categoryOptions: json.availableCategories.length,
        categoryCoverageState: json.categoryFilter?.coverageState,
        observedItems: json.categoryFilter?.observedItems,
        missingItems: json.categoryFilter?.missingItems,
        dictionaryMissingItems: json.categoryFilter?.dictionaryMissingItems,
        sourceMode: json.categoryFilter?.sourceMode,
        targetSource: json.categoryFilter?.targetSource,
        selectedCategory: option.id,
        selectedItems: selectedJson.items.length,
        unavailableMomentumItems: unavailableMomentum.length,
        top20Items: top20Json.items.length,
        keyboard: true,
        geometry,
      }
      await page.screenshot({ path: path.join(screenshots, 'kick-hidden-desktop.png'), fullPage: true })
    },
  })

  await scenario(browser, {
    name: 'kick-hidden-mobile',
    viewport: { width: 390, height: 844 },
    run: async ({ page, record, requests }) => {
      const api = page.waitForResponse((r) => endpoint(r.url(), '/api/kick-heatmap') && new URL(r.url()).searchParams.get('top') === '50')
      const nav = await page.goto(`${ORIGIN}/kick/heatmap/?categoryPreview=1`, { waitUntil: 'domcontentloaded', timeout: 45000 })
      assert(nav?.ok(), `hidden mobile Kick page HTTP ${nav?.status()}`)
      const json = await responseJson(await api)
      const root = page.locator('#heatmap-category-preview-controls')
      await root.waitFor({ state: 'visible', timeout: 30000 })
      assert(await root.locator('[data-category-preview-select]').count() === 1, 'mobile Kick category select missing')
      assert(await root.locator('[data-category-preview-top]').count() === 1, 'mobile Kick Top select missing')
      assert(json.platform === 'kick' && json.categoryFilter?.available === true, 'mobile hidden Kick preview lacks category data')
      assert(Array.isArray(json.availableCategories) && json.availableCategories.length > 0, 'mobile hidden Kick preview has no categories')
      assert(!requests.some((url) => endpoint(url, '/api/twitch-heatmap')), 'mobile Kick route crossed into Twitch API')
      const rootBox = await root.boundingBox()
      assert(rootBox && rootBox.x >= -1 && rootBox.x + rootBox.width <= 391, `mobile Kick control geometry escaped viewport: ${JSON.stringify(rootBox)}`)
      const geometry = await overflow(page)
      assert(!geometry.overflow, `hidden Kick mobile horizontal overflow ${geometry.scrollWidth}/${geometry.width}`)
      record.checks = { categoryOptions: json.availableCategories.length, controlBox: rootBox, geometry }
      await page.screenshot({ path: path.join(screenshots, 'kick-hidden-mobile.png'), fullPage: true })
    },
  })

  await scenario(browser, {
    name: 'kick-hidden-unknown-category',
    viewport: { width: 820, height: 900 },
    run: async ({ page, record, requests }) => {
      const unknown = '__viewloom_unknown_kick_category__'
      const api = page.waitForResponse((r) => endpoint(r.url(), '/api/kick-heatmap') && new URL(r.url()).searchParams.get('category') === unknown)
      const nav = await page.goto(`${ORIGIN}/kick/heatmap/?categoryPreview=1&category=${encodeURIComponent(unknown)}&top=20`, { waitUntil: 'domcontentloaded', timeout: 45000 })
      assert(nav?.ok(), `unknown-category Kick page HTTP ${nav?.status()}`)
      const json = await responseJson(await api)
      assert(json.categoryFilter?.state === 'unknown_category', `unknown Kick category state=${json.categoryFilter?.state}`)
      assert(Array.isArray(json.items) && json.items.length === 0, 'unknown Kick category returned live items')
      await page.waitForSelector('.heatmap-runtime-state strong', { timeout: 30000 })
      const title = await page.locator('.heatmap-runtime-state strong').innerText()
      assert(title === 'Unknown Kick category', `unknown Kick category UI title=${title}`)
      assert(!requests.some((url) => endpoint(url, '/api/twitch-heatmap')), 'unknown Kick route crossed into Twitch API')
      record.checks = { state: json.categoryFilter?.state, itemCount: json.items.length, uiTitle: title }
      await page.screenshot({ path: path.join(screenshots, 'kick-hidden-unknown-category.png'), fullPage: true })
    },
  })

  await scenario(browser, {
    name: 'twitch-public-control',
    viewport: { width: 390, height: 844 },
    run: async ({ page, record, requests }) => {
      const api = page.waitForResponse((r) => {
        if (!endpoint(r.url(), '/api/twitch-heatmap')) return false
        const u = new URL(r.url())
        return u.searchParams.get('category') === 'all' && u.searchParams.get('top') === '50'
      })
      const nav = await page.goto(`${ORIGIN}/twitch/heatmap/`, { waitUntil: 'domcontentloaded', timeout: 45000 })
      assert(nav?.ok(), `Twitch public control page HTTP ${nav?.status()}`)
      const json = await responseJson(await api)
      const root = page.locator('#heatmap-category-preview-controls')
      await root.waitFor({ state: 'visible', timeout: 30000 })
      assert(await root.getAttribute('data-category-filter') === 'public', 'Twitch category controls are no longer public')
      assert(await root.locator('[data-category-preview-select]').getAttribute('aria-label') === 'Twitch category', 'Twitch category label changed')
      assert(json.provider === 'twitch', `Twitch API provider=${json.provider}`)
      assert(json.categoryFilter?.implementationState === 'public', 'Twitch API category implementation is no longer public')
      assert(json.categoryFilter?.publicExposureAuthorized === true, 'Twitch API public exposure authorization changed')
      assert(!requests.some((url) => endpoint(url, '/api/kick-heatmap')), 'Twitch route crossed into Kick Heatmap API')
      const geometry = await overflow(page)
      assert(!geometry.overflow, `Twitch public mobile horizontal overflow ${geometry.scrollWidth}/${geometry.width}`)
      record.checks = { implementationState: json.categoryFilter?.implementationState, publicExposureAuthorized: json.categoryFilter?.publicExposureAuthorized, geometry }
      await page.screenshot({ path: path.join(screenshots, 'twitch-public-control-mobile.png'), fullPage: true })
    },
  })
} catch (error) {
  evidence.failures.push(`production-source: ${error instanceof Error ? error.message : String(error)}`)
} finally {
  if (browser) await browser.close()
}

evidence.observedAt = new Date().toISOString()
evidence.status = evidence.failures.length === 0 ? 'pass' : 'fail'
fs.writeFileSync(path.join(OUT, 'evidence.json'), JSON.stringify(evidence, null, 2) + '\n')
console.log(JSON.stringify({
  status: evidence.status,
  expectedSha: evidence.expectedSha,
  productionSource: evidence.productionSource,
  failures: evidence.failures,
  scenarios: evidence.scenarios.map(({ name, status }) => ({ name, status })),
}, null, 2))
if (evidence.failures.length > 0) process.exitCode = 1
