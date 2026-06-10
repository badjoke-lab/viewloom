import './shared-shell.css'

type Provider = 'portal' | 'twitch' | 'kick'
type CurrentSection = 'portal' | 'twitch' | 'kick' | 'about' | 'support' | 'other'

const CONTACT_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSdhreuxEz7w0eSjslTyVLL-axV6IJdTp5RU5VXCM3ApIz35-Q/viewform?usp=dialog'
const GITHUB_URL = 'https://github.com/badjoke-lab/viewloom'

const page = document.body.dataset.page ?? ''
const provider = detectProvider(page, window.location.pathname)
const currentSection = detectSection(page, window.location.pathname)

document.body.dataset.provider = provider

installSharedShell()

function installSharedShell(): void {
  const apply = (): boolean => {
    const root = document.querySelector<HTMLElement>('.page-shell') ?? document.querySelector<HTMLElement>('#app > *')
    if (!root) return false

    replaceHeader(root)
    replaceFooter(root)
    return true
  }

  if (apply()) return

  const observer = new MutationObserver(() => {
    if (!apply()) return
    observer.disconnect()
  })

  observer.observe(document.body, { childList: true, subtree: true })
}

function replaceHeader(root: HTMLElement): void {
  if (root.querySelector('.vl-masthead')) return

  const existingHeader = root.querySelector<HTMLElement>('header.site-header, header.landing-header, header')
  const header = document.createElement('header')
  header.className = 'vl-masthead'
  header.innerHTML = `
    <div class="vl-masthead__inner">
      <a class="vl-brand" href="/" aria-label="ViewLoom portal">
        <span class="vl-brand__mark">VL</span>
        <span class="vl-brand__text">ViewLoom<small>Live data observatory</small></span>
      </a>
      <nav class="vl-global-nav" aria-label="Platform navigation">
        ${navLink('/', 'Portal', currentSection === 'portal')}
        ${navLink('/twitch/', 'Twitch data', currentSection === 'twitch')}
        ${navLink('/kick/', 'Kick data', currentSection === 'kick')}
      </nav>
      <nav class="vl-utility-nav" aria-label="Site navigation">
        ${navLink('/about/', 'About', currentSection === 'about')}
        ${navLink('/support/', '♡ Support', currentSection === 'support', 'vl-shell-link--support')}
        ${externalLink(CONTACT_URL, 'Contact', 'vl-shell-link')}
      </nav>
      <details class="vl-mobile-menu">
        <summary>Menu</summary>
        <nav class="vl-mobile-menu__panel" aria-label="Mobile navigation">
          <a href="/">Portal</a>
          <a href="/twitch/">Twitch data</a>
          <a href="/kick/">Kick data</a>
          <a href="/about/">About</a>
          <a href="/support/">♡ Support</a>
          ${externalLink(CONTACT_URL, 'Contact')}
          ${externalLink(GITHUB_URL, 'GitHub')}
        </nav>
      </details>
    </div>`

  if (existingHeader) existingHeader.replaceWith(header)
  else root.prepend(header)
}

function replaceFooter(root: HTMLElement): void {
  const existingFooter = root.querySelector<HTMLElement>('footer.landing-footer, footer.vl-footer, footer')
  const footer = document.createElement('footer')
  footer.className = 'vl-footer'
  footer.innerHTML = `
    <div>ViewLoom · Independent, unofficial observation of public live-stream data.</div>
    <nav aria-label="Footer navigation">
      <a href="/about/">About</a>
      <a href="/support/">♡ Support</a>
      ${externalLink(CONTACT_URL, 'Contact')}
      ${externalLink(GITHUB_URL, 'GitHub')}
    </nav>`

  if (existingFooter) {
    existingFooter.replaceWith(footer)
    return
  }

  const main = root.querySelector<HTMLElement>('main')
  if (main) main.insertAdjacentElement('afterend', footer)
  else root.append(footer)
}

function navLink(href: string, label: string, current: boolean, extraClass = ''): string {
  return `<a class="vl-shell-link ${extraClass}" href="${href}"${current ? ' aria-current="page"' : ''}>${label}</a>`
}

function externalLink(href: string, label: string, className = ''): string {
  const classAttr = className ? ` class="${className}"` : ''
  return `<a${classAttr} href="${href}" target="_blank" rel="noreferrer">${label}</a>`
}

function detectProvider(pageName: string, pathname: string): Provider {
  if (pageName.startsWith('twitch') || pathname.startsWith('/twitch/')) return 'twitch'
  if (pageName.startsWith('kick') || pathname.startsWith('/kick/')) return 'kick'
  return 'portal'
}

function detectSection(pageName: string, pathname: string): CurrentSection {
  if (pageName === 'portal' || pathname === '/') return 'portal'
  if (pageName === 'about' || pathname.startsWith('/about/')) return 'about'
  if (pageName === 'support' || pathname.startsWith('/support/')) return 'support'
  if (pageName.startsWith('twitch') || pathname.startsWith('/twitch/')) return 'twitch'
  if (pageName.startsWith('kick') || pathname.startsWith('/kick/')) return 'kick'
  return 'other'
}
