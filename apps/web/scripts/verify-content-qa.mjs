import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const failures = []

function read(path) {
  return readFileSync(join(root, path), 'utf8')
}

function requireFile(path) {
  if (!existsSync(join(root, path))) failures.push(`${path}: missing required Content QA file`)
}

function requireFragment(path, source, fragment) {
  if (!source.includes(fragment)) failures.push(`${path}: missing required Content QA fragment: ${fragment}`)
}

function forbidPattern(path, source, label, pattern) {
  if (pattern.test(source)) failures.push(`${path}: contains forbidden Content regression: ${label}`)
}

const paths = {
  about: 'about/index.html',
  support: 'support/index.html',
  contact: 'contact/index.html',
  terms: 'terms/index.html',
  privacy: 'privacy/index.html',
  refund: 'refund-policy/index.html',
  commercial: 'commercial-disclosure/index.html',
  contract: 'docs/content-qa-contract.md',
}
const contactUrl = 'https://docs.google.com/forms/d/e/1FAIpQLSdhreuxEz7w0eSjslTyVLL-axV6IJdTp5RU5VXCM3ApIz35-Q/viewform?usp=dialog'
const stripeUrl = 'https://buy.stripe.com/6oUcMYeRh0Na2oX3cDcIE03'
const legalPaths = [paths.contact, paths.terms, paths.privacy, paths.refund, paths.commercial]

for (const path of Object.values(paths)) requireFile(path)

for (const path of [paths.about, paths.support, ...legalPaths]) {
  if (!existsSync(join(root, path))) continue
  const source = read(path)
  requireFragment(path, source, 'data-provider="portal"')
  requireFragment(path, source, 'class="masthead"')
  requireFragment(path, source, 'class="global-nav"')
  requireFragment(path, source, '/src/static-page.ts')
  requireFragment(path, source, '/src/analytics.ts')
  requireFragment(path, source, '/contact/')
  forbidPattern(path, source, 'provider status runtime entry', /\/src\/mock-site\.ts/)
  forbidPattern(path, source, 'mock or placeholder copy', /mock page|placeholder only|lorem ipsum|todo legal/i)
}

if (existsSync(join(root, paths.about))) {
  const source = read(paths.about)
  requireFragment(paths.about, source, 'class="prose"')
  requireFragment(paths.about, source, 'Why the views stay separate')
  requireFragment(paths.about, source, 'What the numbers mean')
  requireFragment(paths.about, source, 'Coverage and missing data')
  requireFragment(paths.about, source, 'ViewLoom is an independent, unofficial project')
  requireFragment(paths.about, source, 'https://github.com/badjoke-lab/viewloom')
}

if (existsSync(join(root, paths.support))) {
  const source = read(paths.support)
  requireFragment(paths.support, source, 'class="support-options"')
  requireFragment(paths.support, source, stripeUrl)
  requireFragment(paths.support, source, 'No ViewLoom account is created and no product tier is unlocked')
  requireFragment(paths.support, source, 'Ranking influence')
  requireFragment(paths.support, source, 'None')
  requireFragment(paths.support, source, 'does not purchase a service contract')
  requireFragment(paths.support, source, '/refund-policy/')
  requireFragment(paths.support, source, '/commercial-disclosure/')
  requireFragment(paths.support, source, 'https://github.com/badjoke-lab/viewloom')
  forbidPattern(paths.support, source, 'paid ranking implication', /buy ranking|priority coverage|guaranteed listing/i)
}

if (existsSync(join(root, paths.contact))) {
  const source = read(paths.contact)
  requireFragment(paths.contact, source, contactUrl)
  requireFragment(paths.contact, source, 'ViewLoom is not Twitch or Kick support')
  requireFragment(paths.contact, source, 'Never send complete card numbers')
  requireFragment(paths.contact, source, 'Operator disclosure requests')
}

if (existsSync(join(root, paths.terms))) {
  const source = read(paths.terms)
  requireFragment(paths.terms, source, 'independent, unofficial project')
  requireFragment(paths.terms, source, 'does not promise complete provider-wide coverage')
  requireFragment(paths.terms, source, 'No professional advice')
  requireFragment(paths.terms, source, '/refund-policy/')
}

if (existsSync(join(root, paths.privacy))) {
  const source = read(paths.privacy)
  requireFragment(paths.privacy, source, 'Google Analytics 4')
  requireFragment(paths.privacy, source, 'G-YHX7HS1VBK')
  requireFragment(paths.privacy, source, 'browser-local storage')
  requireFragment(paths.privacy, source, 'Google-hosted form')
  requireFragment(paths.privacy, source, 'Stripe-hosted payment page')
  requireFragment(paths.privacy, source, 'does not currently provide a user registration or login system')
}

if (existsSync(join(root, paths.refund))) {
  const source = read(paths.refund)
  requireFragment(paths.refund, source, 'voluntary one-time payment')
  requireFragment(paths.refund, source, 'completed support payments are generally final')
  requireFragment(paths.refund, source, 'does not limit rights or remedies that cannot be excluded under applicable law')
  requireFragment(paths.refund, source, 'Never send complete card numbers')
}

if (existsSync(join(root, paths.commercial))) {
  const source = read(paths.commercial)
  requireFragment(paths.commercial, source, '特定商取引法に基づく表記')
  requireFragment(paths.commercial, source, 'provided without delay upon request before the transaction')
  requireFragment(paths.commercial, source, 'https://www.no-trouble.caa.go.jp/what/mailorder/')
  requireFragment(paths.commercial, source, '/support/')
  requireFragment(paths.commercial, source, '/refund-policy/')
  requireFragment(paths.commercial, source, 'Support does not affect observations')
}

if (existsSync(join(root, paths.contract))) {
  const source = read(paths.contract)
  requireFragment(paths.contract, source, 'About and Support QA Contract')
  requireFragment(paths.contract, source, 'does not influence rankings or coverage')
}

if (failures.length > 0) {
  console.error('ViewLoom Content QA verification failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('ViewLoom Content QA verification passed for About, Support, and five R12A legal surfaces.')
