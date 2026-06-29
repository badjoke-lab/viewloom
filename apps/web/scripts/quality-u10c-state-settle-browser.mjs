import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { chromium } from 'playwright'

const base = process.env.QUALITY_U10C_BASE_URL ?? 'http://127.0.0.1:4173'
const out = resolve(process.env.QUALITY_U10C_ARTIFACT_DIR ?? 'artifacts/quality-u10c')
mkdirSync(out, { recursive: true })

const routes = [
  ['/twitch/heatmap/', 'heatmap'], ['/kick/heatmap/', 'heatmap'],
  ['/twitch/day-flow/', 'day-flow'], ['/kick/day-flow/', 'day-flow'],
  ['/twitch/battle-lines/', 'battle-lines'], ['/kick/battle-lines/', 'battle-lines'],
  ['/twitch/history/', 'history'], ['/kick/history/', 'history'],
]
const widths = [1440, 820, 390, 360]
const checks = []
const browser = await chromium.launch({ headless: true })
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
  await context.route('**/api/**', (route) => route.fulfill({
    status: 503,
    contentType: 'application/json',
    body: JSON.stringify({ state: 'unavailable', error: { message: 'U10C state fixture' } }),
  }))

  for (const [path, feature] of routes) {
    for (const width of widths) {
      const page = await context.newPage()
      await page.setViewportSize({ width, height: width >= 820 ? 1000 : 844 })
      await page.goto(`${base}${path}`, { waitUntil: 'domcontentloaded' })
      await page.waitForFunction((name) => {
        const stage = document.querySelector(`[data-visualization-surface="${name}"]`)
        const guide = document.querySelector(`[data-visualization-guide="${name}"]`)
        const state = stage?.getAttribute('data-visualization-state')
        return Boolean(stage && guide && state && state !== 'loading' && state === guide.getAttribute('data-visualization-state'))
      }, feature, { timeout: 10000 })

      const value = await page.evaluate((name) => {
        const stage = document.querySelector(`[data-visualization-surface="${name}"]`)
        const guide = document.querySelector(`[data-visualization-guide="${name}"]`)
        const stateCell = guide?.querySelector('[data-visualization-guide-cell="state"]')
        return {
          stageState: stage?.getAttribute('data-visualization-state') ?? '',
          guideState: guide?.getAttribute('data-visualization-state') ?? '',
          busy: stage?.getAttribute('aria-busy') ?? '',
          stateLabel: stateCell?.querySelector('strong')?.textContent?.trim() ?? '',
          stateDetail: stateCell?.querySelector('span')?.textContent?.trim() ?? '',
          stateMark: stateCell?.querySelector('[data-visualization-state-mark]')?.textContent?.trim() ?? '',
        }
      }, feature)
      assert.notEqual(value.stageState, 'loading', `${path} ${width}: state remained loading`)
      assert.equal(value.stageState, value.guideState, `${path} ${width}: state surfaces diverged`)
      assert.equal(value.busy, 'false', `${path} ${width}: settled stage remained busy`)
      assert.ok(value.stateLabel && value.stateDetail && value.stateMark, `${path} ${width}: state presentation is incomplete`)
      checks.push({ path, feature, width, ...value, result: 'pass' })
      await page.close()
    }
  }
} finally {
  writeFileSync(resolve(out, 'quality-u10c-state-settle-evidence.json'), `${JSON.stringify({
    schema: 'viewloom-quality-u10c-state-settle-v1',
    phase: 'U10C',
    candidateHead: process.env.GITHUB_HEAD_SHA ?? process.env.GITHUB_SHA ?? null,
    checks,
    result: checks.length === 32 ? 'pass' : 'fail',
  }, null, 2)}\n`)
  await browser.close()
}

assert.equal(checks.length, 32)
console.log('ViewLoom U10C settled-state browser gate passed for 32 route/viewport checks.')
