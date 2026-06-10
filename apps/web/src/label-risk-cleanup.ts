import {
  getFeatureRole,
  getFeatureTitle,
  getHeroEyebrow,
  getMetaDescription,
  getPlatformDataLabel,
  getSeoTitle,
  getUnofficialBadge,
  type FeaturePage,
  type Platform,
} from './shared/labels'

type RouteMeta = {
  platform?: Platform
  feature?: FeaturePage
}

const CONTACT_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSdhreuxEz7w0eSjslTyVLL-axV6IJdTp5RU5VXCM3ApIz35-Q/viewform?usp=dialog'
const GITHUB_URL = 'https://github.com/badjoke-lab/viewloom'

const FEATURE_BY_PAGE: Record<string, FeaturePage> = {
  'twitch-heatmap': 'heatmap',
  'twitch-day-flow': 'day-flow',
  'twitch-battle-lines': 'battle-lines',
  'twitch-history': 'history',
  'twitch-status': 'status',
  'kick-heatmap': 'heatmap',
  'kick-day-flow': 'day-flow',
  'kick-battle-lines': 'battle-lines',
  'kick-history': 'history',
  'kick-status': 'status',
}

const ROUTE_COPY: Record<FeaturePage, string> = {
  heatmap: 'Read who is big, rising, or active right now through observed live-stream data.',
  'day-flow': 'Read the daily audience landscape as a single terrain.',
  'battle-lines': 'Read rivalry, reversals, surges, and closing gaps through observed live-stream data.',
  history: 'Review observed days, top streamers, and daily trend changes.',
  status: "Current health, freshness, and coverage for ViewLoom's observations.",
}

const TEXT_FIXES: Array<[RegExp, string]> = [
  [/Twitch\s+ViewLoom/g, 'Twitch data overview'],
  [/Kick\s+ViewLoom/g, 'Kick data overview'],
  [/Now \/ Today \/ Compare/g, 'Now / Today / Rivalry'],
  [/Now, Today, and Compare/g, 'Now, Today, and Rivalry'],
  [/TWITCH \/ COMPARE/g, 'TWITCH DATA · RIVALRY'],
  [/KICK \/ COMPARE/g, 'KICK DATA · RIVALRY'],
  [/Shell ready for real Twitch data(?: mounting)?\.?/gi, 'Current Twitch observation routes are connected.'],
  [/Shell ready for real Kick data(?: mounting)?\.?/gi, 'Current Kick observation routes are connected.'],
  [/Feature shell ready/gi, 'Feature view'],
  [/This route exists on the new ViewLoom structure and is ready to receive the real renderer and provider-backed API path\./gi, 'Use the available controls, chart, and status notes to read the current provider data.'],
  [/This top page is rebuilt into a chart-first home with a strong overview stage, dense right rail, and lower support blocks\./gi, 'Open the current provider views and inspect data status before relying on a chart.'],
  [/This surface will become the top-page overview stage[^.]*\./gi, 'This overview keeps provider scope, status, and feature routes separate.'],
  [/Real Twitch data mounting comes next/gi, 'Current Twitch data routes are available'],
  [/Kick feature mounting follows Twitch hardening/gi, 'Kick feature routes use provider-specific data'],
  [/Focus state placeholder/gi, 'Selected stream detail'],
  [/Selected window placeholder/gi, 'Selected time window'],
  [/Detail panel placeholder/gi, 'Selected detail'],
  [/Primary pair placeholder/gi, 'Primary pair'],
  [/The production rail will show/gi, 'This panel shows'],
  [/The right rail will keep/gi, 'The detail panel keeps'],
  [/This main field will become/gi, 'This field presents'],
  [/The hero panel will switch to the latest Twitch data snapshot once the heatmap API responds\./gi, 'The latest observed snapshot appears after the Heatmap API responds.'],
  [/Build state/gi, 'Data view'],
]

const route = getRouteMeta()
let scheduled = false
applyLabelRules()

const observer = new MutationObserver(() => {
  if (scheduled) return
  scheduled = true
  window.requestAnimationFrame(() => {
    scheduled = false
    applyLabelRules()
  })
})
observer.observe(document.body, { childList: true, subtree: true, characterData: true })

function getRouteMeta(): RouteMeta {
  const page = document.body.dataset.page ?? ''
  const platform = page.startsWith('kick') ? 'kick' : page.startsWith('twitch') ? 'twitch' : undefined
  return { platform, feature: FEATURE_BY_PAGE[page] }
}

function applyLabelRules(): void {
  patchHead()
  patchHeader()
  patchHero()
  patchFeatureNav()
  patchSharedFooter()
  ensureMobileShellStyles()
  patchVisibleText(document.body)
}

function patchHead(): void {
  if (!route.platform || !route.feature) return
  setDocumentTitle(getSeoTitle(route.feature, route.platform))
  const meta = document.querySelector<HTMLMetaElement>('meta[name="description"]')
  const description = getMetaDescription(route.feature, route.platform)
  if (meta && meta.content !== description) meta.content = description
}

function patchHeader(): void {
  document.querySelectorAll<HTMLAnchorElement>('.site-nav .nav-link').forEach((link) => {
    const href = link.getAttribute('href') ?? ''
    if (href === '/twitch/') setText(link, getPlatformDataLabel('twitch'))
    if (href === '/kick/') setText(link, getPlatformDataLabel('kick'))
  })

  const nav = document.querySelector<HTMLElement>('.site-nav')
  if (nav) {
    ensureHeaderLink(nav, '/about/', 'About')
    ensureHeaderLink(nav, '/support/', 'Support')
    ensureHeaderLink(nav, CONTACT_FORM_URL, 'Contact', true)
  }

  const headerNote = document.querySelector<HTMLElement>('.header-note')
  if (!headerNote) return
  setText(headerNote, route.platform ? getUnofficialBadge(route.platform) : 'Unofficial data view')
}

function ensureHeaderLink(nav: HTMLElement, href: string, label: string, external = false): void {
  const existing = Array.from(nav.querySelectorAll<HTMLAnchorElement>('a')).find((link) => (link.getAttribute('href') ?? '') === href)
  if (existing) {
    setText(existing, label)
    if (external) {
      existing.target = '_blank'
      existing.rel = 'noreferrer'
    }
    return
  }

  const link = document.createElement('a')
  link.className = 'nav-link'
  link.href = href
  link.textContent = label
  if (external) {
    link.target = '_blank'
    link.rel = 'noreferrer'
  }
  nav.append(link)
}

function patchHero(): void {
  if (!route.platform || !route.feature) return
  const eyebrow = document.querySelector<HTMLElement>('.hero .eyebrow, .bl-hero .eyebrow')
  const h1 = document.querySelector<HTMLHeadingElement>('.hero h1, .bl-hero h1')
  const copy = document.querySelector<HTMLElement>('.hero .hero-copy, .bl-hero p')

  if (eyebrow) setText(eyebrow, getHeroEyebrow(route.platform, getFeatureRole(route.feature)))
  if (h1) setText(h1, getFeatureTitle(route.feature))
  if (copy) setText(copy, ROUTE_COPY[route.feature])

  document.querySelectorAll<HTMLElement>('.status-panel__label').forEach((label) => {
    if (/build state|live snapshot|current state|unofficial/i.test(label.textContent ?? '')) {
      setText(label, getUnofficialBadge(route.platform))
    }
  })
}

function patchFeatureNav(): void {
  document.querySelectorAll<HTMLAnchorElement>('.site-subnav .subnav-link').forEach((link) => {
    if (link.textContent?.trim().toLowerCase() === 'history & trends') setText(link, 'History')
  })
}

function patchSharedFooter(): void {
  if (document.querySelector('.vl-shared-footer') || document.querySelector('.vl-footer')) return
  const shell = document.querySelector<HTMLElement>('.page-shell')
  if (!shell) return
  const footer = document.createElement('footer')
  footer.className = 'vl-shared-footer'
  footer.innerHTML = `
    <a href="/about/">About</a>
    <a href="/support/">Support</a>
    <a href="${CONTACT_FORM_URL}" target="_blank" rel="noreferrer">Contact</a>
    <a href="${GITHUB_URL}" target="_blank" rel="noreferrer">GitHub</a>
    ${route.platform ? `<a href="/${route.platform}/status/">Data Status</a>` : ''}
  `
  shell.append(footer)
  ensureFooterStyles()
}

function ensureFooterStyles(): void {
  if (document.querySelector('#vl-shared-footer-style')) return
  const style = document.createElement('style')
  style.id = 'vl-shared-footer-style'
  style.textContent = `.vl-shared-footer{width:min(calc(100% - 32px),var(--content-width));margin:0 auto;padding:0 0 34px;display:flex;flex-wrap:wrap;gap:10px;justify-content:center;color:var(--muted)}.vl-shared-footer a{padding:8px 12px;border:1px solid var(--border);border-radius:999px;background:rgba(255,255,255,.035);transition:background-color 160ms ease,color 160ms ease}.vl-shared-footer a:hover{background:rgba(255,255,255,.08);color:var(--text)}`
  document.head.append(style)
}

function ensureMobileShellStyles(): void {
  if (document.querySelector('#vl-mobile-shell-style')) return
  const style = document.createElement('style')
  style.id = 'vl-mobile-shell-style'
  style.textContent = `@media(max-width:760px){.site-header{width:min(calc(100% - 20px),var(--content-width));grid-template-columns:1fr;gap:10px;padding-top:12px}.brand{justify-self:center}.site-nav{justify-content:flex-start;overflow-x:auto;flex-wrap:nowrap;padding:4px 0 8px;scrollbar-width:none}.site-nav::-webkit-scrollbar{display:none}.nav-link{white-space:nowrap;padding:9px 12px}.header-note{justify-self:stretch;text-align:center}.page-main{width:min(calc(100% - 20px),var(--content-width));padding-top:14px}.hero{padding:22px;border-radius:22px}.hero--portal-grid,.hero--site{grid-template-columns:1fr}.hero h1{font-size:clamp(2rem,12vw,3rem);line-height:1}.hero-copy{font-size:.95rem;line-height:1.6}.hero-actions{gap:9px}.button{min-height:42px;padding:0 14px}.site-subnav{overflow-x:auto;flex-wrap:nowrap;justify-content:flex-start;padding:4px 0 8px;scrollbar-width:none}.site-subnav::-webkit-scrollbar{display:none}.subnav-link{white-space:nowrap}.summary-grid,.feature-grid,.support-grid,.steps-grid,.card-grid{grid-template-columns:1fr!important}.feature-layout{grid-template-columns:1fr!important}.rail-stack{grid-template-columns:1fr}.vl-shared-footer{width:min(calc(100% - 20px),var(--content-width));justify-content:flex-start;padding-bottom:24px}.vl-shared-footer a{white-space:nowrap}}`
  document.head.append(style)
}

function patchVisibleText(root: HTMLElement): void {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  const nodes: Text[] = []
  let current = walker.nextNode()
  while (current) {
    nodes.push(current as Text)
    current = walker.nextNode()
  }

  nodes.forEach((node) => {
    const parent = node.parentElement
    if (!parent || ['SCRIPT', 'STYLE', 'TITLE'].includes(parent.tagName)) return
    const next = applyTextFixes(node.nodeValue ?? '')
    if (next !== node.nodeValue) node.nodeValue = next
  })
}

function applyTextFixes(value: string): string {
  return TEXT_FIXES.reduce((text, [pattern, replacement]) => text.replace(pattern, replacement), value)
}

function setText(node: HTMLElement, value: string): void {
  if (node.textContent !== value) node.textContent = value
}

function setDocumentTitle(value: string): void {
  if (document.title !== value) document.title = value
}
