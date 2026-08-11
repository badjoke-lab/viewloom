from pathlib import Path

p = Path('apps/web/functions/_lib/battle-lines-core.ts')
s = p.read_text()

def rep(old, new, label):
    global s
    if old not in s:
        raise SystemExit(f'missing {label}')
    s = s.replace(old, new)

rep("export type BattlePointState = 'observed' | 'offline' | 'not_observed' | 'missing'", "export type BattlePointState = 'observed' | 'offline' | 'not_observed' | 'missing' | 'outside_category' | 'category_unavailable'", 'point state union')
rep("  viewers: number\n}", "  viewers: number\n  pointState?: 'outside_category' | 'category_unavailable'\n}", 'source item pointState')
rep("  sampleIntervalMinutes?: number\n}", "  sampleIntervalMinutes?: number\n  categoryScoped?: boolean\n}", 'build option categoryScoped')
rep("  present: Set<number>\n  first: number | null", "  present: Set<number>\n  explicitStates: Map<number, BattlePointState>\n  first: number | null", 'accumulator explicit states')
rep("        viewers: safeViewerCount(rawItem.viewers),\n      }", "        viewers: safeViewerCount(rawItem.viewers),\n        pointState: rawItem.pointState,\n      }", 'item pointState copy')
rep("        present: new Set<number>(),\n        first: null,", "        present: new Set<number>(),\n        explicitStates: new Map<number, BattlePointState>(),\n        first: null,", 'explicit state init')
old = """      entry.item = { ...entry.item, ...item }
      entry.values[index] = Math.max(entry.values[index] ?? 0, item.viewers)
      entry.present.add(index)
      entry.first = entry.first === null ? index : Math.min(entry.first, index)
      entry.last = entry.last === null ? index : Math.max(entry.last, index)
      streams.set(id, entry)"""
new = """      entry.item = { ...entry.item, ...item }
      entry.first = entry.first === null ? index : Math.min(entry.first, index)
      entry.last = entry.last === null ? index : Math.max(entry.last, index)
      if (item.pointState) {
        if (!entry.present.has(index)) {
          const current = entry.explicitStates.get(index)
          if (!current || item.pointState === 'category_unavailable') entry.explicitStates.set(index, item.pointState)
        }
      } else {
        entry.values[index] = Math.max(entry.values[index] ?? 0, item.viewers)
        entry.present.add(index)
        entry.explicitStates.delete(index)
      }
      streams.set(id, entry)"""
rep(old, new, 'accumulator update')
rep("    .map((entry) => makeLine(entry, timeline, observedBuckets, bucketMinutes, options.metric))", "    .map((entry) => makeLine(entry, timeline, observedBuckets, bucketMinutes, options.metric))", 'makeLine unchanged marker')
rep("  const battles = scoreBattles(lines, options.metric)", "  const battles = scoreBattles(lines, options.metric, Boolean(options.categoryScoped))", 'score category flag')
rep("      'Missing, not_observed, and offline points stay explicit and are never returned as observed values.',", "      options.categoryScoped\n        ? 'Missing, not_observed, offline, outside_category, and category_unavailable points stay explicit and are never returned as observed values.'\n        : 'Missing, not_observed, and offline points stay explicit and are never returned as observed values.',", 'category note')
rep("      linePointStates: ['observed', 'missing', 'not_observed', 'offline'] as BattlePointState[],", "      linePointStates: (options.categoryScoped\n        ? ['observed', 'missing', 'not_observed', 'offline', 'outside_category', 'category_unavailable']\n        : ['observed', 'missing', 'not_observed', 'offline']) as BattlePointState[],", 'contract states')
rep("    const state = pointState(raw, index, entry.present, observedBuckets, entry.first, entry.last)", "    const state = pointState(raw, index, entry.present, entry.explicitStates, observedBuckets, entry.first, entry.last)", 'pointState call')
rep("  present: Set<number>,\n  observedBuckets: Set<number>,", "  present: Set<number>,\n  explicitStates: Map<number, BattlePointState>,\n  observedBuckets: Set<number>,", 'pointState args')
rep("  if (!observedBuckets.has(index)) return 'not_observed'\n  if (present.has(index))", "  if (!observedBuckets.has(index)) return 'not_observed'\n  const explicit = explicitStates.get(index)\n  if (explicit === 'outside_category' || explicit === 'category_unavailable') return explicit\n  if (present.has(index))", 'pointState explicit precedence')
rep("function scoreBattles(lines: BattleLine[], metric: BattleMetric): BattleModel[] {", "function scoreBattles(lines: BattleLine[], metric: BattleMetric, categoryScoped = false): BattleModel[] {", 'scoreBattles signature')
rep("      const battle = scoreBattle(lines[aIndex], lines[bIndex], metric, maxViewerMinutes)", "      const battle = scoreBattle(lines[aIndex], lines[bIndex], metric, maxViewerMinutes, categoryScoped)", 'scoreBattle call')
rep("function scoreBattle(a: BattleLine, b: BattleLine, metric: BattleMetric, maxViewerMinutes: number): BattleModel {", "function scoreBattle(a: BattleLine, b: BattleLine, metric: BattleMetric, maxViewerMinutes: number, categoryScoped = false): BattleModel {", 'scoreBattle signature')
rep("  let missingCount = 0\n  let previousRawLeader", "  let missingCount = 0\n  let eligibleCount = 0\n  let previousRawLeader", 'eligible count')
old_loop = """  for (let index = 0; index < Math.min(a.points.length, b.points.length); index += 1) {
    const av = a.points[index].viewers
    const bv = b.points[index].viewers
    if (av === null || bv === null) {
      missingCount += 1
      currentRun = 0
      continue
    }"""
new_loop = """  for (let index = 0; index < Math.min(a.points.length, b.points.length); index += 1) {
    const aState = a.points[index].state
    const bState = b.points[index].state
    const categoryIneligible = categoryScoped && (
      aState === 'outside_category'
      || aState === 'category_unavailable'
      || bState === 'outside_category'
      || bState === 'category_unavailable'
    )
    if (categoryIneligible) {
      currentRun = 0
      continue
    }
    eligibleCount += 1
    const av = a.points[index].viewers
    const bv = b.points[index].viewers
    if (av === null || bv === null) {
      missingCount += 1
      currentRun = 0
      continue
    }"""
rep(old_loop, new_loop, 'score loop category eligibility')
rep("  const totalPoints = Math.max(a.points.length, b.points.length, 1)", "  const totalPoints = categoryScoped\n    ? Math.max(eligibleCount, 1)\n    : Math.max(a.points.length, b.points.length, 1)", 'score denominator')
p.write_text(s)
print('patched Battle Lines core for category-scoped point states')
