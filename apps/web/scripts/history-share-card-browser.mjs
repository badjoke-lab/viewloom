import { mkdirSync, readFileSync, statSync } from 'node:fs'
import { resolve } from 'node:path'
import { chromium } from 'playwright'
import { historyPayload } from './history-battle-archive-fixture.mjs'

const base = process.env.HISTORY_SHARE_BASE_URL ?? 'http://127.0.0.1:4173'
const artifactDir = resolve(process.env.HISTORY_SHARE_ARTIFACT_DIR ?? 'artifacts/history-share-card')
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
    payload.period = { ...payload.period, to: '2026-06-18', days: 13, label: 'Fixture share-card range' }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(payload) })
  }

  await context.route('**/api/history*', (route) => fulfill(route, 'twitch'))
  await context.route('**/api/kick-history*', (route) => fulfill(route, 'kick'))

  const page = await context.newPage()
  await page.goto(`${base}/${provider}/history/?period=30d&metric=viewer_minutes`, { waitUntil: 'domcontentloaded' })
  await page.waitForFunction(() => {
    const canvas = document.querySelector('[data-history-share-card]')
    const status = document.querySelector('[data-history-share-status]')
    return canvas?.getAttribute('data-share-total') === '13'
      && canvas?.getAttribute('data-share-observed') === '12'
      && status?.textContent === 'Share card ready.'
  })

  const canvasState = await page.locator('[data-history-share-card]').evaluate((canvas) => ({
    width: canvas.width,
    height: canvas.height,
    provider: canvas.getAttribute('data-share-provider'),
    metric: canvas.getAttribute('data-share-metric'),
    observed: canvas.getAttribute('data-share-observed'),
    total: canvas.getAttribute('data-share-total'),
    missing: canvas.getAttribute('data-share-missing'),
    attention: canvas.getAttribute('data-share-attention'),
    dataUrlLength: canvas.toDataURL('image/png').length,
  }))

  assert(canvasState.width === 1200, `${provider} share card width is incorrect.`)
  assert(canvasState.height === 630, `${provider} share card height is incorrect.`)
  assert(canvasState.provider === provider, `${provider} share card provider is incorrect.`)
  assert(canvasState.metric === 'viewer_minutes', `${provider} share card metric is incorrect.`)
  assert(canvasState.observed === '12' && canvasState.total === '13', `${provider} share-card coverage is incorrect.`)
  assert(canvasState.missing === '1', `${provider} share-card missing count is incorrect.`)
  assert(Number(canvasState.attention) >= 1, `${provider} share-card partial coverage is absent.`)
  assert(canvasState.dataUrlLength > 10000, `${provider} share-card canvas appears empty.`)

  const other = provider === 'twitch' ? 'kick' : 'twitch'
  assert(calls[provider] > 0, `${provider} History endpoint was not requested.`)
  assert(calls[other] === 0, `${provider} share card crossed provider endpoints.`)

  const callsBeforeDownload = calls[provider]
  const downloadPromise = page.waitForEvent('download')
  await page.locator('[data-history-share-download]').click()
  const download = await downloadPromise
  const suggested = download.suggestedFilename()
  assert(suggested === `viewloom-${provider}-history-2026-06-06-2026-06-18.png`, `${provider} share-card filename is incorrect: ${suggested}.`)
  const pngPath = resolve(artifactDir, suggested)
  await download.saveAs(pngPath)
  const size = statSync(pngPath).size
  assert(size > 10000, `${provider} downloaded PNG is unexpectedly small: ${size}.`)
  const dimensions = pngDimensions(pngPath)
  assert(dimensions.width === 1200 && dimensions.height === 630, `${provider} downloaded PNG dimensions are incorrect.`)
  await page.waitForFunction(() => document.querySelector('[data-history-share-status]')?.textContent === 'PNG downloaded.')
  assert(calls[provider] === callsBeforeDownload, `${provider} PNG download caused another History request.`)
  assert(calls[other] === 0, `${provider} PNG download crossed provider endpoints.`)

  await page.locator('[data-history-metric="peak_viewers"]').click()
  await page.waitForFunction(() => document.querySelector('[data-history-share-card]')?.getAttribute('data-share-metric') === 'peak_viewers')
  assert(calls[provider] >= 2, `${provider} metric refresh did not reuse the provider History endpoint.`)
  assert(calls[other] === 0, `${provider} metric refresh crossed provider endpoints.`)

  const width = await page.evaluate(() => [document.documentElement.scrollWidth, innerWidth])
  assert(width[0] <= width[1] + 1, `${provider} share card introduced horizontal page overflow.`)
  await page.screenshot({ path: resolve(artifactDir, `history-share-card-${provider}.png`), fullPage: true })
  await context.close()
}

function pngDimensions(path) {
  const data = readFileSync(path)
  const signature = data.subarray(0, 8).toString('hex')
  assert(signature === '89504e470d0a1a0a', `${path} is not a PNG file.`)
  return { width: data.readUInt32BE(16), height: data.readUInt32BE(20) }
}

const browser = await chromium.launch({ headless: true })
try {
  await check(browser, 'twitch', { width: 1440, height: 1100 })
  await check(browser, 'kick', { width: 390, height: 844 })
  console.log('History share-card browser gate passed.')
} finally {
  await browser.close()
}
