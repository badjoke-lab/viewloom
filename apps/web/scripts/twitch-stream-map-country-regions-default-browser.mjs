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
      name: 'ViewLoom Country regions final CI',
      sources: {},
      layers: [{ id: 'background', type: 'background', paint: { 'background-color': '#111111' } }],
    }),
  })
})

await page.route('**/api/twitch-stream-map**', async (route) => {
  const mappedStreams = [
    {
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
    },
    {
      login: 'fixture_sg',
      displayName: 'Fixture SG',
      viewers: 300,
      url: 'https://www.twitch.tv/fixture_sg',
      entityKind: 'person',
      location: {
        countryCode: 'SG',
        countryName: 'Singapore',
        regions: [],
        cities: [],
        locationTypes: ['declared_location'],
      },
      evidence: [{
        source: 'account_profile',
        sourceUrl: null,
        observedAt: '2026-09-04T00:00:00.000Z',
        countryCode: 'SG',
        countryName: 'Singapore',
        region: null,
        city: null,
        locationType: 'declared_location',
        confidence: 'reviewed',
      }],
      sources: ['account_profile'],
    },
  ]

  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      version: 'viewloom-stream-map-live-v1',
      platform: 'twitch',
      source: 'real',
      sourceMode: 'country-regions-final-browser-fixture',
      updatedAt: '2026-09-04T00:00:00.000Z',
      coverage: {
        topLimit: 300,
        observedStreams: 2,
        observedViewers: 1500,
        mappedStreams: 2,
        unmappedStreams: 0,
        eligibleUnmappedStreams: 0,
        excludedNonPersonStreams: 0,
        mappedViewers: 1500,
        unmappedViewers: 0,
        excludedNonPersonViewers: 0,
        mappedPercent: 1,
        mappedViewerPercent: 1,
        mappedCountryCount: 2,
        currentLocationStreams: 0,
        currentLocationPercent: 0,
        coveredPages: 1,
        hasMore: false,
        mappedBySource: { manual_review: 1, account_profile: 1 },
        unmappedReasons: {},
      },
      populationFilter: {
        implementationState: 'public',
        order: ['overall_top_n', 'minimum_viewers', 'category', 'location_evidence'],
        baseObservedStreams: 2,
        selectedTop: 300,
        minViewers: 0,
        selectedCategory: 'all',
        selectedCategoryName: null,
        categoryState: 'all',
        categoryAvailable: true,
        categoryCoverageState: 'observed',
        categoryContractVersion: null,
        topScopedStreams: 2,
        preCategoryStreams: 2,
        preCategoryViewers: 1500,
        selectedPopulationStreams: 2,
        selectedPopulationViewers: 1500,
        unknownCategoryStreams: 0,
        dictionaryMissingItems: 0,
        availableCategories: [],
        languageFilterAvailable: false,
        languageUsedForPopulationFiltering: false,
      },
      mappedStreams,
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
  await page.locator('#stream-map-root[data-map-state="basemap-ready"]').waitFor({ timeout: 15000 })
  await page.locator('.stream-map-country-row').first().waitFor({ timeout: 10000 })
  await page.locator('.stream-map-region-controls__status').filter({ hasText: 'Country regions ready' }).waitFor({ timeout: 10000 })

  assert.equal(await page.locator('[data-map-view]').count(), 0)
  assert.equal(await page.locator('[data-stream-map-region-controls]').count(), 1)
  assert.equal(await page.locator('.stream-map-region-controls__metric').isVisible(), true)

  const state = await page.evaluate(() => {
    const map = window.__viewloomCountryRegionMap
    const usMarker = document.querySelector('.stream-map-country-marker[data-country-code="US"]')
    const sgMarker = document.querySelector('.stream-map-country-marker[data-country-code="SG"]')
    return {
      sourceAvailable: Boolean(map?.getSource?.('viewloom-country-regions')),
      fillLayerAvailable: Boolean(map?.getLayer?.('viewloom-country-regions-fill')),
      fillVisibility: map?.getLayoutProperty?.('viewloom-country-regions-fill', 'visibility') || null,
      usMarkerDisplay: usMarker ? getComputedStyle(usMarker).display : null,
      sgMarkerDisplay: sgMarker ? getComputedStyle(sgMarker).display : null,
      sgFallback: Boolean(sgMarker?.classList.contains('stream-map-country-marker--region-fallback')),
      regionsActive: document.documentElement.classList.contains('stream-map-country-regions-active'),
    }
  })

  assert.equal(state.sourceAvailable, true)
  assert.equal(state.fillLayerAvailable, true)
  assert.equal(state.fillVisibility, 'visible')
  assert.equal(state.usMarkerDisplay, 'none')
  assert.notEqual(state.sgMarkerDisplay, 'none')
  assert.equal(state.sgFallback, true)
  assert.equal(state.regionsActive, true)

  await page.locator('.stream-map-region-controls__metric select').selectOption('viewers')
  assert.equal(await page.locator('.stream-map-region-controls__metric select').inputValue(), 'viewers')

  assert.equal(pageErrors.length, 0, `page errors: ${pageErrors.join(' | ')}`)
  assert.equal(consoleErrors.length, 0, `console errors: ${consoleErrors.join(' | ')}`)

  console.log(JSON.stringify({ defaultView: 'regions-only', state, pageErrors, consoleErrors }))
} finally {
  await browser.close()
}
