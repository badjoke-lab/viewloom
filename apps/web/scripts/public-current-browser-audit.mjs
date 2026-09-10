import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { chromium } from 'playwright'

const webRoot = process.cwd()
const repoRoot = resolve(webRoot, '../..')
const outputRoot = '/tmp/public-current-browser-audit'
const localOrigin = stripOrigin(process.env.PUBLIC_CURRENT_LOCAL_ORIGIN || 'http://127.0.0.1:4173')
const candidateHead = process.env.GITHUB_HEAD_SHA || process.env.GITHUB_SHA || null

const viewports = [
  { id: 'desktop-1440', width: 1440, height: 1000, reducedMotion: 'no-preference' },
  { id: 'tablet-820', width: 820, height: 1180, reducedMotion: 'reduce' },
  { id: 'mobile-390', width: 390, height: 844, reducedMotion: 'no-preference' },
  { id: 'mobile-360', width: 360, height: 800, reducedMotion: 'reduce' },
]

await mkdir(outputRoot, { recursive: true })
const routes = await loadCurrentRoutes()
const browser = await chromium.launch({ headless: true })
const evidence = {
  schema: 'viewloom-public-current-browser-audit-v1',
  phase: 'Phase 12',
  workstream: 'R12A',
  candidateHead,
  origin: localOrigin,
  result: 'running',
  counts: {},
  scenarios: [],
  violations: [],
}

try {
  for (const route of routes) {
    for (const viewport of viewports) {
      const scenario = await auditRoute(browser, route, viewport)
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
    providerCrossingScenarios: evidence.scenarios.filter((item) => item.providerCrossing.length > 0).length,
    providerNeutralApiRequestScenarios: evidence.scenarios.filter((item) => item.provider === 'portal' && item.expectedApis.length === 0 && item.apiRequests.length > 0).length,
    overflowScenarios: evidence.scenarios.filter((item) => item.overflow > 2).length,
    focusFailures: evidence.scenarios.filter((item) => !item.focus.moved).length,
    unlabeledControlScenarios: evidence.scenarios.filter((item) => item.unlabeledControls.length > 0).length,
    legalMobileTargetFailures: evidence.scenarios.filter((item) => item.profile === 'static_legal' && item.viewport.width <= 390 && item.smallActionTargets.length > 0).length,
    twitchHomeStreamMapLinkScenarios: evidence.scenarios.filter((item) => item.route === '/twitch/' && item.providerHomeStreamMapLinks.some((link) => link.href === '/twitch/map/' && link.visible)).length,
    kickHomeStreamMapLinkScenarios: evidence.scenarios.filter((item) => item.route === '/kick/' && item.providerHomeStreamMapLinks.some((link) => link.href === '/kick/map/' && link.visible)).length,
    twitchFeatureTabStreamMapLinkScenarios: evidence.scenarios.filter((item) => item.provider === 'twitch' && item.profile !== 'provider_home' && !item.route.startsWith('/ja/') && item.featureTabStreamMapLinks.some((link) => link.href === '/twitch/map/' && link.visible)).length,
    kickFeatureTabStreamMapLinkScenarios: evidence.scenarios.filter((item) => item.provider === 'kick' && item.profile !== 'provider_home' && item.featureTabStreamMapLinks.some((link) => link.href === '/kick/map/' && link.visible)).length,
  }
  evidence.result = evidence.violations.length === 0 ? 'pass' : 'fail'
  await writeFile(`${outputRoot}/evidence.json`, `${JSON.stringify(evidence, null, 2)}\n`)
  console.log(JSON.stringify({ result: evidence.result, counts: evidence.counts }, null, 2))
  if (evidence.result !== 'pass') process.exitCode = 1
} finally {
  await browser.close()
}

async function loadCurrentRoutes() {
  const files = [
    'docs/audits/public-surface-routes-portal.json',
    'docs/audits/public-surface-routes-twitch.json',
    'docs/audits/public-surface-routes-kick.json',
  ]
  const routes = []
  for (const file of files) {
    const parsed = JSON.parse(await readFile(resolve(repoRoot, file), 'utf8'))
    routes.push(...parsed.routes.filter((route) => route.route !== '*'))
  }
  return routes
}

async function auditRoute(browser, route, viewport) {
  const requests = []
  const consoleErrors = []
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    reducedMotion: viewport.reducedMotion,
  })
  context.on('request', (request) => {
    const url = request.url()
    if (url.includes('/api/')) requests.push(url)
  })
  const page = await context.newPage()
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text())
  })

  const response = await page.goto(`${localOrigin}${route.route}`, { waitUntil: 'domcontentloaded', timeout: 45_000 })
  await page.waitForTimeout(900)
  const status = response?.status() ?? null
  const facts = await page.evaluate(() => {
    const body = document.body
    const interactive = Array.from(document.querySelectorAll('button, input:not([type="hidden"]), select, textarea, [role="button"], a.button'))
      .filter((node) => isVisible(node))
      .map((node) => {
        const rect = node.getBoundingClientRect()
        const labelledBy = node.getAttribute('aria-labelledby')
          ?.split(/\s+/)
          .map((id) => document.getElementById(id)?.textContent?.trim() ?? '')
          .filter(Boolean)
          .join(' ') ?? ''
        const associatedLabel = node instanceof HTMLInputElement || node instanceof HTMLSelectElement || node instanceof HTMLTextAreaElement
          ? Array.from(node.labels ?? []).map((label) => label.textContent?.trim() ?? '').filter(Boolean).join(' ')
          : ''
        const name = node.getAttribute('aria-label')
          || labelledBy
          || associatedLabel
          || node.getAttribute('title')
          || node.textContent?.trim()
          || (node instanceof HTMLInputElement ? node.name || node.placeholder : '')
          || ''
        return { tag: node.tagName.toLowerCase(), name, width: Math.round(rect.width), height: Math.round(rect.height) }
      })
    const providerHomeStreamMapLinks = Array.from(document.querySelectorAll('a[href]'))
      .map((node) => ({
        href: node.getAttribute('href') ?? '',
        text: node.textContent?.trim() ?? '',
        visible: isVisible(node),
      }))
      .filter((item) => item.href === '/twitch/map/' || item.href === '/kick/map/')
    const featureTabStreamMapLinks = Array.from(document.querySelectorAll('.feature-tabs a[href]'))
      .map((node) => ({
        href: node.getAttribute('href') ?? '',
        text: node.textContent?.trim() ?? '',
        visible: isVisible(node),
        active: node.classList.contains('active'),
        current: node.getAttribute('aria-current'),
      }))
      .filter((item) => item.href === '/twitch/map/' || item.href === '/kick/map/')
    return {
      title: document.title,
      canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? null,
      h1: Array.from(document.querySelectorAll('h1')).find((node) => isVisible(node))?.textContent?.trim() ?? null,
      overflow: Math.max(0, body.scrollWidth - body.clientWidth),
      unlabeledControls: interactive.filter((item) => !item.name).slice(0, 20),
      smallActionTargets: interactive.filter((item) => item.height > 0 && item.height < 44).slice(0, 20),
      providerHomeStreamMapLinks,
      featureTabStreamMapLinks,
    }

    function isVisible(node) {
      if (!(node instanceof HTMLElement || node instanceof SVGElement)) return false
      const style = getComputedStyle(node)
      const rect = node.getBoundingClientRect()
      return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity || '1') > 0 && rect.width > 0 && rect.height > 0
    }
  })

  await page.keyboard.press('Tab')
  const focus = await page.evaluate(() => {
    const active = document.activeElement
    if (!(active instanceof HTMLElement)) return { moved: false, tag: null, name: null, outline: null }
    const style = getComputedStyle(active)
    return {
      moved: active !== document.body && active !== document.documentElement,
      tag: active.tagName.toLowerCase(),
      name: active.getAttribute('aria-label') || active.textContent?.trim() || null,
      outline: `${style.outlineStyle} ${style.outlineWidth} ${style.boxShadow}`,
    }
  })

  const apiRequests = requests.map((request) => new URL(request).pathname + new URL(request).search)
  const providerCrossing = route.provider === 'twitch'
    ? requests.filter((request) => /\/api\/kick(?:-|\/)/.test(new URL(request).pathname))
    : route.provider === 'kick'
      ? requests.filter((request) => /\/api\/(?:twitch(?:-|\/)|history(?:\?|$)|day-flow(?:\?|$)|battle-lines(?:\?|$))/.test(new URL(request).pathname))
      : []
  const expectedApis = (route.apis ?? []).map((api) => api.path)

  const violations = []
  if (status !== 200) violations.push(`route returned ${status}`)
  if (!facts.title) violations.push('document title missing')
  if (!facts.h1) violations.push('visible h1 missing')
  if (route.canonical && facts.canonical !== route.canonical) violations.push(`canonical mismatch: ${facts.canonical}`)
  if (facts.overflow > 2) violations.push(`horizontal overflow ${facts.overflow}px`)
  if (!focus.moved) violations.push('keyboard focus did not leave body')
  if (facts.unlabeledControls.length) violations.push(`${facts.unlabeledControls.length} unlabeled controls`)
  if (providerCrossing.length) violations.push(`provider-crossing requests: ${providerCrossing.join(', ')}`)
  if (route.provider === 'portal' && expectedApis.length === 0 && apiRequests.length > 0) violations.push(`provider-neutral route issued API requests: ${apiRequests.join(', ')}`)
  if (route.profile === 'static_legal' && viewport.width <= 390 && facts.smallActionTargets.length > 0) violations.push(`legal mobile action targets below 44px: ${JSON.stringify(facts.smallActionTargets)}`)

  if (route.route === '/twitch/') {
    const streamMapLink = facts.providerHomeStreamMapLinks.find((link) => link.href === '/twitch/map/')
    if (!streamMapLink) violations.push('Twitch Home missing /twitch/map/ entry')
    else {
      if (!streamMapLink.visible) violations.push('Twitch Home /twitch/map/ entry is not visible')
      if (!/Stream Map/i.test(streamMapLink.text)) violations.push(`Twitch Home /twitch/map/ label mismatch: ${streamMapLink.text}`)
    }
  }
  if (route.route === '/kick/') {
    const streamMapLink = facts.providerHomeStreamMapLinks.find((link) => link.href === '/kick/map/')
    if (!streamMapLink) violations.push('Kick Home missing authorized /kick/map/ entry')
    else {
      if (!streamMapLink.visible) violations.push('Kick Home /kick/map/ entry is not visible')
      if (!/Stream Map/i.test(streamMapLink.text)) violations.push(`Kick Home /kick/map/ label mismatch: ${streamMapLink.text}`)
    }
  }

  if (route.provider === 'twitch' && route.profile !== 'provider_home' && !route.route.startsWith('/ja/')) {
    const streamMapLinks = facts.featureTabStreamMapLinks.filter((link) => link.href === '/twitch/map/')
    if (streamMapLinks.length !== 1) violations.push(`Twitch feature tabs expected one /twitch/map/ link, found ${streamMapLinks.length}`)
    else {
      const streamMapLink = streamMapLinks[0]
      if (!streamMapLink.visible) violations.push('Twitch feature-tab /twitch/map/ link is not visible')
      if (!/Stream Map/i.test(streamMapLink.text)) violations.push(`Twitch feature-tab /twitch/map/ label mismatch: ${streamMapLink.text}`)
      if (route.route === '/twitch/map/' && (!streamMapLink.active || streamMapLink.current !== 'page')) {
        violations.push('Twitch Stream Map feature tab is not active/current on /twitch/map/')
      }
    }
  }

  if (route.provider === 'kick' && route.profile !== 'provider_home') {
    const streamMapLinks = facts.featureTabStreamMapLinks.filter((link) => link.href === '/kick/map/')
    if (route.route === '/kick/map/') {
      if (streamMapLinks.length !== 1) violations.push(`Kick Stream Map page expected one /kick/map/ feature-tab link, found ${streamMapLinks.length}`)
      else {
        const streamMapLink = streamMapLinks[0]
        if (!streamMapLink.visible) violations.push('Kick Stream Map feature-tab link is not visible')
        if (!/Stream Map/i.test(streamMapLink.text)) violations.push(`Kick Stream Map feature-tab label mismatch: ${streamMapLink.text}`)
        if (streamMapLink.current !== 'page') violations.push('Kick Stream Map feature tab is not current on /kick/map/')
      }
    } else if (streamMapLinks.length > 0) {
      violations.push(`Kick non-Map feature tabs unexpectedly expose /kick/map/: ${streamMapLinks.length}`)
    }
  }

  const filename = `${safe(route.id)}--${viewport.id}.png`
  await page.screenshot({ path: `${outputRoot}/${filename}`, fullPage: true })
  await context.close()

  return {
    id: `${route.id}--${viewport.id}`,
    routeId: route.id,
    route: route.route,
    provider: route.provider,
    profile: route.profile,
    viewport,
    status,
    title: facts.title,
    canonical: facts.canonical,
    h1: facts.h1,
    overflow: facts.overflow,
    focus,
    unlabeledControls: facts.unlabeledControls,
    smallActionTargets: facts.smallActionTargets,
    providerHomeStreamMapLinks: facts.providerHomeStreamMapLinks,
    featureTabStreamMapLinks: facts.featureTabStreamMapLinks,
    expectedApis,
    apiRequests,
    providerCrossing,
    consoleErrors: consoleErrors.slice(0, 20),
    violations,
    screenshot: filename,
  }
}

function stripOrigin(value) {
  return value.replace(/\/$/, '')
}

function safe(value) {
  return value.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'route'
}