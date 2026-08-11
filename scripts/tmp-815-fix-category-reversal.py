from pathlib import Path
p = Path('apps/web/functions/_lib/battle-lines-core.ts')
s = p.read_text()
old = """    if (categoryIneligible) {
      currentRun = 0
      continue
    }"""
new = """    if (categoryIneligible) {
      currentRun = 0
      previousRawLeader = null
      continue
    }"""
if old not in s:
    raise SystemExit('category-ineligible score block missing')
s = s.replace(old, new, 1)
old2 = """    const av = a.points[index].value
    const bv = b.points[index].value
    if (av === null || bv === null || av === bv) continue"""
new2 = """    const av = a.points[index].value
    const bv = b.points[index].value
    const categoryBoundary = a.points[index].state === 'outside_category'
      || a.points[index].state === 'category_unavailable'
      || b.points[index].state === 'outside_category'
      || b.points[index].state === 'category_unavailable'
    if (categoryBoundary) {
      previousLeaderId = null
      previousGap = null
      continue
    }
    if (av === null || bv === null || av === bv) continue"""
if old2 not in s:
    raise SystemExit('reversal event loop block missing')
s = s.replace(old2, new2, 1)
p.write_text(s)
print('fixed category-boundary reversal continuity')
