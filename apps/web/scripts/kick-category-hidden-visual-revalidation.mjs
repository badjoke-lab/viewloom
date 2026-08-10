import fs from 'node:fs'
import path from 'node:path'
import { chromium } from 'playwright'

const ORIGIN = process.env.VIEWLOOM_ORIGIN || 'https://www.viewloom.net'
const EXPECTED_SHA = process.env.EXPECTED_SHA || ''
const OUT = process.env.OUTPUT_DIR || 'artifacts/12a8-kick-category-hidden-visual-revalidation'
const screenshots = path.join(OUT, 'screenshots')
fs.mkdirSync(screenshots, { recursive: true })

const evidence = {
  schemaVersion: 'viewloom-12a8-kick-category-hidden-visual-revalidation-evidence-v1',
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
const overlap = (a, b, tolerance = 1) => !(
  a.right <= b.left + tolerance
  || a.left >= b.right - tolerance
  || a.bottom <= b.top + tolerance
  || a.top >= b.bottom - tolerance
)
const inside = (inner, outer, tolerance = 1) => (
  inner.left >= outer.left - tolerance
  && inner.right <= outer.right + tolerance
  && inner.top >= outer.top - tolerance
  && inner.bottom <= outer.bottom + tolerance
)
const pageOverflow = (page) => page.evaluate(() => ({
  width: window.innerWidth,
  scrollWidth: document.documentElement.scrollWidth,
  overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
}))
const controlRects = (page) => page.evaluate(() => {
  const rect = (selector) => {
    const element = document.querySelector(selector)
    if (!(element instanceof HTMLElement)) return null
    const value = element.getBoundingClientRect()
    return {
      left: value.left,
      right: value.right,
      top: value.top,
      bottom: value.bottom,
      width: value.width,
      height: value.height,
    }
  }
  return {
    root: rect('#heatmap-category-preview-controls'),
    fields: rect('#heatmap-category-preview-controls .heatmap-category-preview__fields'),
    status: rect('#heatmap-category-preview-controls .heatmap-category-preview__status'),
    map: rect('.heatmap-control-dock__map'),
    viewport: window.innerWidth,
  }
})

async function verifyDeployment() {
  assert(EXPECTED_SHA, 'EXPECTED_SHA is required')
  const response = await fetch(`${ORIGIN}/deployment.json?visualRevalidation=${Date.now()}`, { cache: 'no-store' })
  assert(response.ok, `deployment HTTP ${response.status}`)
  const deployment = await response.json()
  assert(deployment?.commit_sha === EXPECTED_SHA, `production SHA ${deployment?.commit_sha || 'missing'} != ${EXPECTED_SHA}`)
  assert(deployment?.environment === 'production', `environment=${deployment?.environment}`)
  assert(deployment?.branch === 'main', `branch=${deployment?.branch}`)
  evidence.deployment = deployment
  fs.writeFileSync(path.join(OUT, 'deployment.json'), `${JSON.stringify(deployment, null, 2)}\n`)
}

async function scenario(browser, name, viewport, run) {
  const context = await browser.newContext({ viewport })
  const page = await context.newPage()
  const requests = []
  page.on('request', (request) => {
    if (request.url().includes('/api/twitch-heatmap') || request.url().includes('/api/kick-heatmap')) requests.push(request.url())
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

try {
  await verifyDeployment()
} catch (error) {
  evidence.failures.push(`deployment: ${error instanceof Error ? error.message : String(error)}`)
}

const browser = await chromium.launch({ headless: true })
try {
  await scenario(browser, 'kick-hidden-desktop-layout', { width: 1440, height: 1000 }, async ({ page, record, requests }) => {
    const initialApi = page.waitForResponse((r) => endpoint(r.url(), '/api/kick-heatmap') && new URL(r.url()).searchParams.get('category') === 'all')
    const nav = await page.goto(`${ORIGIN}/kick/heatmap/?categoryPreview=1`, { waitUntil: 'domcontentloaded', timeout: 45000 })
    assert(nav?.ok(), `page HTTP ${nav?.status()}`)
    const initial = await (await initialApi).json()
    const root = page.locator('#heatmap-category-preview-controls')
    await root.waitFor({ state: 'visible', timeout: 30000 })
    const category = root.locator('[data-category-preview-select]')
    const option = initial.availableCategories?.find((value) => value?.id && value.streamCount > 0)
    assert(option, 'no real category option')
    const selectedApi = page.waitForResponse((r) => endpoint(r.url(), '/api/kick-heatmap') && new URL(r.url()).searchParams.get('category') === String(option.id))
    await category.selectOption(String(option.id))
    await selectedApi
    await page.waitForFunction(() => document.querySelector('.heatmap-category-preview__status')?.textContent?.includes('selected'))

    const rects = await controlRects(page)
    for (const key of ['root', 'fields', 'status', 'map']) assert(rects[key], `${key} rectangle missing`)
    assert(inside(rects.fields, rects.root), `fields escape category root: ${JSON.stringify(rects)}`)
    assert(inside(rects.status, rects.root), `status escapes category root: ${JSON.stringify(rects)}`)
    assert(!overlap(rects.status, rects.fields), `status overlaps category fields: ${JSON.stringify(rects)}`)
    assert(!overlap(rects.status, rects.map), `status overlaps MAP group: ${JSON.stringify(rects)}`)
    assert(!overlap(rects.root, rects.map), `category root overlaps MAP group: ${JSON.stringify(rects)}`)
    const geometry = await pageOverflow(page)
    assert(!geometry.overflow, `desktop overflow ${geometry.scrollWidth}/${geometry.width}`)
    assert(!requests.some((url) => endpoint(url, '/api/twitch-heatmap')), 'Kick desktop crossed Twitch API')
    record.checks = { selectedCategory: String(option.id), rects, geometry }
    await page.screenshot({ path: path.join(screenshots, 'kick-hidden-desktop-layout.png'), fullPage: true })
  })

  await scenario(browser, 'kick-hidden-mobile-layout', { width: 390, height: 844 }, async ({ page, record, requests }) => {
    const api = page.waitForResponse((r) => endpoint(r.url(), '/api/kick-heatmap'))
    const nav = await page.goto(`${ORIGIN}/kick/heatmap/?categoryPreview=1`, { waitUntil: 'domcontentloaded', timeout: 45000 })
    assert(nav?.ok(), `mobile HTTP ${nav?.status()}`)
    await api
    await page.locator('#heatmap-category-preview-controls').waitFor({ state: 'visible', timeout: 30000 })
    const rects = await controlRects(page)
    for (const key of ['root', 'fields', 'status']) assert(rects[key], `mobile ${key} rectangle missing`)
    assert(inside(rects.fields, rects.root), `mobile fields escape root: ${JSON.stringify(rects)}`)
    assert(inside(rects.status, rects.root), `mobile status escapes root: ${JSON.stringify(rects)}`)
    assert(!overlap(rects.status, rects.fields), `mobile status overlaps fields: ${JSON.stringify(rects)}`)
    const geometry = await pageOverflow(page)
    assert(geometry.width === 390 && geometry.scrollWidth === 390 && !geometry.overflow, `mobile geometry ${JSON.stringify(geometry)}`)
    assert(!requests.some((url) => endpoint(url, '/api/twitch-heatmap')), 'Kick mobile crossed Twitch API')
    record.checks = { rects, geometry }
    await page.screenshot({ path: path.join(screenshots, 'kick-hidden-mobile-layout.png'), fullPage: true })
  })

  await scenario(browser, 'kick-normal-remains-hidden', { width: 1440, height: 1000 }, async ({ page, record, requests }) => {
    const nav = await page.goto(`${ORIGIN}/kick/heatmap/`, { waitUntil: 'domcontentloaded', timeout: 45000 })
    assert(nav?.ok(), `normal Kick HTTP ${nav?.status()}`)
    await page.waitForTimeout(2000)
    assert(await page.locator('#heatmap-category-preview-controls').count() === 0, 'normal Kick exposed hidden controls')
    assert(!requests.some((url) => endpoint(url, '/api/twitch-heatmap')), 'normal Kick crossed Twitch API')
    const kickRequests = requests.filter((url) => endpoint(url, '/api/kick-heatmap'))
    for (const requestUrl of kickRequests) {
      const url = new URL(requestUrl)
      assert(!url.searchParams.has('category'), `normal Kick sent category query: ${requestUrl}`)
      assert(!url.searchParams.has('top'), `normal Kick sent top query: ${requestUrl}`)
    }
    const geometry = await pageOverflow(page)
    assert(!geometry.overflow, `normal Kick desktop overflow ${geometry.scrollWidth}/${geometry.width}`)
    record.checks = {
      categoryControls: 0,
      kickRequestCount: kickRequests.length,
      categoryQueryCount: 0,
      geometry,
    }
  })

  await scenario(browser, 'twitch-public-controls-preserved', { width: 390, height: 844 }, async ({ page, record, requests }) => {
    const api = page.waitForResponse((r) => endpoint(r.url(), '/api/twitch-heatmap'))
    const nav = await page.goto(`${ORIGIN}/twitch/heatmap/`, { waitUntil: 'domcontentloaded', timeout: 45000 })
    assert(nav?.ok(), `Twitch HTTP ${nav?.status()}`)
    await api
    assert(await page.locator('#heatmap-category-preview-controls').count() === 1, 'Twitch public controls missing')
    assert(!requests.some((url) => endpoint(url, '/api/kick-heatmap')), 'Twitch crossed Kick API')
    const geometry = await pageOverflow(page)
    assert(!geometry.overflow, `Twitch mobile overflow ${geometry.scrollWidth}/${geometry.width}`)
    record.checks = { categoryControls: 1, geometry }
  })
} finally {
  await browser.close()
}

evidence.observedAt = new Date().toISOString()
evidence.status = evidence.failures.length === 0 ? 'pass' : 'fail'
fs.writeFileSync(path.join(OUT, 'evidence.json'), `${JSON.stringify(evidence, null, 2)}\n`)
console.log(JSON.stringify({ status: evidence.status, expectedSha: evidence.expectedSha, failures: evidence.failures, scenarios: evidence.scenarios.map(({ name, status }) => ({ name, status })) }, null, 2))
if (evidence.failures.length > 0) process.exitCode = 1
