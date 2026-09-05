import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { chromium } from 'playwright'

const origin = (process.env.PUBLIC_CURRENT_LOCAL_ORIGIN || 'http://127.0.0.1:4173').replace(/\/$/, '')
const outputRoot = '/tmp/public-current-browser-audit'
const outputPath = `${outputRoot}/twitch-stream-map-geography-accessibility.json`
const viewports = [
  { id: 'desktop-1440', width: 1440, height: 1000 },
  { id: 'mobile-390', width: 390, height: 844 },
]
const startModes = ['country', 'city']

await mkdir(outputRoot, { recursive: true })
const browser = await chromium.launch({ headless: true })
const evidence = {
  schema: 'viewloom-twitch-stream-map-geography-accessibility-v1',
  origin,
  result: 'running',
  scenarios: [],
  violations: [],
}

try {
  for (const viewport of viewports) {
    for (const startMode of startModes) {
      const scenario = await auditScenario(browser, viewport, startMode)
      evidence.scenarios.push(scenario)
      for (const violation of scenario.violations) {
        evidence.violations.push({ scenario: scenario.id, violation })
      }
    }
  }
  evidence.result = evidence.violations.length === 0 ? 'pass' : 'fail'
} finally {
  await browser.close()
  await writeFile(outputPath, `${JSON.stringify(evidence, null, 2)}\n`)
}

assert.equal(evidence.scenarios.length, 4, 'expected 2 viewports x 2 geography modes')
assert.equal(evidence.violations.length, 0, JSON.stringify(evidence.violations))
assert.equal(evidence.result, 'pass')
console.log(JSON.stringify({ result: evidence.result, scenarios: evidence.scenarios.length, violations: evidence.violations.length }, null, 2))

async function auditScenario(browser, viewport, startMode) {
  const id = `${startMode}--${viewport.id}`
  const context = await browser.newContext({ viewport })
  const page = await context.newPage()
  const violations = []

  await page.route('**/api/twitch-stream-map**', async (route) => {
    await route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: JSON.stringify({ state: 'not_ready', fixture: true }),
    })
  })

  try {
    const initialUrl = startMode === 'city'
      ? `${origin}/twitch/map/?geography=city&accessibility-audit=${encodeURIComponent(id)}`
      : `${origin}/twitch/map/?accessibility-audit=${encodeURIComponent(id)}`
    await page.goto(initialUrl, { waitUntil: 'domcontentloaded', timeout: 45_000 })
    await page.locator('[data-stream-map-geography-panel]').waitFor({ timeout: 15_000 })

    const initial = await readGeographyState(page)
    expect(initial.country.height >= 44, `${id}: Country target height ${initial.country.height}px`, violations)
    expect(initial.city.height >= 44, `${id}: City target height ${initial.city.height}px`, violations)
    expect(initial.current.height >= 44, `${id}: Current / IRL target height ${initial.current.height}px`, violations)
    expect(initial.current.disabled, `${id}: Current / IRL must remain disabled`, violations)
    expect(initial.current.ariaDisabled === 'true', `${id}: Current / IRL must remain aria-disabled`, violations)
    expect(initial.country.ariaPressed === String(startMode === 'country'), `${id}: Country aria-pressed mismatch`, violations)
    expect(initial.city.ariaPressed === String(startMode === 'city'), `${id}: City aria-pressed mismatch`, violations)
    if (viewport.width === 390) expect(initial.overflow <= 2, `${id}: horizontal overflow ${initial.overflow}px`, violations)
    if (startMode === 'city') {
      expect(initial.currentLocationInputDisabled, `${id}: City current_location filter must remain disabled`, violations)
    }

    const switchLabel = startMode === 'country' ? 'City' : 'Country'
    const focus = await keyboardFocusButton(page, switchLabel)
    expect(focus.reached, `${id}: keyboard focus did not reach ${switchLabel}`, violations)
    expect(focus.focusVisible, `${id}: ${switchLabel} is not :focus-visible under keyboard focus`, violations)
    expect(focus.visualIndicator, `${id}: ${switchLabel} has no visible focus indicator`, violations)

    if (focus.reached) {
      await Promise.all([
        page.waitForURL((next) => startMode === 'country'
          ? next.searchParams.get('geography') === 'city'
          : !next.searchParams.has('geography'), { timeout: 15_000 }),
        page.keyboard.press('Enter'),
      ])
      await page.locator('[data-stream-map-geography-panel]').waitFor({ timeout: 15_000 })
    }

    const switched = await readGeographyState(page)
    const expectedMode = startMode === 'country' ? 'city' : 'country'
    expect(switched.country.ariaPressed === String(expectedMode === 'country'), `${id}: switched Country aria-pressed mismatch`, violations)
    expect(switched.city.ariaPressed === String(expectedMode === 'city'), `${id}: switched City aria-pressed mismatch`, violations)
    expect(switched.current.disabled, `${id}: switched Current / IRL must remain disabled`, violations)
    if (viewport.width === 390) expect(switched.overflow <= 2, `${id}: switched horizontal overflow ${switched.overflow}px`, violations)

    await page.screenshot({ path: `${outputRoot}/twitch-stream-map-geography-${id}.png`, fullPage: true })

    return { id, viewport, startMode, initial, focus, switched, violations }
  } catch (error) {
    violations.push(error instanceof Error ? error.message : String(error))
    await page.screenshot({ path: `${outputRoot}/twitch-stream-map-geography-${id}-failure.png`, fullPage: true }).catch(() => {})
    return { id, viewport, startMode, violations }
  } finally {
    await context.close()
  }
}

async function readGeographyState(page) {
  return page.evaluate(() => {
    const byMode = (mode) => document.querySelector(`[data-geography-mode="${mode}"]`)
    const current = [...document.querySelectorAll('.stream-map-geography-options button')]
      .find((button) => (button.textContent || '').trim() === 'Current / IRL')
    const measure = (button) => {
      const rect = button?.getBoundingClientRect()
      return {
        height: rect ? Math.round(rect.height) : 0,
        width: rect ? Math.round(rect.width) : 0,
        ariaPressed: button?.getAttribute('aria-pressed') ?? null,
        ariaDisabled: button?.getAttribute('aria-disabled') ?? null,
        disabled: Boolean(button?.disabled),
      }
    }
    const body = document.body
    return {
      country: measure(byMode('country')),
      city: measure(byMode('city')),
      current: measure(current),
      currentLocationInputDisabled: Boolean(document.querySelector('[data-location-type][value="current_location"]')?.disabled),
      overflow: Math.max(0, body.scrollWidth - body.clientWidth),
      href: location.href,
    }
  })
}

async function keyboardFocusButton(page, label) {
  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
    document.body.focus()
  })

  for (let attempt = 0; attempt < 80; attempt += 1) {
    await page.keyboard.press('Tab')
    const state = await page.evaluate((targetLabel) => {
      const active = document.activeElement
      const name = active instanceof HTMLElement ? (active.textContent || active.getAttribute('aria-label') || '').trim() : ''
      if (name !== targetLabel) return { reached: false, name }
      const style = getComputedStyle(active)
      const outlineWidth = Number.parseFloat(style.outlineWidth || '0') || 0
      const visualIndicator = (style.outlineStyle !== 'none' && outlineWidth >= 2)
        || (style.boxShadow !== 'none' && style.boxShadow !== '')
      return {
        reached: true,
        name,
        focusVisible: active.matches(':focus-visible'),
        outlineStyle: style.outlineStyle,
        outlineWidth,
        outlineOffset: style.outlineOffset,
        boxShadow: style.boxShadow,
        visualIndicator,
      }
    }, label)
    if (state.reached) return state
  }
  return { reached: false, focusVisible: false, visualIndicator: false }
}

function expect(condition, message, violations) {
  if (!condition) violations.push(message)
}
