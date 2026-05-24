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
              ViewLoom is an unofficial observation surface for live-stream activity. It keeps Twitch and Kick separated, then reads each provider through fixed views.
            </p>
          </div>

          <aside class="outer-side-panel-v2">
            <div class="outer-kicker">Page role</div>
            <h2>Shared context page</h2>
            <p>About explains the ViewLoom structure. Provider-specific freshness and limitations stay in each Data Status page.</p>
          </aside>
        </section>

        <section class="outer-grid-v2 outer-grid-v2--four">
          ${[
            ['Platform-first', 'Twitch and Kick stay separated as independent observation surfaces.'],
            ['Fixed views', 'Heatmap is Now, Day Flow is Today, Battle Lines is Rivalry, and History is Trends.'],
            ['Honest status', 'Coverage can be delayed, partial, sampled, stale, or unavailable depending on source state.'],
            ['Shared routes', 'About, Support, Contact, and GitHub are common ViewLoom routes.'],
          ]
            .map(([title, body]) => renderInfoCard(title, body))
            .join('')}
        </section>

        <section class="outer-action-v2">
          <div>
            <div class="outer-kicker">Start reading</div>
            <h2>Choose a provider first.</h2>
            <p>Use Portal as the entry point, then open Twitch or Kick for the actual Now / Today / Rivalry / Trends views.</p>
          </div>
          <div class="outer-actions-v2">
            <a class="button button--primary button--twitch" href="/twitch/">Open Twitch data</a>
            <a class="button button--primary button--kick" href="/kick/">Open Kick data</a>
          </div>
        </section>

        <section class="outer-note-v2">
          <div class="outer-kicker">Note</div>
          <p>ViewLoom is independent and is not affiliated with Twitch or Kick. Contact opens a Google Form. Provider implementation details belong to Twitch Data Status and Kick Data Status.</p>
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
              Support helps keep ViewLoom running as a lightweight independent observation project. It is optional, shared across the whole site, and does not unlock a paid gate.
            </p>
            <div class="outer-actions-v2 outer-actions-v2--hero">
              <a class="button button--primary outer-support-button" href="${supportPaymentUrl}" target="_blank" rel="noopener noreferrer">♡ Support ViewLoom</a>
              <a class="button button--secondary" href="${githubUrl}" target="_blank" rel="noopener noreferrer">Open GitHub</a>
            </div>
          </div>

          <aside class="outer-side-panel-v2">
            <div class="outer-kicker">Support note</div>
            <h2>Optional support</h2>
            <p>The data views remain open. Support helps with collection, storage, deployment checks, maintenance, and data-quality work.</p>
          </aside>
        </section>

        <section class="outer-grid-v2 outer-grid-v2--three">
          ${[
            ['Operations', 'Collection jobs, storage, deployment checks, and future coverage improvements.'],
            ['Maintenance', 'UI fixes, feature updates, source-mode changes, and provider-specific edge cases.'],
            ['Transparency', 'Status-first design that shows partial coverage, stale data, and unavailable signals clearly.'],
          ]
            .map(([title, body]) => renderInfoCard(title, body))
            .join('')}
        </section>

        <section class="outer-note-v2 outer-note-v2--support">
          <div class="outer-kicker">Note</div>
          <p>Support opens a public Stripe Payment Link in a new tab. No Stripe API keys are used in the frontend. GitHub remains the technical reference point.</p>
        </section>

        ${renderFooter()}
      </main>
    </div>
  `
}

function renderInfoCard(title: string, body: string): string {
  return `
    <article class="outer-info-v2">
      <div class="outer-kicker">${escapeText(title)}</div>
      <p>${escapeText(body)}</p>
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
