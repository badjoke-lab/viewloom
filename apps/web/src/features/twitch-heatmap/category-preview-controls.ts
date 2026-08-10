import type {
  HeatmapCategoryFilter,
  HeatmapCategoryOption,
} from './model'

const PREVIEW_PARAM = 'categoryPreview'
const CATEGORY_PARAM = 'category'
const TOP_PARAM = 'top'
const TOP_VALUES = [20, 50, 100] as const
const DEFAULT_TOP = 50
const ROOT_ID = 'heatmap-category-preview-controls'
const STYLE_ID = 'heatmap-category-preview-style'

type HeatmapProviderKey = 'twitch' | 'kick'

export type CategoryPreviewState = {
  enabled: boolean
  category: string
  top: number
}

export function readCategoryPreviewState(provider: HeatmapProviderKey): CategoryPreviewState {
  const url = new URL(window.location.href)
  const enabled = provider === 'twitch' || provider === 'kick'
  const rawCategory = url.searchParams.get(CATEGORY_PARAM)?.trim() || 'all'
  const rawTop = Number(url.searchParams.get(TOP_PARAM))
  return {
    enabled,
    category: rawCategory.toLowerCase() === 'all' ? 'all' : rawCategory.slice(0, 160),
    top: TOP_VALUES.includes(rawTop as (typeof TOP_VALUES)[number]) ? rawTop : DEFAULT_TOP,
  }
}

export function buildCategoryPreviewEndpoint(
  endpoint: string,
  provider: HeatmapProviderKey,
  state = readCategoryPreviewState(provider),
): string {
  if (!state.enabled) return endpoint
  const url = new URL(endpoint, window.location.origin)
  url.searchParams.set(CATEGORY_PARAM, state.category)
  url.searchParams.set(TOP_PARAM, String(state.top))
  return `${url.pathname}${url.search}`
}

export function installCategoryPreviewControls(options: {
  provider: HeatmapProviderKey
  state: CategoryPreviewState
  onChange: () => void
}): void {
  const existing = document.getElementById(ROOT_ID)
  if (!options.state.enabled) {
    existing?.remove()
    return
  }

  ensureStyles()
  const dock = document.querySelector<HTMLElement>('.heatmap-control-dock')
  if (!dock) return
  const providerLabel = options.provider === 'kick' ? 'Kick' : 'Twitch'

  let root = existing
  if (!root) {
    root = document.createElement('div')
    root.id = ROOT_ID
    root.className = 'heatmap-control-dock__group heatmap-category-preview'
    root.dataset.categoryFilter = 'public'
    root.innerHTML = `
      <span class="heatmap-control-dock__label">Category</span>
      <div class="heatmap-category-preview__fields">
        <label>
          <span>Category</span>
          <select data-category-preview-select aria-label="${providerLabel} category"></select>
        </label>
        <label>
          <span>Top</span>
          <select data-category-preview-top aria-label="${providerLabel} maximum streams">
            ${TOP_VALUES.map((value) => `<option value="${value}">Top ${value}</option>`).join('')}
          </select>
        </label>
      </div>
      <span class="heatmap-category-preview__status" role="status" aria-live="polite">Loading category data</span>
    `
    const mapGroup = dock.querySelector('.heatmap-control-dock__map')
    dock.insertBefore(root, mapGroup)

    root.querySelector<HTMLSelectElement>('[data-category-preview-select]')?.addEventListener('change', (event) => {
      const select = event.currentTarget as HTMLSelectElement
      updateCategoryUrl(options.provider, { category: select.value })
      options.onChange()
    })
    root.querySelector<HTMLSelectElement>('[data-category-preview-top]')?.addEventListener('change', (event) => {
      const select = event.currentTarget as HTMLSelectElement
      updateCategoryUrl(options.provider, { top: Number(select.value) })
      options.onChange()
    })
  } else {
    root.dataset.categoryFilter = 'public'
  }

  const top = root.querySelector<HTMLSelectElement>('[data-category-preview-top]')
  if (top) top.value = String(options.state.top)
}

export function syncCategoryPreviewControls(options: {
  state: CategoryPreviewState
  filter?: HeatmapCategoryFilter
  availableCategories?: HeatmapCategoryOption[]
}): void {
  if (!options.state.enabled) return
  const root = document.getElementById(ROOT_ID)
  if (!root) return

  const categories = options.availableCategories ?? options.filter?.availableCategories ?? []
  const select = root.querySelector<HTMLSelectElement>('[data-category-preview-select]')
  if (select) {
    const current = options.filter?.selectedCategory || options.state.category
    select.innerHTML = [
      '<option value="all">All categories</option>',
      ...categories.map((category) => `<option value="${escapeAttribute(category.id)}">${escapeHtml(category.name)} · ${category.streamCount.toLocaleString()} streams</option>`),
    ].join('')
    if (!categories.some((category) => category.id === current) && current !== 'all') {
      const unknown = document.createElement('option')
      unknown.value = current
      unknown.textContent = `Unknown category · ${current}`
      select.appendChild(unknown)
    }
    select.value = current
  }

  const status = root.querySelector<HTMLElement>('.heatmap-category-preview__status')
  if (!status) return
  const filter = options.filter
  if (!filter) {
    status.textContent = 'Loading category data'
    return
  }
  const suffix = filter.coverageState === 'partial'
    ? ` · partial metadata (${filter.missingItems} missing, ${filter.dictionaryMissingItems} unresolved)`
    : filter.coverageState === 'unavailable'
      ? ' · category metadata unavailable'
      : ' · category metadata observed'
  status.textContent = `${filter.state.replaceAll('_', ' ')}${suffix}`
}

export function categoryPreviewMessage(filter: HeatmapCategoryFilter | undefined, provider: HeatmapProviderKey): { title: string; body: string } | null {
  if (!filter) return null
  const providerLabel = provider === 'kick' ? 'Kick' : 'Twitch'
  if (filter.state === 'unknown_category') {
    return {
      title: `Unknown ${providerLabel} category`,
      body: `The selected category ID “${filter.selectedCategory}” is not present in the latest provider-specific options.`,
    }
  }
  if (filter.state === 'category_unavailable' && filter.selectedCategory !== 'all') {
    return {
      title: 'Category data unavailable',
      body: `The latest ${providerLabel} snapshot does not contain usable accepted category metadata. Select All categories to use the unfiltered Heatmap fallback.`,
    }
  }
  return null
}

function updateCategoryUrl(provider: HeatmapProviderKey, next: { category?: string; top?: number }): void {
  const url = new URL(window.location.href)
  url.searchParams.delete(PREVIEW_PARAM)
  if (next.category !== undefined) {
    const category = next.category.trim() || 'all'
    url.searchParams.set(CATEGORY_PARAM, category)
  }
  if (next.top !== undefined && TOP_VALUES.includes(next.top as (typeof TOP_VALUES)[number])) {
    url.searchParams.set(TOP_PARAM, String(next.top))
  }
  window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`)
}

function ensureStyles(): void {
  if (document.getElementById(STYLE_ID)) return
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = `
    .heatmap-category-preview {
      display: grid;
      grid-template-columns: auto minmax(0, 1fr);
      align-items: start;
      column-gap: 12px;
      row-gap: 8px;
      min-width: 0;
      max-width: 100%;
      border: 1px solid rgba(148, 163, 184, .34);
      border-radius: 14px;
      padding: 12px;
      background: rgba(15, 23, 42, .48);
    }
    .heatmap-category-preview > .heatmap-control-dock__label {
      grid-column: 1;
      grid-row: 1 / span 2;
      align-self: start;
    }
    .heatmap-category-preview__fields {
      grid-column: 2;
      grid-row: 1;
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      align-items: end;
      min-width: 0;
      max-width: 100%;
    }
    .heatmap-category-preview__fields label {
      display: grid;
      gap: 5px;
      min-width: 0;
      max-width: 100%;
      color: var(--muted);
      font-size: .76rem;
    }
    .heatmap-category-preview__fields select {
      width: 100%;
      min-width: 0;
      max-width: 100%;
      min-height: 42px;
      border: 1px solid rgba(148, 163, 184, .34);
      border-radius: 10px;
      padding: 0 36px 0 12px;
      background: rgba(7, 16, 30, .96);
      color: var(--text);
      text-overflow: ellipsis;
    }
    .heatmap-category-preview__fields select:focus-visible {
      outline: 2px solid currentColor;
      outline-offset: 2px;
    }
    .heatmap-category-preview__status {
      grid-column: 2;
      grid-row: 2;
      display: block;
      min-width: 0;
      width: 100%;
      max-width: 100%;
      overflow-wrap: anywhere;
      color: var(--muted);
      font-size: .75rem;
      line-height: 1.35;
    }
    @media (max-width: 760px) {
      .heatmap-category-preview {
        grid-template-columns: minmax(0, 1fr);
      }
      .heatmap-category-preview > .heatmap-control-dock__label,
      .heatmap-category-preview__fields,
      .heatmap-category-preview__status {
        grid-column: 1;
        grid-row: auto;
      }
      .heatmap-category-preview,
      .heatmap-category-preview__fields,
      .heatmap-category-preview__fields label,
      .heatmap-category-preview__fields select,
      .heatmap-category-preview__status {
        width: 100%;
        min-width: 0;
        max-width: 100%;
      }
      .heatmap-category-preview__fields {
        display: grid;
        grid-template-columns: minmax(0, 1fr);
      }
    }
  `
  document.head.appendChild(style)
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;',
  })[char] ?? char)
}

function escapeAttribute(value: string): string {
  return escapeHtml(value).replace(/`/g, '&#96;')
}
