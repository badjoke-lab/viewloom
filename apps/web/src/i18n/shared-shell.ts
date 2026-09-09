import type { Locale } from './locale'

type Params = Record<string, string | number>

const en = {
  'nav.portal': 'Portal',
  'nav.twitch': 'Twitch data',
  'nav.kick': 'Kick data',
  'nav.changelog': 'Changelog',
  'nav.about': 'About',
  'nav.support': 'Support',
  'brand.portal': 'Platform-separated observatory',
  'brand.twitch': 'Twitch observation',
  'brand.kick': 'Kick observation',
  'aria.portal': 'ViewLoom Portal',
  'aria.globalNav': 'Global navigation',
  'aria.openNav': 'Open navigation',
  'aria.closeNav': 'Close navigation',
  'aria.footerNav': 'Footer navigation',
  'footer.disclaimer': 'ViewLoom is independent and unofficial. It is not affiliated with, endorsed by, or sponsored by Twitch or Kick. Twitch and Kick are trademarks of their respective owners.',
  'footer.method': 'Method & limits',
  'footer.contact': 'Contact',
  'footer.terms': 'Terms',
  'footer.privacy': 'Privacy',
  'footer.refund': 'Refund policy',
  'footer.commercial': 'Commercial disclosure',
} as const

export type SharedShellMessageKey = keyof typeof en

const ja: Record<SharedShellMessageKey, string> = {
  'nav.portal': 'ポータル',
  'nav.twitch': 'Twitchデータ',
  'nav.kick': 'Kickデータ',
  'nav.changelog': '更新履歴',
  'nav.about': 'このサイトについて',
  'nav.support': 'サポート',
  'brand.portal': 'プラットフォーム別の配信観測',
  'brand.twitch': 'Twitch観測',
  'brand.kick': 'Kick観測',
  'aria.portal': 'ViewLoomポータル',
  'aria.globalNav': 'グローバルナビゲーション',
  'aria.openNav': 'ナビゲーションを開く',
  'aria.closeNav': 'ナビゲーションを閉じる',
  'aria.footerNav': 'フッターナビゲーション',
  'footer.disclaimer': 'ViewLoomは独立した非公式の観測サイトです。TwitchまたはKickとの提携、承認、スポンサー関係はありません。TwitchとKickは各権利者の商標です。',
  'footer.method': '方法と制約',
  'footer.contact': 'お問い合わせ',
  'footer.terms': '利用規約',
  'footer.privacy': 'プライバシー',
  'footer.refund': '返金ポリシー',
  'footer.commercial': '特定商取引法に基づく表記',
}

const catalogs: Record<Locale, Record<SharedShellMessageKey, string>> = { en, ja }

export function sharedShellText(locale: Locale, key: SharedShellMessageKey, params: Params = {}): string {
  return catalogs[locale][key].replace(/\{(\w+)\}/g, (_, name: string) => String(params[name] ?? `{${name}}`))
}
