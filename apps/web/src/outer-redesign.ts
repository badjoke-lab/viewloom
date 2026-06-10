import './outer-mock.css'

const CONTACT_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSdhreuxEz7w0eSjslTyVLL-axV6IJdTp5RU5VXCM3ApIz35-Q/viewform?usp=dialog'
const SUPPORT_URL = 'https://buy.stripe.com/6oUcMYeRh0Na2oX3cDcIE03'
const GITHUB_URL = 'https://github.com/badjoke-lab/viewloom'

const page = document.body.dataset.page
if (page === 'about' || page === 'support') mount(page)

function mount(current: 'about' | 'support'): void {
  const main = document.querySelector<HTMLElement>('main')
  if (!main) return
  main.className = 'page'
  main.innerHTML = current === 'about' ? renderAbout() : renderSupport()
}

function renderAbout(): string {
  return `
    <div class="breadcrumb">ViewLoom / About</div>
    <section class="page-head">
      <div>
        <div class="kicker">ABOUT THE OBSERVATORY</div>
        <h1>A narrow tool, built around four questions.</h1>
        <p class="lede">ViewLoom does not claim complete platform coverage. It records an observed field, marks limitations, and gives each kind of movement its own view.</p>
      </div>
      <div class="head-facts">
        <div class="fact"><small>Now</small><strong>Heatmap</strong></div>
        <div class="fact"><small>Today</small><strong>Day Flow</strong></div>
        <div class="fact"><small>Rivalry</small><strong>Battle Lines</strong></div>
        <div class="fact"><small>Trends</small><strong>History</strong></div>
      </div>
    </section>

    <article class="prose">
      <h2>Why the views stay separate</h2>
      <p>A current snapshot and a thirty-day trend do not answer the same question. ViewLoom keeps them apart so scale, share, rivalry, and history are not collapsed into one generic dashboard.</p>

      <h2>What the numbers mean</h2>
      <p>Viewer counts are public observed values collected on a schedule. Viewer-minutes are derived from repeated snapshots and sample intervals. They are not official platform analytics and should not be read as exact creator revenue or unique viewers.</p>

      <h2>Coverage and missing data</h2>
      <p>Each provider has its own observed set, collection behavior, and limitations. A fresh empty result is different from a collector failure. Partial, stale, demo, and missing states are shown explicitly.</p>

      <h2>Independence</h2>
      <p>ViewLoom is an independent, unofficial project. It is not affiliated with, endorsed by, or operated by Twitch or Kick.</p>

      <div class="rule-title"><h2>Inspect the project</h2><span>Public routes</span></div>
      <div class="link-row">
        <a class="button" href="/twitch/status/">Twitch Status</a>
        <a class="button button--secondary" href="/kick/status/">Kick Status</a>
        <a class="button button--secondary" href="${GITHUB_URL}" target="_blank" rel="noreferrer">GitHub</a>
        <a class="button button--secondary" href="${CONTACT_URL}" target="_blank" rel="noreferrer">Contact</a>
      </div>
    </article>
  `
}

function renderSupport(): string {
  return `
    <div class="breadcrumb">ViewLoom / Support</div>
    <section class="page-head">
      <div>
        <div class="kicker">SUPPORT VIEWLOOM</div>
        <h1>Keep the observation running.</h1>
        <p class="lede">Support helps maintain collection, storage, status checks, and public access to ViewLoom. It does not purchase rankings or influence what appears in the data.</p>
      </div>
      <div class="head-facts">
        <div class="fact"><small>Access</small><strong>Public</strong></div>
        <div class="fact"><small>Payment</small><strong>One-time</strong></div>
        <div class="fact"><small>Editorial influence</small><strong>None</strong></div>
        <div class="fact"><small>Account</small><strong>Not required</strong></div>
      </div>
    </section>

    <div class="support-options">
      <section class="support-option">
        <div class="kicker">One-time support</div>
        <h2>Support the project</h2>
        <p>Contribute through the official ViewLoom payment page. No account is created and no product tier is unlocked.</p>
        <p><a class="button" href="${SUPPORT_URL}" target="_blank" rel="noopener noreferrer">Open secure payment</a></p>
      </section>
      <section class="support-option">
        <div class="kicker">What support maintains</div>
        <h2>Collection and public access</h2>
        <p>Scheduled data collection, Cloudflare storage, status monitoring, documentation, and continued work on the public interface.</p>
        <table class="metric-ledger">
          <tbody>
            <tr><td>Data collection</td><td class="num">Ongoing</td></tr>
            <tr><td>Public site</td><td class="num">No paywall</td></tr>
            <tr><td>Ranking influence</td><td class="num">None</td></tr>
          </tbody>
        </table>
      </section>
    </div>

    <div class="rule-title"><h2>Before supporting</h2><span>Payment and project limits</span></div>
    <div class="prose">
      <p>Support is voluntary and does not purchase a service contract, creator listing, ranking placement, data correction, or preferential coverage.</p>
      <div class="notice">The payment link opens Stripe in a new tab. ViewLoom does not store Stripe secret keys in the browser.</div>
      <div class="link-row">
        <a class="button button--secondary" href="${CONTACT_URL}" target="_blank" rel="noreferrer">Contact</a>
        <a class="button button--secondary" href="${GITHUB_URL}" target="_blank" rel="noreferrer">GitHub</a>
        <a class="button button--secondary" href="/twitch/status/">Twitch Status</a>
        <a class="button button--secondary" href="/kick/status/">Kick Status</a>
      </div>
    </div>
  `
}
