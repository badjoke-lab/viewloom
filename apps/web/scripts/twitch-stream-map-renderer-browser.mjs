import assert from 'node:assert/strict'
import { chromium } from 'playwright'

const baseUrl = process.env.STREAM_MAP_BASE_URL || 'http://127.0.0.1:4173'
const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
const pageErrors = []
page.on('pageerror', (error) => pageErrors.push(error.message))

await page.route('https://tiles.openfreemap.org/styles/dark', async (route) => {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ version: 8, sources: {}, layers: [] }),
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
      sourceMode: 'browser-regression-fixture',
      updatedAt: '2026-08-30T00:00:00.000Z',
      coverage: {
        topLimit: 300,
        observedStreams: 0,
        observedViewers: 0,
        mappedStreams: 0,
        unmappedStreams: 0,
        eligibleUnmappedStreams: 0,
        excludedNonPersonStreams: 0,
        mappedViewers: 0,
        unmappedViewers: 0,
        excludedNonPersonViewers: 0,
        mappedPercent: 0,
        mappedViewerPercent: 0,
        mappedCountryCount: 0,
        currentLocationStreams: 0,
        currentLocationPercent: 0,
        coveredPages: 0,
        hasMore: false,
        mappedBySource: {},
        unmappedReasons: {},
      },
      populationFilter: {
        implementationState: 'public',
        order: ['overall_top_n', 'minimum_viewers', 'category', 'location_evidence'],
        baseObservedStreams: 0,
        selectedTop: 300,
        minViewers: 0,
        selectedCategory: 'all',
        selectedCategoryName: null,
        categoryState: 'all',
        categoryAvailable: true,
        categoryCoverageState: 'observed',
        categoryContractVersion: null,
        topScopedStreams: 0,
        preCategoryStreams: 0,
        preCategoryViewers: 0,
        selectedPopulationStreams: 0,
        selectedPopulationViewers: 0,
        unknownCategoryStreams: 0,
        dictionaryMissingItems: 0,
        availableCategories: [],
        languageFilterAvailable: false,
        languageUsedForPopulationFiltering: false,
      },
      mappedStreams: [],
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
      state: 'empty',
    }),
  })
})

try {
  await page.goto(`${baseUrl}/twitch/map/`, { waitUntil: 'domcontentloaded' })
  await page.locator('#stream-map-root[data-map-state="basemap-ready"]').waitFor({ timeout: 15000 })

  const rendererState = await page.locator('#stream-map-root').getAttribute('data-map-state')
  const canvasCount = await page.locator('#stream-map-root canvas.maplibregl-canvas').count()
  const rendererAvailable = await page.evaluate(() => Boolean(window.maplibregl?.Map))

  assert.equal(rendererState, 'basemap-ready')
  assert.equal(canvasCount, 1)
  assert.equal(rendererAvailable, true)
  assert.equal(pageErrors.length, 0, `page errors: ${pageErrors.join(' | ')}`)

  console.log(JSON.stringify({ rendererState, canvasCount, rendererAvailable, pageErrors }))
} finally {
  await browser.close()
}
