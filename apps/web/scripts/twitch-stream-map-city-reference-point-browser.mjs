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
      name: 'ViewLoom City reference point CI',
      sources: {},
      layers: [{ id: 'background', type: 'background', paint: { 'background-color': '#111111' } }],
    }),
  })
})

await page.route('**/api/twitch-stream-map**', async (route) => {
  const request = new URL(route.request().url())
  assert.equal(request.searchParams.get('geography'), 'city')

  const mappedStreams = [
    stream('dallas-live', 'Dallas Live', 120, 'US', 'United States', 'Dallas', 'Texas', 'manual_review'),
    stream('sant-cugat-live', 'Sant Cugat Live', 80, 'ES', 'Spain', 'Sant Cugat del Valles', null, 'official_external'),
  ]

  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      version: 'viewloom-stream-map-city-contract-v0.1',
      platform: 'twitch',
      source: 'real',
      sourceMode: 'city-reference-point-browser-fixture',
      geographyMode: 'city',
      publicCityUiActivated: false,
      currentLocationActivated: false,
      updatedAt: '2026-09-05T00:00:00.000Z',
      identityContract: {
        joinKey: 'login',
        stableTwitchUserIdAvailableInMinuteSnapshot: true,
        stableTwitchUserIdState: 'partial',
        stableIdentityStreams: 1,
        missingStableIdentityStreams: 1,
        loginIsStableIdentity: false,
      },
      coverage: {
        topLimit: 2,
        observedStreams: 2,
        observedViewers: 200,
        eligibleUnmappedStreams: 0,
        excludedNonPersonStreams: 0,
        excludedNonPersonViewers: 0,
        coveredPages: 1,
        hasMore: false,
        mappedBySource: {},
        unmappedReasons: {},
      },
      cityCoverage: {
        observedStreams: 2,
        observedViewers: 200,
        cityPlaceableStreams: 2,
        cityPlaceableViewers: 200,
        countryOnlyStreams: 0,
        countryOnlyViewers: 0,
        eligibleUnmappedStreams: 0,
        excludedNonPersonStreams: 0,
        conflictUnmappedStreams: 0,
        upstreamCountryConflictCount: 0,
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
        preCategoryViewers: 200,
        selectedPopulationStreams: 2,
        selectedPopulationViewers: 200,
        unknownCategoryStreams: 0,
        dictionaryMissingItems: 0,
        availableCategories: [],
        languageFilterAvailable: false,
        languageUsedForPopulationFiltering: false,
      },
      mappedStreams,
      countryOnlyStreams: [],
      baseCityConflicts: [],
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
        currentLocationUsedForBaseCityPlacement: false,
        birthplaceUsedForBaseCityPlacement: false,
        eventVenueUsedForBaseCityPlacement: false,
        preciseAddressPublished: false,
        coordinatesPublished: false,
      },
      state: 'ready',
    }),
  })
})

try {
  await page.goto(`${baseUrl}/twitch/map/?geography=city`, { waitUntil: 'domcontentloaded' })
  await page.locator('#stream-map-root[data-map-state="basemap-ready"]').waitFor({ timeout: 15000 })
  await page.locator('[data-city-places] .stream-map-city-place').first().waitFor({ timeout: 10000 })
  await page.locator('.stream-map-city-reference-marker').waitFor({ timeout: 10000 })
  await page.waitForFunction(() => document.querySelectorAll('#stream-map-stream-list .stream-map-stream-row').length === 2)

  const cityRows = page.locator('[data-city-places] .stream-map-city-place')
  assert.equal(await cityRows.count(), 2)
  const dallas = cityRows.filter({ hasText: 'Dallas' })
  const santCugat = cityRows.filter({ hasText: 'Sant Cugat del Valles' })
  assert.equal(await dallas.getAttribute('data-city-geometry'), 'reference_point')
  assert.equal(await santCugat.getAttribute('data-city-geometry'), 'list_only')
  assert.match(await dallas.textContent(), /map reference/)
  assert.match(await santCugat.textContent(), /list only/)

  assert.equal(await page.locator('.stream-map-country-marker:visible').count(), 0)
  const cityMarkers = page.locator('.stream-map-city-reference-marker:visible')
  assert.equal(await cityMarkers.count(), 1)
  const dallasMarker = cityMarkers.first()
  assert.equal(await dallasMarker.getAttribute('data-city-aggregate-key'), 'US|texas|dallas')
  assert.equal(await dallasMarker.getAttribute('data-reference-role'), 'city_aggregate_reference')
  assert.match(await dallasMarker.getAttribute('aria-label'), /not a creator exact or current location/)

  await dallasMarker.click()
  await page.locator('[data-selected-city]:not([hidden])').waitFor({ timeout: 5000 })
  assert.equal(await dallas.getAttribute('aria-pressed'), 'true')
  assert.equal(await dallasMarker.getAttribute('aria-pressed'), 'true')
  assert.match(await page.locator('[data-selected-city]').textContent(), /City aggregate reference/)
  assert.deepEqual(await visibleStreamNames(page), ['Dallas Live'])

  await page.locator('[data-clear-selected-city]').click()
  await page.waitForFunction(() => document.querySelector('[data-selected-city]')?.hidden === true)
  assert.deepEqual((await visibleStreamNames(page)).sort(), ['Dallas Live', 'Sant Cugat Live'])
  assert.equal(await page.locator('.stream-map-city-reference-marker:visible').count(), 1)

  await page.setViewportSize({ width: 390, height: 844 })
  const mobile = await page.evaluate(() => {
    const marker = document.querySelector('.stream-map-city-reference-marker')
    return {
      width: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      markerWidth: Math.round(marker?.getBoundingClientRect().width ?? 0),
      markerHeight: Math.round(marker?.getBoundingClientRect().height ?? 0),
    }
  })
  assert.equal(mobile.scrollWidth, mobile.width)
  assert.ok(mobile.markerWidth >= 44, `City marker tap target too narrow: ${mobile.markerWidth}`)
  assert.ok(mobile.markerHeight >= 44, `City marker tap target too short: ${mobile.markerHeight}`)

  await page.waitForTimeout(250)
  assert.equal(pageErrors.length, 0, `page errors: ${pageErrors.join(' | ')}`)
  assert.equal(consoleErrors.length, 0, `console errors: ${consoleErrors.join(' | ')}`)

  console.log(JSON.stringify({
    cityAggregates: 2,
    referencePointMarkers: 1,
    listOnlyCities: ['Sant Cugat del Valles'],
    selectedViaMapReference: 'Dallas',
    creatorCoordinatesPublished: false,
    mobile,
    pageErrors,
    consoleErrors,
  }))
} finally {
  await browser.close()
}

function stream(login, displayName, viewers, countryCode, countryName, city, region, source) {
  const locationType = 'declared_location'
  return {
    login,
    displayName,
    viewers,
    url: `https://www.twitch.tv/${login}`,
    entityKind: 'person',
    identity: { twitchUserId: null, stableIdAvailable: false },
    location: {
      countryCode,
      countryName,
      regions: region ? [region] : [],
      cities: city ? [city] : [],
      locationTypes: [locationType],
    },
    evidence: [{
      source,
      sourceUrl: null,
      observedAt: '2026-09-05T00:00:00.000Z',
      countryCode,
      countryName,
      region,
      city,
      locationType,
      confidence: 'reviewed',
    }],
    sources: [source],
  }
}

async function visibleStreamNames(page) {
  return page.locator('#stream-map-stream-list .stream-map-stream-row:visible .stream-map-stream-row__head a').allTextContents()
}
