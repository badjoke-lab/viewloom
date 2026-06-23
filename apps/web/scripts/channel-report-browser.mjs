import { readFile } from 'node:fs/promises'
import { chromium } from 'playwright'
import { channelHistoryPayload } from './channel-profile-fixture.mjs'

const baseUrl = process.env.CHANNEL_BASE_URL ?? 'http://127.0.0.1:4173'
const assert = (condition, message) => { if (!condition) throw new Error(message) }

function edgePayload(provider) {
  const payload = structuredClone(channelHistoryPayload(provider))
  payload.source = 'demo'
  payload.state = 'fresh'
  payload.topStreamers = []
  payload.rankings = {}
  payload.battleArchive = []
  payload.daily = (payload.daily ?? []).map((day) => ({ ...day, topStreamers: [] }))
  return payload
}

async function installRoutes(context, calls, overrides = {}) {
  await context.route('**/api/history?**', (route) => {
    calls.twitch += 1
    const payload = overrides.twitch ?? channelHistoryPayload('twitch')
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(payload) })
  })
  await context.route('**/api/kick-history?**', (route) => {
    calls.kick += 1
    const payload = overrides.kick ?? channelHistoryPayload('kick')
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(payload) })
  })
  await context.route('**/api/twitch-status', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{"state":"fresh"}' }))
  await context.route('**/api/kick-status', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{"state":"fresh"}' }))
}

async function waitReady(page) {
  await page.waitForFunction(() => document.querySelector('[data-channel-state]')?.textContent !== 'Loading')
  await page.waitForFunction(() => document.body.dataset.channelReportReady === 'true')
}

async function noOverflow(page, label) {
  const result = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, innerWidth }))
  assert(result.scrollWidth <= result.innerWidth + 1, `${label}: horizontal overflow (${result.scrollWidth} > ${result.innerWidth}).`)
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
    content: await readFile(path, 'utf8'),
  }
}

async function runStandard(browser) {
  const provider = 'twitch'
  const calls = { twitch: 0, kick: 0 }
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1100 },
    acceptDownloads: true,
    permissions: ['clipboard-read', 'clipboard-write'],
  })
  await installRoutes(context, calls)
  const page = await context.newPage()
  await page.goto(`${baseUrl}/twitch/channel/?id=alpha&name=Alpha+Channel&period=7d&view=report`, { waitUntil: 'domcontentloaded' })
  await waitReady(page)

  const full = await page.locator('[data-channel-report-preview]').textContent()
  assert(full?.includes('Twitch retained channel footprint'), 'twitch report: provider heading is wrong.')
  assert(full?.includes('Retained daily Top 10 appearances: 4'), 'twitch report: appearance count is wrong.')
  assert(full?.includes('Exact session start/end history is not available'), 'twitch report: session limitation is missing.')
  assert(!full?.includes('Kick'), 'twitch report: Kick leaked into the report.')
  assert(calls.twitch === 1 && calls.kick === 0, 'twitch report: initial provider requests are wrong.')

  await page.locator('[data-channel-report-mode="short"]').click()
  const short = await page.locator('[data-channel-report-preview]').textContent()
  assert(short?.includes('retained footprint'), 'twitch report: short post lacks retained language.')
  assert(short?.includes('absence does not confirm offline'), 'twitch report: short post lacks absence limitation.')

  await page.locator('[data-channel-report-copy]').click()
  const copied = await page.evaluate(() => navigator.clipboard.readText())
  assert(copied === short, 'twitch report: copied summary does not match the selected mode.')

  const csv = await downloadText(page, '[data-channel-report-csv]')
  const csvText = csv.content.replace(/^\uFEFF/, '')
  assert(csv.filename === 'viewloom-twitch-channel-alpha-7d.csv', `twitch report: CSV filename is wrong (${csv.filename}).`)
  assert(csvText.split(/\r?\n/).filter(Boolean).length === 8, 'twitch report: CSV must contain one header and seven requested-day rows.')
  assert(csvText.includes('twitch,alpha,Alpha Channel,7d,2026-06-13,false,good,,,,,'), 'twitch report: absent CSV day must keep numeric cells blank.')
  assert(!csvText.includes('Kick'), 'twitch report: CSV leaked Kick.')

  const json = await downloadText(page, '[data-channel-report-json]')
  const parsed = JSON.parse(json.content)
  assert(json.filename === 'viewloom-twitch-channel-alpha-7d.json', `twitch report: JSON filename is wrong (${json.filename}).`)
  assert(parsed.schema === 'viewloom-channel-v1' && parsed.provider === provider, 'twitch report: JSON identity contract is wrong.')
  assert(parsed.daily.length === 7, 'twitch report: JSON must contain every requested day.')
  const absent = parsed.daily.find((entry) => entry.day === '2026-06-13')
  assert(absent?.retained_top10 === false && absent.viewer_minutes === null && absent.peak_viewers === null, 'twitch report: JSON absence must use false and null.')
  assert(parsed.rivalry_candidates.length === 2, 'twitch report: JSON rivalry candidates are wrong.')
  assert(parsed.limitations.some((value) => value.includes('not confirmation')), 'twitch report: JSON limitations are missing.')
  assert(calls.twitch === 1 && calls.kick === 0, 'twitch report: copy/export triggered another request or crossed providers.')

  await noOverflow(page, 'twitch report desktop')
  await page.screenshot({ path: '/tmp/channel-report-twitch-desktop.png', fullPage: true })
  await context.close()
}

async function runEdge(browser) {
  const calls = { twitch: 0, kick: 0 }
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    acceptDownloads: true,
  })
  await installRoutes(context, calls, { kick: edgePayload('kick') })
  const page = await context.newPage()
  const displayName = 'Long, "quoted" チャンネル名 that must wrap safely across the mobile report surface'
  await page.goto(`${baseUrl}/kick/channel/?id=ghost&name=${encodeURIComponent(displayName)}&period=7d&view=report`, { waitUntil: 'domcontentloaded' })
  await waitReady(page)

  const full = await page.locator('[data-channel-report-preview]').textContent()
  assert(full?.includes(displayName), 'kick report edge: long Unicode fallback name is missing.')
  assert(full?.includes('Source / state: demo / fresh'), 'kick report edge: demo source/state is missing.')
  assert(full?.includes('No retained daily rivalry candidate'), 'kick report edge: empty rivalry language is missing.')
  assert(!full?.includes('Twitch'), 'kick report edge: Twitch leaked into the report.')

  const csv = await downloadText(page, '[data-channel-report-csv]')
  const csvText = csv.content.replace(/^\uFEFF/, '')
  assert(csv.filename === 'viewloom-kick-channel-ghost-7d.csv', `kick report edge: CSV filename is wrong (${csv.filename}).`)
  assert(csvText.includes('"Long, ""quoted"" チャンネル名 that must wrap safely across the mobile report surface"'), 'kick report edge: CSV quote/comma escaping is wrong.')
  assert(csvText.includes('kick,ghost,'), 'kick report edge: CSV provider/id is wrong.')
  assert(!csvText.includes('Twitch'), 'kick report edge: CSV leaked Twitch.')

  const json = await downloadText(page, '[data-channel-report-json]')
  const parsed = JSON.parse(json.content)
  assert(parsed.source === 'demo' && parsed.channel.display_name === displayName, 'kick report edge: JSON demo/name fields are wrong.')
  assert(parsed.summary.viewer_minutes === null && parsed.summary.peak_viewers === null, 'kick report edge: missing summary numerics must be null.')
  assert(parsed.rivalry_candidates.length === 0, 'kick report edge: empty rivalry must remain empty.')
  assert(parsed.daily.every((entry) => entry.retained_top10 === false && entry.viewer_minutes === null), 'kick report edge: missing daily rows must remain false/null.')
  assert(calls.kick === 1 && calls.twitch === 0, 'kick report edge: exports refetched or crossed providers.')

  await noOverflow(page, 'kick report mobile 390px')
  await page.screenshot({ path: '/tmp/channel-report-kick-mobile.png', fullPage: true })
  await context.close()
}

const browser = await chromium.launch({ headless: true })
try {
  await runStandard(browser)
  await runEdge(browser)
  console.log('Channel C4B report and export browser gate passed.')
} finally {
  await browser.close()
}
