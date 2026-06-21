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
  const today = isoDay(new Date())
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
    to = today
    const start = new Date(`${to}T00:00:00Z`)
    start.setUTCDate(start.getUTCDate() - count + 1)
    from = isoDay(start)
    label = count === 7 ? 'Last 7 days' : 'Last 30 days'
  }

  const streamers = Array.from({ length: 24 }, (_, index) => ({
    streamerId: `${platform}-streamer-${index + 1}`,
    displayName: `${platform === 'twitch' ? 'Twitch' : 'Kick'} Streamer ${index + 1}`,
    viewerMinutes: 900000000 - index * 21000000,
    peakViewers: 24000 + index * 900,
    avgViewers: 6200 - index * 120,
    observedMinutes: 1440 - index * 8,
    rankByViewerMinutes: index + 1,
    rankByPeak: 24 - index,
    changePct: index === 0 ? null : index === 1 ? null : index === 2 ? 0.18 : index === 3 ? -0.07 : 0.02,
    changeAbs: index === 0 ? 800000000 : index === 1 ? 700000000 : index === 2 ? 120000000 : index === 3 ? -38000000 : 9000000,
    comparisonState: index === 0 ? 'insufficient' : index === 1 ? 'new' : 'comparable',
  }))

  const includesToday = to === today
  const daily = Array.from({ length: count }, (_, index) => {
    const day = new Date(`${from}T00:00:00Z`)
    day.setUTCDate(day.getUTCDate() + index)
    const dayKey = isoDay(day)
    const inProgress = includesToday && dayKey === today
    return {
      day: dayKey,
      totalViewerMinutes: inProgress ? 52000000 : 5000000000 + index * 175000000,
      peakViewers: inProgress ? 42000 : 140000 + index * 5500,
      peakStreamerName: streamers[index % 5].displayName,
      observedStreamCount: 180 + index,
      observedMinutes: inProgress ? 250 : 1380,
      coverageState: inProgress ? 'partial' : 'good',
      topStreamers: streamers.slice(0, 5),
      biggestRise: {
        streamerId: streamers[2].streamerId,
        displayName: streamers[2].displayName,
        changePct: 0.18,
        changeAbs: 120000000,
      },
    }
  })

  const completedDaily = includesToday ? daily.slice(0, -1) : daily
  const summaryDays = completedDaily.length ? completedDaily : daily
  const peakDay = summaryDays.at(-1)
  return {
    source: 'real',
    state: includesToday ? 'partial' : 'fresh',
    platform,
    metric,
    period: { from, to, label, days: count },
    summary: {
      totalViewerMinutes: summaryDays.reduce((sum, day) => sum + day.totalViewerMinutes, 0),
      peakViewers: peakDay.peakViewers,
      peakDay: peakDay.day,
      peakDayViewerMinutes: peakDay.totalViewerMinutes,
      topStreamer: streamers[0],
      biggestRise: {
        streamerId: streamers[2].streamerId,
        displayName: streamers[2].displayName,
        changePct: 0.18,
        changeAbs: 120000000,
      },
      coverageState: includesToday ? 'partial' : 'good',
      summaryScope: includesToday ? 'completed_days' : 'all_observed_days',
    },
    daily,
    topStreamers: streamers,
    coverage: {
      state: includesToday ? 'partial' : 'good',
      observedDays: count,
      missingDays: 0,
      partialDays: 0,
      inProgressDays: includesToday ? 1 : 0,
      observedMinutes: daily.reduce((sum, day) => sum + day.observedMinutes, 0),
      expectedMinutes: count * 1440,
      affectedDays: includesToday ? [today] : [],
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

async function visibleArchiveCount(page) {
  return page.locator('[data-history-day-card]:visible').count()
}

async function openView(page, view) {
  await page.locator(`button[data-history-view="${view}"]`).click()
  await page.waitForFunction((expected) => document.querySelector('.history-page')?.getAttribute('data-history-view') === expected, view)
}

async function openArchive(page, archive) {
  await openView(page, 'archives')
  await page.locator(`button[data-history-archive-view="${archive}"]`).click()
  await page.waitForFunction((expected) => document.querySelector('.history-page')?.getAttribute('data-history-archive-view') === expected, archive)
}

async function desktopGate(browser) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  await installApiRoutes(context)
  const page = await context.newPage()
  await page.goto(`${baseUrl}/twitch/history/`, { waitUntil: 'networkidle' })
  await waitForHistory(page, 30)

  const today = isoDay(new Date())
  const latestCompleted = new Date(`${today}T00:00:00Z`)
  latestCompleted.setUTCDate(latestCompleted.getUTCDate() - 1)
  const latestCompletedDay = isoDay(latestCompleted)
  await page.waitForFunction((day) => new URL(location.href).searchParams.get('day') === day, latestCompletedDay)

  assert(await page.locator('h1').textContent() === 'History & Trends', 'Desktop: History H1 is wrong')
  assert(await page.locator('.history-y-label').count() >= 5, 'Desktop: chart Y-axis labels are missing')
  assert((await page.locator('[data-history-state-pill]').textContent())?.trim() === 'Partial', 'Desktop: state pill does not expose in-progress coverage')
  assert((await page.locator('.data-strip').textContent())?.includes('Real'), 'Desktop: public source label is not Real')
  assert((await page.locator('[data-history-coverage-summary]').textContent())?.includes('Today is still in progress.'), 'Desktop: in-progress coverage warning is missing')
  assert(await page.locator('[data-history-chart-legend] span').count() === 4, 'Desktop: chart coverage legend is incomplete')
  assert((await page.locator(`[data-history-day-card="${today}"] .history-badge`).textContent())?.trim() === 'In progress', 'Desktop: today card is not marked in progress')
  assert(await page.locator('.metric-ledger tbody tr').count() === 10, 'Desktop: Top 10 is not the default ranking limit')
  assert((await page.locator('.metric-ledger tbody tr').first().locator('td').last().textContent())?.trim() === 'Low baseline', 'Desktop: low comparison baseline is not labeled')
  assert(await page.locator('[data-history-daily-archive] .day-card').count() === 30, 'Desktop: archive did not render all retained cards')
  const summaryText = (await page.locator('[data-history-summary] .lead-stat strong').textContent())?.trim() ?? ''
  assert(/[KMBT]$/.test(summaryText), `Desktop: headline total is not compact (${summaryText})`)

  await openArchive(page, 'daily')
  assert(await visibleArchiveCount(page) === 9, 'Desktop: archive did not collapse to the recent nine days')
  await page.locator('[data-history-archive-toggle]').click()
  assert(await visibleArchiveCount(page) === 30, 'Desktop: Show all days did not expand the archive')

  await page.locator('[data-history-metric="peak_viewers"]').click()
  await waitForHistory(page, 30)
  await page.waitForFunction(() => new URL(location.href).searchParams.get('metric') === 'peak_viewers')
  assert((await page.locator('.history-chart-caption strong').textContent())?.trim() === 'Peak viewers', 'Desktop: metric switch did not redraw chart')

  await page.locator('[data-history-period="7d"]').click()
  await waitForHistory(page, 7)
  await page.waitForFunction(() => new URL(location.href).searchParams.get('period') === '7d')
  await page.waitForFunction((day) => new URL(location.href).searchParams.get('day') === day, latestCompletedDay)

  await openView(page, 'overview')
  const firstBar = page.locator('.history-day-column').first()
  const selectedDay = await firstBar.getAttribute('data-history-day')
  await firstBar.click()
  await page.waitForFunction((day) => new URL(location.href).searchParams.get('day') === day, selectedDay)
  await page.waitForFunction(() => document.querySelector('.history-selected-top li span')?.textContent?.startsWith('#1 '))
  assert((await page.locator('[data-history-selected-day]').textContent())?.includes('#1 '), 'Desktop: selected-day Top 5 is not ranked')
  assert((await page.locator('[data-history-selected-day] a').first().getAttribute('href'))?.includes(`date=${selectedDay}`), 'Desktop: Day Flow link is not date-specific')
  await assertNoPageOverflow(page, 'Desktop')
  await page.screenshot({ path: '/tmp/history-twitch-desktop.png', fullPage: true })
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
  assert(await page.locator('.history-streamer-card').count() === 10, 'Mobile: expected Top 10 streamer cards')

  await openArchive(page, 'daily')
  assert(await visibleArchiveCount(page) === 9, 'Mobile: archive did not collapse to nine days')
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
  assert(await visibleArchiveCount(page) === 5, 'Mobile: short custom archive should not hide days')
  await assertNoPageOverflow(page, 'Mobile')
  await page.screenshot({ path: '/tmp/history-kick-mobile.png', fullPage: true })
  await context.close()
}

const browser = await chromium.launch({ headless: true })
try {
  await desktopGate(browser)
  await mobileGate(browser)
  console.log('History usability browser gate passed for desktop and mobile.')
} finally {
  await browser.close()
}
