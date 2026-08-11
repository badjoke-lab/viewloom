import fs from 'node:fs'
import path from 'node:path'
import { chromium } from 'playwright'

const ORIGIN = process.env.VIEWLOOM_ORIGIN || 'https://www.viewloom.net'
const PRODUCT_SHA = process.env.PRODUCT_AUTHORITY_SHA || ''
const DEPLOYMENT_SHA = process.env.EXPECTED_DEPLOYMENT_SHA || ''
const VALIDATION_DATE = process.env.BATTLE_VALIDATION_DATE || '2026-08-10'
const OUT = process.env.OUTPUT_DIR || 'artifacts/12a10-kick-battle-lines-category-hidden-production-revalidation'
const screenshots = path.join(OUT, 'screenshots')
fs.mkdirSync(screenshots, { recursive: true })

const evidence = {
  schemaVersion: 'viewloom-12a10-kick-battle-lines-category-hidden-production-evidence-v1',
  observedAt: new Date().toISOString(),
  origin: ORIGIN,
  productAuthoritySha: PRODUCT_SHA,
  expectedDeploymentSha: DEPLOYMENT_SHA,
  validationDate: VALIDATION_DATE,
  deployment: null,
  status: 'running',
  scenarios: [],
  failures: [],
  publicCutoverAuthorized: false,
  productionMutationPerformed: false,
}
const assert = (condition, message) => { if (!condition) throw new Error(message) }
const endpoint = (url, pathname) => { try { return new URL(url).pathname === pathname } catch { return false } }
const responseJson = async (response) => { const json = await response.json(); assert(json && typeof json === 'object', `invalid JSON ${response.url()}`); return json }
const geometry = (page) => page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth, overflow: document.documentElement.scrollWidth > innerWidth + 1 }))

function verifyDeployment() {
  assert(PRODUCT_SHA, 'PRODUCT_AUTHORITY_SHA required')
  assert(DEPLOYMENT_SHA, 'EXPECTED_DEPLOYMENT_SHA required')
  const file = path.join(OUT, 'last-deployment.json')
  assert(fs.existsSync(file), `missing deployment authority ${file}`)
  const deployment = JSON.parse(fs.readFileSync(file, 'utf8'))
  assert(deployment.commit_sha === DEPLOYMENT_SHA, `deployment ${deployment.commit_sha} != ${DEPLOYMENT_SHA}`)
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
    if (url.includes('/api/kick-battle-lines') || url.includes('/api/battle-lines')) requests.push(url)
  })
  const record = { name, viewport, requests, checks: {} }
  evidence.scenarios.push(record)
  try { await run({ page, record, requests }); record.status = 'pass' }
  catch (error) { record.status = 'fail'; record.error = error instanceof Error ? error.message : String(error); evidence.failures.push(`${name}: ${record.error}`) }
  finally { await context.close() }
}

let browser = null
try {
  verifyDeployment()
  browser = await chromium.launch({ headless: true })

  await scenario(browser, 'kick-normal-fixed-day-desktop', { width: 1440, height: 1000 }, async ({ page, record, requests }) => {
    const api = page.waitForResponse((r) => endpoint(r.url(), '/api/kick-battle-lines'))
    const nav = await page.goto(`${ORIGIN}/kick/battle-lines/?range=date&date=${VALIDATION_DATE}&metric=viewers&top=5&bucket=5m`, { waitUntil: 'domcontentloaded', timeout: 45000 })
    assert(nav?.ok(), `normal Kick HTTP ${nav?.status()}`)
    const json = await responseJson(await api)
    await page.waitForTimeout(300)
    assert(json.platform === 'kick', 'normal payload not Kick')
    assert(json.categoryFilter == null, 'normal route returned categoryFilter')
    const controlCount = await page.locator('[data-battle-category-preview]').count()
    assert(controlCount === 0, `normal route exposed ${controlCount} Category controls`)
    assert(requests.length >= 1, 'normal route made no Battle Lines request')
    assert(requests.every((u) => !new URL(u).searchParams.has('category')), 'normal route emitted category query')
    assert(!requests.some((u) => endpoint(u, '/api/battle-lines')), 'Kick normal crossed into Twitch API')
    assert(Array.isArray(json.lines), 'normal lines absent')
    const pageGeometry = await geometry(page)
    assert(!pageGeometry.overflow, `normal desktop overflow ${pageGeometry.scrollWidth}/${pageGeometry.width}`)
    record.checks = { lines: json.lines.length, battles: json.battles?.length ?? 0, categoryControlAbsent: true, pageGeometry }
    await page.screenshot({ path: path.join(screenshots, 'kick-normal-fixed-day-desktop.png'), fullPage: true })
  })

  let selectedCategory = null
  await scenario(browser, 'kick-hidden-fixed-day-desktop', { width: 1440, height: 1000 }, async ({ page, record, requests }) => {
    const initialApi = page.waitForResponse((r) => endpoint(r.url(), '/api/kick-battle-lines') && new URL(r.url()).searchParams.get('category') === 'all')
    const nav = await page.goto(`${ORIGIN}/kick/battle-lines/?categoryPreview=1&category=all&range=date&date=${VALIDATION_DATE}&metric=viewers&top=5&bucket=5m`, { waitUntil: 'domcontentloaded', timeout: 45000 })
    assert(nav?.ok(), `hidden Kick HTTP ${nav?.status()}`)
    const initial = await responseJson(await initialApi)
    const root = page.locator('[data-battle-category-preview]')
    await root.waitFor({ state: 'visible', timeout: 30000 })
    assert(await root.getAttribute('data-battle-category-preview') === 'hidden', 'Category control not marked hidden')
    assert(initial.categoryFilter?.implementationState === 'hidden_candidate', `state=${initial.categoryFilter?.implementationState}`)
    assert(initial.categoryFilter?.publicExposureAuthorized === false, 'hidden exposure flag true')
    assert(initial.categoryFilter?.selectedCategory === 'all', 'hidden default category not all')
    assert(initial.categoryFilter?.filterBeforeCandidateCompaction === true, 'filter-before-compaction false')
    assert(initial.categoryFilter?.filterBeforeTopN === true, 'filter-before-Top false')
    assert(initial.categoryFilter?.filterBeforeRecommendedBattleScoring === true, 'filter-before-scoring false')
    assert(initial.top === 5, `Top default changed: ${initial.top}`)
    assert(initial.metric === 'viewers', `metric changed: ${initial.metric}`)
    assert(initial.bucket === '5m', `bucket changed: ${initial.bucket}`)
    const categories = initial.categoryFilter?.availableCategories ?? initial.availableCategories ?? []
    assert(categories.length > 0, 'no real Kick category options')
    const option = categories.find((x) => x?.id && Number(x?.streamCount ?? 0) >= 2 && Number(x?.viewerMinutes ?? 0) > 0) ?? categories.find((x) => x?.id && Number(x?.viewerMinutes ?? 0) > 0)
    assert(option?.id, 'no selectable real Kick category')
    selectedCategory = String(option.id)
    const selectedApi = page.waitForResponse((r) => endpoint(r.url(), '/api/kick-battle-lines') && new URL(r.url()).searchParams.get('category') === selectedCategory)
    await root.locator('[data-battle-category-preview-select]').selectOption(selectedCategory)
    const selected = await responseJson(await selectedApi)
    assert(selected.categoryFilter?.state === 'selected', `selected state=${selected.categoryFilter?.state}`)
    assert(selected.categoryFilter?.implementationState === 'hidden_candidate' && selected.categoryFilter?.publicExposureAuthorized === false, 'selected hidden metadata changed')
    assert(selected.categoryFilter?.candidateRankingMetric === 'category_qualified_viewer_minutes', 'candidate rank metric mismatch')
    assert(Array.isArray(selected.lines) && selected.lines.length > 0, 'selected category has no lines')
    if (Number(option.streamCount ?? 0) >= 2) assert(selected.lines.length >= 2, `category streamCount>=2 but lines=${selected.lines.length}`)
    if (selected.lines.length >= 2) assert((selected.battles?.length ?? 0) >= 1, 'selected category has >=2 lines but no battle model')
    const u = new URL(page.url())
    assert(u.searchParams.get('categoryPreview') === '1' && u.searchParams.get('category') === selectedCategory, 'hidden URL state lost')
    assert(!requests.some((url) => endpoint(url, '/api/battle-lines')), 'Kick hidden crossed into Twitch API')
    const rootBox = await root.boundingBox()
    const siblings = await page.locator('.battle-controls > *:not([data-battle-category-preview])').evaluateAll((nodes) => nodes.map((node) => { const r = node.getBoundingClientRect(); return { x:r.x,y:r.y,width:r.width,height:r.height } }).filter((r) => r.width > 0 && r.height > 0))
    const overlaps = siblings.filter((b) => rootBox && Math.max(0, Math.min(rootBox.x + rootBox.width, b.x + b.width) - Math.max(rootBox.x, b.x)) > 1 && Math.max(0, Math.min(rootBox.y + rootBox.height, b.y + b.height) - Math.max(rootBox.y, b.y)) > 1)
    assert(overlaps.length === 0, `hidden control overlaps ${JSON.stringify(overlaps)}`)
    const pageGeometry = await geometry(page)
    assert(!pageGeometry.overflow, `hidden desktop overflow ${pageGeometry.scrollWidth}/${pageGeometry.width}`)
    record.checks = { categoryOptions: categories.length, selectedCategory, selectedStreamCount: option.streamCount ?? null, selectedLines: selected.lines.length, selectedBattles: selected.battles?.length ?? 0, coverageCounts: selected.categoryFilter?.coverageCounts, pageGeometry, overlapCount: overlaps.length }
    await page.screenshot({ path: path.join(screenshots, 'kick-hidden-fixed-day-desktop.png'), fullPage: true })
  })

  await scenario(browser, 'kick-hidden-fixed-day-mobile', { width: 390, height: 844 }, async ({ page, record, requests }) => {
    const api = page.waitForResponse((r) => endpoint(r.url(), '/api/kick-battle-lines') && new URL(r.url()).searchParams.get('category') === 'all')
    const nav = await page.goto(`${ORIGIN}/kick/battle-lines/?categoryPreview=1&category=all&range=date&date=${VALIDATION_DATE}&metric=viewers&top=5&bucket=5m`, { waitUntil: 'domcontentloaded', timeout: 45000 })
    assert(nav?.ok(), `mobile hidden HTTP ${nav?.status()}`)
    await responseJson(await api)
    const root = page.locator('[data-battle-category-preview]')
    await root.waitFor({ state: 'visible', timeout: 30000 })
    const selectBox = await root.locator('[data-battle-category-preview-select]').boundingBox()
    assert(selectBox && selectBox.height >= 44, `mobile select target ${selectBox?.height}`)
    const pageGeometry = await geometry(page)
    assert(pageGeometry.width === 390 && pageGeometry.scrollWidth === 390 && !pageGeometry.overflow, `mobile geometry ${JSON.stringify(pageGeometry)}`)
    assert(!requests.some((u) => endpoint(u, '/api/battle-lines')), 'mobile Kick crossed into Twitch API')
    record.checks = { selectBox, pageGeometry }
    await page.screenshot({ path: path.join(screenshots, 'kick-hidden-fixed-day-mobile.png'), fullPage: true })
  })

  await scenario(browser, 'kick-hidden-unknown-category', { width: 1024, height: 800 }, async ({ page, record, requests }) => {
    const unknown = '__viewloom_unknown_category__'
    const api = page.waitForResponse((r) => endpoint(r.url(), '/api/kick-battle-lines') && new URL(r.url()).searchParams.get('category') === unknown)
    const nav = await page.goto(`${ORIGIN}/kick/battle-lines/?categoryPreview=1&category=${encodeURIComponent(unknown)}&range=date&date=${VALIDATION_DATE}&metric=viewers&top=5&bucket=5m`, { waitUntil: 'domcontentloaded', timeout: 45000 })
    assert(nav?.ok(), `unknown hidden HTTP ${nav?.status()}`)
    const json = await responseJson(await api)
    const root = page.locator('[data-battle-category-preview]')
    await root.waitFor({ state: 'visible', timeout: 30000 })
    assert(json.categoryFilter?.state === 'unknown_category', `unknown state=${json.categoryFilter?.state}`)
    assert((json.lines?.length ?? -1) === 0, `unknown lines=${json.lines?.length}`)
    assert((json.battles?.length ?? -1) === 0, `unknown battles=${json.battles?.length}`)
    assert(json.categoryFilter?.unknownCategoryMaySubstituteGlobalLines === false, 'unknown category allows global substitution')
    assert((json.coverage?.observedBuckets ?? 0) > 0, 'unknown category lost observed timeline coverage')
    const status = await root.locator('[data-battle-category-preview-status]').innerText()
    assert(/Unknown Kick category/i.test(status), `unknown UI status=${status}`)
    assert(!requests.some((u) => endpoint(u, '/api/battle-lines')), 'unknown Kick crossed into Twitch API')
    record.checks = { state: json.categoryFilter.state, lines: json.lines.length, battles: json.battles.length, observedBuckets: json.coverage?.observedBuckets, coverageCounts: json.categoryFilter?.coverageCounts, statusText: status }
    await page.screenshot({ path: path.join(screenshots, 'kick-hidden-unknown-category.png'), fullPage: true })
  })

  await scenario(browser, 'kick-hidden-point-state-contract', { width: 1024, height: 800 }, async ({ page, record }) => {
    assert(selectedCategory, 'selected category from desktop scenario unavailable')
    const api = page.waitForResponse((r) => endpoint(r.url(), '/api/kick-battle-lines') && new URL(r.url()).searchParams.get('category') === selectedCategory)
    const nav = await page.goto(`${ORIGIN}/kick/battle-lines/?categoryPreview=1&category=${encodeURIComponent(selectedCategory)}&range=date&date=${VALIDATION_DATE}&metric=viewers&top=5&bucket=5m`, { waitUntil: 'domcontentloaded', timeout: 45000 })
    assert(nav?.ok(), `point-state contract HTTP ${nav?.status()}`)
    const json = await responseJson(await api)
    const states = json.categoryFilter?.selectedCategoryPointStates ?? []
    for (const state of ['observed','outside_category','category_unavailable','offline','not_observed','missing']) assert(states.includes(state), `point-state contract missing ${state}`)
    assert(json.categoryFilter?.outsideCategoryNeverZeroFilled === true, 'outside_category zero fill allowed')
    assert(json.categoryFilter?.categoryUnavailableNeverZeroFilled === true, 'category_unavailable zero fill allowed')
    assert(json.categoryFilter?.outsideCategoryExcludedFromMissingPenalty === true, 'outside_category missing penalty allowed')
    assert(json.categoryFilter?.categoryUnavailableExcludedFromMissingPenalty === true, 'category_unavailable missing penalty allowed')
    const actualStateCounts = {}
    for (const line of json.lines ?? []) for (const point of line.points ?? []) actualStateCounts[point.state] = (actualStateCounts[point.state] ?? 0) + 1
    record.checks = { selectedCategory, contractStates: states, actualStateCounts, repositoryFixtureAuthority: 'apps/web/scripts/verify-kick-battle-lines-category-candidate.mjs' }
  })

  await scenario(browser, 'twitch-battle-lines-isolation', { width: 1024, height: 800 }, async ({ page, record, requests }) => {
    const api = page.waitForResponse((r) => endpoint(r.url(), '/api/battle-lines'))
    const nav = await page.goto(`${ORIGIN}/twitch/battle-lines/?range=date&date=${VALIDATION_DATE}&metric=viewers&top=5&bucket=5m`, { waitUntil: 'domcontentloaded', timeout: 45000 })
    assert(nav?.ok(), `Twitch Battle Lines HTTP ${nav?.status()}`)
    const json = await responseJson(await api)
    await page.waitForTimeout(250)
    assert(json.platform === 'twitch', 'Twitch payload mismatch')
    assert(json.categoryFilter == null, 'Twitch unexpectedly returned categoryFilter')
    assert(await page.locator('[data-battle-category-preview]').count() === 0, 'Twitch exposed Kick Category control')
    assert(!requests.some((u) => endpoint(u, '/api/kick-battle-lines')), 'Twitch crossed into Kick API')
    record.checks = { lines: json.lines?.length ?? 0, battles: json.battles?.length ?? 0, categoryControlAbsent: true, providerIsolation: true }
    await page.screenshot({ path: path.join(screenshots, 'twitch-battle-lines-isolation.png'), fullPage: true })
  })

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
