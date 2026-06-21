import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { chromium } from 'playwright'
import { historyPayload } from './history-battle-archive-fixture.mjs'

const base = process.env.HISTORY_VIEW_SHELL_BASE_URL ?? 'http://127.0.0.1:4173'
const artifactDir = resolve(process.env.HISTORY_VIEW_SHELL_ARTIFACT_DIR ?? 'artifacts/history-view-shell')
const assert = (value, message) => { if (!value) throw new Error(message) }
mkdirSync(artifactDir, { recursive: true })

async function routes(context, calls) {
  const reply = async (route, provider) => {
    calls[provider] += 1
    const payload = historyPayload(provider)
    payload.metric = new URL(route.request().url()).searchParams.get('metric') === 'peak_viewers' ? 'peak_viewers' : 'viewer_minutes'
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(payload) })
  }
  await context.route('**/api/history*', (route) => reply(route, 'twitch'))
  await context.route('**/api/kick-history*', (route) => reply(route, 'kick'))
}

async function ready(page) {
  await page.waitForFunction(() => document.querySelector('[data-history-view-shell]')?.getAttribute('data-history-shell-ready') === 'true'
    && document.querySelector('[data-history-calendar]')
    && document.querySelector('[data-history-peak-archive]')
    && document.querySelector('[data-history-battle-archive]')
    && document.querySelector('[data-history-report]')
    && document.querySelector('[data-history-share-card]')
    && document.querySelector('[data-history-export]'))
}

async function view(page, expected, archive = null) {
  const state = await page.evaluate(() => ({
    view: document.querySelector('.history-page')?.getAttribute('data-history-view'),
    archive: document.querySelector('.history-page')?.getAttribute('data-history-archive-view'),
    views: [...document.querySelectorAll('[data-history-view-panel]')].filter((node) => !node.hidden).map((node) => node.dataset.historyViewPanel),
    archives: [...document.querySelectorAll('[data-history-archive-panel]')].filter((node) => !node.hidden).map((node) => node.dataset.historyArchivePanel),
  }))
  assert(state.view === expected && state.views.length === 1 && state.views[0] === expected, `${expected}: visible panel state is wrong.`)
  if (expected === 'archives') assert(state.archive === archive && state.archives.length === 1 && state.archives[0] === archive, `${archive}: archive state is wrong.`)
}

async function noOverflow(page, label) {
  const [scroll, inner] = await page.evaluate(() => [document.documentElement.scrollWidth, innerWidth])
  assert(scroll <= inner + 1, `${label}: horizontal overflow.`)
}

async function desktop(browser) {
  const calls = { twitch: 0, kick: 0 }
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
  await routes(context, calls)
  const page = await context.newPage()
  await page.goto(`${base}/twitch/history/?period=30d&metric=viewer_minutes&day=2026-06-10&sort=peak_viewers&limit=50`, { waitUntil: 'domcontentloaded' })
  await ready(page)
  await view(page, 'overview')
  const firstCalls = calls.twitch
  assert(firstCalls > 0 && calls.kick === 0, 'Twitch shell crossed provider endpoints.')
  let url = new URL(page.url())
  assert(!url.searchParams.has('view') && !url.searchParams.has('archive'), 'Overview URL is not canonical.')

  const placement = await page.evaluate(() => ({
    calendar: document.querySelector('[data-history-calendar]')?.closest('[data-history-view-panel]')?.dataset.historyViewPanel,
    daily: document.querySelector('[data-history-daily-archive]')?.closest('[data-history-archive-panel]')?.dataset.historyArchivePanel,
    peaks: document.querySelector('[data-history-peak-archive]')?.closest('[data-history-archive-panel]')?.dataset.historyArchivePanel,
    battles: document.querySelector('[data-history-battle-archive]')?.closest('[data-history-archive-panel]')?.dataset.historyArchivePanel,
    report: document.querySelector('[data-history-report]')?.closest('[data-history-view-panel]')?.dataset.historyViewPanel,
    share: document.querySelector('[data-history-share-card]')?.closest('[data-history-view-panel]')?.dataset.historyViewPanel,
    export: document.querySelector('[data-history-export]')?.closest('[data-history-view-panel]')?.dataset.historyViewPanel,
  }))
  assert(placement.calendar === 'overview', 'Calendar is outside Overview.')
  assert(placement.daily === 'daily' && placement.peaks === 'peaks' && placement.battles === 'battles', 'Archive placement is wrong.')
  assert(placement.report === 'report' && placement.share === 'report' && placement.export === 'report', 'Report tool placement is wrong.')

  await page.locator('button[data-history-view="archives"]').click()
  await view(page, 'archives', 'daily')
  url = new URL(page.url())
  assert(url.searchParams.get('view') === 'archives' && url.searchParams.get('archive') === 'daily', 'Daily URL is wrong.')
  for (const [key, value] of [['period', '30d'], ['metric', 'viewer_minutes'], ['day', '2026-06-10'], ['sort', 'peak_viewers'], ['limit', '50']]) assert(url.searchParams.get(key) === value, `View switch lost ${key}.`)
  assert(calls.twitch === firstCalls, 'Daily view switching triggered another History request.')

  await page.locator('button[data-history-archive-view="peaks"]').click()
  await view(page, 'archives', 'peaks')
  assert(calls.twitch === firstCalls, 'Peak view switching triggered another History request.')
  await page.locator('button[data-history-view="report"]').click()
  await view(page, 'report')
  assert(calls.twitch === firstCalls, 'Report view switching triggered another History request.')
  await page.locator('button[data-history-view="archives"]').click()
  await view(page, 'archives', 'peaks')

  const beforeMetric = calls.twitch
  await page.locator('[data-history-metric="peak_viewers"]').click()
  await page.waitForFunction(() => document.querySelector('[data-history-export]')?.getAttribute('data-export-metric') === 'peak_viewers')
  await view(page, 'archives', 'peaks')
  url = new URL(page.url())
  assert(url.searchParams.get('view') === 'archives' && url.searchParams.get('archive') === 'peaks', 'Data-shell replaceState dropped task state.')
  assert(calls.twitch > beforeMetric && calls.kick === 0, 'Metric refresh crossed or skipped the provider endpoint.')

  await page.locator('button[data-history-view="report"]').click()
  await page.locator('button[data-history-view="report"]').focus()
  await page.keyboard.press('Home')
  await view(page, 'overview')
  await page.locator('button[data-history-view="overview"]').focus()
  await page.keyboard.press('ArrowRight')
  await view(page, 'archives', 'peaks')

  const beforeHistory = calls.twitch
  await page.locator('button[data-history-view="report"]').click()
  await page.goBack()
  await page.waitForFunction(() => document.querySelector('.history-page')?.getAttribute('data-history-view') === 'archives')
  await view(page, 'archives', 'peaks')
  await page.goForward()
  await page.waitForFunction(() => document.querySelector('.history-page')?.getAttribute('data-history-view') === 'report')
  await view(page, 'report')
  assert(calls.twitch === beforeHistory, 'Back/Forward view switching triggered another History request.')
  await noOverflow(page, 'Twitch desktop')
  await page.screenshot({ path: resolve(artifactDir, 'history-view-shell-twitch-report.png'), fullPage: true })
  await context.close()
}

async function mobile(browser) {
  const calls = { twitch: 0, kick: 0 }
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true })
  await routes(context, calls)
  const page = await context.newPage()
  await page.goto(`${base}/kick/history/?view=invalid&archive=invalid&period=7d&metric=peak_viewers&day=2026-06-10&sort=peak_viewers&limit=50`, { waitUntil: 'domcontentloaded' })
  await ready(page)
  await view(page, 'overview')
  const url = new URL(page.url())
  assert(!url.searchParams.has('view') && !url.searchParams.has('archive'), 'Invalid view state was not normalized.')
  assert(url.searchParams.get('period') === '7d' && url.searchParams.get('metric') === 'peak_viewers', 'Normalization removed valid analysis state.')
  assert(calls.kick > 0 && calls.twitch === 0, 'Kick shell crossed provider endpoints.')
  const baseline = calls.kick
  await page.locator('button[data-history-view="archives"]').click()
  await page.locator('button[data-history-archive-view="battles"]').click()
  await view(page, 'archives', 'battles')
  assert(calls.kick === baseline, 'Mobile view switching triggered another History request.')
  await noOverflow(page, 'Kick mobile')
  await page.screenshot({ path: resolve(artifactDir, 'history-view-shell-kick-battles.png'), fullPage: true })
  await context.close()
}

const browser = await chromium.launch({ headless: true })
try {
  await desktop(browser)
  await mobile(browser)
  console.log('History view shell browser gate passed.')
} finally {
  await browser.close()
}
