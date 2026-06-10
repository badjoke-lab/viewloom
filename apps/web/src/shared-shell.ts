import './shared-shell.css'

type Provider = 'portal' | 'twitch' | 'kick'
type CurrentSection = 'portal' | 'twitch' | 'kick' | 'about' | 'support' | 'other'

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
    void hydrateCollectorStatus(root)
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
  const existingHeader = root.querySelector<HTMLElement>('header.vl-masthead, header.site-header, header.landing-header, header')
  const header = document.createElement('header')
  header.className = 'vl-masthead'
  header.innerHTML = `
    <div class="vl-masthead__inner">
      <a class="vl-brand" href="/" aria-label="ViewLoom portal">
        <span class="vl-brand__mark">VL</span>
        <span class="vl-brand__text">ViewLoom<small>Live data observatory</small></span>
      </a>
      <nav class="vl-global-nav" aria-label="Primary navigation">
        ${navLink('/', 'Portal', currentSection === 'portal')}
        ${navLink('/twitch/', 'Twitch data', currentSection === 'twitch')}
        ${navLink('/kick/', 'Kick data', currentSection === 'kick')}
        ${navLink('/about/', 'About', currentSection === 'about')}
        ${navLink('/support/', 'Support', currentSection === 'support')}
      </nav>
      <div class="vl-collector-status" id="vl-collector-status" data-tone="healthy">
        <span class="vl-collector-status__dot" aria-hidden="true"></span>
        <span>Checking collectors · 5m cadence</span>
      </div>
      <button class="vl-mobile-menu" type="button" aria-label="Open navigation" aria-expanded="false">Menu</button>
    </div>`

  if (existingHeader) existingHeader.replaceWith(header)
  else root.prepend(header)

  const button = header.querySelector<HTMLButtonElement>('.vl-mobile-menu')
  const nav = header.querySelector<HTMLElement>('.vl-global-nav')
  button?.addEventListener('click', () => {
    const open = nav?.classList.toggle('is-open') ?? false
    button.setAttribute('aria-expanded', String(open))
  })
}

function replaceFooter(root: HTMLElement): void {
  const existingFooter = root.querySelector<HTMLElement>('footer.vl-footer, footer.landing-footer, footer')
  const footer = document.createElement('footer')
  footer.className = 'vl-footer'
  footer.innerHTML = `
    <div>ViewLoom · Independent, unofficial observation of public live-stream data.</div>
    <nav aria-label="Footer navigation">
      <a href="/about/">Method & limits</a>
      <a href="/support/">Support</a>
      <a href="https://github.com/badjoke-lab/viewloom" target="_blank" rel="noreferrer">GitHub</a>
    </nav>`

  if (existingFooter) existingFooter.replaceWith(footer)
  else root.append(footer)
}

async function hydrateCollectorStatus(root: HTMLElement): Promise<void> {
  const status = root.querySelector<HTMLElement>('#vl-collector-status')
  if (!status || status.dataset.hydrated === 'true') return
  status.dataset.hydrated = 'true'

  try {
    const responses = await Promise.allSettled([
      fetch('/api/twitch-status', { cache: 'no-store' }).then((response) => response.json()),
      fetch('/api/kick-status', { cache: 'no-store' }).then((response) => response.json()),
    ])

    const states = responses.map((result) => result.status === 'fulfilled' ? String(result.value?.state ?? '').toLowerCase() : 'error')
    const hasError = states.some((state) => ['error', 'failed', 'unconfigured'].includes(state))
    const hasWarning = states.some((state) => ['partial', 'stale', 'strong_stale', 'demo', 'empty'].includes(state))

    status.dataset.tone = hasError ? 'error' : hasWarning ? 'warning' : 'healthy'
    const label = status.querySelector<HTMLElement>('span:last-child')
    if (label) label.textContent = hasError
      ? 'Collector issue · 5m cadence'
      : hasWarning
        ? 'Collectors reporting limits · 5m cadence'
        : 'Collectors healthy · 5m cadence'
  } catch {
    status.dataset.tone = 'warning'
    const label = status.querySelector<HTMLElement>('span:last-child')
    if (label) label.textContent = 'Collector status unavailable · 5m cadence'
  }
}

function navLink(href: string, label: string, current: boolean): string {
  return `<a class="vl-shell-link" href="${href}"${current ? ' aria-current="page"' : ''}>${label}</a>`
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
