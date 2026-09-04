import assert from 'node:assert/strict'
import { chromium } from 'playwright'

const baseUrl = process.env.STREAM_MAP_BASE_URL || 'http://127.0.0.1:4173'
const browser = await chromium.launch({
  headless: true,
  args: ['--enable-webgl', '--use-gl=angle', '--use-angle=swiftshader', '--disable-gpu-sandbox'],
})
const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
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
      name: 'ViewLoom mobile Country world CI',
      sources: {},
      layers: [{ id: 'background', type: 'background', paint: { 'background-color': '#111111' } }],
    }),
  })
})

await page.route('**/api/twitch-stream-map**', async (route) => {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      version: 'viewloom-stream-map-live-v1',
      platform: 'twitch',
      source: 'real',
      sourceMode: 'mobile-country-world-browser-fixture',
      updatedAt: '2026-09-04T00:00:00.000Z',
      coverage: {
        topLimit: 300,
        observedStreams: 1,
        observedViewers: 1200,
        mappedStreams: 1,
        unmappedStreams: 0,
        eligibleUnmappedStreams: 0,
        excludedNonPersonStreams: 0,
        mappedViewers: 1200,
        unmappedViewers: 0,
        excludedNonPersonViewers: 0,
        mappedPercent: 1,
        mappedViewerPercent: 1,
        mappedCountryCount: 1,
        currentLocationStreams: 0,
        currentLocationPercent: 0,
        coveredPages: 1,
        hasMore: false,
        mappedBySource: { manual_review: 1 },
        unmappedReasons: {},
      },
      populationFilter: {
        implementationState: 'public',
        order: ['overall_top_n', 'minimum_viewers', 'category', 'location_evidence'],
        baseObservedStreams: 1,
        selectedTop: 300,
        minViewers: 0,
        selectedCategory: 'all',
        selectedCategoryName: null,
        categoryState: 'all',
        categoryAvailable: true,
        categoryCoverageState: 'observed',
        categoryContractVersion: null,
        topScopedStreams: 1,
        preCategoryStreams: 1,
        preCategoryViewers: 1200,
        selectedPopulationStreams: 1,
        selectedPopulationViewers: 1200,
        unknownCategoryStreams: 0,
        dictionaryMissingItems: 0,
        availableCategories: [],
        languageFilterAvailable: false,
        languageUsedForPopulationFiltering: false,
      },
      mappedStreams: [{
        login: 'fixture_us',
        displayName: 'Fixture US',
        viewers: 1200,
        url: 'https://www.twitch.tv/fixture_us',
        entityKind: 'person',
        location: {
          countryCode: 'US',
          countryName: 'United States',
          regions: [],
          cities: [],
          locationTypes: ['home_base'],
        },
        evidence: [{
          source: 'manual_review',
          sourceUrl: null,
          observedAt: '2026-09-04T00:00:00.000Z',
          countryCode: 'US',
          countryName: 'United States',
          region: null,
          city: null,
          locationType: 'home_base',
          confidence: 'reviewed',
        }],
        sources: ['manual_review'],
      }],
      excludedNonPersonStreams: [],
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
  await page.goto(`${baseUrl}/twitch/map/`, { waitUntil: 'domcontentloaded' })
  await page.locator('#stream-map-root[data-map-state="basemap-ready"][data-country-camera="world"][data-country-camera-mode="explicit-world-view"]').waitFor({ timeout: 15000 })
  await page.locator('[data-country-world-view]').waitFor({ timeout: 10000 })

  const result = await page.evaluate(() => ({
    zoom: window.__viewloomCountryRegionMap.getZoom(),
    minZoom: window.__viewloomCountryRegionMap.getMinZoom(),
    maxZoom: window.__viewloomCountryRegionMap.getMaxZoom(),
    regionsActive: document.documentElement.classList.contains('stream-map-country-regions-active'),
    compactUi: document.documentElement.classList.contains('stream-map-country-ui-v2'),
    usMarkerDisplay: getComputedStyle(document.querySelector('.stream-map-country-marker[data-country-code="US"]')).display,
    mapViewButtons: document.querySelectorAll('[data-map-view]').length,
  }))

  assert.ok(Math.abs(result.zoom) < 0.08, `mobile world overview should use zoom 0, got ${result.zoom}`)
  assert.equal(result.minZoom, 0)
  assert.ok(result.maxZoom <= 4.2)
  assert.equal(result.regionsActive, true)
  assert.equal(result.compactUi, true)
  assert.equal(result.usMarkerDisplay, 'none')
  assert.equal(result.mapViewButtons, 0)
  assert.equal(pageErrors.length, 0, `page errors: ${pageErrors.join(' | ')}`)
  assert.equal(consoleErrors.length, 0, `console errors: ${consoleErrors.join(' | ')}`)

  console.log(JSON.stringify({ result, pageErrors, consoleErrors }))
} finally {
  await browser.close()
}
