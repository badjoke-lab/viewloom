const root = document.querySelector<HTMLElement>('.history-page')
const skipLink = document.querySelector<HTMLAnchorElement>('[data-history-skip-link]')
const main = document.querySelector<HTMLElement>('#history-main')

if (root && skipLink && main) installResponsiveAccessibility(root, skipLink, main)

function installResponsiveAccessibility(page: HTMLElement, skip: HTMLAnchorElement, target: HTMLElement): void {
  page.dataset.historyP9h5Ready = 'true'
  page.dataset.historyAccessibilityOwner = 'p9h5'

  skip.addEventListener('click', (event) => {
    event.preventDefault()
    target.focus({ preventScroll: true })
    target.scrollIntoView({ block: 'start' })
  })
}

export {}
