import fs from 'node:fs'
import path from 'node:path'
import { chromium } from 'playwright'

const ORIGIN = process.env.VIEWLOOM_ORIGIN || 'https://www.viewloom.net'
const PRODUCT_AUTHORITY_SHA = process.env.PRODUCT_AUTHORITY_SHA || ''
const EXPECTED_DEPLOYMENT_SHA = process.env.EXPECTED_DEPLOYMENT_SHA || ''
const DEPLOY_RUN_ID = process.env.DEPLOY_RUN_ID || ''
const OUT = process.env.OUTPUT_DIR || 'artifacts/12a9-kick-day-flow-category-post-repair-production-revalidation'
const VALIDATION_DATE = process.env.DAYFLOW_VALIDATION_DATE || '2026-08-10'
const screenshots = path.join(OUT, 'screenshots')
fs.mkdirSync(screenshots, { recursive: true })

const evidence = {
  schemaVersion: 'viewloom-12a9-kick-day-flow-category-post-repair-production-revalidation-evidence-v1',
  observedAt: new Date().toISOString(),
  origin: ORIGIN,
  expectedProductSha: PRODUCT_AUTHORITY_SHA || null,
  expectedDeploymentSha: EXPECTED_DEPLOYMENT_SHA || null,
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
const rectsOverlap = (a, b) => {
  if (!a || !b) return false
  const x = Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x))
  const y = Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y))
  return x > 1 && y > 1
}

function verifyDeploymentIdentity() {
  assert(PRODUCT_AUTHORITY_SHA, 'PRODUCT_AUTHORITY_SHA is required')
  assert(EXPECTED_DEPLOYMENT_SHA, 'EXPECTED_DEPLOYMENT_SHA is required')
  const deploymentPath = path.join(OUT, 'last-deployment.json')
  assert(fs.existsSync(deploymentPath), `workflow deployment evidence missing: ${deploymentPath}`)
  const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'))
  assert(deployment?.commit_sha === EXPECTED_DEPLOYMENT_SHA, `deployment commit ${deployment?.commit_sha} != ${EXPECTED_DEPLOYMENT_SHA}`)
  assert(deployment?.environment === 'production', `deployment environment=${deployment?.environment}`)
  assert(deployment?.branch === 'main', `deployment branch=${deployment?.branch}`)
  evidence.deployment = deployment
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

let browser = null
try {
  verifyDeploymentIdentity()
  browser = await chromium.launch({ headless: true })

  await scenario(browser, {
    name: 'kick-normal-fixed-day-desktop',
    viewport: { width: 1440, height: 1000 },
    run: async ({ page, record, requests }) => {
      const api = page.waitForResponse((response) => endpoint(response.url(), '/api/kick-day-flow'))
      const nav = await page.goto(`${ORIGIN}/kick/day-flow/?rangeMode=date&date=${VALIDATION_DATE}&auto=off`, { waitUntil: 'domcontentloaded', timeout: 45000 })
      assert(nav?.ok(), `normal Kick Day Flow HTTP ${nav?.status()}`)
      const response = await api
      assert(response.ok(), `normal Kick Day Flow API HTTP ${response.status()}`)
      const json = await responseJson(response)
      await page.waitForSelector('.dayflow-stage svg', { timeout: 30000 })
      assert(await page.locator('#dayflow-category-preview-controls').count() === 0, 'normal Kick Day Flow exposed hidden category controls')
      const requestUrl = new URL(response.url())
      assert(!requestUrl.searchParams.has('category'), 'normal Kick Day Flow sent category query')
      assert(json.ok === true, `normal Kick Day Flow ok=${json.ok}`)
      assert(json.platform === 'kick', `normal Kick Day Flow platform=${json.platform}`)
      assert(json.rangeMode === 'date', `normal Kick Day Flow rangeMode=${json.rangeMode}`)
      assert(json.selectedDate === VALIDATION_DATE, `normal Kick Day Flow selectedDate=${json.selectedDate}`)
      assert(Array.isArray(json.buckets) && json.buckets.length > 0, 'normal Kick Day Flow has no buckets')
      assert(Array.isArray(json.bands) && json.bands.length > 0, 'normal Kick Day Flow has no observed bands')
      assert(json.categoryFilter == null, 'normal Kick Day Flow returned hidden category metadata without category request')
      assert(!requests.some((url) => endpoint(url, '/api/day-flow')), 'normal Kick Day Flow crossed into Twitch API')
      const pageGeometry = await geometry(page)
      assert(!pageGeometry.overflow, `normal Kick desktop horizontal overflow ${pageGeometry.scrollWidth}/${pageGeometry.width}`)
      record.checks = {
        rangeMode: json.rangeMode,
        selectedDate: json.selectedDate,
        bucketCount: json.buckets.length,
        bandCount: json.bands.length,
        categoryControls: 0,
        categoryQuerySent: false,
        pageGeometry,
      }
      await page.screenshot({ path: path.join(screenshots, 'kick-normal-fixed-day-desktop.png'), fullPage: true })
    },
  })

  await scenario(browser, {
    name: 'kick-hidden-fixed-day-desktop',
    viewport: { width: 1440, height: 1000 },
    run: async ({ page, record, requests }) => {
      const initialApi = page.waitForResponse((response) => {
        if (!endpoint(response.url(), '/api/kick-day-flow')) return false
        return new URL(response.url()).searchParams.get('category') === 'all'
      })
      const nav = await page.goto(`${ORIGIN}/kick/day-flow/?categoryPreview=1&category=all&rangeMode=date&date=${VALIDATION_DATE}&auto=off`, { waitUntil: 'domcontentloaded', timeout: 45000 })
      assert(nav?.ok(), `hidden Kick Day Flow HTTP ${nav?.status()}`)
      const initialResponse = await initialApi
      assert(initialResponse.ok(), `hidden Kick Day Flow API HTTP ${initialResponse.status()}`)
      const initial = await responseJson(initialResponse)
      const root = page.locator('#dayflow-category-preview-controls')
      await root.waitFor({ state: 'visible', timeout: 30000 })
      await page.waitForSelector('.dayflow-stage svg', { timeout: 30000 })
      const select = root.locator('[data-dayflow-category-preview-select]')
      assert(await select.getAttribute('aria-label') === 'Kick Day Flow category', 'Kick category select accessible label mismatch')
      assert(initial.ok === true && initial.platform === 'kick', 'hidden candidate did not return Kick Day Flow payload')
      assert(initial.rangeMode === 'date' && initial.selectedDate === VALIDATION_DATE, `hidden fixed-day identity mismatch ${initial.rangeMode}/${initial.selectedDate}`)
      assert(initial.categoryFilter?.implementationState === 'hidden_candidate', `implementationState=${initial.categoryFilter?.implementationState}`)
      assert(initial.categoryFilter?.publicExposureAuthorized === false, 'hidden Kick candidate claims public exposure')
      assert(initial.categoryFilter?.filterBeforeTopN === true, 'hidden Kick candidate lost filter-before-Top-N')
      assert(initial.categoryFilter?.membershipEvaluation === 'per_observed_snapshot', `membershipEvaluation=${initial.categoryFilter?.membershipEvaluation}`)
      assert(initial.categoryFilter?.latestCategoryBackProjectionAllowed === false, 'latest-category back-projection became allowed')
      assert(initial.categoryFilter?.fullShareDenominator === 'all_observed_kick_viewers_per_bucket', `fullShareDenominator=${initial.categoryFilter?.fullShareDenominator}`)
      assert(initial.categoryFilter?.topFocusShareDenominator === 'displayed_selected_category_top_n_viewers_per_bucket', `topFocusShareDenominator=${initial.categoryFilter?.topFocusShareDenominator}`)
      assert(initial.categoryFilter?.selectedCategory === 'all', `initial selectedCategory=${initial.categoryFilter?.selectedCategory}`)
      const categories = initial.categoryFilter?.availableCategories ?? initial.availableCategories ?? []
      assert(Array.isArray(categories) && categories.length > 0, 'hidden Kick candidate has no real category options')
      const option = categories.find((value) => value?.id && Number(value?.viewerMinutes ?? 0) > 0)
        ?? categories.find((value) => value?.id && Number(value?.streamCount ?? 0) > 0)
      assert(option?.id, 'hidden Kick candidate has no selectable non-empty category')

      const selectedApi = page.waitForResponse((response) => {
        if (!endpoint(response.url(), '/api/kick-day-flow')) return false
        return new URL(response.url()).searchParams.get('category') === String(option.id)
      })
      await select.selectOption(String(option.id))
      const selectedResponse = await selectedApi
      assert(selectedResponse.ok(), `selected Kick Day Flow API HTTP ${selectedResponse.status()}`)
      const selected = await responseJson(selectedResponse)
      assert(selected.rangeMode === 'date' && selected.selectedDate === VALIDATION_DATE, `selected fixed-day identity mismatch ${selected.rangeMode}/${selected.selectedDate}`)
      assert(selected.categoryFilter?.state === 'selected', `selected category state=${selected.categoryFilter?.state}`)
      assert(selected.categoryFilter?.selectedCategory === String(option.id), 'selected category ID mismatch')
      assert(selected.categoryFilter?.filterBeforeTopN === true, 'selected response lost filter-before-Top-N')
      assert(arraysEqual(initial.totalViewersByBucket, selected.totalViewersByBucket), 'selected category changed global totalViewersByBucket')
      assert(Array.isArray(selected.bands) && selected.bands.some((band) => !band?.isOthers), 'selected real Kick category produced no selected streamer bands')
      assert(selected.bands.some((band) => band?.isOthers), 'selected Kick Full context omitted global Others band')
      const selectedUrl = new URL(page.url())
      assert(selectedUrl.searchParams.get('categoryPreview') === '1', 'Kick hidden preview URL state was lost')
      assert(selectedUrl.searchParams.get('category') === String(option.id), 'selected Kick category URL state mismatch')
      assert(selectedUrl.searchParams.get('rangeMode') === 'date', 'fixed-day range URL state was lost')
      assert(selectedUrl.searchParams.get('date') === VALIDATION_DATE, 'fixed-day date URL state was lost')

      const counts = selected.categoryFilter?.coverageCounts ?? {}
      const observed = Number(counts.observed ?? 0)
      const partial = Number(counts.partial ?? 0)
      const unavailable = Number(counts.unavailable ?? 0)
      assert(observed + partial + unavailable > 0, 'Kick category coverage counts are empty')
      const statusText = await root.locator('.dayflow-category-preview__status').innerText()
      assert(statusText.includes(`${observed} observed`) && statusText.includes(`${partial} partial`) && statusText.includes(`${unavailable} unavailable`), `coverage status copy mismatch: ${statusText}`)
      if (partial + unavailable > 0) {
        await page.waitForSelector('.dayflow-category-coverage-strip', { timeout: 10000 })
        const partialNodes = await page.locator('.dayflow-category-coverage-strip .is-partial').count()
        const unavailableNodes = await page.locator('.dayflow-category-coverage-strip .is-unavailable').count()
        assert(partialNodes === partial, `partial coverage strip count ${partialNodes}/${partial}`)
        assert(unavailableNodes === unavailable, `unavailable coverage strip count ${unavailableNodes}/${unavailable}`)
      }

      const rootBox = await root.boundingBox()
      assert(rootBox && rootBox.width > 0 && rootBox.height > 0, `Kick category root has no desktop box: ${JSON.stringify(rootBox)}`)
      const siblingBoxes = await page.locator('.dayflow-toolbar > *:not(#dayflow-category-preview-controls)').evaluateAll((nodes) => nodes.map((node) => {
        const rect = node.getBoundingClientRect()
        return { tag: node.tagName, className: node.className, x: rect.x, y: rect.y, width: rect.width, height: rect.height }
      }).filter((rect) => rect.width > 0 && rect.height > 0))
      const overlaps = siblingBoxes.filter((box) => rectsOverlap(rootBox, box))
      assert(overlaps.length === 0, `Kick desktop category root overlaps toolbar controls: ${JSON.stringify(overlaps)}`)
      await select.focus()
      assert(await page.evaluate(() => document.activeElement?.hasAttribute('data-dayflow-category-preview-select')) === true, 'Kick category select cannot receive focus')
      assert(!requests.some((url) => endpoint(url, '/api/day-flow')), 'hidden Kick Day Flow crossed into Twitch API')
      const pageGeometry = await geometry(page)
      assert(!pageGeometry.overflow, `hidden Kick desktop horizontal overflow ${pageGeometry.scrollWidth}/${pageGeometry.width}`)
      record.checks = {
        rangeMode: selected.rangeMode,
        selectedDate: selected.selectedDate,
        categoryOptions: categories.length,
        selectedCategory: option.id,
        selectedBandCount: selected.bands.length,
        coverageCounts: counts,
        globalTotalsPreserved: true,
        fullShareDenominator: selected.categoryFilter?.fullShareDenominator,
        topFocusShareDenominator: selected.categoryFilter?.topFocusShareDenominator,
        rootBox,
        toolbarOverlapCount: overlaps.length,
        pageGeometry,
      }
      await page.screenshot({ path: path.join(screenshots, 'kick-hidden-fixed-day-desktop.png'), fullPage: true })
    },
  })

  await scenario(browser, {
    name: 'kick-hidden-fixed-day-mobile',
    viewport: { width: 390, height: 844 },
    run: async ({ page, record, requests }) => {
      const api = page.waitForResponse((response) => endpoint(response.url(), '/api/kick-day-flow') && new URL(response.url()).searchParams.get('category') === 'all')
      const nav = await page.goto(`${ORIGIN}/kick/day-flow/?categoryPreview=1&category=all&rangeMode=date&date=${VALIDATION_DATE}&auto=off`, { waitUntil: 'domcontentloaded', timeout: 45000 })
      assert(nav?.ok(), `hidden mobile Kick Day Flow HTTP ${nav?.status()}`)
      const json = await responseJson(await api)
      const root = page.locator('#dayflow-category-preview-controls')
      await root.waitFor({ state: 'visible', timeout: 30000 })
      await page.waitForSelector('.dayflow-stage svg', { timeout: 30000 })
      assert(json.rangeMode === 'date' && json.selectedDate === VALIDATION_DATE, `mobile fixed-day identity mismatch ${json.rangeMode}/${json.selectedDate}`)
      assert(json.categoryFilter?.implementationState === 'hidden_candidate', 'mobile hidden Kick candidate implementation state mismatch')
      assert(json.categoryFilter?.publicExposureAuthorized === false, 'mobile hidden Kick candidate claims public exposure')
      const box = await root.boundingBox()
      assert(box && box.width > 0 && box.height > 0, `Kick category control has no mobile box: ${JSON.stringify(box)}`)
      assert(box.x >= -1 && box.x + box.width <= 391, `Kick category control leaves viewport: ${JSON.stringify(box)}`)
      assert(await root.locator('[data-dayflow-category-preview-select]').count() === 1, 'mobile Kick category select missing')
      assert(!requests.some((url) => endpoint(url, '/api/day-flow')), 'mobile Kick Day Flow crossed into Twitch API')
      const pageGeometry = await geometry(page)
      assert(!pageGeometry.overflow, `hidden Kick mobile horizontal overflow ${pageGeometry.scrollWidth}/${pageGeometry.width}`)
      record.checks = { rangeMode: json.rangeMode, selectedDate: json.selectedDate, box, pageGeometry, coverageCounts: json.categoryFilter?.coverageCounts ?? null }
      await page.screenshot({ path: path.join(screenshots, 'kick-hidden-fixed-day-mobile.png'), fullPage: true })
    },
  })

  await scenario(browser, {
    name: 'kick-hidden-unknown-category',
    viewport: { width: 1024, height: 800 },
    run: async ({ page, record, requests }) => {
      const unknown = '__viewloom_unknown_kick_category__'
      const api = page.waitForResponse((response) => endpoint(response.url(), '/api/kick-day-flow') && new URL(response.url()).searchParams.get('category') === unknown)
      const nav = await page.goto(`${ORIGIN}/kick/day-flow/?categoryPreview=1&category=${encodeURIComponent(unknown)}&rangeMode=date&date=${VALIDATION_DATE}&auto=off`, { waitUntil: 'domcontentloaded', timeout: 45000 })
      assert(nav?.ok(), `unknown-category Kick Day Flow HTTP ${nav?.status()}`)
      const json = await responseJson(await api)
      const root = page.locator('#dayflow-category-preview-controls')
      await root.waitFor({ state: 'visible', timeout: 30000 })
      assert(json.rangeMode === 'date' && json.selectedDate === VALIDATION_DATE, `unknown fixed-day identity mismatch ${json.rangeMode}/${json.selectedDate}`)
      assert(json.categoryFilter?.state === 'unknown_category', `unknown Kick category state=${json.categoryFilter?.state}`)
      assert(json.categoryFilter?.selectedCategory === unknown, 'unknown Kick category selected ID mismatch')
      const bands = Array.isArray(json.bands) ? json.bands : []
      const selectedBands = bands.filter((band) => !band?.isOthers)
      const globalOthers = bands.filter((band) => band?.isOthers)
      assert(selectedBands.length === 0, `unknown Kick category inferred ${selectedBands.length} selected streamer bands`)
      assert(globalOthers.length === 1, `unknown Kick category global Others count=${globalOthers.length}`)
      assert(json.state !== 'empty' && json.status !== 'empty', `unknown Kick category collapsed observed window to ${json.state}/${json.status}`)
      assert(Array.isArray(json.totalViewersByBucket) && json.totalViewersByBucket.some((value) => Number(value) > 0), 'unknown Kick category lost global viewer context')
      await page.waitForSelector('.dayflow-stage svg[data-dayflow-chart]', { timeout: 30000 })
      const bodyText = await page.locator('body').innerText()
      assert(!bodyText.includes('No observed Day Flow snapshots for this window.'), 'unknown Kick category still renders false no-observed-snapshots copy')
      const statusText = await root.locator('.dayflow-category-preview__status').innerText()
      assert(/Unknown Kick category/i.test(statusText), `unknown Kick category status copy=${statusText}`)
      assert(!requests.some((url) => endpoint(url, '/api/day-flow')), 'unknown Kick category crossed into Twitch API')
      const pageGeometry = await geometry(page)
      assert(!pageGeometry.overflow, `unknown Kick category overflow ${pageGeometry.scrollWidth}/${pageGeometry.width}`)
      record.checks = { rangeMode: json.rangeMode, selectedDate: json.selectedDate, state: json.categoryFilter?.state, overallState: json.state, overallStatus: json.status, selectedBandCount: selectedBands.length, globalOthersCount: globalOthers.length, chartRendered: true, falseNoObservedCopyAbsent: true, globalContextPresent: true, statusText, pageGeometry }
      await page.screenshot({ path: path.join(screenshots, 'kick-hidden-unknown-category.png'), fullPage: true })
    },
  })

  await scenario(browser, {
    name: 'twitch-public-day-flow-isolation',
    viewport: { width: 390, height: 844 },
    run: async ({ page, record, requests }) => {
      const api = page.waitForResponse((response) => endpoint(response.url(), '/api/day-flow') && new URL(response.url()).searchParams.get('category') === 'all')
      const nav = await page.goto(`${ORIGIN}/twitch/day-flow/?rangeMode=date&date=${VALIDATION_DATE}&auto=off`, { waitUntil: 'domcontentloaded', timeout: 45000 })
      assert(nav?.ok(), `Twitch public Day Flow HTTP ${nav?.status()}`)
      const response = await api
      assert(response.ok(), `Twitch public Day Flow API HTTP ${response.status()}`)
      const json = await responseJson(response)
      const root = page.locator('#dayflow-category-preview-controls')
      await root.waitFor({ state: 'visible', timeout: 30000 })
      assert(await root.locator('[data-dayflow-category-preview-select]').getAttribute('aria-label') === 'Twitch Day Flow category', 'Twitch public category label changed')
      assert(json.platform === 'twitch', `Twitch public Day Flow platform=${json.platform}`)
      assert(json.categoryFilter?.implementationState === 'public', `Twitch public implementationState=${json.categoryFilter?.implementationState}`)
      assert(json.categoryFilter?.publicExposureAuthorized === true, 'Twitch public Day Flow lost public authorization')
      assert(json.categoryFilter?.fullShareDenominator === 'all_observed_twitch_viewers_per_bucket', `Twitch fullShareDenominator=${json.categoryFilter?.fullShareDenominator}`)
      assert(!requests.some((url) => endpoint(url, '/api/kick-day-flow')), 'Twitch public Day Flow crossed into Kick API')
      const pageGeometry = await geometry(page)
      assert(!pageGeometry.overflow, `Twitch public mobile horizontal overflow ${pageGeometry.scrollWidth}/${pageGeometry.width}`)
      record.checks = { implementationState: json.categoryFilter?.implementationState, publicExposureAuthorized: json.categoryFilter?.publicExposureAuthorized, pageGeometry }
      await page.screenshot({ path: path.join(screenshots, 'twitch-public-day-flow-isolation-mobile.png'), fullPage: true })
    },
  })
} catch (error) {
  evidence.failures.push(`revalidation setup: ${error instanceof Error ? error.message : String(error)}`)
} finally {
  if (browser) await browser.close()
  evidence.observedAt = new Date().toISOString()
  evidence.status = evidence.failures.length === 0 ? 'pass' : 'fail'
  fs.writeFileSync(path.join(OUT, 'evidence.json'), `${JSON.stringify(evidence, null, 2)}\n`)
  console.log(JSON.stringify({
    status: evidence.status,
    expectedProductSha: evidence.expectedProductSha,
    expectedDeploymentSha: evidence.expectedDeploymentSha,
    deployWorkflowRun: evidence.deployWorkflowRun,
    deployment: evidence.deployment,
    failures: evidence.failures,
    scenarios: evidence.scenarios.map(({ name, status }) => ({ name, status })),
  }, null, 2))
  if (evidence.failures.length > 0) process.exitCode = 1
}
