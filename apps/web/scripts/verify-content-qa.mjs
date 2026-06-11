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

const aboutPath = 'about/index.html'
const supportPath = 'support/index.html'
const contractPath = 'docs/content-qa-contract.md'
const contactUrl = 'https://docs.google.com/forms/d/e/1FAIpQLSdhreuxEz7w0eSjslTyVLL-axV6IJdTp5RU5VXCM3ApIz35-Q/viewform?usp=dialog'
const stripeUrl = 'https://buy.stripe.com/6oUcMYeRh0Na2oX3cDcIE03'

for (const path of [aboutPath, supportPath, contractPath]) requireFile(path)

if (existsSync(join(root, aboutPath))) {
  const source = read(aboutPath)
  requireFragment(aboutPath, source, 'data-provider="portal"')
  requireFragment(aboutPath, source, 'class="masthead"')
  requireFragment(aboutPath, source, 'class="global-nav"')
  requireFragment(aboutPath, source, 'class="prose"')
  requireFragment(aboutPath, source, 'Why the views stay separate')
  requireFragment(aboutPath, source, 'What the numbers mean')
  requireFragment(aboutPath, source, 'Coverage and missing data')
  requireFragment(aboutPath, source, 'ViewLoom is an independent, unofficial project')
  requireFragment(aboutPath, source, contactUrl)
  requireFragment(aboutPath, source, 'https://github.com/badjoke-lab/viewloom')
  requireFragment(aboutPath, source, '/src/analytics.ts')
  forbidPattern(aboutPath, source, 'mock content label', /mock page|placeholder only|lorem ipsum/i)
}

if (existsSync(join(root, supportPath))) {
  const source = read(supportPath)
  requireFragment(supportPath, source, 'data-provider="portal"')
  requireFragment(supportPath, source, 'class="masthead"')
  requireFragment(supportPath, source, 'class="global-nav"')
  requireFragment(supportPath, source, 'class="support-options"')
  requireFragment(supportPath, source, stripeUrl)
  requireFragment(supportPath, source, 'No account is created and no product tier is unlocked')
  requireFragment(supportPath, source, 'Ranking influence')
  requireFragment(supportPath, source, 'None')
  requireFragment(supportPath, source, 'does not purchase a service contract')
  requireFragment(supportPath, source, contactUrl)
  requireFragment(supportPath, source, 'https://github.com/badjoke-lab/viewloom')
  requireFragment(supportPath, source, '/src/analytics.ts')
  forbidPattern(supportPath, source, 'paid ranking implication', /buy ranking|priority coverage|guaranteed listing/i)
}

if (existsSync(join(root, contractPath))) {
  const source = read(contractPath)
  requireFragment(contractPath, source, 'About and Support QA Contract')
  requireFragment(contractPath, source, 'does not influence rankings or coverage')
}

if (failures.length > 0) {
  console.error('ViewLoom Content QA verification failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('ViewLoom Content QA verification passed for About and Support pages.')
