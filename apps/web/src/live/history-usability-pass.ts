import '../history-clarity-hotfix.css'
import '../history-card-visibility.css'
import '../history-view-shell.css'
import '../history-overview.css'
import './history-clarity-hotfix'
import './history-clarity-compat'
import './history-usability'
import './history-number-format'
import './history-view-shell'
import './history-overview'
import './history-default-day'
import '../history-archives.css'
import './history-archives'

// Load the data shell only after every History enhancer has installed its
// fetch capture and DOM contract. Separate module tags can otherwise race
// when this dependency graph grows, leaving secondary surfaces without the
// first History response.
void import('./history-current-shell-entry')

export {}
