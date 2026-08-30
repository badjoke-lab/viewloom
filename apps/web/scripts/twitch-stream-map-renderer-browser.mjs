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

  try {
    await page.locator('#stream-map-root[data-map-state="basemap-ready"]').waitFor({ timeout: 15000 })
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
    console.error(JSON.stringify({ ...diagnostics, pageErrors, consoleErrors }))
    throw error
  }

  const rendererState = await page.locator('#stream-map-root').getAttribute('data-map-state')
  const canvasCount = await page.locator('#stream-map-root canvas.maplibregl-canvas').count()
  const rendererAvailable = await page.evaluate(() => Boolean(window.maplibregl?.Map))

  assert.equal(rendererState, 'basemap-ready')
  assert.equal(canvasCount, 1)
  assert.equal(rendererAvailable, true)
  assert.equal(pageErrors.length, 0, `page errors: ${pageErrors.join(' | ')}`)
  assert.equal(consoleErrors.length, 0, `console errors: ${consoleErrors.join(' | ')}`)

  console.log(JSON.stringify({ rendererState, canvasCount, rendererAvailable, pageErrors, consoleErrors }))
} finally {
  await browser.close()
}
