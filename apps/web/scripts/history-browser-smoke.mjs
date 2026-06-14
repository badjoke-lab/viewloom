import { chromium } from 'playwright'

const baseUrl = process.env.HISTORY_BASE_URL ?? 'http://127.0.0.1:4173'

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function isoDay(date) {
  return date.toISOString().slice(0, 10)
}

function makePayload(url, platform) {
  const metric = url.searchParams.get('metric') === 'peak_viewers' ? 'peak_viewers' : 'viewer_minutes'
  let from
  let to
  let count
  let label

  if (url.searchParams.get('from') && url.searchParams.get('to')) {
    from = url.searchParams.get('from')
    to = url.searchParams.get('to')
    count = Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86400000) + 1
    label = `${from} to ${to}`
  } else {
    count = url.searchParams.get('period') === '7d' ? 7 : 30
    to = '2026-06-14'
    const start = new Date(`${to}T00:00:00Z`)
    start.setUTCDate(start.getUTCDate() - count + 1)
    from = isoDay(start)
    label = count === 7 ? 'Last 7 days' : 'Last 30 days'
  }

  const streamers = Array.from({ length: 24 }, (_, index) => ({
    streamerId: `${platform}-streamer-${index + 1}`,
    displayName: `${platform === 'twitch' ? 'Twitch' : 'Kick'} Streamer ${index + 1}`,
    viewerMinutes: 900000 - index * 21000,
    peakViewers: 24000 + index * 900,
    avgViewers: 6200 - index * 120,
    observedMinutes: 1440 - index * 8,
    rankByViewerMinutes: index + 1,
    rankByPeak: 24 - index,
    changePct: index === 0 ? 0.18 : index === 1 ? -0.07 : 0.02,
    changeAbs: index === 0 ? 120000 : index === 1 ? -38000 : 9000,
    comparisonState: 'comparable',
  }))

  const daily = Array.from({ length: count }, (_, index) => {
    const day = new Date(`${from}T00:00:00Z`)
    day.setUTCDate(day.getUTCDate() + index)
    return {
      day: isoDay(day),
      totalViewerMinutes: 5000000 + index * 175000,
      peakViewers: 140000 + index * 5500,
      peakStreamerName: streamers[index % 5].displayName,
      observedStreamCount: 180 + index,
      observedMinutes: 1380,
      coverageState: 'good',
      topStreamers: streamers.slice(0, 5),
      biggestRise: {
        streamerId: streamers[0].streamerId,
        displayName: streamers[0].displayName,
        changePct: 0.18,
        changeAbs: 120000,
      },
    }
  })

  const peakDay = daily.at(-1)
  return {
    source: 'real',
    state: 'fresh',
    platform,
    metric,
    period: { from, to, label, days: count },
    summary: {
      totalViewerMinutes: daily.reduce((sum, day) => sum + day.totalViewerMinutes, 0),
      peakViewers: peakDay.peakViewers,
      peakDay: peakDay.day,
      peakDayViewerMinutes: peakDay.totalViewerMinutes,
      topStreamer: streamers[0],
      biggestRise: {
        streamerId: streamers[0].streamerId,
        displayName: streamers[0].displayName,
        changePct: 0.18,
        changeAbs: 120000,
      },
      coverageState: 'good',
    },
    daily,
    topStreamers: streamers,
    coverage: {
      state: 'good',
      observedDays: count,
      missingDays: 0,
      partialDays: 0,
      observedMinutes: count * 1380,
      expectedMinutes: count * 1440,
      affectedDays: [],
      notes: [`${count} of ${count} requested days have observed ${platform} history data.`],
    },
    notes: [],
  }
}

async function installApiRoutes(context) {
  await context.route('**/api/history?**', async (route) => {
    const url = new URL(route.request().url())
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(makePayload(url, 'twitch')) })
  })
  await context.route('**/api/kick-history?**', async (route) => {
    const url = new URL(route.request().url())
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(makePayload(url, 'kick')) })
  })
}

async function waitForHistory(page, expectedBars) {
  await page.waitForSelector('.history-day-column')
  await page.waitForFunction((count) => document.querySelectorAll('.history-day-column').length === count, expectedBars)
}

async function assertNoPageOverflow(page, label) {
  const dimensions = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }))
  assert(dimensions.scrollWidth <= dimensions.innerWidth + 1, `${label}: page overflows horizontally (${dimensions.scrollWidth} > ${dimensions.innerWidth})`)
}

async function desktopGate(browser) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  await installApiRoutes(context)
  const page = await context.newPage()
  await page.goto(`${baseUrl}/twitch/history/`, { waitUntil: 'networkidle' })
  await waitForHistory(page, 30)

  assert(await page.locator('h1').textContent() === 'History & Trends', 'Desktop: History H1 is wrong')
  assert(await page.locator('.history-y-label').count() >= 5, 'Desktop: chart Y-axis labels are missing')
  assert((await page.locator('[data-history-state-pill]').textContent())?.trim() === 'Fresh', 'Desktop: state pill is not Fresh')
  assert((await page.locator('.data-strip').textContent())?.includes('Real'), 'Desktop: public source label is not Real')

  await page.locator('[data-history-metric="peak_viewers"]').click()
  await waitForHistory(page, 30)
  await page.waitForFunction(() => new URL(location.href).searchParams.get('metric') === 'peak_viewers')
  assert((await page.locator('.history-chart-caption strong').textContent())?.trim() === 'Peak viewers', 'Desktop: metric switch did not redraw chart')

  await page.locator('[data-history-period="7d"]').click()
  await waitForHistory(page, 7)
  await page.waitForFunction(() => new URL(location.href).searchParams.get('period') === '7d')

  const firstBar = page.locator('.history-day-column').first()
  const selectedDay = await firstBar.getAttribute('data-history-day')
  await firstBar.click()
  await page.waitForFunction((day) => new URL(location.href).searchParams.get('day') === day, selectedDay)
  assert((await page.locator('[data-history-selected-day]').textContent())?.includes('Selected day'), 'Desktop: selected day panel did not update')
  assert((await page.locator('[data-history-selected-day] a').first().getAttribute('href'))?.includes(`date=${selectedDay}`), 'Desktop: Day Flow link is not date-specific')

  await page.locator('[data-history-limit="10"]').click()
  assert(await page.locator('.metric-ledger tbody tr').count() === 10, 'Desktop: Top 10 ranking limit failed')
  await assertNoPageOverflow(page, 'Desktop')
  await context.close()
}

async function mobileGate(browser) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true })
  await installApiRoutes(context)
  const page = await context.newPage()
  await page.goto(`${baseUrl}/kick/history/`, { waitUntil: 'networkidle' })
  await waitForHistory(page, 30)

  const tableDisplay = await page.locator('.history-table-wrap').evaluate((node) => getComputedStyle(node).display)
  const cardsDisplay = await page.locator('[data-history-streamer-cards]').evaluate((node) => getComputedStyle(node).display)
  assert(tableDisplay === 'none', 'Mobile: ranking table is still visible')
  assert(cardsDisplay !== 'none', 'Mobile: streamer cards are hidden')
  assert(await page.locator('.history-streamer-card').count() === 20, 'Mobile: expected Top 20 streamer cards')

  await page.locator('[data-history-period="custom"]').click()
  await page.locator('[data-history-from]').fill('2026-06-10')
  await page.locator('[data-history-to]').fill('2026-06-05')
  await page.locator('[data-history-apply-range]').click()
  assert((await page.locator('[data-history-feedback]').textContent())?.includes('start date must be on or before'), 'Mobile: invalid custom range is not explained')

  await page.locator('[data-history-from]').fill('2026-06-01')
  await page.locator('[data-history-to]').fill('2026-06-05')
  await page.locator('[data-history-apply-range]').click()
  await waitForHistory(page, 5)
  await page.waitForFunction(() => {
    const params = new URL(location.href).searchParams
    return params.get('from') === '2026-06-01' && params.get('to') === '2026-06-05'
  })
  assert(await page.locator('[data-history-daily-archive] .day-card').count() === 5, 'Mobile: custom range archive count is wrong')
  await assertNoPageOverflow(page, 'Mobile')
  await context.close()
}

const browser = await chromium.launch({ headless: true })
try {
  await desktopGate(browser)
  await mobileGate(browser)
  console.log('History browser gate passed for desktop and mobile.')
} finally {
  await browser.close()
}
