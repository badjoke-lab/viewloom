import './styles.css'
import './landing-theme.css'

type Page = 'about' | 'support'

type InfoCard = {
  label: string
  title?: string
  body: string
}

const contactFormUrl =
  'https://docs.google.com/forms/d/e/1FAIpQLSdhreuxEz7w0eSjslTyVLL-axV6IJdTp5RU5VXCM3ApIz35-Q/viewform?usp=dialog'

const supportPaymentUrl = 'https://buy.stripe.com/6oUcMYeRh0Na2oX3cDcIE03'
const githubUrl = 'https://github.com/badjoke-lab/viewloom'

const app = document.querySelector<HTMLDivElement>('#app')
if (!app) throw new Error('#app not found')

const pageName = document.body.dataset.page as Page | undefined
const page = pageName === 'support' ? 'support' : 'about'

document.title = page === 'support' ? 'Support — ViewLoom' : 'About — ViewLoom'
app.innerHTML = page === 'support' ? renderSupportPage() : renderAboutPage()

function renderHeader(current: Page): string {
  return `
    <header class="site-header landing-header outer-header-v2">
      <a class="brand" href="/">ViewLoom</a>

      <nav class="landing-primary-nav" aria-label="Platform navigation">
        <a class="nav-link" href="/">Portal</a>
        <a class="nav-link" href="/twitch/">Twitch data</a>
        <a class="nav-link" href="/kick/">Kick data</a>
      </nav>

      <nav class="landing-utility-nav" aria-label="Site navigation">
        <a class="nav-link ${current === 'about' ? 'is-current' : ''}" href="/about/">About</a>
        <a class="nav-link nav-link--support support-link ${current === 'support' ? 'is-current' : ''}" href="/support/">♡ Support</a>
        <a class="nav-link" href="${escapeAttr(contactFormUrl)}" target="_blank" rel="noreferrer">Contact</a>
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
          <a href="${escapeAttr(contactFormUrl)}" target="_blank" rel="noreferrer">Contact</a>
          <a href="${githubUrl}" target="_blank" rel="noreferrer">GitHub</a>
        </nav>
      </details>

      <div class="header-note">Unofficial data view</div>
    </header>
  `
}

function renderAboutPage(): string {
  return `
    <div class="page-shell outer-page-v2">
      ${renderHeader('about')}

      <main class="outer-main-v2">
        <section class="outer-hero-v2">
          <div>
            <div class="outer-kicker">ViewLoom · About</div>
            <h1>About ViewLoom</h1>
            <p>
              ViewLoom is an unofficial observation surface for live-stream activity across Twitch and Kick.
            </p>
            <p>
              It helps you read what is active now, how audience movement changes through the day, where streamers or categories are competing, and how activity has changed over time.
            </p>
            <p>
              ViewLoom does not merge Twitch and Kick into one mixed dashboard. Each platform stays separate, while the same fixed views make them easier to compare.
            </p>
          </div>

          <aside class="outer-side-panel-v2">
            <div class="outer-kicker">Page role</div>
            <h2>Shared context page</h2>
            <p>This page explains the ViewLoom structure and how to read the site.</p>
            <p>Provider-specific freshness, collection status, missing data, and known limits belong in Twitch Data Status and Kick Data Status.</p>
          </aside>
        </section>

        ${renderSectionHeader('What ViewLoom does')}
        <section class="outer-grid-v2 outer-grid-v2--four">
          ${renderInfoCards([
            {
              label: 'Platform-first',
              title: 'Twitch and Kick stay separate.',
              body:
                'Twitch and Kick are treated as separate observation surfaces. Even when the views look similar, each provider can have different data availability, update timing, source limits, and collection status.',
            },
            {
              label: 'Fixed views',
              title: 'Each view answers a different question.',
              body:
                'Heatmap is for Now, Day Flow is for Today, Battle Lines is for Rivalry, and History & Trends is for longer-term changes. ViewLoom avoids forcing every question into one overloaded dashboard.',
            },
            {
              label: 'Honest status',
              title: 'Data state is part of the product.',
              body:
                'Live data may be delayed, partial, sampled, stale, unavailable, or affected by provider-side limits. ViewLoom surfaces these limits instead of hiding them behind polished visuals.',
            },
            {
              label: 'Unofficial project',
              title: 'Independent and unofficial.',
              body:
                'ViewLoom is not affiliated with Twitch, Kick, or their operators. The charts should be read as unofficial observation views, not official statistics or official rankings.',
            },
          ])}
        </section>

        ${renderSectionHeader('How to read ViewLoom')}
        <section class="outer-grid-v2 outer-grid-v2--three">
          ${renderInfoCards([
            {
              label: 'Now',
              title: 'Heatmap',
              body:
                'Use Heatmap to see who is big, rising, or active right now. It is the fastest way to read where attention is concentrated at the current moment.',
            },
            {
              label: 'Today',
              title: 'Day Flow',
              body:
                'Use Day Flow to read how audience movement changes through the day. It is designed for time-of-day shifts, category movement, and daily audience patterns.',
            },
            {
              label: 'Rivalry',
              title: 'Battle Lines',
              body:
                'Use Battle Lines to read competition, reversals, pressure, and close movement between streamers or categories. It is not just a ranking view; it is designed to show movement between sides.',
            },
            {
              label: 'Trends',
              title: 'History & Trends',
              body:
                'Use History & Trends to review observed days, top streamers, daily peaks, viewer-minutes, and longer-range changes.',
            },
            {
              label: 'Freshness',
              title: 'Data Status',
              body:
                'Use Data Status to check freshness, source mode, coverage quality, missing data, and known provider-specific limits. Check it before treating any chart as complete.',
            },
          ])}
        </section>

        <section class="outer-action-v2">
          <div>
            <div class="outer-kicker">Start reading</div>
            <h2>Choose a provider first.</h2>
            <p>
              Twitch and Kick are available as separate observation surfaces. Open a provider page first, then move into Heatmap, Day Flow, Battle Lines, History & Trends, or Data Status.
            </p>
          </div>
          <div class="outer-actions-v2">
            <a class="button button--primary button--twitch" href="/twitch/">Open Twitch data</a>
            <a class="button button--primary button--kick" href="/kick/">Open Kick data</a>
            <a class="button button--secondary" href="/twitch/status/">Twitch Status</a>
            <a class="button button--secondary" href="/kick/status/">Kick Status</a>
          </div>
        </section>

        <section class="outer-note-v2">
          <div class="outer-kicker">Note</div>
          <p>
            ViewLoom is independent and is not affiliated with Twitch or Kick. The data shown here is unofficial and based on what can be collected, processed, and displayed by ViewLoom. Data may be delayed, partial, stale, unavailable, or limited by provider-specific conditions.
          </p>
        </section>

        ${renderFooter()}
      </main>
    </div>
  `
}

function renderSupportPage(): string {
  return `
    <div class="page-shell outer-page-v2">
      ${renderHeader('support')}

      <main class="outer-main-v2">
        <section class="outer-hero-v2 outer-hero-v2--support">
          <div>
            <div class="outer-kicker">ViewLoom · Support</div>
            <h1>Support ViewLoom</h1>
            <p>
              ViewLoom is an independent observation project for reading live-stream activity across Twitch and Kick.
            </p>
            <p>
              Support helps keep the site online, maintain data collection, improve the interface, and continue showing data limits clearly.
            </p>
            <p>
              Support is optional. It does not unlock a paid mode, subscription, or provider-specific feature.
            </p>
            <div class="outer-actions-v2 outer-actions-v2--hero">
              <a class="button button--primary outer-support-button" href="${supportPaymentUrl}" target="_blank" rel="noopener noreferrer">♡ Support ViewLoom</a>
              <a class="button button--secondary" href="${githubUrl}" target="_blank" rel="noopener noreferrer">Open GitHub</a>
            </div>
          </div>

          <aside class="outer-side-panel-v2">
            <div class="outer-kicker">Support note</div>
            <h2>Optional support, no paid gate</h2>
            <p>The data views remain open.</p>
            <p>Support helps with collection, storage, deployment checks, maintenance, and data-quality work.</p>
          </aside>
        </section>

        ${renderSectionHeader('What support helps with')}
        <section class="outer-grid-v2 outer-grid-v2--four">
          ${renderInfoCards([
            {
              label: 'Collection & storage',
              title: 'Keeping observation running',
              body:
                'ViewLoom depends on continued collection, scheduled jobs, storage, history data, and checks that confirm whether data is fresh or missing. Support helps keep those operations running.',
            },
            {
              label: 'UI & data quality',
              title: 'Making the views easier to read',
              body:
                'Raw live-stream data is difficult to read on its own. Support helps improve Heatmap, Day Flow, Battle Lines, History & Trends, mobile layouts, empty states, and bug fixes.',
            },
            {
              label: 'Status transparency',
              title: 'Showing limits instead of hiding them',
              body:
                'ViewLoom should make missing data, stale data, source limitations, and provider-specific issues visible. Support helps improve Data Status and make coverage limits easier to understand.',
            },
            {
              label: 'Provider maintenance',
              title: 'Keeping Twitch and Kick working separately',
              body:
                'Twitch and Kick do not behave the same way. Support helps maintain provider-specific logic, fix broken data paths, and keep each platform readable without mixing them into one unclear view.',
            },
          ])}
        </section>

        ${renderSectionHeader('What support does not do')}
        <section class="outer-grid-v2 outer-grid-v2--four">
          ${renderInfoCards([
            {
              label: 'No paid gate',
              body:
                'Support does not unlock a private dashboard or paid-only version of ViewLoom. The core observation views are intended to remain open.',
            },
            {
              label: 'No subscription',
              body:
                'Support is not a subscription. The support button opens a public Stripe Payment Link for optional one-time support.',
            },
            {
              label: 'No official affiliation',
              body:
                'Supporting ViewLoom does not create any official relationship with Twitch or Kick. ViewLoom remains an independent, unofficial project.',
            },
            {
              label: 'No hidden data sale',
              body:
                'Support is not a hidden data sale or a paid access layer. Data quality, freshness, and limits are explained through Data Status pages.',
            },
          ])}
        </section>

        <section class="outer-action-v2">
          <div>
            <div class="outer-kicker">Other ways to help</div>
            <h2>Support is not only money.</h2>
            <p>
              You can also help by reporting issues, checking Data Status before sharing charts, opening GitHub, or sharing ViewLoom with people who may find it useful.
            </p>
          </div>
          <div class="outer-actions-v2">
            <a class="button button--secondary" href="${escapeAttr(contactFormUrl)}" target="_blank" rel="noreferrer">Contact</a>
            <a class="button button--secondary" href="${githubUrl}" target="_blank" rel="noreferrer">Open GitHub</a>
            <a class="button button--secondary" href="/twitch/status/">Twitch Status</a>
            <a class="button button--secondary" href="/kick/status/">Kick Status</a>
          </div>
        </section>

        <section class="outer-action-v2 outer-action-v2--support">
          <div>
            <div class="outer-kicker">Direct support</div>
            <h2>Help keep ViewLoom online and improving.</h2>
            <p>The support link opens a public Stripe Payment Link in a new tab. No Stripe API keys are stored in the frontend.</p>
          </div>
          <div class="outer-actions-v2">
            <a class="button button--primary outer-support-button" href="${supportPaymentUrl}" target="_blank" rel="noopener noreferrer">♡ Support ViewLoom</a>
          </div>
        </section>

        <section class="outer-note-v2 outer-note-v2--support">
          <div class="outer-kicker">Note</div>
          <p>
            Support is optional. GitHub remains the technical reference point for the project. Provider-specific data freshness, collection status, known issues, and limitations are shown in Twitch Data Status and Kick Data Status.
          </p>
        </section>

        ${renderFooter()}
      </main>
    </div>
  `
}

function renderSectionHeader(title: string): string {
  return `
    <div class="outer-section-heading-v2">
      <h2>${escapeText(title)}</h2>
    </div>
  `
}

function renderInfoCards(cards: InfoCard[]): string {
  return cards.map((card) => renderInfoCard(card)).join('')
}

function renderInfoCard(card: InfoCard): string {
  return `
    <article class="outer-info-v2">
      <div class="outer-kicker">${escapeText(card.label)}</div>
      ${card.title ? `<h3>${escapeText(card.title)}</h3>` : ''}
      <p>${escapeText(card.body)}</p>
    </article>
  `
}

function renderFooter(): string {
  return `
    <footer class="landing-footer outer-footer-v2">
      <a href="/about/">About</a>
      <a class="support-link" href="/support/">♡ Support</a>
      <a href="${escapeAttr(contactFormUrl)}" target="_blank" rel="noreferrer">Contact</a>
      <a href="${githubUrl}" target="_blank" rel="noreferrer">GitHub</a>
      <a href="/twitch/status/">Twitch Status</a>
      <a href="/kick/status/">Kick Status</a>
    </footer>
  `
}

function escapeText(value: string): string {
  const span = document.createElement('span')
  span.textContent = value
  return span.innerHTML
}

function escapeAttr(value: string): string {
  return escapeText(value).replace(/"/g, '&quot;')
}
