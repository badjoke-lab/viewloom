import { localeFromPathname } from '../i18n/locale'
import { localizeAvailableHref } from '../i18n/route'

if (localeFromPathname(window.location.pathname) === 'ja') installJapaneseWatchlistPresentation()

const EXACT_TEXT = new Map<string, string>([
  ['Portal', 'ポータル'], ['Twitch data', 'Twitchデータ'], ['Kick data', 'Kickデータ'], ['Changelog', '変更履歴'], ['About', 'このサイトについて'], ['Support', 'サポート'], ['Menu', 'メニュー'],
  ['Browser-local utility', 'ブラウザ内だけで利用'], ['Data Status', 'データ状態'], ['Saved only in this browser', 'このブラウザだけに保存'], ['Local Watchlist', 'Local Watchlist'],
  ['Saved', '保存数'], ['Retained period', '保持期間'], ['Storage', 'ストレージ'], ['Data requests', 'データ要求'], ['Provider', 'プロバイダー'], ['Storage key', '保存キー'], ['Latest source', '最新ソース'], ['History source', 'Historyソース'],
  ['Add channel', 'チャンネルを追加'], ['Retained period', '保持期間'], ['Last 7 days', '過去7日'], ['Last 30 days', '過去30日'], ['Refresh data', 'データを更新'], ['Latest observation', '最新観測'], ['Retained History', '保持History'],
  ['Retry latest', '最新観測を再試行'], ['Retry History', 'Historyを再試行'], ['Filter saved channels', '保存チャンネルを絞り込み'], ['Show all', 'すべて表示'], ['Show recent', '先頭のみ表示'], ['Clear Watchlist', 'Watchlistを消去'],
  ['Storage unavailable or corrupted', 'ストレージを利用できないか破損しています'], ['Reset local Watchlist', 'ローカルWatchlistをリセット'], ['No channels saved in this browser.', 'このブラウザに保存されたチャンネルはありません。'],
  ['Local scope and limits', 'ローカル範囲と制約'], ['Browser-only utility', 'ブラウザ限定機能'], ['Local storage', 'ローカル保存'], ['Browser-specific', 'このブラウザ固有'], ['Evidence', '証拠'], ['Bounded observations', '限定された観測'], ['Privacy', 'プライバシー'], ['No saved ids in metadata', '保存IDをメタデータへ含めません'],
  ['Loading', '読み込み中'], ['Not requested', '未要求'], ['Ready', '利用可能'], ['Repaired', '修復済み'], ['Empty', '空'], ['Unavailable', '利用不可'], ['Corrupted', '破損'], ['Write error', '書き込みエラー'],
  ['Open Channel', 'Channelを開く'], ['Open History', 'Historyを開く'], ['Open Heatmap', 'Heatmapを開く'], ['Move up', '上へ移動'], ['Move down', '下へ移動'], ['Remove', '削除'], ['Already first', 'すでに先頭です'], ['Already last', 'すでに末尾です'],
  ['Latest observation unavailable', '最新観測を利用できません'], ['Not in latest observed set', '最新観測集合にはありません'], ['Not confirmed offline', 'オフライン確認ではありません'], ['In latest available observed set', '利用可能な最新観測集合にあります'], ['In latest observed set', '最新観測集合にあります'], ['Provider data is stale', 'プロバイダーデータが古くなっています'],
  ['Observed viewers', '観測視聴者数'], ['Observed at', '観測時刻'], ['Observed title', '観測タイトル'], ['Momentum', 'モメンタム'], ['Retained History unavailable', '保持Historyを利用できません'], ['Not in retained History result', '保持History結果にはありません'], ['No complete history is implied', '完全な履歴を意味しません'], ['Retained History is partial', '保持Historyは一部です'], ['Present in retained History result', '保持History結果にあります'],
  ['Viewer-minutes', '視聴者分'], ['Peak viewers', 'ピーク視聴者数'], ['Average viewers', '平均視聴者数'], ['Observed time', '観測時間'], ['Retained days', '保持日数'], ['Most recent', '最新日'], ['Bounded rank', '限定範囲順位'],
])

const RAW_ANCESTORS = [
  '[data-watchlist-entry] h2',
  '[data-watchlist-entry] code',
  '.watchlist-external .sr-only',
  '.watchlist-evidence-facts dd',
  '[data-watchlist-storage-key]',
].join(',')

function installJapaneseWatchlistPresentation(): void {
  const nativeConfirm = window.confirm.bind(window)
  window.confirm = (message?: string) => nativeConfirm(translateConfirm(String(message ?? '')))
  translateDocument()
  let scheduled = false
  const observer = new MutationObserver(() => {
    if (scheduled) return
    scheduled = true
    window.requestAnimationFrame(() => { scheduled = false; translateDocument() })
  })
  observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['aria-label', 'title', 'href', 'placeholder'] })
}

function translateDocument(): void {
  walkText((node, original, trimmed) => {
    const replacement = EXACT_TEXT.get(trimmed)
    if (replacement && replacement !== trimmed) node.nodeValue = original.replace(trimmed, replacement)
  })

  const patterns: Array<[RegExp, string]> = [
    [/^(\d+) saved$/, '$1件保存'],
    [/^(\d+) saved (Twitch|Kick) channels? loaded from this browser\.$/, 'このブラウザから$1件の$2チャンネルを読み込みました。'],
    [/^Saved (.+) in this browser\.$/, '$1 をこのブラウザに保存しました。'],
    [/^Removed (.+) from this browser\.$/, '$1 をこのブラウザから削除しました。'],
    [/^Moved (.+) up\.$/, '$1 を上へ移動しました。'], [/^Moved (.+) down\.$/, '$1 を下へ移動しました。'],
    [/^(\d+) of (\d+) saved channels match the local filter\.$/, '$2件中$1件がローカル絞り込みに一致します。'],
    [/^Showing the first (\d+) of (\d+) saved channels\.$/, '$2件中、先頭$1件を表示しています。'],
    [/^Showing (\d+) saved channels?\.$/, '$1件の保存チャンネルを表示しています。'],
    [/^Retained History · Last 7 days$/, '保持History · 過去7日'], [/^Retained History · Last 30 days$/, '保持History · 過去30日'],
    [/^Loading retained History for last 7 days…$/, '過去7日の保持Historyを読み込み中…'], [/^Loading retained History for last 30 days…$/, '過去30日の保持Historyを読み込み中…'],
    [/^Loading latest observation…$/, '最新観測を読み込み中…'], [/^Loading retained History…$/, '保持Historyを読み込み中…'],
    [/^Open on (Twitch|Kick)$/, '$1で開く'],
  ]
  for (const [pattern, replacement] of patterns) replace(pattern, replacement)

  const sentences = new Map<string, string>([
    ['The bounded provider observation is loading.', '限定されたプロバイダー観測を読み込み中です。'],
    ['No presence or absence conclusion is shown.', '存在・不在の結論は表示しません。'],
    ['Matched by normalized provider channel id.', '正規化したプロバイダーチャンネルIDで照合しました。'],
    ['The selected bounded History result is loading.', '選択した限定History結果を読み込み中です。'],
    ['No retained-presence conclusion is shown.', '保持データ上の存在・不在の結論は表示しません。'],
    ['Available retained facts are shown, but the payload cannot support a complete presence or absence conclusion.', '利用可能な保持データだけを表示します。このpayloadだけでは完全な存在・不在を判断できません。'],
    ['Bounded retained result only. No complete history is implied.', '限定された保持結果のみです。完全な履歴を意味しません。'],
    ['No saved channels. Latest observation was not requested.', '保存チャンネルがないため、最新観測は要求していません。'],
    ['Loading the latest bounded provider observation…', '限定された最新プロバイダー観測を読み込み中…'],
    ['Latest observation has not been loaded. Use Refresh data to request it.', '最新観測はまだ読み込んでいません。「データを更新」で要求できます。'],
    ['Latest observation unavailable. Retained History remains independent and usable when available.', '最新観測を利用できません。保持Historyは独立しており、利用可能なら引き続き表示できます。'],
    ['The latest provider result is empty. No presence or absence conclusion is shown.', '最新プロバイダー結果は空です。存在・不在の結論は表示しません。'],
    ['No saved channels. Retained History was not requested.', '保存チャンネルがないため、保持Historyは要求していません。'],
    ['Retained History has not been loaded. Use Refresh data to request it.', '保持Historyはまだ読み込んでいません。「データを更新」で要求できます。'],
    ['Retained History unavailable. Latest observation remains independent and usable when available.', '保持Historyを利用できません。最新観測は独立しており、利用可能なら引き続き表示できます。'],
    ['The selected retained History result is empty. No complete history is implied.', '選択した保持History結果は空です。完全な履歴を意味しません。'],
    ['No channels are saved in this browser.', 'このブラウザに保存されたチャンネルはありません。'],
    ['Watchlist updated in another tab.', '別タブでWatchlistが更新されました。'],
    ['Some invalid saved entries were removed.', '無効な保存項目を一部削除しました。'],
    ['Local Watchlist cleared from this browser.', 'このブラウザのLocal Watchlistを消去しました。'],
    ['Local Watchlist reset in this browser.', 'このブラウザのLocal Watchlistをリセットしました。'],
    ['Already saved.', 'すでに保存されています。'],
    ['Changes cannot be saved in this browser.', 'このブラウザでは変更を保存できません。'],
    ['Storage unavailable or corrupted.', 'ストレージを利用できないか破損しています。'],
    ['Confirmation is required.', '確認が必要です。'],
  ])
  walkText((node, original, trimmed) => {
    const replacement = sentences.get(trimmed)
    if (replacement) node.nodeValue = original.replace(trimmed, replacement)
  })

  document.querySelectorAll<HTMLAnchorElement>('a[href]').forEach((anchor) => {
    const href = anchor.getAttribute('href') ?? ''
    if (!/^\/(?:twitch|kick)\/(?:heatmap|history|channel|status|watchlist)\//.test(href)) return
    const localized = localizeAvailableHref(href, 'ja')
    if (localized !== href) anchor.setAttribute('href', localized)
  })

  document.querySelectorAll<HTMLInputElement>('[data-watchlist-filter]').forEach((input) => {
    if (input.placeholder.startsWith('Filter by')) input.placeholder = '保存名・観測名・IDで絞り込み'
  })
  document.querySelectorAll<HTMLElement>('[aria-label]').forEach((node) => {
    const label = node.getAttribute('aria-label') ?? ''
    if (label === 'Open navigation') node.setAttribute('aria-label', 'ナビゲーションを開く')
    else if (label === 'Close navigation') node.setAttribute('aria-label', 'ナビゲーションを閉じる')
    else if (label === 'Watchlist feedback') node.setAttribute('aria-label', 'Watchlistフィードバック')
    else if (label === 'Saved channel controls') node.setAttribute('aria-label', '保存チャンネル操作')
  })
}

function translateConfirm(message: string): string {
  return message
    .replace(/^Clear this (Twitch|Kick) Watchlist from this browser\?$/, 'このブラウザの$1 Watchlistを消去しますか？')
    .replace(/^Reset the corrupted (Twitch|Kick) Watchlist in this browser\?$/, 'このブラウザの破損した$1 Watchlistをリセットしますか？')
}

function replace(pattern: RegExp, replacement: string): void {
  walkText((node, original, trimmed) => {
    pattern.lastIndex = 0
    if (!pattern.test(trimmed)) return
    pattern.lastIndex = 0
    node.nodeValue = original.replace(trimmed, trimmed.replace(pattern, replacement))
  })
}

function walkText(visitor: (node: Text, original: string, trimmed: string) => void): void {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
  const nodes: Text[] = []
  while (walker.nextNode()) nodes.push(walker.currentNode as Text)
  for (const node of nodes) {
    const parent = node.parentElement
    if (parent?.closest(RAW_ANCESTORS)) continue
    const original = node.nodeValue ?? ''
    const trimmed = original.trim()
    if (trimmed) visitor(node, original, trimmed)
  }
}
