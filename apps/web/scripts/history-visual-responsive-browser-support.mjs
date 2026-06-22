import { historyPayload } from './history-battle-archive-fixture.mjs'

export const assert = (ok, message) => { if (!ok) throw new Error(message) }

export async function installRoutes(context, calls) {
  const reply = async (route, provider) => {
    calls[provider] += 1
    const payload = historyPayload(provider)
    payload.period = { ...payload.period, to: '2026-06-18', days: 13, label: 'Fixture H5 range' }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(payload) })
  }
  await context.route('**/api/history*', (route) => reply(route, 'twitch'))
  await context.route('**/api/kick-history*', (route) => reply(route, 'kick'))
}

export async function waitForVisual(page) {
  await page.waitForFunction(() => document.querySelector('.history-page')?.dataset.historyVisualReady === 'true')
  await page.waitForFunction(() => document.querySelector('.history-state-pill')?.textContent?.trim())
}

export async function assertShared(page, label, viewport, minimumFont) {
  const values = await page.locator('.history-page').evaluate((node) => ({
    ready: node.dataset.historyVisualReady,
    viewport: node.dataset.historyViewport,
    state: node.dataset.historyVisualState,
    scrollWidth: document.documentElement.scrollWidth,
    bodyWidth: document.body.scrollWidth,
    innerWidth,
  }))
  assert(values.ready === 'true' && values.viewport === viewport, `${label}: visual contract failed.`)
  assert(values.state && values.state !== 'unknown', `${label}: visual state missing.`)
  assert(values.scrollWidth <= values.innerWidth + 1 && values.bodyWidth <= values.innerWidth + 1, `${label}: horizontal overflow.`)

  const tab = page.locator('button[data-history-view].active')
  assert(await tab.count() === 1, `${label}: active task tab missing.`)
  const metrics = await tab.evaluate((node) => ({
    height: node.getBoundingClientRect().height,
    font: parseFloat(getComputedStyle(node).fontSize),
    tabIndex: node.tabIndex,
  }))
  assert(metrics.height >= 40 && metrics.font >= minimumFont, `${label}: task control is too small.`)
  assert(metrics.tabIndex === 0, `${label}: active task tab is not in the keyboard order.`)

  await tab.evaluate((node) => {
    const sentinel = document.createElement('button')
    sentinel.id = 'history-h5-focus-sentinel'
    sentinel.tabIndex = 0
    sentinel.setAttribute('aria-hidden', 'true')
    sentinel.style.cssText = 'position:fixed;width:1px;height:1px;opacity:0;pointer-events:none;'
    node.before(sentinel)
    sentinel.focus()
  })
  await page.keyboard.press('Tab')
  const focus = await tab.evaluate((node) => ({
    reached: document.activeElement === node,
    visible: node.matches(':focus-visible'),
    outline: parseFloat(getComputedStyle(node).outlineWidth),
  }))
  await page.locator('#history-h5-focus-sentinel').evaluate((node) => node.remove())
  assert(focus.reached, `${label}: active task tab was not reachable by keyboard.`)
  assert(focus.visible && focus.outline >= 2, `${label}: keyboard focus ring is not visible.`)

  const symbol = await page.locator('.history-state-pill').evaluate((node) => getComputedStyle(node, '::before').content)
  assert(symbol && !['none', 'normal', '""'].includes(symbol), `${label}: state symbol missing.`)
  const background = await page.locator('.surface:visible').first().evaluate((node) => getComputedStyle(node).backgroundColor)
  assert(!/^rgba?\(255,\s*255,\s*255/.test(background), `${label}: valid surface is white.`)
}

export function assertNoRefetch(calls, provider, before, label) {
  const other = provider === 'twitch' ? 'kick' : 'twitch'
  assert(calls[provider] === before, `${label}: History API was fetched again.`)
  assert(calls[other] === 0, `${label}: provider endpoint crossing.`)
}
