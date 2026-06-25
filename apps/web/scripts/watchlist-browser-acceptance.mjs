import { appendFile, writeFile } from 'node:fs/promises'
import { chromium } from 'playwright'
import {
  baseUrl,
  check,
  clearApiCalls,
  countCalls,
  installNetworkGuards,
  readStoredDocument,
  setStoredDocument,
  waitDataIdle,
  waitReady,
} from './watchlist-shell-browser-fixture.mjs'

const artifacts = [
  '/tmp/watchlist-w4b-twitch-desktop.png',
  '/tmp/watchlist-w4b-twitch-cross-tab.png',
  '/tmp/watchlist-w4b-kick-tablet.png',
  '/tmp/watchlist-w4b-kick-mobile.png',
  '/tmp/watchlist-w4b-storage-error.png',
]
const evidence = {
  schema: 'viewloom-watchlist-local-browser-acceptance-v1',
  phase: 'W4B',
  candidateHead: process.env.GITHUB_HEAD_SHA || process.env.GITHUB_SHA || null,
  baseUrl,
  result: 'running',
  requestContract: {
    emptyInitialLoad: { latest: 0, history: 0 },
    nonemptyInitialLoad: { latest: 1, history: 1 },
    uncachedPeriodChange: { latest: 0, history: 1 },
    cachedPeriodRestore: { latest: 0, history: 0 },
    combinedRefresh: { latest: 1, history: 1 },
    retryLatest: { latest: 1, history: 0 },
    retryHistory: { latest: 0, history: 1 },
    taskLocalOperation: { latest: 0, history: 0 },
    channelSave: { additionalRequests: 0 },
  },
  scenarios: [],
  artifacts: artifacts.map((path) => path.replace('/tmp/', '')),
}

const browser = await chromium.launch({ headless: true })
try {
  evidence.scenarios.push(await verifyTwitchIntegratedDesktop())
  evidence.scenarios.push(await verifyKickTabletAndChannel())
  evidence.scenarios.push(await verifyKickMobile())
  evidence.scenarios.push(await verifyStorageUnavailable())
  evidence.result = 'pass'
  await writeEvidence()
  console.log('Watchlist W4B integrated local browser acceptance passed.')
} catch (error) {
  evidence.result = 'fail'
  evidence.error = error instanceof Error ? error.message : String(error)
  await writeEvidence()
  throw error
} finally {
  await browser.close()
}

async function verifyTwitchIntegratedDesktop() {
  const calls = callState()
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'no-preference' })
  await installNetworkGuards(context, calls)
  const page = await context.newPage()
  await page.goto(`${baseUrl}/twitch/watchlist/`, { waitUntil: 'domcontentloaded' })
  await waitReady(page)
  await waitDataIdle(page)

  check(calls.api.length === 0, `Twitch empty load requested data: ${JSON.stringify(calls.api)}`)
  check(await page.locator('[data-watchlist-empty]').isVisible(), 'Twitch empty state is not visible.')

  await setStoredDocument(page, 'twitch', [
    { channelId: 'alpha', displayName: 'Alpha' },
    { channelId: 'daily_only', displayName: 'Daily Only' },
    { channelId: 'missing', displayName: 'Missing' },
  ])
  clearApiCalls(calls)
  await page.reload({ waitUntil: 'domcontentloaded' })
  await waitReady(page)
  await waitDataIdle(page)
  assertRequestDelta(calls, { latest: 1, history: 1 }, 'Twitch nonempty initial load')
  assertProviderOnly(calls, 'twitch')

  const alpha = page.locator('[data-watchlist-entry="alpha"]')
  const dailyOnly = page.locator('[data-watchlist-entry="daily_only"]')
  const missing = page.locator('[data-watchlist-entry="missing"]')
  check((await alpha.innerText()).includes('In latest observed set'), 'Twitch latest-present evidence is missing.')
  check((await alpha.innerText()).includes('Present in retained History result'), 'Twitch retained-present evidence is missing.')
  check((await dailyOnly.innerText()).includes('Not in latest observed set'), 'Twitch latest-absent evidence is missing.')
  check((await dailyOnly.innerText()).includes('Present in retained History result'), 'Twitch retained-only evidence is missing.')
  check((await missing.innerText()).includes('Not confirmed offline'), 'Twitch offline limitation is missing.')
  check((await missing.innerText()).includes('No complete history is implied'), 'Twitch complete-history limitation is missing.')

  let before = snapshotCounts(calls, 'twitch')
  await page.getByLabel('Filter saved channels').fill('alpha')
  check(await page.locator('[data-watchlist-entry]').count() === 1, 'Twitch local filter failed.')
  await page.getByLabel('Filter saved channels').fill('')
  assertCountsUnchanged(calls, before, 'Twitch local filter')

  before = snapshotCounts(calls, 'twitch')
  await dailyOnly.getByRole('button', { name: /Move Daily Only up/ }).click()
  await page.waitForFunction(() => document.activeElement?.matches('[data-watchlist-entry="daily_only"] h2') ?? false)
  check((await readStoredDocument(page, 'twitch')).entries[0].channelId === 'daily_only', 'Twitch reorder was not persisted.')
  assertCountsUnchanged(calls, before, 'Twitch reorder')

  before = snapshotCounts(calls, 'twitch')
  await page.getByRole('button', { name: 'Last 7 days' }).click()
  await waitDataIdle(page)
  assertRequestDifference(calls, before, { latest: 0, history: 1 }, 'Twitch uncached 7d period change')
  check(new URL(page.url()).searchParams.get('period') === '7d', 'Twitch 7d URL state is missing.')

  before = snapshotCounts(calls, 'twitch')
  await page.goBack()
  await page.waitForFunction(() => document.querySelector('[data-watchlist-period="30d"]')?.getAttribute('aria-pressed') === 'true')
  await waitDataIdle(page)
  assertCountsUnchanged(calls, before, 'Twitch cached Back restore')
  check(!new URL(page.url()).searchParams.has('period'), 'Twitch 30d clean URL was not restored.')

  before = snapshotCounts(calls, 'twitch')
  await page.goForward()
  await page.waitForFunction(() => document.querySelector('[data-watchlist-period="7d"]')?.getAttribute('aria-pressed') === 'true')
  await waitDataIdle(page)
  assertCountsUnchanged(calls, before, 'Twitch cached Forward restore')

  before = snapshotCounts(calls, 'twitch')
  await page.getByRole('button', { name: 'Refresh data' }).click()
  await waitDataIdle(page)
  assertRequestDifference(calls, before, { latest: 1, history: 1 }, 'Twitch combined refresh')

  calls.failLatest = true
  before = snapshotCounts(calls, 'twitch')
  await page.getByRole('button', { name: 'Refresh data' }).click()
  await waitDataIdle(page)
  assertRequestDifference(calls, before, { latest: 1, history: 1 }, 'Twitch latest-failure combined refresh')
  check((await alpha.innerText()).includes('Latest observation unavailable'), 'Twitch latest failure did not isolate latest evidence.')
  check((await alpha.innerText()).includes('Present in retained History result'), 'Twitch latest failure removed retained evidence.')

  calls.failLatest = false
  before = snapshotCounts(calls, 'twitch')
  await page.getByRole('button', { name: 'Retry latest' }).click()
  await waitDataIdle(page)
  assertRequestDifference(calls, before, { latest: 1, history: 0 }, 'Twitch Retry latest')

  calls.failHistory = true
  before = snapshotCounts(calls, 'twitch')
  await page.getByRole('button', { name: 'Refresh data' }).click()
  await waitDataIdle(page)
  assertRequestDifference(calls, before, { latest: 1, history: 1 }, 'Twitch History-failure combined refresh')
  check((await alpha.innerText()).includes('In latest observed set'), 'Twitch History failure removed latest evidence.')
  check((await alpha.innerText()).includes('Retained History unavailable'), 'Twitch History failure did not isolate retained evidence.')

  calls.failHistory = false
  before = snapshotCounts(calls, 'twitch')
  await page.getByRole('button', { name: 'Retry History' }).click()
  await waitDataIdle(page)
  assertRequestDifference(calls, before, { latest: 0, history: 1 }, 'Twitch Retry History')

  const secondPage = await context.newPage()
  before = snapshotCounts(calls, 'twitch')
  await secondPage.goto(`${baseUrl}/twitch/watchlist/`, { waitUntil: 'domcontentloaded' })
  await waitReady(secondPage)
  await waitDataIdle(secondPage)
  assertRequestDifference(calls, before, { latest: 1, history: 1 }, 'Twitch second-tab initial load')

  before = snapshotCounts(calls, 'twitch')
  await page.getByLabel('Twitch channel id or Twitch URL').fill('latest_only')
  await page.getByRole('button', { name: 'Add channel' }).click()
  await secondPage.waitForFunction(() => document.querySelector('[data-watchlist-entry="latest_only"]'))
  assertCountsUnchanged(calls, before, 'Twitch cross-tab add')
  check((await secondPage.locator('[data-watchlist-storage-feedback]').innerText()).includes('another tab'), 'Twitch cross-tab feedback is missing.')

  await secondPage.screenshot({ path: '/tmp/watchlist-w4b-twitch-cross-tab.png', fullPage: true })
  await page.screenshot({ path: '/tmp/watchlist-w4b-twitch-desktop.png', fullPage: true })
  await assertNoOverflow(page, 'Twitch desktop')
  await assertVisibleFocus(page)

  const result = {
    id: 'twitch-desktop-integrated',
    result: 'pass',
    viewport: { width: 1440, height: 1000 },
    finalCounts: snapshotCounts(calls, 'twitch'),
    crossTab: true,
    backForwardCache: true,
    failureIsolation: true,
    focusPreserved: true,
  }
  await appendLog(result)
  await secondPage.close()
  await context.close()
  return result
}

async function verifyKickTabletAndChannel() {
  const calls = callState()
  const context = await browser.newContext({ viewport: { width: 820, height: 1180 }, reducedMotion: 'reduce' })
  await installNetworkGuards(context, calls)
  const page = await context.newPage()
  await page.goto(`${baseUrl}/kick/watchlist/`, { waitUntil: 'domcontentloaded' })
  await waitReady(page)
  await waitDataIdle(page)
  await setStoredDocument(page, 'kick', [
    { channelId: 'gamma', displayName: 'Gamma' },
    { channelId: 'kick_one', displayName: 'Kick One' },
    { channelId: 'missing', displayName: 'Missing' },
  ])
  clearApiCalls(calls)
  await page.reload({ waitUntil: 'domcontentloaded' })
  await waitReady(page)
  await waitDataIdle(page)
  assertRequestDelta(calls, { latest: 1, history: 1 }, 'Kick tablet initial load')
  assertProviderOnly(calls, 'kick')
  check(await page.evaluate(() => localStorage.getItem('viewloom.watchlist.twitch.v1')) === null, 'Kick tablet created Twitch storage.')

  const gamma = page.locator('[data-watchlist-entry="gamma"]')
  check(await gamma.locator('a', { hasText: 'Open Channel' }).getAttribute('href') === '/kick/channel/?id=gamma', 'Kick Channel link crossed provider.')
  check(await gamma.locator('a', { hasText: 'Open History' }).getAttribute('href') === '/kick/history/', 'Kick History link crossed provider.')
  check(await gamma.locator('a', { hasText: 'Open Heatmap' }).getAttribute('href') === '/kick/heatmap/', 'Kick Heatmap link crossed provider.')
  check((await gamma.locator('.watchlist-external').getAttribute('href'))?.startsWith('https://kick.com/') ?? false, 'Kick external link crossed provider.')

  await assertNoOverflow(page, 'Kick tablet')
  await assertTouchTargets(page, 44)
  await page.screenshot({ path: '/tmp/watchlist-w4b-kick-tablet.png', fullPage: true })

  const beforeChannel = calls.api.length
  await page.goto(`${baseUrl}/kick/channel/?id=channel_new`, { waitUntil: 'domcontentloaded' })
  await page.locator('[data-channel-watchlist-action]').waitFor()
  await page.waitForFunction(() => document.body.dataset.channelWatchlist === 'available')
  await page.waitForFunction(() => document.querySelector('[data-channel-state]')?.textContent !== 'Loading')
  const beforeSave = calls.api.length
  await page.getByRole('button', { name: 'Save to Watchlist' }).click()
  await page.locator('[data-channel-watchlist-action] a').waitFor()
  check(calls.api.length === beforeSave, 'Kick Channel save made an additional data request.')
  check((await readStoredDocument(page, 'kick')).entries[0].channelId === 'channel_new', 'Kick Channel save did not persist at the top.')
  check(await page.evaluate(() => localStorage.getItem('viewloom.watchlist.twitch.v1')) === null, 'Kick Channel save mutated Twitch storage.')
  check((await page.locator('[data-channel-watchlist-feedback]').innerText()).includes('No data request was made.'), 'Kick Channel save feedback lost its no-request statement.')

  const result = {
    id: 'kick-tablet-channel',
    result: 'pass',
    viewport: { width: 820, height: 1180 },
    initialCounts: { latest: 1, history: 1 },
    channelPageRequestsBeforeSave: beforeSave - beforeChannel,
    channelSaveAdditionalRequests: calls.api.length - beforeSave,
    providerIsolation: true,
    minimumTarget: 44,
  }
  await appendLog(result)
  await context.close()
  return result
}

async function verifyKickMobile() {
  const calls = callState()
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, reducedMotion: 'reduce' })
  await installNetworkGuards(context, calls)
  const page = await context.newPage()
  await page.goto(`${baseUrl}/kick/watchlist/`, { waitUntil: 'domcontentloaded' })
  await waitReady(page)
  await waitDataIdle(page)
  check(calls.api.length === 0, 'Kick mobile empty load made a request.')

  const longId = `long_${'x'.repeat(58)}`
  await page.getByLabel('Kick channel id or Kick URL').fill(longId)
  await page.getByRole('button', { name: 'Add channel' }).click()
  await page.locator(`[data-watchlist-entry="${longId}"]`).waitFor()
  check(calls.api.length === 0, 'Kick mobile task-local add made a request.')

  await page.getByRole('button', { name: 'Refresh data' }).click()
  await waitDataIdle(page)
  assertRequestDelta(calls, { latest: 1, history: 1 }, 'Kick mobile refresh')
  await assertNoOverflow(page, 'Kick mobile')
  await assertTouchTargets(page, 44)
  const manageTargets = await page.locator('.watchlist-card__manage .button:visible').evaluateAll((nodes) => nodes.map((node) => node.getBoundingClientRect().height))
  check(manageTargets.every((height) => height >= 48), `Kick mobile management target below 48px: ${JSON.stringify(manageTargets)}`)
  const duration = await page.locator('.watchlist-card').evaluate((node) => getComputedStyle(node).transitionDuration)
  check(transitionMilliseconds(duration) <= .011, `Kick mobile reduced-motion transition is active: ${duration}`)
  const boxes = await page.locator('[data-watchlist-entry], [data-watchlist-entry] h2, [data-watchlist-entry] code, .watchlist-evidence-facts').evaluateAll((nodes) => nodes.map((node) => ({
    scrollWidth: node.scrollWidth,
    clientWidth: node.clientWidth,
  })))
  check(boxes.every((box) => box.scrollWidth <= box.clientWidth + 1), `Kick mobile long content overflowed: ${JSON.stringify(boxes)}`)
  await page.screenshot({ path: '/tmp/watchlist-w4b-kick-mobile.png', fullPage: true })

  const result = {
    id: 'kick-mobile-integrated',
    result: 'pass',
    viewport: { width: 390, height: 844 },
    finalCounts: snapshotCounts(calls, 'kick'),
    minimumTarget: 44,
    minimumManagementTarget: 48,
    reducedMotion: true,
    longContent: true,
  }
  await appendLog(result)
  await context.close()
  return result
}

async function verifyStorageUnavailable() {
  const calls = callState()
  const context = await browser.newContext({ viewport: { width: 360, height: 800 }, isMobile: true, reducedMotion: 'reduce' })
  await context.addInitScript(() => {
    Storage.prototype.getItem = function getItem() { throw new DOMException('Storage blocked', 'SecurityError') }
    Storage.prototype.setItem = function setItem() { throw new DOMException('Storage blocked', 'SecurityError') }
    Storage.prototype.removeItem = function removeItem() { throw new DOMException('Storage blocked', 'SecurityError') }
  })
  await installNetworkGuards(context, calls)
  const page = await context.newPage()
  await page.goto(`${baseUrl}/twitch/watchlist/`, { waitUntil: 'domcontentloaded' })
  await waitReady(page)
  await waitDataIdle(page)
  check(await page.locator('body').getAttribute('data-watchlist-storage') === 'unavailable', 'Storage-unavailable body state is missing.')
  check(await page.locator('[data-watchlist-storage-error]').isVisible(), 'Storage-unavailable panel is missing.')
  check(calls.api.length === 0, 'Storage-unavailable state made data requests.')
  await assertNoOverflow(page, 'Storage unavailable mobile')
  await page.screenshot({ path: '/tmp/watchlist-w4b-storage-error.png', fullPage: true })

  const result = {
    id: 'storage-unavailable-mobile',
    result: 'pass',
    viewport: { width: 360, height: 800 },
    requests: 0,
    recoveryPanel: true,
  }
  await appendLog(result)
  await context.close()
  return result
}

function callState() {
  return { api: [], analytics: 0, failLatest: false, failHistory: false }
}

function snapshotCounts(calls, provider) {
  return provider === 'kick'
    ? { latest: countCalls(calls, '/api/kick-heatmap'), history: countCalls(calls, '/api/kick-history') }
    : { latest: countCalls(calls, '/api/twitch-heatmap'), history: countCalls(calls, '/api/history') }
}

function assertRequestDelta(calls, expected, label) {
  const provider = calls.api.some((value) => value.startsWith('/api/kick-')) ? 'kick' : 'twitch'
  const actual = snapshotCounts(calls, provider)
  check(actual.latest === expected.latest && actual.history === expected.history, `${label} request count mismatch: ${JSON.stringify({ expected, actual, calls: calls.api })}`)
}

function assertRequestDifference(calls, before, expected, label) {
  const provider = calls.api.some((value) => value.startsWith('/api/kick-')) ? 'kick' : 'twitch'
  const after = snapshotCounts(calls, provider)
  const difference = { latest: after.latest - before.latest, history: after.history - before.history }
  check(difference.latest === expected.latest && difference.history === expected.history, `${label} request delta mismatch: ${JSON.stringify({ expected, difference, before, after, calls: calls.api })}`)
}

function assertCountsUnchanged(calls, before, label) {
  const provider = calls.api.some((value) => value.startsWith('/api/kick-')) ? 'kick' : 'twitch'
  const after = snapshotCounts(calls, provider)
  check(after.latest === before.latest && after.history === before.history, `${label} unexpectedly requested data: ${JSON.stringify({ before, after, calls: calls.api })}`)
}

function assertProviderOnly(calls, provider) {
  const forbidden = provider === 'twitch'
    ? calls.api.filter((value) => value.startsWith('/api/kick-'))
    : calls.api.filter((value) => value.startsWith('/api/twitch-') || value.startsWith('/api/history?'))
  check(forbidden.length === 0, `${provider} scenario crossed provider APIs: ${JSON.stringify(forbidden)}`)
}

async function assertNoOverflow(page, label) {
  const dimensions = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, innerWidth }))
  check(dimensions.scrollWidth <= dimensions.innerWidth + 1, `${label} has horizontal overflow: ${JSON.stringify(dimensions)}`)
}

async function assertTouchTargets(page, minimum) {
  const targets = await page.locator('.watchlist-page button:visible, .watchlist-page a.button:visible, .watchlist-page .watchlist-external:visible').evaluateAll((nodes) => nodes.map((node) => ({
    text: node.textContent?.trim(),
    height: node.getBoundingClientRect().height,
  })))
  check(targets.every((target) => target.height >= minimum), `Target below ${minimum}px: ${JSON.stringify(targets.filter((target) => target.height < minimum))}`)
}

async function assertVisibleFocus(page) {
  const button = page.getByRole('button', { name: 'Refresh data' })
  await button.focus()
  const style = await button.evaluate((node) => ({
    outlineStyle: getComputedStyle(node).outlineStyle,
    outlineWidth: Number.parseFloat(getComputedStyle(node).outlineWidth),
  }))
  check(style.outlineStyle !== 'none' && style.outlineWidth >= 2, `Watchlist focus is not visible: ${JSON.stringify(style)}`)
}

function transitionMilliseconds(value) {
  if (!value || value === 'none') return 0
  const first = value.split(',')[0].trim()
  const number = Number.parseFloat(first)
  if (!Number.isFinite(number)) return 0
  return first.endsWith('ms') ? number : number * 1000
}

async function appendLog(result) {
  await appendFile('/tmp/watchlist-w4b.log', `${JSON.stringify(result)}\n`)
}

async function writeEvidence() {
  await writeFile('/tmp/watchlist-browser-evidence.json', `${JSON.stringify(evidence, null, 2)}\n`)
}
