import assert from 'node:assert/strict'
import {
  kickHistoryPayload,
  twitchHistoryPayload,
  twitchLatestPayload,
} from './watchlist-history-fixtures.mjs'

export const baseUrl = process.env.WATCHLIST_BASE_URL || 'http://127.0.0.1:4173'

export function check(condition, message) {
  assert.ok(condition, message)
}

export async function installNetworkGuards(context, calls) {
  calls.api ??= []
  calls.analytics ??= 0
  calls.failLatest ??= false
  calls.failHistory ??= false

  await context.route('**/api/**', async (route) => {
    const url = new URL(route.request().url())
    calls.api.push(`${url.pathname}${url.search}`)

    if (url.pathname === '/api/twitch-heatmap' || url.pathname === '/api/kick-heatmap') {
      if (calls.failLatest) {
        await route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'latest unavailable' }) })
        return
      }
      const payload = url.pathname.includes('kick') ? kickLatestPayload() : twitchLatestPayload()
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(payload) })
      return
    }

    if (url.pathname === '/api/history' || url.pathname === '/api/kick-history') {
      if (calls.failHistory) {
        await route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'history unavailable' }) })
        return
      }
      const period = url.searchParams.get('period') === '7d' ? '7d' : '30d'
      const payload = url.pathname.includes('kick')
        ? kickHistoryPayload(period)
        : twitchHistoryPayload(period)
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(payload) })
      return
    }

    await route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ error: 'Unexpected API request' }) })
  })

  await context.route('https://www.googletagmanager.com/**', async (route) => {
    calls.analytics += 1
    await route.fulfill({ status: 200, contentType: 'application/javascript', body: '' })
  })
}

export async function waitReady(page) {
  await page.waitForFunction(() => document.body.dataset.watchlistState === 'ready'
    && document.body.dataset.watchlistFocusReady === 'true')
}

export async function waitDataIdle(page) {
  await page.waitForFunction(() => document.body.dataset.watchlistLatestState !== 'loading'
    && document.body.dataset.watchlistHistoryState !== 'loading')
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

export function countCalls(calls, pathname) {
  return calls.api.filter((value) => value.startsWith(pathname)).length
}

export function clearApiCalls(calls) {
  calls.api.length = 0
}

function kickLatestPayload() {
  const payload = twitchLatestPayload()
  return {
    ...payload,
    provider: 'kick',
    platform: 'kick',
    targetSource: 'kick-public-livestreams',
    coverageMode: 'official-top-with-candidate-fallback',
    coverageNote: 'Two observed Kick streams.',
    items: [
      {
        id: 'gamma',
        name: 'Gamma',
        viewers: 900,
        title: 'Gamma title',
        momentum: -0.1,
        url: 'https://kick.com/gamma',
      },
      {
        id: 'kick_one',
        name: 'Kick One',
        viewers: 300,
        url: 'https://kick.com/kick_one',
      },
    ],
  }
}
