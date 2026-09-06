import assert from 'node:assert/strict'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { chromium } from 'playwright'

const webRoot = process.cwd()
const repoRoot = resolve(webRoot, '../..')
const origin = (process.env.PUBLIC_CURRENT_LOCAL_ORIGIN || 'http://127.0.0.1:4173').replace(/\/$/, '')
const outputRoot = '/tmp/public-current-browser-audit'
const outputPath = `${outputRoot}/twitch-stream-map-feature-tab-accessibility.json`
const viewports = [
  { id: 'desktop-1440', width: 1440, height: 1000 },
  { id: 'tablet-820', width: 820, height: 1180 },
  { id: 'mobile-390', width: 390, height: 844 },
  { id: 'mobile-360', width: 360, height: 800 },
]

await mkdir(outputRoot, { recursive: true })
const routes = await loadTwitchFeatureRoutes()
const browser = await chromium.launch({ headless: true })
const evidence = {
  schema: 'viewloom-twitch-stream-map-feature-tab-accessibility-v2',
  origin,
  result: 'running',
  counts: {},
  scenarios: [],
  violations: [],
}

try {
  for (const route of routes) {
    for (const viewport of viewports) {
      const scenario = await auditScenario(browser, route, viewport)
      evidence.scenarios.push(scenario)
      for (const violation of scenario.violations) {
        evidence.violations.push({ scenario: scenario.id, route: route.route, violation })
      }
    }
  }
  evidence.counts = {
    routes: routes.length,
    viewports: viewports.length,
    scenarios: evidence.scenarios.length,
    violations: evidence.violations.length,
    targetFailures: evidence.scenarios.filter((item) => item.link.height < 44).length,
    focusFailures: evidence.scenarios.filter((item) => !item.focus.reached || !item.focus.focusVisible || !item.focus.visualIndicator).length,
    kickMapLeaks: evidence.scenarios.filter((item) => item.kickMapLinks > 0).length,
  }
  evidence.result = evidence.violations.length === 0 ? 'pass' : 'fail'
} finally {
  await browser.close()
  await writeFile(outputPath, `${JSON.stringify(evidence, null, 2)}\n`)
}

assert.equal(evidence.scenarios.length, routes.length * viewports.length)
assert.equal(evidence.violations.length, 0, JSON.stringify(evidence.violations))
assert.equal(evidence.counts.targetFailures, 0)
assert.equal(evidence.counts.focusFailures, 0)
assert.equal(evidence.counts.kickMapLeaks, 0)
assert.equal(evidence.result, 'pass')
console.log(JSON.stringify({ result: evidence.result, counts: evidence.counts }, null, 2))

async function loadTwitchFeatureRoutes() {
  const parsed = JSON.parse(await readFile(resolve(repoRoot, 'docs/audits/public-surface-routes-twitch.json'), 'utf8'))
  return parsed.routes.filter((route) => route.route !== '*' && route.provider === 'twitch' && route.profile !== 'provider_home')
}

async function auditScenario(browser, route, viewport) {
  const id = `${route.id}--${viewport.id}`
  const context = await browser.newContext({ viewport })
  await context.route('**/api/**', async (requestRoute) => {
    await requestRoute.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ state: 'fixture_unavailable' }) })
  })
  const page = await context.newPage()
  const violations = []

  try {
    await page.goto(`${origin}${route.route}`, { waitUntil: 'domcontentloaded', timeout: 45_000 })
    const locator = page.locator('.feature-tabs a[href="/twitch/map/"]')
    await locator.waitFor({ timeout: 15_000 })

    const state = await page.evaluate(() => {
      const links = [...document.querySelectorAll('.feature-tabs a[href="/twitch/map/"]')]
      const link = links[0]
      const rect = link?.getBoundingClientRect()
      const style = link ? getComputedStyle(link) : null
      return {
        count: links.length,
        href: link?.getAttribute('href') ?? null,
        text: link?.textContent?.trim() ?? null,
        height: rect ? Math.round(rect.height) : 0,
        width: rect ? Math.round(rect.width) : 0,
        display: style?.display ?? null,
        active: Boolean(link?.classList.contains('active')),
        current: link?.getAttribute('aria-current') ?? null,
        installerOwned: link?.getAttribute('data-twitch-stream-map-feature-tab') === 'true',
        kickMapLinks: document.querySelectorAll('.feature-tabs a[href="/kick/map/"]').length,
      }
    })

    if (state.count !== 1) violations.push(`${id}: expected one Stream Map feature tab, found ${state.count}`)
    if (state.href !== '/twitch/map/') violations.push(`${id}: Stream Map href mismatch: ${state.href}`)
    if (!/Stream Map/i.test(state.text || '')) violations.push(`${id}: Stream Map label mismatch: ${state.text}`)
    if (state.height < 44) violations.push(`${id}: Stream Map target height ${state.height}px`)
    if (state.width <= 0) violations.push(`${id}: Stream Map target width is zero`)
    if (state.kickMapLinks !== 0) violations.push(`${id}: unauthorized Kick Map feature tab present`)
    if (route.route === '/twitch/map/' && (!state.active || state.current !== 'page')) {
      violations.push(`${id}: Stream Map tab must remain active/current on /twitch/map/`)
    }

    const focus = await focusStreamMapWithKeyboard(page)
    if (!focus.reached) violations.push(`${id}: keyboard focus did not reach Stream Map tab`)
    if (!focus.focusVisible) violations.push(`${id}: Stream Map tab is not :focus-visible under keyboard focus`)
    if (!focus.visualIndicator) violations.push(`${id}: Stream Map tab lacks a visible focus indicator`)

    return { id, route: route.route, viewport, link: state, focus, kickMapLinks: state.kickMapLinks, violations }
  } catch (error) {
    violations.push(error instanceof Error ? error.message : String(error))
    return {
      id,
      route: route.route,
      viewport,
      link: { height: 0, width: 0 },
      focus: { reached: false, focusVisible: false, visualIndicator: false },
      kickMapLinks: 0,
      violations,
    }
  } finally {
    await context.close()
  }
}

async function focusStreamMapWithKeyboard(page) {
  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
  })

  for (let attempt = 0; attempt < 120; attempt += 1) {
    await page.keyboard.press('Tab')
    const state = await page.evaluate(() => {
      const active = document.activeElement
      if (!(active instanceof HTMLAnchorElement) || active.getAttribute('href') !== '/twitch/map/' || !active.closest('.feature-tabs')) {
        return { reached: false, focusVisible: false, visualIndicator: false }
      }
      const style = getComputedStyle(active)
      const outlineWidth = Number.parseFloat(style.outlineWidth || '0') || 0
      return {
        reached: true,
        focusVisible: active.matches(':focus-visible'),
        outlineStyle: style.outlineStyle,
        outlineWidth,
        outlineOffset: style.outlineOffset,
        visualIndicator: style.outlineStyle !== 'none' && outlineWidth >= 2,
      }
    })
    if (state.reached) return state
  }
  return { reached: false, focusVisible: false, visualIndicator: false }
}
