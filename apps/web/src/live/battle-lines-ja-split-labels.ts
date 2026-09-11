import { localeFromPathname } from '../i18n/locale'

if (localeFromPathname(window.location.pathname) === 'ja') {
  const labels = new Map([
    ['Selected time', '選択時刻'],
    ['Leader at selected time', '選択時刻の首位'],
    ['Gap at selected time', '選択時刻の差'],
    ['Gap trend', '差の傾向'],
    ['Latest reversal', '直近の逆転'],
  ])

  const translate = () => {
    document.querySelectorAll<HTMLElement>('.battle-split-value small').forEach((node) => {
      const current = (node.textContent ?? '').trim()
      const next = labels.get(current)
      if (next && node.textContent !== next) node.textContent = next
    })
  }

  translate()
  new MutationObserver(translate).observe(document.body, { childList: true, subtree: true })
}
