import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { chromium } from 'playwright'
import { historyPayload } from './history-battle-archive-fixture.mjs'

const base = process.env.HISTORY_VIEW_SHELL_BASE_URL ?? 'http://127.0.0.1:4173'
const artifactDir = resolve(process.env.HISTORY_VIEW_SHELL_ARTIFACT_DIR ?? 'artifacts/history-view-shell')
const assert = (value, message) => { if (!value) throw new Error(message) }

mkdirSync(artifactDir, { recursive: true })

async function installRoutes(context, calls) {
  const fulfill = async (route, provider) => {
    calls[provider] += 1
    const requestUrl = new URL(route.request().url())
    const payload = historyPayload(provider)
    payload.metric = requestUrl.searchParams.get('metric') === 'peak_viewers' ? 'peak_viewers' : 'viewer_minutes'
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(payload) })
  }
  await context.route('**/api/history*', (route) => fulfill(route, 'twitch'))
  await context.route('**/api/kick-history*', (route) => fulfill(route, 'kick'))
}

async function waitForShell(page) {
  await page.waitForFunction(() => {
    const shell = document.querySelector('[data-history-view-shell]')
    return shell?.getAttribute('data-history-shell-ready') === 'true'
      && document.querySelector('[data-history-calendar]')
      && document.querySelector('[data-history-peak-archive]')
      && document.querySelector('[data-history-battle-archive]')
      && document.querySelector('[data-history-report]')
      && document.querySelector('[data-history-share-card]')
      && document.querySelector('[data-history-export]')
  })
}

async function assertView(page, view, archive = null) {
  const state = await page.evaluate(() => ({
    view: document.querySelector('.history-page')?.getAttribute('data-history-view'),
    archive: document.querySelector('.history-page')?.getAttribute('data-history-archive-view'),
    visibleViews: [...document.querySelectorAll('[data-history-view-panel]')].filter((node) => !node.hidden).map((node) => node.getAttribute('data-history-view-panel')),
    visibleArchives: [...document.querySelectorAll('[data-history-archive-panel]')].filter((node) => !node.hidden).map((node) => node.getAttribute('data-history-archive-panel')),
  }))
  assert(state.view === view, `Expected ${view} view, received ${state.view}.`)
  assert(state.visibleViews.length === 1 && state.visibleViews[0] === view, `${view}: incorrect visible view panels.`)
  if (view === 'archives') {
    assert(state.archive === archive, `Expected ${archive} archive, received ${state.archive}.`)
    assert(state.visibleArchives.length === 1 && state.visibleArchives[0] === archive, `${archive}: incorrect visible archive panels.`)
  }
}

async function assertNoOverflow(page, label) {
  const width = await page.evaluate(() => [document.documentElement.scrollWidth, innerWidth])
  assert(width[0] <= width[1] + 1, `${label}: horizontal overflow (${width[0]} > ${width[1]}).`)
}

async function desktopGate(browser) {
  const calls = { twitch: 0, kick: 0 }
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
  await installRoutes(context, calls)
  const page = await context.newPage()
  await page.goto(`${base}/twitch/history/?period=30d&metric=viewer_minutes&day=2026-06-10&sort=peak_viewers&limit=50`, { waitUntil: 'domcontentloaded' })
  await waitForShell(page)

  await assertView(page, 'overview')
  let url = new URL(page.url())
  assert(!url.searchParams.has('view') && !url.searchParams.has('archive'), 'Overview URL is not canonical and clean.')
  const baselineCalls = calls.twitch
  assert(baselineCalls > 0 && calls.kick === 0, 'Twitch shell crossed provider endpoints.')

  const placement = await page.evaluate(() => ({
    calendar: document.querySelector('[data-history-calendar]')?.closest('[data-history-view-panel]')?.getAttribute('data-history-view-panel'),
    daily: document.querySelector('[data-history-daily-archive]')?.closest('[data-history-archive-panel]')?.getAttribute('data-history-archive-panel'),
    peaks: document.querySelector('[data-history-peak-archive]')?.closest('[data-history-archive-panel]')?.getAttribute('data-history-archive-panel'),
    battles: document.querySelector('[data-history-battle-archive]')?.closest('[data-history-archive-panel]')?.getAttribute('data-history-archive-panel'),
    report: document.querySelector('[data-history-report]')?.closest('[data-history-view-panel]')?.getAttribute('data-history-view-panel'),
    share: document.querySelector('[data-history-share-card]')?.closest('[data-history-view-panel]')?.getAttribute('data-history-view-panel'),
    export: document.querySelector('[data-history-export]')?.closest('[data-history-view-panel]')?.getAttribute('data-history-view-panel'),
  }))
  assert(placement.calendar === 'overview', 'Calendar was not placed in Overview.')
  assert(placement.daily === 'daily' && placement.peaks === 'peaks' && placement.battles === 'battles', 'Archive modules were not separated.')
  assert(placement.report === 'report' && placement.share === 'report' && placement.export === 'report', 'Report tools were not grouped.')

  await page.locator('[data-history-view="archives"]').click()
  await assertView(page, 'archives', 'daily')
  url = new URL(page.url())
  assert(url.searchParams.get('view') === 'archives' && url.searchParams.get('archive') === 'daily', 'Daily archive URL state is incorrect.')
  for (const [key, value] of [['period', '30d'], ['metric', 'viewer_minutes'], ['day', '2026-06-10'], ['sort', 'peak_viewers'], ['limit', '50']]) {
    assert(url.searchParams.get(key) === value, `View switch lost ${key}.`)
  }
  assert(calls.twitch === baselineCalls, 'Daily view switching triggered another History request.')

  await page.locator('[data-history-archive-view="peaks"]').click()
  await assertView(page, 'archives', 'peaks')
  assert(new URL(page.url()).searchParams.get('archive') === 'peaks', 'Peak archive URL state is incorrect.')
  assert(calls.twitch === baselineCalls, 'Peak view switching triggered another History request.')

  await page.locator('[data-history-view="report"]').click()
  await assertView(page, 'report')
  url = new URL(page.url())
  assert(url.searchParams.get('view') === 'report' && !url.searchParams.has('archive'), 'Report URL state is incorrect.')
  assert(calls.twitch === baselineCalls, 'Report view switching triggered another History request.')

  await page.locator('[data-history-view="archives"]').click()
  await assertView(page, 'archives', 'peaks')
  assert(calls.twitch === baselineCalls, 'Restoring the remembered archive triggered another History request.')

  const beforeMetric = calls.twitch
  await page.locator('[data-history-metric="peak_viewers"]').click()
  await page.waitForFunction(() => document.querySelector('[data-history-export]')?.getAttribute('data-export-metric') === 'peak_viewers')
  await assertView(page, 'archives', 'peaks')
  url = new URL(page.url())
  assert(url.searchParams.get('view') === 'archives' && url.searchParams.get('archive') === 'peaks', 'Base shell URL replacement dropped History view state.')
  assert(calls.twitch > beforeMetric, 'Metric refresh did not use the Twitch History endpoint.')
  assert(calls.kick === 0, 'Metric refresh crossed provider endpoints.')

  await page.locator('[data-history-view="report"]').click()
  await page.locator('[data-history-view="report"]').focus()
  await page.keyboard.press('Home')
  await assertView(page, 'overview')
  await page.locator('[data-history-view="overview"]').focus()
  await page.keyboard.press('ArrowRight')
  await assertView(page, 'archives', 'peaks')

  const callsBeforeHistory = calls.twitch
  await page.locator('[data-history-view="report"]').click()
  await assertView(page, 'report')
  await page.goBack()
  await page.waitForFunction(() => document.querySelector('.history-page')?.getAttribute('data-history-view') === 'archives')
  await assertView(page, 'archives', 'peaks')
  await page.goForward()
  await page.waitForFunction(() => document.querySelector('.history-page')?.getAttribute('data-history-view') === 'report')
  await assertView(page, 'report')
  assert(calls.twitch === callsBeforeHistory, 'Back/Forward view switching triggered another History request.')

  await assertNoOverflow(page, 'Twitch desktop')
  await page.screenshot({ path: resolve(artifactDir, 'history-view-shell-twitch-report.png'), fullPage: true })
  await context.close()
}

async function mobileGate(browser) {
  const calls = { twitch: 0, kick: 0 }
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true })
  await installRoutes(context, calls)
  const page = await context.newPage()
  await page.goto(`${base}/kick/history/?view=invalid&archive=invalid&period=7d&metric=peak_viewers&day=2026-06-10&sort=peak_viewers&limit=50`, { waitUntil: 'domcontentloaded' })
  await waitForShell(page)

  await assertView(page, 'overview')
  const url = new URL(page.url())
  assert(!url.searchParams.has('view') && !url.searchParams.has('archive'), 'Invalid mobile view state was not normalized.')
  assert(url.searchParams.get('period') === '7d' && url.searchParams.get('metric') === 'peak_viewers', 'Invalid-state normalization removed valid analysis state.')
  assert(calls.kick > 0 && calls.twitch === 0, 'Kick mobile shell crossed provider endpoints.')

  const baseline = calls.kick
  await page.locator('[data-history-view="archives"]').click()
  await page.locator('[data-history-archive-view="battles"]').click()
  await assertView(page, 'archives', 'battles')
  assert(calls.kick === baseline, 'Mobile archive switching triggered another History request.')
  await assertNoOverflow(page, 'Kick mobile')
  await page.screenshot({ path: resolve(artifactDir, 'history-view-shell-kick-battles.png'), fullPage: true })
  await context.close()
}

const browser = await chromium.launch({ headless: true })
try {
  await desktopGate(browser)
  await mobileGate(browser)
  console.log('History view shell browser gate passed.')
} finally {
  await browser.close()
}
