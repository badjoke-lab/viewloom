import type { NormalizedStream, RawStreamRecord } from './types'

export function asRecord(value: unknown): RawStreamRecord | null {
  return typeof value === 'object' && value !== null ? value as RawStreamRecord : null
}

export function asString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

export function asNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0
}

export function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9_]+/g, '-').replace(/^-+|-+$/g, '')
}

export function payloadItems(payload: unknown): RawStreamRecord[] {
  const record = asRecord(payload)
  const rawItems = Array.isArray(record?.items) ? record.items : Array.isArray(record?.data) ? record.data : []
  return rawItems.map(asRecord).filter((item): item is RawStreamRecord => item !== null)
}

export function validStream(input: NormalizedStream): NormalizedStream | null {
  if (!input.id || !input.name || input.viewers <= 0) return null
  return input
}
