import './mock-shared-pages.css'

type Provider = 'portal' | 'twitch' | 'kick'
const page = document.body.dataset.page ?? ''
const provider: Provider = page.startsWith('twitch') ? 'twitch' : page.startsWith('kick') ? 'kick' : 'portal'
document.body.dataset.provider = provider

const section = page === 'portal' ? 'portal' : page === 'about' ? 'about' : page === 'support' ? 'support' : provider

mountShell()

function mountShell(): void {
  const apply = (): boolean => {
    const root = document.querySelector<HTMLElement>('.site-frame, .page-shell, #app > *')
    if (!root) return false
    root.classList.add('site-frame')
    const oldHeader = root.querySelector<HTMLElement>('header')
    const header = document.createElement('header')
    header.className = 'masthead'
    header.innerHTML = `<div class="masthead__inner"><a class="brand" href="/"><span class="brand-mark">VL</span><span>ViewLoom<small>Live data observatory</small></span></a><nav class="global-nav"><a href="/"${section === 'portal' ? ' aria-current="page"' : ''}>Portal</a><a href="/twitch/"${section === 'twitch' ? ' aria-current="page"' : ''}>Twitch data</a><a href="/kick/"${section === 'kick' ? ' aria-current="page"' : ''}>Kick data</a><a href="/about/"${section === 'about' ? ' aria-current="page"' : ''}>About</a><a href="/support/"${section === 'support' ? ' aria-current="page"' : ''}>Support</a></nav><div class="status-inline"><span class="dot"></span>Collectors healthy · 5m cadence</div><button class="mobile-menu mobile-only" data-mobile-menu type="button" aria-label="Open navigation">Menu</button></div>`
    oldHeader ? oldHeader.replaceWith(header) : root.prepend(header)
    const oldFooter = root.querySelector<HTMLElement>('footer')
    const footer = document.createElement('footer')
    footer.className = 'footer'
    footer.innerHTML = `<div>ViewLoom · Independent, unofficial observation of public live-stream data.</div><nav><a href="/about/">Method & limits</a><a href="/support/">Support</a><a href="https://github.com/badjoke-lab/viewloom" target="_blank" rel="noreferrer">GitHub</a></nav>`
    oldFooter ? oldFooter.replaceWith(footer) : root.append(footer)
    const button = header.querySelector<HTMLButtonElement>('[data-mobile-menu]')
    const nav = header.querySelector<HTMLElement>('.global-nav')
    button?.addEventListener('click', () => nav?.classList.toggle('is-open'))
    return true
  }
  if (apply()) return
  const observer = new MutationObserver(() => { if (apply()) observer.disconnect() })
  observer.observe(document.body, { childList: true, subtree: true })
}
