import { appendFile, writeFile } from 'node:fs/promises'
import { chromium } from 'playwright'
import {
  check,
  setStoredDocument,
  waitDataIdle,
  waitReady,
} from './watchlist-shell-browser-fixture.mjs'

const previewOrigin = stripTrailingSlash(
  process.env.WATCHLIST_PREVIEW_URL || 'https://preview-watchlist-v1.viewloom.pages.dev',
)
const expectedBranch = process.env.WATCHLIST_EXPECTED_BRANCH || 'preview-watchlist-v1'
const expectedSha = process.env.WATCHLIST_EXPECTED_SHA || 'c75b4549bb50d7eb54c0135874dba63db0b7cc69'
const diagnostics = []
const evidence = {
  schema: 'viewloom-watchlist-hosted-preview-acceptance-v1',
  phase: 'W5A',
  previewOrigin,
  expectedBranch,
  expectedSha,
  result: 'running',
  deployment: null,
  providers: {},
  scenarios: [],
  artifacts: [
    'watchlist-w5a-twitch-desktop.png',
    'watchlist-w5a-kick-mobile.png',
    'watchlist-w5a-channel-save.png',
    'watchlist-w5a-evidence.json',
    'watchlist-w5a.log',
  ],
}

try {
  evidence.deployment = await waitForMatchingDeployment()
  const twitch = await inspectProviderData('twitch')
  const kick = await inspectProviderData('kick')
  evidence.providers.twitch = twitch.summary
  evidence.providers.kick = kick.summary

  const browser = await chromium.launch({ headless: true })
  try {
    evidence.scenarios.push(await verifyWatchlistScenario(browser, 'twitch', twitch, {
      width: 1440,
      height: 1000,
      mobile: false,
      screenshot: '/tmp/watchlist-w5a-twitch-desktop.png',
    }))
    evidence.scenarios.push(await verifyWatchlistScenario(browser, 'kick', kick, {
      width: 390,
      height: 844,
      mobile: true,
      screenshot: '/tmp/watchlist-w5a-kick-mobile.png',
    }))
    evidence.scenarios.push(await verifyChannelSave(browser, kick))
  } finally {
    await browser.close()
  }

  evidence.result = 'pass'
  await writeEvidence()
  log('Watchlist W5A hosted Preview acceptance passed.')
} catch (error) {
  evidence.result = 'fail'
  evidence.error = error instanceof Error ? error.message : String(error)
  await writeEvidence()
  throw error
}

async function waitForMatchingDeployment() {
  let last = null
  for (let attempt = 1; attempt <= 60; attempt += 1) {
    try {
      const response = await fetch(`${previewOrigin}/deployment.json?qa=${Date.now()}`, {
        headers: { accept: 'application/json', 'cache-control': 'no-cache' },
        cache: 'no-store',
      })
      const text = await response.text()
      log(`deployment attempt ${attempt}/60: ${response.status} ${text.slice(0, 500)}`)
      if (response.ok) {
        const deployment = JSON.parse(text)
        last = deployment
        if (
          deployment?.schema === 'viewloom-deployment-v1'
          && deployment?.environment === 'preview'
          && deployment?.branch === expectedBranch
          && deployment?.commit_sha === expectedSha
        ) {
          check(
            typeof deployment.pages_url === 'string' && deployment.pages_url.startsWith('https://'),
            'Matching Preview deployment is missing pages_url.',
          )
          return deployment
        }
      }
    } catch (error) {
      log(`deployment attempt ${attempt}/60 failed: ${message(error)}`)
    }
    await delay(10_000)
  }
  throw new Error(`Matching Preview deployment was not observed. Last deployment: ${JSON.stringify(last)}`)
}

async function inspectProviderData(provider) {
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
  check(Number(status?.latestSnapshot?.observedCount ?? 0) > 0, `${provider} status has no observed streams.`)
  check(!status?.error, `${provider} status exposes an error: ${JSON.stringify(status?.error)}`)

  const latestRows = latestItems(latest)
  const latestIds = unique(latestRows.map(latestId).filter(Boolean))
  const retainedIds30 = historyIds(history30)
  const retainedIds7 = historyIds(history7)
  check(latestIds.length > 0, `${provider} latest response has no usable channel ids.`)
  check(retainedIds30.length > 0, `${provider} 30d History response has no usable channel ids.`)
  check(retainedIds7.length > 0, `${provider} 7d History response has no usable channel ids.`)

  const latestSet = new Set(latestIds)
  const retainedSet30 = new Set(retainedIds30)
  const intersection = latestIds.find((id) => retainedSet30.has(id)) ?? null
  const latestOnly = latestIds.find((id) => !retainedSet30.has(id)) ?? null
  const historyOnly = retainedIds30.find((id) => !latestSet.has(id)) ?? null
  const latestPresent = intersection ?? latestOnly ?? latestIds[0]
  const historyPresent = intersection ?? historyOnly ?? retainedIds30[0]
  const absent = hostedAbsentId(provider, new Set([...latestIds, ...retainedIds30, ...retainedIds7]))

  const selectedIds = unique([latestPresent, historyPresent, latestOnly, historyOnly, absent].filter(Boolean))
  check(selectedIds.length >= 3, `${provider} did not provide enough distinct real-data states.`)

  const displayNames = new Map()
  for (const row of latestRows) {
    const id = latestId(row)
    if (id) displayNames.set(id, latestName(row, id))
  }
  for (const row of historyRows(history30)) {
    const id = historyId(row)
    if (id && !displayNames.has(id)) displayNames.set(id, historyName(row, id))
  }

  return {
    provider,
    paths,
    status,
    latest,
    history30,
    history7,
    latestIds,
    retainedIds30,
    retainedIds7,
    latestPresent,
    historyPresent,
    latestOnly,
    historyOnly,
    absent,
    entries: selectedIds.map((channelId) => ({
      channelId,
      displayName: displayNames.get(channelId) ?? channelId,
    })),
    summary: {
      binding: status.storage.binding,
      database: status.storage.database,
      sourceMode: status.sourceMode ?? null,
      state: status.state ?? null,
      observedCount: status.latestSnapshot.observedCount,
      latestItemCount: latestIds.length,
      retained30ItemCount: retainedIds30.length,
      retained7ItemCount: retainedIds7.length,
      latestPresent,
      historyPresent,
      latestOnly,
      historyOnly,
      absent,
      selectedEntryCount: selectedIds.length,
    },
  }
}

async function verifyWatchlistScenario(browser, provider, data, viewport) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    isMobile: viewport.mobile,
    reducedMotion: viewport.mobile ? 'reduce' : 'no-preference',
  })
  const page = await context.newPage()
  const calls = []
  page.on('request', (request) => {
    const url = new URL(request.url())
    if (url.origin === previewOrigin && url.pathname.startsWith('/api/')) {
      calls.push(`${url.pathname}${url.search}`)
    }
  })
  page.on('console', (entry) => {
    if (entry.type() === 'error') log(`${provider} console.error: ${entry.text()}`)
  })
  page.on('pageerror', (error) => log(`${provider} pageerror: ${error.message}`))

  const route = `/${provider}/watchlist/`
  await page.goto(`${previewOrigin}${route}?qa=${Date.now()}`, { waitUntil: 'domcontentloaded', timeout: 30_000 })
  await waitReady(page)
  await waitDataIdle(page)
  check(featureCounts(calls, data.paths).latest === 0, `${provider} empty initial load requested latest data.`)
  check(featureCounts(calls, data.paths).history === 0, `${provider} empty initial load requested History data.`)
  check(await page.locator('[data-watchlist-empty]').isVisible(), `${provider} hosted empty state is not visible.`)

  const title = await page.title()
  check(title === `${provider === 'twitch' ? 'Twitch' : 'Kick'} Local Watchlist — ViewLoom`, `${provider} hosted title mismatch.`)
  check(await page.locator('meta[name="robots"]').getAttribute('content') === 'noindex,follow', `${provider} robots metadata mismatch.`)
  check(await page.locator('link[rel="canonical"]').getAttribute('href') === `https://vl.badjoke-lab.com${route}`, `${provider} canonical mismatch.`)

  await setStoredDocument(page, provider, data.entries)
  calls.length = 0
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 30_000 })
  await waitReady(page)
  await waitDataIdle(page)
  assertCounts(calls, data.paths, { latest: 1, history: 1 }, `${provider} hosted nonempty initial load`)
  assertNoCrossProviderRequests(calls, provider)

  const latestCard = page.locator(`[data-watchlist-entry="${data.latestPresent}"]`)
  const latestText = await latestCard.innerText()
  check(
    latestText.includes('In latest observed set') || latestText.includes('In latest available observed set'),
    `${provider} real latest-present evidence is missing for ${data.latestPresent}.`,
  )

  const historyCard = page.locator(`[data-watchlist-entry="${data.historyPresent}"]`)
  check(
    (await historyCard.innerText()).includes('Present in retained History result'),
    `${provider} real retained-present evidence is missing for ${data.historyPresent}.`,
  )

  const absentCard = page.locator(`[data-watchlist-entry="${data.absent}"]`)
  const absentText = await absentCard.innerText()
  check(absentText.includes('Not in latest observed set'), `${provider} bounded latest-absence evidence is missing.`)
  check(absentText.includes('Not confirmed offline'), `${provider} offline limitation is missing.`)
  check(
    absentText.includes('No complete history is implied') || absentText.includes('Retained History is partial'),
    `${provider} retained limitation is missing for the absent synthetic id.`,
  )

  let before = featureCounts(calls, data.paths)
  await page.getByRole('button', { name: 'Last 7 days' }).click()
  await waitDataIdle(page)
  assertDelta(calls, data.paths, before, { latest: 0, history: 1 }, `${provider} hosted 7d change`)
  check(new URL(page.url()).searchParams.get('period') === '7d', `${provider} hosted 7d URL state is missing.`)

  before = featureCounts(calls, data.paths)
  await page.goBack()
  await page.waitForFunction(() => document.querySelector('[data-watchlist-period="30d"]')?.getAttribute('aria-pressed') === 'true')
  await waitDataIdle(page)
  assertDelta(calls, data.paths, before, { latest: 0, history: 0 }, `${provider} hosted cached Back restore`)

  before = featureCounts(calls, data.paths)
  await page.getByRole('button', { name: 'Refresh data' }).click()
  await waitDataIdle(page)
  assertDelta(calls, data.paths, before, { latest: 1, history: 1 }, `${provider} hosted combined refresh`)

  await assertNoOverflow(page, `${provider} hosted ${viewport.width}px`)
  await assertTargets(page, viewport.mobile ? 48 : 44)
  await page.screenshot({ path: viewport.screenshot, fullPage: true })

  const scenario = {
    id: `${provider}-${viewport.mobile ? 'mobile' : 'desktop'}-hosted`,
    result: 'pass',
    viewport: { width: viewport.width, height: viewport.height },
    initialRequests: { latest: 1, history: 1 },
    periodChangeRequests: { latest: 0, history: 1 },
    cachedRestoreRequests: { latest: 0, history: 0 },
    refreshRequests: { latest: 1, history: 1 },
    providerIsolation: true,
    realLatestId: data.latestPresent,
    realHistoryId: data.historyPresent,
    absentId: data.absent,
    totalObservedFeatureRequests: featureCounts(calls, data.paths),
  }
  await appendLog(scenario)
  await context.close()
  return scenario
}

async function verifyChannelSave(browser, data) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  const page = await context.newPage()
  const calls = []
  page.on('request', (request) => {
    const url = new URL(request.url())
    if (url.origin === previewOrigin && url.pathname.startsWith('/api/')) calls.push(`${url.pathname}${url.search}`)
  })

  await page.goto(`${previewOrigin}/kick/watchlist/?qa=${Date.now()}`, { waitUntil: 'domcontentloaded', timeout: 30_000 })
  await waitReady(page)
  await setStoredDocument(page, 'kick', [])
  calls.length = 0
  await page.goto(`${previewOrigin}/kick/channel/?id=${encodeURIComponent(data.latestPresent)}&qa=${Date.now()}`, {
    waitUntil: 'domcontentloaded',
    timeout: 30_000,
  })
  await page.locator('[data-channel-watchlist-action]').waitFor()
  await page.waitForFunction(() => document.body.dataset.channelWatchlist === 'available')
  await page.waitForFunction(() => document.querySelector('[data-channel-state]')?.textContent !== 'Loading')

  const beforeSave = calls.length
  await page.getByRole('button', { name: 'Save to Watchlist' }).click()
  await page.locator('[data-channel-watchlist-action] a').waitFor()
  check(calls.length === beforeSave, 'Hosted Kick Channel save made an additional API request.')
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('viewloom.watchlist.kick.v1') || 'null'))
  check(stored?.entries?.[0]?.channelId === data.latestPresent, 'Hosted Kick Channel save did not persist the selected id.')
  check(
    (await page.locator('[data-channel-watchlist-feedback]').innerText()).includes('No data request was made.'),
    'Hosted Kick Channel save feedback lost its no-request statement.',
  )
  await page.screenshot({ path: '/tmp/watchlist-w5a-channel-save.png', fullPage: true })

  const scenario = {
    id: 'kick-channel-save-hosted',
    result: 'pass',
    channelId: data.latestPresent,
    requestsBeforeSave: beforeSave,
    additionalRequestsOnSave: calls.length - beforeSave,
    providerStorage: 'viewloom.watchlist.kick.v1',
  }
  await appendLog(scenario)
  await context.close()
  return scenario
}

async function fetchJson(path) {
  const url = `${previewOrigin}${path}`
  const response = await fetch(url, {
    headers: { accept: 'application/json', 'cache-control': 'no-cache' },
    cache: 'no-store',
  })
  const text = await response.text()
  log(`${response.status} ${url} ${text.slice(0, 300)}`)
  check(response.ok, `Hosted request failed: ${response.status} ${url}`)
  try {
    return JSON.parse(text)
  } catch {
    throw new Error(`Hosted response is not JSON: ${url}`)
  }
}

function providerPaths(provider) {
  if (provider === 'kick') {
    return {
      status: '/api/kick-status',
      latest: '/api/kick-heatmap',
      history: '/api/kick-history',
      binding: 'DB_KICK_HOT',
      database: 'vl_kick_hot',
    }
  }
  return {
    status: '/api/twitch-status',
    latest: '/api/twitch-heatmap',
    history: '/api/history',
    binding: 'DB_TWITCH_HOT',
    database: 'vl_twitch_hot',
  }
}

function latestItems(payload) {
  if (Array.isArray(payload?.items)) return payload.items
  const raw = payload?.latest?.payload_json
  if (typeof raw !== 'string') return []
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed?.items)) return parsed.items
    if (Array.isArray(parsed?.data)) return parsed.data
  } catch {}
  return []
}

function latestId(row) {
  return normalizeId(
    row?.channelLogin ?? row?.id ?? row?.login ?? row?.slug ?? row?.username
      ?? row?.user_login ?? row?.user_slug ?? row?.channel?.slug ?? row?.channel?.username ?? row?.channel?.name,
  )
}

function latestName(row, fallback) {
  return String(row?.displayName ?? row?.name ?? row?.user_name ?? row?.username ?? row?.channel?.displayName ?? fallback).trim().slice(0, 100) || fallback
}

function historyRows(payload) {
  const rows = []
  if (Array.isArray(payload?.topStreamers)) rows.push(...payload.topStreamers)
  if (Array.isArray(payload?.daily)) {
    for (const day of payload.daily) if (Array.isArray(day?.topStreamers)) rows.push(...day.topStreamers)
  }
  return rows
}

function historyIds(payload) {
  return unique(historyRows(payload).map(historyId).filter(Boolean))
}

function historyId(row) {
  return normalizeId(row?.streamerId ?? row?.channelId ?? row?.channelLogin ?? row?.id ?? row?.login ?? row?.slug)
}

function historyName(row, fallback) {
  return String(row?.displayName ?? row?.name ?? row?.user_name ?? fallback).trim().slice(0, 100) || fallback
}

function normalizeId(value) {
  if (typeof value !== 'string') return null
  const normalized = value.trim().toLowerCase()
  return /^[a-z0-9_-]{1,64}$/.test(normalized) ? normalized : null
}

function hostedAbsentId(provider, used) {
  for (const value of [`viewloom_w5a_absent_${provider}`, `viewloom_w5a_missing_${provider}`]) {
    if (!used.has(value)) return value
  }
  throw new Error(`${provider} could not allocate a deterministic absent id.`)
}

function unique(values) {
  return [...new Set(values)]
}

function featureCounts(calls, paths) {
  return {
    latest: calls.filter((value) => value.startsWith(paths.latest)).length,
    history: calls.filter((value) => value.startsWith(paths.history)).length,
  }
}

function assertCounts(calls, paths, expected, label) {
  const actual = featureCounts(calls, paths)
  check(actual.latest === expected.latest && actual.history === expected.history, `${label} mismatch: ${JSON.stringify({ expected, actual, calls })}`)
}

function assertDelta(calls, paths, before, expected, label) {
  const after = featureCounts(calls, paths)
  const delta = { latest: after.latest - before.latest, history: after.history - before.history }
  check(delta.latest === expected.latest && delta.history === expected.history, `${label} mismatch: ${JSON.stringify({ expected, delta, before, after, calls })}`)
}

function assertNoCrossProviderRequests(calls, provider) {
  const forbidden = provider === 'twitch'
    ? calls.filter((value) => value.startsWith('/api/kick-'))
    : calls.filter((value) => value.startsWith('/api/twitch-') || value.startsWith('/api/history?'))
  check(forbidden.length === 0, `${provider} hosted scenario crossed provider APIs: ${JSON.stringify(forbidden)}`)
}

async function assertNoOverflow(page, label) {
  const dimensions = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, innerWidth }))
  check(dimensions.scrollWidth <= dimensions.innerWidth + 1, `${label} has horizontal overflow: ${JSON.stringify(dimensions)}`)
}

async function assertTargets(page, minimum) {
  const targets = await page.locator('.watchlist-page button:visible, .watchlist-page a.button:visible, .watchlist-page .watchlist-external:visible').evaluateAll((nodes) => nodes.map((node) => ({
    label: node.textContent?.trim(),
    height: node.getBoundingClientRect().height,
  })))
  check(targets.every((target) => target.height >= minimum), `Hosted target below ${minimum}px: ${JSON.stringify(targets.filter((target) => target.height < minimum))}`)
}

function stripTrailingSlash(value) {
  return value.replace(/\/+$/, '')
}

function message(error) {
  return error instanceof Error ? error.message : String(error)
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function log(value) {
  const line = String(value)
  diagnostics.push(line)
  console.log(line)
  return appendFile('/tmp/watchlist-w5a.log', `${line}\n`).catch(() => {})
}

async function appendLog(value) {
  await appendFile('/tmp/watchlist-w5a.log', `${JSON.stringify(value)}\n`)
}

async function writeEvidence() {
  evidence.diagnostics = diagnostics.slice(-200)
  await writeFile('/tmp/watchlist-w5a-evidence.json', `${JSON.stringify(evidence, null, 2)}\n`)
}
