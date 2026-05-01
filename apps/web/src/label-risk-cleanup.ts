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

const FEATURE_BY_PAGE: Record<string, FeaturePage> = {
  'twitch-heatmap': 'heatmap',
  'twitch-day-flow': 'day-flow',
  'twitch-battle-lines': 'battle-lines',
  'twitch-history': 'history',
  'kick-heatmap': 'heatmap',
  'kick-day-flow': 'day-flow',
  'kick-battle-lines': 'battle-lines',
  'kick-history': 'history',
}

const ROUTE_COPY: Record<FeaturePage, string> = {
  heatmap: 'Read who is big, rising, or active right now through observed live-stream data.',
  'day-flow': 'Read the daily audience landscape as a single terrain.',
  'battle-lines': 'Compare live audience lines, reversals, and closing gaps.',
  history: 'Review observed days, top streamers, and daily trend changes.',
  status: "Current health, freshness, and coverage for ViewLoom's observations.",
}

const FORBIDDEN_REPLACEMENTS: Array<[RegExp, string]> = [
  [/Twitch ViewLoom/g, 'Twitch data overview'],
  [/Kick ViewLoom/g, 'Kick data overview'],
  [/Twitch Heatmap/g, 'Heatmap'],
  [/Twitch Day Flow/g, 'Day Flow'],
  [/Twitch Battle Lines/g, 'Battle Lines'],
  [/Twitch History/g, 'History & Trends'],
  [/Kick Heatmap/g, 'Heatmap'],
  [/Kick Day Flow/g, 'Day Flow'],
  [/Kick Battle Lines/g, 'Battle Lines'],
  [/Kick History/g, 'History & Trends'],
  [/TWITCH \/ NOW/g, 'TWITCH DATA · NOW'],
  [/TWITCH \/ TODAY/g, 'TWITCH DATA · TODAY'],
  [/TWITCH \/ COMPARE/g, 'TWITCH DATA · RIVALRY'],
  [/TWITCH \/ TRENDS/g, 'TWITCH DATA · TRENDS'],
  [/KICK \/ NOW/g, 'KICK DATA · NOW'],
  [/KICK \/ TODAY/g, 'KICK DATA · TODAY'],
  [/KICK \/ COMPARE/g, 'KICK DATA · RIVALRY'],
  [/KICK \/ TRENDS/g, 'KICK DATA · TRENDS'],
  [/ok · real/gi, 'Data: Fresh · Source: Real'],
  [/partial · api/gi, 'Data: Partial · Source: Real'],
  [/Observed complete/g, 'Coverage: Observed'],
  [/Partial coverage/g, 'Coverage: Partial'],
]

const route = getRouteMeta()
applyLabelRules()

const observer = new MutationObserver(() => applyLabelRules())
observer.observe(document.documentElement, {
  childList: true,
  subtree: true,
})

function getRouteMeta(): RouteMeta {
  const page = document.body.dataset.page ?? ''
  const platform = page.startsWith('kick') ? 'kick' : page.startsWith('twitch') ? 'twitch' : undefined
  const feature = FEATURE_BY_PAGE[page]
  return { platform, feature }
}

function applyLabelRules(): void {
  patchHead()
  patchHeader()
  patchHero()
  patchFeatureNav()
  patchVisibleText(document.body)
}

function patchHead(): void {
  if (!route.platform || !route.feature) return
  document.title = getSeoTitle(route.feature, route.platform)
  const meta = document.querySelector<HTMLMetaElement>('meta[name="description"]')
  if (meta) meta.content = getMetaDescription(route.feature, route.platform)
}

function patchHeader(): void {
  document.querySelectorAll<HTMLAnchorElement>('.site-nav .nav-link').forEach((link) => {
    const href = link.getAttribute('href') ?? ''
    if (href === '/twitch/' || href.startsWith('/twitch/')) {
      link.textContent = getPlatformDataLabel('twitch')
    }
    if (href === '/kick/' || href.startsWith('/kick/')) {
      link.textContent = getPlatformDataLabel('kick')
    }
  })

  const headerNote = document.querySelector<HTMLElement>('.header-note')
  if (!headerNote) return
  if (route.platform) {
    headerNote.textContent = getUnofficialBadge(route.platform)
  } else {
    headerNote.textContent = 'Unofficial data view'
  }
}

function patchHero(): void {
  if (!route.platform || !route.feature) return
  const eyebrow = document.querySelector<HTMLElement>('.hero .eyebrow, .bl-hero .eyebrow')
  const h1 = document.querySelector<HTMLHeadingElement>('.hero h1, .bl-hero h1')
  const copy = document.querySelector<HTMLElement>('.hero .hero-copy, .bl-hero p')

  if (eyebrow) eyebrow.textContent = getHeroEyebrow(route.platform, getFeatureRole(route.feature))
  if (h1) h1.textContent = getFeatureTitle(route.feature)
  if (copy) copy.textContent = ROUTE_COPY[route.feature]

  document.querySelectorAll<HTMLElement>('.status-panel__label').forEach((label) => {
    if (/build state|live snapshot|current state/i.test(label.textContent ?? '')) {
      label.textContent = getUnofficialBadge(route.platform)
    }
  })
}

function patchFeatureNav(): void {
  document.querySelectorAll<HTMLAnchorElement>('.site-subnav .subnav-link').forEach((link) => {
    const text = link.textContent?.trim().toLowerCase()
    if (text === 'battle lines') return
    if (text === 'history & trends') link.textContent = 'History'
  })
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
    const next = applyReplacements(node.nodeValue ?? '')
    if (next !== node.nodeValue) node.nodeValue = next
  })
}

function applyReplacements(value: string): string {
  return FORBIDDEN_REPLACEMENTS.reduce((text, [pattern, replacement]) => text.replace(pattern, replacement), value)
}
