import { mkdir, writeFile } from 'node:fs/promises'
import assert from 'node:assert/strict'
import { chromium } from 'playwright'

import { kickMapKui3aScenarios } from '../src/features/kick-stream-map/kui3a-fixtures.mjs'
import { kickMapKc4Scenarios } from '../src/features/kick-stream-map/kc4-fixtures.mjs'

const origin = (process.env.KICK_MAP_PREVIEW_ORIGIN || 'http://127.0.0.1:4174').replace(/\/$/, '')
const productionOrigin = (process.env.KICK_MAP_PRODUCTION_ORIGIN || 'https://www.viewloom.net').replace(/\/$/, '')
const outputRoot = '/tmp/kick-stream-map-kc4-city-browser-proof'
const viewports = [
  { id: 'desktop-1440', width: 1440, height: 1000 },
  { id: 'mobile-390', width: 390, height: 844 },
]
const countryReady = kickMapKui3aScenarios.find((scenario) => scenario.id === 'ready-mixed')
assert.ok(countryReady, 'KC4 browser proof requires the existing ready-mixed Country fixture')

await mkdir(outputRoot, { recursive: true })
const browser = await chromium.launch({ headless: true })
const evidence = {
  schema: 'viewloom-kick-stream-map-kc4-city-browser-proof-v1',
  origin,
  productionOrigin,
  result: 'running',
  deterministic: [],
  productionConnected: [],
  violations: [],
}

try {
  for (const fixture of kickMapKc4Scenarios) {
    for (const viewport of viewports) {
      const scenario = await auditDeterministic(browser, fixture, viewport)
      evidence.deterministic.push(scenario)
      for (const violation of scenario.violations) evidence.violations.push({ scenario: scenario.id, violation })
    }
  }

  const production = await fetchProductionPayloads()
  for (const viewport of viewports) {
    const scenario = await auditProductionConnected(browser, production, viewport)
    evidence.productionConnected.push(scenario)
    for (const violation of scenario.violations) evidence.violations.push({ scenario: scenario.id, violation })
  }

  evidence.result = evidence.violations.length === 0 ? 'pass' : 'fail'
  evidence.counts = {
    deterministicFixtures: kickMapKc4Scenarios.length,
    viewports: viewports.length,
    deterministicScenarios: evidence.deterministic.length,
    productionConnectedScenarios: evidence.productionConnected.length,
    scenarios: evidence.deterministic.length + evidence.productionConnected.length,
    violations: evidence.violations.length,
  }
  evidence.productionSnapshot = {
    deploymentState: production.country.state,
    observedStreams: production.city.coverage?.observedStreams ?? null,
    stableIdentityStreams: production.city.coverage?.stableIdentityStreams ?? null,
    mappedStreams: production.city.coverage?.mappedStreams ?? null,
    mappedCityAggregateCount: production.city.coverage?.mappedCityAggregateCount ?? null,
    referenceGeometryAggregates: production.city.coverage?.referenceGeometryAggregates ?? null,
    listOnlyAggregates: production.city.coverage?.listOnlyAggregates ?? null,
    publicCityActivationAuthorized: production.city.publicCityActivationAuthorized,
    cityState: production.city.state,
  }

  await writeFile(`${outputRoot}/evidence.json`, `${JSON.stringify(evidence, null, 2)}\n`)
  console.log(JSON.stringify({ result: evidence.result, counts: evidence.counts, productionSnapshot: evidence.productionSnapshot, violations: evidence.violations }, null, 2))
  if (evidence.result !== 'pass') process.exitCode = 1
} finally {
  await browser.close()
}

async function fetchProductionPayloads() {
  const [countryResponse, cityResponse] = await Promise.all([
    fetch(`${productionOrigin}/api/kick-stream-map?kc4-proof=${encodeURIComponent(process.env.GITHUB_RUN_ID || 'manual')}`, {
      headers: { accept: 'application/json' },
      cache: 'no-store',
    }),
    fetch(`${productionOrigin}/api/kick-stream-map?geography=city&kc4-proof=${encodeURIComponent(process.env.GITHUB_RUN_ID || 'manual')}`, {
      headers: { accept: 'application/json' },
      cache: 'no-store',
    }),
  ])
  assert.equal(countryResponse.status, 200, `production Country HTTP ${countryResponse.status}`)
  assert.equal(cityResponse.status, 200, `production City HTTP ${cityResponse.status}`)
  const country = await countryResponse.json()
  const city = await cityResponse.json()

  assert.equal(country.provider, 'kick')
  assert.equal(country.geographyMode, 'country')
  assert.equal(country.publicActivationAuthorized, true)
  assert.equal(country.state === 'ready' || country.state === 'empty', true)
  assert.equal(city.provider, 'kick')
  assert.equal(city.geographyMode, 'city')
  assert.equal(city.publicCityActivationAuthorized, false)
  assert.equal(city.activation?.publicCityActivationReady, true)
  assert.equal(city.coverage?.stableIdentityStreams, city.coverage?.observedStreams)
  assert.equal(city.coverage?.reconciliation?.passes, true)
  assert.equal(city.semantics?.stableIdentityPublished, false)
  assert.equal(city.semantics?.countryInferenceToCityAllowed, false)
  assert.equal(city.semantics?.currentLocationUsedForBaseCity, false)
  assert.equal(city.semantics?.temporaryLocationUsedForBaseCity, false)
  assert.equal(city.semantics?.creatorCoordinatesAllowed, false)
  assert.equal(city.semantics?.reviewedAggregateReferenceOnly, true)
  assert.equal(city.semantics?.noGeometryListOnly, true)
  assert.equal(city.coverage?.referenceGeometryAggregates, 0, 'KC3 production must remain list-only before reviewed Kick City reference geometry exists')
  assert.equal(city.coverage?.listOnlyAggregates, city.coverage?.mappedCityAggregateCount)
  assert.deepEqual(findForbiddenKeys(country), [])
  assert.deepEqual(findForbiddenKeys(city), [])
  return { country, city }
}

async function auditDeterministic(browser, fixture, viewport) {
  const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height } })
  const page = await context.newPage()
  const apiRequests = []
  const consoleErrors = []
  const pageErrors = []

  page.on('request', (request) => {
    const url = new URL(request.url())
    if (url.pathname.startsWith('/api/')) apiRequests.push(`${url.pathname}${url.search}`)
  })
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()) })
  page.on('pageerror', (error) => pageErrors.push(error.message))

  await page.route('**/api/kick-stream-map*', async (route) => {
    const url = new URL(route.request().url())
    const isCity = url.searchParams.get('geography') === 'city'
    const response = isCity ? fixture : countryReady
    await route.fulfill({
      status: response.httpStatus,
      contentType: 'application/json',
      body: JSON.stringify(response.payload),
    })
  })

  const response = await page.goto(`${origin}/preview/kick-stream-map/?kc4=${fixture.id}-${viewport.id}`, {
    waitUntil: 'domcontentloaded',
    timeout: 45_000,
  })
  await page.waitForFunction(() => document.querySelector('[data-kick-preview-state]')?.textContent?.trim() !== 'Loading', null, { timeout: 20_000 })
  await page.locator('[data-kick-preview-geography="city"]').click()
  await page.waitForFunction((expected) => document.querySelector('[data-kick-preview-state]')?.textContent?.trim() === expected, fixture.expect.state, { timeout: 20_000 })
  if (fixture.expect.mapVisible) await page.locator('[data-kick-city-map] .maplibregl-canvas').waitFor({ state: 'visible', timeout: 20_000 })

  const facts = await readCityFacts(page)
  const violations = validateBaseFacts({ facts, fixture, apiRequests, consoleErrors, pageErrors, response, viewport })

  if (fixture.id === 'city-ready-mixed') {
    if (facts.mapped !== 3) violations.push(`mapped ${facts.mapped}`)
    if (facts.cityRows !== 2) violations.push(`City row count ${facts.cityRows}`)
    if (facts.streamRows !== 3) violations.push(`City stream row count ${facts.streamRows}`)
    if (facts.referenceRows !== 1) violations.push(`reference row count ${facts.referenceRows}`)
    if (facts.listOnlyRows !== 1) violations.push(`list-only row count ${facts.listOnlyRows}`)
    if (facts.canvasCount !== 1) violations.push(`City canvas count ${facts.canvasCount}`)
    if (facts.mapState !== 'basemap-ready') violations.push(`City map state ${facts.mapState}`)
    if (facts.markerCount !== 0) violations.push(`creator marker semantics present ${facts.markerCount}`)
    for (const target of facts.actionTargets) if (target.height < 44) violations.push(`City action target below 44px: ${target.name} ${target.height}px`)

    const interaction = await exerciseCityInteractions(page)
    if (!interaction.modeFocusVisible) violations.push('City resolution focus-visible missing')
    if (!interaction.metricFocusVisible) violations.push('City metric focus-visible missing')
    if (!interaction.cityFocusVisible) violations.push('City row focus-visible missing')
    if (!interaction.allFocusVisible) violations.push('All cities focus-visible missing')
    if (interaction.santHeading !== 'Sant Cugat del Valles mapped streams') violations.push(`list-only City selection failed: ${interaction.santHeading}`)
    if (interaction.santStreamCount !== 1) violations.push(`Sant Cugat stream count ${interaction.santStreamCount}`)
    if (interaction.selectedMetric !== 'streams') violations.push(`City metric change failed: ${interaction.selectedMetric}`)
    if (interaction.allHeading !== 'Mapped streams') violations.push(`All cities reset failed: ${interaction.allHeading}`)
    if (interaction.allStreamCount !== 3) violations.push(`All cities stream count ${interaction.allStreamCount}`)
  } else {
    if (facts.mapped !== 0) violations.push(`blocked mapped ${facts.mapped}`)
    if (facts.cityRows !== 0) violations.push(`blocked City rows ${facts.cityRows}`)
    if (facts.streamRows !== 0) violations.push(`blocked stream rows ${facts.streamRows}`)
    if (facts.canvasCount !== 0) violations.push(`blocked canvas count ${facts.canvasCount}`)
  }

  const screenshot = `deterministic--${fixture.id}--${viewport.id}.png`
  await page.screenshot({ path: `${outputRoot}/${screenshot}`, fullPage: true })
  await context.close()
  return { id: `deterministic--${fixture.id}--${viewport.id}`, viewport, facts, apiRequests, consoleErrors, pageErrors, violations, screenshot }
}

async function auditProductionConnected(browser, production, viewport) {
  const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height } })
  const page = await context.newPage()
  const apiRequests = []
  const consoleErrors = []
  const pageErrors = []

  page.on('request', (request) => {
    const url = new URL(request.url())
    if (url.pathname.startsWith('/api/')) apiRequests.push(`${url.pathname}${url.search}`)
  })
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()) })
  page.on('pageerror', (error) => pageErrors.push(error.message))

  await page.route('**/api/kick-stream-map*', async (route) => {
    const url = new URL(route.request().url())
    const payload = url.searchParams.get('geography') === 'city' ? production.city : production.country
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(payload) })
  })

  const response = await page.goto(`${origin}/preview/kick-stream-map/?kc4-production=${viewport.id}`, { waitUntil: 'domcontentloaded', timeout: 45_000 })
  await page.waitForFunction(() => document.querySelector('[data-kick-preview-state]')?.textContent?.trim() !== 'Loading', null, { timeout: 20_000 })
  await page.locator('[data-kick-preview-geography="city"]').click()

  const expectedMapped = Number(production.city.coverage?.mappedStreams || 0)
  const expectedAggregates = Number(production.city.coverage?.mappedCityAggregateCount || 0)
  const expectedState = expectedAggregates > 0 ? 'city_list_only' : 'city_empty'
  await page.waitForFunction((expected) => document.querySelector('[data-kick-preview-state]')?.textContent?.trim() === expected, expectedState, { timeout: 20_000 })
  const facts = await readCityFacts(page)
  const violations = []
  if (response?.status() !== 200) violations.push(`preview route returned ${response?.status() ?? 'null'}`)
  if (facts.state !== expectedState) violations.push(`production-connected state ${facts.state} != ${expectedState}`)
  if (facts.observed !== Number(production.city.coverage?.observedStreams || 0)) violations.push(`observed ${facts.observed}`)
  if (facts.stable !== Number(production.city.coverage?.stableIdentityStreams || 0)) violations.push(`stable ${facts.stable}`)
  if (facts.mapped !== expectedMapped) violations.push(`mapped ${facts.mapped} != ${expectedMapped}`)
  if (facts.cityRows !== expectedAggregates) violations.push(`City rows ${facts.cityRows} != ${expectedAggregates}`)
  if (facts.referenceRows !== 0) violations.push(`production reference rows ${facts.referenceRows}`)
  if (facts.canvasCount !== 0) violations.push(`production City must remain list-only, canvas ${facts.canvasCount}`)
  if (facts.markerCount !== 0) violations.push(`production creator markers ${facts.markerCount}`)
  if (expectedAggregates > 0 && !facts.resultsVisible) violations.push('production list-only City results hidden')
  if (expectedAggregates === 0 && facts.resultsVisible) violations.push('production empty City results unexpectedly visible')
  if (apiRequests.some((request) => /twitch/i.test(request))) violations.push(`Twitch API request ${apiRequests.join(', ')}`)
  if (pageErrors.length) violations.push(`page errors: ${pageErrors.join(' | ')}`)
  if (consoleErrors.length) violations.push(`console errors: ${consoleErrors.join(' | ')}`)
  if (facts.overflow > 2) violations.push(`horizontal overflow ${facts.overflow}px`)
  if (facts.publicCityActivation !== 'City not authorized') violations.push(`KC5 boundary changed: ${facts.publicCityActivation}`)
  for (const target of facts.actionTargets) if (target.height < 44) violations.push(`production City action target below 44px: ${target.name} ${target.height}px`)

  const screenshot = `production-connected--${viewport.id}.png`
  await page.screenshot({ path: `${outputRoot}/${screenshot}`, fullPage: true })
  await context.close()
  return { id: `production-connected--${viewport.id}`, viewport, expectedState, facts, apiRequests, consoleErrors, pageErrors, violations, screenshot }
}

function validateBaseFacts({ facts, fixture, apiRequests, consoleErrors, pageErrors, response, viewport }) {
  const violations = []
  if (response?.status() !== 200) violations.push(`preview route returned ${response?.status() ?? 'null'}`)
  if (facts.title !== 'Kick Stream Map Preview — ViewLoom') violations.push(`title ${facts.title}`)
  if (facts.robots !== 'noindex,nofollow') violations.push(`robots ${facts.robots}`)
  if (facts.canonical !== null) violations.push(`preview canonical ${facts.canonical}`)
  if (facts.state !== fixture.expect.state) violations.push(`state ${facts.state} != ${fixture.expect.state}`)
  if (facts.cityModePressed !== true || facts.countryModePressed !== false) violations.push('Country/City aria-pressed state mismatch')
  if (facts.currentDisabled !== true) violations.push('Current control is not disabled')
  if (facts.citySurfaceVisible !== true) violations.push('City surface not visible')
  if (facts.mapVisible !== fixture.expect.mapVisible) violations.push(`mapVisible ${facts.mapVisible} != ${fixture.expect.mapVisible}`)
  if (facts.resultsVisible !== fixture.expect.resultsVisible) violations.push(`resultsVisible ${facts.resultsVisible} != ${fixture.expect.resultsVisible}`)
  if (facts.publicCityActivation !== 'City not authorized') violations.push(`KC5 boundary changed: ${facts.publicCityActivation}`)
  if (facts.overflow > 2) violations.push(`horizontal overflow ${facts.overflow}px at ${viewport.width}px`)
  if (apiRequests.some((request) => /twitch/i.test(request))) violations.push(`Twitch API request ${apiRequests.join(', ')}`)
  if (!apiRequests.some((request) => request.includes('geography=city'))) violations.push('explicit geography=city API request missing')
  if (pageErrors.length) violations.push(`page errors: ${pageErrors.join(' | ')}`)
  if (consoleErrors.length) violations.push(`console errors: ${consoleErrors.join(' | ')}`)
  return violations
}

async function readCityFacts(page) {
  return page.evaluate(() => {
    const visible = (selector) => {
      const node = document.querySelector(selector)
      if (!(node instanceof HTMLElement)) return false
      const style = getComputedStyle(node)
      const rect = node.getBoundingClientRect()
      return !node.hidden && style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0
    }
    const text = (selector) => document.querySelector(selector)?.textContent?.trim() ?? ''
    const count = (selector) => Number(text(selector).replace(/,/g, '')) || 0
    const actionTargets = Array.from(document.querySelectorAll('[data-kick-preview-geography], [data-kick-city-metric], [data-kick-city-all], .kick-map-preview__city-row'))
      .filter((node) => node instanceof HTMLElement && visibleNode(node))
      .map((node) => {
        const rect = node.getBoundingClientRect()
        return { name: node.getAttribute('aria-label') || node.textContent?.trim() || node.tagName, width: Math.round(rect.width), height: Math.round(rect.height) }
      })
    const cityRows = Array.from(document.querySelectorAll('.kick-map-preview__city-row'))
    return {
      title: document.title,
      robots: document.querySelector('meta[name="robots"]')?.getAttribute('content') ?? null,
      canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? null,
      state: text('[data-kick-preview-state]'),
      observed: count('[data-kick-preview-observed]'),
      stable: count('[data-kick-preview-stable]'),
      mapped: count('[data-kick-preview-mapped]'),
      publicCityActivation: text('[data-kick-preview-activation]'),
      countryModePressed: document.querySelector('[data-kick-preview-geography="country"]')?.getAttribute('aria-pressed') === 'true',
      cityModePressed: document.querySelector('[data-kick-preview-geography="city"]')?.getAttribute('aria-pressed') === 'true',
      currentDisabled: document.querySelector('.kick-map-preview__resolution span[aria-disabled="true"]') !== null,
      citySurfaceVisible: visible('[data-kick-preview-city-surface]'),
      mapVisible: visible('[data-kick-city-map]'),
      resultsVisible: visible('[data-kick-city-results]'),
      mapState: document.querySelector('[data-kick-city-map]')?.getAttribute('data-map-state') ?? null,
      cityRows: cityRows.length,
      streamRows: document.querySelectorAll('[data-kick-city-streams] .kick-map-preview__stream-row').length,
      referenceRows: cityRows.filter((node) => /aggregate reference point/i.test(node.textContent ?? '')).length,
      listOnlyRows: cityRows.filter((node) => /list-only/i.test(node.textContent ?? '')).length,
      canvasCount: document.querySelectorAll('[data-kick-city-map] .maplibregl-canvas').length,
      markerCount: document.querySelectorAll('[data-kick-city-map] .maplibregl-marker').length,
      actionTargets,
      overflow: Math.max(0, document.body.scrollWidth - document.body.clientWidth),
    }

    function visibleNode(node) {
      if (!(node instanceof HTMLElement) || node.hidden) return false
      const style = getComputedStyle(node)
      const rect = node.getBoundingClientRect()
      return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0
    }
  })
}

async function exerciseCityInteractions(page) {
  const mode = page.locator('[data-kick-preview-geography="city"]')
  await mode.focus()
  const modeFocusVisible = await hasVisibleFocus(page, '[data-kick-preview-geography="city"]')

  const metric = page.locator('[data-kick-city-metric]')
  await metric.focus()
  const metricFocusVisible = await hasVisibleFocus(page, '[data-kick-city-metric]')
  await metric.selectOption('streams')
  const selectedMetric = await metric.inputValue()

  const sant = page.locator('.kick-map-preview__city-row[data-city-aggregate-key="ES|__none__|sant cugat del valles"]')
  await sant.focus()
  const cityFocusVisible = await hasVisibleFocus(page, '.kick-map-preview__city-row[data-city-aggregate-key="ES|__none__|sant cugat del valles"]')
  await page.keyboard.press('Enter')
  await page.waitForFunction(() => document.querySelector('[data-kick-city-stream-heading]')?.textContent?.trim() === 'Sant Cugat del Valles mapped streams')
  const santHeading = await page.locator('[data-kick-city-stream-heading]').textContent().then((value) => value?.trim() ?? '')
  const santStreamCount = await page.locator('[data-kick-city-streams] .kick-map-preview__stream-row').count()

  const all = page.locator('[data-kick-city-all]')
  await all.focus()
  const allFocusVisible = await hasVisibleFocus(page, '[data-kick-city-all]')
  await page.keyboard.press('Enter')
  await page.waitForFunction(() => document.querySelector('[data-kick-city-stream-heading]')?.textContent?.trim() === 'Mapped streams')
  const allHeading = await page.locator('[data-kick-city-stream-heading]').textContent().then((value) => value?.trim() ?? '')
  const allStreamCount = await page.locator('[data-kick-city-streams] .kick-map-preview__stream-row').count()

  return { modeFocusVisible, metricFocusVisible, cityFocusVisible, allFocusVisible, selectedMetric, santHeading, santStreamCount, allHeading, allStreamCount }
}

async function hasVisibleFocus(page, selector) {
  return page.locator(selector).evaluate((node) => {
    const style = getComputedStyle(node)
    const outlineWidth = Number.parseFloat(style.outlineWidth || '0')
    return document.activeElement === node && style.outlineStyle !== 'none' && outlineWidth > 0
  })
}

function findForbiddenKeys(value, output = []) {
  if (Array.isArray(value)) {
    for (const item of value) findForbiddenKeys(item, output)
    return output
  }
  if (!value || typeof value !== 'object') return output
  for (const [key, child] of Object.entries(value)) {
    if (key === 'stableKickUserId' || key === 'broadcaster_user_id' || key === 'currentLocation' || key === 'current_location' || key === 'temporaryLocation' || key === 'temporary_location' || key === 'address' || key === 'coordinates') output.push(key)
    findForbiddenKeys(child, output)
  }
  return output
}
