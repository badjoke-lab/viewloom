import type {
  HeatmapCategoryFilter,
  HeatmapCategoryOption,
} from './model'

const PREVIEW_PARAM = 'categoryPreview'
const CATEGORY_PARAM = 'category'
const TOP_PARAM = 'top'
const PREVIEW_VALUE = '1'
const TOP_VALUES = [20, 50, 100] as const
const DEFAULT_TOP = 50
const ROOT_ID = 'heatmap-category-preview-controls'
const STYLE_ID = 'heatmap-category-preview-style'

export type CategoryPreviewState = {
  enabled: boolean
  category: string
  top: number
}

export function readCategoryPreviewState(provider: 'twitch' | 'kick'): CategoryPreviewState {
  const url = new URL(window.location.href)
  const enabled = provider === 'twitch' && url.searchParams.get(PREVIEW_PARAM) === PREVIEW_VALUE
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
  provider: 'twitch' | 'kick',
  state = readCategoryPreviewState(provider),
): string {
  if (!state.enabled) return endpoint
  const url = new URL(endpoint, window.location.origin)
  url.searchParams.set(CATEGORY_PARAM, state.category)
  url.searchParams.set(TOP_PARAM, String(state.top))
  return `${url.pathname}${url.search}`
}

export function installCategoryPreviewControls(options: {
  provider: 'twitch' | 'kick'
  state: CategoryPreviewState
  onChange: () => void
}): void {
  const existing = document.getElementById(ROOT_ID)
  if (!options.state.enabled || options.provider !== 'twitch') {
    existing?.remove()
    return
  }

  ensureStyles()
  const dock = document.querySelector<HTMLElement>('.heatmap-control-dock')
  if (!dock) return

  let root = existing
  if (!root) {
    root = document.createElement('div')
    root.id = ROOT_ID
    root.className = 'heatmap-control-dock__group heatmap-category-preview'
    root.dataset.hiddenPreview = 'true'
    root.innerHTML = `
      <span class="heatmap-control-dock__label">Category preview</span>
      <div class="heatmap-category-preview__fields">
        <label>
          <span>Category</span>
          <select data-category-preview-select aria-label="Twitch category preview"></select>
        </label>
        <label>
          <span>Top</span>
          <select data-category-preview-top aria-label="Twitch category preview maximum streams">
            ${TOP_VALUES.map((value) => `<option value="${value}">Top ${value}</option>`).join('')}
          </select>
        </label>
      </div>
      <span class="heatmap-category-preview__status" role="status" aria-live="polite">Hidden preview · public exposure disabled</span>
    `
    const mapGroup = dock.querySelector('.heatmap-control-dock__map')
    dock.insertBefore(root, mapGroup)

    root.querySelector<HTMLSelectElement>('[data-category-preview-select]')?.addEventListener('change', (event) => {
      const select = event.currentTarget as HTMLSelectElement
      updatePreviewUrl({ category: select.value })
      options.onChange()
    })
    root.querySelector<HTMLSelectElement>('[data-category-preview-top]')?.addEventListener('change', (event) => {
      const select = event.currentTarget as HTMLSelectElement
      updatePreviewUrl({ top: Number(select.value) })
      options.onChange()
    })
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
    status.textContent = 'Hidden preview · loading category contract'
    return
  }
  const suffix = filter.coverageState === 'partial'
    ? ` · partial metadata (${filter.missingItems} missing, ${filter.dictionaryMissingItems} unresolved)`
    : filter.coverageState === 'unavailable'
      ? ' · category metadata unavailable'
      : ' · category metadata observed'
  status.textContent = `Hidden preview · ${filter.state.replaceAll('_', ' ')}${suffix} · public exposure disabled`
}

export function categoryPreviewMessage(filter: HeatmapCategoryFilter | undefined): { title: string; body: string } | null {
  if (!filter) return null
  if (filter.state === 'unknown_category') {
    return {
      title: 'Unknown Twitch category',
      body: `The selected category ID “${filter.selectedCategory}” is not present in the latest provider-specific options.`,
    }
  }
  if (filter.state === 'category_unavailable' && filter.selectedCategory !== 'all') {
    return {
      title: 'Category data unavailable',
      body: 'The latest Twitch snapshot does not contain an accepted category contract. The public unfiltered Heatmap remains unchanged.',
    }
  }
  return null
}

function updatePreviewUrl(next: { category?: string; top?: number }): void {
  const url = new URL(window.location.href)
  url.searchParams.set(PREVIEW_PARAM, PREVIEW_VALUE)
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
      align-items: center;
      border: 1px dashed rgba(148, 163, 184, .38);
      border-radius: 14px;
      padding: 12px;
      background: rgba(15, 23, 42, .48);
    }
    .heatmap-category-preview__fields {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      align-items: end;
    }
    .heatmap-category-preview__fields label {
      display: grid;
      gap: 5px;
      min-width: min(260px, 100%);
      color: var(--muted);
      font-size: .76rem;
    }
    .heatmap-category-preview__fields select {
      min-height: 42px;
      border: 1px solid rgba(148, 163, 184, .34);
      border-radius: 10px;
      padding: 0 36px 0 12px;
      background: rgba(7, 16, 30, .96);
      color: var(--text);
    }
    .heatmap-category-preview__fields select:focus-visible {
      outline: 2px solid currentColor;
      outline-offset: 2px;
    }
    .heatmap-category-preview__status {
      color: var(--muted);
      font-size: .75rem;
    }
    @media (max-width: 760px) {
      .heatmap-category-preview,
      .heatmap-category-preview__fields,
      .heatmap-category-preview__fields label {
        width: 100%;
      }
      .heatmap-category-preview__fields {
        display: grid;
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