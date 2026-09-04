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

await page.route('**/api/twitch-stream-map**', async (route) => {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      version: 'viewloom-stream-map-live-v1',
      platform: 'twitch',
      source: 'real',
      sourceMode: 'minimal-country-basemap-browser-fixture',
      updatedAt: '2026-09-04T00:00:00.000Z',
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
  await page.locator('#stream-map-root[data-map-state="basemap-ready"][data-country-basemap="minimal"]').waitFor({ timeout: 30000 })

  const result = await page.evaluate(() => {
    const root = document.querySelector('#stream-map-root')
    const map = window.__viewloomCountryRegionMap
    const layers = map?.getStyle?.().layers || []
    const baseLayers = layers.filter((layer) => !String(layer.id || '').startsWith('viewloom-country-regions'))
    const visible = baseLayers.filter((layer) => layer.layout?.visibility !== 'none')
    const visibleKeys = visible.map((layer) => `${layer.id || ''} ${layer.source || ''} ${layer['source-layer'] || ''}`.toLowerCase())
    const forbidden = visibleKeys.filter((key) => /(road|street|highway|building|poi|airport|transit|place_city|city_label|town|village)/.test(key))
    const countryLabels = visible.filter((layer) => layer.type === 'symbol' && visibleKeys[visible.indexOf(layer)]?.includes('country')).length
    return {
      hiddenLayers: Number(root?.getAttribute('data-country-basemap-hidden-layers') || '0'),
      retainedLayers: Number(root?.getAttribute('data-country-basemap-retained-layers') || '0'),
      totalBaseLayers: baseLayers.length,
      visibleBaseLayers: visible.length,
      forbidden,
      countryLabels,
      visibleLayerIds: visible.map((layer) => layer.id),
    }
  })

  assert.ok(result.hiddenLayers > 0, 'expected provider layers to be pruned')
  assert.ok(result.retainedLayers > 0, 'expected geographic context layers to remain')
  assert.ok(result.visibleBaseLayers < result.totalBaseLayers, 'expected a reduced Country basemap')
  assert.deepEqual(result.forbidden, [], `forbidden Country basemap layers remain: ${result.forbidden.join(' | ')}`)
  assert.ok(result.countryLabels > 0, 'expected at least one country label layer to remain')
  assert.equal(pageErrors.length, 0, `page errors: ${pageErrors.join(' | ')}`)
  assert.equal(consoleErrors.length, 0, `console errors: ${consoleErrors.join(' | ')}`)

  console.log(JSON.stringify({ result, pageErrors, consoleErrors }))
} finally {
  await browser.close()
}
