import fs from 'node:fs'
import path from 'node:path'
import { chromium } from 'playwright'

const ORIGIN = process.env.VIEWLOOM_ORIGIN || 'https://www.viewloom.net'
const EXPECTED_SHA = process.env.EXPECTED_SHA || ''
const OUT = process.env.OUTPUT_DIR || 'artifacts/12a8-kick-category-public-production-acceptance'
const screenshots = path.join(OUT, 'screenshots')
fs.mkdirSync(screenshots, { recursive: true })

const evidence = {
  schemaVersion: 'viewloom-12a8-kick-heatmap-category-public-production-evidence-v1',
  observedAt: new Date().toISOString(),
  origin: ORIGIN,
  expectedSha: EXPECTED_SHA,
  deployment: null,
  status: 'running',
  scenarios: [],
  failures: [],
  publicKickCategoryUiActive: false,
  twitchPublicCategoryUiPreserved: false,
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

function verifyDeploymentSource() {
  assert(EXPECTED_SHA, 'EXPECTED_SHA is required')
  const sourcePath = path.join(OUT, 'last-deployment.json')
  assert(fs.existsSync(sourcePath), `authoritative deployment file missing: ${sourcePath}`)
  const deployment = JSON.parse(fs.readFileSync(sourcePath, 'utf8'))
  assert(deployment?.commit_sha === EXPECTED_SHA, `production SHA ${deployment?.commit_sha || 'missing'} != ${EXPECTED_SHA}`)
  assert(deployment?.environment === 'production', `environment=${deployment?.environment}`)
  assert(deployment?.branch === 'main', `branch=${deployment?.branch}`)
  evidence.deployment = deployment
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
  verifyDeploymentSource()
} catch (error) {
  evidence.failures.push(`deployment: ${error instanceof Error ? error.message : String(error)}`)
}

const browser = await chromium.launch({ headless: true })
try {
  await scenario(browser, 'kick-public-desktop', { width: 1440, height: 1000 }, async ({ page, record, requests }) => {
    const initialApi = page.waitForResponse((response) => {
      if (!endpoint(response.url(), '/api/kick-heatmap')) return false
      const url = new URL(response.url())
      return url.searchParams.get('category') === 'all' && url.searchParams.get('top') === '50'
    })
    const nav = await page.goto(`${ORIGIN}/kick/heatmap/`, { waitUntil: 'domcontentloaded', timeout: 45000 })
    assert(nav?.ok(), `page HTTP ${nav?.status()}`)
    const initial = await (await initialApi).json()
    assert(initial.categoryFilter?.implementationState === 'public', `implementationState=${initial.categoryFilter?.implementationState}`)
    assert(initial.categoryFilter?.publicExposureAuthorized === true, 'Kick API public exposure flag is not true')
    assert(initial.categoryFilter?.filterBeforeTopN === true, 'filterBeforeTopN=false')

    const root = page.locator('#heatmap-category-preview-controls')
    await root.waitFor({ state: 'visible', timeout: 30000 })
    assert(await root.getAttribute('data-category-filter') === 'public', 'Kick category control is not marked public')
    const category = root.locator('[data-category-preview-select]')
    const top = root.locator('[data-category-preview-top]')
    assert(await top.inputValue() === '50', `default Top=${await top.inputValue()}`)
    assert(await category.inputValue() === 'all', `default category=${await category.inputValue()}`)

    const option = initial.availableCategories?.find((value) => value?.id && value.streamCount > 0)
    assert(option, 'no real Kick category option')
    const selectedApi = page.waitForResponse((response) => {
      if (!endpoint(response.url(), '/api/kick-heatmap')) return false
      const url = new URL(response.url())
      return url.searchParams.get('category') === String(option.id) && url.searchParams.get('top') === '50'
    })
    await category.selectOption(String(option.id))
    const selected = await (await selectedApi).json()
    await page.waitForFunction(() => document.querySelector('.heatmap-category-preview__status')?.textContent?.includes('selected'))
    assert(selected.categoryFilter?.state === 'selected', `selected state=${selected.categoryFilter?.state}`)
    assert(selected.categoryFilter?.selectedCategory === String(option.id), `selected category=${selected.categoryFilter?.selectedCategory}`)
    assert(selected.categoryFilter?.filterBeforeTopN === true, 'selected filterBeforeTopN=false')
    assert(selected.items?.every((value) => value.categoryId === String(option.id)), 'selected response contains another category')
    const unavailableMomentum = (selected.items ?? []).filter((value) => value.momentumAvailable === false)
    for (const value of unavailableMomentum) {
      assert(value.momentum === 0, `unavailable momentum must carry neutral numeric sentinel for ${value.id}`)
      assert(Boolean(value.momentumUnavailableReason), `unavailable momentum reason missing for ${value.id}`)
    }

    const currentUrl = new URL(page.url())
    assert(currentUrl.searchParams.get('category') === String(option.id), `public category URL=${currentUrl.searchParams.get('category')}`)
    assert(currentUrl.searchParams.get('top') === null || currentUrl.searchParams.get('top') === '50', `public top URL=${currentUrl.searchParams.get('top')}`)
    assert(!currentUrl.searchParams.has('categoryPreview'), 'legacy categoryPreview remained after public interaction')

    const rects = await controlRects(page)
    for (const key of ['root', 'fields', 'status', 'map']) assert(rects[key], `${key} rectangle missing`)
    assert(inside(rects.fields, rects.root), `fields escape category root: ${JSON.stringify(rects)}`)
    assert(inside(rects.status, rects.root), `status escapes category root: ${JSON.stringify(rects)}`)
    assert(!overlap(rects.status, rects.fields), `status overlaps category fields: ${JSON.stringify(rects)}`)
    assert(!overlap(rects.status, rects.map), `status overlaps MAP group: ${JSON.stringify(rects)}`)
    assert(!overlap(rects.root, rects.map), `category root overlaps MAP group: ${JSON.stringify(rects)}`)
    const geometry = await pageOverflow(page)
    assert(geometry.width === 1440 && geometry.scrollWidth === 1440 && !geometry.overflow, `desktop geometry ${JSON.stringify(geometry)}`)
    assert(!requests.some((url) => endpoint(url, '/api/twitch-heatmap')), 'Kick desktop crossed Twitch API')
    record.checks = {
      selectedCategory: String(option.id),
      selectedItemCount: selected.items?.length ?? 0,
      unavailableMomentumCount: unavailableMomentum.length,
      rects,
      geometry,
    }
    evidence.publicKickCategoryUiActive = true
    await page.screenshot({ path: path.join(screenshots, 'kick-public-desktop.png'), fullPage: true })
  })

  await scenario(browser, 'kick-public-mobile', { width: 390, height: 844 }, async ({ page, record, requests }) => {
    const api = page.waitForResponse((response) => endpoint(response.url(), '/api/kick-heatmap'))
    const nav = await page.goto(`${ORIGIN}/kick/heatmap/`, { waitUntil: 'domcontentloaded', timeout: 45000 })
    assert(nav?.ok(), `mobile HTTP ${nav?.status()}`)
    const payload = await (await api).json()
    assert(payload.categoryFilter?.implementationState === 'public', 'mobile Kick API is not public')
    const root = page.locator('#heatmap-category-preview-controls')
    await root.waitFor({ state: 'visible', timeout: 30000 })
    assert(await root.getAttribute('data-category-filter') === 'public', 'mobile Kick control is not public')
    const rects = await controlRects(page)
    for (const key of ['root', 'fields', 'status']) assert(rects[key], `mobile ${key} rectangle missing`)
    assert(inside(rects.fields, rects.root), `mobile fields escape root: ${JSON.stringify(rects)}`)
    assert(inside(rects.status, rects.root), `mobile status escapes root: ${JSON.stringify(rects)}`)
    assert(!overlap(rects.status, rects.fields), `mobile status overlaps fields: ${JSON.stringify(rects)}`)
    const geometry = await pageOverflow(page)
    assert(geometry.width === 390 && geometry.scrollWidth === 390 && !geometry.overflow, `mobile geometry ${JSON.stringify(geometry)}`)
    assert(!requests.some((url) => endpoint(url, '/api/twitch-heatmap')), 'Kick mobile crossed Twitch API')
    record.checks = { rects, geometry }
    await page.screenshot({ path: path.join(screenshots, 'kick-public-mobile.png'), fullPage: true })
  })

  await scenario(browser, 'kick-legacy-preview-compatibility', { width: 1440, height: 1000 }, async ({ page, record }) => {
    const api = page.waitForResponse((response) => endpoint(response.url(), '/api/kick-heatmap'))
    const nav = await page.goto(`${ORIGIN}/kick/heatmap/?categoryPreview=1`, { waitUntil: 'domcontentloaded', timeout: 45000 })
    assert(nav?.ok(), `legacy preview HTTP ${nav?.status()}`)
    await api
    const root = page.locator('#heatmap-category-preview-controls')
    await root.waitFor({ state: 'visible', timeout: 30000 })
    assert(new URL(page.url()).searchParams.get('categoryPreview') === '1', 'legacy preview parameter should remain compatible before interaction')
    const top = root.locator('[data-category-preview-top]')
    const changedApi = page.waitForResponse((response) => {
      if (!endpoint(response.url(), '/api/kick-heatmap')) return false
      return new URL(response.url()).searchParams.get('top') === '20'
    })
    await top.selectOption('20')
    await changedApi
    const currentUrl = new URL(page.url())
    assert(!currentUrl.searchParams.has('categoryPreview'), 'legacy preview parameter was not removed after public interaction')
    assert(currentUrl.searchParams.get('top') === '20', `legacy public top URL=${currentUrl.searchParams.get('top')}`)
    record.checks = { previewBeforeInteraction: true, previewAfterInteraction: false, selectedTop: 20 }
  })

  await scenario(browser, 'kick-unknown-category-honest-empty', { width: 1440, height: 1000 }, async ({ page, record, requests }) => {
    const unknown = '__viewloom_unknown_category__'
    const api = page.waitForResponse((response) => {
      if (!endpoint(response.url(), '/api/kick-heatmap')) return false
      const url = new URL(response.url())
      return url.searchParams.get('category') === unknown && url.searchParams.get('top') === '20'
    })
    const nav = await page.goto(`${ORIGIN}/kick/heatmap/?category=${encodeURIComponent(unknown)}&top=20`, { waitUntil: 'domcontentloaded', timeout: 45000 })
    assert(nav?.ok(), `unknown category HTTP ${nav?.status()}`)
    const payload = await (await api).json()
    assert(payload.categoryFilter?.state === 'unknown_category', `unknown state=${payload.categoryFilter?.state}`)
    assert(payload.categoryFilter?.selectedCategory === unknown, `unknown selected=${payload.categoryFilter?.selectedCategory}`)
    assert(Array.isArray(payload.items) && payload.items.length === 0, `unknown category returned ${payload.items?.length ?? 'missing'} items`)
    const root = page.locator('#heatmap-category-preview-controls')
    await root.waitFor({ state: 'visible', timeout: 30000 })
    assert(await root.locator('[data-category-preview-select]').inputValue() === unknown, 'unknown category option not preserved in public control')
    assert(!requests.some((url) => endpoint(url, '/api/twitch-heatmap')), 'unknown Kick scenario crossed Twitch API')
    record.checks = { state: payload.categoryFilter.state, itemCount: payload.items.length }
  })

  await scenario(browser, 'twitch-public-controls-preserved', { width: 390, height: 844 }, async ({ page, record, requests }) => {
    const api = page.waitForResponse((response) => endpoint(response.url(), '/api/twitch-heatmap'))
    const nav = await page.goto(`${ORIGIN}/twitch/heatmap/`, { waitUntil: 'domcontentloaded', timeout: 45000 })
    assert(nav?.ok(), `Twitch HTTP ${nav?.status()}`)
    await api
    const root = page.locator('#heatmap-category-preview-controls')
    await root.waitFor({ state: 'visible', timeout: 30000 })
    assert(await root.count() === 1, 'Twitch public controls missing')
    assert(await root.getAttribute('data-category-filter') === 'public', 'Twitch category control no longer public')
    assert(!requests.some((url) => endpoint(url, '/api/kick-heatmap')), 'Twitch crossed Kick API')
    const geometry = await pageOverflow(page)
    assert(!geometry.overflow, `Twitch mobile overflow ${geometry.scrollWidth}/${geometry.width}`)
    record.checks = { categoryControls: 1, geometry }
    evidence.twitchPublicCategoryUiPreserved = true
  })
} finally {
  await browser.close()
}

evidence.observedAt = new Date().toISOString()
evidence.status = evidence.failures.length === 0 ? 'pass' : 'fail'
fs.writeFileSync(path.join(OUT, 'evidence.json'), `${JSON.stringify(evidence, null, 2)}\n`)
console.log(JSON.stringify({
  status: evidence.status,
  expectedSha: evidence.expectedSha,
  deploymentSha: evidence.deployment?.commit_sha ?? null,
  failures: evidence.failures,
  scenarios: evidence.scenarios.map(({ name, status }) => ({ name, status })),
  publicKickCategoryUiActive: evidence.publicKickCategoryUiActive,
  twitchPublicCategoryUiPreserved: evidence.twitchPublicCategoryUiPreserved,
}, null, 2))
if (evidence.failures.length > 0) process.exitCode = 1
