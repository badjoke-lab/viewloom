import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { chromium } from 'playwright'
import { historyPayload } from './history-period-comparison-fixture.mjs'

const base = process.env.HISTORY_H1_BASE_URL ?? 'http://127.0.0.1:4173'
const out = resolve(process.env.HISTORY_H1_ARTIFACT_DIR ?? 'artifacts/history-ui-h1')
const evidence = {
  schema: 'viewloom-history-ui-h1-metric-v1',
  phase: 'P9H1',
  candidateHead: process.env.GITHUB_HEAD_SHA ?? process.env.GITHUB_SHA ?? null,
  scenarios: [],
  result: 'running',
}
mkdirSync(out, { recursive: true })

async function installRoutes(context, calls) {
  const reply = async (route, provider) => {
    const url = new URL(route.request().url())
    const metric = url.searchParams.get('metric') === 'peak_viewers' ? 'peak_viewers' : 'viewer_minutes'
    calls.push({ provider, metric, path: `${url.pathname}${url.search}` })
    const payload = structuredClone(historyPayload(provider, 'comparable'))
    payload.metric = metric
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(payload) })
  }
  await context.route('**/api/kick-history*', (route) => reply(route, 'kick'))
  await context.route('**/api/history*', (route) => reply(route, 'twitch'))
}

async function waitForMetric(page, metric) {
  const label = metric === 'peak_viewers' ? 'Peak viewers' : 'Viewer-minutes'
  await page.waitForFunction(({ metric, label }) => {
    const summary = document.querySelector('[data-history-summary]')
    const selected = document.querySelector('[data-history-selected-day]')
    const ranking = document.querySelector('[data-history-ranking-context]')
    const exportRoot = document.querySelector('[data-history-export]')
    const share = document.querySelector('[data-history-share-card]')
    const report = document.querySelector('[data-history-report-preview]')
    return summary?.getAttribute('data-history-metric') === metric
      && selected?.getAttribute('data-history-metric') === metric
      && ranking?.textContent?.includes(label)
      && exportRoot?.getAttribute('data-export-metric') === metric
      && share?.getAttribute('data-share-metric') === metric
      && report?.textContent?.includes(`Metric: ${label}`)
  }, { metric, label })
}

async function snapshot(page) {
  return page.evaluate(() => ({
    url: location.href,
    chart: document.querySelector('.history-chart-caption')?.textContent?.replace(/\s+/g, ' ').trim() ?? '',
    chartAria: document.querySelector('.history-stage svg')?.getAttribute('aria-label') ?? '',
    summary: document.querySelector('[data-history-summary]')?.textContent?.replace(/\s+/g, ' ').trim() ?? '',
    summaryMetric: document.querySelector('[data-history-summary]')?.getAttribute('data-history-metric') ?? '',
    selectedDay: document.querySelector('[data-history-selected-day]')?.textContent?.replace(/\s+/g, ' ').trim() ?? '',
    selectedMetric: document.querySelector('[data-history-selected-day]')?.getAttribute('data-history-metric') ?? '',
    selectedPrimary: document.querySelector('[data-history-selected-primary]')?.getAttribute('data-history-selected-primary') ?? '',
    ranking: document.querySelector('[data-history-ranking-context]')?.textContent?.replace(/\s+/g, ' ').trim() ?? '',
    rankingMetric: document.querySelector('.metric-ledger')?.getAttribute('data-history-metric') ?? '',
    archive: document.querySelector('[data-history-day-card]')?.textContent?.replace(/\s+/g, ' ').trim() ?? '',
    archiveMetric: document.querySelector('[data-history-day-card]')?.getAttribute('data-history-metric') ?? '',
    report: document.querySelector('[data-history-report-preview]')?.textContent?.replace(/\s+/g, ' ').trim() ?? '',
    shareMetric: document.querySelector('[data-history-share-card]')?.getAttribute('data-share-metric') ?? '',
    sharePrimary: document.querySelector('[data-history-share-card]')?.getAttribute('data-share-primary-value') ?? '',
    exportMetric: document.querySelector('[data-history-export]')?.getAttribute('data-export-metric') ?? '',
    exportStatus: document.querySelector('[data-history-export-status]')?.textContent?.replace(/\s+/g, ' ').trim() ?? '',
  }))
}

async function scenario(browser, provider, viewport) {
  const calls = []
  const context = await browser.newContext({ viewport, isMobile: viewport.width <= 390 })
  await installRoutes(context, calls)
  const page = await context.newPage()
  await page.goto(`${base}/${provider}/history/?period=7d&metric=viewer_minutes`, { waitUntil: 'domcontentloaded' })
  await waitForMetric(page, 'viewer_minutes')
  const viewer = await snapshot(page)
  await page.screenshot({ path: resolve(out, `${provider}-${viewport.width}-viewer-minutes.png`), fullPage: true })

  await page.locator('[data-history-metric="peak_viewers"]').click()
  await page.waitForFunction(() => location.search.includes('metric=peak_viewers')
    && document.querySelector('.history-chart-caption strong')?.textContent?.includes('Peak viewers'))
  await waitForMetric(page, 'peak_viewers')
  const peak = await snapshot(page)
  await page.screenshot({ path: resolve(out, `${provider}-${viewport.width}-peak-viewers.png`), fullPage: true })

  assert.notEqual(viewer.url, peak.url, `${provider}: metric URL did not change`)
  assert.notEqual(`${viewer.chart}|${viewer.chartAria}`, `${peak.chart}|${peak.chartAria}`, `${provider}: chart meaning did not change`)
  assert.notEqual(viewer.summary, peak.summary, `${provider}: Summary stayed stale`)
  assert.notEqual(viewer.selectedDay, peak.selectedDay, `${provider}: Selected day stayed stale`)
  assert.notEqual(viewer.ranking, peak.ranking, `${provider}: Ranking context stayed stale`)
  assert.notEqual(viewer.archive, peak.archive, `${provider}: Daily archive stayed stale`)
  assert.notEqual(viewer.report, peak.report, `${provider}: Report stayed stale`)
  assert.notEqual(viewer.sharePrimary, peak.sharePrimary, `${provider}: Share-card primary value stayed stale`)
  assert.equal(viewer.summaryMetric, 'viewer_minutes')
  assert.equal(peak.summaryMetric, 'peak_viewers')
  assert.equal(viewer.selectedMetric, 'viewer_minutes')
  assert.equal(peak.selectedMetric, 'peak_viewers')
  assert.equal(viewer.selectedPrimary, 'viewer_minutes')
  assert.equal(peak.selectedPrimary, 'peak_viewers')
  assert.equal(viewer.rankingMetric, 'viewer_minutes')
  assert.equal(peak.rankingMetric, 'peak_viewers')
  assert.equal(viewer.archiveMetric, 'viewer_minutes')
  assert.equal(peak.archiveMetric, 'peak_viewers')
  assert.equal(viewer.shareMetric, 'viewer_minutes')
  assert.equal(peak.shareMetric, 'peak_viewers')
  assert.equal(viewer.exportMetric, 'viewer_minutes')
  assert.equal(peak.exportMetric, 'peak_viewers')
  assert.match(viewer.summary, /Total observed/i)
  assert.match(peak.summary, /Highest peak/i)
  assert.match(viewer.report, /Metric: Viewer-minutes/i)
  assert.match(peak.report, /Metric: Peak viewers/i)
  assert.match(viewer.exportStatus, /Viewer-minutes/i)
  assert.match(peak.exportStatus, /Peak viewers/i)

  const beforeLocalActions = calls.length
  const reportPost = page.locator('[data-history-report-mode="post"]')
  if (await reportPost.count()) await reportPost.click()
  const archiveAttention = page.locator('[data-history-archive-filter="attention"]')
  if (await archiveAttention.count()) await archiveAttention.click()
  await page.waitForTimeout(100)
  assert.equal(calls.length, beforeLocalActions, `${provider}: local task/archive actions refetched History`)

  assert.equal(calls.filter((call) => call.metric === 'viewer_minutes').length, 1, `${provider}: viewer-minute request count changed`)
  assert.equal(calls.filter((call) => call.metric === 'peak_viewers').length, 1, `${provider}: peak-viewer request count changed`)
  assert.ok(calls.every((call) => call.provider === provider), `${provider}: crossed provider endpoint`)

  evidence.scenarios.push({ id: `${provider}-metric-${viewport.width}`, provider, viewport, calls, viewer, peak })
  await context.close()
}

const browser = await chromium.launch({ headless: true })
try {
  await scenario(browser, 'twitch', { width: 1440, height: 1000 })
  await scenario(browser, 'kick', { width: 390, height: 844 })
  evidence.result = 'pass'
  writeFileSync(resolve(out, 'history-ui-h1-evidence.json'), `${JSON.stringify(evidence, null, 2)}\n`)
  console.log(JSON.stringify({ result: evidence.result, scenarios: evidence.scenarios.map((item) => item.id) }, null, 2))
} catch (error) {
  evidence.result = 'fail'
  evidence.error = error instanceof Error ? error.message : String(error)
  writeFileSync(resolve(out, 'history-ui-h1-evidence.json'), `${JSON.stringify(evidence, null, 2)}\n`)
  throw error
} finally {
  await browser.close()
}
