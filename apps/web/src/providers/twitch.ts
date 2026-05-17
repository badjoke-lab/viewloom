import type { NormalizedStream, RawStreamRecord, StreamAdapter } from './types'
import { asNumber, asString, payloadItems, slugify, validStream } from './normalize'
import { twitchConfig } from './config'

export function normalizeTwitchStream(raw: RawStreamRecord): NormalizedStream | null {
  const login = asString(raw.channelLogin ?? raw.user_login ?? raw.login ?? raw.slug)
  const name = asString(raw.displayName ?? raw.user_name ?? raw.name ?? login)
  const title = asString(raw.title)
  const viewers = asNumber(raw.viewers ?? raw.viewer_count ?? raw.viewerCount)
  const id = slugify(login || name)
  const url = asString(raw.url) || twitchConfig.streamUrl(id)
  const startedAt = asString(raw.startedAt ?? raw.started_at) || undefined
  return validStream({ id, name: name || id, title, viewers, url, startedAt })
}

export function normalizeTwitchPayload(payload: unknown): NormalizedStream[] {
  return payloadItems(payload).map(normalizeTwitchStream).filter((item): item is NormalizedStream => item !== null)
}

export const twitchApiAdapter: StreamAdapter = {
  provider: 'twitch',
  normalizeStream: normalizeTwitchStream,
  normalizePayload: normalizeTwitchPayload,
}
