import fs from 'node:fs'
import path from 'node:path'
import { chromium } from 'playwright'

const ORIGIN = process.env.VIEWLOOM_ORIGIN || 'https://www.viewloom.net'
const EXPECTED_SHA = process.env.EXPECTED_PRODUCTION_SHA || ''
const OUT = process.env.OUTPUT_DIR || 'artifacts/12a9-kick-day-flow-category-public-production-acceptance'
const VALIDATION_DATE = process.env.DAYFLOW_VALIDATION_DATE || '2026-08-10'
const screenshots = path.join(OUT, 'screenshots')
fs.mkdirSync(screenshots, { recursive: true })

const evidence = {
  schemaVersion: 'viewloom-12a9-kick-day-flow-category-public-production-evidence-v1',
  observedAt: new Date().toISOString(),
  origin: ORIGIN,
  expectedProductionSha: EXPECTED_SHA || null,
  validationDate: VALIDATION_DATE,
  deployment: null,
  status: 'running',
  scenarios: [],
  failures: [],
  publicKickDayFlowCategoryUiActive: false,
  twitchPublicBoundaryPreserved: false,
  productionMutationPerformed: false,
}

const assert = (condition, message) => { if (!condition) throw new Error(message) }
const endpoint = (url, pathname) => { try { return new URL(url).pathname === pathname } catch { return false } }
const responseJson = async (response) => {
  const data = await response.json()
  assert(data && typeof data === 'object', `invalid JSON from ${response.url()}`)
  return data
}
const geometry = (page) => page.evaluate(() => ({
  width: window.innerWidth,
  scrollWidth: document.documentElement.scrollWidth,
  overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
}))
const arraysEqual = (a, b) => Array.isArray(a) && Array.isArray(b)
  && a.length === b.length
  && a.every((v, i) => Number(v) === Number(b[i]))
const rectsOverlap = (a, b) => {
  if (!a || !b) return false
  const x = Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x))
  const y = Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y))
  return x > 1 && y > 1
}

function verifyDeployment() {
  assert(EXPECTED_SHA, 'EXPECTED_PRODUCTION_SHA is required')
  const file = path.join(OUT, 'last-deployment.json')
  assert(fs.existsSync(file), `missing deployment authority ${file}`)
  const deployment = JSON.parse(fs.readFileSync(file, 'utf8'))
  assert(deployment.commit_sha === EXPECTED_SHA, `deployment SHA ${deployment.commit_sha} != ${EXPECTED_SHA}`)
  assert(deployment.environment === 'production', `environment=${deployment.environment}`)
  assert(deployment.branch === 'main', `branch=${deployment.branch}`)
  evidence.deployment = deployment
}

async function scenario(browser, name, viewport, run) {
  const context = await browser.newContext({ viewport })
  const page = await context.newPage()
  const requests = []
  page.on('request', (request) => {
    const url = request.url()
    if (url.includes('/api/day-flow') || url.includes('/api/kick-day-flow')) requests.push(url)
  })
  const record = { name, viewport, requests, checks: {} }
  evidence.scenarios.push(record)
  try {
    await run({ page, record, requests })
    record.status = 'pass'
  } catch (error) {
    record.status = 'fail'
    record.error = error instanceof Error ? error.message : String(error)
    evidence.failures.push(`${name}: ${record.error}`)
  } finally {
    await context.close()
  }
}

let browser = null
try {
  verifyDeployment()
  browser = await chromium.launch({ headless: true })

  await scenario(browser, 'kick-public-fixed-day-desktop', { width: 1440, height: 1000 }, async ({ page, record, requests }) => {
    const initialApi = page.waitForResponse((r) => endpoint(r.url(), '/api/kick-day-flow') && new URL(r.url()).searchParams.get('category') === 'all')
    const nav = await page.goto(`${ORIGIN}/kick/day-flow/?rangeMode=date&date=${VALIDATION_DATE}&auto=off`, { waitUntil: 'domcontentloaded', timeout: 45000 })
    assert(nav?.ok(), `Kick Day Flow HTTP ${nav?.status()}`)
    const initial = await responseJson(await initialApi)
    const root = page.locator('#dayflow-category-preview-controls')
    await root.waitFor({ state: 'visible', timeout: 30000 })
    await page.waitForSelector('.dayflow-stage svg', { timeout: 30000 })
    const select = root.locator('[data-dayflow-category-preview-select]')
    assert(await select.getAttribute('aria-label') === 'Kick Day Flow category', 'Kick category accessible label mismatch')
    assert(initial.ok === true && initial.platform === 'kick', 'public payload is not Kick')
    assert(initial.rangeMode === 'date' && initial.selectedDate === VALIDATION_DATE, 'fixed-day identity mismatch')
    assert(initial.categoryFilter?.implementationState === 'public', `implementationState=${initial.categoryFilter?.implementationState}`)
    assert(initial.categoryFilter?.publicExposureAuthorized === true, 'publicExposureAuthorized is false')
    assert(initial.categoryFilter?.selectedCategory === 'all', `selectedCategory=${initial.categoryFilter?.selectedCategory}`)
    assert(initial.categoryFilter?.filterBeforeTopN === true, 'filter-before-Top-N false')
    assert(initial.categoryFilter?.membershipEvaluation === 'per_observed_snapshot', 'membership evaluation mismatch')
    assert(initial.categoryFilter?.latestCategoryBackProjectionAllowed === false, 'latest-category backprojection allowed')
    assert(initial.categoryFilter?.fullShareDenominator === 'all_observed_kick_viewers_per_bucket', 'Full Share denominator mismatch')
    assert(initial.categoryFilter?.topFocusShareDenominator === 'displayed_selected_category_top_n_viewers_per_bucket', 'Top Focus denominator mismatch')

    const direct = await fetch(`${ORIGIN}/api/kick-day-flow?rangeMode=date&date=${VALIDATION_DATE}&bucket=5&top=20&metric=volume`)
    assert(direct.ok, `direct no-category fallback HTTP ${direct.status}`)
    const unfiltered = await direct.json()
    assert(unfiltered.categoryFilter == null, 'no-category fallback returned category metadata')
    assert(arraysEqual(unfiltered.totalViewersByBucket, initial.totalViewersByBucket), 'category=all changed global totals')
    assert(Array.isArray(unfiltered.bands) && Array.isArray(initial.bands) && unfiltered.bands.length === initial.bands.length, 'category=all changed unfiltered band count')

    const categories = initial.categoryFilter?.availableCategories ?? initial.availableCategories ?? []
    assert(Array.isArray(categories) && categories.length > 0, 'no public Kick category options')
    const option = categories.find((x) => x?.id && Number(x?.viewerMinutes ?? 0) > 0) ?? categories.find((x) => x?.id)
    assert(option?.id, 'no selectable Kick category')
    const initialUrl = new URL(page.url())
    assert(initialUrl.searchParams.get('category') === 'all', 'normal public URL missing category=all')
    assert(!initialUrl.searchParams.has('categoryPreview'), 'normal public URL contains categoryPreview')

    const selectedApi = page.waitForResponse((r) => endpoint(r.url(), '/api/kick-day-flow') && new URL(r.url()).searchParams.get('category') === String(option.id))
    await select.selectOption(String(option.id))
    const selected = await responseJson(await selectedApi)
    assert(selected.categoryFilter?.state === 'selected', `selected state=${selected.categoryFilter?.state}`)
    assert(selected.categoryFilter?.implementationState === 'public' && selected.categoryFilter?.publicExposureAuthorized === true, 'selected category lost public metadata')
    assert(arraysEqual(initial.totalViewersByBucket, selected.totalViewersByBucket), 'selection changed global totals')
    assert((selected.bands ?? []).some((b) => !b?.isOthers), 'selected streamers absent')
    assert((selected.bands ?? []).some((b) => b?.isOthers), 'Full Others absent')
    const selectedUrl = new URL(page.url())
    assert(selectedUrl.searchParams.get('category') === String(option.id), 'selected category URL lost')
    assert(!selectedUrl.searchParams.has('categoryPreview'), 'public interaction retained categoryPreview')

    const rootBox = await root.boundingBox()
    const siblings = await page.locator('.dayflow-toolbar > *:not(#dayflow-category-preview-controls)').evaluateAll((nodes) => nodes.map((node) => {
      const r = node.getBoundingClientRect()
      return { x: r.x, y: r.y, width: r.width, height: r.height }
    }).filter((r) => r.width > 0 && r.height > 0))
    const overlaps = siblings.filter((box) => rectsOverlap(rootBox, box))
    assert(overlaps.length === 0, `desktop category control overlap ${JSON.stringify(overlaps)}`)
    assert(!requests.some((u) => endpoint(u, '/api/day-flow')), 'Kick crossed into Twitch API')
    const pageGeometry = await geometry(page)
    assert(!pageGeometry.overflow, `desktop overflow ${pageGeometry.scrollWidth}/${pageGeometry.width}`)
    record.checks = {
      categoryOptions: categories.length,
      selectedCategory: option.id,
      selectedBandCount: selected.bands.length,
      globalTotalsPreserved: true,
      toolbarOverlapCount: overlaps.length,
      pageGeometry,
      topDefault: 20,
      bucketDefault: 5,
    }
    await page.screenshot({ path: path.join(screenshots, 'kick-public-fixed-day-desktop.png'), fullPage: true })
  })

  await scenario(browser, 'kick-public-fixed-day-mobile', { width: 390, height: 844 }, async ({ page, record, requests }) => {
    const api = page.waitForResponse((r) => endpoint(r.url(), '/api/kick-day-flow') && new URL(r.url()).searchParams.get('category') === 'all')
    const nav = await page.goto(`${ORIGIN}/kick/day-flow/?rangeMode=date&date=${VALIDATION_DATE}&auto=off`, { waitUntil: 'domcontentloaded', timeout: 45000 })
    assert(nav?.ok(), `mobile Kick HTTP ${nav?.status()}`)
    const json = await responseJson(await api)
    const root = page.locator('#dayflow-category-preview-controls')
    await root.waitFor({ state: 'visible', timeout: 30000 })
    assert(json.categoryFilter?.implementationState === 'public' && json.categoryFilter?.publicExposureAuthorized === true, 'mobile public metadata mismatch')
    const box = await root.boundingBox()
    assert(box && box.width > 0 && box.height > 0, 'mobile Category control has no box')
    assert(box.x >= -1 && box.x + box.width <= 391, `mobile Category control outside viewport ${JSON.stringify(box)}`)
    assert(!requests.some((u) => endpoint(u, '/api/day-flow')), 'mobile Kick crossed into Twitch API')
    const pageGeometry = await geometry(page)
    assert(!pageGeometry.overflow, `mobile overflow ${pageGeometry.scrollWidth}/${pageGeometry.width}`)
    record.checks = { box, pageGeometry }
    await page.screenshot({ path: path.join(screenshots, 'kick-public-fixed-day-mobile.png'), fullPage: true })
  })

  await scenario(browser, 'kick-public-legacy-preview-compatibility', { width: 1024, height: 800 }, async ({ page, record }) => {
    const api = page.waitForResponse((r) => endpoint(r.url(), '/api/kick-day-flow') && new URL(r.url()).searchParams.get('category') === 'all')
    const nav = await page.goto(`${ORIGIN}/kick/day-flow/?categoryPreview=1&category=all&rangeMode=date&date=${VALIDATION_DATE}&auto=off`, { waitUntil: 'domcontentloaded', timeout: 45000 })
    assert(nav?.ok(), `legacy Kick HTTP ${nav?.status()}`)
    const initial = await responseJson(await api)
    assert(initial.categoryFilter?.implementationState === 'public', 'legacy link did not resolve to public state')
    assert(new URL(page.url()).searchParams.get('categoryPreview') === '1', 'legacy preview parameter not accepted at load')
    const root = page.locator('#dayflow-category-preview-controls')
    await root.waitFor({ state: 'visible', timeout: 30000 })
    const categories = initial.categoryFilter?.availableCategories ?? []
    const option = categories.find((x) => x?.id && Number(x?.viewerMinutes ?? 0) > 0) ?? categories.find((x) => x?.id)
    assert(option?.id, 'legacy link has no selectable category')
    const selectedApi = page.waitForResponse((r) => endpoint(r.url(), '/api/kick-day-flow') && new URL(r.url()).searchParams.get('category') === String(option.id))
    await root.locator('[data-dayflow-category-preview-select]').selectOption(String(option.id))
    await responseJson(await selectedApi)
    const selectedUrl = new URL(page.url())
    assert(!selectedUrl.searchParams.has('categoryPreview'), 'legacy preview parameter not removed after public interaction')
    assert(selectedUrl.searchParams.get('category') === String(option.id), 'category URL state lost')
    assert(selectedUrl.searchParams.get('rangeMode') === 'date' && selectedUrl.searchParams.get('date') === VALIDATION_DATE, 'range/date URL state lost')
    record.checks = { legacyParameterRemoved: true, selectedCategory: option.id }
  })

  await scenario(browser, 'kick-public-unknown-category', { width: 1024, height: 800 }, async ({ page, record, requests }) => {
    const unknown = '__viewloom_unknown_category__'
    const api = page.waitForResponse((r) => endpoint(r.url(), '/api/kick-day-flow') && new URL(r.url()).searchParams.get('category') === unknown)
    const nav = await page.goto(`${ORIGIN}/kick/day-flow/?category=${encodeURIComponent(unknown)}&rangeMode=date&date=${VALIDATION_DATE}&auto=off`, { waitUntil: 'domcontentloaded', timeout: 45000 })
    assert(nav?.ok(), `unknown Kick HTTP ${nav?.status()}`)
    const json = await responseJson(await api)
    const root = page.locator('#dayflow-category-preview-controls')
    await root.waitFor({ state: 'visible', timeout: 30000 })
    assert(json.categoryFilter?.implementationState === 'public' && json.categoryFilter?.publicExposureAuthorized === true, 'unknown category public metadata mismatch')
    assert(json.categoryFilter?.state === 'unknown_category', `unknown state=${json.categoryFilter?.state}`)
    const selectedBands = (json.bands ?? []).filter((b) => !b?.isOthers)
    const globalOthers = (json.bands ?? []).filter((b) => b?.isOthers)
    assert(selectedBands.length === 0, `unknown selected bands=${selectedBands.length}`)
    assert(globalOthers.length === 1, `unknown global Others=${globalOthers.length}`)
    assert(json.state !== 'empty' && json.status !== 'empty', `false empty ${json.state}/${json.status}`)
    assert((json.totalViewersByBucket ?? []).some((v) => Number(v) > 0), 'unknown category lost global observed totals')
    await page.waitForSelector('.dayflow-stage svg[data-dayflow-chart]', { timeout: 30000 })
    const body = await page.locator('body').innerText()
    assert(!body.includes('No observed Day Flow snapshots for this window.'), 'false no-observed copy present')
    const statusText = await root.locator('.dayflow-category-preview__status').innerText()
    assert(/Unknown Kick category/i.test(statusText), `unknown status copy=${statusText}`)
    assert(!requests.some((u) => endpoint(u, '/api/day-flow')), 'unknown Kick crossed into Twitch API')
    record.checks = {
      state: json.categoryFilter.state,
      overallState: json.state,
      selectedBandCount: 0,
      globalOthersCount: 1,
      chartRendered: true,
      falseNoObservedCopyAbsent: true,
      statusText,
    }
    await page.screenshot({ path: path.join(screenshots, 'kick-public-unknown-category.png'), fullPage: true })
  })

  await scenario(browser, 'twitch-public-isolation', { width: 1024, height: 800 }, async ({ page, record, requests }) => {
    const api = page.waitForResponse((r) => endpoint(r.url(), '/api/day-flow') && new URL(r.url()).searchParams.get('category') === 'all')
    const nav = await page.goto(`${ORIGIN}/twitch/day-flow/?rangeMode=date&date=${VALIDATION_DATE}&auto=off`, { waitUntil: 'domcontentloaded', timeout: 45000 })
    assert(nav?.ok(), `Twitch isolation HTTP ${nav?.status()}`)
    const json = await responseJson(await api)
    const root = page.locator('#dayflow-category-preview-controls')
    await root.waitFor({ state: 'visible', timeout: 30000 })
    assert(json.platform === 'twitch', 'Twitch isolation payload mismatch')
    assert(json.categoryFilter?.implementationState === 'public' && json.categoryFilter?.publicExposureAuthorized === true, 'Twitch public boundary changed')
    assert(!requests.some((u) => endpoint(u, '/api/kick-day-flow')), 'Twitch crossed into Kick API')
    record.checks = { publicControls: true, providerIsolation: true }
    await page.screenshot({ path: path.join(screenshots, 'twitch-public-isolation.png'), fullPage: true })
  })

  evidence.publicKickDayFlowCategoryUiActive = evidence.scenarios.slice(0, 4).every((s) => s.status === 'pass')
  evidence.twitchPublicBoundaryPreserved = evidence.scenarios.find((s) => s.name === 'twitch-public-isolation')?.status === 'pass'
  evidence.status = evidence.failures.length ? 'fail' : 'pass'
} catch (error) {
  evidence.failures.push(`fatal: ${error instanceof Error ? error.message : String(error)}`)
  evidence.status = 'fail'
} finally {
  if (browser) await browser.close()
  fs.writeFileSync(path.join(OUT, 'evidence.json'), `${JSON.stringify(evidence, null, 2)}\n`)
  console.log(JSON.stringify(evidence, null, 2))
  if (evidence.status !== 'pass') process.exitCode = 1
}
