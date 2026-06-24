import {
  isWatchlistPeriod,
  type WatchlistPeriod,
  type WatchlistProvider,
} from './model'

export interface WatchlistUrlState {
  provider: WatchlistProvider
  period: WatchlistPeriod
}

const LOCAL_ONLY_QUERY_KEYS = [
  'id',
  'name',
  'filter',
  'saved',
  'order',
  'expanded',
]

export function parseWatchlistUrlState(
  url: URL,
  provider: WatchlistProvider,
): WatchlistUrlState {
  const periodValue = url.searchParams.get('period')
  return {
    provider,
    period: isWatchlistPeriod(periodValue) ? periodValue : '30d',
  }
}

export function watchlistStateUrl(
  currentUrl: URL,
  state: WatchlistUrlState,
): string {
  const url = new URL(currentUrl)

  for (const key of LOCAL_ONLY_QUERY_KEYS) {
    url.searchParams.delete(key)
  }

  if (state.period === '7d') url.searchParams.set('period', '7d')
  else url.searchParams.delete('period')

  const query = url.searchParams.toString()
  return `${url.pathname}${query ? `?${query}` : ''}${url.hash}`
}

export function sameWatchlistHistoryScope(
  left: WatchlistUrlState,
  right: WatchlistUrlState,
): boolean {
  return left.provider === right.provider && left.period === right.period
}
