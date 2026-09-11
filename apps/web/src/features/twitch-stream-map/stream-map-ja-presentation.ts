import { localeFromPathname } from '../../i18n/locale'

if (localeFromPathname(window.location.pathname) === 'ja') {
  installJapaneseStreamMapPresentation()
}

const EXACT_TEXT = new Map<string, string>([
  ['Portal', 'ポータル'],
  ['Twitch data', 'Twitchデータ'],
  ['Kick data', 'Kickデータ'],
  ['About', 'このサイトについて'],
  ['Support', 'サポート'],
  ['Changelog', '変更履歴'],
  ['Menu', 'メニュー'],
  ['Data Status', 'データ状態'],
  ['Loading', '読み込み中'],
  ['Ready', '準備完了'],
  ['Empty', 'データなし'],
  ['Data error', 'データエラー'],
  ['Updating population', '対象を更新中'],
  ['Data ready', 'データ準備完了'],
  ['Map loading', '地図を読み込み中'],
  ['Unavailable', '利用不可'],
  ['Geography', '地理'],
  ['Choose map resolution', '地理の解像度を選択'],
  ['Country', '国'],
  ['City', '都市'],
  ['Current / IRL', 'Current / IRL（現在地）'],
  ['Population filters', '対象フィルター'],
  ['Evidence filters', '証拠フィルター'],
  ['Reset population', '対象をリセット'],
  ['Overall Top N', '全体 Top N'],
  ['Minimum viewers', '最小視聴者数'],
  ['Category', 'カテゴリ'],
  ['Any', '指定なし'],
  ['All categories', 'すべてのカテゴリ'],
  ['Evidence source · OR within this group', '証拠ソース · このグループ内はOR'],
  ['Location type · OR within this group', '位置タイプ · このグループ内はOR'],
  ['Account/Profile', 'アカウント / プロフィール'],
  ['Stream title', '配信タイトル'],
  ['Stream tag', '配信タグ'],
  ['Channel profile', 'チャンネルプロフィール'],
  ['Official external', '公式外部情報'],
  ['Manual review', '手動レビュー'],
  ['Home / base', 'ホーム / 拠点'],
  ['Declared location', '公開所在地'],
  ['Current location', '現在地'],
  ['All accepted', '承認済みをすべて表示'],
  ['Profile', 'プロフィール'],
  ['Title', 'タイトル'],
  ['Tag', 'タグ'],
  ['Channel', 'チャンネル'],
  ['External', '外部情報'],
  ['Manual', '手動'],
  ['Evidence', '証拠'],
  ['Reviewed geography', 'レビュー済み地理情報'],
  ['Reviewed Country', 'レビュー済みCountry'],
  ['Reviewed Country only', 'レビュー済みCountryのみ'],
  ['Reviewed Base City only', 'レビュー済みBase Cityのみ'],
  ['World map', '世界地図'],
  ['City aggregate map', '都市集約地図'],
  ['World view', '世界表示'],
  ['Intensity', '強度'],
  ['Streams', '配信数'],
  ['Viewers', '視聴者数'],
  ['Mapped streams', 'マップ済み配信'],
  ['Mapped viewers', 'マップ済み視聴者'],
  ['Excluded non-person', '除外された非個人'],
  ['Why streams are unmapped', '配信がマップされない理由'],
  ['Unmapped reasons', '未マップ理由'],
  ['Excluded non-person channels', '除外された非個人チャンネル'],
  ['Mapped countries and streams', 'マップ済みの国と配信'],
  ['Mapped cities and streams', 'マップ済みの都市と配信'],
  ['Countries', '国'],
  ['Cities', '都市'],
  ['Areas', '地域'],
  ['Conflicts', '競合'],
  ['Excluded', '除外'],
  ['Selected country', '選択中の国'],
  ['Selected geography', '選択中の地理'],
  ['Clear country', '国の選択を解除'],
  ['Clear selection', '選択を解除'],
  ['Evidence sources', '証拠ソース'],
  ['Coverage', 'カバレッジ'],
  ['Population', '対象'],
  ['Updated', '更新'],
  ['State', '状態'],
  ['Observed population', '観測対象'],
  ['Mapped in view', '現在表示のマップ済み'],
  ['Unmapped in view', '現在表示の未マップ'],
  ['Base API unmapped', 'API基準の未マップ'],
  ['Accepted but filtered out', '承認済みだがフィルター除外'],
  ['Current-location streams', 'Current位置の配信'],
  ['Live evidence-backed geography', 'ライブの証拠ベース地理'],
  ['Reason-aware accounting', '理由別の集計'],
  ['Current filtered result', '現在のフィルター結果'],
  ['City-placeable', '都市配置可能'],
  ['Country-only', 'Countryのみ'],
  ['Base City conflicts', 'Base City競合'],
  ['No demo geography will be substituted.', 'デモ用の地理データには置き換えません。'],
  ['Loading…', '読み込み中…'],
  ['Excluded non-person · not placed as a creator', '非個人として除外 · 配信者の位置として配置しません'],
  ['No excluded non-person channel in this view.', 'この表示には除外された非個人チャンネルはありません。'],
  ['No mapped Kick stream matches the selected geography and population.', '選択した地理と対象に一致するマップ済みKick配信はありません。'],
])

const RAW_TEXT_ANCESTORS = [
  '.stream-map-stream-row__head a',
  '.stream-map-stream-row__head > strong:first-child',
  '.stream-map-country-row strong',
  '#stream-map-selected-country-name',
  '[data-population-category] option:not([value="all"])',
  'code',
].join(',')

function installJapaneseStreamMapPresentation(): void {
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
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ['aria-label', 'title'],
  })
}

function translateDocument(): void {
  translateTextNodes()
  translateAttributes()
}

function translateTextNodes(): void {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
  const nodes: Text[] = []
  while (walker.nextNode()) nodes.push(walker.currentNode as Text)

  for (const node of nodes) {
    const parent = node.parentElement
    if (parent?.closest(RAW_TEXT_ANCESTORS)) continue
    const original = node.nodeValue ?? ''
    const trimmed = original.trim()
    if (!trimmed) continue
    if (parent?.matches('.stream-map-stream-row__location') && trimmed !== 'Excluded non-person · not placed as a creator') continue
    const translated = translateText(trimmed)
    if (translated !== trimmed) node.nodeValue = original.replace(trimmed, translated)
  }
}

function translateText(value: string): string {
  const exact = EXACT_TEXT.get(value)
  if (exact) return exact

  let match = value.match(/^(\d[\d,]*) streams · (\d[\d,]*) viewers$/)
  if (match) return `${match[1]}配信 · ${match[2]}視聴者`

  match = value.match(/^(\d[\d,]*) stream · (\d[\d,]*) viewers$/)
  if (match) return `${match[1]}配信 · ${match[2]}視聴者`

  match = value.match(/^(\d[\d,]*) viewers$/)
  if (match) return `${match[1]}視聴者`

  match = value.match(/^(\d+(?:\.\d+)?)% streams · (\d+(?:\.\d+)?)% viewers$/)
  if (match) return `配信 ${match[1]}% · 視聴者 ${match[2]}%`

  match = value.match(/^Top (\d[\d,]*) · all viewers · all categories$/)
  if (match) return `Top ${match[1]} · 全視聴者 · 全カテゴリ`

  match = value.match(/^Top (\d[\d,]*) · all viewers$/)
  if (match) return `Top ${match[1]} · 全視聴者`

  match = value.match(/^Top (\d[\d,]*) · ([\d,]+)\+ viewers · all categories$/)
  if (match) return `Top ${match[1]} · ${match[2]}+視聴者 · 全カテゴリ`

  match = value.match(/^Top (\d[\d,]*) · ([\d,]+)\+ viewers$/)
  if (match) return `Top ${match[1]} · ${match[2]}+視聴者`

  match = value.match(/^(\d[\d,]*) mapped streams · (\d[\d,]*) viewers$/)
  if (match) return `マップ済み ${match[1]}配信 · ${match[2]}視聴者`

  match = value.match(/^(.+) mapped streams$/)
  if (match) return `${match[1]}のマップ済み配信`

  match = value.match(/^Loading live Twitch geography…$/)
  if (match) return 'Twitchの地理情報を読み込み中…'

  match = value.match(/^Loading live Kick geography…$/)
  if (match) return 'Kickの地理情報を読み込み中…'

  match = value.match(/^Loading live Kick (Country|City) geography…$/)
  if (match) return `Kickの${match[1] === 'City' ? '都市' : '国'}地理情報を読み込み中…`

  match = value.match(/^Category unavailable · (.+)$/)
  if (match) return `カテゴリ利用不可 · ${match[1]}`

  match = value.match(/^Not in selected population · (.+)$/)
  if (match) return `選択対象外 · ${match[1]}`

  match = value.match(/^([\d,.]+)m ago$/)
  if (match) return `${match[1]}分前`

  match = value.match(/^([\d,.]+)h ago$/)
  if (match) return `${match[1]}時間前`

  match = value.match(/^([\d,.]+)d ago$/)
  if (match) return `${match[1]}日前`

  if (value === 'Just now') return 'たった今'

  match = value.match(/^Reconciliation passes · (\d[\d,]*) selected streams are accounted for\.$/)
  if (match) return `整合確認済み · 選択中の${match[1]}配信をすべて集計しています。`

  if (value === 'Reconciliation failed · public geography is fail-closed.') return '整合確認に失敗 · 公開地理表示はfail-closedです。'

  match = value.match(/^(\d[\d,]*) streams · (\d[\d,]*) viewers selected from the observed Kick Top 100\.$/)
  if (match) return `観測中のKick Top 100から${match[1]}配信 · ${match[2]}視聴者を選択しています。`

  match = value.match(/^Show (.+) drilldown: (\d[\d,]*) mapped streams, (\d[\d,]*) viewers$/)
  if (match) return `${match[1]}の詳細を表示: マップ済み${match[2]}配信、${match[3]}視聴者`

  if (value === 'Country mode · default API contract; no geography query parameter is sent.') return 'Countryモード · 既定API契約を使用し、geographyクエリは送信しません。'
  if (value === 'City mode · country-only evidence stays accounted but is not placed at city resolution.') return 'Cityモード · Countryのみの証拠は集計に残しますが、都市解像度には配置しません。'
  if (value.startsWith('Stable Twitch user ID available for all ')) return value.replace(/^Stable Twitch user ID available for all ([\d,]+) parsed snapshot streams\.$/, '解析済みスナップショット$1配信すべてでstable Twitch user IDを利用できます。')
  if (value.startsWith('Stable Twitch user ID available for ')) return value.replace(/^Stable Twitch user ID available for ([\d,]+) parsed streams; ([\d,]+) still lack it\. Login remains a join key only\.$/, '解析済み$1配信でstable Twitch user IDを利用できます。$2配信は未取得です。loginはjoin keyとしてのみ扱います。')
  if (value === 'Minute snapshot has no stable Twitch user ID; login remains a join key only, not a stable identity.') return 'minute snapshotにはstable Twitch user IDがありません。loginはjoin keyであり、stable identityとして扱いません。'

  if (value === 'Country is the default. City uses accepted home/base or declared-location evidence only. Current / IRL remains unavailable.') return 'Countryが既定です。Cityは承認済みのhome/baseまたはdeclared-location証拠だけを使用します。Current / IRLは利用できません。'
  if (value === 'Country is the default. City uses a separate reviewed Base City contract. Current / IRL remains unavailable.') return 'Countryが既定です。Cityは別個のレビュー済みBase City契約を使用します。Current / IRLは利用できません。'
  if (value === 'Stable broadcaster IDs are used only for internal provider-separated joins. Country and Base City never infer Current / IRL, address, or creator coordinates.') return 'stable broadcaster IDはprovider分離された内部joinだけに使用します。CountryとBase CityからCurrent / IRL、住所、配信者座標を推測しません。'

  if (value === 'Select a reviewed Base City aggregate to restrict the mapped-stream list. Only separately reviewed aggregate reference geometry may appear on the map; no_geometry rows remain list-only.') return 'レビュー済みBase City集約を選ぶと、マップ済み配信一覧を絞り込みます。別途レビュー済みの集約参照geometryだけを地図に表示し、no_geometry行は一覧表示のみにします。'
  if (value === 'Choose a reviewed Base City aggregate to restrict the result list. Country-only and Current / IRL evidence are never promoted into Base City.') return 'レビュー済みBase City集約を選ぶと結果一覧を絞り込みます。Countryのみの証拠やCurrent / IRL証拠をBase Cityへ昇格させません。'
  if (value === 'Select a country on the map or in the country list to restrict the mapped-stream list. Country selection does not change evidence acceptance.') return '地図または国一覧で国を選ぶとマップ済み配信一覧を絞り込みます。国の選択は証拠の承認判定を変更しません。'
  if (value === 'Choose a country to restrict the result list. The underlying reviewed Country decision does not change.') return '国を選ぶと結果一覧を絞り込みます。基礎となるレビュー済みCountry判定は変更しません。'

  if (value.startsWith('Filtered coverage: ')) return value.replace(/^Filtered coverage: (.+) of selected-population streams\. Unmatched accepted evidence is treated as unmapped in this view\.$/, 'フィルター後カバレッジ: 選択対象配信の$1。条件に合わない承認済み証拠は、この表示では未マップとして扱います。')
  if (value.startsWith('All accepted evidence: ')) return value.replace(/^All accepted evidence: (.+) of selected-population streams and (.+) of selected-population viewers are mapped\.$/, '承認済み証拠すべて: 選択対象配信の$1、選択対象視聴者の$2がマップされています。')

  return value
}

function translateAttributes(): void {
  document.querySelectorAll<HTMLElement>('[aria-label]').forEach((node) => {
    const value = node.getAttribute('aria-label') ?? ''
    const next = translateAria(value)
    if (next !== value) node.setAttribute('aria-label', next)
  })
  document.querySelectorAll<HTMLElement>('[title]').forEach((node) => {
    const value = node.getAttribute('title') ?? ''
    const next = translateTitle(value)
    if (next !== value) node.setAttribute('title', next)
  })
}

function translateAria(value: string): string {
  const exact = new Map<string, string>([
    ['Open navigation', 'ナビゲーションを開く'],
    ['Global navigation', 'グローバルナビゲーション'],
    ['Kick analysis pages', 'Kick分析ページ'],
    ['Observed population filters', '観測対象フィルター'],
    ['Location evidence filters', '位置証拠フィルター'],
    ['Location evidence contract', '位置証拠契約'],
    ['Geography resolution', '地理解像度'],
    ['Geography intensity', '地理表示の強度'],
    ['Location evidence legend', '位置証拠の凡例'],
    ['Interactive world map', 'インタラクティブ世界地図'],
    ['Interactive Kick reviewed geography map', 'インタラクティブKickレビュー済み地理地図'],
    ['Twitch category', 'Twitchカテゴリ'],
    ['Kick category unavailable', 'Kickカテゴリは利用不可'],
  ]).get(value)
  if (exact) return exact
  let match = value.match(/^Show (.+) drilldown: (\d[\d,]*) mapped streams, (\d[\d,]*) viewers$/)
  if (match) return `${match[1]}の詳細を表示: マップ済み${match[2]}配信、${match[3]}視聴者`
  match = value.match(/^Show (.+): (.+)$/)
  if (match) return `${match[1]}を表示: ${translateText(match[2])}`
  return value
}

function translateTitle(value: string): string {
  if (value === 'Current / IRL requires fresh current-location evidence') return 'Current / IRLには新鮮なcurrent-location証拠が必要です'
  if (value === 'Current location is unavailable at City resolution. City uses accepted home/base or declared-location evidence only.') return 'City解像度ではCurrent locationを利用できません。Cityは承認済みhome/baseまたはdeclared-location証拠だけを使用します。'
  return value
}

export {}
