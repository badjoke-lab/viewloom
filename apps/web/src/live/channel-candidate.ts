import '../channel-candidate-core.css'
import '../channel-candidate-responsive.css'
import '../channel-candidate-fixes.css'
import '../channel-candidate-focus.css'

const focusSelector = '.channel-profile-page a, .channel-profile-page button, .channel-report-preview'

document.addEventListener('focusin', (event) => {
  const target = event.target instanceof HTMLElement ? event.target.closest<HTMLElement>(focusSelector) : null
  if (!target) return
  target.style.setProperty('outline-width', '3px', 'important')
  target.style.setProperty('outline-style', 'solid', 'important')
  target.style.setProperty('outline-color', 'var(--accent)', 'important')
  target.style.setProperty('outline-offset', '2px', 'important')
})

document.addEventListener('focusout', (event) => {
  const target = event.target instanceof HTMLElement ? event.target.closest<HTMLElement>(focusSelector) : null
  if (!target) return
  target.style.removeProperty('outline-width')
  target.style.removeProperty('outline-style')
  target.style.removeProperty('outline-color')
  target.style.removeProperty('outline-offset')
})
