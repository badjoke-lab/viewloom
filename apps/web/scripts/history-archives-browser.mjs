import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { chromium } from 'playwright'
import { historyPayload } from './history-battle-archive-fixture.mjs'

const base = process.env.HISTORY_ARCHIVES_BASE_URL ?? 'http://127.0.0.1:4173'
const out = resolve(process.env.HISTORY_ARCHIVES_ARTIFACT_DIR ?? 'artifacts/history-archives')
const assert = (ok, message) => { if (!ok) throw new Error(message) }
mkdirSync(out, { recursive: true })

async function installRoutes(context, calls) {
  const reply = async (route, provider) => {
    calls[provider] += 1
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(historyPayload(provider)) })
  }
  await context.route('**/api/history?**', (route) => reply(route, 'twitch'))
  await context.route('**/api/kick-history?**', (route) => reply(route, 'kick'))
}

async function waitForArchives(page) {
  await page.waitForFunction(() => document.querySelector('[data-history-daily-archive]')?.dataset.historyDailyHierarchyReady === 'true')
  await page.waitForFunction(() => document.querySelectorAll('[data-history-peak-day]').length === 10)
  await page.waitForFunction(() => document.querySelectorAll('[data-history-battle-day]').length === 10)
}

async function openArchive(page, archive) {
  await page.locator('button[data-history-view="archives"]').click()
  await page.locator(`button[data-history-archive-view="${archive}"]`).click()
  await page.waitForFunction((expected) => document.querySelector('.history-page')?.getAttribute('data-history-archive-view') === expected, archive)
}

async function assertDarkSurface(locator, label) {
  const background = await locator.evaluate((node) => getComputedStyle(node).backgroundColor)
  assert(background !== 'rgba(0, 0, 0, 0)', `${label}: archive card has a transparent surface.`)
  assert(!/^rgba?\(255,\s*255,\s*255/.test(background), `${label}: placeholder-light archive card remains (${background}).`)
}

async function assertNoOverflow(page, label) {
  const dimensions = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, innerWidth: window.innerWidth }))
  assert(dimensions.scrollWidth <= dimensions.innerWidth + 1, `${label}: horizontal overflow (${dimensions.scrollWidth} > ${dimensions.innerWidth})`)
}

async function desktopGate(browser) {
  const calls = { twitch: 0, kick: 0 }
  const context = await browser.newContext({ viewport: { width: 1440, height: 1100 } })
  await installRoutes(context, calls)
  const page = await context.newPage()
  await page.goto(`${base}/twitch/history/?view=archives&archive=daily&period=30d&metric=viewer_minutes`, { waitUntil: 'domcontentloaded' })
  await waitForArchives(page)
  assert(calls.twitch > 0 && calls.kick === 0, 'Desktop: Twitch Archives crossed provider endpoints.')
  const initialCalls = calls.twitch

  await openArchive(page, 'daily')
  const visibleDays = page.locator('[data-history-day-card]:visible')
  assert(await visibleDays.count() === 9, 'Desktop: Daily archive is not bounded to nine matching days.')
  assert(await visibleDays.first().getAttribute('class').then((value) => value?.includes('is-featured')), 'Desktop: latest matching Daily card is not featured.')
  assert((await visibleDays.first().locator('[data-history-day-type]').textContent())?.trim() === 'Latest matching day', 'Desktop: Daily featured label is wrong.')
  await assertDarkSurface(visibleDays.first(), 'Desktop Daily')

  await page.locator('[data-history-clarity-filter="complete"]').click()
  await page.waitForFunction(() => document.querySelectorAll('[data-history-day-card].is-featured:not([hidden])').length === 1)
  assert((await page.locator('[data-history-day-card].is-featured:not([hidden]) [data-history-day-type]').textContent())?.trim() === 'Latest matching day', 'Desktop: Daily featured hierarchy did not follow the active filter.')

  await openArchive(page, 'peaks')
  const peaks = page.locator('[data-history-peak-day]')
  assert(await peaks.count() === 10, 'Desktop: Peak archive is not bounded to Top 10.')
  assert(await peaks.first().getAttribute('data-history-peak-featured') === 'true', 'Desktop: highest Peak is not featured.')
  assert((await peaks.first().locator('.history-archive-event-type').textContent())?.trim() === 'Highest peak', 'Desktop: highest Peak label is wrong.')
  assert((await peaks.nth(1).locator('.history-archive-event-type').textContent())?.trim() === 'Observed peak', 'Desktop: secondary Peak label is wrong.')
  await assertDarkSurface(peaks.first(), 'Desktop Peak')

  await openArchive(page, 'battles')
  const battles = page.locator('[data-history-battle-day]')
  assert(await battles.count() === 10, 'Desktop: Battle archive is not bounded to Top 10.')
  assert(await battles.first().getAttribute('data-history-battle-featured') === 'true', 'Desktop: closest Battle is not featured.')
  assert((await battles.first().locator('.history-archive-event-type').textContent())?.trim() === 'Closest daily matchup', 'Desktop: featured Battle label is wrong.')
  assert((await battles.nth(1).locator('.history-archive-event-type').textContent())?.trim() === 'Very close day', 'Desktop: typed Battle label is wrong.')
  assert((await battles.first().textContent())?.includes('No reversal or exact event time inferred.'), 'Desktop: Battle non-inference statement is missing.')
  await assertDarkSurface(battles.first(), 'Desktop Battle')

  assert(calls.twitch === initialCalls, `Desktop: History API was fetched again while switching archives (${initialCalls} -> ${calls.twitch}).`)
  await assertNoOverflow(page, 'Twitch desktop Archives')
  await page.screenshot({ path: resolve(out, 'history-archives-twitch-desktop.png'), fullPage: true })
  await context.close()
}

async function mobileGate(browser) {
  const calls = { twitch: 0, kick: 0 }
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true })
  await installRoutes(context, calls)
  const page = await context.newPage()
  await page.goto(`${base}/kick/history/?view=archives&archive=battles&period=30d&metric=viewer_minutes`, { waitUntil: 'domcontentloaded' })
  await waitForArchives(page)
  assert(calls.kick > 0 && calls.twitch === 0, 'Mobile: Kick Archives crossed provider endpoints.')
  const initialCalls = calls.kick

  await openArchive(page, 'battles')
  const battles = page.locator('[data-history-battle-day]')
  assert(await battles.count() === 10, 'Mobile: Battle archive is not bounded to Top 10.')
  assert((await battles.first().locator('.history-archive-event-type').textContent())?.trim() === 'Closest daily matchup', 'Mobile: featured Battle label is wrong.')
  await assertDarkSurface(battles.first(), 'Mobile Battle')

  await openArchive(page, 'peaks')
  assert((await page.locator('[data-history-peak-day]').first().locator('.history-archive-event-type').textContent())?.trim() === 'Highest peak', 'Mobile: featured Peak label is wrong.')
  await openArchive(page, 'daily')
  assert((await page.locator('[data-history-day-card]:visible').first().locator('[data-history-day-type]').textContent())?.trim() === 'Latest matching day', 'Mobile: featured Daily label is wrong.')

  assert(calls.kick === initialCalls, `Mobile: History API was fetched again while switching archives (${initialCalls} -> ${calls.kick}).`)
  await assertNoOverflow(page, 'Kick mobile Archives')
  await page.screenshot({ path: resolve(out, 'history-archives-kick-mobile.png'), fullPage: true })
  await context.close()
}

const browser = await chromium.launch({ headless: true })
try {
  await desktopGate(browser)
  await mobileGate(browser)
  console.log('History Archives browser gate passed.')
} catch (error) {
  const text = error instanceof Error ? `${error.stack ?? error.message}\n` : `${String(error)}\n`
  writeFileSync(resolve(out, 'failure.txt'), text)
  throw error
} finally {
  await browser.close()
}
