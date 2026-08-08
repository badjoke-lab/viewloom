import assert from 'node:assert/strict'
import { chromium } from 'playwright'

const origin = process.env.DAYFLOW_CATEGORY_ORIGIN || 'http://127.0.0.1:4173'
const browser = await chromium.launch({ headless: true })
const requests = []

try {
  await runNormalTwitch()
  await runHiddenTwitchDesktop()
  await runHiddenTwitchMobile()
  await runUnknownCategory()
  await runKickIsolation()
  console.log(JSON.stringify({
    status: 'pass',
    normalTwitchNonExposure: true,
    hiddenTwitchCategorySelection: true,
    categoryCoverageVisible: true,
    mobileOverflow: false,
    unknownCategoryExplicit: true,
    kickIsolation: true,
    requests,
  }, null, 2))
} finally {
  await browser.close()
}

async function runNormalTwitch() {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  await installRoutes(page)
  await page.goto(`${origin}/twitch/day-flow/?auto=off`, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('.dayflow-stage svg')
  assert.equal(await page.locator('#dayflow-category-preview-controls').count(), 0, 'normal Twitch route must not expose category controls')
  const normalRequests = requests.filter((request) => request.scenario === 'normal-twitch')
  assert.ok(normalRequests.length >= 1)
  assert.equal(normalRequests.some((request) => request.category !== null), false, 'normal Twitch API request must not carry category')
  await page.close()
}

async function runHiddenTwitchDesktop() {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  page.__scenario = 'hidden-twitch-desktop'
  await installRoutes(page)
  await page.goto(`${origin}/twitch/day-flow/?categoryPreview=1&category=100&auto=off`, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('#dayflow-category-preview-controls')
  await page.waitForSelector('.dayflow-stage svg')
  await page.waitForFunction(() => document.querySelector('[data-dayflow-category-preview-select]')?.value === '100')
  assert.equal(await page.locator('[data-dayflow-category-preview-select]').inputValue(), '100')
  assert.match(await page.locator('.dayflow-category-preview__status').innerText(), /observed/i)
  await page.waitForSelector('.dayflow-category-coverage-strip .is-partial')
  await page.waitForSelector('.dayflow-category-coverage-strip .is-unavailable')
  const firstRequests = requests.filter((request) => request.scenario === 'hidden-twitch-desktop')
  assert.ok(firstRequests.some((request) => request.category === '100'), 'hidden Twitch API request must carry selected category')

  await page.selectOption('[data-dayflow-category-preview-select]', '200')
  await page.waitForFunction(() => new URL(location.href).searchParams.get('category') === '200')
  await page.waitForFunction(() => document.querySelector('[data-dayflow-category-preview-select]')?.value === '200')
  const afterSelect = requests.filter((request) => request.scenario === 'hidden-twitch-desktop')
  assert.ok(afterSelect.some((request) => request.category === '200'), 'changing category must refresh the candidate API request')
  assert.equal(new URL(page.url()).searchParams.get('categoryPreview'), '1', 'shell URL sync must preserve preview flag')
  await page.close()
}

async function runHiddenTwitchMobile() {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
  page.__scenario = 'hidden-twitch-mobile'
  await installRoutes(page)
  await page.goto(`${origin}/twitch/day-flow/?categoryPreview=1&category=100&auto=off`, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('#dayflow-category-preview-controls')
  await page.waitForSelector('.dayflow-stage svg')
  const geometry = await page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth }))
  assert.equal(geometry.width, 390)
  assert.ok(geometry.scrollWidth <= geometry.width, `hidden Day Flow controls overflow mobile viewport: ${geometry.scrollWidth}/${geometry.width}`)
  await page.close()
}

async function runUnknownCategory() {
  const page = await browser.newPage({ viewport: { width: 1024, height: 800 } })
  page.__scenario = 'unknown-category'
  await installRoutes(page)
  await page.goto(`${origin}/twitch/day-flow/?categoryPreview=1&category=999999&auto=off`, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('#dayflow-category-preview-controls')
  await page.waitForFunction(() => /unknown twitch category/i.test(document.querySelector('.dayflow-category-preview__status')?.textContent || ''))
  assert.match(await page.locator('.dayflow-category-preview__status').innerText(), /Unknown Twitch category/)
  await page.close()
}

async function runKickIsolation() {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
  page.__scenario = 'kick-isolation'
  await installRoutes(page)
  await page.goto(`${origin}/kick/day-flow/?categoryPreview=1&category=100&auto=off`, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('.dayflow-stage svg')
  assert.equal(await page.locator('#dayflow-category-preview-controls').count(), 0, 'Kick must not receive Twitch category controls')
  const kickRequests = requests.filter((request) => request.scenario === 'kick-isolation')
  assert.ok(kickRequests.length >= 1)
  assert.equal(kickRequests.some((request) => request.category !== null), false, 'Kick Day Flow request must not receive category param')
  const geometry = await page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth }))
  assert.ok(geometry.scrollWidth <= geometry.width, `Kick mobile overflow: ${geometry.scrollWidth}/${geometry.width}`)
  await page.close()
}

async function installRoutes(page) {
  const scenario = page.__scenario || 'normal-twitch'
  await page.route('**/api/day-flow?**', async (route) => {
    const url = new URL(route.request().url())
    const category = url.searchParams.get('category')
    requests.push({ scenario, provider: 'twitch', category })
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(category ? candidatePayload(category) : normalPayload()) })
  })
  await page.route('**/api/kick-day-flow?**', async (route) => {
    const url = new URL(route.request().url())
    requests.push({ scenario, provider: 'kick', category: url.searchParams.get('category') })
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(normalPayload('kick')) })
  })
}

function normalPayload(platform = 'twitch') {
  const buckets = times()
  const totals = [100, 120, 90]
  return {
    ok: true,
    source: 'api',
    platform,
    state: 'ok',
    status: 'Fresh',
    lastUpdated: buckets[2],
    selectedDate: '2026-08-08',
    bucketSize: 5,
    topN: 20,
    valueMode: 'volume',
    rangeMode: 'today',
    windowStart: buckets[0],
    windowEnd: buckets[2],
    buckets,
    totalViewersByBucket: totals,
    bands: [band('alpha', 'ALPHA', [30, 40, 35], totals), band('beta', 'BETA', [20, 25, 15], totals), band('others', 'Others', [50, 55, 40], totals, true)],
    summary: { peakLeader: 'ALPHA', longestDominance: 'ALPHA', biggestRise: 'ALPHA', highestActivity: null },
    detailPanelSource: { defaultStreamerId: 'alpha', streamers: [] },
    activity: { available: false, note: 'Activity unavailable.' },
  }
}

function candidatePayload(category) {
  const base = normalPayload()
  const options = [
    { id: '100', name: 'Game A', streamCount: 1, viewerMinutes: 325, peakViewers: 35, observedBuckets: 2 },
    { id: '200', name: 'Game B', streamCount: 2, viewerMinutes: 425, peakViewers: 65, observedBuckets: 2 },
  ]
  const coverage = [
    { bucket: times()[0], state: 'observed', observedRows: 1, partialRows: 0, unavailableRows: 0, totalRows: 1 },
    { bucket: times()[1], state: 'partial', observedRows: 0, partialRows: 1, unavailableRows: 0, totalRows: 1 },
    { bucket: times()[2], state: 'unavailable', observedRows: 0, partialRows: 0, unavailableRows: 1, totalRows: 1 },
  ]
  const filter = {
    implementationState: 'hidden_candidate',
    publicExposureAuthorized: false,
    contractVersion: 'category-source-v1',
    selectedCategory: category,
    state: category === 'all' ? 'all' : category === '100' || category === '200' ? 'selected' : 'unknown_category',
    coverageState: 'partial',
    filterBeforeTopN: true,
    membershipEvaluation: 'per_observed_snapshot',
    latestCategoryBackProjectionAllowed: false,
    fullShareDenominator: 'all_observed_twitch_viewers_per_bucket',
    topFocusShareDenominator: 'displayed_selected_category_top_n_viewers_per_bucket',
    availableCategories: options,
    bucketCoverage: coverage,
    coverageCounts: { observed: 1, partial: 1, unavailable: 1 },
  }
  if (category === '999999') return { ...base, bands: [], categoryFilter: filter, availableCategories: options }
  if (category === '100') {
    return { ...base, bands: [band('alpha', 'ALPHA', [30, 0, 35], base.totalViewersByBucket), band('others', 'Others', [70, 120, 55], base.totalViewersByBucket, true)], categoryFilter: filter, availableCategories: options }
  }
  if (category === '200') {
    return { ...base, bands: [band('beta', 'BETA', [20, 25, 0], base.totalViewersByBucket), band('alpha', 'ALPHA', [0, 40, 0], base.totalViewersByBucket), band('others', 'Others', [80, 55, 90], base.totalViewersByBucket, true)], categoryFilter: filter, availableCategories: options }
  }
  return { ...base, categoryFilter: filter, availableCategories: options }
}

function band(id, name, values, totals, isOthers = false) {
  const peak = Math.max(...values)
  return {
    streamerId: id,
    name,
    title: `${name} title`,
    url: `https://www.twitch.tv/${id}`,
    isOthers,
    totalViewerMinutes: values.reduce((sum, value) => sum + value * 5, 0),
    peakViewers: peak,
    avgViewers: Math.round(values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.filter(Boolean).length)),
    peakShare: Math.max(...values.map((value, index) => totals[index] ? value / totals[index] : 0)),
    biggestRiseBucket: times()[1],
    biggestRiseValue: Math.max(0, values[1] - values[0]),
    firstSeen: times()[0],
    lastSeen: times()[2],
    buckets: values.map((viewers, index) => ({ viewers, share: totals[index] ? viewers / totals[index] : 0, activity: 0, activityAvailable: false, peak: viewers === peak && viewers > 0, rise: false })),
  }
}

function times() {
  return ['2026-08-08T00:00:00.000Z', '2026-08-08T00:05:00.000Z', '2026-08-08T00:10:00.000Z']
}
