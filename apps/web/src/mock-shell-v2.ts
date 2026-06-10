import './mock-shell.css'

const page = document.body.dataset.page ?? ''
const provider = page.startsWith('twitch') ? 'twitch' : page.startsWith('kick') ? 'kick' : 'portal'
const current = page === 'portal' ? 'portal' : page === 'about' ? 'about' : page === 'support' ? 'support' : provider

document.body.dataset.provider = provider

function install(): boolean {
  const root = document.querySelector<HTMLElement>('.page-shell, #app > *')
  if (!root) return false
  root.classList.add('site-frame')

  const header = document.createElement('header')
  header.className = 'masthead'
  header.innerHTML = `<div class="masthead__inner"><a class="brand" href="/"><span class="brand-mark">VL</span><span>ViewLoom<small>Live data observatory</small></span></a><nav class="global-nav"><a href="/"${current === 'portal' ? ' aria-current="page"' : ''}>Portal</a><a href="/twitch/"${current === 'twitch' ? ' aria-current="page"' : ''}>Twitch data</a><a href="/kick/"${current === 'kick' ? ' aria-current="page"' : ''}>Kick data</a><a href="/about/"${current === 'about' ? ' aria-current="page"' : ''}>About</a><a href="/support/"${current === 'support' ? ' aria-current="page"' : ''}>Support</a></nav><div class="status-inline"><span class="dot"></span>Collectors healthy · 5m cadence</div><button class="mobile-menu mobile-only" type="button">Menu</button></div>`
  const oldHeader = root.querySelector('header')
  if (oldHeader) oldHeader.replaceWith(header)
  else root.prepend(header)

  const footer = document.createElement('footer')
  footer.className = 'footer'
  footer.innerHTML = '<div>ViewLoom · Independent, unofficial observation of public live-stream data.</div><nav><a href="/about/">Method & limits</a><a href="/support/">Support</a><a href="https://github.com/badjoke-lab/viewloom" target="_blank" rel="noreferrer">GitHub</a></nav>'
  const oldFooter = root.querySelector('footer')
  if (oldFooter) oldFooter.replaceWith(footer)
  else root.append(footer)

  const nav = header.querySelector<HTMLElement>('.global-nav')
  header.querySelector('button')?.addEventListener('click', () => nav?.classList.toggle('is-open'))
  return true
}

if (!install()) {
  const observer = new MutationObserver(() => {
    if (install()) observer.disconnect()
  })
  observer.observe(document.body, { childList: true, subtree: true })
}
