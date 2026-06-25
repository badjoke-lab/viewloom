import { appendFile, writeFile } from 'node:fs/promises'
import { chromium } from 'playwright'
import {
  check,
  setStoredDocument,
  waitDataIdle,
  waitReady,
} from './watchlist-shell-browser-fixture.mjs'

const origin = strip(process.env.WATCHLIST_PRODUCTION_URL || 'https://vl.badjoke-lab.com')
const expectedBranch = process.env.WATCHLIST_EXPECTED_BRANCH || 'main'
const expectedSha = process.env.WATCHLIST_ACCEPTED_SHA || 'f3e0ee8741e96015c5440df167574b8002fccc0d'
const logPath = '/tmp/watchlist-w5b.log'
const evidencePath = '/tmp/watchlist-w5b-evidence.json'
const diagnostics = []

const evidence = {
  schema: 'viewloom-watchlist-production-acceptance-v1',
  phase: 'W5B',
  origin,
  expectedBranch,
  expectedSha,
  result: 'running',
  deployment: null,
  providers: {},
  scenarios: [],
  artifacts: [
    'watchlist-w5b-twitch-home.png',
    'watchlist-w5b-kick-home.png',
    'watchlist-w5b-twitch-desktop.png',
    'watchlist-w5b-kick-mobile.png',
    'watchlist-w5b-twitch-channel-save.png',
    'watchlist-w5b-kick-channel-save.png',
    'watchlist-w5b-evidence.json',
    'watchlist-w5b.log',
  ],
}

try {
  evidence.deployment = await waitForDeployment()
  const providers = {
    twitch: await inspectProvider('twitch'),
    kick: await inspectProvider('kick'),
  }
  evidence.providers.twitch = providers.twitch.summary
  evidence.providers.kick = providers.kick.summary

  const browser = await chromium.launch({ headless: true })
  try {
    evidence.scenarios.push(await verifyHome(browser, providers.twitch, {
      width: 1280,
      height: 900,
      mobile: false,
      screenshot: '/tmp/watchlist-w5b-twitch-home.png',
    }))
    evidence.scenarios.push(await verifyHome(browser, providers.kick, {
      width: 390,
      height: 844,
      mobile: true,
      screenshot: '/tmp/watchlist-w5b-kick-home.png',
    }))
    evidence.scenarios.push(await verifyWatchlist(browser, providers.twitch, {
      width: 1440,
      height: 1000,
      mobile: false,
      screenshot: '/tmp/watchlist-w5b-twitch-desktop.png',
    }))
    evidence.scenarios.push(await verifyWatchlist(browser, providers.kick, {
      width: 390,
      height: 844,
      mobile: true,
      screenshot: '/tmp/watchlist-w5b-kick-mobile.png',
    }))
    evidence.scenarios.push(await verifyChannelSave(browser, providers.twitch, '/tmp/watchlist-w5b-twitch-channel-save.png'))
    evidence.scenarios.push(await verifyChannelSave(browser, providers.kick, '/tmp/watchlist-w5b-kick-channel-save.png'))
  } finally {
    await browser.close()
  }

  evidence.result = 'pass'
  await writeEvidence()
  await log('Watchlist W5B production acceptance passed.')
} catch (error) {
  evidence.result = 'fail'
  evidence.error = message(error)
  await writeEvidence()
  throw error
}

async function waitForDeployment() {
  let last = null
  for (let attempt = 1; attempt <= 60; attempt += 1) {
    try {
      const response = await fetch(`${origin}/deployment.json?watchlist-w5b=${Date.now()}`, {
        headers: { accept: 'application/json', 'cache-control': 'no-cache' },
        cache: 'no-store',
      })
      const text = await response.text()
      await log(`deployment attempt ${attempt}/60: ${response.status} ${text.slice(0, 500)}`)
      if (response.ok) {
        last = JSON.parse(text)
        if (
          last?.schema === 'viewloom-deployment-v1'
          && last?.environment === 'production'
          && last?.branch === expectedBranch
          && last?.commit_sha === expectedSha
        ) {
          check(typeof last.pages_url === 'string' && last.pages_url.startsWith('https://'), 'Matching production deployment has no pages_url.')
          return last
        }
      }
    } catch (error) {
      await log(`deployment attempt ${attempt}/60 failed: ${message(error)}`)
    }
    await delay(10_000)
  }
  throw new Error(`Matching production deployment was not observed. Last deployment: ${JSON.stringify(last)}`)
}

async function inspectProvider(provider) {
  const paths = providerPaths(provider)
  const [status, latest, history30, history7] = await Promise.all([
    fetchJson(paths.status),
    fetchJson(paths.latest),
    fetchJson(`${paths.history}?period=30d&metric=viewer_minutes`),
    fetchJson(`${paths.history}?period=7d&metric=viewer_minutes`),
  ])

  check(status?.platform === provider, `${provider} status platform mismatch.`)
  check(status?.storage?.binding === paths.binding, `${provider} status binding mismatch.`)
  check(status?.storage?.database === paths.database, `${provider} status database mismatch.`)
  check(status?.freshness?.isStale === false, `${provider} status is stale.`)
  check(Number(status?.latestSnapshot?.observedCount ?? 0) > 0, `${provider} status has no observed streams.`)
  check(!status?.error, `${provider} status exposes an error.`)

  const collectorState = String(status?.collector?.state ?? '')
  if (provider === 'twitch') {
    check(collectorState === 'ok', `twitch collector state mismatch: ${collectorState}`)
  } else {
    check(collectorState === 'snapshot_available', `kick collector state mismatch: ${collectorState}`)
  }

  const latestRows = latestItems(latest)
  const latestIds = unique(latestRows.map(latestId).filter(Boolean))
  const retained30 = historyIds(history30)
  const retained7 = historyIds(history7)
  check(latestIds.length > 0, `${provider} latest response has no usable ids.`)
  check(retained30.length > 0, `${provider} 30d History has no usable ids.`)
  check(retained7.length > 0, `${provider} 7d History has no usable ids.`)

  const latestSet = new Set(latestIds)
  const retainedSet = new Set(retained30)
  const latestPresent = latestIds.find((id) => retainedSet.has(id)) ?? latestIds[0]
  const historyPresent = retained30.find((id) => latestSet.has(id)) ?? retained30[0]
  const latestOnly = latestIds.find((id) => !retainedSet.has(id)) ?? null
  const historyOnly = retained30.find((id) => !latestSet.has(id)) ?? null
  const absent = absentId(provider, new Set([...latestIds, ...retained30, ...retained7]))
  const selectedIds = unique([latestPresent, historyPresent, latestOnly, historyOnly, absent].filter(Boolean))
  check(selectedIds.length >= 3, `${provider} did not provide enough distinct production states.`)

  const names = new Map()
  for (const row of latestRows) {
    const id = latestId(row)
    if (id) names.set(id, displayName(row, id))
  }
  for (const row of historyRows(history30)) {
    const id = historyId(row)
    if (id && !names.has(id)) names.set(id, displayName(row, id))
  }

  const historyState30 = String(history30?.state ?? '')
  return {
    provider,
    paths,
    historyState30,
    latestPresent,
    historyPresent,
    absent,
    entries: selectedIds.map((channelId) => ({ channelId, displayName: names.get(channelId) ?? channelId })),
    summary: {
      binding: status.storage.binding,
      database: status.storage.database,
      sourceMode: status.sourceMode ?? null,
      state: status.state ?? null,
      collectorState,
      isStale: status.freshness.isStale,
      observedCount: status.latestSnapshot.observedCount,
      latestItemCount: latestIds.length,
      retained30ItemCount: retained30.length,
      retained7ItemCount: retained7.length,
      historyState30,
      latestPresent,
      historyPresent,
      latestOnly,
      historyOnly,
      absent,
      selectedEntryCount: selectedIds.length,
    },
  }
}

async function verifyHome(browser, data, viewport) {
  const provider = data.provider
  const name = provider === 'twitch' ? 'Twitch' : 'Kick'
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    isMobile: viewport.mobile,
    reducedMotion: viewport.mobile ? 'reduce' : 'no-preference',
  })
  const page = await context.newPage()
  const response = await page.goto(`${origin}/${provider}/?watchlist-w5b=${Date.now()}`, {
    waitUntil: 'domcontentloaded',
    timeout: 30_000,
  })
  check(response?.status() === 200, `${provider} Home did not return 200.`)
  const utility = page.locator('.provider-utility__item')
  await utility.waitFor()
  check(await page.title() === `${name} Data — ViewLoom`, `${provider} Home title mismatch.`)
  check(await page.locator('link[rel="canonical"]').getAttribute('href') === `${origin}/${provider}/`, `${provider} Home canonical mismatch.`)
  check(await page.locator('meta[property="og:url"]').getAttribute('content') === `${origin}/${provider}/`, `${provider} Home og:url mismatch.`)
  check((await utility.innerText()).includes('Local Watchlist'), `${provider} Home is missing Local Watchlist.`)
  check(await utility.getAttribute('href') === `/${provider}/watchlist/`, `${provider} Home Watchlist href mismatch.`)
  check(await page.locator('.feature-directory a[href*="watchlist"]').count() === 0, `${provider} Home inserted Watchlist into primary features.`)
  await assertNoOverflow(page, `${provider} Home ${viewport.width}px`)
  if (viewport.mobile) await assertMinimumHeight(utility, 44, `${provider} Home utility`)
  await page.screenshot({ path: viewport.screenshot, fullPage: true })
  await context.close()
  return {
    id: `${provider}-home-entry-production`,
    result: 'pass',
    viewport: { width: viewport.width, height: viewport.height },
    href: `/${provider}/watchlist/`,
    secondaryUtility: true,
    primaryFeatureDirectoryUnchanged: true,
  }
}

async function verifyWatchlist(browser, data, viewport) {
  const provider = data.provider
  const name = provider === 'twitch' ? 'Twitch' : 'Kick'
  const otherProvider = provider === 'twitch' ? 'kick' : 'twitch'
  const currentKey = `viewloom.watchlist.${provider}.v1`
  const otherKey = `viewloom.watchlist.${otherProvider}.v1`
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    isMobile: viewport.mobile,
    reducedMotion: viewport.mobile ? 'reduce' : 'no-preference',
  })
  const page = await context.newPage()
  const calls = []
  page.on('request', (request) => {
    const url = new URL(request.url())
    if (url.origin === origin && url.pathname.startsWith('/api/')) calls.push(`${url.pathname}${url.search}`)
  })
  page.on('console', (entry) => { if (entry.type() === 'error') void log(`${provider} console.error: ${entry.text()}`) })
  page.on('pageerror', (error) => { void log(`${provider} pageerror: ${error.message}`) })

  const route = `/${provider}/watchlist/`
  const response = await page.goto(`${origin}${route}?watchlist-w5b=${Date.now()}`, {
    waitUntil: 'domcontentloaded',
    timeout: 30_000,
  })
  check(response?.status() === 200, `${provider} Watchlist did not return 200.`)
  await ready(page)
  assertCounts(calls, data.paths, { latest: 0, history: 0 }, `${provider} empty initial load`)
  check(await page.locator('[data-watchlist-empty]').isVisible(), `${provider} empty state is missing.`)
  check(await page.title() === `${name} Local Watchlist — ViewLoom`, `${provider} Watchlist title mismatch.`)
  check(await page.locator('meta[name="robots"]').getAttribute('content') === 'noindex,follow', `${provider} robots mismatch.`)
  check(await page.locator('link[rel="canonical"]').getAttribute('href') === `${origin}${route}`, `${provider} canonical mismatch.`)
  check(await page.locator('meta[property="og:url"]').getAttribute('content') === `${origin}${route}`, `${provider} og:url mismatch.`)

  await setStoredDocument(page, provider, data.entries)
  await setStoredDocument(page, otherProvider, [{ channelId: 'cross_provider_probe', displayName: 'Cross Provider Probe' }])
  calls.length = 0
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 30_000 })
  await ready(page)
  assertCounts(calls, data.paths, { latest: 1, history: 1 }, `${provider} nonempty initial load`)
  assertProviderOnly(calls, provider)
  check(await page.locator('[data-watchlist-entry="cross_provider_probe"]').count() === 0, `${provider} rendered other-provider storage.`)

  const stored = await page.evaluate(({ currentKey, otherKey }) => ({
    current: JSON.parse(localStorage.getItem(currentKey) || 'null'),
    other: JSON.parse(localStorage.getItem(otherKey) || 'null'),
  }), { currentKey, otherKey })
  check(stored.current?.provider === provider, `${provider} storage provider mismatch.`)
  check(stored.other?.provider === otherProvider, `${provider} other storage provider mismatch.`)
  check(stored.other?.entries?.[0]?.channelId === 'cross_provider_probe', `${provider} changed other-provider storage.`)

  const latestCard = page.locator(`[data-watchlist-entry="${data.latestPresent}"]`)
  const latestText = await latestCard.innerText()
  check(latestText.includes('In latest observed set') || latestText.includes('In latest available observed set'), `${provider} latest-present evidence is missing.`)
  const historyText = await page.locator(`[data-watchlist-entry="${data.historyPresent}"]`).innerText()
  if (data.historyState30 === 'partial' || data.historyState30 === 'demo') {
    check(historyText.includes('Retained History is partial'), `${provider} partial History label is missing.`)
  } else {
    check(historyText.includes('Present in retained History result'), `${provider} retained-present evidence is missing.`)
  }
  const absentText = await page.locator(`[data-watchlist-entry="${data.absent}"]`).innerText()
  check(absentText.includes('Not in latest observed set'), `${provider} bounded latest absence is missing.`)
  check(absentText.includes('Not confirmed offline'), `${provider} offline limitation is missing.`)
  check(absentText.includes('No complete history is implied') || absentText.includes('Retained History is partial'), `${provider} retained limitation is missing.`)

  const externalHref = await latestCard.locator('.watchlist-external').getAttribute('href')
  check(provider === 'twitch' ? externalHref?.startsWith('https://www.twitch.tv/') : externalHref?.startsWith('https://kick.com/'), `${provider} external link crossed providers.`)
  check(await latestCard.getByRole('link', { name: 'Open Channel' }).getAttribute('href') === `/${provider}/channel/?id=${encodeURIComponent(data.latestPresent)}`, `${provider} Channel link mismatch.`)
  check(await latestCard.getByRole('link', { name: 'Open History' }).getAttribute('href') === `/${provider}/history/`, `${provider} History link mismatch.`)
  check(await latestCard.getByRole('link', { name: 'Open Heatmap' }).getAttribute('href') === `/${provider}/heatmap/`, `${provider} Heatmap link mismatch.`)

  const localProbe = `viewloom_w5b_local_${provider}`
  let before = counts(calls, data.paths)
  await page.locator('[data-watchlist-input]').fill(localProbe)
  await page.locator('[data-watchlist-add]').click()
  await page.locator(`[data-watchlist-entry="${localProbe}"]`).waitFor()
  assertDelta(calls, data.paths, before, { latest: 0, history: 0 }, `${provider} local add`)
  before = counts(calls, data.paths)
  await page.locator(`[data-watchlist-entry="${localProbe}"] [data-watchlist-action="remove"]`).click()
  await page.locator(`[data-watchlist-entry="${localProbe}"]`).waitFor({ state: 'detached' })
  assertDelta(calls, data.paths, before, { latest: 0, history: 0 }, `${provider} local remove`)

  before = counts(calls, data.paths)
  await page.getByRole('button', { name: 'Last 7 days' }).click()
  await waitDataIdle(page)
  assertDelta(calls, data.paths, before, { latest: 0, history: 1 }, `${provider} 7d change`)
  before = counts(calls, data.paths)
  await page.goBack()
  await page.waitForFunction(() => document.querySelector('[data-watchlist-period="30d"]')?.getAttribute('aria-pressed') === 'true')
  await waitDataIdle(page)
  assertDelta(calls, data.paths, before, { latest: 0, history: 0 }, `${provider} cached Back restore`)
  before = counts(calls, data.paths)
  await page.getByRole('button', { name: 'Refresh data' }).click()
  await waitDataIdle(page)
  assertDelta(calls, data.paths, before, { latest: 1, history: 1 }, `${provider} refresh`)

  await assertNoOverflow(page, `${provider} ${viewport.width}px`)
  if (viewport.mobile) {
    await assertTargets(page, 44)
    await assertManagementTargets(page, 48)
  }
  await page.screenshot({ path: viewport.screenshot, fullPage: true })
  const result = {
    id: `${provider}-${viewport.mobile ? 'mobile' : 'desktop'}-production`,
    result: 'pass',
    viewport: { width: viewport.width, height: viewport.height },
    emptyInitialRequests: { latest: 0, history: 0 },
    initialRequests: { latest: 1, history: 1 },
    localAddRequests: { latest: 0, history: 0 },
    localRemoveRequests: { latest: 0, history: 0 },
    periodChangeRequests: { latest: 0, history: 1 },
    cachedRestoreRequests: { latest: 0, history: 0 },
    refreshRequests: { latest: 1, history: 1 },
    providerIsolation: true,
    storageKey: currentKey,
    otherStorageKeyPreserved: otherKey,
    realLatestId: data.latestPresent,
    realHistoryId: data.historyPresent,
    retainedUiState: data.historyState30 === 'partial' || data.historyState30 === 'demo' ? 'partial' : 'present',
    absentId: data.absent,
    mobileMinimumTarget: viewport.mobile ? 44 : null,
    mobileManagementMinimumTarget: viewport.mobile ? 48 : null,
    totalObservedFeatureRequests: counts(calls, data.paths),
  }
  await context.close()
  return result
}

async function verifyChannelSave(browser, data, screenshot) {
  const provider = data.provider
  const otherProvider = provider === 'twitch' ? 'kick' : 'twitch'
  const currentKey = `viewloom.watchlist.${provider}.v1`
  const otherKey = `viewloom.watchlist.${otherProvider}.v1`
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  const page = await context.newPage()
  const calls = []
  page.on('request', (request) => {
    const url = new URL(request.url())
    if (url.origin === origin && url.pathname.startsWith('/api/')) calls.push(`${url.pathname}${url.search}`)
  })

  await page.goto(`${origin}/${provider}/watchlist/?watchlist-w5b=${Date.now()}`, { waitUntil: 'domcontentloaded', timeout: 30_000 })
  await waitReady(page)
  await setStoredDocument(page, provider, [])
  await setStoredDocument(page, otherProvider, [{ channelId: 'other_provider_saved', displayName: 'Other Provider Saved' }])
  calls.length = 0
  const response = await page.goto(`${origin}/${provider}/channel/?id=${encodeURIComponent(data.latestPresent)}&watchlist-w5b=${Date.now()}`, {
    waitUntil: 'domcontentloaded',
    timeout: 30_000,
  })
  check(response?.status() === 200, `${provider} Channel did not return 200.`)
  await page.locator('[data-channel-watchlist-action]').waitFor()
  await page.waitForFunction(() => document.body.dataset.channelWatchlist === 'available')
  await page.waitForFunction(() => document.querySelector('[data-channel-state]')?.textContent !== 'Loading')

  const beforeSave = calls.length
  await page.getByRole('button', { name: 'Save to Watchlist' }).click()
  const managementLink = page.locator('[data-channel-watchlist-action] a')
  await managementLink.waitFor()
  check(calls.length === beforeSave, `${provider} Channel save made an additional API request.`)
  check(await managementLink.getAttribute('href') === `/${provider}/watchlist/`, `${provider} management link mismatch.`)
  const stored = await page.evaluate(({ currentKey, otherKey }) => ({
    current: JSON.parse(localStorage.getItem(currentKey) || 'null'),
    other: JSON.parse(localStorage.getItem(otherKey) || 'null'),
  }), { currentKey, otherKey })
  check(stored.current?.entries?.[0]?.channelId === data.latestPresent, `${provider} Channel save did not persist the id.`)
  check(stored.other?.entries?.[0]?.channelId === 'other_provider_saved', `${provider} Channel save changed other-provider storage.`)
  check((await page.locator('[data-channel-watchlist-feedback]').innerText()).includes('No data request was made.'), `${provider} Channel save feedback is incorrect.`)
  await page.screenshot({ path: screenshot, fullPage: true })
  await context.close()
  return {
    id: `${provider}-channel-save-production`,
    result: 'pass',
    channelId: data.latestPresent,
    requestsBeforeSave: beforeSave,
    additionalRequestsOnSave: calls.length - beforeSave,
    providerStorage: currentKey,
    otherProviderStoragePreserved: otherKey,
  }
}

async function fetchJson(path) {
  const url = `${origin}${path}`
  const response = await fetch(url, {
    headers: { accept: 'application/json', 'cache-control': 'no-cache' },
    cache: 'no-store',
  })
  const text = await response.text()
  await log(`${response.status} ${url} ${text.slice(0, 300)}`)
  check(response.ok, `Production request failed: ${response.status} ${url}`)
  try {
    return JSON.parse(text)
  } catch {
    throw new Error(`Production response is not JSON: ${url}`)
  }
}

function providerPaths(provider) {
  return provider === 'kick'
    ? { status: '/api/kick-status', latest: '/api/kick-heatmap', history: '/api/kick-history', binding: 'DB_KICK_HOT', database: 'vl_kick_hot' }
    : { status: '/api/twitch-status', latest: '/api/twitch-heatmap', history: '/api/history', binding: 'DB_TWITCH_HOT', database: 'vl_twitch_hot' }
}

function latestItems(payload) {
  if (Array.isArray(payload?.items)) return payload.items
  if (typeof payload?.latest?.payload_json !== 'string') return []
  try {
    const parsed = JSON.parse(payload.latest.payload_json)
    return Array.isArray(parsed?.items) ? parsed.items : Array.isArray(parsed?.data) ? parsed.data : []
  } catch {
    return []
  }
}

function latestId(row) {
  return normalize(row?.channelLogin ?? row?.id ?? row?.login ?? row?.slug ?? row?.username
    ?? row?.user_login ?? row?.user_slug ?? row?.channel?.slug ?? row?.channel?.username ?? row?.channel?.name)
}

function historyRows(payload) {
  const rows = Array.isArray(payload?.topStreamers) ? [...payload.topStreamers] : []
  if (Array.isArray(payload?.daily)) {
    for (const day of payload.daily) if (Array.isArray(day?.topStreamers)) rows.push(...day.topStreamers)
  }
  return rows
}

function historyIds(payload) {
  return unique(historyRows(payload).map(historyId).filter(Boolean))
}

function historyId(row) {
  return normalize(row?.streamerId ?? row?.channelId ?? row?.channelLogin ?? row?.id ?? row?.login ?? row?.slug)
}

function displayName(row, fallback) {
  return String(row?.displayName ?? row?.name ?? row?.user_name ?? row?.username ?? fallback).trim().slice(0, 100) || fallback
}

function normalize(value) {
  if (typeof value !== 'string') return null
  const id = value.trim().toLowerCase()
  return /^[a-z0-9_-]{1,64}$/.test(id) ? id : null
}

function absentId(provider, used) {
  for (const id of [`viewloom_w5b_absent_${provider}`, `viewloom_w5b_missing_${provider}`]) {
    if (!used.has(id)) return id
  }
  throw new Error(`${provider} could not allocate an absent id.`)
}

function unique(values) {
  return [...new Set(values)]
}

function counts(calls, paths) {
  return {
    latest: calls.filter((value) => value.startsWith(paths.latest)).length,
    history: calls.filter((value) => value.startsWith(paths.history)).length,
  }
}

function assertCounts(calls, paths, expected, label) {
  const actual = counts(calls, paths)
  check(actual.latest === expected.latest && actual.history === expected.history, `${label}: ${JSON.stringify({ expected, actual, calls })}`)
}

function assertDelta(calls, paths, before, expected, label) {
  const after = counts(calls, paths)
  const delta = { latest: after.latest - before.latest, history: after.history - before.history }
  check(delta.latest === expected.latest && delta.history === expected.history, `${label}: ${JSON.stringify({ expected, delta, before, after, calls })}`)
}

function assertProviderOnly(calls, provider) {
  const forbidden = provider === 'twitch'
    ? calls.filter((value) => value.startsWith('/api/kick-'))
    : calls.filter((value) => value.startsWith('/api/twitch-') || value.startsWith('/api/history?'))
  check(forbidden.length === 0, `${provider} crossed provider APIs: ${JSON.stringify(forbidden)}`)
}

async function ready(page) {
  await waitReady(page)
  await waitDataIdle(page)
}

async function assertNoOverflow(page, label) {
  const size = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, innerWidth }))
  check(size.scrollWidth <= size.innerWidth + 1, `${label} overflow: ${JSON.stringify(size)}`)
}

async function assertTargets(page, minimum) {
  const targets = await page.locator('.watchlist-page button:visible, .watchlist-page a.button:visible, .watchlist-page .watchlist-external:visible').evaluateAll((nodes) => nodes.map((node) => ({
    label: node.textContent?.trim(),
    height: node.getBoundingClientRect().height,
  })))
  check(targets.every((target) => target.height >= minimum), `Production target below ${minimum}px: ${JSON.stringify(targets.filter((target) => target.height < minimum))}`)
}

async function assertManagementTargets(page, minimum) {
  const targets = await page.locator('.watchlist-card__manage .button:visible').evaluateAll((nodes) => nodes.map((node) => ({
    label: node.textContent?.trim(),
    height: node.getBoundingClientRect().height,
  })))
  check(targets.length > 0, 'Production mobile management controls are missing.')
  check(targets.every((target) => target.height >= minimum), `Production management target below ${minimum}px: ${JSON.stringify(targets.filter((target) => target.height < minimum))}`)
}

async function assertMinimumHeight(locator, minimum, label) {
  const height = await locator.evaluate((node) => node.getBoundingClientRect().height)
  check(height >= minimum, `${label} is below ${minimum}px: ${height}`)
}

function strip(value) {
  return value.replace(/\/+$/, '')
}

function message(error) {
  return error instanceof Error ? error.message : String(error)
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function log(value) {
  const line = String(value)
  diagnostics.push(line)
  console.log(line)
  await appendFile(logPath, `${line}\n`)
}

async function writeEvidence() {
  evidence.diagnostics = diagnostics.slice(-250)
  await writeFile(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`)
}
