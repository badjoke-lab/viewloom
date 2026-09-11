import { localeFromPathname } from '../i18n/locale'
import { localizeAvailableHref } from '../i18n/route'

if (localeFromPathname(window.location.pathname) === 'ja') installJapaneseStatusPresentation()

const EXACT_TEXT = new Map<string, string>([
  ['Portal', 'ポータル'],
  ['Twitch data', 'Twitchデータ'],
  ['Kick data', 'Kickデータ'],
  ['About', 'このサイトについて'],
  ['Support', 'サポート'],
  ['Menu', 'メニュー'],
  ['Data Status', 'Data Status'],
  ['Overall', '全体状態'],
  ['Last success', '最終成功'],
  ['Observed', '観測数'],
  ['Source', 'ソース'],
  ['Collector', 'コレクター'],
  ['Latest snapshot', '最新スナップショット'],
  ['Cadence', '収集間隔'],
  ['Coverage', '観測範囲'],
  ['Database', 'データベース'],
  ['Feature data', '機能別データ'],
  ['Public surfaces', '公開ページ'],
  ['Feature', '機能'],
  ['Role', '役割'],
  ['State', '状態'],
  ['Updated', '更新'],
  ['Known limitation', '既知の制約'],
  ['Pipeline', 'パイプライン'],
  ['How data reaches the pages', 'ページへ届くまで'],
  ['State definitions', '状態の定義'],
  ['What labels mean', 'ラベルの意味'],
  ['Loading', '読み込み中'],
  ['Refresh status', '状態を更新'],
  ['Refreshing status…', '状態を更新中…'],
  ['Loading Data Status…', 'Data Statusを読み込み中…'],
  ['Refreshing Data Status…', 'Data Statusを更新中…'],
  ['Collector & coverage', 'コレクターと観測範囲'],
  ['Operational truth', '運用状態'],
  ['Collector health', 'コレクター状態'],
  ['Feature data status', '機能別データ状態'],
  ['Known limitations', '既知の制約'],
  ['Provider-specific', 'プロバイダー固有'],
  ['Sanitized debug details', 'サニタイズ済みデバッグ詳細'],
  ['Current state', '現在の状態'],
  ['Collector success time', 'コレクター成功時刻'],
  ['Observed bucket time', '観測バケット時刻'],
  ['Status generated', 'Status生成時刻'],
  ['Status response time', 'Status応答時刻'],
  ['Source mode', 'ソースモード'],
  ['Reported by the provider status API.', 'プロバイダー別Status APIの応答です。'],
  ['Collector state', 'コレクター状態'],
  ['Last attempt', '最終試行'],
  ['Last failure', '最終失敗'],
  ['Run cadence', '実行間隔'],
  ['Last error', '最終エラー'],
  ['Snapshot', 'スナップショット'],
  ['Observed streams', '観測配信数'],
  ['Total viewers', '総視聴者数'],
  ['Coverage mode', '観測モード'],
  ['More available', '追加データあり'],
  ['Storage', 'ストレージ'],
  ['Fresh', 'Fresh'],
  ['Partial', 'Partial'],
  ['Empty', 'Empty'],
  ['Stale', 'Stale'],
  ['Strong Stale', 'Strong Stale'],
  ['Demo', 'Demo'],
  ['Error', 'Error'],
  ['Unconfigured', '未設定'],
  ['Live', 'Live'],
  ['Yes', 'はい'],
  ['No', 'いいえ'],
  ['No feature status rows are available.', '利用できる機能別Status行はありません。'],
  ['No feature status rows are available yet.', '利用できる機能別Status行はまだありません。'],
  ['No additional limitations were returned.', '追加の制約情報は返されていません。'],
  ['Recent real data is available.', '新しい実データを利用できます。'],
  ['Real data is available within a bounded observed window.', '限定された観測範囲内の実データを利用できます。'],
  ['The real pipeline returned no qualifying streams; this is not demo.', '実データ経路が対象配信を返していません。デモではありません。'],
  ['Real data exists, but its freshness threshold was exceeded.', '実データはありますが、鮮度の閾値を超えています。'],
  ['Fixture or fallback data; not live production observation.', 'fixtureまたはfallbackデータであり、本番ライブ観測ではありません。'],
  ['The status API returned this operational state.', 'Status APIが返した運用状態です。'],
  ['Observed data only', '観測データのみ'],
  ['Activity may be unavailable', 'Activityを利用できない場合があります'],
  ['Observed window only', '観測範囲のみ'],
  ['Viewer-delta events', '視聴者数差分イベント'],
  ['180-day retention', '180日保持'],
])

const RAW_ANCESTORS = ['[data-status-debug]'].join(',')

function installJapaneseStatusPresentation(): void {
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

function translateDocument(): void {
  translateExactText()
  translatePatterns()
  translateAttributes()
  localizeLinks()
}

function translateExactText(): void {
  walkText((node, original, trimmed) => {
    const replacement = EXACT_TEXT.get(trimmed)
    if (replacement && replacement !== trimmed) node.nodeValue = original.replace(trimmed, replacement)
  })
}

function translatePatterns(): void {
  replace(/^Collector status loading · 5m cadence$/, 'コレクター状態を読み込み中 · 5分間隔')
  replace(/^(\d+) minutes$/, '$1分')
  replace(/^(\d+) seconds$/, '$1秒')
  replace(/^just now$/, 'たった今')
  replace(/^(\d+)m ago$/, '$1分前')
  replace(/^(\d+)h ago$/, '$1時間前')
  replace(/^(\d+)d ago$/, '$1日前')
  replace(/^([\d,]+) observed$/, '$1件観測')
  replace(/^Status generated (.+) · (.+) · (.+)$/, (_m, relative, absolute, platform) => `Status生成 ${relative} · ${absolute} · ${platform}`)
  replace(/^Data Status refresh failed · (.+)$/, (_m, detail) => `Data Statusの更新に失敗 · ${detail}`)
  replace(/^Status API unavailable: (.+)$/, (_m, detail) => `Status APIを利用できません: ${detail}`)
  replace(/^status api returned (\d+)$/i, 'Status APIが$1を返しました')
}

function translateAttributes(): void {
  document.querySelectorAll<HTMLElement>('[aria-label]').forEach((node) => {
    const value = node.getAttribute('aria-label') ?? ''
    const next = new Map([
      ['Open navigation', 'ナビゲーションを開く'],
      ['Operational status summary', '運用状態サマリー'],
      ['Feature data status', '機能別データ状態'],
    ]).get(value)
    if (next) node.setAttribute('aria-label', next)
  })
}

function localizeLinks(): void {
  document.querySelectorAll<HTMLAnchorElement>('a[href]').forEach((anchor) => {
    const href = anchor.getAttribute('href') ?? ''
    if (!/^\/(?:twitch|kick)\/(?:heatmap|day-flow|battle-lines|history|map|status)\//.test(href)) return
    const localized = localizeAvailableHref(href, 'ja')
    if (localized !== href) anchor.setAttribute('href', localized)
  })
}

function replace(pattern: RegExp, replacement: string | ((match: string, ...groups: string[]) => string)): void {
  walkText((node, original, trimmed) => {
    const match = trimmed.match(pattern)
    if (!match) return
    const next = typeof replacement === 'string' ? trimmed.replace(pattern, replacement) : replacement(match[0], ...match.slice(1))
    if (next !== trimmed) node.nodeValue = original.replace(trimmed, next)
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
