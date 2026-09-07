import { cp, mkdir, writeFile } from 'node:fs/promises'
import { chromium } from 'playwright'
import { kickMapKui3aScenarios } from '../src/features/kick-stream-map/kui3a-fixtures.mjs'
import { kickMapKc4Scenarios } from '../src/features/kick-stream-map/kc4-fixtures.mjs'

const origin = (process.env.KICK_MAP_PREVIEW_ORIGIN || 'http://127.0.0.1:4174').replace(/\/$/, '')
const outputRoot = '/tmp/kick-stream-map-public-browser-proof'
const countryFixture = kickMapKui3aScenarios.find((fixture) => fixture.id === 'ready-mixed')
const cityFixture = kickMapKc4Scenarios.find((fixture) => fixture.id === 'city-ready-mixed')
if (!countryFixture || !cityFixture) throw new Error('Kick KC5 browser fixtures are missing')

const countryPayload = {
  ...countryFixture.payload,
  source: 'real',
  state: 'ready',
  implementationState: 'reviewed_country_runtime_connected',
  publicActivationAuthorized: true,
  activation: {
    ...(countryFixture.payload.activation ?? {}),
    publicCountryActivationReady: true,
    blockers: [],
  },
}
const cityPayload = {
  ...cityFixture.payload,
  source: 'real',
  state: 'ready',
  publicActivationAuthorized: true,
  publicCityActivationAuthorized: true,
  activation: {
    ...(cityFixture.payload.activation ?? {}),
    publicCityActivationReady: true,
    blockers: [],
  },
}

const viewports = [
  { id: 'desktop-1440', width: 1440, height: 1000 },
  { id: 'mobile-390', width: 390, height: 844 },
]

await mkdir(outputRoot, { recursive: true })
const browser = await chromium.launch({
  headless: true,
  args: ['--enable-webgl', '--use-gl=angle', '--use-angle=swiftshader', '--disable-gpu-sandbox'],
})
const evidence = {
  schema: 'viewloom-kick-stream-map-public-browser-proof-v2-kc5',
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

if (process.env.GITHUB_EVENT_NAME === 'push') {
  await import('./kick-stream-map-kc5-production-browser-proof.mjs')
  const permanentOutput = '/tmp/kick-stream-map-production-public-browser-proof/kc5-city'
  await mkdir(permanentOutput, { recursive: true })
  await cp('/tmp/kick-stream-map-kc5-production-browser-proof', permanentOutput, { recursive: true })
}

async function audit(viewport) {
  const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height } })
  const page = await context.newPage()
  const apiRequests = []
  const consoleErrors = []
  const pageErrors = []
  const violations = []

  page.on('request', (request) => {
    const url = new URL(request.url())
    if (url.pathname.startsWith('/api/')) apiRequests.push(`${url.pathname}${url.search}`)
  })
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text())
  })
  page.on('pageerror', (error) => pageErrors.push(error.message))

  await page.route('**/api/kick-stream-map*', async (route) => {
    const url = new URL(route.request().url())
    const payload = url.searchParams.get('geography') === 'city' ? cityPayload : countryPayload
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(payload) })
  })

  const response = await page.goto(`${origin}/kick/map/`, { waitUntil: 'domcontentloaded', timeout: 45_000 })
  await waitReady(page, 'basemap-ready')
  const country = await readFacts(page)

  if (response?.status() !== 200) violations.push(`public route returned ${response?.status() ?? 'null'}`)
  if (country.title !== 'Stream Map for Kick live streams | ViewLoom') violations.push(`unexpected title: ${country.title}`)
  if (country.h1 !== 'Stream Map') violations.push(`unexpected h1: ${country.h1}`)
  if (country.state !== 'Ready') violations.push(`Country state ${country.state}`)
  if (country.mapState !== 'basemap-ready') violations.push(`Country map state ${country.mapState}`)
  if (country.canvasCount !== 1 || country.controlCount < 1) violations.push(`Country MapLibre canvas/controls ${country.canvasCount}/${country.controlCount}`)
  if (country.areaRows !== 2 || country.streamRows !== 3) violations.push(`Country rows/streams ${country.areaRows}/${country.streamRows}`)
  if (country.observed !== '6' || country.mapped !== '3' || country.unmapped !== '1') violations.push(`Country accounting ${country.observed}/${country.mapped}/${country.unmapped}`)
  if (JSON.stringify(country.geographyButtons) !== JSON.stringify([
    { text: 'Country', disabled: false, active: 'true', pressed: 'true' },
    { text: 'City', disabled: false, active: 'false', pressed: 'false' },
    { text: 'Current / IRL', disabled: true, active: null, pressed: null },
  ])) violations.push(`KC5 geography controls ${JSON.stringify(country.geographyButtons)}`)
  if (country.overflow > 2) violations.push(`Country horizontal overflow ${country.overflow}px`)

  const firstCountry = page.locator('#stream-map-country-list .stream-map-country-row').first()
  await firstCountry.focus()
  if (!await hasVisibleFocus(firstCountry)) violations.push('Country row focus-visible treatment missing')
  await page.keyboard.press('Enter')
  await page.waitForFunction(() => !document.querySelector('#stream-map-selected-country')?.hasAttribute('hidden'))
  if (await page.locator('#stream-map-stream-list .stream-map-stream-row').count() !== 2) violations.push('Country selection did not filter to two streams')
  await page.locator('[data-kick-world]').click()

  const cityButton = page.locator('[data-kick-geography="city"]')
  await page.keyboard.press('Tab')
  await cityButton.focus()
  if (!await hasVisibleFocus(cityButton)) violations.push('City geography focus-visible treatment missing')
  await page.keyboard.press('Enter')
  await page.waitForFunction(() => new URL(window.location.href).searchParams.get('geography') === 'city')
  await waitReady(page, 'basemap-ready')
  const city = await readFacts(page)

  if (city.state !== 'Ready') violations.push(`City state ${city.state}`)
  if (city.mapState !== 'basemap-ready') violations.push(`City map state ${city.mapState}`)
  if (city.canvasCount !== 1 || city.controlCount < 1) violations.push(`City MapLibre canvas/controls ${city.canvasCount}/${city.controlCount}`)
  if (city.areaRows !== 2 || city.cityRows !== 2 || city.streamRows !== 3) violations.push(`City rows/streams ${city.areaRows}/${city.cityRows}/${city.streamRows}`)
  if (city.creatorMarkers !== 0) violations.push(`City creator markers ${city.creatorMarkers}`)
  if (city.observed !== '7' || city.mapped !== '3') violations.push(`City accounting ${city.observed}/${city.mapped}`)
  if (!apiRequests.some((request) => request === '/api/kick-stream-map?geography=city')) violations.push(`City API request missing: ${apiRequests.join(', ')}`)
  if (city.overflow > 2) violations.push(`City horizontal overflow ${city.overflow}px`)

  const firstCity = page.locator('#stream-map-country-list .stream-map-city-row').first()
  await firstCity.focus()
  if (!await hasVisibleFocus(firstCity)) violations.push('City row focus-visible treatment missing')
  await page.keyboard.press('Enter')
  await page.waitForFunction(() => !document.querySelector('#stream-map-selected-country')?.hasAttribute('hidden'))
  if (await page.locator('#stream-map-stream-list .stream-map-stream-row').count() !== 2) violations.push('City selection did not filter Los Angeles to two streams')
  await page.locator('[data-kick-world]').click()
  if (await page.locator('#stream-map-stream-list .stream-map-stream-row').count() !== 3) violations.push('City World/all reset did not restore three streams')

  await page.locator('[data-population-min-viewers]').selectOption('100')
  await page.waitForFunction(() => document.querySelector('#stream-map-mapped')?.textContent?.trim() === '1')
  if (await page.locator('#stream-map-stream-list .stream-map-stream-row').count() !== 1) violations.push('City population filter did not recompute mapped streams')
  if (await page.locator('#stream-map-country-list .stream-map-city-row').count() !== 1) violations.push('City population filter did not rebuild aggregates')
  await page.locator('[data-reset-population-filters]').click()
  await page.waitForFunction(() => document.querySelector('#stream-map-mapped')?.textContent?.trim() === '3')

  await page.locator('[data-kick-geography="country"]').click()
  await page.waitForFunction(() => new URL(window.location.href).searchParams.get('geography') === null)
  await waitReady(page, 'basemap-ready')
  if (await page.locator('#stream-map-country-list .stream-map-country-row').count() !== 2) violations.push('Country default state not restored after City')

  const directCityResponse = await page.goto(`${origin}/kick/map/?geography=city`, { waitUntil: 'domcontentloaded', timeout: 45_000 })
  await waitReady(page, 'basemap-ready')
  if (directCityResponse?.status() !== 200) violations.push(`direct City route returned ${directCityResponse?.status() ?? 'null'}`)
  if (await page.locator('[data-kick-geography="city"]').getAttribute('aria-pressed') !== 'true') violations.push('direct ?geography=city did not activate City')

  if (apiRequests.some((request) => /twitch/i.test(request))) violations.push(`Twitch API request from Kick public Map: ${apiRequests.join(', ')}`)
  if (pageErrors.length) violations.push(`page errors: ${pageErrors.join(' | ')}`)
  if (consoleErrors.length) violations.push(`console errors: ${consoleErrors.join(' | ')}`)

  const screenshot = `kick-public-kc5--${viewport.id}.png`
  await page.screenshot({ path: `${outputRoot}/${screenshot}`, fullPage: true })
  await context.close()

  return {
    id: `kick-public-kc5--${viewport.id}`,
    viewport,
    status: response?.status() ?? null,
    country,
    city,
    apiRequests,
    consoleErrors,
    pageErrors,
    violations,
    screenshot,
  }
}

async function waitReady(page, acceptedMapState) {
  await page.waitForFunction(() => document.querySelector('[data-stream-map-state]')?.textContent?.trim() === 'Ready', null, { timeout: 20_000 })
  await page.waitForFunction((state) => document.querySelector('#stream-map-root')?.getAttribute('data-map-state') === state, acceptedMapState, { timeout: 30_000 })
  if (acceptedMapState === 'basemap-ready') await page.locator('#stream-map-root .maplibregl-canvas').waitFor({ state: 'visible', timeout: 20_000 })
}

async function readFacts(page) {
  return page.evaluate(() => {
    const text = (selector) => document.querySelector(selector)?.textContent?.trim() ?? ''
    const map = document.querySelector('#stream-map-root')
    const box = map instanceof HTMLElement ? map.getBoundingClientRect() : null
    return {
      title: document.title,
      h1: text('h1'),
      state: text('[data-stream-map-state]'),
      mapState: map?.getAttribute('data-map-state') ?? null,
      canvasCount: document.querySelectorAll('#stream-map-root .maplibregl-canvas').length,
      controlCount: document.querySelectorAll('#stream-map-root .maplibregl-ctrl').length,
      creatorMarkers: document.querySelectorAll('#stream-map-root .maplibregl-marker').length,
      areaRows: document.querySelectorAll('#stream-map-country-list .stream-map-country-row').length,
      cityRows: document.querySelectorAll('#stream-map-country-list .stream-map-city-row').length,
      streamRows: document.querySelectorAll('#stream-map-stream-list .stream-map-stream-row').length,
      observed: text('#stream-map-observed'),
      mapped: text('#stream-map-mapped'),
      unmapped: text('#stream-map-unmapped'),
      populationSummary: text('#stream-map-population-summary'),
      geographyButtons: Array.from(document.querySelectorAll('.stream-map-geography-options button')).map((button) => ({
        text: button.textContent?.trim() ?? '',
        disabled: button.disabled,
        active: button.getAttribute('data-active'),
        pressed: button.getAttribute('aria-pressed'),
      })),
      oldPreviewFacts: document.querySelectorAll('.kick-map-preview__facts').length,
      overflow: Math.max(0, document.body.scrollWidth - document.body.clientWidth),
      mapRect: box ? { width: Math.round(box.width), height: Math.round(box.height) } : { width: 0, height: 0 },
    }
  })
}

async function hasVisibleFocus(locator) {
  return locator.evaluate((node) => {
    const style = getComputedStyle(node)
    return document.activeElement === node && style.outlineStyle !== 'none' && Number.parseFloat(style.outlineWidth || '0') > 0
  })
}
