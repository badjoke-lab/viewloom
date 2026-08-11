from pathlib import Path

p = Path('apps/web/src/live/battle-lines-current-shell-entry.ts')
s = p.read_text()

def rep(old, new, label):
    global s
    if old not in s:
        raise SystemExit(f'missing {label}')
    s = s.replace(old, new)

rep("type PointState = 'observed' | 'offline' | 'not_observed' | 'missing'", "type PointState = 'observed' | 'offline' | 'not_observed' | 'missing' | 'outside_category' | 'category_unavailable'", 'point state union')
rep("type Coverage = { expectedBuckets: number; observedBuckets: number; missingBuckets: number; missingRatio: number }", "type Coverage = { expectedBuckets: number; observedBuckets: number; missingBuckets: number; missingRatio: number }\ntype CategoryOption = { id?: string; name?: string; streamCount?: number; viewerMinutes?: number; peakViewers?: number; observedBuckets?: number }\ntype CategoryFilter = { implementationState?: string; publicExposureAuthorized?: boolean; selectedCategory?: string; state?: 'all' | 'selected' | 'unknown_category' | 'category_unavailable'; coverageState?: 'observed' | 'partial' | 'unavailable'; availableCategories?: CategoryOption[]; coverageCounts?: { observed?: number; partial?: number; unavailable?: number } }", 'category types')
rep("type Payload = { platform: string; state: string; status: string; source: string; updatedAt: string; generatedAt: string; top: number; requestedBucket: string; bucket: '5m' | '10m'; metric: Metric; valueMode: Metric; metricNote: string; granularityNote: string; timeline: string[]; coverage: Coverage; window: WindowContract; lines: Line[]; primaryBattle: Battle | null; recommendedBattle: Battle | null; secondaryBattles: Battle[]; battles: Battle[]; events: BattleEvent[]; reversals: BattleEvent[]; feed: BattleEvent[]; error?: { message?: string } }", "type Payload = { platform: string; state: string; status: string; source: string; updatedAt: string; generatedAt: string; top: number; requestedBucket: string; bucket: '5m' | '10m'; metric: Metric; valueMode: Metric; metricNote: string; granularityNote: string; timeline: string[]; coverage: Coverage; window: WindowContract; lines: Line[]; primaryBattle: Battle | null; recommendedBattle: Battle | null; secondaryBattles: Battle[]; battles: Battle[]; events: BattleEvent[]; reversals: BattleEvent[]; feed: BattleEvent[]; categoryFilter?: CategoryFilter; availableCategories?: CategoryOption[]; error?: { message?: string } }", 'payload category fields')
rep("type State = { metric: Metric; top: 3 | 5 | 10; bucket: '5m' | '10m'; range: RangeMode; date: string; selectedBattleId: string | null;", "type State = { metric: Metric; top: 3 | 5 | 10; bucket: '5m' | '10m'; range: RangeMode; date: string; category: string; selectedBattleId: string | null;", 'state category')
rep("const params = new URLSearchParams(location.search)\nconst selection", "const params = new URLSearchParams(location.search)\nconst categoryPreviewEnabled = provider === 'kick' && params.get('categoryPreview') === '1'\nconst selection", 'preview constant')
rep("  date: validDate(params.get('date')) ?? todayUtc,\n  selectedBattleId:", "  date: validDate(params.get('date')) ?? todayUtc,\n  category: normalizeCategory(params.get('category')),\n  selectedBattleId:", 'state category init')
rep("initializeBattleLinesLayoutHost()\nwireControls()", "initializeBattleLinesLayoutHost()\nif (categoryPreviewEnabled) installCategoryPreviewControl()\nwireControls()", 'install control')
rep("    const query = new URLSearchParams({ metric: state.metric, top: String(state.top), bucket: state.bucket, range: state.range })\n    if (state.range === 'date') query.set('date', state.date)", "    const query = new URLSearchParams({ metric: state.metric, top: String(state.top), bucket: state.bucket, range: state.range })\n    if (state.range === 'date') query.set('date', state.date)\n    if (categoryPreviewEnabled) query.set('category', state.category)", 'hydrate category query')
rep("    payload = next\n    const battles", "    payload = next\n    if (categoryPreviewEnabled) syncCategoryPreview(next)\n    const battles", 'sync category payload')
rep("  const next = new URLSearchParams()\n  if (state.layoutInUrl)", "  const next = new URLSearchParams()\n  if (categoryPreviewEnabled) {\n    next.set('categoryPreview', '1')\n    next.set('category', state.category)\n  }\n  if (state.layoutInUrl)", 'sync url category')
marker = "function setPressed(selector: string, key: string, value: string): void {"
if marker not in s:
    raise SystemExit('missing category helper insertion marker')
helpers = r'''function installCategoryPreviewControl(): void {
  if (!categoryPreviewEnabled || document.querySelector('[data-battle-category-preview]')) return
  const controls = document.querySelector<HTMLElement>('.battle-controls')
  if (!controls) return
  installCategoryPreviewStyles()
  const root = document.createElement('div')
  root.className = 'battle-control battle-category-preview'
  root.dataset.battleCategoryPreview = 'hidden'
  root.innerHTML = `<label for="battle-category-preview-select">Category</label><div class="battle-control__row"><select id="battle-category-preview-select" data-battle-category-preview-select aria-label="Kick Battle Lines category"><option value="all">All categories</option></select></div><small data-battle-category-preview-status role="status" aria-live="polite">Loading category coverage…</small>`
  controls.insertBefore(root, controls.firstChild)
  root.querySelector<HTMLSelectElement>('[data-battle-category-preview-select]')?.addEventListener('change', (event) => {
    const select = event.currentTarget as HTMLSelectElement
    state.category = normalizeCategory(select.value)
    state.manualBattle = false
    state.selectedBattleId = null
    state.selectedLineId = null
    state.followLatest = true
    state.selectedIndex = -1
    syncUrl()
    void hydrate()
  })
}

function syncCategoryPreview(data: Payload): void {
  if (!categoryPreviewEnabled) return
  const root = document.querySelector<HTMLElement>('[data-battle-category-preview]')
  const filter = data.categoryFilter
  if (!root || !filter || filter.implementationState !== 'hidden_candidate' || filter.publicExposureAuthorized !== false) return
  state.category = normalizeCategory(filter.selectedCategory ?? state.category)
  const select = root.querySelector<HTMLSelectElement>('[data-battle-category-preview-select]')
  const categories = filter.availableCategories ?? data.availableCategories ?? []
  if (select) {
    select.innerHTML = ['<option value="all">All categories</option>', ...categories.map((category) => `<option value="${escapeAttr(String(category.id ?? ''))}">${escapeHtml(categoryLabel(category))}</option>`)].join('')
    if (state.category !== 'all' && !categories.some((category) => category.id === state.category)) {
      const option = document.createElement('option')
      option.value = state.category
      option.textContent = filter.state === 'unknown_category' ? `Unknown category · ${state.category}` : `Unavailable category · ${state.category}`
      select.appendChild(option)
    }
    select.value = state.category
  }
  const counts = filter.coverageCounts ?? {}
  const observed = counts.observed ?? 0
  const partial = counts.partial ?? 0
  const unavailable = counts.unavailable ?? 0
  const status = root.querySelector<HTMLElement>('[data-battle-category-preview-status]')
  if (status) {
    if (filter.state === 'unknown_category') status.textContent = `Unknown Kick category · ${observed} observed / ${partial} partial / ${unavailable} unavailable buckets`
    else if (filter.state === 'category_unavailable') status.textContent = `Category metadata unavailable · ${observed} observed / ${partial} partial / ${unavailable} unavailable buckets · no zero inferred`
    else status.textContent = `${filter.state === 'all' ? 'All categories' : 'Selected category'} · ${observed} observed / ${partial} partial / ${unavailable} unavailable buckets`
  }
}

function categoryLabel(category: CategoryOption): string {
  const name = String(category.name ?? category.id ?? 'Category')
  const viewerMinutes = Math.max(0, Number(category.viewerMinutes ?? 0))
  return `${name} · ${compactCategoryValue(viewerMinutes)} viewer-min`
}

function compactCategoryValue(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`
  return String(Math.round(value))
}

function normalizeCategory(value: string | null): string {
  const normalized = value?.trim() ?? ''
  return !normalized || normalized.toLowerCase() === 'all' ? 'all' : normalized.slice(0, 160)
}

function installCategoryPreviewStyles(): void {
  if (document.getElementById('battle-category-preview-style')) return
  const style = document.createElement('style')
  style.id = 'battle-category-preview-style'
  style.textContent = `.battle-category-preview{min-width:0}.battle-category-preview select{min-width:220px;max-width:min(360px,100%);min-height:34px;border:1px solid var(--line-strong);background:var(--surface);color:var(--text);padding:7px 30px 7px 10px}.battle-category-preview small{display:block;max-width:360px;margin-top:5px;color:var(--muted);font:600 10px/1.35 var(--mono)}@media(max-width:760px){.battle-category-preview{width:100%}.battle-category-preview .battle-control__row,.battle-category-preview select{width:100%;max-width:none}.battle-category-preview select{min-height:44px}.battle-category-preview small{max-width:none}}`
  document.head.appendChild(style)
}

'''
s = s.replace(marker, helpers + marker)
p.write_text(s)
print('patched Battle Lines controller with hidden Kick category preview')
