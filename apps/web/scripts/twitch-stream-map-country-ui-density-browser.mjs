import assert from 'node:assert/strict'
import { chromium } from 'playwright'

const baseUrl = process.env.STREAM_MAP_BASE_URL || 'http://127.0.0.1:4173'
const browser = await chromium.launch({
  headless: true,
  args: ['--enable-webgl', '--use-gl=angle', '--use-angle=swiftshader', '--disable-gpu-sandbox'],
})
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
const pageErrors = []
const consoleErrors = []
page.on('pageerror', (error) => pageErrors.push(error.stack || error.message))
page.on('console', (message) => {
  if (message.type() === 'error') consoleErrors.push(message.text())
})

await page.route('**/styles/dark*', async (route) => {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      version: 8,
      name: 'ViewLoom Country UI density CI',
      sources: {},
      layers: [{ id: 'background', type: 'background', paint: { 'background-color': '#111111' } }],
    }),
  })
})

await page.route('**/api/twitch-stream-map**', async (route) => {
  const mappedStreams = [
    stream('fixture_us_a', 'Fixture US A', 1200, 'US', 'United States', 'manual_review', 'home_base'),
    stream('fixture_us_b', 'Fixture US B', 800, 'US', 'United States', 'account_profile', 'declared_location'),
    stream('fixture_sg', 'Fixture SG', 300, 'SG', 'Singapore', 'account_profile', 'declared_location'),
  ]

  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      version: 'viewloom-stream-map-live-v1',
      platform: 'twitch',
      source: 'real',
      sourceMode: 'country-ui-density-browser-fixture',
      updatedAt: '2026-09-05T00:00:00.000Z',
      coverage: {
        topLimit: 300,
        observedStreams: 5,
        observedViewers: 2900,
        mappedStreams: 3,
        unmappedStreams: 2,
        eligibleUnmappedStreams: 1,
        excludedNonPersonStreams: 1,
        mappedViewers: 2300,
        unmappedViewers: 600,
        excludedNonPersonViewers: 500,
        mappedPercent: 0.6,
        mappedViewerPercent: 0.793103,
        mappedCountryCount: 2,
        currentLocationStreams: 0,
        currentLocationPercent: 0,
        coveredPages: 1,
        hasMore: false,
        mappedBySource: { manual_review: 1, account_profile: 2 },
        unmappedReasons: { no_reviewed_location_evidence: 1, excluded_non_person: 1 },
      },
      populationFilter: {
        implementationState: 'public',
        order: ['overall_top_n', 'minimum_viewers', 'category', 'location_evidence'],
        baseObservedStreams: 5,
        selectedTop: 300,
        minViewers: 0,
        selectedCategory: 'all',
        selectedCategoryName: null,
        categoryState: 'all',
        categoryAvailable: true,
        categoryCoverageState: 'observed',
        categoryContractVersion: null,
        topScopedStreams: 5,
        preCategoryStreams: 5,
        preCategoryViewers: 2900,
        selectedPopulationStreams: 5,
        selectedPopulationViewers: 2900,
        unknownCategoryStreams: 0,
        dictionaryMissingItems: 0,
        availableCategories: [],
        languageFilterAvailable: false,
        languageUsedForPopulationFiltering: false,
      },
      mappedStreams,
      excludedNonPersonStreams: [{
        login: 'fixture_event',
        displayName: 'Fixture Event',
        viewers: 500,
        url: 'https://www.twitch.tv/fixture_event',
        entityKind: 'event_broadcast',
      }],
      semantics: {
        languageUsedForPlacement: false,
        candidateOnlyPlacementAllowed: false,
        nonPersonPlacementAllowed: false,
        conflictingAcceptedCountriesAreMapped: false,
        mappedPlusUnmappedEqualsObserved: true,
        excludedNonPersonIsSubsetOfUnmapped: true,
        evidenceSourcesRemainDistinct: true,
        populationFilterBeforeEvidenceFilter: true,
        languageUsedForPopulationFiltering: false,
      },
      state: 'ready',
    }),
  })
})

try {
  await openCandidate()

  assert.equal(await page.locator('html.stream-map-country-ui-v2').count(), 1)
  assert.equal(await page.locator('[data-country-metric]').count(), 2)
  assert.equal(await page.locator('.stream-map-country-legend i').count(), 5)
  assert.equal(await page.locator('[data-country-world-view]').isVisible(), true)

  const order = await page.evaluate(() => {
    const shell = document.querySelector('.stream-map-shell')
    const selected = document.querySelector('#stream-map-selected-country')
    const results = document.querySelector('.stream-map-results')
    const unmapped = document.querySelector('.stream-map-unmapped')
    const before = (a, b) => Boolean(a && b && (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING))
    return {
      supportInsideMap: Boolean(shell?.querySelector('.stream-map-support-grid')),
      mapBeforeSelected: before(shell, selected),
      selectedBeforeResults: before(selected, results),
      resultsBeforeUnmapped: before(results, unmapped),
    }
  })
  assert.deepEqual(order, {
    supportInsideMap: true,
    mapBeforeSelected: true,
    selectedBeforeResults: true,
    resultsBeforeUnmapped: true,
  })

  const initialZoom = await page.evaluate(() => window.__viewloomCountryRegionMap.getZoom())
  const point = await findRenderedCountryPoint('US')
  assert.ok(point, 'could not find a rendered US Country-region pixel')
  await page.mouse.click(point.x, point.y)
  await page.locator('.stream-map-country-row[data-country-code="US"][aria-pressed="true"]').waitFor({ timeout: 10000 })
  await page.locator('#stream-map-selected-country:not([hidden])').waitFor({ timeout: 10000 })
  await page.waitForTimeout(200)
  const afterMapClickZoom = await page.evaluate(() => window.__viewloomCountryRegionMap.getZoom())
  assert.ok(Math.abs(afterMapClickZoom - initialZoom) < 0.08, `map click changed zoom: ${initialZoom} -> ${afterMapClickZoom}`)
  assert.match(await page.locator('[data-selected-country-summary]').textContent(), /2 streams · 2,000 viewers/)

  await page.locator('[data-country-metric="viewers"]').click()
  assert.equal(await page.locator('[data-country-metric="viewers"]').getAttribute('aria-pressed'), 'true')
  assert.equal(await page.locator('.stream-map-region-controls__metric select').inputValue(), 'viewers')

  await page.waitForFunction(() => document.querySelectorAll('.stream-map-evidence-details').length >= 2)
  const evidenceState = await page.evaluate(() => ({
    details: document.querySelectorAll('.stream-map-evidence-details').length,
    open: document.querySelectorAll('.stream-map-evidence-details[open]').length,
  }))
  assert.ok(evidenceState.details >= 2)
  assert.equal(evidenceState.open, 0)

  const desktopDensity = await page.evaluate(() => {
    const grid = document.querySelector('.stream-map-results-grid')
    const streams = document.querySelector('#stream-map-stream-list')
    const controls = document.querySelector('.stream-map-population-control select')
    return {
      resultsHeight: Math.round(grid.getBoundingClientRect().height),
      streamOverflow: getComputedStyle(streams).overflowY,
      selectHeight: Math.round(controls.getBoundingClientRect().height),
    }
  })
  assert.ok(desktopDensity.resultsHeight >= 400 && desktopDensity.resultsHeight <= 440, `unexpected results height: ${desktopDensity.resultsHeight}`)
  assert.equal(['auto', 'scroll'].includes(desktopDensity.streamOverflow), true)
  assert.ok(desktopDensity.selectHeight <= 36, `population select too tall: ${desktopDensity.selectHeight}`)

  assert.equal(await page.locator('.stream-map-unmapped').getAttribute('class').then((value) => value.includes('is-expanded')), false)
  assert.equal(await page.locator('.stream-map-unmapped-grid').isVisible(), false)
  assert.match(await page.locator('[data-unmapped-compact-summary]').textContent(), /2 unmapped/)
  await page.locator('[data-unmapped-details-toggle]').click()
  assert.equal(await page.locator('.stream-map-unmapped-grid').isVisible(), true)

  await page.setViewportSize({ width: 390, height: 844 })
  await page.reload({ waitUntil: 'domcontentloaded' })
  await openCandidate(false)
  assert.equal(await page.locator('[data-stream-map-filter-toggle]').isVisible(), true)
  assert.equal(await page.locator('.stream-map-population-panel').isVisible(), false)
  await page.locator('[data-stream-map-filter-toggle]').click()
  assert.equal(await page.locator('.stream-map-population-panel').isVisible(), true)
  assert.equal(await page.locator('.stream-map-filter-panel').isVisible(), true)

  const mobileZoom = await page.evaluate(() => window.__viewloomCountryRegionMap.getZoom())
  assert.ok(Math.abs(mobileZoom) < 0.12, `mobile world overview is not zoom 0: ${mobileZoom}`)
  const mobileMapHeight = await page.locator('.stream-map-stage').evaluate((node) => Math.round(node.getBoundingClientRect().height))
  assert.ok(mobileMapHeight <= 350, `mobile map too tall: ${mobileMapHeight}`)

  assert.equal(pageErrors.length, 0, `page errors: ${pageErrors.join(' | ')}`)
  assert.equal(consoleErrors.length, 0, `console errors: ${consoleErrors.join(' | ')}`)

  console.log(JSON.stringify({ order, initialZoom, afterMapClickZoom, desktopDensity, evidenceState, mobileZoom, mobileMapHeight, pageErrors, consoleErrors }))
} finally {
  await browser.close()
}

async function openCandidate(navigate = true) {
  if (navigate) await page.goto(`${baseUrl}/twitch/map/`, { waitUntil: 'domcontentloaded' })
  await page.locator('#stream-map-root[data-map-state="basemap-ready"]').waitFor({ timeout: 15000 })
  await page.locator('.stream-map-country-row[data-country-code="US"]').waitFor({ timeout: 10000 })
  await page.locator('[data-country-world-view]').waitFor({ timeout: 10000 })
  await page.waitForFunction(() => Boolean(window.__viewloomCountryRegionMap?.getLayer?.('viewloom-country-regions-fill')))
}

async function findRenderedCountryPoint(countryCode) {
  return page.evaluate((code) => {
    const map = window.__viewloomCountryRegionMap
    const root = document.querySelector('#stream-map-root')
    if (!map || !root) return null
    const rect = root.getBoundingClientRect()
    const canvas = map.getCanvas()
    const width = canvas.clientWidth
    const height = canvas.clientHeight
    const layer = 'viewloom-country-regions-fill'
    for (let y = 12; y < height - 12; y += 6) {
      for (let x = 12; x < width - 12; x += 6) {
        const features = map.queryRenderedFeatures([x, y], { layers: [layer] })
        if (features.some((feature) => feature.properties?.viewloomCountryCode === code)) {
          return { x: rect.left + x, y: rect.top + y }
        }
      }
    }
    return null
  }, countryCode)
}

function stream(login, displayName, viewers, countryCode, countryName, source, locationType) {
  return {
    login,
    displayName,
    viewers,
    url: `https://www.twitch.tv/${login}`,
    entityKind: 'person',
    location: {
      countryCode,
      countryName,
      regions: [],
      cities: [],
      locationTypes: [locationType],
    },
    evidence: [{
      source,
      sourceUrl: null,
      observedAt: '2026-09-05T00:00:00.000Z',
      countryCode,
      countryName,
      region: null,
      city: null,
      locationType,
      confidence: 'reviewed',
    }],
    sources: [source],
  }
}
