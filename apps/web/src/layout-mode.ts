export type LayoutMode = 'split' | 'wide'

const SPLIT_MIN_WIDTH = 1200

export function normalizeLayout(value: string | null | undefined): LayoutMode {
  return value === 'split' ? 'split' : 'wide'
}

export function readRequestedLayout(params: URLSearchParams, storageKey: string): LayoutMode {
  const fromUrl = params.get('layout')
  if (fromUrl === 'split') return 'split'
  if (fromUrl === 'wide' || fromUrl === 'theater') return 'wide'

  try {
    const stored = window.localStorage.getItem(storageKey)
    if (stored === 'split') return 'split'
    if (stored === 'wide' || stored === 'theater') return 'wide'
  } catch {
    // localStorage can be unavailable; fall back to URL/default behavior.
  }
  return 'split'
}

export function isSplitAvailable(width = window.innerWidth): boolean {
  return width >= SPLIT_MIN_WIDTH
}

export function effectiveLayout(requested: LayoutMode, width = window.innerWidth): LayoutMode {
  return requested === 'split' && isSplitAvailable(width) ? 'split' : 'wide'
}

export function writeRequestedLayout(storageKey: string, requested: LayoutMode): void {
  try {
    window.localStorage.setItem(storageKey, requested)
  } catch {
    // localStorage can be unavailable; keep URL/state as source of truth.
  }
}
