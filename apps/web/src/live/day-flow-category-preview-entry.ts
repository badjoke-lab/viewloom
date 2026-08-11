type CategoryOption = {
  id?: string
  name?: string
  streamCount?: number
  viewerMinutes?: number
  peakViewers?: number
  observedBuckets?: number
}

type BucketCoverage = {
  bucket?: string
  state?: 'observed' | 'partial' | 'unavailable'
}

type CategoryFilter = {
  implementationState?: string
  publicExposureAuthorized?: boolean
  selectedCategory?: string
  state?: 'all' | 'selected' | 'unknown_category' | 'category_unavailable'
  coverageState?: 'observed' | 'partial' | 'unavailable'
  availableCategories?: CategoryOption[]
  bucketCoverage?: BucketCoverage[]
  coverageCounts?: { observed?: number; partial?: number; unavailable?: number }
}

type CategoryPayload = {
  categoryFilter?: CategoryFilter
  availableCategories?: CategoryOption[]
}

const PREVIEW_PARAM = 'categoryPreview'
const CATEGORY_PARAM = 'category'
const ROOT_ID = 'dayflow-category-preview-controls'
const STYLE_ID = 'dayflow-category-preview-style'
const EVENT_NAME = 'viewloom:dayflow-category-payload'

const provider = document.body.dataset.provider === 'kick' ? 'kick' : 'twitch'
const providerLabel = provider === 'kick' ? 'Kick' : 'Twitch'
const apiPath = provider === 'kick' ? '/api/kick-day-flow' : '/api/day-flow'
const initialUrl = new URL(window.location.href)
const legacyPreviewAtLoad = initialUrl.searchParams.get(PREVIEW_PARAM) === '1'
const publicProvider = provider === 'twitch' || provider === 'kick'
const enabled = publicProvider || legacyPreviewAtLoad
let selectedCategory = normalizeCategory(initialUrl.searchParams.get(CATEGORY_PARAM))
let publicInteractionSeen = false
let lastPayload: CategoryPayload | null = null
let overlayQueued = false

if (enabled) {
  installStyles()
  preserveCategoryUrlState()
  interceptDayFlowFetch()
  installControls()
  observeStage()
  window.addEventListener(EVENT_NAME, ((event: Event) => {
    const payload = (event as CustomEvent<CategoryPayload>).detail
    lastPayload = payload
    syncControls(payload)
    queueCoverageOverlay()
  }) as EventListener)
}

function preserveCategoryUrlState(): void {
  const originalReplaceState = window.history.replaceState.bind(window.history)
  window.history.replaceState = ((data: unknown, unused: string, url?: string | URL | null) => {
    if (url == null) return originalReplaceState(data, unused, url)
    const next = new URL(String(url), window.location.origin)
    if (next.pathname === window.location.pathname) {
      next.searchParams.set(CATEGORY_PARAM, selectedCategory)
      if (publicProvider) {
        if (legacyPreviewAtLoad && !publicInteractionSeen) next.searchParams.set(PREVIEW_PARAM, '1')
        if (publicInteractionSeen) next.searchParams.delete(PREVIEW_PARAM)
      } else {
        next.searchParams.set(PREVIEW_PARAM, '1')
      }
      return originalReplaceState(data, unused, `${next.pathname}${next.search}${next.hash}`)
    }
    return originalReplaceState(data, unused, url)
  }) as History['replaceState']

  const current = new URL(window.location.href)
  current.searchParams.set(CATEGORY_PARAM, selectedCategory)
  if (!publicProvider) current.searchParams.set(PREVIEW_PARAM, '1')
  originalReplaceState(window.history.state, '', `${current.pathname}${current.search}${current.hash}`)
}

function interceptDayFlowFetch(): void {
  const originalFetch = window.fetch.bind(window)
  window.fetch = (async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const requestUrl = toUrl(input)
    if (!requestUrl || requestUrl.origin !== window.location.origin || requestUrl.pathname !== apiPath) {
      return originalFetch(input, init)
    }

    requestUrl.searchParams.set(CATEGORY_PARAM, selectedCategory)
    const nextInput = input instanceof Request ? new Request(requestUrl.toString(), input) : requestUrl.toString()
    const response = await originalFetch(nextInput, init)
    void response.clone().json().then((payload: CategoryPayload) => {
      window.dispatchEvent(new CustomEvent<CategoryPayload>(EVENT_NAME, { detail: payload }))
    }).catch(() => undefined)
    return response
  }) as typeof window.fetch
}

function installControls(): void {
  if (document.getElementById(ROOT_ID)) return
  const toolbar = document.querySelector<HTMLElement>('.dayflow-toolbar')
  if (!toolbar) return
  const root = document.createElement('div')
  root.id = ROOT_ID
  root.className = 'control-stack dayflow-category-preview'
  root.dataset.dayflowCategoryPreview = publicProvider ? 'public' : 'hidden'
  root.innerHTML = `
    <label class="toolbar-label" for="dayflow-category-preview-select">Category</label>
    <div class="control-group dayflow-category-preview__control">
      <select id="dayflow-category-preview-select" data-dayflow-category-preview-select aria-label="${providerLabel} Day Flow category">
        <option value="all">All categories</option>
      </select>
    </div>
    <span class="dayflow-category-preview__status" role="status" aria-live="polite">Loading category coverage…</span>
  `
  const label = root.querySelector<HTMLLabelElement>('label[for="dayflow-category-preview-select"]')
  if (label) label.style.textTransform = 'none'
  toolbar.insertBefore(root, toolbar.firstChild)

  const select = root.querySelector<HTMLSelectElement>('[data-dayflow-category-preview-select]')
  if (select) {
    select.value = selectedCategory
    select.addEventListener('change', () => {
      if (publicProvider) publicInteractionSeen = true
      selectedCategory = normalizeCategory(select.value)
      const url = new URL(window.location.href)
      if (publicProvider) url.searchParams.delete(PREVIEW_PARAM)
      else url.searchParams.set(PREVIEW_PARAM, '1')
      url.searchParams.set(CATEGORY_PARAM, selectedCategory)
      window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`)
      document.querySelector<HTMLButtonElement>('[data-dayflow-refresh]')?.click()
    })
  }
}

function syncControls(payload: CategoryPayload): void {
  const filter = payload.categoryFilter
  if (!filter || !acceptedImplementationState(filter)) return
  const root = document.getElementById(ROOT_ID)
  if (!root) return
  const select = root.querySelector<HTMLSelectElement>('[data-dayflow-category-preview-select]')
  const categories = filter.availableCategories ?? payload.availableCategories ?? []
  if (select) {
    const current = normalizeCategory(filter.selectedCategory ?? selectedCategory)
    selectedCategory = current
    select.innerHTML = [
      '<option value="all">All categories</option>',
      ...categories.map((category) => `<option value="${escapeAttribute(String(category.id ?? ''))}">${escapeHtml(categoryLabel(category))}</option>`),
    ].join('')
    if (current !== 'all' && !categories.some((category) => category.id === current)) {
      const option = document.createElement('option')
      option.value = current
      option.textContent = filter.state === 'unknown_category' ? `Unknown category · ${current}` : `Unavailable category · ${current}`
      select.appendChild(option)
    }
    select.value = current
  }

  const status = root.querySelector<HTMLElement>('.dayflow-category-preview__status')
  if (status) {
    const counts = filter.coverageCounts ?? {}
    const observed = counts.observed ?? 0
    const partial = counts.partial ?? 0
    const unavailable = counts.unavailable ?? 0
    const state = filter.state ?? 'category_unavailable'
    if (state === 'unknown_category') status.textContent = `Unknown ${providerLabel} category · coverage ${observed} observed / ${partial} partial / ${unavailable} unavailable buckets`
    else if (state === 'category_unavailable') status.textContent = `Category metadata unavailable · ${unavailable} unavailable buckets · no zero inferred`
    else status.textContent = `${state === 'all' ? 'All categories' : 'Selected category'} · ${observed} observed / ${partial} partial / ${unavailable} unavailable buckets`
  }
}

function acceptedImplementationState(filter: CategoryFilter): boolean {
  if (publicProvider) return filter.implementationState === 'public' && filter.publicExposureAuthorized === true
  return legacyPreviewAtLoad && filter.implementationState === 'hidden_candidate' && filter.publicExposureAuthorized === false
}

function observeStage(): void {
  const stage = document.querySelector<HTMLElement>('.dayflow-stage')
  if (!stage) return
  const observer = new MutationObserver(() => queueCoverageOverlay())
  observer.observe(stage, { childList: true, subtree: true })
}

function queueCoverageOverlay(): void {
  if (overlayQueued) return
  overlayQueued = true
  window.requestAnimationFrame(() => {
    overlayQueued = false
    renderCoverageOverlay(lastPayload)
  })
}

function renderCoverageOverlay(payload: CategoryPayload | null): void {
  const stage = document.querySelector<HTMLElement>('.dayflow-stage')
  if (!stage) return
  stage.querySelector('.dayflow-category-coverage-strip')?.remove()
  const coverage = payload?.categoryFilter?.bucketCoverage ?? []
  if (coverage.length === 0 || !coverage.some((bucket) => bucket.state === 'partial' || bucket.state === 'unavailable')) return

  const strip = document.createElement('div')
  strip.className = 'dayflow-category-coverage-strip'
  strip.setAttribute('aria-label', 'Category metadata coverage by Day Flow bucket')
  strip.style.gridTemplateColumns = `repeat(${coverage.length}, minmax(0, 1fr))`
  strip.innerHTML = coverage.map((bucket) => {
    const state = bucket.state ?? 'unavailable'
    const title = `${bucket.bucket ?? 'bucket'} · category metadata ${state}`
    return `<span class="is-${state}" title="${escapeAttribute(title)}" aria-hidden="true"></span>`
  }).join('')
  stage.appendChild(strip)
}

function categoryLabel(category: CategoryOption): string {
  const name = String(category.name ?? category.id ?? 'Category')
  const viewerMinutes = Math.max(0, Number(category.viewerMinutes ?? 0))
  return `${name} · ${compact(viewerMinutes)} viewer-min`
}

function compact(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`
  return String(Math.round(value))
}

function normalizeCategory(value: string | null): string {
  const normalized = value?.trim() ?? ''
  return !normalized || normalized.toLowerCase() === 'all' ? 'all' : normalized.slice(0, 160)
}

function toUrl(input: RequestInfo | URL): URL | null {
  try {
    if (input instanceof Request) return new URL(input.url)
    if (input instanceof URL) return new URL(input.toString())
    return new URL(String(input), window.location.origin)
  } catch {
    return null
  }
}

function installStyles(): void {
  if (document.getElementById(STYLE_ID)) return
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = `
    .dayflow-category-preview{min-width:0;max-width:100%;flex:1 1 290px}
    .dayflow-category-preview__control{min-width:0;max-width:100%}
    .dayflow-category-preview__control select{width:100%;min-width:0;max-width:100%;min-height:34px;border:0;background:var(--surface);padding:8px 32px 8px 10px;color:var(--text)}
    .dayflow-category-preview__status{display:block;max-width:360px;color:var(--muted);font:600 10px/1.35 var(--mono)}
    .dayflow-category-coverage-strip{position:absolute;z-index:8;left:6%;right:2.3%;bottom:6px;height:7px;display:grid;gap:1px;pointer-events:none;border-radius:2px;overflow:hidden;background:rgba(255,255,255,.04)}
    .dayflow-category-coverage-strip span{min-width:0;background:transparent}
    .dayflow-category-coverage-strip .is-partial{background:rgba(251,191,36,.72)}
    .dayflow-category-coverage-strip .is-unavailable{background:repeating-linear-gradient(135deg,rgba(251,113,133,.75) 0 3px,rgba(251,113,133,.2) 3px 6px)}
    @media(max-width:760px){.dayflow-category-preview{flex:1 1 100%;width:100%}.dayflow-category-preview__status{max-width:none}.dayflow-category-preview__control{width:100%}}
  `
  document.head.appendChild(style)
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char] ?? char)
}

function escapeAttribute(value: string): string {
  return escapeHtml(value).replace(/`/g, '&#96;')
}
