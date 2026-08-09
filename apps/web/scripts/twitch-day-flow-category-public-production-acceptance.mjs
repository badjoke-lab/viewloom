import fs from 'node:fs'
import path from 'node:path'
import { chromium } from 'playwright'

const ORIGIN = process.env.VIEWLOOM_ORIGIN || 'https://www.viewloom.net'
const EXPECTED_SHA = process.env.EXPECTED_PRODUCTION_SHA || ''
const OUT = process.env.OUTPUT_DIR || 'artifacts/12a6-twitch-day-flow-category-public-production-acceptance'
const VALIDATION_DATE = process.env.DAYFLOW_VALIDATION_DATE || '2026-08-08'
const screenshots = path.join(OUT, 'screenshots')
fs.mkdirSync(screenshots, { recursive: true })

const evidence = {
  schemaVersion: 'viewloom-12a6-twitch-day-flow-category-public-production-evidence-v1',
  observedAt: new Date().toISOString(),
  origin: ORIGIN,
  expectedProductionSha: EXPECTED_SHA || null,
  validationDate: VALIDATION_DATE,
  deployment: null,
  status: 'running',
  scenarios: [],
  failures: [],
  publicTwitchDayFlowCategoryUiActive: false,
  kickCategoryUiEnabled: false,
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
const geometry = (page) => page.evaluate(() => ({
  width: window.innerWidth,
  scrollWidth: document.documentElement.scrollWidth,
  overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
}))
const arraysEqual = (left, right) => Array.isArray(left) && Array.isArray(right)
  && left.length === right.length
  && left.every((value, index) => Number(value) === Number(right[index]))

async function waitForProductionSource() {
  assert(EXPECTED_SHA, 'EXPECTED_PRODUCTION_SHA is required for production acceptance')
  let last = null
  for (let attempt = 1; attempt <= 90; attempt += 1) {
    try {
      const response = await fetch(`${ORIGIN}/deployment.json?publicDayFlow=${Date.now()}`, { cache: 'no-store' })
      if (response.ok) {
        const json = await response.json()
        last = json
        if (json?.commit_sha === EXPECTED_SHA && json?.environment === 'production' && json?.branch === 'main') {
          evidence.deployment = { ...json, propagationAttempts: attempt }
          return
        }
      }
    } catch (error) {
      last = { error: error instanceof Error ? error.message : String(error) }
    }
    await new Promise((resolve) => setTimeout(resolve, 5000))
  }
  throw new Error(`production source did not propagate to ${EXPECTED_SHA}; last=${JSON.stringify(last)}`)
}

async function scenario(browser, options) {
  const context = await browser.newContext({ viewport: options.viewport })
  const page = await context.newPage()
  const requests = []
  page.on('request', (request) => {
    const url = request.url()
    if (url.includes('/api/day-flow') || url.includes('/api/kick-day-flow')) requests.push(url)
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

await waitForProductionSource()
const browser = await chromium.launch({ headless: true })
try {
  await scenario(browser, {
    name: 'twitch-public-fixed-day-desktop',
    viewport: { width: 1440, height: 1000 },
    run: async ({ page, record, requests }) => {
      const initialApi = page.waitForResponse((response) => endpoint(response.url(), '/api/day-flow') && new URL(response.url()).searchParams.get('category') === 'all')
      const nav = await page.goto(`${ORIGIN}/twitch/day-flow/?rangeMode=date&date=${VALIDATION_DATE}&auto=off`, { waitUntil: 'domcontentloaded', timeout: 45000 })
      assert(nav?.ok(), `public Twitch Day Flow HTTP ${nav?.status()}`)
      const initial = await responseJson(await initialApi)
      const root = page.locator('#dayflow-category-preview-controls')
      await root.waitFor({ state: 'visible', timeout: 30000 })
      await page.waitForSelector('.dayflow-stage svg', { timeout: 30000 })
      const select = root.locator('[data-dayflow-category-preview-select]')
      assert(await root.locator('label').innerText() === 'Category', 'public Category label mismatch')
      assert(await select.getAttribute('aria-label') === 'Twitch Day Flow category', 'public Category accessible label mismatch')
      assert(initial.ok === true && initial.platform === 'twitch', 'public Day Flow payload is not Twitch')
      assert(initial.rangeMode === 'date' && initial.selectedDate === VALIDATION_DATE, `public fixed-day mismatch ${initial.rangeMode}/${initial.selectedDate}`)
      assert(initial.categoryFilter?.implementationState === 'public', `implementationState=${initial.categoryFilter?.implementationState}`)
      assert(initial.categoryFilter?.publicExposureAuthorized === true, 'public exposure flag is not true')
      assert(initial.categoryFilter?.selectedCategory === 'all', `default selectedCategory=${initial.categoryFilter?.selectedCategory}`)
      assert(initial.categoryFilter?.filterBeforeTopN === true, 'public filter-before-Top-N is false')
      assert(initial.categoryFilter?.membershipEvaluation === 'per_observed_snapshot', `membershipEvaluation=${initial.categoryFilter?.membershipEvaluation}`)
      assert(initial.categoryFilter?.latestCategoryBackProjectionAllowed === false, 'latest-category back-projection became allowed')
      assert(initial.categoryFilter?.fullShareDenominator === 'all_observed_twitch_viewers_per_bucket', `fullShareDenominator=${initial.categoryFilter?.fullShareDenominator}`)
      assert(initial.categoryFilter?.topFocusShareDenominator === 'displayed_selected_category_top_n_viewers_per_bucket', `topFocusShareDenominator=${initial.categoryFilter?.topFocusShareDenominator}`)
      const categories = initial.categoryFilter?.availableCategories ?? initial.availableCategories ?? []
      assert(Array.isArray(categories) && categories.length > 0, 'public Twitch Day Flow has no real category options')
      const option = categories.find((value) => value?.id && Number(value?.viewerMinutes ?? 0) > 0)
        ?? categories.find((value) => value?.id && Number(value?.streamCount ?? 0) > 0)
      assert(option?.id, 'public Twitch Day Flow has no selectable category')
      const initialUrl = new URL(page.url())
      assert(initialUrl.searchParams.get('category') === 'all', `default category URL=${initialUrl.searchParams.get('category')}`)
      assert(!initialUrl.searchParams.has('categoryPreview'), 'normal public route retained categoryPreview')

      const selectedApi = page.waitForResponse((response) => endpoint(response.url(), '/api/day-flow') && new URL(response.url()).searchParams.get('category') === String(option.id))
      await select.selectOption(String(option.id))
      const selected = await responseJson(await selectedApi)
      assert(selected.categoryFilter?.implementationState === 'public', 'selected category lost public implementation state')
      assert(selected.categoryFilter?.publicExposureAuthorized === true, 'selected category lost public exposure authorization')
      assert(selected.categoryFilter?.state === 'selected', `selected state=${selected.categoryFilter?.state}`)
      assert(selected.categoryFilter?.selectedCategory === String(option.id), 'selected category ID mismatch')
      assert(arraysEqual(initial.totalViewersByBucket, selected.totalViewersByBucket), 'public category selection changed global totalViewersByBucket')
      assert(Array.isArray(selected.bands) && selected.bands.length > 0, 'selected public category produced no bands')
      const selectedUrl = new URL(page.url())
      assert(selectedUrl.searchParams.get('category') === String(option.id), 'selected category URL state mismatch')
      assert(!selectedUrl.searchParams.has('categoryPreview'), 'public interaction retained legacy categoryPreview')

      const counts = selected.categoryFilter?.coverageCounts ?? {}
      const partial = Number(counts.partial ?? 0)
      const unavailable = Number(counts.unavailable ?? 0)
      const statusText = await root.locator('.dayflow-category-preview__status').innerText()
      assert(statusText.includes(`${partial} partial`) && statusText.includes(`${unavailable} unavailable`), `coverage status copy mismatch: ${statusText}`)
      if (partial + unavailable > 0) {
        const strip = page.locator('.dayflow-category-coverage-strip')
        await strip.waitFor({ state: 'visible', timeout: 10000 })
        assert(await strip.locator('.is-partial').count() === partial, `partial coverage strip mismatch`)
        assert(await strip.locator('.is-unavailable').count() === unavailable, `unavailable coverage strip mismatch`)
      }
      assert(!requests.some((url) => endpoint(url, '/api/kick-day-flow')), 'public Twitch crossed into Kick API')
      const pageGeometry = await geometry(page)
      assert(!pageGeometry.overflow, `public Twitch desktop overflow ${pageGeometry.scrollWidth}/${pageGeometry.width}`)
      record.checks = {
        categoryOptions: categories.length,
        selectedCategory: option.id,
        selectedBandCount: selected.bands.length,
        coverageCounts: counts,
        globalTotalsPreserved: true,
        pageGeometry,
      }
      await page.screenshot({ path: path.join(screenshots, 'twitch-public-fixed-day-desktop.png'), fullPage: true })
    },
  })

  await scenario(browser, {
    name: 'twitch-public-fixed-day-mobile',
    viewport: { width: 390, height: 844 },
    run: async ({ page, record, requests }) => {
      const api = page.waitForResponse((response) => endpoint(response.url(), '/api/day-flow') && new URL(response.url()).searchParams.get('category') === 'all')
      const nav = await page.goto(`${ORIGIN}/twitch/day-flow/?rangeMode=date&date=${VALIDATION_DATE}&auto=off`, { waitUntil: 'domcontentloaded', timeout: 45000 })
      assert(nav?.ok(), `public mobile Twitch Day Flow HTTP ${nav?.status()}`)
      const json = await responseJson(await api)
      const root = page.locator('#dayflow-category-preview-controls')
      await root.waitFor({ state: 'visible', timeout: 30000 })
      assert(json.categoryFilter?.implementationState === 'public' && json.categoryFilter?.publicExposureAuthorized === true, 'mobile public category state mismatch')
      const box = await root.boundingBox()
      assert(box && box.width > 0 && box.height > 0, `public category control has no mobile box: ${JSON.stringify(box)}`)
      assert(box.x >= -1 && box.x + box.width <= 391, `public category control leaves viewport: ${JSON.stringify(box)}`)
      assert(await root.locator('[data-dayflow-category-preview-select]').count() === 1, 'mobile public category select missing')
      assert(!requests.some((url) => endpoint(url, '/api/kick-day-flow')), 'mobile public Twitch crossed into Kick API')
      const pageGeometry = await geometry(page)
      assert(!pageGeometry.overflow, `public Twitch mobile overflow ${pageGeometry.scrollWidth}/${pageGeometry.width}`)
      record.checks = { box, pageGeometry, coverageCounts: json.categoryFilter?.coverageCounts ?? null }
      await page.screenshot({ path: path.join(screenshots, 'twitch-public-fixed-day-mobile.png'), fullPage: true })
    },
  })

  await scenario(browser, {
    name: 'twitch-public-legacy-preview-compatibility',
    viewport: { width: 1024, height: 800 },
    run: async ({ page, record }) => {
      const initialApi = page.waitForResponse((response) => endpoint(response.url(), '/api/day-flow') && new URL(response.url()).searchParams.get('category') === 'all')
      const nav = await page.goto(`${ORIGIN}/twitch/day-flow/?categoryPreview=1&category=all&rangeMode=date&date=${VALIDATION_DATE}&auto=off`, { waitUntil: 'domcontentloaded', timeout: 45000 })
      assert(nav?.ok(), `legacy public Twitch Day Flow HTTP ${nav?.status()}`)
      const initial = await responseJson(await initialApi)
      const root = page.locator('#dayflow-category-preview-controls')
      await root.waitFor({ state: 'visible', timeout: 30000 })
      assert(initial.categoryFilter?.implementationState === 'public', 'legacy link did not resolve to public category state')
      const categories = initial.categoryFilter?.availableCategories ?? []
      const option = categories.find((value) => value?.id && Number(value?.viewerMinutes ?? 0) > 0)
      assert(option?.id, 'legacy link has no selectable category')
      assert(new URL(page.url()).searchParams.get('categoryPreview') === '1', 'legacy parameter was not accepted at load')
      const selectedApi = page.waitForResponse((response) => endpoint(response.url(), '/api/day-flow') && new URL(response.url()).searchParams.get('category') === String(option.id))
      await root.locator('[data-dayflow-category-preview-select]').selectOption(String(option.id))
      await responseJson(await selectedApi)
      const selectedUrl = new URL(page.url())
      assert(!selectedUrl.searchParams.has('categoryPreview'), 'legacy categoryPreview was not removed after public interaction')
      assert(selectedUrl.searchParams.get('category') === String(option.id), 'legacy link public category state mismatch after interaction')
      record.checks = { selectedCategory: option.id, legacyParameterRemoved: true }
    },
  })

  await scenario(browser, {
    name: 'twitch-public-unknown-category',
    viewport: { width: 1024, height: 800 },
    run: async ({ page, record }) => {
      const unknown = '__viewloom_unknown_category__'
      const api = page.waitForResponse((response) => endpoint(response.url(), '/api/day-flow') && new URL(response.url()).searchParams.get('category') === unknown)
      const nav = await page.goto(`${ORIGIN}/twitch/day-flow/?category=${encodeURIComponent(unknown)}&rangeMode=date&date=${VALIDATION_DATE}&auto=off`, { waitUntil: 'domcontentloaded', timeout: 45000 })
      assert(nav?.ok(), `public unknown-category HTTP ${nav?.status()}`)
      const json = await responseJson(await api)
      const root = page.locator('#dayflow-category-preview-controls')
      await root.waitFor({ state: 'visible', timeout: 30000 })
      assert(json.categoryFilter?.implementationState === 'public', 'unknown category lost public state')
      assert(json.categoryFilter?.publicExposureAuthorized === true, 'unknown category lost public exposure flag')
      assert(json.categoryFilter?.state === 'unknown_category', `unknown category state=${json.categoryFilter?.state}`)
      assert(Array.isArray(json.bands) && json.bands.length === 0, `unknown category returned ${json.bands?.length} bands`)
      const statusText = await root.locator('.dayflow-category-preview__status').innerText()
      assert(/Unknown Twitch category/i.test(statusText), `unknown status copy=${statusText}`)
      record.checks = { state: json.categoryFilter?.state, bandCount: json.bands.length, statusText }
    },
  })

  await scenario(browser, {
    name: 'kick-public-cutover-isolation',
    viewport: { width: 390, height: 844 },
    run: async ({ page, record, requests }) => {
      const api = page.waitForResponse((response) => endpoint(response.url(), '/api/kick-day-flow'))
      const nav = await page.goto(`${ORIGIN}/kick/day-flow/?category=all&rangeMode=date&date=${VALIDATION_DATE}&auto=off`, { waitUntil: 'domcontentloaded', timeout: 45000 })
      assert(nav?.ok(), `Kick Day Flow HTTP ${nav?.status()}`)
      const response = await api
      assert(response.ok(), `Kick Day Flow API HTTP ${response.status()}`)
      const json = await responseJson(response)
      await page.waitForSelector('.dayflow-stage svg', { timeout: 30000 })
      assert(await page.locator('#dayflow-category-preview-controls').count() === 0, 'Kick received Twitch public category controls')
      const requestUrl = new URL(response.url())
      assert(!requestUrl.searchParams.has('category'), 'Kick request inherited category parameter')
      assert(json.platform === 'kick', `Kick platform=${json.platform}`)
      assert(Array.isArray(json.buckets) && json.buckets.length > 0, 'Kick has no observed buckets for control date')
      assert(!requests.some((url) => endpoint(url, '/api/day-flow')), 'Kick crossed into Twitch API')
      const pageGeometry = await geometry(page)
      assert(!pageGeometry.overflow, `Kick mobile overflow ${pageGeometry.scrollWidth}/${pageGeometry.width}`)
      record.checks = { bucketCount: json.buckets.length, bandCount: json.bands?.length ?? 0, pageGeometry }
      await page.screenshot({ path: path.join(screenshots, 'kick-public-cutover-isolation-mobile.png'), fullPage: true })
    },
  })
} finally {
  await browser.close()
}

evidence.observedAt = new Date().toISOString()
evidence.status = evidence.failures.length === 0 ? 'pass' : 'fail'
evidence.publicTwitchDayFlowCategoryUiActive = evidence.scenarios
  .filter((scenario) => scenario.name.startsWith('twitch-public'))
  .every((scenario) => scenario.status === 'pass')
evidence.kickCategoryUiEnabled = false
fs.writeFileSync(path.join(OUT, 'evidence.json'), `${JSON.stringify(evidence, null, 2)}\n`)
console.log(JSON.stringify({
  status: evidence.status,
  expectedProductionSha: evidence.expectedProductionSha,
  deployment: evidence.deployment,
  failures: evidence.failures,
  publicTwitchDayFlowCategoryUiActive: evidence.publicTwitchDayFlowCategoryUiActive,
  kickCategoryUiEnabled: evidence.kickCategoryUiEnabled,
  scenarios: evidence.scenarios.map(({ name, status }) => ({ name, status })),
}, null, 2))
if (evidence.failures.length > 0) process.exitCode = 1
