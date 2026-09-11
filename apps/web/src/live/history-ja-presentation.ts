import { localeFromPathname } from '../i18n/locale'
import { localizeAvailableHref } from '../i18n/route'

if (localeFromPathname(window.location.pathname) === 'ja') {
  installJapaneseHistoryPresentation()
}

function installJapaneseHistoryPresentation(): void {
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
  observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['aria-label', 'title', 'href'] })
}

const EXACT_TEXT = new Map<string, string>([
  ['Skip to History content', 'Historyコンテンツへ移動'],
  ['Portal', 'ポータル'],
  ['Twitch data', 'Twitchデータ'],
  ['Kick data', 'Kickデータ'],
  ['About', 'このサイトについて'],
  ['Support', 'サポート'],
  ['Menu', 'メニュー'],
  ['Data Status', 'データ状態'],
  ['Loading', '読み込み中'],
  ['Last 7 days', '過去7日'],
  ['Last 30 days', '過去30日'],
  ['Custom', 'カスタム'],
  ['From', '開始'],
  ['To', '終了'],
  ['Apply range', '期間を適用'],
  ['Period', '期間'],
  ['Metric', '指標'],
  ['State', '状態'],
  ['Observed', '観測'],
  ['Observed days', '観測日数'],
  ['Viewer-minutes', '視聴者分'],
  ['viewer-minutes', '視聴者分'],
  ['Peak viewers', 'ピーク視聴者数'],
  ['Average viewers', '平均視聴者数'],
  ['Observed time', '観測時間'],
  ['Source', 'ソース'],
  ['Real', '実データ'],
  ['Total observed', '総観測量'],
  ['Peak day', 'ピーク日'],
  ['Top streamer', '上位配信者'],
  ['Biggest rise', '最大上昇'],
  ['Coverage quality', '観測品質'],
  ['Daily trend', '日次推移'],
  ['Observed rollup', '観測ロールアップ'],
  ['Complete', '完全'],
  ['Partial', '一部'],
  ['In progress', '進行中'],
  ['Missing', '欠損'],
  ['Good', '良好'],
  ['Poor', '不十分'],
  ['Unknown', '不明'],
  ['Demo', 'デモ'],
  ['Selected day', '選択日'],
  ['Choose a bar', 'バーを選択'],
  ['Top streamers', '上位配信者'],
  ['Completed-day ranking', '完了日のランキング'],
  ['Sort', '並び順'],
  ['Show', '表示'],
  ['Streamer', '配信者'],
  ['Change', '変化'],
  ['Daily archive', '日次アーカイブ'],
  ['Recent days first', '新しい日付から表示'],
  ['All', 'すべて'],
  ['Needs attention', '要確認'],
  ['Show all days', 'すべての日を表示'],
  ['Show fewer days', '表示日数を減らす'],
  ['Coverage & data quality', '観測範囲とデータ品質'],
  ['Retention window', '保持期間'],
  ['Open Data Status', 'Data Statusを開く'],
  ['Open Day Flow', 'Day Flowを開く'],
  ['Open Battle Lines', 'Battle Linesを開く'],
  ['Not enough previous data', '前期間のデータ不足'],
  ['Previous-period baseline unavailable', '前期間の基準値を利用できません'],
  ['No retained history rollup is available yet.', '保持されたHistoryロールアップはまだありません。'],
  ['Click or tap a day to inspect it.', '日付をクリックまたはタップすると詳細を確認できます。'],
  ['Select an observed day to inspect it.', '観測日を選択すると詳細を確認できます。'],
  ['Loading retained history…', '保持履歴を読み込み中…'],
  ['Loading period coverage…', '期間の観測範囲を読み込み中…'],
  ['Completed-day scope will appear here.', '完了日の範囲をここに表示します。'],
  ['Loading Twitch history…', 'Twitch Historyを読み込み中…'],
  ['Loading Kick history…', 'Kick Historyを読み込み中…'],
  ['Loading completed-day streamer rollup…', '完了日の配信者ロールアップを読み込み中…'],
  ['Loading days…', '日付を読み込み中…'],
  ['Loading observed days…', '観測日を読み込み中…'],
  ['Loading retained history coverage…', '保持履歴の観測範囲を読み込み中…'],
])

const RAW_TEXT_ANCESTORS = [
  '.history-peak-archive tbody td:nth-child(2)',
  '[data-history-streamer-cards] strong',
  '[data-history-streamer-cards] a',
  '[data-history-summary] > div:nth-child(3) strong',
  '[data-history-summary] > div:nth-child(4) strong',
  '[data-history-selected-day] [data-streamer-name]',
  '[data-history-daily-archive] [data-streamer-name]',
].join(',')

function translateDocument(): void {
  translateExactText(document.body)
  translateDynamicPatterns()
  localizeFeatureLinks()
  translateAttributes()
}

function translateExactText(root: ParentNode): void {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  const nodes: Text[] = []
  while (walker.nextNode()) nodes.push(walker.currentNode as Text)
  for (const node of nodes) {
    const parent = node.parentElement
    if (parent?.closest(RAW_TEXT_ANCESTORS)) continue
    const original = node.nodeValue ?? ''
    const trimmed = original.trim()
    const replacement = EXACT_TEXT.get(trimmed)
    if (!replacement) continue
    const next = original.replace(trimmed, replacement)
    if (next !== original) node.nodeValue = next
  }
}

function translateDynamicPatterns(): void {
  replace(/^Collector status loading · 5m cadence$/, 'コレクター状態を読み込み中 · 5分間隔')
  replace(/^(\d+)\s*\/\s*(\d+) days$/, '$1 / $2日')
  replace(/^(\d+) days$/, '$1日')
  replace(/^Last (\d+) days$/, '過去$1日')
  replace(/^Observed (\d+) of (\d+) days$/, '$2日中$1日を観測')
  replace(/^(\d+) observed days$/, '観測$1日')
  replace(/^Missing (\d+) days$/, '欠損$1日')
  replace(/^Partial (\d+) days$/, '一部観測$1日')
  replace(/^([\d,.]+) viewer-minutes$/, '$1 視聴者分')
  replace(/^([\d,.]+) minutes observed$/, '$1分観測')
  replace(/^Coverage: (.+)$/, (_match, value) => `観測範囲: ${translateLabel(value)}`)
  replace(/^State: (.+)$/, (_match, value) => `状態: ${translateLabel(value)}`)
  replace(/^Source: (.+)$/, (_match, value) => `ソース: ${translateLabel(value)}`)
  replace(/^No observed data for (.+)\.$/, (_match, day) => `${day}の観測データはありません。`)
  replace(/^History API returned (\d+)\.$/, 'History APIが$1を返しました。')
  replace(/^From and To are required for a custom range\.$/, 'カスタム期間では開始日と終了日が必要です。')
  replace(/^From must be on or before To\.$/, '開始日は終了日以前にしてください。')
  replace(/^Custom range is limited to (\d+) days\.$/, 'カスタム期間は$1日以内です。')
  replace(/^Showing (\d+) of (\d+) days$/, '$2日中$1日を表示')
  replace(/^([+-]?[\d.]+)% vs previous period$/, '前期間比 $1%')
  replace(/^New vs previous period$/, '前期間比: 新規')
  replace(/^Previous period unavailable$/, '前期間を利用できません')
}

function localizeFeatureLinks(): void {
  document.querySelectorAll<HTMLAnchorElement>('a[href]').forEach((anchor) => {
    const href = anchor.getAttribute('href') ?? ''
    if (!/^\/(?:twitch|kick)\/(?:heatmap|day-flow|battle-lines|history)\//.test(href)) return
    const localized = localizeAvailableHref(href, 'ja')
    if (localized !== href) anchor.setAttribute('href', localized)
  })
}

function translateAttributes(): void {
  document.querySelectorAll<HTMLElement>('[aria-label]').forEach((node) => {
    const value = node.getAttribute('aria-label') ?? ''
    const next = new Map([
      ['Open navigation', 'ナビゲーションを開く'],
      ['History controls', 'History操作'],
      ['Coverage legend', '観測範囲の凡例'],
      ['Ranking controls', 'ランキング操作'],
      ['Daily archive controls', '日次アーカイブ操作'],
    ]).get(value)
    if (next) node.setAttribute('aria-label', next)
  })
}

function replace(pattern: RegExp, replacement: string | ((match: string, ...groups: string[]) => string)): void {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
  const nodes: Text[] = []
  while (walker.nextNode()) nodes.push(walker.currentNode as Text)
  for (const node of nodes) {
    const parent = node.parentElement
    if (parent?.closest(RAW_TEXT_ANCESTORS)) continue
    const original = node.nodeValue ?? ''
    const trimmed = original.trim()
    const match = trimmed.match(pattern)
    if (!match) continue
    const nextText = typeof replacement === 'string'
      ? trimmed.replace(pattern, replacement)
      : replacement(match[0], ...match.slice(1))
    if (nextText !== trimmed) node.nodeValue = original.replace(trimmed, nextText)
  }
}

function translateLabel(value: string): string {
  const trimmed = value.trim()
  return EXACT_TEXT.get(trimmed) ?? trimmed
}
