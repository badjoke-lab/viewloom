import type { Locale } from './locale'

type Params = Record<string, string | number>

const en = {
  'provider.loadError': '{name} data could not be loaded. {message}',
  'provider.unavailable': 'Unavailable',
  'provider.updateFailed': 'Update failed',
  'provider.noObservedStream': 'No observed stream',
  'coverage.error': '{name} data is unavailable. Open Status for details.',
  'coverage.twitchFallback': 'Top 300 observed window. More live streams may exist beyond it.',
  'coverage.kickFallback': 'Top 100 observed candidates. Not provider-wide directory coverage.',
  'next.heatmap': 'Explore the current field in Heatmap',
  'state.fresh': 'Fresh',
  'state.partial': 'Limited',
  'state.stale': 'Delayed',
  'state.empty': 'No data',
  'state.demo': 'Demo',
  'state.error': 'Unavailable',
  'time.justNow': 'Just now',
  'time.minutesAgo': '{value}m ago',
  'time.hoursAgo': '{value}h ago',
  'time.daysAgo': '{value}d ago',
  'time.nowShort': 'now',
  'time.minutesShort': '{value}m',
  'time.hoursShort': '{value}h',
  'time.daysShort': '{value}d',
} as const

export type PortalMessageKey = keyof typeof en

const ja: Record<PortalMessageKey, string> = {
  'provider.loadError': '{name}データを読み込めませんでした。{message}',
  'provider.unavailable': '利用不可',
  'provider.updateFailed': '更新失敗',
  'provider.noObservedStream': '観測配信なし',
  'coverage.error': '{name}データを利用できません。詳細はData Statusで確認してください。',
  'coverage.twitchFallback': 'Top 300の観測範囲です。これより多くのライブ配信が存在する場合があります。',
  'coverage.kickFallback': 'Top 100の観測候補です。プラットフォーム全体のディレクトリ網羅を意味しません。',
  'next.heatmap': 'Heatmapで現在の勢力を見る',
  'state.fresh': '最新',
  'state.partial': '一部取得',
  'state.stale': '更新遅延',
  'state.empty': 'データなし',
  'state.demo': 'デモ',
  'state.error': '利用不可',
  'time.justNow': 'たった今',
  'time.minutesAgo': '{value}分前',
  'time.hoursAgo': '{value}時間前',
  'time.daysAgo': '{value}日前',
  'time.nowShort': '現在',
  'time.minutesShort': '{value}分',
  'time.hoursShort': '{value}時間',
  'time.daysShort': '{value}日',
}

const catalogs: Record<Locale, Record<PortalMessageKey, string>> = { en, ja }

export function portalText(locale: Locale, key: PortalMessageKey, params: Params = {}): string {
  return catalogs[locale][key].replace(/\{(\w+)\}/g, (_, name: string) => String(params[name] ?? `{${name}}`))
}
