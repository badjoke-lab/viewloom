import './day-flow-category-preview-entry'

// The accepted Twitch-only public Category boundary installs before the shared
// Day Flow controller. U10G #759 keeps this adapter explicitly provider-scoped:
// one controller/request owner remains below it, while Kick never loads it.
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

// Keep one shared Day Flow controller owner. The public Twitch category boundary
// may coordinate only its same-origin Day Flow request/URL state before hydration;
// the existing shared controller still owns feature state, rendering, and fetch.
void import('./day-flow-current-shell-entry')
