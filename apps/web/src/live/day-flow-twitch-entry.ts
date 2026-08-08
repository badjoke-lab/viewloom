import './day-flow-category-preview-entry'

// Keep the existing Day Flow shell category-agnostic while guaranteeing that
// the Twitch-only hidden preview can install its URL/fetch boundary before the
// shell performs the first hydration request.
void import('./day-flow-current-shell-entry')
