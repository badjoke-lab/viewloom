const UNSAFE_FILENAME_CHARACTERS = /[\\/:*?"<>|\u0000-\u001f\u007f]/g
const NON_SEGMENT_CHARACTERS = /[^\p{L}\p{N}._-]+/gu

export function sanitizeFilenameSegment(value: unknown, fallback = 'unknown'): string {
  const cleaned = cleanSegment(value)
  if (cleaned) return cleaned
  return cleanSegment(fallback) || 'unknown'
}

export function buildOutputFilename(
  parts: readonly unknown[],
  extension: string,
): string {
  if (!parts.length) throw new Error('At least one filename segment is required.')
  const safeExtension = extension.trim().toLowerCase().replace(/^\.+/, '').replace(/[^a-z0-9]+/g, '')
  if (!safeExtension) throw new Error('A safe filename extension is required.')
  return `${parts.map((part) => sanitizeFilenameSegment(part)).join('-')}.${safeExtension}`
}

function cleanSegment(value: unknown): string {
  if (typeof value !== 'string' && typeof value !== 'number') return ''
  return String(value)
    .normalize('NFKC')
    .trim()
    .toLowerCase()
    .replace(UNSAFE_FILENAME_CHARACTERS, '-')
    .replace(/\s+/g, '-')
    .replace(NON_SEGMENT_CHARACTERS, '-')
    .replace(/-+/g, '-')
    .replace(/^[._-]+|[._-]+$/g, '')
}
