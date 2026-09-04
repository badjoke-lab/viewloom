import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { chromium } from 'playwright'

const baseUrl = process.env.STREAM_MAP_BASE_URL || 'http://127.0.0.1:4173'
const outputDir = 'artifacts/twitch-country-map-comparison'
await mkdir(outputDir, { recursive: true })

const browser = await chromium.launch({
  headless: true,
  args: ['--enable-webgl', '--use-gl=angle', '--use-angle=swiftshader', '--disable-gpu-sandbox'],
})

const fixtures = [
  ['US', 'United States', 24, 18400, 'home_base', 'manual_review'],
  ['JP', 'Japan', 13, 9600, 'declared_location', 'account_profile'],
  ['BR', 'Brazil', 8, 5200, 'home_base', 'manual_review'],
  ['DE', 'Germany', 5, 2700, 'declared_location', 'account_profile'],
  ['SG', 'Singapore', 2, 900, 'declared_location', 'account_profile'],
]

function payload() {
  const mappedStreams = fixtures.flatMap(([countryCode, countryName, count, viewers, locationType, source]) => {
    const perStream = Math.max(1, Math.floor(viewers / count))
    return Array.from({ length: count }, (_, index) => ({
      login: `fixture_${countryCode.toLowerCase()}_${index + 1}`,
      displayName: `${countryName} ${index + 1}`,
      viewers: perStream,
      url: `https://www.twitch.tv/fixture_${countryCode.toLowerCase()}_${index + 1}`,
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
        observedAt: '2026-09-04T00:00:00.000Z',
        countryCode,
        countryName,
        region: null,
        city: null,
        locationType,
        confidence: 'reviewed',
      }],
      sources: [source],
    }))
  })
  const observedViewers = mappedStreams.reduce((sum, stream) => sum + stream.viewers, 0)
  return {
    version: 'viewloom-stream-map-live-v1',
    platform: 'twitch',
    source: 'real',
    sourceMode: 'country-comparison-capture-fixture',
    updatedAt: '2026-09-04T00:00:00.000Z',
    coverage: {
      topLimit: 300,
      observedStreams: mappedStreams.length,
      observedViewers,
      mappedStreams: mappedStreams.length,
      unmappedStreams: 0,
      eligibleUnmappedStreams: 0,
      excludedNonPersonStreams: 0,
      mappedViewers: observedViewers,
      unmappedViewers: 0,
      excludedNonPersonViewers: 0,
      mappedPercent: 1,
      mappedViewerPercent: 1,
      mappedCountryCount: fixtures.length,
      currentLocationStreams: 0,
      currentLocationPercent: 0,
      coveredPages: 1,
      hasMore: false,
      mappedBySource: { manual_review: 32, account_profile: 20 },
      unmappedReasons: {},
    },
    populationFilter: {
      implementationState: 'public',
      order: ['overall_top_n', 'minimum_viewers', 'category', 'location_evidence'],
      baseObservedStreams: mappedStreams.length,
      selectedTop: 300,
      minViewers: 0,
      selectedCategory: 'all',
      selectedCategoryName: null,
      categoryState: 'all',
      categoryAvailable: true,
      categoryCoverageState: 'observed',
      categoryContractVersion: null,
      topScopedStreams: mappedStreams.length,
      preCategoryStreams: mappedStreams.length,
      preCategoryViewers: observedViewers,
      selectedPopulationStreams: mappedStreams.length,
      selectedPopulationViewers: observedViewers,
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
  }
}

async function captureSet(label, viewport) {
  const page = await browser.newPage({ viewport })
  const pageErrors = []
  const consoleErrors = []
  page.on('pageerror', (error) => pageErrors.push(error.stack || error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text())
  })
  await page.route('**/api/twitch-stream-map**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(payload()) })
  })

  await page.goto(`${baseUrl}/twitch/map/`, { waitUntil: 'domcontentloaded' })
  await page.locator('#stream-map-root[data-map-state="basemap-ready"]').waitFor({ timeout: 20000 })
  await page.locator('#stream-map-root[data-country-basemap="minimal"]').waitFor({ timeout: 10000 })
  await page.locator('.stream-map-view-switch__status').filter({ hasText: 'Regions ready' }).waitFor({ timeout: 10000 })
  await page.locator('.stream-map-view-switch').scrollIntoViewIfNeeded()
  await page.waitForTimeout(500)

  await captureMapArea(page, `${outputDir}/${label}-regions.png`)

  await page.locator('[data-map-view="markers"]').click()
  await page.locator('[data-map-view="markers"][aria-pressed="true"]').waitFor({ timeout: 5000 })
  await page.waitForTimeout(350)
  await captureMapArea(page, `${outputDir}/${label}-markers.png`)

  assert.equal(pageErrors.length, 0, `${label} page errors: ${pageErrors.join(' | ')}`)
  assert.equal(consoleErrors.length, 0, `${label} console errors: ${consoleErrors.join(' | ')}`)
  await page.close()
}

async function captureMapArea(page, path) {
  const switchBox = await page.locator('.stream-map-view-switch').boundingBox()
  const stageBox = await page.locator('.stream-map-stage').boundingBox()
  assert.ok(switchBox && stageBox, `comparison capture area missing for ${path}`)
  const x = Math.max(0, Math.min(switchBox.x, stageBox.x))
  const y = Math.max(0, Math.min(switchBox.y, stageBox.y))
  const right = Math.max(switchBox.x + switchBox.width, stageBox.x + stageBox.width)
  const bottom = Math.max(switchBox.y + switchBox.height, stageBox.y + stageBox.height)
  await page.screenshot({
    path,
    clip: { x, y, width: right - x, height: bottom - y },
    animations: 'disabled',
  })
}

try {
  await captureSet('pc', { width: 1440, height: 1000 })
  await captureSet('mobile', { width: 390, height: 844 })
  console.log(JSON.stringify({ outputDir, captures: ['pc-regions.png', 'pc-markers.png', 'mobile-regions.png', 'mobile-markers.png'] }))
} finally {
  await browser.close()
}
