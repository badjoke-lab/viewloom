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
  deployment: null,
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
const controlGeometry = (page) => page.evaluate(() => {
  const root = document.querySelector('#heatmap-category-preview-controls')
  const category = root?.querySelector('[data-category-preview-select]')
  const top = root?.querySelector('[data-category-preview-top]')
  const box = (element) => {
    if (!(element instanceof HTMLElement)) return null
    const rect = element.getBoundingClientRect()
    return { left: rect.left, right: rect.right, width: rect.width }
  }
  return { root: box(root), category: box(category), top: box(top), viewport: window.innerWidth }
})

async function verifyDeploymentIdentity() {
  assert(EXPECTED_SHA, 'EXPECTED_SHA is required')
  const response = await fetch(`${ORIGIN}/deployment.json?kickCategoryRevalidation=${Date.now()}`, { cache: 'no-store' })
  assert(response.ok, `deployment.json HTTP ${response.status}`)
  const deployment = await response.json()
  assert(deployment && typeof deployment === 'object', 'deployment.json is not an object')
  assert(deployment.commit_sha === EXPECTED_SHA, `production SHA ${deployment.commit_sha || 'missing'} != expected ${EXPECTED_SHA}`)
  assert(deployment.environment === 'production', `production environment=${deployment.environment}`)
  assert(deployment.branch === 'main', `production branch=${deployment.branch}`)
  evidence.deployment = deployment
  fs.writeFileSync(path.join(OUT, 'deployment.json'), JSON.stringify(deployment, null, 2) + '\n')
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

try {
  await verifyDeploymentIdentity()
} catch (error) {
  evidence.failures.push(`deployment-identity: ${error instanceof Error ? error.message : String(error)}`)
}

const browser = await chromium.launch({ headless: true })
try {
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
      const requestUrl = new URL(response.url())
      assert(!requestUrl.searchParams.has('category') && !requestUrl.searchParams.has('top'), 'normal Kick route sent hidden category query')
      assert((json.provider || json.platform) === 'kick', `normal Kick API provider=${json.provider || json.platform}`)
      assert(json.state === 'live', `normal Kick API state=${json.state}`)
      assert(Array.isArray(json.items) && json.items.length > 0, 'normal Kick API returned no live items')
      assert(json.categoryFilter?.implementationState === 'hidden', `normal Kick category implementation=${json.categoryFilter?.implementationState}`)
      assert(json.categoryFilter?.publicExposureAuthorized === false, 'normal Kick API claims public category exposure')
      assert(!requests.some((url) => endpoint(url, '/api/twitch-heatmap')), 'normal Kick route crossed into Twitch Heatmap API')
      const geometry = await overflow(page)
      assert(!geometry.overflow, `normal Kick desktop horizontal overflow ${geometry.scrollWidth}/${geometry.width}`)
      record.checks = {
        state: json.state,
        itemCount: json.items.length,
        categoryImplementation: json.categoryFilter?.implementationState,
        categoryCoverageState: json.categoryFilter?.coverageState,
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
      assert(response.ok(), `hidden Kick API HTTP ${response.status()}`)
      const json = await responseJson(response)
      const root = page.locator('#heatmap-category-preview-controls')
      await root.waitFor({ state: 'visible', timeout: 30000 })
      const category = root.locator('[data-category-preview-select]')
      const top = root.locator('[data-category-preview-top]')
      assert(await category.getAttribute('aria-label') === 'Kick category', 'Kick category select accessible label mismatch')
      assert(await top.getAttribute('aria-label') === 'Kick maximum streams', 'Kick Top select accessible label mismatch')
      assert((json.provider || json.platform) === 'kick', `hidden Kick API provider=${json.provider || json.platform}`)
      assert(json.state === 'live', `hidden Kick API state=${json.state}`)
      assert(json.categoryFilter?.implementationState === 'hidden', `hidden Kick implementation=${json.categoryFilter?.implementationState}`)
      assert(json.categoryFilter?.publicExposureAuthorized === false, 'hidden Kick API claims public exposure')
      assert(json.categoryFilter?.available === true, `hidden Kick category contract unavailable: ${json.categoryFilter?.coverageState}`)
      assert(['observed', 'partial'].includes(json.categoryFilter?.coverageState), `hidden Kick category coverage=${json.categoryFilter?.coverageState}`)
      assert(json.categoryFilter?.filterBeforeTopN === true, 'hidden Kick API no longer filters before Top N')
      assert(json.categoryFilter?.selectedCategory === 'all', `hidden Kick initial category=${json.categoryFilter?.selectedCategory}`)
      assert(json.categoryFilter?.requestedTop === 50, `hidden Kick initial Top=${json.categoryFilter?.requestedTop}`)
      assert(Array.isArray(json.availableCategories) && json.availableCategories.length > 0, 'hidden Kick API has no real category options')
      assert(Array.isArray(json.items) && json.items.length > 0 && json.items.length <= 50, `hidden Kick initial item count=${json.items?.length}`)

      const option = json.availableCategories.find((value) => value && value.id && value.streamCount > 0)
      assert(option, 'no non-empty real Kick category option available')
      const selectedApi = page.waitForResponse((r) => {
        if (!endpoint(r.url(), '/api/kick-heatmap')) return false
        const u = new URL(r.url())
        return u.searchParams.get('category') === String(option.id) && u.searchParams.get('top') === '50'
      })
      await category.selectOption(String(option.id))
      const selectedJson = await responseJson(await selectedApi)
      assert(selectedJson.categoryFilter?.state === 'selected', `selected Kick category state=${selectedJson.categoryFilter?.state}`)
      assert(selectedJson.categoryFilter?.selectedCategory === String(option.id), 'selected Kick category ID mismatch')
      assert(Array.isArray(selectedJson.items) && selectedJson.items.length > 0 && selectedJson.items.length <= 50, `selected Kick category item count=${selectedJson.items?.length}`)
      assert(selectedJson.items.every((item) => item.categoryId === String(option.id)), 'selected Kick response crossed category identity')
      const unavailableMomentum = selectedJson.items.filter((item) => item.momentumAvailable === false)
      assert(unavailableMomentum.every((item) => item.momentum === 0 && typeof item.momentumUnavailableReason === 'string' && item.momentumUnavailableReason.length > 0), 'unavailable selected-category momentum lacks explicit reason/neutral value')

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
        categoryOptions: json.availableCategories.length,
        categoryCoverageState: json.categoryFilter?.coverageState,
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
      const api = page.waitForResponse((r) => {
        if (!endpoint(r.url(), '/api/kick-heatmap')) return false
        const u = new URL(r.url())
        return u.searchParams.get('category') === 'all' && u.searchParams.get('top') === '50'
      })
      const nav = await page.goto(`${ORIGIN}/kick/heatmap/?categoryPreview=1`, { waitUntil: 'domcontentloaded', timeout: 45000 })
      assert(nav?.ok(), `hidden mobile Kick page HTTP ${nav?.status()}`)
      const json = await responseJson(await api)
      const root = page.locator('#heatmap-category-preview-controls')
      await root.waitFor({ state: 'visible', timeout: 30000 })
      assert(await root.locator('[data-category-preview-select]').count() === 1, 'mobile Kick category select missing')
      assert(await root.locator('[data-category-preview-top]').count() === 1, 'mobile Kick Top select missing')
      assert(json.categoryFilter?.available === true, 'mobile Kick hidden preview lacks category data')
      assert(Array.isArray(json.availableCategories) && json.availableCategories.length > 0, 'mobile Kick hidden preview has no categories')
      assert(!requests.some((url) => endpoint(url, '/api/twitch-heatmap')), 'mobile Kick route crossed into Twitch API')
      const geometry = await overflow(page)
      assert(!geometry.overflow, `hidden Kick mobile horizontal overflow ${geometry.scrollWidth}/${geometry.width}`)
      const controls = await controlGeometry(page)
      for (const [name, box] of Object.entries({ root: controls.root, category: controls.category, top: controls.top })) {
        assert(box && box.left >= -1 && box.right <= controls.viewport + 1, `mobile ${name} control exceeds viewport: ${JSON.stringify(box)}`)
      }
      record.checks = { categoryOptions: json.availableCategories.length, categoryCoverageState: json.categoryFilter?.coverageState, geometry, controls }
      await page.screenshot({ path: path.join(screenshots, 'kick-hidden-mobile.png'), fullPage: true })
    },
  })

  await scenario(browser, {
    name: 'kick-hidden-unknown-category',
    viewport: { width: 820, height: 900 },
    run: async ({ page, record, requests }) => {
      const unknown = '__viewloom_unknown_category__'
      const api = page.waitForResponse((r) => endpoint(r.url(), '/api/kick-heatmap') && new URL(r.url()).searchParams.get('category') === unknown)
      const nav = await page.goto(`${ORIGIN}/kick/heatmap/?categoryPreview=1&category=${encodeURIComponent(unknown)}&top=20`, { waitUntil: 'domcontentloaded', timeout: 45000 })
      assert(nav?.ok(), `unknown-category Kick page HTTP ${nav?.status()}`)
      const json = await responseJson(await api)
      assert(json.categoryFilter?.state === 'unknown_category', `unknown Kick category state=${json.categoryFilter?.state}`)
      assert(Array.isArray(json.items) && json.items.length === 0, 'unknown Kick category returned inferred live items')
      await page.waitForSelector('.heatmap-runtime-state strong', { timeout: 30000 })
      const title = await page.locator('.heatmap-runtime-state strong').innerText()
      assert(title === 'Unknown Kick category', `unknown Kick category UI title=${title}`)
      assert(!requests.some((url) => endpoint(url, '/api/twitch-heatmap')), 'unknown Kick route crossed into Twitch API')
      const geometry = await overflow(page)
      assert(!geometry.overflow, `unknown Kick route horizontal overflow ${geometry.scrollWidth}/${geometry.width}`)
      record.checks = { state: json.categoryFilter?.state, itemCount: json.items.length, uiTitle: title, geometry }
      await page.screenshot({ path: path.join(screenshots, 'kick-hidden-unknown-category.png'), fullPage: true })
    },
  })

  await scenario(browser, {
    name: 'twitch-public-isolation',
    viewport: { width: 390, height: 844 },
    run: async ({ page, record, requests }) => {
      const api = page.waitForResponse((r) => endpoint(r.url(), '/api/twitch-heatmap'))
      const nav = await page.goto(`${ORIGIN}/twitch/heatmap/`, { waitUntil: 'domcontentloaded', timeout: 45000 })
      assert(nav?.ok(), `Twitch isolation page HTTP ${nav?.status()}`)
      const json = await responseJson(await api)
      await page.waitForSelector('.chart-placeholder--heatmap:not([aria-busy="true"])', { timeout: 30000 })
      assert((json.provider || json.platform) === 'twitch', `Twitch isolation API provider=${json.provider || json.platform}`)
      assert(Array.isArray(json.items) && json.items.length > 0, 'Twitch isolation route returned no live items')
      assert(await page.locator('#heatmap-category-preview-controls').count() === 1, 'accepted public Twitch category controls disappeared')
      assert(!requests.some((url) => endpoint(url, '/api/kick-heatmap')), 'Twitch route crossed into Kick Heatmap API')
      const geometry = await overflow(page)
      assert(!geometry.overflow, `Twitch isolation mobile horizontal overflow ${geometry.scrollWidth}/${geometry.width}`)
      record.checks = { itemCount: json.items.length, categoryControls: 1, geometry }
      await page.screenshot({ path: path.join(screenshots, 'twitch-public-isolation-mobile.png'), fullPage: true })
    },
  })
} finally {
  await browser.close()
}

evidence.observedAt = new Date().toISOString()
evidence.status = evidence.failures.length === 0 ? 'pass' : 'fail'
fs.writeFileSync(path.join(OUT, 'evidence.json'), JSON.stringify(evidence, null, 2) + '\n')
console.log(JSON.stringify({
  status: evidence.status,
  expectedSha: evidence.expectedSha,
  observedSha: evidence.deployment?.commit_sha || null,
  failures: evidence.failures,
  scenarios: evidence.scenarios.map(({ name, status }) => ({ name, status })),
}, null, 2))
if (evidence.failures.length > 0) process.exitCode = 1
