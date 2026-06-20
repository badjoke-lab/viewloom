import { mkdirSync, readFileSync, statSync } from 'node:fs'
import { resolve } from 'node:path'
import { chromium } from 'playwright'
import { historyPayload } from './history-battle-archive-fixture.mjs'

const base = process.env.HISTORY_EXPORT_BASE_URL ?? 'http://127.0.0.1:4173'
const artifactDir = resolve(process.env.HISTORY_EXPORT_ARTIFACT_DIR ?? 'artifacts/history-export')
const assert = (value, message) => { if (!value) throw new Error(message) }

mkdirSync(artifactDir, { recursive: true })

async function check(browser, provider, viewport) {
  const calls = { twitch: 0, kick: 0 }
  const context = await browser.newContext({ viewport, isMobile: viewport.width < 500, acceptDownloads: true })

  const fulfill = async (route, requestedProvider) => {
    calls[requestedProvider] += 1
    const requestUrl = new URL(route.request().url())
    const payload = historyPayload(requestedProvider)
    payload.metric = requestUrl.searchParams.get('metric') === 'peak_viewers' ? 'peak_viewers' : 'viewer_minutes'
    payload.period = { ...payload.period, to: '2026-06-18', days: 13, label: 'Fixture export range' }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(payload) })
  }

  await context.route('**/api/history*', (route) => fulfill(route, 'twitch'))
  await context.route('**/api/kick-history*', (route) => fulfill(route, 'kick'))

  const page = await context.newPage()
  await page.goto(`${base}/${provider}/history/?period=30d&metric=viewer_minutes`, { waitUntil: 'domcontentloaded' })
  await page.waitForFunction(() => {
    const exportNode = document.querySelector('[data-history-export]')
    const csv = document.querySelector('[data-history-export-csv]')
    const json = document.querySelector('[data-history-export-json]')
    return exportNode?.getAttribute('data-export-rows') === '13'
      && exportNode?.getAttribute('data-export-missing') === '1'
      && csv && !csv.hasAttribute('disabled')
      && json && !json.hasAttribute('disabled')
  })

  const exportState = await page.locator('[data-history-export]').evaluate((node) => ({
    provider: node.getAttribute('data-export-provider'),
    metric: node.getAttribute('data-export-metric'),
    rows: node.getAttribute('data-export-rows'),
    missing: node.getAttribute('data-export-missing'),
    from: node.getAttribute('data-export-from'),
    to: node.getAttribute('data-export-to'),
  }))
  assert(exportState.provider === provider, `${provider} export provider is incorrect.`)
  assert(exportState.metric === 'viewer_minutes', `${provider} export metric is incorrect.`)
  assert(exportState.rows === '13' && exportState.missing === '1', `${provider} export row summary is incorrect.`)
  assert(exportState.from === '2026-06-06' && exportState.to === '2026-06-18', `${provider} export period is incorrect.`)

  const other = provider === 'twitch' ? 'kick' : 'twitch'
  assert(calls[provider] > 0, `${provider} History endpoint was not requested.`)
  assert(calls[other] === 0, `${provider} export crossed provider endpoints.`)

  const beforeCsv = calls[provider]
  const csvDownloadPromise = page.waitForEvent('download')
  await page.locator('[data-history-export-csv]').click()
  const csvDownload = await csvDownloadPromise
  const csvName = `viewloom-${provider}-history-2026-06-06-2026-06-18.csv`
  assert(csvDownload.suggestedFilename() === csvName, `${provider} CSV filename is incorrect.`)
  const csvPath = resolve(artifactDir, csvName)
  await csvDownload.saveAs(csvPath)
  assert(statSync(csvPath).size > 300, `${provider} CSV is unexpectedly small.`)
  const csv = readFileSync(csvPath, 'utf8')
  const lines = csv.trimEnd().split(/\r?\n/)
  assert(lines[0] === 'provider,day,coverage_state,viewer_minutes,peak_viewers,peak_streamer,observed_stream_count,observed_minutes', `${provider} CSV header is incorrect.`)
  assert(lines.length === 14, `${provider} CSV row count is incorrect: ${lines.length}.`)
  const csvRows = lines.slice(1).map(parseCsvLine)
  assert(csvRows.every((row) => row[0] === provider), `${provider} CSV contains another provider.`)
  const missingRow = csvRows.find((row) => row[1] === '2026-06-18')
  assert(missingRow?.[2] === 'missing', `${provider} CSV missing row is absent.`)
  assert(missingRow?.slice(3).every((value) => value === ''), `${provider} CSV missing row inferred values.`)
  assert(calls[provider] === beforeCsv, `${provider} CSV download caused another History request.`)

  const beforeJson = calls[provider]
  const jsonDownloadPromise = page.waitForEvent('download')
  await page.locator('[data-history-export-json]').click()
  const jsonDownload = await jsonDownloadPromise
  const jsonName = `viewloom-${provider}-history-2026-06-06-2026-06-18.json`
  assert(jsonDownload.suggestedFilename() === jsonName, `${provider} JSON filename is incorrect.`)
  const jsonPath = resolve(artifactDir, jsonName)
  await jsonDownload.saveAs(jsonPath)
  const data = JSON.parse(readFileSync(jsonPath, 'utf8'))
  assert(data.schema === 'viewloom-history-export-v1', `${provider} JSON schema is incorrect.`)
  assert(data.provider === provider, `${provider} JSON provider is incorrect.`)
  assert(data.metric === 'viewer_minutes', `${provider} JSON metric is incorrect.`)
  assert(data.period.days === 13 && data.daily.length === 13, `${provider} JSON daily rows are incomplete.`)
  assert(data.coverage.missing_days === 1, `${provider} JSON missing count is incorrect.`)
  const jsonMissing = data.daily.find((row) => row.day === '2026-06-18')
  assert(jsonMissing?.coverage_state === 'missing', `${provider} JSON missing row is absent.`)
  assert(jsonMissing?.viewer_minutes === null && jsonMissing?.peak_viewers === null, `${provider} JSON missing row inferred values.`)
  assert(data.limitation === 'Observed ViewLoom data; not a provider-wide total.', `${provider} JSON limitation is absent.`)
  assert(new URL(data.view_url).pathname === `/${provider}/history/`, `${provider} JSON view URL is incorrect.`)
  assert(calls[provider] === beforeJson, `${provider} JSON download caused another History request.`)
  assert(calls[other] === 0, `${provider} JSON export crossed provider endpoints.`)

  await page.locator('[data-history-metric="peak_viewers"]').click()
  await page.waitForFunction(() => document.querySelector('[data-history-export]')?.getAttribute('data-export-metric') === 'peak_viewers')
  assert(calls[provider] >= 2, `${provider} metric refresh did not reuse the provider History endpoint.`)
  assert(calls[other] === 0, `${provider} metric refresh crossed provider endpoints.`)

  const width = await page.evaluate(() => [document.documentElement.scrollWidth, innerWidth])
  assert(width[0] <= width[1] + 1, `${provider} export introduced horizontal page overflow.`)
  await page.screenshot({ path: resolve(artifactDir, `history-export-${provider}.png`), fullPage: true })
  await context.close()
}

function parseCsvLine(line) {
  const values = []
  let value = ''
  let quoted = false
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index]
    if (character === '"' && quoted && line[index + 1] === '"') {
      value += '"'
      index += 1
    } else if (character === '"') {
      quoted = !quoted
    } else if (character === ',' && !quoted) {
      values.push(value)
      value = ''
    } else {
      value += character
    }
  }
  values.push(value)
  return values
}

const browser = await chromium.launch({ headless: true })
try {
  await check(browser, 'twitch', { width: 1440, height: 1100 })
  await check(browser, 'kick', { width: 390, height: 844 })
  console.log('History export browser gate passed.')
} finally {
  await browser.close()
}
