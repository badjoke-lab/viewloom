import './styles.css'
import './landing-theme.css'
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
    title: 'Twitch data',
    eyebrow: 'Now / Today / Rivalry / Trends',
    description:
      'Observe Twitch data through a dedicated shell focused on Heatmap, Day Flow, Battle Lines, and History.',
    cta: 'Open Twitch data',
    accentClass: 'theme-twitch',
    notes: ['Heatmap', 'Day Flow', 'Battle Lines', 'History'],
  },
  {
    slug: 'kick',
    title: 'Kick data',
    eyebrow: 'Now / Today / Rivalry / Trends',
    description:
      'Observe Kick data through the same shell with separate provider-specific status, coverage, and limitations.',
    cta: 'Open Kick data',
    accentClass: 'theme-kick',
    notes: ['Heatmap', 'Day Flow', 'Battle Lines', 'History'],
  },
]


const siteMeta: Record<SiteKey, SiteMeta> = {
  twitch: {
    key: 'twitch',
    title: 'Twitch data',
    eyebrow: 'Twitch data',
    accentClass: 'theme-twitch',
    basePath: '/twitch',
    shellStatus: 'Shell ready for real Twitch data mounting',
    intro:
      'A dedicated Twitch data observatory that keeps Now, Today, and Rivalry separate while staying dense and readable.',
    featureLead:
      'Open the current live field, read the daily landscape, or inspect the strongest current rivalry.',
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
        title: 'Now / Today / Rivalry',
        body: 'Three separate reads of the same live ecosystem, without collapsing into a single all-in-one dashboard.',
      },
      {
        label: 'Data Status',
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
    title: 'Kick data',
    eyebrow: 'Kick data',
    accentClass: 'theme-kick',
    basePath: '/kick',
    shellStatus: 'Shell ready for real Kick data mounting',
    intro:
      'A parallel Kick data observatory with the same layout grammar, but its own color identity, status surface, and future collector path.',
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
        label: 'Data Status',
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
    chartTitle: 'Heatmap field',
    chartBody:
      'This main field renders the production heatmap: tile area for viewers, color for momentum, activity as secondary signal.',
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
        value: 'Heatmap',
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
        body: 'This page reads the daily landscape instead of the current instant or a single rivalry.',
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
    label: 'Rivalry',
    title: 'Battle Lines',
    description:
      'Read rivalry, reversal, surge, and pressure through a chart built around recommended and custom battle states.',
    chartTitle: 'Battle stage',
    chartBody:
      'This main field will become the rivalry-first battle chart with recommended primary battle, secondary entries, and custom state control.',
    rightRailTitle: 'Read it through',
    rightRailItems: ['Primary battle first', 'Reversal-aware rivalry', 'Recommended then custom flow'],
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
        value: 'Rivalry',
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
  if (kind === 'twitch-heatmap' || kind === 'kick-heatmap') {
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
    <div class="page-shell page-shell--portal landing-page landing-page--portal">
      ${renderHeader('portal')}
      <main class="page-main landing-main">
        <section class="hero hero--portal landing-hero landing-hero--portal">
          <div class="landing-hero__copy">
            <div class="eyebrow">ViewLoom</div>
            <h1>Choose a live ecosystem, then read it through fixed views.</h1>
            <p class="hero-copy">
              ViewLoom separates platforms first, then lets each site read live activity through Heatmap, Day Flow, Battle Lines, and History.
            </p>
            <div class="hero-actions landing-hero__actions">
              <a class="button button--primary button--twitch landing-main-cta" href="/twitch/"><span class="landing-cta-icon">T</span><span>Open Twitch data</span><span class="landing-cta-arrow">→</span></a>
              <a class="button button--primary button--kick landing-main-cta" href="/kick/"><span class="landing-cta-icon">K</span><span>Open Kick data</span><span class="landing-cta-arrow">→</span></a>
            </div>
          </div>
          <aside class="status-panel status-panel--portal landing-role-card">
            <div class="status-panel__label">Portal role</div>
            <div class="status-panel__title">An entry point, not a mixed dashboard</div>
            <p>
              The portal stays light, branded, and selective. Heavy feature reading happens inside each platform site.
            </p>
            <div class="metric-list metric-list--compact">
              <div class="metric-chip">
                <span class="metric-chip__label">Structure</span>
                <strong>Platform-first</strong>
              </div>
              <div class="metric-chip">
                <span class="metric-chip__label">Views</span>
                <strong>Now / Today / Rivalry / Trends</strong>
              </div>
            </div>
          </aside>
        </section>

        <section class="card-grid card-grid--portal landing-platform-grid">
          ${cards.map(renderPortalCard).join('')}
        </section>

        <h2 class="landing-section-title">How ViewLoom works</h2>
        <section class="steps-grid landing-steps">
          ${[
            {
              step: '01',
              title: 'Choose a platform',
              body: 'Twitch and Kick stay separated as independent observation surfaces.',
            },
            {
              step: '02',
              title: 'Open a fixed view',
              body: 'Heatmap, Day Flow, Battle Lines, and History keep distinct roles instead of collapsing into one page.',
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

        <section class="support-strip" aria-label="Support ViewLoom">
          <div>
            <h2>♡ Support ViewLoom</h2>
            <p>Help keep this independent live data view online and improving.</p>
          </div>
          <a class="button button--support support-strip__button" href="/support/">♡ Support ViewLoom</a>
        </section>

        ${renderLandingFooter()}
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
      <div class="tag-list landing-platform-links">
        ${card.notes
          .map((note) => {
            const slug =
              note === 'Heatmap'
                ? 'heatmap'
                : note === 'Day Flow'
                  ? 'day-flow'
                  : note === 'Battle Lines'
                    ? 'battle-lines'
                    : 'history'
            return `<a class="tag-pill landing-chip landing-chip--link" href="/${card.slug}/${slug}/">${note}</a>`
          })
          .join('')}
      </div>
      <a class="button button--ghost landing-platform-cta" href="/${card.slug}/">${card.cta}</a>
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
  const isTwitch = kind === 'twitch'
  const providerLabel = isTwitch ? 'Twitch' : 'Kick'
  const statusCopy = isTwitch
    ? 'Coverage, freshness, source mode, and known limitations belong in Twitch Data Status.'
    : 'Kick is in provider-specific recovery. Check Data Status before parity QA.'
  const heroTitle = isTwitch
    ? 'Read Twitch live activity through fixed views.'
    : 'Observe Kick live activity with clarity.'
  const heroBody = isTwitch
    ? 'Observe Twitch live activity through Heatmap, Day Flow, Battle Lines, and History. Separate reads keep each perspective clear and honest.'
    : 'ViewLoom separates Kick provider data first, then lets you explore live activity through Heatmap, Day Flow, Battle Lines, and History & Trends.'

  return `
    <div class="page-shell page-shell--site landing-page landing-page--provider ${site.accentClass}">
      ${renderHeader(kind)}
      <main class="page-main landing-main">
        <section class="hero hero--site landing-hero landing-hero--provider">
          <div class="landing-hero__copy">
            <div class="eyebrow">${site.eyebrow}</div>
            <h1>${heroTitle}</h1>
            <p class="hero-copy">${heroBody}</p>
            <div class="hero-actions landing-hero__actions">
              <a class="button button--secondary" href="${site.basePath}/heatmap/">Heatmap</a>
              <a class="button button--secondary" href="${site.basePath}/day-flow/">Day Flow</a>
              <a class="button button--secondary" href="${site.basePath}/battle-lines/">Battle Lines</a>
              <a class="button button--secondary" href="${site.basePath}/history/">History & Trends</a>
            </div>
          </div>
          <aside class="status-panel landing-role-card">
            <div class="status-panel__label">Current state</div>
            <div class="status-panel__title">Shell ready for real ${providerLabel} data.</div>
            <p>
              This top page is rebuilt into a chart-first home with a strong overview stage, dense right rail, and lower support blocks.
            </p>
            <div class="metric-list">
              <div class="metric-chip">
                <span class="metric-chip__label">Role split</span>
                <strong>Now / Today / Rivalry / Trends</strong>
              </div>
              <div class="metric-chip">
                <span class="metric-chip__label">${isTwitch ? 'Status' : 'Coverage'}</span>
                <strong>${isTwitch ? 'Read coverage honestly' : 'Provider-specific reading'}</strong>
              </div>
            </div>
          </aside>
        </section>

        <section class="feature-grid feature-grid--top landing-feature-grid">
          ${renderHomeFeatureCards(site)}
        </section>

        <section class="support-grid landing-secondary-grid">
          ${renderProviderSecondaryCards(site, providerLabel)}
        </section>

        ${renderLandingFooter('<a href="' + site.basePath + '/status/">Data Status</a>')}
      </main>
    </div>
  `
}

function renderHomeFeatureCards(site: SiteMeta): string {
  return [
    {
      label: 'Now',
      title: 'Heatmap',
      body: 'Read who is big, rising, or active right now through a dense production treemap.',
      href: `${site.basePath}/heatmap/`,
      cta: 'Open Heatmap',
      icon: '▦',
    },
    {
      label: 'Today',
      title: 'Day Flow',
      body: 'Read the daily audience landscape as a single terrain, with total volume and share treated as separate views.',
      href: `${site.basePath}/day-flow/`,
      cta: 'Open Day Flow',
      icon: '↗',
    },
    {
      label: 'Rivalry',
      title: 'Battle Lines',
      body: 'Read rivalry, reversal, surge, and pressure through a chart built around recommended and custom battle states.',
      href: `${site.basePath}/battle-lines/`,
      cta: 'Open Battle Lines',
      icon: '⚔',
    },
    {
      label: 'Trends',
      title: 'History & Trends',
      body: 'Review observed days, top streamers, daily peaks, viewer-minutes, and longer-range changes.',
      href: `${site.basePath}/history/`,
      cta: 'Open History & Trends',
      icon: '↺',
    },
  ]
    .map(
      (feature) => `
        <article class="feature-card feature-card--top landing-feature-card">
          <div class="landing-feature-card__icon">${feature.icon}</div>
          <div class="feature-card__label">${feature.label}</div>
          <h2>${feature.title}</h2>
          <p>${feature.body}</p>
          <a class="button button--ghost feature-card__link" href="${feature.href}">${feature.cta}</a>
        </article>
      `,
    )
    .join('')
}

function renderProviderSecondaryCards(site: SiteMeta, providerLabel: string): string {
  return [
    {
      label: 'Data Status',
      title: 'Coverage, freshness, and known limitations.',
      body: 'Check freshness, source mode, coverage quality, and provider-specific limitations before judging the charts.',
      href: `${site.basePath}/status/`,
      cta: 'Open Data Status',
      icon: '✓',
    },
    {
      label: 'About this data',
      title: `How ViewLoom reads ${providerLabel} provider data.`,
      body: 'Understand the reading model, scope boundaries, and how each view differs.',
      href: '/about/',
      cta: 'About this data',
      icon: '◇',
    },
    {
      label: 'Support / Contact',
      title: 'Support ViewLoom',
      body: 'Help keep this independent live data view online, maintained, and improving.',
      href: '/support/',
      cta: '♡ Support ViewLoom',
      icon: '♡',
    },
  ]
    .map(
      (card) => `
        <article class="support-card landing-secondary-card">
          <div class="landing-feature-card__icon">${card.icon}</div>
          <div class="support-card__label">${card.label}</div>
          <h2>${card.title}</h2>
          <p>${card.body}</p>
          <a class="button button--ghost feature-card__link" href="${card.href}">${card.cta}</a>
        </article>
      `,
    )
    .join('')
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
  const isLiveHeatmap = feature.key === 'heatmap'

  const featureLayoutSection = `
    <section class="feature-layout ${isLiveHeatmap ? 'feature-layout--heatmap' : ''}">
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

  const layoutBody = isLiveHeatmap
    ? `<div id="heatmap-layout-root" class="heatmap-layout-root" data-layout-mode="wide">${featureLayoutSection}${supportGridSection}</div>`
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
          ${
            isLiveHeatmap
              ? `
          <aside class="status-panel">
            <div class="status-panel__label">Live snapshot</div>
            <div id="heatmap-hero-status-title" class="status-panel__title">Waiting for live heatmap API</div>
            <p id="heatmap-hero-status-body">
              The hero panel will switch to the latest Twitch data snapshot once the heatmap API responds.
            </p>
          </aside>`
              : `
          <aside class="status-panel">
            <div class="status-panel__label">Build state</div>
            <div class="status-panel__title">Feature shell ready</div>
            <p>
              This route exists on the new ViewLoom structure and is ready to receive the real renderer and provider-backed API path.
            </p>
          </aside>`
          }
        </section>

        <div class="site-subnav" aria-label="Site sections">
          ${renderSiteSubnav(site.key, feature.key)}
        </div>

        ${isLiveHeatmap ? renderHeatmapViewModeBar() : ''}

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
        <p class="view-mode-bar__body">Wide keeps the visual field large. Split pairs the field with the detail panel.</p>
      </div>
      <div class="view-mode-bar__actions">
        <button type="button" class="layout-toggle is-active" data-layout-mode="wide" aria-pressed="true">Wide</button>
        <button type="button" class="layout-toggle" data-layout-mode="split" aria-pressed="false">Split</button>
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
  const badge =
    currentSite === 'twitch'
      ? 'Unofficial Twitch data'
      : currentSite === 'kick'
        ? 'Unofficial Kick data'
        : 'Unofficial data view'

  return `
    <header class="site-header landing-header">
      <a class="brand" href="/">ViewLoom</a>

      <nav class="landing-primary-nav" aria-label="Platform navigation">
        <a class="nav-link ${current === 'portal' ? 'is-current' : ''}" href="/">Portal</a>
        <a class="nav-link ${currentSite === 'twitch' ? 'is-current' : ''}" href="/twitch/">Twitch data</a>
        <a class="nav-link ${currentSite === 'kick' ? 'is-current' : ''}" href="/kick/">Kick data</a>
      </nav>

      <nav class="landing-utility-nav" aria-label="Site navigation">
        <a class="nav-link" href="/about/">About</a>
        <a class="nav-link nav-link--support support-link" href="/support/">♡ Support</a>
        <a class="nav-link" href="/contact/">Contact</a>
      </nav>

      <a class="landing-mobile-support" href="/support/">♡ Support</a>

      <details class="landing-mobile-menu">
        <summary>Menu</summary>
        <nav class="landing-mobile-menu__panel" aria-label="Mobile menu">
          <a href="/">Portal</a>
          <a href="/twitch/">Twitch data</a>
          <a href="/kick/">Kick data</a>
          <a href="/about/">About</a>
          <a href="/support/">♡ Support</a>
          <a href="/contact/">Contact</a>
          <a href="https://github.com/badjoke-lab/viewloom">GitHub</a>
        </nav>
      </details>

      <div class="header-note">${badge}</div>
    </header>
  `
}

function renderLandingFooter(extra = ''): string {
  return `
    <footer class="landing-footer">
      <a href="/about/">About</a>
      <a class="support-link" href="/support/">♡ Support</a>
      <a href="/contact/">Contact</a>
      <a href="https://github.com/badjoke-lab/viewloom">GitHub</a>
      ${extra}
    </footer>
  `
}

