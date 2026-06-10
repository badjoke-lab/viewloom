import './outer-redesign.css'

const CONTACT_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSdhreuxEz7w0eSjslTyVLL-axV6IJdTp5RU5VXCM3ApIz35-Q/viewform?usp=dialog'
const SUPPORT_URL = 'https://buy.stripe.com/6oUcMYeRh0Na2oX3cDcIE03'
const GITHUB_URL = 'https://github.com/badjoke-lab/viewloom'

const page = document.body.dataset.page
if (page === 'about' || page === 'support') {
  mount(page)
}

function mount(current: 'about' | 'support'): void {
  const main = document.querySelector<HTMLElement>('main')
  if (!main) return

  main.className = 'vl-outer-main'
  main.innerHTML = current === 'about' ? renderAbout() : renderSupport()
}

function renderAbout(): string {
  return `
    <section class="vl-outer-head">
      <div>
        <div class="vl-outer-kicker">ViewLoom · About</div>
        <h1>An observatory for live-stream movement.</h1>
        <p>
          ViewLoom separates Twitch and Kick, then provides fixed views for the current field, daily audience movement, rivalry, observed history, and data status.
        </p>
      </div>
      <aside class="vl-outer-summary">
        <strong>Independent and unofficial</strong>
        <p>ViewLoom is not affiliated with Twitch, Kick, or their operators. Charts reflect collected observations and may be delayed, partial, stale, empty, or unavailable.</p>
        <div class="vl-outer-actions">
          <a class="vl-outer-button" href="/twitch/">Twitch data</a>
          <a class="vl-outer-button" href="/kick/">Kick data</a>
        </div>
      </aside>
    </section>

    ${sectionHead('How the site is organized', 'Platform first, then question')}
    <section class="vl-outer-ledger">
      ${ledgerRow('Platform separation', 'Twitch and Kick stay separate', 'Provider totals, source modes, collection limits, and status are not merged into one combined dashboard.')}
      ${ledgerRow('Now', 'Heatmap', 'Shows the latest observed field. Tile size represents viewers, while momentum and available activity signals remain separate.')}
      ${ledgerRow('Today', 'Day Flow', 'Shows how audience volume and share move through the observed day, with selected time and stream detail.')}
      ${ledgerRow('Rivalry', 'Battle Lines', 'Shows primary battles, gaps, reversals, selected time, and contextual competitors without treating missing values as measured data.')}
      ${ledgerRow('Trends', 'History & Trends', 'Shows observed days, viewer-minutes, peaks, top streamers, rankings, and coverage over longer periods.')}
      ${ledgerRow('Truth layer', 'Data Status', 'Shows collection state, freshness, source mode, coverage, pipeline notes, and known limitations for each provider.')}
    </section>

    ${sectionHead('Reading rules', 'What the charts do and do not claim')}
    <section class="vl-outer-grid">
      ${cell('Observed, not official', 'Public observation data', 'ViewLoom displays data it can collect and normalize. It does not claim to be an official Twitch or Kick reporting product.')}
      ${cell('State remains visible', 'Freshness is part of the product', 'Fresh, partial, stale, empty, demo, error, and unconfigured states are kept distinct instead of being hidden behind the interface.')}
      ${cell('No silent interpolation', 'Missing is not measured', 'Where data is missing, offline, not observed, or unavailable, charts should preserve that distinction rather than invent continuity.')}
      ${cell('Provider-specific limits', 'Parity does not mean identical data', 'Twitch and Kick share page structure and reading grammar, but their source coverage and collection behavior can differ.')}
    </section>

    ${sectionHead('Open the project', 'Public routes and technical reference')}
    <section class="vl-support-panel">
      <h2>Inspect data status before relying on a chart.</h2>
      <p>Use the provider Status pages for current source mode, freshness, coverage, limitations, and known pipeline issues.</p>
      <div class="vl-outer-actions">
        <a class="vl-outer-button vl-outer-button--primary" href="/twitch/status/">Twitch Status</a>
        <a class="vl-outer-button" href="/kick/status/">Kick Status</a>
        <a class="vl-outer-button" href="${GITHUB_URL}" target="_blank" rel="noreferrer">GitHub</a>
        <a class="vl-outer-button" href="${CONTACT_URL}" target="_blank" rel="noreferrer">Contact</a>
      </div>
    </section>

    <p class="vl-outer-note">
      <strong>Disclaimer:</strong> Twitch and Kick are trademarks of their respective owners. ViewLoom is an independent, unofficial observation project.
    </p>
  `
}

function renderSupport(): string {
  return `
    <section class="vl-outer-head">
      <div>
        <div class="vl-outer-kicker">ViewLoom · Support</div>
        <h1>Help keep observation running.</h1>
        <p>
          Optional support helps maintain collection, storage, deployment checks, interface work, and honest data-status reporting. It does not unlock a paid tier or private dashboard.
        </p>
        <div class="vl-outer-actions">
          <a class="vl-outer-button vl-outer-button--primary" href="${SUPPORT_URL}" target="_blank" rel="noopener noreferrer">♡ Support ViewLoom</a>
          <a class="vl-outer-button" href="${GITHUB_URL}" target="_blank" rel="noreferrer">Open GitHub</a>
        </div>
      </div>
      <aside class="vl-outer-summary">
        <strong>Optional one-time support</strong>
        <p>The support button opens a public Stripe Payment Link in a new tab. Support is not a subscription, purchase of data, or access gate.</p>
      </aside>
    </section>

    ${sectionHead('What support helps with', 'Operating and improving ViewLoom')}
    <section class="vl-outer-grid">
      ${cell('Collection & storage', 'Keep observations running', 'Scheduled collection, snapshot storage, rollups, retention, and checks all require continued maintenance.')}
      ${cell('Interface & data quality', 'Make difficult data readable', 'Support helps improve Heatmap, Day Flow, Battle Lines, History, mobile layouts, empty states, and bug fixes.')}
      ${cell('Status transparency', 'Show limits clearly', 'Missing data, stale collection, source limitations, and provider-specific issues should remain visible and understandable.')}
      ${cell('Provider maintenance', 'Keep Twitch and Kick separate', 'Each provider needs its own source handling, recovery work, and validation without mixing totals or limitations.')}
    </section>

    ${sectionHead('What support does not mean', 'No hidden commercial layer')}
    <section class="vl-outer-ledger">
      ${ledgerRow('No paid gate', 'Core observation pages remain open', 'Support does not unlock a paid-only dashboard, restricted chart, or private data mode.')}
      ${ledgerRow('No subscription', 'A one-time Stripe Payment Link', 'There is no recurring billing agreement created by the support page itself.')}
      ${ledgerRow('No official affiliation', 'Independent project', 'Supporting ViewLoom does not create any relationship with Twitch, Kick, or their operators.')}
      ${ledgerRow('No hidden data sale', 'Support is not a data purchase', 'Provider Status pages remain the place to inspect freshness, source mode, coverage, and known limitations.')}
    </section>

    <section class="vl-support-panel">
      <h2>Support is not only money.</h2>
      <p>Issue reports, reproducible screenshots, checking Data Status before sharing charts, and technical feedback are also useful.</p>
      <div class="vl-outer-actions">
        <a class="vl-outer-button" href="${CONTACT_URL}" target="_blank" rel="noreferrer">Contact</a>
        <a class="vl-outer-button" href="${GITHUB_URL}" target="_blank" rel="noreferrer">GitHub</a>
        <a class="vl-outer-button" href="/twitch/status/">Twitch Status</a>
        <a class="vl-outer-button" href="/kick/status/">Kick Status</a>
      </div>
    </section>

    <p class="vl-outer-note">
      <strong>Payment note:</strong> The public Stripe Payment Link is used only for optional support. No Stripe secret key is stored in the frontend.
    </p>
  `
}

function sectionHead(title: string, meta: string): string {
  return `<div class="vl-outer-section-head"><h2>${escapeHtml(title)}</h2><span>${escapeHtml(meta)}</span></div>`
}

function ledgerRow(label: string, title: string, body: string): string {
  return `
    <article class="vl-outer-row">
      <div class="vl-outer-row__label">${escapeHtml(label)}</div>
      <div><h3>${escapeHtml(title)}</h3><p>${escapeHtml(body)}</p></div>
    </article>
  `
}

function cell(label: string, title: string, body: string): string {
  return `<article class="vl-outer-cell"><small>${escapeHtml(label)}</small><h3>${escapeHtml(title)}</h3><p>${escapeHtml(body)}</p></article>`
}

function escapeHtml(value: string): string {
  const element = document.createElement('span')
  element.textContent = value
  return element.innerHTML
}
