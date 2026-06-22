import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { chromium } from 'playwright'
import { historyPayload } from './history-battle-archive-fixture.mjs'

const base = process.env.HISTORY_REPORT_EXPORT_BASE_URL ?? 'http://127.0.0.1:4173'
const artifactDir = resolve(process.env.HISTORY_REPORT_EXPORT_ARTIFACT_DIR ?? 'artifacts/history-report-export-h4')
const assert = (value, message) => { if (!value) throw new Error(message) }
mkdirSync(artifactDir, { recursive: true })

async function installRoutes(context, calls) {
  const fulfill = async (route, provider) => {
    calls[provider] += 1
    const requestUrl = new URL(route.request().url())
    const payload = historyPayload(provider)
    payload.metric = requestUrl.searchParams.get('metric') === 'peak_viewers' ? 'peak_viewers' : 'viewer_minutes'
    payload.period = { ...payload.period, to: '2026-06-18', days: 13, label: 'Fixture publishing range' }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(payload) })
  }
  await context.route('**/api/history*', (route) => fulfill(route, 'twitch'))
  await context.route('**/api/kick-history*', (route) => fulfill(route, 'kick'))
}

async function check(browser, provider, viewport) {
  const calls = { twitch: 0, kick: 0 }
  const context = await browser.newContext({ viewport, isMobile: viewport.width < 500 })
  await context.addInitScript(() => {
    window.__viewloomCopiedText = ''
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: async (text) => { window.__viewloomCopiedText = String(text) } },
    })
  })
  await installRoutes(context, calls)

  const page = await context.newPage()
  await page.goto(`${base}/${provider}/history/?view=report&period=30d&metric=viewer_minutes`, { waitUntil: 'domcontentloaded' })
  await page.waitForFunction(() => {
    const workspace = document.querySelector('[data-history-report][data-history-share][data-history-export]')
    const copy = document.querySelector('[data-history-report-copy]')
    const png = document.querySelector('[data-history-share-download]')
    const csv = document.querySelector('[data-history-export-csv]')
    const json = document.querySelector('[data-history-export-json]')
    return workspace
      && copy && !copy.hasAttribute('disabled')
      && png && !png.hasAttribute('disabled')
      && csv && !csv.hasAttribute('disabled')
      && json && !json.hasAttribute('disabled')
  })
  await page.waitForFunction(() => document.querySelector('.history-page')?.getAttribute('data-history-view') === 'report')

  const structure = await page.evaluate(() => ({
    reportBlocks: document.querySelectorAll('.history-report-block').length,
    shareBlocks: document.querySelectorAll('.history-share-block').length,
    exportBlocks: document.querySelectorAll('.history-export-block').length,
    workspaces: document.querySelectorAll('[data-history-report][data-history-share][data-history-export]').length,
    labels: Array.from(document.querySelectorAll('.history-publish-actions button')).map((button) => button.textContent?.trim()),
    previewHidden: document.querySelector('[data-history-share-preview]')?.hasAttribute('hidden'),
    rendered: document.querySelector('[data-history-share-card]')?.getAttribute('data-share-rendered'),
  }))

  assert(structure.reportBlocks === 1 && structure.workspaces === 1, `${provider}: Report & Export is not one top-level workspace.`)
  assert(structure.shareBlocks === 0 && structure.exportBlocks === 0, `${provider}: legacy top-level Share or Export blocks remain.`)
  assert(JSON.stringify(structure.labels) === JSON.stringify(['Copy report', 'Preview share card', 'Download PNG', 'Download CSV', 'Download JSON']), `${provider}: unified action order is incorrect.`)
  assert(structure.previewHidden === true && structure.rendered !== 'true', `${provider}: share preview was not deferred.`)

  const providerCalls = calls[provider]
  await page.locator('[data-history-report-mode="post"]').click()
  await page.waitForFunction(() => document.querySelector('[data-history-report-preview]')?.textContent?.includes('History snapshot'))
  assert(calls[provider] === providerCalls, `${provider}: History API was fetched again while switching text mode.`)

  await page.locator('[data-history-report-copy]').click()
  await page.waitForFunction(() => document.querySelector('[data-history-report-status]')?.textContent === 'Short post copied.')
  assert(calls[provider] === providerCalls, `${provider}: History API was fetched again while copying.`)

  await page.locator('[data-history-share-toggle]').click()
  await page.waitForFunction(() => document.querySelector('[data-history-share-card]')?.getAttribute('data-share-rendered') === 'true')
  assert(await page.locator('[data-history-share-preview]').isVisible(), `${provider}: Preview share card did not open.`)
  assert(calls[provider] === providerCalls, `${provider}: History API was fetched again while opening Preview share card.`)

  const other = provider === 'twitch' ? 'kick' : 'twitch'
  assert(calls[other] === 0, `${provider}: Report & Export crossed provider endpoints.`)

  const dimensions = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, innerWidth: window.innerWidth }))
  assert(dimensions.scrollWidth <= dimensions.innerWidth + 1, `${provider}: Report & Export introduced horizontal overflow.`)
  await page.screenshot({ path: resolve(artifactDir, `history-report-export-${provider}.png`), fullPage: true })
  await context.close()
}

const browser = await chromium.launch({ headless: true })
try {
  await check(browser, 'twitch', { width: 1440, height: 1100 })
  await check(browser, 'kick', { width: 390, height: 844 })
  console.log('History Report & Export H4 browser gate passed: one top-level workspace, Preview share card on demand, no repeated History API request, and no horizontal overflow.')
} finally {
  await browser.close()
}
