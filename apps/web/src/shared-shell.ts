import './shared-shell.css'
import './quality-u10e-responsive.css'

type ShellProvider = 'portal' | 'twitch' | 'kick'
type ShellStatusState = 'loading' | 'fresh' | 'partial' | 'unavailable'

type NavItem = {
  href: string
  label: string
  current: (path: string, provider: ShellProvider) => boolean
}

const navItems: NavItem[] = [
  { href: '/', label: 'Portal', current: (path, provider) => path === '/' && provider === 'portal' },
  { href: '/twitch/', label: 'Twitch data', current: (_path, provider) => provider === 'twitch' },
  { href: '/kick/', label: 'Kick data', current: (_path, provider) => provider === 'kick' },
  { href: '/changelog/', label: 'Changelog', current: (path) => path.startsWith('/changelog/') },
  { href: '/about/', label: 'About', current: (path) => path.startsWith('/about/') },
  { href: '/support/', label: 'Support', current: (path) => path.startsWith('/support/') },
]

const footerDisclaimer = 'ViewLoom is independent and unofficial. It is not affiliated with, endorsed by, or sponsored by Twitch or Kick. Twitch and Kick are trademarks of their respective owners.'

export function installSharedShell(): void {
  const frame = document.querySelector<HTMLElement>('.site-frame')
  const masthead = document.querySelector<HTMLElement>('.masthead')
  const nav = document.querySelector<HTMLElement>('.global-nav')
  const footer = document.querySelector<HTMLElement>('.footer')
  if (!frame || !masthead || !nav || !footer) return

  const provider = shellProvider()
  const path = normalizedPath(window.location.pathname)
  document.body.dataset.sharedShellReady = 'true'
  masthead.dataset.shellProvider = provider
  normalizeBrand(provider)
  normalizeNavigation(nav, provider, path)
  normalizeMobileNavigation(masthead, nav)
  normalizeStatus(document.querySelector<HTMLElement>('.status-inline'))
  normalizeFooter(footer)
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

function normalizeBrand(provider: ShellProvider): void {
  const brand = document.querySelector<HTMLAnchorElement>('.brand')
  if (!brand) return
  brand.href = '/'
  brand.setAttribute('aria-label', 'ViewLoom Portal')
  const context = brand.querySelector<HTMLElement>('small')
  if (!context) return
  context.textContent = provider === 'twitch'
    ? 'Twitch observation'
    : provider === 'kick'
      ? 'Kick observation'
      : 'Platform-separated observatory'
}

function normalizeNavigation(nav: HTMLElement, provider: ShellProvider, path: string): void {
  nav.id = 'viewloom-global-navigation'
  nav.setAttribute('aria-label', 'Global navigation')
  const fragment = document.createDocumentFragment()
  for (const item of navItems) {
    const link = document.createElement('a')
    link.href = item.href
    link.textContent = item.label
    if (item.current(path, provider)) link.setAttribute('aria-current', 'page')
    fragment.append(link)
  }
  nav.replaceChildren(fragment)
}

function normalizeMobileNavigation(masthead: HTMLElement, nav: HTMLElement): void {
  const original = masthead.querySelector<HTMLButtonElement>('[data-mobile-menu]')
  if (!original) return
  const menu = original.cloneNode(true) as HTMLButtonElement
  original.replaceWith(menu)
  menu.type = 'button'
  menu.setAttribute('aria-controls', nav.id)

  const setOpen = (open: boolean) => {
    nav.classList.toggle('is-open', open)
    menu.setAttribute('aria-expanded', String(open))
    menu.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation')
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
  if (normalized.includes('loading')) return 'loading'
  if (
    normalized.includes('partial')
    || normalized.includes('stale')
    || normalized.includes('limited')
    || normalized.includes('no data')
  ) return 'partial'
  if (normalized.includes('unavailable') || normalized.includes('failed') || normalized.includes('error')) return 'unavailable'
  return 'fresh'
}

function normalizeFooter(footer: HTMLElement): void {
  const existingContact = [...footer.querySelectorAll<HTMLAnchorElement>('a')].find((link) => link.textContent?.trim() === 'Contact')
  let disclaimer = footer.querySelector<HTMLElement>('.footer__disclaimer')
  if (!disclaimer) {
    disclaimer = document.createElement('div')
    disclaimer.className = 'footer__disclaimer'
    footer.prepend(disclaimer)
  }
  disclaimer.textContent = footerDisclaimer

  let nav = footer.querySelector<HTMLElement>('nav')
  if (!nav) {
    nav = document.createElement('nav')
    footer.append(nav)
  }
  nav.setAttribute('aria-label', 'Footer navigation')
  nav.replaceChildren(
    footerLink('/changelog/', 'Changelog'),
    footerLink('/about/', 'Method & limits'),
    footerLink('/support/', 'Support'),
    ...(existingContact ? [footerLink(existingContact.href, 'Contact', true)] : []),
    footerLink('https://github.com/badjoke-lab/viewloom', 'GitHub', true),
  )
}

function footerLink(href: string, label: string, external = false): HTMLAnchorElement {
  const link = document.createElement('a')
  link.href = href
  link.textContent = label
  if (external) {
    link.target = '_blank'
    link.rel = 'noreferrer'
  }
  return link
}
