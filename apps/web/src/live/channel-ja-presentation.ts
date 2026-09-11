import { localeFromPathname } from '../i18n/locale'
import { localizeAvailableHref } from '../i18n/route'

if (localeFromPathname(window.location.pathname) === 'ja') installJapaneseChannelPresentation()

const EXACT_TEXT = new Map<string, string>([
  ['Portal', 'ポータル'], ['Twitch data', 'Twitchデータ'], ['Kick data', 'Kickデータ'], ['About', 'このサイトについて'], ['Support', 'サポート'], ['Menu', 'メニュー'],
  ['Data Status', 'データ状態'], ['Loading', '読み込み中'], ['Last 30 days', '過去30日'], ['Last 7 days', '過去7日'], ['Provider', 'プロバイダー'], ['Period', '期間'],
  ['Source / state', 'ソース / 状態'], ['Observed scope', '観測範囲'], ['Retained appearances', '保持された出現日'], ['Session history', 'セッション履歴'], ['Unavailable', '利用不可'],
  ['Copy current URL', '現在のURLをコピー'], ['Back to History', 'Historyへ戻る'], ['Channel required', 'チャンネル指定が必要'], ['Overview', '概要'], ['Retained Days', '保持日'], ['Report & Export', 'レポート / エクスポート'],
  ['Daily footprint', '日次フットプリント'], ['Retained daily Top 10 only', '保持された日次Top 10のみ'], ['Recent retained appearances', '最近の保持出現日'], ['Rivalry candidates', '競り合い候補'], ['Up to three day-level aggregate pairs', '日次集計ペアを最大3件'],
  ['Days where this channel appears in daily Top 10', 'このチャンネルが日次Top 10に入った日'], ['Current retained evidence and reusable link', '現在の保持証拠と再利用可能なリンク'], ['Scope & limits', '観測範囲と制約'], ['What this page can prove', 'このページで確認できること'],
  ['Viewer-minutes', '視聴者分'], ['Peak viewers', 'ピーク視聴者数'], ['Average viewers', '平均視聴者数'], ['Observed time', '観測時間'], ['Daily Top 10 days', '日次Top 10日数'], ['Daily rank', '日次順位'], ['Retained rank', '保持順位'],
  ['Selected day', '選択日'], ['Latest retained day', '最新の保持日'], ['Latest requested day', '最新の対象日'], ['Provider day missing', 'プロバイダー日が欠損'], ['Not in retained daily Top 10', '保持された日次Top 10外'],
  ['Open Day Flow', 'Day Flowを開く'], ['Open Battle Lines', 'Battle Linesを開く'], ['No requested days are available.', '対象期間の日次データを利用できません。'], ['No selected day is available.', '選択日のデータを利用できません。'],
  ['No retained Top 10 appearances are available.', '保持されたTop 10出現日はありません。'], ['No retained daily rivalry candidate includes this channel in the selected period.', '選択期間にこのチャンネルを含む保持済み競り合い候補はありません。'],
])

const RAW_ANCESTORS = ['[data-channel-name]', '[data-channel-external]'].join(',')

function installJapaneseChannelPresentation(): void {
  translateDocument()
  let scheduled = false
  const observer = new MutationObserver(() => {
    if (scheduled) return
    scheduled = true
    window.requestAnimationFrame(() => { scheduled = false; translateDocument() })
  })
  observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['aria-label', 'title', 'href'] })
}

function translateDocument(): void {
  walkText((node, original, trimmed) => {
    const replacement = EXACT_TEXT.get(trimmed)
    if (replacement && replacement !== trimmed) node.nodeValue = original.replace(trimmed, replacement)
  })
  replace(/^Loading retained ranking footprint…$/, '保持されたランキング履歴を読み込み中…')
  replace(/^Loading channel summary…$/, 'チャンネル要約を読み込み中…')
  replace(/^Loading daily footprint…$/, '日次フットプリントを読み込み中…')
  replace(/^Loading selected-day interpretation…$/, '選択日の詳細を読み込み中…')
  replace(/^Loading recent appearances…$/, '最近の出現日を読み込み中…')
  replace(/^Loading rivalry candidates…$/, '競り合い候補を読み込み中…')
  replace(/^Loading retained days…$/, '保持日を読み込み中…')
  replace(/^(\d+) retained daily Top 10 appearances in this period\.$/, '$1日分の保持された日次Top 10出現があります。')
  replace(/^Retained period total$/, '保持期間の合計')
  replace(/^Highest retained observation$/, '保持データ内の最大値')
  replace(/^Viewer-minutes \/ observed minutes$/, '視聴者分 / 観測分')
  replace(/^Retained observation time$/, '保持された観測時間')
  replace(/^(\d+) requested days$/, '対象$1日')
  replace(/^Daily viewer-minutes in retained Top 10$/, '保持された日次Top 10の視聴者分')
  replace(/^Absent bars mean not present in retained daily Top 10, not confirmed offline\.$/, 'バーがない日は保持された日次Top 10外であり、オフラインだったことを意味しません。')
  replace(/^This does not confirm that the channel was offline\.$/, 'これはチャンネルがオフラインだったことを示すものではありません。')
  replace(/^ViewLoom has no retained provider-day evidence for this date\.$/, 'この日付についてViewLoomに保持されたプロバイダー日証拠はありません。')
  replace(/^Use the current URL to preserve this provider, channel, period, task, and selected-day state\.$/, '現在のURLで、プロバイダー、チャンネル、期間、表示タスク、選択日を保持できます。')

  document.querySelectorAll<HTMLAnchorElement>('a[href]').forEach((anchor) => {
    const href = anchor.getAttribute('href') ?? ''
    if (!/^\/(?:twitch|kick)\/(?:history|day-flow|battle-lines|status|channel)\//.test(href)) return
    const localized = localizeAvailableHref(href, 'ja')
    if (localized !== href) anchor.setAttribute('href', localized)
  })
}

function replace(pattern: RegExp, replacement: string): void {
  walkText((node, original, trimmed) => {
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
