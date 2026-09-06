import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { chromium } from 'playwright'

const origin = (process.env.PUBLIC_CURRENT_LOCAL_ORIGIN || 'http://127.0.0.1:4173').replace(/\/$/, '')
const outputRoot = '/tmp/public-current-browser-audit'
const outputPath = `${outputRoot}/twitch-stream-map-data-state.json`

await mkdir(outputRoot, { recursive: true })
const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({ viewport: { width: 390, height: 844 } })
const page = await context.newPage()
let apiCalls = 0
const violations = []

await page.route('**/api/twitch-stream-map**', async (route) => {
  apiCalls += 1
  if (apiCalls === 2) {
    await route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: JSON.stringify({ state: 'fixture_refresh_failure' }),
    })
    return
  }

  const requestUrl = new URL(route.request().url())
  const minViewers = Number(requestUrl.searchParams.get('min_viewers') || 0)
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(buildPayload(minViewers)),
  })
})

const evidence = {
  schema: 'viewloom-twitch-stream-map-data-state-v1',
  origin,
  viewport: { width: 390, height: 844 },
  result: 'running',
  apiCalls: 0,
  beforeFailure: null,
  failedRefresh: null,
  recovered: null,
  violations,
}

try {
  await page.goto(`${origin}/twitch/map/?data-state-audit=stale-refresh`, { waitUntil: 'domcontentloaded', timeout: 45_000 })
  await page.locator('.stream-map-country-row[data-country-code="US"]').waitFor({ timeout: 15_000 })
  await page.locator('.stream-map-country-row[data-country-code="US"]').click()
  await page.locator('#stream-map-selected-country:not([hidden])').waitFor({ timeout: 5_000 })

  evidence.beforeFailure = await readState(page)
  expect(evidence.beforeFailure.countryRows === 1, `before failure expected one country row, got ${evidence.beforeFailure.countryRows}`)
  expect(evidence.beforeFailure.streamRows === 1, `before failure expected one mapped stream row, got ${evidence.beforeFailure.streamRows}`)
  expect(evidence.beforeFailure.selectedCountryHidden === false, 'before failure selected-country panel should be visible')
  expect(evidence.beforeFailure.mappedCard === '1 / 2', `before failure mapped card mismatch: ${evidence.beforeFailure.mappedCard}`)

  await page.locator('[data-population-min-viewers]').selectOption('100')
  await page.waitForFunction(() => (document.querySelector('[data-stream-map-state]')?.textContent || '').trim() === 'Data error', null, { timeout: 15_000 })
  await page.waitForFunction(() => document.documentElement.dataset.streamMapDataState === 'unavailable', null, { timeout: 5_000 })

  evidence.failedRefresh = await readState(page)
  for (const [name, value] of Object.entries({
    observed: evidence.failedRefresh.observed,
    mapped: evidence.failedRefresh.mapped,
    unmapped: evidence.failedRefresh.unmapped,
    mappedCard: evidence.failedRefresh.mappedCard,
    viewersCard: evidence.failedRefresh.viewersCard,
    excludedCard: evidence.failedRefresh.excludedCard,
    countryCount: evidence.failedRefresh.countryCount,
    currentCount: evidence.failedRefresh.currentCount,
  })) expect(value === 'Unavailable', `failed refresh ${name} must be Unavailable, got ${value}`)
  expect(evidence.failedRefresh.countryRows === 0, `failed refresh retained ${evidence.failedRefresh.countryRows} stale country rows`)
  expect(evidence.failedRefresh.streamRows === 0, `failed refresh retained ${evidence.failedRefresh.streamRows} stale stream rows`)
  expect(evidence.failedRefresh.countryMarkers === 0, `failed refresh retained ${evidence.failedRefresh.countryMarkers} stale country markers`)
  expect(evidence.failedRefresh.selectedCountryHidden === true, 'failed refresh must hide stale selected-country panel')
  expect(evidence.failedRefresh.streamListTitle === 'Mapped streams', `failed refresh stream list title remained stale: ${evidence.failedRefresh.streamListTitle}`)
  expect(/unavailable/i.test(evidence.failedRefresh.countryListText), `failed refresh country list missing explicit unavailable state: ${evidence.failedRefresh.countryListText}`)
  expect(/unavailable/i.test(evidence.failedRefresh.streamListText), `failed refresh stream list missing explicit unavailable state: ${evidence.failedRefresh.streamListText}`)
  expect(/unavailable/i.test(evidence.failedRefresh.filterNote), `failed refresh filter note missing unavailable state: ${evidence.failedRefresh.filterNote}`)
  expect(evidence.failedRefresh.overflow <= 2, `failed refresh horizontal overflow ${evidence.failedRefresh.overflow}px`)

  await page.screenshot({ path: `${outputRoot}/twitch-stream-map-data-state-failed-refresh.png`, fullPage: true })

  await page.locator('[data-population-min-viewers]').selectOption('500')
  await page.locator('.stream-map-country-row[data-country-code="US"]').waitFor({ timeout: 15_000 })
  await page.waitForFunction(() => (document.querySelector('[data-stream-map-state]')?.textContent || '').trim() !== 'Data error', null, { timeout: 5_000 })

  evidence.recovered = await readState(page)
  expect(evidence.recovered.dataStateFlag === null, `recovery retained unavailable data-state flag: ${evidence.recovered.dataStateFlag}`)
  expect(evidence.recovered.observed === '2', `recovery observed mismatch: ${evidence.recovered.observed}`)
  expect(evidence.recovered.mapped === '1', `recovery mapped mismatch: ${evidence.recovered.mapped}`)
  expect(evidence.recovered.countryRows === 1, `recovery expected one country row, got ${evidence.recovered.countryRows}`)
  expect(evidence.recovered.streamRows === 1, `recovery expected one stream row, got ${evidence.recovered.streamRows}`)
  expect(evidence.recovered.selectedCountryHidden === false, 'recovery should restore the retained country selection from fresh data')
  expect(evidence.recovered.mappedCard === '1 / 2', `recovery mapped card mismatch: ${evidence.recovered.mappedCard}`)
  expect(evidence.recovered.overflow <= 2, `recovery horizontal overflow ${evidence.recovered.overflow}px`)

  evidence.apiCalls = apiCalls
  evidence.result = violations.length === 0 ? 'pass' : 'fail'
  await page.screenshot({ path: `${outputRoot}/twitch-stream-map-data-state-recovered.png`, fullPage: true })
} catch (error) {
  violations.push(error instanceof Error ? error.message : String(error))
  evidence.apiCalls = apiCalls
  evidence.result = 'fail'
  await page.screenshot({ path: `${outputRoot}/twitch-stream-map-data-state-failure.png`, fullPage: true }).catch(() => {})
} finally {
  await writeFile(outputPath, `${JSON.stringify(evidence, null, 2)}\n`)
  await context.close()
  await browser.close()
}

assert.equal(evidence.apiCalls, 3, `expected success -> failure -> recovery API sequence, got ${evidence.apiCalls} calls`)
assert.equal(evidence.violations.length, 0, JSON.stringify(evidence.violations))
assert.equal(evidence.result, 'pass')
console.log(JSON.stringify({ result: evidence.result, apiCalls: evidence.apiCalls, violations: evidence.violations.length }, null, 2))

function buildPayload(minViewers) {
  const updatedAt = '2026-09-06T14:00:00.000Z'
  return {
    version: 'viewloom-stream-map-live-v1',
    platform: 'twitch',
    source: 'real',
    sourceMode: 'browser_fixture',
    updatedAt,
    coverage: {
      topLimit: 300,
      observedStreams: 2,
      observedViewers: 1500,
      mappedStreams: 1,
      unmappedStreams: 1,
      eligibleUnmappedStreams: 1,
      excludedNonPersonStreams: 0,
      mappedViewers: 1000,
      unmappedViewers: 500,
      excludedNonPersonViewers: 0,
      mappedPercent: 0.5,
      mappedViewerPercent: 2 / 3,
      mappedCountryCount: 1,
      currentLocationStreams: 0,
      currentLocationPercent: 0,
      coveredPages: 3,
      hasMore: false,
      mappedBySource: { manual_review: 1 },
      unmappedReasons: { no_qualifying_evidence: 1 },
    },
    populationFilter: {
      implementationState: 'public',
      order: ['overall_top_n', 'minimum_viewers', 'category'],
      baseObservedStreams: 2,
      selectedTop: 300,
      minViewers,
      selectedCategory: 'all',
      selectedCategoryName: null,
      categoryState: 'all',
      categoryAvailable: true,
      categoryCoverageState: 'observed',
      categoryContractVersion: 'fixture-v1',
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
    mappedStreams: [
      {
        login: 'fixture_alpha',
        displayName: 'Fixture Alpha',
        viewers: 1000,
        url: 'https://www.twitch.tv/fixture_alpha',
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
            observedAt: updatedAt,
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
    ],
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

async function readState(page) {
  return page.evaluate(() => {
    const text = (id) => (document.getElementById(id)?.textContent || '').trim()
    const body = document.body
    return {
      state: (document.querySelector('[data-stream-map-state]')?.textContent || '').trim(),
      dataStateFlag: document.documentElement.dataset.streamMapDataState || null,
      observed: text('stream-map-observed'),
      mapped: text('stream-map-mapped'),
      unmapped: text('stream-map-unmapped'),
      mappedCard: text('stream-map-card-mapped'),
      viewersCard: text('stream-map-card-viewers'),
      excludedCard: text('stream-map-card-excluded'),
      countryCount: text('stream-map-country-count'),
      currentCount: text('stream-map-current-count'),
      countryRows: document.querySelectorAll('.stream-map-country-row').length,
      streamRows: document.querySelectorAll('.stream-map-stream-row').length,
      countryMarkers: document.querySelectorAll('.stream-map-country-marker').length,
      selectedCountryHidden: Boolean(document.getElementById('stream-map-selected-country')?.hidden),
      streamListTitle: text('stream-map-stream-list-title'),
      countryListText: text('stream-map-country-list'),
      streamListText: text('stream-map-stream-list'),
      filterNote: text('stream-map-filter-note'),
      overflow: Math.max(0, body.scrollWidth - body.clientWidth),
    }
  })
}

function expect(condition, message) {
  if (!condition) violations.push(message)
}
