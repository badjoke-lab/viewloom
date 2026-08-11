import './day-flow-category-preview-entry'

// Kick Category remains a hidden candidate. The shared category boundary is inert
// unless categoryPreview=1 is present, so the normal Kick Day Flow route remains
// category-free and continues to use the existing shared controller unchanged.
const categoryRoot = document.getElementById('dayflow-category-preview-controls')
if (categoryRoot) {
  categoryRoot.style.flex = '0 0 100%'
  categoryRoot.style.width = '100%'
  categoryRoot.style.minWidth = '100%'
  categoryRoot.style.maxWidth = '100%'
  categoryRoot.style.boxSizing = 'border-box'
  categoryRoot.style.alignSelf = 'stretch'
}

void import('./day-flow-current-shell-entry')
