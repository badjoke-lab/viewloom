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
      name: 'ViewLoom City aggregate CI',
      sources: {},
      layers: [{ id: 'background', type: 'background', paint: { 'background-color': '#111111' } }],
    }),
  })
})

await page.route('**/api/twitch-stream-map**', async (route) => {
  const request = new URL(route.request().url())
  assert.equal(request.searchParams.get('geography'), 'city')

  const mappedStreams = [
    stream('alpha', 'Alpha', 100, 'US', 'United States', 'Austin', 'Texas', 'manual_review'),
    stream('beta', 'Beta', 80, 'US', 'United States', 'Austin', 'Texas', 'official_external'),
    stream('gamma', 'Gamma', 70, 'GB', 'United Kingdom', 'London', null, 'account_profile'),
  ]

  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      version: 'viewloom-stream-map-city-contract-v0.1',
      platform: 'twitch',
      source: 'real',
      sourceMode: 'city-aggregate-browser-fixture',
      geographyMode: 'city',
      publicCityUiActivated: false,
      currentLocationActivated: false,
      updatedAt: '2026-09-05T00:00:00.000Z',
      identityContract: {
        joinKey: 'login',
        stableTwitchUserIdAvailableInMinuteSnapshot: true,
        stableTwitchUserIdState: 'partial',
        stableIdentityStreams: 2,
        missingStableIdentityStreams: 2,
        loginIsStableIdentity: false,
      },
      coverage: {
        topLimit: 4,
        observedStreams: 4,
        observedViewers: 300,
        eligibleUnmappedStreams: 1,
        excludedNonPersonStreams: 0,
        excludedNonPersonViewers: 0,
        coveredPages: 1,
        hasMore: false,
        mappedBySource: {},
        unmappedReasons: {},
      },
      cityCoverage: {
        observedStreams: 4,
        observedViewers: 300,
        cityPlaceableStreams: 3,
        cityPlaceableViewers: 250,
        countryOnlyStreams: 1,
        countryOnlyViewers: 50,
        eligibleUnmappedStreams: 1,
        excludedNonPersonStreams: 0,
        conflictUnmappedStreams: 0,
        upstreamCountryConflictCount: 0,
      },
      populationFilter: {
        implementationState: 'public',
        order: ['overall_top_n', 'minimum_viewers', 'category', 'location_evidence'],
        baseObservedStreams: 4,
        selectedTop: 300,
        minViewers: 0,
        selectedCategory: 'all',
        selectedCategoryName: null,
        categoryState: 'all',
        categoryAvailable: true,
        categoryCoverageState: 'observed',
        categoryContractVersion: null,
        topScopedStreams: 4,
        preCategoryStreams: 4,
        preCategoryViewers: 300,
        selectedPopulationStreams: 4,
        selectedPopulationViewers: 300,
        unknownCategoryStreams: 0,
        dictionaryMissingItems: 0,
        availableCategories: [],
        languageFilterAvailable: false,
        languageUsedForPopulationFiltering: false,
      },
      mappedStreams,
      countryOnlyStreams: [stream('countryonly', 'Country Only', 50, 'CA', 'Canada', null, null, 'manual_review')],
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
  await page.waitForFunction(() => document.querySelectorAll('#stream-map-stream-list .stream-map-stream-row').length === 3)

  const cityRows = page.locator('[data-city-places] .stream-map-city-place')
  assert.equal(await cityRows.count(), 2)
  const austin = cityRows.filter({ hasText: 'Austin' })
  assert.match(await austin.textContent(), /2 streams · 180 viewers/)
  assert.equal(await page.locator('.stream-map-country-marker:visible').count(), 0)

  await austin.click()
  await page.locator('[data-selected-city]:not([hidden])').waitFor({ timeout: 5000 })
  assert.equal(await austin.getAttribute('aria-pressed'), 'true')
  assert.match(await page.locator('[data-selected-city]').textContent(), /2/)
  assert.match(await page.locator('[data-selected-city]').textContent(), /180/)

  const selectedVisible = await visibleStreamNames(page)
  assert.deepEqual(selectedVisible.sort(), ['Alpha', 'Beta'])
  assert.equal(await page.locator('#stream-map-stream-list').getAttribute('data-city-selection-empty'), 'false')

  await page.locator('[data-location-source][value="account_profile"]').check()
  await page.waitForFunction(() => document.querySelectorAll('[data-city-places] .stream-map-city-place').length === 1)
  assert.match(await page.locator('[data-city-places]').textContent(), /London/)
  assert.equal(await page.locator('[data-selected-city]').isVisible(), true)
  assert.match(await page.locator('[data-selected-city]').textContent(), /Austin/)
  assert.match(await page.locator('[data-selected-city]').textContent(), /No alternative City was inferred/)
  assert.deepEqual(await visibleStreamNames(page), [])
  assert.equal(await page.locator('#stream-map-stream-list').getAttribute('data-city-selection-empty'), 'true')

  await page.waitForTimeout(250)
  assert.equal(pageErrors.length, 0, `page errors: ${pageErrors.join(' | ')}`)
  assert.equal(consoleErrors.length, 0, `console errors: ${consoleErrors.join(' | ')}`)

  await page.locator('[data-clear-selected-city]').click()
  await page.waitForFunction(() => document.querySelector('[data-selected-city]')?.hidden === true)
  assert.deepEqual(await visibleStreamNames(page), ['Gamma'])
  assert.equal(await page.locator('#stream-map-stream-list').getAttribute('data-city-selection-empty'), 'false')

  await page.setViewportSize({ width: 390, height: 844 })
  const mobile = await page.evaluate(() => ({
    width: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    minCityRowHeight: Math.round(document.querySelector('.stream-map-city-place')?.getBoundingClientRect().height ?? 0),
  }))
  assert.equal(mobile.scrollWidth, mobile.width)
  assert.ok(mobile.minCityRowHeight >= 44, `City row tap target too short: ${mobile.minCityRowHeight}`)

  console.log(JSON.stringify({
    aggregates: 2,
    austinStreams: 2,
    selectedVisible,
    retainedZeroSelection: true,
    clearRestoredFilteredLondon: true,
    creatorMarkersVisible: 0,
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
