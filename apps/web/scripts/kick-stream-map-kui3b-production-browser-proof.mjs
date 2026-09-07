import { mkdir, writeFile } from 'node:fs/promises'
import { chromium } from 'playwright'

const localOrigin = (process.env.KICK_MAP_PREVIEW_ORIGIN || 'http://127.0.0.1:4174').replace(/\/$/, '')
const productionOrigin = (process.env.KICK_MAP_PRODUCTION_ORIGIN || 'https://www.viewloom.net').replace(/\/$/, '')
const outputRoot = '/tmp/kick-stream-map-kui3b-production-browser-proof'
const viewports = [
  { id: 'desktop-1440', width: 1440, height: 1000 },
  { id: 'mobile-390', width: 390, height: 844 },
]
const forbiddenPublicKeys = new Set([
  'stableKickUserId',
  'broadcaster_user_id',
  'city',
  'latitude',
  'longitude',
  'coordinates',
  'currentLocation',
  'evidence',
  'sourceUrl',
])

await mkdir(outputRoot, { recursive: true })

const deployment = await fetchJson(`${productionOrigin}/deployment.json?kui3b=${Date.now()}`)
const productionPayload = await fetchJson(`${productionOrigin}/api/kick-stream-map?kui3b=${Date.now()}`)
const productionViolations = validateProductionPayload(productionPayload, deployment)
const expected = aggregateMappedCountries(productionPayload)
const browser = await chromium.launch({ headless: true })
const evidence = {
  schema: 'viewloom-kick-stream-map-kui3b-production-browser-proof-v2',
  result: 'running',
  production: {
    origin: productionOrigin,
    deploymentCommit: text(deployment?.commit_sha),
    deploymentEnvironment: text(deployment?.environment),
    updatedAt: text(productionPayload?.updatedAt),
    state: text(productionPayload?.state),
    publicActivationAuthorized: productionPayload?.publicActivationAuthorized === true,
    observedStreams: integer(productionPayload?.coverage?.observedStreams),
    stableIdentityStreams: integer(productionPayload?.coverage?.stableIdentityStreams),
    reviewedIdentityStreams: integer(productionPayload?.coverage?.reviewedIdentityStreams),
    mappedStreams: integer(productionPayload?.coverage?.mappedStreams),
    mappedViewers: integer(productionPayload?.coverage?.mappedViewers),
    mappedCountryCount: integer(productionPayload?.coverage?.mappedCountryCount),
    unmappedStreams: integer(productionPayload?.coverage?.unmappedStreams),
    excludedStreams: integer(productionPayload?.coverage?.excludedStreams),
    conflictStreams: integer(productionPayload?.coverage?.conflictStreams),
    reconciliationPasses: productionPayload?.coverage?.reconciliation?.passes === true,
    mappedCountryCodes: expected.countries.map((row) => row.countryCode),
    stableIdentityPublished: productionPayload?.semantics?.stableIdentityPublished === true,
  },
  productionViolations,
  scenarios: [],
  violations: [...productionViolations],
}

try {
  for (const viewport of viewports) {
    const scenario = await auditAuthorizedProductionPreview(browser, productionPayload, viewport)
    evidence.scenarios.push(scenario)
    evidence.violations.push(...scenario.violations.map((violation) => `${scenario.id}: ${violation}`))
  }

  evidence.result = evidence.violations.length === 0 ? 'pass' : 'fail'
  evidence.counts = {
    viewports: viewports.length,
    scenarios: evidence.scenarios.length,
    violations: evidence.violations.length,
  }
  await writeFile(`${outputRoot}/evidence.json`, `${JSON.stringify(evidence, null, 2)}\n`)
  console.log(JSON.stringify({
    result: evidence.result,
    production: evidence.production,
    counts: evidence.counts,
    violations: evidence.violations,
  }, null, 2))
  if (evidence.result !== 'pass') process.exitCode = 1
} finally {
  await browser.close()
}

async function auditAuthorizedProductionPreview(browser, payload, viewport) {
  const id = `authorized-production--${viewport.id}`
  const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height } })
  const page = await context.newPage()
  const apiRequests = []
  const pageErrors = []
  const consoleErrors = []

  page.on('request', (request) => {
    const url = new URL(request.url())
    if (url.pathname.startsWith('/api/')) apiRequests.push(`${url.pathname}${url.search}`)
  })
  page.on('pageerror', (error) => pageErrors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text())
  })

  await page.route('**/api/kick-stream-map*', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(payload) })
  })

  const response = await page.goto(`${localOrigin}/preview/kick-stream-map/`, {
    waitUntil: 'domcontentloaded',
    timeout: 45_000,
  })
  await page.waitForFunction(() => {
    const value = document.querySelector('[data-kick-preview-state]')?.textContent?.trim()
    return value && value !== 'Loading'
  }, { timeout: 20_000 })

  const mappedAvailable = integer(payload?.coverage?.mappedStreams) > 0
  if (mappedAvailable) {
    await page.locator('[data-kick-preview-map] .maplibregl-canvas').waitFor({ state: 'visible', timeout: 20_000 })
  }

  const facts = await readFacts(page)
  const violations = []
  if (response?.status() !== 200) violations.push(`local preview returned ${response?.status() ?? 'null'}`)
  if (facts.robots !== 'noindex,nofollow') violations.push(`robots mismatch: ${facts.robots}`)
  if (facts.canonical !== null) violations.push(`canonical must remain absent: ${facts.canonical}`)
  if (facts.publicKickMapLinks !== 0) violations.push(`public /kick/map/ links: ${facts.publicKickMapLinks}`)
  if (facts.overflow > 2) violations.push(`horizontal overflow ${facts.overflow}px`)
  if (facts.markerCount !== 0) violations.push(`creator marker semantics present: ${facts.markerCount}`)
  if (apiRequests.some((request) => /twitch/i.test(request))) violations.push(`Twitch API request: ${apiRequests.join(', ')}`)
  if (pageErrors.length) violations.push(`page errors: ${pageErrors.join(' | ')}`)
  if (consoleErrors.length) violations.push(`console errors: ${consoleErrors.join(' | ')}`)

  if (mappedAvailable) {
    if (facts.state !== 'country_ready_for_preview') violations.push(`authorized state ${facts.state}`)
    if (!facts.mapVisible) violations.push('authorized map hidden')
    if (!facts.resultsVisible) violations.push('authorized results hidden')
    if (facts.canvasCount !== 1) violations.push(`authorized canvas count ${facts.canvasCount}`)
    if (facts.metricDisabled) violations.push('authorized metric disabled')
    if (facts.mappedCount !== integer(payload?.coverage?.mappedStreams)) violations.push(`mapped count ${facts.mappedCount}`)
    if (facts.excludedCount !== integer(payload?.coverage?.excludedStreams)) violations.push(`excluded count ${facts.excludedCount}`)
    if (facts.conflictCount !== integer(payload?.coverage?.conflictStreams)) violations.push(`conflict count ${facts.conflictCount}`)
    if (facts.streamRowCount !== integer(payload?.coverage?.mappedStreams)) violations.push(`stream row count ${facts.streamRowCount}`)
    if (JSON.stringify(facts.countryCodes) !== JSON.stringify(expected.countries.map((row) => row.countryCode))) {
      violations.push(`country codes ${JSON.stringify(facts.countryCodes)}`)
    }
    for (const target of facts.actionTargets) {
      if (target.height < 44) violations.push(`action target below 44px: ${target.name} ${target.height}px`)
    }
  } else {
    if (facts.state !== 'country_empty') violations.push(`empty authorized state ${facts.state}`)
    if (facts.mapVisible || facts.canvasCount !== 0) violations.push('empty authorized snapshot created map')
    if (facts.resultsVisible) violations.push('empty authorized snapshot rendered Country results')
    if (!facts.metricDisabled) violations.push('empty authorized snapshot enabled metric')
  }

  const screenshot = `${id}.png`
  await page.screenshot({ path: `${outputRoot}/${screenshot}`, fullPage: true })
  await context.close()
  return {
    id,
    viewport,
    apiRequests,
    facts,
    pageErrors,
    consoleErrors,
    violations,
    screenshot,
  }
}

function validateProductionPayload(payload, deployment) {
  const violations = []
  if (text(deployment?.environment) !== 'production') violations.push(`deployment environment ${text(deployment?.environment)}`)
  if (text(deployment?.branch) !== 'main') violations.push(`deployment branch ${text(deployment?.branch)}`)
  if (text(payload?.version) !== 'viewloom-kick-stream-map-country-runtime-v0.1') violations.push(`version ${text(payload?.version)}`)
  if (text(payload?.implementationState) !== 'reviewed_country_runtime_connected') violations.push(`implementationState ${text(payload?.implementationState)}`)
  if (text(payload?.provider) !== 'kick' || text(payload?.platform) !== 'kick') violations.push('provider/platform mismatch')
  if (text(payload?.source) !== 'real') violations.push(`source ${text(payload?.source)}`)
  if (text(payload?.geographyMode) !== 'country') violations.push(`geographyMode ${text(payload?.geographyMode)}`)
  if (payload?.publicActivationAuthorized !== true) violations.push('K4 public activation must be authorized')
  if (payload?.activation?.publicCountryActivationReady !== true) violations.push('Country public readiness must be true')
  if (!Array.isArray(payload?.activation?.blockers)) {
    violations.push('activation blockers must be an array')
  } else if (payload.activation.blockers.includes('public_country_activation_not_authorized')) {
    violations.push('stale K4 authorization blocker present')
  }
  if (payload?.semantics?.reviewedEvidenceRuntimeConnected !== true) violations.push('reviewedEvidenceRuntimeConnected must be true')
  if (payload?.semantics?.stableIdentityPublished !== false) violations.push('stableIdentityPublished must be false')
  if (payload?.semantics?.twitchEvidenceReuseAllowed !== false) violations.push('Twitch evidence reuse boundary changed')
  if (payload?.semantics?.providerAggregationAllowed !== false) violations.push('provider aggregation boundary changed')
  if (payload?.semantics?.cityInferenceAllowed !== false) violations.push('City inference boundary changed')
  if (payload?.semantics?.currentLocationPromotionAllowed !== false) violations.push('Current promotion boundary changed')
  if (integer(payload?.coverage?.observedStreams) <= 0) violations.push('production snapshot is empty')
  if (integer(payload?.coverage?.stableIdentityStreams) !== integer(payload?.coverage?.observedStreams)) violations.push('stable identity coverage is not complete')
  if (integer(payload?.coverage?.reviewedEvidenceCatalogSize) !== 100) violations.push(`review catalog size ${integer(payload?.coverage?.reviewedEvidenceCatalogSize)}`)
  if (payload?.coverage?.reconciliation?.passes !== true) violations.push('production reconciliation failed')

  const keys = collectKeys(payload)
  for (const key of forbiddenPublicKeys) {
    if (keys.has(key)) violations.push(`forbidden public key ${key}`)
  }

  const aggregate = aggregateMappedCountries(payload)
  if (aggregate.streams !== integer(payload?.coverage?.mappedStreams)) violations.push(`mapped stream accounting ${aggregate.streams}`)
  if (aggregate.viewers !== integer(payload?.coverage?.mappedViewers)) violations.push(`mapped viewer accounting ${aggregate.viewers}`)
  if (aggregate.countries.length !== integer(payload?.coverage?.mappedCountryCount)) violations.push(`mapped Country accounting ${aggregate.countries.length}`)

  return violations
}

function aggregateMappedCountries(payload) {
  const countries = new Map()
  let streams = 0
  let viewersTotal = 0
  for (const raw of Array.isArray(payload?.mappedStreams) ? payload.mappedStreams : []) {
    const code = text(raw?.geography?.countryCode).toUpperCase()
    if (raw?.geography?.state !== 'mapped' || !/^[A-Z]{2}$/.test(code)) continue
    const viewers = integer(raw?.viewers)
    streams += 1
    viewersTotal += viewers
    const current = countries.get(code) || { countryCode: code, streams: 0, viewers: 0 }
    current.streams += 1
    current.viewers += viewers
    countries.set(code, current)
  }
  return {
    streams,
    viewers: viewersTotal,
    countries: [...countries.values()].sort((a, b) => b.viewers - a.viewers || b.streams - a.streams || a.countryCode.localeCompare(b.countryCode)),
  }
}

function collectKeys(value, target = new Set()) {
  if (Array.isArray(value)) {
    for (const item of value) collectKeys(item, target)
    return target
  }
  if (!value || typeof value !== 'object') return target
  for (const [key, child] of Object.entries(value)) {
    target.add(key)
    collectKeys(child, target)
  }
  return target
}

async function readFacts(page) {
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
    const targets = Array.from(document.querySelectorAll('[data-kick-preview-metric], [data-kick-preview-world], .kick-map-preview__country-row'))
      .filter((node) => node instanceof HTMLElement && !node.hidden && getComputedStyle(node).display !== 'none')
      .map((node) => {
        const rect = node.getBoundingClientRect()
        return {
          name: node.getAttribute('aria-label') || node.textContent?.trim() || node.tagName,
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        }
      })
    return {
      robots: document.querySelector('meta[name="robots"]')?.getAttribute('content') ?? null,
      canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? null,
      publicKickMapLinks: document.querySelectorAll('a[href="/kick/map/"]').length,
      overflow: Math.max(0, document.body.scrollWidth - document.body.clientWidth),
      state: text('[data-kick-preview-state]'),
      mapVisible: visible('[data-kick-preview-map]'),
      resultsVisible: visible('[data-kick-preview-country-results]'),
      metricDisabled: document.querySelector('[data-kick-preview-metric]')?.disabled ?? true,
      mappedCount: count('[data-kick-preview-mapped]'),
      excludedCount: count('[data-kick-preview-excluded]'),
      conflictCount: count('[data-kick-preview-conflicts]'),
      countryCodes: Array.from(document.querySelectorAll('.kick-map-preview__country-row[data-country-code]')).map((node) => node.getAttribute('data-country-code')),
      streamRowCount: document.querySelectorAll('[data-kick-preview-streams] .kick-map-preview__stream-row').length,
      canvasCount: document.querySelectorAll('[data-kick-preview-map] .maplibregl-canvas').length,
      markerCount: document.querySelectorAll('[data-kick-preview-map] .maplibregl-marker').length,
      actionTargets: targets,
    }
  })
}

async function fetchJson(url) {
  const response = await fetch(url, { headers: { accept: 'application/json' }, cache: 'no-store' })
  if (!response.ok) throw new Error(`${url} returned HTTP ${response.status}`)
  return response.json()
}

function text(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function integer(value) {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0
}
