import './styles.css'

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
}

type SiteMeta = {
  key: SiteKey
  title: string
  eyebrow: string
  accentClass: string
  basePath: string
  shellStatus: string
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
}

const cards: SiteCard[] = [
  {
    slug: 'twitch',
    title: 'Twitch ViewLoom',
    eyebrow: 'Now / Today / Rivalries',
    description:
      'Read Twitch live activity through Heatmap, Day Flow, and Battle Lines.',
    cta: 'Open Twitch site',
    accentClass: 'theme-twitch',
  },
  {
    slug: 'kick',
    title: 'Kick ViewLoom',
    eyebrow: 'Now / Today / Rivalries',
    description:
      'Read Kick live activity through Heatmap, Day Flow, and Battle Lines.',
    cta: 'Open Kick site',
    accentClass: 'theme-kick',
  },
]

const siteMeta: Record<SiteKey, SiteMeta> = {
  twitch: {
    key: 'twitch',
    title: 'Twitch ViewLoom',
    eyebrow: 'Twitch',
    accentClass: 'theme-twitch',
    basePath: '/twitch',
    shellStatus: 'Twitch shell ready',
  },
  kick: {
    key: 'kick',
    title: 'Kick ViewLoom',
    eyebrow: 'Kick',
    accentClass: 'theme-kick',
    basePath: '/kick',
    shellStatus: 'Kick shell ready',
  },
}

const featureMeta: Record<FeatureKey, FeatureMeta> = {
  heatmap: {
    key: 'heatmap',
    label: 'Now',
    title: 'Heatmap',
    description: 'Treemap-first live field for who is big, rising, or active now.',
    chartTitle: 'Treemap field placeholder',
    chartBody:
      'This block will become the production Heatmap board mounted on the new shell.',
    rightRailTitle: 'Feature goals',
    rightRailItems: ['Area = viewers', 'Color = momentum', 'Activity = secondary signal'],
  },
  'day-flow': {
    key: 'day-flow',
    label: 'Today',
    title: 'Day Flow',
    description:
      'Daily ownership landscape for volume, share, and key movement windows.',
    chartTitle: 'Day timeline placeholder',
    chartBody:
      'This block will become the stacked daily landscape with time focus and detail panels.',
    rightRailTitle: 'Feature goals',
    rightRailItems: ['Top N + Others', 'Volume and Share modes', 'Today-first daily reading'],
  },
  'battle-lines': {
    key: 'battle-lines',
    label: 'Compare',
    title: 'Battle Lines',
    description:
      'Rivalry-focused comparison page for reversals, surges, and pressure.',
    chartTitle: 'Rivalry chart placeholder',
    chartBody:
      'This block will become the comparison-first battle chart with recommended and custom states.',
    rightRailTitle: 'Feature goals',
    rightRailItems: ['Primary battle first', 'Reversal-aware comparison', 'Recommended then custom flow'],
  },
}

const page = ((document.body.dataset.page as PageKind | undefined) ?? 'portal')
const app = document.querySelector<HTMLDivElement>('#app')

if (!app) {
  throw new Error('#app not found')
}

app.innerHTML = renderPage(page)

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
        <section class="hero hero--portal">
          <div class="eyebrow">ViewLoom</div>
          <h1>Observe live ecosystems across platforms.</h1>
          <p class="hero-copy">
            Enter dedicated Twitch and Kick observatories built around Now, Today,
            and Rivalries.
          </p>
          <div class="hero-actions">
            <a class="button button--primary" href="/twitch/">Open Twitch</a>
            <a class="button button--secondary" href="/kick/">Open Kick</a>
          </div>
        </section>

        <section class="card-grid card-grid--portal">
          ${cards.map(renderPortalCard).join('')}
        </section>

        <section class="info-strip">
          <div class="info-card">
            <h2>Two separate observatories</h2>
            <p>
              Twitch and Kick keep separate shells, data paths, and status surfaces.
            </p>
          </div>
          <div class="info-card">
            <h2>Three fixed roles</h2>
            <p>Heatmap = Now. Day Flow = Today. Battle Lines = Compare.</p>
          </div>
          <div class="info-card">
            <h2>Foundation first</h2>
            <p>
              This shell is the first ViewLoom rebuild milestone before feature pages land.
            </p>
          </div>
        </section>
      </main>
    </div>
  `
}

function renderPortalCard(card: SiteCard): string {
  return `
    <article class="surface-card ${card.accentClass}">
      <div class="surface-card__eyebrow">${card.eyebrow}</div>
      <h2>${card.title}</h2>
      <p>${card.description}</p>
      <a class="button button--ghost" href="/${card.slug}/">${card.cta}</a>
    </article>
  `
}

function renderSiteHome(kind: SiteKey): string {
  const site = siteMeta[kind]

  return `
    <div class="page-shell page-shell--site ${site.accentClass}">
      ${renderHeader(kind)}
      <main class="page-main">
        <section class="hero hero--site">
          <div>
            <div class="eyebrow">${site.eyebrow}</div>
            <h1>${site.title}</h1>
            <p class="hero-copy">
              Dedicated shell for the ${site.key} side of ViewLoom.
              Heatmap, Day Flow, and Battle Lines will mount on this frame next.
            </p>
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
              Shared shell is in place. Feature-specific pages and live data wiring come next.
            </p>
          </aside>
        </section>

        <section class="feature-grid">
          ${(['heatmap', 'day-flow', 'battle-lines'] as FeatureKey[])
            .map((feature) => renderFeatureCard(site, featureMeta[feature]))
            .join('')}
        </section>
      </main>
    </div>
  `
}

function renderFeatureCard(site: SiteMeta, feature: FeatureMeta): string {
  return `
    <article class="feature-card">
      <div class="feature-card__label">${feature.label}</div>
      <h2>${feature.title}</h2>
      <p>${feature.description}</p>
      <a class="button button--ghost feature-card__link" href="${site.basePath}/${feature.key}/">Open ${feature.title}</a>
    </article>
  `
}

function renderFeaturePage(kind: Exclude<PageKind, 'portal' | 'twitch' | 'kick'>): string {
  const [siteKey, ...rest] = kind.split('-') as [SiteKey, ...string[]]
  const featureKey = rest.join('-') as FeatureKey
  const site = siteMeta[siteKey]
  const feature = featureMeta[featureKey]

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
              This route now exists on the new ViewLoom structure and is ready for the first real feature mount.
            </p>
          </aside>
        </section>

        <div class="site-subnav" aria-label="Site sections">
          ${renderSiteSubnav(site.key, feature.key)}
        </div>

        <section class="feature-layout">
          <article class="chart-stage">
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

          <aside class="rail-card">
            <div class="rail-card__label">${feature.rightRailTitle}</div>
            <ul class="rail-list">
              ${feature.rightRailItems.map((item) => `<li>${item}</li>`).join('')}
            </ul>
          </aside>
        </section>
      </main>
    </div>
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
    </header>
  `
}
