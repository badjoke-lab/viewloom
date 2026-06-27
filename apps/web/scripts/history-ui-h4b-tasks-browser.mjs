import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { chromium } from 'playwright'
import { historyPayload } from './history-peak-archive-fixture.mjs'

const base = process.env.HISTORY_H4B_BASE_URL ?? 'http://127.0.0.1:4173'
const out = resolve(process.env.HISTORY_H4B_ARTIFACT_DIR ?? 'artifacts/history-ui-h4b')
mkdirSync(out, { recursive: true })

const evidence = {
  schema: 'viewloom-history-ui-h4b-tasks-v1',
  phase: 'P9H4B',
  candidateHead: process.env.GITHUB_HEAD_SHA ?? process.env.GITHUB_SHA ?? null,
  scenarios: [],
  result: 'running',
}

async function installRoutes(context, calls) {
  const reply = async (route, provider) => {
    const url = new URL(route.request().url())
    calls.push({ provider, path: `${url.pathname}${url.search}` })
    const body = historyPayload(provider, true)
    body.metric = url.searchParams.get('metric') === 'peak_viewers' ? 'peak_viewers' : 'viewer_minutes'
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) })
  }
  await context.route('**/api/kick-history*', (route) => reply(route, 'kick'))
  await context.route('**/api/history*', (route) => reply(route, 'twitch'))
}

async function ready(page) {
  await page.waitForFunction(() => document.querySelector('.history-page')?.getAttribute('data-history-p9h4b-ready') === 'true'
    && document.querySelector('[data-history-view-panel="archives"]')?.getAttribute('data-history-archives-ready') === 'true'
    && document.querySelector('[data-history-publish-groups-ready="true"]')
    && document.querySelectorAll('[data-history-publish-context-value]').length === 5)
}

async function snapshot(page) {
  return page.evaluate(() => {
    const visible = (node) => node instanceof HTMLElement
      && !node.hidden
      && getComputedStyle(node).display !== 'none'
      && getComputedStyle(node).visibility !== 'hidden'
      && node.getClientRects().length > 0
    const box = (selector) => {
      const rect = document.querySelector(selector)?.getBoundingClientRect()
      return rect ? { width: rect.width, height: rect.height, top: rect.top, bottom: rect.bottom } : null
    }
    const viewPanels = [...document.querySelectorAll('[data-history-view-panel]')]
    const archivePanels = [...document.querySelectorAll('[data-history-archive-panel]')]
    const context = Object.fromEntries([...document.querySelectorAll('[data-history-publish-context-value]')]
      .map((node) => [node.getAttribute('data-history-publish-context-value'), node.textContent?.replace(/\s+/g, ' ').trim() ?? '']))
    return {
      url: `${location.pathname}${location.search}`,
      view: document.querySelector('.history-page')?.getAttribute('data-history-view'),
      archive: document.querySelector('.history-page')?.getAttribute('data-history-archive-view'),
      visibleViews: viewPanels.filter(visible).map((node) => node.getAttribute('data-history-view-panel')),
      visibleArchives: archivePanels.filter(visible).map((node) => node.getAttribute('data-history-archive-panel')),
      taskDescriptions: document.querySelectorAll('[data-history-view] small').length,
      archiveDescriptions: document.querySelectorAll('[data-history-archive-view] small').length,
      archiveIntro: document.querySelector('[data-history-archives-intro]')?.textContent?.replace(/\s+/g, ' ').trim() ?? '',
      archiveTabPosition: getComputedStyle(document.querySelector('.history-archive-view-tabs')).position,
      dailyToolbarPosition: getComputedStyle(document.querySelector('#history-archive-daily .history-archive-toolbar')).position,
      dailyCount: document.querySelector('[data-history-archive-count="daily"]')?.textContent?.trim() ?? '',
      peakCount: document.querySelector('[data-history-archive-count="peaks"]')?.textContent?.trim() ?? '',
      battleCount: document.querySelector('[data-history-archive-count="battles"]')?.textContent?.trim() ?? '',
      publishGroups: [...document.querySelectorAll('.history-publish-group')].map((node) => ({
        text: node.textContent?.replace(/\s+/g, ' ').trim() ?? '',
        buttons: node.querySelectorAll('button').length,
      })),
      publishContext: context,
      limitation: document.querySelector('[data-history-publish-context] > p')?.textContent?.trim() ?? '',
      shareHidden: document.querySelector('[data-history-share-preview]')?.hasAttribute('hidden') ?? false,
      preview: box('[data-history-report-preview]'),
      bodyOverflow: Math.max(0, document.documentElement.scrollWidth - innerWidth),
      minTaskHeight: Math.min(...[...document.querySelectorAll('[data-history-view]')].map((node) => node.getBoundingClientRect().height)),
      minArchiveHeight: Math.min(...[...document.querySelectorAll('[data-history-archive-view]')].map((node) => node.getBoundingClientRect().height)),
      minPublishButtonHeight: Math.min(...[...document.querySelectorAll('.history-publish-group button')].map((node) => node.getBoundingClientRect().height)),
    }
  })
}

async function clickTask(page, task) {
  await page.locator(`[data-history-view="${task}"]`).click()
  await page.waitForFunction((value) => document.querySelector('.history-page')?.getAttribute('data-history-view') === value, task)
}

async function clickArchive(page, archive) {
  await page.locator(`[data-history-archive-view="${archive}"]`).click()
  await page.waitForFunction((value) => document.querySelector('.history-page')?.getAttribute('data-history-archive-view') === value, archive)
}

function assertProvider(calls, provider, label) {
  assert.ok(calls.length >= 1, `${label}: History request missing`)
  assert.ok(calls.every((call) => call.provider === provider), `${label}: crossed provider endpoint`)
}

async function desktopScenario(browser) {
  const calls = []
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
  await installRoutes(context, calls)
  const page = await context.newPage()
  await page.goto(`${base}/twitch/history/?period=30d&metric=viewer_minutes`, { waitUntil: 'domcontentloaded' })
  await ready(page)
  const initialRequests = calls.length
  assertProvider(calls, 'twitch', 'desktop')
  assert.equal(initialRequests, 1, 'desktop: expected one initial History request')

  await clickTask(page, 'archives')
  await clickArchive(page, 'peaks')
  let state = await snapshot(page)
  assert.deepEqual(state.visibleViews, ['archives'], 'desktop: more than one task is visible')
  assert.deepEqual(state.visibleArchives, ['peaks'], 'desktop: more than one archive is visible')
  assert.equal(state.taskDescriptions, 3, 'desktop: task descriptions are incomplete')
  assert.equal(state.archiveDescriptions, 3, 'desktop: archive descriptions are incomplete')
  assert.match(state.archiveIntro, /reuses the loaded History response/i, 'desktop: no-refetch archive guidance missing')
  assert.equal(state.archiveTabPosition, 'static', 'desktop: archive tabs remain sticky')
  assert.equal(state.dailyToolbarPosition, 'static', 'desktop: Daily toolbar remains sticky')
  assert.match(state.dailyCount, /13 retained days/, 'desktop: Daily count is wrong')
  assert.match(state.peakCount, /10 visible peaks/, 'desktop: Peak count is wrong')
  assert.match(state.battleCount, /10 visible matchups/, 'desktop: Battle count is wrong')
  assert.equal(calls.length, initialRequests, 'desktop: archive switching refetched History')

  await clickTask(page, 'report')
  state = await snapshot(page)
  assert.deepEqual(state.visibleViews, ['report'], 'desktop: Report is not the only visible task')
  assert.equal(state.publishGroups.length, 3, 'desktop: publishing groups are incomplete')
  assert.deepEqual(state.publishGroups.map((group) => group.buttons), [1, 2, 2], 'desktop: publishing actions are grouped incorrectly')
  assert.match(state.publishGroups[0].text, /Copy text.*Full report or short post/i, 'desktop: Copy group explanation missing')
  assert.match(state.publishGroups[1].text, /Share image.*Preview first/i, 'desktop: Share group explanation missing')
  assert.match(state.publishGroups[2].text, /Download data.*retained daily rows/i, 'desktop: Data group explanation missing')
  assert.equal(state.publishContext.provider, 'Twitch', 'desktop: provider context is wrong')
  assert.match(state.publishContext.period, /Last 30 days/i, 'desktop: period context missing')
  assert.match(state.publishContext.metric, /Viewer-minutes/i, 'desktop: metric context missing')
  assert.match(state.publishContext.scope, /13.*13.*days/i, 'desktop: observed scope missing')
  assert.match(state.publishContext.state, /Partial/i, 'desktop: state/source context missing')
  assert.match(state.limitation, /not a provider-wide total/i, 'desktop: limitation language missing')
  assert.equal(state.shareHidden, true, 'desktop: share preview is open by default')
  assert.equal(calls.length, initialRequests, 'desktop: Report switching refetched History')

  await page.goBack()
  await page.waitForFunction(() => document.querySelector('.history-page')?.getAttribute('data-history-view') === 'archives'
    && document.querySelector('.history-page')?.getAttribute('data-history-archive-view') === 'peaks')
  await page.goBack()
  await page.waitForFunction(() => document.querySelector('.history-page')?.getAttribute('data-history-view') === 'archives'
    && document.querySelector('.history-page')?.getAttribute('data-history-archive-view') === 'daily')
  await page.goBack()
  await page.waitForFunction(() => document.querySelector('.history-page')?.getAttribute('data-history-view') === 'overview')
  await page.goForward()
  await page.waitForFunction(() => document.querySelector('.history-page')?.getAttribute('data-history-view') === 'archives'
    && document.querySelector('.history-page')?.getAttribute('data-history-archive-view') === 'daily')
  await page.goForward()
  await page.waitForFunction(() => document.querySelector('.history-page')?.getAttribute('data-history-view') === 'archives'
    && document.querySelector('.history-page')?.getAttribute('data-history-archive-view') === 'peaks')
  assert.equal(calls.length, initialRequests, 'desktop: Back/Forward refetched History')

  state = await snapshot(page)
  assert.ok(state.bodyOverflow <= 2, `desktop: horizontal overflow ${state.bodyOverflow}px`)
  await page.screenshot({ path: resolve(out, 'twitch-1440-tasks.png'), fullPage: true })
  evidence.scenarios.push({ id: 'twitch-desktop-1440', provider: 'twitch', calls, state })
  await context.close()
}

async function tabletScenario(browser) {
  const calls = []
  const context = await browser.newContext({ viewport: { width: 820, height: 1000 } })
  await installRoutes(context, calls)
  const page = await context.newPage()
  await page.goto(`${base}/kick/history/?period=30d&metric=peak_viewers&view=archives&archive=battles`, { waitUntil: 'domcontentloaded' })
  await ready(page)
  const state = await snapshot(page)
  assertProvider(calls, 'kick', 'tablet')
  assert.equal(calls.length, 1, 'tablet: direct archive link made extra History requests')
  assert.equal(state.view, 'archives', 'tablet: direct task state was not restored')
  assert.equal(state.archive, 'battles', 'tablet: direct archive state was not restored')
  assert.deepEqual(state.visibleViews, ['archives'], 'tablet: more than one task is visible')
  assert.deepEqual(state.visibleArchives, ['battles'], 'tablet: more than one archive is visible')
  assert.ok(state.minTaskHeight >= 40, `tablet: task target is too short at ${state.minTaskHeight}px`)
  assert.ok(state.minArchiveHeight >= 48, `tablet: archive target is too short at ${state.minArchiveHeight}px`)
  assert.ok(state.bodyOverflow <= 2, `tablet: horizontal overflow ${state.bodyOverflow}px`)
  await page.screenshot({ path: resolve(out, 'kick-820-archives.png'), fullPage: true })
  evidence.scenarios.push({ id: 'kick-tablet-820', provider: 'kick', calls, state })
  await context.close()
}

async function mobileScenario(browser, provider, width) {
  const calls = []
  const context = await browser.newContext({ viewport: { width, height: 844 }, isMobile: true, hasTouch: true })
  await installRoutes(context, calls)
  const page = await context.newPage()
  const metric = provider === 'kick' ? 'peak_viewers' : 'viewer_minutes'
  await page.goto(`${base}/${provider}/history/?period=30d&metric=${metric}&view=report`, { waitUntil: 'domcontentloaded' })
  await ready(page)
  const initialRequests = calls.length
  let state = await snapshot(page)
  assertProvider(calls, provider, `${provider}-${width}`)
  assert.equal(initialRequests, 1, `${provider}-${width}: expected one initial History request`)
  assert.equal(state.view, 'report', `${provider}-${width}: direct Report link was not restored`)
  assert.deepEqual(state.visibleViews, ['report'], `${provider}-${width}: Report is not the only visible task`)
  assert.equal(state.publishGroups.length, 3, `${provider}-${width}: publishing groups are incomplete`)
  assert.ok(state.minTaskHeight >= 44, `${provider}-${width}: task target is too short at ${state.minTaskHeight}px`)
  assert.ok(state.minPublishButtonHeight >= 48, `${provider}-${width}: publishing target is too short at ${state.minPublishButtonHeight}px`)
  assert.ok(state.preview?.height <= 310, `${provider}-${width}: report preview is too tall at ${state.preview?.height}px`)
  assert.ok(state.bodyOverflow <= 2, `${provider}-${width}: horizontal overflow ${state.bodyOverflow}px`)
  assert.equal(state.publishContext.provider, provider === 'kick' ? 'Kick' : 'Twitch', `${provider}-${width}: provider context is wrong`)
  assert.match(state.publishContext.metric, provider === 'kick' ? /Peak viewers/i : /Viewer-minutes/i, `${provider}-${width}: metric context is wrong`)

  await page.locator('[data-history-share-toggle]').click()
  await page.waitForFunction(() => document.querySelector('[data-history-share-toggle]')?.getAttribute('aria-expanded') === 'true')
  state = await snapshot(page)
  assert.equal(state.shareHidden, false, `${provider}-${width}: share preview did not open`)
  assert.equal(calls.length, initialRequests, `${provider}-${width}: share preview refetched History`)
  assert.ok(state.bodyOverflow <= 2, `${provider}-${width}: open share preview overflowed`)

  await page.screenshot({ path: resolve(out, `${provider}-${width}-report.png`), fullPage: true })
  evidence.scenarios.push({ id: `${provider}-mobile-${width}`, provider, calls, state })
  await context.close()
}

const browser = await chromium.launch({ headless: true })
try {
  await desktopScenario(browser)
  await tabletScenario(browser)
  await mobileScenario(browser, 'kick', 390)
  await mobileScenario(browser, 'twitch', 360)
  evidence.result = 'pass'
  writeFileSync(resolve(out, 'history-ui-h4b-tasks-evidence.json'), `${JSON.stringify(evidence, null, 2)}\n`)
  console.log(JSON.stringify({ result: evidence.result, scenarios: evidence.scenarios.map((scenario) => scenario.id) }, null, 2))
} catch (error) {
  evidence.result = 'fail'
  evidence.error = error instanceof Error ? error.message : String(error)
  writeFileSync(resolve(out, 'history-ui-h4b-tasks-evidence.json'), `${JSON.stringify(evidence, null, 2)}\n`)
  throw error
} finally {
  await browser.close()
}
