import { localeFromPathname } from './i18n/locale'
import { localizeAvailableHref } from './i18n/route'

if (localeFromPathname(window.location.pathname) === 'ja') installJapaneseChangelogPresentation()

const ENTRY_COPY = new Map<string, { title: string; summary: string }>([
  ['shareable-analysis-views', {
    title: '共有できる分析ビュー',
    summary: 'TwitchとKickを分離した各データビューに、canonical URL、History・Day Flow・Battle Linesを結ぶ安定した日付付きリンク、現在の表示をコピーする操作を追加しました。',
  }],
  ['viewloom-design-refresh', {
    title: 'ViewLoomのデザイン刷新',
    summary: 'Portalとプロバイダーホームを再構成し、主要分析ページを、より明確な操作、見える観測範囲状態、レスポンシブレイアウトを中心に作り直しました。',
  }],
  ['livefield-becomes-viewloom', {
    title: 'LivefieldからViewLoomへ',
    summary: 'プロジェクト名をViewLoomへ変更し、1つの独立した観測Portalの下でTwitchデータとKickデータを分離したルート構成を確立しました。',
  }],
  ['livefield-begins', {
    title: 'Livefield開始',
    summary: 'Heatmap、Day Flow、Battle Linesを、それぞれNow・Today・Rivalryの異なる視点として持つライブ配信観測プロジェクトを開始しました。',
  }],
])

const EXACT_TEXT = new Map<string, string>([
  ['Portal', 'ポータル'],
  ['Twitch data', 'Twitchデータ'],
  ['Kick data', 'Kickデータ'],
  ['Changelog', '変更履歴'],
  ['About', 'このサイトについて'],
  ['Support', 'サポート'],
  ['Menu', 'メニュー'],
  ['Public milestone record', '公開マイルストーン記録'],
  ['Milestones', 'マイルストーン'],
  ['Open JSON', 'JSONを開く'],
  ['Loading reviewed milestones…', 'レビュー済みマイルストーンを読み込み中…'],
  ['No reviewed milestones have been published.', '公開済みのレビュー済みマイルストーンはありません。'],
  ['Changelog unavailable', '変更履歴を利用できません'],
  ['Retry', '再試行'],
  ['Publication rule', '公開ルール'],
  ['Method & limits', '方法と制約'],
  ['Method &amp; limits', '方法と制約'],
  ['Contact', 'お問い合わせ'],
])

function installJapaneseChangelogPresentation(): void {
  translateDocument()
  let scheduled = false
  const observer = new MutationObserver(() => {
    if (scheduled) return
    scheduled = true
    window.requestAnimationFrame(() => {
      scheduled = false
      translateDocument()
    })
  })
  observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['href', 'aria-label', 'title'] })
}

function translateDocument(): void {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
  const nodes: Text[] = []
  while (walker.nextNode()) nodes.push(walker.currentNode as Text)
  for (const node of nodes) {
    const original = node.nodeValue ?? ''
    const trimmed = original.trim()
    const replacement = EXACT_TEXT.get(trimmed)
    if (replacement && replacement !== trimmed) node.nodeValue = original.replace(trimmed, replacement)
  }

  document.querySelectorAll<HTMLElement>('[data-changelog-id]').forEach((entry) => {
    const id = entry.dataset.changelogId ?? ''
    const copy = ENTRY_COPY.get(id)
    if (!copy) return
    const title = entry.querySelector<HTMLElement>('h2')
    const summary = entry.querySelector<HTMLElement>('.changelog-entry__summary')
    if (title) title.textContent = copy.title
    if (summary) summary.textContent = copy.summary
    const time = entry.querySelector<HTMLTimeElement>('time[datetime]')
    if (time?.dateTime) time.textContent = formatJapaneseDate(time.dateTime)
  })

  document.querySelectorAll<HTMLAnchorElement>('a[href]').forEach((anchor) => {
    const href = anchor.getAttribute('href') ?? ''
    if (!/^\/(?:about|support|contact|changelog)\//.test(href)) return
    const localized = localizeAvailableHref(href, 'ja')
    if (localized !== href) anchor.setAttribute('href', localized)
  })

  document.querySelectorAll<HTMLElement>('[aria-label]').forEach((node) => {
    const label = node.getAttribute('aria-label') ?? ''
    if (label === 'Open navigation') node.setAttribute('aria-label', 'ナビゲーションを開く')
    if (label === 'Close navigation') node.setAttribute('aria-label', 'ナビゲーションを閉じる')
  })
}

function formatJapaneseDate(value: string): string {
  if (/^\d{4}-\d{2}$/.test(value)) {
    const [year, month] = value.split('-')
    return `${Number(year)}年${Number(month)}月`
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-')
    return `${Number(year)}年${Number(month)}月${Number(day)}日`
  }
  return value
}
