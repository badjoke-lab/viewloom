export type LandingNavItem = {
  label: string
  href: string
  current?: boolean
  support?: boolean
}

export function renderLandingFooter(): string {
  return `
    <footer class="landing-footer">
      <a href="/about/">About</a>
      <a class="support-link" href="/support/">♡ Support</a>
      <a href="/contact/">Contact</a>
    </footer>
  `
}
