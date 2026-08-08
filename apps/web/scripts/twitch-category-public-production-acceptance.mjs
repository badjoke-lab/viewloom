import fs from 'node:fs'
import path from 'node:path'
import { chromium } from 'playwright'

const ORIGIN = process.env.VIEWLOOM_ORIGIN || 'https://www.viewloom.net'
const OUT = process.env.OUTPUT_DIR || 'artifacts/12a5-twitch-category-public-production-acceptance'
const MAX_ATTEMPTS = Number(process.env.MAX_ATTEMPTS || 20)
const RETRY_MS = Number(process.env.RETRY_MS || 15000)
const screenshots = path.join(OUT, 'screenshots')
fs.mkdirSync(screenshots, { recursive: true })

const evidence = {
  schemaVersion: 'viewloom-12a5-twitch-category-public-production-acceptance-evidence-v1',
  origin: ORIGIN,
  startedAt: new Date().toISOString(),
  completedAt: null,
  status: 'running',
  attempts: [],
  accepted: null,
  failures: [],
  productionMutationPerformed: false,
  kickCategoryUiEnabled: false,
}
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const endpoint = (url, pathname) => {
  try { return new URL(url).pathname === pathname } catch { return false }
}
const assert = (condition, message) => { if (!condition) throw new Error(message) }
const json = async (response) => {
  const value = await response.json()
  assert(value && typeof value === 'object', `invalid JSON from ${response.url()}`)
  return value
}
const geometry = (page) => page.evaluate(() => ({
  width: window.innerWidth,
  scrollWidth: document.documentElement.scrollWidth,
  overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
}))

async function runScenario(browser, name, viewport, fn) {
  const context = await browser.newContext({ viewport })
  const page = await context.newPage()
  const requests = []
  page.on('request', (request) => {
    const url = request.url()
    if (url.includes('/api/twitch-heatmap') || url.includes('/api/kick-heatmap')) requests.push(url)
  })
  try {
    const checks = await fn(page, requests)
    return { name, viewport, status: 'pass', requests, checks }
  } finally {
    await context.close()
  }
}

async function runSuite(attempt) {
  const browser = await chromium.launch({ headless: true })
  try {
    const scenarios = []
    scenarios.push(await runScenario(browser, 'twitch-public-desktop', { width: 1440, height: 1000 }, async (page, requests) => {
      const apiPromise = page.waitForResponse((r) => endpoint(r.url(), '/api/twitch-heatmap'), { timeout: 30000 })
      const nav = await page.goto(`${ORIGIN}/twitch/heatmap/`, { waitUntil: 'domcontentloaded', timeout: 45000 })
      assert(nav?.ok(), `Twitch public page HTTP ${nav?.status()}`)
      const response = await apiPromise
      const payload = await json(response)
      const requestUrl = new URL(response.url())
      assert(requestUrl.searchParams.get('category') === 'all', `initial category query=${requestUrl.searchParams.get('category')}`)
      assert(requestUrl.searchParams.get('top') === '50', `initial top query=${requestUrl.searchParams.get('top')}`)
      assert(payload.provider === 'twitch', `provider=${payload.provider}`)
      assert(payload.state === 'live', `state=${payload.state}`)
      assert(payload.categoryFilter?.implementationState === 'public', `implementation=${payload.categoryFilter?.implementationState}`)
      assert(payload.categoryFilter?.publicExposureAuthorized === true, 'API public exposure flag is not true')
      assert(payload.categoryFilter?.filterBeforeTopN === true, 'filter-before-Top-N changed')
      assert(payload.categoryFilter?.selectedCategory === 'all', 'default category is not all')
      assert(payload.categoryFilter?.requestedTop === 50, 'default Top is not 50')
      assert(Array.isArray(payload.availableCategories) && payload.availableCategories.length > 0, 'no public category options')
      assert(Array.isArray(payload.items) && payload.items.length > 0 && payload.items.length <= 50, `initial items=${payload.items?.length}`)

      const root = page.locator('#heatmap-category-preview-controls')
      await root.waitFor({ state: 'visible', timeout: 20000 })
      const category = root.locator('[data-category-preview-select]')
      const top = root.locator('[data-category-preview-top]')
      assert(await root.getAttribute('data-category-filter') === 'public', 'control root is not marked public')
      assert(await category.getAttribute('aria-label') === 'Twitch category', 'public Category aria-label mismatch')
      assert(await top.getAttribute('aria-label') === 'Twitch maximum streams', 'public Top aria-label mismatch')
      const text = await root.innerText()
      assert(!text.includes('Hidden preview') && !text.includes('public exposure disabled'), 'hidden-only copy remains public')

      const option = payload.availableCategories.find((value) => value && value.id && value.streamCount > 0)
      assert(option, 'no selectable category')
      const selectedPromise = page.waitForResponse((r) => endpoint(r.url(), '/api/twitch-heatmap') && new URL(r.url()).searchParams.get('category') === String(option.id), { timeout: 20000 })
      await category.selectOption(String(option.id))
      const selected = await json(await selectedPromise)
      assert(selected.categoryFilter?.state === 'selected', `selected state=${selected.categoryFilter?.state}`)
      assert(selected.items.every((item) => item.categoryId === String(option.id)), 'selected category contains foreign category')

      const top20Promise = page.waitForResponse((r) => {
        if (!endpoint(r.url(), '/api/twitch-heatmap')) return false
        const u = new URL(r.url())
        return u.searchParams.get('category') === String(option.id) && u.searchParams.get('top') === '20'
      }, { timeout: 20000 })
      await top.selectOption('20')
      const top20 = await json(await top20Promise)
      assert(top20.items.length <= 20, `Top20 items=${top20.items.length}`)
      const currentUrl = new URL(page.url())
      assert(currentUrl.searchParams.get('category') === String(option.id), 'public category URL state mismatch')
      assert(currentUrl.searchParams.get('top') === '20', 'public Top URL state mismatch')
      assert(!currentUrl.searchParams.has('categoryPreview'), 'legacy hidden parameter remains after public control change')
      await category.focus()
      await page.keyboard.press('Tab')
      assert(await page.evaluate(() => document.activeElement?.hasAttribute('data-category-preview-top')) === true, 'public keyboard order failed')
      assert(!requests.some((url) => endpoint(url, '/api/kick-heatmap')), 'Twitch public route crossed into Kick API')
      const g = await geometry(page)
      assert(!g.overflow, `desktop overflow ${g.scrollWidth}/${g.width}`)
      await page.screenshot({ path: path.join(screenshots, 'twitch-public-desktop.png'), fullPage: true })
      return { categoryOptions: payload.availableCategories.length, initialItems: payload.items.length, selectedCategory: String(option.id), selectedItems: selected.items.length, top20Items: top20.items.length, keyboard: true, geometry: g }
    }))

    scenarios.push(await runScenario(browser, 'twitch-public-mobile', { width: 390, height: 844 }, async (page, requests) => {
      const apiPromise = page.waitForResponse((r) => endpoint(r.url(), '/api/twitch-heatmap'), { timeout: 30000 })
      const nav = await page.goto(`${ORIGIN}/twitch/heatmap/`, { waitUntil: 'domcontentloaded', timeout: 45000 })
      assert(nav?.ok(), `Twitch mobile HTTP ${nav?.status()}`)
      const payload = await json(await apiPromise)
      assert(payload.categoryFilter?.implementationState === 'public', 'mobile API is not public')
      const root = page.locator('#heatmap-category-preview-controls')
      await root.waitFor({ state: 'visible', timeout: 20000 })
      assert(await root.locator('[data-category-preview-select]').count() === 1, 'mobile Category missing')
      assert(await root.locator('[data-category-preview-top]').count() === 1, 'mobile Top missing')
      assert(!requests.some((url) => endpoint(url, '/api/kick-heatmap')), 'mobile Twitch crossed into Kick API')
      const g = await geometry(page)
      assert(!g.overflow, `mobile overflow ${g.scrollWidth}/${g.width}`)
      await page.screenshot({ path: path.join(screenshots, 'twitch-public-mobile.png'), fullPage: true })
      return { categoryOptions: payload.availableCategories?.length ?? 0, geometry: g }
    }))

    scenarios.push(await runScenario(browser, 'twitch-public-unknown-category', { width: 820, height: 900 }, async (page) => {
      const unknown = '__viewloom_unknown_category__'
      const apiPromise = page.waitForResponse((r) => endpoint(r.url(), '/api/twitch-heatmap') && new URL(r.url()).searchParams.get('category') === unknown, { timeout: 30000 })
      const nav = await page.goto(`${ORIGIN}/twitch/heatmap/?category=${encodeURIComponent(unknown)}&top=20`, { waitUntil: 'domcontentloaded', timeout: 45000 })
      assert(nav?.ok(), `unknown page HTTP ${nav?.status()}`)
      const payload = await json(await apiPromise)
      assert(payload.categoryFilter?.state === 'unknown_category', `unknown state=${payload.categoryFilter?.state}`)
      assert(Array.isArray(payload.items) && payload.items.length === 0, 'unknown category returned items')
      await page.waitForSelector('.heatmap-runtime-state strong', { timeout: 20000 })
      const title = await page.locator('.heatmap-runtime-state strong').innerText()
      assert(title === 'Unknown Twitch category', `unknown title=${title}`)
      return { state: payload.categoryFilter.state, itemCount: payload.items.length, uiTitle: title }
    }))

    scenarios.push(await runScenario(browser, 'kick-public-control-isolation', { width: 390, height: 844 }, async (page, requests) => {
      const apiPromise = page.waitForResponse((r) => endpoint(r.url(), '/api/kick-heatmap'), { timeout: 30000 })
      const nav = await page.goto(`${ORIGIN}/kick/heatmap/?category=all&top=50&categoryPreview=1`, { waitUntil: 'domcontentloaded', timeout: 45000 })
      assert(nav?.ok(), `Kick page HTTP ${nav?.status()}`)
      const payload = await json(await apiPromise)
      assert(await page.locator('#heatmap-category-preview-controls').count() === 0, 'Kick exposes Twitch category controls')
      assert(Array.isArray(payload.items) && payload.items.length > 0, 'Kick live items missing')
      assert(!requests.some((url) => endpoint(url, '/api/twitch-heatmap')), 'Kick route crossed into Twitch API')
      const g = await geometry(page)
      assert(!g.overflow, `Kick mobile overflow ${g.scrollWidth}/${g.width}`)
      await page.screenshot({ path: path.join(screenshots, 'kick-public-control-isolation.png'), fullPage: true })
      return { itemCount: payload.items.length, geometry: g }
    }))
    return scenarios
  } finally {
    await browser.close()
  }
}

for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
  const startedAt = new Date().toISOString()
  try {
    const scenarios = await runSuite(attempt)
    const entry = { attempt, startedAt, completedAt: new Date().toISOString(), status: 'pass', scenarios }
    evidence.attempts.push(entry)
    evidence.accepted = entry
    evidence.status = 'pass'
    break
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    evidence.attempts.push({ attempt, startedAt, completedAt: new Date().toISOString(), status: 'fail', error: message })
    evidence.failures.push(`attempt ${attempt}: ${message}`)
    if (attempt < MAX_ATTEMPTS) await sleep(RETRY_MS)
  }
}

evidence.completedAt = new Date().toISOString()
if (evidence.status !== 'pass') evidence.status = 'fail'
fs.writeFileSync(path.join(OUT, 'evidence.json'), JSON.stringify(evidence, null, 2) + '\n')
console.log(JSON.stringify({ status: evidence.status, acceptedAttempt: evidence.accepted?.attempt ?? null, attempts: evidence.attempts.length, lastFailure: evidence.failures.at(-1) ?? null }, null, 2))
if (evidence.status !== 'pass') process.exitCode = 1
