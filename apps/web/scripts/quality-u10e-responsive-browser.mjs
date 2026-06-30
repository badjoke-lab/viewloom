import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { chromium } from 'playwright'

const base = process.env.QUALITY_U10E_BASE_URL ?? 'http://127.0.0.1:4173'
const out = resolve(process.env.QUALITY_U10E_ARTIFACT_DIR ?? 'artifacts/quality-u10e')
mkdirSync(out, { recursive: true })

const routes = [
  { id: 'portal', path: '/', important: ['.portal-provider-card__actions .button'] },
  { id: 'twitch-day-flow', path: '/twitch/day-flow/' },
  { id: 'kick-day-flow', path: '/kick/day-flow/' },
  { id: 'twitch-battle-lines', path: '/twitch/battle-lines/' },
  { id: 'kick-battle-lines', path: '/kick/battle-lines/' },
  { id: 'twitch-channel', path: '/twitch/channel/', important: ['[data-channel-copy-url]'] },
  { id: 'kick-channel', path: '/kick/channel/', important: ['[data-channel-copy-url]'] },
  { id: 'twitch-watchlist', path: '/twitch/watchlist/', important: ['[data-watchlist-add]', '[data-watchlist-refresh]'] },
  { id: 'kick-watchlist', path: '/kick/watchlist/', important: ['[data-watchlist-add]', '[data-watchlist-refresh]'] },
]
const viewports = [
  { width: 1440, height: 1000, reducedMotion: 'no-preference', forcedColors: 'none' },
  { width: 820, height: 1180, reducedMotion: 'reduce', forcedColors: 'none' },
  { width: 390, height: 844, reducedMotion: 'no-preference', forcedColors: 'none' },
  { width: 360, height: 800, reducedMotion: 'reduce', forcedColors: 'active' },
]

const evidence = {
  schema: 'viewloom-quality-u10e-responsive-browser-v1',
  phase: 'U10E',
  candidateHead: process.env.GITHUB_HEAD_SHA ?? process.env.GITHUB_SHA ?? null,
  result: 'running',
  routes: routes.length,
  widths: viewports.map((item) => item.width),
  scenarios: [],
}

const browser = await chromium.launch({ headless: true })
try {
  for (const route of routes) {
    for (const viewport of viewports) {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        reducedMotion: viewport.reducedMotion,
        forcedColors: viewport.forcedColors,
        colorScheme: 'dark',
      })
      await context.route('**/googletagmanager.com/**', (request) => request.abort())
      await context.route('**/google-analytics.com/**', (request) => request.abort())
      await context.route('**/api/**', (request) => request.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ state: 'error', status: 'error', source: 'api' }) }))
      const page = await context.newPage()
      await page.goto(`${base}${route.path}`, { waitUntil: 'domcontentloaded' })
      await page.waitForTimeout(500)

      const snapshot = await page.evaluate(({ mobile, importantSelectors }) => {
        const visible = (node) => {
          const rect = node.getBoundingClientRect()
          const style = getComputedStyle(node)
          return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity || '1') > 0
        }
        const nameOf = (node) => {
          if (!(node instanceof HTMLElement)) return ''
          return (node.getAttribute('aria-label') || node.getAttribute('title') || node.textContent || (node instanceof HTMLInputElement ? node.name || node.placeholder : '') || '').trim().replace(/\s+/g, ' ')
        }
        const selector = 'button, a.button, input:not([type="hidden"]), select, textarea, [role="button"]'
        const targets = [...document.querySelectorAll(selector)].filter(visible).map((node) => {
          const rect = node.getBoundingClientRect()
          return { tag: node.tagName.toLowerCase(), name: nameOf(node), width: Number(rect.width.toFixed(1)), height: Number(rect.height.toFixed(1)) }
        })
        const important = importantSelectors.flatMap((selectorValue) => [...document.querySelectorAll(selectorValue)].filter(visible).map((node) => {
          const rect = node.getBoundingClientRect()
          return { selector: selectorValue, name: nameOf(node), height: Number(rect.height.toFixed(1)) }
        }))
        return {
          targets,
          under44: mobile ? targets.filter((item) => item.height < 44) : [],
          unnamed: targets.filter((item) => !item.name),
          importantUnder48: mobile ? important.filter((item) => item.height < 48) : [],
          overflow: Math.max(0, document.documentElement.scrollWidth - innerWidth),
        }
      }, { mobile: viewport.width <= 390, importantSelectors: route.important ?? [] })

      assert.ok(snapshot.targets.length > 0, `${route.id} ${viewport.width}: no visible controls measured`)
      assert.equal(snapshot.unnamed.length, 0, `${route.id} ${viewport.width}: unnamed controls ${JSON.stringify(snapshot.unnamed)}`)
      assert.ok(snapshot.overflow <= 2, `${route.id} ${viewport.width}: horizontal overflow ${snapshot.overflow}px`)
      if (viewport.width <= 390) {
        assert.equal(snapshot.under44.length, 0, `${route.id} ${viewport.width}: targets below 44px ${JSON.stringify(snapshot.under44)}`)
        assert.equal(snapshot.importantUnder48.length, 0, `${route.id} ${viewport.width}: important targets below 48px ${JSON.stringify(snapshot.importantUnder48)}`)
      }

      await page.keyboard.press('Tab')
      const focus = await page.evaluate(() => {
        const active = document.activeElement
        if (!(active instanceof HTMLElement)) return { moved: false, visible: false, name: '', outline: '' }
        const rect = active.getBoundingClientRect()
        const style = getComputedStyle(active)
        return {
          moved: active !== document.body && active !== document.documentElement,
          visible: rect.width > 0 && rect.height > 0,
          name: (active.getAttribute('aria-label') || active.textContent || '').trim().replace(/\s+/g, ' '),
          outline: `${style.outlineStyle} ${style.outlineWidth} ${style.boxShadow}`,
        }
      })
      assert.equal(focus.moved, true, `${route.id} ${viewport.width}: first Tab did not reach an action`)
      assert.equal(focus.visible, true, `${route.id} ${viewport.width}: first focused action is not visible`)
      assert.ok(focus.name, `${route.id} ${viewport.width}: first focused action has no name`)
      assert.equal(/none 0px(?: none)?$/.test(focus.outline), false, `${route.id} ${viewport.width}: focus indicator is not visible`)

      if (route.path.includes('/day-flow/')) {
        const dateName = await page.locator('[data-dayflow-date]').evaluate((input) => ({
          label: [...input.labels].map((item) => item.textContent?.trim() ?? '').filter(Boolean).join(' '),
          ariaLabel: input.getAttribute('aria-label') ?? '',
        }))
        assert.equal(dateName.label || dateName.ariaLabel, 'UTC date', `${route.id}: UTC date accessible name changed`)
      }

      const filename = `${route.id}-${viewport.width}.png`
      await page.screenshot({ path: resolve(out, filename), fullPage: true })
      evidence.scenarios.push({
        id: `${route.id}-${viewport.width}`,
        route: route.path,
        viewport,
        measuredTargets: snapshot.targets.length,
        minimumTargetHeight: Math.min(...snapshot.targets.map((item) => item.height)),
        overflow: snapshot.overflow,
        focus,
        screenshot: filename,
      })
      await context.close()
    }
  }
  assert.equal(evidence.scenarios.length, 36)
  evidence.result = 'pass'
} catch (error) {
  evidence.result = 'fail'
  evidence.error = error instanceof Error ? error.stack ?? error.message : String(error)
  throw error
} finally {
  writeFileSync(resolve(out, 'quality-u10e-responsive-evidence.json'), `${JSON.stringify(evidence, null, 2)}\n`)
  await browser.close()
}
