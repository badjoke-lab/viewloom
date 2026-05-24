import './styles.css'
import './landing-theme.css'

type Page = 'about' | 'support'

const contactFormUrl =
  'https://docs.google.com/forms/d/e/1FAIpQLSdhreuxEz7w0eSjslTyVLL-axV6IJdTp5RU5VXCM3ApIz35-Q/viewform?usp=dialog'

const supportPaymentUrl = 'https://buy.stripe.com/6oUcMYeRh0Na2oX3cDcIE03'
const githubUrl = 'https://github.com/badjoke-lab/viewloom'

const app = document.querySelector<HTMLDivElement>('#app')
if (!app) throw new Error('#app not found')

const pageName = document.body.dataset.page as Page | undefined
const page = pageName === 'support' ? 'support' : 'about'

document.title = page === 'support' ? 'Support ViewLoom | ViewLoom' : 'About ViewLoom | ViewLoom'
app.innerHTML = page === 'support' ? renderSupportPage() : renderAboutPage()

function renderOuterHeader(current: Page): string {
  return `
    <header class="site-header landing-header outer-header">
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
    <div class="page-shell outer-page outer-page--portal-tone">
      ${renderOuterHeader('about')}
      <main class="page-main outer-main">
        <section class="landing-hero outer-hero outer-hero--about">
          <div class="landing-hero__copy">
            <div class="eyebrow">ViewLoom · About</div>
            <h1>About ViewLoom</h1>
            <p class="hero-copy">
              ViewLoom is an unofficial observation surface for live-stream activity. It keeps Twitch and Kick separated, then reads each provider through fixed views.
            </p>
          </div>
          <aside class="status-panel landing-role-card">
            <div class="status-panel__label">Outer page role</div>
            <div class="status-panel__title">Shared context, not provider data</div>
            <p>About is a common ViewLoom page. Provider-specific freshness, limits, and collection notes belong in each Data Status page.</p>
          </aside>
        </section>

        <section class="outer-card-grid outer-card-grid--about">
          ${[
            ['Platform-first', 'Twitch and Kick stay separated as independent observation surfaces.'],
            ['Fixed views', 'Heatmap is Now, Day Flow is Today, Battle Lines is Rivalry, and History is Trends.'],
            ['Status honesty', 'Coverage can be delayed, partial, sampled, stale, or unavailable depending on source state.'],
            ['Shared pages', 'About, Support, Contact, and GitHub are common ViewLoom routes.'],
          ]
            .map(
              ([title, body]) => `
                <article class="outer-info-card">
                  <div class="outer-card-label">${escapeText(title)}</div>
                  <p>${escapeText(body)}</p>
                </article>
              `,
            )
            .join('')}
        </section>

        <section class="outer-action-panel">
          <div>
            <div class="outer-card-label">Start reading</div>
            <h2>Choose a provider first.</h2>
            <p>Use Portal for entry, then open Twitch or Kick for the actual Now / Today / Rivalry / Trends views.</p>
          </div>
          <div class="outer-action-panel__buttons">
            <a class="button button--primary button--twitch" href="/twitch/">Open Twitch data</a>
            <a class="button button--primary button--kick" href="/kick/">Open Kick data</a>
          </div>
        </section>

        <section class="outer-note-card">
          <div class="outer-card-label">Note</div>
          <p>ViewLoom is independent and is not affiliated with Twitch or Kick. Contact opens a Google Form. Provider implementation details belong to Twitch Data Status and Kick Data Status.</p>
        </section>

        ${renderOuterFooter(true)}
      </main>
    </div>
  `
}

function renderSupportPage(): string {
  return `
    <div class="page-shell outer-page outer-page--portal-tone">
      ${renderOuterHeader('support')}
      <main class="page-main outer-main">
        <section class="landing-hero outer-hero outer-hero--support">
          <div class="landing-hero__copy">
            <div class="eyebrow">ViewLoom · Support</div>
            <h1>Support ViewLoom</h1>
            <p class="hero-copy">
              Support helps keep ViewLoom running as a lightweight independent observation project. It is optional and shared across the whole site.
            </p>
            <div class="hero-actions outer-hero-actions">
              <a class="button button--primary outer-support-primary" href="${supportPaymentUrl}" target="_blank" rel="noopener noreferrer">♡ Support ViewLoom</a>
              <a class="button button--secondary" href="${githubUrl}" target="_blank" rel="noopener noreferrer">Open GitHub</a>
            </div>
          </div>
          <aside class="status-panel landing-role-card">
            <div class="status-panel__label">Support note</div>
            <div class="status-panel__title">Optional support, no paid gate</div>
            <p>Support does not unlock a paid mode, subscription, or provider-specific feature. The data views remain open.</p>
          </aside>
        </section>

        <section class="outer-card-grid outer-card-grid--support">
          ${[
            ['Operations', 'Collection jobs, storage, deployment checks, and future coverage improvements.'],
            ['Maintenance', 'UI fixes, feature page updates, source-mode changes, and provider-specific edge cases.'],
            ['Transparency', 'Status-first design that shows partial coverage, stale data, and unavailable signals clearly.'],
          ]
            .map(
              ([title, body]) => `
                <article class="outer-info-card">
                  <div class="outer-card-label">${escapeText(title)}</div>
                  <p>${escapeText(body)}</p>
                </article>
              `,
            )
            .join('')}
        </section>

        <section class="outer-action-panel outer-action-panel--support">
          <div>
            <div class="outer-card-label">Direct support</div>
            <h2>Keep ViewLoom online and improving.</h2>
            <p>The support link opens a public Stripe Payment Link in a new tab. No Stripe API keys are used in the frontend.</p>
          </div>
          <div class="outer-action-panel__buttons">
            <a class="button button--primary outer-support-primary" href="${supportPaymentUrl}" target="_blank" rel="noopener noreferrer">♡ Support ViewLoom</a>
            <a class="button button--secondary" href="${githubUrl}" target="_blank" rel="noopener noreferrer">Open GitHub</a>
          </div>
        </section>

        <section class="outer-note-card">
          <div class="outer-card-label">Note</div>
          <p>Support is optional. GitHub remains the technical reference point. Provider-specific data quality remains in each provider Data Status page.</p>
        </section>

        ${renderOuterFooter(true)}
      </main>
    </div>
  `
}

function renderOuterFooter(includeDataStatus: boolean): string {
  return `
    <footer class="landing-footer outer-footer">
      <a href="/about/">About</a>
      <a class="support-link" href="/support/">♡ Support</a>
      <a href="${escapeAttr(contactFormUrl)}" target="_blank" rel="noreferrer">Contact</a>
      <a href="${githubUrl}" target="_blank" rel="noreferrer">GitHub</a>
      ${
        includeDataStatus
          ? '<a href="/twitch/status/">Twitch Status</a><a href="/kick/status/">Kick Status</a>'
          : ''
      }
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
