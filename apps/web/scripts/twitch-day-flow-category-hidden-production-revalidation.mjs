import fs from 'node:fs'
import path from 'node:path'
import { chromium } from 'playwright'

const ORIGIN = process.env.VIEWLOOM_ORIGIN || 'https://www.viewloom.net'
const EXPECTED_SHA = process.env.EXPECTED_PRODUCTION_SHA || ''
const DEPLOY_RUN_ID = process.env.DEPLOY_RUN_ID || ''
const OUT = process.env.OUTPUT_DIR || 'artifacts/12a6-twitch-day-flow-category-hidden-production-revalidation'
const VALIDATION_DATE = process.env.DAYFLOW_VALIDATION_DATE || '2026-08-08'
const screenshots = path.join(OUT, 'screenshots')
fs.mkdirSync(screenshots, { recursive: true })

const evidence = {
  schemaVersion: 'viewloom-12a6-twitch-day-flow-category-hidden-production-revalidation-evidence-v1',
  observedAt: new Date().toISOString(),
  origin: ORIGIN,
  expectedProductionSha: EXPECTED_SHA || null,
  deployWorkflowRun: DEPLOY_RUN_ID || null,
  validationDate: VALIDATION_DATE,
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
const geometry = (page) => page.evaluate(() => ({
  width: window.innerWidth,
  scrollWidth: document.documentElement.scrollWidth,
  overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
}))
const arraysEqual = (left, right) => Array.isArray(left) && Array.isArray(right)
  && left.length === right.length
  && left.every((value, index) => Number(value) === Number(right[index]))

async function waitForProductionSource() {
  assert(EXPECTED_SHA, 'EXPECTED_PRODUCTION_SHA is required for production validation')
  let last = null
  for (let attempt = 1; attempt <= 60; attempt += 1) {
    try {
      const response = await fetch(`${ORIGIN}/deployment.json?sourceCheck=${Date.now()}`, { cache: 'no-store' })
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
    name: 'twitch-normal-fixed-day-desktop',
    viewport: { width: 1440, height: 1000 },
    run: async ({ page, record, requests }) => {
      const api = page.waitForResponse((response) => endpoint(response.url(), '/api/day-flow'))
      const nav = await page.goto(`${ORIGIN}/twitch/day-flow/?range=date&date=${VALIDATION_DATE}&auto=off`, { waitUntil: 'domcontentloaded', timeout: 45000 })
      assert(nav?.ok(), `normal Twitch Day Flow HTTP ${nav?.status()}`)
      const response = await api
      assert(response.ok(), `normal Twitch Day Flow API HTTP ${response.status()}`)
      const json = await responseJson(response)
      await page.waitForSelector('.dayflow-stage svg', { timeout: 30000 })
      assert(await page.locator('#dayflow-category-preview-controls').count() === 0, 'normal Twitch Day Flow exposed hidden category controls')
      const requestUrl = new URL(response.url())
      assert(!requestUrl.searchParams.has('category'), 'normal Twitch Day Flow sent category query')
      assert(json.ok === true, `normal Twitch Day Flow ok=${json.ok}`)
      assert(json.platform === 'twitch', `normal Twitch Day Flow platform=${json.platform}`)
      assert(Array.isArray(json.buckets) && json.buckets.length > 0, 'normal Twitch Day Flow has no observed buckets')
      assert(Array.isArray(json.bands) && json.bands.length > 0, 'normal Twitch Day Flow has no observed bands')
      assert(!requests.some((url) => endpoint(url, '/api/kick-day-flow')), 'normal Twitch Day Flow crossed into Kick API')
      const pageGeometry = await geometry(page)
      assert(!pageGeometry.overflow, `normal Twitch desktop horizontal overflow ${pageGeometry.scrollWidth}/${pageGeometry.width}`)
      record.checks = { bucketCount: json.buckets.length, bandCount: json.bands.length, pageGeometry }
      await page.screenshot({ path: path.join(screenshots, 'twitch-normal-fixed-day-desktop.png'), fullPage: true })
    },
  })

  await scenario(browser, {
    name: 'twitch-hidden-fixed-day-desktop',
    viewport: { width: 1440, height: 1000 },
    run: async ({ page, record, requests }) => {
      const initialApi = page.waitForResponse((response) => {
        if (!endpoint(response.url(), '/api/day-flow')) return false
        return new URL(response.url()).searchParams.get('category') === 'all'
      })
      const nav = await page.goto(`${ORIGIN}/twitch/day-flow/?categoryPreview=1&category=all&range=date&date=${VALIDATION_DATE}&auto=off`, { waitUntil: 'domcontentloaded', timeout: 45000 })
      assert(nav?.ok(), `hidden Twitch Day Flow HTTP ${nav?.status()}`)
      const initialResponse = await initialApi
      assert(initialResponse.ok(), `hidden Twitch Day Flow API HTTP ${initialResponse.status()}`)
      const initial = await responseJson(initialResponse)
      const root = page.locator('#dayflow-category-preview-controls')
      await root.waitFor({ state: 'visible', timeout: 30000 })
      await page.waitForSelector('.dayflow-stage svg', { timeout: 30000 })
      const select = root.locator('[data-dayflow-category-preview-select]')
      assert(await select.getAttribute('aria-label') === 'Twitch Day Flow category preview', 'hidden category select accessible label mismatch')
      assert(initial.ok === true && initial.platform === 'twitch', 'hidden candidate did not return real Twitch Day Flow payload')
      assert(initial.categoryFilter?.implementationState === 'hidden_candidate', `implementationState=${initial.categoryFilter?.implementationState}`)
      assert(initial.categoryFilter?.publicExposureAuthorized === false, 'hidden candidate claims public exposure')
      assert(initial.categoryFilter?.filterBeforeTopN === true, 'hidden candidate no longer filters before Top N')
      assert(initial.categoryFilter?.membershipEvaluation === 'per_observed_snapshot', `membershipEvaluation=${initial.categoryFilter?.membershipEvaluation}`)
      assert(initial.categoryFilter?.latestCategoryBackProjectionAllowed === false, 'latest-category back-projection became allowed')
      assert(initial.categoryFilter?.fullShareDenominator === 'all_observed_twitch_viewers_per_bucket', `fullShareDenominator=${initial.categoryFilter?.fullShareDenominator}`)
      assert(initial.categoryFilter?.topFocusShareDenominator === 'displayed_selected_category_top_n_viewers_per_bucket', `topFocusShareDenominator=${initial.categoryFilter?.topFocusShareDenominator}`)
      assert(initial.categoryFilter?.selectedCategory === 'all', `initial selectedCategory=${initial.categoryFilter?.selectedCategory}`)
      const categories = initial.categoryFilter?.availableCategories ?? initial.availableCategories ?? []
      assert(Array.isArray(categories) && categories.length > 0, 'hidden candidate has no real category options')
      const option = categories.find((value) => value?.id && Number(value?.viewerMinutes ?? 0) > 0)
        ?? categories.find((value) => value?.id && Number(value?.streamCount ?? 0) > 0)
      assert(option?.id, 'hidden candidate has no selectable non-empty real category')

      const selectedApi = page.waitForResponse((response) => {
        if (!endpoint(response.url(), '/api/day-flow')) return false
        return new URL(response.url()).searchParams.get('category') === String(option.id)
      })
      await select.selectOption(String(option.id))
      const selected = await responseJson(await selectedApi)
      assert(selected.categoryFilter?.state === 'selected', `selected category state=${selected.categoryFilter?.state}`)
      assert(selected.categoryFilter?.selectedCategory === String(option.id), 'selected category ID mismatch')
      assert(selected.categoryFilter?.filterBeforeTopN === true, 'selected response lost filter-before-Top-N')
      assert(arraysEqual(initial.totalViewersByBucket, selected.totalViewersByBucket), 'selected category changed global totalViewersByBucket')
      assert(Array.isArray(selected.bands) && selected.bands.length > 0, 'selected real category produced no bands')
      const selectedUrl = new URL(page.url())
      assert(selectedUrl.searchParams.get('categoryPreview') === '1', 'hidden preview URL state was lost')
      assert(selectedUrl.searchParams.get('category') === String(option.id), 'selected category URL state mismatch')

      const counts = selected.categoryFilter?.coverageCounts ?? {}
      const partial = Number(counts.partial ?? 0)
      const unavailable = Number(counts.unavailable ?? 0)
      const statusText = await root.locator('.dayflow-category-preview__status').innerText()
      assert(statusText.includes(`${partial} partial`) && statusText.includes(`${unavailable} unavailable`), `coverage status copy mismatch: ${statusText}`)
      if (partial + unavailable > 0) {
        await page.waitForSelector('.dayflow-category-coverage-strip', { timeout: 10000 })
        const partialNodes = await page.locator('.dayflow-category-coverage-strip .is-partial').count()
        const unavailableNodes = await page.locator('.dayflow-category-coverage-strip .is-unavailable').count()
        assert(partialNodes === partial, `partial coverage strip count ${partialNodes}/${partial}`)
        assert(unavailableNodes === unavailable, `unavailable coverage strip count ${unavailableNodes}/${unavailable}`)
      }

      await select.focus()
      assert(await page.evaluate(() => document.activeElement?.hasAttribute('data-dayflow-category-preview-select')) === true, 'hidden category select cannot receive focus')
      assert(!requests.some((url) => endpoint(url, '/api/kick-day-flow')), 'hidden Twitch Day Flow crossed into Kick API')
      const pageGeometry = await geometry(page)
      assert(!pageGeometry.overflow, `hidden Twitch desktop horizontal overflow ${pageGeometry.scrollWidth}/${pageGeometry.width}`)
      record.checks = {
        categoryOptions: categories.length,
        selectedCategory: option.id,
        selectedBandCount: selected.bands.length,
        coverageCounts: counts,
        globalTotalsPreserved: true,
        pageGeometry,
      }
      await page.screenshot({ path: path.join(screenshots, 'twitch-hidden-fixed-day-desktop.png'), fullPage: true })
    },
  })

  await scenario(browser, {
    name: 'twitch-hidden-fixed-day-mobile',
    viewport: { width: 390, height: 844 },
    run: async ({ page, record, requests }) => {
      const api = page.waitForResponse((response) => endpoint(response.url(), '/api/day-flow') && new URL(response.url()).searchParams.get('category') === 'all')
      const nav = await page.goto(`${ORIGIN}/twitch/day-flow/?categoryPreview=1&category=all&range=date&date=${VALIDATION_DATE}&auto=off`, { waitUntil: 'domcontentloaded', timeout: 45000 })
      assert(nav?.ok(), `hidden mobile Twitch Day Flow HTTP ${nav?.status()}`)
      const json = await responseJson(await api)
      const root = page.locator('#dayflow-category-preview-controls')
      await root.waitFor({ state: 'visible', timeout: 30000 })
      await page.waitForSelector('.dayflow-stage svg', { timeout: 30000 })
      assert(json.categoryFilter?.implementationState === 'hidden_candidate', 'mobile hidden candidate implementation state mismatch')
      const box = await root.boundingBox()
      assert(box && box.width > 0 && box.height > 0, `hidden category control has no mobile box: ${JSON.stringify(box)}`)
      assert(box.x >= -1 && box.x + box.width <= 391, `hidden category control leaves viewport: ${JSON.stringify(box)}`)
      assert(await root.locator('[data-dayflow-category-preview-select]').count() === 1, 'mobile category select missing')
      assert(!requests.some((url) => endpoint(url, '/api/kick-day-flow')), 'mobile Twitch Day Flow crossed into Kick API')
      const pageGeometry = await geometry(page)
      assert(!pageGeometry.overflow, `hidden Twitch mobile horizontal overflow ${pageGeometry.scrollWidth}/${pageGeometry.width}`)
      record.checks = { box, pageGeometry, coverageCounts: json.categoryFilter?.coverageCounts ?? null }
      await page.screenshot({ path: path.join(screenshots, 'twitch-hidden-fixed-day-mobile.png'), fullPage: true })
    },
  })

  await scenario(browser, {
    name: 'twitch-hidden-unknown-category',
    viewport: { width: 1024, height: 800 },
    run: async ({ page, record }) => {
      const unknown = '__viewloom_unknown_category__'
      const api = page.waitForResponse((response) => endpoint(response.url(), '/api/day-flow') && new URL(response.url()).searchParams.get('category') === unknown)
      const nav = await page.goto(`${ORIGIN}/twitch/day-flow/?categoryPreview=1&category=${encodeURIComponent(unknown)}&range=date&date=${VALIDATION_DATE}&auto=off`, { waitUntil: 'domcontentloaded', timeout: 45000 })
      assert(nav?.ok(), `unknown-category Twitch Day Flow HTTP ${nav?.status()}`)
      const json = await responseJson(await api)
      const root = page.locator('#dayflow-category-preview-controls')
      await root.waitFor({ state: 'visible', timeout: 30000 })
      assert(json.categoryFilter?.state === 'unknown_category', `unknown category state=${json.categoryFilter?.state}`)
      assert(json.categoryFilter?.selectedCategory === unknown, 'unknown category selected ID mismatch')
      assert(Array.isArray(json.bands) && json.bands.length === 0, `unknown category returned ${json.bands?.length} bands`)
      const statusText = await root.locator('.dayflow-category-preview__status').innerText()
      assert(/Unknown Twitch category/i.test(statusText), `unknown category status copy=${statusText}`)
      record.checks = { state: json.categoryFilter?.state, bandCount: json.bands.length, statusText }
    },
  })

  await scenario(browser, {
    name: 'kick-preview-query-isolation',
    viewport: { width: 390, height: 844 },
    run: async ({ page, record, requests }) => {
      const api = page.waitForResponse((response) => endpoint(response.url(), '/api/kick-day-flow'))
      const nav = await page.goto(`${ORIGIN}/kick/day-flow/?categoryPreview=1&category=all&range=date&date=${VALIDATION_DATE}&auto=off`, { waitUntil: 'domcontentloaded', timeout: 45000 })
      assert(nav?.ok(), `Kick Day Flow HTTP ${nav?.status()}`)
      const response = await api
      assert(response.ok(), `Kick Day Flow API HTTP ${response.status()}`)
      const json = await responseJson(response)
      await page.waitForSelector('.dayflow-stage svg', { timeout: 30000 })
      assert(await page.locator('#dayflow-category-preview-controls').count() === 0, 'Kick enabled Twitch Day Flow category controls')
      const requestUrl = new URL(response.url())
      assert(!requestUrl.searchParams.has('category'), 'Kick Day Flow request inherited Twitch category parameter')
      assert(json.platform === 'kick', `Kick Day Flow platform=${json.platform}`)
      assert(Array.isArray(json.buckets) && json.buckets.length > 0, 'Kick Day Flow has no observed buckets for control date')
      assert(!requests.some((url) => endpoint(url, '/api/day-flow')), 'Kick Day Flow crossed into Twitch API')
      const pageGeometry = await geometry(page)
      assert(!pageGeometry.overflow, `Kick mobile horizontal overflow ${pageGeometry.scrollWidth}/${pageGeometry.width}`)
      record.checks = { bucketCount: json.buckets.length, bandCount: json.bands?.length ?? 0, pageGeometry }
      await page.screenshot({ path: path.join(screenshots, 'kick-preview-query-isolation-mobile.png'), fullPage: true })
    },
  })
} finally {
  await browser.close()
}

evidence.observedAt = new Date().toISOString()
evidence.status = evidence.failures.length === 0 ? 'pass' : 'fail'
fs.writeFileSync(path.join(OUT, 'evidence.json'), `${JSON.stringify(evidence, null, 2)}\n`)
console.log(JSON.stringify({
  status: evidence.status,
  expectedProductionSha: evidence.expectedProductionSha,
  deployWorkflowRun: evidence.deployWorkflowRun,
  deployment: evidence.deployment,
  failures: evidence.failures,
  scenarios: evidence.scenarios.map(({ name, status }) => ({ name, status })),
}, null, 2))
if (evidence.failures.length > 0) process.exitCode = 1
