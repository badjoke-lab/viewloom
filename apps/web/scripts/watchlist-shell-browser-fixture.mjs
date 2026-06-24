import assert from 'node:assert/strict'

export const baseUrl = process.env.WATCHLIST_BASE_URL || 'http://127.0.0.1:4173'

export function check(condition, message) {
  assert.ok(condition, message)
}

export async function installNetworkGuards(context, calls) {
  await context.route('**/api/**', async (route) => {
    calls.api.push(route.request().url())
    await route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Watchlist W3A must not request feature data.' }),
    })
  })
  await context.route('https://www.googletagmanager.com/**', async (route) => {
    calls.analytics += 1
    await route.fulfill({ status: 200, contentType: 'application/javascript', body: '' })
  })
}

export async function waitReady(page) {
  await page.waitForFunction(() => document.body.dataset.watchlistState === 'ready')
}

export function watchlistDocument(provider, entries) {
  return {
    schema: 'viewloom-watchlist-v1',
    provider,
    revision: 1,
    updatedAt: '2026-06-24T00:00:00.000Z',
    entries: entries.map((entry, index) => ({
      channelId: entry.channelId,
      displayName: entry.displayName ?? entry.channelId,
      addedAt: `2026-06-24T00:${String(index).padStart(2, '0')}:00.000Z`,
    })),
  }
}

export async function setStoredDocument(page, provider, entries) {
  const key = `viewloom.watchlist.${provider}.v1`
  const document = watchlistDocument(provider, entries)
  await page.evaluate(({ key, document }) => {
    localStorage.setItem(key, JSON.stringify(document))
  }, { key, document })
}

export async function readStoredDocument(page, provider) {
  return page.evaluate((key) => {
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) : null
  }, `viewloom.watchlist.${provider}.v1`)
}
