import { mkdir, writeFile } from 'node:fs/promises'
import { chromium } from 'playwright'
import { kickMapKui3aScenarios } from '../src/features/kick-stream-map/kui3a-fixtures.mjs'

const origin = (process.env.KICK_MAP_PREVIEW_ORIGIN || 'http://127.0.0.1:4174').replace(/\/$/, '')
const outputRoot = '/tmp/kick-stream-map-public-browser-proof'
const readyFixture = kickMapKui3aScenarios.find((fixture) => fixture.id === 'ready-mixed')
if (!readyFixture) throw new Error('ready-mixed Kick Map fixture is missing')

const payload = {
  ...readyFixture.payload,
  source: 'real',
  state: 'ready',
  implementationState: 'reviewed_country_runtime_connected',
  publicActivationAuthorized: true,
  activation: {
    ...(readyFixture.payload.activation ?? {}),
    publicCountryActivationReady: true,
    blockers: [],
  },
}

const viewports = [
  { id: 'desktop-1440', width: 1440, height: 1000 },
  { id: 'mobile-390', width: 390, height: 844 },
]

await mkdir(outputRoot, { recursive: true })
const browser = await chromium.launch({ headless: true })
const evidence = {
  schema: 'viewloom-kick-stream-map-public-browser-proof-v1',
  origin,
  result: 'running',
  scenarios: [],
  violations: [],
}

try {
  for (const viewport of viewports) {
    const scenario = await audit(viewport)
    evidence.scenarios.push(scenario)
    for (const violation of scenario.violations) evidence.violations.push({ scenario: scenario.id, violation })
  }
  evidence.result = evidence.violations.length === 0 ? 'pass' : 'fail'
  evidence.counts = { viewports: viewports.length, scenarios: evidence.scenarios.length, violations: evidence.violations.length }
  await writeFile(`${outputRoot}/evidence.json`, `${JSON.stringify(evidence, null, 2)}\n`)
  console.log(JSON.stringify({ result: evidence.result, counts: evidence.counts, violations: evidence.violations }, null, 2))
  if (evidence.result !== 'pass') process.exitCode = 1
} finally {
  await browser.close()
}

async function audit(viewport) {
  const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height } })
  const page = await context.newPage()
  const apiRequests = []
  const consoleErrors = []
  const pageErrors = []

  page.on('request', (request) => {
    const url = new URL(request.url())
    if (url.pathname.startsWith('/api/')) apiRequests.push(`${url.pathname}${url.search}`)
  })
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text())
  })
  page.on('pageerror', (error) => pageErrors.push(error.message))

  await page.route('**/api/kick-stream-map*', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(payload) })
  })

  const response = await page.goto(`${origin}/kick/map/`, { waitUntil: 'domcontentloaded', timeout: 45_000 })
  await page.waitForFunction(() => document.querySelector('[data-stream-map-state]')?.textContent?.trim() === 'Ready', null, { timeout: 20_000 })
  await page.waitForFunction(() => document.querySelector('#stream-map-root')?.getAttribute('data-map-state') === 'basemap-ready', null, { timeout: 30_000 })
  await page.locator('#stream-map-root .maplibregl-canvas').waitFor({ state: 'visible', timeout: 20_000 })

  const facts = await page.evaluate(() => {
    const text = (selector) => document.querySelector(selector)?.textContent?.trim() ?? ''
    const rect = (selector) => {
      const node = document.querySelector(selector)
      if (!(node instanceof HTMLElement)) return { width: 0, height: 0 }
      const box = node.getBoundingClientRect()
      return { width: Math.round(box.width), height: Math.round(box.height) }
    }
    return {
      title: document.title,
      h1: text('h1'),
      state: text('[data-stream-map-state]'),
      mapState: document.querySelector('#stream-map-root')?.getAttribute('data-map-state') ?? null,
      canvasCount: document.querySelectorAll('#stream-map-root .maplibregl-canvas').length,
      controlCount: document.querySelectorAll('#stream-map-root .maplibregl-ctrl').length,
      countryRows: document.querySelectorAll('#stream-map-country-list .stream-map-country-row').length,
      streamRows: document.querySelectorAll('#stream-map-stream-list .stream-map-stream-row').length,
      observed: text('#stream-map-observed'),
      mapped: text('#stream-map-mapped'),
      unmapped: text('#stream-map-unmapped'),
      populationSummary: text('#stream-map-population-summary'),
      geographyButtons: Array.from(document.querySelectorAll('.stream-map-geography-options button')).map((button) => ({
        text: button.textContent?.trim() ?? '',
        disabled: button.disabled,
        active: button.getAttribute('data-active'),
      })),
      metricButtons: Array.from(document.querySelectorAll('[data-kick-metric]')).map((button) => ({
        text: button.textContent?.trim() ?? '',
        active: button.getAttribute('data-active'),
      })),
      oldPreviewFacts: document.querySelectorAll('.kick-map-preview__facts').length,
      oldAuditCards: Array.from(document.querySelectorAll('body *')).filter((node) => /Stable identity contract|Public activation|Current blockers/i.test(node.textContent ?? '') && node.children.length === 0).length,
      overflow: Math.max(0, document.body.scrollWidth - document.body.clientWidth),
      mapRect: rect('#stream-map-root'),
    }
  })

  const violations = []
  if (response?.status() !== 200) violations.push(`public route returned ${response?.status() ?? 'null'}`)
  if (facts.title !== 'Stream Map for Kick live streams | ViewLoom') violations.push(`unexpected title: ${facts.title}`)
  if (facts.h1 !== 'Stream Map') violations.push(`unexpected h1: ${facts.h1}`)
  if (facts.state !== 'Ready') violations.push(`state ${facts.state}`)
  if (facts.mapState !== 'basemap-ready') violations.push(`map state ${facts.mapState}`)
  if (facts.canvasCount !== 1) violations.push(`canvas count ${facts.canvasCount}`)
  if (facts.controlCount < 1) violations.push(`MapLibre controls missing: ${facts.controlCount}`)
  if (facts.countryRows !== 2) violations.push(`country rows ${facts.countryRows} != 2`)
  if (facts.streamRows !== 3) violations.push(`stream rows ${facts.streamRows} != 3`)
  if (facts.observed !== '6' || facts.mapped !== '3' || facts.unmapped !== '1') violations.push(`accounting mismatch observed=${facts.observed} mapped=${facts.mapped} unmapped=${facts.unmapped}`)
  if (facts.populationSummary !== 'Top 100 · all viewers') violations.push(`population summary ${facts.populationSummary}`)
  if (JSON.stringify(facts.geographyButtons) !== JSON.stringify([
    { text: 'Country', disabled: false, active: 'true' },
    { text: 'City', disabled: true, active: null },
    { text: 'Current / IRL', disabled: true, active: null },
  ])) violations.push(`geography controls ${JSON.stringify(facts.geographyButtons)}`)
  if (facts.metricButtons.length !== 2) violations.push(`metric button count ${facts.metricButtons.length}`)
  if (facts.oldPreviewFacts !== 0) violations.push('old preview fact grid remains public')
  if (facts.oldAuditCards !== 0) violations.push(`old audit copy remains public: ${facts.oldAuditCards}`)
  if (facts.overflow > 2) violations.push(`horizontal overflow ${facts.overflow}px`)
  if (facts.mapRect.height < (viewport.width <= 390 ? 300 : 400)) violations.push(`map too short ${facts.mapRect.height}px`)
  if (apiRequests.some((request) => /twitch/i.test(request))) violations.push(`Twitch API request from Kick public Map: ${apiRequests.join(', ')}`)
  if (pageErrors.length) violations.push(`page errors: ${pageErrors.join(' | ')}`)
  if (consoleErrors.length) violations.push(`console errors: ${consoleErrors.join(' | ')}`)

  const firstCountry = page.locator('#stream-map-country-list .stream-map-country-row').first()
  await firstCountry.focus()
  const focusVisible = await firstCountry.evaluate((node) => {
    const style = getComputedStyle(node)
    return document.activeElement === node && style.outlineStyle !== 'none' && Number.parseFloat(style.outlineWidth || '0') > 0
  })
  if (!focusVisible) violations.push('Country row focus-visible treatment missing')
  await page.keyboard.press('Enter')
  await page.waitForFunction(() => !document.querySelector('#stream-map-selected-country')?.hasAttribute('hidden'))
  const selectedStreamRows = await page.locator('#stream-map-stream-list .stream-map-stream-row').count()
  if (selectedStreamRows !== 2) violations.push(`selected-country stream rows ${selectedStreamRows} != 2`)

  await page.locator('[data-kick-world]').click()
  await page.waitForFunction(() => document.querySelector('#stream-map-selected-country')?.hasAttribute('hidden') === true)
  const worldRows = await page.locator('#stream-map-stream-list .stream-map-stream-row').count()
  if (worldRows !== 3) violations.push(`World reset stream rows ${worldRows} != 3`)

  await page.locator('[data-kick-metric="streams"]').click()
  const metricActive = await page.locator('[data-kick-metric="streams"]').getAttribute('data-active')
  if (metricActive !== 'true') violations.push('Streams metric did not become active')

  const screenshot = `kick-public--${viewport.id}.png`
  await page.screenshot({ path: `${outputRoot}/${screenshot}`, fullPage: true })
  await context.close()

  return {
    id: `kick-public--${viewport.id}`,
    viewport,
    status: response?.status() ?? null,
    facts,
    apiRequests,
    consoleErrors,
    pageErrors,
    violations,
    screenshot,
  }
}
