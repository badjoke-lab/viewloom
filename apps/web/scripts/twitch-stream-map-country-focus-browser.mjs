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
      name: 'ViewLoom Country focus CI',
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
      sourceMode: 'country-focus-browser-fixture',
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
  await page.locator('.stream-map-country-row[data-country-code="US"]').waitFor({ timeout: 10000 })
  await page.locator('.stream-map-view-switch__status').filter({ hasText: 'Regions ready' }).waitFor({ timeout: 10000 })

  const initialZoom = await page.evaluate(() => window.__viewloomCountryRegionMap.getZoom())
  assert.ok(Math.abs(initialZoom - 1.15) < 0.2, `unexpected initial zoom: ${initialZoom}`)

  await page.locator('.stream-map-country-row[data-country-code="US"]').click()
  await page.locator('#stream-map-root[data-country-camera="focused"][data-country-camera-code="US"][data-country-camera-mode="bounds"]').waitFor({ timeout: 10000 })
  await page.waitForFunction(() => window.__viewloomCountryRegionMap.getZoom() > 1.3)
  const usZoom = await page.evaluate(() => window.__viewloomCountryRegionMap.getZoom())
  assert.ok(usZoom <= 4.25, `US focus exceeded Country max zoom: ${usZoom}`)

  await page.locator('[data-clear-selected-country]').click()
  await page.locator('#stream-map-root[data-country-camera="world"]').waitFor({ timeout: 10000 })
  await page.waitForFunction(() => Math.abs(window.__viewloomCountryRegionMap.getZoom() - 1.15) < 0.08)
  const resetZoom = await page.evaluate(() => window.__viewloomCountryRegionMap.getZoom())
  assert.ok(Math.abs(resetZoom - 1.15) < 0.08, `world reset zoom mismatch: ${resetZoom}`)

  await page.locator('.stream-map-country-row[data-country-code="SG"]').click()
  await page.locator('#stream-map-root[data-country-camera="focused"][data-country-camera-code="SG"][data-country-camera-mode="fallback"]').waitFor({ timeout: 10000 })
  await page.waitForFunction(() => window.__viewloomCountryRegionMap.getZoom() > 3.5)
  const sgZoom = await page.evaluate(() => window.__viewloomCountryRegionMap.getZoom())
  assert.ok(sgZoom <= 4.05, `Singapore fallback zoom exceeded bound: ${sgZoom}`)

  assert.equal(pageErrors.length, 0, `page errors: ${pageErrors.join(' | ')}`)
  assert.equal(consoleErrors.length, 0, `console errors: ${consoleErrors.join(' | ')}`)

  console.log(JSON.stringify({ initialZoom, usZoom, resetZoom, sgZoom, pageErrors, consoleErrors }))
} finally {
  await browser.close()
}
