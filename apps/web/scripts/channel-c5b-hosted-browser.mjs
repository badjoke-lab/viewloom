import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { chromium } from 'playwright'

const base = (process.env.CHANNEL_C5B_PREVIEW_URL ?? 'https://preview-channel-v1.viewloom.pages.dev').replace(/\/$/, '')
const out = resolve(process.env.CHANNEL_C5B_ARTIFACT_DIR ?? 'artifacts/channel-c5b-hosted')
mkdirSync(out, { recursive: true })

const assert = (condition, message) => { if (!condition) throw new Error(message) }

async function probeProvider(provider) {
  const apiPath = provider === 'kick' ? '/api/kick-history' : '/api/history'
  const response = await fetch(`${base}${apiPath}?period=30d&metric=viewer_minutes&qa=${Date.now()}`, {
    headers: { accept: 'application/json' },
    cache: 'no-store',
  })
  const text = await response.text()
  assert(response.ok, `${provider} Preview API returned ${response.status}: ${text.slice(0, 500)}`)

  let payload
  try { payload = JSON.parse(text) } catch { throw new Error(`${provider} Preview API did not return JSON.`) }
  assert(payload.platform === provider, `${provider} Preview API platform mismatch.`)
  assert(payload.source === 'real', `${provider} Preview API source is ${payload.source ?? 'missing'}, expected real.`)
  assert(['fresh', 'partial'].includes(payload.state), `${provider} Preview API state is ${payload.state ?? 'missing'}.`)
  assert(Array.isArray(payload.daily), `${provider} Preview API daily data is missing.`)
  assert(Array.isArray(payload.topStreamers) && payload.topStreamers.length > 0, `${provider} Preview API has no retained top streamers.`)

  const observedDays = payload.daily.filter((day) => day && day.coverageState !== 'missing').length
  assert(observedDays > 0, `${provider} Preview API has no observed retained day.`)

  const channel = payload.topStreamers.find((row) => row?.streamerId && row?.displayName)
  assert(channel, `${provider} Preview API has no selectable retained channel.`)

  return {
    provider,
    apiPath,
    source: payload.source,
    state: payload.state,
    observedDays,
    channelId: channel.streamerId,
    displayName: channel.displayName,
  }
}

async function waitForChannel(page) {
  await page.waitForFunction(() => document.querySelector('[data-channel-state]')?.textContent !== 'Loading')
  await page.waitForFunction(() => document.body.dataset.channelCandidateReady === 'true')
  await page.waitForSelector('.channel-summary-card--primary')
}

async function assertNoOverflow(page, label) {
  const size = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, innerWidth }))
  assert(size.scrollWidth <= size.innerWidth + 1, `${label}: horizontal overflow (${size.scrollWidth} > ${size.innerWidth}).`)
}

async function downloadText(page, selector) {
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.locator(selector).click(),
  ])
  const path = await download.path()
  assert(path, `Download ${download.suggestedFilename()} did not produce a local path.`)
  return {
    filename: download.suggestedFilename(),
    content: await import('node:fs/promises').then(({ readFile }) => readFile(path, 'utf8')),
  }
}

async function runProvider(browser, probe, viewport, screenshotName) {
  const context = await browser.newContext({
    viewport,
    isMobile: viewport.width <= 420,
    acceptDownloads: true,
    permissions: ['clipboard-read', 'clipboard-write'],
  })
  const page = await context.newPage()
  let historyRequests = 0
  page.on('request', (request) => {
    try {
      if (new URL(request.url()).pathname === probe.apiPath) historyRequests += 1
    } catch {}
  })

  const channelPath = probe.provider === 'kick' ? '/kick/channel/' : '/twitch/channel/'
  const params = new URLSearchParams({
    id: probe.channelId,
    name: probe.displayName,
    period: '30d',
    view: 'overview',
    qa: String(Date.now()),
  })
  await page.goto(`${base}${channelPath}?${params}`, { waitUntil: 'domcontentloaded', timeout: 30000 })
  await waitForChannel(page)

  assert(historyRequests === 1, `${probe.provider}: initial Channel History request count is ${historyRequests}.`)
  assert(await page.locator('.channel-summary-card--primary').count() === 2, `${probe.provider}: primary summary hierarchy is missing.`)
  assert(await page.locator('.channel-trend-column').count() > 0, `${probe.provider}: daily footprint is missing.`)
  assert(await page.locator('[data-channel-state]').textContent() !== 'Loading', `${probe.provider}: Channel state did not resolve.`)

  await page.locator('.channel-task-tabs [data-channel-view="days"]').click()
  await page.waitForFunction(() => document.body.dataset.channelView === 'days')
  await page.waitForSelector('.channel-day-card')
  const totalDays = await page.locator('.channel-day-card').count()
  const visibleDays = await page.locator('.channel-day-card:visible').count()
  assert(totalDays > 0, `${probe.provider}: Retained Days has no cards.`)
  assert(visibleDays <= 6, `${probe.provider}: Retained Days initial view exceeds six cards.`)

  const toggle = page.locator('[data-channel-days-toggle]')
  if (await toggle.isVisible()) {
    await toggle.click()
    await page.waitForFunction(() => document.body.dataset.channelDaysExpanded === 'true')
    assert(await page.locator('.channel-day-card:visible').count() === totalDays, `${probe.provider}: Show all did not reveal all retained days.`)
    await toggle.click()
    await page.waitForFunction(() => document.body.dataset.channelDaysExpanded === 'false')
    assert(await page.locator('.channel-day-card:visible').count() <= 6, `${probe.provider}: Show recent did not restore the bounded view.`)
  } else {
    assert(totalDays <= 6, `${probe.provider}: retained-day toggle is hidden despite more than six cards.`)
  }
  assert(historyRequests === 1, `${probe.provider}: Retained Days interaction refetched History.`)

  await page.locator('.channel-task-tabs [data-channel-view="report"]').click()
  await page.waitForFunction(() => document.body.dataset.channelView === 'report')
  await page.waitForFunction(() => document.body.dataset.channelReportReady === 'true')
  const preview = await page.locator('[data-channel-report-preview]').textContent()
  assert(preview?.includes(probe.displayName), `${probe.provider}: full report does not identify the selected channel.`)
  assert(preview?.includes(probe.provider === 'kick' ? 'Kick' : 'Twitch'), `${probe.provider}: full report provider label is missing.`)

  await page.locator('[data-channel-report-mode="short"]').click()
  const shortPost = await page.locator('[data-channel-report-preview]').textContent()
  assert(shortPost?.includes('retained footprint'), `${probe.provider}: short post retained-data language is missing.`)

  await page.locator('[data-channel-report-copy]').click()
  const copied = await page.evaluate(() => navigator.clipboard.readText())
  assert(copied === shortPost, `${probe.provider}: copied report does not match the selected mode.`)

  const csv = await downloadText(page, '[data-channel-report-csv]')
  const json = await downloadText(page, '[data-channel-report-json]')
  assert(csv.filename.startsWith(`viewloom-${probe.provider}-channel-`), `${probe.provider}: CSV filename is not provider-specific.`)
  assert(json.filename.startsWith(`viewloom-${probe.provider}-channel-`), `${probe.provider}: JSON filename is not provider-specific.`)
  assert(csv.content.includes(probe.provider), `${probe.provider}: CSV provider value is missing.`)
  const parsed = JSON.parse(json.content)
  assert(parsed.provider === probe.provider, `${probe.provider}: JSON provider mismatch.`)
  assert(parsed.channel?.id === probe.channelId, `${probe.provider}: JSON channel id mismatch.`)
  assert(historyRequests === 1, `${probe.provider}: report/copy/export refetched History (${historyRequests}).`)

  const actionHeights = await page.locator('.channel-report-actions button').evaluateAll((nodes) => nodes.map((node) => node.getBoundingClientRect().height))
  if (viewport.width <= 420) {
    assert(actionHeights.length > 0 && actionHeights.every((height) => height >= 48), `${probe.provider}: mobile report action below 48px.`)
  }

  await assertNoOverflow(page, `${probe.provider} ${viewport.width}px`)
  await page.screenshot({ path: resolve(out, screenshotName), fullPage: true })
  await context.close()

  return {
    ...probe,
    viewport,
    totalDays,
    initialVisibleDays: visibleDays,
    historyRequests,
    csvFilename: csv.filename,
    jsonFilename: json.filename,
  }
}

try {
  const twitchProbe = await probeProvider('twitch')
  const kickProbe = await probeProvider('kick')
  const browser = await chromium.launch({ headless: true })
  try {
    const twitch = await runProvider(browser, twitchProbe, { width: 1440, height: 1100 }, 'twitch-channel-desktop.png')
    const kick = await runProvider(browser, kickProbe, { width: 390, height: 844 }, 'kick-channel-mobile.png')
    writeFileSync(resolve(out, 'evidence.json'), JSON.stringify({ base, twitch, kick }, null, 2) + '\n')
  } finally {
    await browser.close()
  }
  console.log(`Channel C5B hosted Preview gate passed with Preview D1 data: ${base}`)
} catch (error) {
  const message = error instanceof Error ? `${error.name}: ${error.message}\n${error.stack ?? ''}` : String(error)
  writeFileSync(resolve(out, 'failure.txt'), message)
  console.error(message)
  process.exitCode = 1
}
