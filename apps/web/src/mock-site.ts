import './dayflow-responsive.css'
import './features/heatmap-page/layout-mode.css'
import './kick-coverage-ui'
import './visualization-grammar-entry'
import { localeFromPathname } from './i18n/locale'
import { localizeAvailableHref } from './i18n/route'
import { installSharedShell, setSharedShellStatus } from './shared-shell'
import { installTwitchStreamMapFeatureTab } from './twitch-stream-map-feature-tab'

(() => {
  installSharedShell()
  installTwitchStreamMapFeatureTab()
  localizeJapaneseAvailableLinks()

  document.querySelectorAll('[data-toggle-group]').forEach(group => {
    group.querySelectorAll('button').forEach(btn => btn.addEventListener('click', () => {
      group.querySelectorAll('button').forEach(x => x.classList.remove('active'))
      btn.classList.add('active')
      const target = group.getAttribute('data-target')
      if (target) document.querySelectorAll(`[data-mode-target="${target}"]`).forEach(el => {
        el.setAttribute('data-mode', btn.dataset.value || btn.textContent.trim().toLowerCase())
      })
    }))
  })

  document.querySelectorAll('[data-copy]').forEach(btn => btn.addEventListener('click', async () => {
    const text = btn.getAttribute('data-copy') || ''
    try { await navigator.clipboard.writeText(text); btn.textContent = 'Copied' }
    catch { btn.textContent = 'Copy unavailable' }
    setTimeout(() => btn.textContent = 'Copy summary', 1400)
  }))
})()

export {}

type StatusPayload = {
  state?: string
  sourceMode?: string
  freshness?: { lastSuccessAt?: string; minutesSinceSuccess?: number }
  latestSnapshot?: { bucketMinute?: string; observedCount?: number; coveredPages?: number }
  coverage?: { state?: string }
}

const locale = localeFromPathname(window.location.pathname)
const activeProvider = document.body.dataset.provider === 'kick' ? 'kick' : document.body.dataset.provider === 'twitch' ? 'twitch' : null
const isPortalHome = document.body.hasAttribute('data-portal-home')
if (!document.body.hasAttribute('data-changelog-state') && !isPortalHome) void hydrateLiveStatus()

function localizeJapaneseAvailableLinks(): void {
  if (localeFromPathname(window.location.pathname) !== 'ja') return
  document.querySelectorAll<HTMLAnchorElement>('a[href]').forEach((anchor) => {
    const href = anchor.getAttribute('href') ?? ''
    const localized = localizeAvailableHref(href, 'ja')
    if (localized !== href) anchor.setAttribute('href', localized)
  })
}

async function hydrateLiveStatus(): Promise<void> {
  const providers: Array<'twitch' | 'kick'> = activeProvider ? [activeProvider] : ['twitch', 'kick']
  const results = await Promise.all(providers.map(async (key) => [key, await fetchStatus(key)] as const))
  for (const [key, payload] of results) updateProviderCopy(key, payload)
  const states = results.map(([, payload]) => String(payload?.state ?? '').toLowerCase())
  const freshCount = states.filter((state) => state === 'fresh').length
  const availableCount = states.filter((state) => state === 'fresh' || state === 'partial' || state === 'empty').length
  const allFresh = freshCount === results.length
  const text = locale === 'ja'
    ? allFresh ? 'コレクター正常' : availableCount > 0 ? 'コレクター一部更新' : 'コレクター状態を取得できません'
    : allFresh ? 'Collectors healthy' : availableCount > 0 ? 'Collectors partially fresh' : 'Collector status unavailable'
  const state = allFresh ? 'fresh' : availableCount > 0 ? 'partial' : 'unavailable'
  document.querySelectorAll<HTMLElement>('.status-inline').forEach((node) => {
    setSharedShellStatus(node, locale === 'ja' ? `${text} · 5分間隔` : `${text} · 5m cadence`, state)
  })
}

async function fetchStatus(key: 'twitch' | 'kick'): Promise<StatusPayload | null> {
  try {
    const response = await fetch(`/api/${key}-status`, { cache: 'no-store' })
    if (!response.ok) return null
    return await response.json() as StatusPayload
  } catch {
    return null
  }
}

function updateProviderCopy(key: 'twitch' | 'kick', payload: StatusPayload | null): void {
  const name = key === 'twitch' ? 'Twitch' : 'Kick'
  const observed = formatNumber(payload?.latestSnapshot?.observedCount)
  const updated = formatAgo(payload?.freshness?.minutesSinceSuccess)
  const source = payload?.sourceMode ? labelText(payload.sourceMode) : '—'
  document.querySelectorAll<HTMLElement>('.portal-panel').forEach((panel) => {
    if (!panel.classList.contains(`portal-panel--${key}`)) return
    setStatAfterLabel(panel, 'Live now', observed)
    setStatAfterLabel(panel, 'Largest', '—')
    setStatAfterLabel(panel, 'Updated', updated)
  })
  if (document.body.dataset.provider === key) {
    setFact('Overall', payload?.state ? labelText(payload.state) : '—')
    setFact('Last success', updated)
    setFact('Observed', observed)
    setFact('Source', source)
    setFact('Updated', updated)
    setFact('Coverage', payload?.coverage?.state ? labelText(payload.coverage.state) : key === 'twitch' ? 'Top 300' : 'Top 100')
    setDataStrip('Updated', updated)
    setDataStrip('Observed', observed === '—' ? '— streams' : `${observed} streams`)
    setDataStrip('Source', source)
  }
  if (document.body.dataset.provider === 'portal') {
    const signal = document.querySelector<HTMLElement>('.signal-list')
    if (signal) {
      signal.insertAdjacentHTML('beforeend', `<div class="signal"><time>${escapeText(name)}</time><strong>${escapeText(name)} collector state: ${escapeText(payload?.state ? labelText(payload.state) : 'Unavailable')}.</strong><span>${escapeText(observed)} observed streams</span></div>`)
    }
  }
}

function setStatAfterLabel(root: ParentNode, label: string, value: string): void {
  root.querySelectorAll<HTMLElement>('small').forEach((node) => {
    if (node.textContent?.trim() === label) node.parentElement?.querySelector('strong')?.replaceChildren(value)
  })
}
function setFact(label: string, value: string): void { setStatAfterLabel(document, label, value) }
function setDataStrip(label: string, value: string): void {
  document.querySelectorAll<HTMLElement>('.data-strip__cell small').forEach((node) => {
    if (node.textContent?.trim() === label) {
      const parent = node.parentElement
      if (parent) parent.replaceChildren(node, document.createTextNode(value))
    }
  })
}
function formatAgo(minutes?: number): string {
  if (typeof minutes !== 'number' || !Number.isFinite(minutes)) return '—'
  const rounded = Math.max(0, Math.round(minutes))
  return locale === 'ja' ? `${rounded}分前` : `${rounded}m ago`
}
function formatNumber(value?: number): string { return typeof value === 'number' && Number.isFinite(value) ? new Intl.NumberFormat(locale === 'ja' ? 'ja-JP' : undefined).format(value) : '—' }
function labelText(value: string): string { return value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()) }
function escapeText(value: string): string { const node = document.createElement('span'); node.textContent = value; return node.innerHTML }