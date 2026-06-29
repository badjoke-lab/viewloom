import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { chromium } from 'playwright'

const base = process.env.QUALITY_U10B_BASE_URL ?? 'http://127.0.0.1:4173'
const out = resolve(process.env.QUALITY_U10B_ARTIFACT_DIR ?? 'artifacts/quality-u10b')
mkdirSync(out, { recursive: true })

const routes = [
  '/', '/about/', '/support/', '/changelog/',
  '/twitch/', '/twitch/heatmap/', '/twitch/day-flow/', '/twitch/battle-lines/',
  '/twitch/history/', '/twitch/channel/', '/twitch/watchlist/', '/twitch/status/',
  '/kick/', '/kick/heatmap/', '/kick/day-flow/', '/kick/battle-lines/',
  '/kick/history/', '/kick/channel/', '/kick/watchlist/', '/kick/status/',
]

const evidence = {
  schema: 'viewloom-quality-u10b-shell-browser-v1',
  phase: 'U10B',
  candidateHead: process.env.GITHUB_HEAD_SHA ?? process.env.GITHUB_SHA ?? null,
  routes: routes.length,
  viewports: [1440, 390],
  scenarios: [],
  result: 'running',
}

const browser = await chromium.launch({ headless: true })
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
  await context.route('**/googletagmanager.com/**', (route) => route.abort())
  await context.route('**/google-analytics.com/**', (route) => route.abort())
  await context.route('**/api/**', (route) => route.fulfill({
    status: 503,
    contentType: 'application/json',
    body: JSON.stringify({ status: 'unavailable', state: 'unavailable' }),
  }))
  await context.route('**/data/changelog.json', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify([]),
  }))

  for (const route of routes) {
    await auditDesktop(context, route)
    await auditMobile(context, route)
  }
  evidence.result = 'pass'
} catch (error) {
  evidence.result = 'fail'
  evidence.error = error instanceof Error ? error.stack ?? error.message : String(error)
  throw error
} finally {
  writeFileSync(resolve(out, 'quality-u10b-shell-browser-evidence.json'), `${JSON.stringify(evidence, null, 2)}\n`)
  await browser.close()
}

async function auditDesktop(context, route) {
  const page = await context.newPage()
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto(`${base}${route}`, { waitUntil: 'domcontentloaded' })
  await page.waitForFunction(() => document.body.dataset.sharedShellReady === 'true')
  const snapshot = await shellSnapshot(page)
  assertShell(route, snapshot)
  assert.equal(snapshot.menuVisible, false, `${route}: mobile menu is visible at desktop width`)
  assert.equal(snapshot.navVisible, true, `${route}: global navigation is hidden at desktop width`)
  evidence.scenarios.push({ id: `${routeKey(route)}-1440`, route, width: 1440, ...snapshot })
  if (['/', '/twitch/day-flow/', '/kick/battle-lines/', '/about/'].includes(route)) {
    await page.screenshot({ path: resolve(out, `${routeKey(route)}-1440.png`), fullPage: true })
  }
  await page.close()
}

async function auditMobile(context, route) {
  const page = await context.newPage()
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`${base}${route}`, { waitUntil: 'domcontentloaded' })
  await page.waitForFunction(() => document.body.dataset.sharedShellReady === 'true')

  const initial = await shellSnapshot(page)
  assertShell(route, initial)
  assert.equal(initial.menuVisible, true, `${route}: mobile menu is hidden at 390px`)
  assert.equal(initial.navVisible, false, `${route}: mobile navigation starts open`)
  assert.equal(initial.expanded, 'false', `${route}: mobile menu expanded state is not false`)
  assert.equal(initial.navInlineStyle, null, `${route}: mobile navigation still uses inline style mutation`)

  await page.locator('[data-mobile-menu]').click()
  const opened = await shellSnapshot(page)
  assert.equal(opened.navVisible, true, `${route}: mobile navigation did not open`)
  assert.equal(opened.expanded, 'true', `${route}: expanded state did not become true`)

  await page.keyboard.press('Escape')
  const escaped = await shellSnapshot(page)
  assert.equal(escaped.navVisible, false, `${route}: Escape did not close navigation`)
  assert.equal(escaped.expanded, 'false', `${route}: Escape did not reset expanded state`)
  assert.equal(escaped.menuFocused, true, `${route}: Escape did not restore focus to menu`)

  await page.locator('[data-mobile-menu]').click()
  await page.evaluate(() => {
    document.querySelector('.global-nav a')?.addEventListener('click', (event) => event.preventDefault(), { once: true })
  })
  await page.locator('.global-nav a').first().click()
  const linked = await shellSnapshot(page)
  assert.equal(linked.navVisible, false, `${route}: selecting a navigation link did not close menu`)

  evidence.scenarios.push({
    id: `${routeKey(route)}-390`,
    route,
    width: 390,
    initial,
    opened: { navVisible: opened.navVisible, expanded: opened.expanded },
    escaped: { navVisible: escaped.navVisible, expanded: escaped.expanded, menuFocused: escaped.menuFocused },
    linked: { navVisible: linked.navVisible, expanded: linked.expanded },
  })
  if (['/', '/twitch/', '/kick/day-flow/', '/support/'].includes(route)) {
    await page.screenshot({ path: resolve(out, `${routeKey(route)}-390.png`), fullPage: true })
  }
  await page.close()
}

async function shellSnapshot(page) {
  return page.evaluate(() => {
    const visible = (node) => {
      if (!node) return false
      const rect = node.getBoundingClientRect()
      const style = getComputedStyle(node)
      return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden'
    }
    const nav = document.querySelector('.global-nav')
    const menu = document.querySelector('[data-mobile-menu]')
    const status = document.querySelector('.status-inline')
    return {
      provider: document.body.dataset.provider ?? null,
      ready: document.body.dataset.sharedShellReady ?? null,
      brandContext: document.querySelector('.brand small')?.textContent?.trim() ?? '',
      navId: nav?.id ?? '',
      navLabel: nav?.getAttribute('aria-label') ?? '',
      navLinks: [...document.querySelectorAll('.global-nav a')].map((link) => ({
        label: link.textContent?.trim() ?? '',
        path: new URL(link.href).pathname,
        current: link.getAttribute('aria-current'),
      })),
      navVisible: visible(nav),
      navInlineStyle: nav?.getAttribute('style'),
      menuVisible: visible(menu),
      menuControls: menu?.getAttribute('aria-controls') ?? '',
      expanded: menu?.getAttribute('aria-expanded') ?? '',
      menuFocused: document.activeElement === menu,
      footerText: document.querySelector('.footer__disclaimer')?.textContent?.trim() ?? '',
      footerLabel: document.querySelector('.footer nav')?.getAttribute('aria-label') ?? '',
      footerLinks: [...document.querySelectorAll('.footer nav a')].map((link) => link.textContent?.trim() ?? ''),
      status: status ? {
        role: status.getAttribute('role'),
        live: status.getAttribute('aria-live'),
        atomic: status.getAttribute('aria-atomic'),
        state: status.getAttribute('data-state'),
        hiddenDot: status.querySelector('.dot')?.getAttribute('aria-hidden'),
      } : null,
    }
  })
}

function assertShell(route, snapshot) {
  assert.equal(snapshot.ready, 'true', `${route}: shared shell did not mark readiness`)
  assert.equal(snapshot.navId, 'viewloom-global-navigation', `${route}: shared navigation id diverged`)
  assert.equal(snapshot.navLabel, 'Global navigation', `${route}: shared navigation label diverged`)
  assert.equal(snapshot.menuControls, snapshot.navId, `${route}: menu does not control shared navigation`)
  assert.deepEqual(snapshot.navLinks.map((item) => item.label), ['Portal', 'Twitch data', 'Kick data', 'Changelog', 'About', 'Support'], `${route}: global navigation order diverged`)
  assert.deepEqual(snapshot.navLinks.map((item) => item.path), ['/', '/twitch/', '/kick/', '/changelog/', '/about/', '/support/'], `${route}: global navigation targets diverged`)
  assert.deepEqual(snapshot.navLinks.filter((item) => item.current === 'page').map((item) => item.label), [expectedCurrent(route)], `${route}: current navigation owner diverged`)
  assert.equal(snapshot.brandContext, expectedBrandContext(route), `${route}: provider identity context diverged`)
  assert.ok(snapshot.footerText.includes('independent and unofficial'), `${route}: footer independence disclaimer missing`)
  assert.ok(snapshot.footerText.includes('Twitch or Kick'), `${route}: footer platform disclaimer missing`)
  assert.equal(snapshot.footerLabel, 'Footer navigation', `${route}: footer navigation label missing`)
  for (const label of ['Changelog', 'Method & limits', 'Support', 'GitHub']) {
    assert.ok(snapshot.footerLinks.includes(label), `${route}: footer is missing ${label}`)
  }
  if (snapshot.status) {
    assert.equal(snapshot.status.role, 'status', `${route}: status role missing`)
    assert.equal(snapshot.status.live, 'polite', `${route}: status live mode missing`)
    assert.equal(snapshot.status.atomic, 'true', `${route}: status atomic mode missing`)
    assert.ok(['loading', 'fresh', 'partial', 'unavailable'].includes(snapshot.status.state), `${route}: status state missing`)
    assert.equal(snapshot.status.hiddenDot, 'true', `${route}: status dot is exposed to assistive technology`)
  }
}

function expectedCurrent(route) {
  if (route.startsWith('/twitch/')) return 'Twitch data'
  if (route.startsWith('/kick/')) return 'Kick data'
  if (route.startsWith('/changelog/')) return 'Changelog'
  if (route.startsWith('/about/')) return 'About'
  if (route.startsWith('/support/')) return 'Support'
  return 'Portal'
}

function expectedBrandContext(route) {
  if (route.startsWith('/twitch/')) return 'Twitch observation'
  if (route.startsWith('/kick/')) return 'Kick observation'
  return 'Platform-separated observatory'
}

function routeKey(route) {
  return route === '/' ? 'portal' : route.replace(/^\//, '').replace(/\/$/, '').replaceAll('/', '-')
}
