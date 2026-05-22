const stripeSupportPath = ['6oUcMYeRh0Na2oX3cDcIE03'].join('')
const supportPaymentUrl = `https://buy.stripe.com/${stripeSupportPath}`
const githubUrl = 'https://github.com/badjoke-lab/viewloom'

if (document.body.dataset.page === 'support') {
  hydrateSupportPaymentLink()
}

function hydrateSupportPaymentLink(): void {
  removeHeroActions()
  patchSupportNotePanel()
  patchSupportCards()
  patchSupportStage()
  patchSupportNotes()
  ensureSupportLayoutStyles()
}

function removeHeroActions(): void {
  document.querySelector<HTMLElement>('.outer-hero .hero-actions')?.remove()
}

function patchSupportNotePanel(): void {
  const panel = document.querySelector<HTMLElement>('.outer-hero .status-panel')
  if (!panel) return

  panel.querySelector<HTMLElement>('.status-panel__label')?.replaceChildren('Support note')
  panel.querySelector<HTMLElement>('.status-panel__title')?.replaceChildren('Optional support')
  panel.querySelector('p')?.replaceChildren(
    'Support is optional and shared across ViewLoom. It does not unlock a separate paid mode, subscription, or provider-specific feature.',
  )
}

function patchSupportCards(): void {
  const cardData = [
    {
      label: 'Operations',
      title: 'Collection and storage',
      body: 'Support can help cover scheduled collection, D1 storage, deployment checks, and future coverage improvements.',
    },
    {
      label: 'Maintenance',
      title: 'UI and data quality',
      body: 'Feature pages need ongoing maintenance as provider data quality, source modes, and coverage change.',
    },
    {
      label: 'Transparency',
      title: 'Status first',
      body: 'ViewLoom should surface partial coverage, stale data, fallback mode, and unavailable signals instead of hiding them.',
    },
  ]

  const grid = document.querySelector<HTMLElement>('.outer-grid')
  if (!grid) return

  grid.classList.add('support-card-grid')
  grid.innerHTML = cardData
    .map(
      (card) => `
        <article class="support-card support-card--clean">
          <div class="support-card__label">${card.label}</div>
          <h2>${card.title}</h2>
          <p>${card.body}</p>
        </article>
      `,
    )
    .join('')
}

function patchSupportStage(): void {
  const stage = document.querySelector<HTMLElement>('.outer-stage')
  if (!stage) return

  stage.classList.add('outer-stage--support')
  stage.querySelector<HTMLElement>('.chart-stage__label')?.replaceChildren('Support')
  stage.querySelector('h2')?.replaceChildren('Support ViewLoom directly')
  stage.querySelector('p')?.replaceChildren(
    'Use the Stripe support link for optional one-time support. The link is public and no Stripe API keys are used in the frontend.',
  )

  const stageActions = stage.querySelector<HTMLElement>('.hero-actions')
  if (!stageActions) return

  stageActions.replaceChildren()
  stageActions.insertAdjacentHTML(
    'beforeend',
    `<a class="button button--primary" href="${supportPaymentUrl}" target="_blank" rel="noopener noreferrer">Support ViewLoom</a>`,
  )
  stageActions.insertAdjacentHTML(
    'beforeend',
    `<a class="button button--secondary" href="${githubUrl}" target="_blank" rel="noopener noreferrer">Open GitHub</a>`,
  )
}

function patchSupportNotes(): void {
  const notes = Array.from(document.querySelectorAll<HTMLElement>('.outer-notes .rail-card p'))
  const text = [
    'Support is optional and opens a Stripe Payment Link in a new tab.',
    'GitHub remains the technical reference point for ViewLoom.',
    'Provider-specific data quality remains in each provider Data Status page.',
  ]

  notes.forEach((note, index) => {
    note.textContent = text[index] ?? note.textContent
  })
}

function ensureSupportLayoutStyles(): void {
  if (document.querySelector('#vl-support-layout-style')) return

  const style = document.createElement('style')
  style.id = 'vl-support-layout-style'
  style.textContent = `
    body[data-page="support"] .outer-hero .hero-copy { max-width: 68ch; }
    body[data-page="support"] .outer-grid.support-card-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 18px;
      margin-top: 22px;
    }
    body[data-page="support"] .support-card--clean {
      min-height: 210px;
    }
    body[data-page="support"] .outer-stage--support {
      margin-top: 22px;
    }
    body[data-page="support"] .outer-stage--support .hero-actions {
      gap: 12px;
    }
    body[data-page="support"] .outer-notes {
      margin-top: 0;
    }
    body[data-page="support"] .vl-shared-footer {
      margin-top: 36px;
    }
    @media (max-width: 1080px) {
      body[data-page="support"] .outer-grid.support-card-grid {
        grid-template-columns: 1fr;
      }
    }
  `
  document.head.append(style)
}
