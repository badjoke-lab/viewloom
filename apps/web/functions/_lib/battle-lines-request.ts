import type { BattleSourceRow } from './battle-lines-core'

export const BATTLE_QUERY_TIMEOUT_MS = 8_000
export const BATTLE_MAX_SNAPSHOT_ROWS = 360

export async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(message)), timeoutMs)
  })

  try {
    return await Promise.race([promise, timeout])
  } finally {
    if (timeoutId !== undefined) clearTimeout(timeoutId)
  }
}

export function compactBattleRows(rows: BattleSourceRow[], top: number): {
  rows: BattleSourceRow[]
  candidateCount: number
  retainedItemCount: number
} {
  const viewerTotals = new Map<string, number>()
  for (const row of rows) {
    for (const item of row.items) {
      viewerTotals.set(item.id, (viewerTotals.get(item.id) ?? 0) + Math.max(0, item.viewers))
    }
  }

  const selectedIds = new Set(
    [...viewerTotals.entries()]
      .sort((left, right) => right[1] - left[1])
      .slice(0, Math.max(2, top))
      .map(([id]) => id),
  )

  let retainedItemCount = 0
  const compacted = rows.map((row) => {
    const items = row.items.filter((item) => selectedIds.has(item.id))
    retainedItemCount += items.length
    return { ...row, items }
  })

  return {
    rows: compacted,
    candidateCount: viewerTotals.size,
    retainedItemCount,
  }
}
