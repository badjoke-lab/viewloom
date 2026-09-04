import assert from 'node:assert/strict'
import { chromium } from 'playwright'

const baseUrl = process.env.STREAM_MAP_BASE_URL || 'http://127.0.0.1:4173'
const useRealBasemap = process.env.STREAM_MAP_REAL_BASEMAP === '1'
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

if (!useRealBasemap) {
  await page.route('**/styles/dark*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        version: 8,
        name: 'ViewLoom renderer CI',
        sources: {
          workerProbe: {
            type: 'geojson',
            data: {
              type: 'FeatureCollection',
              features: [
                {
                  type: 'Feature',
                  properties: { probe: true },
                  geometry: { type: 'Point', coordinates: [0, 0] },
                },
              ],
            },
          },
        },
        layers: [
          {
            id: 'background',
            type: 'background',
            paint: { 'background-color': '#111111' },
          },
          {
            id: 'worker-probe',
            type: 'circle',
            source: 'workerProbe',
            paint: { 'circle-radius': 4, 'circle-color': '#ffffff' },
          },
        ],
      }),
    })
  })
}

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
      evidence: [
        {
          source: 'manual_review',
          sourceUrl: null,
          observedAt: '2026-08-30T00:00:00.000Z',
          countryCode: 'US',
          countryName: 'United States',
          region: null,
          city: null,
          locationType: 'home_base',
          confidence: 'reviewed',
        },
      ],
      sources: ['manual_review'],
    },
    {
      login: 'fixture_jp',
      displayName: 'Fixture JP',
      viewers: 300,
      url: 'https://www.twitch.tv/fixture_jp',
      entityKind: 'person',
      location: {
        countryCode: 'JP',
        countryName: 'Japan',
        regions: [],
        cities: [],
        locationTypes: ['declared_location'],
      },
      evidence: [
        {
          source: 'account_profile',
          sourceUrl: null,
          observedAt: '2026-08-30T00:00:00.000Z',
          countryCode: 'JP',
          countryName: 'Japan',
          region: null,
          city: null,
          locationType: 'declared_location',
          confidence: 'reviewed',
        },
      ],
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
      sourceMode: useRealBasemap ? 'real-basemap-browser-smoke' : 'browser-regression-fixture',
      updatedAt: '2026-08-30T00:00:00.000Z',
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

  try {
    await page.locator('#stream-map-root[data-map-state="basemap-ready"]').waitFor({ timeout: useRealBasemap ? 30000 : 15000 })
  } catch (error) {
    const diagnostics = await page.evaluate(() => {
      const root = document.querySelector('#stream-map-root')
      const canvas = root?.querySelector('canvas.maplibregl-canvas')
      const gl = canvas instanceof HTMLCanvasElement
        ? canvas.getContext('webgl2') || canvas.getContext('webgl')
        : null
      return {
        rendererState: root?.getAttribute('data-map-state') || null,
        canvasCount: root?.querySelectorAll('canvas.maplibregl-canvas').length || 0,
        rendererAvailable: Boolean(window.maplibregl?.Map),
        webglAvailable: Boolean(gl),
      }
    })
    console.error(JSON.stringify({ ...diagnostics, useRealBasemap, pageErrors, consoleErrors }))
    throw error
  }

  await page.locator('.stream-map-country-row').first().waitFor({ timeout: 10000 })
  await page.locator('.stream-map-region-controls__status').filter({ hasText: 'Country regions ready' }).waitFor({ timeout: useRealBasemap ? 30000 : 10000 })

  const rendererState = await page.locator('#stream-map-root').getAttribute('data-map-state')
  const canvasCount = await page.locator('#stream-map-root canvas.maplibregl-canvas').count()
  const rendererAvailable = await page.evaluate(() => Boolean(window.maplibregl?.Map))
  const markerCount = await page.locator('.stream-map-country-marker').count()
  const regionControlCount = await page.locator('[data-stream-map-region-controls]').count()
  const viewSwitchCount = await page.locator('[data-map-view]').count()

  assert.equal(rendererState, 'basemap-ready')
  assert.equal(canvasCount, 1)
  assert.equal(rendererAvailable, true)
  assert.equal(markerCount, 2)
  assert.equal(regionControlCount, 1)
  assert.equal(viewSwitchCount, 0)

  const regionState = await page.evaluate(() => {
    const map = window.__viewloomCountryRegionMap
    return {
      mapCaptured: Boolean(map),
      sourceAvailable: Boolean(map?.getSource?.('viewloom-country-regions')),
      fillLayerAvailable: Boolean(map?.getLayer?.('viewloom-country-regions-fill')),
      outlineLayerAvailable: Boolean(map?.getLayer?.('viewloom-country-regions-outline')),
      fillVisibility: map?.getLayoutProperty?.('viewloom-country-regions-fill', 'visibility') || null,
      markerDisplay: getComputedStyle(document.querySelector('.stream-map-country-marker')).display,
      metricVisible: Boolean(document.querySelector('.stream-map-region-controls__metric')),
      regionsActive: document.documentElement.classList.contains('stream-map-country-regions-active'),
    }
  })

  assert.equal(regionState.mapCaptured, true)
  assert.equal(regionState.sourceAvailable, true)
  assert.equal(regionState.fillLayerAvailable, true)
  assert.equal(regionState.outlineLayerAvailable, true)
  assert.equal(regionState.fillVisibility, 'visible')
  assert.equal(regionState.markerDisplay, 'none')
  assert.equal(regionState.metricVisible, true)
  assert.equal(regionState.regionsActive, true)

  await page.locator('.stream-map-region-controls__metric select').selectOption('viewers')
  assert.equal(await page.locator('.stream-map-region-controls__metric select').inputValue(), 'viewers')

  assert.equal(pageErrors.length, 0, `page errors: ${pageErrors.join(' | ')}`)
  assert.equal(consoleErrors.length, 0, `console errors: ${consoleErrors.join(' | ')}`)

  console.log(JSON.stringify({
    rendererState,
    canvasCount,
    rendererAvailable,
    markerCount,
    regionControlCount,
    viewSwitchCount,
    regionState,
    useRealBasemap,
    pageErrors,
    consoleErrors,
  }))
} finally {
  await browser.close()
}
