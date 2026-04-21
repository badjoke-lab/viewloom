import './styles.css'
import { initHeatmapLayout } from './live/heatmap-layout'
import { hydrateTwitchHeatmap } from './live/twitch-heatmap'

type PageKind =
  | 'portal'
  | 'twitch'
  | 'kick'
  | 'twitch-heatmap'
  | 'twitch-day-flow'
  | 'twitch-battle-lines'
  | 'kick-heatmap'
  | 'kick-day-flow'
  | 'kick-battle-lines'

type SiteKey = 'twitch' | 'kick'
type FeatureKey = 'heatmap' | 'day-flow' | 'battle-lines'

type SiteCard = {
  slug: SiteKey
  title: string
  eyebrow: string
  description: string
  cta: string
  accentClass: string
  notes: string[]
}

type SiteMeta = {
  key: SiteKey
  title: string
  eyebrow: string
  accentClass: string
  basePath: string
  shellStatus: string
  intro: string
  featureLead: string
  overviewTitle: string
  overviewBody: string
  railTitle: string
  railItems: string[]
  supportCards: SupportCard[]
}

type SummaryCard = {
  label: string
  value: string
  body: string
}

type SupportCard = {
  label: string
  title: string
  body: string
}

type FeatureMeta = {
  key: FeatureKey
  label: string
  title: string
  description: string
  chartTitle: string
  chartBody: string
  rightRailTitle: string
  rightRailItems: string[]
  supportCards: SupportCard[]
  summaryCards: SummaryCard[]
  railCards: SupportCard[]
}

const cards: SiteCard[] = [
  {
    slug: 'twitch',
    title: 'Twitch ViewLoom',
    eyebrow: 'Now / Today / Compare',
    description:
      'Observe Twitch through a dedicated shell focused on Heatmap, Day Flow, and Battle Lines.',
    cta: 'Open Twitch site',
    accentClass: 'theme-twitch',
    notes: ['Purple-led live field', 'Separate status and coverage', 'Feature-first reading'],
  },
  {
    slug: 'kick',
    title: 'Kick ViewLoom',
    eyebrow: 'Now / Today / Compare',
    description:
      'Observe Kick through the same shell structure with a separate accent, status surface, and data path.',
    cta: 'Open Kick site',
    accentClass: 'theme-kick',
    notes: ['Green-led live field', 'Parallel observatory layout', 'Provider-separated reading'],
  },
]

const siteMeta: Record<SiteKey, SiteMeta> = {
  twitch: {
    key: 'twitch',
    title: 'Twitch ViewLoom',
    eyebrow: 'Twitch',
    accentClass: 'theme-twitch',
    basePath: '/twitch',
    shellStatus: 'Shell ready for real Twitch mounting',
    intro:
      'A dedicated Twitch observatory that keeps Now, Today, and Compare separate while staying dense and readable.',
    featureLead:
      'Open the current live field, read the daily landscape, or inspect the strongest current battle.',
    overviewTitle: 'Overview stage',
    overviewBody:
      'This surface will become the top-page overview stage: strong enough to make the home feel like a product surface, but not a replacement for the feature pages.',
    railTitle: 'Current build focus',
    railItems: [
      'Shared shell first',
      'Feature-first page titles',
      'Real Twitch data mounting comes next',
    ],
    supportCards: [
      {
        label: 'Overview',
        title: 'Now / Today / Compare',
        body: 'Three separate reads of the same live ecosystem, without collapsing into a single all-in-one dashboard.',
      },
      {
        label: 'Status',
        title: 'Separated from provider copy',
        body: 'Coverage, freshness, and source notes will live in dedicated strips and rails instead of polluting the main chart stage.',
      },
      {
        label: 'Direction',
        title: 'Chart-first product shell',
        body: 'The top page becomes a real product surface, not just a list of feature cards.',
      },
    ],
  },
  kick: {
    key: 'kick',
    title: 'Kick ViewLoom',
    eyebrow: 'Kick',
    accentClass: 'theme-kick',
    basePath: '/kick',
    shellStatus: 'Shell ready for real Kick mounting',
    intro:
      'A parallel Kick observatory with the same layout grammar, but its own color identity, status surface, and future collector path.',
    featureLead:
      'Move through Heatmap, Day Flow, and Battle Lines without mixing platform scope or role boundaries.',
    overviewTitle: 'Overview stage',
    overviewBody:
      'This surface will become the top-page overview stage for Kick, with the same shell logic as Twitch but a clearly separate provider identity.',
    railTitle: 'Current build focus',
    railItems: [
      'Same shell, separate provider identity',
      'No mixed Twitch/Kick feature pages',
      'Kick feature mounting follows Twitch hardening',
    ],
    supportCards: [
      {
        label: 'Overview',
        title: 'Parallel, not merged',
        body: 'Kick keeps the same reading pattern as Twitch while preserving a clearly separate platform scope and mood.',
      },
      {
        label: 'Status',
        title: 'Own coverage surface',
        body: 'Limitations, freshness, and source notes will be shown as Kick-specific status, not borrowed from Twitch language.',
      },
      {
        label: 'Direction',
        title: 'Built to mirror the shell',
        body: 'The shared shell is designed so Kick can inherit the same product feel without duplicating the feature renderer logic.',
      },
    ],
  },
}

const featureMeta: Record<FeatureKey, FeatureMeta> = {
  heatmap: {
    key: 'heatmap',
    label: 'Now',
    title: 'Heatmap',
    description: 'Read who is big, rising, or active right now through a dense production treemap.',
    chartTitle: 'Treemap stage',
    chartBody:
      'This main field will become the production heatmap: tile area for viewers, color for momentum, activity as secondary signal.',
    rightRailTitle: 'Read it through',
    rightRailItems: ['Area = viewers', 'Color = momentum', 'Activity = secondary signal'],
    supportCards: [
      {
        label: 'Main',
        title: 'Dense field first',
        body: 'The board should feel filled and decisive, not like a sparse placeholder grid.',
      },
      {
        label: 'Support',
        title: 'Selected stream detail',
        body: 'The right rail will hold selected stream reading, source notes, and legend instead of crowding the field.',
      },
      {
        label: 'State',
        title: 'Honest activity notes',
        body: 'Sampled, unavailable, and quiet states will be shown clearly without overwriting viewers or momentum as the main read.',
      },
    ],
    summaryCards: [
      {
        label: 'Role',
        value: 'Now',
        body: 'This page answers who is big, rising, or active right now.',
      },
      {
        label: 'Main field',
        value: 'Treemap',
        body: 'A dense board rather than rows of pseudo-tiles.',
      },
      {
        label: 'Signals',
        value: '3',
        body: 'Viewers, momentum, and activity stay distinct.',
      },
    ],
    railCards: [
      {
        label: 'Selected stream',
        title: 'Focus state placeholder',
        body: 'The production rail will show selected stream name, current viewers, momentum, activity, and open-stream action.',
      },
      {
        label: 'Legend',
        title: 'Color and state guide',
        body: 'Rising, falling, stable, sampled, unavailable, and stale notes will sit here as a compact reading guide.',
      },
    ],
  },
  'day-flow': {
    key: 'day-flow',
    label: 'Today',
    title: 'Day Flow',
    description:
      'Read the daily audience landscape as a single terrain, with total volume and share treated as separate views.',
    chartTitle: 'Daily landscape stage',
    chartBody:
      'This main field will become the stacked day terrain with bucket controls, time focus, and detail reading.',
    rightRailTitle: 'Read it through',
    rightRailItems: ['Top N + Others', 'Volume and Share modes', 'Time focus and detail panel'],
    supportCards: [
      {
        label: 'Main',
        title: 'Terrain, not lines',
        body: 'The main stage keeps the stacked landscape as the hero and avoids turning the page into line-comparison UI.',
      },
      {
        label: 'Support',
        title: 'Time focus lives outside the chart',
        body: 'Ranking at a selected moment, strongest momentum, and highest activity stay in the supporting areas.',
      },
      {
        label: 'Modes',
        title: 'Volume and share stay separate',
        body: 'The shell keeps both readings visible without blending them into a single ambiguous metric.',
      },
    ],
    summaryCards: [
      {
        label: 'Role',
        value: 'Today',
        body: 'This page reads the daily landscape instead of the current instant or a single battle.',
      },
      {
        label: 'Bucketing',
        value: '5m+',
        body: 'Time buckets stay visible and deliberate in the control row.',
      },
      {
        label: 'Focus',
        value: 'Time',
        body: 'Selected time and current ranking live in the rail, not on the terrain itself.',
      },
    ],
    railCards: [
      {
        label: 'Time focus',
        title: 'Selected window placeholder',
        body: 'The production rail will show selected time ranking, strongest momentum, and highest activity or unavailable state.',
      },
      {
        label: 'Detail',
        title: 'Detail panel placeholder',
        body: 'The right rail will keep today-reading support close without crowding the main terrain.',
      },
    ],
  },
  'battle-lines': {
    key: 'battle-lines',
    label: 'Compare',
    title: 'Battle Lines',
    description:
      'Read rivalry, reversal, surge, and pressure through a chart built around recommended and custom battle states.',
    chartTitle: 'Battle stage',
    chartBody:
      'This main field will become the comparison-first battle chart with recommended primary battle, secondary entries, and custom state control.',
    rightRailTitle: 'Read it through',
    rightRailItems: ['Primary battle first', 'Reversal-aware comparison', 'Recommended then custom flow'],
    supportCards: [
      {
        label: 'Main',
        title: 'Not a generic line page',
        body: 'The chart is about battle reading, not just plotting any set of lines on the same axes.',
      },
      {
        label: 'Support',
        title: 'Reversal strip and battle feed',
        body: 'Pair events, feed notes, and focus state belong below the chart so the main stage stays readable.',
      },
      {
        label: 'State',
        title: 'Recommended then custom',
        body: 'The shell is built to show a primary battle first, then let the user move into a controlled custom state.',
      },
    ],
    summaryCards: [
      {
        label: 'Role',
        value: 'Compare',
        body: 'This page reads a live battle instead of the whole field or the whole day.',
      },
      {
        label: 'Entry',
        value: 'Recommended',
        body: 'Initial reading starts from a suggested battle rather than a blank chart.',
      },
      {
        label: 'Events',
        value: 'Reversal',
        body: 'Reversal, rise, and pressure are first-class support reads.',
      },
    ],
    railCards: [
      {
        label: 'Current battle',
        title: 'Primary pair placeholder',
        body: 'The rail will hold current gap, last reversal, fastest challenger, and the current pressure read.',
      },
      {
        label: 'State',
        title: 'Recommended vs custom',
        body: 'The page will make it clear whether the user is in system-selected battle mode or a custom battle state.',
      },
    ],
  },
}

const page = ((document.body.dataset.page as PageKind | undefined) ?? 'portal')
const app = document.querySelector<HTMLDivElement>('#app')

if (!app) throw new Error('#app not found')

app.innerHTML = renderPage(page)
void initPage(page)

async function initPage(kind: PageKind): Promise<void> {
  if (kind === 'twitch-heatmap') {
    initHeatmapLayout()
    await hydrateTwitchHeatmap()
  }
}

function renderPage(kind: PageKind): string {
  if (kind === 'portal') return renderPortal()
  if (kind === 'twitch' || kind === 'kick') return renderSiteHome(kind)
  return renderFeaturePage(kind)
}

function renderPortal(): string {
  return `
    <div class="page-shell page-shell--portal">
      ${renderHeader('portal')}
      <main class="page-main">
        <section class="hero hero--portal hero--portal-grid">
          <div>
            <div class="eyebrow">ViewLoom</div>
            <h1>Choose a live ecosystem, then read it through three fixed views.</h1>
            <p class="hero-copy">
              ViewLoom separates platforms first, then lets each site read live activity through Now, Today, and Compare.
            </p>
            <div class="hero-actions">
              <a class="button button--primary" href="/twitch/">Open Twitch</a>
              <a class="button button--secondary" href="/kick/">Open Kick</a>
            </div>
          </div>
          <aside class="status-panel status-panel--portal">
            <div class="status-panel__label">Portal role</div>
            <div class="status-panel__title">An entry point, not a mixed dashboard</div>
            <p>
              The portal should stay light, branded, and selective. Heavy feature reading happens inside each platform site.
            </p>
            <div class="metric-list metric-list--compact">
              <div class="metric-chip">
                <span class="metric-chip__label">Structure</span>
                <strong>Platform-first</strong>
              </div>
              <div class="metric-chip">
                <span class="metric-chip__label">Views</span>
                <strong>Now / Today / Compare</strong>
              </div>
            </div>
          </aside>
        </section>

        <section class="card-grid card-grid--portal">
          ${cards.map(renderPortalCard).join('')}
        </section>

        <section class="steps-grid">
          ${[
            {
              step: '01',
              title: 'Choose a platform',
              body: 'Twitch and Kick stay separated as independent observation surfaces.',
            },
            {
              step: '02',
              title: 'Open a fixed view',
              body: 'Heatmap, Day Flow, and Battle Lines keep distinct roles instead of collapsing into one page.',
            },
            {
              step: '03',
              title: 'Read state honestly',
              body: 'Coverage, freshness, and limitations belong in status rails and notes, not hidden behind polished visuals.',
            },
          ]
            .map(renderStepCard)
            .join('')}
        </section>
      </main>
    </div>
  `
}

function renderPortalCard(card: SiteCard): string {
  return `
    <article class="surface-card surface-card--portal ${card.accentClass}">
      <div class="surface-card__eyebrow">${card.eyebrow}</div>
      <h2>${card.title}</h2>
      <p>${card.description}</p>
      <div class="tag-list">
        ${card.notes.map((note) => `<span class="tag-pill">${note}</span>`).join('')}
      </div>
      <a class="button button--ghost" href="/${card.slug}/">${card.cta}</a>
    </article>
  `
}

function renderStepCard(item: { step: string; title: string; body: string }): string {
  return `
    <article class="info-card info-card--step">
      <div class="step-badge">${item.step}</div>
      <h2>${item.title}</h2>
      <p>${item.body}</p>
    </article>
  `
}

function renderSiteHome(kind: SiteKey): string {
  const site = siteMeta[kind]

  return `
    <div class="page-shell page-shell--site ${site.accentClass}">
      ${renderHeader(kind)}
      <main class="page-main">
        <section class="hero hero--site hero--top">
          <div>
            <div class="eyebrow">${site.eyebrow}</div>
            <h1>${site.title}</h1>
            <p class="hero-copy">${site.intro}</p>
            <p class="hero-copy hero-copy--secondary">${site.featureLead}</p>
            <div class="hero-actions">
              <a class="button button--primary" href="${site.basePath}/heatmap/">Heatmap</a>
              <a class="button button--secondary" href="${site.basePath}/day-flow/">Day Flow</a>
              <a class="button button--secondary" href="${site.basePath}/battle-lines/">Battle Lines</a>
            </div>
          </div>
          <aside class="status-panel">
            <div class="status-panel__label">Current state</div>
            <div class="status-panel__title">${site.shellStatus}</div>
            <p>
              The top page is being rebuilt into a chart-first home with a real overview stage, dense right rail, and lower support blocks.
            </p>
            <div class="metric-list">
              <div class="metric-chip">
                <span class="metric-chip__label">Role split</span>
                <strong>Now / Today / Compare</strong>
              </div>
              <div class="metric-chip">
                <span class="metric-chip__label">Title order</span>
                <strong>Feature-first</strong>
              </div>
            </div>
          </aside>
        </section>

        <section class="feature-layout feature-layout--top">
          <article class="chart-stage chart-stage--overview">
            <div class="chart-stage__label">Site overview</div>
            <h2>${site.overviewTitle}</h2>
            <p>${site.overviewBody}</p>
            <div class="chart-placeholder chart-placeholder--overview">
              <div class="chart-placeholder__grid"></div>
              <div class="chart-placeholder__shape chart-placeholder__shape--1"></div>
              <div class="chart-placeholder__shape chart-placeholder__shape--2"></div>
              <div class="chart-placeholder__shape chart-placeholder__shape--3"></div>
            </div>
          </article>

          <aside class="rail-stack">
            <section class="rail-card">
              <div class="rail-card__label">${site.railTitle}</div>
              <ul class="rail-list">
                ${site.railItems.map((item) => `<li>${item}</li>`).join('')}
              </ul>
            </section>
            <section class="rail-card rail-card--status">
              <div class="rail-card__label">Status surface</div>
              <p>
                Coverage, freshness, and source notes will eventually sit here as provider-specific reading instead of placeholder copy.
              </p>
            </section>
          </aside>
        </section>

        <section class="feature-grid feature-grid--top">
          ${(['heatmap', 'day-flow', 'battle-lines'] as FeatureKey[])
            .map((feature) => renderFeatureCard(site, featureMeta[feature]))
            .join('')}
        </section>

        <section class="support-grid">
          ${site.supportCards.map(renderSupportCard).join('')}
        </section>
      </main>
    </div>
  `
}

function renderFeatureCard(site: SiteMeta, feature: FeatureMeta): string {
  return `
    <article class="feature-card feature-card--top">
      <div class="feature-card__label">${feature.label}</div>
      <h2>${feature.title}</h2>
      <p>${feature.description}</p>
      <a class="button button--ghost feature-card__link" href="${site.basePath}/${feature.key}/">Open ${feature.title}</a>
    </article>
  `
}

function renderSupportCard(card: SupportCard): string {
  return `
    <article class="support-card">
      <div class="support-card__label">${card.label}</div>
      <h2>${card.title}</h2>
      <p>${card.body}</p>
    </article>
  `
}

function renderSummaryCard(card: SummaryCard): string {
  return `
    <article class="summary-card">
      <div class="summary-card__label">${card.label}</div>
      <div class="summary-card__value">${card.value}</div>
      <p>${card.body}</p>
    </article>
  `
}

function renderRailDetailCard(card: SupportCard): string {
  return `
    <section class="rail-card rail-card--detail">
      <div class="rail-card__label">${card.label}</div>
      <h2>${card.title}</h2>
      <p>${card.body}</p>
    </section>
  `
}

function renderFeaturePage(kind: Exclude<PageKind, 'portal' | 'twitch' | 'kick'>): string {
  const [siteKey, ...rest] = kind.split('-') as [SiteKey, ...string[]]
  const featureKey = rest.join('-') as FeatureKey
  const site = siteMeta[siteKey]
  const feature = featureMeta[featureKey]
  const isLiveTwitchHeatmap = site.key === 'twitch' && feature.key === 'heatmap'

  const featureLayoutSection = `
    <section class="feature-layout ${isLiveTwitchHeatmap ? 'feature-layout--heatmap' : ''}">
      <article class="chart-stage chart-stage--feature">
        <div class="chart-stage__label">${feature.label}</div>
        <h2>${feature.chartTitle}</h2>
        <p>${feature.chartBody}</p>
        <div class="chart-placeholder chart-placeholder--${feature.key}">
          <div class="chart-placeholder__grid"></div>
          <div class="chart-placeholder__shape chart-placeholder__shape--1"></div>
          <div class="chart-placeholder__shape chart-placeholder__shape--2"></div>
          <div class="chart-placeholder__shape chart-placeholder__shape--3"></div>
        </div>
      </article>

      <aside class="rail-stack">
        <section class="rail-card">
          <div class="rail-card__label">${feature.rightRailTitle}</div>
          <ul class="rail-list">
            ${feature.rightRailItems.map((item) => `<li>${item}</li>`).join('')}
          </ul>
        </section>
        ${feature.railCards.map(renderRailDetailCard).join('')}
      </aside>
    </section>
  `

  const supportGridSection = `
    <section class="support-grid support-grid--feature">
      ${feature.supportCards.map(renderSupportCard).join('')}
    </section>
  `

  const layoutBody = isLiveTwitchHeatmap
    ? `<div id="heatmap-layout-root" class="heatmap-layout-root" data-layout-mode="split">${featureLayoutSection}${supportGridSection}</div>`
    : `${featureLayoutSection}${supportGridSection}`

  return `
    <div class="page-shell page-shell--site ${site.accentClass}">
      ${renderHeader(kind)}
      <main class="page-main">
        <section class="hero hero--site hero--feature">
          <div>
            <div class="eyebrow">${site.eyebrow} / ${feature.label}</div>
            <h1>${feature.title}</h1>
            <p class="hero-copy">${feature.description}</p>
          </div>
          <aside class="status-panel">
            <div class="status-panel__label">Build state</div>
            <div class="status-panel__title">Feature shell ready</div>
            <p>
              This route exists on the new ViewLoom structure and is ready to receive the real renderer and provider-backed API path.
            </p>
          </aside>
        </section>

        <div class="site-subnav" aria-label="Site sections">
          ${renderSiteSubnav(site.key, feature.key)}
        </div>

        ${isLiveTwitchHeatmap ? renderHeatmapViewModeBar() : ''}

        <section class="summary-grid">
          ${feature.summaryCards.map(renderSummaryCard).join('')}
        </section>

        ${layoutBody}
      </main>
    </div>
  `
}

function renderHeatmapViewModeBar(): string {
  return `
    <section class="view-mode-bar" aria-label="Heatmap layout mode">
      <div>
        <h2 class="view-mode-bar__title">Heatmap layout</h2>
        <p class="view-mode-bar__body">Split view keeps the map beside the rail. Theater mode expands the map to full width and moves the rail below it instead of hiding it.</p>
      </div>
      <div class="view-mode-bar__actions">
        <button type="button" class="layout-toggle is-active" data-layout-mode="split" aria-pressed="true">Split view</button>
        <button type="button" class="layout-toggle" data-layout-mode="theater" aria-pressed="false">Theater mode</button>
      </div>
    </section>
  `
}

function renderSiteSubnav(site: SiteKey, currentFeature?: FeatureKey): string {
  const items: { key: FeatureKey; label: string }[] = [
    { key: 'heatmap', label: 'Heatmap' },
    { key: 'day-flow', label: 'Day Flow' },
    { key: 'battle-lines', label: 'Battle Lines' },
  ]

  return items
    .map((item) => {
      const isCurrent = item.key === currentFeature
      return `<a class="subnav-link ${isCurrent ? 'is-current' : ''}" href="/${site}/${item.key}/">${item.label}</a>`
    })
    .join('')
}

function renderHeader(current: PageKind): string {
  const currentSite = current.startsWith('twitch') ? 'twitch' : current.startsWith('kick') ? 'kick' : null

  return `
    <header class="site-header">
      <a class="brand" href="/">ViewLoom</a>
      <nav class="site-nav" aria-label="Primary">
        <a class="nav-link ${current === 'portal' ? 'is-current' : ''}" href="/">Portal</a>
        <a class="nav-link ${currentSite === 'twitch' ? 'is-current' : ''}" href="/twitch/">Twitch</a>
        <a class="nav-link ${currentSite === 'kick' ? 'is-current' : ''}" href="/kick/">Kick</a>
      </nav>
      <div class="header-note">Unofficial live observation UI</div>
    </header>
  `
}
