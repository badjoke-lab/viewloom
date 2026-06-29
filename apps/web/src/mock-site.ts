import './dayflow-responsive.css'
import './features/heatmap-page/layout-mode.css'
import './kick-coverage-ui'
import { installSharedShell, setSharedShellStatus } from './shared-shell'

(() => {
  installSharedShell()

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

const activeProvider = document.body.dataset.provider === 'kick' ? 'kick' : document.body.dataset.provider === 'twitch' ? 'twitch' : null
const isPortalHome = document.body.hasAttribute('data-portal-home')
if (!document.body.hasAttribute('data-changelog-state') && !isPortalHome) void hydrateLiveStatus()

async function hydrateLiveStatus(): Promise<void> {
  const providers: Array<'twitch' | 'kick'> = activeProvider ? [activeProvider] : ['twitch', 'kick']
  const results = await Promise.all(providers.map(async (key) => [key, await fetchStatus(key)] as const))
  for (const [key, payload] of results) updateProviderCopy(key, payload)
  const freshCount = results.filter(([, payload]) => String(payload?.state ?? '').toLowerCase() === 'fresh').length
  const text = freshCount === results.length ? 'Collectors healthy' : freshCount > 0 ? 'Collectors partially fresh' : 'Collector status unavailable'
  const state = freshCount === results.length ? 'fresh' : freshCount > 0 ? 'partial' : 'unavailable'
  document.querySelectorAll<HTMLElement>('.status-inline').forEach((node) => {
    setSharedShellStatus(node, `${text} · 5m cadence`, state)
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
  return typeof minutes === 'number' && Number.isFinite(minutes) ? `${Math.max(0, Math.round(minutes))}m ago` : '—'
}
function formatNumber(value?: number): string { return typeof value === 'number' && Number.isFinite(value) ? new Intl.NumberFormat().format(value) : '—' }
function labelText(value: string): string { return value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()) }
function escapeText(value: string): string { const node = document.createElement('span'); node.textContent = value; return node.innerHTML }
