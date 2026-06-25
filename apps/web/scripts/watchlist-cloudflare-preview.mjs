import { appendFile, writeFile } from 'node:fs/promises'
import { chromium } from 'playwright'
import { check, setStoredDocument, waitDataIdle, waitReady } from './watchlist-shell-browser-fixture.mjs'

const previewOrigin = strip(process.env.WATCHLIST_PREVIEW_URL || 'https://preview-watchlist-v1.viewloom.pages.dev')
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
  evidence.deployment = await waitForDeployment()
  const twitch = await inspectProvider('twitch')
  const kick = await inspectProvider('kick')
  evidence.providers.twitch = twitch.summary
  evidence.providers.kick = kick.summary

  const browser = await chromium.launch({ headless: true })
  try {
    evidence.scenarios.push(await verifyWatchlist(browser, twitch, {
      width: 1440,
      height: 1000,
      mobile: false,
      screenshot: '/tmp/watchlist-w5a-twitch-desktop.png',
    }))
    evidence.scenarios.push(await verifyWatchlist(browser, kick, {
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
  evidence.error = message(error)
  await writeEvidence()
  throw error
}

async function waitForDeployment() {
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
        last = JSON.parse(text)
        if (
          last?.schema === 'viewloom-deployment-v1'
          && last?.environment === 'preview'
          && last?.branch === expectedBranch
          && last?.commit_sha === expectedSha
        ) {
          check(typeof last.pages_url === 'string' && last.pages_url.startsWith('https://'), 'Matching Preview deployment has no pages_url.')
          return last
        }
      }
    } catch (error) {
      log(`deployment attempt ${attempt}/60 failed: ${message(error)}`)
    }
    await delay(10_000)
  }
  throw new Error(`Matching Preview deployment was not observed. Last deployment: ${JSON.stringify(last)}`)
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
  check(Number(status?.latestSnapshot?.observedCount ?? 0) > 0, `${provider} status has no observed streams.`)
  check(!status?.error, `${provider} status exposes an error.`)

  const latestRows = latestItems(latest)
  const latestIds = unique(latestRows.map(latestId).filter(Boolean))
  const retained30 = historyIds(history30)
  const retained7 = historyIds(history7)
  check(latestIds.length > 0, `${provider} latest response has no usable ids.`)
  check(retained30.length > 0, `${provider} 30d History has no usable ids.`)
  check(retained7.length > 0, `${provider} 7d History has no usable ids.`)

  const latestSet = new Set(latestIds)
  const retainedSet = new Set(retained30)
  const intersection = latestIds.find((id) => retainedSet.has(id)) ?? null
  const latestOnly = latestIds.find((id) => !retainedSet.has(id)) ?? null
  const historyOnly = retained30.find((id) => !latestSet.has(id)) ?? null
  const latestPresent = intersection ?? latestOnly ?? latestIds[0]
  const historyPresent = intersection ?? historyOnly ?? retained30[0]
  const absent = absentId(provider, new Set([...latestIds, ...retained30, ...retained7]))
  const ids = unique([latestPresent, historyPresent, latestOnly, historyOnly, absent].filter(Boolean))
  check(ids.length >= 3, `${provider} did not provide enough distinct hosted states.`)

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
    latestOnly,
    historyOnly,
    absent,
    entries: ids.map((channelId) => ({ channelId, displayName: names.get(channelId) ?? channelId })),
    summary: {
      binding: status.storage.binding,
      database: status.storage.database,
      sourceMode: status.sourceMode ?? null,
      state: status.state ?? null,
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
      selectedEntryCount: ids.length,
    },
  }
}

async function verifyWatchlist(browser, data, viewport) {
  const { provider, paths } = data
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    isMobile: viewport.mobile,
    reducedMotion: viewport.mobile ? 'reduce' : 'no-preference',
  })
  const page = await context.newPage()
  const calls = []
  page.on('request', (request) => {
    const url = new URL(request.url())
    if (url.origin === previewOrigin && url.pathname.startsWith('/api/')) calls.push(`${url.pathname}${url.search}`)
  })
  page.on('console', (entry) => { if (entry.type() === 'error') log(`${provider} console.error: ${entry.text()}`) })
  page.on('pageerror', (error) => log(`${provider} pageerror: ${error.message}`))

  const route = `/${provider}/watchlist/`
  await page.goto(`${previewOrigin}${route}?qa=${Date.now()}`, { waitUntil: 'domcontentloaded', timeout: 30_000 })
  await ready(page)
  assertCounts(calls, paths, { latest: 0, history: 0 }, `${provider} empty initial load`)
  check(await page.locator('[data-watchlist-empty]').isVisible(), `${provider} hosted empty state is missing.`)
  check(await page.title() === `${provider === 'twitch' ? 'Twitch' : 'Kick'} Local Watchlist — ViewLoom`, `${provider} title mismatch.`)
  check(await page.locator('meta[name="robots"]').getAttribute('content') === 'noindex,follow', `${provider} robots mismatch.`)
  check(await page.locator('link[rel="canonical"]').getAttribute('href') === `https://vl.badjoke-lab.com${route}`, `${provider} canonical mismatch.`)

  await setStoredDocument(page, provider, data.entries)
  calls.length = 0
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 30_000 })
  await ready(page)
  assertCounts(calls, paths, { latest: 1, history: 1 }, `${provider} nonempty initial load`)
  assertProviderOnly(calls, provider)

  const latestText = await page.locator(`[data-watchlist-entry="${data.latestPresent}"]`).innerText()
  check(
    latestText.includes('In latest observed set') || latestText.includes('In latest available observed set'),
    `${provider} real latest-present evidence is missing for ${data.latestPresent}.`,
  )

  const historyText = await page.locator(`[data-watchlist-entry="${data.historyPresent}"]`).innerText()
  if (data.historyState30 === 'partial' || data.historyState30 === 'demo') {
    check(historyText.includes('Retained History is partial'), `${provider} partial retained evidence label is missing for ${data.historyPresent}.`)
  } else {
    check(historyText.includes('Present in retained History result'), `${provider} retained-present evidence is missing for ${data.historyPresent}.`)
  }

  const absentText = await page.locator(`[data-watchlist-entry="${data.absent}"]`).innerText()
  check(absentText.includes('Not in latest observed set'), `${provider} bounded latest absence is missing.`)
  check(absentText.includes('Not confirmed offline'), `${provider} offline limitation is missing.`)
  check(
    absentText.includes('No complete history is implied') || absentText.includes('Retained History is partial'),
    `${provider} retained limitation is missing.`,
  )

  let before = counts(calls, paths)
  await page.getByRole('button', { name: 'Last 7 days' }).click()
  await waitDataIdle(page)
  assertDelta(calls, paths, before, { latest: 0, history: 1 }, `${provider} 7d change`)
  check(new URL(page.url()).searchParams.get('period') === '7d', `${provider} 7d URL state is missing.`)

  before = counts(calls, paths)
  await page.goBack()
  await page.waitForFunction(() => document.querySelector('[data-watchlist-period="30d"]')?.getAttribute('aria-pressed') === 'true')
  await waitDataIdle(page)
  assertDelta(calls, paths, before, { latest: 0, history: 0 }, `${provider} cached Back restore`)

  before = counts(calls, paths)
  await page.getByRole('button', { name: 'Refresh data' }).click()
  await waitDataIdle(page)
  assertDelta(calls, paths, before, { latest: 1, history: 1 }, `${provider} combined refresh`)

  await assertNoOverflow(page, `${provider} ${viewport.width}px hosted`)
  if (viewport.mobile) await assertTargets(page, 48)
  await page.screenshot({ path: viewport.screenshot, fullPage: true })

  const result = {
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
    retainedUiState: data.historyState30 === 'partial' || data.historyState30 === 'demo' ? 'partial' : 'present',
    absentId: data.absent,
    mobileMinimumTarget: viewport.mobile ? 48 : null,
    totalObservedFeatureRequests: counts(calls, paths),
  }
  await appendLog(result)
  await context.close()
  return result
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
  check(stored?.entries?.[0]?.channelId === data.latestPresent, 'Hosted Kick Channel save did not persist the id.')
  check((await page.locator('[data-channel-watchlist-feedback]').innerText()).includes('No data request was made.'), 'Hosted Channel save feedback is incorrect.')
  await page.screenshot({ path: '/tmp/watchlist-w5a-channel-save.png', fullPage: true })

  const result = {
    id: 'kick-channel-save-hosted',
    result: 'pass',
    channelId: data.latestPresent,
    requestsBeforeSave: beforeSave,
    additionalRequestsOnSave: calls.length - beforeSave,
    providerStorage: 'viewloom.watchlist.kick.v1',
  }
  await appendLog(result)
  await context.close()
  return result
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
  for (const id of [`viewloom_w5a_absent_${provider}`, `viewloom_w5a_missing_${provider}`]) {
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
  check(targets.every((target) => target.height >= minimum), `Hosted target below ${minimum}px: ${JSON.stringify(targets.filter((target) => target.height < minimum))}`)
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

function log(value) {
  const line = String(value)
  diagnostics.push(line)
  console.log(line)
}

async function appendLog(value) {
  await appendFile('/tmp/watchlist-w5a.log', `${JSON.stringify(value)}\n`)
}

async function writeEvidence() {
  evidence.diagnostics = diagnostics.slice(-200)
  await writeFile('/tmp/watchlist-w5a-evidence.json', `${JSON.stringify(evidence, null, 2)}\n`)
}
