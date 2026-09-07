import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { chromium } from 'playwright'

const origin = (process.env.KICK_MAP_PRODUCTION_ORIGIN || 'https://www.viewloom.net').replace(/\/$/, '')
const outputRoot = '/tmp/kick-stream-map-kc5-production-browser-proof'
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
  schema: 'viewloom-kick-stream-map-kc5-production-browser-proof-v1',
  origin,
  result: 'running',
  deployment: null,
  cityApi: null,
  scenarios: [],
  violations: [],
}

try {
  const api = await waitForKc5Api(browser)
  evidence.cityApi = summarizeCityApi(api)
  validateCityApi(api, evidence.violations)

  for (const viewport of viewports) {
    const scenario = await auditCity(viewport, api)
    evidence.scenarios.push(scenario)
    for (const violation of scenario.violations) evidence.violations.push({ scenario: scenario.id, violation })
  }

  evidence.result = evidence.violations.length === 0 ? 'pass' : 'fail'
  evidence.counts = { viewports: viewports.length, scenarios: evidence.scenarios.length, violations: evidence.violations.length }
  await writeFile(`${outputRoot}/evidence.json`, `${JSON.stringify(evidence, null, 2)}\n`)
  console.log(JSON.stringify({ result: evidence.result, counts: evidence.counts, cityApi: evidence.cityApi, violations: evidence.violations }, null, 2))
  assert.equal(evidence.violations.length, 0, JSON.stringify(evidence.violations))
} finally {
  await browser.close()
}

async function waitForKc5Api(browser) {
  const context = await browser.newContext()
  try {
    let last = null
    for (let attempt = 0; attempt < 48; attempt += 1) {
      const response = await context.request.get(`${origin}/api/kick-stream-map?geography=city&kc5-production-proof=${Date.now()}-${attempt}`, {
        headers: { accept: 'application/json', 'cache-control': 'no-cache' },
        timeout: 30_000,
      })
      let payload = null
      try { payload = await response.json() } catch {}
      last = { status: response.status(), payload }
      if (response.status() === 200 && payload?.publicCityActivationAuthorized === true && payload?.activation?.publicCityActivationReady === true) return payload
      if (attempt < 47) await new Promise((resolve) => setTimeout(resolve, 5_000))
    }
    throw new Error(`KC5 production API did not activate in time: ${JSON.stringify(last)}`)
  } finally {
    await context.close()
  }
}

function validateCityApi(payload, violations) {
  if (payload?.provider !== 'kick') violations.push({ scenario: 'city-api', violation: `provider ${payload?.provider}` })
  if (payload?.source !== 'real') violations.push({ scenario: 'city-api', violation: `source ${payload?.source}` })
  if (payload?.geographyMode !== 'city') violations.push({ scenario: 'city-api', violation: `geographyMode ${payload?.geographyMode}` })
  if (payload?.publicCityActivationAuthorized !== true) violations.push({ scenario: 'city-api', violation: 'publicCityActivationAuthorized is not true' })
  if (payload?.activation?.publicCityActivationReady !== true) violations.push({ scenario: 'city-api', violation: 'publicCityActivationReady is not true' })
  if (payload?.coverage?.reconciliation?.passes !== true) violations.push({ scenario: 'city-api', violation: 'City reconciliation failed' })
  if (payload?.identity?.stableKey !== 'broadcaster_user_id') violations.push({ scenario: 'city-api', violation: `stableKey ${payload?.identity?.stableKey}` })
  if (payload?.identity?.slugIsStableIdentity === true) violations.push({ scenario: 'city-api', violation: 'slug treated as stable identity' })
  if (payload?.semantics?.stableIdentityPublished === true) violations.push({ scenario: 'city-api', violation: 'stable identity publication semantic true' })
  if (payload?.semantics?.countryInferenceToCityAllowed === true) violations.push({ scenario: 'city-api', violation: 'Country -> City inference allowed' })
  if (payload?.semantics?.currentLocationUsedForBaseCity === true || payload?.semantics?.temporaryLocationUsedForBaseCity === true) violations.push({ scenario: 'city-api', violation: 'Current/temporary promoted to Base City' })
  if (payload?.semantics?.creatorCoordinatesAllowed === true || payload?.semantics?.preciseAddressAllowed === true) violations.push({ scenario: 'city-api', violation: 'creator precision allowed' })

  const observed = count(payload?.coverage?.observedStreams)
  const reconciled = count(payload?.coverage?.reconciliation?.reconciledPopulation)
  if (observed !== reconciled) violations.push({ scenario: 'city-api', violation: `reconciliation ${reconciled} != ${observed}` })

  for (const [bucket, rows] of Object.entries({
    mappedStreams: payload?.mappedStreams,
    unmappedStreams: payload?.unmappedStreams,
    excludedStreams: payload?.excludedStreams,
    conflictStreams: payload?.conflictStreams,
  })) {
    const forbidden = findForbiddenRowKeys(rows)
    if (forbidden.length) violations.push({ scenario: 'city-api', violation: `${bucket} forbidden keys: ${[...new Set(forbidden)].join(', ')}` })
  }

  const serialized = JSON.stringify(payload)
  for (const forbidden of ['"stableKickUserId"', '"broadcaster_user_id":', '"currentLocation"', '"current_location"', '"temporaryLocation"', '"temporary_location"']) {
    if (serialized.includes(forbidden)) violations.push({ scenario: 'city-api', violation: `serialized private field ${forbidden}` })
  }
}

async function auditCity(viewport, api) {
  const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height } })
  const page = await context.newPage()
  const pageErrors = []
  const consoleErrors = []
  const apiRequests = []
  page.on('pageerror', (error) => pageErrors.push(error.message))
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()) })
  page.on('request', (request) => {
    const url = new URL(request.url())
    if (url.pathname.startsWith('/api/')) apiRequests.push(`${url.pathname}${url.search}`)
  })

  const response = await page.goto(`${origin}/kick/map/?geography=city&kc5-production-proof=${encodeURIComponent(process.env.GITHUB_RUN_ID || 'manual')}-${viewport.id}`, { waitUntil: 'domcontentloaded', timeout: 45_000 })
  await page.waitForFunction(() => {
    const state = document.querySelector('[data-stream-map-state]')?.textContent?.trim()
    return state && state !== 'Loading'
  }, null, { timeout: 45_000 })
  await page.waitForFunction(() => {
    const state = document.querySelector('#stream-map-root')?.getAttribute('data-map-state')
    return state && state !== 'basemap-loading'
  }, null, { timeout: 45_000 })

  const facts = await page.evaluate(() => {
    const text = (selector) => document.querySelector(selector)?.textContent?.trim() ?? ''
    const number = (selector) => Number(text(selector).replace(/,/g, '')) || 0
    const map = document.querySelector('#stream-map-root')
    const rect = map instanceof HTMLElement ? map.getBoundingClientRect() : null
    const cityButton = document.querySelector('[data-kick-geography="city"]')
    return {
      title: document.title,
      h1: text('h1'),
      state: text('[data-stream-map-state]'),
      mapState: map?.getAttribute('data-map-state') ?? null,
      observed: number('#stream-map-observed'),
      mapped: number('#stream-map-mapped'),
      unmapped: number('#stream-map-unmapped'),
      canvasCount: document.querySelectorAll('#stream-map-root .maplibregl-canvas').length,
      controlCount: document.querySelectorAll('#stream-map-root .maplibregl-ctrl').length,
      creatorMarkers: document.querySelectorAll('#stream-map-root .maplibregl-marker').length,
      cityRows: document.querySelectorAll('#stream-map-country-list .stream-map-city-row').length,
      streamRows: document.querySelectorAll('#stream-map-stream-list .stream-map-stream-row').length,
      cityButtonDisabled: cityButton instanceof HTMLButtonElement ? cityButton.disabled : null,
      cityPressed: cityButton?.getAttribute('aria-pressed') ?? null,
      currentDisabled: Array.from(document.querySelectorAll('.stream-map-geography-options button')).some((button) => button.textContent?.trim() === 'Current / IRL' && button.hasAttribute('disabled')),
      overflow: Math.max(0, document.body.scrollWidth - document.body.clientWidth),
      mapRect: rect ? { width: Math.round(rect.width), height: Math.round(rect.height) } : { width: 0, height: 0 },
    }
  })

  const violations = []
  if (response?.status() !== 200) violations.push(`route returned ${response?.status() ?? 'null'}`)
  if (facts.title !== 'Stream Map for Kick live streams | ViewLoom') violations.push(`title ${facts.title}`)
  if (facts.h1 !== 'Stream Map') violations.push(`h1 ${facts.h1}`)
  if (facts.state !== (facts.observed === 0 ? 'Empty' : 'Ready')) violations.push(`state ${facts.state} for observed ${facts.observed}`)
  if (facts.cityButtonDisabled !== false || facts.cityPressed !== 'true') violations.push(`City control disabled/pressed ${facts.cityButtonDisabled}/${facts.cityPressed}`)
  if (facts.currentDisabled !== true) violations.push('Current / IRL control became enabled')
  if (facts.creatorMarkers !== 0) violations.push(`creator markers ${facts.creatorMarkers}`)
  if (facts.overflow > 2) violations.push(`horizontal overflow ${facts.overflow}px`)
  if (apiRequests.some((request) => /twitch/i.test(request))) violations.push(`Twitch API request ${apiRequests.join(', ')}`)
  if (!apiRequests.some((request) => request.startsWith('/api/kick-stream-map?geography=city'))) violations.push(`City API request missing ${apiRequests.join(', ')}`)
  if (pageErrors.length) violations.push(`page errors: ${pageErrors.join(' | ')}`)
  if (consoleErrors.length) violations.push(`console errors: ${consoleErrors.join(' | ')}`)

  const mapped = count(api?.coverage?.mappedStreams)
  const aggregateCount = count(api?.coverage?.mappedCityAggregateCount)
  const referenceCount = count(api?.coverage?.referenceGeometryAggregates)
  if (facts.mapped !== mapped) violations.push(`page mapped ${facts.mapped} != API ${mapped}`)
  if (facts.cityRows !== aggregateCount) violations.push(`City rows ${facts.cityRows} != API aggregates ${aggregateCount}`)
  if (facts.streamRows !== mapped) violations.push(`stream rows ${facts.streamRows} != mapped ${mapped}`)

  if (mapped === 0) {
    if (facts.mapState !== 'empty') violations.push(`zero-mapped map state ${facts.mapState}`)
    if (facts.canvasCount !== 0) violations.push(`zero-mapped canvas ${facts.canvasCount}`)
  } else if (referenceCount === 0) {
    if (facts.mapState !== 'list-only') violations.push(`list-only map state ${facts.mapState}`)
    if (facts.canvasCount !== 0) violations.push(`list-only canvas ${facts.canvasCount}`)
  } else {
    if (facts.mapState !== 'basemap-ready') violations.push(`reference map state ${facts.mapState}`)
    if (facts.canvasCount !== 1) violations.push(`reference canvas ${facts.canvasCount}`)
    if (facts.controlCount < 1) violations.push(`reference controls ${facts.controlCount}`)
    if (facts.mapRect.height < (viewport.width <= 390 ? 300 : 400)) violations.push(`reference map height ${facts.mapRect.height}px`)
  }

  const screenshot = `kick-city-kc5-production--${viewport.id}.png`
  await page.screenshot({ path: `${outputRoot}/${screenshot}`, fullPage: true })
  await context.close()
  return { id: `kick-city-kc5-production--${viewport.id}`, viewport, facts, apiRequests, pageErrors, consoleErrors, violations, screenshot }
}

function summarizeCityApi(payload) {
  return {
    state: payload?.state ?? null,
    updatedAt: payload?.updatedAt ?? null,
    publicCityActivationAuthorized: payload?.publicCityActivationAuthorized === true,
    publicCityActivationReady: payload?.activation?.publicCityActivationReady === true,
    observedStreams: count(payload?.coverage?.observedStreams),
    stableIdentityStreams: count(payload?.coverage?.stableIdentityStreams),
    reviewedIdentityStreams: count(payload?.coverage?.reviewedIdentityStreams),
    mappedStreams: count(payload?.coverage?.mappedStreams),
    mappedCityAggregateCount: count(payload?.coverage?.mappedCityAggregateCount),
    referenceGeometryAggregates: count(payload?.coverage?.referenceGeometryAggregates),
    listOnlyAggregates: count(payload?.coverage?.listOnlyAggregates),
    unmappedStreams: count(payload?.coverage?.unmappedStreams),
    excludedStreams: count(payload?.coverage?.excludedStreams),
    conflictStreams: count(payload?.coverage?.conflictStreams),
    reconciliationPasses: payload?.coverage?.reconciliation?.passes === true,
  }
}

function findForbiddenRowKeys(value, output = []) {
  if (Array.isArray(value)) {
    for (const item of value) findForbiddenRowKeys(item, output)
    return output
  }
  if (!value || typeof value !== 'object') return output
  for (const [key, child] of Object.entries(value)) {
    if (['stableKickUserId', 'broadcaster_user_id', 'currentLocation', 'current_location', 'temporaryLocation', 'temporary_location', 'address', 'coordinates', 'lat', 'lng', 'latitude', 'longitude'].includes(key)) output.push(key)
    findForbiddenRowKeys(child, output)
  }
  return output
}

function count(value) {
  const parsed = Number(value ?? 0)
  return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : 0
}
