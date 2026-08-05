import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { chromium } from 'playwright'
import { historyPayload } from './history-battle-archive-fixture.mjs'

const base = process.env.HISTORY_REPORT_EXPORT_BASE_URL ?? 'http://127.0.0.1:4173'
const artifactDir = resolve(process.env.HISTORY_REPORT_EXPORT_ARTIFACT_DIR ?? 'artifacts/history-report-export-h4')
const assert = (value, message) => { if (!value) throw new Error(message) }
const evidence = {
  schema: 'viewloom-history-report-export-h4-browser-v2',
  head: process.env.GITHUB_HEAD_SHA ?? process.env.GITHUB_SHA ?? null,
  scenarios: [],
  result: 'running',
}

mkdirSync(artifactDir, { recursive: true })
saveEvidence()

function saveEvidence() {
  writeFileSync(resolve(artifactDir, 'history-report-export-h4-evidence.json'), `${JSON.stringify(evidence, null, 2)}\n`)
}

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
  const scenario = { provider, viewport, calls, checkpoints: [], result: 'running' }
  evidence.scenarios.push(scenario)
  saveEvidence()

  let context
  let page
  try {
    context = await browser.newContext({ viewport, isMobile: viewport.width < 500 })
    await context.addInitScript(() => {
      window.__viewloomCopiedText = ''
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: { writeText: async (text) => { window.__viewloomCopiedText = String(text) } },
      })
    })
    await installRoutes(context, calls)
    page = await context.newPage()

    await page.goto(`${base}/${provider}/history/?view=report&period=30d&metric=viewer_minutes`, { waitUntil: 'domcontentloaded' })
    await page.waitForFunction(() => {
      const workspace = document.querySelector('[data-history-report][data-history-share][data-history-export]')
      const controls = [
        document.querySelector('[data-history-report-copy]'),
        document.querySelector('[data-history-share-download]'),
        document.querySelector('[data-history-export-csv]'),
        document.querySelector('[data-history-export-json]'),
      ]
      return workspace && controls.every((control) => control && !control.hasAttribute('disabled'))
    })
    await page.waitForFunction(() => document.querySelector('.history-page')?.getAttribute('data-history-view') === 'report')
    await page.waitForFunction(() => document.querySelector('[data-history-report-share-native]'))

    const structure = await page.evaluate(() => {
      const nativeShare = document.querySelector('[data-history-report-share-native]')
      return {
        reportBlocks: document.querySelectorAll('.history-report-block').length,
        shareBlocks: document.querySelectorAll('.history-share-block').length,
        exportBlocks: document.querySelectorAll('.history-export-block').length,
        workspaces: document.querySelectorAll('[data-history-report][data-history-share][data-history-export]').length,
        labels: Array.from(document.querySelectorAll('.history-publish-actions button')).map((button) => button.textContent?.trim()),
        nativeShareHidden: nativeShare instanceof HTMLButtonElement ? nativeShare.hidden : null,
        nativeShareSupported: typeof navigator.share === 'function',
        previewHidden: document.querySelector('[data-history-share-preview]')?.hasAttribute('hidden'),
        rendered: document.querySelector('[data-history-share-card]')?.getAttribute('data-share-rendered'),
      }
    })
    scenario.checkpoints.push({ name: 'structure', value: structure })
    saveEvidence()

    assert(structure.reportBlocks === 1 && structure.workspaces === 1, `${provider}: one top-level workspace was not retained.`)
    assert(structure.shareBlocks === 0 && structure.exportBlocks === 0, `${provider}: legacy top-level Share or Export blocks remain.`)
    assert(JSON.stringify(structure.labels) === JSON.stringify(['Copy report', 'Share report', 'Preview share card', 'Download PNG', 'Download CSV', 'Download JSON']), `${provider}: unified action order is incorrect: ${JSON.stringify(structure.labels)}.`)
    assert(structure.nativeShareHidden === !structure.nativeShareSupported, `${provider}: nativeShareHidden does not match Web Share support: ${JSON.stringify(structure)}.`)
    assert(structure.previewHidden === true && structure.rendered !== 'true', `${provider}: Preview share card was not deferred.`)

    const providerCalls = calls[provider]
    await page.locator('[data-history-report-mode="post"]').click()
    await page.waitForFunction(() => document.querySelector('[data-history-report-preview]')?.textContent?.includes('History snapshot'))
    assert(calls[provider] === providerCalls, `${provider}: History API was fetched again while switching text mode.`)

    await page.locator('[data-history-report-copy]').click()
    await page.waitForFunction(() => document.querySelector('[data-history-report-status]')?.textContent === 'Short post copied.')
    assert(calls[provider] === providerCalls, `${provider}: History API was fetched again while copying.`)

    await page.locator('[data-history-share-toggle]').click()
    await page.waitForFunction(() => document.querySelector('[data-history-share-card]')?.getAttribute('data-share-rendered') === 'true')
    const previewState = await page.evaluate(() => {
      const node = document.querySelector('[data-history-share-preview]')
      return {
        visible: node instanceof HTMLElement && !node.hidden && getComputedStyle(node).display !== 'none' && node.getClientRects().length > 0,
        hidden: node?.hasAttribute('hidden'),
        expanded: document.querySelector('[data-history-share-toggle]')?.getAttribute('aria-expanded'),
        rendered: document.querySelector('[data-history-share-card]')?.getAttribute('data-share-rendered'),
      }
    })
    scenario.checkpoints.push({ name: 'preview-open', value: previewState })
    saveEvidence()
    assert(previewState.visible === true, `${provider}: Preview share card did not open: ${JSON.stringify(previewState)}.`)
    assert(calls[provider] === providerCalls, `${provider}: History API was fetched again while opening Preview share card.`)

    const other = provider === 'twitch' ? 'kick' : 'twitch'
    assert(calls[other] === 0, `${provider}: Report & Export crossed provider endpoints.`)

    const dimensions = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, innerWidth: window.innerWidth }))
    scenario.checkpoints.push({ name: 'dimensions', value: dimensions })
    assert(dimensions.scrollWidth <= dimensions.innerWidth + 1, `${provider}: Report & Export introduced horizontal overflow.`)
    await page.screenshot({ path: resolve(artifactDir, `history-report-export-${provider}.png`), fullPage: true })
    scenario.result = 'pass'
    saveEvidence()
  } catch (error) {
    scenario.result = 'fail'
    scenario.error = error instanceof Error ? error.message : String(error)
    if (page) {
      scenario.checkpoints.push({ name: 'failure-dom', value: await page.evaluate(() => ({
        activeMode: document.querySelector('[data-history-report]')?.getAttribute('data-history-report-active-mode'),
        reportStatus: document.querySelector('[data-history-report-status]')?.textContent,
        shareStatus: document.querySelector('[data-history-share-status]')?.textContent,
        previewHidden: document.querySelector('[data-history-share-preview]')?.hasAttribute('hidden'),
        expanded: document.querySelector('[data-history-share-toggle]')?.getAttribute('aria-expanded'),
        rendered: document.querySelector('[data-history-share-card]')?.getAttribute('data-share-rendered'),
        labels: Array.from(document.querySelectorAll('.history-publish-actions button')).map((button) => button.textContent?.trim()),
      })) })
    }
    saveEvidence()
    throw error
  } finally {
    await context?.close()
  }
}

const browser = await chromium.launch({ headless: true })
try {
  await check(browser, 'twitch', { width: 1440, height: 1100 })
  await check(browser, 'kick', { width: 390, height: 844 })
  evidence.result = 'pass'
  saveEvidence()
  console.log('History Report & Export H4 browser gate passed: one top-level workspace, Share report visibility follows Web Share support, Preview share card on demand, no repeated History API request, and no horizontal overflow.')
} catch (error) {
  evidence.result = 'fail'
  evidence.error = error instanceof Error ? error.message : String(error)
  saveEvidence()
  throw error
} finally {
  await browser.close()
}
