import { localeFromPathname } from '../i18n/locale'

if (localeFromPathname(window.location.pathname) === 'ja') {
  installJapaneseBattleLinesPresentation()
}

function installJapaneseBattleLinesPresentation(): void {
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
  translateExactText(document.body)
  translateDynamicPatterns()
  translateCategoryChrome()
  translateChartPresentation()
  translateSplitPresentation()
}

const EXACT_TEXT = new Map<string, string>([
  ['Portal', 'ポータル'],
  ['Twitch data', 'Twitchデータ'],
  ['Kick data', 'Kickデータ'],
  ['About', 'このサイトについて'],
  ['Support', 'サポート'],
  ['Menu', 'メニュー'],
  ['Data Status', 'データ状態'],
  ['State', '状態'],
  ['Loading', '読み込み中'],
  ['Coverage', '観測範囲'],
  ['Date', '日付'],
  ['Updated', '更新'],
  ['Range', '期間'],
  ['Today', '今日'],
  ['Yesterday', '昨日'],
  ['Metric', '指標'],
  ['Viewers', '視聴者数'],
  ['Indexed', '指数化'],
  ['Streams', '配信'],
  ['Bucket', 'バケット'],
  ['Layout', '表示'],
  ['Wide', 'ワイド'],
  ['Split', '分割'],
  ['Back to recommended', '推奨バトルへ戻る'],
  ['Jump to latest', '最新へ移動'],
  ['Refresh', '更新'],
  ['Loading…', '読み込み中…'],
  ['Time Inspector', '時刻インスペクター'],
  ['Reversal strip', '逆転ストリップ'],
  ['Secondary battles', 'その他のバトル'],
  ['Battle feed', 'バトルフィード'],
  ['Coverage & limits', '観測範囲と制約'],
  ['Method & limits', '方法と制約'],
  ['Error', 'エラー'],
  ['Unavailable', '利用不可'],
  ['Request failed', 'リクエスト失敗'],
  ['None', 'なし'],
  ['Selected time', '選択時刻'],
  ['Leader at selected time', '選択時刻の首位'],
  ['Gap at selected time', '選択時刻の差'],
  ['Gap trend', '差の傾向'],
  ['Latest reversal', '直近の逆転'],
  ['Reversals', '逆転回数'],
  ['Battle score', 'バトルスコア'],
  ['Selected battle', '選択中のバトル'],
  ['Current gap', '現在の差'],
  ['Rank', '順位'],
  ['Stream', '配信'],
  ['Value / state', '値 / 状態'],
  ['Δ bucket', 'Δ バケット'],
  ['Data state', 'データ状態'],
  ['Recent battle feed', '直近のバトルフィード'],
  ['Latest 3', '直近3件'],
  ['Selected stream', '選択中の配信'],
  ['Top at selected time', '選択時刻の上位'],
  ['Value', '値'],
  ['Following latest', '最新を追跡中'],
  ['Inspect mode', '確認モード'],
  ['No observed value', '観測値なし'],
  ['Tied', '同率'],
  ['Closing', '縮小'],
  ['Widening', '拡大'],
  ['Steady', '横ばい'],
  ['Observed', '観測'],
  ['Offline', 'オフライン'],
  ['Not Observed', '未観測'],
  ['Missing', '欠損'],
  ['Outside Category', 'カテゴリ外'],
  ['Category Unavailable', 'カテゴリ利用不可'],
  ['Complete', '完全'],
  ['Partial', '一部'],
  ['Stale', '更新遅延'],
  ['Empty', 'データなし'],
  ['Demo', 'デモ'],
  ['Category', 'カテゴリ'],
  ['All categories', 'すべてのカテゴリ'],
  ['Selected category', '選択カテゴリ'],
  ['SPLIT INSPECTOR', '分割インスペクター'],
  ['Waiting for battle data…', 'バトルデータを待機中…'],
  ['No battle selected', 'バトル未選択'],
  ['No selected time', '時刻未選択'],
  ['No API detail', 'API詳細なし'],
  ['No selected-time values.', '選択時刻の値がありません。'],
  ['No ranking at this bucket.', 'このバケットのランキングはありません。'],
  ['No recent event for this battle.', 'このバトルの直近イベントはありません。'],
])

const RAW_TEXT_ANCESTORS = [
  '.battle-primary__identity h2',
  '.battle-legend__item span',
  '.ranking__row strong',
  '.secondary-card strong',
  '[data-battle-feed] strong',
  '[data-battle-feed] p',
  '[data-battle-reversals] strong',
  '.battle-split-event strong',
  '.battle-split-event span',
  '.battle-split-rank strong',
  '.battle-split-identity h2',
  '.battle-split-value small',
].join(',')

function setText(node: Node, next: string): void {
  if (node.textContent !== next) node.textContent = next
}

function setAttribute(node: Element, name: string, next: string): void {
  if (node.getAttribute(name) !== next) node.setAttribute(name, next)
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
  replaceText('.status-inline', /^Collector status loading · 5m cadence$/, 'コレクター状態を読み込み中 · 5分間隔')
  replaceText('[data-battle-status] > span', /^Reading observed Twitch snapshots…$/, '観測済みTwitchスナップショットを読み込み中…')
  replaceText('[data-battle-status] > span', /^Reading observed Kick snapshots…$/, '観測済みKickスナップショットを読み込み中…')
  replaceText('[data-battle-primary] .notice', /^Selecting the recommended Twitch battle…$/, '推奨Twitchバトルを選択中…')
  replaceText('[data-battle-primary] .notice', /^Selecting the recommended Kick battle…$/, '推奨Kickバトルを選択中…')
  replaceText('[data-battle-stage] .notice', /^Loading Twitch Battle Lines…$/, 'Twitch Battle Linesを読み込み中…')
  replaceText('[data-battle-stage] .notice', /^Loading Kick Battle Lines…$/, 'Kick Battle Linesを読み込み中…')
  replaceText('[data-battle-inspector] p', /^Waiting for a selected time…$/, '選択時刻を待機中…')
  replaceText('[data-battle-reversals] .empty-inline', /^Loading reversals…$/, '逆転を読み込み中…')
  replaceText('[data-battle-secondary] .empty-inline', /^Loading secondary battles…$/, 'その他のバトルを読み込み中…')
  replaceText('[data-battle-feed] .empty-inline', /^Loading battle events…$/, 'バトルイベントを読み込み中…')
  replaceText('[data-battle-coverage] p', /^Loading observation coverage…$/, '観測範囲を読み込み中…')

  replaceText('[data-battle-primary] .notice', /^No comparable pair exists in this observed window\.$/, 'この観測期間には比較可能な組み合わせがありません。')
  replaceText('[data-battle-stage] .notice', /^No connected Battle Lines can be drawn for this observed window\.$/, 'この観測期間には接続されたBattle Linesを描画できません。')
  replaceText('[data-battle-inspector] > p', /^No battle selected\.$/, 'バトルが選択されていません。')
  replaceText('[data-battle-inspector] > p', /^Selected pair is unavailable\.$/, '選択した組み合わせを利用できません。')
  replaceText('[data-battle-reversals] .empty-inline', /^No reversal detected in this observed window\.$/, 'この観測期間では逆転を検出していません。')
  replaceText('[data-battle-secondary] .empty-inline', /^No secondary battle has enough overlapping observations\.$/, '十分な重複観測がある他のバトルはありません。')
  replaceText('[data-battle-feed] .empty-inline', /^No distinct battle event was detected in this observed window\.$/, 'この観測期間では個別のバトルイベントを検出していません。')

  replaceText('.battle-section__head > span', /^Click, drag, tap, or use arrow keys on the chart$/, 'チャートをクリック、ドラッグ、タップ、または矢印キーで操作できます')
  replaceText('.battle-section__head > span', /^Jump directly to a lead change$/, 'リード交代へ直接移動')
  replaceText('.battle-section__head > span', /^Other rivalry candidates in this window$/, 'この期間の他の競り合い候補')
  replaceText('.battle-section__head > span', /^Up to five distinct observed events$/, '観測された個別イベントを最大5件表示')

  document.querySelectorAll<HTMLElement>('[data-battle-status] > span').forEach((node) => {
    const current = node.textContent ?? ''
    const next = current.replace(/^(\d+)\/(\d+) UTC buckets observed · (.+) · (5m|10m) · real API$/, '$1/$2 UTCバケット観測 · $3 · $4 · 実API')
    setText(node, next)
  })
  document.querySelectorAll<HTMLElement>('[data-battle-status] small b').forEach((node) => {
    const current = node.textContent ?? ''
    let next = current
    if (current.startsWith('Data API: ')) next = `Data API: ${translateLabel(current.slice('Data API: '.length))}`
    else if (current.startsWith('Collector health: ')) next = `コレクター状態: ${translateLabel(current.slice('Collector health: '.length))}`
    setText(node, next)
  })

  document.querySelectorAll<HTMLElement>('.battle-primary__identity .kicker').forEach((node) => {
    const current = (node.textContent ?? '').trim()
    if (current === 'RECOMMENDED BATTLE') setText(node, '推奨バトル')
    else if (current === 'SELECTED BATTLE') setText(node, '選択中のバトル')
  })
  document.querySelectorAll<HTMLElement>('.battle-primary__metrics strong').forEach((node) => {
    const current = (node.textContent ?? '').trim()
    const next = translateLabel(current)
    if (next !== current) setText(node, next)
  })

  document.querySelectorAll<HTMLElement>('.pair-inspector article > span').forEach((node) => {
    setText(node, translatePairDetail(node.textContent ?? ''))
  })
  document.querySelectorAll<HTMLElement>('.pair-inspector__result > span').forEach((node) => {
    const current = node.textContent ?? ''
    const match = current.match(/^Leader: (.+) · (.+) gap · (.+)$/)
    if (!match) return
    setText(node, `首位: ${match[1]} · 差 ${match[2]} · ${translateLabel(match[3])}`)
  })
  document.querySelectorAll<HTMLElement>('.ranking__row > span:last-child').forEach((node) => {
    const current = node.textContent ?? ''
    if (current === 'No observed value') setText(node, '観測値なし')
    else if (current === 'Δ unavailable') setText(node, 'Δ 利用不可')
  })
  replaceText('.ranking > p', /^No streams are available at this bucket\.$/, 'このバケットで利用できる配信はありません。')

  document.querySelectorAll<HTMLElement>('.reversal-card > span').forEach((node) => {
    const current = node.textContent ?? ''
    const next = current
      .replace(/^Gap before /, '直前の差 ')
      .replace(/^Gap after /, '直後の差 ')
    setText(node, next)
  })

  document.querySelectorAll<HTMLElement>('.secondary-card small').forEach((node) => {
    const current = node.textContent ?? ''
    let next = current
    if (current === 'Selected battle') next = '選択中のバトル'
    else next = current
      .replace(/^Battle score (.+)$/, 'バトルスコア $1')
      .replace(/^Current gap$/, '現在の差')
    const trendMatch = next.match(/^(Closing|Widening|Steady|Unavailable) · (\d+) reversals$/)
    if (trendMatch) next = `${translateLabel(trendMatch[1])} · 逆転${trendMatch[2]}回`
    setText(node, next)
  })

  document.querySelectorAll<HTMLElement>('[data-battle-feed] .event-item > span').forEach((node) => {
    const current = node.textContent ?? ''
    const match = current.match(/^(.* UTC) · (Reversal|Rapid Rise|Gap Collapse|Peak)$/)
    if (match) setText(node, `${match[1]} · ${translateLabel(match[2])}`)
  })

  document.querySelectorAll<HTMLElement>('[data-battle-coverage] p').forEach((node) => {
    const current = node.textContent ?? ''
    setText(node, translateCoverage(current))
  })

  translateFatalStates()
}

function translateCategoryChrome(): void {
  const root = document.querySelector<HTMLElement>('[data-battle-category-preview]')
  if (!root) return
  const label = root.querySelector<HTMLLabelElement>('label')
  if (label) setText(label, 'カテゴリ')
  const select = root.querySelector<HTMLSelectElement>('[data-battle-category-preview-select]')
  if (select) {
    setAttribute(select, 'aria-label', 'Kick Battle Lines カテゴリ')
    for (const option of select.options) {
      const current = option.textContent ?? ''
      let next = current
      if (option.value === 'all') next = 'すべてのカテゴリ'
      else if (current.startsWith('Unknown category · ')) next = current.replace('Unknown category · ', '不明なカテゴリ · ')
      else if (current.startsWith('Unavailable category · ')) next = current.replace('Unavailable category · ', '利用できないカテゴリ · ')
      else next = current.replace(/ viewer-min$/, ' 視聴者・分')
      setText(option, next)
    }
  }
  const status = root.querySelector<HTMLElement>('[data-battle-category-preview-status]')
  if (status) setText(status, translateCategoryStatus(status.textContent ?? ''))
}

function translateCategoryStatus(value: string): string {
  return value
    .replace(/^Loading category coverage…$/, 'カテゴリ観測範囲を読み込み中…')
    .replace(/^Unknown Kick category · (\d+) observed \/ (\d+) partial \/ (\d+) unavailable buckets$/, '不明なKickカテゴリ · $1 観測 / $2 一部 / $3 利用不可バケット')
    .replace(/^Category metadata unavailable · (\d+) observed \/ (\d+) partial \/ (\d+) unavailable buckets · no zero inferred$/, 'カテゴリメタデータを利用できません · $1 観測 / $2 一部 / $3 利用不可バケット · 0として推定しません')
    .replace(/^All categories · (\d+) observed \/ (\d+) partial \/ (\d+) unavailable buckets$/, 'すべてのカテゴリ · $1 観測 / $2 一部 / $3 利用不可バケット')
    .replace(/^Selected category · (\d+) observed \/ (\d+) partial \/ (\d+) unavailable buckets$/, '選択カテゴリ · $1 観測 / $2 一部 / $3 利用不可バケット')
}

function translateChartPresentation(): void {
  const legend = document.querySelector<HTMLElement>('.battle-legend[aria-label]')
  if (legend) setAttribute(legend, 'aria-label', '表示中の配信')
  const chart = document.querySelector<SVGSVGElement>('[data-battle-chart]')
  if (chart) {
    const label = chart.getAttribute('aria-label') ?? ''
    const match = label.match(/^Battle Lines (viewers|indexed) chart\. Use left and right arrow keys to inspect time\.$/)
    if (match) setAttribute(chart, 'aria-label', `Battle Lines ${match[1] === 'viewers' ? '視聴者数' : '指数化'}チャート。左右の矢印キーで時刻を確認できます。`)
  }
  document.querySelectorAll<SVGTextElement>('.battle-markers text').forEach((node) => {
    const current = (node.textContent ?? '').trim()
    if (current === 'Peak') setText(node, 'ピーク')
    else if (current === 'Reversal') setText(node, '逆転')
  })
}

function translateSplitPresentation(): void {
  const head = document.querySelector<HTMLElement>('.battle-split-rail__head small')
  if (head && (head.textContent ?? '').trim() === 'SPLIT INSPECTOR') setText(head, '分割インスペクター')

  document.querySelectorAll<HTMLElement>('.battle-split-value > span').forEach((node) => {
    setText(node, translatePairDetail(node.textContent ?? ''))
  })
  document.querySelectorAll<HTMLElement>('.battle-split-subhead > span').forEach((node) => {
    const current = (node.textContent ?? '').trim()
    const translated = translateLabel(current)
    if (translated !== current) setText(node, translated)
  })
  document.querySelectorAll<HTMLElement>('.battle-split-event > small').forEach((node) => {
    const current = node.textContent ?? ''
    const match = current.match(/^(.* UTC) · (Reversal|Rapid Rise|Gap Collapse|Peak)$/)
    if (match) setText(node, `${match[1]} · ${translateLabel(match[2])}`)
  })
  document.querySelectorAll<HTMLButtonElement>('[data-battle-layout]').forEach((button) => {
    const title = button.title
    if (title === 'Split is available on wider desktop screens.') setAttribute(button, 'title', 'Splitは幅の広いデスクトップ画面で利用できます。')
    else if (title === 'Wide layout') setAttribute(button, 'title', 'ワイド表示')
    else if (title === 'Split layout') setAttribute(button, 'title', '分割表示')
  })
}

function translateFatalStates(): void {
  replaceText('[data-battle-primary] .notice', /^Recommended battle is unavailable because the data request failed\.$/, 'データ取得に失敗したため、推奨バトルを利用できません。')
  document.querySelectorAll<HTMLElement>('[data-battle-stage] .notice').forEach((node) => {
    const current = node.textContent ?? ''
    if (current.startsWith('Battle Lines is unavailable: ')) setText(node, current.replace('Battle Lines is unavailable: ', 'Battle Linesを利用できません: '))
  })
  replaceText('[data-battle-inspector] > p', /^No battle time can be inspected until the API responds\.$/, 'APIが応答するまでバトル時刻を確認できません。')
  replaceText('[data-battle-reversals] .empty-inline', /^Reversals are unavailable\.$/, '逆転データを利用できません。')
  replaceText('[data-battle-secondary] .empty-inline', /^Secondary battles are unavailable\.$/, 'その他のバトルを利用できません。')
  replaceText('[data-battle-feed] .empty-inline', /^Battle events are unavailable\.$/, 'バトルイベントを利用できません。')
  document.querySelectorAll<HTMLElement>('[data-battle-coverage] p').forEach((node) => {
    const current = node.textContent ?? ''
    if (current.endsWith(' Use Refresh to retry.')) setText(node, current.replace(/ Use Refresh to retry\.$/, ' 「更新」で再試行してください。'))
  })
  document.querySelectorAll<HTMLElement>('[data-battle-status] > span').forEach((node) => {
    const current = node.textContent ?? ''
    if (current === 'The API request failed.') setText(node, 'APIリクエストに失敗しました。')
    else if (current === 'Battle Lines API timed out.') setText(node, 'Battle Lines APIがタイムアウトしました。')
    else {
      const match = current.match(/^Battle Lines API did not respond within (\d+) seconds\.$/)
      if (match) setText(node, `Battle Lines APIが${match[1]}秒以内に応答しませんでした。`)
    }
  })
}

function translatePairDetail(value: string): string {
  if (value === 'Δ unavailable') return 'Δ 利用不可'
  const match = value.match(/^(Observed|Offline|Not Observed|Missing|Outside Category|Category Unavailable) · (.+)$/)
  return match ? `${translateLabel(match[1])} · ${match[2]}` : value
}

function translateCoverage(value: string): string {
  let next = value
    .replace(/^Some UTC buckets were not observed\./, '一部のUTCバケットは観測されませんでした。')
    .replace(/^The latest live bucket is delayed\./, '最新のライブバケットは更新が遅れています。')
    .replace(/^Fewer than two comparable streams were observed\./, '比較可能な配信が2件未満でした。')
    .replace(/^This response contains demo-majority rows\./, 'このレスポンスはデモ行が過半数です。')
    .replace(/^The data API failed\./, 'データAPIが失敗しました。')
    .replace(/^The observed window is current\./, '観測期間は最新です。')
    .replace(/ (\d+) of (\d+) buckets are present \(([\d.]+)% missing\)\./, ' $1/$2 バケットがあります（欠損 $3%）。')
    .replace(/Offline, missing, and not-observed are kept separate\./, 'オフライン、欠損、未観測は別状態として保持します。')
    .replace(/ At the selected bucket, /, ' 選択バケットでは、')
    .replace(/Activity \/ heat is unavailable and is not scored\./, 'Activity / heatは利用できず、スコアには含めません。')

  for (const [english, japanese] of [
    ['Not Observed', '未観測'],
    ['Outside Category', 'カテゴリ外'],
    ['Category Unavailable', 'カテゴリ利用不可'],
    ['Observed', '観測'],
    ['Offline', 'オフライン'],
    ['Missing', '欠損'],
  ] as const) {
    next = next.replaceAll(`: ${english}`, `: ${japanese}`)
  }
  return next
}

function translateLabel(value: string): string {
  const normalized = value.trim()
  const labels: Record<string, string> = {
    Complete: '完全',
    Partial: '一部',
    Stale: '更新遅延',
    Empty: 'データなし',
    Error: 'エラー',
    Demo: 'デモ',
    Observed: '観測',
    Offline: 'オフライン',
    'Not Observed': '未観測',
    Missing: '欠損',
    'Outside Category': 'カテゴリ外',
    'Category Unavailable': 'カテゴリ利用不可',
    Closing: '縮小',
    Widening: '拡大',
    Steady: '横ばい',
    Unavailable: '利用不可',
    Tied: '同率',
    Reversal: '逆転',
    'Rapid Rise': '急上昇',
    'Gap Collapse': '差の急縮小',
    Peak: 'ピーク',
    Unknown: '不明',
  }
  return labels[normalized] ?? value
}

function replaceText(selector: string, pattern: RegExp, replacement: string): void {
  document.querySelectorAll<HTMLElement>(selector).forEach((node) => {
    const current = node.textContent ?? ''
    if (!pattern.test(current)) return
    setText(node, current.replace(pattern, replacement))
  })
}
