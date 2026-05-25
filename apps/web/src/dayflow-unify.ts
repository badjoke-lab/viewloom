import { fallbackPolicy, fetchRetentionPolicy, retentionSummary, shouldShowRetentionBoundary, type ProviderRetentionPolicy } from './retention-policy'

const page = document.body.dataset.page || ''
const isDayFlowPage = page === 'twitch-day-flow' || page === 'kick-day-flow'
const provider: 'twitch' | 'kick' = page.startsWith('kick') ? 'kick' : 'twitch'

if (isDayFlowPage) {
  window.requestAnimationFrame(() => {
    ensureDayFlowUnifyStyles()
    applyDayFlowUiUnification()
    applyDayFlowRetentionNote()
  })
}

function applyDayFlowUiUnification(): void {
  const hero = document.querySelector<HTMLElement>('.hero--feature')
  const subnav = document.querySelector<HTMLElement>('.site-subnav')
  const controls = document.querySelector<HTMLElement>('#dayflow-controls')
  const summary = document.querySelector<HTMLElement>('.df-summary')
  const mainCard = document.querySelector<HTMLElement>('.df-main')
  const railCards = document.querySelectorAll<HTMLElement>('.df-rail .rail-card')
  const supportCards = document.querySelectorAll<HTMLElement>('.support-grid--feature .support-card')

  hero?.classList.add('vl-page-hero', 'df-hero--unified')
  subnav?.classList.add('vl-feature-nav', 'df-feature-nav--unified')
  controls?.classList.add('vl-control-dock', 'df-controls--unified')
  summary?.classList.add('vl-kpi-row', 'df-summary--unified')
  mainCard?.classList.add('vl-visual-card', 'df-main--unified')
  railCards.forEach((card) => card.classList.add('vl-inspector-card'))
  supportCards.forEach((card) => card.classList.add('vl-section-card'))

}

function applyDayFlowRetentionNote(): void {
  const controls = document.querySelector<HTMLElement>('#dayflow-controls')
  const mainCard = document.querySelector<HTMLElement>('.df-main')
  const host = controls ?? mainCard
  if (!host || document.querySelector('#dayflow-retention-note')) return

  const selectedDate = currentSelectedDate()
  const note = document.createElement('aside')
  note.id = 'dayflow-retention-note'
  note.className = 'vl-retention-note df-retention-note'
  note.textContent = noteText(fallbackPolicy(provider, selectedDate))
  host.insertAdjacentElement(controls ? 'afterend' : 'beforebegin', note)

  fetchRetentionPolicy(provider, selectedDate).then((policy) => {
    note.textContent = noteText(policy)
    note.dataset.boundary = shouldShowRetentionBoundary(policy) ? 'true' : 'false'
  }).catch(() => {})
}

function noteText(policy: ProviderRetentionPolicy): string {
  return shouldShowRetentionBoundary(policy) ? policy.detailUnavailableMessage : retentionSummary(policy)
}

function currentSelectedDate(): string | null {
  const params = new URLSearchParams(window.location.search)
  const explicit = params.get('date') ?? params.get('from')
  return explicit && /^\d{4}-\d{2}-\d{2}$/.test(explicit) ? explicit : null
}

function ensureDayFlowUnifyStyles(): void {
  if (document.querySelector('#dayflow-unify-styles')) return
  const style = document.createElement('style')
  style.id = 'dayflow-unify-styles'
  style.textContent = `
.df-hero--unified{border-radius:var(--radius-xl);padding:34px;box-shadow:var(--shadow)}
.df-feature-nav--unified{margin-top:18px}.df-controls--unified{display:flex;flex-wrap:wrap;align-items:end;gap:10px;margin-top:18px;padding:12px;border:1px solid var(--border);border-radius:22px;background:rgba(12,21,37,.74)}
.df-controls--unified label{min-width:120px}.df-controls--unified .df-checkbox{align-self:center}.df-summary--unified .summary-card{border-radius:var(--radius-lg)}
.df-main--unified{border-color:var(--border);border-radius:var(--radius-lg);background:var(--card);box-shadow:var(--shadow)}
.vl-inspector-card,.vl-section-card{border-radius:var(--radius-lg)}
.vl-retention-note{margin-top:12px;border:1px solid var(--border);border-radius:18px;background:rgba(12,21,37,.62);color:var(--muted);padding:10px 12px;font-size:.9rem;line-height:1.5}.vl-retention-note[data-boundary="true"]{border-color:rgba(250,204,21,.45);color:#fde68a;background:rgba(120,53,15,.24)}
@media(max-width:760px){.df-hero--unified{padding:20px}.df-controls--unified{display:grid;grid-template-columns:1fr 1fr}.df-controls--unified label{min-width:0}}
@media(max-width:520px){.df-controls--unified{grid-template-columns:1fr}}
`
  document.head.append(style)
}