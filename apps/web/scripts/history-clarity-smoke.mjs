import { chromium } from 'playwright'

const baseUrl = process.env.HISTORY_BASE_URL ?? 'http://127.0.0.1:4173'

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function isoDay(date) {
  return date.toISOString().slice(0, 10)
}

function fixture(url, platform) {
  const today = isoDay(new Date())
  const start = new Date(`${today}T00:00:00Z`)
  start.setUTCDate(start.getUTCDate() - 29)
  const from = isoDay(start)
  const missingIndexes = new Set([3, 4, 5, 12])
  const partialIndexes = new Set([8, 14, 20])
  const streamers = Array.from({ length: 12 }, (_, index) => ({
    streamerId: `${platform}-${index + 1}`,
    displayName: `${platform} streamer ${index + 1}`,
    viewerMinutes: 500000000 - index * 17000000,
    peakViewers: 80000 - index * 2100,
    avgViewers: 12000 - index * 400,
    observedMinutes: 1300,
    rankByViewerMinutes: index + 1,
    rankByPeak: index + 1,
    changePct: null,
    changeAbs: 500000000 - index * 17000000,
    comparisonState: 'new',
  }))
  const daily = []
  for (let index = 0; index < 30; index += 1) {
    if (missingIndexes.has(index)) continue
    const date = new Date(`${from}T00:00:00Z`)
    date.setUTCDate(date.getUTCDate() + index)
    const day = isoDay(date)
    const inProgress = day === today
    daily.push({
      day,
      totalViewerMinutes: inProgress ? 20000000 : 700000000 + index * 10000000,
      peakViewers: inProgress ? 35000 : 120000 + index * 2000,
      peakStreamerName: streamers[index % 4].displayName,
      observedStreamCount: 100,
      observedMinutes: inProgress ? 240 : partialIndexes.has(index) ? 600 : 1380,
      coverageState: inProgress || partialIndexes.has(index) ? 'partial' : 'good',
      topStreamers: streamers.slice(0, 5),
      biggestRise: null,
    })
  }
  return {
    source: 'real',
    state: 'partial',
    platform,
    metric: url.searchParams.get('metric') === 'peak_viewers' ? 'peak_viewers' : 'viewer_minutes',
    period: { from, to: today, label: 'Last 30 days', days: 30 },
    summary: {
      totalViewerMinutes: daily.filter((day) => day.day < today && day.coverageState === 'good').reduce((sum, day) => sum + day.totalViewerMinutes, 0),
      peakViewers: 170000,
      peakDay: daily.at(-2).day,
      peakDayViewerMinutes: daily.at(-2).totalViewerMinutes,
      topStreamer: streamers[0],
      biggestRise: null,
      coverageState: 'partial',
    },
    daily,
    topStreamers: streamers,
    coverage: {
      state: 'partial',
      observedDays: 26,
      missingDays: 4,
      partialDays: 3,
      observedMinutes: daily.reduce((sum, day) => sum + day.observedMinutes, 0),
      expectedMinutes: 30 * 1440,
      affectedDays: [],
      notes: ['26 of 30 requested days have observed history data.'],
    },
    notes: [],
  }
}

async function openArchive(page, archive) {
  await page.locator('button[data-history-view="archives"]').click()
  await page.locator(`button[data-history-archive-view="${archive}"]`).click()
  await page.waitForFunction((expected) => document.querySelector('.history-page')?.getAttribute('data-history-archive-view') === expected, archive)
}

const browser = await chromium.launch({ headless: true })
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  await context.route('**/api/history?**', async (route) => {
    const url = new URL(route.request().url())
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(fixture(url, 'twitch')) })
  })
  await context.route('**/api/kick-history?**', async (route) => {
    const url = new URL(route.request().url())
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(fixture(url, 'kick')) })
  })

  const page = await context.newPage()
  await page.goto(`${baseUrl}/kick/history/`, { waitUntil: 'networkidle' })
  await page.waitForFunction(() => document.querySelectorAll('.history-day-column').length === 30)
  await page.waitForFunction(() => document.querySelectorAll('[data-history-day-card]').length === 30)
  await page.waitForFunction(() => document.querySelector('.history-peak-archive thead th:last-child')?.textContent?.trim() === 'Vs previous')

  assert(await page.locator('.history-bar--missing').count() === 4, 'Chart does not preserve four missing date slots')
  assert(await page.locator('[data-history-day-card][data-history-clarity-state="missing"]').count() === 4, 'Archive does not preserve four missing dates')
  assert((await page.locator('[data-history-summary] > div').nth(3).locator('strong').textContent())?.trim() === 'No baseline', 'Summary does not show No baseline')
  assert((await page.locator('.history-peak-archive tbody tr').first().locator('td').last().textContent())?.trim() === 'Low baseline', 'Rows incorrectly label absent comparison data as New')

  const alignment = await page.evaluate(() => {
    const header = document.querySelector('.history-peak-archive thead th:nth-child(3)')
    const cell = document.querySelector('.history-peak-archive tbody td:nth-child(3)')
    return {
      header: header ? getComputedStyle(header).textAlign : '',
      cell: cell ? getComputedStyle(cell).textAlign : '',
    }
  })
  assert(alignment.header === 'right' && alignment.cell === 'right', `Numeric alignment differs (${alignment.header}/${alignment.cell})`)
  assert((await page.locator('[data-history-selected-day]').textContent())?.includes('Tracked streams (max)'), 'Selected day label is unclear')
  assert((await page.locator('[data-history-daily-archive]').textContent())?.includes('Tracked streams (max)'), 'Archive label is unclear')
  assert(await page.locator('[data-history-feedback]').isHidden(), 'Duplicate coverage feedback remains visible')

  await openArchive(page, 'daily')
  const missingFilter = page.locator('[data-history-clarity-filter="missing"]')
  assert((await missingFilter.textContent())?.trim() === 'Missing (4)', 'Missing filter count is wrong')
  await missingFilter.click()
  assert(await page.locator('[data-history-day-card]:visible').count() === 4, 'Missing filter does not isolate missing days')

  const coverageText = (await page.locator('[data-history-notes]').textContent()) ?? ''
  assert(coverageText.includes('In progress') && coverageText.includes('Partial') && coverageText.includes('Missing'), 'Coverage dates are not classified')

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  assert(overflow <= 1, `History clarity view overflows by ${overflow}px`)
  await page.screenshot({ path: '/tmp/history-clarity-desktop.png', fullPage: true })
  console.log('History clarity browser gate passed.')
  await context.close()
} finally {
  await browser.close()
}
