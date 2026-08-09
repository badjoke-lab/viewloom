import './day-flow-category-preview-entry'

// The hidden preview is inserted before the shared controller hydrates. On a
// narrow flex toolbar the preview item must not be allowed to shrink to zero:
// the control remains hidden unless categoryPreview=1, so this only affects the
// explicitly gated Twitch candidate.
const categoryPreviewRoot = document.getElementById('dayflow-category-preview-controls')
if (categoryPreviewRoot) {
  categoryPreviewRoot.style.flex = '0 0 100%'
  categoryPreviewRoot.style.width = '100%'
  categoryPreviewRoot.style.minWidth = '100%'
  categoryPreviewRoot.style.maxWidth = '100%'
  categoryPreviewRoot.style.boxSizing = 'border-box'
  categoryPreviewRoot.style.alignSelf = 'stretch'
}

// Keep the existing Day Flow shell category-agnostic while guaranteeing that
// the Twitch-only hidden preview can install its URL/fetch boundary before the
// shell performs the first hydration request.
void import('./day-flow-current-shell-entry')
