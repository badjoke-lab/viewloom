import './shared-shell.css'
import './quality-u10e-responsive.css'
import { localeFromPathname, stripLocalePrefix, type Locale } from './i18n/locale'
import { localizeAvailableHref } from './i18n/route'
import { sharedShellText, type SharedShellMessageKey } from './i18n/shared-shell'

type ShellProvider = 'portal' | 'twitch' | 'kick'
type ShellStatusState = 'loading' | 'fresh' | 'partial' | 'unavailable'

type NavItem = {
  href: string
  label: SharedShellMessageKey
  current: (path: string, provider: ShellProvider) => boolean
}

const navItems: NavItem[] = [
  { href: '/', label: 'nav.portal', current: (path, provider) => path === '/' && provider === 'portal' },
  { href: '/twitch/', label: 'nav.twitch', current: (_path, provider) => provider === 'twitch' },
  { href: '/kick/', label: 'nav.kick', current: (_path, provider) => provider === 'kick' },
  { href: '/changelog/', label: 'nav.changelog', current: (path) => path.startsWith('/changelog/') },
  { href: '/about/', label: 'nav.about', current: (path) => path.startsWith('/about/') },
  { href: '/support/', label: 'nav.support', current: (path) => path.startsWith('/support/') },
]

export function installSharedShell(): void {
  const frame = document.querySelector<HTMLElement>('.site-frame')
  const masthead = document.querySelector<HTMLElement>('.masthead')
  const nav = document.querySelector<HTMLElement>('.global-nav')
  const footer = document.querySelector<HTMLElement>('.footer')
  if (!frame || !masthead || !nav || !footer) return

  const locale = localeFromPathname(window.location.pathname)
  const provider = shellProvider()
  const path = normalizedPath(stripLocalePrefix(window.location.pathname))
  document.body.dataset.sharedShellReady = 'true'
  masthead.dataset.shellProvider = provider
  normalizeBrand(provider, locale)
  normalizeNavigation(nav, provider, path, locale)
  normalizeMobileNavigation(masthead, nav, locale)
  normalizeStatus(document.querySelector<HTMLElement>('.status-inline'))
  normalizeFooter(footer, locale)
}

export function setSharedShellStatus(status: HTMLElement | null, text: string, state: ShellStatusState): void {
  if (!status) return
  status.setAttribute('role', 'status')
  status.setAttribute('aria-live', 'polite')
  status.setAttribute('aria-atomic', 'true')
  status.dataset.state = state
  const dot = document.createElement('span')
  dot.className = 'dot'
  dot.setAttribute('aria-hidden', 'true')
  status.replaceChildren(dot, document.createTextNode(text))
}

export function syncSharedShellStatus(status: HTMLElement | null): void {
  if (!status) return
  const text = status.textContent?.trim() ?? ''
  setSharedShellStatus(status, text, inferStatusState(text))
}

function shellProvider(): ShellProvider {
  if (document.body.dataset.provider === 'twitch') return 'twitch'
  if (document.body.dataset.provider === 'kick') return 'kick'
  return 'portal'
}

function normalizedPath(path: string): string {
  if (path === '/') return '/'
  return path.endsWith('/') ? path : `${path}/`
}

function normalizeBrand(provider: ShellProvider, locale: Locale): void {
  const brand = document.querySelector<HTMLAnchorElement>('.brand')
  if (!brand) return
  brand.href = localizeAvailableHref('/', locale)
  brand.setAttribute('aria-label', sharedShellText(locale, 'aria.portal'))
  const context = brand.querySelector<HTMLElement>('small')
  if (!context) return
  context.textContent = sharedShellText(locale, provider === 'twitch' ? 'brand.twitch' : provider === 'kick' ? 'brand.kick' : 'brand.portal')
}

function normalizeNavigation(nav: HTMLElement, provider: ShellProvider, path: string, locale: Locale): void {
  nav.id = 'viewloom-global-navigation'
  nav.setAttribute('aria-label', sharedShellText(locale, 'aria.globalNav'))
  const fragment = document.createDocumentFragment()
  for (const item of navItems) {
    const link = document.createElement('a')
    link.href = localizeAvailableHref(item.href, locale)
    link.textContent = sharedShellText(locale, item.label)
    if (item.current(path, provider)) link.setAttribute('aria-current', 'page')
    fragment.append(link)
  }
  nav.replaceChildren(fragment)
}

function normalizeMobileNavigation(masthead: HTMLElement, nav: HTMLElement, locale: Locale): void {
  const original = masthead.querySelector<HTMLButtonElement>('[data-mobile-menu]')
  if (!original) return
  const menu = original.cloneNode(true) as HTMLButtonElement
  original.replaceWith(menu)
  menu.type = 'button'
  menu.setAttribute('aria-controls', nav.id)

  const setOpen = (open: boolean) => {
    nav.classList.toggle('is-open', open)
    menu.setAttribute('aria-expanded', String(open))
    menu.setAttribute('aria-label', sharedShellText(locale, open ? 'aria.closeNav' : 'aria.openNav'))
  }

  setOpen(false)
  menu.addEventListener('click', () => setOpen(!nav.classList.contains('is-open')))
  nav.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setOpen(false)))
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || !nav.classList.contains('is-open')) return
    setOpen(false)
    menu.focus()
  })
  document.addEventListener('pointerdown', (event) => {
    if (!nav.classList.contains('is-open')) return
    const target = event.target
    if (!(target instanceof Node)) return
    if (nav.contains(target) || menu.contains(target)) return
    setOpen(false)
  })
  const desktop = window.matchMedia('(min-width: 761px)')
  const closeForDesktop = (event: MediaQueryListEvent | MediaQueryList) => {
    if (event.matches) setOpen(false)
  }
  desktop.addEventListener('change', closeForDesktop)
  closeForDesktop(desktop)
}

function normalizeStatus(status: HTMLElement | null): void {
  if (status) syncSharedShellStatus(status)
}

function inferStatusState(text: string): ShellStatusState {
  const normalized = text.toLowerCase()
  if (normalized.includes('loading') || normalized.includes('読み込')) return 'loading'
  if (
    normalized.includes('partial')
    || normalized.includes('stale')
    || normalized.includes('limited')
    || normalized.includes('no data')
    || normalized.includes('一部取得')
    || normalized.includes('更新遅延')
    || normalized.includes('データなし')
  ) return 'partial'
  if (
    normalized.includes('unavailable')
    || normalized.includes('failed')
    || normalized.includes('error')
    || normalized.includes('利用不可')
    || normalized.includes('失敗')
    || normalized.includes('エラー')
  ) return 'unavailable'
  return 'fresh'
}

function normalizeFooter(footer: HTMLElement, locale: Locale): void {
  let disclaimer = footer.querySelector<HTMLElement>('.footer__disclaimer')
  if (!disclaimer) {
    disclaimer = document.createElement('div')
    disclaimer.className = 'footer__disclaimer'
    footer.prepend(disclaimer)
  }
  disclaimer.textContent = sharedShellText(locale, 'footer.disclaimer')

  let nav = footer.querySelector<HTMLElement>('nav')
  if (!nav) {
    nav = document.createElement('nav')
    footer.append(nav)
  }
  nav.setAttribute('aria-label', sharedShellText(locale, 'aria.footerNav'))
  nav.replaceChildren(
    footerLink('/changelog/', sharedShellText(locale, 'nav.changelog'), locale),
    footerLink('/about/', sharedShellText(locale, 'footer.method'), locale),
    footerLink('/support/', sharedShellText(locale, 'nav.support'), locale),
    footerLink('/contact/', sharedShellText(locale, 'footer.contact'), locale),
    footerLink('/terms/', sharedShellText(locale, 'footer.terms'), locale),
    footerLink('/privacy/', sharedShellText(locale, 'footer.privacy'), locale),
    footerLink('/refund-policy/', sharedShellText(locale, 'footer.refund'), locale),
    footerLink('/commercial-disclosure/', sharedShellText(locale, 'footer.commercial'), locale),
    footerLink('https://github.com/badjoke-lab/viewloom', 'GitHub', locale, true),
  )
}

function footerLink(href: string, label: string, locale: Locale, external = false): HTMLAnchorElement {
  const link = document.createElement('a')
  link.href = external ? href : localizeAvailableHref(href, locale)
  link.textContent = label
  if (external) {
    link.target = '_blank'
    link.rel = 'noreferrer'
  }
  return link
}
