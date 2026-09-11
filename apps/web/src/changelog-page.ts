import { localeFromPathname } from './i18n/locale'

type DatePrecision = 'month' | 'day'

type ChangelogEntry = {
  id: string
  date: string
  datePrecision: DatePrecision
  title: string
  summary: string
}

type ChangelogPayload = {
  version: 'viewloom-changelog-v2'
  entries: ChangelogEntry[]
}

const locale = localeFromPathname(window.location.pathname)
const timeline = document.getElementById('changelog-timeline')

const JAPANESE_ENTRY_COPY: Record<string, { title: string; summary: string }> = {
  'shareable-analysis-views': {
    title: '分析ビューを共有可能に',
    summary: 'TwitchとKickを分離した各データ画面に、正規ページURL、History・Day Flow・Battle Lines間の安定した日付リンク、現在の表示をコピーする操作を追加しました。',
  },
  'viewloom-design-refresh': {
    title: 'ViewLoomデザイン刷新',
    summary: 'Portalとプロバイダーホームを再構成し、主要分析ページを、より明確な操作、可視化された観測範囲状態、レスポンシブレイアウトを中心に再構築しました。',
  },
  'livefield-becomes-viewloom': {
    title: 'LivefieldからViewLoomへ',
    summary: 'プロジェクト名をViewLoomへ変更し、一つの独立観測ポータルの下でTwitchデータとKickデータのルートを分離しました。',
  },
  'livefield-begins': {
    title: 'Livefield開始',
    summary: 'Heatmap、Day Flow、Battle Linesを、それぞれNow、Today、Rivalryという異なる見方として扱うライブ配信観測プロジェクトを開始しました。',
  },
}

if (timeline) void loadChangelog()

async function loadChangelog(): Promise<void> {
  setState('loading')
  try {
    const response = await fetch('/data/changelog.json', { cache: 'no-store' })
    if (!response.ok) throw new Error(locale === 'ja' ? `Changelogの取得に失敗しました (${response.status})。` : `Changelog request failed with ${response.status}.`)

    const payload = await response.json() as ChangelogPayload
    validatePayload(payload)
    renderEntries(payload.entries)
  } catch (error) {
    renderError(error instanceof Error ? error.message : locale === 'ja' ? 'Changelogを読み込めませんでした。' : 'The Changelog could not be loaded.')
  }
}

function validatePayload(payload: ChangelogPayload): void {
  if (payload?.version !== 'viewloom-changelog-v2') throw new Error(locale === 'ja' ? 'Changelogデータのバージョンが想定外です。' : 'Unexpected Changelog data version.')
  if (!Array.isArray(payload.entries)) throw new Error(locale === 'ja' ? 'Changelogエントリを利用できません。' : 'Changelog entries are unavailable.')
}

function renderEntries(entries: ChangelogEntry[]): void {
  if (!timeline) return
  timeline.replaceChildren()

  if (entries.length === 0) {
    setState('empty')
    const empty = document.createElement('p')
    empty.className = 'changelog-state'
    empty.textContent = locale === 'ja' ? '公開済みのレビュー済みマイルストーンはありません。' : 'No reviewed milestones have been published.'
    timeline.append(empty)
    timeline.setAttribute('aria-busy', 'false')
    return
  }

  for (const entry of entries) timeline.append(createEntry(entry))
  setState('ready')
  timeline.setAttribute('aria-busy', 'false')
}

function createEntry(entry: ChangelogEntry): HTMLElement {
  const article = document.createElement('article')
  article.className = 'changelog-entry'
  article.dataset.changelogId = entry.id

  const marker = document.createElement('span')
  marker.className = 'changelog-entry__marker'
  marker.setAttribute('aria-hidden', 'true')

  const time = document.createElement('time')
  time.className = 'changelog-entry__date'
  time.dateTime = entry.date
  time.textContent = formatDate(entry.date, entry.datePrecision)

  const localized = locale === 'ja' ? JAPANESE_ENTRY_COPY[entry.id] : undefined
  const title = document.createElement('h2')
  title.textContent = localized?.title ?? entry.title

  const summary = document.createElement('p')
  summary.className = 'changelog-entry__summary'
  summary.textContent = localized?.summary ?? entry.summary

  const copy = document.createElement('div')
  copy.className = 'changelog-entry__copy'
  copy.append(time, title, summary)

  article.append(marker, copy)
  return article
}

function renderError(message: string): void {
  if (!timeline) return
  setState('error')
  timeline.replaceChildren()

  const state = document.createElement('div')
  state.className = 'changelog-state changelog-state--error'

  const title = document.createElement('strong')
  title.textContent = locale === 'ja' ? 'Changelogを利用できません' : 'Changelog unavailable'

  const detail = document.createElement('span')
  detail.textContent = message

  const retry = document.createElement('button')
  retry.type = 'button'
  retry.className = 'button button--small'
  retry.textContent = locale === 'ja' ? '再試行' : 'Retry'
  retry.addEventListener('click', () => void loadChangelog())

  state.append(title, detail, retry)
  timeline.append(state)
  timeline.setAttribute('aria-busy', 'false')
}

function setState(state: 'loading' | 'ready' | 'empty' | 'error'): void {
  document.body.dataset.changelogState = state
  timeline?.setAttribute('aria-busy', state === 'loading' ? 'true' : 'false')
}

function formatDate(value: string, precision: DatePrecision): string {
  const date = new Date(precision === 'month' ? `${value}-01T00:00:00.000Z` : `${value}T00:00:00.000Z`)
  if (Number.isNaN(date.getTime())) return value

  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  }
  if (precision === 'day') options.day = 'numeric'
  return new Intl.DateTimeFormat(locale === 'ja' ? 'ja-JP' : 'en-US', options).format(date)
}
