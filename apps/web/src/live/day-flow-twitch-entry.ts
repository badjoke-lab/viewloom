import './day-flow-category-preview-entry'

// Twitch Day Flow category controls install before the shared controller hydrates.
// On narrow flex toolbars the category item must keep a real in-viewport box.
const categoryRoot = document.getElementById('dayflow-category-preview-controls')
if (categoryRoot) {
  categoryRoot.style.flex = '0 0 100%'
  categoryRoot.style.width = '100%'
  categoryRoot.style.minWidth = '100%'
  categoryRoot.style.maxWidth = '100%'
  categoryRoot.style.boxSizing = 'border-box'
  categoryRoot.style.alignSelf = 'stretch'
}

// Keep one shared Day Flow controller owner. The Twitch-only category layer installs
// its URL/fetch boundary first, then the existing controller performs hydration.
void import('./day-flow-current-shell-entry')
