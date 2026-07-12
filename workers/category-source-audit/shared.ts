export type Raw = Record<string, unknown>

export type CategoryFieldStat = {
  path: string
  presentRows: number
  presenceRatio: number
  valueTypes: string[]
  objectKeys: string[]
  sampleValues: Array<string | number | boolean>
}

export function categoryFieldInventory(rows: unknown[]): {
  rowCount: number
  topLevelKeys: string[]
  candidateFields: CategoryFieldStat[]
} {
  const topLevelKeys = new Set<string>()
  const aggregate = new Map<string, {
    presentRows: number
    types: Set<string>
    objectKeys: Set<string>
    sampleValues: Set<string | number | boolean>
  }>()

  for (const value of rows) {
    if (!isRecord(value)) continue
    for (const key of Object.keys(value)) topLevelKeys.add(key)

    const perRow = new Map<string, unknown[]>()
    walk(value, '', 0, false, perRow)
    for (const [path, values] of perRow) {
      const current = aggregate.get(path) ?? {
        presentRows: 0,
        types: new Set<string>(),
        objectKeys: new Set<string>(),
        sampleValues: new Set<string | number | boolean>(),
      }
      current.presentRows += 1
      for (const item of values) {
        current.types.add(valueType(item))
        if (isRecord(item)) {
          for (const key of Object.keys(item)) current.objectKeys.add(key)
        }
        const sample = safeScalar(item)
        if (sample !== null && current.sampleValues.size < 8) current.sampleValues.add(sample)
      }
      aggregate.set(path, current)
    }
  }

  const rowCount = rows.filter(isRecord).length
  const candidateFields = [...aggregate.entries()]
    .map(([path, stat]) => ({
      path,
      presentRows: stat.presentRows,
      presenceRatio: rowCount > 0 ? round(stat.presentRows / rowCount, 4) : 0,
      valueTypes: [...stat.types].sort(),
      objectKeys: [...stat.objectKeys].sort(),
      sampleValues: [...stat.sampleValues],
    }))
    .sort((a, b) => a.path.localeCompare(b.path))

  return {
    rowCount,
    topLevelKeys: [...topLevelKeys].sort(),
    candidateFields,
  }
}

export function isRecord(value: unknown): value is Raw {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

export function numberValue(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/,/g, ''))
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

function walk(
  value: unknown,
  path: string,
  depth: number,
  categoryContext: boolean,
  perRow: Map<string, unknown[]>,
): void {
  if (depth > 4) return

  if (Array.isArray(value)) {
    for (const item of value.slice(0, 20)) walk(item, path, depth + 1, categoryContext, perRow)
    return
  }

  if (!isRecord(value)) return

  for (const [key, child] of Object.entries(value)) {
    const nextPath = path ? `${path}.${key}` : key
    const nextContext = categoryContext || /category|game/i.test(key)
    if (nextContext) {
      const values = perRow.get(nextPath) ?? []
      values.push(child)
      perRow.set(nextPath, values)
    }
    if (Array.isArray(child) || isRecord(child)) walk(child, nextPath, depth + 1, nextContext, perRow)
  }
}

function valueType(value: unknown): string {
  if (value === null) return 'null'
  if (Array.isArray(value)) return 'array'
  return typeof value
}

function safeScalar(value: unknown): string | number | boolean | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') {
    const clean = value.trim().replace(/\s+/g, ' ').slice(0, 120)
    return clean || null
  }
  return null
}

function round(value: number, digits: number): number {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}
