import type { ChannelProvider, ChannelState, ChannelView } from './model'

export function normalizeChannelId(value: unknown): string {
  return typeof value === 'string'
    ? value.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '')
    : ''
}

export function isChannelDay(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
}

export function parseChannelState(url: URL, provider: ChannelProvider): ChannelState {
  const viewValue = url.searchParams.get('view')
  const view: ChannelView = viewValue === 'days' || viewValue === 'report' ? viewValue : 'overview'
  const selectedDay = url.searchParams.get('day')

  return {
    provider,
    channelId: normalizeChannelId(url.searchParams.get('id')),
    requestedName: url.searchParams.get('name')?.trim() ?? '',
    period: url.searchParams.get('period') === '7d' ? '7d' : '30d',
    view,
    selectedDay: isChannelDay(selectedDay) ? selectedDay : undefined,
  }
}

export function channelStateUrl(currentUrl: URL, state: ChannelState): string {
  const url = new URL(currentUrl)

  if (state.channelId) url.searchParams.set('id', state.channelId)
  else url.searchParams.delete('id')

  if (state.requestedName) url.searchParams.set('name', state.requestedName)
  else url.searchParams.delete('name')

  // The default 30-day Overview remains the clean canonical Channel state.
  if (state.period === '7d') url.searchParams.set('period', '7d')
  else url.searchParams.delete('period')

  if (state.view === 'overview') url.searchParams.delete('view')
  else url.searchParams.set('view', state.view)

  if (state.selectedDay) url.searchParams.set('day', state.selectedDay)
  else url.searchParams.delete('day')

  const query = url.searchParams.toString()
  return `${url.pathname}${query ? `?${query}` : ''}${url.hash}`
}

export function sameChannelRequestScope(left: ChannelState, right: ChannelState): boolean {
  return left.provider === right.provider
    && left.channelId === right.channelId
    && left.period === right.period
}
