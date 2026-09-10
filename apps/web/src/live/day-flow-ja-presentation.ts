import { localeFromPathname } from '../i18n/locale'

if (localeFromPathname(window.location.pathname) === 'ja') {
  installJapaneseDayFlowPresentation()
}

function installJapaneseDayFlowPresentation(): void {
  translateDocument()

  const observer = new MutationObserver(() => {
    window.requestAnimationFrame(translateDocument)
  })
  observer.observe(document.body, { childList: true, subtree: true, characterData: true })
}

function translateDocument(): void {
  translateExactText(document.body)
  translateDynamicPatterns()
  translateCategoryChrome()
  translateChartAccessibility()
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
  ['Metric', '指標'],
  ['Range', '期間'],
  ['Bucket', 'バケット'],
  ['Updated', '更新'],
  ['Observed', '観測'],
  ['Coverage', '観測範囲'],
  ['Source', 'ソース'],
  ['Today', '今日'],
  ['Yesterday', '昨日'],
  ['Rolling 24h', '直近24時間'],
  ['Date', '日付'],
  ['Volume', '視聴者数'],
  ['Share', 'シェア'],
  ['Scope', '範囲'],
  ['Full', '全体'],
  ['Top Focus', '上位のみ'],
  ['Layout', '表示'],
  ['Split', '分割'],
  ['Wide', 'ワイド'],
  ['Auto on', '自動更新 ON'],
  ['Auto off', '自動更新 OFF'],
  ['Refresh', '更新'],
  ['Time Focus', '時刻フォーカス'],
  ['Selected bucket · Top 5', '選択バケット · Top 5'],
  ['Selected streamer', '選択中の配信'],
  ['Observed detail', '観測詳細'],
  ['Day summary', '1日の要約'],
  ['Field scale · leadership · movement', '全体規模 · 首位 · 変動'],
  ['Selected time', '選択時刻'],
  ['Top N share', 'Top N内シェア'],
  ['Global share', '全体シェア'],
  ['Leader', '首位'],
  ['Peak viewers', '最大視聴者数'],
  ['Average viewers', '平均視聴者数'],
  ['Viewer-minutes', '視聴者・分'],
  ['Peak share', '最大シェア'],
  ['Biggest rise', '最大上昇'],
  ['First seen', '初回観測'],
  ['Last seen', '最終観測'],
  ['Activity', 'アクティビティ'],
  ['Activity unavailable', 'アクティビティなし'],
  ['Open stream', '配信を開く'],
  ['Open in Battle Lines', 'Battle Linesで開く'],
  ['Highlight only', '選択だけ強調'],
  ['Show all bands', '全バンドを表示'],
  ['Peak leader', 'ピーク時の首位'],
  ['Longest dominance', '最長首位'],
  ['Highest activity', '最大アクティビティ'],
  ['Unavailable', '利用不可'],
  ['Complete', '完全'],
  ['Partial', '一部'],
  ['Stale', '更新遅延'],
  ['Empty', 'データなし'],
  ['Error', 'エラー'],
  ['Start', '開始'],
  ['End', '終了'],
  ['Peak', 'ピーク'],
  ['Rise', '上昇'],
  ['Heat', 'アクティビティ'],
  ['Category', 'カテゴリ'],
  ['All categories', 'すべてのカテゴリ'],
  ['Selected category', '選択カテゴリ'],
  ['Method & limits', '方法と制約'],
])

function translateExactText(root: ParentNode): void {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  const nodes: Text[] = []
  while (walker.nextNode()) nodes.push(walker.currentNode as Text)
  for (const node of nodes) {
    const original = node.nodeValue ?? ''
    const trimmed = original.trim()
    const replacement = EXACT_TEXT.get(trimmed)
    if (!replacement) continue
    node.nodeValue = original.replace(trimmed, replacement)
  }
}

function translateDynamicPatterns(): void {
  replaceText('.status-inline', /^Collector status loading · 5m cadence$/, 'コレクター状態を読み込み中 · 5分間隔')
  replaceText('.dayflow-stage .notice', /^Loading Day Flow from observed snapshots…$/, '観測スナップショットからDay Flowを読み込み中…')
  replaceText('[data-dayflow-time-focus] .notice', /^Loading selected-time ranking…$/, '選択時刻のランキングを読み込み中…')
  replaceText('[data-dayflow-detail] .notice', /^Loading selected streamer details…$/, '選択配信の詳細を読み込み中…')
  replaceText('[data-dayflow-summary] .notice', /^Loading Day Flow summary…$/, 'Day Flowの要約を読み込み中…')
  replaceText('.dayflow-stage .notice', /^No observed Day Flow snapshots for this window\.$/, 'この期間に観測されたDay Flowスナップショットはありません。')
  replaceText('[data-dayflow-time-focus] .notice', /^No observed Day Flow snapshots for this window\.$/, 'この期間に観測されたDay Flowスナップショットはありません。')
  replaceText('[data-dayflow-time-focus] .notice', /^No stream detail is available for this window\.$/, 'この期間の配信詳細はありません。')
  replaceText('[data-dayflow-detail] .notice', /^No stream detail is available for this window\.$/, 'この期間の配信詳細はありません。')
  replaceText('[data-dayflow-time-focus] .notice', /^Selected-time ranking is unavailable\.$/, '選択時刻のランキングを利用できません。')
  replaceText('[data-dayflow-detail] .notice', /^Selected streamer detail is unavailable\.$/, '選択配信の詳細を利用できません。')
  replaceText('[data-dayflow-summary] .notice', /^Day Flow summary is unavailable\.$/, 'Day Flowの要約を利用できません。')
  replaceText('[data-dayflow-coverage]', /^Coverage unavailable$/, '観測範囲を利用できません')

  document.querySelectorAll<HTMLElement>('.head-facts .fact strong').forEach((node) => {
    node.textContent = translateValue(node.textContent ?? '')
  })

  document.querySelectorAll<HTMLElement>('.data-strip__cell').forEach((cell) => {
    for (const node of [...cell.childNodes]) {
      if (node.nodeType !== Node.TEXT_NODE) continue
      const value = node.nodeValue ?? ''
      node.nodeValue = translateValue(value)
    }
  })

  document.querySelectorAll<HTMLElement>('.time-focus-row span').forEach((node) => {
    if ((node.textContent ?? '').trim() === 'new') node.textContent = '新規'
  })

  document.querySelectorAll<HTMLElement>('.stream-detail-head p').forEach((node) => {
    if ((node.textContent ?? '').trim() === 'No observed title') node.textContent = '観測タイトルなし'
  })

  document.querySelectorAll<HTMLElement>('.stream-detail-now span').forEach((node) => {
    node.textContent = (node.textContent ?? '')
      .replace(/^viewers · /, '視聴者 · ')
      .replace(/ global share$/, ' 全体シェア')
  })

  document.querySelectorAll<HTMLElement>('[data-dayflow-coverage] span').forEach((node) => {
    node.textContent = (node.textContent ?? '')
      .replace(/^(\d+)\/(\d+) buckets · Twitch data$/, '$1/$2 バケット · Twitchデータ')
      .replace(/^(\d+)\/(\d+) buckets · Kick data$/, '$1/$2 バケット · Kickデータ')
  })

  document.querySelectorAll<HTMLElement>('[data-dayflow-coverage] strong').forEach((node) => {
    node.textContent = (node.textContent ?? '').replace(/^Coverage: /, '観測範囲: ').replace(/Complete$/, '完全').replace(/Observed$/, '観測').replace(/Partial$/, '一部').replace(/Stale$/, '更新遅延').replace(/Empty$/, 'データなし').replace(/Error$/, 'エラー')
  })

  document.querySelectorAll<HTMLElement>('.notice--error').forEach((node) => {
    const text = node.textContent ?? ''
    if (text.startsWith('Day Flow API unavailable:')) node.textContent = text.replace('Day Flow API unavailable:', 'Day Flow APIを利用できません:')
  })
}

function translateCategoryChrome(): void {
  const root = document.getElementById('dayflow-category-preview-controls')
  if (!root) return
  const label = root.querySelector<HTMLLabelElement>('label')
  if (label) label.textContent = 'カテゴリ'
  const select = root.querySelector<HTMLSelectElement>('select')
  if (select) {
    select.setAttribute('aria-label', `${document.body.dataset.provider === 'kick' ? 'Kick' : 'Twitch'} Day Flow カテゴリ`)
    for (const option of select.options) {
      if (option.value === 'all') option.textContent = 'すべてのカテゴリ'
      else if (option.textContent?.startsWith('Unknown category · ')) option.textContent = option.textContent.replace('Unknown category · ', '不明なカテゴリ · ')
      else if (option.textContent?.startsWith('Unavailable category · ')) option.textContent = option.textContent.replace('Unavailable category · ', '利用できないカテゴリ · ')
      else option.textContent = option.textContent?.replace(/ viewer-min$/, ' 視聴者・分') ?? ''
    }
  }
  const status = root.querySelector<HTMLElement>('.dayflow-category-preview__status')
  if (status) {
    status.textContent = translateCategoryStatus(status.textContent ?? '')
  }
  const strip = document.querySelector<HTMLElement>('.dayflow-category-coverage-strip')
  if (strip) strip.setAttribute('aria-label', 'Day Flowバケットごとのカテゴリメタデータ観測範囲')
}

function translateCategoryStatus(value: string): string {
  return value
    .replace(/^Loading category coverage…$/, 'カテゴリ観測範囲を読み込み中…')
    .replace(/^Unknown (Twitch|Kick) category · coverage (\d+) observed \/ (\d+) partial \/ (\d+) unavailable buckets$/, '不明な$1カテゴリ · 観測範囲 $2 観測 / $3 一部 / $4 利用不可バケット')
    .replace(/^Category metadata unavailable · (\d+) unavailable buckets · no zero inferred$/, 'カテゴリメタデータを利用できません · $1 利用不可バケット · 0として推定しません')
    .replace(/^All categories · (\d+) observed \/ (\d+) partial \/ (\d+) unavailable buckets$/, 'すべてのカテゴリ · $1 観測 / $2 一部 / $3 利用不可バケット')
    .replace(/^Selected category · (\d+) observed \/ (\d+) partial \/ (\d+) unavailable buckets$/, '選択カテゴリ · $1 観測 / $2 一部 / $3 利用不可バケット')
}

function translateChartAccessibility(): void {
  const chart = document.querySelector<SVGSVGElement>('[data-dayflow-chart]')
  if (chart) chart.setAttribute('aria-label', 'Day Flow 視聴者推移の積み上げ表示')
  document.querySelectorAll<SVGElement>('[data-dayflow-band][aria-label]').forEach((band) => {
    const label = band.getAttribute('aria-label') ?? ''
    if (label.startsWith('Select ')) band.setAttribute('aria-label', `選択 ${label.slice('Select '.length)}`)
  })
}

function replaceText(selector: string, pattern: RegExp, replacement: string): void {
  document.querySelectorAll<HTMLElement>(selector).forEach((node) => {
    const current = node.textContent ?? ''
    if (pattern.test(current)) node.textContent = current.replace(pattern, replacement)
  })
}

function translateValue(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return value
  const exact = EXACT_TEXT.get(trimmed)
  if (exact) return value.replace(trimmed, exact)
  return value
    .replace(/^(\d+) minutes$/, '$1分')
    .replace(/^(\d+) streams \+ Others$/, '$1配信 + その他')
    .replace(/^(\d+)\/(\d+) buckets$/, '$1/$2バケット')
    .replace(/^Rolling 24h$/, '直近24時間')
    .replace(/^Yesterday$/, '昨日')
    .replace(/^Today$/, '今日')
}
