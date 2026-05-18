import type { NormalizedStream, RawStreamRecord, StreamAdapter } from './types'
import { asNumber, asRecord, asString, payloadItems, slugify, validStream } from './normalize'
import { kickConfig } from './config'

function channelSlug(raw: RawStreamRecord): string {
  const direct = asString(raw.channelLogin ?? raw.slug ?? raw.username ?? raw.user_slug)
  if (direct) return direct
  const channel = asRecord(raw.channel)
  return asString(channel?.slug ?? channel?.username ?? channel?.name)
}

function displayName(raw: RawStreamRecord, slug: string): string {
  const direct = asString(raw.displayName ?? raw.name ?? raw.username)
  if (direct) return direct
  const channel = asRecord(raw.channel)
  return asString(channel?.displayName ?? channel?.name ?? channel?.username ?? channel?.slug) || slug
}

export function normalizeKickStream(raw: RawStreamRecord): NormalizedStream | null {
  const slug = channelSlug(raw)
  const name = displayName(raw, slug)
  const title = asString(raw.title ?? raw.session_title ?? raw.stream_title)
  const viewers = asNumber(raw.viewers ?? raw.viewer_count ?? raw.viewerCount ?? asRecord(raw.livestream)?.viewer_count)
  const id = slugify(slug || name)
  const url = asString(raw.url) || kickConfig.streamUrl(id)
  const startedAt = asString(raw.startedAt ?? raw.started_at ?? raw.start_time) || undefined
  return validStream({ id, name: name || id, title, viewers, url, startedAt })
}

export function normalizeKickPayload(payload: unknown): NormalizedStream[] {
  return payloadItems(payload).map(normalizeKickStream).filter((item): item is NormalizedStream => item !== null)
}

export const kickApiAdapter: StreamAdapter = {
  provider: 'kick',
  normalizeStream: normalizeKickStream,
  normalizePayload: normalizeKickPayload,
}
