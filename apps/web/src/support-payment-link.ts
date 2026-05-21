const stripeSupportPath = ['6oUcMYeRh0Na2oX3cDcIE03'].join('')
const supportPaymentUrl = `https://buy.stripe.com/${stripeSupportPath}`
const githubUrl = 'https://github.com/badjoke-lab/viewloom'

if (document.body.dataset.page === 'support') {
  hydrateSupportPaymentLink()
}

function hydrateSupportPaymentLink(): void {
  const heroActions = document.querySelector<HTMLElement>('.outer-hero .hero-actions')
  const primaryAction = heroActions?.querySelector<HTMLAnchorElement>('.button--primary')
  const secondaryAction = heroActions?.querySelector<HTMLAnchorElement>('.button--secondary')

  if (primaryAction) {
    primaryAction.textContent = 'Support ViewLoom'
    primaryAction.href = supportPaymentUrl
    primaryAction.target = '_blank'
    primaryAction.rel = 'noopener noreferrer'
  }

  if (secondaryAction) {
    secondaryAction.textContent = 'Open GitHub'
    secondaryAction.href = githubUrl
    secondaryAction.target = '_blank'
    secondaryAction.rel = 'noopener noreferrer'
  }

  const stage = document.querySelector<HTMLElement>('.outer-stage')
  if (stage) {
    stage.querySelector('h2')?.replaceChildren('Support ViewLoom directly')
    stage.querySelector('p')?.replaceChildren(
      'Use the Stripe support link for optional one-time support. The link is public and no Stripe API keys are used in the frontend.',
    )

    const stageActions = stage.querySelector<HTMLElement>('.hero-actions')
    if (stageActions) {
      stageActions.insertAdjacentHTML(
        'afterbegin',
        `<a class="button button--primary" href="${supportPaymentUrl}" target="_blank" rel="noopener noreferrer">Support ViewLoom</a>`,
      )
    }
  }

  const firstNote = document.querySelector<HTMLElement>('.outer-notes .rail-card p')
  if (firstNote) {
    firstNote.textContent = 'Support is optional and opens a Stripe Payment Link in a new tab.'
  }
}
